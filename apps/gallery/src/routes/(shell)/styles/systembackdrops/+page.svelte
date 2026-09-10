<script lang="ts">
	import { Button } from 'winui-svelte';
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
			<!-- SystemBackdropsPage.xaml:26-39 — TextBlock with its inline LineBreak and bold Run
			     children transcribed as HTML. -->
			<p class="prose winui-BodyTextBlockStyle">
				A window can use one of the following system backdrops:<br />
				1. <strong>Mica</strong> — An opaque material that samples the desktop wallpaper once to
				tint the window background. Best for main app windows.<br />
				2. <strong>Mica Alt</strong> — A variant of Mica with stronger tinting. Recommended for apps
				with a tabbed title bar.<br />
				3. <strong>Desktop Acrylic (Base)</strong> — A semi-transparent material that shows a
				blurred view of the content behind the window.<br />
				4. <strong>Desktop Acrylic (Thin)</strong> — A lighter variant of Desktop Acrylic with more
				transparency.<br /><br />
				<strong>Mica vs. Acrylic:</strong> Mica is opaque and renders the desktop wallpaper within
				the window background. Desktop Acrylic is semi-transparent and reveals a blurred view of
				what is behind the window in real-time. Mica is more performant because it captures the
				wallpaper only once, while Acrylic updates continuously.<br /><br />
				There are three backdrop types in the API:<br />
				• <strong>SystemBackdrop</strong> — The base class of every backdrop type.<br />
				• <strong>MicaBackdrop</strong> — Applies the Mica material. Set the Kind property to switch
				between Base and Alt.<br />
				• <strong>DesktopAcrylicBackdrop</strong> — Applies the Desktop Acrylic material (Base type
				only).<br /><br />
				All Mica variants require Windows 11 build 22000 or later. In-app acrylic (AcrylicBrush) is a
				separate XAML brush used within UI elements, not a window backdrop.
			</p>
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
			<!-- SystemBackdropsPage.xaml:46-51 — TextBlock with its trailing LineBreak. -->
			<p class="prose prose-trailing-break winui-BodyTextBlockStyle">
				MicaController provides a customizable way to apply the Mica material. You can modify:
				FallbackColor, Kind, LuminosityOpacity, TintColor, and TintOpacity.<br /><br />
				There are 2 kinds of Mica:<br />
				1. <strong>Base</strong> — The default, lighter appearance.<br />
				2. <strong>Alt</strong> — A darker appearance with stronger tinting of the desktop
				wallpaper.<br />
			</p>
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
			<!-- SystemBackdropsPage.xaml:58-63 — TextBlock with its inline LineBreak and bold Run
			     children transcribed as HTML. -->
			<p class="prose winui-BodyTextBlockStyle">
				DesktopAcrylicController provides a customizable way to apply the Desktop Acrylic material.
				It supports the same customization properties as MicaController.<br /><br />
				There are 2 kinds of Desktop Acrylic:<br />
				1. <strong>Base</strong> — The default, darker appearance with less transparency.<br />
				2. <strong>Thin</strong> — A lighter appearance with more transparency.<br /><br />
				Note: DesktopAcrylicBackdrop always uses the Base kind. To use the Thin kind, you must use DesktopAcrylicController
				directly.
			</p>
			<!-- SystemBackdropsPage.xaml:64 — Button with a 10-pixel top margin.
			     WD-041: this click handler deliberately has no web equivalent; see docs/divergences.md. -->
			<Button class="show-window">Show window</Button>
		</div>
	</ControlExample>
</ItemPage>

<style>
	/* SystemBackdropsPage.xaml:26-39, :46-51 and :58-63 — TextBlock has no browser-default
	   paragraph margin. */
	.prose {
		margin: 0;
	}

	/* SystemBackdropsPage.xaml:50 — the trailing LineBreak needs an inline box after it because
	   CSS's trailing br alone does not create XAML's empty final line. */
	.prose-trailing-break::after {
		content: '';
		display: inline-block;
	}

	/* SystemBackdropsPage.xaml:40, :52 and :64 — each Button has Margin="0,10,0,0". */
	.sample :global(.show-window) {
		/* c1-allow: SystemBackdropsPage.xaml:40, :52 and :64 — Button top margin. */
		margin-top: 10px;
	}
</style>
