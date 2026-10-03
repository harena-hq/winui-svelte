<script lang="ts">
	import { onMount } from 'svelte';
	import {
		ScrollAnimation,
		ScrollView,
		type ScrollingScrollAnimationStartingEventArgs,
		type ScrollingScrollOptions
	} from 'winui-svelte/preview';

	/** Drives ScrollView's scrollTo, scrollBy and addScrollVelocity from tests through
	 * window.harness, and records each animation-starting event. */
	interface Harness {
		requestedAt: number;
		lastFrame: number;
		starting: Array<{
			duration: number;
			keyFrameCount: number;
			startPosition: { x: number; y: number };
			endPosition: { x: number; y: number };
			correlationId: number;
		}>;
		onStarting: ((args: ScrollingScrollAnimationStartingEventArgs) => void) | null;
		ScrollAnimation: typeof ScrollAnimation;
		scrollTo(x: number, y: number, options?: ScrollingScrollOptions): number;
		scrollBy(x: number, y: number, options?: ScrollingScrollOptions): number;
		addScrollVelocity(
			velocity: { x: number; y: number },
			decay?: { x: number; y: number } | null
		): number;
	}

	const BLOCKS = [1, 2, 3, 4, 5, 6, 7, 8];
	let view = $state<ReturnType<typeof ScrollView>>();
	let verticalOffset = $state(0);
	let ticking = false;
	const tick = () => {
		harness.lastFrame = performance.now();
		requestAnimationFrame(tick);
	};
	const harness: Harness = {
		requestedAt: 0,
		lastFrame: 0,
		starting: [],
		onStarting: null,
		ScrollAnimation,
		scrollTo(x, y, options) {
			harness.requestedAt = performance.now();
			if (!ticking) {
				ticking = true;
				requestAnimationFrame(tick);
			}
			return view!.scrollTo(x, y, options);
		},
		scrollBy(x, y, options) {
			harness.requestedAt = performance.now();
			if (!ticking) {
				ticking = true;
				requestAnimationFrame(tick);
			}
			return view!.scrollBy(x, y, options);
		},
		addScrollVelocity(velocity, decay) {
			harness.requestedAt = performance.now();
			if (!ticking) {
				ticking = true;
				requestAnimationFrame(tick);
			}
			return view!.addScrollVelocity(velocity, decay);
		}
	};

	function onScrollAnimationStarting(args: ScrollingScrollAnimationStartingEventArgs) {
		harness.starting.push({
			duration: args.animation.duration,
			keyFrameCount: args.animation.keyFrameCount,
			startPosition: { ...args.startPosition },
			endPosition: { ...args.endPosition },
			correlationId: args.correlationId
		});
		harness.onStarting?.(args);
	}

	onMount(() => {
		Object.assign(window, { harness });
	});
</script>

<svelte:head><title>ScrollView scroll — harness</title></svelte:head>
<h1 class="winui-TitleTextBlockStyle">ScrollView — scroll</h1>
<ScrollView
	bind:this={view}
	bind:verticalOffset
	id="sv"
	style="width: 400px; height: 300px"
	{onScrollAnimationStarting}
>
	{#each BLOCKS as block (block)}
		<div class="block">{block}</div>
	{/each}
</ScrollView>
<output id="offset">{verticalOffset}</output>

<style>
	/* c1-allow: the eight 268px blocks make an extent of 2144 against a 300px viewport. */
	.block {
		height: 268px;
	}
</style>
