<script lang="ts" module>
	export interface CopyButtonProps {
		/** The text a click writes to the clipboard. */
		text: string;
		/** CopiedMessage. Announced to assistive technology after a successful copy. */
		copiedMessage?: string;
		class?: string;
		style?: string;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import { Button } from 'winui-svelte';

	// `Content="&#xE8C8;"` on the button and `Glyph="&#xE73E;"` on the CopySuccessGlyph
	// presenter inside its template — CopyButton.xaml. Written as escapes rather than as the
	// characters themselves: a private-use code point is invisible to a diff, to grep and to
	// any reader without Segoe Fluent Icons installed, which is most of them.
	const COPY_GLYPH = '\uE8C8';
	const SUCCESS_GLYPH = '\uE73E';

	let {
		text,
		copiedMessage = 'Copied to clipboard',
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: CopyButtonProps = $props();

	let copied = $state(false);
	let clearCopied: ReturnType<typeof setTimeout> | undefined;

	async function writeToClipboard(): Promise<boolean> {
		if (navigator.clipboard !== undefined) {
			try {
				await navigator.clipboard.writeText(text);
				return true;
			} catch {
				// The Clipboard API can be present but unavailable without user permission.
			}
		}

		// The reference harness is served from insecure http://10.0.2.2:4173, where the
		// Clipboard API is absent; use the legacy, user-gesture clipboard path there.
		const textarea = document.createElement('textarea');
		textarea.value = text;
		textarea.setAttribute('readonly', '');
		textarea.style.position = 'fixed';
		textarea.style.opacity = '0';
		textarea.style.pointerEvents = 'none';
		document.body.append(textarea);
		textarea.select();
		try {
			return document.execCommand('copy');
		} catch {
			return false;
		} finally {
			textarea.remove();
		}
	}

	async function copy(): Promise<void> {
		if (!(await writeToClipboard())) return;
		copied = false;
		if (clearCopied !== undefined) clearTimeout(clearCopied);
		requestAnimationFrame(() => {
			copied = true;
			clearCopied = setTimeout(() => {
				copied = false;
			}, 1433);
		});
	}
</script>

<div bind:this={ref} class={['root', className]} {style} {...rest}>
	<Button
		class="copy-button"
		aria-label="Copy to clipboard"
		title="Copy to clipboard"
		onclick={copy}
	>
		<span class="glyph content" class:copied>{COPY_GLYPH}</span>
		<span class="glyph success" class:copied>{SUCCESS_GLYPH}</span>
		<span class="announcement" aria-live="polite">{copied ? copiedMessage : ''}</span>
	</Button>
</div>

<style>
	/* The one rule that has to cross a component boundary: `class` handed to `Button` reaches
	   its `<button>` without this component's scope hash, so the button itself is addressed
	   globally from inside the wrapper. Everything below is our own markup and stays scoped. */
	.root :global(.copy-button) {
		display: grid;
		padding: 6px;
		/* c1-allow: CopyButton.xaml:32 sets FontSize="16" in DefaultCopyButtonStyle */
		font-size: 16px;
		font-family: var(--winui-SymbolThemeFontFamily);
		font-weight: normal;
	}

	.glyph {
		grid-area: 1 / 1;
		display: block;
		transform-origin: center;
	}

	.content {
		opacity: 1;
		transform: scale(1);
	}

	.success {
		opacity: 0;
		transform: scale(1);
	}

	.content.copied {
		animation-name: content-opacity, content-scale;
		/* c1-allow: CopyButton.xaml:63 and :80, the storyboard durations are 1.433s and 1.2s */
		animation-duration: 1.433s, 1.2s;
		animation-fill-mode: both;
	}

	.success.copied {
		animation-name: success-opacity, success-scale;
		/* c1-allow: CopyButton.xaml:97 and :114, the storyboard durations are 1.3s and 0.333s */
		animation-duration: 1.3s, 0.333s;
		animation-fill-mode: both;
	}

	@keyframes content-opacity {
		0% {
			opacity: 1;
			animation-timing-function: cubic-bezier(0.33, 0, 0.67, 1);
		}
		9.281% {
			opacity: 0;
			animation-timing-function: steps(1, end);
		}
		90.719% {
			opacity: 0;
			animation-timing-function: cubic-bezier(1, 0, 1, 1);
		}
		100% {
			opacity: 1;
		}
	}

	@keyframes content-scale {
		0% {
			transform: scale(1);
			animation-timing-function: cubic-bezier(0.13, 0, 0, 1);
		}
		11.083% {
			transform: scale(0.273);
			animation-timing-function: steps(1, end);
		}
		97.25% {
			transform: scale(0.273);
			animation-timing-function: linear;
		}
		100% {
			transform: scale(1);
		}
	}

	@keyframes success-opacity {
		0% {
			opacity: 0;
			animation-timing-function: steps(1, end);
		}
		10.231% {
			opacity: 0;
			animation-timing-function: cubic-bezier(0.33, 0, 0.67, 1);
		}
		20.538% {
			opacity: 1;
			animation-timing-function: steps(1, end);
		}
		89.769% {
			opacity: 1;
			animation-timing-function: cubic-bezier(1, 0, 0.98, 1);
		}
		100% {
			opacity: 0;
		}
	}

	@keyframes success-scale {
		0% {
			transform: scale(1);
			animation-timing-function: steps(1, end);
		}
		39.94% {
			transform: scale(0.385);
			animation-timing-function: cubic-bezier(0.39, 0, 0.63, 1);
		}
		80.18% {
			transform: scale(1.146);
			animation-timing-function: cubic-bezier(0.55, 0, 0.02, 1);
		}
		100% {
			transform: scale(1);
		}
	}

	.announcement {
		position: absolute;
		width: 1px;
		height: 1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}
</style>
