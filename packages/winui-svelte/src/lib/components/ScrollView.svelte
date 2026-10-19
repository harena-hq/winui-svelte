<script lang="ts" module>
	import type { Snippet } from 'svelte';
	import { ScrollAnimation, type ScrollVector } from '../scroll-animation';

	export interface ScrollViewProps {
		/** ScrollView.Content. */
		children?: Snippet;
		/** ScrollView.HorizontalScrollBarVisibility (ScrollingScrollBarVisibility). */
		horizontalScrollBarVisibility?: 'auto' | 'visible' | 'hidden';
		/** ScrollView.VerticalScrollBarVisibility (ScrollingScrollBarVisibility). */
		verticalScrollBarVisibility?: 'auto' | 'visible' | 'hidden';
		/** ScrollView.ContentOrientation (ScrollingContentOrientation). */
		contentOrientation?: 'vertical' | 'horizontal' | 'both' | 'none';
		/** ScrollView.HorizontalScrollMode (ScrollingScrollMode). */
		horizontalScrollMode?: 'enabled' | 'disabled' | 'auto';
		/** ScrollView.VerticalScrollMode (ScrollingScrollMode). */
		verticalScrollMode?: 'enabled' | 'disabled' | 'auto';
		/** ScrollView.ZoomMode (ScrollingZoomMode). */
		zoomMode?: 'enabled' | 'disabled';
		/** ScrollView.ZoomFactor — read-only upstream, bindable here (ADR 0009). */
		zoomFactor?: number;
		/** ScrollView.MinZoomFactor. */
		minZoomFactor?: number;
		/** ScrollView.MaxZoomFactor. */
		maxZoomFactor?: number;
		/** ScrollView.HorizontalOffset — read-only upstream, bindable here (ADR 0009). */
		horizontalOffset?: number;
		/** ScrollView.VerticalOffset — read-only upstream, bindable here (ADR 0009). */
		verticalOffset?: number;
		/** ScrollView.ExtentWidth — read-only upstream, bindable here (ADR 0009). */
		extentWidth?: number;
		/** ScrollView.ExtentHeight — read-only upstream, bindable here (ADR 0009). */
		extentHeight?: number;
		/** ScrollView.ViewportWidth — read-only upstream, bindable here (ADR 0009). */
		viewportWidth?: number;
		/** ScrollView.ViewportHeight — read-only upstream, bindable here (ADR 0009). */
		viewportHeight?: number;
		/** ScrollView.ScrollableWidth — read-only upstream, bindable here (ADR 0009). */
		scrollableWidth?: number;
		/** ScrollView.ScrollableHeight — read-only upstream, bindable here (ADR 0009). */
		scrollableHeight?: number;
		/** No WinUI member: ADR 0009 pairs bindable state with a change callback. */
		onOffsetChange?: ((offset: { horizontal: number; vertical: number }) => void) | undefined;
		/** No WinUI member: ADR 0009 pairs bindable state with a change callback. */
		onZoomFactorChange?: ((factor: number) => void) | undefined;
		/** ScrollView.ScrollAnimationStarting. */
		onScrollAnimationStarting?:
			((args: ScrollingScrollAnimationStartingEventArgs) => void) | undefined;
		/** UIElement.IsEnabled. */
		disabled?: boolean;
		class?: string;
		style?: string;
		/** The ScrollView root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	/** ScrollingScrollOptions. */
	export interface ScrollingScrollOptions {
		/** ScrollingScrollOptions.AnimationMode; `auto` by default, as upstream's. */
		animationMode?: 'enabled' | 'disabled' | 'auto';
		/** ScrollingScrollOptions.SnapPointsMode. This component has no snap points, so the two
		 * values behave alike. */
		snapPointsMode?: 'default' | 'ignore';
	}

	/** ScrollingScrollAnimationStartingEventArgs. Assign `animation` to replace the animation. */
	export interface ScrollingScrollAnimationStartingEventArgs {
		animation: ScrollAnimation;
		readonly startPosition: ScrollVector;
		readonly endPosition: ScrollVector;
		readonly correlationId: number;
	}

	// GettingFocusEventArgs.InputDevice (ScrollView.cpp:526-533) names what gave a focus. A page is
	// told nothing of the kind, so the last input anywhere on the page stands in for it, read once
	// for every ScrollView: a press gives its pointer type and a key the keyboard. A focus a script
	// gives is read as whatever came last, where upstream reads Programmatic.
	let lastInputKind: string | null = null;
	let lastInputListening = false;
	function listenForLastInput() {
		if (lastInputListening || typeof window === 'undefined') return;
		lastInputListening = true;
		const capture = { capture: true, passive: true };
		window.addEventListener('pointerdown', (event) => (lastInputKind = event.pointerType), capture);
		window.addEventListener('keydown', () => (lastInputKind = 'keyboard'), capture);
	}

	/** ScrollCompleted, the zoom methods and the anchoring properties belong to
	 * later units of this version. They are absent here for that sequencing reason, not declined. */
</script>

<script lang="ts">
	import { untrack } from 'svelte';
	import ScrollBar from '../internal/ScrollBar.svelte';
	import { animationsEnabled } from '../internal/motion';

	let {
		children,
		horizontalScrollBarVisibility = 'auto',
		verticalScrollBarVisibility = 'auto',
		contentOrientation = 'vertical',
		horizontalScrollMode = 'auto',
		verticalScrollMode = 'auto',
		zoomMode = 'disabled', // ScrollView.h:40
		zoomFactor = $bindable(1),
		minZoomFactor = 0.1, // ScrollView.h:43
		maxZoomFactor = 10, // ScrollView.h:44
		horizontalOffset = $bindable(0),
		verticalOffset = $bindable(0),
		extentWidth = $bindable(0),
		extentHeight = $bindable(0),
		viewportWidth = $bindable(0),
		viewportHeight = $bindable(0),
		scrollableWidth = $bindable(0),
		scrollableHeight = $bindable(0),
		onOffsetChange,
		onZoomFactorChange,
		onScrollAnimationStarting,
		disabled = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ScrollViewProps = $props();

	let viewport = $state<HTMLDivElement | null>(null);
	let zoomBox = $state<HTMLDivElement | null>(null);
	let content = $state<HTMLDivElement | null>(null);
	let contentWidth = $state(0);
	let contentHeight = $state(0);
	let scrollTop = $state(0);
	let scrollLeft = $state(0);
	let constrainedZoomFactor = $derived(
		Math.max(minZoomFactor, Math.min(maxZoomFactor, zoomFactor))
	);
	let zoomBoxStyle = $derived(
		constrainedZoomFactor === 1 || contentWidth === 0 || contentHeight === 0
			? undefined
			: `width: ${contentWidth * constrainedZoomFactor}px; height: ${contentHeight * constrainedZoomFactor}px`
	);
	let contentStyle = $derived.by(() => {
		if (constrainedZoomFactor === 1) return undefined;
		// The vertical and horizontal orientation rules use 100% on one axis. Once zoom-box has
		// that axis's scaled size, preserve the measured pre-zoom dimension before transforming so
		// the percentage does not resolve against the scaled box and apply zoom twice.
		const dimensions = [
			...(contentOrientation === 'vertical' || contentOrientation === 'none'
				? [`width: ${contentWidth}px`]
				: []),
			...(contentOrientation === 'horizontal' || contentOrientation === 'none'
				? [`height: ${contentHeight}px`]
				: [])
		];
		return `${dimensions.join('; ')}${dimensions.length ? '; ' : ''}transform: scale(${constrainedZoomFactor}); transform-origin: 0 0`;
	});
	// The six extent and viewport props are this component's own measurement state as well as
	// what it publishes: upstream reports the same six numbers as read-only properties
	// (ScrollView.idl:29-34), and keeping a private copy beside them would be two sources for
	// one measurement.

	// ScrollBarController::UpdateCanScroll (ScrollBarController.cpp:299-308) is
	// `m_isScrollable && m_scrollBar.IsEnabled() && Maximum > Minimum`, so a disabled control
	// reports that it cannot scroll and an Auto bar collapses with it. A Visible one still draws,
	// because ScrollView.cpp:1667 sets that from the property alone.
	let canScrollVertically = $derived(
		!disabled && verticalScrollMode !== 'disabled' && extentHeight > viewportHeight
	);
	let canScrollHorizontally = $derived(
		!disabled && horizontalScrollMode !== 'disabled' && extentWidth > viewportWidth
	);
	// ScrollView.cpp:1646-1706: Hidden and Auto without scrollable extent draw nothing; only
	// Visible forces a controller, whose ScrollBar draws a rail without a thumb at zero range.
	let verticalBarVisible = $derived(
		verticalScrollBarVisibility === 'visible' ||
			(verticalScrollBarVisibility === 'auto' && canScrollVertically)
	);
	let horizontalBarVisible = $derived(
		horizontalScrollBarVisibility === 'visible' ||
			(horizontalScrollBarVisibility === 'auto' && canScrollHorizontally)
	);

	function measure() {
		if (!viewport) return;
		if (content) {
			// offset dimensions exclude transforms, which is the size zoom-box must multiply.
			// Percentage-oriented content gets its pre-zoom dimension from the current viewport;
			// measuring that axis from zoom-box would feed the scaled size back into the content.
			const measuredWidth =
				contentOrientation === 'vertical' || contentOrientation === 'none'
					? viewport.clientWidth
					: content.offsetWidth;
			const measuredHeight =
				contentOrientation === 'horizontal' || contentOrientation === 'none'
					? viewport.clientHeight
					: content.offsetHeight;
			contentWidth = measuredWidth;
			contentHeight = measuredHeight;
		}
		scrollTop = viewport.scrollTop;
		scrollLeft = viewport.scrollLeft;
		extentWidth = viewport.scrollWidth;
		extentHeight = viewport.scrollHeight;
		viewportWidth = viewport.clientWidth;
		viewportHeight = viewport.clientHeight;
		scrollableWidth = Math.max(0, extentWidth - viewportWidth);
		scrollableHeight = Math.max(0, extentHeight - viewportHeight);
	}

	function onScroll() {
		// A scroll the running animation did not make — a key, an offset bound from outside, the
		// browser's own wheel scroll — interrupts it, as upstream's input and requests do. The
		// animation's own write is known by the offsets the viewport held right after it.
		if (
			running &&
			viewport &&
			(Math.abs(viewport.scrollLeft - running.landed.x) > 0.5 ||
				Math.abs(viewport.scrollTop - running.landed.y) > 0.5)
		) {
			stopAnimation();
		}
		measure();
		// OnScrollPresenterViewChanged shows the indicators for a view change of any origin: a
		// wheel, a key, a drag, a pan or a request. Which kind is the preference's, above.
		if (touchContacts.length > 0) preferMouseIndicators = false;
		if (loaded) showIndicators();
		if (horizontalOffset !== scrollLeft) horizontalOffset = scrollLeft;
		if (verticalOffset !== scrollTop) verticalOffset = scrollTop;
		onOffsetChange?.({ horizontal: scrollLeft, vertical: scrollTop });
	}

	// ScrollPresenter.h: s_offsetsChangeMsPerUnit, s_offsetsChangeMinMs, s_offsetsChangeMaxMs.
	const OFFSETS_CHANGE_MS_PER_UNIT = 5;
	const OFFSETS_CHANGE_MIN_MS = 50;
	const OFFSETS_CHANGE_MAX_MS = 1000;

	// Without a rate upstream restores the interaction tracker's default, which ScrollPresenter's
	// ProcessOffsetsChange calls "the default 0.95 position inertia decay rate".
	const DEFAULT_INERTIA_DECAY_RATE = 0.95;
	// The interaction tracker's minimum inertia velocity, which the same ProcessOffsetsChange names.
	// On the reference Gallery 30 pixels a second did not move, 31 moved at 31 and 40 at 40, so a
	// velocity past it moves at its whole value rather than at what exceeds 30.
	const MINIMUM_INERTIA_VELOCITY = 30;

	let lastCorrelationId = 0;
	// The running animation's frame request, its latest position and what the viewport made of
	// it. The position is kept here, unrounded, because the viewport snaps what it is given to
	// device pixels and a request that starts from a running animation starts from where the
	// animation is. What the viewport holds after the write is kept beside it, read back rather
	// than predicted, so that a scroll event can tell the animation's own write from another.
	// The velocity is the motion's own at its last frame, which an added velocity adds to; a
	// key-frame animation reports none.
	let running: {
		frame: number;
		position: ScrollVector;
		velocity: ScrollVector;
		landed: ScrollVector;
	} | null = null;

	function currentPosition(): ScrollVector {
		if (running) return { x: running.position.x, y: running.position.y };
		return { x: viewport?.scrollLeft ?? 0, y: viewport?.scrollTop ?? 0 };
	}

	function stopAnimation() {
		if (!running) return;
		cancelAnimationFrame(running.frame);
		running = null;
	}

	function clampOffset(value: number, scrollable: number) {
		return Math.min(scrollable, Math.max(0, value));
	}

	function changeOffsets(target: ScrollVector, options: ScrollingScrollOptions | undefined) {
		const correlationId = ++lastCorrelationId;
		const start = currentPosition();
		stopAnimation();
		if (!viewport) return correlationId;
		const mode = options?.animationMode ?? 'auto';
		// ScrollPresenter::GetComputedAnimationMode: Auto follows the platform's animation switch.
		if (mode === 'disabled' || (mode === 'auto' && !animationsEnabled())) {
			viewport.scrollLeft = clampOffset(target.x, scrollableWidth);
			viewport.scrollTop = clampOffset(target.y, scrollableHeight);
			return correlationId;
		}
		// ScrollPresenter::GetPositionAnimation: one key frame at the end, the distance truncated
		// before it is turned into a duration.
		const distance = Math.trunc(Math.hypot(target.x - start.x, target.y - start.y));
		const stock = new ScrollAnimation();
		stock.insertKeyFrame(1, target);
		stock.duration = Math.min(
			OFFSETS_CHANGE_MAX_MS,
			Math.max(OFFSETS_CHANGE_MIN_MS, distance * OFFSETS_CHANGE_MS_PER_UNIT)
		);
		const args: ScrollingScrollAnimationStartingEventArgs = {
			animation: stock,
			startPosition: { x: start.x, y: start.y },
			endPosition: { x: target.x, y: target.y },
			correlationId
		};
		onScrollAnimationStarting?.(args);
		// A handler that made a request of its own has interrupted this one, as any later request
		// does.
		if (correlationId !== lastCorrelationId) return correlationId;
		const animation = args.animation;
		const duration = animation.duration;
		run((elapsed) => {
			const progress =
				Number.isFinite(duration) && duration > 0 ? Math.min(1, elapsed / duration) : 1;
			return {
				position: animation.valueAt(progress, start),
				velocity: { x: 0, y: 0 },
				done: progress >= 1
			};
		}, start);
		return correlationId;
	}

	/** What a motion is `elapsed` milliseconds after it started: where, how fast in pixels a
	 * second, and whether it has finished. */
	type Sample = (elapsed: number) => {
		position: ScrollVector;
		velocity: ScrollVector;
		done: boolean;
	};

	function run(sample: Sample, start: ScrollVector) {
		const startedAt = performance.now();
		// Each run checks that it is still the running one, so a run that was replaced stops at its
		// next frame even where its frame request was not the one cancelled.
		const self = {
			frame: 0,
			position: { x: start.x, y: start.y },
			velocity: { x: 0, y: 0 },
			landed: { x: viewport?.scrollLeft ?? 0, y: viewport?.scrollTop ?? 0 }
		};
		const step = () => {
			if (!viewport || running !== self) return;
			const next = sample(performance.now() - startedAt);
			self.position = {
				x: clampOffset(next.position.x, scrollableWidth),
				y: clampOffset(next.position.y, scrollableHeight)
			};
			self.velocity = next.velocity;
			viewport.scrollLeft = self.position.x;
			viewport.scrollTop = self.position.y;
			self.landed = { x: viewport.scrollLeft, y: viewport.scrollTop };
			if (next.done) running = null;
			else self.frame = requestAnimationFrame(step);
		};
		self.frame = requestAnimationFrame(step);
		running = self;
	}

	/**
	 * One axis of an inertia that starts at `velocity` pixels a second and keeps `1 - decay` of it
	 * each second: its travel and velocity `elapsed` milliseconds in, and whether it is at rest.
	 * Only a decay of 0 was measured on the reference; the curve for any other is this library's
	 * model. With a decay of 0 it never comes to rest, and at 1 it never moves.
	 */
	function inertia(velocity: number, decay: number, elapsed: number) {
		const seconds = elapsed / 1000;
		if (velocity === 0 || decay >= 1) return { travel: 0, velocity: 0, rest: true };
		if (decay <= 0) return { travel: velocity * seconds, velocity, rest: false };
		const log = Math.log(1 - decay);
		const now = velocity * Math.exp(log * seconds);
		// The travel still to come is now / -log; under half a pixel there is nothing left to draw.
		return { travel: (now - velocity) / log, velocity: now, rest: Math.abs(now / log) < 0.5 };
	}

	// ScrollPresenter::OnPointerPressed hands a touch or pen contact to the interaction tracker,
	// whose interaction interrupts a running animation, and returns early for a mouse: a click on
	// the content leaves the animation running.
	function onPointerDown(event: PointerEvent) {
		if (event.pointerType === 'touch' || event.pointerType === 'pen') stopAnimation();
	}

	/**
	 * ScrollView.ScrollTo. Returns the request's correlation id. A disabled request lands before
	 * this returns, where upstream's lands on a later tick; the bound offsets follow on the scroll
	 * event it causes.
	 */
	export function scrollTo(
		horizontalOffset: number,
		verticalOffset: number,
		options?: ScrollingScrollOptions
	): number {
		return changeOffsets({ x: horizontalOffset, y: verticalOffset }, options);
	}

	/**
	 * ScrollView.ScrollBy. The deltas are added to where the view is now, a running animation's
	 * current position included, as upstream's ResetAnticipatedView leaves them. Returns the
	 * request's correlation id.
	 */
	export function scrollBy(
		horizontalOffsetDelta: number,
		verticalOffsetDelta: number,
		options?: ScrollingScrollOptions
	): number {
		const start = currentPosition();
		return changeOffsets(
			{ x: start.x + horizontalOffsetDelta, y: start.y + verticalOffsetDelta },
			options
		);
	}

	/**
	 * ScrollView.AddScrollVelocity. The velocity, in pixels a second, is added to the one a running
	 * velocity scroll has; on an axis where the sum is 30 or less either way that axis does not
	 * move. The reference showed the floor on one axis from rest; applying it per axis, and to the
	 * sum, is this library's reading. A decay rate is clamped to [0, 1] per axis; without one, or
	 * where it is not a number, 0.95. It runs until it comes to rest or reaches the edge it is
	 * moving towards, and reduced motion does not stop it. Returns the request's correlation id.
	 */
	export function addScrollVelocity(
		offsetsVelocity: ScrollVector,
		inertiaDecayRate?: ScrollVector | null
	): number {
		const correlationId = ++lastCorrelationId;
		const start = currentPosition();
		const carried = running ? running.velocity : { x: 0, y: 0 };
		stopAnimation();
		if (!viewport) return correlationId;
		const rate = (value: number | undefined) =>
			value !== undefined && Number.isFinite(value)
				? Math.min(1, Math.max(0, value))
				: DEFAULT_INERTIA_DECAY_RATE;
		const decay = { x: rate(inertiaDecayRate?.x), y: rate(inertiaDecayRate?.y) };
		const minimum = (value: number) =>
			Number.isFinite(value) && Math.abs(value) > MINIMUM_INERTIA_VELOCITY ? value : 0;
		const velocity = {
			x: minimum(carried.x + offsetsVelocity.x),
			y: minimum(carried.y + offsetsVelocity.y)
		};
		if (velocity.x === 0 && velocity.y === 0) return correlationId;
		// An axis is done when its inertia is at rest or it has reached the edge it moves towards.
		const settled = (rest: boolean, at: number, scrollable: number, towards: number) =>
			rest || (towards < 0 && at <= 0) || (towards > 0 && at >= scrollable);
		run((elapsed) => {
			const x = inertia(velocity.x, decay.x, elapsed);
			const y = inertia(velocity.y, decay.y, elapsed);
			const position = { x: start.x + x.travel, y: start.y + y.travel };
			const xSettled = settled(x.rest, position.x, scrollableWidth, velocity.x);
			const ySettled = settled(y.rest, position.y, scrollableHeight, velocity.y);
			// An axis at its edge has no velocity left for a later request to add to, though the
			// other axis is still moving.
			return {
				position,
				velocity: { x: xSettled ? 0 : x.velocity, y: ySettled ? 0 : y.velocity },
				done: xSettled && ySettled
			};
		}, start);
		return correlationId;
	}

	// Upstream's ZoomTo takes a centre point and the Gallery passes null, which means the centre of
	// the viewport (ScrollView.idl:104). So a zoom keeps whatever is in the middle of the box in the
	// middle of the box; anchoring at the top-left instead shows a different part of the content at
	// every factor, which is what a side-by-side against the original's own page showed.
	function reanchor(from: number, to: number) {
		if (!viewport || from === to || from === 0) return;
		const scale = to / from;
		const left =
			(viewport.scrollLeft + viewport.clientWidth / 2) * scale - viewport.clientWidth / 2;
		const top =
			(viewport.scrollTop + viewport.clientHeight / 2) * scale - viewport.clientHeight / 2;
		// After the frame in which the zoom box takes its new size, or the scroll offsets are
		// clamped against the old extent.
		requestAnimationFrame(() => {
			if (!viewport) return;
			viewport.scrollLeft = Math.max(0, left);
			viewport.scrollTop = Math.max(0, top);
		});
	}

	function setZoomFactor(next: number) {
		const factor = Math.max(minZoomFactor, Math.min(maxZoomFactor, next));
		if (factor === zoomFactor) return;
		const previous = constrainedZoomFactor;
		zoomFactor = factor;
		reanchor(previous, factor);
		onZoomFactorChange?.(factor);
	}

	function onWheel(event: WheelEvent) {
		stopAnimation();
		if (disabled || zoomMode !== 'enabled' || !event.ctrlKey || event.deltaY === 0) return;
		// This implementation uses a 1.1 step for each wheel notch; upstream only gates Ctrl+wheel.
		setZoomFactor(zoomFactor * (event.deltaY < 0 ? 1.1 : 1 / 1.1));
		event.preventDefault();
	}

	function scrollVertically(value: number) {
		if (viewport && viewport.scrollTop !== value) viewport.scrollTop = value;
	}

	function scrollHorizontally(value: number) {
		if (viewport && viewport.scrollLeft !== value) viewport.scrollLeft = value;
	}

	$effect(() => {
		if (!viewport || !content) return;
		const observer = new ResizeObserver(measure);
		observer.observe(viewport);
		// A viewport observer does not see content growth inside a fixed viewport.
		observer.observe(content);
		if (zoomBox) observer.observe(zoomBox);
		measure();
		return () => observer.disconnect();
	});

	// A running animation's frame request must not outlive the viewport it writes to.
	$effect(() => stopAnimation);

	// One, not the initial factor: a ScrollView mounted at a factor above one is upstream's
	// `ZoomTo(factor, null)` from one, so it centres the same way a later change does.
	let lastFactor = 1;
	$effect(() => {
		if (zoomFactor !== constrainedZoomFactor) zoomFactor = constrainedZoomFactor;
		if (constrainedZoomFactor !== lastFactor) {
			// A running scroll's positions are in the old factor's coordinates.
			stopAnimation();
			// A factor written from outside re-anchors on the same rule as one the wheel changed.
			reanchor(lastFactor, constrainedZoomFactor);
			lastFactor = constrainedZoomFactor;
		}
	});

	$effect(() => {
		scrollHorizontally(horizontalOffset);
		scrollVertically(verticalOffset);
	});

	// ScrollingIndicatorStates (ScrollView.xaml:28-104): the bars draw nothing until the pointer
	// or the view gives them a reason to, and go back to nothing once it stops. Upstream's
	// `AreScrollControllersAutoHiding` reads the system's "always show scrollbars" setting, which
	// a page cannot see, so this is its default, auto-hiding, everywhere: WD-103.
	//
	// The delays are the reference guest's, measured on its Gallery against both a ScrollView and
	// the pane's ScrollViewer: with the pointer left still inside, the bar starts to fade 3.2 to
	// 3.3 seconds after it appeared; after the pointer leaves, it is gone a little over two
	// seconds later, which is `s_noIndicatorCountdown` (ScrollView.h:377) and the fade. The pin
	// does not account for the first figure — the `MouseIndicator`-to-`NoIndicator` transition's
	// two seconds (ScrollView_themeresources.xaml:17) leave about 1.25 of it unexplained — so the
	// measurement is what is reproduced. The touch indicator's half second is the template's
	// `ScrollViewScrollBarsNoTouchDuration` (:23); the guest has no touch input to measure it by.
	const MOUSE_INDICATOR_MS = 3250;
	const NO_INDICATOR_COUNTDOWN_MS = 2000;
	const TOUCH_INDICATOR_MS = 500;
	// ScrollBar's `NoIndicator` state fades every part over `ScrollBarOpacityChangeDuration` and
	// collapses the mouse roots at its end (ScrollBar_themeresources.xaml:465-526, :174); the
	// panning roots collapse later, at `ScrollBarContractDuration` (:176), with nothing left to
	// draw by then.
	const OPACITY_CHANGE_MS = 83;

	let indicator = $state<'none' | 'mouse' | 'touch'>('none');
	let fading = $state(false);
	// m_preferMouseIndicators, false until a mouse or pen moves over the control (ScrollView.h:352).
	// A key clears it (OnKeyDown, ScrollView.cpp:1947), a focus sets it from the device that gave
	// the focus (OnGotFocus, :511-513), and a touch pan clears it (OnScrollPresenterStateChanged,
	// :940-943). The browser reports no interaction state; what it does is cancel a touch contact
	// that it takes for a pan, before the pan's first scroll, so that cancellation is the pan, and
	// a scroll while a contact is still down is one too. Nothing resets it when the bars hide.
	let preferMouseIndicators = false;
	// The ids of the touch contacts that went down inside the control and have not ended. Not
	// reactive state, which is why it is not a SvelteSet: nothing draws from it.
	let touchContacts: number[] = [];
	// Whether this instance draws the older ScrollViewer, as ScrollViewer, ListView, GridView,
	// TreeView, PipsPager and NavigationView's pane do, each marking the root with the attribute
	// ParallaxView also reads. That control's press shows nothing: ScrollViewer::OnPointerPressed
	// (ScrollViewer_Partial.cpp:2465-2499) only records the button, where ScrollView's shows the
	// bars (ScrollView.cpp:645-672). Of the input paths that show the bars, ScrollViewer's focus,
	// pointer, thumb-drag and offset paths do as this one's do (ScrollViewer_Partial.cpp:2323-2343,
	// :2617-2712, :5487, :4897-4910), so the press is the one that differs. The release that
	// follows asks for focus (:2502-2585), which a default ScrollViewer refuses, as its style makes
	// it no tab stop (ScrollViewer_themeresources.xaml:27).
	const drawsScrollViewer = $derived(rest['data-scroll-input'] === 'scroll-viewer');
	// m_isPointerOverVerticalScrollController and its horizontal twin, which hold the bars up. A
	// thumb drag that leaves the bar holds them as well, as m_keepIndicatorsShowing does while a
	// bar scrolls with the mouse (ScrollView.cpp:836-902): the thumb captures the pointer, so the
	// bar sees no leave until the release. A press on an arrow or the track captures nothing and
	// scrolls once, so nothing is held for it.
	const pointerOver = { vertical: false, horizontal: false };
	const pointerOverBar = () => pointerOver.vertical || pointerOver.horizontal;
	// IsLoaded: a view change before the control has drawn shows nothing (ScrollView.cpp:1006).
	let loaded = false;
	let hideTimer: ReturnType<typeof setTimeout> | undefined;
	let fadeTimer: ReturnType<typeof setTimeout> | undefined;

	function clearIndicatorTimers() {
		clearTimeout(hideTimer);
		clearTimeout(fadeTimer);
		hideTimer = fadeTimer = undefined;
	}

	/** UpdateScrollControllersVisualState with showIndicators (ScrollView.cpp:1835-1855). */
	function showIndicators() {
		if (!verticalBarVisible && !horizontalBarVisible) return;
		clearIndicatorTimers();
		fading = false;
		// Mouse indicators dominate once they are showing.
		indicator = preferMouseIndicators || indicator === 'mouse' ? 'mouse' : 'touch';
		hideIndicatorsAfter(indicator === 'mouse' ? MOUSE_INDICATOR_MS : TOUCH_INDICATOR_MS);
	}

	function hideIndicatorsAfter(ms: number) {
		clearTimeout(hideTimer);
		hideTimer = setTimeout(hideIndicators, ms);
	}

	/**
	 * HideIndicators: the bar fades and then draws nothing. With the platform's animations off,
	 * upstream hides on a timer path instead: the hide branch of UpdateScrollControllersVisualState
	 * calls HideIndicatorsAfterDelay (ScrollView.cpp:1863-1867, :1752-1796), which a pointer
	 * entering a bar also starts (:2187-2191). The guest's animation setting is reference state
	 * and was not switched to measure it, so the measured path serves both.
	 */
	function hideIndicators() {
		// Called from an effect as well as from its own timer, so neither timer is assumed spent.
		clearIndicatorTimers();
		if (indicator === 'none' || pointerOverBar()) return;
		fading = true;
		// The fade's own length is `--winui-ScrollBarOpacityChangeDuration`, which the CSS
		// transition below reads; this is the same 83ms, as the end of that transition.
		fadeTimer = setTimeout(() => {
			fadeTimer = undefined;
			fading = false;
			indicator = 'none';
		}, OPACITY_CHANGE_MS);
	}

	// OnScrollViewPointerEntered / Moved / Exited / Pressed (ScrollView.cpp:563-672), OnKeyDown and
	// OnGotFocus. The first three ignore touch; a press of any kind shows unless this draws the
	// older ScrollViewer (`drawsScrollViewer` above); a focus inside shows either way. Upstream
	// skips a press something inside has handled (:651-654); `defaultPrevented` is the nearest
	// reading, and it sees only a handler added natively, because Svelte's own `onpointerdown`
	// attributes are delegated to the app's root and run after this one. A disabled control takes
	// no input upstream, so none of these reach it. They are listened for here rather than written
	// on the root, where a caller's own `onpointer…` in `rest` would replace them.
	$effect(() => {
		const root = ref;
		if (!root) return;
		const onMove = (event: PointerEvent) => {
			if (disabled || event.pointerType === 'touch') return;
			preferMouseIndicators = true;
			showIndicators();
		};
		// Exited shows the bars and then hides them after the countdown, so a bar that had faded
		// under a still pointer comes back as the pointer leaves.
		const onLeave = (event: PointerEvent) => {
			if (disabled || event.pointerType === 'touch') return;
			pointerOver.vertical = pointerOver.horizontal = false;
			preferMouseIndicators = true;
			showIndicators();
			hideIndicatorsAfter(NO_INDICATOR_COUNTDOWN_MS);
		};
		const onDown = (event: PointerEvent) => {
			if (event.pointerType === 'touch') touchContacts.push(event.pointerId);
			if (!disabled && !drawsScrollViewer && !event.defaultPrevented) showIndicators();
		};
		const end = (event: PointerEvent) => {
			const inside = touchContacts.includes(event.pointerId);
			touchContacts = touchContacts.filter((id) => id !== event.pointerId);
			return inside;
		};
		const onUp = (event: PointerEvent) => void end(event);
		const onCancel = (event: PointerEvent) => {
			if (end(event)) preferMouseIndicators = false;
		};
		const onKey = () => {
			if (!disabled) preferMouseIndicators = false;
		};
		// ListView, GridView and TreeView put their `tabindex="-1"` on this root, so a press on
		// their blank space gives the root focus. Upstream that press focuses nothing: the list
		// marks its ScrollViewer `m_templatedParentHandlesMouseButton`
		// (ListViewBase_Partial.cpp:636), and ScrollViewer::OnPointerPressed returns before the
		// release can ask for focus (ScrollViewer_Partial.cpp:2483). So that focus is skipped. A
		// focus given to the list itself upstream goes on to an item (ListViewBase::OnFocusChanged,
		// ListViewBase_Partial_Interaction.cpp:2919-2963) and shows the bars from there; here a
		// script's focus on the root shows nothing, as it lands where that press's does.
		const onFocus = (event: FocusEvent) => {
			if (disabled) return;
			if (drawsScrollViewer && event.target === root && root.getAttribute('tabindex') === '-1')
				return;
			preferMouseIndicators = lastInputKind === 'mouse' || lastInputKind === 'pen';
			showIndicators();
		};
		listenForLastInput();
		root.addEventListener('pointerenter', onMove);
		root.addEventListener('pointermove', onMove);
		root.addEventListener('pointerleave', onLeave);
		root.addEventListener('pointerdown', onDown);
		// On the window, because a contact that lifts outside the control still ends.
		// Captured, so that a handler inside that stops the event cannot leave a contact recorded.
		window.addEventListener('pointerup', onUp, true);
		window.addEventListener('pointercancel', onCancel, true);
		root.addEventListener('keydown', onKey);
		root.addEventListener('focusin', onFocus);
		return () => {
			root.removeEventListener('pointerenter', onMove);
			root.removeEventListener('pointermove', onMove);
			root.removeEventListener('pointerleave', onLeave);
			root.removeEventListener('pointerdown', onDown);
			window.removeEventListener('pointerup', onUp, true);
			window.removeEventListener('pointercancel', onCancel, true);
			root.removeEventListener('keydown', onKey);
			root.removeEventListener('focusin', onFocus);
			// A contact whose end this listener no longer hears is not left recorded.
			touchContacts = [];
		};
	});

	$effect(() => {
		// Two frames: the scroll an initial offset causes is dispatched in the first.
		let frame = requestAnimationFrame(() => {
			frame = requestAnimationFrame(() => (loaded = true));
		});
		return () => cancelAnimationFrame(frame);
	});

	// The indicator timers must not outlive the component.
	$effect(() => clearIndicatorTimers);

	// OnScrollViewIsEnabledChanged (ScrollView.cpp:535-547) hides the bars; and a bar removed
	// from under the pointer sends it no leave, so it no longer holds them.
	$effect(() => {
		const held = pointerOverBar();
		if (disabled || !verticalBarVisible) pointerOver.vertical = false;
		if (disabled || !horizontalBarVisible) pointerOver.horizontal = false;
		if (disabled || (!verticalBarVisible && !horizontalBarVisible)) untrack(hideIndicators);
		// The bar that remains counts down, as it would had the pointer left the one that went.
		else if (held && !pointerOverBar())
			untrack(() => hideIndicatorsAfter(NO_INDICATOR_COUNTDOWN_MS));
	});

	// HandleScrollControllerPointerEntered / Exited (ScrollView.cpp:2175-2211).
	function onBarPointerEnter(bar: keyof typeof pointerOver, event: PointerEvent) {
		if (event.pointerType === 'touch') return;
		pointerOver[bar] = true;
		clearTimeout(hideTimer);
	}
	function onBarPointerLeave(bar: keyof typeof pointerOver, event: PointerEvent) {
		if (event.pointerType === 'touch') return;
		pointerOver[bar] = false;
		hideIndicatorsAfter(NO_INDICATOR_COUNTDOWN_MS);
	}
</script>

<!-- ScrollInputHelper::UpdateOutOfBoundsPanSize (ScrollInputHelper.cpp:307) branches on the
     source's effective zoom mode; ParallaxView reads the source through the DOM. -->
<div
	bind:this={ref}
	class={['scroll-view', className]}
	class:disabled
	{style}
	data-horizontal-scroll-mode={horizontalScrollMode}
	data-vertical-scroll-mode={verticalScrollMode}
	data-zoom-mode={zoomMode}
	{...rest}
>
	<!-- The pointer handler only notices a touch or pen contact so that it can stop a running
	     animation; it makes nothing interactive, so the viewport takes no role for it. -->
	<!-- eslint-disable svelte/no-unused-svelte-ignore -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={viewport}
		class="viewport"
		onscroll={onScroll}
		onwheel={onWheel}
		onpointerdown={onPointerDown}
	>
		<!-- eslint-enable svelte/no-unused-svelte-ignore -->
		<!-- ScrollPresenter.cpp:636-644 constrains the opposite axes to their names: Both frees
		     both dimensions while None constrains both, hence the four CSS rules below. -->
		<div bind:this={zoomBox} class="zoom-box" style={zoomBoxStyle}>
			<div
				bind:this={content}
				class="content"
				data-content-orientation={contentOrientation}
				style={contentStyle}
			>
				{@render children?.()}
			</div>
		</div>
	</div>
	{#if verticalBarVisible}
		<!-- The wrapper only notices the pointer over its bar, which holds the indicator up; the bar
		     inside is what takes input, so the wrapper takes no role. -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class:with-horizontal={horizontalBarVisible}
			class="bar-wrapper vertical"
			data-indicator={indicator}
			data-fading={fading || undefined}
			onpointerenter={(event) => onBarPointerEnter('vertical', event)}
			onpointerleave={(event) => onBarPointerLeave('vertical', event)}
		>
			<ScrollBar
				value={scrollTop}
				minimum={0}
				maximum={scrollableHeight}
				viewportSize={viewportHeight}
				indicatorMode={indicator}
				{disabled}
				onValueChange={(value) => {
					stopAnimation();
					scrollVertically(value);
				}}
			/>
		</div>
	{/if}
	{#if horizontalBarVisible}
		<!-- As the vertical wrapper above. -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class:with-vertical={verticalBarVisible}
			class="bar-wrapper horizontal"
			data-indicator={indicator}
			data-fading={fading || undefined}
			onpointerenter={(event) => onBarPointerEnter('horizontal', event)}
			onpointerleave={(event) => onBarPointerLeave('horizontal', event)}
		>
			<ScrollBar
				orientation="horizontal"
				value={scrollLeft}
				minimum={0}
				maximum={scrollableWidth}
				viewportSize={viewportWidth}
				indicatorMode={indicator}
				{disabled}
				onValueChange={(value) => {
					stopAnimation();
					scrollHorizontally(value);
				}}
			/>
		</div>
	{/if}
	{#if verticalBarVisible && horizontalBarVisible}
		<!-- ScrollView.cpp:1701-1705 creates this only with both bars. Its theme token is transparent
		     in every shipped theme, but the element occupies the overlaid corner. -->
		<div class="separator"></div>
	{/if}
</div>

<style>
	.scroll-view {
		/* A one-cell grid rather than a positioned box with an absolute viewport. Upstream's
		   ScrollView measures to its content when nothing constrains it (ScrollPresenter.cpp:636-667
		   measures the unconstrained axis at infinity and the presenter reports that as its desired
		   size), and an absolutely positioned viewport contributes no height at all — a consumer
		   who writes no size would get a box of zero. The grid item carries the height instead, so
		   an unconstrained ScrollView is as tall as what it holds and a sized one fills its box. */
		display: grid;
		position: relative;
		overflow: hidden;
		border-radius: var(--winui-ControlCornerRadius);
	}
	.viewport {
		/* This class is this component's own, and a `class` a caller passes lands on the root
		   *without* a scope hash — so a caller that passes `class="viewport"` is styled by this
		   rule as well, and its root stops being `overflow: hidden`. Four controls did exactly
		   that; ParallaxView found it, because the first overflow box under a ListView was then
		   the ScrollView's root rather than the box that scrolls.

		   `min-*: 0`, because a grid item's automatic minimum size is its content and would stop the
		   viewport from ever being smaller than what it scrolls. */
		min-width: 0;
		min-height: 0;
		overflow: auto;
		scrollbar-width: none;
	}
	.scroll-view[data-horizontal-scroll-mode='disabled'] .viewport,
	.scroll-view.disabled .viewport {
		overflow-x: hidden;
	}
	.scroll-view[data-vertical-scroll-mode='disabled'] .viewport,
	.scroll-view.disabled .viewport {
		overflow-y: hidden;
	}

	.zoom-box {
		/* The box the zoom scales into, and at a factor of one it must be the viewport exactly.
		   Without these two the content's `height: 100%` — which is how `none` and `horizontal`
		   give the content the viewport's size on the axis they constrain — would resolve against
		   an auto-height parent and mean nothing: measured on the guest, a `none` box whose content
		   was 600 tall reported the content itself as 647 rather than 200. What upstream constrains
		   is the size the content is *measured* with (ScrollPresenter.cpp:636-644), not what a child
		   that cannot shrink then overflows by, and that is what these two reproduce. At a factor
		   above one the inline width and height override both. */
		width: 100%;
		height: 100%;
	}

	.content {
		/* A formatting-context root, because a XAML margin adds and a CSS margin collapses: a
		   child's top margin otherwise escapes this box, pushes the content down inside a
		   constrained axis, and makes an Auto bar appear on an axis upstream does not scroll.
		   Measured on the guest: fourteen pixels of paragraph margin turned `horizontal` and
		   `none` into two-bar rows. */
		display: flow-root;
	}
	.content[data-content-orientation='vertical'] {
		width: 100%;
		height: max-content;
	}
	.content[data-content-orientation='horizontal'] {
		width: max-content;
		height: 100%;
	}
	.content[data-content-orientation='both'] {
		width: max-content;
		height: max-content;
	}
	.content[data-content-orientation='none'] {
		width: 100%;
		height: 100%;
	}

	/* ScrollView.xaml:146-161 overlays a two-by-two grid. ScrollBarSize is 12
	   (ScrollBar_themeresources.xaml:180) and the template margin is 1 on both sides.

	   WD-036: the wrapper is a sibling of the viewport rather than a child of it, so a wheel over
	   the bar reaches a root whose overflow is hidden and scrolls nothing, where Windows scrolls
	   the content. */
	.bar-wrapper {
		position: absolute;
		box-sizing: border-box;
		padding: var(--winui-ScrollViewScrollBarsMargin);
	}
	/* The bar's mouse roots are `IsHitTestVisible="False"` (ScrollBar_themeresources.xaml:672,
	   694) until the `MouseIndicator` state sets them True (:459-460), so only the mouse indicator
	   takes the pointer. The panning indicator's 2px thumb is a filled Border upstream (:714) and
	   would take a press on it; that strip is not reproduced. At rest, under the touch indicator
	   and while fading, a press reaches the
	   content beneath, and a touch pan that starts over the bar pans the content. */
	.bar-wrapper:not([data-indicator='mouse']),
	.bar-wrapper[data-fading] {
		pointer-events: none;
	}
	.bar-wrapper[data-fading] {
		opacity: 0;
		transition: opacity var(--winui-ScrollBarOpacityChangeDuration) linear;
	}
	.bar-wrapper.vertical {
		top: 0;
		right: 0;
		bottom: 0;
		width: calc(var(--winui-ScrollBarSize) + var(--winui-ScrollViewScrollBarsMargin) * 2);
	}
	.bar-wrapper.vertical.with-horizontal {
		bottom: calc(var(--winui-ScrollBarSize) + var(--winui-ScrollViewScrollBarsMargin) * 2);
	}
	.bar-wrapper.horizontal {
		left: 0;
		right: 0;
		bottom: 0;
		height: calc(var(--winui-ScrollBarSize) + var(--winui-ScrollViewScrollBarsMargin) * 2);
	}
	.bar-wrapper.horizontal.with-vertical {
		right: calc(var(--winui-ScrollBarSize) + var(--winui-ScrollViewScrollBarsMargin) * 2);
	}
	.separator {
		position: absolute;
		right: 0;
		bottom: 0;
		width: calc(var(--winui-ScrollBarSize) + var(--winui-ScrollViewScrollBarsMargin) * 2);
		height: calc(var(--winui-ScrollBarSize) + var(--winui-ScrollViewScrollBarsMargin) * 2);
		background-color: var(--winui-ScrollViewScrollBarsSeparatorBackground);
	}
</style>
