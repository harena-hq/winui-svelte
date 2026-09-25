<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export type TextBlockStyleName =
		| 'BaseTextBlockStyle'
		| 'CaptionTextBlockStyle'
		| 'BodyTextBlockStyle'
		| 'BodyStrongTextBlockStyle'
		| 'BodyLargeTextBlockStyle'
		| 'BodyLargeStrongTextBlockStyle'
		| 'SubtitleTextBlockStyle'
		| 'TitleTextBlockStyle'
		| 'TitleLargeTextBlockStyle'
		| 'DisplayTextBlockStyle';

	export interface TextBlockProps {
		/** Text. When defined, takes precedence over Inlines. */
		text?: string;
		/** Style. Renamed because HTML's `style` attribute wins under ADR 0009, avoiding a silent collision. */
		textStyle?: TextBlockStyleName;
		/** FontFamily. */
		fontFamily?: string;
		/** FontSize. A number is a XAML DIP, rendered as px. */
		fontSize?: number | string;
		/** FontStyle. */
		fontStyle?: 'normal' | 'italic' | 'oblique';
		/** FontWeight. */
		fontWeight?: number | string;
		/**
		 * Foreground, as a CSS colour. XAML's Foreground is a Brush and CSS's `color` is not, so a
		 * gradient brush has no equivalent here and is dropped rather than approximated.
		 */
		foreground?: string;
		/** CharacterSpacing, in thousandths of an em. */
		characterSpacing?: number;
		/** TextWrapping. */
		textWrapping?: 'noWrap' | 'wrap' | 'wrapWholeWords';
		/** TextTrimming. */
		textTrimming?: 'none' | 'clip' | 'characterEllipsis' | 'wordEllipsis';
		/** MaxLines. Zero means unlimited. */
		maxLines?: number;
		/**
		 * LineHeight, in pixels. Zero means derive it from the font, which is XAML's default.
		 * CSS distributes the extra leading symmetrically above and below the text; XAML's
		 * `LineStackingStrategy` chooses between that and baseline-to-baseline, and this component
		 * does not expose it — its default is not in the sparse checkout.
		 */
		lineHeight?: number;
		/** TextAlignment. */
		textAlignment?: 'left' | 'center' | 'right' | 'justify' | 'start' | 'end' | 'detectFromContent';
		/** IsTextSelectionEnabled. */
		textSelectionEnabled?: boolean;
		/**
		 * SelectionHighlightColor, as a CSS colour. `TextBox` and its siblings have no such prop
		 * because their own default styles set the member from `TextControlSelectionHighlightColor`
		 * and the token reaches `::selection` with no Svelte surface at all. No pinned style sets it
		 * on a plain `TextBlock`, and the Gallery's page sets it per instance
		 * (`TextBlockPage.xaml:65`), so here it is a prop.
		 */
		selectionHighlightColor?: string;
		/** Padding. XAML's Thickness grammar — a number, or `"8"`, `"8,5"`, `"1,2,3,4"`. */
		padding?: number | string;
		/** Inlines, as the default snippet. Rendered only when Text is undefined. */
		children?: Snippet;
		class?: string;
		style?: string;
		/**
		 * HTML's direction attribute, passed through to the root. Declared rather than left to
		 * the rest props because `textAlignment="detectFromContent"` needs `dir="auto"` and
		 * overrides this one; every other alignment leaves it alone.
		 */
		dir?: 'ltr' | 'rtl' | 'auto';
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// `Inlines` is built: Run, Span, Bold, Italic, Underline and LineBreak are their own
	// components, and they land in the `children` snippet with no change to this surface.
	// `Hyperlink` is the unit after.
	//
	// Not built here, each for its own reason. `TextDecorations` and `FontStretch` are one CSS
	// declaration each and wait for the first unit that needs one. `TextLineBounds` deliberately
	// does not: its four enumerants (`EnumDefs.g.h:1895-1900` — Full, TrimToCapHeight,
	// TrimToBaseline, Tight) each want a different `text-box`, the Gallery uses one of them
	// (`Styles/ItemTemplates.xaml:45`), and the only measured precedent in this library is
	// PersonPicture's single `Tight` (PersonPicture.svelte's `.initials`) — so it gets a pass of
	// its own rather than three mappings derived beside it.
</script>

<script lang="ts">
	import { thicknessToCss } from '../internal/thickness';

	let {
		text,
		textStyle,
		fontFamily,
		fontSize,
		fontStyle,
		fontWeight,
		foreground,
		characterSpacing,
		textWrapping = 'noWrap',
		textTrimming = 'none',
		maxLines = 0,
		lineHeight = 0,
		textAlignment = 'left',
		textSelectionEnabled = false,
		selectionHighlightColor,
		padding,
		children,
		class: className,
		style,
		dir: direction,
		ref = $bindable(null),
		...rest
	}: TextBlockProps = $props();
</script>

<!-- Svelte applies directives after `style`, so TextBlock members win over the same CSS property.

     Two of the directives below are worth a word.

     `text-align` is emitted even for its own default. `TextAlignment` is not inherited text
     formatting — `corep.h:487-499` is the whole inherited set, and FontFamily, Foreground,
     FontSize, CharacterSpacing, FontWeight, FontStyle, FontStretch, TextDecorations and
     FlowDirection are in it while TextAlignment is not — so XAML gives every TextBlock `Left`
     rather than letting it take an ancestor's alignment, and emitting the default is what
     reproduces that.

     `letter-spacing` divides by 1000 because `CharacterSpacing` is an `XINT32` in thousandths of
     an em. A case-insensitive sweep of the whole pin returns eighteen non-generated hits: ten
     propagate `m_nCharacterSpacing` from a parent or set the property from a style
     (`framework.cpp:555`, `uielement.cpp:1176`, `Control.cpp:170-172`,
     `ContentPresenter.cpp:1106-1108`, `icon.cpp:83`, `Pivot_themeresources.xaml:479`), two are the
     field's own declaration and a flag enum (`corep.h:493`, `TextBlock.h:41`), and six are one
     value written three times in two copies of the Pivot dictionary —
     `<x:Int32 x:Key="PivotHeaderItemCharacterSpacing">-25</x:Int32>`
     (`Pivot_themeresources.xaml:10`, `:114`, `:144`). Those six are corroboration rather than a
     citation: -25 is tracking of -0.025em on a Pivot header, a plausible number that would be an
     absurd one under any other unit. What the checkout does not carry is the conversion itself,
     which happens in the text layout engine, so the unit here is the documented one. -->
<div
	bind:this={ref}
	class={['root', textStyle === undefined ? undefined : `winui-${textStyle}`, className]}
	{style}
	{...rest}
	dir={textAlignment === 'detectFromContent' ? 'auto' : direction}
	data-text-wrapping={textWrapping}
	data-text-trimming={textTrimming}
	data-max-lines={maxLines > 0 ? '' : undefined}
	data-text-selection-enabled={textSelectionEnabled ? '' : undefined}
	style:font-family={fontFamily}
	style:font-size={typeof fontSize === 'number' ? `${fontSize}px` : fontSize}
	style:font-style={fontStyle}
	style:font-weight={fontWeight}
	style:color={foreground}
	style:letter-spacing={characterSpacing === undefined ? undefined : `${characterSpacing / 1000}em`}
	style:line-height={lineHeight === 0 ? undefined : `${lineHeight}px`}
	style:text-align={textAlignment === 'detectFromContent' ? 'start' : textAlignment}
	style:padding={padding === undefined ? undefined : thicknessToCss(padding)}
	style:-webkit-line-clamp={maxLines > 0 ? maxLines : undefined}
	style:--text-block-selection-highlight-color={selectionHighlightColor}
>
	{#if text !== undefined}
		{text}
	{:else}
		{@render children?.()}
	{/if}
</div>

<style>
	/* TextBlock is block-level, as XAML's stretch default requires. `margin: 0` removes the
	   browser's div-neutral default from the control contract. Font family, size, weight, and
	   foreground are deliberately absent: XAML propagates inherited text formatting through
	   framework.cpp:551 and uielement.cpp:1172, as CSS does. */
	.root {
		display: block;
		box-sizing: border-box;
		/* c1-allow: TextBlock's root has no XAML margin; this clears the user agent's. */
		margin: 0;
		/* DependencyProperty.cpp:739-743 gives TextBlock_TextWrapping NoWrap, unlike CSS's
		   initial wrapping. */
		white-space: nowrap;
		/* TextBlock_IsTextSelectionEnabled takes the generated metadata's FALSE, and the evidence is
		   an absence: DependencyProperty.cpp's TRUE-default block runs :282-337 and carries
		   RichTextBlock_IsTextSelectionEnabled, while the file has no TextBlock_ one. Grep that with
		   a boundary — RichTextBlock's own name contains the string, so a plain search returns the
		   sibling and reads as a refutation. TextBlockPage.xaml:70 corroborates: the example's
		   ToggleSwitch has no IsOn, because the example exists to turn selection on. */
		user-select: none;
	}

	/* `Wrap` breaks inside a word too wide for the line, which is `overflow-wrap: break-word`.
	   The pin carries TextWrapping only as the enumerant, the default and its setters — the
	   layout code that consumes it is not in the sparse checkout — so this pair of rules is the
	   documented semantics rather than a transcribed line. */
	.root[data-text-wrapping='wrap'] {
		white-space: normal;
		overflow-wrap: break-word;
	}

	/* `WrapWholeWords` lets such a word overflow instead, which is `overflow-wrap: normal` and
	   also CSS's initial value; see the rule above for why this is documented rather than cited. */
	.root[data-text-wrapping='wrapWholeWords'] {
		white-space: normal;
		overflow-wrap: normal;
	}

	/* WD-078: `text-overflow` trims a line box that overflows its own width, so these rules reach
	   unwrapped text only and both of XAML's ellipsis modes collapse into CSS's one; see
	   docs/divergences.md. `maxLines` is the other half of that row — a clamped block does trim,
	   by a mechanism that brings its own ellipsis, which is WD-079. */
	.root[data-text-trimming='clip'] {
		overflow: hidden;
		text-overflow: clip;
	}

	/* CharacterEllipsis and WordEllipsis are one rule here, which is half of what WD-078 records. */
	.root[data-text-trimming='characterEllipsis'],
	.root[data-text-trimming='wordEllipsis'] {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* WD-079: -webkit-line-clamp is the browser line counter and always ellipsizes; see docs/divergences.md */
	.root[data-max-lines] {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* The empty final line XAML's trailing `LineBreak` makes and CSS's trailing `<br>` does not.
	   Measured on the browser that writes this repository's baselines: `one<br>two<br>` in a
	   `nowrap` block is 38px, the same as `one<br>two`, where one line is 19px. With this box it
	   is 57px.

	   Unconditional, because a component cannot know that a break is the last thing in it — and
	   it does not need to. The box is zero-width and generates no line of its own: `one` measures
	   19px with it and without, a shrink-to-fit block is 70.14px either way, and every member
	   this rule could collide with was measured rather than reasoned about — a `maxLines` clamp
	   (38px box and 76px scroll height, identical), `textTrimming` under `nowrap` (19px, 220px),
	   and a centred line (unchanged). It is on the block rather than on the break because a box
	   at the *start* of a line stops the whitespace after it from being first on that line, which
	   indented the Gallery's own fourth example by 3.84px when the break carried it.

	   `RichTextBlock` and `Paragraph` will each need their own copy: what makes the line is the
	   layout of the text, and every container that lays out inlines answers for its own. */
	.root::after {
		content: '';
		display: inline-block;
	}

	/* TextBlock's selection default is false; this opt-in restores browser text selection. */
	.root[data-text-selection-enabled] {
		user-select: text;
	}

	/* The fallback is an argued stand-in rather than a transcription, and the argument is that the
	   pin's own two answers disagree. `GetDefaultSelectionHighlightColor` is declared at
	   `corep.h:200` and the comment three lines above it (`:197-199`) states the value — blueberry
	   `0xFF4617b4` on Windows, the system accent on phone — while the only definition in the
	   checkout is a unit-test stub that asserts (`DependencyObject_Stub.cpp:33-37`). No theme
	   dictionary carries the blueberry, and no pinned style sets `SelectionHighlightColor` on a
	   plain `TextBlock` at all; every text surface WinUI does style sets it from
	   `TextControlSelectionHighlightColor` (`PasswordBox_themeresources.xaml:14`,
	   `RichEditBox_themeresources.xaml:8`, `TextBox_themeresources.xaml:183`). This library already
	   paints that token in four controls — TextBox, NumberBox, AutoSuggestBox, PasswordBox — so
	   taking it here makes the fifth consistent rather than leaving Edge's own blue beside them. */
	.root::selection {
		background: var(
			--text-block-selection-highlight-color,
			var(--winui-TextControlSelectionHighlightColor)
		);
	}
</style>
