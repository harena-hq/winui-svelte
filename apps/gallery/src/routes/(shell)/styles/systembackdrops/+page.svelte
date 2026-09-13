<script lang="ts">
	import { Button, LineBreak, Run, TextBlock } from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/styles/systembackdrops');
	if (item === null) throw new Error('System Backdrops page has no Gallery item');

	// SystemBackdropsPage.xaml:23-24, :44 and :56 — the three SampleDefinition paths, in page order.
	const backdropTypesSample = sampleOf('SystemBackdrops/SystemBackdropsBackdropTypes.txt');
	const micaControllerSample = sampleOf('SystemBackdrops/SystemBackdropsMicacontroller.txt');
	const desktopAcrylicControllerSample = sampleOf(
		'SystemBackdrops/SystemBackdropsDesktopacryliccontroller.txt'
	);
</script>

<!-- SystemBackdropsPage.xaml:22-67 — the root StackPanel is supplied by ItemPage's content
     frame, while this component supplies the Gallery item header and three examples. -->
<ItemPage {item}>
	<!-- SystemBackdropsPage.xaml:23-42 — the built-in backdrop example and its source sections. -->
	<ControlExample
		headerText={backdropTypesSample.header ?? undefined}
		xaml={backdropTypesSample.xaml ?? undefined}
		csharp={backdropTypesSample.csharp ?? undefined}
	>
		<!-- SystemBackdropsPage.xaml:25-41 — StackPanel containing the TextBlock and Button. -->
		<div class="sample">
			<!-- SystemBackdropsPage.xaml:26-39 — TextBlock with LineBreak and bold Run component
			     children of the same names. -->
			<TextBlock textStyle="BodyTextBlockStyle" textWrapping="wrapWholeWords">
				A window can use one of the following system backdrops:<LineBreak />
				1. <Run fontWeight={700}>Mica</Run> — An opaque material that samples the desktop wallpaper once
				to tint the window background. Best for main app windows.<LineBreak />
				2. <Run fontWeight={700}>Mica Alt</Run> — A variant of Mica with stronger tinting. Recommended
				for apps with a tabbed title bar.<LineBreak />
				3. <Run fontWeight={700}>Desktop Acrylic (Base)</Run> — A semi-transparent material that shows
				a blurred view of the content behind the window.<LineBreak />
				4. <Run fontWeight={700}>Desktop Acrylic (Thin)</Run> — A lighter variant of Desktop Acrylic with
				more transparency.<LineBreak /><LineBreak />
				<Run fontWeight={700}>Mica vs. Acrylic:</Run> Mica is opaque and renders the desktop wallpaper
				within the window background. Desktop Acrylic is semi-transparent and reveals a blurred view of
				what is behind the window in real-time. Mica is more performant because it captures the wallpaper
				only once, while Acrylic updates continuously.<LineBreak /><LineBreak />
				There are three backdrop types in the API:<LineBreak />
				• <Run fontWeight={700}>SystemBackdrop</Run> — The base class of every backdrop type.<LineBreak
				/>
				• <Run fontWeight={700}>MicaBackdrop</Run> — Applies the Mica material. Set the Kind property
				to switch between Base and Alt.<LineBreak />
				• <Run fontWeight={700}>DesktopAcrylicBackdrop</Run> — Applies the Desktop Acrylic material (Base
				type only).<LineBreak /><LineBreak />
				All Mica variants require Windows 11 build 22000 or later. In-app acrylic (AcrylicBrush) is a
				separate XAML brush used within UI elements, not a window backdrop.
			</TextBlock>
			<!-- SystemBackdropsPage.xaml:40 — Button with a 10-pixel top margin.
			     WD-041: this click handler deliberately has no web equivalent; see docs/divergences.md. -->
			<Button class="show-window">Show window</Button>
		</div>
	</ControlExample>

	<!-- SystemBackdropsPage.xaml:44-54 — the MicaController example and its C# source section. -->
	<ControlExample
		headerText={micaControllerSample.header ?? undefined}
		xaml={micaControllerSample.xaml ?? undefined}
		csharp={micaControllerSample.csharp ?? undefined}
	>
		<!-- SystemBackdropsPage.xaml:45-53 — StackPanel containing the TextBlock and Button. -->
		<div class="sample">
			<!-- SystemBackdropsPage.xaml:46-51 — TextBlock with LineBreak and bold Run component
			     children of the same names. -->
			<TextBlock textStyle="BodyTextBlockStyle" textWrapping="wrapWholeWords">
				MicaController provides a customizable way to apply the Mica material. You can modify:
				FallbackColor, Kind, LuminosityOpacity, TintColor, and TintOpacity.<LineBreak /><LineBreak
				/>
				There are 2 kinds of Mica:<LineBreak />
				1. <Run fontWeight={700}>Base</Run> — The default, lighter appearance.<LineBreak />
				2. <Run fontWeight={700}>Alt</Run> — A darker appearance with stronger tinting of the desktop
				wallpaper.<LineBreak />
			</TextBlock>
			<!-- SystemBackdropsPage.xaml:52 — Button with a 10-pixel top margin.
			     WD-041: this click handler deliberately has no web equivalent; see docs/divergences.md. -->
			<Button class="show-window">Show window</Button>
		</div>
	</ControlExample>

	<!-- SystemBackdropsPage.xaml:56-66 — the DesktopAcrylicController example and its C# source
	     section. -->
	<ControlExample
		headerText={desktopAcrylicControllerSample.header ?? undefined}
		xaml={desktopAcrylicControllerSample.xaml ?? undefined}
		csharp={desktopAcrylicControllerSample.csharp ?? undefined}
	>
		<!-- SystemBackdropsPage.xaml:57-65 — StackPanel containing the TextBlock and Button. -->
		<div class="sample">
			<!-- SystemBackdropsPage.xaml:58-63 — TextBlock with LineBreak and bold Run component
			     children of the same names. -->
			<TextBlock textStyle="BodyTextBlockStyle" textWrapping="wrapWholeWords">
				DesktopAcrylicController provides a customizable way to apply the Desktop Acrylic material.
				It supports the same customization properties as MicaController.<LineBreak /><LineBreak />
				There are 2 kinds of Desktop Acrylic:<LineBreak />
				1. <Run fontWeight={700}>Base</Run> — The default, darker appearance with less transparency.<LineBreak
				/>
				2. <Run fontWeight={700}>Thin</Run> — A lighter appearance with more transparency.<LineBreak
				/><LineBreak />
				Note: DesktopAcrylicBackdrop always uses the Base kind. To use the Thin kind, you must use DesktopAcrylicController
				directly.
			</TextBlock>
			<!-- SystemBackdropsPage.xaml:64 — Button with a 10-pixel top margin.
			     WD-041: this click handler deliberately has no web equivalent; see docs/divergences.md. -->
			<Button class="show-window">Show window</Button>
		</div>
	</ControlExample>
</ItemPage>

<style>
	/* SystemBackdropsPage.xaml:40, :52 and :64 — each Button has Margin="0,10,0,0". */
	.sample :global(.show-window) {
		/* c1-allow: SystemBackdropsPage.xaml:40, :52 and :64 — Button top margin. */
		margin-top: 10px;
	}
</style>
