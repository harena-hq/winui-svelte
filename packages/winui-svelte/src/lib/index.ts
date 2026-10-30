/**
 * The release. Semantic versioning applies to these exports and the two stylesheets the package
 * maps, and to nothing else: every other component a consumer places is in `preview.ts`, which
 * promises nothing (ADR 0017).
 * Exports are listed explicitly — `export *` hides its names from every static reader, including
 * the conformance gate that checks this file against `preview.ts`.
 */
export const VERSION = '0.1.0-rc.1';
export { default as Button } from './components/Button.svelte';
export type { ButtonProps } from './components/Button.svelte';
export { default as ContentDialog } from './components/ContentDialog.svelte';
export type { ContentDialogButton, ContentDialogProps } from './components/ContentDialog.svelte';
export { default as ComboBox } from './components/ComboBox.svelte';
export type {
	ComboBoxItemData,
	ComboBoxProps,
	ComboBoxTextSubmittedEventArgs
} from './components/ComboBox.svelte';
export { default as Expander } from './components/Expander.svelte';
export type { ExpanderProps } from './components/Expander.svelte';
export { default as Flyout } from './components/Flyout.svelte';
export type { FlyoutPlacement, FlyoutProps } from './components/Flyout.svelte';
export { default as HyperlinkButton } from './components/HyperlinkButton.svelte';
export type { HyperlinkButtonProps } from './components/HyperlinkButton.svelte';
export { default as InfoBar } from './components/InfoBar.svelte';
export type { InfoBarProps } from './components/InfoBar.svelte';
export { default as MenuFlyout } from './components/MenuFlyout.svelte';
export type {
	MenuFlyoutEntry,
	MenuFlyoutItemData,
	MenuFlyoutProps,
	MenuFlyoutSeparatorData,
	MenuFlyoutSubItemData,
	RadioMenuFlyoutItemData,
	SplitMenuFlyoutItemData,
	ToggleMenuFlyoutItemData
} from './components/MenuFlyout.svelte';
export { default as NavigationView } from './components/NavigationView.svelte';
export { default as NavigationViewItem } from './components/NavigationViewItem.svelte';
export type { NavigationViewItemProps } from './components/NavigationViewItem.svelte';
export { default as ProgressBar } from './components/ProgressBar.svelte';
export type { ProgressBarProps } from './components/ProgressBar.svelte';
export { default as ProgressRing } from './components/ProgressRing.svelte';
export type { ProgressRingProps } from './components/ProgressRing.svelte';
export { default as ScrollView } from './components/ScrollView.svelte';
export type {
	ScrollViewProps,
	ScrollingScrollAnimationStartingEventArgs,
	ScrollingScrollOptions
} from './components/ScrollView.svelte';
export { default as ScrollViewer } from './components/ScrollViewer.svelte';
export type { ScrollViewerProps } from './components/ScrollViewer.svelte';
export { default as TeachingTip } from './components/TeachingTip.svelte';
export type {
	TeachingTipHeroContentPlacementMode,
	TeachingTipPlacementMode,
	TeachingTipProps,
	TeachingTipTailVisibility
} from './components/TeachingTip.svelte';
export { default as TabView } from './components/TabView.svelte';
export type {
	TabViewAddTabButtonClickEventArgs,
	TabViewCloseButtonOverlayMode,
	TabViewItemData,
	TabViewProps,
	TabViewTabContextRequestedEventArgs,
	TabViewWidthMode
} from './components/TabView.svelte';
export { default as TextBox } from './components/TextBox.svelte';
export type { TextBoxProps } from './components/TextBox.svelte';
export { default as ToggleSwitch } from './components/ToggleSwitch.svelte';
export type { ToggleSwitchProps } from './components/ToggleSwitch.svelte';
export { default as ToolTip } from './components/ToolTip.svelte';
export type { ToolTipProps } from './components/ToolTip.svelte';
export type {
	NavigationViewBackButtonVisible,
	NavigationViewDisplayMode,
	NavigationViewEntry,
	NavigationViewHeaderData,
	NavigationViewItemData,
	NavigationViewPaneDisplayMode,
	NavigationViewProps
} from './components/NavigationView.svelte';
export { default as TitleBar } from './components/TitleBar.svelte';
export type { TitleBarProps } from './components/TitleBar.svelte';
// Not a component: WinUI's `Symbol` enum as the code points `glyph` takes. ADR 0012's
// amendment. Generated — see `scripts/symbol/`.
export { Symbol } from './symbol';
export type { SymbolName } from './symbol';

// Not a component: the animation `ScrollView`'s `onScrollAnimationStarting` hands out and takes
// back, which a handler builds its own from.
export { ScrollAnimation } from './scroll-animation';
export type { ScrollAnimationEasing, ScrollVector } from './scroll-animation';
