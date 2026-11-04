<script lang="ts">
	import { provideStrings, ToggleSwitch } from '@harena-hq/winui-svelte';

	provideStrings({ TEXT_TOGGLESWITCH_OFF: 'Aus' });
</script>

<div data-nested><ToggleSwitch aria-label="Nested" /></div>
