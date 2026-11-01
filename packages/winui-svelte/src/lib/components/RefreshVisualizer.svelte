<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface RefreshVisualizerProps {
		/** RefreshVisualizer.Content — the indicator. Defaults to the refresh glyph. */
		content?: Snippet;
		/** RefreshVisualizer.State (RefreshVisualizerState). Read-only upstream; bindable here so a
		 *  caller can drive it, which is how the dev route reaches each state. */
		state?: 'idle' | 'peeking' | 'interacting' | 'pending' | 'refreshing';
		/** No WinUI member: ADR 0009 pairs bindable state with a change callback. */
		onStateChange?:
			((state: 'idle' | 'peeking' | 'interacting' | 'pending' | 'refreshing') => void) | undefined;
		/** RefreshVisualizer.Orientation (RefreshVisualizerOrientation). */
		orientation?:
			'auto' | 'normal' | 'rotate90DegreesCounterclockwise' | 'rotate270DegreesCounterclockwise';
		/** No WinUI member: the interaction ratio the container feeds in while a pull is in progress. */
		interactionRatio?: number;
		/** RefreshContainer.PullDirection, which the visualizer reads to choose its starting angle. */
		pullDirection?: 'leftToRight' | 'topToBottom' | 'rightToLeft' | 'bottomToTop';
		/** RefreshVisualizer.RefreshRequested. */
		onRefreshRequested?: (() => void) | undefined;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		/** The RefreshVisualizer root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// `RequestRefresh()` (`RefreshVisualizer.idl:55`) is absent. It is a method that puts the
	// control into `Refreshing` and raises `RefreshRequested`, and `state` is a bindable prop
	// here — ADR 0009's own rule about imperative members. A caller writes `state` and gets the
	// same two effects, and `RefreshContainer` is what drives it in practice.
	//
	// `InfoProvider` (`:64-65`) is absent with it. It is the private surface through which the
	// container hands the visualizer an `IRefreshInfoProvider` — an object publishing the
	// interaction ratio, the execution ratio and two events. This library publishes state rather
	// than objects: the ratio arrives as `interactionRatio`, the execution ratio is the constant
	// below, and the two events are the container's own gesture handling.
	//
	// `RefreshStateChanged` (`:62`) carries an old state and a new one. `onStateChange` carries
	// only the new one, which is what every other change callback in this library carries; the
	// old one is the value the caller already held.

	/** `MINIMUM_INDICATOR_OPACITY` — `RefreshVisualizer.cpp:14`. */
	const MINIMUM_INDICATOR_OPACITY = 0.4;

	/** `PARALLAX_POSITION_RATIO` — `RefreshVisualizer.cpp:20`. */
	const PARALLAX_POSITION_RATIO = 0.5;

	/**
	 * `m_executionRatio` (`RefreshVisualizer.h:91`), the fraction of the visualizer's own length a
	 * pull has to cover before the refresh is armed.
	 *
	 * Upstream reads it off the `IRefreshInfoProvider` and falls back to 1 when there is none
	 * (`RefreshVisualizer.cpp:146-154`); the provider this library has no equivalent of is the one
	 * `RefreshContainer` always installs, so 0.8 is the value this control ever sees.
	 */
	const EXECUTION_RATIO = 0.8;

	/** A quarter turn, in degrees — upstream's `M_PI_2` in `RotationAngle`'s radians. */
	const QUARTER_TURN = 90;
</script>

<script lang="ts">
	let {
		content,
		// Renamed locally: a binding called `state` in this scope turns every `$state(...)` below
		// into a store read of it. The prop keeps the name `RefreshVisualizer.State` has.
		state: currentState = $bindable('idle'),
		onStateChange,
		orientation = 'auto',
		interactionRatio = 0,
		pullDirection = 'topToBottom',
		onRefreshRequested,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: RefreshVisualizerProps = $props();

	let box = $state<HTMLDivElement | null>(null);
	/** `m_root.ActualHeight()` and `.ActualWidth()` (`RefreshVisualizer.cpp:302-306`, `:378`). */
	let rootHeight = $state(0);
	let rootWidth = $state(0);

	/** `IsPullDirectionVertical` (`RefreshVisualizer.cpp:594-597`). */
	const isVertical = $derived(pullDirection === 'topToBottom' || pullDirection === 'bottomToTop');
	/** `IsPullDirectionFar` (`:599-601`) — the two directions whose parallax runs backwards. */
	const isFar = $derived(pullDirection === 'bottomToTop' || pullDirection === 'rightToLeft');
	/** `rootSize` (`:378`): the root's height on a vertical pull, its width on a horizontal one. */
	const rootLength = $derived(isVertical ? rootHeight : rootWidth);

	/**
	 * `m_startingRotationAngle`, from `OnOrientationChangedImpl` (`:165-196`).
	 *
	 * The two explicit rotations are named the opposite way round from the sign they set:
	 * `Rotate270DegreesCounterclockwise` is `-M_PI_2` (`:187-189`) and
	 * `Rotate90DegreesCounterclockwise` is `+M_PI_2` (`:190-192`). Transcribed as the source has
	 * it rather than as the names read.
	 */
	const startingAngle = $derived.by(() => {
		switch (orientation) {
			case 'normal':
				return 0;
			case 'rotate270DegreesCounterclockwise':
				return -QUARTER_TURN;
			case 'rotate90DegreesCounterclockwise':
				return QUARTER_TURN;
			default:
				// Auto (`:169-183`) takes the angle from the pull direction instead.
				if (pullDirection === 'leftToRight') return -QUARTER_TURN;
				if (pullDirection === 'rightToLeft') return QUARTER_TURN;
				return 0;
		}
	});

	/**
	 * The rotation the indicator carries directly.
	 *
	 * `Interacting` runs the expression at `:335-338`:
	 * `startingRotationAngle + Pi * Clamp(ratio, 0, threshold) / threshold * 2`, so the glyph turns
	 * a **whole** circle over the pull and reaches it at a ratio of 0.8 rather than at 1. Every
	 * other state leaves the angle at the starting one; `Refreshing`'s continuous turn is a second
	 * rotation on the element inside this one, so that this one keeps expressing where it starts.
	 */
	const rotation = $derived(
		currentState === 'interacting'
			? startingAngle +
					360 * (Math.min(Math.max(interactionRatio, 0), EXECUTION_RATIO) / EXECUTION_RATIO)
			: startingAngle
	);

	/**
	 * `contentVisual.Opacity` per state (`UpdateContent`, `:267-313`).
	 *
	 * **`Interacting` holds it at the minimum.** `:349-356` builds an expression that would ramp
	 * the opacity from 0.4 to 1 with the interaction ratio, and `:358` — the line that would start
	 * it — is commented out. So the ramp is written, never run, and a faithful port does not ramp.
	 */
	const opacity = $derived(
		currentState === 'idle' || currentState === 'interacting' ? MINIMUM_INDICATOR_OPACITY : 1
	);

	/**
	 * `contentInteractionRatioParallaxAnimation` (`:360-395`):
	 * `(1 - threshold) * rootSize * 0.5 * min(ratio / threshold, 1)`, negated for the two far
	 * directions (`:362-368`). At the default 100-long visualizer it peaks at 10 pixels.
	 *
	 * `Refreshing` lands on the same number by a different route: `:292-307` uses
	 * `(1 - executionRatio) * PARALLAX_POSITION_RATIO` as its ratio, which is this expression with
	 * the `min(...)` term at 1. That is not a coincidence — the container settles the visualizer so
	 * that only `executionRatio` of it is revealed, and this translation is what re-centres the
	 * indicator inside the revealed band.
	 */
	const parallax = $derived(
		(1 - EXECUTION_RATIO) *
			rootLength *
			PARALLAX_POSITION_RATIO *
			Math.min(interactionRatio / EXECUTION_RATIO, 1) *
			(isFar ? -1 : 1)
	);
	const refreshingTranslation = $derived(
		(1 - EXECUTION_RATIO) * PARALLAX_POSITION_RATIO * rootLength * (isFar ? -1 : 1)
	);

	/**
	 * The translation, held rather than derived, because two of the five states do not set it.
	 *
	 * `UpdateContent`'s `Peeking` (`:274-277`) and `Pending` (`:282-286`) arms touch opacity and
	 * rotation and leave `Translation` at whatever the state before them left — so a visualizer
	 * that peeks out of an interaction stays where the interaction put it. Only `Idle`, `Interacting`
	 * and `Refreshing` write it.
	 */
	let translation = $state(0);
	$effect(() => {
		if (currentState === 'idle') translation = 0;
		else if (currentState === 'interacting') translation = parallax;
		else if (currentState === 'refreshing') translation = refreshingTranslation;
	});

	const translateX = $derived(isVertical ? 0 : translation);
	const translateY = $derived(isVertical ? translation : 0);

	// `m_root.ActualHeight()` / `ActualWidth()` are read on every state change upstream, so the
	// measurement has to follow the box rather than be taken once.
	$effect(() => {
		if (!box) return;
		const element = box;
		const measure = () => {
			rootHeight = element.clientHeight;
			rootWidth = element.clientWidth;
		};
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		measure();
		return () => observer.disconnect();
	});

	// `RaiseRefreshStateChanged` is raised from `OnStateChanged` (`:198-205`), the property-changed
	// callback — so it fires for whoever wrote the property, including the container. `state` is
	// bindable here and nothing inside this component writes it, so the change has to be watched
	// rather than reported at a call site the way every other callback in this library is.
	let lastState = currentState;
	$effect(() => {
		if (currentState === lastState) return;
		lastState = currentState;
		onStateChange?.(currentState);
	});

	// `RequestRefresh` (`:76-85`) raises `RefreshRequested` as it enters `Refreshing`. Entering that
	// state is the whole of the request here, for the same reason `RequestRefresh` itself is absent.
	let requested = false;
	$effect(() => {
		if (currentState !== 'refreshing') {
			requested = false;
			return;
		}
		if (requested) return;
		requested = true;
		onRefreshRequested?.();
	});
</script>

<!-- The control's style (`RefreshVisualizer.xaml:3-15`): `Background`, `Foreground`, `IsTabStop`
     False and `Height` 100, over a template that is one `Grid x:Name="Root"` with `MinHeight` 80
     and the background bound to it (`:11`). There is no other furniture — every pixel this
     control draws is the indicator C++ inserts into that grid. -->
<div bind:this={ref} class={['root', className]} {style} {...rest}>
	<div bind:this={box} class="box" data-state={currentState}>
		<!-- `contentVisual` — the `Content` element itself, centred on both axes (`:249-250`) and
		     carrying opacity, rotation and the parallax translation. -->
		<div
			class="indicator"
			style="opacity: {opacity}; transform: translate({translateX}px, {translateY}px); rotate: {rotation}deg"
		>
			<!-- A second element, because `Refreshing`'s turn and `Pending`'s pop are animations on
			     the same visual whose static rotation the box above expresses. A CSS animation
			     outranks an inline declaration of the property it animates, so a spin written on
			     the element above would erase the starting angle instead of turning from it. -->
			<div class="animated">
				{#if content}
					{@render content()}
				{:else}
					<!-- `SymbolIcon(Symbol::Refresh)` at 30 by 30 (`:61-65`). `Symbol::Refresh` is
					     `0xE149`, which `CSymbolIcon` maps to the glyph `U+E72C`
					     (`dxaml/xcp/core/core/elements/icon.cpp:605`); the icon's own TextBlock is
					     Segoe Fluent Icons at `g_ClientCoreFontSize`, centred and stretched
					     (`icon.cpp:13`, `:318`, `:352-364`). -->
					<span class="glyph" aria-hidden="true">&#xE72C;</span>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.root {
		/* `Height="100"` on the style (`RefreshVisualizer.xaml:7`). A `Control`'s template fills it,
		   so the box below is what the indicator is centred in and what `rootSize` measures. */
		height: 100px;
		color: var(--winui-RefreshVisualizerForeground);
	}

	.box {
		/* `<Grid x:Name="Root" MinHeight="80" Background="{TemplateBinding Background}" />`
		   (`RefreshVisualizer.xaml:11`). The background resolves to Transparent in all three of the
		   control's theme dictionaries; it is named rather than dropped because a consumer
		   overriding the token is the case the name exists for. */
		display: grid;
		box-sizing: border-box;
		min-height: 80px;
		height: 100%;
		/* `VerticalAlignment(Center)` and `HorizontalAlignment(Center)` on the content
		   (`RefreshVisualizer.cpp:249-250`). */
		place-items: center;
		background: var(--winui-RefreshVisualizerBackground);
	}

	.indicator {
		/* `defaultContent.Height(DEFAULT_INDICATOR_SIZE)` and `.Width(...)`, both 30 (`:61-65`). A
		   caller's own `Content` is measured by itself; this is the default indicator's box. */
		display: grid;
		place-items: center;
	}

	.animated {
		display: grid;
		place-items: center;
	}

	/* `DEFAULT_INDICATOR_SIZE` is 30 (`RefreshVisualizer.cpp:17`), set on the default
	   `SymbolIcon` at `:61-65`. It is the icon element's box, not the glyph's em. */
	.glyph {
		font-weight: normal;
		width: 30px;
		height: 30px;
		display: grid;
		place-items: center;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: icon.cpp:13, `g_ClientCoreFontSize = 20.f`, which CSymbolIcon::InitInstance
		   assigns at :318 and the icon's TextBlock carries at :361-364. */
		font-size: 20px;
		/* The icon's TextBlock is created with no line height of its own; this keeps an inherited
		   type-ramp one from stretching the glyph's line box inside the 30-pixel square. */
		line-height: normal;
	}

	/* `ExecuteScaleUpAnimation` (`:399-420`): a Vector2 key-frame animation on `Scale.XY` with a
	   frame at 0.5 of 1.5 and one at 1.0 of 1, over 300ms. There is no frame at 0, so the
	   composition interpolates from the value the visual already has — which is what a CSS
	   animation with no `from` does too. `scale` rather than a `transform`, so that the inline
	   rotation on the element above is untouched by it. */
	.box[data-state='pending'] .animated {
		animation-name: refresh-pop;
		/* c1-allow: RefreshVisualizer.cpp:413, the scale-up animation's `Duration(300ms)`. */
		animation-duration: 300ms;
	}

	/* `ExecuteExecutingRotationAnimation` (`:422-444`): a linear scalar animation from the starting
	   angle to that angle plus a full turn, 500ms, `IterationBehavior::Forever`. The starting angle
	   is the inline rotation of the element above, so these key frames carry the turn alone. */
	.box[data-state='refreshing'] .animated {
		animation-name: refresh-spin;
		/* c1-allow: RefreshVisualizer.cpp:436, the executing rotation animation's `Duration(500ms)`. */
		animation-duration: 500ms;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
	}

	@keyframes refresh-pop {
		50% {
			scale: 1.5;
		}
		100% {
			scale: 1;
		}
	}

	@keyframes refresh-spin {
		from {
			rotate: 0deg;
		}
		to {
			rotate: 360deg;
		}
	}

	/* A contrast theme: the tokens are the high-contrast theme, so the browser's forcing is off
	   for what this draws. ADR 0005. */
	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
	}
</style>
