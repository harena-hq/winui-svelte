<script lang="ts">
	import { Button, RadioButton, RadioButtons, ScrollViewer } from 'winui-svelte';
	import { linearEasing } from '$lib/easing';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	type SamplePageId = 1 | 2;
	type Direction = 'forward' | 'back';
	type Role = 'to' | 'away';
	type TransitionMode =
		| 'default'
		| 'entrance'
		| 'drillin'
		| 'suppress'
		| 'slideright'
		| 'slideleft'
		| 'common'
		| 'continuum';

	interface Layer {
		key: number;
		page: SamplePageId;
		nav: string;
		style: string;
	}

	const item = itemOf('/motion/pagetransition');
	if (item === null) throw new Error('Page Transitions page has no Gallery item');
	const sample = sampleOf('PageTransition/PageTransitions.txt');

	// ThemeTransitions.cpp:745 and :945 — turnstile ExponentialEase(6), EaseOut.
	const EASE_EXP6_OUT = linearEasing('ExponentialEase', 'EaseOut', { exponent: 6 });
	// ThemeTransitions.cpp:845, :1045, :1895 and :2161 — the same curve in EaseIn mode.
	const EASE_EXP6_IN = linearEasing('ExponentialEase', 'EaseIn', { exponent: 6 });
	// ThemeTransitions.cpp:1893 — Continuum's CircleEase EaseOut.
	const EASE_CIRCLE_OUT = linearEasing('CircleEase', 'EaseOut');

	// ThemeTransitions.cpp:1545-1546 and :1553 — the slide offsets and Effect sign.
	const SLIDE_EXIT_PX = 150;
	const SLIDE_ENTRANCE_PX = -200;
	const EMPTY_STYLE = '';

	function properties(values: Record<string, string | number>): string {
		return Object.entries(values)
			.map(([name, value]) => `${name}: ${value}`)
			.join('; ');
	}

	function slideStyles(factor: 1 | -1): Record<string, string> {
		return {
			forwardTo: properties({
				'--nav-from-x': `${SLIDE_ENTRANCE_PX * factor}px`,
				'--nav-from-y': '0px'
			}),
			forwardAway: properties({
				'--nav-from-x': '0px',
				'--nav-from-y': '0px',
				'--nav-to-x': `${SLIDE_EXIT_PX * factor}px`,
				'--nav-to-y': '0px'
			}),
			backTo: properties({
				'--nav-from-x': `${SLIDE_EXIT_PX * factor}px`,
				'--nav-from-y': '0px'
			}),
			backAway: properties({
				'--nav-from-x': '0px',
				'--nav-from-y': '0px',
				'--nav-to-x': `${SLIDE_ENTRANCE_PX * factor}px`,
				'--nav-to-y': '0px'
			})
		};
	}

	const RIGHT_SLIDE = slideStyles(-1);
	const LEFT_SLIDE = slideStyles(1);

	// ThemeTransitions.cpp:3180-3186, :2830-3031, :758-769, :858-868, :958-969,
	// :1058-1068, and :1910-1931, :2157-2167 — every per-state offset is transcribed here.
	const NAV_STYLES: Record<string, string> = {
		'entrance-forward-to': properties({ '--nav-from-x': '0px', '--nav-from-y': '140px' }),
		'entrance-forward-away': properties({ '--nav-opacity-from': 1, '--nav-opacity-to': 0 }),
		'entrance-back-to': EMPTY_STYLE,
		'entrance-back-away': properties({
			'--nav-from-x': '0px',
			'--nav-from-y': '0px',
			'--nav-to-x': '0px',
			'--nav-to-y': '140px'
		}),
		'slideright-forward-to': RIGHT_SLIDE.forwardTo,
		'slideright-forward-away': RIGHT_SLIDE.forwardAway,
		'slideright-back-to': RIGHT_SLIDE.backTo,
		'slideright-back-away': RIGHT_SLIDE.backAway,
		'slideleft-forward-to': LEFT_SLIDE.forwardTo,
		'slideleft-forward-away': LEFT_SLIDE.forwardAway,
		'slideleft-back-to': LEFT_SLIDE.backTo,
		'slideleft-back-away': LEFT_SLIDE.backAway,
		'drillin-forward-to': properties({
			'--nav-scale-from': 0.94,
			'--nav-scale-to': 1,
			'--nav-opacity-from': 0,
			'--nav-opacity-to': 1
		}),
		'drillin-forward-away': properties({
			'--nav-scale-from': 1,
			'--nav-scale-to': 1.04,
			'--nav-opacity-from': 1,
			'--nav-opacity-to': 0
		}),
		'drillin-back-to': properties({
			'--nav-scale-from': 1.06,
			'--nav-scale-to': 1,
			'--nav-opacity-from': 0,
			'--nav-opacity-to': 1
		}),
		'drillin-back-away': properties({
			'--nav-scale-from': 1,
			'--nav-scale-to': 0.96,
			'--nav-opacity-from': 1,
			'--nav-opacity-to': 0
		}),
		'common-forward-to': properties({ '--nav-turn-from': '-80deg' }),
		'common-forward-away': properties({ '--nav-turn-from': '0deg', '--nav-turn-to': '50deg' }),
		'common-back-to': properties({ '--nav-turn-from': '50deg' }),
		'common-back-away': properties({ '--nav-turn-from': '0deg', '--nav-turn-to': '-80deg' }),
		'continuum-forward-to': EMPTY_STYLE,
		'continuum-forward-away': EMPTY_STYLE,
		'continuum-back-to': EMPTY_STYLE,
		'continuum-back-away': properties({
			'--nav-from-x': '0px',
			'--nav-from-y': '0px',
			'--nav-to-x': '0px',
			'--nav-to-y': '200px'
		})
	};

	const TRANSITION_PARAMETERS: Record<TransitionMode, string> = {
		default: '',
		entrance: ', new EntranceNavigationTransitionInfo()',
		drillin: ', new DrillInNavigationTransitionInfo()',
		suppress: ', new SuppressNavigationTransitionInfo()',
		slideright:
			', new SlideNavigationTransitionInfo() { Effect = SlideNavigationTransitionEffect.FromRight }',
		slideleft:
			', new SlideNavigationTransitionInfo() { Effect = SlideNavigationTransitionEffect.FromLeft }',
		common: ', new CommonNavigationTransitionInfo()',
		continuum: ', new ContinuumNavigationTransitionInfo()'
	};

	let mode = $state<TransitionMode>('default');
	let backStack = $state<SamplePageId[]>([]);
	let key = 0;
	let arriving = $state<Layer>(makeLayer(1, 'forward', 'to'));
	let leaving = $state<Layer | null>(null);

	const transitionParameter = $derived(TRANSITION_PARAMETERS[mode]);
	const frameStyle = $derived(
		properties({
			'--nav-ease-exp6-out': EASE_EXP6_OUT,
			'--nav-ease-exp6-in': EASE_EXP6_IN,
			'--nav-ease-circle-out': EASE_CIRCLE_OUT
		})
	);

	function effectiveMode(): Exclude<TransitionMode, 'default' | 'suppress'> | 'suppress' {
		// ThemeTransitions.cpp:162-233 — an unset default resolves to EntranceNavigationTransitionInfo.
		return mode === 'default' ? 'entrance' : mode;
	}

	function makeLayer(page: SamplePageId, direction: Direction, role: Role): Layer {
		const animationMode = effectiveMode();
		const nav = animationMode === 'suppress' ? '' : `${animationMode}-${direction}-${role}`;
		return { key: key++, page, nav, style: NAV_STYLES[nav] ?? EMPTY_STYLE };
	}

	function navigate(page: SamplePageId, direction: Direction) {
		const next = makeLayer(page, direction, 'to');
		if (effectiveMode() === 'suppress') {
			leaving = null;
		} else {
			// This page drops an already-leaving layer when another navigation starts.
			leaving = makeLayer(arriving.page, direction, 'away');
		}
		arriving = next;
	}

	function navigateForward() {
		// PageTransitionPage.xaml.cs:24 reads BackStackDepth before Navigate.
		const next: SamplePageId = backStack.length % 2 === 1 ? 1 : 2;
		backStack.push(arriving.page);
		navigate(next, 'forward');
	}

	function navigateBackward() {
		// PageTransitionPage.xaml.cs:40 — GoBack only exists when BackStackDepth is positive.
		const previous = backStack.pop();
		if (previous !== undefined) navigate(previous, 'back');
	}

	function onLeavingAnimationEnd(event: AnimationEvent) {
		if (event.target === event.currentTarget) leaving = null;
	}

	function onArrivingAnimationEnd(event: AnimationEvent, layerKey: number) {
		if (
			event.target === event.currentTarget &&
			arriving.key === layerKey &&
			isLongestArrivingTrack(arriving.nav, event.animationName)
		) {
			arriving = { ...arriving, nav: '' };
		}
	}

	function isLongestArrivingTrack(nav: string, animationName: string): boolean {
		// DrillIn forward has a 333ms fade and a 783ms scale; preserve the longer track.
		return !nav.startsWith('drillin-forward-to') || animationName.endsWith('nav-scale');
	}
