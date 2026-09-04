<script lang="ts">
	let { children } = $props();
</script>

<div class="dev">
	{@render children()}
</div>

<style>
	/* c1-allow: the harness's own gutter; no WinUI resource names it */
	.dev {
		padding: 24px;
	}
</style>
