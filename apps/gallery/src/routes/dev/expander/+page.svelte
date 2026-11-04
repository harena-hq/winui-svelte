<script lang="ts">
	import { Expander } from '@harena-hq/winui-svelte/preview';
</script>

<svelte:head><title>Expander — harness</title></svelte:head>

<h1 class="winui-TitleTextBlockStyle">Expander</h1>
<p class="winui-BodyTextBlockStyle">Headers that reveal content above or below themselves.</p>

<h2 class="winui-SubtitleTextBlockStyle">down</h2>
<div class="row">
	<Expander open={false} expandDirection="down" header={standardHeader}>
		This is in the content
	</Expander>
	<Expander open={true} expandDirection="down" header={standardHeader}>
		This is in the content
	</Expander>
</div>

<h2 class="winui-SubtitleTextBlockStyle">up</h2>
<div class="row">
	<Expander open={false} expandDirection="up" header={standardHeader}>
		This is in the content
	</Expander>
	<Expander open={true} expandDirection="up" header={standardHeader}>
		This is in the content
	</Expander>
</div>

<h2 class="winui-SubtitleTextBlockStyle">alignment</h2>
<div class="row">
	<!-- c1-allow: ADR 0002 — a consumer restyles through the token cascade, and setting a
	     token on an ancestor is the mechanism the ADR promises; the rule this exempts is about
	     a component baking a literal into a token for everybody, which this is not.
	     This is the Gallery's second example, whole: `Width="500"`, `Padding="0"` and
	     `HorizontalContentAlignment="Left"`, with the sample's own 4px margin on the text.
	     `Padding` is not a prop and does not need to be — `Expander.xaml:114` binds the content
	     border's `Padding` to the control's, so the token reaches it by inheritance. Measured on
	     the reference guest: the content is 48 tall with the override and 52 without, and the
	     original's second example is 48. -->
	<div style="--winui-ExpanderContentPadding: 0">
		<Expander
			open={true}
			style="width: 500px"
			horizontalContentAlignment="left"
			header={centeredHeader}
		>
			<span style="margin: 4px">And this text is left aligned</span>
		</Expander>
	</div>
</div>

<h2 class="winui-SubtitleTextBlockStyle">disabled</h2>
<div class="row">
	<Expander open={false} disabled header={standardHeader}>This is in the content</Expander>
	<Expander open={true} disabled header={standardHeader}>This is in the content</Expander>
</div>

{#snippet centeredHeader()}
	<!-- `display: block` is load-bearing: the header presenter is `HorizontalContentAlignment
	     Stretch`, so its child fills the row, and `text-align` on an inline span centres
	     nothing. The Gallery's second example is about this alignment, so a span that only
	     looks centred in the source would make the section photograph the default. -->
	<span style="display: block; text-align: center">This text is in the header</span>
{/snippet}

{#snippet standardHeader()}
	This text is in the header
{/snippet}

<style>
	.row {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: 24px;
		background: var(--winui-ApplicationPageBackgroundThemeBrush);
	}
</style>