</script>

<ItemPage {item}>
	<!-- PageTransitionPage.xaml:21, :27-57 — not reproduced: AutomationProperties.Name on the
	     radios. These components pass rest props to a wrapper label rather than their input, so
	     aria-label would label the wrong node. -->
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		csharp={sample.csharp ?? undefined}
		substitutions={{ TransitionParameter: transitionParameter }}
	>
		<!-- PageTransitionPage.xaml:75-84 — Frame with MinHeight="600" and NavigationThemeTransition. -->
		<div class="frame" style={frameStyle}>
			{#if leaving !== null}
				{#key leaving.key}
					<div
						class="layer"
						data-nav={leaving.nav || undefined}
						style={leaving.style}
						onanimationend={onLeavingAnimationEnd}
					>
						{@render samplePage(leaving.page)}
					</div>
				{/key}
			{/if}
			{#key arriving.key}
				<div
					class="layer"
					data-nav={arriving.nav || undefined}
					style={arriving.style}
					onanimationend={(event) => onArrivingAnimationEnd(event, arriving.key)}
				>
					{@render samplePage(arriving.page)}
				</div>
			{/key}
		</div>

		{#snippet options()}
			<div class="options">
				<RadioButtons header="Transition modes">
					<RadioButton name="page-transition-mode" value="default" bind:group={mode}
						>Default</RadioButton
					>
					<RadioButton name="page-transition-mode" value="entrance" bind:group={mode}
						>Entrance</RadioButton
					>
					<RadioButton name="page-transition-mode" value="drillin" bind:group={mode}
						>DrillIn</RadioButton
					>
					<RadioButton name="page-transition-mode" value="suppress" bind:group={mode}
						>Suppress</RadioButton
					>
					<RadioButton name="page-transition-mode" value="slideright" bind:group={mode}
						>Slide from Right</RadioButton
					>
					<RadioButton name="page-transition-mode" value="slideleft" bind:group={mode}
						>Slide from Left</RadioButton
					>
					<RadioButton name="page-transition-mode" value="common" bind:group={mode}
						>Common</RadioButton
					>
					<RadioButton name="page-transition-mode" value="continuum" bind:group={mode}
						>Continuum</RadioButton
					>
				</RadioButtons>
				<!-- PageTransitionPage.xaml:62 — Margin="0,12,0,8". -->
				<p class="navigate-label">Navigate</p>
				<!-- PageTransitionPage.xaml:63-71 — stretched buttons; Forward has bottom margin 4. -->
				<Button class="forward-button" onclick={navigateForward}>Navigate Forward</Button>
				<Button onclick={navigateBackward}>Navigate Backward</Button>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

{#snippet samplePage(page: SamplePageId)}
	{#if page === 1}
		<ScrollViewer class="sample-scrollviewer">
			<!-- SamplePage1.xaml:15-23 — Auto,*,* columns and Auto,Auto,Auto,* rows. -->
			<div class="sample-one-grid">
				<!-- SamplePage1.xaml:26-49 — four 150-high tiles, each with Margin="6". -->
				<div class="tile dark-tile top-left"></div>
				<div class="tile light-tile top-right"></div>
				<div class="tile light-tile bottom-left"></div>
				<div class="tile dark-tile bottom-right"></div>
				<!-- SamplePage1.xaml:50-58 — SourceElement, MinWidth 250, MinHeight 150, Margin 5. -->
				<div class="source-element"></div>
				<!-- SamplePage1.xaml:60-67 — row 3, all columns, Margin="6,12", BodyTextBlockStyle. -->
				<p class="sample-one-copy winui-BodyTextBlockStyle">
					Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
					ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation
					ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
					reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur
					sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id
					est laborum.
				</p>
			</div>
		</ScrollViewer>
	{:else}
		<ScrollViewer class="sample-scrollviewer">
			<!-- SamplePage2.xaml:15-20 — Auto,* columns and two Auto rows. -->
			<div class="sample-two-grid">
				<!-- SamplePage2.xaml:23-32 — 150 by 200 DestinationElement, Margin 12, top-aligned. -->
				<div class="destination-element"></div>
				<!-- SamplePage2.xaml:34-46 — 200-high ContentPanel, Margin 12. -->
				<div class="content-panel">
					<p class="sample-two-heading winui-TitleTextBlockStyle">
						Lorem ipsum dolor sit amet, consectetur adipiscing elit
					</p>
					<p class="sample-two-copy winui-BodyTextBlockStyle">
						Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
						incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
						exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
						dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
						Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt
						mollit anim id est laborum.
					</p>
				</div>
			</div>
		</ScrollViewer>
	{/if}
{/snippet}

<style>
	/* ThemeTransitions.cpp:3180-3186 — Entrance's 140px TranslationY and 150/300ms segments. */
	@keyframes nav-shift {
		from {
			translate: var(--nav-from-x) var(--nav-from-y);
		}
		to {
			translate: var(--nav-to-x) var(--nav-to-y);
		}
	}

	@keyframes nav-scale {
		from {
			scale: var(--nav-scale-from);
		}
		to {
			scale: var(--nav-scale-to);
		}
	}

	@keyframes nav-fade {
		from {
			opacity: var(--nav-opacity-from);
		}
		to {
			opacity: var(--nav-opacity-to);
		}
	}

	@keyframes nav-turn {
		from {
			rotate: y var(--nav-turn-from);
		}
		to {
			rotate: y var(--nav-turn-to);
		}
	}

	/* 150 / 450 = 33.3333%; ThemeTransitions.cpp:3200-3206 and :1569-1574. */
	@keyframes nav-shift-in {
		0% {
			opacity: 0;
			translate: var(--nav-from-x) var(--nav-from-y);
			animation-timing-function: steps(1, jump-end);
		}
		33.3333% {
			opacity: 1;
			translate: var(--nav-from-x) var(--nav-from-y);
			animation-timing-function: cubic-bezier(0.1, 0.9, 0.2, 1);
		}
		100% {
			opacity: 1;
			translate: 0 0;
		}
	}

	/* 150 / 450 = 33.3333%; ThemeTransitions.cpp:3219-3221. */
	@keyframes nav-fade-in-late {
		0% {
			opacity: 0;
			animation-timing-function: steps(1, jump-end);
		}
		33.3333% {
			opacity: 0;
			animation-timing-function: cubic-bezier(0.1, 0.9, 0.2, 1);
		}
		100% {
			opacity: 1;
		}
	}

	/* 128 / 556 = 23.0216%; ThemeTransitions.cpp:758-769 and :958-969. */
	@keyframes nav-turn-in {
		0% {
			opacity: 0;
			rotate: y var(--nav-turn-from);
			animation-timing-function: steps(1, jump-end);
		}
		23.0216% {
			opacity: 1;
			rotate: y var(--nav-turn-from);
			animation-timing-function: var(--nav-ease-exp6-out);
		}
		100% {
			opacity: 1;
			rotate: y 0deg;
		}
	}

	/* 267 / 617 = 43.2739%; ThemeTransitions.cpp:1910, :1921-1931. */
	@keyframes nav-zoom-in {
		0% {
			opacity: 0;
			scale: 0.9;
			animation-timing-function: steps(1, jump-end);
		}
		43.2739% {
			opacity: 1;
			scale: 0.9;
			animation-timing-function: var(--nav-ease-circle-out);
		}
		100% {
			opacity: 1;
			scale: 1;
		}
	}

	/* 267 / 617 = 43.2739%; ThemeTransitions.cpp:2097-2099. */
	@keyframes nav-fade-in-circle {
		0% {
			opacity: 0;
			animation-timing-function: steps(1, jump-end);
		}
		43.2739% {
			opacity: 0;
			animation-timing-function: var(--nav-ease-circle-out);
		}
		100% {
			opacity: 1;
		}
	}

	/* 120 / 250 = 48%; ThemeTransitions.cpp:2012-2018. */
	@keyframes nav-fade-out-circle {
		0% {
			opacity: 1;
			animation-timing-function: steps(1, jump-end);
		}
		48% {
			opacity: 1;
			animation-timing-function: var(--nav-ease-circle-out);
		}
		100% {
			opacity: 0;
		}
	}

	/* 240 / 250 = 96%; ThemeTransitions.cpp:2160-2167. */
	@keyframes nav-fade-out-late {
		0% {
			opacity: 1;
			animation-timing-function: steps(1, jump-end);
		}
		96% {
			opacity: 1;
			animation-timing-function: linear;
		}
		100% {
			opacity: 0;
		}
	}

	.options {
		display: flex;
		flex-direction: column;
	}

	.options :global(button) {
		width: 100%;
	}

	.navigate-label {
		margin: 12px 0 8px;
	}

	.options :global(.forward-button) {
		margin-bottom: 4px;
	}

	.frame {
		/* WD-047: the perspective is derived from CPlaneProjection's parameters; see docs/divergences.md. */
		perspective: 999px;
		display: grid;
		width: 100%;
		min-height: 600px;
		overflow: hidden;
	}

	.layer {
		grid-area: 1 / 1;
		min-width: 0;
	}

	/* ThemeTransitions.cpp:1089 — Common temporarily sets IsHitTestVisible to FALSE; this makes
	   every in-flight layer inert, including Continuum's corresponding :2185 behaviour. */
	.layer[data-nav] {
		pointer-events: none;
	}

	/* Default and Entrance are intentionally identical: ThemeTransitions.cpp:162-233 resolves
	   NavigationThemeTransition with no override to EntranceNavigationTransitionInfo. */
	.layer[data-nav='entrance-forward-to'] {
		/* c1-allow: ThemeTransitions.cpp:3185-3186 — 150ms hold plus 300ms entrance. */
		animation: nav-shift-in 450ms both;
	}
	.layer[data-nav='entrance-forward-away'] {
		/* c1-allow: ThemeTransitions.cpp:3195-3196 — 150ms out spline. */
		animation: nav-fade 150ms cubic-bezier(0.7, 0, 1, 0.5) both;
	}
	.layer[data-nav='entrance-back-to'] {
		/* c1-allow: ThemeTransitions.cpp:3185-3186 — 150ms hold plus 300ms entrance. */
		animation: nav-fade-in-late 450ms both;
	}
	/* ThemeTransitions.cpp:3210-3215 — opacity stays discretely 1 until the same instant this
	   layer is removed, so no unobservable fade is added. */
	.layer[data-nav='entrance-back-away'] {
		/* c1-allow: ThemeTransitions.cpp:3185 — 150ms out duration. */
		animation: nav-shift 150ms cubic-bezier(0.7, 0, 1, 0.5) both;
	}

	/* ThemeTransitions.cpp:1569-1574 and :1587-1592 — the source holds the incoming translation
	   at base 0 until 150ms, then jumps while opacity is 0; holding the offset from t=0 is unseen. */
	.layer[data-nav='slideright-forward-to'] {
		/* c1-allow: ThemeTransitions.cpp:1551-1552 — 150ms hold plus 300ms entrance. */
		animation: nav-shift-in 450ms both;
	}
	.layer[data-nav='slideleft-forward-to'] {
		/* c1-allow: ThemeTransitions.cpp:1551-1552 — 150ms hold plus 300ms entrance. */
		animation: nav-shift-in 450ms both;
	}
	.layer[data-nav='slideright-back-to'] {
		/* c1-allow: ThemeTransitions.cpp:1551-1552 — 150ms hold plus 300ms entrance. */
		animation: nav-shift-in 450ms both;
	}
	.layer[data-nav='slideleft-back-to'] {
		/* c1-allow: ThemeTransitions.cpp:1551-1552 — 150ms hold plus 300ms entrance. */
		animation: nav-shift-in 450ms both;
	}
	/* ThemeTransitions.cpp:1560-1565 and :1578-1583 — all slide aways keep discrete opacity 1
	   until removal, so their visible track is translation only. */
	.layer[data-nav='slideright-forward-away'] {
		/* c1-allow: ThemeTransitions.cpp:1551 — 150ms out duration. */
		animation: nav-shift 150ms cubic-bezier(0.7, 0, 1, 0.5) both;
	}
	.layer[data-nav='slideleft-forward-away'] {
		/* c1-allow: ThemeTransitions.cpp:1551 — 150ms out duration. */
		animation: nav-shift 150ms cubic-bezier(0.7, 0, 1, 0.5) both;
	}
	.layer[data-nav='slideright-back-away'] {
		/* c1-allow: ThemeTransitions.cpp:1551 — 150ms out duration. */
		animation: nav-shift 150ms cubic-bezier(0.7, 0, 1, 0.5) both;
	}
	.layer[data-nav='slideleft-back-away'] {
		/* c1-allow: ThemeTransitions.cpp:1551 — 150ms out duration. */
		animation: nav-shift 150ms cubic-bezier(0.7, 0, 1, 0.5) both;
	}

	.layer[data-nav='drillin-forward-to'] {
		/* c1-allow: ThemeTransitions.h:328-329 and ThemeTransitions.cpp:2882-2895 — 783ms scale and
		   333ms opacity under their respective splines. */
		animation:
			nav-scale 783ms cubic-bezier(0.1, 0.9, 0.2, 1) both,
			nav-fade 333ms cubic-bezier(0.17, 0.17, 0, 1) both;
	}
	.layer[data-nav='drillin-forward-away'] {
		/* c1-allow: ThemeTransitions.h:326-327 and ThemeTransitions.cpp:2924-2937 — 100ms exit. */
		animation:
			nav-scale 100ms cubic-bezier(0.1, 0.9, 0.2, 1) both,
			nav-fade 100ms cubic-bezier(0.17, 0.17, 0, 1) both;
	}
	.layer[data-nav='drillin-back-to'] {
		/* c1-allow: ThemeTransitions.h:332-333 and ThemeTransitions.cpp:2966-2979 — 333ms back entry. */
		animation:
			nav-scale 333ms cubic-bezier(0.12, 0, 0, 1) both,
			nav-fade 333ms cubic-bezier(0.17, 0.17, 0, 1) both;
	}
	.layer[data-nav='drillin-back-away'] {
		/* c1-allow: ThemeTransitions.h:330-331 and ThemeTransitions.cpp:3008-3021 — 100ms back exit. */
		animation:
			nav-scale 100ms cubic-bezier(0.1, 0.9, 0.2, 1) both,
			nav-fade 100ms cubic-bezier(0.17, 0.17, 0, 1) both;
	}

	/* Common has no IsStaggerElement in this Gallery page, so ThemeTransitions.cpp:616 and
	   :671-674 always choose the whole-page turnstile. NavigateTransitionHelper.h:118-133 and
	   ThemeTransitions.cpp:763-764, :862-863, :963-964, :1062-1063 set its centre to
	   -0.1, 0.5, -100. */
	.layer[data-nav^='common-'] {
		transform-origin: -10% 50% -100px;
	}
	.layer[data-nav='common-forward-to'] {
		/* c1-allow: ThemeTransitions.cpp:758-769 and NavigateTransitionHelper.h:125-127 — 556ms turnstile entry. */
		animation: nav-turn-in 556ms both;
	}
	.layer[data-nav='common-back-to'] {
		/* c1-allow: ThemeTransitions.cpp:958-969 and NavigateTransitionHelper.h:125-127 — 556ms turnstile entry. */
		animation: nav-turn-in 556ms both;
	}
	.layer[data-nav='common-forward-away'] {
		/* c1-allow: ThemeTransitions.cpp:858-868 — 128ms turnstile exit. */
		animation: nav-turn 128ms var(--nav-ease-exp6-in) both;
	}
	.layer[data-nav='common-back-away'] {
		/* c1-allow: ThemeTransitions.cpp:1058-1068 — 128ms turnstile exit. */
		animation: nav-turn 128ms var(--nav-ease-exp6-in) both;
	}

	/* Continuum has neither ExitElement nor an IsEntranceElement: ThemeTransitions.cpp:2204-2220
	   reads only the former, :2223-2265 finds the latter, and this Gallery page sets neither.
	   Only the background layer therefore animates. Continuum's initial scale starts at 0.9 because
	   its source ramps there while opacity is 0 (ThemeTransitions.cpp:1910, :1921-1931). */
	.layer[data-nav='continuum-forward-to'] {
		/* c1-allow: ThemeTransitions.cpp:1905, :1918, :1921-1931 — 267ms stagger plus 350ms entry. */
		animation: nav-zoom-in 617ms both;
	}
	.layer[data-nav='continuum-forward-away'] {
		/* c1-allow: ThemeTransitions.cpp:1998, :2012-2018 — 250ms forward exit. */
		animation: nav-fade-out-circle 250ms both;
	}
	.layer[data-nav='continuum-back-to'] {
		/* c1-allow: ThemeTransitions.cpp:2086, :2097-2099 — 267ms stagger plus 350ms back entry. */
		animation: nav-fade-in-circle 617ms both;
	}
	.layer[data-nav='continuum-back-away'] {
		/* c1-allow: ThemeTransitions.cpp:2153, :2160-2167 — 250ms backward exit. */
		animation:
			nav-shift 250ms var(--nav-ease-exp6-in) both,
			nav-fade-out-late 250ms linear both;
	}

	/* The same 600 the frame carries — PageTransitionPage.xaml:77 — because a Page fills the
	   Frame it was navigated into, and this ScrollViewer is each sample Page's root.
	   Upstream's ScrollViewer reserves layout width for an always-visible scrollbar
	   (ScrollViewer_themeresources.xaml:31, ScrollBarSize 12 plus a 1px margin either side)
	   where ours overlays it (ScrollView.svelte:387). Measured against 15-pagetrans.png that
	   is 14px of the 31px by which this page's star columns come out wide; the rest is
	   unattributed. It is the library ScrollViewer's to settle, not this page's. */
	:global(.sample-scrollviewer) {
		min-height: 600px;
	}

	.sample-one-grid {
		display: grid;
		grid-template-columns: auto 1fr 1fr;
		grid-template-rows: auto auto auto 1fr;
	}

	.tile {
		min-height: 150px;
		margin: 6px;
	}

	.dark-tile {
		/* c1-allow: SamplePage1.xaml:31 and :49 — the sample's named DarkGray tiles have no token. */
		background: DarkGray;
	}

	.light-tile {
		/* c1-allow: SamplePage1.xaml:37 and :43 — the sample's named LightGray tiles have no token. */
		background: LightGray;
	}

	.top-left {
		grid-area: 2 / 2;
	}

	.top-right {
		grid-area: 2 / 3;
	}

	.bottom-left {
		grid-area: 3 / 2;
	}

	.bottom-right {
		grid-area: 3 / 3;
	}

	.source-element {
		grid-area: 2 / 1 / 4 / 2;
		min-width: 250px;
		min-height: 150px;
		margin: 5px;
		background: var(--winui-SystemAccentColor);
	}

	.sample-one-copy {
		grid-area: 4 / 1 / 5 / 4;
		margin: 12px 6px;
	}

	.sample-two-grid {
		display: grid;
		grid-template-columns: auto 1fr;
		grid-template-rows: auto auto;
	}

	.destination-element {
		grid-area: 2 / 1;
		width: 150px;
		height: 200px;
		margin: 12px;
		align-self: start;
		background: var(--winui-SystemAccentColor);
	}

	.content-panel {
		grid-area: 2 / 2;
		min-height: 200px;
		margin: 12px;
	}

	.sample-two-heading {
		margin: 0 0 12px;
	}

	.sample-two-copy {
		margin: 0;
	}

	/* ADR 0016, applied to this page: the sample's Frame declares a `NavigationThemeTransition` in
	   its `ContentTransitions` (PageTransitionPage.xaml:79-83), which reaches the page through the
	   inherited collection (LayoutTransition.cpp:1513-1527, :1590-1596); those are layout
	   transitions, whose registration the switch gates (LayoutTransition.cpp:219-245). So under
	   `prefers-reduced-motion` every motion here lands at its end at once. Durations and delays go
	   to zero rather than the animations to `none`, because the page listens for `animationend`,
	   which a zero-length animation still fires. `!important`, because this is one rule for every
	   animated element on the page, over rules of every weight. */
	@media (prefers-reduced-motion: reduce) {
		*,
		*::before,
		*::after {
			animation-duration: 0s !important;
			animation-delay: 0s !important;
			transition-duration: 0s !important;
			transition-delay: 0s !important;
		}
	}
</style>
