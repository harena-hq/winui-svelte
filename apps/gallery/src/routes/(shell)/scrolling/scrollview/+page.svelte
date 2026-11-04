<script lang="ts">
	import {
		Button,
		ComboBox,
		NumberBox,
		ScrollAnimation,
		ScrollView,
		type ComboBoxProps,
		type ScrollViewProps,
		type ScrollingScrollAnimationStartingEventArgs
	} from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf, textOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	type ZoomModeName = 'Enabled' | 'Disabled';
	type ScrollModeName = 'Enabled' | 'Disabled' | 'Auto';
	type ScrollBarVisibilityName = 'Auto' | 'Visible' | 'Hidden';

	const item = itemOf('/scrolling/scrollview');
	if (item === null) throw new Error('ScrollView page has no Gallery item');
	const contentSample = sampleOf('ScrollView/ContentInsideScrollview.txt');
	const velocitySample = sampleOf('ScrollView/ScrollViewConstantVelocityScrolling.txt');
	const animationSample = sampleOf('ScrollView/ScrollViewProgrammaticScrollCustomAnimation.txt');
	const ZOOM_MODES: Record<ZoomModeName, NonNullable<ScrollViewProps['zoomMode']>> = {
		Enabled: 'enabled',
		Disabled: 'disabled'
	};
	const SCROLL_MODES: Record<
		ScrollModeName,
		NonNullable<ScrollViewProps['horizontalScrollMode']>
	> = {
		Enabled: 'enabled',
		Disabled: 'disabled',
		Auto: 'auto'
	};
	const SCROLL_BAR_VISIBILITIES: Record<
		ScrollBarVisibilityName,
		NonNullable<ScrollViewProps['horizontalScrollBarVisibility']>
	> = {
		Auto: 'auto',
		Visible: 'visible',
		Hidden: 'hidden'
	};
	const zoomModeItems: ComboBoxProps['items'] = Object.keys(ZOOM_MODES).map((value) => ({
		value,
		label: value
	}));
	const scrollModeItems: ComboBoxProps['items'] = Object.keys(SCROLL_MODES).map((value) => ({
		value,
		label: value
	}));
	const scrollBarVisibilityItems: ComboBoxProps['items'] = Object.keys(SCROLL_BAR_VISIBILITIES).map(
		(value) => ({ value, label: value })
	);
	const VELOCITY_IMAGES = ['grapes', 'rainier', 'sunset', 'treetops', 'valley', 'cliff'];
	const ANIMATION_IMAGES = Array.from({ length: 8 }, (_, index) => `LandscapeImage${index + 1}`);

	let zoomMode = $state<ZoomModeName>('Enabled');
	let zoomFactor = $state<number | null>(4);
	let horizontalScrollMode = $state<ScrollModeName>('Auto');
	let verticalScrollMode = $state<ScrollModeName>('Auto');
	let horizontalScrollBarVisibility = $state<ScrollBarVisibilityName>('Auto');
	let verticalScrollBarVisibility = $state<ScrollBarVisibilityName>('Auto');
	let verticalVelocity = $state<number | null>(30);
	let animation = $state('Default');
	let animationDuration = $state<number | null>(1500);

	let velocityView = $state<ReturnType<typeof ScrollView>>();
	let velocityOffset = $state(0);
	let velocityScrollable = $state(0);
	// The NumberBox value the handler last saw, which is upstream's `e.OldValue`.
	let previousVelocity = 30;
	// Upstream writes the box from inside its own ValueChanged, which raises the event again with
	// a velocity of 30 or -30. That nested run cancels and adds a velocity at the interaction
	// tracker's minimum; on the reference, stepping down from 40 that way left the view still, and
	// this library's addScrollVelocity moves nothing at 30 or under, so the nested run is skipped.
	let applyingVelocity = false;

	// ScrollViewPage.xaml.cs, NbVerticalVelocity_ValueChanged.
	function onVerticalVelocityChange(next: number | null) {
		if (applyingVelocity || next === null || !velocityView) return;
		const old = previousVelocity;
		// Cancel previous constant scroll velocity.
		velocityView.scrollBy(0, 0, { animationMode: 'disabled', snapPointsMode: 'ignore' });
		let velocity = next;
		if (next <= 30 && next >= -30) {
			// Only a value smaller than -30 or greater than 30 triggers a scroll.
			if (next < old) velocity = velocityOffset === 0 ? 30 : -30;
			else velocity = velocityOffset === velocityScrollable ? -30 : 30;
		} else if (next < 30 && velocityOffset === 0) {
			velocity = 30;
		} else if (next > 30 && velocityOffset === velocityScrollable) {
			velocity = -30;
		}
		previousVelocity = velocity;
		applyingVelocity = true;
		verticalVelocity = velocity;
		applyingVelocity = false;
		// An empty inertia decay rate, for a constant velocity.
		velocityView.addScrollVelocity({ x: 0, y: velocity }, { x: 0, y: 0 });
	}

	let animationView = $state<ReturnType<typeof ScrollView>>();
	let animationHorizontal = $state(0);
	let animationVertical = $state(0);
	let animationScrollable = $state(0);

	// ScrollViewPage.xaml.cs, GetTargetVerticalOffset.
	function targetVerticalOffset() {
		return animationVertical > animationScrollable / 2
			? animationScrollable / 5
			: (4 * animationScrollable) / 5;
	}

	// ScrollViewPage.xaml.cs, BtnScrollWithAnimation_Click.
	function scrollWithAnimation() {
		animationView?.scrollTo(animationHorizontal, targetVerticalOffset(), {
			animationMode: 'enabled',
			snapPointsMode: 'ignore'
		});
	}

	// ScrollViewPage.xaml.cs, ScrollView_ScrollAnimationStarting.
	function onScrollAnimationStarting(args: ScrollingScrollAnimationStartingEventArgs) {
		// Upstream's TimeSpan.FromMilliseconds would throw on an empty box; this keeps the stock
		// duration instead.
		if (animationDuration === null) return;
		if (animation === 'Default') {
			args.animation.duration = animationDuration;
			return;
		}
		const target = targetVerticalOffset();
		const custom = new ScrollAnimation();
		if (animation === 'Accordion') {
			let delta = 0.1 * (target - animationVertical);
			for (let step = 0; step < 3; step++) {
				custom.insertKeyFrame(1 - 0.4 / Math.pow(2, step), {
					x: animationHorizontal,
					y: target + delta
				});
				delta /= -2;
			}
			custom.insertKeyFrame(1, { x: animationHorizontal, y: target });
		} else {
			// Teleportation.
			const delta = target - animationVertical;
			custom.insertKeyFrame(
				0.499999,
				{ x: animationHorizontal, y: target - 0.9 * delta },
				{ type: 'cubic-bezier', controlPoint1: { x: 1, y: 0 }, controlPoint2: { x: 1, y: 0 } }
			);
			custom.insertKeyFrame(
				0.5,
				{ x: animationHorizontal, y: target - 0.1 * delta },
				{ type: 'step', stepCount: 1 }
			);
			custom.insertKeyFrame(
				1,
				{ x: animationHorizontal, y: target },
				{ type: 'cubic-bezier', controlPoint1: { x: 0, y: 1 }, controlPoint2: { x: 0, y: 1 } }
			);
		}
		custom.duration = animationDuration;
		args.animation = custom;
	}

	// ScrollViewPage.xaml.cs, UpdateExample3Content: the C# tab shows the chosen animation's sample
	// with the box's duration written into it. C#'s double.ToString gives "NaN" for an empty box.
	const ANIMATION_SAMPLES: Record<string, string> = {
		Default: 'SampleCode/ScrollView/ScrollViewSample3_DefaultAnimation_cs.txt',
		Accordion: 'SampleCode/ScrollView/ScrollViewSample3_AccordionAnimation_cs.txt',
		Teleportation: 'SampleCode/ScrollView/ScrollViewSample3_TeleportationAnimation_cs.txt'
	};
	const animationCsharp = $derived(
		textOf(ANIMATION_SAMPLES[animation]).replaceAll(
			'nbAnimationDuration.Value',
			animationDuration === null ? 'NaN' : String(animationDuration)
		)
	);
