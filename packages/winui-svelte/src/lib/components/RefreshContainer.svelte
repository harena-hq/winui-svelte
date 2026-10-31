<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface RefreshContainerProps {
		/** RefreshContainer.Content. */
		children?: Snippet;
		/** RefreshVisualizer.Content, reached upstream through `RefreshContainer.Visualizer` — the
		 *  indicator the container's own visualizer draws. Defaults to the refresh glyph. */
		content?: Snippet;
		/** RefreshContainer.PullDirection (RefreshPullDirection). */
		pullDirection?: 'leftToRight' | 'topToBottom' | 'rightToLeft' | 'bottomToTop';
		/** RefreshContainer.RefreshRequested. Await the promise it returns and the visualizer stays
		 *  in `refreshing` until it settles, which is what upstream's Deferral is for. */
		onRefreshRequested?: (() => void | Promise<void>) | undefined;
		/** No WinUI member: ADR 0009 pairs bindable state with a change callback. Setting it is
		 *  `RequestRefresh()`; it returns to false when the handler's promise settles, and
		 *  immediately when there is no handler — which is what `RaiseRefreshRequested`'s
		 *  increment-raise-decrement (`RefreshContainer.cpp:347-349`) does with a deferral nobody
		 *  took. */
		refreshing?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onRefreshingChange?: (refreshing: boolean) => void;
		class?: string;
		style?: string;
		/** The RefreshContainer root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// `Visualizer` (`RefreshContainer.idl:22`) is absent. It hands out the `RefreshVisualizer`
	// object so that a caller can read its state, replace its content, or subscribe to
	// `RefreshStateChanged` — and the Gallery's second example does exactly that, assigning a
	// visualizer whose `Content` is an `Image`. This library publishes state rather than objects:
	// there is no `RefreshVisualizer` instance to hand out because the container renders its own,
	// so the three things a caller would reach through it are props here — `refreshing` for the
	// state, `content` for the indicator, and `onRefreshRequested` for the request.
	//
	// `RequestRefresh()` (`:26`) is absent for ADR 0009's rule about imperative members: it is a
	// method where `refreshing` is a bindable prop. Writing `refreshing` is the same request.
	//
	// **The gesture is upstream's input, and not all of it.** `ScrollViewerIRefreshInfoProviderAdapter`
	// redirects a pointer to its interaction tracker only when `PointerDeviceType()` is `Touch`
	// (`ScrollViewerIRefreshInfoProviderAdapter.cpp:159`), and the source it builds carries
	// `CapableTouchpadOnly` (`:311`), which takes a precision touchpad's pan as well. This
	// implementation accepts the touch pointer and has nothing to accept for the touchpad: that
	// pan reaches a web page as a `wheel` event and never as a pointer. See WD-035.

	/** `DEFAULT_PULL_DIMENSION_SIZE` — `RefreshContainer.cpp:17`, the size the container gives its
	 *  own visualizer on the pull axis (`:173`, `:184`, `:194`, `:203`). */
	const DEFAULT_PULL_DIMENSION_SIZE = 100;

	/**
	 * `m_executionRatio` (`RefreshVisualizer.h:91`), repeated here rather than shared.
	 *
	 * The container needs it for two things the visualizer cannot do for it: deciding when a pull
	 * has armed the refresh, and settling the reveal at `executionRatio` of the visualizer's length
	 * while the refresh runs (`ScrollViewerIRefreshInfoProviderDefaultAnimationHandler.cpp:136-137`).
	 */
	const EXECUTION_RATIO = 0.8;

	/** `MAX_BFS_DEPTH` — `RefreshContainer.cpp:16`, how deep the search for the scrolled region goes. */
	const MAX_BFS_DEPTH = 10;

	/** `INITIAL_OFFSET_THRESHOLD` — `ScrollViewerIRefreshInfoProviderAdapter.cpp:14`. How close to
	 *  the end the pull starts from the region has to already be, in pixels. */
	const INITIAL_OFFSET_THRESHOLD = 1;

	/** Whether an element scrolls on the given axis, which is what makes it the one to ask. */
	function scrollsOn(element: Element, vertical: boolean): boolean {
		const overflow = getComputedStyle(element)[vertical ? 'overflowY' : 'overflowX'];
		if (overflow !== 'auto' && overflow !== 'scroll' && overflow !== 'overlay') return false;
		return vertical
			? element.scrollHeight > element.clientHeight
			: element.scrollWidth > element.clientWidth;
	}
</script>

<script lang="ts">
	import RefreshVisualizer from './RefreshVisualizer.svelte';

	let {
		children,
		content,
		pullDirection = 'topToBottom', // RefreshContainer.idl:23
		onRefreshRequested,
		refreshing = $bindable(false),
		onRefreshingChange,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: RefreshContainerProps = $props();

	type VisualizerState = 'idle' | 'peeking' | 'interacting' | 'pending' | 'refreshing';

	let visualizerState = $state<VisualizerState>('idle');
	let visualizer = $state<HTMLDivElement | null>(null);
	let contentBox = $state<HTMLDivElement | null>(null);
	/** `m_refreshVisualizer.RenderSize()` (`RefreshContainer.cpp:238`), on the pull axis. */
	let visualizerLength = $state(0);
	/** Whether a pull is in progress — `IsInteractingForRefresh` on the info provider. */
	let dragging = $state(false);
	/** The pull's distance along the axis, in pixels, floored at zero. */
	let distance = $state(0);

	const isVertical = $derived(pullDirection === 'topToBottom' || pullDirection === 'bottomToTop');
	/** The two directions whose pull runs against the axis — `IsPullDirectionFar`. */
	const isFar = $derived(pullDirection === 'bottomToTop' || pullDirection === 'rightToLeft');

	/**
	 * `RefreshInfoProviderImpl::OnInteractionTrackerValuesChanged` (`RefreshInfoProviderImpl.cpp:62`):
	 * the pull's distance over the visualizer's own length, capped at 1. It is **not** divided by
	 * the execution ratio — that ratio is the threshold this is compared against, at `:530` and
	 * `:553`, and the divisor the rotation expression uses.
	 */
	const interactionRatio = $derived(
		visualizerLength === 0 ? 1 : Math.min(1, distance / visualizerLength)
	);

	/**
	 * How much of the visualizer the pull has revealed, in pixels.
	 *
	 * `ScrollViewerIRefreshInfoProviderDefaultAnimationHandler.cpp:63-67` offsets the visualizer to
	 * `-size + min(size, pull)` and the content to `min(size, pull)` while the tracker moves, so
	 * one number places both: at rest the visualizer sits exactly its own length outside the
	 * container and the root's inset clip (`RefreshContainer.cpp:80-81`) hides it. While the
	 * refresh runs, `:136-137` settles the pair at `executionRatio` of that length instead.
	 */
	const reveal = $derived.by(() => {
		if (dragging) return Math.min(visualizerLength, distance);
		if (visualizerState === 'refreshing') return visualizerLength * EXECUTION_RATIO;
		return 0;
	});

	const contentOffset = $derived(isFar ? -reveal : reveal);
	const visualizerOffset = $derived(isFar ? visualizerLength - reveal : reveal - visualizerLength);

	// The container gives its own visualizer `DEFAULT_PULL_DIMENSION_SIZE` on the pull axis and
	// `NaN` — auto — on the other (`RefreshContainer.cpp:167-206`). The visualizer's own style is
	// already 100 tall, so only the horizontal directions need saying, and an inline style is the
	// one channel that reaches across a component boundary without a scope hash.
	const visualizerSizeStyle = $derived(
		isVertical ? undefined : `width: ${DEFAULT_PULL_DIMENSION_SIZE}px; height: auto`
	);

	$effect(() => {
		if (!visualizer) return;
		const element = visualizer;
		const measure = () => {
			visualizerLength = isVertical ? element.offsetHeight : element.offsetWidth;
		};
		const observer = new ResizeObserver(measure);
		observer.observe(element);
		measure();
		return () => observer.disconnect();
	});

	/**
	 * While a pull is in progress the browser must not read the same finger as a scroll. Measured on
	 * `/dev/pull-to-refresh` without it: the browser cancels the pointer stream after three moves —
	 * eighteen pixels of a hundred-pixel visualizer — and the pull dies on `pointercancel`, even
	 * though neither the region nor the page scrolls anywhere. With it the same drag delivers
	 * sixteen moves and the full reveal.
	 *
	 * `addEventListener` with `{ passive: false }` spelled out, rather than an `ontouchmove`
	 * attribute: Svelte marks `touchstart` and `touchmove` passive by default
	 * (svelte 5.57, `src/utils.js:261`), and a passive listener's `preventDefault()` is
	 * ignored — the attribute form compiles to the exact listener that does not work here.
	 */
	$effect(() => {
		const element = ref;
		if (!element) return;
		const onTouchMove = (event: TouchEvent) => {
			if (dragging) event.preventDefault();
		};
		element.addEventListener('touchmove', onTouchMove, { passive: false });
		return () => element.removeEventListener('touchmove', onTouchMove);
	});

	// `refreshing` written from outside is `RequestRefresh()` (`RefreshContainer.cpp:100-107`),
	// which puts the visualizer into `Refreshing` with no gesture at all. Watched for a *change*
	// rather than for its value, so that the write this component makes when a refresh settles is
	// not read back as a fresh request.
	let lastRefreshing = false;
	$effect(() => {
		if (refreshing === lastRefreshing) return;
		lastRefreshing = refreshing;
		if (refreshing) visualizerState = 'refreshing';
		else if (visualizerState === 'refreshing') visualizerState = 'idle';
	});

	/**
	 * `RefreshVisualizer::RefreshInfoProvider_InteractionRatioChanged` (`RefreshVisualizer.cpp:519-586`),
	 * with `dragging` standing in for `IsInteractingForRefresh`.
	 *
	 * The `wasAtZero` arm exists because the interaction tracker can jump past the threshold on its
	 * first report; a pointer drag reports every pixel, so that arm is reachable only from a press
	 * that starts already past it.
	 */
	function applyRatio(previous: number, next: number) {
		const wasAtZero = previous === 0;
		if (dragging) {
			if (visualizerState === 'idle') {
				if (wasAtZero) {
					if (next > EXECUTION_RATIO) visualizerState = 'pending';
					else if (next > 0) visualizerState = 'interacting';
				} else if (next > 0) {
					visualizerState = 'peeking';
				}
			} else if (visualizerState === 'interacting') {
				if (next <= 0) visualizerState = 'idle';
				else if (next > EXECUTION_RATIO) visualizerState = 'pending';
			} else if (visualizerState === 'pending') {
				if (next <= EXECUTION_RATIO) visualizerState = 'interacting';
			}
			// Refreshing and Peeking stay where they are (`:569`).
		} else if (visualizerState !== 'refreshing') {
			visualizerState = next > 0 ? 'peeking' : 'idle';
		}
	}

	/**
	 * `RefreshContainer::SearchTreeForIRefreshInfoProvider` (`RefreshContainer.cpp:253-311`): a
	 * breadth-first walk of the content's own tree, depth-limited, for the one scrolled region the
	 * pull belongs to. Upstream looks for an `IRefreshInfoProvider`, which in practice is a
	 * `ScrollViewer`; the question here is whether an element scrolls on the pull axis, which is the
	 * same question asked of the shape this library has.
	 *
	 * It searches **downward**. An upward walk from the pressed element cannot answer it: this
	 * library's scrollbar is a sibling of the region it scrolls (ScrollView.svelte's `ScrollBar`s),
	 * so a press on the thumb never crosses the scroller on its way up, and the walk reached its
	 * "nothing here scrolls, so nothing holds the pull back" fallback and armed a pull. Measured
	 * before this change: a 64px drag of the first example's thumb on `/collections/pulltorefresh`
	 * scrolled the list by 20 and revealed the visualizer by 64, both at once.
	 */
	function findScroller(): Element | null {
		if (!contentBox) return null;
		let level: Element[] = [contentBox];
		for (let depth = 0; depth <= MAX_BFS_DEPTH && level.length > 0; depth++) {
			const next: Element[] = [];
			for (const node of level) {
				if (scrollsOn(node, isVertical)) return node;
				next.push(...node.children);
			}
			level = next;
		}
		return null;
	}

	/**
	 * `IsWithinOffsetThreshold` (`ScrollViewerIRefreshInfoProviderAdapter.cpp:397-412`): whether the
	 * region is already at the end the pull starts from, within `INITIAL_OFFSET_THRESHOLD`.
	 */
	function atStart(scroller: Element): boolean {
		if (isVertical) {
			return isFar
				? scroller.scrollTop >
						scroller.scrollHeight - scroller.clientHeight - INITIAL_OFFSET_THRESHOLD
				: scroller.scrollTop < INITIAL_OFFSET_THRESHOLD;
		}
		return isFar
			? scroller.scrollLeft > scroller.scrollWidth - scroller.clientWidth - INITIAL_OFFSET_THRESHOLD
			: scroller.scrollLeft < INITIAL_OFFSET_THRESHOLD;
	}

	let originX = 0;
	let originY = 0;

	function onPointerDown(event: PointerEvent) {
		if (visualizerState === 'refreshing' || refreshing) return;
		// `ScrollViewerIRefreshInfoProviderAdapter.cpp:155-159` — the adapter's own PointerPressed
		// handler calls `TryRedirectForManipulation` for a touch pointer and for nothing else, so a
		// mouse never manipulates the tracker and the original's visualizer never leaves `Idle` on a
		// mouse-only desktop. WD-035 records what this still does not reach.
		if (event.pointerType !== 'touch') return;
		const scroller = findScroller();
		// No region to adapt is `InfoProvider(nullptr)` (`RefreshContainer.cpp:247`): the visualizer
		// is handed no provider and no gesture reaches it at all.
		if (scroller === null) return;
		// Upstream adds that handler to the ScrollViewer itself (`:199`), so a press outside the
		// scrolled region is not a pull — and a press on this library's overlay scrollbar is outside
		// it, because the bar is the scroller's sibling rather than its child.
		if (!(event.target instanceof Node) || !scroller.contains(event.target)) return;
		if (!atStart(scroller)) return;
		dragging = true;
		originX = event.clientX;
		originY = event.clientY;
		distance = 0;
	}

	function onPointerMove(event: PointerEvent) {
		if (!dragging) return;
		const along = isVertical ? event.clientY - originY : event.clientX - originX;
		const previous = interactionRatio;
		distance = Math.max(0, isFar ? -along : along);
		applyRatio(previous, interactionRatio);
	}

	/**
	 * `RefreshVisualizer::RefreshInfoProvider_InteractingForRefreshChanged` (`:493-517`) with the
	 * interaction gone: `Pending` requests the refresh, `Refreshing` is left alone, and everything
	 * else falls back to `Idle`.
	 */
	function endDrag() {
		if (!dragging) return;
		dragging = false;
		distance = 0;
		if (visualizerState === 'pending') visualizerState = 'refreshing';
		else if (visualizerState !== 'refreshing') visualizerState = 'idle';
	}

	/**
	 * `OnVisualizerRefreshRequested` (`RefreshContainer.cpp:324-329`) takes the visualizer's deferral
	 * and raises the container's own `RefreshRequested` with one of its own; completing that one
	 * completes the visualizer's, which is what returns it to `Idle` (`RefreshVisualizer.cpp:483-491`).
	 * Awaiting whatever the handler returns is that pair of deferrals in this library's shape.
	 */
	async function onVisualizerRefreshRequested() {
		refreshing = true;
		try {
			onRefreshingChange?.(true);
			await onRefreshRequested?.();
		} finally {
			refreshing = false;
			visualizerState = 'idle';
			onRefreshingChange?.(false);
		}
	}
</script>

<!-- `<Grid x:Name="Root">` holding a `ContentPresenter` and a `RefreshVisualizerPresenter` in the
     same cell (`RefreshContainer.xaml:11-14`), under the inset clip `OnApplyTemplate` puts on the
     root visual (`RefreshContainer.cpp:80-81`) — which is what makes a visualizer parked outside
     the container invisible rather than merely offset.

     `role="presentation"` because the root is a template part carrying pointer handlers rather
     than a control with semantics of its own; a `div` has none to suppress and its content keeps
     what it has. -->
<!-- WD-035: the two inputs upstream's adapter takes are a touch pointer
     (`ScrollViewerIRefreshInfoProviderAdapter.cpp:159`) and a precision touchpad's pan
     (`:311`, `CapableTouchpadOnly`). This takes the first and cannot be handed the second. -->
<div
	bind:this={ref}
	class={['root', className]}
	class:dragging
	{style}
	role="presentation"
	onpointerdown={onPointerDown}
	onpointermove={onPointerMove}
	onpointerup={endDrag}
	onpointercancel={endDrag}
	onpointerleave={endDrag}
	{...rest}
>
	<!-- `<ContentPresenter x:Name="ContentPresenter" Background="Transparent" />` (`:12`). -->
	<div
		bind:this={contentBox}
		class="content"
		style="transform: translate({isVertical ? 0 : contentOffset}px, {isVertical
			? contentOffset
			: 0}px)"
	>
		{@render children?.()}
	</div>
	<!-- `<Grid x:Name="RefreshVisualizerPresenter" />` (`:13`), the later child of the same cell
	     exactly as the template has it. Nothing is drawn where the two overlap: the content moves
	     down by the same distance the visualizer is revealed by, so the band above the content is
	     the only place the visualizer occupies. Its alignment is `OnPullDirectionChangedImpl`
	     (`RefreshContainer.cpp:161-222`) — the pull's own edge on that axis, stretched on the other. -->
	<div
		class="presenter"
		data-pull-direction={pullDirection}
		style="transform: translate({isVertical ? 0 : visualizerOffset}px, {isVertical
			? visualizerOffset
			: 0}px)"
	>
		<RefreshVisualizer
			bind:ref={visualizer}
			bind:state={visualizerState}
			style={visualizerSizeStyle}
			{content}
			{pullDirection}
			{interactionRatio}
			onRefreshRequested={onVisualizerRefreshRequested}
		/>
	</div>
