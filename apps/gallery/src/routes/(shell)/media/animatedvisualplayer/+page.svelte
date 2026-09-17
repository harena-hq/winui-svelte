<script lang="ts">
	import {
		AnimatedVisualPlayer,
		Border,
		Button,
		Hyperlink,
		ToggleButton,
		type AnimatedVisual
	} from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/media/animatedvisualplayer');
	if (item === null) throw new Error('AnimatedVisualPlayer page has no Gallery item');
	const sample = sampleOf('AnimatedVisualPlayer/AnimatedVisualPlayerPlaybackLottieAnimation.txt');

	/** LottieLogo1.cs:5042 gives the composition its 375x667 size and :27 gives its
	 * 59,670,000-tick, 5.967-second duration. WD-057: the 236KB generated composition is not
	 * transcribed; this source draws the original's resting frame at every progress. */
	const LOTTIE_LOGO_1: AnimatedVisual = {
		width: 375,
		height: 667,
		duration: 5967,
		visual: lottieLogo1
	};

	let player = $state<ReturnType<typeof AnimatedVisualPlayer>>();
	let paused = $state(false);
	let playing = $state(false);
	let playbackRate = $state(1);

	function ensurePlaying() {
		if (paused) {
			// AnimatedVisualPlayerPage.xaml.cs:54-58 — clearing Pause resumes the current play.
			paused = false;
			player?.resume();
		} else if (!playing) {
			// AnimatedVisualPlayerPage.xaml.cs:61-64 — start one non-looping play at the current rate.
			void player?.play(0, 1, false);
		}
	}

	function play() {
		// AnimatedVisualPlayerPage.xaml.cs:16-21 — PlaybackRate is live, including during a play.
		playbackRate = 1;
		ensurePlaying();
	}

	function pauseChanged(checked: boolean) {
		// AnimatedVisualPlayerPage.xaml.cs:24-35 — pausing holds the current play without completing it;
		// unchecking the ToggleButton resumes that same play.
		if (checked) player?.pause();
		else player?.resume();
	}

	function stop() {
		// AnimatedVisualPlayerPage.xaml.cs:37-42 — Stop completes the play, resets it, and clears Pause.
		player?.stop();
		paused = false;
	}

	function reverse() {
		// AnimatedVisualPlayerPage.xaml.cs:44-49 — the live rate takes effect even during a play.
		playbackRate = -1;
		ensurePlaying();
	}
</script>

{#snippet lottieLogo1()}
	<div class="lottie-logo-1"></div>
{/snippet}

<ItemPage {item}>
	<ControlExample headerText={sample.header ?? undefined} xaml={sample.xaml ?? undefined}>
		<!-- AnimatedVisualPlayerPage.xaml:14-101 — the centred StackPanel contains this paragraph,
		     the 400-square card, and the four-column transport grid in that order. -->
		<div class="example">
			<!-- AnimatedVisualPlayerPage.xaml:16-26 — the TextBlock and its two inline Hyperlinks.
			     The space before the first full stop is present in the XAML source. -->
			<p class="winui-BodyTextBlockStyle lead">
				This AnimatedVisualPlayer consumes an animation created using Adobe AfterEffects and
				translated into Microsoft.UI.Composition objects using
				<Hyperlink navigateUri="https://aka.ms/lottie">Lottie-Windows</Hyperlink> . Since the
				<Hyperlink
					navigateUri="https://learn.microsoft.com/windows/windows-app-sdk/api/winrt/microsoft.ui.composition.compositionshape"
					>CompositionShapes</Hyperlink
				>
				used here are supported on Windows 10 version 17763+, the AnimatedVisualPlayer falls back to an
				Image when its Source is unavailable.
			</p>

			<!-- AnimatedVisualPlayerPage.xaml:27-42 — the example's fixed card, theme brushes,
			     one-pixel border, and vertical margins. -->
			<Border
				background="var(--winui-CardBackgroundFillColorDefaultBrush)"
				borderBrush="var(--winui-CardStrokeColorDefaultBrush)"
				borderThickness={1}
				style="width: 400px; height: 400px; margin: 20px 0"
			>
				<!-- XAML's default alignment stretches a Border's child. The explicit 100% is that
				     arrangement; the player's own default size is the visual's natural size. -->
				<AnimatedVisualPlayer
					bind:this={player}
					source={LOTTIE_LOGO_1}
					autoPlay={false}
					{playbackRate}
					bind:playing
					style="width: 100%; height: 100%"
				/>
			</Border>

			<!-- AnimatedVisualPlayerPage.xaml:45-99 — four equal columns, eight pixels apart, in a
			     400-wide Grid with Margin 12. Names and tooltips come from each original button. -->
			<div class="transport">
				<Button aria-label="Play" title="Play" onclick={play}>
					<span class="symbol">{String.fromCodePoint(0xe768)}</span>
				</Button>
				<ToggleButton
					aria-label="Pause"
					title="Pause"
					bind:checked={paused}
					onCheckedChange={pauseChanged}
				>
					<span class="symbol">{String.fromCodePoint(0xe769)}</span>
				</ToggleButton>
				<Button aria-label="Stop" title="Stop" onclick={stop}>
					<span class="symbol">{String.fromCodePoint(0xe71a)}</span>
				</Button>
				<Button aria-label="Reverse" title="Reverse" onclick={reverse}>
					<span class="symbol">{String.fromCodePoint(0xe892)}</span>
				</Button>
			</div>
		</div>
	</ControlExample>
</ItemPage>

<style>
	/* AnimatedVisualPlayerPage.xaml:14-26 — the centred StackPanel's paragraph stretches to the
	   available width, making its own centring a no-op, while children with explicit Width are
	   centred in their slots. A flex column with centred items and a stretching paragraph is that
	   XAML arrangement. */
	.example {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* AnimatedVisualPlayerPage.xaml:16-26 — TextBlock has no margin or alignment of its own and
	   therefore takes the StackPanel's width. */
	.lead {
		align-self: stretch;
		margin: 0;
	}

	/* AnimatedVisualPlayerPage.xaml:45-99 — Width 400, Margin 12, four equal columns, and
	   ColumnSpacing 8. Flex-item margins do not collapse, so the card's 20 and this 12 make the
	   measured 32-pixel gap. */
	.transport {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 8px;
		width: 400px;
		margin: 12px;
	}

	/* CSymbolIcon::ApplyTemplate, icon.cpp:323-395 — the same construction used by the SplitView
	   Gallery page for SymbolIcon glyphs. */
	.symbol {
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: SymbolIcon — glyph measures 20 wide on the reference. */
		font-size: 20px;
		/* c1-allow: SymbolIcon — line-height: 1 makes the glyph box its 20px size. */
		line-height: 1;
	}

	.lottie-logo-1 {
		width: 100%;
		height: 100%;
		/* c1-allow: LottieLogo1.cs:82-85 names the brush FF00D1C1 and :4158-4164 fills the
		   composition's own RoundedRectangle_375x667 with it, which is what the reference guest
		   draws at progress 0. A composition carries its own palette and follows no theme. */
		background: #00d1c1;
	}
</style>
