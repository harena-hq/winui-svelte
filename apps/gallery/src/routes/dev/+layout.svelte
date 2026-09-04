<script lang="ts">
	let { children } = $props();
</script>

<div class="dev">
	{@render children()}
</div>

<style>
	/* c1-allow: the harness's own gutter; no WinUI resource names it */
	.dev {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		padding: 24px;
	}
</style>
