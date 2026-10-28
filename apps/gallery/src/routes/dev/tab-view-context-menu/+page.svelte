<script lang="ts">
	import {
		MenuFlyout,
		TabView,
		type MenuFlyoutEntry,
		type TabViewTabContextRequestedEventArgs
	} from 'winui-svelte/preview';

	/*
	 * A tab's context menu, as the Gallery's TabView page gives every tab one shared
	 * `MenuFlyout` whose `Opening` fills it with "Move tab left", "Move tab right" or both as the
	 * tab's place allows, and hides it when it holds neither (TabViewHelper.cs:61-101,
	 * TabViewPage.xaml.cs:275-284). The handler opens the menu against the tab it is handed, at
	 * the pointer's point or, from the keyboard, by its placement, and the page prints which.
	 * The second TabView's one tab has nothing to move, and the third has no handler. The first
	 * sits low enough for the menu to fit above its tabs.
	 *
	 * **Nothing photographs this page.** `tab-view-context-menu.spec.ts` reads the menu's box,
	 * its rows, the focus and the tabs' order.
	 */
	let items = $state(
		['Document 0', 'Document 1', 'Document 2'].map((header, i) => ({
			id: `tab-${i}`,
			header,
			content
		}))
	);
	const single = [{ id: 'only', header: 'Only', content }];
	let selected = $state<string | null>('tab-0');
	let open = $state(false);
	let anchor = $state<HTMLElement | null>(null);
	let position = $state<{ x: number; y: number } | null>(null);
	let target = $state<string | null>(null);
	let rows = $state<MenuFlyoutEntry[]>([]);

	function rowsFor(index: number, count: number): MenuFlyoutEntry[] {
		const result: MenuFlyoutEntry[] = [];
		if (index > 0) result.push({ id: 'left', text: 'Move tab left' });
		if (index < count - 1) result.push({ id: 'right', text: 'Move tab right' });
		return result;
	}

	function show(id: string, args: TabViewTabContextRequestedEventArgs, list: { id: string }[]) {
		const index = list.findIndex((item) => item.id === id);
		rows = rowsFor(index, list.length);
		target = id;
		anchor = args.originalSource;
		position = args.position;
		// Upstream hides a menu that would hold nothing.
		open = rows.length > 0;
	}

	function move(row: string) {
		const index = items.findIndex((item) => item.id === target);
		if (index < 0) return;
		const to = row === 'left' ? index - 1 : index + 1;
		const next = [...items];
		const [item] = next.splice(index, 1);
		next.splice(to, 0, item);
		items = next;
	}
</script>

{#snippet content()}<p class="winui-BodyTextBlockStyle">Tab content.</p>{/snippet}

<svelte:head><title>TabView context menu — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">TabView — a tab's context menu</h1>

<TabView
	{items}
	bind:selected
	style="height: 200px; margin-top: 120px"
	data-testid="main"
	onTabContextRequested={(id, args) => show(id, args, items)}
/>
<output data-testid="request">{target ?? ''} {position ? 'pointer' : 'keyboard'}</output>
<MenuFlyout items={rows} {anchor} {position} bind:open onItemInvoked={move} />

<TabView
	items={single}
	style="height: 120px"
	data-testid="lone"
	onTabContextRequested={(id, args) => show(id, args, single)}
/>
<TabView items={single} style="height: 120px" data-testid="plain" />
