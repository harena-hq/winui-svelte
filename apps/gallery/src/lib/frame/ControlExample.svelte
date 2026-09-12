<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ControlExampleProps {
		/** HeaderText. Absent renders no header row at all — `ControlExample_Loaded` collapses it. */
		headerText?: string;
		/** Example, the content property. The sample itself. */
		children?: Snippet;
		/** Output. Rendered in its own panel; absent means no panel. */
		output?: Snippet;
		/** Options. Rendered in the pane on the right; absent means no pane. */
		options?: Snippet;
		/** Xaml. The XAML source, already resolved to text. */
		xaml?: string;
		/** CSharp. The C# source, already resolved to text. */
		csharp?: string;
		/** Substitutions, passed through to each SampleCodePresenter. */
		substitutions?: Record<string, string>;
		/** SourceCodeVisibility, as a boolean. */
		sourceCodeVisible?: boolean;
		/** HorizontalContentAlignment on the example presenter. Upstream's default is Left. */
		horizontalContentAlignment?: 'left' | 'center' | 'right' | 'stretch';
		/** FrameworkElement.Height on the control, in pixels. Absent means auto. */
		height?: number;
		class?: string;
		style?: string;
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// `XamlSource` and `CSharpSource` are app-package `.txt` paths; the Gallery record resolves
	// paths to text in this reproduction. `SampleDefinition` is the same one level up: it names a
	// `.txt` whose `--- ` sections carry the header and languages. `ExampleHeight`,
	// `WebViewHeight`, and `WebViewWidth` host a WebView, which this reproduction has none of.
	// `ErrorTextBlock` is absent because its Windows-version warning has no web equivalent.
</script>

<script lang="ts">
	import { Expander, SelectorBar, type SelectorBarItemData } from 'winui-svelte';
	import SampleCodePresenter from './SampleCodePresenter.svelte';

	let {
		headerText,
		children,
		output,
		options,
		xaml,
		csharp,
		substitutions,
		sourceCodeVisible = true,
		horizontalContentAlignment = 'left',
		height,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ControlExampleProps = $props();

	let rootStyle = $derived(
		height === undefined ? style : `${style ? `${style}; ` : ''}height: ${height}px`
	);

	const sourceItems = $derived.by<SelectorBarItemData[]>(() => {
		const items: SelectorBarItemData[] = [];
		if (xaml) items.push({ id: 'xaml', text: 'XAML' });
		if (csharp) items.push({ id: 'csharp', text: 'C#' });
		return items;
	});
	let selectedLanguage = $state<string | null>(null);
	const showSourceCode = $derived(sourceCodeVisible && sourceItems.length > 0);

	$effect(() => {
		if (!sourceItems.some((item) => item.id === selectedLanguage))
			selectedLanguage = sourceItems[0]?.id ?? null;
	});
</script>

<div
	bind:this={ref}
	class={['root', className]}
	class:sized={height !== undefined}
	style={rootStyle}
	{...rest}
>
	{#if headerText}
		<h3 class="winui-BodyStrongTextBlockStyle">{headerText}</h3>
	{/if}

	<div class="card">
		<div class="example-container gallery-tile-grid">
			<div class="example" data-horizontal-content-alignment={horizontalContentAlignment}>
				{@render children?.()}
			</div>
			{#if output}
				<div class="output">
					<span>Output:</span>
					{@render output()}
				</div>
			{/if}
			{#if options}
				<div class="options">{@render options()}</div>
			{/if}
		</div>

		<!-- Both hidden SelectorBar items leave an empty upstream Expander, so omit it instead. -->
		{#if showSourceCode}
			<!-- The wrapper is what this component can style. A `class` handed to a component
			     lands on its root without this file's scope hash, so a rule written for it here
			     would match nothing; the Expander's own look is set through the two prop
			     channels it publishes — `style` on its root, and the tokens it reads, declared
			     on this wrapper and inherited. -->
			<div class="source">
				<Expander horizontalContentAlignment="stretch" style="width: 100%; min-width: 0">
					{#snippet header()}Source code{/snippet}
					<div class="source-grid">
						<div class="selector-row">
							<SelectorBar
								items={sourceItems}
								selected={selectedLanguage}
								onSelectionChanged={(id) => (selectedLanguage = id)}
							/>
						</div>
						<div class="presenter-row">
							{#if selectedLanguage === 'xaml' && xaml}
								<SampleCodePresenter code={xaml} {substitutions} />
							{:else if selectedLanguage === 'csharp' && csharp}
								<SampleCodePresenter code={csharp} sampleType="csharp" {substitutions} />
							{/if}
						</div>
					</div>
				</Expander>
			</div>
		{/if}
	</div>
</div>

<style>
	/* `Margin="0,16,0,0"` on the control (ControlExample.xaml:10) and `Margin="0,12"` on its
	   header (`:71`) add up in XAML. In CSS the header's top margin would collapse through
	   this root's and the 12 would vanish — measured on the Border page, the header sat 12px
	   too high — so the root is a formatting-context root and the two margins stack. Sized roots
	   use grid instead; grid items' margins do not collapse either, so that guarantee remains. */
	.root {
		display: flow-root;
		margin: 16px 0 0;
	}

	h3 {
		margin: 12px 0;
	}

	.card {
		display: grid;
	}
	.root.sized {
		display: grid;
		grid-template-rows: auto minmax(0, 1fr);
	}
	.root.sized .card {
		min-height: 0;
		grid-template-rows: minmax(0, 1fr) auto;
	}
	.root.sized .example-container {
		min-height: 0;
	}

	.example-container {
		/* `Width="Auto" MaxWidth="320"` on both trailing columns — ControlExample.xaml:105-106.
		   `fit-content()` is CSS's name for exactly that: as wide as the content, capped. */
		grid-template-columns: minmax(0, 1fr) fit-content(320px) fit-content(320px);
		grid-template-rows: minmax(0, 1fr) auto;
		/* ControlExample.xaml:65 sets `CornerRadius="8,8,0,0"`. */
		border-radius: var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius) 0 0;
	}

	/* One column, not one row. A `ContentPresenter` upstream holds a single element; a snippet
	   here can emit several roots, and side by side they ran the type ramp's nine rows off the
	   right edge of the pane. A flex column stacks them, and `align-items` is
	   HorizontalContentAlignment, `stretch` included.
	   Measured on the original's Button page: the sample keeps its own height and sits in the
	   middle of a pane whose height the tallest column decides — a 32px button centred in a
	   94px pane, and a 48px one centred in a 99px pane. The template says only
	   `VerticalAlignment="Stretch"` on the presenter (ControlExample.xaml:117), which is the
	   pane rather than its content; a XAML child with a fixed height and the default
	   `Stretch` lands in the middle, and `justify-content: center` is where that lands here.
	   A child that says otherwise — `VerticalAlignment="Top"` on the Border page's sample,
	   BorderPage.xaml:24 — says it through `data-vertical-alignment` on itself. In XAML the
	   alignment is the child's property and in CSS it is the container's; an auto margin is
	   the one thing a flex item can set that the algorithm resolves before `justify-content`,
	   so the attribute below maps onto one. It is read on direct children only, and a child
	   after a `top` one is pushed to the bottom by the same margin. */
	.example {
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 12px;
		background: var(--winui-SolidBackgroundFillColorBaseBrush);
		border-color: var(--winui-CardStrokeColorDefaultBrush);
		border-style: solid;
		border-width: 0;
		/* ControlExample.xaml:87 sets `CornerRadius="8,8,0,0"`. */
		border-radius: var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius) 0 0;
	}

	.example[data-horizontal-content-alignment='left'] {
		align-items: flex-start;
	}
	.example[data-horizontal-content-alignment='center'] {
		align-items: center;
	}
	.example[data-horizontal-content-alignment='right'] {
		align-items: flex-end;
	}
	.example[data-horizontal-content-alignment='stretch'] {
		align-items: stretch;
	}

	/* The sample's own `VerticalAlignment`, stated on the sample. The selector crosses the
	   snippet boundary on purpose: the child is the page's element, and `:global` closes the
	   sequence rather than sitting inside it. */
	.example > :global([data-vertical-alignment='top']) {
		margin-bottom: auto;
	}
	.example > :global([data-vertical-alignment='bottom']) {
		margin-top: auto;
	}
	.example > :global([data-vertical-alignment='stretch']) {
		flex: 1 1 auto;
	}

	/* High contrast already maps SolidBackgroundFillColorBaseBrush to SystemColorWindowColor. */
	:root[data-theme='high-contrast'] .example {
		/* c1-allow: ControlExample.xaml:45-46 sets ControlExampleDisplayBorderThickness to 1 in HighContrast. */
		border-width: 1px;
	}

	.output {
		display: flex;
		flex-direction: column;
		align-self: stretch;
		justify-self: end;
		margin: 12px 12px 12px 0;
		padding: 16px;
		background: var(--winui-SolidBackgroundFillColorBaseBrush);
		border-radius: var(--winui-OverlayCornerRadius);
	}

	.options {
		align-self: stretch;
		padding: 16px;
		background: var(--winui-CardBackgroundFillColorDefaultBrush);
		border-color: var(--winui-DividerStrokeColorDefaultBrush);
		border-style: solid;
		/* c1-allow: ControlExample.xaml:128 sets `BorderThickness="1,0,0,0"`. */
		border-width: 0 0 0 1px;
		border-radius: 0 var(--winui-OverlayCornerRadius) 0 0;
	}

	/* `Background="{ThemeResource CardBackgroundFillColorSecondaryBrush}"` and `Padding="0"` on
	   the Expander (ControlExample.xaml:157-160), expressed as the two tokens its header and
	   content read. Aliasing one token to another is what C1 allows; the padding is a literal
	   and cites the setter it comes from.
	   `CornerRadius="0,0,8,8"` cannot be one value on the Expander — its own `--corner` drives
	   the header's top corners and the content's bottom ones together — so the corner is
	   squared there and rounded here, and `overflow: hidden` is what makes the clip. */
	.source {
		--winui-ExpanderHeaderBackground: var(--winui-CardBackgroundFillColorSecondaryBrush);
		--winui-ExpanderContentBackground: var(--winui-CardBackgroundFillColorSecondaryBrush);
		/* c1-allow: ControlExample.xaml:159, the Expander carries Padding="0" */
		--winui-ExpanderContentPadding: 0;
	}

	/* The Expander declares `--corner` on its own root, so an inherited value never reaches it;
	   this rule outranks that declaration, which is the only way in from outside. */
	.source :global(.root) {
		/* c1-allow: ControlExample.xaml:158, the Expander carries CornerRadius="0,0,8,8" and the
		   bottom half of it is the wrapper's own radius below */
		--corner: 0;
		border-radius: 0 0 var(--winui-OverlayCornerRadius) var(--winui-OverlayCornerRadius);
		overflow: hidden;
	}

	.source-grid {
		display: grid;
		gap: 16px;
	}

	.selector-row {
		margin-left: 4px;
	}

	.presenter-row {
		padding: 0 16px 16px;
	}

	@media (width < 740px) {
		.options {
			grid-row: 2;
			grid-column: 1 / span 2;
			margin-top: 24px;
			/* c1-allow: ControlExample.xaml:195 sets `BorderThickness="0,1,0,0"` in PhoneLayout. */
			border-width: 1px 0 0;
			border-radius: 0;
		}
	}
</style>
