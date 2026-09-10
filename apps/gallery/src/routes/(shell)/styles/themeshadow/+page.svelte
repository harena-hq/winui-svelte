<script lang="ts">
	import { Slider } from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { dropShadowRecipe } from '$lib/shadow';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/styles/themeshadow');
	if (item === null) throw new Error('ThemeShadow page has no Gallery item');
	const sample = sampleOf('ThemeShadow/ThemeshadowAppliedBorder.txt');

	// ThemeShadowPage.xaml:29-41 — Value="32", Minimum="0", Maximum="64", and StepFrequency="1".
	let translationZ = $state(32);
	const shadowLight = $derived(dropShadowRecipe(translationZ, 'light'));
	const shadowDark = $derived(dropShadowRecipe(translationZ, 'dark'));
	// C1 reads no Svelte expression, so it is silent on these directives by construction; this
	// is not an evasion because the pinned recipe computes the values and the cascade follows theme.

	// ThemeShadowPage.xaml:33, :35, :38 — the Slider also carries AutomationProperties.Name
	// ("shadow intensity"), IsFocusEngagementEnabled="False" and SmallChange="1". The first is an
	// accessible name that differs from the header, the other two are keyboard and gamepad
	// behaviours; Slider.svelte publishes a prop for none of the three, and this unit adds none.
	// SmallChange here equals StepFrequency anyway, so two of the three change nothing at all.
</script>

<ItemPage {item}>
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		csharp={sample.csharp ?? undefined}
		substitutions={{ TranslationSlider: String(translationZ) }}
	>
		<!-- ThemeShadowPage.xaml:13 — the Grid that holds the sample, with its Padding="36".
		     Its first child at :14 is ShadowCastGrid, an empty Grid that exists only to be
		     registered as the ThemeShadow's receiver: a XAML shadow paints onto elements
		     registered to receive it, and CSS box-shadow paints onto whatever is behind. So
		     there is nothing here for it, and its absence is that rather than an omission. -->
		<div class="sample-frame">
			<!-- ThemeShadowPage.xaml:15-25 — Border Width, Height, Background and CornerRadius. -->
			<div
				class="sample-card"
				style:--sample-shadow-light={shadowLight}
				style:--sample-shadow-dark={shadowDark}
			></div>
		</div>
		{#snippet options()}
			<div class="options">
				<!-- ThemeShadowPage.xaml:29-41 — Slider Width="200", HorizontalAlignment="Left", Header,
				     Minimum="0", Maximum="64", StepFrequency="1", and Value="32". -->
				<Slider header="Z-translation" min={0} max={64} step={1} bind:value={translationZ} />
			</div>
		{/snippet}
	</ControlExample>
</ItemPage>

<style>
	/* ThemeShadowPage.xaml:13 — the Grid's Padding="36". The sample is left-aligned in the
	   display pane and keeps its own width, so this is 272 by 272 and the pane is 296 tall.
	   Named `sample-` rather than `frame` and `card`: `ControlExample` already has a `.card`,
	   and while Svelte's scoping keeps the two stylesheets apart, a duplicate class name makes
	   every selector that measures this page from outside it ambiguous. It cost one probe run. */
	.sample-frame {
		padding: 36px;
	}

	/* ThemeShadowPage.xaml:15-25 — Border Width, Height, Background and CornerRadius. */
	.sample-card {
		width: 200px;
		height: 200px;
		background: var(--winui-CardBackgroundFillColorDefaultBrush);
		border-radius: var(--winui-OverlayCornerRadius);
		box-shadow: var(--sample-shadow-light);
	}

	/* Dark is either the attribute or the system preference with nothing overriding it —
	   tokens.css:2150 and :3939 — so a page switching on theme in its own CSS has to write
	   both, or it follows the app's switch and not the machine's. */
	:global(:root[data-theme='dark']) .sample-card {
		box-shadow: var(--sample-shadow-dark);
	}

	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light']):not([data-theme='high-contrast'])) .sample-card {
			box-shadow: var(--sample-shadow-dark);
		}
	}

	/* PLATFORM_SHADOWS gives every shadow highContrast: 'none', by decision rather than by
	   measurement: the recipe has no high-contrast branch, and ADR 0005 makes high contrast a
	   remapping onto eight system colours, which a black drop shadow has none to remap from.
	   The page follows that decision rather than taking its own. */
	:global(:root[data-theme='high-contrast']) .sample-card {
		box-shadow: none;
	}

	/* ThemeShadowPage.xaml:29-41 — the Slider's own Width="200" and HorizontalAlignment="Left".
	   There is no StackPanel here, unlike the sibling pages, so this wrapper carries the width
	   the Slider carries upstream. */
	.options {
		display: flex;
		flex-direction: column;
		width: 200px;
	}
</style>
