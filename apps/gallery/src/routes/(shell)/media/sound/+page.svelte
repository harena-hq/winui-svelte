<script lang="ts">
	import { Button, CheckBox, ToggleSwitch } from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/media/sound');
	if (item === null) throw new Error('Sound page has no Gallery item');
	const togglingSoundSample = sampleOf('Sound/TogglingSound.txt');
	const spatialAudioSample = sampleOf('Sound/SoundTogglingSpatialAudio.txt');
	const systemSoundSample = sampleOf('Sound/PlaySpecificSystemSound.txt');

	// SoundPage.xaml.cs:15-18 — the page only turns the toggle on when the process-wide
	// ElementSoundPlayer is explicitly On. Its actual default is Auto, not Off —
	// ElementSoundPlayerService_Partial.h:116 — so the toggle remains off on this PC page.
	let soundOn = $state(false);
	let spatialAudio = $state(false);

	function setSound(checked: boolean) {
		// SoundPage.xaml.cs:48-63 — turning sound on enables spatial audio; turning it off
		// disables and clears the checkbox as well as the framework's spatial-audio state.
		if (!checked) spatialAudio = false;
	}
</script>

<ItemPage {item}>
	<ControlExample
		headerText={togglingSoundSample.header ?? undefined}
		csharp={togglingSoundSample.csharp ?? undefined}
	>
		<!-- SoundPage.xaml:23-27 — the first example is one ToggleSwitch with these two labels. -->
		<ToggleSwitch
			bind:checked={soundOn}
			onCheckedChange={setSound}
			onContent="Sound On"
			offContent="Sound Off"
		/>
	</ControlExample>

	<ControlExample
		headerText={spatialAudioSample.header ?? undefined}
		csharp={spatialAudioSample.csharp ?? undefined}
	>
		<!-- SoundPage.xaml:30-43 — the checkbox starts disabled and the italic caption follows
		     it with a five-pixel top margin. -->
		<div class="spatial">
			<CheckBox bind:checked={spatialAudio} disabled={!soundOn}>Enable Spatial Audio</CheckBox>
			<p class="winui-CaptionTextBlockStyle caption">
				Can only enable spatial audio when sound is on!
			</p>
		</div>
	</ControlExample>

	<ControlExample
		headerText={systemSoundSample.header ?? undefined}
		csharp={systemSoundSample.csharp ?? undefined}
	>
		<!-- WD-058: SoundPage.xaml:46-89 renders these seven buttons, but none plays an
		     element sound. ElementSoundMode="Off" is not transcribed: it only suppresses each
		     Button's own sound, and no Button in this reproduction makes one. -->
		<div class="sounds">
			<Button aria-label="Focus">▶ Focus</Button>
			<Button aria-label="Invoke">▶ Invoke</Button>
			<Button aria-label="Show">▶ Show</Button>
			<Button aria-label="Hide">▶ Hide</Button>
			<Button aria-label="MovePrevious">▶ MovePrevious</Button>
			<Button aria-label="MoveNext">▶ MoveNext</Button>
			<Button aria-label="GoBack">▶ GoBack</Button>
		</div>
	</ControlExample>
</ItemPage>

<style>
	/* SoundPage.xaml:30 and :46 use vertical StackPanels. Their children sit at the left:
	   WinUI's default Button style sets HorizontalAlignment to Left —
	   Button_themeresources.xaml:161 — so the seven Buttons shrink-wrap rather than stretch. */
	.spatial,
	.sounds {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	/* SoundPage.xaml:46 — StackPanel Spacing="5". */
	.sounds {
		gap: 5px;
	}

	/* SoundPage.xaml:37-42 — Margin, FontStyle, Foreground and CaptionTextBlockStyle. */
	.caption {
		margin: 5px 0 0;
		font-style: italic;
		color: var(--winui-TextFillColorSecondaryBrush);
	}
</style>
