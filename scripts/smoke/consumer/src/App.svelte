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

	// Every control this library exports a surface for is instantiated here, not only the ones
	// that need no snippet. The step this script exists for is stated in `docs/plan.md` as
	// closing the gap "before six more public prop surfaces are fixed by use" — a consumer's
	// toolchain compiling `Button` alone says nothing about the five templates it never parses.
	// This is also the only place a shipped `{#snippet name(x: Type)}` annotation would be
	// caught: `svelte-package` strips TypeScript from `<script>` blocks and from nothing else,
	// so a snippet header carrying one compiles here and only here.
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
