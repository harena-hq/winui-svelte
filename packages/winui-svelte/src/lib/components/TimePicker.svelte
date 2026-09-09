<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface TimePickerProps {
		/** TimePicker.SelectedTime. The date portion of this native Date is ignored. */
		time?: Date | undefined;
		/** TimePicker.SelectedTimeChanged. */
		onTimeChange?: ((time: Date | undefined) => void) | undefined;
		/** TimePicker.Header. */
		header?: Snippet | string | undefined;
		/** TimePicker.ClockIdentifier. */
		clockIdentifier?: '12HourClock' | '24HourClock' | undefined;
		/** TimePicker.MinuteIncrement. */
		minuteIncrement?: number;
		/** UIElement.IsEnabled. */
		disabled?: boolean;
		/** FrameworkElement.Language. */
		language?: string | undefined;
		class?: string;
		style?: string;
		/** The TimePicker root element. */
		ref?: HTMLDivElement | null;
		[key: string]: unknown;
	}
</script>

<script lang="ts">
	import { Popover } from 'bits-ui';
	import { isTwelveHourClock, localeOf } from '../internal/datetime';
	import LoopingSelector from '../internal/LoopingSelector.svelte';

	type Field = 'hour' | 'minute' | 'period';
	type PendingTime = { hour: number; minute: number };

	let {
		time = $bindable(undefined),
		onTimeChange,
		header = undefined,
		clockIdentifier = undefined,
		minuteIncrement = 1,
		disabled = false,
		language = undefined,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: TimePickerProps = $props();

	const locale = $derived(localeOf(language));
	const twelveHour = $derived(isTwelveHourClock(locale, clockIdentifier));
	const visibleFields = $derived<Field[]>(
		twelveHour ? ['hour', 'minute', 'period'] : ['hour', 'minute']
	);
	const gridColumns = $derived(
		visibleFields
			.flatMap((_, index) => [index ? '1px' : '', '1fr'])
			.filter(Boolean)
			.join(' ')
	);
	const minutes = $derived(minuteItems(minuteIncrement));
	const hours = $derived(
		Array.from({ length: twelveHour ? 12 : 24 }, (_, index) =>
			String(twelveHour ? index + 1 : index)
		)
	);
	const periods = $derived(dayPeriods(locale));

	let open = $state(false);
	let button = $state<HTMLButtonElement | null>(null);
	let buttonWidth = $state(242);
	let buttonHeight = $state(30);
	let pending = $state<PendingTime>(partsOf(time ?? new Date()));

	/** The presenter's 398px outer box holds a 396px grid and a 41px action row. */
	const listHeight = 398 - 2 - 41;
	/** Its highlight centres over the control rather than the popover aligning to the control top. */
	const sideOffset = $derived(-(buttonHeight / 2 + 1 + listHeight / 2));

	$effect(() => {
		if (!Number.isInteger(minuteIncrement) || minuteIncrement < 0 || minuteIncrement > 59) {
			throw new Error('minuteIncrement must be an integer from 0 to 59');
		}
	});

	$effect(() => {
		if (!button) return;
		const observer = new ResizeObserver(() => {
			const bounds = button?.getBoundingClientRect();
			buttonWidth = bounds?.width ?? 242;
			buttonHeight = bounds?.height ?? 30;
		});
		observer.observe(button);
		buttonWidth = button.getBoundingClientRect().width;
		buttonHeight = button.getBoundingClientRect().height;
		return () => observer.disconnect();
	});

	// D32 deliberately keeps the public boundary a Date: a second time-only type would be the
	// one extra abstraction every consumer has to learn. TimePicker reads and writes hours/minutes only.
	function partsOf(value: Date): PendingTime {
		return { hour: value.getHours(), minute: value.getMinutes() };
	}

	function minuteItems(increment: number): string[] {
		const step = increment === 0 ? 60 : increment;
		return Array.from({ length: Math.ceil(60 / step) }, (_, index) =>
			String(index * step).padStart(2, '0')
		);
	}

	function dayPeriods(forLocale: string): string[] {
		const formatter = new Intl.DateTimeFormat(forLocale, { hour: 'numeric', hour12: true });
		return [new Date(2026, 0, 1, 9), new Date(2026, 0, 1, 21)].map(
			(value) =>
				formatter.formatToParts(value).find((part) => part.type === 'dayPeriod')?.value ?? ''
		);
	}

	function openFlyout() {
		if (disabled) return;
		pending = partsOf(time ?? new Date());
		open = true;
	}

	function dismiss() {
		open = false;
	}

	function accept() {
		const source = time ?? new Date();
		const next = new Date(
			source.getFullYear(),
			source.getMonth(),
			source.getDate(),
			pending.hour,
			pending.minute
		);
		time = next;
		onTimeChange?.(next);
		open = false;
	}

	function selectedIndex(field: Field): number {
		if (field === 'minute')
			return Math.max(0, minutes.indexOf(String(pending.minute).padStart(2, '0')));
		if (field === 'period') return pending.hour < 12 ? 0 : 1;
		return twelveHour ? (pending.hour + 11) % 12 : pending.hour;
	}

	function labels(field: Field): string[] {
		return field === 'hour' ? hours : field === 'minute' ? minutes : periods;
	}

	function setPending(field: Field, index: number) {
		if (field === 'minute')
			pending = { ...pending, minute: Number(minutes[index] ?? pending.minute) };
		else if (field === 'period')
			pending = { ...pending, hour: (pending.hour % 12) + (index === 0 ? 0 : 12) };
		else if (twelveHour)
			pending = { ...pending, hour: ((index + 1) % 12) + (pending.hour < 12 ? 0 : 12) };
		else pending = { ...pending, hour: index };
	}

	function closedText(field: Field): string {
		if (!time) return field === 'period' ? 'AM' : field;
		if (field === 'minute') return String(time.getMinutes()).padStart(2, '0');
		if (field === 'period') return periods[time.getHours() < 12 ? 0 : 1] ?? '';
		return String(twelveHour ? time.getHours() % 12 || 12 : time.getHours());
	}

	function onButtonKeydown(event: KeyboardEvent) {
		if (open && event.key === 'Escape') {
			event.preventDefault();
			dismiss();
		} else if (event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
			event.preventDefault();
			openFlyout();
		}
	}

	function onFlyoutKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			dismiss();
		} else if (
			event.key === 'Enter' ||
			event.key === ' ' ||
			(event.altKey && (event.key === 'ArrowUp' || event.key === 'ArrowDown'))
		) {
			event.preventDefault();
			accept();
		}
	}
