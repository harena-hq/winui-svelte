<script lang="ts" module>
	import type { Snippet } from 'svelte';

	export interface ComboBoxItemData {
		/** SelectedValue. Also the key the list is rendered by. */
		value: string;
		/**
		 * The item's content, when it is text, and its accessible name and typeahead key
		 * whether it is or not — `itemTemplate` replaces an item's appearance, not its text.
		 */
		label: string;
		/** IsEnabled on the item, inverted — ADR 0009. */
		disabled?: boolean;
	}

	export interface ComboBoxProps {
		/** ItemsSource, narrowed to the text items this unit renders. */
		items?: ComboBoxItemData[];
		/**
		 * SelectedValue. In editable mode, a custom value equal to an item's value is that
		 * item; use item values that free text will not collide with.
		 */
		value?: string;
		onValueChange?: (value: string) => void;
		/** IsEditable. */
		editable?: boolean;
		/** Text — the text in the editable box. Bindable. Tracks every keystroke. */
		text?: string;
		onTextChange?: (text: string) => void;
		/** TextSubmitted. Raised when typed text matching no item is committed; set
		 * `handled` to keep the text from becoming a custom value. */
		onTextSubmitted?: (args: ComboBoxTextSubmittedEventArgs) => void;
		/**
		 * ItemTemplate. Renders one item's content, in the trigger and in every list row.
		 * Absent, an item renders as its `label`.
		 */
		itemTemplate?: Snippet<[ComboBoxItemData, number]>;
		/** IsDropDownOpen. */
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		/** PlaceholderText. */
		placeholder?: string;
		/** IsEnabled, inverted to HTML's attribute — ADR 0009. */
		disabled?: boolean;
		/** Header. A string or a snippet. */
		header?: Snippet | string;
		/** Description. A string or a snippet. */
		description?: Snippet | string;
		/** Name and IsRequired, for a form. */
		name?: string;
		required?: boolean;
		class?: string;
		style?: string;
		/**
		 * The editable `<input>`, or the non-editable trigger `<button>` — ADR 0009.
		 * The root is the outer `<div>` the header and description sit on.
		 */
		ref?: HTMLButtonElement | HTMLInputElement | null;
		[key: string]: unknown;
	}

	/** ComboBoxTextSubmittedEventArgs. */
	export interface ComboBoxTextSubmittedEventArgs {
		readonly text: string;
		handled: boolean;
	}

	// SelectionChangedTrigger is not exposed; editable selection follows upstream's
	// default, Committed. TextBoxStyle, gamepad and IME candidate-window offsets are absent.
</script>

