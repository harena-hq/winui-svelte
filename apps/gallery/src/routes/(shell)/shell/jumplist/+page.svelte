<script lang="ts">
	import { Button, InfoBar } from '@harena-hq/winui-svelte/preview';
	import ControlExample from '$lib/frame/ControlExample.svelte';
	import ItemPage from '$lib/frame/ItemPage.svelte';
	import { sampleOf } from '$lib/samples';
	import { itemOf } from '$lib/shell';

	const item = itemOf('/shell/jumplist');
	if (item === null) throw new Error('JumpList page has no Gallery item');

	const tasksSample = sampleOf('JumpList/AddingTasksJumpList.txt');
	const customGroupSample = sampleOf('JumpList/JumpListAddingItemsCustomGroup.txt');
</script>

<ItemPage {item}>
	<!-- WD-077: AddTasksButton_Click (JumpListPage.xaml.cs:19), ClearTasksButton_Click (:42) and
	     AddCustomGroupButton_Click (:54) change no jump list, at this origin or at any other. -->
	<!-- JumpListPage.xaml:12-14. The bar is markup with IsOpen="True" and no x:Name; no
	     code-behind touches it, so the original shows it even when packaged. -->
	<InfoBar
		open
		closable={false}
		severity="warning"
		title="JumpList is not available in unpackaged mode."
		message="This API requires the app to be running in packaged mode (MSIX)."
		style="margin-top: 10px"
	/>

	<!-- JumpListPage.xaml:16-17. -->
	<p class="lead winui-BodyTextBlockStyle">
		WinUI Gallery populates its jump list with your recently visited and favorited items. Restarting
		the app will restore these entries after any changes made on this page.
	</p>

	<ControlExample
		headerText={tasksSample.header ?? undefined}
		csharp={tasksSample.csharp ?? undefined}
	>
		<div class="example-column" data-vertical-alignment="stretch">
			<!-- JumpListPage.xaml:21-22. -->
			<p class="winui-BodyTextBlockStyle">
				Tasks are items with an empty GroupName. They appear in the built-in 'Tasks' section at the
				bottom of the jump list. Use tasks for common app-wide actions that are always relevant,
				such as composing a new message or opening settings. Each task launches the app with a
				specific argument string that your app can handle on startup.
			</p>
			<!-- JumpListPage.xaml:23-29 — a horizontal StackPanel, Spacing="8". -->
			<div class="button-row">
				<!-- :24-26 — Style="{StaticResource AccentButtonStyle}". -->
				<Button variant="accent">Add sample tasks</Button>
				<!-- :27-28. -->
				<Button>Clear all items</Button>
			</div>
		</div>
	</ControlExample>

	<ControlExample
		headerText={customGroupSample.header ?? undefined}
		csharp={customGroupSample.csharp ?? undefined}
	>
		<div class="example-column" data-vertical-alignment="stretch">
			<!-- JumpListPage.xaml:35-36. -->
			<p class="winui-BodyTextBlockStyle">
				Custom groups let you organize jump list items into named sections. Set the GroupName
				property to a non-empty string and all items sharing the same GroupName will appear together
				under that heading. This is useful for grouping related items like recent projects, pinned
				documents, or user-defined categories.
			</p>
			<!-- :37-38. -->
			<Button>Add custom group items</Button>
		</div>
	</ControlExample>
</ItemPage>

<style>
	/* JumpListPage.xaml:16 — Margin="0,12,0,0". */
	.lead {
		margin: 12px 0 0;
	}
	/* JumpListPage.xaml:20, :34 — StackPanel Spacing="8". */
	.example-column {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 8px;
	}
	/* JumpListPage.xaml:23 — Orientation="Horizontal" Spacing="8". */
	.button-row {
		display: flex;
		gap: 8px;
	}
	/* Spacing="8" is the only gap between a StackPanel's children; an HTML paragraph's own
	   margin would add to it. */
	.example-column p {
		margin: 0;
	}
</style>
