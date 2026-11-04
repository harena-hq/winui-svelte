<script lang="ts">
	import { Button, ComboBox, Expander, TextBox, ToggleSwitch } from '@harena-hq/winui-svelte';
	import { CheckBox, Span, ToggleButton } from '@harena-hq/winui-svelte/preview';
	import type { HTMLButtonAttributes, HTMLInputAttributes } from 'svelte/elements';

	// What a wrapper forwarding `svelte/elements` attributes holds: `T | null | undefined`. That this
	// page compiles against the built package, by name and by a spread, is half of ADR 0009's rule,
	// and the spec is the other.
	const button: HTMLButtonAttributes = { disabled: null };
	const input: HTMLInputAttributes = { disabled: null, placeholder: null, readonly: null };
</script>

<svelte:head><title>Null attributes — harness</title></svelte:head>

<Button disabled={button.disabled}>Button</Button>
<Button {...button}>Spread</Button>
<TextBox {...input} aria-label="Spread box" />
<ToggleSwitch {...input} aria-label="Spread switch" />
<CheckBox {...input} aria-label="Spread check" />
<ToggleButton checked={null} data-toggle>Toggle</ToggleButton>
<Button class={['mine', null]} style={null}>Classes</Button>
<Span class={null} style={null}>Span</Span>
<TextBox disabled={input.disabled} placeholder={input.placeholder} readonly={input.readonly} />
<ToggleSwitch disabled={input.disabled} aria-label="Switch" />
<ComboBox disabled={input.disabled} placeholder={input.placeholder} aria-label="Combo" items={[]} />
<Expander disabled={button.disabled}>
	{#snippet header()}Expander{/snippet}
	Content
</Expander>
