<script lang="ts">
	import { ListView, RefreshContainer } from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/collections/pulltorefresh');
	if (item === null) throw new Error('PullToRefresh page has no Gallery item');
	const basicSample = sampleOf('PullToRefresh/BasicPulltorefresh.txt');
	const customIconSample = sampleOf('PullToRefresh/CustomIconPulltorefresh.txt');

	// PullToRefreshPage.xaml.cs:107 — the nine names `items1` is seeded with, split from one
	// space-separated string. The XAML declares no items at all; the code-behind is the list.
	let items1 = $state([
		'AcrylicBrush',
		'ColorPicker',
		'NavigationView',
		'ParallaxView',
		'PersonPicture',
		'PullToRefreshPage',
		'RatingsControl',
		'RevealBrush',
		'TreeView'
	]);
	// `:111` — the eight given names `items2` is seeded with.
	let items2 = $state(['Mike', 'Ben', 'Barbra', 'Claire', 'Justin', 'Shawn', 'Drew', 'Lili']);

	let items1AddedCount = 0;
	let items2AddedCount = 0;

	/**
	 * `Timer1_TickImpl` (`:167-177`) inserts one row at the head and then completes the deferral,
	 * on a `DispatcherTimer` of 500ms (`:101`). The container awaits whatever the handler returns,
	 * so a promise that settles after the same delay is the deferral in this library's shape.
	 */
	function refresh1(): Promise<void> {
		return new Promise((resolve) =>
			setTimeout(() => {
				items1 = [`NewControl ${items1AddedCount++}`, ...items1];
				resolve();
			}, 500)
		);
	}

	/** `Timer2_TickImpl` (`:179-189`) on a timer of 800ms (`:104`). */
	function refresh2(): Promise<void> {
		return new Promise((resolve) =>
			setTimeout(() => {
				items2 = [`New Friend ${items2AddedCount++}`, ...items2];
				resolve();
			}, 800)
		);
	}
</script>

<ItemPage {item}>
	<!-- PullToRefreshPage.xaml:10-28 — a `RefreshContainer` centred on both axes inside a `Grid`,
	     around a `ListView` `Height="200" MinWidth="200"` with a one-pixel
	     `{ThemeResource TextControlBorderBrush}` border.

	     **At rest this draws two bordered lists and nothing else**, on this page and on the
	     original's. The visualizer sits its own length outside the container and the container
	     clips; the original reveals it on a touch pull, and so does this — which the reference
	     machine, having no digitiser, performs on neither. See the note on `RefreshContainer`
	     itself. -->
	<ControlExample
		headerText={basicSample.header ?? undefined}
		xaml={basicSample.xaml ?? undefined}
		csharp={basicSample.csharp ?? undefined}
	>
		<div class="example">
			<RefreshContainer class="container" onRefreshRequested={refresh1}>
				<div class="bordered">
					<ListView class="list" items={items1} key={(name) => name} itemTemplate={nameTemplate} />
				</div>
			</RefreshContainer>
		</div>
	</ControlExample>

	<!-- PullToRefreshPage.xaml:30-40 declares only a `Grid` with two rows; everything in the second
	     example is built in `PullToRefreshPage.xaml.cs:49-99`. A `RefreshContainer` whose
	     `Visualizer` is a `RefreshVisualizer` with an `Image` of 35 by 35 as its `Content`
	     (`:59-83`), around a `ListView` 200 by 200, centred, one-pixel `TextControlBorderBrush`
	     (`:85-95`).

	     This library has no `Visualizer` property to assign — the container renders its own — so
	     the custom indicator arrives as the container's `content` snippet, which is the
	     visualizer's `Content` reached by the one route this library has. -->
	<ControlExample
		headerText={customIconSample.header ?? undefined}
		xaml={customIconSample.xaml ?? undefined}
		csharp={customIconSample.csharp ?? undefined}
	>
		<div class="example">
			<RefreshContainer class="container fixed" onRefreshRequested={refresh2} content={sunIcon}>
				<div class="bordered">
					<ListView class="list" items={items2} key={(name) => name} itemTemplate={nameTemplate} />
				</div>
			</RefreshContainer>
		</div>
	</ControlExample>
</ItemPage>

