<script lang="ts">
	import {
		InfoBar,
		provideStrings,
		TeachingTip,
		TextBox,
		ToggleSwitch
	} from '@harena-hq/winui-svelte';
	import {
		CalendarView,
		DatePicker,
		NumberBox,
		PersonPicture,
		TimePicker
	} from '@harena-hq/winui-svelte/preview';
	import Nested from './Nested.svelte';

	/**
	 * `provideStrings`, ADR 0020: a function read as the components draw, so the button below
	 * switches the language in place, and a key the table leaves out, here the switch's Off, falls
	 * to the default. `Nested` sets one key beneath this and hears the rest from here. The
	 * DatePicker's selector is initialised inside the portal its flyout opens, which is what shows
	 * that a provider reaches a component created there.
	 */
	const tables = {
		de: {
			InfoBarCloseButtonName: 'Schließen',
			InfoBarCloseButtonTooltip: 'Schließen (Hinweis)',
			TeachingTipAlternateCloseButtonName: 'Schließen',
			TEXT_TOGGLESWITCH_ON: 'Ein',
			UIA_TEXTBOX_DELETE: 'Löschen',
			WinUISvelteLoopingSelectorNextName: 'Nächstes',
			NumberBoxUpSpinButtonName: 'Mehr',
			TEXT_DATEPICKER_MONTH_PLACEHOLDER: 'Monat',
			TEXT_TIMEPICKER_HOUR_PLACEHOLDER: 'Stunde',
			UIA_AP_TIMEPICKER_HOURNAME: 'Stundenwahl',
			UIA_FLIPVIEW_PREVIOUS: 'Zurück',
			WinUISvelteCalendarViewName: 'Kalender',
			BadgeItemSingular: 'S %1!s! %2!u!',
			BadgeItemPlural1: 'P1 %1!s! %2!u!',
			BadgeItemPlural2: 'P2 %1!s! %2!u!',
			BadgeItemPlural3: 'P3 %1!s! %2!u!',
			BadgeItemPlural4: 'P4 %1!s! %2!u!',
			BadgeItemPlural5: '%2!u! Einträge für %1!s!',
			BadgeItemPlural6: 'P6 %1!s! %2!u!',
			BadgeItemPlural7: 'P7 %1!s! %2!u!'
		},
		en: {}
	};
	let language = $state<'de' | 'en'>('de');
	provideStrings(() => tables[language]);
</script>

<svelte:head><title>Strings — harness</title></svelte:head>

<button type="button" data-switch onclick={() => (language = language === 'de' ? 'en' : 'de')}>
	Switch language
</button>
<InfoBar open title="Title" />
<TextBox value="text" />
<ToggleSwitch aria-label="Switch" />
<TeachingTip open title="Tip" />
<DatePicker />
<TimePicker />
<CalendarView />
<Nested />
<NumberBox spinButtonPlacementMode="inline" aria-label="Number" />
<PersonPicture displayName="Ada" badgeNumber={5} />
{#each [1, 2, 3, 4, 10, 11, 19, 20, 21, 22, 24, 25] as badgeNumber (badgeNumber)}
	<PersonPicture displayName="Ada" {badgeNumber} />
{/each}
<PersonPicture displayName="Ada" badgeNumber={5} badgeText="Nachrichten" />
<PersonPicture displayName="Ada" badgeGlyph="E7C3" />
