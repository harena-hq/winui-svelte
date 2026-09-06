<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface TitleBarProps {
		/** Title — the window title, rendered left of the content slot. */
		title?: string;
		/**
		 * No direct WinUI member; narrows `IconSource` to a Segoe Fluent Icons code point
		 * as uppercase hex, e.g. `'E790'`.
		 */
		iconGlyph?: string | null;
		/** IsBackButtonVisible — shown only when true; the app decides whether there is anywhere to go back to. */
		backButtonVisible?: boolean;
		/** IsBackButtonEnabled. */
		backButtonEnabled?: boolean;
		/** BackRequested — fires when the back button is pressed and enabled. */
		onBackRequested?: () => void;
		/** IsPaneToggleButtonVisible — an app whose NavigationView carries its own toggle hides this one. */
		paneToggleButtonVisible?: boolean;
		/** PaneToggleRequested — fires when the pane toggle is pressed. */
		onPaneToggleRequested?: () => void;
		/** Content — the wide middle slot. The Gallery puts a search box here. */
		content?: Snippet;
		/** RightHeader — the narrow slot at the right end, before the window's own controls would be. */
		rightHeader?: Snippet;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import ToolTip from './ToolTip.svelte';

	let {
		title,
		iconGlyph,
		backButtonVisible = false,
		backButtonEnabled = true,
		onBackRequested,
		paneToggleButtonVisible = false,
		onPaneToggleRequested,
		content,
		rightHeader,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: TitleBarProps = $props();

	// WD-005: WinUI hides the title when the content stops fitting; we do not. See
	// docs/divergences.md.
	//
	// `TitleBar.cpp`'s `UpdateHeight` is one rule — compact when `Content`, `LeftHeader`
	// and `RightHeader` are all absent. This component has no `LeftHeader`, so the
	// condition reduces to the other two. Keyed on a data attribute rather than a CSS
	// class because a test reads it.
	const height = $derived(
		content === undefined && rightHeader === undefined ? 'compact' : 'expanded'
	);

	function handleBack() {
		if (!backButtonEnabled) return;
		onBackRequested?.();
	}

	function handlePaneToggle() {
		onPaneToggleRequested?.();
	}

	// The tooltip's trigger props carry the primitive's own `onclick` — it is what
	// dismisses the tooltip when its trigger is pressed — and a button with a handler of
	// its own has to run both. This composes them in the script rather than inline in the
	// markup, and that is not a style choice: `svelte-package` ships the component's
	// source, so a type annotation inside a markup expression is a parse error in the
	// consumer's build while this package's own `check` and `build` stay green.
	function withTriggerClick(props: Record<string, unknown>, handler: () => void) {
		return (event: MouseEvent) => {
			(props.onclick as ((event: MouseEvent) => void) | undefined)?.(event);
			handler();
		};
	}
</script>

<div bind:this={ref} class={['root', className]} {style} data-height={height} {...rest}>
	<div class="left-padding"></div>

	<!-- Both tooltips are attached in `TitleBar.cpp` rather than in the template — the
	     code-behind half of a control's surface, which `docs/surface.md` records.
	     `LoadBackButton` at :881 reads `NavigationBackButtonToolTip` (en-us "Back") and
	     `LoadPaneToggleButton` at :906 reads the button's own automation name (en-us
	     "Toggle Navigation"), which is why that string is also this button's `aria-label`.

	     `{...props}` comes first and `onclick` is composed rather than replaced. The
	     snippet's props carry the primitive's own handlers, `onclick` among them — it is
	     what dismisses the tooltip when its trigger is pressed — so a spread that lands
	     after this component's handler silently replaces it and the button stops working,
	     and one that lands before it silently drops the dismissal. Measured both ways. -->
	{#if backButtonVisible}
		<ToolTip content="Back">
			{#snippet children(props)}
				<button
					{...props}
					type="button"
					class="back-button title-button"
					aria-label="Back"
					disabled={!backButtonEnabled}
					onclick={withTriggerClick(props, handleBack)}
				></button>
			{/snippet}
		</ToolTip>
	{/if}

	{#if paneToggleButtonVisible}
		<ToolTip content="Toggle Navigation">
			{#snippet children(props)}
				<button
					{...props}
					type="button"
					class="pane-toggle-button title-button"
					aria-label="Toggle Navigation"
					onclick={withTriggerClick(props, handlePaneToggle)}
				></button>
			{/snippet}
		</ToolTip>
	{/if}

	<div class="left-header-padding"></div>

	{#if iconGlyph}
		<span class="icon">{String.fromCodePoint(parseInt(iconGlyph, 16))}</span>
	{/if}

	{#if title}
		<span class="title winui-CaptionTextBlockStyle">{title}</span>
	{/if}

	{#if content}
		<div class="content-presenter">{@render content()}</div>
	{/if}

	{#if rightHeader}
		<div class="right-header">{@render rightHeader()}</div>
	{/if}

	<div class="min-drag-region"></div>
	<div class="right-padding"></div>
</div>

<style>
	.root {
		/* A row, not a thing that gives way. As a flex child of a column whose other child
		   is taller than the space, the default `flex-shrink: 1` squeezed 48 pixels into
		   41. */
		flex: 0 0 auto;
		display: flex;
		align-items: stretch;
		color: var(--winui-TitleBarForegroundBrush);
	}

	.root[data-height='compact'] {
		height: var(--winui-TitleBarCompactHeight);
	}

	.root[data-height='expanded'] {
		height: var(--winui-TitleBarExpandedHeight);
	}

	.left-padding {
		width: var(--winui-TitleBarLeftPaddingWidth);
		flex: 0 0 auto;
	}

	.right-padding {
		width: var(--winui-TitleBarRightPaddingWidth);
		flex: 0 0 auto;
	}

	/* Column 10 — TitleBar.xaml:190. The row keeps it clear so there is always somewhere to
	   grab the window, and the content column ends before it rather than at the row's edge.
	   `TitleBarRightPaddingWidth` beside it is 0 in the theme resource and filled at run
	   time by `UpdatePadding` from the window's caption-button inset, which a web page does
	   not have; that one stays 0 here. */
	.min-drag-region {
		width: var(--winui-TitleBarMinDragRegionWidth);
		flex: 0 0 auto;
	}

	.left-header-padding {
		width: var(--winui-TitleBarLeftHeaderPaddingWidth);
		flex: 0 0 auto;
	}

	.title-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		/* c1-allow: TitleBar_themeresources.xaml:113, Margin="2" (back) and :183 (pane toggle) */
		margin: 2px;
		padding: 0;
		border: 0;
		border-radius: var(--winui-ControlCornerRadius);
		color: inherit;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: TitleBar_themeresources.xaml:106 (back) and :176 (pane toggle), FontSize="16" */
		font-size: 16px;
		line-height: normal;
		cursor: pointer;
	}

	.back-button {
		width: var(--winui-TitleBarBackButtonWidth);
		background: var(--winui-TitleBarBackButtonBackground);
		color: var(--winui-TitleBarBackButtonForeground);
	}

	/* WD-006: the original's glyph is an `AnimatedIcon` that plays on pointer-over and
	   press; this is its `FallbackIconSource`, drawn with no transition between states.
	   See docs/divergences.md. */
	.back-button::before {
		/* c1-allow: TitleBar_themeresources.xaml:112, Content="&#xE72B;" */
		content: '\00e72b';
		display: block;
	}

	.back-button:hover:not(:disabled) {
		background: var(--winui-TitleBarBackButtonBackgroundPointerOver);
		color: var(--winui-TitleBarBackButtonForegroundPointerOver);
	}

	.back-button:active:not(:disabled) {
		background: var(--winui-TitleBarBackButtonBackgroundPressed);
		color: var(--winui-TitleBarBackButtonForegroundPressed);
	}

	.back-button:disabled {
		background: var(--winui-TitleBarBackButtonBackgroundDisabled);
		color: var(--winui-TitleBarBackButtonForegroundDisabled);
		cursor: default;
	}

	.pane-toggle-button {
		width: var(--winui-TitleBarPaneToggleButtonWidth);
		background: var(--winui-TitleBarPaneToggleButtonBackground);
		color: var(--winui-TitleBarPaneToggleButtonForeground);
	}

	/* WD-006 again, for the same reason and from the same pair of styles. */
	.pane-toggle-button::before {
		/* c1-allow: TitleBar_themeresources.xaml:182, Content="&#xE700;" */
		content: '\00e700';
		display: block;
	}

	.pane-toggle-button:hover {
		background: var(--winui-TitleBarPaneToggleButtonBackgroundPointerOver);
		color: var(--winui-TitleBarPaneToggleButtonForegroundPointerOver);
	}

	.pane-toggle-button:active {
		background: var(--winui-TitleBarPaneToggleButtonBackgroundPressed);
		color: var(--winui-TitleBarPaneToggleButtonForegroundPressed);
	}

	.pane-toggle-button:disabled {
		background: var(--winui-TitleBarPaneToggleButtonBackgroundDisabled);
		color: var(--winui-TitleBarPaneToggleButtonForegroundDisabled);
	}

	/* `align-self`, not only `align-items`: the row is `align-items: stretch`, and an item
	   with a `max-height` stretches only as far as that cap and then sits at the top of the
	   row. `align-items: center` below centres the glyph inside the 16-pixel box; it does
	   nothing about where that box sits in a 48-pixel row. Upstream says which it wants —
	   `PART_Icon` is `VerticalAlignment="Center"`, TitleBar.xaml:225 — and the title beside
	   it says the same at :244, where it currently holds by accident: no `max-height`, so it
	   stretches the full row and centres its own text. */
	.icon {
		display: inline-flex;
		align-self: center;
		align-items: center;
		margin: var(--winui-TitleBarIconMargin);
		max-width: var(--winui-TitleBarIconMaxWidth);
		max-height: var(--winui-TitleBarIconMaxHeight);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-TitleBarIconMaxHeight);
		line-height: normal;
		color: inherit;
	}

	.title {
		display: inline-flex;
		align-self: center;
		align-items: center;
		margin: var(--winui-TitleBarTitleMargin);
		min-width: var(--winui-TitleBarTitleMinWidth);
		color: inherit;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.content-presenter {
		flex: 1 1 auto;
		min-width: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		/* The column is `*` — TitleBar.xaml:186 — and its content keeps its own width, so
		   a window narrow enough clips the content rather than squeezing it. */
		overflow: hidden;
	}

	.right-header {
		flex: 0 0 auto;
		display: flex;
		align-items: center;
	}
</style>