</script>

<ItemPage {item}>
	<ControlExample
		headerText={contentSample.header ?? undefined}
		xaml={contentSample.xaml ?? undefined}
		substitutions={{
			ZoomMode: zoomMode,
			HorizontalScrollMode: horizontalScrollMode,
			HorizontalScrollBarVisibility: horizontalScrollBarVisibility,
			VerticalScrollMode: verticalScrollMode,
			VerticalScrollBarVisibility: verticalScrollBarVisibility
		}}
	>
		<!-- ScrollViewPage.xaml:18-176. -->
		<div class="sample-stack" data-vertical-alignment="top">
			<p class="winui-BodyTextBlockStyle description">
				This ScrollView allows horizontal and vertical scrolling, as well as zooming. Change the
				settings on the right to alter those capabilities or the built-in scrollbars' visibility.
			</p>
			<ScrollView
				contentOrientation="none"
				horizontalScrollMode={SCROLL_MODES[horizontalScrollMode]}
				horizontalScrollBarVisibility={SCROLL_BAR_VISIBILITIES[horizontalScrollBarVisibility]}
				verticalScrollMode={SCROLL_MODES[verticalScrollMode]}
				verticalScrollBarVisibility={SCROLL_BAR_VISIBILITIES[verticalScrollBarVisibility]}
				zoomMode={ZOOM_MODES[zoomMode]}
				zoomFactor={zoomFactor ?? 0.1}
				style="width: 400px; height: 266px"
			>
				<div class="centered-image">
					<img src="/cliff.jpg" alt="cliff" />
				</div>
			</ScrollView>
		</div>
		{#snippet options()}
			<div class="options-grid">
				<!-- ScrollViewPage.xaml:42-166. -->
				<span class="option-label">ZoomMode</span>
				<ComboBox items={zoomModeItems} bind:value={zoomMode} />
				<span class="option-label">ZoomFactor</span>
				<NumberBox
					min={0.1}
					max={10}
					step={1}
					spinButtonPlacementMode="inline"
					bind:value={zoomFactor}
				/>
				<span class="option-section">ScrollMode</span>
				<span class="option-label">Horizontal</span>
				<ComboBox items={scrollModeItems} bind:value={horizontalScrollMode} />
				<span class="option-label">Vertical</span>
				<ComboBox items={scrollModeItems} bind:value={verticalScrollMode} />
				<span class="option-section">ScrollbarVisibility</span>
				<span class="option-label">Horizontal</span>
				<ComboBox items={scrollBarVisibilityItems} bind:value={horizontalScrollBarVisibility} />
				<span class="option-label">Vertical</span>
				<ComboBox items={scrollBarVisibilityItems} bind:value={verticalScrollBarVisibility} />
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={velocitySample.header ?? undefined}
		xaml={velocitySample.xaml ?? undefined}
	>
		<!-- ScrollViewPage.xaml:177-243. -->
		<div class="sample-stack" data-vertical-alignment="top">
			<p class="winui-BodyTextBlockStyle description">
				Set the vertical velocity to a value greater than 30 to scroll down, or a value smaller than
				-30 to scroll up at a constant speed.
			</p>
			<ScrollView
				bind:this={velocityView}
				bind:verticalOffset={velocityOffset}
				bind:scrollableHeight={velocityScrollable}
				style="width: 400px; height: 300px"
			>
				<div class="image-column">
					{#each VELOCITY_IMAGES as image (image)}
						<img src={`/${image}.jpg`} alt={image} />
					{/each}
				</div>
			</ScrollView>
		</div>
		{#snippet options()}
			<div class="options-grid one-row">
				<span class="option-label">Vertical velocity</span>
				<NumberBox
					min={-200}
					max={200}
					step={10}
					spinButtonPlacementMode="inline"
					bind:value={verticalVelocity}
					onValueChange={onVerticalVelocityChange}
				/>
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={animationSample.header ?? undefined}
		xaml={animationSample.xaml ?? undefined}
		csharp={animationCsharp}
	>
		<!-- ScrollViewPage.xaml:244-344. -->
		<div class="sample-stack" data-vertical-alignment="top">
			<p class="winui-BodyTextBlockStyle description">
				Pick an animation type and its duration and then click the button on the right to launch a
				programmatic scroll.
			</p>
			<ScrollView
				bind:this={animationView}
				bind:horizontalOffset={animationHorizontal}
				bind:verticalOffset={animationVertical}
				bind:scrollableHeight={animationScrollable}
				{onScrollAnimationStarting}
				style="width: 400px; height: 300px"
			>
				<div class="image-column">
					{#each ANIMATION_IMAGES as image (image)}
						<img src={`/${image}.jpg`} alt={image} />
					{/each}
				</div>
			</ScrollView>
		</div>
		{#snippet options()}
			<div class="options-grid animation-options">
				<span class="option-label">Scroll with animation</span>
				<ComboBox
					items={['Default', 'Accordion', 'Teleportation'].map((value) => ({
						value,
						label: value
					}))}
					bind:value={animation}
				/>
				<span class="option-label">Animation duration (msec)</span>
				<NumberBox
					min={1000}
					max={5000}
					step={500}
					spinButtonPlacementMode="inline"
					bind:value={animationDuration}
				/>
				<Button class="animation-button" onclick={scrollWithAnimation}>Scroll with animation</Button
				>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	.sample-stack {
		display: flex;
		flex-direction: column;
		gap: 16px; /* c1-allow: ScrollViewPage.xaml:19, :178, :245 — StackPanel Spacing="16". */
	}

	.description {
		/* The original's TextBlock is `TextWrapping="Wrap"` with no width of its own
		   (ScrollViewPage.xaml:20-22), so it wraps at the display pane rather than at the sample. */
		margin: 0;
	}

	.centered-image {
		display: grid;
		width: 100%;
		height: 100%;
		place-items: center;
	}

	.centered-image img {
		display: block;
	}

	.image-column img {
		display: block;
		width: 100%;
		height: auto;
	}

	.options-grid {
		display: grid;
		min-width: 200px;
		grid-template-columns: auto minmax(0, 1fr);
		column-gap: 12px; /* c1-allow: ScrollViewPage.xaml:45 — ColumnSpacing="12". */
		row-gap: 16px; /* c1-allow: ScrollViewPage.xaml:47 — RowSpacing="16". */
		align-items: center;
	}

	.option-section {
		grid-column: 1 / -1;
		justify-self: center;
	}

	.animation-options {
		min-width: 320px; /* c1-allow: ScrollViewPage.xaml:299 — MinWidth="320". */
	}

	:global(.animation-button) {
		grid-column: 1 / -1;
	}
</style>
