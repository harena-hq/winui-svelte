<script lang="ts">
	import { tick } from 'svelte';
	import {
		Button,
		GridView,
		ItemsRepeater,
		ListView,
		RadioButton,
		RadioButtons,
		ScrollViewer
	} from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	type Configuration = 'gravity' | 'direct' | 'basic';
	type Page = 'list' | 'detail' | 'one' | 'two';
	type Kind = 'image' | 'card' | 'accent';
	type Frame = 1 | 2 | 3 | 4;
	interface Data {
		title: string;
		image: string;
		description: string;
		views: number;
		likes: number;
	}
	interface Travel {
		key: number;
		frame: Frame;
		style: string;
		config: Configuration;
		effectScale: boolean;
		item: Data;
		kind: Kind;
	}
	interface DetailTargets {
		image?: HTMLImageElement;
		coordinated?: HTMLDivElement;
	}

	const item = itemOf('/motion/connectedanimation');
	if (item === null) throw new Error('Connected Animation page has no Gallery item');
	const listSample = sampleOf('ConnectedAnimation/ConnectedAnimationListPage.txt');
	const cardSample = sampleOf('ConnectedAnimation/ConnectedAnimationElementsSame.txt');
	const simpleSample = sampleOf('ConnectedAnimation/SimpleConnectedAnimation.txt');
	const repeaterSample = sampleOf('ConnectedAnimation/ConnectedAnimationItemsrepeater.txt');

	// ConnectedAnimationService.cpp:26-28 — 3000000 ticks is 300ms; :300 builds this easing.
	const SERVICE_DURATION_MS = 300;
	const SERVICE_EASING = 'cubic-bezier(0.8, 0, 0.2, 1)';
	// DirectConnectedAnimationConfiguration_partial.cpp:13-15 — 200 * 10000 ticks is 200ms;
	// its neighbouring upstream comment says 150ms, but the value is 200ms.
	const DIRECT_DURATION_MS = 200;
	const DIRECT_EASING = 'cubic-bezier(0.1, 0.9, 0.2, 1)';
	// SamplePage1.xaml:66 and SamplePage2.xaml:45 — the paragraph shared by both examples.
	const lorem =
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.';
	// ConnectedAnimationPage.xaml.cs:86-93 — the Gallery's eight descriptions, in order.
	const descriptions = [
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer id facilisis lectus. Cras nec convallis ante, quis pulvinar tellus. Integer dictum accumsan pulvinar. Pellentesque eget enim sodales sapien vestibulum consequat.',
		'Nullam eget mattis metus. Donec pharetra, tellus in mattis tincidunt, magna ipsum gravida nibh, vitae lobortis ante odio vel quam.',
		'Quisque accumsan pretium ligula in faucibus. Mauris sollicitudin augue vitae lorem cursus condimentum quis ac mauris. Pellentesque quis turpis non nunc pretium sagittis. Nulla facilisi. Maecenas eu lectus ante. Proin eleifend vel lectus non tincidunt. Fusce condimentum luctus nisi, in elementum ante tincidunt nec.',
		'Aenean in nisl at elit venenatis blandit ut vitae lectus. Praesent in sollicitudin nunc. Pellentesque justo augue, pretium at sem lacinia, scelerisque semper erat. Ut cursus tortor at metus lacinia dapibus.',
		'Ut consequat magna luctus justo egestas vehicula. Integer pharetra risus libero, et posuere justo mattis et.',
		'Proin malesuada, libero vitae aliquam venenatis, diam est faucibus felis, vitae efficitur erat nunc non mauris. Suspendisse at sodales erat.',
		'Aenean vulputate, turpis non tincidunt ornare, metus est sagittis erat, id lobortis orci odio eget quam. Suspendisse ex purus, lobortis quis suscipit a, volutpat vitae turpis.',
		'Duis facilisis, quam ut laoreet commodo, elit ex aliquet massa, non varius tellus lectus et nunc. Donec vitae risus ut ante pretium semper. Phasellus consectetur volutpat orci, eu dapibus turpis. Fusce varius sapien eu mattis pharetra.'
	];
	// ConnectedAnimationPage.xaml.cs:97-107 — 8/13 items; deterministic values replace Random so
	// screenshot baselines stay stable while remaining inside upstream's 100..998 and 10..98 ranges.
	const data = (count: number): Data[] =>
		Array.from({ length: count }, (_, index) => ({
			title: `Item ${index + 1}`,
			image: `/LandscapeImage${index + 1}.jpg`,
			description: descriptions[index % descriptions.length],
			views: 100 + ((index * 137) % 899),
			likes: 10 + ((index * 53) % 89)
		}));
	const listItems = data(8);
	const allItems = data(13);
	let listPage = $state<'list' | 'detail'>('list');
	let repeaterPage = $state<'list' | 'detail'>('list');
	let simplePage = $state<Page>('one');
	let selected = $state<Data>(listItems[0]);
	let repeaterSelected = $state<Data>(allItems[0]);
	let card = $state<Data | null>(null);
	let configuration = $state<'default' | Configuration>('default');
	let travel = $state<Travel | null>(null);
	let coordinatedTravel = $state<Travel | null>(null);
	let frame1 = $state<HTMLDivElement>();
	let frame2 = $state<HTMLDivElement>();
	let frame3 = $state<HTMLDivElement>();
	let frame4 = $state<HTMLDivElement>();
	let cardTarget = $state<HTMLDivElement>();
	let simpleSource = $state<HTMLDivElement>();
	let simpleTarget = $state<HTMLDivElement>();
	const listTargets: DetailTargets = {};
	const repeaterTargets: DetailTargets = {};
	const listElements: Record<string, HTMLElement> = {};
	const cardElements: Record<string, HTMLElement> = {};
	const repeaterElements: Record<string, HTMLElement> = {};
	let key = 0;
	let hidden: HTMLElement[] = [];
	const effectiveConfig = () => (configuration === 'default' ? 'gravity' : configuration);
	function vars(values: Record<string, string | number>) {
		return Object.entries(values)
			.map(([name, value]) => `${name}: ${value}`)
			.join('; ');
	}

	async function animate(
		source: HTMLElement,
		frame: HTMLElement,
		frameId: Frame,
		destination: () => HTMLElement,
		item: Data,
		kind: Kind,
		config: Configuration,
		change: () => void,
		coordinatedDestination?: () => HTMLElement
	) {
		const sourceRect = source.getBoundingClientRect();
		const frameRect = frame.getBoundingClientRect();
		source.style.visibility = 'hidden';
		hidden = [source];
		change();
		await tick();
		const dest = destination();
		const destRect = dest.getBoundingClientRect();
		dest.style.visibility = 'hidden';
		hidden.push(dest);
		const sx = destRect.width / sourceRect.width;
		const sy = destRect.height / sourceRect.height;
		travel = {
			key: key++,
			frame: frameId,
			item,
			kind,
			config,
			effectScale: sx === 1 && sy === 1,
			style: vars({
				left: `${sourceRect.left - frameRect.left}px`,
				top: `${sourceRect.top - frameRect.top}px`,
				width: `${sourceRect.width}px`,
				height: `${sourceRect.height}px`,
				'--connected-dx': `${destRect.left - sourceRect.left}px`,
				'--connected-dy': `${destRect.top - sourceRect.top}px`,
				'--connected-sx': sx,
				'--connected-sy': sy,
				'--connected-duration': `${config === 'direct' ? DIRECT_DURATION_MS : SERVICE_DURATION_MS}ms`,
				'--connected-easing': config === 'direct' ? DIRECT_EASING : SERVICE_EASING
			})
		};
		if (coordinatedDestination) {
			const coordinated = coordinatedDestination();
			const coordinatedRect = coordinated.getBoundingClientRect();
			const scaleX = sourceRect.width / destRect.width;
			const scaleY = sourceRect.height / destRect.height;
			const sourceX = sourceRect.left + (coordinatedRect.left - destRect.left) * scaleX;
			const sourceY = sourceRect.top + (coordinatedRect.top - destRect.top) * scaleY;
			coordinated.style.visibility = 'hidden';
			hidden.push(coordinated);
			coordinatedTravel = {
				key: key++,
				frame: 1,
				item,
				kind: 'image',
				config: 'gravity',
				effectScale: scaleX === 1 && scaleY === 1,
				style: vars({
					left: `${sourceX - frameRect.left}px`,
					top: `${sourceY - frameRect.top}px`,
					width: `${coordinatedRect.width * scaleX}px`,
					height: `${coordinatedRect.height * scaleY}px`,
					'--connected-dx': `${coordinatedRect.left - sourceX}px`,
					'--connected-dy': `${coordinatedRect.top - sourceY}px`,
					'--connected-sx': 1 / scaleX,
					'--connected-sy': 1 / scaleY,
					'--connected-duration': `${SERVICE_DURATION_MS}ms`,
					'--connected-easing': SERVICE_EASING
				})
			};
		}
	}
	function finish(event: AnimationEvent) {
		// Svelte scopes @keyframes names, so browser AnimationEvent names carry a hash prefix.
		if (event.target !== event.currentTarget || !event.animationName.endsWith('connected-offset'))
			return;
		hidden.forEach((element) => (element.style.visibility = ''));
		hidden = [];
		travel = null;
		coordinatedTravel = null;
	}
	function openList(value: Data) {
		selected = value;
		void animate(
			listElements[value.title],
			frame1!,
			1,
			() => listTargets.image!,
			value,
			'image',
			'gravity',
			() => (listPage = 'detail'),
			() => listTargets.coordinated!
		);
	}
	function closeList() {
		void animate(
			listTargets.image!,
			frame1!,
			1,
			() => listElements[selected.title],
			selected,
			'image',
			'direct',
			() => (listPage = 'list')
		);
	}
	function openCard(value: Data) {
		card = value;
		void animate(
			cardElements[value.title],
			frame2!,
			2,
			() => cardTarget!,
			value,
			'card',
			'gravity',
			() => {}
		);
	}
	function closeCard() {
		const selectedCard = card;
		if (selectedCard)
			void animate(
				cardTarget!,
				frame2!,
				2,
				() => cardElements[selectedCard.title],
				selectedCard,
				'card',
				'direct',
				() => (card = null)
			);
	}
	function toggleSimple() {
		const forward = simplePage === 'one';
		const source = forward ? simpleSource : simpleTarget;
		void animate(
			source!,
			frame3!,
			3,
			() => (forward ? simpleTarget! : simpleSource!),
			listItems[0],
			'accent',
			effectiveConfig(),
			() => (simplePage = forward ? 'two' : 'one')
		);
	}
	function openRepeater(value: Data) {
		repeaterSelected = value;
		void animate(
			repeaterElements[value.title],
			frame4!,
			4,
			() => repeaterTargets.image!,
			value,
			'image',
			'gravity',
			() => (repeaterPage = 'detail')
		);
	}
	function closeRepeater() {
		void animate(
			repeaterTargets.image!,
			frame4!,
			4,
			() => repeaterElements[repeaterSelected.title],
			repeaterSelected,
			'image',
			'direct',
			() => (repeaterPage = 'list')
		);
	}
