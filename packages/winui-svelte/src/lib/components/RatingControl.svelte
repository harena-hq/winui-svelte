<script lang="ts" module>
	export interface RatingControlProps {
		/** Caption. Rendered to the right of the stars. */
		caption?: string;
		/** InitialSetValue — the value a keyboard increase from unset produces. */
		initialSetValue?: number;
		/** IsClearEnabled, polarity kept. Clicking the current value clears it back to unset. */
		clearEnabled?: boolean;
		/**
		 * IsReadOnly, polarity kept. It gates interaction and nothing else: `RatingControl.cpp`
		 * tests it only on the pointer and key paths (`:839`, `:856`, `:907`, `:920`, `:980`),
		 * and never to choose a visual state.
		 */
		readonly?: boolean | null;
		/** IsEnabled, inverted into HTML's name, which ADR 0009's reserved set requires. */
		disabled?: boolean | null;
		/** MaxRating — how many stars. */
		maxRating?: number;
		/** PlaceholderValue. `-1` means none; another value fills placeholder stars while unset. */
		placeholderValue?: number;
		/** Value. `-1` is XAML's sentinel for unset (`RatingControl.cpp:23`). Bindable. */
		value?: number;
		/** ValueChanged. */
		onValueChange?: (value: number) => void;
		class?: import('svelte/elements').ClassValue | null;
		style?: string | null;
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}

	// ItemInfo is deliberately absent: RatingItemFontInfo and RatingItemImageInfo respectively
	// carry six glyph and six image slots. The Gallery sets neither, so the default font info is
	// transcribed directly; image-based items belong to a later unit.
	//
	// `RatingControlCaptionTopMargin` is not read here and is not emitted either, which is a
	// decision rather than an oversight. `RatingControl.cpp:1263-1273` looks the resource up into
	// `m_captionTopMargin`, and that field is assigned in three places and read in none —
	// `RatingControl.h:171` even gives it a different default, `-6`, that nothing applies. The
	// caption's vertical position comes from its `VerticalAlignment="Center"`
	// (`RatingControl.xaml:61`), which a flex `align-items: center` already is. Emitting the key
	// and applying it would move the caption 12.5px that upstream does not move it.
</script>

