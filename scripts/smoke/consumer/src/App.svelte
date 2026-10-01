<script>
	import {
		Button,
		ContentDialog,
		Expander,
		ProgressBar,
		ProgressRing,
		TeachingTip
	} from 'winui-svelte';
	import { Flyout, InfoBadge, MenuFlyout, Popup } from 'winui-svelte/preview';

	// Every control the Surfaces tranche added is instantiated here, alongside the four this
	// script mounted before it. The step this script exists for is stated in `docs/plan.md` as
	// closing the gap "before six more public prop surfaces are fixed by use", and a prop surface
	// is fixed by use at a usage site: prop names, snippet names and which members are required
	// are what a consumer discovers, and importing a component without mounting it discovers none
	// of them.
	//
	// The ten come from both entries, because the release does not hold four of them (ADR 0017):
	// `winui-svelte` for the six it does, `winui-svelte/preview` for the rest. That makes the build
	// resolve both entries against the tarball. It is not about whether the templates compile:
	// each entry re-exports its components statically, so the bundler transforms every module an
	// entry names to work out its exports and tree-shakes afterwards.
	const menuItems = [{ id: 'one', text: 'One' }];
</script>

<Button>Smoke button</Button>
<InfoBadge value={3} />
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