<script lang="ts">
	import { Combobox, Select } from 'bits-ui';
	import { onMount, tick, untrack } from 'svelte';

	let {
		items = [],
		value = $bindable(''),
		editable = false,
		text = $bindable(''),
		onTextChange,
		onTextSubmitted,
		onValueChange,
		itemTemplate,
		open = $bindable(false),
		onOpenChange,
		placeholder,
		disabled = false,
		header,
		description,
		name,
		required = false,
		class: className,
		style,
		ref = $bindable(null),
		...rest
	}: ComboBoxProps = $props();

	const uid = $props.id();

	// The editable variant. Upstream's model lives in `ComboBox_Partial.cpp` and is kept here
	// in its own terms: `searchIndex` is `m_searchResultIndex`, with `null` for "not set"
	// (`ResetSearch`, :2601); `searchString` is `m_searchString`, the last text the control
	// wrote itself; `shown` is `OverrideSelectedIndexForVisualStates`, the row that draws the
	// Selected look while the list is open. Typing and arrowing never change the selection —
	// upstream's default `SelectionChangedTrigger` is `Committed` — so the value moves only in
	// `commit()` and through an item click.
	let rootEl = $state<HTMLDivElement | null>(null);
	let boxEl = $state<HTMLDivElement | null>(null);
	let popupEl = $state<HTMLDivElement | null>(null);
	let popupSide = $state<'top' | 'bottom' | null>(null);
	let shown = $state(-1);
	let hovered = $state(-1);
	// eslint-disable-next-line svelte/prefer-writable-derived -- The row id is read after DOM rendering by an effect.
	let activeId = $state<string | undefined>(undefined);
	let searchIndex: number | null = null;
	let searchString = '';
	let lastValue = value;
	let cancelling = false;
	let lastOpen = open;
	const selectedIndex = $derived(items.findIndex((item) => item.value === value));
	const input = () => (ref instanceof HTMLInputElement ? ref : null);
	const eqi = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
	const displayString = () => items.find((item) => item.value === value)?.label ?? value;

	// `UpdateEditableTextBox` (:1514-1551). Text equal but for case is left alone, selection
	// included — which is why a committed "27" keeps its caret while a reverted "36" comes back
	// as a selected "10" on the reference.
	async function writeText(str: string, selectAll: boolean) {
		const el = input();
		if (eqi(str, text)) return;
		searchString = str;
		const start = el?.selectionStart ?? 0;
		text = str;
		if (el) el.value = str;
		onTextChange?.(str);
		await tick();
		el?.setSelectionRange(selectAll ? 0 : start, str.length);
	}
	async function scrollShown() {
		await tick();
		if (open && shown >= 0)
			popupEl?.querySelectorAll('.item')[shown]?.scrollIntoView({ block: 'nearest' });
	}
	// `ProcessSearch` (:3938-3997) over `SearchItemSourceIndex` (:4080-4129): the first item
	// whose text starts with what was typed, ignoring case, width, kana type and diacritics,
	// is written in with its remainder selected. Backspace matches whole text only, so that
	// completion does not undo the deletion it follows (:4098-4107).
	function search(kind: 'insert' | 'backspace' | 'reconcile') {
		if (eqi(text, searchString)) return;
		let found = -1;
		if (text === '') searchString = '';
		else {
			// The search string becomes the text before the scan (:4031), so the same text is
			// not searched twice — which is also why committing an item's own text again finds no
			// search result and raises `TextSubmitted` for it, as upstream does.
			searchString = text;
			found = items.findIndex((item) => {
				const s = item.label.trimStart();
				return kind === 'backspace'
					? eqi(s, text)
					: s.slice(0, text.length).localeCompare(text, undefined, { sensitivity: 'base' }) === 0;
			});
			if (found >= 0 && kind !== 'backspace') void writeText(items[found].label, false);
		}
		searchIndex = found;
		if (open) {
			shown = found;
			void scrollShown();
		}
	}
	function setValue(v: string) {
		const previous = value;
		value = lastValue = v;
		if (v !== previous) onValueChange?.(v);
	}
	// The tail every commit and revert shares (:2564-2596). `ResetSearch` (:2601-2605) clears
	// the search result only; the search string keeps the text last written or searched.
	function finish() {
		void writeText(value === '' ? '' : displayString(), true);
		searchIndex = null;
	}
	// `CommitRevertEditableSearch` (:2440-2596). A match selects the item; text matching
	// nothing raises `TextSubmitted`, and unless the handler marks it handled the text —
	// as the handler left it — becomes a custom value. Blank text, and text equal to the
	// custom value already held, raise nothing.
	function commit() {
		if (searchIndex === null) search('reconcile');
		const match = searchIndex === null ? undefined : items[searchIndex];
		if (match) setValue(match.value);
		else if (text.trim() !== '') {
			const t = text;
			const custom = value !== '' && selectedIndex === -1;
			if (!custom || !eqi(value, t)) {
				const args = { text: t, handled: false };
				onTextSubmitted?.(args);
				if (!args.handled) {
					const found = items.findIndex((item) => eqi(item.label.trimStart(), text));
					setValue(found >= 0 ? items[found].value : text);
				}
			}
		}
		finish();
	}
	function revert() {
		finish();
	}
	// The `SelectedItem` change handler (:1328-1356), for a selection the commit did not make:
	// an item click or the consumer's write. Writing the item's text here is what keeps the
	// commit that follows a click from reconciling against whatever had been typed.
	function selectionChanged() {
		searchIndex = selectedIndex;
		void writeText(value === '' ? '' : displayString(), true);
		if (!open && selectedIndex > -1) commit();
	}
	function choose(v: string) {
		setValue(v);
		selectionChanged();
	}
	// `OnOpen` moves focus to the text box (ComboBox_Partial.cpp:1703-1712), and only a text
	// box that did not have focus selects all as it takes it (`OnGotFocus`, :2351): opened
	// from the keyboard mid-word, the auto-completed remainder stays the selection.
	function opened() {
		shown = searchIndex ?? selectedIndex;
		const el = input();
		if (el && document.activeElement !== el) {
			el.focus();
			el.select();
		}
		void scrollShown();
	}
	// Every close commits except a cancel — Escape, a press outside, focus leaving while open
	// — which reverts (`OnClose`, :1755-1758).
	function changeOpen(next: boolean, notify = true) {
		if (next === lastOpen) {
			cancelling = false;
			return;
		}
		open = lastOpen = next;
		if (next) opened();
		else {
			if (cancelling) revert();
			else commit();
			cancelling = false;
			hovered = -1;
		}
		if (notify) onOpenChange?.(next);
	}
	function inputChanged(event: Event & { currentTarget: HTMLInputElement }) {
		text = event.currentTarget.value;
		onTextChange?.(text);
		if (!(event instanceof InputEvent)) return;
		const e = event;
		// Upstream searches on `CharacterReceived` (:3807-3840) and its `TextChanged` handler is
		// empty (:3123-3127), so only typed characters and Backspace search: a paste, Delete or
		// a cut does not. Composed text arrives as characters once composition ends.
		if (e.isComposing) return;
		if (e.inputType === 'insertText') search('insert');
		else if (e.inputType === 'deleteContentBackward') search('backspace');
	}
	let touchFocus = false;
	// `OnGotFocus` (:2340-2351): a keyboard or mouse focus selects all and reconciles the text
	// with the items; a touch focus puts the caret at the end instead.
	function inputFocused() {
		if (touchFocus) return;
		input()?.select();
		search('reconcile');
	}
	// `MainKeyDown` (:2996-3117) while closed and `PopupKeyDown` (:2770-2980) while open. The
	// arrows open a closed list rather than step the selection; open, they write the next
	// item's text, clamped at both ends. Tab while open stays in the text box, and Escape
	// while open leaves focus on the control itself, both as the reference does.
	function inputKey(event: KeyboardEvent) {
		if (event.isComposing || event.keyCode === 229) return;
		const key = event.key;
		if (key === 'Tab' && !open) {
			commit();
			return;
		}
		if (key === 'ArrowDown' || key === 'ArrowUp') {
			event.preventDefault();
			if (!open) changeOpen(true);
			else if (items.length) {
				const base = searchIndex ?? selectedIndex;
				const next = Math.max(0, Math.min(items.length - 1, base + (key === 'ArrowDown' ? 1 : -1)));
				searchIndex = shown = next;
				void writeText(items[next].label, true);
				void scrollShown();
			}
		} else if (
			key === 'F4' &&
			!event.altKey &&
			!event.ctrlKey &&
			!event.metaKey &&
			!event.shiftKey
		) {
			event.preventDefault();
			changeOpen(!open);
		} else if (key === 'Enter') {
			event.preventDefault();
			if (open) changeOpen(false);
			else commit();
		} else if (key === 'Escape') {
			event.preventDefault();
			if (open) {
				cancelling = true;
				changeOpen(false);
				focusBox(true);
			} else revert();
		} else if (key === 'Tab') {
			event.preventDefault();
			changeOpen(false);
		}
	}
	function focusBox(focusVisible: boolean) {
		const options: { preventScroll?: boolean; focusVisible: boolean } = { focusVisible };
		boxEl?.focus(options);
	}
	function boxKey(event: KeyboardEvent) {
		if (event.target !== boxEl || disabled) return;
		if (
			event.key === 'ArrowUp' ||
			event.key === 'ArrowDown' ||
			(event.key === 'F4' && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey)
		) {
			event.preventDefault();
			changeOpen(true);
		} else if (event.key === 'Enter' || event.key === 'Escape') {
			event.preventDefault();
			if (event.key === 'Enter') commit();
			else revert();
		}
	}
	function textPointer(event: PointerEvent) {
		if (disabled || (event.target instanceof Element && event.target.closest('.overlay'))) return;
		const el = input();
		if (!el || document.activeElement === el) return;
		event.preventDefault();
		touchFocus = event.pointerType === 'touch';
		el.focus();
		touchFocus = false;
		if (event.pointerType === 'touch') {
			changeOpen(true);
			el.setSelectionRange(text.length, text.length);
		}
	}
	// Only the `DropDownOverlay` opens and closes the list (`PerformPointerUpAction`,
	// :3541-3552). Closed from here, focus lands on the control without a ring, as a pointer
	// focus does on the reference; Chrome would otherwise carry `:focus-visible` over from
	// the text input, which always matches it.
	function overlayClick(event: MouseEvent) {
		if (disabled || event.button !== 0) return;
		const closing = open;
		changeOpen(!open);
		if (closing) focusBox(false);
	}
	// Focus leaving the whole control commits (:2386-2392), or cancels while open
	// (`FocusChanged`, :2192-2196). Moving between the text box and the box is not leaving.
	function focusOut(event: FocusEvent) {
		const target = event.relatedTarget;
		if (target instanceof Node && (rootEl?.contains(target) || popupEl?.contains(target))) return;
		if (open) {
			cancelling = true;
			changeOpen(false);
		} else commit();
	}
	onMount(() => {
		if (!editable) return;
		if (text === '') text = displayString();
		if (open && disabled) open = lastOpen = false;
		else if (open)
			void tick().then(() => {
				if (open) opened();
			});
	});
	$effect(() => {
		const next = open;
		// The consumer's own write: no `onOpenChange` back to it, and a disabled control stays shut.
		if (editable && next !== lastOpen)
			untrack(() => {
				if (next && disabled) open = false;
				else changeOpen(next, false);
			});
	});
	$effect(() => {
		const v = value;
		if (editable && v !== lastValue)
			untrack(() => {
				lastValue = v;
				selectionChanged();
			});
	});
	$effect(() => {
		const el = popupEl;
		if (!el) {
			popupSide = null;
			return;
		}
		const sync = () => {
			const side = el.getAttribute('data-side');
			popupSide = side === 'top' || side === 'bottom' ? side : null;
		};
		sync();
		const observer = new MutationObserver(sync);
		observer.observe(el, { attributes: true, attributeFilter: ['data-side'] });
		return () => observer.disconnect();
	});
	// Disabled while open: the list closes as a cancel.
	$effect(() => {
		if (editable && disabled && untrack(() => lastOpen))
			untrack(() => {
				cancelling = true;
				changeOpen(false);
			});
	});
	// Items replaced under a held search result leave it pointing past the end.
	$effect(() => {
		const count = items.length;
		untrack(() => {
			if (searchIndex !== null && searchIndex >= count) searchIndex = null;
			if (shown >= count) shown = -1;
		});
	});
	$effect(() => {
		activeId = open && shown >= 0 ? popupEl?.querySelectorAll('.item')[shown]?.id : undefined;
	});

	// Upstream opens the list when a left press on the control is released on it, not when it
	// goes down: `OnPointerPressed` (ComboBox_Partial.cpp:3310) only sets `m_bIsPressed` and
	// draws `Pressed`, and `OnPointerReleased` (:3426) opens through `PerformPointerUpAction`
	// (:3529) if that flag is still set. Leaving the control clears it (`OnPointerExited`,
	// :3236), so a press dragged off and back does not open. bits-ui 2.19's trigger opens on
	// a mouse or pen `pointerdown` instead, so the press is held back here and replayed into
	// bits-ui's own handler on the release, which opens from the same code path. Touch is
	// bits-ui's `pointerup` already, and a press while the list is open still reaches bits-ui,
	// which closes it. The `ctrlKey` gate is bits-ui's (`select.svelte.js:747-749`), kept so a
	// Ctrl-click does here what it did before; upstream has no such condition.
	//
	// The same flag is what draws `Pressed`, as `m_bIsPressed` is upstream: once `Disabled`
	// and the inline `Highlighted` are ruled out, `CommonStates` picks `Pressed` on it alone
	// (:850-859), so a mouse or pen press dragged off the control stops drawing it. CSS
	// `:active` holds while the button is down wherever the pointer goes. A touch press draws
	// it too, since the press handler asks the pointer's `IsLeftButtonPressed` (:3298) and not
	// its device type, and it is still bits-ui's to open on the release. Dragged off, a touch
	// press keeps drawing it until the finger lifts: bits-ui leaves a touch pointer its
	// implicit capture, so the trigger hears no `pointerleave`, where upstream clears the flag
	// as the contact moves off (:3222-3228, :3236); by the same capture the lift, wherever it
	// lands, reaches the trigger and opens the list — unless the browser took the slide as a pan
	// and cancelled the pointer. That is WD-098; see docs/divergences.md.
	let pressed = $state(false);
	type TriggerProps = Record<string, unknown> & {
		onpointerdown?: (event: PointerEvent) => void;
		onpointerup?: (event: PointerEvent) => void;
	};
	function presses(event: PointerEvent) {
		return !disabled && !open && event.button === 0 && !event.ctrlKey;
	}
	function triggerPointerDown(props: TriggerProps, event: PointerEvent) {
		pressed = presses(event);
		if (!pressed || event.pointerType === 'touch') return props.onpointerdown?.(event);
		// What bits-ui's handler does before it opens (`select.svelte.js:743-746`): a pointer
		// holding implicit capture would never leave the trigger, and its release would land
		// here wherever it lifted.
		const target = event.target as Element | null;
		if (target?.hasPointerCapture(event.pointerId)) target.releasePointerCapture(event.pointerId);
	}
	function triggerPointerUp(props: TriggerProps, event: PointerEvent) {
		props.onpointerup?.(event);
		if (pressed && event.pointerType !== 'touch' && presses(event)) props.onpointerdown?.(event);
		pressed = false;
	}

	// `bits-ui`'s Select uses a `value` typed as `string | undefined` upstream and the
	// component contract here narrows it to `string`. A consumer clearing the selection
	// passes `''`; the empty string is the only falsy value the trigger shows as "nothing
	// selected".
</script>

