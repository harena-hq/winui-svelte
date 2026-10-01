<script lang="ts">
	import {
		Button,
		ComboBox,
		Hyperlink,
		InfoBar,
		Paragraph,
		RichTextBlock,
		Run
	} from 'winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/shell/appnotification');
	if (item === null) throw new Error('App notifications page has no Gallery item');

	const basicSample = sampleOf('AppNotification/AppNotificationBasicNotification.txt');
	const logoSample = sampleOf(
		'AppNotification/AppNotificationInformationalNotificationLogoCustom.txt'
	);
	const heroSample = sampleOf('AppNotification/AppNotificationVisualNotificationHeroImage.txt');
	const controlsSample = sampleOf('AppNotification/NotificationAppnotificationControls.txt');
	const progressSample = sampleOf('AppNotification/AppNotificationNotificationProgressbar.txt');

	// AppNotificationPage.xaml.cs:15-23 — the list is written out in the code-behind in this
	// order, which is the ComboBox's order; it is not the enum's declaration order and not
	// alphabetical. :24 makes Default the resting selection.
	const SOUND_EVENTS = ['Default', 'IM', 'Reminder', 'SMS', 'Alarm', 'Call'];
	let soundEvent = $state('Default');
</script>

<ItemPage {item}>
	<!-- WD-073: ShowNotificationButton_Click (AppNotificationPage.xaml.cs:56),
	     ShowInformationalNotificationWithLogoButton_Click (:31),
	     ShowVisualNotificationWithHeroImageButton_Click (:44),
	     ShowNotificationWithControlsButton_Click (:66) and
	     ShowNotificationWithProgressBarButton_Click (:86) show no notification at this origin. -->
	<!-- WD-074: and four of the five could not be reproduced even where one could be shown —
	     the logo crop, the named sound event, the timestamp, the hero image, the attribution
	     line, the combo box, the text box, the action button and the progress bar have no
	     counterpart on a web Notification. -->
	<div class="notes">
		<InfoBar open closable={false}>
			<!-- AppNotificationPage.xaml:18-38 — Margin="0,12,12,12" is XAML's
			     left,top,right,bottom, which is CSS's top,right,bottom,left reversed; the control
			     has no margin prop, so it is the inline style. Every space before a full stop is
			     the whitespace XAML keeps between two adjacent Runs, and every string is a `text`
			     prop so that the template compiler cannot trim one away. -->
			<RichTextBlock
				class="winui-BodyTextBlockStyle"
				textSelectionEnabled={false}
				style="margin: 12px 12px 12px 0"
				><Paragraph
					><Run text="The " /><Run fontWeight={600} text="AppNotificationManager" /><Run
						text=" class has a dependency on the "
					/><Hyperlink
						navigateUri="https://learn.microsoft.com/windows/apps/windows-app-sdk/deployment-architecture#singleton-package"
						>Singleton package</Hyperlink
					><Run
						text=" . Because of that dependency, there are certain considerations to be aware of if you're calling these APIs from a "
					/><Hyperlink
						navigateUri="https://learn.microsoft.com/windows/apps/package-and-deploy/deploy-overview"
						>self-contained app</Hyperlink
					><Run text=" . For more info, and specifics, see " /><Hyperlink
						navigateUri="https://learn.microsoft.com/windows/apps/package-and-deploy/self-contained-deploy/deploy-self-contained-apps#dependencies-on-additional-msix-packages"
						>Dependencies on additional MSIX packages</Hyperlink
					><Run text=" ." /></Paragraph
				></RichTextBlock
			>
		</InfoBar>
		<InfoBar open closable={false}>
			<!-- AppNotificationPage.xaml:45-53. -->
			<RichTextBlock
				class="winui-BodyTextBlockStyle"
				textSelectionEnabled={false}
				style="margin: 12px 12px 12px 0"
				><Paragraph
					><Run text="If " /><Run fontWeight={600} text="Do Not Disturb" /><Run
						text=" mode is enabled in system settings, these notifications will not appear as toast popups, but they will still be added to the notification center and can be viewed there."
					/></Paragraph
				></RichTextBlock
			>
		</InfoBar>
		<!-- AppNotificationPage.xaml:56-61. -->
		<InfoBar
			open
			closable={false}
			severity="warning"
			title="App notifications should not be noisy"
			message="App notifications are designed to convey timely and relevant information without disrupting the user experience. Excessive use of sound, prolonged durations, or overly attention-seeking visuals can lead to user fatigue and diminish the overall effectiveness of notifications."
		/>
	</div>

	<ControlExample
		headerText={basicSample.header ?? undefined}
		csharp={basicSample.csharp ?? undefined}
	>
		<Button>Show notification</Button>
	</ControlExample>

	<ControlExample
		headerText={logoSample.header ?? undefined}
		csharp={logoSample.csharp ?? undefined}
		substitutions={{ SelectedAppNotificationSoundEvent: soundEvent }}
	>
		<Button>Show informational notification with logo and custom audio</Button>
		{#snippet options()}
			<!-- AppNotificationPage.xaml:73-77 — Header, ItemsSource and Width="180". -->
			<ComboBox
				header="AppNotificationSoundEvent"
				items={SOUND_EVENTS.map((v) => ({ value: v, label: v }))}
				bind:value={soundEvent}
				style="width: 180px"
			/>
		{/snippet}
	</ControlExample>

	<ControlExample
		headerText={heroSample.header ?? undefined}
		csharp={heroSample.csharp ?? undefined}
	>
		<Button>Show visual notification with hero image and attribution</Button>
	</ControlExample>

	<ControlExample
		headerText={controlsSample.header ?? undefined}
		csharp={controlsSample.csharp ?? undefined}
	>
		<Button>Show notification with AppNotification controls</Button>
	</ControlExample>

	<ControlExample
		headerText={progressSample.header ?? undefined}
		csharp={progressSample.csharp ?? undefined}
	>
		<Button>Show notification with progress bar</Button>
	</ControlExample>
</ItemPage>

<style>
	/* AppNotificationPage.xaml:12-13 — StackPanel Spacing="8" Margin="0,16,0,0". */
	.notes {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 16px;
	}
</style>
