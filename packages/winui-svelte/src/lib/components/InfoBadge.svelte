<script lang="ts" module>
	export interface InfoBadgeProps {
		/**
		 * No WinUI member: upstream selects the look with `Style="{StaticResource …}"`, and a
		 * Svelte consumer has no `Style`. `'default' | 'attention' | 'informational' |
		 * 'success' | 'caution' | 'critical'` name the six styles
		 * `InfoBadge_themeresources.xaml` defines at :6, :92, :104, :116, :127 and :138.
		 */
		variant?: 'default' | 'attention' | 'informational' | 'success' | 'caution' | 'critical';
		/**
		 * Value. `-1` is the upstream default; every value below 0 puts the badge in its dot
		 * state.
		 */
		value?: number;
		/**
		 * IconSource, narrowed to an uppercase Segoe Fluent Icons code point such as `'EA38'`,
		 * as TitleBar and NavigationView do. The severity styles declare Attention `EA38` and
		 * Informational `F13F`; Success `E8FB` (Accept) and Critical `E711` (Cancel) are
		 * corroborated in `generic.xaml:11016` and :11017; Caution `E171` (Important) comes
		 * from the Windows Symbol enumeration and neither pin confirms it.
		 */
		glyph?: string;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLSpanElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	let {
		variant = 'default',
		value = -1,
		glyph = undefined,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: InfoBadgeProps = $props();

	// `InfoBadge.cpp:48` rejects Value below -1. This component treats every value below 0
	// as Dot: throwing during render would take down the page for a visually identical state.
	const display = $derived<'dot' | 'value' | 'icon'>(value >= 0 ? 'value' : glyph ? 'icon' : 'dot');
	const icon = $derived(glyph ? String.fromCodePoint(parseInt(glyph, 16)) : '');
</script>

<span
	bind:this={ref}
	class={['root', className]}
	{style}
	data-variant={variant}
	data-display={display}
	{...rest}
>
	{#if display === 'value'}
		<span class="value">{value}</span>
	{:else if display === 'icon'}
		<span class="icon" aria-hidden="true">{icon}</span>
	{/if}
</span>

<style>
	.root {
		box-sizing: border-box;
		display: inline-flex;
		/* `safe`, because the content is taller than the badge and the two layout engines
		   resolve that differently. `ValueInfoBadgeTextMargin` is `4,0,4,2`, so the value's
		   margin box is 17px against a 16px badge: XAML puts an overflowing centred child at
		   the start edge, and the 2px bottom margin then has no room to act in, while
		   unqualified CSS centring splits the overflow evenly and lifts the digits half a
		   pixel. Measured on the reference guest, the original's digits sit 4 above and 4
		   below; `safe center` reproduces that, and it is a no-op wherever nothing overflows. */
		align-items: safe center;
		justify-content: center;
		min-width: var(--winui-InfoBadgeMinWidth);
		min-height: var(--winui-InfoBadgeMinHeight);
		max-height: var(--winui-InfoBadgeMaxHeight);
		padding: var(--winui-InfoBadgePadding);
		background: var(--winui-InfoBadgeBackground);
		color: var(--winui-InfoBadgeForeground);
		/* InfoBadge.cpp:90 computes ActualHeight / 2. This maximum-height half-radius
		   reproduces every smaller computed radius because CSS clamps radii to the box. */
		border-radius: calc(var(--winui-InfoBadgeMaxHeight) / 2);
	}

	/* Value and icon content both measure taller than the maximum, so their height is 16;
	   the floor states that rather than relying on the browser line box. The min-width is
	   InfoBadge.cpp:29's MeasureOverride guarantee that a badge is never taller than wide. */
	.root[data-display='value'],
	.root[data-display='icon'] {
		min-width: var(--winui-InfoBadgeMaxHeight);
		min-height: var(--winui-InfoBadgeMaxHeight);
	}

	/* AttentionDotInfoBadgeStyle, InfoBadge_themeresources.xaml:92. */
	.root[data-variant='attention'] {
		background: var(--winui-SystemFillColorAttentionBrush);
	}
	/* InformationalDotInfoBadgeStyle, InfoBadge_themeresources.xaml:104. */
	.root[data-variant='informational'] {
		background: var(--winui-SystemFillColorSolidNeutralBrush);
	}
	/* SuccessDotInfoBadgeStyle, InfoBadge_themeresources.xaml:116. */
	.root[data-variant='success'] {
		background: var(--winui-SystemFillColorSuccessBrush);
	}
	/* CautionDotInfoBadgeStyle, InfoBadge_themeresources.xaml:127. */
	.root[data-variant='caution'] {
		background: var(--winui-SystemFillColorCautionBrush);
	}
	/* CriticalDotInfoBadgeStyle, InfoBadge_themeresources.xaml:138. */
	.root[data-variant='critical'] {
		background: var(--winui-SystemFillColorCriticalBrush);
	}

	.value {
		margin: var(--winui-ValueInfoBadgeTextMargin);
		font-family: var(--winui-ContentControlThemeFontFamily);
		font-size: var(--winui-InfoBadgeValueFontSize);
		/* This root carries no ramp class, so the line box is whatever the consumer's page
		   says unless it is stated here. A WinUI control draws its text at the font's own
		   spacing whatever surrounds it. ADR 0011. */
		line-height: normal;
	}

	/* XAML Thickness is Left,Top,Right,Bottom; CSS shorthand is Top,Right,Bottom,Left. So
	   IconInfoBadgeFontIconMargin's `4,0,4,2` is emitted as `0 4px 2px 4px`, and the 2 that
	   is last in the resource is the *bottom* here. */
	.icon {
		margin: var(--winui-IconInfoBadgeFontIconMargin);
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: InfoBadge_themeresources.xaml:83, the Viewbox's aspect-preserving glyph scale requires a unit CSS line box */
		line-height: 1;
	}

	/* Default: InfoBadge_themeresources.xaml:9 and :14 leave 16 - (0 + 2) = 14 vertically. */
	.root[data-display='icon'][data-variant='default'] .icon {
		/* c1-allow: InfoBadge_themeresources.xaml:9 and :14, InfoBadgeMaxHeight 16 minus the FontIcon margin's 0 + 2 vertical extent is 14 */
		font-size: 14px;
	}

	/* The severity Icon styles inset the badge asymmetrically — `Padding="0,4,0,2"` at
	   InfoBadge_themeresources.xaml:96 and :108 — and the glyph's own bottom margin sits
	   inside that inset. The padding is load-bearing for *position*, not only for size:
	   4 above and 2 below is not 3 and 3, and centring the glyph without it drew it a pixel
	   high against the original on the reference guest. The three severities whose icon is a
	   `SymbolIconSource` carry no padding and reach the same place by the other route —
	   IconInfoBadgeIconMargin's `4,4,4,4` at :16 — so one rule serves all five. */
	.root[data-display='icon']:not([data-variant='default']) {
		/* InfoBadge_themeresources.xaml:96 and :108, `Padding="0,4,0,2"` in XAML's
		   Left,Top,Right,Bottom order. */
		padding: 4px 0 2px;
	}

	/* Severity icons: InfoBadge_themeresources.xaml:9, :96/:108 and :14 leave
	   16 - (4 + 2 + 0 + 2) = 8; the SymbolIcon path at :16 likewise leaves 16 - (4 + 4) = 8. */
	.root[data-display='icon']:not([data-variant='default']) .icon {
		/* c1-allow: InfoBadge_themeresources.xaml:9, :96/:108 and :14, InfoBadgeMaxHeight 16 minus 4 + 2 padding and 0 + 2 margin is 8; :16's Icon margin is 4 + 4 */
		font-size: 8px;
	}

	/* A contrast theme: the tokens are the high-contrast theme, so the browser's forcing is off
	   for what this draws. ADR 0005. */
	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
	}
</style>
