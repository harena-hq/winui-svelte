<script lang="ts">
	import { Button, ComboBox, Hyperlink, NavigationView, Symbol } from 'winui-svelte/preview';
	import type { ComboBoxProps, NavigationViewEntry } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/styles/animatedicon');
	if (item === null) throw new Error('AnimatedIcon page has no Gallery item');

	// AnimatedIconPage.xaml:14 and :60 — the two SampleDefinition paths, in page order. The
	// first file carries a C# section and the second does not, so only the first example
	// passes `csharp` and the second's Source code expander offers XAML alone.
	const buttonSample = sampleOf('AnimatedIcon/AddingAnimatediconButton.txt');
	const navigationSample = sampleOf('AnimatedIcon/AddingAnimatediconNavigationview.txt');

	// AnimatedIconPage.xaml:32 — the FallbackIconSource is a SymbolIconSource whose Symbol is
	// Find. The member is named and its code point is written nowhere on this page: `Symbol` is
	// the record generated from the pin's own CSymbolIcon::ConvertSymbolValueToGlyph, which
	// ADR 0012's amendment carries so that a call site can name the member and C8 can keep the
	// pairing honest. This is the second call site to use it. The import shadows the language's
	// `Symbol` inside this module, which the export documents.
	const FIND_GLYPH = String.fromCodePoint(parseInt(Symbol.Find, 16));

	// AnimatedIconPage.xaml:45-51 — the seven x:String items, in the file's own order.
	const VISUAL_SOURCE_KINDS = [
		'AnimatedBackVisualSource',
		'AnimatedChevronDownSmallVisualSource',
		'AnimatedChevronRightDownSmallVisualSource',
		'AnimatedChevronUpDownSmallVisualSource',
		'AnimatedFindVisualSource',
		'AnimatedGlobalNavigationButtonVisualSource',
		'AnimatedSettingsVisualSource'
	];
	const KIND_ITEMS: ComboBoxProps['items'] = VISUAL_SOURCE_KINDS.map((value) => ({
		value,
		label: value
	}));

	// AnimatedIconPage.xaml:44 — SelectedIndex is 4, which is the fifth string above.
	//
	// The combo changes the sample source text and nothing on screen, and that is not a wiring
	// fault. The substitution below is live: picking a kind rewrites `$(AnimatedVisualSourceKind)`
	// in the XAML the expander shows, exactly as the original's does. The icon does not change
	// because AnimatedIconPage.xaml:31-33 gives all seven kinds the one FallbackIconSource, the
	// Find symbol, and the fallback is what this library draws — WD-006.
	let kind = $state('AnimatedFindVisualSource');

	// AnimatedIconPage.xaml:69-80 — the single menu item. Its fallback is a FontIconSource
	// whose Glyph attribute at :76 is a literal escape for U+E713, so the code point is what is
	// faithful here; a Symbol member would be this page inventing a name the markup does not
	// use. (The two are the same glyph, and that is a coincidence of this icon rather than a
	// rule: the settings gear is what `Symbol.Setting` also renders.)
	const MENU: NavigationViewEntry[] = [
		{ id: 'game-settings', content: 'Game Settings', glyph: 'E713' }
	];

	// Not reproduced: the button's PointerEntered and PointerExited handlers
	// (AnimatedIconPage.xaml:28-29), which call AnimatedIcon.SetState with "PointerOver" and
	// "Normal" (AnimatedIconPage.xaml.cs:18-26). There is no state to set on a static glyph —
	// WD-006 again, and the C# section of the first sample is those two handlers verbatim.
	//
	// Not reproduced: the button's AutomationProperties.Name, "AnimatedIcon Example"
	// (AnimatedIconPage.xaml:27). The same call the IconElement page made at five sites: an
	// automation id for the Gallery's own UI tests, not a label anyone would want read aloud,
	// so carrying it over as aria-label would put a developer string into the accessibility
	// tree. The glyph is decorative content inside a button, which is what a reader needs.
	//
	// Not reproduced either: x:Name on every element. Names for the code-behind, with no
	// rendered effect.
	//
	// And one attribute on the combo box is inert rather than dropped. AnimatedIconPage.xaml:42
	// centres it vertically; it is the only child of a vertical options StackPanel, which gives
	// it exactly its own height, so there is nothing for the alignment to move it within.
</script>

