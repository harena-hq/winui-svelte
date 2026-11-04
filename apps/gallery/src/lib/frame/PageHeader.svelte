<script lang="ts" module>
	import type { GalleryItem } from '$lib/shell';

	export interface PageHeaderProps {
		/** Item. The record's entry for this page. */
		item: GalleryItem;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// The theme button is deliberately absent. It changes only this page's ControlExamples,
	// which needs published theme token blocks for every `[data-theme]` element (including
	// light), not only `:root`; that token-layer change belongs to its own unit.
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import {
		BreadcrumbBar,
		Button,
		DropDownButton,
		Flyout,
		HyperlinkButton,
		ToggleButton
	} from '@harena-hq/winui-svelte/preview';
	import CopyButton from './CopyButton.svelte';

	let { item, class: className, style, ref = $bindable(null), ...rest }: PageHeaderProps = $props();

	// The four glyphs this header draws, each named for the site it comes from — PageHeader.xaml
	// gives the API-details and Documentation icons, the copy-link button's `Content`, and the
	// two states of the favourite icon (`GetFavoriteGlyph`). Escapes rather than the characters
	// themselves: a private-use code point is invisible to a diff and to grep.
	const API_DETAILS_GLYPH = '\uE946';
	const DOCUMENTATION_GLYPH = '\uE8A5';
	const COPY_LINK_GLYPH = '\uE71B';
	const FAVORITE_GLYPH = { on: '\uE735', off: '\uE734' };

	const API_FLYOUT_STYLE = 'min-width: 420px; max-width: 800px;';
	const WINUI_SOURCE_URL = 'https://github.com/microsoft/microsoft-ui-xaml/tree/main/controls/dev';
	const GALLERY_SOURCE_URL = 'https://github.com/microsoft/WinUI-Gallery/tree/main/';
	const hasApiDetails = $derived(item.apiNamespace !== null || item.baseClasses.length > 0);
	const hasSource = $derived(item.sourcePath !== null || item.samplePagePath !== null);
	const controlSourceInfo = $derived(
		`Source code of ${item.title} in the WinUI repository. For some controls only the XAML file is available`
	);
	const sampleSourceInfo = $derived(
		`Source code of the ${item.title} sample page in the WinUI Gallery repository`
	);
	// `page.url` rather than `window.location`: the header outlives a navigation inside the
	// `[...path]` route, and a value read once at mount would go on offering the first page's
	// address. Prerendering has no host, so the copied link is the app-relative one there.
	const pageUrl = $derived(page.url.href);
	let favorite = $state(false);

	// Favorites are intentionally page-header-local for now; no other surface reads this key yet.
	onMount(() => {
		try {
			favorite = (
				JSON.parse(localStorage.getItem('winui-svelte:favorites') ?? '[]') as string[]
			).includes(item.uniqueId);
		} catch {
			favorite = false;
		}
	});

	function setFavorite(checked: boolean): void {
		favorite = checked;
		try {
			const favorites = JSON.parse(
				localStorage.getItem('winui-svelte:favorites') ?? '[]'
			) as string[];
			const withoutItem = favorites.filter((uniqueId) => uniqueId !== item.uniqueId);
			localStorage.setItem(
				'winui-svelte:favorites',
				JSON.stringify(checked ? [...withoutItem, item.uniqueId] : withoutItem)
			);
		} catch {
			// Storage can be unavailable in private or restricted browsing contexts.
		}
	}
</script>

<div bind:this={ref} class={['root', className]} {style} {...rest}>
	<div class="title-row">
		<h1 class="winui-TitleTextBlockStyle">{item.title}</h1>
		{#if hasApiDetails}
			<Flyout placement="bottom" style={API_FLYOUT_STYLE} content={apiDetails}>
				{#snippet children(props)}
					<Button
						{...props}
						variant="subtle"
						aria-label="API details"
						title="API namespace and inheritance"
						style="padding: 4px"
					>
						<span class="font-icon api-icon accent" aria-hidden="true">{API_DETAILS_GLYPH}</span>
					</Button>
				{/snippet}
			</Flyout>
		{/if}
	</div>

	<div class="actions-row">
		<div class="left-actions">
			{#if item.docs.length > 0}
				<Flyout placement="bottom" content={documentation}>
					{#snippet children(props)}
						<DropDownButton {...props} aria-label="Documentation" title="Documentation">
							<span class="button-content">
								<span class="font-icon" aria-hidden="true">{DOCUMENTATION_GLYPH}</span>
								<span>Documentation</span>
							</span>
						</DropDownButton>
					{/snippet}
				</Flyout>
			{/if}
			{#if hasSource}
				<Flyout placement="bottom" content={sourceCode}>
					{#snippet children(props)}
						<DropDownButton
							{...props}
							aria-label="Source code"
							title="Source code of this sample page"
						>
							<span class="button-content">
								<!-- GitHubIconPath: WinUIGallery/App.xaml:55. -->
								<svg class="github-icon" viewBox="0 0 98 99" aria-hidden="true">
									<path
										d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
									/>
								</svg>
								<span>Source</span>
							</span>
						</DropDownButton>
					{/snippet}
				</Flyout>
			{/if}
		</div>
		<div class="right-actions">
			<!-- Upstream copies a `winui3gallery://` activation URL; the web equivalent is this address-bar URL. -->
			<CopyButton text={pageUrl} glyph={COPY_LINK_GLYPH} label="Copy link" />
			<ToggleButton
				checked={favorite}
				onCheckedChange={setFavorite}
				aria-label="Favorite sample"
				title={favorite ? 'Remove from favorites' : 'Add to favorites'}
				style="height: 32px"
			>
				<span class="font-icon" aria-hidden="true"
					>{favorite ? FAVORITE_GLYPH.on : FAVORITE_GLYPH.off}</span
				>
			</ToggleButton>
		</div>
	</div>
</div>

{#snippet apiDetails()}
	<div class="api-details">
		{#if item.apiNamespace}
			<section>
				<span class="label winui-CaptionTextBlockStyle">Namespace</span>
				<code class="winui-CaptionTextBlockStyle">{item.apiNamespace}</code>
			</section>
		{/if}
		{#if item.baseClasses.length > 0}
			<section>
				<span class="label winui-CaptionTextBlockStyle">Inheritance</span>
				<BreadcrumbBar items={item.baseClasses.map((content) => ({ content }))} disabled />
			</section>
		{/if}
	</div>
{/snippet}

{#snippet documentation()}
	<div class="link-list">
		{#each item.docs as doc (doc.uri)}
			<HyperlinkButton navigateUri={doc.uri} target="_blank" rel="noreferrer" title={doc.uri}
				>{doc.title}</HyperlinkButton
			>
		{/each}
	</div>
{/snippet}

{#snippet sourceCode()}
	<div class="source-list">
		{#if item.sourcePath}
			<section class="control-source">
				<div class="source-label">
					<span class="label winui-CaptionTextBlockStyle">Control source code</span><Button
						variant="subtle"
						aria-label="Info"
						title={controlSourceInfo}
						><span class="font-icon accent" aria-hidden="true">{API_DETAILS_GLYPH}</span></Button
					>
				</div>
				<!-- Base URL: WinUIGallery/Pages/ItemPage.xaml.cs:22. -->
				<div class="source-link">
					<HyperlinkButton
						navigateUri={WINUI_SOURCE_URL + item.sourcePath}
						target="_blank"
						rel="noreferrer">{item.title}</HyperlinkButton
					>
				</div>
			</section>
		{/if}
		{#if item.sourcePath && item.samplePagePath}
			<!-- `MenuFlyoutSeparator Margin="-12"` (PageHeader.xaml:177): the rule runs the full
			     width of the presenter, which is what the negative margin buys. -->
			<div class="separator"></div>
		{/if}
		{#if item.samplePagePath}
			<section class="sample-source">
				<div class="source-label">
					<span class="label winui-CaptionTextBlockStyle">Sample page source code</span><Button
						variant="subtle"
						aria-label="Info"
						title={sampleSourceInfo}
						><span class="font-icon accent" aria-hidden="true">{API_DETAILS_GLYPH}</span></Button
					>
				</div>
				<!-- Base URL: WinUIGallery/Pages/ItemPage.xaml.cs:23. -->
				<div class="source-link">
					<HyperlinkButton
						navigateUri={GALLERY_SOURCE_URL + item.samplePagePath}
						target="_blank"
						rel="noreferrer">XAML</HyperlinkButton
					>
				</div>
				<div class="source-link">
					<HyperlinkButton
						navigateUri={GALLERY_SOURCE_URL + item.samplePagePath + '.cs'}
						target="_blank"
						rel="noreferrer">C#</HyperlinkButton
					>
				</div>
			</section>
		{/if}
	</div>
{/snippet}

<style>
	.root {
		min-width: 0;
	}
	.title-row {
		display: flex;
		align-items: end;
		gap: 4px;
	}
	h1 {
		min-width: 0;
		margin: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.title-row :global(button) {
		margin-bottom: 3px;
	}
	.actions-row {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		margin: 12px 0;
	}
	.left-actions,
	.right-actions,
	.button-content,
	.source-label {
		display: flex;
		align-items: center;
	}
	.left-actions {
		gap: 4px;
	}
	.right-actions {
		gap: 4px;
	}
	.button-content {
		gap: 8px;
	}
	.font-icon {
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: PageHeader.xaml:81 and :106 set FontSize="16" on these FontIcons. */
		font-size: 16px;
	}
	.accent {
		color: var(--winui-AccentTextFillColorPrimaryBrush);
	}
	.api-icon {
		/* c1-allow: PageHeader.xaml:47 sets FontSize="14" on the API details FontIcon. */
		font-size: 14px;
	}
	.github-icon {
		width: auto;
		height: 18px;
		fill: currentColor;
	}
	.api-details {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.api-details section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.label {
		color: var(--winui-TextFillColorSecondaryBrush);
	}
	code {
		/* c1-allow: PageHeader.xaml:68 sets FontFamily="Consolas" for the namespace. */
		font-family: Consolas, monospace;
	}
	.api-details :global(.root) {
		/* c1-allow: PageHeader.xaml:78 sets FontFamily="Consolas" for inheritance crumbs. */
		font-family: Consolas, monospace;
	}
	.link-list,
	.source-list,
	.source-list section {
		display: flex;
		flex-direction: column;
		align-items: stretch;
	}

	/* Upstream cancels the flyout presenter's padding where a list of buttons fills it, so the
	   only inset left is each button's own 11 — `Margin="-12"` on the docs list
	   (PageHeader.xaml:112) and `Margin="0,-8,0,-12"` on the source panel (:146). Measured on
	   the original: 16px from the presenter's border to the first link's text, against 29 here
	   before this rule. */
	.link-list {
		margin: -12px;
	}

	/* `SourcePanel Margin="0,-8,0,-12"` (PageHeader.xaml:146), and **no `Spacing`** — every gap
	   inside this flyout is a panel's or a link's own margin, which is why there is no `gap`
	   here. `ControlSourcePanel` carries `Margin="0,0,0,4"` (:147) and the sample-page panel
	   `Margin="0,8,0,0"` (:179). */
	.source-list {
		margin: -8px 0 -12px;
	}
	.control-source {
		margin-bottom: 4px;
	}
	.sample-source {
		margin-top: 8px;
	}

	/* `Margin="-12,4,-12,0"` on each source HyperlinkButton (PageHeader.xaml:169, :204, :212).
	   On a wrapper rather than on the button, because the button is a component and a class
	   handed to one carries no scope hash — and because the info Button beside these links has
	   the same root class. */
	.source-link {
		/* A grid, so the link inside stretches. `HorizontalAlignment="Stretch"` upstream, and
		   the docs list gets it for free — its links are flex items of a column and are
		   blockified. A link inside this wrapper is not, so it shrank to its text and the
		   hover fill stopped short of the box. */
		display: grid;
		margin: 4px -12px 0;
	}

	/* `MenuFlyoutSeparator Margin="-12"` (PageHeader.xaml:177) is uniform in the source, and the
	   horizontal half is what makes the rule run past the presenter's padding to its edge. The
	   vertical half is **not** applied here, and that is a measurement rather than a reading: in
	   the shipped Gallery the rule sits below the hovered item, clear of its pointer-over fill,
	   about four pixels under the link's box — which is exactly `ControlSourcePanel`'s own
	   `Margin="0,0,0,4"` with nothing pulled up over it. Applying the -12 vertically drew the
	   rule four pixels *inside* the link, across the fill.
	
	   What upstream does with the other twenty-four pixels is not settled here. A
	   `MenuFlyoutSeparator` is a control whose template insets a 1px `Rectangle` by its own
	   `Padding` (generic.xaml:14711-14717), and the pin defines `MenuFlyoutSeparatorThemePadding`
	   twice — `12,4,12,4` in the theme dictionaries beside the pre-Fluent
	   `MenuFlyoutSeparatorThemeBrush`, and `-4,1,-4,1` at :24007 beside the
	   `MenuFlyoutSeparatorHeight` the template actually names. Neither reproduces the capture on
	   its own arithmetic, so the capture is what this rule follows. */
	.separator {
		margin: 0 -12px;
		height: var(--winui-MenuFlyoutSeparatorHeight);
		background: var(--winui-MenuFlyoutSeparatorBackground);
	}
	/* No vertical gap. `ControlSourcePanel` (PageHeader.xaml:147) and its sample-page sibling
	   (:179) carry no `Spacing`: the four pixels between a section's label row and its link are
	   the link's own `Margin="-12,4,-12,0"` (:169, :204, :212), which `.source-link` below
	   already writes. A `gap` here counted them twice and the measured distance was eight. */
	.source-label {
		gap: 8px;
	}
	.source-label :global(button) {
		padding: 6px 5px 6px 6px;
	}
	.source-label .font-icon {
		/* c1-allow: PageHeader.xaml:151 and :177 set FontSize="14" on source info icons. */
		font-size: 14px;
	}
	.link-list :global(.root),
	.source-list :global(.root) {
		justify-content: flex-start;
	}
</style>
