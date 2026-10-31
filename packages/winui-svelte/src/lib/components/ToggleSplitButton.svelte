<script lang="ts" module>
	import type { SplitButtonProps } from './SplitButton.svelte';

	export interface ToggleSplitButtonProps extends SplitButtonProps {
		/** IsChecked — ADR 0009's boolean, and the toggle the primary half performs. */
		checked?: boolean | null;
		/** The change callback ADR 0009 pairs with `checked`. */
		onCheckedChange?: (checked: boolean) => void;
	}
</script>

<script lang="ts">
	import SplitButton from './SplitButton.svelte';

	let {
		checked = $bindable(false),
		onCheckedChange,
		onclick,
		open = $bindable(false),
		ref = $bindable(null),
		...rest
	}: ToggleSplitButtonProps = $props();

	function click(event: MouseEvent) {
		checked = !checked;
		onCheckedChange?.(checked);
		onclick?.(event);
	}
</script>

<SplitButton bind:ref checked={checked ?? false} toggle onclick={click} bind:open {...rest} />
