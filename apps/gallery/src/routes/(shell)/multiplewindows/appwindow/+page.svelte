<script lang="ts">
	import {
		Button,
		ComboBox,
		InfoBar,
		NumberBox,
		Paragraph,
		RichTextBlock,
		Run,
		TextBox,
		ToggleSwitch,
		ToolTip,
		type ComboBoxItemData
	} from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/multiplewindows/appwindow');
	if (item === null) throw new Error('AppWindow page has no Gallery item');

	const creatingSample = sampleOf('AppWindow/CreatingCustomizingAppwindowWindow.txt');
	const centeringSample = sampleOf('AppWindow/CenteringAppwindowScreenAvailable.txt');
	const overlappedSample = sampleOf('AppWindow/AppwindowOverlapedpresenter.txt');
	const sizingSample = sampleOf('AppWindow/AppWindowSettingMinimumMaximumWidth.txt');
	const modalSample = sampleOf('AppWindow/ModalWindowOverlappedpresenterAppwindow.txt');
	const fullscreenSample = sampleOf('AppWindow/AppwindowFullscreenpresenter.txt');
	const compactOverlaySample = sampleOf('AppWindow/AppwindowCompactoverlaypresenter.txt');

	let windowTitle = $state('This is a title');
	let windowWidth = $state<number | null>(800);
	let windowHeight = $state<number | null>(500);
	let windowX = $state<number | null>(50);
	let windowY = $state<number | null>(50);

	let isAlwaysOnTop = $state(false);
	let isMaximizable = $state(true);
	let isMinimizable = $state(true);
	let isResizable = $state(true);
	let hasBorder = $state(true);
	let hasTitleBar = $state(true);

	let preferredMinimumWidth = $state<number | null>(400);
	let preferredMinimumHeight = $state<number | null>(400);
	let preferredMaximumWidth = $state<number | null>(1000);
	let preferredMaximumHeight = $state<number | null>(1000);

	const initialSizeItems: ComboBoxItemData[] = [
		{ value: 'Small', label: 'Small' },
		{ value: 'Medium', label: 'Medium' },
		{ value: 'Large', label: 'Large' }
	];
	let initialSize = $state('Small');
	const initialSizePercentage = $derived(
		initialSize === 'Small' ? '5%' : initialSize === 'Medium' ? '15%' : '25%'
	);

	const creatingSubstitutions = $derived({
		WindowTitle: windowTitle,
		Width: String(windowWidth),
		Height: String(windowHeight),
		X: String(windowX),
		Y: String(windowY)
	});
	const overlappedSubstitutions = $derived({
		IsAlwaysOnTop: String(isAlwaysOnTop),
		IsMaximizable: String(isMaximizable),
		IsMinimizable: String(isMinimizable),
		IsResizable: String(isResizable),
		HasBorder: String(hasBorder),
		HasTitleBar: String(hasTitleBar)
	});
	const compactOverlaySubstitutions = $derived({ InitialSize: initialSize });

	function setHasBorder(checked: boolean) {
		hasBorder = checked;
		// AppWindowPage.xaml.cs:41-47 — a title bar is not allowed without a border.
		if (!checked) hasTitleBar = false;
	}

	function setHasTitleBar(checked: boolean) {
		hasTitleBar = checked;
		// AppWindowPage.xaml.cs:49-55 — enabling the title bar also enables its border.
		if (checked) hasBorder = true;
	}
</script>

