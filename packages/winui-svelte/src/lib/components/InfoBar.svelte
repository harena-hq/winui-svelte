<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface InfoBarProps {
		/** Severity. Selects the SeverityLevels visual state at `InfoBar.xaml:17-43`. */
		severity?: 'informational' | 'success' | 'warning' | 'error';
		/**
		 * Title. Named `title` because ADR 0009 maps the member name and the closed HTML
		 * exception set does not contain `title`; note that this therefore takes the name the
		 * DOM's own `title` attribute would otherwise reach the root element by.
		 */
		title?: string;
		/** Message. */
		message?: string;
		/** IsOpen. `open` is in ADR 0009's closed HTML-attribute exception set. */
		open?: boolean;
		/** ADR 0009 pairs every `$bindable` prop with its own change callback. */
		onOpenChange?: (open: boolean) => void;
		/** IsClosable. */
		closable?: boolean;
		/** IsIconVisible. */
		iconVisible?: boolean;
		/**
		 * IconSource, as a Fluent code point in hex — `'E946'`. Supplying one selects the
		 * `UserIconVisible` state, which hides the standard severity icon entirely.
		 */
		glyph?: string;
		/** ActionButton. */
		actionButton?: Snippet;
		/** CloseButtonClick. */
		onCloseButtonClick?: () => void;
		/** Content — the free content below the banner row, as the default snippet. */
		children?: Snippet;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// `CloseButtonStyle`, `CloseButtonCommand`, and `CloseButtonCommandParameter` are
	// deliberately absent: they are XAML-only plumbing with no Svelte counterpart.
	// `Closing`, `Closed`, and `Opened` are deliberately absent. `InfoBar.cpp:97` and `:129`
	// route these through `UpdateVisibility`, whose only visual output is the
	// `InfoBarCollapsed` state that `open` already produces; a cancellable `Closing` is
	// behaviour, not a look.
	// `ForegroundSet` is deliberately absent. The state at `InfoBar.xaml:77-82` copies the
	// control's `Foreground` onto Title and Message; a consumer's `style` or `class` color
	// already cascades to both, so inventing a `foreground` prop would duplicate that path.
</script>

<script lang="ts">
	import { useStrings } from '../strings';
	import Button from './Button.svelte';
	import ToolTip from './ToolTip.svelte';

	let {
		severity = 'informational',
		title = '',
		message = '',
		open = $bindable(true),
		onOpenChange,
		closable = true,
		iconVisible = true,
		glyph,
		actionButton,
		onCloseButtonClick,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: InfoBarProps = $props();

	const str = useStrings();

	// `InfoBarCloseButtonSymbol` is a `Symbol` at InfoBar_themeresources.xaml:87 and is
	// deliberately not tokenized; the Cancel glyph at InfoBar.xaml:176-178 is written here.
	const CLOSE_GLYPH = String.fromCodePoint(parseInt('E711', 16));

	// `InfoBarMinHeight` is 48 at InfoBar_themeresources.xaml:66. InfoBarPanel.cpp:69 compares
	// the horizontal tallest child plus the Title's 14px top margin against this value.
	const MIN_HEIGHT = 48;

	const iconState = $derived(!iconVisible ? 'none' : glyph ? 'user' : 'standard');
	const contentPosition = $derived(
		title === '' && message === '' && !actionButton ? 'top' : 'banner'
	);
	const userIcon = $derived(glyph ? String.fromCodePoint(parseInt(glyph, 16)) : '');

	function close() {
		// InfoBar.cpp:81-86 raises CloseButtonClick before changing IsOpen.
		onCloseButtonClick?.();
		open = false;
		onOpenChange?.(false);
	}

	// ToolTip's trigger props include its own click handler, which must remain in the chain
	// even though this trigger has a close action of its own; see ToolTip.svelte's props
	// contract and the same composition in TitleBar.svelte.
	function withCloseClick(props: Record<string, unknown>) {
		return (event: MouseEvent) => {
			(props.onclick as ((event: MouseEvent) => void) | undefined)?.(event);
			close();
		};
	}

	let panel: HTMLDivElement | undefined = $state();
	let vertical = $state(false);

	$effect(() => {
		// The ResizeObserver sees the panel's own box, not text that grows inside a fixed
		// width bar. These reads make content changes run the same measurement as a resize.
		void title;
		void message;
		void actionButton;

		const el = panel;
		if (!el) return;
		const measure = () => {
			// Measure the row regardless of which orientation is currently rendered, so what is
			// measured never depends on what the measurement decides. The orientation attribute
			// is set for the duration rather than the row's rules being duplicated under
			// `[data-measuring]`: duplicated declarations are what a CSS minifier is free to
			// deduplicate away, and one did — leaving the column's margins and its
			// `align-self: stretch` in force during the measurement, which made every child
			// taller than the row would make it and pinned the panel vertical for good.
			// Reading a layout property forces the reflow synchronously; both attributes are
			// back before this function returns, so nothing is ever painted in this state.
			const previous = el.dataset.orientation;
			el.dataset.orientation = 'horizontal';
			el.dataset.measuring = '';
			const items = [...el.children].filter((c) => c.getBoundingClientRect().width > 0);
			const overflows = el.scrollWidth > el.clientWidth;
			const tallest = Math.max(0, ...items.map((c) => c.getBoundingClientRect().height));
			delete el.dataset.measuring;
			el.dataset.orientation = previous;
			vertical = items.length === 1 || overflows || tallest + 14 > MIN_HEIGHT;
		};
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		return () => observer.disconnect();
	});
</script>

<div
	bind:this={ref}
	class={['root', className]}
	{style}
	data-severity={severity}
	data-icon-state={iconState}
	data-content-position={contentPosition}
	data-open={open}
	{...rest}
>
	<div class="content-root">
		{#if iconState === 'standard'}
			<div class="standard-icon-area" aria-hidden="true">
				<span class="icon-background"></span>
				<span class="standard-icon"></span>
			</div>
		{:else if iconState === 'user'}
			<span class="user-icon-box" aria-hidden="true">{userIcon}</span>
		{/if}

		<div bind:this={panel} class="panel" data-orientation={vertical ? 'vertical' : 'horizontal'}>
			{#if title !== ''}
				<div class="title">{title}</div>
			{/if}
			{#if message !== ''}
				<div class="message">{message}</div>
			{/if}
			{#if actionButton}
				<div class="action">{@render actionButton()}</div>
			{/if}
		</div>

		<div class="content-area">
			{@render children?.()}
		</div>

		{#if closable}
			<ToolTip content={str('InfoBarCloseButtonTooltip')}>
				{#snippet children(props)}
					<Button
						{...props}
						variant="subtle"
						class="close"
						aria-label={str('InfoBarCloseButtonName')}
						style="grid-column: 3; grid-row: 1; box-sizing: border-box; width: var(--winui-InfoBarCloseButtonSize); height: var(--winui-InfoBarCloseButtonSize); margin: 5px; padding: 0; align-self: start"
						onclick={withCloseClick(props)}
					>
						<span class="close-glyph" aria-hidden="true">{CLOSE_GLYPH}</span>
					</Button>
				{/snippet}
			</ToolTip>
		{/if}
	</div>
</div>

<style>
	/* No type-ramp class on the root. `InfoBar.xaml:113` and `:114` set FontSize and
	   FontWeight on the Title and Message TextBlocks and no `Style`, so neither takes the
	   Body ramp's 20px line height — the platform default is what the original draws, and
	   it measures 18px at this size on the reference guest.

	   Every fill rule on the root carries `padding-box`. `ContentRoot` (`InfoBar.xaml:15`)
	   is a Border that sets no `BackgroundSizing`, so it takes the default, `InnerBorderEdge`:
	   the fill stops at the stroke's inner edge, and the stroke — `InfoBarBorderBrush`,
	   which in light and dark is `CardStrokeColorDefault` and translucent — lies on the
	   page rather than on the severity fill. The severity rules below restate the clip
	   because `background` is a shorthand, and a rule naming only the brush resets
	   `background-clip` with it. */
	.root {
		display: block;
		border-style: solid;
		border-width: var(--winui-InfoBarBorderThickness);
		border-color: var(--winui-InfoBarBorderBrush);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-InfoBarInformationalSeverityBackgroundBrush) padding-box;
		color: var(--winui-InfoBarTitleForeground);
		font-family: var(--winui-ContentControlThemeFontFamily);
		font-size: var(--winui-InfoBarMessageFontSize);
		font-weight: var(--winui-InfoBarMessageFontWeight);
		/* This root carries no ramp class, so the line box is whatever the consumer's page
		   says unless it is stated here. A WinUI control draws its text at the font's own
		   spacing whatever surrounds it. ADR 0011. */
		line-height: normal;
	}

	.root[data-open='false'] {
		display: none;
	}

	.root[data-severity='success'] {
		background: var(--winui-InfoBarSuccessSeverityBackgroundBrush) padding-box;
	}

	.root[data-severity='warning'] {
		background: var(--winui-InfoBarWarningSeverityBackgroundBrush) padding-box;
	}

	.root[data-severity='error'] {
		background: var(--winui-InfoBarErrorSeverityBackgroundBrush) padding-box;
	}

	.content-root {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		grid-template-rows: auto auto;
		min-height: var(--winui-InfoBarMinHeight);
		padding: var(--winui-InfoBarContentRootPadding);
	}

	.standard-icon-area {
		display: grid;
		grid-column: 1;
		grid-row: 1;
	}

	.standard-icon-area > span {
		grid-column: 1;
		grid-row: 1;
		margin: var(--winui-InfoBarIconMargin);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-InfoBarIconFontSize);
		line-height: var(--winui-InfoBarIconFontSize);
		vertical-align: top;
	}

	.icon-background {
		color: var(--winui-InfoBarInformationalSeverityIconBackground);
	}

	.icon-background::before {
		content: var(--winui-InfoBarIconBackgroundGlyph) / '';
	}

	.standard-icon {
		color: var(--winui-InfoBarInformationalSeverityIconForeground);
	}

	.standard-icon::before {
		content: var(--winui-InfoBarInformationalIconGlyph) / '';
	}

	.root[data-severity='success'] .icon-background {
		color: var(--winui-InfoBarSuccessSeverityIconBackground);
	}

	.root[data-severity='success'] .standard-icon {
		color: var(--winui-InfoBarSuccessSeverityIconForeground);
	}

	.root[data-severity='success'] .standard-icon::before {
		content: var(--winui-InfoBarSuccessIconGlyph) / '';
	}

	.root[data-severity='warning'] .icon-background {
		color: var(--winui-InfoBarWarningSeverityIconBackground);
	}

	.root[data-severity='warning'] .standard-icon {
		color: var(--winui-InfoBarWarningSeverityIconForeground);
	}

	.root[data-severity='warning'] .standard-icon::before {
		content: var(--winui-InfoBarWarningIconGlyph) / '';
	}

	.root[data-severity='error'] .icon-background {
		color: var(--winui-InfoBarErrorSeverityIconBackground);
	}

	.root[data-severity='error'] .standard-icon {
		color: var(--winui-InfoBarErrorSeverityIconForeground);
	}

	.root[data-severity='error'] .standard-icon::before {
		content: var(--winui-InfoBarErrorIconGlyph) / '';
	}

	.user-icon-box {
		grid-column: 1;
		grid-row: 1;
		display: flex;
		align-items: flex-start;
		justify-content: flex-start;
		max-width: var(--winui-InfoBarIconFontSize);
		max-height: var(--winui-InfoBarIconFontSize);
		margin: var(--winui-InfoBarIconMargin);
		overflow: hidden;
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-InfoBarIconFontSize);
		line-height: var(--winui-InfoBarIconFontSize);
	}

	.panel {
		grid-column: 2;
		grid-row: 1;
		display: flex;
		align-items: flex-start;
		min-width: 0;
		margin: var(--winui-InfoBarPanelMargin);
	}

	.panel[data-orientation='horizontal'] {
		flex-direction: row;
		flex-wrap: nowrap;
		padding: var(--winui-InfoBarPanelHorizontalOrientationPadding);
	}

	.panel[data-orientation='vertical'] {
		flex-direction: column;
		flex-wrap: nowrap;
		padding: var(--winui-InfoBarPanelVerticalOrientationPadding);
	}

	.title,
	.message {
		min-width: 0;
		white-space: normal;
		overflow-wrap: break-word;
	}

	.title {
		flex: 0 0 auto;
		font-size: var(--winui-InfoBarTitleFontSize);
		font-weight: var(--winui-InfoBarTitleFontWeight);
	}

	.message {
		flex: 0 1 auto;
		font-size: var(--winui-InfoBarMessageFontSize);
		font-weight: var(--winui-InfoBarMessageFontWeight);
	}

	.action {
		flex: 1 1 auto;
		min-width: 0;
	}

	.panel[data-orientation='vertical'] .action {
		flex: 0 0 auto;
	}

	/* InfoBarPanel.cpp:137 skips the leading child's leading margin in a row. Each child
	   selects its own full margin, the default margin removes that leading side, and the
	   generic sibling selector restores the full horizontal margin after a previous non-empty
	   child. */
	.panel[data-orientation='horizontal'] > .title {
		--panel-item-margin: var(--winui-InfoBarTitleHorizontalOrientationMargin);
	}

	.panel[data-orientation='horizontal'] > .message {
		--panel-item-margin: var(--winui-InfoBarMessageHorizontalOrientationMargin);
	}

	.panel[data-orientation='horizontal'] > .action {
		--panel-item-margin: var(--winui-InfoBarActionHorizontalOrientationMargin);
	}

	.panel[data-orientation='horizontal'] > * {
		margin: var(--panel-item-margin);
		margin-left: 0;
	}

	.panel[data-orientation='horizontal'] > * + * {
		margin: var(--panel-item-margin);
	}

	/* InfoBarPanel.cpp:109 skips the leading child's leading margin in a column. The sibling
	   selector restores the vertical top margin only between non-empty children. */
	.panel[data-orientation='vertical'] > .title {
		--panel-item-margin: var(--winui-InfoBarTitleVerticalOrientationMargin);
		align-self: stretch;
	}

	.panel[data-orientation='vertical'] > .message {
		--panel-item-margin: var(--winui-InfoBarMessageVerticalOrientationMargin);
		align-self: stretch;
	}

	.panel[data-orientation='vertical'] > .action {
		--panel-item-margin: var(--winui-InfoBarActionVerticalOrientationMargin);
	}

	.panel[data-orientation='vertical'] > * {
		margin: var(--panel-item-margin);
		margin-top: 0;
	}

	.panel[data-orientation='vertical'] > * + * {
		margin: var(--panel-item-margin);
	}

	/* The measuring mode stops the children shrinking, and nothing else: a row that does not
	   fit then overflows, where `scrollWidth` can see it. The row's direction and its margins
	   come from `[data-orientation='horizontal']`, which `measure()` sets for the duration —
	   see the comment there for why this rule does not restate them. */
	.panel[data-measuring] > * {
		width: max-content;
		flex: 0 0 auto;
	}

	.content-area {
		grid-column: 2;
		grid-row: 2;
		align-self: center;
		min-width: 0;
	}

	.root[data-content-position='top'] .content-area {
		grid-row: 1;
	}

	.close-glyph {
		display: inline-flex;
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-InfoBarCloseButtonGlyphSize);
		line-height: var(--winui-InfoBarCloseButtonGlyphSize);
	}
</style>
