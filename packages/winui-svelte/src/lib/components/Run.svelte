<script lang="ts" module>
	import type { InlineProps } from '../internal/inline';

	export interface RunProps extends InlineProps {
		/**
		 * Text. When defined, takes precedence over the default snippet.
		 *
		 * Prefer it over the snippet when the surrounding spaces matter. XAML keeps the space
		 * between two adjacent `Run`s, and a string prop reaches the DOM exactly as written, while
		 * whitespace at the edges of markup is the template compiler's to trim.
		 */
		text?: string;
		/**
		 * FlowDirection. A member of `Run` and not of `TextElement` — the generated metadata has
		 * `Run_FlowDirection` (`Indexes.g.h:2082`) and no `TextElement_` one — and the layout applies
		 * it only when it was explicitly set (`ParagraphTextSource.cpp:478-479` tests
		 * `IsPropertyDefaultByIndex`, and `:474` is the `DirectionalControl::None` that being unset
		 * means). Leaving it undefined therefore emits nothing of its own and the run takes its
		 * container's direction, which is what `EnumDefs.g.h:906-910`'s `LeftToRight = 0` amounts to
		 * in a document that is already left to right.
		 *
		 * Set, it emits `dir` **and** `unicode-bidi: embed`, because `dir` alone is the wrong
		 * mechanism. See WD-080 and the comment on the root below.
		 */
		flowDirection?: 'leftToRight' | 'rightToLeft';
		/**
		 * HTML's direction attribute, passed through to the root. Declared rather than left to the
		 * rest props because `flowDirection` has to be able to override it; when `flowDirection` is
		 * undefined this value is what reaches the element. ADR 0009 records this as the second of
		 * its two `dir` exceptions.
		 */
		dir?: 'ltr' | 'rtl' | 'auto';
		ref?: HTMLSpanElement | null;
	}
</script>

<script lang="ts">
	let {
		text,
		flowDirection,
		fontFamily,
		fontSize,
		fontStyle,
		fontWeight,
		foreground,
		characterSpacing,
		children,
		class: className,
		style,
		dir: direction,
		ref = $bindable(null),
		...rest
	}: RunProps = $props();
</script>

<!-- Svelte applies directives after `style`, so an inline's props win over that same CSS property.

     `dir` is destructured out of the rest props rather than left in them, for the reason ADR 0009
     gives: this component has to be able to override it, and an attribute written after a spread
     overrides that spread's value even when what it writes is `undefined`. Left in the spread and
     conditionally re-emitted, a consumer's `dir` would be erased on every Run that sets no
     `flowDirection` — which is every Run in this Gallery.

     `unicode-bidi: embed` rides with it, and it is not decoration. HTML gives any element with a
     valid `dir` `unicode-bidi: isolate`, and XAML does not isolate: `ParagraphTextSource.cpp:514-521`
     pushes `LeftToRightEmbedding` or `RightToLeftEmbedding` and `:510-512` pops with
     `PopDirectionalFormatting`, which `TextSegment.cpp:1074-1093` turns into the characters
     `TextSegment.cpp:20-22` names — U+202A, U+202B and U+202C. An embedding leaves the run's
     content inside the surrounding bidi resolution; an isolate takes it out, and the difference
     falls on the neutral characters beside the run. Measured on the browser that writes this
     repository's baselines, `Label: <run rtl>שלום עולם</run> (123)` puts the parenthesised digits
     to the right of the Hebrew under `dir` alone and to its left under `dir` plus `embed` — and
     the pin's own three characters, written literally into the same string, give the second.

     The half that is not reproduced is WD-080: where the run's direction matches its parent's,
     the pin emits a directional mark rather than an embedding (`:523-532`).

     `dir` written by a consumer and not by `flowDirection` keeps HTML's isolate, deliberately. It
     is an HTML attribute the caller wrote as HTML, not a XAML member this component is mapping. -->
<span
	bind:this={ref}
	class={['root', className]}
	{style}
	{...rest}
	dir={flowDirection === undefined ? direction : flowDirection === 'rightToLeft' ? 'rtl' : 'ltr'}
	style:unicode-bidi={flowDirection === undefined ? undefined : 'embed'}
	style:font-family={fontFamily}
	style:font-size={typeof fontSize === 'number' ? `${fontSize}px` : fontSize}
	style:font-style={fontStyle}
	style:font-weight={fontWeight}
	style:color={foreground}
	style:letter-spacing={characterSpacing === undefined ? undefined : `${characterSpacing / 1000}em`}
>
	{#if text !== undefined}{text}{:else}{@render children?.()}{/if}
</span>

<style>
	/* A Run is characters and nothing else. It adds no box of its own, and the declaration below
	   is the user agent's own value for a `<span>` written down: the rule exists so that
	   `class={['root', className]}` has a scoped target, and so that what this element is meant
	   to be is stated at its site rather than borrowed from a stylesheet this library does not
	   own. Everything that makes a Run look like anything arrives through the props above, which
	   is why there is nothing else here. */
	.root {
		display: inline;
	}
</style>
