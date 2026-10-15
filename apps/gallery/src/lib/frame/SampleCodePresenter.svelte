<script lang="ts" module>
	import type { HighlightSpan } from '$lib/highlight';

	export interface SampleCodePresenterProps {
		/** Code. The sample's source text. */
		code: string;
		/** SampleType, narrowed to what the two grammars and the plain type cover. */
		sampleType?: 'xaml' | 'csharp' | 'inline';
		/** Substitutions, as a map: `$(Key)` in the code is replaced by its value. */
		substitutions?: Record<string, string>;
		/** IsCopyButtonVisible. */
		copyButtonVisible?: boolean;
		/**
		 * Padding, as a CSS `padding` value. The template binds it to the ContentPresenter inside
		 * the ScrollViewer (SampleCodePresenter.xaml:28), so the code scrolls with it and the
		 * copy button, outside the ScrollViewer, does not take it.
		 */
		padding?: string;
		class?: string;
		style?: string;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	interface PairedSpan extends HighlightSpan {
		darkColor: string | null;
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { highlight } from '$lib/highlight';
	import CopyButton from './CopyButton.svelte';

	let {
		code,
		sampleType = 'xaml',
		substitutions,
		copyButtonVisible = true,
		padding,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: SampleCodePresenterProps = $props();

	let codeElement: HTMLElement;
	let hasSelection = $state(false);
	let isHorizontallyScrolling = $state(false);
	let lastScrollLeft = 0;
	let scrollTimer: ReturnType<typeof setTimeout> | undefined;

	const formattedCode = $derived(formatCode(code, substitutions));
	const spans = $derived.by(() =>
		sampleType === 'inline' ? [] : pairSpans(formattedCode, sampleType)
	);
	const showCopyButton = $derived(copyButtonVisible && !hasSelection && !isHorizontallyScrolling);

	function formatCode(source: string, values: Record<string, string> | undefined): string {
		const trimmed = source.replace(/^\n+/, '').trimEnd();
		const lineTrimmed = trimmed
			.split('\n')
			.map((line) => line.trimEnd())
			.join('\n');
		return lineTrimmed.replace(/\$\(([^)]+)\)/g, (match, key: string) => {
			if (values === undefined || !(key in values))
				throw new Error(`SampleCodePresenter substitution has no value for ${key}`);
			return values[key];
		});
	}

	function pairSpans(source: string, language: 'xaml' | 'csharp'): PairedSpan[] {
		const light = highlight(source, language, 'light');
		const dark = highlight(source, language, 'dark');
		if (light.length !== dark.length)
			throw new Error('SampleCodePresenter light and dark highlight spans have different lengths');
		return light.map((span, index) => {
			const darkSpan = dark[index];
			if (span.text !== darkSpan.text)
				throw new Error(`SampleCodePresenter highlight spans differ at index ${index}`);
			return { ...span, darkColor: darkSpan.color };
		});
	}

	function selectionChanged(): void {
		const selection = document.getSelection();
		hasSelection =
			selection !== null &&
			!selection.isCollapsed &&
			selection.anchorNode !== null &&
			selection.focusNode !== null &&
			codeElement.contains(selection.anchorNode) &&
			codeElement.contains(selection.focusNode);
	}

	function scrolled({ currentTarget: target }: Event & { currentTarget: HTMLDivElement }): void {
		if (target.scrollLeft === lastScrollLeft) return;
		lastScrollLeft = target.scrollLeft;
		isHorizontallyScrolling = true;
		if (scrollTimer !== undefined) clearTimeout(scrollTimer);
		scrollTimer = setTimeout(() => {
			isHorizontallyScrolling = false;
		}, 500);
	}

	onMount(() => {
		document.addEventListener('selectionchange', selectionChanged);
		return () => {
			document.removeEventListener('selectionchange', selectionChanged);
			if (scrollTimer !== undefined) clearTimeout(scrollTimer);
		};
	});
</script>

<div bind:this={ref} class={['root', className]} {style} {...rest}>
	<div
		bind:this={codeElement}
		class:scrollable={sampleType !== 'inline'}
		class="code-area"
		style:padding
		onscroll={scrolled}
	>
		{#if sampleType === 'inline'}
			<span class="inline-code">{formattedCode}</span>
		{:else}
			<pre>{#each spans as span, index (index)}<span
						class:scoped={span.color !== null}
						class:code-bold={span.bold}
						class:code-italic={span.italic}
						style:--code-light={span.color ?? undefined}
						style:--code-dark={span.darkColor ?? undefined}>{span.text}</span
					>{/each}</pre>
		{/if}
	</div>
	{#if copyButtonVisible}
		<div class="copy-wrapper" class:concealed={!showCopyButton}>
			<CopyButton text={formattedCode} />
		</div>
	{/if}
</div>

<style>
	.root {
		display: grid;
		color: var(--winui-TextFillColorPrimaryBrush);
	}

	.code-area {
		grid-area: 1 / 1;
		min-width: 0;
	}

	.code-area.scrollable {
		overflow: auto;
	}

	pre,
	.inline-code {
		/* c1-allow: SampleCodePresenter.xaml.cs:251, the RichTextBlock and inline TextBlock use this font stack */
		font-family: Consolas, 'Cascadia Code', monospace;
	}

	pre {
		min-height: 30px;
		margin: 0;
		white-space: pre;
	}

	.inline-code {
		display: block;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.copy-wrapper {
		grid-area: 1 / 1;
		justify-self: end;
		align-self: start;
		margin-right: 8px;
		background: var(--winui-ControlOnImageFillColorDefaultBrush);
		border-radius: var(--winui-ControlCornerRadius);
	}

	.copy-wrapper.concealed {
		visibility: hidden;
	}

	/* A coloured run is a ColorCode scope. Uncoloured text inherits the pane foreground. */
	.scoped {
		color: var(--code-light);
	}

	/* High contrast follows ColorCode's dark palette; see ADR 0014. */
	:root[data-theme='dark'] .scoped,
	:root[data-theme='high-contrast'] .scoped {
		color: var(--code-dark);
	}

	@media (prefers-color-scheme: dark) {
		:root:not([data-theme='light']):not([data-theme='high-contrast']) .scoped {
			color: var(--code-dark);
		}
	}

	.code-bold {
		/* c1-allow: WinUIGallery/Helpers/ColorCode.internal/RichTextBlockFormatter.cs:148 sets FontWeights.Bold */
		font-weight: bold;
	}

	.code-italic {
		font-style: italic;
	}
</style>
