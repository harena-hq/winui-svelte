<script lang="ts">
	import {
		NavigationView,
		NavigationViewItem,
		type NavigationViewEntry
	} from 'winui-svelte/preview';

	/*
	 * `menuItemTemplate` — ADR 0015's second half — on its own harness.
	 *
	 * This page is `NavigationViewItem`'s three-theme baseline, because it is the one page where
	 * a consumer's template draws the rows (`navigation-view-item.spec.ts`). The assertions about
	 * which element drew a row and what an event did are read from the DOM by
	 * `navigation-view-template.spec.ts`. `/dev/navigation-view` draws no template, so its three
	 * baselines stay about the control's own rows.
	 *
	 * `NavigationViewItem` is in the release with `NavigationView` (ADR 0015, ADR 0017); like
	 * every Gallery page that imports a component either entry exports, this one imports from
	 * `winui-svelte/preview`.
	 */

	/** A consumer's own row type: the record as the bound, plus a field of its own. */
	interface Row {
		id: string;
		content: string;
		glyph?: string | null;
		children?: Row[];
		/** Nothing in the library reads this. It is here to be read by the template. */
		note?: string;
	}

	const items: NavigationViewEntry<Row>[] = [
		{ id: 'home', content: 'Home', glyph: 'E80F', note: 'plain' },
		{
			id: 'design',
			content: 'Design',
			glyph: 'EB3C',
			children: [
				{ id: 'color', content: 'Color', glyph: 'E790' },
				{ id: 'geometry', content: 'Geometry', glyph: 'E743' }
			]
		},
		{ header: 'Consumer rows' },
		{ id: 'rename', content: 'Rename', glyph: 'E8AC' },
		{ id: 'commands', content: 'Commands', glyph: 'E712' }
	];

	let selected = $state<string | null>('home');
	let expanded = $state<string[]>(['design']);
	let invoked = $state<string[]>([]);
	let renameValue = $state('typed:');

	function onItemInvoked(id: string) {
		selected = id;
		invoked = [...invoked, id];
	}
</script>

<svelte:head><title>NavigationView menuItemTemplate — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">NavigationView — menuItemTemplate</h1>
<p class="winui-BodyTextBlockStyle">
	One control whose every row is drawn by the consumer's snippet. The header is drawn by it too,
	which is what reproduces <code>MenuItemTemplateSelector</code>; the settings row is not, which is
	what reproduces <code>NavigationViewItemsFactory.cpp:39-43</code>.
</p>

<div class="frame" id="templated">
	<NavigationView {items} {selected} {onItemInvoked} bind:expandedItems={expanded}>
		{#snippet menuItemTemplate(entry, index)}
			{#if 'header' in entry}
				<!-- The control draws no header of its own once a template is set, so this one is
				     the consumer's whole answer for a header — including the `<li>` the row
				     component would otherwise have brought. -->
				<li role="none">
					<div class="tpl-header winui-BodyStrongTextBlockStyle" data-index={index}>
						{entry.header}
					</div>
				</li>
			{:else if entry.id === 'rename'}
				<!-- The inline-rename shape ADR 0015 is written for, and the case the row's
				     keydown guard exists for: a space typed here must reach the field rather
				     than invoking the row. The field does **not** stop a click, so clicking it
				     also invokes the row — WD-090, asserted in both directions by the spec. -->
				<NavigationViewItem tag={entry.id} content={entry.content} glyph={entry.glyph}>
					<input
						class="tpl-rename"
						aria-label="Rename"
						autocomplete="off"
						bind:value={renameValue}
					/>
				</NavigationViewItem>
			{:else if entry.id === 'commands'}
				<!-- The per-row command shape: the button stops the click, which is how a
				     descendant declines to invoke the row. WD-090. -->
				<NavigationViewItem tag={entry.id} content={entry.content} glyph={entry.glyph}>
					<span class="tpl-label" data-note={entry.note} data-index={index}>{entry.content}</span>
					<button
						type="button"
						class="tpl-command"
						onclick={(event) => {
							event.stopPropagation();
							invoked = [...invoked, `command:${entry.id}`];
						}}>Delete</button
					>
				</NavigationViewItem>
			{:else}
				<NavigationViewItem
					tag={entry.id}
					content={entry.content}
					glyph={entry.glyph}
					items={entry.children}
				>
					<span class="tpl-label" data-note={entry.note} data-index={index}>{entry.content}</span>
				</NavigationViewItem>
			{/if}
		{/snippet}
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">top pane — the template does not reach it</h2>
<p class="winui-BodyTextBlockStyle">
	The same template on a control pinned to <code>top</code>. WD-089: the top pane draws
	<code>NavigationViewTopItem</code>, a different component, so the snippet is not called at all and
	the control's own rows are what appear.
</p>
<div class="frame" id="top">
	<NavigationView {items} {selected} paneDisplayMode="top">
		{#snippet menuItemTemplate(entry, index)}
			<!-- Nothing calls this, which is the assertion. It draws a marked element so that a
			     call would be visible rather than silently indistinguishable. -->
			<li role="none">
				<span class="tpl-label" data-index={index}>
					{'header' in entry ? entry.header : entry.content}
				</span>
			</li>
		{/snippet}
		<p class="winui-BodyTextBlockStyle">Content sits under the bar.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">no template — the control draws its own rows</h2>
<p class="winui-BodyTextBlockStyle">
	The same menu with <code>menuItemTemplate</code> omitted. Nothing about the rows changes, which is the
	half of the surface this prop is additive to.
</p>
<div class="frame" id="untemplated">
	<NavigationView {items} selected={null}>
		<p class="winui-BodyTextBlockStyle">Content sits beside the pane.</p>
	</NavigationView>
</div>

<h2 class="winui-SubtitleTextBlockStyle">what was invoked</h2>
<pre class="log" id="log">{invoked.length ? invoked.join('\n') : 'nothing invoked yet'}</pre>

<style>
	/* 400 rather than 360 so the back button the control draws by default takes its row above
	   the toggle and the last consumer row is still in the photograph. */
	.frame {
		height: 400px;
		margin-bottom: 24px;
		overflow: hidden;
		border-radius: var(--winui-OverlayCornerRadius);
		/* c1-allow: 1px is the Gallery's card stroke width, not a tokenized theme value */
		border: 1px solid var(--winui-CardStrokeColorDefaultBrush);
	}

	.frame :global(> *) {
		height: 100%;
	}

	/* Nothing below reproduces anything. The consumer's snippet owns what it draws, and this
	   page is the consumer — so these are the harness's numbers, not upstream's. The
	   `NavigationViewItem` baseline photographs this whole page, so changing them re-baselines it. */
	.tpl-header {
		padding: 8px 16px;
		color: var(--winui-TextFillColorSecondaryBrush);
	}

	.tpl-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.tpl-rename {
		width: 100%;
		min-width: 0;
	}

	.log {
		min-height: 3em;
		padding: 12px;
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-CardBackgroundFillColorDefaultBrush);
		color: var(--winui-TextFillColorSecondaryBrush);
		white-space: pre-wrap;
		/* c1-allow: a code face is categorical, not a themed value */
		font-family: monospace;
	}
</style>
