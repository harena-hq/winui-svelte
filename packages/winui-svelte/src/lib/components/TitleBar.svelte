<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** The window title, rendered left of the content slot. */
		title?: string;
		/** A Segoe Fluent Icons code point as uppercase hex, e.g. `'E790'`. */
		iconGlyph?: string | null;
		/** Shown only when true; the app decides whether there is anywhere to go back to. */
		backButtonVisible?: boolean;
		backButtonEnabled?: boolean;
		onback?: () => void;
		paneToggleVisible?: boolean;
		onpanetoggle?: () => void;
		/** The wide middle slot. The Gallery puts a search box here. */
		content?: Snippet;
		/** The narrow slot at the right end, before the window's own controls would be. */
		rightHeader?: Snippet;
	}

	let {
		title,
		iconGlyph,
		backButtonVisible = false,
		backButtonEnabled = true,
		onback,
		paneToggleVisible = false,
		onpanetoggle,
		content,
		rightHeader
	}: Props = $props();

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
		onback?.();
	}

	function handlePaneToggle() {
		onpanetoggle?.();
	}
</script>

<div class="root" data-height={height}>
	<div class="left-padding"></div>

	{#if backButtonVisible}
		<button
			type="button"
			class="back-button title-button"
			aria-label="Back"
			disabled={!backButtonEnabled}
			onclick={handleBack}
		></button>
	{/if}

	{#if paneToggleVisible}
		<button
			type="button"
			class="pane-toggle-button title-button"
			aria-label="Navigation"
			onclick={handlePaneToggle}
		></button>
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

	.icon {
		display: inline-flex;
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
