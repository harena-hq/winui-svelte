<script lang="ts">
	import { Button, CheckBox, Path, Symbol } from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/styles/iconelement');
	if (item === null) throw new Error('IconElement page has no Gallery item');

	// IconElementPage.xaml:11, :39, :54, :72, :81, :96 — the six SampleDefinition paths, in
	// page order. None of the six files carries a C# section, so no example here passes
	// `csharp` and every Source code expander offers XAML alone.
	const bitmapIconSample = sampleOf('IconElement/IconElementBitmapiconMulticolorBitmapImage.txt');
	const fontIconSample = sampleOf('IconElement/IconElementFonticonGlyphSpecificFont.txt');
	const imageIconPngSample = sampleOf('IconElement/IconElementImageiconBitmapImageButton.txt');
	const imageIconSvgSample = sampleOf('IconElement/IconElementImageiconSvgImageButton.txt');
	const pathIconSample = sampleOf('IconElement/IconElementPathiconButton.txt');
	const symbolIconSample = sampleOf('IconElement/IconElementSymboliconButton.txt');

	// IconElementPage.xaml:27-31 — the CheckBox authors no IsChecked, so it rests unchecked and
	// the sample rests on ShowAsMonochrome="False", which is what :22 writes.
	let monochrome = $state(false);

	// IconElementPage.xaml:47 — the FontIcon's Glyph, U+E790, written as an escape rather than
	// as the character. A private-use code point pasted into a source file is an empty span in
	// grep, in a diff and in review.
	const FONT_ICON_GLYPH = String.fromCodePoint(0xe790);

	// IconElementPage.xaml:105 — SymbolIcon Symbol="Accept". The member is named and its code
	// point is not written anywhere on this page: `Symbol` is the record generated from the
	// pin's own CSymbolIcon::ConvertSymbolValueToGlyph, which ADR 0012's amendment carries so
	// that a call site can name the member and C8 can keep the pairing honest. The import
	// shadows the language's `Symbol` inside this module, which the export documents.
	const SYMBOL_ICON_GLYPH = String.fromCodePoint(parseInt(Symbol.Accept, 16));

	// Not reproduced, at five sites: AutomationProperties.Name on every Button —
	// "ExampleButton1", "ImageExample1", "ImageExample2", "Example1Button", "AcceptButton"
	// (IconElementPage.xaml:46, :64, :74, :88, :103). Those are automation ids for the
	// Gallery's own UI tests, not labels anyone would want read aloud; carrying them over as
	// aria-label would put developer strings into the accessibility tree. Each image below
	// gets a short honest `alt` instead, and the three glyph examples are decorative content
	// inside a button whose own text is what a reader needs.
	//
	// Not reproduced either: x:Name on every element. Names for the code-behind, with no
	// rendered effect.
	//
	// And the code-behind itself does one thing worth naming. MonochromeButton_CheckedChanged
	// (IconElementPage.xaml.cs:20-21) re-assigns UriSource straight after setting
	// ShowAsMonochrome. That is a nudge to make XAML re-render the icon, not behaviour; CSS
	// re-renders on its own and needs no equivalent.
</script>

