<script lang="ts">
	import { MenuFlyout, TabView, type MenuFlyoutEntry } from '@harena-hq/winui-svelte/preview';

	/*
	 * An add button that opens a menu rather than a tab, as an application offering several kinds
	 * of tab would: a WinUI handler can show a flyout at `args.OriginalSource`, the add button
	 * (`TabView::OnAddButtonClick`, TabView.cpp:514-516). No WinUI-Gallery sample does: none of
	 * its three handlers reads its `args` (TabViewPage.xaml.cs:51 and :130,
	 * TabViewWindowingSamplePage.xaml.cs:169). The menu has no trigger of its own; the handler
	 * opens it and places it against the button it is handed, which the page prints by its name.
	 * It need not close it: while the menu is open a press on the button closes the menu and
	 * never reaches the button. A button below sets `pointer-events: auto`, which a press reaches
	 * while the menu is open.
	 *
	 * **Nothing photographs this page.** `tab-view-add-menu.spec.ts` reads the menu's box, the
	 * focus and the tabs.
	 */
	const kinds: MenuFlyoutEntry[] = [
		{ id: 'document', text: 'Document' },
		{ id: 'terminal', text: 'Terminal' },
		{ id: 'more', text: 'More', items: [{ id: 'console', text: 'Console' }] }
	];
	const headers: Record<string, string> = {
		document: 'Document',
		terminal: 'Terminal',
		console: 'Console'
	};
	let items = $state([{ id: 'tab-0', header: 'Home', content }]);
	let selected = $state<string | null>('tab-0');
	let open = $state(false);
	let anchor = $state<HTMLElement | null>(null);
	let added = 1;

	function addKind(kind: string) {
		const id = `tab-${added++}`;
		items = [...items, { id, header: headers[kind] ?? kind, content }];
		selected = id;
	}
</script>

{#snippet content()}<p class="winui-BodyTextBlockStyle">Tab content.</p>{/snippet}

<svelte:head><title>TabView add menu — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">TabView — the add button opens a menu</h1>

<TabView
	{items}
	bind:selected
	style="height: 240px"
	onAddTabButtonClick={({ originalSource }) => {
		anchor = originalSource;
		open = true;
	}}
/>
<output data-testid="anchor">{anchor?.getAttribute('aria-label') ?? ''}</output>
<MenuFlyout items={kinds} {anchor} bind:open onItemInvoked={addKind} />
<!-- Pressed while the menu is open, as NavigationView's back button is, which sets it too. -->
<button type="button" style="pointer-events: auto">Elsewhere</button>
