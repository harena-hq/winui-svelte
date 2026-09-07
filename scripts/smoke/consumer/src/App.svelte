<script>
	import {
		Button,
		ContentDialog,
		Expander,
		Flyout,
		InfoBadge,
		MenuFlyout,
		Popup,
		ProgressBar,
		ProgressRing,
		TeachingTip
	} from 'winui-svelte';

	// Every control the Surfaces tranche added is instantiated here, alongside the four this
	// script already mounted — ten of the library's twenty-three exports, not all of them; the
	// rest are earlier tranches' and are not what this step was widened for. The step this
	// script exists for is stated in `docs/plan.md` as closing the gap "before six more public
	// prop surfaces are fixed by use", and a prop surface is fixed by use at a usage site:
	// prop names, snippet names and which members are required are what a consumer discovers,
	// and importing a component without mounting it discovers none of them.
	//
	// It is not about whether the templates compile. `index.ts` re-exports every component
	// statically, so the bundler transforms all 23 modules to work out the entry's exports and
	// tree-shakes afterwards — a shipped `{#snippet name(x: Type)}` annotation was already
	// reachable by this script when it mounted four controls.
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
