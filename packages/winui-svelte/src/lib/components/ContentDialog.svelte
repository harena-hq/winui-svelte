<script lang="ts" module>
	import type { Snippet } from 'svelte';

	/** `ContentDialogButton`, lower-cased. Which command button is drawn as the accent one. */
	export type ContentDialogButton = 'none' | 'primary' | 'secondary' | 'close';

	export interface ContentDialogProps {
		/** Title. Narrowed to a string: `object` has no Svelte analogue that a `Snippet` does not
		 * already cover, and the content slot is the snippet. */
		title?: string;
		/** Content. */
		children?: Snippet;
		/** PrimaryButtonText. A button with no text is not drawn, which is `PrimaryVisible` and
		 * the states beside it. */
		primaryButtonText?: string;
		/** SecondaryButtonText. */
		secondaryButtonText?: string;
		/** CloseButtonText. */
		closeButtonText?: string;
		/** DefaultButton. */
		defaultButton?: ContentDialogButton;
		/** IsPrimaryButtonEnabled, inverted — ADR 0009. */
		primaryButtonDisabled?: boolean;
		/** IsSecondaryButtonEnabled, inverted — ADR 0009. */
		secondaryButtonDisabled?: boolean;
		/** `ShowAsync`/`Hide` as state. ADR 0009 maps a control's own state to a bindable prop. */
		open?: boolean;
		/** No WinUI member: ADR 0009 pairs every `$bindable` prop with its own change callback.
		 * `Opened`, `Closing` and `Closed` are recoverable from it. */
		onOpenChange?: (open: boolean) => void;
		/** PrimaryButtonClick. `ContentDialogResult.Primary` is which callback ran. */
		onPrimaryButtonClick?: () => void;
		/** SecondaryButtonClick. */
		onSecondaryButtonClick?: () => void;
		/** CloseButtonClick. `ContentDialogResult.None` is this one. */
		onCloseButtonClick?: () => void;
		class?: string;
		style?: string;
		/** ADR 0009's `ref` points at the interactive element: here, the card. */
		ref?: HTMLElement | null;
		[key: string]: unknown;
	}

	// `TitleTemplate`, `ContentTemplate`, `PrimaryButtonStyle`, `SecondaryButtonStyle` and
	// `CloseButtonStyle` are absent: a Svelte consumer restyles through `class`, `style` and the
	// token cascade, which is ADR 0002, and templates a slot with a snippet.
	// `PrimaryButtonCommand` and the `*CommandParameter` members are absent: `ICommand` is a
	// binding contract, and the callback above is the whole of it that reaches the screen.
	// `FullSizeDesired` is absent. It is one visual state, `FullDialogSizing`, which stretches the
	// card vertically; it is not what this unit measures and no Gallery example sets it.
	// `XamlRoot` is absent: a browser tab has one root and the portal goes to it.
</script>

