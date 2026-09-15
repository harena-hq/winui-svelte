<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ParagraphProps {
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
		 * TextIndent. Undefined means the paragraph has no local value and takes its owner's;
		 * `BlockLayoutHelpers.cpp:859` is the `HasLocalOrModifierValue` test and `:873` the
		 * fallback. See the three-member note below.
		 */
		textIndent?: number;
		/**
		 * TextAlignment — `Block.TextAlignment`, so `BlockLayoutHelpers.cpp:301` is its test and
		 * `:316` its fallback. Undefined means no local value. See the three-member note below.
		 */
		textAlignment?: 'left' | 'center' | 'right' | 'justify' | 'start' | 'end' | 'detectFromContent';
		/**
		 * LineHeight — `Block.LineHeight`, tested at `BlockLayoutHelpers.cpp:615` and falling back
		 * at `:648`. Undefined means no local value; `0` is a local value meaning "from the font"
		 * and emits `normal`, which is `ParagraphNode.cpp:1127-1130` forcing `MaxHeight` and
		 * `:1159` taking the line's own height. See the three-member note below.
		 */
		lineHeight?: number;
		/**
		 * Margin — `Block.Margin`. XAML's Thickness grammar: a number, or `"8"`, `"8,5"`,
		 * `"1,2,3,4"`.
		 */
		margin?: number | string;
		/** Inlines, as the default snippet. */
		children?: Snippet;
		class?: string;
		style?: string;
		/**
		 * HTML's direction attribute, passed through to the root, and overridden by
		 * `textAlignment="detectFromContent"`. ADR 0009, the same exception `TextBlock` takes.
		 */
		dir?: 'ltr' | 'rtl' | 'auto';
		ref?: HTMLParagraphElement | null;
		[key: string]: unknown;
	}

	/* The three members above that a Paragraph shares with its owner are one rule, and upstream
	 * writes it out four times: read the paragraph's value if the paragraph has a local one, the
	 * control's otherwise. `BlockLayoutHelpers.cpp:607` states it in a sentence, and `:278-279` and
	 * `:573-574` say why it has to be stated — none of these members is in XAML's inherited text
	 * formatting record (`corep.h:487-499`), so XAML has no cascade to fall back through and writes
	 * the fallback by hand.
	 *
	 * All three are inherited properties in CSS, so there is no fallback to write here. An undefined
	 * prop is `HasLocalOrModifierValue == false`, and the cascade is the `if`. That is why none of
	 * the three carries a default: a default would be a local value, and the paragraph would stop
	 * taking its owner's.
	 *
	 * The fourth member upstream resolves this way is `LineStackingStrategy`, which this library
	 * does not build; `RichTextBlock.svelte` records why.
	 *
	 * `TextWrapping` and `TextTrimming` are deliberately absent. Both belong to the control alone:
	 * `GetTextTrimming` says so in its own header (`BlockLayoutHelpers.cpp:339-340` — "not exposed
	 * at paragraph level"), and `GetTextWrapping` (`:813-836`) reads the layout owner and is never
	 * passed a paragraph at all. */
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
		textIndent,
		textAlignment,
		lineHeight,
		margin,
		children,
		class: className,
		style,
		dir: direction,
		ref = $bindable(null),
		...rest
	}: ParagraphProps = $props();
</script>

<!-- Undefined is HasLocalOrModifierValue == false: BlockLayoutHelpers.cpp:301, :615 and :859
     choose the owner otherwise, and CSS inherits the three declarations by the same rule. -->
<p
	bind:this={ref}
	class={['root', className]}
	{style}
	{...rest}
	dir={textAlignment === 'detectFromContent' ? 'auto' : direction}
	style:font-family={fontFamily}
	style:font-size={typeof fontSize === 'number' ? `${fontSize}px` : fontSize}
	style:font-style={fontStyle}
	style:font-weight={fontWeight}
	style:color={foreground}
	style:letter-spacing={characterSpacing === undefined ? undefined : `${characterSpacing / 1000}em`}
	style:text-indent={textIndent === undefined ? undefined : `${textIndent}px`}
	style:text-align={textAlignment === undefined
		? undefined
		: textAlignment === 'detectFromContent'
			? 'start'
			: textAlignment}
	style:line-height={lineHeight === undefined
		? undefined
		: lineHeight === 0
			? 'normal'
			: `${lineHeight}px`}
	style:margin={margin === undefined ? undefined : thicknessToCss(margin)}
>
	{@render children?.()}
</p>

<style>
	.root {
		display: block;
		box-sizing: border-box;
		/* c1-allow: Block.Margin's zero Thickness clears the user agent paragraph margin. */
		margin: 0;
		/* TextTrimming belongs to the owner (BlockLayoutHelpers.cpp:339-340). Neither text-overflow
		   nor overflow inherits, and RichTextBlock's scoped selector cannot match this scoped root. */
		overflow: var(--rich-text-block-overflow, visible);
		text-overflow: var(--rich-text-block-text-overflow, clip);
	}

	/* XAML's trailing LineBreak makes an empty final line; CSS's trailing br does not. This
	   zero-width inline box restores it; TextBlock.svelte documents the measurement and placement. */
	.root::after {
		content: '';
		display: inline-block;
	}
</style>