<ItemPage {item}>
	<!-- AppWindowPage.xaml:12-15. SubtitleHeadingTextBlockStyle is
	     SubtitleTextBlockStyle plus HeadingLevel="Level2" (WinUIGallery/Styles/TextBlock.xaml:9-14),
	     and the native h2 supplies that heading level here. -->
	<h2 class="winui-SubtitleTextBlockStyle section">General usage of AppWindow</h2>

	<ControlExample
		headerText={creatingSample.header ?? undefined}
		xaml={creatingSample.xaml ?? undefined}
		csharp={creatingSample.csharp ?? undefined}
		substitutions={creatingSubstitutions}
	>
		<!-- WD-065. AppWindowPage.xaml.cs:17-21 would open and activate SampleWindow1. -->
		<Button>Show window</Button>
		{#snippet options()}
			<!-- AppWindowPage.xaml:24-89 — StackPanel Spacing="8". -->
			<div class="options-column">
				<span class="winui-BodyStrongTextBlockStyle">Window title</span>
				<TextBox bind:value={windowTitle} placeholder="Enter window title" style="width: 100%" />
				<span class="winui-BodyStrongTextBlockStyle">Window size</span>
				<div class="pair">
					<!-- AppWindowPage.xaml:38-58. LargeChange="100" on this and the other three inline boxes has no
					     NumberBox prop and changes no resting-state pixels. -->
					<NumberBox
						header="Width"
						min={200}
						max={1000}
						step={10}
						spinButtonPlacementMode="inline"
						bind:value={windowWidth}
						style="margin-right: 8px"
					/>
					<NumberBox
						header="Height"
						min={200}
						max={700}
						step={10}
						spinButtonPlacementMode="inline"
						bind:value={windowHeight}
					/>
				</div>
				<!-- AppWindowPage.xaml:61-61 spells "postion"; this is the source's text, not a local typo. -->
				<span class="winui-BodyStrongTextBlockStyle">Window postion</span>
				<div class="pair">
					<NumberBox
						header="X"
						min={0}
						max={800}
						step={10}
						spinButtonPlacementMode="inline"
						bind:value={windowX}
						style="margin-right: 8px"
					/>
					<NumberBox
						header="Y"
						min={0}
						max={300}
						step={10}
						spinButtonPlacementMode="inline"
						bind:value={windowY}
					/>
				</div>
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={centeringSample.header ?? undefined}
		xaml={centeringSample.xaml ?? undefined}
		csharp={centeringSample.csharp ?? undefined}
	>
		<!-- WD-065. AppWindowPage.xaml.cs:23-27 would open and activate SampleWindow2. -->
		<Button>Show centered sample window</Button>
	</ControlExample>

	<!-- AppWindowPage.xaml:109-112; the h2 carries SubtitleHeadingTextBlockStyle's semantic
	     heading level directly, as described above. -->
	<h2 class="winui-SubtitleTextBlockStyle section presenters">AppWindow Presenters</h2>

	<ControlExample
		headerText={overlappedSample.header ?? undefined}
		xaml={overlappedSample.xaml ?? undefined}
		csharp={overlappedSample.csharp ?? undefined}
		substitutions={overlappedSubstitutions}
	>
		<!-- AppWindowPage.xaml:116-139 — StackPanel Spacing="8". -->
		<div class="example-column">
			<p class="winui-BodyTextBlockStyle">
				OverlappedPresenter is the default presenter for AppWindow, providing a standard resizable
				window with system buttons. It is used for typical app windows and can be customized to
				control resizing and button visibility.
			</p>
			<InfoBar severity="warning" title="Warning" closable={false}>
				<!-- AppWindowPage.xaml:123-136. The missing spaces are the original's own: it writes
				     `For an<Run …>` with nothing between the text and the Run, so nothing is there to
				     collapse into a space, while a newline before the next inline collapses into one.
				     Measured on the reference guest and not a transcription error.

				     Margin="0,-16,16,16" is XAML's left,top,right,bottom. The page carried it in a
				     class that lost the cascade to `.example-column p`, so it was rendering as zero;
				     an inline style on the control cannot lose it. -->
				<RichTextBlock
					class="winui-BodyTextBlockStyle"
					textSelectionEnabled={false}
					style="margin: -16px 16px 16px 0"
					><Paragraph
						><Run text="For an" /><Run fontWeight={600} text="AppWindow" /><Run text=" with" /><Run
							fontWeight={600}
							text="OverlappedPresenter"
						/><Run text=" , if the title bar (" /><Run
							fontWeight={600}
							text="HasTitleBar = true"
						/><Run text=" ) is enabled, the window must have a border (" /><Run
							fontWeight={600}
							text="HasBorder = true"
						/><Run text=" ). Setting" /><Run fontWeight={600} text="HasBorder" /><Run
							text=" to"
						/><Run fontWeight={600} text="false" /><Run text=" while" /><Run
							fontWeight={600}
							text="HasTitleBar"
						/><Run text=" is" /><Run fontWeight={600} text="true" /><Run
							text=" will result in a fatal error."
						/></Paragraph
					></RichTextBlock
				>
			</InfoBar>
			<!-- WD-065. AppWindowPage.xaml.cs:29-33 would open and activate SampleWindow3. -->
			<Button>Show window</Button>
		</div>
		{#snippet options()}
			<!-- AppWindowPage.xaml:142-205 — StackPanel Spacing="8". -->
			<div class="options-column">
				<ToolTip content="Keeps the window above all other windows when enabled.">
					{#snippet children(props)}
						<ToggleSwitch
							{...props}
							bind:checked={isAlwaysOnTop}
							header="IsAlwaysOnTop"
							onContent="true"
							offContent="false"
						/>
					{/snippet}
				</ToolTip>
				<ToolTip content="Controls the visibility and enable state of the maximize button.">
					{#snippet children(props)}
						<ToggleSwitch
							{...props}
							bind:checked={isMaximizable}
							header="IsMaximizable"
							onContent="true"
							offContent="false"
						/>
					{/snippet}
				</ToolTip>
				<ToolTip content="Controls the visibility and enable state of the minimize button.">
					{#snippet children(props)}
						<ToggleSwitch
							{...props}
							bind:checked={isMinimizable}
							header="IsMinimizable"
							onContent="true"
							offContent="false"
						/>
					{/snippet}
				</ToolTip>
				<ToolTip content="Allows resizing the window by dragging its edges.">
					{#snippet children(props)}
						<ToggleSwitch
							{...props}
							bind:checked={isResizable}
							header="IsResizable"
							onContent="true"
							offContent="false"
						/>
					{/snippet}
				</ToolTip>
				<ToolTip content="Determines if the window has a visible outer border.">
					{#snippet children(props)}
						<ToggleSwitch
							{...props}
							checked={hasBorder}
							onCheckedChange={setHasBorder}
							header="HasBorder"
							onContent="true"
							offContent="false"
						/>
					{/snippet}
				</ToolTip>
				<ToolTip content="Specifies whether the window includes a system title bar.">
					{#snippet children(props)}
						<ToggleSwitch
							{...props}
							checked={hasTitleBar}
							onCheckedChange={setHasTitleBar}
							header="HasTitleBar"
							onContent="true"
							offContent="false"
						/>
					{/snippet}
				</ToolTip>
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={sizingSample.header ?? undefined}
		xaml={sizingSample.xaml ?? undefined}
		csharp={sizingSample.csharp ?? undefined}
	>
		<div class="example-column">
			<p class="winui-BodyTextBlockStyle">
				The minimum and maximum width and height can be set on an AppWindow. When setting the
				maximum width or height, it's recommended to disable the window maximization.
			</p>
			<!-- WD-065. AppWindowPage.xaml.cs:35-39 would open and activate SampleWindow4. -->
			<Button>Show window</Button>
		</div>
		{#snippet options()}
			<div class="options-column">
				<!-- AppWindowPage.xaml:227-242. Upstream's default Compact placement and this library's
				     default Hidden placement both show no spin buttons at rest, so the prop stays absent. -->
				<NumberBox header="PreferredMinimumWidth" bind:value={preferredMinimumWidth} />
				<NumberBox header="PreferredMinimumHeight" bind:value={preferredMinimumHeight} />
				<NumberBox header="PreferredMaximumWidth" bind:value={preferredMaximumWidth} />
				<NumberBox header="PreferredMaximumHeight" bind:value={preferredMaximumHeight} />
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={modalSample.header ?? undefined}
		xaml={modalSample.xaml ?? undefined}
		csharp={modalSample.csharp ?? undefined}
	>
		<div class="modal-example">
			<p class="winui-BodyTextBlockStyle">
				A modal window is a separate window that blocks interaction with its owner window until it
				is closed, often used for critical actions like confirmations, authentication, or settings.
				Unlike a ContentDialog, which is a lightweight pop-up within the same window, a modal window
				is a fully independent window, making it suitable for multi-window applications or scenarios
				requiring more flexibility in layout and behavior.
			</p>
			<!-- WD-065. AppWindowPage.xaml.cs:59-63 would open and activate ModalWindow. -->
			<Button style="margin-top: 8px">Show modal window</Button>
		</div>
	</ControlExample>

	<ControlExample
		headerText={fullscreenSample.header ?? undefined}
		xaml={fullscreenSample.xaml ?? undefined}
		csharp={fullscreenSample.csharp ?? undefined}
	>
		<div class="example-column">
			<p class="winui-BodyTextBlockStyle">
				The FullScreenPresenter makes an AppWindow cover the entire screen, removing the title bar
				and system UI to create an immersive experience. To ensure usability, an exit mechanism,
				such as handling the Escape key or close button, should be included, and fullscreen mode
				should be used in scenarios like media playback or focused tasks.
			</p>
			<!-- WD-065. AppWindowPage.xaml.cs:65-69 would open and activate SampleWindow6. -->
			<Button>Show window (Fullscreen mode)</Button>
		</div>
	</ControlExample>

	<ControlExample
		headerText={compactOverlaySample.header ?? undefined}
		xaml={compactOverlaySample.xaml ?? undefined}
		csharp={compactOverlaySample.csharp ?? undefined}
		substitutions={compactOverlaySubstitutions}
	>
		<div class="example-column">
			<p class="winui-BodyTextBlockStyle">
				CompactOverlayPresenter (Picture-in-Picture mode) keeps an AppWindow always on top while
				using minimal screen space. To ensure a good user experience, the window should have a small
				yet functional size (e.g., for media players or floating tools).
			</p>
			<!-- WD-065. AppWindowPage.xaml.cs:71-75 would open and activate SampleWindow7. -->
			<Button>Show window (Picture-in-Picture mode)</Button>
		</div>
		{#snippet options()}
			<div class="options-column">
				<ComboBox
					header="InitialSize"
					items={initialSizeItems}
					bind:value={initialSize}
					style="width: 150px"
				/>
				<!-- AppWindowPage.xaml.cs:77-94 — derive the percentage from the selected size. -->
				<p class="initial-size-description winui-BodyTextBlockStyle">
					{initialSize}: Window size is approximately {initialSizePercentage} of the display's work area.
				</p>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	.section {
		/* AppWindowPage.xaml:12-15. The heading's -16px bottom and ControlExample's 16px top
		   collapse in CSS to max(16) + min(-16) = 0, the same result XAML gets by addition;
		   the agreement is arithmetic, not a general equivalence between the layout models. */
		margin: 16px 0 -16px;
	}
	.section.presenters {
		/* AppWindowPage.xaml:109-112. */
		margin-top: 24px;
	}
	.options-column,
	.example-column {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}
	.pair {
		display: flex;
	}
	.example-column p,
	.modal-example p,
	.initial-size-description {
		margin: 0;
	}
	.initial-size-description {
		width: 250px;
	}
</style>
