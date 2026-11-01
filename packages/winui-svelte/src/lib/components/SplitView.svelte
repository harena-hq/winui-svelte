<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface SplitViewProps {
		/** IsPaneOpen. Whether the pane is open; the compact modes show a strip when it is not. */
		paneOpen?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback. Upstream raises PaneOpening/PaneOpened/PaneClosing/PaneClosed. */
		onPaneOpenChange?: (open: boolean) => void;
		/** DisplayMode. The default is Overlay. */
		displayMode?: 'overlay' | 'inline' | 'compactOverlay' | 'compactInline';
		/** PanePlacement. */
		panePlacement?: 'left' | 'right';
		/** OpenPaneLength, in pixels; SplitViewOpenPaneThemeLength (320) when not given. */
		openPaneLength?: number;
		/** CompactPaneLength, in pixels; SplitViewCompactPaneThemeLength (48) when not given. */
		compactPaneLength?: number;
		/** PaneBackground. A CSS colour; SystemControlPageBackgroundChromeLowBrush when not given. */
		paneBackground?: string;
		/** Pane. */
		pane?: Snippet;
		/** Content — the default snippet. */
		children?: Snippet;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// LightDismissOverlayMode, PaneClosing with its Cancel, TemplateSettings, and
	// SplitViewPaneAnimationOpenPreDuration are absent: desktop Auto is transparent, cancellation
	// has no callback equivalent, derived lengths are CSS calc(), and columns replace its content slide.
</script>

<script lang="ts">
	let {
		paneOpen = $bindable(false),
		onPaneOpenChange,
		displayMode = 'overlay',
		panePlacement = 'left',
		openPaneLength,
		compactPaneLength,
		paneBackground,
		pane,
		children,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: SplitViewProps = $props();

	function dismiss() {
		paneOpen = false;
		onPaneOpenChange?.(false);
	}
</script>

<div
	bind:this={ref}
	class={['root', className]}
	{style}
	data-display-mode={displayMode}
	data-pane-placement={panePlacement}
	data-pane-open={paneOpen || undefined}
	style:--open-pane-length={openPaneLength === undefined ? undefined : `${openPaneLength}px`}
	style:--compact-pane-length={compactPaneLength === undefined
		? undefined
		: `${compactPaneLength}px`}
	style:--pane-background={paneBackground}
	{...rest}
>
	<div class="pane">{@render pane?.()}</div>
	<div class="content">
		{@render children?.()}
		{#if paneOpen && (displayMode === 'overlay' || displayMode === 'compactOverlay')}
			<div class="light-dismiss" onclick={dismiss} aria-hidden="true"></div>
		{/if}
	</div>
</div>

<style>
	/* :695-698. The root derives --open and --compact once from caller overrides and template tokens. */
	.root {
		--open: var(--open-pane-length, var(--winui-SplitViewOpenPaneThemeLength));
		--compact: var(--compact-pane-length, var(--winui-SplitViewCompactPaneThemeLength));
		/* c1-allow: SplitView_themeresources.xaml:542-688 — visual states assign a 0px compact-column fallback. */
		--pane-column: 0px;
		position: relative;
		display: grid;
		grid-template-columns: var(--pane-column) minmax(0, 1fr);
		grid-template-rows: minmax(0, 1fr);
		transition: grid-template-columns var(--winui-SplitViewPaneAnimationCloseDuration)
			cubic-bezier(0, 0.35, 0.15, 1); /* c1-allow: SplitView_themeresources.xaml:312 — inline spline. */
	}

	/* :695-698. Right mirrors the two columns. */
	.root[data-pane-placement='right'] {
		grid-template-columns: minmax(0, 1fr) var(--pane-column);
	}

	/* :700-715. PaneRoot spans the grid, is above ContentRoot, and carries the template border. */
	.pane {
		position: relative;
		grid-column: 1 / -1;
		grid-row: 1;
		justify-self: start;
		z-index: 1;
		box-sizing: border-box;
		width: var(--open);
		background: var(--pane-background, var(--winui-SystemControlPageBackgroundChromeLowBrush));
		border-style: solid;
		border-color: var(--winui-SystemControlForegroundTransparentBrush);
		border-width: var(--winui-SplitViewLeftBorderThemeThickness);
		border-radius: var(--winui-SplitViewPaneRootCornerRadius);
		visibility: hidden;
		translate: calc(-1 * var(--open)) 0;
		clip-path: inset(0 0 0 var(--open));
		/* c1-allow: SplitView_themeresources.xaml:186 — overlay close duration and spline. */
		transition:
			translate 120ms cubic-bezier(0.1, 0.9, 0.2, 1),
			clip-path 120ms cubic-bezier(0.1, 0.9, 0.2, 1),
			visibility 120ms;
	}

	/* :700. PaneRoot aligns to the placement side. */
	.root[data-pane-placement='right'] .pane {
		justify-self: end;
		translate: var(--open) 0;
		clip-path: inset(0 var(--open) 0 0);
	}

	/* :715. HCPaneBorder is at the inner edge only while an open shape is active. */
	.pane::after {
		content: '';
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		/* c1-allow: SplitView_themeresources.xaml:715 — HCPaneBorder Width="1". */
		width: 1px;
		background: var(--winui-SystemControlForegroundTransparentBrush);
		visibility: hidden;
	}
	.root[data-pane-placement='right'] .pane::after {
		right: auto;
		left: 0;
	}
	.root[data-pane-open] .pane::after {
		visibility: visible;
	}

	/* :718. ContentRoot spans both columns unless a state assigns its remaining column. */
	.content {
		position: relative;
		grid-column: 1 / -1;
		grid-row: 1;
		min-width: 0;
	}

	/* :564-683. Every open state reveals the pane; target-open overlay transitions replace the base close transition. */
	.root[data-pane-open] .pane {
		visibility: visible;
		translate: 0 0;
		clip-path: inset(0);
	}
	.root[data-pane-open][data-display-mode='overlay'] .pane,
	.root[data-pane-open][data-display-mode='compactOverlay'] .pane {
		/* c1-allow: SplitView_themeresources.xaml:64 — overlay open duration and spline. */
		transition-duration: 350ms, 350ms, 350ms;
	}
	.root[data-pane-open][data-display-mode='inline'] .pane,
	.root[data-pane-open][data-display-mode='compactInline'] .pane {
		transition:
			translate var(--winui-SplitViewPaneAnimationOpenDuration) cubic-bezier(0, 0.35, 0.15, 1),
			clip-path var(--winui-SplitViewPaneAnimationOpenDuration) cubic-bezier(0, 0.35, 0.15, 1),
			visibility var(--winui-SplitViewPaneAnimationOpenDuration); /* c1-allow: SplitView_themeresources.xaml:312 — inline open spline. */
	}
	.root:not([data-pane-open])[data-display-mode='inline'] .pane,
	.root:not([data-pane-open])[data-display-mode='compactInline'] .pane {
		transition:
			translate var(--winui-SplitViewPaneAnimationCloseDuration) cubic-bezier(0, 0.35, 0.15, 1),
			clip-path var(--winui-SplitViewPaneAnimationCloseDuration) cubic-bezier(0, 0.35, 0.15, 1),
			visibility var(--winui-SplitViewPaneAnimationCloseDuration); /* c1-allow: SplitView_themeresources.xaml:312 — inline close spline. */
	}

	/* :595 and :607. Inline open states give the pane its full column. */
	.root[data-pane-open][data-display-mode='inline'],
	.root[data-pane-open][data-display-mode='compactInline'] {
		--pane-column: var(--open);
		transition-duration: var(--winui-SplitViewPaneAnimationOpenDuration);
	}
	.root:not([data-pane-open])[data-display-mode='inline'],
	.root:not([data-pane-open])[data-display-mode='compactInline'] {
		transition-duration: var(--winui-SplitViewPaneAnimationCloseDuration);
	}

	/* :543, :552, :635 and :655. Compact shapes reserve their strip; closed shapes reveal only it. */
	.root:not([data-pane-open])[data-display-mode='compactInline'],
	.root:not([data-pane-open])[data-display-mode='compactOverlay'],
	.root[data-pane-open][data-display-mode='compactOverlay'] {
		--pane-column: var(--compact);
	}
	.root:not([data-pane-open])[data-display-mode='compactInline'] .pane,
	.root:not([data-pane-open])[data-display-mode='compactOverlay'] .pane {
		visibility: visible;
		translate: 0 0;
		clip-path: inset(0 calc(var(--open) - var(--compact)) 0 0);
	}
	.root:not([data-pane-open])[data-display-mode='compactInline'][data-pane-placement='right'] .pane,
	.root:not([data-pane-open])[data-display-mode='compactOverlay'][data-pane-placement='right']
		.pane {
		clip-path: inset(0 0 0 calc(var(--open) - var(--compact)));
	}

	/* :595, :607, :543, :552, :635 and :655. These shapes make ContentRoot take the other column. */
	.root[data-pane-open][data-display-mode='inline'] .content,
	.root[data-pane-open][data-display-mode='compactInline'] .content,
	.root[data-display-mode='compactInline'] .content,
	.root[data-display-mode='compactOverlay'] .content {
		grid-column: 2;
	}
	.root[data-pane-placement='right'][data-pane-open][data-display-mode='inline'] .content,
	.root[data-pane-placement='right'][data-pane-open][data-display-mode='compactInline'] .content,
	.root[data-pane-placement='right'][data-display-mode='compactInline'] .content,
	.root[data-pane-placement='right'][data-display-mode='compactOverlay'] .content {
		grid-column: 1;
	}

	/* :723. Desktop Auto light dismiss leaves this transparent. */
	.light-dismiss {
		position: absolute;
		inset: 0;
	}

	/* ADR 0016. Every opening and closing of the pane is a `DisplayModeStates`
	   `VisualTransition` (SplitView_themeresources.xaml:54-541), which the visual state manager
	   skips to its end when the system's animations are off. Each rule above that sets a
	   duration is named again here, because they differ in specificity and the last one of
	   equal weight is the one that holds. */
	@media (prefers-reduced-motion: reduce) {
		.root,
		.root[data-pane-open][data-display-mode='inline'],
		.root[data-pane-open][data-display-mode='compactInline'],
		.root:not([data-pane-open])[data-display-mode='inline'],
		.root:not([data-pane-open])[data-display-mode='compactInline'],
		.pane,
		.root[data-pane-open][data-display-mode='overlay'] .pane,
		.root[data-pane-open][data-display-mode='compactOverlay'] .pane,
		.root[data-pane-open][data-display-mode='inline'] .pane,
		.root[data-pane-open][data-display-mode='compactInline'] .pane,
		.root:not([data-pane-open])[data-display-mode='inline'] .pane,
		.root:not([data-pane-open])[data-display-mode='compactInline'] .pane {
			transition-duration: 0s;
		}
	}

	/* A contrast theme: the tokens are the high-contrast theme, so the browser's forcing is off
	   for what this draws. ADR 0005. */
	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
		/* Holds the consumer's own layout, which the browser still forces. */
		.pane {
			forced-color-adjust: auto;
		}
		/* Holds the consumer's own layout, which the browser still forces. */
		.content {
			forced-color-adjust: auto;
		}
	}
</style>
