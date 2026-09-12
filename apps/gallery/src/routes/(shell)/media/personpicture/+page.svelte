<script lang="ts">
	import { PersonPicture, RadioButton, RadioButtons } from 'winui-svelte';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const PROFILE_PICTURE =
		'https://learn.microsoft.com/windows/uwp/contacts-and-calendar/images/shoulder-tap-static-payload.png';
	const item = itemOf('/media/personpicture');
	if (item === null) throw new Error('PersonPicture page has no Gallery item');
	const sample = sampleOf('PersonPicture/PersonPictureSelectDifferentLooksPerson.txt');
	let profile = $state<'image' | 'name' | 'initials'>('image');
</script>

<ItemPage {item}>
	<ControlExample
		headerText={sample.header ?? undefined}
		xaml={sample.xaml ?? undefined}
		substitutions={{
			ProfilePicture: profile === 'image' ? `ProfilePicture="${PROFILE_PICTURE}"` : '',
			DisplayName: profile === 'name' ? 'DisplayName="Jane Doe"' : '',
			Initials: profile === 'initials' ? 'Initials="SB"' : ''
		}}
	>
		<!-- This remote source stays literal rather than vendored, following the ImageIcon example's
		     reasoning: vendoring would turn the Gallery's remote-source example into a local one. -->
		<!-- PersonPicturePage.xaml:14 has Height="300", but the control resizes to its 96px width;
		     the reference guest measures a 96x96 circle. VerticalAlignment="Top" is align-self here. -->
		<PersonPicture
			profilePicture={profile === 'image' ? PROFILE_PICTURE : undefined}
			displayName={profile === 'name' ? 'Jane Doe' : undefined}
			initials={profile === 'initials' ? 'SB' : undefined}
			style="align-self: flex-start"
		/>
		{#snippet options()}
			<RadioButtons header="Profile type">
				<RadioButton name="person-picture-profile" value="image" bind:group={profile}
					>Profile Image</RadioButton
				>
				<RadioButton name="person-picture-profile" value="name" bind:group={profile}
					>Display Name</RadioButton
				>
				<RadioButton name="person-picture-profile" value="initials" bind:group={profile}
					>Initials</RadioButton
				>
			</RadioButtons>
		{/snippet}
	</ControlExample>
</ItemPage>
