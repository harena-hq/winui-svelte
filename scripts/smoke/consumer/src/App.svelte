<script lang="ts">
	import {
		Button,
		ComboBox,
		ContentDialog,
		Expander,
		Flyout,
		HyperlinkButton,
		InfoBar,
		MenuFlyout,
		NavigationView,
		NavigationViewItem,
		ProgressBar,
		ProgressRing,
		ScrollView,
		ScrollViewer,
		TabView,
		TeachingTip,
		TextBox,
		TitleBar,
		ToggleSwitch,
		ToolTip
	} from 'winui-svelte';
	import { CheckBox, InfoBadge, Popup, ToggleButton } from 'winui-svelte/preview';

	// Every component the release exports is mounted here, and four the release holds back. The
	// step this script exists for is stated in `docs/plan.md` as closing the gap "before six more
	// public prop surfaces are fixed by use", and a prop surface is fixed by use at a usage site:
	// prop names, snippet names and which members are required are what a consumer discovers,
	// and importing a component without mounting it discovers none of them. So every one of the
	// twenty is placed with its required props and a few common ones, and the file is
	// type-checked against the package's published types. That refuses a value of the wrong type
	// and a missing required prop. It does not refuse a misspelled prop, because most props
	// interfaces end in an index signature, and the browser bundle is never run. Nor does it check
	// the package's `.d.ts` themselves (`skipLibCheck`, as in every tsconfig here), so a
	// declaration that failed to resolve would read as `any`.
	//
	// The imports come from both entries (ADR 0017): `winui-svelte` for the twenty it releases,
	// `winui-svelte/preview` for four of those it does not. That makes the build resolve both entries
	// against the tarball. It is not about whether the templates compile: each entry re-exports
	// its components statically, so the bundler transforms every module an entry names to work
	// out its exports and tree-shakes afterwards.
	const menuItems = [{ id: 'one', text: 'One' }];
	const comboItems = [
		{ value: 'one', label: 'One' },
		{ value: 'two', label: 'Two' }
	];
	const navItems = [
		{ id: 'home', content: 'Home', glyph: 'E80F' },
		{ header: 'Section' },
		{ id: 'settings-page', content: 'Page', glyph: 'E713' }
	];
</script>

<Button>Smoke button</Button>
<InfoBadge value={3} />
<CheckBox>Smoke check</CheckBox>
<ToggleButton>Smoke toggle</ToggleButton>
<ProgressBar value={40} />
<ProgressRing />

<Expander>
	{#snippet header()}
		<span>Smoke expander</span>
	{/snippet}
	Expander content
</Expander>

<Popup open={false}>
	<span>Popup content</span>
</Popup>

<Flyout open={false}>
	{#snippet content()}
		<span>Flyout content</span>
	{/snippet}
	{#snippet children(props)}
		<Button {...props}>Flyout trigger</Button>
	{/snippet}
</Flyout>

<MenuFlyout open={false} items={menuItems}>
	{#snippet children(props)}
		<Button {...props}>Menu trigger</Button>
	{/snippet}
</MenuFlyout>

<ContentDialog open={false} title="Smoke dialog" closeButtonText="Close">
	<span>Dialog content</span>
</ContentDialog>

<TeachingTip open={false} title="Smoke tip" subtitle="Smoke subtitle">
	{#snippet children(props)}
		<Button {...props}>Tip trigger</Button>
	{/snippet}
</TeachingTip>

<TextBox value="Smoke text" placeholder="Type here" />
<ToggleSwitch />
<ComboBox items={comboItems} placeholder="Pick one" />
<HyperlinkButton navigateUri="https://example.com">Smoke link</HyperlinkButton>
<InfoBar severity="informational" title="Smoke" message="Smoke message" />

<ToolTip content="Smoke tooltip">
	{#snippet children(props)}
		<Button {...props}>Tooltip trigger</Button>
	{/snippet}
</ToolTip>

<ScrollView><p>Scroll view content</p></ScrollView>
<ScrollViewer><p>Scroll viewer content</p></ScrollViewer>

{#snippet tabContent()}<p>Tab content</p>{/snippet}
<TabView items={[{ id: 'tab', header: 'Tab', content: tabContent }]} />

<TitleBar title="Smoke" />

<NavigationView items={navItems} selected="home">
	{#snippet menuItemTemplate(entry)}
		{#if 'header' in entry}
			<li role="none">{entry.header}</li>
		{:else}
			<NavigationViewItem tag={entry.id} content={entry.content} glyph={entry.glyph} />
		{/if}
	{/snippet}
	<p>Navigation content</p>
</NavigationView>
