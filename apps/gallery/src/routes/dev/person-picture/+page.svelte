<script lang="ts">
	import { PersonPicture } from 'winui-svelte';

	const COMBINING_NAME = 'J\u0301ohn Smith';
</script>

<svelte:head><title>PersonPicture — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">PersonPicture</h1>

<div class="rows">
	<h2 class="winui-SubtitleTextBlockStyle">Placeholder</h2>
	<PersonPicture />
	<h2 class="winui-SubtitleTextBlockStyle">Initials</h2>
	<PersonPicture initials="SB" />
	<h2 class="winui-SubtitleTextBlockStyle">Display name</h2>
	<PersonPicture displayName="Jane Doe" />
	<h2 class="winui-SubtitleTextBlockStyle">Initials over display name</h2>
	<PersonPicture displayName="Jane Doe" initials="SB" />
	<h2 class="winui-SubtitleTextBlockStyle">Photo</h2>
	<PersonPicture profilePicture="/rainier.jpg" />
	<h2 class="winui-SubtitleTextBlockStyle">Photo over display name</h2>
	<PersonPicture profilePicture="/rainier.jpg" displayName="Jane Doe" />
	<h2 class="winui-SubtitleTextBlockStyle">Group</h2>
	<PersonPicture isGroup />
	<h2 class="winui-SubtitleTextBlockStyle">Group over photo</h2>
	<PersonPicture isGroup profilePicture="/rainier.jpg" />
	<h2 class="winui-SubtitleTextBlockStyle">Badge number</h2>
	<PersonPicture initials="SB" badgeNumber={5} />
	<h2 class="winui-SubtitleTextBlockStyle">Badge number over ninety-nine</h2>
	<PersonPicture initials="SB" badgeNumber={100} />
	<h2 class="winui-SubtitleTextBlockStyle">Badge number zero</h2>
	<PersonPicture initials="SB" badgeNumber={0} badgeGlyph="E8FB" />
	<h2 class="winui-SubtitleTextBlockStyle">Badge number below zero</h2>
	<PersonPicture initials="SB" badgeNumber={-1} badgeGlyph="E8FB" />
	<h2 class="winui-SubtitleTextBlockStyle">Badge glyph</h2>
	<PersonPicture initials="SB" badgeGlyph="E8FB" />
	<h2 class="winui-SubtitleTextBlockStyle">Badge image</h2>
	<PersonPicture initials="SB" badgeImageSource="/SunBlack.png" />
	<h2 class="winui-SubtitleTextBlockStyle">Badge image over number</h2>
	<PersonPicture initials="SB" badgeImageSource="/SunBlack.png" badgeNumber={3} />
	<h2 class="winui-SubtitleTextBlockStyle">Small</h2>
	<PersonPicture size={30} initials="SB" badgeNumber={3} />
	<h2 class="winui-SubtitleTextBlockStyle">Large</h2>
	<PersonPicture size={200} initials="SB" badgeNumber={12} />
	<h2 class="winui-SubtitleTextBlockStyle">Name with a trailing bracket</h2>
	<PersonPicture displayName="John Smith (OSG)" />
	<h2 class="winui-SubtitleTextBlockStyle">Single word name</h2>
	<PersonPicture displayName="Jordan" />
	<h2 class="winui-SubtitleTextBlockStyle">Name with leading punctuation</h2>
	<PersonPicture displayName="John -Smith" />
	<h2 class="winui-SubtitleTextBlockStyle">Name with a combining mark</h2>
	<PersonPicture displayName={COMBINING_NAME} />
	<h2 class="winui-SubtitleTextBlockStyle">Symbolic name</h2>
	<PersonPicture displayName="田中太郎" />
	<h2 class="winui-SubtitleTextBlockStyle">Glyph name</h2>
	<PersonPicture displayName="مرحبا" />
	<h2 class="winui-SubtitleTextBlockStyle">Name of spaces</h2>
	<PersonPicture displayName="   " />
</div>

<style>
	/* Badge overhang needs vertical room between harness rows; this is layout, not a visual token. */
	.rows {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
</style>
