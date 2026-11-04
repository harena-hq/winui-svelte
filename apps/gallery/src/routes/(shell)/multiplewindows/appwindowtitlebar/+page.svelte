<script lang="ts">
	import {
		AppBarSeparator,
		Button,
		CheckBox,
		ComboBox,
		Hyperlink
	} from '@harena-hq/winui-svelte/preview';
	import { resolve } from '$app/paths';
	import ColorSelector from '$lib/controls/ColorSelector.svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/multiplewindows/appwindowtitlebar');
	if (item === null) throw new Error('AppWindowTitleBar page has no Gallery item');

	const colorSample = sampleOf('AppWindowTitleBar/AppwindowtitlebarColorCustomization.txt');
	const extendingSample = sampleOf('AppWindowTitleBar/ExtendingContentAppwindowtitlebarArea.txt');
	const themeSample = sampleOf('AppWindowTitleBar/AppwindowtitlebarPreferredThemeHeight.txt');

	const COLOR_COLUMNS = [
		[
			{ key: 'BackgroundColor', label: 'BackgroundColor', color: '#F2F6FA' },
			{ key: 'ForegroundColor', label: 'ForegroundColor', color: '#1E2933' },
			{ key: 'ButtonBackgroundColor', label: 'ButtonBackgroundColor', color: '#3B82F6' },
			{ key: 'ButtonForegroundColor', label: 'ButtonForegroundColor', color: '#FFFFFF' },
			{
				key: 'ButtonHoverBackgroundColor',
				label: 'ButtonHoverBackgroundColor',
				color: '#2563EB'
			},
			{
				key: 'ButtonHoverForegroundColor',
				label: 'ButtonHoverForegroundColor',
				color: '#FFFFFF'
			}
		],
		[
			{ key: 'InactiveBackgroundColor', label: 'InactiveBackgroundColor', color: '#E5EAF0' },
			{ key: 'InactiveForegroundColor', label: 'InactiveForegroundColor', color: '#6B7280' },
			{
				key: 'ButtonInactiveBackgroundColor',
				label: 'ButtonInactiveBackgroundColor',
				color: '#CBD5E1'
			},
			{
				key: 'ButtonInactiveForegroundColor',
				label: 'ButtonInactiveForegroundColor',
				color: '#475569'
			},
			{
				key: 'ButtonPressedBackgroundColor',
				label: 'ButtonPressedBackgroundColor',
				color: '#1D4ED8'
			},
			{
				key: 'ButtonPressedForegroundColor',
				label: 'ButtonPressedForegroundColor',
				color: '#FFFFFF'
			}
		]
	] as const;

	// AppWindowTitleBarPage.xaml.cs:155 — ColorToArgbString prints alpha first, followed by
	// the three colour channels in decimal. Every source colour here is fully opaque.
	function argb(hex: string): string {
		const channels = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((channel) =>
			Number.parseInt(channel, 16)
		);
		return `255, ${channels.join(', ')}`;
	}

	const colorSubstitutions = Object.fromEntries(
		COLOR_COLUMNS.flat().map(({ key, color }) => [key, argb(color)])
	);

	let extendsContent = $state(true);
	let heightOption = $state('Standard');
	let preferredTheme = $state('UseDefaultAppMode');

	const HEIGHT_OPTIONS = ['Standard', 'Tall', 'Collapsed'].map((value) => ({
		value,
		label: value
	}));
	const TITLE_BAR_THEMES = ['Legacy', 'UseDefaultAppMode', 'Light', 'Dark'].map((value) => ({
		value,
		label: value
	}));
</script>

<ItemPage {item}>
	<!-- AppWindowTitleBarPage.xaml:12-18. The XAML <Hyperlink> is reproduced by Hyperlink. -->
	<p class="lead winui-BodyTextBlockStyle">
		For the default title bar and basic scenarios, use the
		<Hyperlink navigateUri={resolve('/multiplewindows/titlebar')}>TitleBar</Hyperlink> control.
	</p>

	<ControlExample
		headerText={colorSample.header ?? undefined}
		xaml={colorSample.xaml ?? undefined}
		csharp={colorSample.csharp ?? undefined}
		substitutions={colorSubstitutions}
	>
		<!-- WD-065. AppWindowTitleBarPage.xaml.cs:31-49 creates and activates an
		     AppWindowTitleBarWindow configured with these twelve colours; this button is inert. -->
		<Button>Show window</Button>
		{#snippet options()}
			<!-- AppWindowTitleBarPage.xaml:28-127 — three Auto columns with 16 pixels between
			     them; the outer columns are StackPanels with Spacing="8". -->
			<div class="color-grid">
				<div class="color-column">
					{#each COLOR_COLUMNS[0] as selector (selector.key)}
						<span class="winui-BodyTextBlockStyle">{selector.label}</span>
						<ColorSelector label={selector.label} color={selector.color} />
					{/each}
				</div>
				<AppBarSeparator />
				<div class="color-column">
					{#each COLOR_COLUMNS[1] as selector (selector.key)}
						<span class="winui-BodyTextBlockStyle">{selector.label}</span>
						<ColorSelector label={selector.label} color={selector.color} />
					{/each}
				</div>
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={extendingSample.header ?? undefined}
		xaml={extendingSample.xaml ?? undefined}
		csharp={extendingSample.csharp ?? undefined}
		substitutions={{
			ExtendsContentIntoTitleBar: String(extendsContent),
			TitleBarHeightOption: heightOption
		}}
	>
		<!-- WD-065. AppWindowTitleBarPage.xaml.cs:159-167 creates and activates an
		     AppWindowTitleBarExtendWindow; this button is inert. -->
		<Button>Show window</Button>
		{#snippet options()}
			<div class="extending-options">
				<!-- AppWindowTitleBarPage.xaml:153-159 — the CheckBox's own bottom margin is 12. -->
				<CheckBox bind:checked={extendsContent} style="margin-bottom: 12px"
					>Extend content into title bar</CheckBox
				>
				<!-- AppWindowTitleBarPage.xaml:164 binds a Windows App SDK enum. The enum is not
				     declared in any of this repository's three pinned upstreams, so this ordered
				     list was measured by opening the control on the reference guest. -->
				<ComboBox
					bind:value={heightOption}
					header="TitleBarHeightOption"
					items={HEIGHT_OPTIONS}
					style="width: 200px"
				/>
			</div>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={themeSample.header ?? undefined}
		xaml={themeSample.xaml ?? undefined}
		csharp={themeSample.csharp ?? undefined}
		substitutions={{ PreferredTheme: preferredTheme }}
	>
		<!-- WD-065. AppWindowTitleBarPage.xaml.cs:201-207 creates and activates an
		     AppWindowTitleBarThemeWindow; this button is inert. -->
		<Button>Show window</Button>
		{#snippet options()}
			<!-- AppWindowTitleBarPage.xaml:187 binds a Windows App SDK enum. The enum is not
			     declared in any of this repository's three pinned upstreams, so this ordered
			     list was measured by opening the control on the reference guest. -->
			<ComboBox
				bind:value={preferredTheme}
				header="TitleBarTheme"
				items={TITLE_BAR_THEMES}
				style="width: 200px"
			/>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	.lead {
		/* AppWindowTitleBarPage.xaml:12 — Margin="0,8,0,0". */
		margin: 8px 0 0;
	}
	.color-grid {
		display: grid;
		grid-template-columns: auto auto auto;
		column-gap: 16px;
	}
	.color-column,
	.extending-options {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
</style>
