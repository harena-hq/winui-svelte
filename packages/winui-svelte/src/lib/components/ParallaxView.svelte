<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ParallaxViewProps {
		/** ParallaxView.Child, the content property. */
		children?: Snippet;
		/** ParallaxView.Source. */
		source?: HTMLElement | null;
		/** ParallaxView.HorizontalShift. */
		horizontalShift?: number;
		/** ParallaxView.VerticalShift. */
		verticalShift?: number;
		/** ParallaxView.IsHorizontalShiftClamped. */
		horizontalShiftClamped?: boolean;
		/** ParallaxView.IsVerticalShiftClamped. */
		verticalShiftClamped?: boolean;
		/** ParallaxView.MaxHorizontalShiftRatio. */
		maxHorizontalShiftRatio?: number;
		/** ParallaxView.MaxVerticalShiftRatio. */
		maxVerticalShiftRatio?: number;
		/** ParallaxView.HorizontalSourceStartOffset. */
		horizontalSourceStartOffset?: number;
		/** ParallaxView.HorizontalSourceEndOffset. */
		horizontalSourceEndOffset?: number;
		/** ParallaxView.VerticalSourceStartOffset. */
		verticalSourceStartOffset?: number;
		/** ParallaxView.VerticalSourceEndOffset. */
		verticalSourceEndOffset?: number;
		/** ParallaxView.HorizontalSourceOffsetKind. */
		horizontalSourceOffsetKind?: 'absolute' | 'relative';
		/** ParallaxView.VerticalSourceOffsetKind. */
		verticalSourceOffsetKind?: 'absolute' | 'relative';
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		/** The ParallaxView root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	/** RefreshAutomaticHorizontalOffsets and RefreshAutomaticVerticalOffsets are absent because this
	 * implementation re-measures through ResizeObserver whenever its layout changes. */
</script>

<script lang="ts">
	type Axis = 'horizontal' | 'vertical';
	type OffsetKind = 'absolute' | 'relative';

	let {
		children,
		source = null,
		horizontalShift = 0,
		verticalShift = 0,
		horizontalShiftClamped = true,
		verticalShiftClamped = true,
		maxHorizontalShiftRatio = 1,
		maxVerticalShiftRatio = 1,
		horizontalSourceStartOffset = 0,
		horizontalSourceEndOffset = 0,
		verticalSourceStartOffset = 0,
		verticalSourceEndOffset = 0,
		horizontalSourceOffsetKind: horizontalOffsetKind = 'relative',
		verticalSourceOffsetKind: verticalOffsetKind = 'relative',
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ParallaxViewProps = $props();

	let root = $derived(ref);
	let rootStyle = $derived.by(() => {
		const shifts = [
			...(horizontalShift === 0
				? []
				: [`--parallax-horizontal-shift: ${Math.abs(horizontalShift)}px`]),
			...(verticalShift === 0 ? [] : [`--parallax-vertical-shift: ${Math.abs(verticalShift)}px`])
		];
		return shifts.length === 0 ? style : `${style ? `${style}; ` : ''}${shifts.join('; ')}`;
	});

	function scrolls(element: Element): boolean {
		const computed = getComputedStyle(element);
		return /^(auto|scroll)$/.test(computed.overflowY) || /^(auto|scroll)$/.test(computed.overflowX);
	}

	function scrollerIn(element: HTMLElement): HTMLElement | null {
		if (scrolls(element)) return element;
		const queue: Element[] = [...element.children];
		while (queue.length > 0) {
			const next = queue.shift()!;
			if (next instanceof HTMLElement && scrolls(next)) return next;
			queue.push(...next.children);
		}
		return null;
	}

	function sourceInput(scroller: HTMLElement) {
		// ScrollView's scrollable viewport is nested under its source root, which owns this marker.
		return scroller.closest<HTMLElement>('[data-scroll-input], [data-zoom-mode]') ?? scroller;
	}

	/** The scroller and every box down to where its content begins.
	 *
	 * A `ResizeObserver` on the viewport does not see content growing inside a fixed viewport,
	 * which is why ScrollView.svelte's `ResizeObserver` observes its own content element beside it.
	 * Here the source is somebody else's control and its content element has no name, so follow the
	 * single-child chain down to the first box that branches. Measured: without this, the
	 * Gallery's first example sat frozen at the offset a zero-extent scroller produces, because
	 * the `ListView`'s rows are laid out after this effect first runs and the only box that
	 * grew with them was three levels below the viewport. */
	function contentChain(scroller: HTMLElement): HTMLElement[] {
		const chain: HTMLElement[] = [scroller];
		let next = scroller;
		while (next.children.length === 1 && next.firstElementChild instanceof HTMLElement) {
			next = next.firstElementChild;
			chain.push(next);
		}
		return chain;
	}

	function offset(
		axis: Axis,
		scroller: HTMLElement,
		rootElement: HTMLDivElement,
		startProp: number,
		endProp: number,
		kind: OffsetKind
	) {
		const viewport = axis === 'vertical' ? scroller.clientHeight : scroller.clientWidth;
		const content = axis === 'vertical' ? scroller.scrollHeight : scroller.scrollWidth;
		const input = sourceInput(scroller);
		// The marker also tells ScrollView it draws the older ScrollViewer, whose press shows no
		// bars; see `drawsScrollViewer` there.
		const pan =
			input.dataset.scrollInput === 'scroll-viewer' &&
			(input.dataset.zoomMode ?? 'disabled') === 'disabled'
				? 0.1 * viewport
				: viewport;
		const targetInSource = scroller.contains(rootElement);
		// Every branch below is upstream's with `* source.<scale>` dropped: WD-052, because a
		// scroll timeline reports CSS-pixel offsets and no zoom factor to scale them by.
		if (kind === 'absolute') {
			return {
				start: startProp,
				end:
					content > viewport
						? endProp <= content - viewport
							? Math.max(0, endProp)
							: Math.max(0, content - viewport) + endProp - content + viewport
						: endProp <= 0
							? Math.max(0, content + endProp - viewport)
							: Math.max(0, content - viewport) + endProp
			};
		}
		if (!targetInSource)
			return {
				start: startProp - pan,
				end: Math.max(0, content + endProp - viewport) + pan
			};
		const contentElement = scroller.firstElementChild ?? scroller;
		const rootRect = rootElement.getBoundingClientRect();
		const contentRect = contentElement.getBoundingClientRect();
		const rootOffset =
			axis === 'vertical' ? rootRect.top - contentRect.top : rootRect.left - contentRect.left;
		const rootSize = axis === 'vertical' ? rootRect.height : rootRect.width;
		return {
			start: rootOffset + startProp - viewport - pan,
			end: rootOffset + rootSize + endProp + pan
		};
	}

	function parallax(
		x: number,
		start: number,
		end: number,
		shift: number,
		clamped: boolean,
		maxRatio: number
	) {
		if (shift === 0) return 0;
		const ratio = Math.max(0, maxRatio);
		if (clamped) {
			if (shift > 0) {
				if (x <= start) return 0;
				if (x < end) return -Math.min(ratio, shift / (end - start)) * (x - start);
				return -Math.min(ratio * Math.max(0, end - start), shift);
			}
			if (x <= start) return -Math.min(ratio * Math.max(0, end - start), -shift);
			if (x < end) return Math.min(ratio, shift / (start - end)) * (x - end);
			return 0;
		}
		if (start === end) return 0;
		return shift > 0
			? -Math.min(ratio, shift / (end - start)) * (x - start)
			: Math.min(ratio, shift / (start - end)) * (x - end);
	}

	$effect(() => {
		const scroller = source ? scrollerIn(source) : null;
		const child = root?.firstElementChild instanceof HTMLElement ? root.firstElementChild : null;
		let horizontalAnimation: Animation | undefined;
		let verticalAnimation: Animation | undefined;
		if (!scroller || !root || !child) {
			child?.style.removeProperty('--parallax-x');
			child?.style.removeProperty('--parallax-y');
			return;
		}
		const scrollerElement = scroller;
		const rootElement = root;
		const childElement = child;

		function applyAxis(
			axis: Axis,
			shift: number,
			clamped: boolean,
			maxRatio: number,
			startProp: number,
			endProp: number,
			kind: OffsetKind
		) {
			const property = axis === 'horizontal' ? '--parallax-x' : '--parallax-y';
			const cancel = axis === 'horizontal' ? horizontalAnimation : verticalAnimation;
			cancel?.cancel();
			if (axis === 'horizontal') horizontalAnimation = undefined;
			else verticalAnimation = undefined;
			childElement.style.removeProperty(property);
			if (shift === 0) return;
			const maxScroll = Math.max(
				0,
				axis === 'vertical'
					? scrollerElement.scrollHeight - scrollerElement.clientHeight
					: scrollerElement.scrollWidth - scrollerElement.clientWidth
			);
			const { start, end } = offset(axis, scrollerElement, rootElement, startProp, endProp, kind);
			const valueAt = (x: number) => parallax(x, start, end, shift, clamped, maxRatio);
			if (maxScroll === 0) {
				childElement.style.setProperty(property, `${valueAt(0)}px`);
				return;
			}
			const breaks = [
				...new Set([0, start, end, maxScroll].filter((value) => value >= 0 && value <= maxScroll))
			].sort((a, b) => a - b);
			const frames = breaks.map((value) => ({
				offset: value / maxScroll,
				[property]: `${valueAt(value)}px`
			}));
			// The value this scroll position already implies, written inline before the animation
			// is created. A scroll-driven animation contributes nothing until its timeline first
			// ticks, so between a re-measure and the next frame the property falls back to its
			// registered `0px` and the child snaps to its untranslated position. That is one frame
			// in use and invisible — and it is the frame the snapshot harness photographed, because
			// it resizes the viewport and shoots, which is exactly a re-measure and a frame. The
			// animation outranks an inline declaration, so it takes the property over unchanged.
			childElement.style.setProperty(
				property,
				`${valueAt(axis === 'vertical' ? scrollerElement.scrollTop : scrollerElement.scrollLeft)}px`
			);
			const animation = childElement.animate(frames, {
				timeline: new ScrollTimeline({
					source: scrollerElement,
					axis: axis === 'horizontal' ? 'inline' : 'block'
				}),
				fill: 'both'
			});
			if (axis === 'horizontal') horizontalAnimation = animation;
			else verticalAnimation = animation;
		}

		function apply() {
			applyAxis(
				'horizontal',
				horizontalShift,
				horizontalShiftClamped,
				maxHorizontalShiftRatio,
				horizontalSourceStartOffset,
				horizontalSourceEndOffset,
				horizontalOffsetKind
			);
			applyAxis(
				'vertical',
				verticalShift,
				verticalShiftClamped,
				maxVerticalShiftRatio,
				verticalSourceStartOffset,
				verticalSourceEndOffset,
				verticalOffsetKind
			);
		}

		const observer = new ResizeObserver(apply);
		for (const box of contentChain(scrollerElement)) observer.observe(box);
		apply();
		return () => {
			observer.disconnect();
			horizontalAnimation?.cancel();
			verticalAnimation?.cancel();
			childElement.style.removeProperty('--parallax-x');
			childElement.style.removeProperty('--parallax-y');
		};
	});
</script>

<div
	bind:this={ref}
	class={['parallax-view', className]}
	style={rootStyle}
	data-horizontal-shift={horizontalShift === 0 ? undefined : ''}
	data-vertical-shift={verticalShift === 0 ? undefined : ''}
	{...rest}
>
	{@render children?.()}
</div>

<style>
	/* The child translations are separate registered properties because the axes have independent
	   scroll timelines. Registered lengths interpolate as lengths rather than strings. */
	@property --parallax-x {
		syntax: '<length>';
		inherits: false;
		initial-value: 0px;
	}
	@property --parallax-y {
		syntax: '<length>';
		inherits: false;
		initial-value: 0px;
	}

	.parallax-view {
		/* ArrangeOverride (ParallaxView.cpp:111-176) centres a smaller child and anchors a larger
		   one at the start while clipping to this arrange rect. */
		display: flex;
		align-items: safe center;
		justify-content: safe center;
		overflow: hidden;
	}
	.parallax-view > :global(*) {
		flex: none;
		/* This `translate` lifts the child into the positioned-descendant paint step, so anything a
		   consumer stacks over a ParallaxView has to be in that step too — `position` it, or it
		   paints underneath however late it comes in the tree. */
		translate: var(--parallax-x) var(--parallax-y);
	}
	/* MeasureOverride (ParallaxView.cpp:58-77) measures the child against the box grown by the
	   shift, and ArrangeOverride (`:88-109`) then guarantees the child exceeds the box by at
	   least that shift, expanding the other axis by the same ratio when the child is unsized and
	   stretched. For a replaced element that whole rule is CSS's own min/max constraint table,
	   which scales the other dimension to keep the aspect: measured, a 400x266 image in an
	   800x300 box came out 1203x800, and on the Gallery page 1703.75x1133 against the original's
	   1707x1135. */
	.parallax-view[data-horizontal-shift] > :global(*) {
		min-width: calc(100% + var(--parallax-horizontal-shift));
	}
	.parallax-view[data-vertical-shift] > :global(*) {
		min-height: calc(100% + var(--parallax-vertical-shift));
	}
</style>
