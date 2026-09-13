<script lang="ts" module>
	import type { InlineProps } from '../internal/inline';

	/**
	 * The generated metadata also names `Click`, `TabIndex`, `FocusState`, `ElementSoundMode`, and
	 * eight `XYFocus*` members. `Click` is the anchor's native `onclick` and arrives through the
	 * rest props. `TabIndex` is `tabindex`, which HTML owns — but it is declared below rather than
	 * left to the rest props, because `tabStop` has to be able to override it and an attribute
	 * written after a spread overrides that spread even when what it writes is `undefined`. ADR
	 * 0009 records this as the third such case.
	 *
	 * `FocusState` is read-only; `ElementSoundMode` has no web sound equivalent; and `XYFocus*` is
	 * directional gamepad focus navigation for which this library has no web mapping. A focus
	 * visual is omitted too: an anchor with an `href` receives the user agent's `:focus-visible`
	 * treatment, while `focus-visual.ts` serves elements this library focuses by script.
	 *
	 * What a `Hyperlink` with no `NavigateUri` cannot do here is WD-081. Upstream that shape is
	 * focusable and invokable from the keyboard; an `<a>` with no `href` is neither.
	 */
	export interface HyperlinkProps extends InlineProps {
		/** NavigateUri. Rendered as the anchor's `href`. */
		navigateUri?: string;
		/** UnderlineStyle. `'single'` is the default — `DependencyProperty.cpp:619-621`. */
		underlineStyle?: 'none' | 'single';
		/** IsTabStop, polarity kept. False takes the element out of the tab order. */
		tabStop?: boolean;
		/**
		 * TabIndex, spelled as HTML's attribute. Declared rather than left to the rest props
		 * because `tabStop` must be able to override it; when `tabStop` is true this value is what
		 * reaches the element. See ADR 0009.
		 */
		tabindex?: number;
		/**
		 * Foreground, as a CSS colour. Inherited from `InlineProps` and restated here because
		 * `Hyperlink` reads it differently from every other inline: it reaches the rest state only.
		 * `UpdateForegroundColor` (`Hyperlink.cpp:590-660`) consults a locally set `Foreground`
		 * in `HYPERLINK_NORMAL` and nowhere else — the pointer-over and pressed cases at `:626`
		 * and `:634` go straight to their theme resources — so a coloured `Hyperlink` takes the
		 * theme's colour back the moment a pointer is over it.
		 */
		foreground?: string;
		ref?: HTMLAnchorElement | null;
	}
</script>

<script lang="ts">
	let {
		navigateUri,
		underlineStyle = 'single',
		tabStop = true,
		tabindex,
		fontFamily,
		fontSize,
		fontStyle,
		fontWeight,
		foreground,
		characterSpacing,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: HyperlinkProps = $props();
</script>

<!-- Svelte applies directives after `style`, so an inline's props win over that same CSS property. -->
<!-- An `<a href>` is already tabbable; writing 0 would claim Click-only hyperlinks are too. -->
<a
	bind:this={ref}
	class={['root', className]}
	{style}
	{...rest}
	href={navigateUri}
	tabindex={tabStop ? tabindex : -1}
	data-underline-style={underlineStyle}
	style:font-family={fontFamily}
	style:font-size={typeof fontSize === 'number' ? `${fontSize}px` : fontSize}
	style:font-style={fontStyle}
	style:font-weight={fontWeight}
	style:--hyperlink-foreground={foreground}
	style:letter-spacing={characterSpacing === undefined ? undefined : `${characterSpacing / 1000}em`}
	>{@render children?.()}</a
>

<style>
	/* Hyperlink is an inline text element, not a control: no box, no padding, no background.

	   The three colours come from `UpdateForegroundColor` (`Hyperlink.cpp:590-660`), and so does
	   the shape of the first rule. That switch consults a locally set `Foreground` in
	   `HYPERLINK_NORMAL` only (`:611-623`, `IsPropertyDefault`); the pointer-over and pressed
	   cases (`:626-640`) look up `HyperlinkForegroundPointerOver` and `HyperlinkForegroundPressed`
	   unconditionally, and `:653-657` writes whichever it got with `SetAnimatedValue` — an
	   animated value that beats the local one, which is the half that makes the override work.
	   So the prop reaches the rest state through a custom property rather than through
	   `style:color`: an inline `color` would win in all three states, and a coloured Hyperlink
	   would keep its colour under the pointer, which upstream's does not.

	   The `SystemControlHyperlink*` fallbacks beside each lookup (`:621`, `:630`, `:638`) are the
	   older-OS path for a missing resource. This library's token layer emits all three keys in
	   every theme, so none of them is reachable here. */
	.root {
		color: var(--hyperlink-foreground, var(--winui-HyperlinkForeground));
		text-decoration-line: underline;
		/* TextBlock.cpp:3484-3488 sets MouseCursorHand whenever the pointer is over a link, with no
		   test for NavigateUri — so the Click-only shape gets the hand too, where the user agent
		   gives a bare `<a>` the text cursor. The pinned Gallery writes that shape:
		   `Controls/DesignGuidance/ColorSections/BackgroundSection.xaml:362`, `:363`, `:375`,
		   `:376`. */
		cursor: pointer;
	}

	.root:hover {
		color: var(--winui-HyperlinkForegroundPointerOver);
	}

	.root:active {
		color: var(--winui-HyperlinkForegroundPressed);
	}

	/* `UpdateUnderline()` draws when UnderlineStyle is not None and the resource is true, the
	   theme is high contrast, or the state is normal (Hyperlink.cpp:663-671). The shipped
	   `HyperlinkUnderlineVisible` resource is false (Hyperlink.cpp:137-152 reads it, and returns
	   true only when the resource is missing, which is an older-OS path), so pointer-over and
	   pressed remove it. The high-contrast half is the rule below. */
	.root:hover,
	.root:active {
		text-decoration-line: none;
	}

	/* The `HasHighContrastTheme()` disjunct of the same line: under high contrast the underline
	   survives both states, because the colour change alone is not a sufficient cue there. It is
	   worth the one selector — measured on the guest, a hovered link and the text around it are
	   both `rgb(255, 255, 255)` in this theme, so without this rule the link is indistinguishable
	   from body text the moment a pointer touches it.

	   `:root` and not `html`, which is load-bearing and was measured rather than assumed: Svelte
	   leaves a `:root` ancestor alone and hashes only the `.root` compound, while `html[...]` is
	   an element-name selector it prunes as unused because this component contains no `<html>`.
	   The `:global()` is belt-and-braces — the two spellings compile byte-identically today — and
	   states that the ancestor is the document's rather than this component's.

	   It is the first component in this library to select on the theme at all. Every other theme
	   difference reaches a component through a token, and `text-decoration-line` is not a value a
	   token can carry. Specificity (0,5,0) against the (0,3,0) rule above it, and that rule is in
	   this same file, so there is no theme block to lose the cascade to. */
	:global(:root[data-theme='high-contrast']) .root:hover,
	:global(:root[data-theme='high-contrast']) .root:active {
		text-decoration-line: underline;
	}

	.root[data-underline-style='none'] {
		text-decoration-line: none;
	}
</style>