</script>

<ItemPage {item}>
	<ControlExample
		headerText={listSample.header ?? undefined}
		xaml={listSample.xaml ?? undefined}
		csharp={listSample.csharp ?? undefined}
	>
		<!-- ConnectedAnimationPage.xaml:14-17 — Frame Height 750, MinWidth 500. -->
		<div class="frame list-frame" bind:this={frame1}>
			{#if listPage === 'list'}
				<ListView
					items={listItems}
					key={(value) => value.title}
					selectionMode="none"
					isItemClickEnabled
					onItemClick={openList}
					itemTemplate={listRow}
				/>
			{:else}{@render detail(selected, closeList, listTargets)}{/if}
			{@render travelLayer(travel?.frame === 1 ? travel : null, finish)}
			{@render coordinatedLayer(coordinatedTravel)}
		</div>
	</ControlExample>

	<ControlExample
		headerText={cardSample.header ?? undefined}
		xaml={cardSample.xaml ?? undefined}
		csharp={cardSample.csharp ?? undefined}
	>
		<!-- ConnectedAnimationPage.xaml:22-26 — Frame MinWidth 500, MinHeight 300, MaxHeight 700. -->
		<div class="frame card-frame" bind:this={frame2}>
			<GridView
				items={allItems}
				key={(value) => value.title}
				selectionMode="none"
				isItemClickEnabled
				onItemClick={openCard}
				itemTemplate={cardTile}
			/>
			{#if card}<div class="smoke">
					<div class="card-detail" bind:this={cardTarget}>
						<img
							src={card.image}
							alt=""
						/><!-- CardPage.xaml:68-80 — 36x36, AutomationProperties.Name and ToolTip "Close",
						     FontIcon Glyph E711 at FontSize 14. -->
						<Button class="close" aria-label="Close" title="Close" onclick={closeCard}></Button>
						<div class="card-copy">
							<div class="winui-SubtitleTextBlockStyle">{card.title}</div>
							<p class="winui-BodyTextBlockStyle">{card.description}</p>
						</div>
					</div>
				</div>{/if}
			{@render travelLayer(travel?.frame === 2 ? travel : null, finish)}
		</div>
	</ControlExample>

	<ControlExample
		headerText={simpleSample.header ?? undefined}
		xaml={undefined}
		csharp={simpleSample.csharp ?? undefined}
	>
		<div class="frame simple-frame" bind:this={frame3}>
			{#if simplePage === 'one'}<ScrollViewer
					><div class="simple-one">
						<div class="filler dark"></div>
						<div class="filler light"></div>
						<div class="filler light"></div>
						<div class="filler dark"></div>
						<div class="accent" bind:this={simpleSource}></div>
						<p class="winui-BodyTextBlockStyle">{lorem}</p>
					</div></ScrollViewer
				>{:else}<ScrollViewer
					><div class="simple-two">
						<div class="accent" bind:this={simpleTarget}></div>
						<div class="content-panel entrance">
							<p class="winui-TitleTextBlockStyle">
								Lorem ipsum dolor sit amet, consectetur adipiscing elit
							</p>
							<p class="winui-BodyTextBlockStyle">{lorem}</p>
						</div>
					</div></ScrollViewer
				>{/if}
			{@render travelLayer(travel?.frame === 3 ? travel : null, finish)}
		</div>
		{#snippet options()}<div class="options">
				<Button onclick={toggleSimple}>Navigate</Button>
				<p class="configuration-label winui-BaseTextBlockStyle">Configurations</p>
				<RadioButtons
					><RadioButton value="default" bind:group={configuration}>Default</RadioButton><RadioButton
						value="gravity"
						bind:group={configuration}>Gravity</RadioButton
					><RadioButton value="direct" bind:group={configuration}>Direct</RadioButton><RadioButton
						value="basic"
						bind:group={configuration}>Basic</RadioButton
					></RadioButtons
				>
			</div>{/snippet}
	</ControlExample>

	<ControlExample
		headerText={repeaterSample.header ?? undefined}
		xaml={repeaterSample.xaml ?? undefined}
		csharp={repeaterSample.csharp ?? undefined}
	>
		<p class="repeater-note">
			Unlike ListView and GridView, ItemsRepeater does not have built-in ConnectedAnimation methods.
			Use ConnectedAnimationService.PrepareToAnimate() directly, and manually find the target
			element in the visual tree. Click an item to navigate with a connected animation.
		</p>
		<!-- ItemsRepeaterCollectionPage.xaml.cs:62-67, :121-140 — upstream demonstrates its direct service
		     call and visual-tree walk. Every page here uses the same page helper, so that API distinction does not arise. -->
		<div class="frame repeater-frame" bind:this={frame4}>
			{#if repeaterPage === 'list'}<ItemsRepeater
					items={allItems}
					key={(value) => value.title}
					layout={{
						kind: 'uniformGrid',
						minColumnSpacing: 8,
						minItemHeight: 120,
						minItemWidth: 150,
						minRowSpacing: 8
					}}
					itemTemplate={repeaterTile}
				/>{:else}{@render detail(
					repeaterSelected,
					closeRepeater,
					repeaterTargets
				)}{/if}{@render travelLayer(travel?.frame === 4 ? travel : null, finish)}
		</div>
	</ControlExample>
</ItemPage>

{#snippet listRow(value: Data)}<div class="list-row">
		<div class="list-image" bind:this={listElements[value.title]}>
			<img src={value.image} alt="" />
		</div>
		<div>
			<div class="winui-SubtitleTextBlockStyle title">{value.title}</div>
			<div class="stats winui-CaptionTextBlockStyle">
				<b>Views: </b><span>{value.views}</span><b>Likes: </b><span>{value.likes}</span>
			</div>
			<p class="description winui-BodyTextBlockStyle">{value.description}</p>
		</div>
	</div>{/snippet}
{#snippet cardTile(value: Data)}<div class="card-tile" bind:this={cardElements[value.title]}>
		<img src={value.image} alt="" />
		<div class="winui-CaptionTextBlockStyle">{value.title}</div>
	</div>{/snippet}
{#snippet repeaterTile(value: Data)}<button
		type="button"
		class="repeater-tile"
		bind:this={repeaterElements[value.title]}
		onclick={() => openRepeater(value)}
	>
		<img src={value.image} alt="" />
		<div class="winui-CaptionTextBlockStyle">{value.title}</div>
	</button>{/snippet}
{#snippet detail(selected: Data, onback: () => void, targets: DetailTargets)}<div class="detail">
		<Button class="detail-back" onclick={onback}>Go Back</Button>
		<div class="detail-header">
			<img bind:this={targets.image} src={selected.image} alt="" />
			<div class="coordinated" bind:this={targets.coordinated}>
				<div class="subheader">{selected.title}</div>
				<div class="winui-SubtitleTextBlockStyle"><b>Views: </b>{selected.views}</div>
				<div class="winui-SubtitleTextBlockStyle"><b>Likes: </b>{selected.likes}</div>
			</div>
		</div>
		<p class="winui-SubtitleTextBlockStyle detail-description">{selected.description}</p>
	</div>{/snippet}
{#snippet travelLayer(value: Travel | null, onend: (event: AnimationEvent) => void)}{#if value}<div
			class="travel"
			style={value.style}
			data-config={value.config}
			data-effect-scale={value.effectScale}
		>
			<div class="travel-effect-offset">
				<div class="travel-offset" onanimationend={onend}>
					<div class="travel-scale">
						<div class="travel-effect-scale">
							<div class="travel-source">{@render travelSourceContent(value)}</div>
							<div class="travel-dest">{@render travelDestinationContent(value)}</div>
						</div>
					</div>
				</div>
			</div>
		</div>{/if}{/snippet}
{#snippet coordinatedLayer(value: Travel | null)}{#if value}<div
			class="coordinated-travel"
			style={value.style}
			data-effect-scale={value.effectScale}
		>
			<div class="travel-effect-offset">
				<div class="travel-offset">
					<div class="travel-scale">
						<div class="travel-effect-scale">
							<div class="coordinated-content">{@render coordinatedContent(value)}</div>
						</div>
					</div>
				</div>
			</div>
		</div>{/if}{/snippet}
{#snippet travelSourceContent(value: Travel)}{#if value.kind === 'accent'}<div
			class="accent"
		></div>{:else if value.kind === 'card'}<div class="travel-card travel-card-source">
			<img src={value.item.image} alt="" />
			<div class="winui-CaptionTextBlockStyle">{value.item.title}</div>
		</div>{:else}<img class="travel-image" src={value.item.image} alt="" />{/if}{/snippet}
{#snippet travelDestinationContent(value: Travel)}{#if value.kind === 'accent'}<div
			class="accent"
		></div>{:else if value.kind === 'card'}<div class="travel-card travel-card-destination">
			<img src={value.item.image} alt="" />
			<button class="travel-close" type="button" aria-label="Close"></button>
			<div class="travel-card-copy">
				<div class="winui-SubtitleTextBlockStyle">{value.item.title}</div>
				<p class="winui-BodyTextBlockStyle">{value.item.description}</p>
			</div>
		</div>{:else}<img class="travel-image" src={value.item.image} alt="" />{/if}{/snippet}
{#snippet coordinatedContent(value: Travel)}<div class="coordinated">
		<div class="subheader">{value.item.title}</div>
		<div class="winui-SubtitleTextBlockStyle"><b>Views: </b>{value.item.views}</div>
		<div class="winui-SubtitleTextBlockStyle"><b>Likes: </b>{value.item.likes}</div>
	</div>{/snippet}

<style>
	/* ConnectedAnimation.cpp:595, :533-534, :610 and :666 — primary offset, scale, and Crossfade.Weight. */
	@keyframes connected-offset {
		from {
			translate: 0 0;
		}
		to {
			translate: var(--connected-dx) var(--connected-dy);
		}
	}
	@keyframes connected-scale {
		from {
			scale: 1 1;
		}
		to {
			scale: var(--connected-sx) var(--connected-sy);
		}
	}
	@keyframes connected-fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	/* GravityConnectedAnimationConfiguration_partial.cpp:13-17, :65-78 — 0.66 peak and its two splines. */
	@keyframes gravity-offset {
		0% {
			translate: 0 0;
			animation-timing-function: cubic-bezier(0.35, 0, 0.55, 1);
		}
		66% {
			translate: 0 80px;
			animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1);
		}
		100% {
			translate: 0 0;
		}
	}
	/* GravityConnectedAnimationConfiguration_partial.cpp:82-102 — scale bump only when primary scale is 1. */
	@keyframes gravity-scale {
		0% {
			scale: 1 1;
			animation-timing-function: cubic-bezier(0.35, 0, 0.55, 1);
		}
		66% {
			scale: 1.1 1.1;
			animation-timing-function: cubic-bezier(0.45, 0, 0.55, 1);
		}
		100% {
			scale: 1 1;
		}
	}
	/* ThemeTransitions.cpp:3180-3186 — Entrance holds opacity 150ms then slides 140px over 300ms. */
	@keyframes nav-shift-in {
		0% {
			opacity: 0;
			translate: 0 140px;
			animation-timing-function: steps(1, jump-end);
		}
		33.3333% {
			opacity: 1;
			translate: 0 140px;
			animation-timing-function: cubic-bezier(0.1, 0.9, 0.2, 1);
		}
		100% {
			opacity: 1;
			translate: 0 0;
		}
	}
	.frame {
		position: relative;
		display: grid;
		width: 100%;
		min-width: 500px;
		overflow: hidden;
	}
	.list-frame {
		height: 750px;
	}
	.card-frame {
		min-height: 300px;
		max-height: 700px;
	}
	.simple-frame {
		height: 500px;
		min-height: 300px;
	}
	.repeater-frame {
		height: 400px;
	}
	:global(.list-frame .root),
	:global(.card-frame .root) {
		min-height: 0;
	}
	:global(.card-frame .root) {
		max-width: 1400px;
		width: 100%;
		margin: auto;
	}
	.list-row {
		display: grid;
		grid-template-columns: 150px 1fr;
		gap: 12px;
		margin: 12px 0;
	}
	.list-image {
		width: 150px;
		height: 100px;
	}
	.list-image img {
		width: 100%;
		height: 100%;
		object-fit: fill;
	}
	.title {
		margin-bottom: 6px;
	}
	.stats {
		display: flex;
	}
	.stats span {
		margin-left: 5px;
	}
	.stats b:not(:first-child) {
		margin-left: 8px;
	}
	.description {
		max-width: 500px;
		margin: 8px 0 0;
		font-style: italic;
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		line-clamp: 2;
		overflow: hidden;
	}
	.card-tile {
		width: 150px;
		height: 110px;
		margin: 4px;
		/* c1-allow: CardPage.xaml:29 — connected Grid CornerRadius="4". */
		border-radius: 4px;
		overflow: hidden;
		position: relative;
	}
	.card-tile img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	.card-tile div,
	.repeater-tile div {
		position: absolute;
		inset: auto 0 0;
		padding: 4px 8px;
		background: var(--winui-AcrylicBackgroundFillColorBaseBrush);
	}
	.smoke {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		background: var(--winui-SmokeFillColorDefaultBrush);
	}
	.card-detail {
		width: 400px;
		height: 320px;
		display: grid;
		/* minmax, not `1fr`: a grid track's automatic minimum is its item's min-content
		   height, and the photo floored this row at 268px, overflowing the card by 60. */
		grid-template-rows: minmax(0, 1fr) auto;
		position: relative;
		/* c1-allow: CardPage.xaml:58-59 — BorderThickness="1". */
		border: 1px solid var(--winui-CardStrokeColorDefaultBrush);
		/* c1-allow: CardPage.xaml:60 — destination Grid CornerRadius="8". */
		border-radius: 8px;
		overflow: hidden;
	}
	.card-detail > img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	/* Descendant-qualified, because `class` handed to `Button` reaches its `<button>` without
	   this component's scope hash: a bare `:global(.close)` ties with the library's own `.root`
	   at one class each and loses on order. Measured before this was qualified, the button came
	   out 400px wide and in flow, which pushed the card's copy past its 320px clip. The same
	   reasoning is written out at CopyButton.svelte:96-99. */
	.card-detail :global(.close) {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 36px;
		height: 36px;
		min-width: 0;
		padding: 0;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: CardPage.xaml:78 — FontIcon FontSize="14". */
		font-size: 14px;
	}
	.card-copy {
		padding: 12px 16px;
		background: var(--winui-CardBackgroundFillColorDefaultBrush);
	}
	.card-copy p {
		margin: 4px 0 0;
		color: var(--winui-TextFillColorSecondaryBrush);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	.detail {
		min-height: 100%;
		position: relative;
	}
	.detail-header {
		display: grid;
		grid-template-columns: auto 1fr;
		/* DetailedInfoPage.xaml:15-25, :27 — back button overlaps the header row; content starts at 52px. */
		margin: 52px 20px 20px;
	}
	/* Descendant-qualified for the reason spelled out above `.close`. */
	.detail :global(.detail-back) {
		position: absolute;
		top: 0;
		left: 0;
		z-index: 1;
	}
	.detail-header img {
		max-height: 400px;
		max-width: 55%;
		object-fit: contain;
		align-self: start;
	}
	.coordinated {
		margin: 0 20px;
		align-self: start;
	}
	.coordinated-content > .coordinated {
		margin: 0;
	}
	.subheader {
		/* c1-allow: windows-app-sdk/generic.xaml:11120-11124 — legacy Subheader is 34px Light. */
		font-size: 34px;
		/* c1-allow: windows-app-sdk/generic.xaml:11120-11124 — legacy Subheader weight is Light. */
		font-weight: 300;
		margin-bottom: 10px;
	}
	.detail-description {
		margin: 10px;
	}
	.simple-one {
		display: grid;
		grid-template-columns: auto 1fr 1fr;
		grid-template-rows: auto auto auto 1fr;
	}
	.filler {
		min-height: 150px;
		margin: 6px;
	}
	.dark {
		/* c1-allow: SamplePage1.xaml:31 and :49 — XAML named DarkGray. */
		background: DarkGray;
	}
	.light {
		/* c1-allow: SamplePage1.xaml:37 and :43 — XAML named LightGray. */
		background: LightGray;
	}
	.filler:nth-child(1) {
		grid-area: 2 / 2;
	}
	.filler:nth-child(2) {
		grid-area: 2 / 3;
	}
	.filler:nth-child(3) {
		grid-area: 3 / 2;
	}
	.filler:nth-child(4) {
		grid-area: 3 / 3;
	}
	.accent {
		background: var(--winui-SystemAccentColor);
		min-width: 250px;
		min-height: 150px;
		margin: 5px;
	}
	.simple-one > .accent {
		grid-area: 2 / 1 / 4 / 2;
	}
	.simple-one > p {
		grid-area: 4 / 1 / 5 / 4;
		margin: 12px 6px;
	}
	.simple-two {
		display: grid;
		grid-template-columns: auto 1fr;
	}
	.simple-two > .accent {
		width: 150px;
		height: 200px;
		min-height: 150px;
		margin: 12px;
	}
	.content-panel {
		min-height: 200px;
		margin: 12px;
	}
	.content-panel p {
		margin: 0 0 12px;
	}
	.entrance {
		/* c1-allow: ThemeTransitions.cpp:3185-3186 — 150ms hold plus 300ms slide. */
		animation: nav-shift-in 450ms both;
	}
	.options {
		display: flex;
		flex-direction: column;
	}
	.options :global(button) {
		width: 100%;
	}
	.configuration-label {
		margin: 6px 0;
	}
	.repeater-note {
		margin: 0 0 12px;
	}
	.repeater-tile {
		min-height: 120px;
		min-width: 150px;
		position: relative;
		/* c1-allow: ItemsRepeaterCollectionPage.xaml:39 — Grid CornerRadius="4". */
		border-radius: 4px;
		overflow: hidden;
		padding: 0;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		text-align: inherit;
	}
	.repeater-tile img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		position: absolute;
		inset: 0;
	}
	/* WD-048: this is live markup rather than WinUI's surface-brush snapshot; see docs/divergences.md. */
	.travel {
		position: absolute;
		pointer-events: none;
		z-index: 2;
	}
	.coordinated-travel {
		position: absolute;
		pointer-events: none;
		z-index: 2;
	}
	.travel-effect-offset,
	.travel-offset,
	.travel-scale,
	.travel-effect-scale {
		position: absolute;
		inset: 0;
		transform-origin: 0 0; /* ConnectedAnimation.cpp:919-922 never sets CenterPoint: scaling is top-left, not centre. */
	}
	.travel-source,
	.travel-dest {
		position: absolute;
		inset: 0;
		overflow: hidden;
	}
	.travel-dest {
		opacity: 0; /* ConnectedAnimation.cpp:666: dest-over-source alpha is Crossfade.Weight. */
		animation: connected-fade var(--connected-duration) var(--connected-easing) both;
	}
	.coordinated-content {
		position: absolute;
		inset: 0;
		overflow: hidden;
		opacity: 0;
		animation: connected-fade var(--connected-duration) var(--connected-easing) both;
	}
	.travel-offset {
		animation: connected-offset var(--connected-duration) var(--connected-easing) both;
	}
	.travel-scale {
		animation: connected-scale var(--connected-duration) var(--connected-easing) both;
	}
	.travel[data-config='gravity'] .travel-effect-offset {
		animation: gravity-offset var(--connected-duration) both;
	}
	.coordinated-travel .travel-effect-offset {
		animation: gravity-offset var(--connected-duration) both;
	}
	.travel[data-config='gravity'][data-effect-scale='true'] .travel-effect-scale,
	.coordinated-travel[data-effect-scale='true'] .travel-effect-scale {
		animation: gravity-scale var(--connected-duration) both;
	} /* WD-049: CSS omits Gravity's Z=32 and CThemeShadow caster; see docs/divergences.md. */
	.travel-image,
	.travel-card img {
		width: 100%;
		height: 100%;
		object-fit: fill;
	}
	.travel-card {
		width: 100%;
		height: 100%;
		display: grid;
		/* minmax, not `1fr`: a grid track's automatic minimum is its item's min-content
		   height, and the photo floored this row at 268px, overflowing the card by 60. */
		grid-template-rows: minmax(0, 1fr) auto;
	}
	.travel-card-source div {
		padding: 4px 8px;
		background: var(--winui-AcrylicBackgroundFillColorBaseBrush);
	}
	.travel-card-destination {
		position: relative;
	}
	.travel-close {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 36px;
		height: 36px;
		padding: 0;
		border: none;
		background: none;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: CardPage.xaml:78 — FontIcon FontSize="14". */
		font-size: 14px;
	}
	.travel-card-copy {
		padding: 12px 16px;
		background: var(--winui-CardBackgroundFillColorDefaultBrush);
	}
	.travel-card-copy p {
		margin: 4px 0 0;
		color: var(--winui-TextFillColorSecondaryBrush);
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
