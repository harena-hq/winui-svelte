/**
 * The library's public surface. Exports are listed explicitly — `export *` hides its
 * names from every static reader, including the conformance gate that checks each
 * component is snapshotted in all three themes.
 */
export const VERSION = '0.0.0';

export { default as Button } from './components/Button.svelte';
export type { ButtonProps } from './components/Button.svelte';
export { default as NavigationView } from './components/NavigationView.svelte';
export { default as TextBox } from './components/TextBox.svelte';
export type { TextBoxProps } from './components/TextBox.svelte';
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