<ItemPage {item}>
	<ControlExample
		headerText={buttonSample.header ?? undefined}
		xaml={buttonSample.xaml ?? undefined}
		csharp={buttonSample.csharp ?? undefined}
		substitutions={{ AnimatedVisualSourceKind: kind }}
	>
		<!-- AnimatedIconPage.xaml:16-36 — the StackPanel, its paragraph, and the Button. -->
		<div class="stack">
			<!-- AnimatedIconPage.xaml:19-21 — the Hyperlink and its NavigateUri. -->
			<p class="lead winui-BodyTextBlockStyle">
				The following example is a button that the user clicks to load a search experience. The
				AnimatedIcon consumes the animation created using Adobe AfterEffects and translated into
				Microsoft.UI.Composition objects using <Hyperlink navigateUri="https://aka.ms/lottie"
					>Lottie-Windows</Hyperlink
				>
				. For guidance on how to properly structure your animation file see the AnimatedIcon Guidance
				page.<br />
			</p>
			<!-- AnimatedIconPage.xaml:25-35 — the Button is 75 wide and the AnimatedIcon is its whole
			     content. XAML's Width is the outer edge, padding and border included, which is CSS's
			     border-box and not its default; the style prop is the channel a page has for a
			     component's own box, since a class handed across the boundary carries no scope hash.

			     The button comes out shorter than the original's, and that is the reproduction rather
			     than a defect. AnimatedIcon::MeasureOverride (AnimatedIcon.cpp:112) measures the
			     running composition — 48 by 48 for every one of these sources — and falls through to
			     the base measure when there is no visual (:148-152), which is the fallback icon at its
			     own size. WD-006 carries both numbers. -->
			<Button style="box-sizing: border-box; width: 75px">
				<span class="symbol-icon">{FIND_GLYPH}</span>
			</Button>
		</div>
		{#snippet options()}
			<!-- AnimatedIconPage.xaml:39-52 — one ComboBox with a MinWidth of 340 and the header Kind. -->
			<ComboBox header="Kind" items={KIND_ITEMS} bind:value={kind} style="min-width: 340px" />
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={navigationSample.header ?? undefined}
		xaml={navigationSample.xaml ?? undefined}
	>
		<!-- AnimatedIconPage.xaml:62-83 — the StackPanel, its paragraph, and the NavigationView. -->
		<div class="stack">
			<p class="lead winui-BodyTextBlockStyle">
				If you set an AnimatedIcon as the value of the Icon property, the NavigationViewItem will
				set the states of the AnimatedIcon for you, according to the states of the control. For
				guidance on how to properly structure your animation file see the AnimatedIcon Guidance
				page.<br /><br />
				For this example, this sets a custom animation GameSettingsIcon that was generated by the LottieGen
				tool.<br /><br />
			</p>
			<!-- AnimatedIconPage.xaml:67 — IsSettingsVisible is False, so no settings row.

			     `align-self` restores HorizontalAlignment's XAML default of Stretch, which the
			     `.stack` rule below turns off for the button's sake in the example above.

			     IsBackButtonVisible is left at its default, so at the reference width the pane opens
			     with a disabled back button above the toggle, as the original's does. Narrower, the
			     control goes minimal and draws it beside the toggle instead. -->
			<NavigationView items={MENU} settingsVisible={false} style="align-self: stretch" />
		</div>
	</ControlExample>
</ItemPage>

<style>
	/* Both examples wrap their content in a vertical StackPanel — AnimatedIconPage.xaml:16
	   and :62 — so a flex column. `align-items: flex-start` rather than `stretch` because that
	   is where the originals sit: the ContentPresenter holding the sample binds its horizontal
	   content alignment at ControlExample.xaml:118, and that property's registered default is
	   Left (ControlExample.xaml.cs:170); WinUI's own default Button style then sets
	   HorizontalAlignment to Left (Button_themeresources.xaml:161), so a Button in a StackPanel
	   shrink-wraps instead of filling it — which is what keeps this button at its own 75
	   inside an example pane that is itself a flex column. */
	.stack {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	/* A TextBlock in a StackPanel has no alignment of its own, so it takes the panel's width;
	   `align-self` restores what the flex-start above takes away. No margin: neither TextBlock
	   carries one, and the gap below each paragraph is the trailing LineBreak —
	   AnimatedIconPage.xaml:23, and the two at the end of :65 — so writing a margin as well
	   would double it. `<p>`'s user-agent margins are not the element's own either. */
	.lead {
		align-self: stretch;
		margin: 0;
	}

	/* XAML's trailing `<LineBreak />` makes an empty last line; CSS's trailing `<br>` makes
	   none, because a line break at the end of a block generates no further line box. Both
	   paragraphs here end in one — AnimatedIconPage.xaml:23, and the second of the two at the
	   end of :65 — and both came out exactly one line short against the original before this
	   rule: the button sat 18 pixels high, and the NavigationView 20.

	   An empty inline-block is the box that restores the line. It is deliberately not a
	   zero-width space and not a bottom padding: the first puts a character into the text a
	   screen reader walks, and the second would be this page asserting a gap of its own instead
	   of the line the markup actually ends with — which is the same gap only until something
	   changes the ramp. */
	.lead::after {
		content: '';
		display: inline-block;
	}

	/* CSymbolIcon::ApplyTemplate, icon.cpp:323-395 — the same five declarations
	   `styles/iconelement/+page.svelte` writes for the same construction, copied with their
	   citations rather than shared. Two call sites is not yet a pattern, and the place a shared
	   one would go is `$lib/frame/`, which would make it a Gallery-side SymbolIcon component —
	   the thing ADR 0012 decided not to build. The third site is where this is worth revisiting,
	   and by then it is a decision rather than a habit. */
	.symbol-icon {
		/* Segoe Fluent Icons, at icon.cpp:328 and :374-378. This one is a theme value and has a
		   token, so it comes from the token. */
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: IconElement's own size, g_ClientCoreFontSize = 20.f at
		   dxaml/xcp/core/core/elements/icon.cpp:13, applied to SymbolIcon at :318. Not a ramp
		   value and not a token. */
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
