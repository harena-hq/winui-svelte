<script lang="ts">
	import {
		DatePicker,
		LineBreak,
		Paragraph,
		PasswordBox,
		RadioButton,
		RadioButtons,
		RichTextBlock,
		Run,
		TextBox
	} from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/styles/compactsizing');
	if (item === null) throw new Error('Compact Sizing page has no Gallery item');
	const sample = sampleOf('CompactSizing/CompactSizingControls.txt');

	// CompactSizingPage.xaml:33-51 — the ten bullet Runs, each with its bullet in the Run's own
	// Text, and each preceded by a LineBreak.
	const COMPACT_CONTROL_RUNS = [
		'• ListView',
		'• TextBox',
		'• PasswordBox',
		'• AutoSuggestBox',
		'• ComboBox',
		'• DatePicker',
		'• TimePicker',
		'• TreeView',
		'• NavigationView',
		'• MenuBar'
	];

	// CompactSizingPage.xaml:67 — Standard starts checked.
	let density = $state('standard');
	let firstName = $state('');
	let lastName = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let chosenDate = $state<Date | undefined>(undefined);
</script>

<ItemPage {item}>
	<!-- CompactSizingPage.xaml:29-53 — RichTextBlock with one SemiBold Run and ten bullet Runs,
	     and `Margin="0,24,0,0"` at :29, which is the inline style below.

	     No Style is named, and the class is still what carries the ramp. XAML's inherited text
	     formatting record has a default of its own — TextFormatting::CreateDefault
	     (TextFormatting.cpp:110) sets FontSize 14 (:124, applied at :142), FontWeight Normal (:146)
	     and the ultimate font (:144), which FontAndScriptServices.h:30 declares as the literal
	     string XamlAutoFontFamily — so a styleless RichTextBlock lands on exactly
	     BodyRichTextBlockStyle's values. This document's root supplies no font at all, so the class
	     is what stands in for a record CSS has no equivalent of.

	     The first Run is 600, XAML's SemiBold. The `<strong>` it replaces rendered 700, because a
	     browser's `strong` is `bolder` against a 400 parent. -->
	<RichTextBlock class="winui-BodyTextBlockStyle" style="margin-top: 24px">
		<Paragraph>
			<!-- CompactSizingPage.xaml:31 — FontWeight="SemiBold" is 600. -->
			<Run text="Controls that support compact styling:" fontWeight={600} />
			{#each COMPACT_CONTROL_RUNS as run (run)}
				<LineBreak /><Run text={run} />
			{/each}
		</Paragraph>
	</RichTextBlock>

	<!-- CompactSizingPage.xaml:54-77 — the page's one ControlExample and its sample definition. -->
	<ControlExample headerText={sample.header ?? undefined} xaml={sample.xaml ?? undefined}>
		<!-- SampleCompactSizingPage.xaml.cs:21-28 copies values only because Frame.Navigate rebuilds
		     the page. This single Svelte form retains its own state while its density changes. -->
		<div class="form" data-density={density === 'compact' ? 'compact' : undefined}>
			<!-- SampleStandardSizingPage.xaml:22-30 and SampleCompactSizingPage.xaml:30-38 — the
			     identical controls, with only this heading's text varying by selected density. -->
			<div class="form-header">{density === 'compact' ? 'Compact Size' : 'Standard Size'}</div>
			<TextBox header="First Name:" bind:value={firstName} />
			<TextBox header="Last Name:" bind:value={lastName} />
			<PasswordBox header="Password:" bind:value={password} />
			<PasswordBox header="Confirm Password:" bind:value={confirmPassword} />
			<DatePicker header="Pick a date" bind:date={chosenDate} />
		</div>
		{#snippet options()}
			<!-- CompactSizingPage.xaml:62-74 — RadioButtons with its Header and two RadioButtons. -->
			<div class="options">
				<RadioButtons header="Fluent Standard and Compact Sizing">
					<RadioButton name="compact-sizing-density" value="standard" bind:group={density}
						>Standard</RadioButton
					>
					<RadioButton name="compact-sizing-density" value="compact" bind:group={density}
						>Compact</RadioButton
					>
				</RadioButtons>
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	/* SampleStandardSizingPage.xaml:21 — StackPanel Spacing="16".

	   The StackPanel is content-sized, because ControlExample's presenter aligns its content
	   left, so the form is as wide as its widest child wants to be. Upstream that is the
	   DatePicker at 296, and every other control stretches to it: measured on the reference,
	   the first TextBox runs x370 to x666. Ours comes out 318 instead, because WD-042's
	   `min-width: 318px` on the four text controls overrides the 296 — this page is the one
	   that shows it, and the DatePicker beside them, still at 296, is the proof. Everything
	   else here matches the reference: the same x370 origin, the same 75-pixel field pitch,
	   the same 32-pixel control height. */
	.form {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	/* SampleCompactSizingPage.xaml:25 — the compact page's StackPanel is Spacing="8". */
	/* SampleCompactSizingPage.xaml:26-29 — StackPanel.Resources overrides both header margins
	   to Thickness 0,2,0,2, which is CSS's 2px 0 2px 0. This is the sample page's own scoped
	   dictionary, not part of DensityStyles/Compact.xaml. */
	.form[data-density='compact'] {
		gap: 8px;
		/* c1-allow: SampleCompactSizingPage.xaml:27 — StackPanel.Resources sets
		   TextBoxTopHeaderMargin to Thickness 0,2,0,2. */
		--winui-TextBoxTopHeaderMargin: 2px 0px 2px 0px;
		/* c1-allow: SampleCompactSizingPage.xaml:28 — StackPanel.Resources sets
		   PasswordBoxTopHeaderMargin to Thickness 0,2,0,2. */
		--winui-PasswordBoxTopHeaderMargin: 2px 0px 2px 0px;
	}

	.form-header {
		/* c1-allow: SampleStandardSizingPage.xaml:24 and SampleCompactSizingPage.xaml:32 write
		   FontSize="18" literally rather than through a ThemeResource. */
		font-size: 18px;
	}
</style>