</script>

<div bind:this={ref} class={['time-picker', className]} {style} {...rest}>
	{#if header !== undefined}
		<span class="header winui-BodyTextBlockStyle"
			>{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}</span
		>
	{/if}
	<Popover.Root bind:open>
		<Popover.Trigger>
			{#snippet child({ props })}
				<button
					{...props}
					bind:this={button}
					class:has-no-time={!time}
					class="flyout-button"
					type="button"
					{disabled}
					onclick={openFlyout}
					onkeydown={onButtonKeydown}
				>
					<div class="fields" style:grid-template-columns={gridColumns}>
						{#each visibleFields as field, index (field)}
							{#if index > 0}<i class="spacer" aria-hidden="true"></i>{/if}
							<span class="field">{closedText(field)}</span>
						{/each}
					</div>
				</button>
			{/snippet}
		</Popover.Trigger>
		<Popover.Portal>
			<Popover.Content side="bottom" align="center" avoidCollisions={false} {sideOffset}>
				{#snippet child({ props, wrapperProps })}
					<div {...wrapperProps}>
						<div
							{...props}
							class="presenter winui-BodyTextBlockStyle"
							style:width={`${buttonWidth}px`}
							onkeydown={onFlyoutKeydown}
						>
							<div class="content">
								<div class="host" style:grid-template-columns={gridColumns}>
									<div class="highlight" aria-hidden="true"></div>
									{#each visibleFields as field, index (field)}
										{#if index > 0}<i class="spacer flyout-spacer" aria-hidden="true"></i>{/if}
										<div class="selector">
											<LoopingSelector
												items={labels(field)}
												selectedIndex={selectedIndex(field)}
												onSelectedIndexChange={(index) => setPending(field, index)}
												shouldLoop={field !== 'period'}
												itemHeight={40}
												label={field}
											/>
										</div>
									{/each}
								</div>
								<div class="accept-dismiss">
									<i class="separator" aria-hidden="true"></i>
									<!-- Upstream's two separate Date/Time presenter templates are why this is not shared with DatePicker. -->
									<button class="accept" type="button" aria-label="Accept" onclick={accept}
										>&#xE8FB;</button
									>
									<button class="dismiss" type="button" aria-label="Dismiss" onclick={dismiss}
										>&#xE711;</button
									>
								</div>
							</div>
						</div>
					</div>
				{/snippet}
			</Popover.Content>
		</Popover.Portal>
	</Popover.Root>
</div>

<style>
	.time-picker {
		box-sizing: border-box;
		display: grid;
		grid-template-rows: auto auto;
		width: fit-content;
	}
	.header {
		max-width: var(--winui-TimePickerThemeMaxWidth);
		margin: var(--winui-TimePickerTopHeaderMargin);
		color: var(--winui-TimePickerHeaderForeground);
	}
	.flyout-button {
		position: relative;
		box-sizing: border-box;
		min-width: var(--winui-TimePickerThemeMinWidth);
		max-width: var(--winui-TimePickerThemeMaxWidth);
		border: var(--winui-DatePickerBorderThemeThickness) solid transparent;
		border-radius: var(--winui-ControlCornerRadius);
		padding: 0;
		background: var(--winui-DatePickerButtonBackground) padding-box;
		color: var(--winui-TimePickerButtonForeground);
		font: inherit;
	}
	/* TimePicker_themeresources.xaml:126-129 deliberately takes these three rest-state values from DatePicker; pointer states below use TimePicker's family. The gradient must be a ring, not border-color. */
	.flyout-button::after {
		content: '';
		position: absolute;
		inset: calc(-1 * var(--winui-DatePickerBorderThemeThickness));
		border-radius: inherit;
		padding: var(--winui-DatePickerBorderThemeThickness);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		background: var(--winui-DatePickerButtonBorderBrush);
		pointer-events: none;
	}
	.flyout-button.has-no-time {
		color: var(--winui-TimePickerButtonForegroundDefault);
	}
	.flyout-button:hover:not(:disabled)::after {
		background: var(--winui-TimePickerButtonBorderBrushPointerOver);
	}
	.flyout-button:hover:not(:disabled) {
		background: var(--winui-TimePickerButtonBackgroundPointerOver);
		color: var(--winui-TimePickerButtonForegroundPointerOver);
	}
	.flyout-button:active:not(:disabled)::after {
		background: var(--winui-TimePickerButtonBorderBrushPressed);
	}
	.flyout-button:active:not(:disabled) {
		background: var(--winui-TimePickerButtonBackgroundPressed);
		color: var(--winui-TimePickerButtonForegroundPressed);
	}
	.flyout-button:disabled::after {
		background: var(--winui-TimePickerButtonBorderBrushDisabled);
	}
	.flyout-button:disabled {
		background: var(--winui-TimePickerButtonBackgroundDisabled);
		color: var(--winui-TimePickerButtonForegroundDisabled);
	}
	.flyout-button:disabled + * {
		color: var(--winui-TimePickerHeaderForegroundDisabled);
	}
	.fields,
	.host {
		display: grid;
	}
	.field {
		box-sizing: border-box;
		min-width: 0;
		padding: var(--winui-TimePickerHostPadding);
		text-align: center;
		/* c1-allow: measured. The 30px original has 1px borders and a 19px line box. */
		line-height: 19px;
	}
	.spacer {
		display: block;
		width: var(--winui-TimePickerSpacerThemeWidth);
		background: var(--winui-TimePickerSpacerFill);
	}
	.presenter {
		box-sizing: border-box;
		height: 398px;
		overflow: hidden;
		border: var(--winui-DateTimeFlyoutBorderThickness) solid
			var(--winui-TimePickerFlyoutPresenterBorderBrush);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-TimePickerFlyoutPresenterBackground);
		padding: var(--winui-DateTimeFlyoutBorderPadding);
		box-shadow: var(--winui-PopupShadow);
		outline: none;
	}
	.content {
		display: grid;
		grid-template-rows: 1fr auto;
		height: 100%;
	}
	.host {
		position: relative;
		grid-template-rows: minmax(0, 1fr);
		overflow: hidden;
	}
	.highlight {
		z-index: 0;
		position: absolute;
		top: 50%;
		left: 4px;
		right: 4px;
		height: var(--winui-TimePickerFlyoutPresenterHighlightHeight);
		border-radius: var(--winui-ControlCornerRadius);
		background: var(--winui-TimePickerFlyoutPresenterHighlightFill);
		pointer-events: none;
		transform: translateY(-50%);
	}
	.flyout-spacer {
		z-index: 2;
		background: var(--winui-TimePickerFlyoutPresenterSpacerFill);
	}
	.selector {
		z-index: 1;
		min-width: 0;
		height: 100%;
	}
	.selector > :global(*) {
		height: 100%;
	}
	.host :global([data-looping-selector-item][data-selected] .item-content) {
		color: var(--winui-TimePickerFlyoutPresenterHighlightForegroundColor);
	}
	.accept-dismiss {
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr;
		height: var(--winui-TimePickerFlyoutPresenterAcceptDismissHostGridHeight);
	}
	.separator {
		position: absolute;
		top: 0;
		width: 100%;
		height: var(--winui-TimePickerSpacerThemeWidth);
		background: var(--winui-TimePickerFlyoutPresenterSpacerFill);
	}
	.accept,
	.dismiss {
		z-index: 1;
		border: 0;
		padding: 4px;
		background: var(--winui-DateTimePickerFlyoutButtonBackground);
		color: inherit;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: TimePicker_themeresources.xaml:305 sets FontSize="16" directly. */
		font-size: 16px;
	}
	/* TimePicker's template borrows DatePickerFlyoutPresenterDismissMargin for both buttons. */
	.accept,
	.dismiss {
		margin: var(--winui-DatePickerFlyoutPresenterDismissMargin);
	}
	.accept:hover,
	.dismiss:hover {
		background: var(--winui-DateTimePickerFlyoutButtonBackgroundPointerOver);
		color: var(--winui-DateTimePickerFlyoutButtonForegroundPointerOver);
	}
	.accept:active,
	.dismiss:active {
		background: var(--winui-DateTimePickerFlyoutButtonBackgroundPressed);
		color: var(--winui-DateTimePickerFlyoutButtonForegroundPressed);
	}
	/* WinUI discovers locale order and swaps hour/minute for RTL. Intl's locales here format hour, minute, period in this order; the RTL correction is owed rather than built. */
</style>
