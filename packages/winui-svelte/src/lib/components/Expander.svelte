<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ExpanderProps {
		/** Header. The header content, as a snippet. */
		header?: Snippet;
		/** Content — the panel the header reveals, as the default snippet. */
		children?: Snippet;
		/**
		 * IsExpanded, under HTML's name for it — ADR 0009. `open` is in that ADR's closed
		 * reserved set, and it is also what bits-ui's `Collapsible` calls this state, so a
		 * consumer holding both surfaces meets one name rather than two.
		 */
		open?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onOpenChange?: (open: boolean) => void;
		/** ExpandDirection. Whether the content is revealed below the header or above it. */
		expandDirection?: 'down' | 'up';
		/** IsEnabled, inverted to the HTML attribute — ADR 0009. */
		disabled?: boolean;
		/**
		 * HorizontalContentAlignment. A `Control` member rather than an Expander one, exposed
		 * because the Gallery's second example is about varying it and because the default is
		 * not the one a reader expects: measured on the reference guest, the content is
		 * **centred**, not left-aligned.
		 */
		horizontalContentAlignment?: 'left' | 'center' | 'right' | 'stretch';
		class?: string;
		style?: string;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// HeaderTemplate and HeaderTemplateSelector, and ContentTemplate and
	// ContentTemplateSelector, are absent: snippets select the rendering for their content.
	// Expanding and Collapsed are recoverable through onOpenChange; TemplateSettings exists
	// upstream only to measure the animation translation; VerticalContentAlignment never
	// varies from its centered default and is represented once in CSS.
	//
	// WD-010: both corner radii below are derived from the current direction and open state
	// together. Upstream they are not — Expander.cpp:129 updates the direction states without
	// updating the expand states, so changing ExpandDirection while expanded leaves the
	// header filtered for the direction it is no longer expanding in, and the seam gets a
	// notch on one side. See docs/divergences.md.
</script>

<script lang="ts">
	import { Collapsible } from 'bits-ui';

	let {
		header,
		children,
		open = $bindable(false),
		onOpenChange,
		expandDirection = 'down',
		disabled = false,
		horizontalContentAlignment = 'center',
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ExpanderProps = $props();
</script>

<Collapsible.Root bind:ref bind:open {onOpenChange} {disabled}>
	{#snippet child({ props })}
		<div
			{...props}
			class={['root', className]}
			{style}
			data-direction={expandDirection}
			data-content-align={horizontalContentAlignment}
			{...rest}
		>
			<Collapsible.Trigger>
				{#snippet child({ props })}
					<button {...props} type="button" class={['header', 'winui-BodyTextBlockStyle']}>
						<span class="header-content">{@render header?.()}</span>
						<span class="chevron"></span>
					</button>
				{/snippet}
			</Collapsible.Trigger>
			<div class="clip">
				<Collapsible.Content>
					{#snippet child({ props })}
						<div {...props} class={['content', 'winui-BodyTextBlockStyle']}>
							{@render children?.()}
						</div>
					{/snippet}
				</Collapsible.Content>
			</div>
		</div>
	{/snippet}
</Collapsible.Root>

<style>
	.root {
		/* c1-allow: Expander.xaml:33 and :62 filter the shared ControlCornerRadius for each expand state */
		--corner: var(--winui-ControlCornerRadius);
		/* c1-allow: Expander.xaml:33 and :62 require the focus ring to grow by both focus thicknesses */
		--band: calc(
			var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness)
		);
		/* c1-allow: Expander.xaml:33 and :62 require the focus ring to follow the filtered header corner */
		--focus-corner: calc(var(--corner) + var(--band));
		display: flex;
		flex-direction: column;
		box-sizing: border-box;
		width: fit-content;
		min-width: var(--winui-FlyoutThemeMinWidth);
	}

	.root[data-direction='up'] {
		flex-direction: column-reverse;
	}

	.header {
		/* c1-allow: Expander.xaml:33 and :62 filter this shared corner by expand direction */
		--header-radius: var(--corner);
		/* c1-allow: Expander.xaml:33 and :62 filter the matching focus corner by expand direction */
		--focus-radius: var(--focus-corner);
		position: relative;
		display: flex;
		align-items: center;
		box-sizing: border-box;
		width: 100%;
		min-height: var(--winui-ExpanderMinHeight);
		padding: var(--winui-ExpanderHeaderPadding);
		background: var(--winui-ExpanderHeaderBackground) padding-box;
		color: var(--winui-ExpanderHeaderForeground);
		border: var(--winui-ExpanderHeaderBorderThickness) solid var(--winui-ExpanderHeaderBorderBrush);
		border-radius: var(--header-radius);
		cursor: pointer;
		text-align: left;
		/* The user agent's own `:focus-visible` ring is a second one; see Button.svelte. */
		outline: none;
	}

	.root[data-direction='down'] .header[data-state='open'] {
		/* c1-allow: Expander.xaml:62 keeps only the header's top corners in ExpandDown */
		--header-radius: var(--corner) var(--corner) 0 0;
		/* c1-allow: Expander.xaml:62 keeps the focus ring aligned to ExpandDown's top corners */
		--focus-radius: var(--focus-corner) var(--focus-corner) 0 0;
	}

	.root[data-direction='up'] .header[data-state='open'] {
		/* c1-allow: Expander.xaml:33 keeps only the header's bottom corners in ExpandUp */
		--header-radius: 0 0 var(--corner) var(--corner);
		/* c1-allow: Expander.xaml:33 keeps the focus ring aligned to ExpandUp's bottom corners */
		--focus-radius: 0 0 var(--focus-corner) var(--focus-corner);
	}

	.header-content {
		flex: 1 1 auto;
		min-width: 0;
	}

	.chevron {
		display: flex;
		flex: 0 0 auto;
		align-items: center;
		justify-content: center;
		box-sizing: border-box;
		width: var(--winui-ExpanderChevronButtonSize);
		height: var(--winui-ExpanderChevronButtonSize);
		margin: var(--winui-ExpanderChevronMargin);
		background: var(--winui-ExpanderChevronBackground);
		color: var(--winui-ExpanderChevronForeground);
		border: var(--winui-ExpanderChevronBorderThickness) solid
			var(--winui-ExpanderChevronBorderBrush);
		border-radius: var(--winui-ControlCornerRadius);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-ExpanderChevronGlyphSize);
		/* c1-allow: Expander_themeresources.xaml:281, the glyph is a 12×12 icon centered in its box rather than text */
		line-height: 1;
	}

	/* WD-006: upstream's chevron is an `AnimatedIcon` — `AnimatedChevronUpDownSmallVisual-
	   Source` at `Expander_themeresources.xaml:282` — that morphs between the two directions.
	   This draws the two glyphs its own `FallbackIconSource` names and swaps them, so there is
	   no motion between them and the shape differs by a pixel: measured on the reference guest
	   at 12px, the original's ink is 8x4 and this is 9x5, both centred in the 32px button.
	   See docs/divergences.md. */
	.chevron::before {
		content: var(--winui-ExpanderChevronDownGlyph);
	}

	.root[data-direction='down'] .header[data-state='open'] .chevron::before,
	.root[data-direction='up'] .header[data-state='closed'] .chevron::before {
		content: var(--winui-ExpanderChevronUpGlyph);
	}

	.header:hover .chevron {
		background: var(--winui-ExpanderChevronPointerOverBackground);
		color: var(--winui-ExpanderChevronPointerOverForeground);
		border-color: var(--winui-ExpanderChevronBorderPointerOverBrush);
	}

	.header:hover {
		color: var(--winui-ExpanderHeaderForegroundPointerOver);
		border-color: var(--winui-ExpanderHeaderBorderPointerOverBrush);
	}

	.header:active .chevron {
		background: var(--winui-ExpanderChevronPressedBackground);
		color: var(--winui-ExpanderChevronPressedForeground);
		border-color: var(--winui-ExpanderChevronBorderPressedBrush);
	}

	.header:active {
		color: var(--winui-ExpanderHeaderForegroundPressed);
		border-color: var(--winui-ExpanderHeaderBorderPressedBrush);
	}

	.header:disabled {
		color: var(--winui-ExpanderHeaderDisabledForeground);
		border-color: var(--winui-ExpanderHeaderDisabledBorderBrush);
		cursor: default;
	}

	.header:disabled .chevron {
		background: var(--winui-ExpanderChevronBackground);
		color: var(--winui-ExpanderHeaderDisabledForeground);
		border-color: var(--winui-ExpanderHeaderDisabledBorderBrush);
	}

	.header:focus-visible::before {
		content: '';
		position: absolute;
		inset: calc(-1 * var(--band));
		border-radius: var(--focus-radius);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	.clip {
		overflow: hidden;
	}

	/* The primitive does not unmount the closed content; it sets the `hidden` attribute on it
	   and leaves the element in the DOM, so that a closing transition has something to run on.
	   `hidden` hides an element through the user agent's `[hidden] { display: none }`, and an
	   author `display` beats a user-agent one whatever the specificity — so `.content`'s own
	   `display: flex` below silently un-hid it, and every closed Expander drew its content at
	   full height. Measured on the reference guest before this rule: `hidden` present,
	   `display` computed `flex`, root 101px tall in all four states instead of 48 when closed.

	   It is stated here rather than avoided by dropping `display: flex`, because the flex box
	   is what centres the content the way `HorizontalContentAlignment` does. Any control in
	   this library that gives a primitive's content a `display` owes itself the same rule. */
	.content[hidden] {
		display: none;
	}

	.content {
		display: flex;
		align-items: center;
		box-sizing: border-box;
		min-height: var(--winui-ExpanderMinHeight);
		padding: var(--winui-ExpanderContentPadding);
		background: var(--winui-ExpanderContentBackground) padding-box;
		border-style: solid;
		border-color: var(--winui-ExpanderContentBorderBrush);
		transform: translateY(0);
		/* c1-allow: Expander.xaml:44, the opening SplineDoubleKeyFrame records 333ms and its key spline */
		transition: transform 333ms cubic-bezier(0, 0, 0, 1);
	}

	.root[data-direction='down'] .content {
		border-width: var(--winui-ExpanderContentDownBorderThickness);
		border-radius: 0 0 var(--corner) var(--corner);
	}

	.root[data-direction='up'] .content {
		border-width: var(--winui-ExpanderContentUpBorderThickness);
		border-radius: var(--corner) var(--corner) 0 0;
	}

	.root[data-content-align='left'] .content {
		justify-content: flex-start;
	}

	.root[data-content-align='center'] .content {
		justify-content: center;
	}

	.root[data-content-align='right'] .content {
		justify-content: flex-end;
	}

	.root[data-content-align='stretch'] .content {
		justify-content: flex-start;
	}

	.root[data-content-align='stretch'] .content > :global(*) {
		flex: 1 1 auto;
	}

	.root[data-direction='down'] .content[data-starting-style],
	.root[data-direction='down'] .content[data-ending-style] {
		transform: translateY(-100%);
	}

	.root[data-direction='up'] .content[data-starting-style],
	.root[data-direction='up'] .content[data-ending-style] {
		transform: translateY(100%);
	}

	/* WD-011: 167ms in both directions. Upstream hides the content at 167ms collapsing
	   downward (Expander.xaml:82) and at 200ms collapsing upward (:53), 33ms after its own
	   slide has ended; the primitive's presence layer removes the node when its transition
	   settles, so there is no second clock here to hold it. See docs/divergences.md. */
	.content[data-ending-style] {
		/* c1-allow: Expander.xaml:57, the closing SplineDoubleKeyFrame records 167ms and its key spline */
		transition-duration: 167ms;
		/* c1-allow: Expander.xaml:57, the closing SplineDoubleKeyFrame records 167ms and its key spline */
		transition-timing-function: cubic-bezier(1, 1, 0, 1);
	}

	@media (prefers-reduced-motion: reduce) {
		.content {
			/* c1-allow: Expander.xaml:44, this accessibility override replaces the opening storyboard duration */
			transition-duration: 0s;
		}
	}
</style>
