<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface RichTextBlockProps {
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
		/**
		 * TextWrapping. Defaults to `wrap`, where `TextBlock`'s defaults to `noWrap` —
		 * `DependencyProperty.cpp:735-737` and `:740-743` are consecutive cases of one switch.
		 */
		textWrapping?: 'noWrap' | 'wrap' | 'wrapWholeWords';
		/**
		 * TextTrimming. A member of the control and not of a `Paragraph` —
		 * `BlockLayoutHelpers.cpp:339-340` says so — so it reaches the paragraphs through the two
		 * custom properties the stylesheet below sets. See WD-078 for what CSS does with it.
		 */
		textTrimming?: 'none' | 'clip' | 'characterEllipsis' | 'wordEllipsis';
		/**
		 * TextIndent, in pixels, and a first-line indent: `BlockLayoutHelpers.cpp:149` passes it as
		 * `TextParagraphProperties`'s `fistLineIndent` (`TextParagraphProperties.h:29`, read back at
		 * `:158-161`), which is CSS `text-indent`'s own default behaviour.
		 */
		textIndent?: number;
		/**
		 * LineHeight, in pixels. Undefined is no local value; zero is XAML's local "from the
		 * font" value, which maps to CSS `normal` so Paragraph can distinguish it from unset.
		 */
		lineHeight?: number;
		/** TextAlignment. */
		textAlignment?: 'left' | 'center' | 'right' | 'justify' | 'start' | 'end' | 'detectFromContent';
		/**
		 * IsTextSelectionEnabled. Defaults to `true`, where `TextBlock`'s defaults to `false`:
		 * `DependencyProperty.cpp:282` puts this one in the `SetBool(TRUE)` block, and the file has
		 * no `TextBlock_IsTextSelectionEnabled` case at all.
		 */
		textSelectionEnabled?: boolean;
		/**
		 * SelectionHighlightColor, as a CSS colour. Its default is
		 * `GetDefaultSelectionHighlightColor()` (`DependencyProperty.cpp:375`), the same call
		 * `TextBlock`'s `:379` takes; the argument for the token this library falls back to instead
		 * is written once, on `TextBlock.svelte`'s own selection rule.
		 */
		selectionHighlightColor?: string;
		/** Padding. XAML's Thickness grammar — a number, or "8", "8,5", "1,2,3,4". */
		padding?: number | string;
		/** Blocks, as the default snippet. */
		children?: Snippet;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		/**
		 * HTML's direction attribute, passed through to the root. Declared rather than left to the
		 * rest props because `textAlignment="detectFromContent"` needs `dir="auto"` and overrides
		 * this one; every other alignment leaves it alone. ADR 0009.
		 */
		dir?: 'ltr' | 'rtl' | 'auto';
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	/* WD-088: OverflowContentTarget, HasOverflowContent, MaxLines and RichTextBlockOverflow are
	 * one declined mechanism. PageNode.cpp:369 starts a line budget, :531-535 spends it across
	 * paragraphs, and :585-592 creates the overflow break; CSS has neither a budget across sibling
	 * blocks nor a named overflow target. See docs/divergences.md.
	 *
	 * TextHighlighters waits for the CSS Custom Highlight API unit that needs it. LineStackingStrategy
	 * is MaxHeight by default (EnumDefs.g.h:1274-1279), and ParagraphNode.cpp:1127-1130 forces it
	 * for a non-positive line height; its other strategies need per-line offsets CSS cannot set.
	 * No RichTextBlock ramp class is added: the two keys exist only in generic.xaml, not the control
	 * pin or token extraction, and IGNORED_SETTERS makes their generated classes TextBlock-identical.
	 * IsColorFontEnabled, OpticalMarginAlignment, TextReadingOrder, TextLineBounds and SelectionFlyout
	 * stay on the same shelf as TextBlock's deferred members. */
</script>

<script lang="ts">
	import { thicknessToCss } from '../internal/thickness';

	let {
		fontFamily,
		fontSize,
		fontStyle,
		fontWeight,
		foreground,
		characterSpacing,
		textWrapping = 'wrap',
		textTrimming = 'none',
		textIndent = 0,
		lineHeight,
		textAlignment = 'left',
		textSelectionEnabled = true,
		selectionHighlightColor,
		padding,
		children,
		class: className,
		style,
		dir: direction,
		ref = $bindable(null),
		...rest
	}: RichTextBlockProps = $props();
</script>

<!-- Svelte applies directives after `style`, so RichTextBlock members win over the same CSS
     property.

     `text-indent` and `text-align` are emitted even for their own defaults, and `line-height` is
     not. All three are inherited in CSS and none of the three is in XAML's inherited text
     formatting record (`corep.h:487-499`) — `BlockLayoutHelpers.cpp:278-279` says so in its own
     words from the other side, which is why it has to write the paragraph-to-owner fallback by
     hand. So a value an ancestor set would reach a RichTextBlock that upstream would give its
     default, and emitting the default is what stops it. `LineHeight` is the exception, because its
     default is not a value: `0` means "take the line height from the font", and what produces that
     is the absence of a declaration rather than a declaration of zero. Given `0` explicitly it
     emits `normal`, which is the same thing said out loud — `Paragraph` has to tell the two apart,
     and this component spells it the same way so the pair reads as one rule. -->
<div
	bind:this={ref}
	class={['root', className]}
	{style}
	{...rest}
	dir={textAlignment === 'detectFromContent' ? 'auto' : direction}
	data-text-wrapping={textWrapping}
	data-text-trimming={textTrimming}
	data-text-selection-enabled={textSelectionEnabled ? 'true' : 'false'}
	style:font-family={fontFamily}
	style:font-size={typeof fontSize === 'number' ? `${fontSize}px` : fontSize}
	style:font-style={fontStyle}
	style:font-weight={fontWeight}
	style:color={foreground}
	style:letter-spacing={characterSpacing === undefined ? undefined : `${characterSpacing / 1000}em`}
	style:line-height={lineHeight === undefined
		? undefined
		: lineHeight === 0
			? 'normal'
			: `${lineHeight}px`}
	style:text-indent={`${textIndent}px`}
	style:text-align={textAlignment === 'detectFromContent' ? 'start' : textAlignment}
	style:padding={padding === undefined ? undefined : thicknessToCss(padding)}
	style:--rich-text-block-selection-highlight-color={selectionHighlightColor}
>
	{@render children?.()}
</div>

<style>
	/* RichTextBlock is block-level; margin: 0 clears the user agent value absent from XAML. */
	.root {
		display: block;
		box-sizing: border-box;
		/* c1-allow: RichTextBlock's root has no XAML margin; this clears the user agent's. */
		margin: 0;
	}

	/* DependencyProperty.cpp:735-737 and :282 give RichTextBlock CSS-initial defaults for wrapping
	   and selection, but white-space, overflow-wrap and user-select inherit, so every value is local. */
	.root[data-text-wrapping='noWrap'] {
		white-space: nowrap;
	}
	/* The pin carries enumerants, defaults and setters but not the layout consumer; this is the
	   documented semantics, as in TextBlock.svelte. */
	.root[data-text-wrapping='wrap'] {
		white-space: normal;
		overflow-wrap: break-word;
	}
	.root[data-text-wrapping='wrapWholeWords'] {
		white-space: normal;
		overflow-wrap: normal;
	}

	/* WD-078: CSS has one ellipsis and trims line boxes; see docs/divergences.md. The custom
	   property crosses Paragraph's scoped component boundary to its non-inherited overflow. */
	.root[data-text-trimming='clip'] {
		/* c1-allow: component-boundary channel for RichTextBlock trimming. */
		--rich-text-block-overflow: hidden;
		/* c1-allow: component-boundary channel for RichTextBlock trimming. */
		--rich-text-block-text-overflow: clip;
		text-overflow: clip;
	}
	.root[data-text-trimming='characterEllipsis'],
	.root[data-text-trimming='wordEllipsis'] {
		/* c1-allow: component-boundary channel for RichTextBlock trimming. */
		--rich-text-block-overflow: hidden;
		/* c1-allow: component-boundary channel for RichTextBlock trimming. */
		--rich-text-block-text-overflow: ellipsis;
		text-overflow: ellipsis;
	}

	.root[data-text-selection-enabled='true'] {
		user-select: text;
	}
	.root[data-text-selection-enabled='false'] {
		user-select: none;
	}

	/* This value and its argument are TextBlock.svelte's: use the same token fallback. */
	.root::selection {
		background: var(
			--rich-text-block-selection-highlight-color,
			var(--winui-TextControlSelectionHighlightColor)
		);
	}

	/* No trailing-break box: RichTextBlock lays out Blocks, while LineBreak is an Inline. Paragraph
	   owns the inline layout and therefore its compensating box. */
</style>
