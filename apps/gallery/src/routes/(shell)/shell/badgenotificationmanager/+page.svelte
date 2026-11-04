<script lang="ts">
	import { Button, ComboBox, InfoBar, NumberBox } from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/shell/badgenotificationmanager');
	if (item === null) throw new Error('Badge notifications page has no Gallery item');

	const countSample = sampleOf(
		'BadgeNotificationManager/BadgeNotificationManagerSettingBadgeNotificationsCount.txt'
	);
	const glyphSample = sampleOf(
		'BadgeNotificationManager/BadgeNotificationManagerSettingBadgeNotificationsGlyph.txt'
	);

	// BadgeNotificationManagerPage.xaml.cs:15 fills the list with
	// Enum.GetValues<BadgeNotificationGlyph>(), and no pinned checkout carries that enum —
	// it is the Windows App SDK's, not WinUI's. These thirteen values and this order were
	// read off the reference guest's own dropdown. :16 makes Activity the resting selection.
	const BADGE_GLYPHS = [
		'None',
		'Activity',
		'Alarm',
		'Alert',
		'Attention',
		'Available',
		'Away',
		'Busy',
		'Error',
		'NewMessage',
		'Paused',
		'Playing',
		'Unavailable'
	];
	let glyph = $state('Activity');
	let badgeCount = $state<number | null>(5);
</script>

<ItemPage {item}>
	<!-- WD-075: SetBadgeCountButton_Click (BadgeNotificationManagerPage.xaml.cs:24),
	     ClearBadgeButton_Click (:33), SetBadgeGlyphButton_Click (:41),
	     BadgeCountBox_ValueChanged (:50) and BadgeNotificationGlyphsCombo_SelectionChanged (:61)
	     set no badge at this origin. -->
	<!-- WD-076: and the thirteen BadgeNotificationGlyph values have no counterpart at any origin
	     — the web's badge takes an optional number and nothing else. -->
	<!-- BadgeNotificationManagerPage.xaml:13. The bar is markup with IsOpen="True" and no
	     x:Name; no code-behind touches it, so the original shows it even when packaged. -->
	<InfoBar
		open
		closable={false}
		severity="warning"
		title="BadgeNotificationManager is not available in unpackaged mode."
		message="This API requires the app to be running in packaged mode (MSIX)."
		style="margin-top: 10px"
	/>

	<ControlExample
		headerText={countSample.header ?? undefined}
		csharp={countSample.csharp ?? undefined}
		substitutions={{ BadgeCount: String(badgeCount ?? '') }}
	>
		<!-- BadgeNotificationManagerPage.xaml:15 — StackPanel Spacing="8", no VerticalAlignment,
		     so XAML's Stretch fills the pane and stacks from the top. -->
		<div class="button-column" data-vertical-alignment="stretch">
			<!-- :16-18, :19-21 — both Width="160". -->
			<Button style="width: 160px">Set badge as count</Button>
			<Button style="width: 160px">Clear badge</Button>
		</div>
		{#snippet options()}
			<!-- BadgeNotificationManagerPage.xaml:24-32 — Header, Value="5", Minimum="1",
			     SpinButtonPlacementMode="Inline", SmallChange="1", Width="160". `LargeChange="10"`
			     at :30 has no counterpart: this library's NumberBox exposes `step` only, and its
			     keyboard has no PageUp/PageDown at all, so there is nothing for a large change to
			     apply to. That is a property of the component, not of this page — do not add a prop. -->
			<NumberBox
				header="Badge count"
				bind:value={badgeCount}
				min={1}
				step={1}
				spinButtonPlacementMode="inline"
				style="width: 160px"
			/>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={glyphSample.header ?? undefined}
		csharp={glyphSample.csharp ?? undefined}
		substitutions={{ SelectedGlyph: glyph }}
	>
		<!-- BadgeNotificationManagerPage.xaml:40 — StackPanel Spacing="8", no VerticalAlignment,
		     so XAML's Stretch fills the pane and stacks from the top. -->
		<div class="button-column" data-vertical-alignment="stretch">
			<!-- :41-43, :44-46 — both Width="160". -->
			<Button style="width: 160px">Set badge glyph</Button>
			<Button style="width: 160px">Clear badge</Button>
		</div>
		{#snippet options()}
			<!-- BadgeNotificationManagerPage.xaml:49-54 — Header, ItemsSource and Width="160". -->
			<ComboBox
				header="BadgeNotificationGlyph"
				items={BADGE_GLYPHS.map((v) => ({ value: v, label: v }))}
				bind:value={glyph}
				style="width: 160px"
			/>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	/* BadgeNotificationManagerPage.xaml:15, :40 — StackPanel Spacing="8". */
	.button-column {
		display: flex;
		flex-direction: column;
		gap: 8px;
		align-items: flex-start;
	}
</style>
