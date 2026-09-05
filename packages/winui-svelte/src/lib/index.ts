/**
 * The library's public surface. Exports are listed explicitly — `export *` hides its
 * names from every static reader, including the conformance gate that checks each
 * component is snapshotted in all three themes.
 */
export const VERSION = '0.0.0';

export { default as Button } from './components/Button.svelte';
export type { ButtonProps } from './components/Button.svelte';
export { default as CheckBox } from './components/CheckBox.svelte';
export type { CheckBoxProps } from './components/CheckBox.svelte';
export { default as ComboBox } from './components/ComboBox.svelte';
export type { ComboBoxItemData, ComboBoxProps } from './components/ComboBox.svelte';
export { default as NavigationView } from './components/NavigationView.svelte';
export { default as PasswordBox } from './components/PasswordBox.svelte';
export type { PasswordBoxProps } from './components/PasswordBox.svelte';
export { default as RadioButton } from './components/RadioButton.svelte';
export type { RadioButtonProps } from './components/RadioButton.svelte';
export { default as Slider } from './components/Slider.svelte';
export type { SliderProps } from './components/Slider.svelte';
export { default as TextBox } from './components/TextBox.svelte';
export type { TextBoxProps } from './components/TextBox.svelte';
export { default as ToggleSwitch } from './components/ToggleSwitch.svelte';
export type { ToggleSwitchProps } from './components/ToggleSwitch.svelte';
export type {
	NavigationViewDisplayMode,
	NavigationViewEntry,
	NavigationViewHeaderData,
	NavigationViewItemData,
	NavigationViewPaneDisplayMode,
	NavigationViewProps
} from './components/NavigationView.svelte';
export { default as TitleBar } from './components/TitleBar.svelte';
export type { TitleBarProps } from './components/TitleBar.svelte';
