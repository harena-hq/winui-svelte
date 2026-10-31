<script lang="ts">
	import { provideStrings, ToggleSwitch } from 'winui-svelte';

	provideStrings({ TEXT_TOGGLESWITCH_OFF: 'Aus' });
</script>

<div data-nested><ToggleSwitch aria-label="Nested" /></div>
