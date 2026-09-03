/**
 * The library's public surface. Exports are listed explicitly — `export *` hides its
 * names from every static reader, including the conformance gate that checks each
 * component is snapshotted in all three themes.
 */
export const VERSION = '0.0.0';

export { default as NavigationView } from './components/NavigationView.svelte';
export type {
	NavigationViewDisplayMode,
	NavigationViewEntry,
	NavigationViewHeaderData,
	NavigationViewItemData
} from './components/NavigationView.svelte';