{#if editable}
	<div
		class={['root', 'winui-BodyTextBlockStyle', className]}
		{style}
		data-disabled={disabled || undefined}
		data-popup-side={popupSide ?? undefined}
		bind:this={rootEl}
		onfocusout={focusOut}
		{...rest}
	>
		{#if header !== undefined}
			<span class="header" id="{uid}-header"
				>{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}</span
			>
		{/if}
		<Combobox.Root
			type="single"
			allowDeselect={false}
			bind:value={() => value, choose}
			bind:open={() => open, changeOpen}
			inputValue={text}
			{items}
			{disabled}
			{required}
			{name}
		>
			<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
			<div
				class="box trigger"
				tabindex="-1"
				role="group"
				aria-labelledby={header !== undefined ? `${uid}-header` : undefined}
				bind:this={boxEl}
				onkeydown={boxKey}
				onpointerdown={textPointer}
			>
				<span class="pill" aria-hidden="true"></span>
				<span class="sizer" aria-hidden="true">{text === '' ? (placeholder ?? '') : text}</span>
				<Combobox.Input {placeholder}>
					{#snippet child({ props })}
						<!-- ADR 0004's third category: bits-ui's input handlers compute another
					     model (typing opens, Enter chooses its highlight, Alt+Up closes).
					     Unlike AutoSuggestBox, these two handlers replace rather than chain. -->
						<input
							{...props}
							bind:this={ref}
							class="input"
							value={text}
							{disabled}
							aria-labelledby={header !== undefined ? `${uid}-header` : undefined}
							aria-autocomplete="inline"
							aria-activedescendant={activeId}
							autocomplete="off"
							onkeydown={inputKey}
							oninput={inputChanged}
							onfocus={inputFocused}
							oncompositionend={() => search('insert')}
						/>
					{/snippet}
				</Combobox.Input>
				<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
				<div
					class="overlay"
					onpointerdown={(event) => {
						if (!disabled && event.button === 0) event.preventDefault();
					}}
					onclick={overlayClick}
				></div>
				<span class="chevron" aria-hidden="true"></span>
			</div>
			<Combobox.Portal>
				<Combobox.Content
					side="bottom"
					align="start"
					sideOffset={0}
					onInteractOutside={(event) => {
						// A press outside the control cancels (`OnElementOutsidePopupPointerPressed`,
						// ComboBox_Partial.cpp:3738-3742); presses on the control pass through to it
						// (`Popup.OverlayInputPassThroughElement = this`, :405-408). bits-ui exempts
						// only the input. The overlay needs this too: bits-ui reports a press there
						// as outside even when default-prevented, 10 ms after it goes down, so any
						// click held longer than that would cancel and the release would reopen.
						if (event.target instanceof Node && rootEl?.contains(event.target))
							event.preventDefault();
						else cancelling = true;
					}}
					onEscapeKeydown={(event) => event.preventDefault()}
				>
					{#snippet child({ props, wrapperProps })}
						<div {...wrapperProps}>
							<div
								{...props}
								class={['popup', 'editable-popup', 'winui-BodyTextBlockStyle']}
								bind:this={popupEl}
								onfocusout={focusOut}
							>
								<Combobox.Viewport>
									{#snippet child({ props })}
										<div {...props} class="list">
											{#each items as item, index (item.value)}
												<Combobox.Item
													value={item.value}
													label={item.label}
													disabled={item.disabled ?? false}
												>
													{#snippet child({ props })}
														<div
															{...props}
															class="item"
															data-selected={open && index === shown ? '' : undefined}
															data-highlighted={index === hovered ? '' : undefined}
															onpointerup={(event) => {
																// bits-ui skips its value setter when the clicked item is already
																// selected. Apply the same selection-change rule before it closes.
																if (
																	!event.defaultPrevented &&
																	!item.disabled &&
																	item.value === value
																)
																	choose(item.value);
																if (typeof props.onpointerup === 'function')
																	props.onpointerup(event);
															}}
															onpointerenter={() => (hovered = index)}
															onpointerleave={() => (hovered = -1)}
														>
															<span class="pill" aria-hidden="true"></span>
															<span class="item-content"
																>{#if itemTemplate}{@render itemTemplate(
																		item,
																		index
																	)}{:else}{item.label}{/if}</span
															>
														</div>
													{/snippet}
												</Combobox.Item>
											{/each}
										</div>
									{/snippet}
								</Combobox.Viewport>
							</div>
						</div>
					{/snippet}
				</Combobox.Content>
			</Combobox.Portal>
		</Combobox.Root>
		{#if description !== undefined}
			<span class="description"
				>{#if typeof description === 'string'}{description}{:else}{@render description()}{/if}</span
			>
		{/if}
	</div>
{:else}
	<div
		class={['root', 'winui-BodyTextBlockStyle', className]}
		{style}
		data-disabled={disabled || undefined}
		{...rest}
	>
		{#if header !== undefined}
			<span class="header">
				{#if typeof header === 'string'}{header}{:else}{@render header()}{/if}
			</span>
		{/if}
		<Select.Root
			type="single"
			bind:value={
				() => value,
				(next) => {
					value = next;
					onValueChange?.(next);
				}
			}
			bind:open={
				() => open,
				(next) => {
					open = next;
					onOpenChange?.(next);
				}
			}
			{items}
			{disabled}
			{required}
			{name}
		>
			<Select.Trigger>
				<!-- Every element the primitive would render is rendered here instead, through its
			     `child` snippet — the escape ADR 0004 names first. bits-ui hands back the props
			     it needs on the trigger (including the `aria-expanded`, `aria-controls` and the
			     `data-state` it writes) and this component supplies the element and the class.
			     Written the other way, with `class="…"` passed to the primitive, the class reaches
			     the DOM without this component's scope hash, every rule for it has to be hoisted
			     out of the selector, and `.trigger` then matches every element in the application
			     that shares that very ordinary name. -->
				{#snippet child({ props })}
					<button
						{...props}
						data-pressed={pressed || undefined}
						onpointerdown={(event) => triggerPointerDown(props, event)}
						onpointerup={(event) => triggerPointerUp(props, event)}
						onpointerleave={() => (pressed = false)}
						onpointercancel={() => (pressed = false)}
						bind:this={ref}
						class="trigger"
					>
						<span class="pill" aria-hidden="true"></span>
						<Select.Value>
							{#snippet child({ props, selection })}
								<span {...props} class="value">
									{#if selection.type === 'single' && selection.selected}
										{@const selectedValue = selection.selected.value}
										{@const index = items.findIndex((item) => item.value === selectedValue)}
										{#if itemTemplate && index !== -1}
											{@render itemTemplate(items[index], index)}
										{:else}
											{selection.selected.label}
										{/if}
									{:else}
										<span class="placeholder">{placeholder ?? ''}</span>
									{/if}
								</span>
							{/snippet}
						</Select.Value>
						<!-- WD-006: the chevron is an `AnimatedIcon` whose `FallbackIconSource` at
					     ComboBox_themeresources.xaml:585 is a `FontIconSource` in
					     `SymbolThemeFontFamily` at `FontSize="12"` with `Glyph="&#xE70D;"`. Render
					     the fallback, no transition; see docs/divergences.md. -->
						<span class="chevron" aria-hidden="true"></span>
					</button>
				{/snippet}
			</Select.Trigger>
			<Select.Portal>
				<Select.Content>
					{#snippet child({ props, wrapperProps })}
						<!-- `wrapperProps` is the outer wrapper Floating UI positions; pass it through
					     first, untouched. The popup's own border, background and corner live on
					     `props` and reach the `<div>` this control writes.

					     The popup carries the type ramp class again because it is not inside
					     the root: the portal moves it to `<body>`, and CSS inheritance follows
					     the DOM. Upstream has no such break — the popup is part of the
					     ComboBox's template, so `FontFamily` and `FontSize` reach it by
					     property inheritance from `DefaultComboBoxStyle`. Without the class
					     here the rows render in the document's own font. -->
						<div {...wrapperProps}>
							<div {...props} class={['popup', 'winui-BodyTextBlockStyle']}>
								<Select.Viewport>
									{#snippet child({ props })}
										<div {...props} class="list">
											{#each items as item, index (item.value)}
												<Select.Item
													value={item.value}
													label={item.label}
													disabled={item.disabled ?? false}
												>
													{#snippet child({ props })}
														<!-- The `data-selected` and `data-highlighted` bits-ui writes
													     are the conditions the CSS keys off; the snippet only
													     adds the element and the class. -->
														<div {...props} class="item">
															<span class="pill" aria-hidden="true"></span>
															<span class="item-content">
																{#if itemTemplate}{@render itemTemplate(
																		item,
																		index
																	)}{:else}{item.label}{/if}
															</span>
														</div>
													{/snippet}
												</Select.Item>
											{/each}
										</div>
									{/snippet}
								</Select.Viewport>
							</div>
						</div>
					{/snippet}
				</Select.Content>
			</Select.Portal>
		</Select.Root>
		{#if description !== undefined}
			<span class="description">
				{#if typeof description === 'string'}{description}{:else}{@render description()}{/if}
			</span>
		{/if}
	</div>
{/if}

<style>
	/* `isolation` is for the focus highlight below, and it is what makes upstream's
	   arrangement reachable from a pseudo-element. Upstream's `HighlightBackground` and
	   `Background` are siblings in the template's Grid, the first painted under the second;
	   ours is a pseudo-element of the box itself, so it needs a negative `z-index` to get
	   underneath — and a negative `z-index` is resolved in the nearest ancestor stacking
	   context, which without this line is the page and not this control. The highlight would
	   then paint behind whatever background the page puts between them and be invisible.
	   `position: relative` alone does not make one.

	   It closes the control, which is a constraint on a public prop: `itemTemplate` is
	   rendered inside the trigger at :137, so a `z-index` a caller writes in one is now
	   capped at this element's level where it used to escape to the page. A `position: fixed`
	   there is unaffected — `isolation` establishes a stacking context and not a containing
	   block — and nothing in the tree passes a template at all, `ColorPicker.svelte` being the
	   only component that renders a ComboBox.

	   What it does *not* close is the highlight's own position. That visual lives four pixels
	   outside this element, where an ancestor's `overflow` clips it and a stacking context
	   does not; the dev harness's scroller sets `overflow-y: auto` on `.dev` in
	   `routes/dev/+layout.svelte`, which computes `overflow-x` to `auto`, and its 24px padding on
	   the next line is the whole of what keeps those four pixels visible there. */
	.root {
		display: inline-flex;
		flex-direction: column;
		position: relative;
		isolation: isolate;
	}

	/* Row 0 of `DefaultComboBoxStyle` at ComboBox_themeresources.xaml:569: the
	   `HeaderContentPresenter` carries `Margin="{ThemeResource ComboBoxTopHeaderMargin}"`
	   and `Foreground="{ThemeResource ComboBoxHeaderForeground}"` and
	   `FontWeight="{ThemeResource ComboBoxHeaderThemeFontWeight}"`. `LineHeight="20"` and
	   `TextWrapping="Wrap"` map to `line-height: 20px` and `white-space: normal`; the
	   wrapper itself is line-height-normal and inherits, so the rule sets the constant
	   explicitly. */
	.header {
		margin: var(--winui-ComboBoxTopHeaderMargin);
		color: var(--winui-ComboBoxHeaderForeground);
		font-weight: var(--winui-ComboBoxHeaderThemeFontWeight);
		/* c1-allow: ComboBox_themeresources.xaml:569, `LineHeight="20"` on the
		   `HeaderContentPresenter` */
		line-height: 20px;
		white-space: normal;
	}

	/* Row 1 of `DefaultComboBoxStyle` at ComboBox_themeresources.xaml:571: the
	   `Background` Border carries `MinWidth="{ThemeResource ComboBoxThemeMinWidth}"`,
	   `CornerRadius="{TemplateBinding CornerRadius}"` (the control's own
	   `ControlCornerRadius`), `BorderThickness="{TemplateBinding BorderThickness}"`
	   (`ComboBoxBorderThemeThickness`), `Background` and `BorderBrush` template-bound
	   to the four `ComboBoxBackground*` and `ComboBoxBorderBrush*` brushes. The
	   `ComboBoxMinHeight` and `ComboBoxPadding` template settings reach the same box.

	   The `Control.IsTemplateFocusTarget="True"` puts the focus visual on the box. The
	   trigger's own `:focus-visible` rule below reads as the focus visual.

	   `font-family: inherit` is what lets the `<button>` paint text in the same family the
	   root's `winui-BodyTextBlockStyle` brings in; a `<button>`'s default is the user
	   agent's. */
	.trigger {
		position: relative;
		display: inline-flex;
		align-items: center;
		min-width: var(--winui-ComboBoxThemeMinWidth);
		min-height: var(--winui-ComboBoxMinHeight);
		padding: var(--winui-ComboBoxPadding);
		border-style: solid;
		border-width: var(--winui-ComboBoxBorderThemeThickness);
		border-radius: var(--winui-ControlCornerRadius);
		font-family: inherit;
		font-size: inherit;
		text-align: left;
		cursor: pointer;
		color: inherit;
		background: var(--winui-ComboBoxBackground) padding-box;
		/* That Border writes no `BackgroundSizing`, and neither template file does — the
		   string does not occur in ComboBox_themeresources.xaml or in
		   ComboBox_themeresources_perf2026.xaml except on the popup, at :590 and :544 — so
		   the fill takes the property's default and stops at the inner border edge. CSS
		   stops it at the border box, hence `padding-box` above.

		   The brush is the harder half. `ComboBoxBorderBrush` and
		   `ComboBoxBorderBrushPointerOver` both alias `ControlElevationBorderBrush`, which
		   is a `LinearGradientBrush` upstream and a `linear-gradient(...)` in the token
		   layer. A gradient is not a `border-color`: `var()` defers the check to
		   computed-value time, the declaration is invalid there, and an invalid
		   non-inherited property falls back to its initial value — `currentColor`. So this
		   rule painted the trigger's own text colour on all four edges, and nothing said
		   so: the declaration names the right brush and is dropped after parsing. The
		   tracked baselines read 27 in light and 255 in dark where the brush composites to
		   228 and 47. The ring below paints it; this border only reserves its width.
		   Button.svelte's `.root` and TextBox.svelte's `.box` carry the same pair. */
		border-color: transparent;
	}

	/* The border brush on the ring alone. `inset` is the border width negated, so this box —
	   placed against the trigger's padding box, as an absolutely positioned child is — lands on
	   the trigger's border box, and `border-radius: inherit` puts the two curves on top of each
	   other. The two mask layers are composited so the content box is punched out.
	   The comment above Button.svelte's `.root::after` describes the technique in full.

	   Which stop lands on which edge differs between the themes, and that is upstream's:
	   generic.xaml:2146 defines the brush under `Default` running `StartPoint="0,0"` to
	   `EndPoint="0,3"` with no transform, so `ControlStrokeColorSecondary` sits along the top,
	   and generic.xaml:7747 defines it under `Light` with a `ScaleTransform ScaleY="-1"` that
	   flips it to the bottom. The token layer mirrors that — `ControlElevationBorderBrush` runs
	   `to bottom` in both dark blocks and `to top` in `:root` — and the baselines now show it:
	   on the seven triggers that take the gradient, light reads 228 on three edges and 204 along
	   the bottom, dark 47 on three and 53 along the top. The eighth is disabled, its brush
	   `ControlStrokeColorDefaultBrush` — the gradient's far stop on its own — so it reads 228
	   and 47 flat on all four, and that is what pins its rule to a baseline.

	   High contrast is where this costs rather than pays. There the brush is a colour, so the
	   border it replaces was valid and drew the same value; what changed is that a masked
	   pseudo-element rounds its corners differently from a real border. That baseline moved by
	   422 pixels and 324 of them are this — 40 per trigger, 44 on the disabled one, inside four
	   rows of each corner and none above 31 levels. The other 98 sit on the two open dropdowns'
	   corners, span eight rows because `OverlayCornerRadius` is twice the corner here, and are
	   a single level each on an element this rule does not reach; playwright.config.ts:101 calls
	   that the lane's own noise. The ColorPicker baselines are the same trade with none of it
	   mixed in: 520 pixels over 13 triggers and 160 over 4, exactly 40 each. Button.svelte's
	   `.root` and TextBox.svelte's `.box` made this trade before this one did. */
	.trigger::after {
		content: '';
		position: absolute;
		inset: calc(-1 * var(--winui-ComboBoxBorderThemeThickness));
		border-radius: inherit;
		padding: var(--winui-ComboBoxBorderThemeThickness);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		pointer-events: none;
		background: var(--winui-ComboBoxBorderBrush);
	}

	/* The visible text inside the trigger. `ComboBoxForeground` is the colour of the
	   selected label; the placeholder uses a separate brush and a separate weight — see
	   TextBox's equivalent. The `PlaceholderTextBlock` upstream lives inside the
	   `ContentPresenter` at :577 and is bound through the `PlaceholderForeground`
	   property's alias onto `ComboBoxPlaceHolderForeground`. */
	.value {
		flex: 1 1 auto;
		min-width: 0;
		/* The `ContentPresenter` at :577 is the `Background` Border's sibling in one Grid row,
		   so its `Margin="{TemplateBinding Padding}"` is measured from its cell, whose edges
		   are the Border's outer box on three sides — while the padding this element sits
		   inside is one border in. The negative margin hands that border back on those three
		   sides, which puts the text at 12 from the outer edge where it was at 13, and keeps
		   the border out of the control's height: upstream's row is the padding plus the text
		   or `ComboBoxMinHeight`, whichever is taller, and a border added to the first made
		   the trigger 33 pixels tall on the reference browser, whose 14-pixel text is 19 tall.
		   Centring in what is left rounds nothing, where upstream's arrange rounds the offset
		   to a whole pixel; that half pixel is WD-097.

		   The fourth side is the column. The presenter is in column 0 and :567 makes column 1
		   `Width="38"`, so the text stops 38 pixels plus the right padding short of the outer
		   edge whether or not it reaches that far — which is where an overlong label is cut,
		   and it was cut 11 pixels later while it ran on to the chevron. An auto-width control
		   grows by 10 for it, not 11, because the left margin moves the text one pixel the
		   other way; it is now the padding, the text and the column: `*` measures to the
		   presenter, and the column is 38 whatever it holds. */
		/* c1-allow: ComboBox_themeresources.xaml:567, `Width="38"` on the second
		   `ColumnDefinition` */
		margin: calc(-1 * var(--winui-ComboBoxBorderThemeThickness))
			calc(38px - var(--winui-ComboBoxBorderThemeThickness))
			calc(-1 * var(--winui-ComboBoxBorderThemeThickness))
			calc(-1 * var(--winui-ComboBoxBorderThemeThickness));
		color: var(--winui-ComboBoxForeground);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* The placeholder, visible only when the trigger has no selection. Its colour and
	   weight both come from their own resources — `PlaceholderForeground` and
	   `PlaceholderTextThemeFontWeight` — neither of which is the rest `Foreground`. Rest is
	   this rule, `Pressed` is `.trigger[data-pressed] .placeholder` below, and
	   `FocusedPressed` is with the focus states' brushes after it. */
	.placeholder {
		color: var(--winui-ComboBoxPlaceHolderForeground);
		font-weight: var(--winui-ComboBoxPlaceholderTextThemeFontWeight);
	}

	/* The chevron: 12 by 12, right-aligned in the 38-pixel column the upstream grid
	   declares, which the text's margin reserves rather than this box. The glyph is the
	   fallback WinUI itself draws — `&#xE70D;` in `SymbolThemeFontFamily` at
	   `FontSize="12"` per the `FontIconSource` at ComboBox_themeresources.xaml:585. The
	   escape is six digits and lowercase so a future `content` concatenation cannot end
	   at a stray space, the same shape `TextBox.svelte`'s delete button carries. */
	.chevron {
		/* The icon is in column 1 of the same row, not inside the `ContentPresenter`, so the
		   padding reaches it nowhere: `VerticalAlignment="Center"` centres it on the whole
		   row, and `HorizontalAlignment="Right"` with the margin below puts it 14 from the
		   cell's right edge, which is the outer edge. As a flex item it was centred on the
		   content box instead — one pixel high, because `ComboBoxPadding` puts two more
		   pixels below than above in both densities — and 15 in. Taken out of the flow it is
		   placed against the padding box, which is centred on the border box because the
		   four borders are equal, and `right` gives the border back the way the Pill's `left`
		   does. The 38-pixel column it stands in is reserved by the text's margin above. */
		position: absolute;
		top: 50%;
		translate: 0 -50%;
		/* c1-allow: ComboBox_themeresources.xaml:582, `Margin="0,0,14,0"` on the chevron */
		right: calc(14px - var(--winui-ComboBoxBorderThemeThickness));
		display: inline-flex;
		align-items: center;
		justify-content: center;
		/* c1-allow: ComboBox_themeresources.xaml:582, `Width="12"` and `Height="12"` on
		   the `AnimatedIcon` — whose `MinHeight="{ThemeResource ComboBoxMinHeight}"` wins
		   over that `Height`, so upstream's element is the row's minimum tall — 32, or 24 in
		   the compact density — with the glyph centred in it.
		   Twelve is the same picture only because this box is centred on the trigger and
		   the trigger's own `min-height` supplies the row's minimum; drop either and it is
		   not. */
		width: 12px;
		height: 12px;
		font-family: var(--winui-SymbolThemeFontFamily);
		/* c1-allow: ComboBox_themeresources.xaml:585, `FontSize="12"` on the
		   `FontIconSource` inside `AnimatedIcon.FallbackIconSource` */
		font-size: 12px;
		line-height: normal;
		color: var(--winui-ComboBoxDropDownGlyphForeground);
	}

	.chevron::before {
		/* c1-allow: ComboBox_themeresources.xaml:585, `Glyph="&#xE70D;"` on the
		   `FontIconSource` inside `AnimatedIcon.FallbackIconSource` — the glyph the
		   original draws under WD-006 */
		content: '\00e70d' / '';
	}

	/* The popup: the `PopupBorder` Border at :590 carries `Background`, `BorderBrush`,
	   `BorderThickness`, `Padding` and `CornerRadius` from the popup's own resources.
	   The `Margin="0,-0.5,0,-1"` upstream is a half-pixel nudge for XAML's popup
	   placement and is not reproduced here: bits-ui positions the content with Floating UI
	   and a negative fractional margin against a different positioner is noise, not
	   fidelity. `OverlayCornerRadius` is the popup's own corner — distinct from the
	   trigger's `ControlCornerRadius`.

	   It also carries `BackgroundSizing="InnerBorderEdge"` in the attribute list, so the
	   fill's clip is read off the template rather than argued from the property's default
	   chain the way the pickers' flyout presenter needs. The fill stops at the stroke's
	   inner edge; CSS stops it at the border box, so the declaration below says
	   `padding-box`. What it changes is what the stroke lies on: the border colour here is
	   `ComboBoxDropDownBorderBrush`, which aliases `SurfaceStrokeColorFlyoutBrush` and so
	   resolves to `#0000000f` in light and `#00000033` in dark — translucent in both. An
	   unclipped fill is therefore what shows through the ring, and the dropdown's edge reads
	   one flat value wherever the popup is opened. Clipped, the ring takes its colour from
	   what is behind the popup. That last step is read rather than photographed: the template
	   settles the clip, but what the renderer then composites the stroke over is an inference,
	   and the pin carries no render walk to confirm it — `HWWalk.cpp` is not in the checkout.
	   No capture of the original's dropdown exists either. In high contrast both brushes
	   are opaque, though not by way of the flyout key: that block re-points
	   `ComboBoxDropDownBackground` and `ComboBoxDropDownBorderBrush` at
	   `SystemControlBackgroundChromeMediumLowBrush` and
	   `SystemControlForegroundChromeHighBrush`, which resolve to `SystemColorButtonFaceColor`
	   and `SystemColorButtonTextColor` — the same two keys upstream's own HighContrast
	   dictionary maps them to (`ComboBox_themeresources.xaml:168` and `:169`). So the clip
	   cannot be observed there, and the high-contrast baseline is byte-identical across this
	   change where light and dark are not.

	   `min-width` is the one thing the popup takes from outside its own resources. The
	   `ScrollViewer` at :591 binds `MinWidth` to `TemplateSettings.DropDownContentMinWidth`,
	   which WinUI computes as the ComboBox's own width — so upstream's dropdown is never
	   narrower than the control it drops from. bits-ui publishes the trigger's measured
	   width on the content as `--bits-floating-anchor-width`, and `max()` against
	   `ComboBoxPopupThemeMinWidth` keeps the 80 the source states as the floor for a
	   control narrower than that. Without this the popup shrinks to its longest item and
	   the control looks nothing like the original. */
	.popup {
		/* The popup layer. `Popup.svelte`'s `.root` rule carries the whole reason; the short
		   version is that this element is static, so the declaration paints nothing here and
		   is read by the primitive, which mirrors it onto the wrapper it positions. */
		z-index: 1000;
		min-width: max(var(--bits-floating-anchor-width), var(--winui-ComboBoxPopupThemeMinWidth));
		background: var(--winui-ComboBoxDropDownBackground) padding-box;
		border-style: solid;
		border-width: var(--winui-ComboBoxDropdownBorderThickness);
		border-color: var(--winui-ComboBoxDropDownBorderBrush);
		padding: var(--winui-ComboBoxDropdownBorderPadding);
		border-radius: var(--winui-OverlayCornerRadius);
		color: var(--winui-ComboBoxDropDownForeground);
	}

	/* The list: the `ScrollViewer` at :591 carries `Foreground` for the items, and the
	   `ItemsPresenter` carries `Margin="{ThemeResource ComboBoxDropdownContentMargin}"`
	   at :592 — the gap between the popup's border and the items. */
	.list {
		display: flex;
		flex-direction: column;
		margin: var(--winui-ComboBoxDropdownContentMargin);
		min-width: 0;
	}

	/* The item: the `LayoutRoot` Grid at :614 carries `Margin="5,2,5,2"`,
	   `CornerRadius="{TemplateBinding CornerRadius}"` (which the
	   `DefaultComboBoxItemStyle` sets to `ComboBoxItemCornerRadius`), and `Padding` and
	   `Background`/`BorderBrush` template-bound to the eight `ComboBoxItem*` brushes.
	   The `Control.IsTemplateFocusTarget="True"` puts the focus visual on the item. The
	   `Margin="5,2,5,2"` is on the `LayoutRoot` upstream; here it is on the item div,
	   which is the visual equivalent for a flex-column list. */
	.item {
		position: relative;
		display: flex;
		align-items: center;
		/* c1-allow: ComboBox_themeresources.xaml:614, the item's `LayoutRoot` carries
		   `Margin="5,2,5,2"` — XAML writes left,top,right,bottom and CSS writes
		   top,right,bottom,left. It is what insets each row from the popup's edge and
		   gives the selected row's rounded highlight its floating look. */
		margin: 2px 5px;
		padding: var(--winui-ComboBoxItemThemePadding);
		border-radius: var(--winui-ComboBoxItemCornerRadius);
		background: var(--winui-ComboBoxItemBackground);
		color: var(--winui-ComboBoxItemForeground);
		cursor: pointer;
	}

	/* No border on an item, and no `ComboBoxItemBorderBrush` anywhere in this component.
	   `DefaultComboBoxItemStyle` at ComboBox_themeresources.xaml:600 sets `Foreground`,
	   `Background`, `Padding` and `CornerRadius` and no `BorderThickness`, so the item's
	   border is the framework default of zero — and the nine `ComboBoxItemBorderBrush*`
	   keys the dictionary defines are read by nothing, the same shape as the pre-Fluent
	   `*ThemeBrush` families. A zero-width border with a colour on it is a declaration that
	   looks like a decision and is not one. */

	/* The selection indicator, and the focus indicator: **there are two `Pill` Rectangles**
	   and they share the `ComboBoxItemPill` style. The item's is at :759 and the trigger's
	   at :572 — this comment used to cite :572 for the item's and hand it the trigger's
	   `Margin="1,0,0,0"`, which the item does not have. The style (:349) sets seven things:
	   `HorizontalAlignment="Left"`, which is what makes a `Margin` a left inset rather than
	   an offset from a centred box; `Width` and `Height` from `ComboBoxItemPillWidth` and
	   `…Height`; `Fill` from `ComboBoxItemPillFillBrush`; `RadiusX` and `RadiusY` from
	   `ComboBoxItemPillCornerRadius` through the `TopLeftCornerRadiusDoubleValueConverter`
	   and the `BottomRight` one, which is how a `CornerRadius` resource reaches two `Double`
	   properties; and `RenderTransformOrigin="0.5,0.5"`, which is what centres the item's
	   pressed scale. `Opacity="0"` is on each Rectangle rather than in the style. On the item
	   the five `Selected*` states set `Opacity` to 1, and `SelectedPressed` (:721) scales by
	   `ComboBoxItemPillMinScale` (0.625) — on `ScaleY` alone (:726), which is why the rule
	   below writes the two-axis form. The scale animates on the way down and not on the way
	   back; the pressed rule below says why. The token is emitted unitless and read raw,
	   because it is a ratio rather than a length — `scripts/tokens/manifest.mjs` lists it in
	   `DOUBLE_RATIOS` and that set's comment says why a ratio does not get a unit put on it. */
	.pill {
		position: absolute;
		top: 50%;
		translate: 0 -50%;
		width: var(--winui-ComboBoxItemPillWidth);
		height: var(--winui-ComboBoxItemPillHeight);
		border-radius: var(--winui-ComboBoxItemPillCornerRadius);
		background: var(--winui-ComboBoxItemPillFillBrush);
	}

	/* The item's sits on the left edge of its own box: `:759` carries no `Margin`, and the
	   item writes no border, so the padding box an absolutely positioned child is offset
	   from is the border box as well. `Opacity="0"` is transcribed as written here because
	   the deviation below was taken only where it was measured to cost something, and this
	   is not that place: seven of these sit in the resting document of this route's own
	   baseline and none of them moved a pixel. */
	.item > .pill {
		left: 0;
		opacity: 0;
	}

	/* The trigger's carries `Margin="1,0,0,0"` and is measured from the Grid cell, which is
	   the border box — while `left` is measured from the padding box, one border in. Hence
	   the subtraction. It computes to zero while the border is one pixel, which is the only
	   width the layer emits, so nothing here can tell it from a literal `0`; write it anyway,
	   because upstream would keep the pill one pixel from the outer edge at any border width
	   — the Rectangle is a sibling of the Border, not a child of it — and a literal would
	   move it by the difference.

	   c1-allow: ComboBox_themeresources.xaml:572, `Margin="1,0,0,0"` — XAML writes
	   left,top,right,bottom, so the 1 is the left inset and the rest are zero.

	   Vertical centring is exact rather than approximate for the same reason and only
	   while the reason holds: the Rectangle has a `Height` and no `VerticalAlignment`, so
	   it centres in the cell, which is the border box; `top: 50%` centres in the padding
	   box, and `ComboBoxBorderThemeThickness` is `1px` on all four sides in every theme —
	   one definition, in `:root` — so the two boxes share a centre. */
	.trigger > .pill {
		left: calc(1px - var(--winui-ComboBoxBorderThemeThickness));
		visibility: hidden;
	}

	/* The same `Focused` state that raises `HighlightBackground` raises the Pill, at :476
	   against :475, and `FocusedPressed` raises both again at :490 and :491. There is no
	   transform on either: `PillTransform` stays at `ScaleY="1"` in both states, and the
	   scaling one is the item's `SelectedPressed`. `PointerFocused` at :504 raises nothing,
	   which is what `:focus-visible` already means.

	   **`FocusedDropDown` at :505 is the fifth state in the group and it is why both raising
	   rules carry `:not([aria-expanded='true'])`.** Its own Storyboard only shows
	   `PopupBorder`, but it is in `FocusStates` (the group closes at :516), so entering it
	   ends `Focused`'s storyboard and returns `HighlightBackground` and `Pill` to
	   `Opacity="0"`. **With the drop-down open, upstream draws neither.** That it is entered
	   at all is the control's own decision rather than the template's, and it is written out:
	   `ComboBox_Partial.cpp:877` tests `isDropDownOpen` *before* it looks at `FocusState`, so
	   an open drop-down is `FocusedDropDown` however focus was acquired — a pointer-opened
	   list is not `PointerFocused`. A rule keyed on `:focus-visible` alone draws both, because
	   focus does not leave the trigger when the popup opens; closing it restores the attribute
	   and with it the state.

	   Nothing here disturbs the ring. The Pill occupies x = 1 to 4 measured from the border
	   box and the ring is the border itself at x = 0 to 1, so the two share no pixel and
	   their paint order — the Pill over the Border upstream, `.trigger::after` over the
	   Pill here, because a pseudo-element paints after its host's children — cannot show.

	   **`visibility` rather than `opacity`, and that is measured rather than preferred.**
	   Upstream writes `Opacity="0"` and animates it to 1 over `Duration="0"`, so the two
	   spellings are the same picture; the item's pill below keeps `opacity` because its
	   pressed state scales it. On the trigger it cost something. A statically transparent
	   element sitting in the resting document made Chromium give up LCD subpixel
	   antialiasing for the text around it: `color-picker-horizontal`'s three-theme baseline
	   moved 2538 pixels in the light theme alone, across the whole channel column of a
	   control that renders one of these. The glyph pixels are unambiguous — `252,252,228`
	   became `242,242,242` and `157,70,94` became `108,108,108`, subpixel triples collapsing
	   to grey — and a few pixels on each box's rounded corners moved with them, which that
	   cause does not explain by itself and which is left unexplained rather than assumed.
	   `visibility: hidden` restores the baseline exactly. **Nothing in the local lane holds
	   this**: headless Chromium on Linux does no subpixel antialiasing, so the guest baseline
	   is the only thing that would fail if the declaration went back. */
	.trigger:focus-visible:not([aria-expanded='true']) > .pill {
		visibility: visible;
	}

	/* The visible label inside the item, and it reserves nothing for the pill. This carried
	   `margin-left: 4px` until 2026-09-24, on the reading that the pill was three pixels wide
	   plus a one-pixel `Margin` — the trigger's margin, which the item's Rectangle at :759
	   does not have. Upstream reserves nothing either way: the item's `LayoutRoot` (:614)
	   declares no `ColumnDefinitions`, so the Pill and the `ContentPresenter` resolve to the
	   same cell and the pill overlaps the padding. The `ContentPresenter` carries
	   `Margin="{TemplateBinding Padding}"`, which is `ComboBoxItemThemePadding`, so upstream's
	   label starts eleven pixels in and stays there when the row is selected. Ours started at
	   fifteen. */
	.item-content {
		flex: 1 1 auto;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* The focus visual, and it is not a band. `DefaultComboBoxStyle` sets
	   `UseSystemFocusVisuals` to `{ThemeResource IsApplicationFocusVisualKindReveal}` at
	   ComboBox_themeresources.xaml:380, and that resource is `False` in all three of
	   generic.xaml's dictionaries (:331, :2956, :5940) — so the framework draws no focus rect
	   on this control and the template draws its own. `DefaultComboBoxItemStyle` sets the
	   same property to a literal `True` at :608, which is why the popup item below *does*
	   carry a band; the asymmetry is upstream's. Button sets the same property from a third
	   key — `{StaticResource UseSystemFocusVisuals}` at Button_themeresources.xaml:166 and
	   :309, which is `True` at generic.xaml:1527 — so the band Button.svelte's
	   `.root:focus-visible::before` draws is evidence for Button and for nothing else.

	   What the template draws is the `HighlightBackground` Border at :570, taken from
	   `Opacity="0"` to 1 by the `Focused` state at :475. That state moves four other things.
	   The `Pill` at :572 is one and is reproduced above. The other three are foregrounds, of
	   which two alias, in this pin, exactly what their resting keys alias in all three
	   dictionaries — only the chevron's differs, and only in high contrast, where it resolves
	   to the same colour. Its rule is with the `FocusedPressed` brushes, below. */
	.trigger:focus-visible {
		outline: none;
	}

	.trigger:focus-visible:not([aria-expanded='true'])::before {
		content: '';
		position: absolute;
		/* Under the box, the way `HighlightBackground` is under `Background` by being
		   declared before it. `.root` carries the `isolation` this depends on. */
		z-index: -1;
		/* c1-allow: ComboBox_themeresources.xaml:570, `Margin="-4"` on `HighlightBackground`
		   — four pixels outside the `Background` Border's own box. An absolutely positioned
		   child is placed against its containing block's padding box, so the trigger's border
		   width is added to reach that box first. */
		inset: calc(-4px - var(--winui-ComboBoxBorderThemeThickness));
		border: var(--winui-ComboBoxBackgroundBorderThicknessFocused) solid
			var(--winui-ComboBoxBackgroundBorderBrushFocused);
		/* Upstream's own radius rather than a concentric one. `ControlCornerRadius` is 4 and
		   this box is 4 outside it, so concentric would be 8; `ComboBoxHiglightBorderCornerRadius`
		   is 7 (:343). `Higlight` is upstream's spelling. */
		border-radius: var(--winui-ComboBoxHiglightBorderCornerRadius);
		/* The stroke is the outer two of the four pixels and this fill is the inner two: the
		   box's own fill covers everything from its border box inward. In high contrast the
		   two swap roles — the stroke resolves to `SystemControlHighlightTransparentBrush`
		   (:143) and this fill to `SystemControlHighlightListAccentLowBrush` through
		   `ComboBoxBackgroundUnfocused` (:142), so a focused box grows four pixels of accent
		   with no edge.

		   `padding-box` for the reason `.trigger`'s own fill carries it: the Border
		   writes no `BackgroundSizing`, so upstream's fill stops at its inner border edge and
		   CSS's would not. It is worth one level and only in light, where
		   `FocusStrokeColorOuter` is `#000000e4` in `:root` and composites to 27 over
		   this fill against 26 over the page behind it; dark and high contrast paint the
		   stroke opaque. Written because the rule is the rule, not because a test can see it
		   — none can, and `59f5513` and `561bd39` are both this same mistake in this same
		   component. */
		background: var(--winui-ComboBoxBackgroundFocused) padding-box;
		pointer-events: none;
	}

	/* The focus visual for the popup items — the `FocusVisualMargin="-3"` upstream at
	   :609 puts the band three pixels outside the item's border box. */
	.item:focus-visible {
		outline: none;
	}

	.list:has(.item:focus-visible)::before {
		content: '';
		position: absolute;
		/* c1-allow: ComboBox_themeresources.xaml:609, `FocusVisualMargin="-3"` */
		inset: -3px;
		/* c1-allow: the same 3px vertical offset Button, CheckBox, RadioButton and
		   ToggleSwitch carry, so the band stays concentric with the item's own corner */
		border-radius: calc(var(--winui-ComboBoxItemCornerRadius) + 3px);
		box-shadow:
			inset 0 0 0 var(--winui-FocusVisualPrimaryThickness)
				var(--winui-SystemControlFocusVisualPrimaryBrush),
			inset 0 0 0
				calc(var(--winui-FocusVisualPrimaryThickness) + var(--winui-FocusVisualSecondaryThickness))
				var(--winui-SystemControlFocusVisualSecondaryBrush);
		pointer-events: none;
	}

	/* ----- Trigger: PointerOver ----- */
	.trigger:hover {
		background: var(--winui-ComboBoxBackgroundPointerOver) padding-box;
	}

	.trigger:hover::after {
		background: var(--winui-ComboBoxBorderBrushPointerOver);
	}

	.trigger:hover .value {
		color: var(--winui-ComboBoxForegroundPointerOver);
	}

	.trigger:hover .placeholder {
		color: var(--winui-ComboBoxPlaceHolderForeground);
	}

	.trigger:hover .chevron {
		color: var(--winui-ComboBoxDropDownGlyphForeground);
	}

	/* ----- Trigger: Pressed (ComboBox_themeresources.xaml:430) — keyed on `data-pressed`,
	   the pointer flag the script keeps, not on `:active`; see `pressed`. ----- */
	.trigger[data-pressed] {
		background: var(--winui-ComboBoxBackgroundPressed) padding-box;
	}

	.trigger[data-pressed]::after {
		background: var(--winui-ComboBoxBorderBrushPressed);
	}

	.trigger[data-pressed] .value {
		color: var(--winui-ComboBoxForegroundPressed);
	}

	.trigger[data-pressed] .placeholder {
		color: var(--winui-ComboBoxPlaceHolderForegroundPressed);
	}

	/* ----- Trigger: the focus states' brushes. `Focused` (ComboBox_themeresources.xaml:473) and
	   `FocusedPressed` (:488) are in `FocusStates`, and each animates the same three foregrounds
	   `CommonStates` does. A property holds one animation at a time
	   (`CTimeManager::SetAnimationOnProperty`, TimeManager.cpp:94-120, and the setter path that
	   clears it for the same reason, VisualStateSetterHelper.cpp:126-142), and the one begun last
	   takes it: `CStoryboard::Begin` begins each child synchronously, and `CAnimation::OnBegin`
	   registers itself and calls `TakeControlOfTarget`, which releases the animation it replaces
	   (`dxaml/xcp/core/animation/storyboard.cpp` and `animation.cpp` at the pinned commit, outside
	   the sparse checkout). A press on a keyboard-focused trigger begins `Pressed` and then
	   `FocusedPressed` in one `UpdateVisualState`, `CommonStates` first
	   (ComboBox_Partial.cpp:850-905), so the focus state's three brushes are what show. Of
	   `Focused`'s three keys only the chevron's differs from rest's, and only in high contrast,
	   where the two resolve to the same button text colour; its rule is here for the key, and
	   changes no pixel in this pin. `PointerOver` animates no chevron brush, so neither rule gives
	   way under hover. Keyed like the Pill, on `:focus-visible` and a closed list. ----- */
	.trigger:focus-visible:not([aria-expanded='true']) .chevron {
		color: var(--winui-ComboBoxDropDownGlyphForegroundFocused);
	}

	.trigger[data-pressed]:focus-visible:not([aria-expanded='true']) .value {
		color: var(--winui-ComboBoxForegroundFocusedPressed);
	}

	.trigger[data-pressed]:focus-visible:not([aria-expanded='true']) .placeholder {
		color: var(--winui-ComboBoxPlaceHolderForegroundFocusedPressed);
	}

	.trigger[data-pressed]:focus-visible:not([aria-expanded='true']) .chevron {
		color: var(--winui-ComboBoxDropDownGlyphForegroundFocusedPressed);
	}

	/* ----- Items: PointerOver (`data-highlighted` is bits-ui's hover/active key) ----- */
	.item[data-highlighted] {
		background: var(--winui-ComboBoxItemBackgroundPointerOver);
		color: var(--winui-ComboBoxItemForegroundPointerOver);
	}

	/* ----- Items: Pressed ----- */
	.item:active {
		background: var(--winui-ComboBoxItemBackgroundPressed);
		color: var(--winui-ComboBoxItemForegroundPressed);
	}

	/* ----- Items: Selected ----- */
	.item[data-selected] {
		background: var(--winui-ComboBoxItemBackgroundSelected);
		color: var(--winui-ComboBoxItemForegroundSelected);
	}

	.item[data-selected] > .pill {
		opacity: 1;
	}

	/* ----- Items: Selected + PointerOver ----- */
	.item[data-selected][data-highlighted] {
		background: var(--winui-ComboBoxItemBackgroundSelectedPointerOver);
		color: var(--winui-ComboBoxItemForegroundSelectedPointerOver);
	}

	/* ----- Items: Selected + Pressed ----- */
	.item[data-selected]:active {
		background: var(--winui-ComboBoxItemBackgroundSelectedPressed);
		color: var(--winui-ComboBoxItemForegroundSelectedPressed);
	}

	.item[data-selected]:active > .pill {
		/* `SelectedPressed` (:721) animates `ScaleY` — one axis, at :726 — to
		   `ComboBoxItemPillMinScale`, hence the two-value form, which leaves the width alone.
		   The token is a ratio and is emitted unitless, which is why it is read raw — see
		   `DOUBLE_RATIOS` in `scripts/tokens/manifest.mjs` for why a ratio gets no unit. */
		scale: 1 var(--winui-ComboBoxItemPillMinScale);
		/* The keyframe at :727 reaches that scale at `ComboBoxItemScaleAnimationDuration`,
		   167ms, along `KeySpline="0,0,0,1"`, which is a cubic Bézier with the same four
		   control values in the same order. No `VisualTransition` is declared in the group,
		   so leaving the state ends the storyboard and the scale is back at 1 at once:
		   declaring the transition on this rule alone, rather than on `.pill`, is what makes
		   the press animate and the release snap.

		   Under reduced motion it still runs, as upstream's does (ADR 0016). For a
		   non-essential storyboard the visual state manager reads the system's animation
		   setting to skip `VisualTransition` and generated storyboards to their end
		   (`VisualStateManagerActuator.cpp:602`) and to settle a state's theme animations
		   (:394); a state's own keyframe animations, which are all `SelectedPressed` has, are
		   started as `StoryboardType::State` (:202) and run whatever the setting. */
		transition: scale var(--winui-ComboBoxItemScaleAnimationDuration)
			/* c1-allow: ComboBox_themeresources.xaml:727, `KeySpline="0,0,0,1"` on the
			   `SplineDoubleKeyFrame` */
			cubic-bezier(0, 0, 0, 1);
	}

	/* ----- Items: Disabled ----- */
	.item[data-disabled] {
		background: var(--winui-ComboBoxItemBackgroundDisabled);
		color: var(--winui-ComboBoxItemForegroundDisabled);
		cursor: default;
	}

	/* ----- Items: Selected + Disabled ----- */
	.item[data-selected][data-disabled] {
		background: var(--winui-ComboBoxItemBackgroundSelectedDisabled);
		color: var(--winui-ComboBoxItemForegroundSelectedDisabled);
	}

	/* ----- Trigger: Disabled — written last so the five disabled brushes win over `:hover`
	   and `data-pressed`. The `FocusedPressed` rules outweigh these and need not lose to them,
	   since a disabled `<button>` takes no focus. A disabled trigger must not light up under the
	   pointer or while being pressed. `data-disabled` is on the root rather than `:disabled`
	   because the root is a `<div>` and the trigger is a `<button>`. */
	.root[data-disabled] .trigger {
		background: var(--winui-ComboBoxBackgroundDisabled) padding-box;
		cursor: default;
	}

	.root[data-disabled] .trigger::after {
		background: var(--winui-ComboBoxBorderBrushDisabled);
	}

	.root[data-disabled] .trigger .value {
		color: var(--winui-ComboBoxForegroundDisabled);
	}

	/* `Disabled` gives the placeholder its own brush (ComboBox_themeresources.xaml:464), where
	   rest's was painted here until 2026-09-25 — nothing showed it, because the only disabled
	   specimen had a selection. */
	.root[data-disabled] .trigger .placeholder {
		color: var(--winui-ComboBoxPlaceHolderForegroundDisabled);
	}

	.root[data-disabled] .trigger .chevron {
		color: var(--winui-ComboBoxDropDownGlyphForegroundDisabled);
	}

	.root[data-disabled] .header {
		color: var(--winui-ComboBoxHeaderForegroundDisabled);
	}

	/* No `.root[data-disabled] .description` rule: the description's colour is the same in
	   every state, including disabled — upstream's `DescriptionPresenter` template never
	   overrides it. */
	.description {
		color: var(--winui-SystemControlDescriptionTextForegroundBrush);
		white-space: normal;
	}
	/* EditableText spans both columns; the input is also the floating anchor and spans
	   the border box. ComboBox_themeresources.xaml:580, 770-813. The existing trigger
	   class supplies the unfocused ring, hover, disabled and box-focus visuals. */
	/* A `<div>`, not the `<button>` `.trigger` was written for, so the border-box sizing the
	   user agent gives a button has to be stated: without it the box is the minimum height
	   plus its border, and grows again when the focused bottom border thickens. */
	.box {
		box-sizing: border-box;
		padding: 0;
		cursor: text;
	}
	/* The width. The input is placed over the box and gives it none, so a box with no width of
	   its own would sit at `ComboBoxThemeMinWidth` and cut its text off. Upstream's unfocused
	   faceplate is the `ContentPresenter` holding the text (`UpdateEditableContentPresenterTextBlock`
	   in ComboBox_Partial.cpp), or the placeholder when there is none, measured like the
	   non-editable trigger's label: the padding, the text, and the 38px glyph column, all from
	   the grid cell's edge, which is the border's outer edge. This invisible copy takes that
	   measure and hands the border back, so the padding is counted from the same edge and the
	   box is `ComboBoxMinHeight` until padding and text outgrow it, as upstream's row is. Under
	   a consumer's width it gives way. */
	.sizer {
		visibility: hidden;
		min-width: 0;
		overflow: hidden;
		white-space: pre;
		margin: calc(-1 * var(--winui-ComboBoxBorderThemeThickness));
		padding: var(--winui-ComboBoxPadding);
		/* c1-allow: ComboBox_themeresources.xaml:567, the reserved 38px glyph column. */
		padding-right: 38px;
	}
	.input {
		position: absolute;
		inset: calc(-1 * var(--winui-ComboBoxBorderThemeThickness));
		width: calc(100% + 2 * var(--winui-ComboBoxBorderThemeThickness));
		height: calc(100% + 2 * var(--winui-ComboBoxBorderThemeThickness));
		box-sizing: border-box;
		padding: var(--winui-ComboBoxPadding);
		/* c1-allow: ComboBox_themeresources.xaml:567, the reserved 38px glyph column. */
		padding-right: 38px;
		background: none;
		border: none;
		outline: none;
		font: inherit;
		color: var(--winui-ComboBoxForeground);
	}
	.input::placeholder {
		color: var(--winui-ComboBoxPlaceHolderForeground);
	}
	.box:hover .input {
		color: var(--winui-ComboBoxForegroundPointerOver);
	}
	/* Match TextBox's focused ring: a gradient brush cannot be border-color.
	   Focus is scoped to the text box, rather than focus anywhere in the control.
	   The focused border is the TextBox's own `BorderElement` (:798, :806), drawn inside the
	   grid cell over the ComboBox's, so the ComboBox's border and everything placed against
	   it — the overlay, the chevron — stay where they were, and the ComboBox's border still
	   shows through the TextBox's translucent one — measured on the reference Gallery's
	   "Font Size" example at 100% in light theme, its focused side edge reads 216 on a 243 card
	   where one layer reads 228. So the ring is a second layer over
	   `::after`, drawn from the outer edge inward at the token's widths — 1,1,1,2 in light and
	   dark, 2 on every side in high contrast. `::before` is free here: the highlight that
	   otherwise uses it needs the box itself focused, and here the input is. */
	.box:has(.input:focus) {
		background: var(--winui-TextControlBackgroundFocused) padding-box;
	}
	.box:has(.input:focus)::before {
		content: '';
		position: absolute;
		inset: calc(-1 * var(--winui-ComboBoxBorderThemeThickness));
		z-index: 3;
		border-radius: inherit;
		padding: var(--winui-TextControlBorderThemeThicknessFocused);
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask-composite: exclude;
		pointer-events: none;
		background: var(--winui-TextControlBorderBrushFocused);
	}
	/* `ContentElement`'s margin is the TextBox's own `BorderThickness` and its padding
	   `ComboBoxEditableTextPadding` (:342, :580, :807). That property is
	   `TextControlBorderThemeThickness`, 1 in every theme: the Focused state thickens
	   `BorderElement` alone (:798), so the text does not move when the ring does. A
	   transparent border carries it, because a multi-value padding token cannot be added to
	   in calc(); the same border is what stops the background one border in, as
	   `BackgroundSizing="InnerBorderEdge"` does on the TextBox. */
	.box .input:focus,
	.box:focus .input {
		border: solid transparent;
		border-width: var(--winui-TextControlBorderThemeThickness);
		background-clip: padding-box;
		padding: var(--winui-ComboBoxEditableTextPadding);
	}
	.box .input:focus {
		color: var(--winui-TextControlForegroundFocused);
	}
	/* The TextBox keeps its size while focus is anywhere in the control and collapses only
	   when focus leaves it (`EnsureTextBoxIsEnabled`, `OnLostFocus` in ComboBox_Partial.cpp).
	   So with focus on the control itself — Escape while open — it is there in its `Normal`
	   state, painting `TextControlBackground` over the Pill declared before it (:572, :580):
	   the reference draws that pill at 30% in light theme, and high contrast's background is
	   opaque, so there it hides the pill. The text keeps its colour: the reference draws it in
	   the primary brush here, though the template binds the placeholder's (:580). */
	.box:focus .input {
		border-radius: inherit;
		background: var(--winui-TextControlBackground);
	}
	.input::selection {
		background: var(--winui-TextControlSelectionHighlightColor);
	}
	.input:focus::placeholder {
		color: var(--winui-TextControlPlaceholderForegroundFocused);
	}
	.box:has(.input:focus) .chevron {
		color: var(--winui-ComboBoxEditableDropDownGlyphForeground);
	}
	.box .chevron {
		z-index: 2;
		pointer-events: none;
	}
	.overlay {
		position: absolute;
		/* c1-allow: ComboBox_themeresources.xaml:581, Margin=4 and Width=30. The margin is
		   measured from the grid cell, which is the outer edge; this element is placed against
		   the padding box, one border in, so the border is handed back as `.chevron` does. */
		right: calc(4px - var(--winui-ComboBoxBorderThemeThickness));
		top: calc(4px - var(--winui-ComboBoxBorderThemeThickness));
		bottom: calc(4px - var(--winui-ComboBoxBorderThemeThickness));
		width: 30px;
		z-index: 1;
		border-radius: var(--winui-ComboBoxDropDownButtonBackgroundCornerRadius);
		background: transparent;
		cursor: pointer;
	}
	.overlay:hover {
		background: var(--winui-ComboBoxDropDownBackgroundPointerOver);
	}
	.overlay:active {
		background: var(--winui-ComboBoxDropDownBackgroundPointerPressed);
	}
	.box:has(.input:focus) .overlay:active {
		background: var(--winui-ComboBoxFocusedDropDownBackgroundPointerPressed);
	}
	.root[data-popup-side='bottom'] .box {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}
	.root[data-popup-side='top'] .box {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}
	.editable-popup[data-side='bottom'] {
		border-top-left-radius: 0;
		border-top-right-radius: 0;
	}
	.editable-popup[data-side='top'] {
		border-bottom-left-radius: 0;
		border-bottom-right-radius: 0;
	}
	.root[data-disabled] .input {
		color: var(--winui-ComboBoxForegroundDisabled);
	}
	.root[data-disabled] .input::placeholder {
		color: var(--winui-ComboBoxPlaceHolderForegroundDisabled);
	}
	.root[data-disabled] .overlay {
		background: transparent;
		cursor: default;
	}
</style>