<script lang="ts">
	import { Dialog } from 'bits-ui';
	import Button from './Button.svelte';

	let {
		title,
		children,
		primaryButtonText,
		secondaryButtonText,
		closeButtonText,
		defaultButton = 'none',
		primaryButtonDisabled = false,
		secondaryButtonDisabled = false,
		open = $bindable(false),
		onOpenChange,
		onPrimaryButtonClick,
		onSecondaryButtonClick,
		onCloseButtonClick,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ContentDialogProps = $props();

	const buttonCount = $derived(
		[primaryButtonText, secondaryButtonText, closeButtonText].filter(Boolean).length
	);

	function dismiss(callback?: () => void) {
		callback?.();
		open = false;
	}
</script>

<Dialog.Root
	{open}
	onOpenChange={(value) => {
		open = value;
		onOpenChange?.(value);
	}}
>
	<Dialog.Portal>
		<Dialog.Overlay>
			{#snippet child({ props })}
				<div {...props} class="smoke"></div>
			{/snippet}
		</Dialog.Overlay>
		<div class="layout">
			<Dialog.Content
				interactOutsideBehavior="ignore"
				onOpenAutoFocus={(event) => {
					// The primitive focuses the first focusable descendant, which in the Gallery's
					// dialog is the CheckBox in the content — and a CheckBox that has focus draws its
					// focus visual. WinUI moves focus into the dialog too, but its `FocusState` says
					// whether focus arrived from the keyboard, and it draws the visual only when it
					// did; a dialog shown from a click lights nothing. `:focus-visible` cannot be told
					// which it was. Focusing the dialog's own root is what WinUI does when
					// `DefaultButton` is `None`: focus is inside the trap, Tab reaches the buttons in
					// order, and no control is lit. WD-015.
					event.preventDefault();
					ref?.focus();
				}}
			>
				{#snippet child({ props })}
					<div
						{...props}
						bind:this={ref}
						class={['card', 'winui-BodyTextBlockStyle', className]}
						{style}
						{...rest}
					>
						<div class="scroll">
							<div class="upper">
								{#if title}
									<Dialog.Title>
										{#snippet child({ props: titleProps })}
											<div {...titleProps} class="title">{title}</div>
										{/snippet}
									</Dialog.Title>
								{/if}
								<div class="content">{@render children?.()}</div>
							</div>
						</div>
						{#if buttonCount > 0}
							<div class="commands" data-count={buttonCount}>
								{#if primaryButtonText}
									<Button
										variant={defaultButton === 'primary' ? 'accent' : 'default'}
										disabled={primaryButtonDisabled}
										onclick={() => dismiss(onPrimaryButtonClick)}
									>
										{primaryButtonText}
									</Button>
								{/if}
								{#if secondaryButtonText}
									<Button
										variant={defaultButton === 'secondary' ? 'accent' : 'default'}
										disabled={secondaryButtonDisabled}
										onclick={() => dismiss(onSecondaryButtonClick)}
									>
										{secondaryButtonText}
									</Button>
								{/if}
								{#if closeButtonText}
									<Button
										variant={defaultButton === 'close' ? 'accent' : 'default'}
										onclick={() => dismiss(onCloseButtonClick)}
									>
										{closeButtonText}
									</Button>
								{/if}
							</div>
						{/if}
					</div>
				{/snippet}
			</Dialog.Content>
		</div>
	</Dialog.Portal>
</Dialog.Root>

<style>
	/* ContentDialog_themeresources.xaml:222 — LayoutRoot's smoke rectangle fills the window. */
	.smoke {
		position: fixed;
		inset: 0;
		background: var(--winui-ContentDialogSmokeFill);
	}

	/* ContentDialog_themeresources.xaml:221 — LayoutRoot is the centred, full-window layer. */
	.layout {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	/* ContentDialog_themeresources.xaml:223 — BackgroundElement is the bordered dialog card;
	   clipping is needed because the top overlay would otherwise square its rounded corners. */
	.card {
		pointer-events: auto;
		box-sizing: border-box;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		min-width: var(--winui-ContentDialogMinWidth);
		max-width: var(--winui-ContentDialogMaxWidth);
		min-height: var(--winui-ContentDialogMinHeight);
		max-height: var(--winui-ContentDialogMaxHeight);
		border-style: solid;
		border-width: var(--winui-ContentDialogBorderWidth);
		border-color: var(--winui-ContentDialogBorderBrush);
		border-radius: var(--winui-OverlayCornerRadius);
		/* WD-012: WinUI's dialog host casts this card's shadow onto the smoke layer. No pinned
		   resource states its recipe, so this portalled surface deliberately draws no
		   `box-shadow`; see docs/divergences.md.

		   `padding-box` is `BackgroundSizing="InnerBorderEdge"` on `BackgroundElement`
		   (ContentDialog_themeresources.xaml:223). It matters here rather than being a
		   formality: `ContentDialogBorderBrush` resolves to `SurfaceStrokeColorDefaultBrush`,
		   which is 40% alpha, so a fill clipped to the border box composites the ring against
		   the card instead of against the smoke behind it. Every other `InnerBorderEdge` site
		   in this library writes `padding-box`; this one did not. */
		background: var(--winui-ContentDialogBackground) padding-box;
		color: var(--winui-ContentDialogForeground);
		/* The card is `tabindex="-1"`, so nothing but the open handler above ever focuses it and
		   it is not in the tab order. The browser still paints its own ring there, and WinUI's
		   dialog draws none. */
		outline: none;
	}

	/* ContentDialog_themeresources.xaml:232 — ContentScrollViewer owns the scrollable area, and
	   :227's `DialogSpace` gives it the star row, so it takes every pixel the command row does
	   not. A ScrollViewer stretches its content, and the Grid at :233 sets no VerticalAlignment,
	   so the overlay and the separator it carries reach the bottom of that row rather than
	   stopping at the content. Without the flex column below, a dialog shorter than
	   `ContentDialogMinHeight` would draw the separator against its text and leave a band of
	   card fill between the separator and the commands. */
	.scroll {
		flex: 1 1 auto;
		min-height: 0;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
	}

	/* ContentDialog_themeresources.xaml:233 — the upper Grid receives overlay, padding, and separator. */
	.upper {
		/* Stretched by the rule above; `flex-shrink: 0` so taller content scrolls instead. */
		flex: 1 0 auto;
		background: var(--winui-ContentDialogTopOverlay);
		padding: var(--winui-ContentDialogPadding);
		border-style: solid;
		border-width: var(--winui-ContentDialogSeparatorThickness);
		border-color: var(--winui-ContentDialogSeparatorBorderBrush);
	}

	/* ContentDialog_themeresources.xaml:238 — Title is the fixed-size, semibold heading. The
	   template writes FontSize="20" and FontWeight="SemiBold" directly; although
	   SubtitleTextBlockStyle uses the same pair, it names the Display family and does not measure
	   like this ContentControl. */
	.title {
		margin: var(--winui-ContentDialogTitleMargin);
		/* c1-allow: ContentDialog_themeresources.xaml:238 */
		font-size: 20px;
		/* c1-allow: ContentDialog_themeresources.xaml:238 */
		font-weight: 600;
		/* The title and content use the font's own line spacing; the Body ramp only supplies the
		   family and size because neither upstream presenter carries a TextBlock style. That keeps
		   the measured title box at 27px rather than the ramp's 28px step. */
		line-height: normal;
	}

	/* ContentDialog_themeresources.xaml:245 — ContentPresenter wraps content with font-native spacing. */
	.content {
		/* `winui-BodyTextBlockStyle` supplies family and size, but not a line-height override: the
		   ContentPresenter has no TextBlock style. This preserves the measured 19px body line. */
		line-height: normal;
	}

	/* ContentDialog_themeresources.xaml:248 — CommandSpace separates and pads the command row. */
	.commands {
		flex: none;
		/* The command row is laid out in the width the dialog already has and does not widen it.
		   Upstream's star columns are equal shares with each child's natural width as a floor —
		   measured on the original, `Save` / `Don't Save` / `Cancel` come out 85 / 91 / 78 inside
		   a 320 card, because the middle one needs more than the 84.67 an equal share gives and
		   takes it from the others, while `Replace` / `Keep` / `Cancel` all fit and come out
		   85 / 85 / 84. `repeat(n, 1fr)` reproduces that distribution exactly, once the width is
		   fixed. What it does not reproduce is XAML's measure pass, which asks the buttons for
		   their natural widths and sums them; CSS sizes an `fr` track set by the *largest*
		   contribution times the track count, so the row asked for 3 x 90.34 and grew the card to
		   337 against the original's 320. `contain: inline-size` is what takes the row out of
		   that measurement. WD-014 records what it costs. */
		contain: inline-size;
		padding: var(--winui-ContentDialogPadding);
		background: var(--winui-ContentDialogBackground);
		display: grid;
		/* ContentDialogButtonSpacing is a GridLength at ContentDialog_themeresources.xaml:16;
		   the token layer emits no equivalent, so the measured 8px track gap stays local. */
		gap: 8px;
	}

	/* ContentDialog_themeresources.xaml:144 onward — one and two visible buttons keep two star tracks. */
	.commands[data-count='1'],
	.commands[data-count='2'] {
		grid-template-columns: 1fr 1fr;
	}

	/* ContentDialog_themeresources.xaml:144 onward — three visible buttons use three equal tracks. */
	.commands[data-count='3'] {
		grid-template-columns: 1fr 1fr 1fr;
	}

	/* ContentDialog_themeresources.xaml:144 onward — one visible button occupies the right star
	   track. `CloseVisible`, `PrimaryVisible` and `SecondaryVisible` each collapse the other two
	   buttons and leave `PrimaryColumn`'s star empty, so a lone button is half the width and sits
	   at the right rather than filling the row.

	   `:global` because the child is a `Button`, and a scoped `> *` compiles to a selector that
	   requires this component's scoping class on the child — which another component's root
	   element never carries. Without it the rule matches nothing and the button silently draws in
	   the left half; measured on the guest at 25px from the card's left edge, where it belongs at
	   164. */
	.commands[data-count='1'] > :global(*) {
		grid-column: 2;
	}
</style>