{#snippet nameTemplate(name: string)}
	<span>{name}</span>
{/snippet}

<!-- `:59-80` — one `Image` 35 by 35, whose source is `SunBlack.png` under the light theme or a
     high-contrast black scheme and `SunWhite.png` otherwise. Upstream chooses once, in the page's
     constructor, so its icon does not follow a later theme switch; both are rendered here and the
     cascade picks, which follows one. -->
{#snippet sunIcon()}
	<img class="sun sun-black" src="/SunBlack.png" alt="" />
	<img class="sun sun-white" src="/SunWhite.png" alt="" />
{/snippet}

<style>
	/* `HorizontalAlignment="Center" VerticalAlignment="Center"` on the container (example 1,
	   PullToRefreshPage.xaml:15-16) and on the `ListView` (example 2,
	   PullToRefreshPage.xaml.cs:90). Neither moves anything: the `Grid` each sits in is stretched,
	   so `ControlExample`'s own `HorizontalContentAlignment` — Left — decides, the Grid is
	   shrink-to-fit under it, and centring inside a box the width of its content is a no-op. Both
	   examples sit at the left of the panel, here and on the original; the rule is written because
	   the XAML has it and because the reason it does nothing is not visible from the XAML. */
	.example {
		display: flex;
		justify-content: center;
		align-items: center;
	}

	/* The container is exactly the list it holds; it draws nothing of its own at rest.
	   `MinWidth="200"` on example 1's ListView (PullToRefreshPage.xaml:21) and `Height="200"`
	   on both (`:20`, PullToRefreshPage.xaml.cs:88). */
	:global(.container) {
		min-width: 200px;
		height: 200px;
	}

	/* Example 2 sets `Width = 200` rather than a minimum (`PullToRefreshPage.xaml.cs:87`). Both
	   resolve to the same 200 — the widest of either list's rows is well under it — and the two
	   are still written as the two things they are. */
	:global(.container.fixed) {
		width: 200px;
	}

	/* `BorderBrush="{ThemeResource TextControlBorderBrush}" BorderThickness="1"` on the ListView
	   (PullToRefreshPage.xaml:22-23, PullToRefreshPage.xaml.cs:89-91). It is drawn here rather
	   than by the control because `ListView`'s own style sets neither, so a ListView with nothing
	   set draws nothing and the border on this page is this page's.

	   The brush is an alias onto `TextControlElevationBorderBrush`, which is a **gradient**, and a
	   gradient named as a `border-color` is invalid CSS and dropped in silence — the same trap
	   the comment in TextBox.svelte's `.box` records. So the ring is a masked pseudo-element
	   carrying the gradient as a background, and the border itself is transparent and there only
	   for the pixel of layout `BorderThickness` takes. */
	.bordered {
		position: relative;
		box-sizing: border-box;
		height: 100%;
		/* c1-allow: PullToRefreshPage.xaml:23 and PullToRefreshPage.xaml.cs:89, BorderThickness 1. */
		border: 1px solid transparent;
	}

	.bordered::after {
		content: '';
		position: absolute;
		/* An absolutely positioned child is placed against its parent's padding box; backing it
		   out by the border width makes the ring's box the parent's border box. */
		/* c1-allow: the negative of the same BorderThickness of 1 the rule above carries. */
		inset: -1px;
		/* c1-allow: the ring is exactly that one pixel wide. */
		padding: 1px;
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		pointer-events: none;
		background: var(--winui-TextControlBorderBrush);
	}

	:global(.list) {
		height: 100%;
	}

	/* `ptrImage.Width = 35; ptrImage.Height = 35;` (`PullToRefreshPage.xaml.cs:79-80`). */
	.sun {
		width: 35px;
		height: 35px;
	}

	/* The three arms of `:62-76`, on the cascade the token layer itself uses: light is the bare
	   default, dark is `prefers-color-scheme` unless a choice overrides it, and high contrast is
	   the black scheme the second arm names. */
	.sun-white {
		display: none;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme])) .sun-black {
			display: none;
		}
		:global(:root:not([data-theme])) .sun-white {
			display: block;
		}
	}
	:global(:root[data-theme='dark']) .sun-black {
		display: none;
	}
	:global(:root[data-theme='dark']) .sun-white {
		display: block;
	}
</style>