<ItemPage {item}>
	<ControlExample
		headerText={bitmapIconSample.header ?? undefined}
		xaml={bitmapIconSample.xaml ?? undefined}
		substitutions={{ ShowAsMonochrome: monochrome ? 'True' : 'False' }}
	>
		<!-- IconElementPage.xaml:13-24 — the StackPanel, its paragraph, and the BitmapIcon. -->
		<div class="stack">
			<p class="lead winui-BodyTextBlockStyle">
				The ShowAsMonochrome property (true by default) will result in a solid block of the
				foreground color if the property is set to true and the icon is more than one color. This
				behavior can be ignored by setting the ShowAsMonochrome property to false.
			</p>
			<!-- IconElementPage.xaml:18-23 — BitmapIcon Width="50", ShowAsMonochrome bound to the
			     CheckBox, UriSource the vendored Slices.png.

			     The monochrome branch is a mask rather than a tint because of what the asset is:
			     Slices.png is 90 by 90 with alpha 255 across the whole disc and 0 outside it — 5819
			     pixels opaque, 1964 clear, the remainder rim antialiasing — so an alpha mask of it is
			     a filled circle, which is exactly what the reference guest draws when Monochrome is
			     checked. A silhouette with the white slices showing through would be the wrong
			     picture. The unprefixed mask-image is enough in Chromium, which is what the guest's
			     Edge is. -->
			{#if monochrome}
				<div class="bitmap-icon bitmap-icon-monochrome"></div>
			{:else}
				<img class="bitmap-icon" src="/Slices.png" alt="Slices" />
			{/if}
		</div>
		{#snippet options()}
			<!-- IconElementPage.xaml:26-32 — one CheckBox, no StackPanel around it and no width. -->
			<CheckBox bind:checked={monochrome}>Monochrome</CheckBox>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={fontIconSample.header ?? undefined}
		xaml={fontIconSample.xaml ?? undefined}
	>
		<!-- IconElementPage.xaml:41-49 — the StackPanel, its paragraph, and the Button. -->
		<div class="stack">
			<p class="lead winui-BodyTextBlockStyle">
				Use FontIcon as the icon for a control if you want to specify a Glyph value from a
				FontFamily. Windows 10 uses the Segoe MDL2 Assets FontFamily and that is what this example
				is showing.
			</p>
			<!-- IconElementPage.xaml:46-48 — the FontIcon is the Button's whole content. -->
			<Button>
				<span class="font-icon">{FONT_ICON_GLYPH}</span>
			</Button>
		</div>
	</ControlExample>

	<ControlExample
		headerText={imageIconPngSample.header ?? undefined}
		xaml={imageIconPngSample.xaml ?? undefined}
	>
		<!-- IconElementPage.xaml:56-67 — the StackPanel, its paragraph, and the Button. -->
		<div class="stack">
			<p class="lead winui-BodyTextBlockStyle">
				To use an ImageIcon as the icon for a control, you can set image that has a file format
				supported by the Image class. The two examples here show a PNG and SVG image as the icon.
			</p>
			<!-- IconElementPage.xaml:61-66 — Button Width="100" holding an ImageIcon with no size of
			     its own. XAML's Width is the outer edge, padding and border included, which is CSS's
			     border-box and not its default; the style prop is the channel a page has for a
			     component's own box, since a class handed across the boundary carries no scope hash.
			     The image then fills the content box uniformly, so its size is 100 less the button's
			     own padding and border rather than a number written here. -->
			<Button style="box-sizing: border-box; width: 100px">
				<img class="image-icon-png" src="/Slices.png" alt="Slices" />
			</Button>
		</div>
	</ControlExample>

	<ControlExample
		headerText={imageIconSvgSample.header ?? undefined}
		xaml={imageIconSvgSample.xaml ?? undefined}
	>
		<!-- IconElementPage.xaml:73-77 — this example alone has no paragraph and no StackPanel: the
		     Button is the direct child, and the card is correspondingly shorter than its five
		     neighbours.

		     The source is a remote URL and is reproduced literally, because that is what the example
		     shows: the original fetches it and draws an orange landscape glyph, checked on the
		     reference guest. So opening this page makes one network request, exactly as opening the
		     original does. Nothing automated depends on it — no visual baseline covers a Gallery
		     page — and the asset is not vendored here because vendoring it would quietly turn a
		     remote-source example into a local-source one. -->
		<Button>
			<img
				class="image-icon-svg"
				src="https://raw.githubusercontent.com/DiemenDesign/LibreICONS/master/svg-color/libre-camera-panorama.svg"
				alt="Camera panorama"
			/>
		</Button>
	</ControlExample>

	<ControlExample
		headerText={pathIconSample.header ?? undefined}
		xaml={pathIconSample.xaml ?? undefined}
	>
		<!-- IconElementPage.xaml:83-91 — the StackPanel, its paragraph, and the Button. -->
		<div class="stack">
			<p class="lead winui-BodyTextBlockStyle">
				To use a PathIcon as the icon for a control, you specify the path data of the image you are
				trying to display. The path data draws a series of connected lines and curves.
			</p>
			<!-- IconElementPage.xaml:88-90 — PathIcon HorizontalAlignment="Center", inside a Button
			     that centres its content anyway.

			     A PathIcon is a Path painted with the Foreground, and that is the pin's own
			     construction rather than an approximation of it: CPathIcon::ApplyTemplate
			     (dxaml/xcp/core/core/elements/icon.cpp:971-1004) creates a CPath, stretches it in
			     both directions, and links IconElement.Foreground onto the shape's paint and
			     PathIcon.Data onto the path's geometry. So this is the library's own Path with the
			     Data string unchanged and currentColor for the paint.

			     No viewBox, width or height is computed here. Path already implements XAML's
			     Stretch="None" box rule, and for this geometry that is 20 wide by 16 tall with the
			     shape's own bounds starting at x 1 and y 2 — the empty column and the two empty rows
			     at the left and top are in the original too. -->
			<Button>
				<Path data="F1 M 16,12 20,2L 20,16 1,16" fill="currentColor" />
			</Button>
		</div>
	</ControlExample>

	<ControlExample
		headerText={symbolIconSample.header ?? undefined}
		xaml={symbolIconSample.xaml ?? undefined}
	>
		<!-- IconElementPage.xaml:98-109 — the StackPanel, its paragraph, and the Button. -->
		<div class="stack">
			<p class="lead winui-BodyTextBlockStyle">
				To use a SymbolIcon as the icon for a control, you specify the enum value for the glyph you
				would like to display. SymbolIcon's enum is based off of icons from the Segoe MDL2 font used
				by Windows 10.
			</p>
			<!-- IconElementPage.xaml:103-108 — the Button's content is a vertical StackPanel with the
			     SymbolIcon above a TextBlock. CSymbolIcon::ApplyTemplate (icon.cpp:323-395) is what
			     the glyph's own rendering is transcribed from, and the style block says which line
			     each declaration comes from. -->
			<Button>
				<div class="symbol-stack">
					<span class="symbol-icon">{SYMBOL_ICON_GLYPH}</span>
					<span>Accept</span>
				</div>
			</Button>
		</div>
	</ControlExample>
</ItemPage>

<style>
	/* Every example but the fourth wraps its content in a vertical StackPanel.
	   `align-items: flex-start` rather than `stretch` because that is where the originals sit:
	   the ContentPresenter holding the sample is HorizontalContentAlignment="Left"
	   (ControlExample.xaml:118, defaulted at ControlExample.xaml.cs:170), and WinUI's own
	   default and subtle Button styles each set HorizontalAlignment="Left"
	   (Button_themeresources.xaml:161, :304), so a Button in a StackPanel shrink-wraps instead
	   of filling it. The BitmapIcon says the same thing for itself at IconElementPage.xaml:21,
	   which it has to: a fixed Width under XAML's Stretch centres rather than fills. */
	.stack {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	/* Every paragraph is Margin="0,0,0,12" with Style="{ThemeResource BodyTextBlockStyle}"
	   (IconElementPage.xaml:14-17, :42-45, :57-60, :84-87, :99-102). The ramp class carries the
	   style; the margin is the element's own, and `<p>`'s user-agent margins are not it.
	   `align-self` restores what the flex-start above takes away: a TextBlock in a StackPanel
	   has no alignment of its own, so it stretches across, and only the shrink-wrapping
	   children opt out. */
	.lead {
		align-self: stretch;
		margin: 0 0 12px;
	}

	/* IconElementPage.xaml:20 — BitmapIcon Width="50". Slices.png is square, so the uniform
	   stretch that gives it a width of 50 gives it a height of 50; the masked branch needs both
	   numbers stated anyway, having no intrinsic size to stretch. */
	.bitmap-icon {
		width: 50px;
		height: 50px;
	}

	/* ShowAsMonochrome, as an alpha mask painted in the inherited foreground. See the comment
	   at the site for why a mask of this particular asset is the right reproduction. */
	.bitmap-icon-monochrome {
		background-color: currentColor;
		mask-image: url('/Slices.png');
		mask-size: contain;
		mask-repeat: no-repeat;
	}

	.font-icon {
		/* c1-allow: IconElementPage.xaml:47 names Segoe MDL2 Assets. The theme's icon token
		   names it only behind Segoe Fluent Icons, so on the reference guest it would draw
		   Fluent; this example's subject is the older icon font itself, the one the paragraph
		   is about. It is installed on the reference guest, as tests/visual/fonts.spec.ts
		   checks, and will not resolve on a Linux dev preview, which is expected rather than a
		   defect. */
		font-family: 'Segoe MDL2 Assets';
		/* c1-allow: IconElement's own size, g_ClientCoreFontSize = 20.f at
		   dxaml/xcp/core/core/elements/icon.cpp:13, applied to FontIcon at :738. Not a ramp
		   value and not a token. */
		font-size: 20px;
	}

	/* IconElementPage.xaml:65 — the ImageIcon carries no size, so it fills the button's content
	   box uniformly. `height: auto` keeps the 90 by 90 source square. */
	.image-icon-png {
		width: 100%;
		height: auto;
	}

	/* IconElementPage.xaml:75 — ImageIcon Width="50". */
	.image-icon-svg {
		width: 50px;
		height: auto;
	}

	/* IconElementPage.xaml:104 — the inner StackPanel, vertical, so a flex column. Its two
	   children are centred on each other, which is where a StackPanel inside a Button that
	   centres its content puts them. */
	.symbol-stack {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* CSymbolIcon::ApplyTemplate, icon.cpp:323-395. The TextBlock beneath needs nothing of its
	   own: it takes the page's body size from the Button's own ramp class. */
	.symbol-icon {
		/* Segoe Fluent Icons then Segoe MDL2 Assets: icon.cpp:14 hard-codes the list that :328
		   and :374-378 use, the same list the framework dictionary gives SymbolThemeFontFamily.
		   The two are equal rather than linked, and this one comes from the token. */
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: the same g_ClientCoreFontSize = 20.f as the FontIcon above, applied to
		   SymbolIcon at dxaml/xcp/core/core/elements/icon.cpp:318. */
		font-size: 20px;
		/* icon.cpp:367-370 sets both weight and style to Normal. */
		font-weight: normal;
		font-style: normal;
		/* icon.cpp:352-357 centres the glyph in its own box, horizontally and vertically. Only
		   the horizontal half is a declaration: this span is a flex item and so blockified, and
		   its box is one line tall, which leaves the vertical half nothing to centre within. */
		text-align: center;
	}
</style>