<script lang="ts">
	let {
		caption,
		initialSetValue = 1,
		clearEnabled = true,
		readonly = false,
		disabled = false,
		maxRating = 5,
		placeholderValue = -1,
		value = $bindable(-1),
		onValueChange,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: RatingControlProps = $props();

	const stars = $derived(
		Array.from({ length: Math.max(0, Math.floor(maxRating)) }, (_, index) => index)
	);
	const shownValue = $derived(value < 0 ? placeholderValue : value);
	const placeholder = $derived(value < 0 && placeholderValue >= 0);

	function filledPercent(index: number) {
		if (shownValue < 0 || index >= shownValue) return 0;
		return Math.min(1, shownValue - index) * 100;
	}

	function setRating(newRating: number, fromPointer = false) {
		const maximum = Math.max(0, maxRating);
		const next = Math.min(maximum, Math.max(0, newRating));
		const oldValue = value;
		let updated = oldValue;
		// RatingControl.cpp:584-613 — all pointer and key paths use SetRatingTo.
		if (oldValue > -1 || next !== 0) {
			if (!clearEnabled && next <= 0) updated = 1;
			else if (next === oldValue && clearEnabled && (next !== maximum || fromPointer)) updated = -1;
			else if (next > 0) updated = next;
			else updated = -1;
		}
		if (updated !== oldValue) {
			value = updated;
			onValueChange?.(updated);
		}
	}

	function onRootClick(event: MouseEvent) {
		if (readonly || disabled) return;
		const glyph = (event.target as Element).closest<HTMLElement>('[data-rating-index]');
		if (glyph) setRating(Number(glyph.dataset.ratingIndex) + 1, true);
	}

	function onKeydown(event: KeyboardEvent) {
		if (readonly || disabled) return;
		const rtl = getComputedStyle(event.currentTarget as HTMLElement).direction === 'rtl';
		let key = event.key;
		if (key === 'ArrowUp') key = 'ArrowRight';
		if (key === 'ArrowDown') key = 'ArrowLeft';
		if (rtl && key === 'ArrowLeft') key = 'ArrowRight';
		else if (rtl && key === 'ArrowRight') key = 'ArrowLeft';
		if (key === 'ArrowLeft') {
			event.preventDefault();
			setRating(value - 1);
		} else if (key === 'ArrowRight') {
			event.preventDefault();
			// The Gallery only uses InitialSetValue=1. From unset upstream's increase selects it.
			setRating(value < 0 ? initialSetValue : value + 1);
		} else if (key === 'Home') {
			event.preventDefault();
			setRating(0);
		} else if (key === 'End') {
			event.preventDefault();
			setRating(maxRating);
		}
	}
</script>

<div
	bind:this={ref}
	class={['root', className]}
	{style}
	role="slider"
	aria-valuemin="0"
	aria-valuemax={maxRating}
	aria-valuenow={value < 0 ? 0 : value}
	aria-readonly={readonly ? 'true' : undefined}
	aria-disabled={disabled ? 'true' : undefined}
	tabindex={readonly || disabled ? undefined : 0}
	data-placeholder={placeholder || undefined}
	data-disabled={disabled || undefined}
	onkeydown={onKeydown}
	onclick={onRootClick}
	{...rest}
>
	<div class="stars">
		<div class="row background">
			{#each stars as index (index)}<span class="glyph" data-rating-index={index}>&#xE734;</span
				>{/each}
		</div>
		<div class="row foreground">
			{#each stars as index (index)}
				<!-- RatingControl.cpp:334-363 clips each foreground star; it does not scale it. -->
				<span
					class="glyph"
					data-rating-index={index}
					style:clip-path={`inset(0 ${100 - filledPercent(index)}% 0 0)`}>&#xE735;</span
				>
			{/each}
		</div>
	</div>
	{#if caption}
		<!-- PersonPicture.svelte's `.initials` is the measured Tight precedent; TextBlock exposes no TextLineBounds yet, so this transcribes its reference-capture CSS equivalent. -->
		<span class="caption">{caption}</span>
	{/if}
	<!-- WD-082: no transform is written. RatingControl.cpp:380-388 uses a live, per-star composition expression; the 0.5 resting floor is reproduced by the 16px glyph size. -->
</div>

<style>
	.root {
		display: inline-flex;
		align-items: center;
		/* c1-allow: RatingControl.xaml:4, the style's own `MinHeight="32"`. It equals the
		   rendering font size by coincidence, not by reference, so it is written as itself. */
		min-height: 32px;
	}
	.stars {
		position: relative;
	}
	/* A flat 8px gap, where upstream computes one — and the two land on the same pitch, which is
	   worth writing down because the coincidence looks like a mistake.

	   `RatingControl.cpp:249-268` measures the first item and sets the StackPanel's Spacing to
	   `ItemSpacing() - (itemWidth - fontSize)`. The item is a 32px glyph with `Margin="-8,-8,0,0"`
	   (`RatingControl_themeresources.xaml:44`), so its layout width is `advance - 8`; Segoe Fluent
	   Icons gives the star a square em box, measured 32px at font-size 32, so that is 24, and
	   `24 - 16` is 8. The computed Spacing is therefore `8 - 8 = 0` and the pitch is the item's own
	   24. Here a 16px glyph plus an 8px gap is 24 as well — measured on the guest, pitch 24 and
	   caption gap 4, against the 4 the same arithmetic gives `c_captionSpacing - 8` at `:257`.

	   It follows that this gap is only right while the glyph's advance equals its font size. A
	   custom `ItemInfo` with a non-square glyph would need the measurement, which is one of the
	   reasons that member is unbuilt. */
	.row {
		display: flex;
		gap: var(--winui-RatingControlItemSpacing);
	}
	/* Which layer takes the pointer is transcribed, not chosen, and getting it wrong breaks the
	   control rather than shifting it. `RatingControl.xaml:67` puts `IsHitTestVisible="False"` on
	   the ForegroundContentPresenter and `:70` repeats it on the foreground StackPanel, while
	   `:56` gives the *background* panel `Background="Transparent"` — which in XAML is how a panel
	   asks to be hit at all. So every pointer lands on a background star.

	   Without this the foreground row, which is absolutely positioned over the whole strip,
	   intercepts everything. A star clipped to zero paints nothing but its row still takes the
	   click, `closest('[data-rating-index]')` finds no star, and **an empty star cannot be
	   clicked** — the rating can be lowered and never raised. Found by a click test, not by a
	   gate: every computed-style and geometry assertion passes either way. */
	.foreground {
		position: absolute;
		inset: 0;
		pointer-events: none;
		color: var(--winui-RatingControlSelectedForeground);
	}
	.background {
		color: var(--winui-RatingControlUnselectedForeground);
	}
	/* RatingControl.xaml:61 — the caption is IsHitTestVisible="False" too. */
	.caption {
		pointer-events: none;
	}
	.glyph {
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: RatingControl.cpp:380-388's expression rests at its 0.5 floor: 32px × 0.5 = 16px. */
		font-size: calc(var(--winui-RatingControlFontSizeForRendering) * 0.5);
		/* c1-allow: a single em line box keeps the overlaid SymbolThemeFont glyph rows coincident. */
		line-height: 1;
	}
	.root[data-placeholder] .foreground {
		color: var(--winui-RatingControlPlaceholderForeground);
	}
	.root:hover .background {
		color: var(--winui-RatingControlPointerOverUnselectedForeground);
	}
	.root[data-placeholder]:hover .foreground {
		color: var(--winui-RatingControlPointerOverPlaceholderForeground);
	}
	/* RatingControl_themeresources.xaml:44 aliases PointerOverSelectedForeground to normal. */
	.root:not([data-placeholder]):hover .foreground {
		color: var(--winui-RatingControlSelectedForeground);
	}
	/* RatingControl.cpp:329-333 — only `!IsEnabled()` reaches the Disabled visual state.
	   `IsReadOnly` never does: it appears in that file as a guard on the interaction paths and
	   nowhere in the state machine, so a read-only control keeps its Set colour. */
	.root[data-disabled] .foreground {
		color: var(--winui-RatingControlDisabledSelectedForeground);
	}
	.caption {
		/* c1-allow: RatingControl.xaml:61, the caption's Margin="4,0,20,0". */
		margin: 0 20px 0 4px;
		/* c1-allow: RatingControl.xaml:61, CaptionTextBlockStyle FontSize="12". */
		font-size: 12px;
		line-height: normal;
		text-box: trim-both cap alphabetic;
		color: var(--winui-RatingControlCaptionForeground);
	}

	/* A contrast theme: the tokens are the high-contrast theme, so the browser's forcing is off
	   for what this draws. ADR 0005. */
	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
	}
</style>