</div>

<style>
	.root {
		/* One cell, both children in it — `RefreshContainer.xaml:11`. */
		display: grid;
		/* `rootVisual.Clip(CreateInsetClip(0, 0, 0, 0))` (`RefreshContainer.cpp:81`). */
		overflow: hidden;
		background: var(--winui-RefreshContainerBackgroundBrush);
		color: var(--winui-RefreshContainerForegroundBrush);
	}

	/* A pointer held down at the start of the content is a pull, and without this the same drag
	   also selects the text it passes over. XAML has no such default; the class is only present
	   while a pull is in progress, so an ordinary click and an ordinary selection are untouched. */
	.root.dragging {
		user-select: none;
	}

	.content {
		grid-area: 1 / 1;
		min-width: 0;
		min-height: 0;
	}

	.presenter {
		grid-area: 1 / 1;
		/* `<Grid x:Name="RefreshVisualizerPresenter" />` (`RefreshContainer.xaml:13`) carries no
		   Background, and a XAML Panel without one does not hit-test; a `div` without one still
		   does. The presenter shares the content's grid cell and is the later child, so without
		   this it is what a pointer finds wherever the two overlap — which is every frame before
		   the visualizer has been measured, when `visualizerLength` is still 0 and the offset below
		   is therefore 0 rather than the visualizer's length outside the box. Nothing the
		   visualizer draws is interactive, so it gives up nothing. */
		pointer-events: none;
		/* A grid of its own, so that a visualizer whose size on the cross axis is `NaN` — auto —
		   fills the presenter the way a stretched XAML child does. */
		display: grid;
	}

	/* `OnPullDirectionChangedImpl` (`RefreshContainer.cpp:167-206`) aligns the presenter to the
	   edge the pull starts from and stretches it on the other axis. */
	.presenter[data-pull-direction='topToBottom'] {
		align-self: start;
		justify-self: stretch;
	}
	.presenter[data-pull-direction='bottomToTop'] {
		align-self: end;
		justify-self: stretch;
	}
	.presenter[data-pull-direction='leftToRight'] {
		align-self: stretch;
		justify-self: start;
	}
	.presenter[data-pull-direction='rightToLeft'] {
		align-self: stretch;
		justify-self: end;
	}

	/* The two settle animations, `RefreshRequestedAnimation` and `RefreshCompletedAnimation`
	   (`ScrollViewerIRefreshInfoProviderDefaultAnimationHandler.cpp:122-218`), both run over
	   `REFRESH_ANIMATION_DURATION`. While the tracker is driving, the offsets are expression
	   animations with no duration at all, which is why the transition is off during a pull. */
	.root:not(.dragging) .content,
	.root:not(.dragging) .presenter {
		transition-property: transform;
		/* c1-allow: ScrollViewerIRefreshInfoProviderDefaultAnimationHandler.cpp:12,
		   `#define REFRESH_ANIMATION_DURATION 100ms`. */
		transition-duration: 100ms;
	}
</style>
