/**
 * Everything the library builds that a consumer places, the release included, with no stability
 * promise: a name here may change shape or leave in any version. The release is `index.ts`, and
 * semantic versioning applies to it alone (ADR 0017). Exports are listed explicitly, as the
 * index's are — the conformance gate that checks each component is snapshotted in all three
 * themes reads this file, and `export *` hides its names from every static reader.
 */
export const VERSION = '0.0.0';

export { default as AnimatedVisualPlayer } from './components/AnimatedVisualPlayer.svelte';
export type {
	AnimatedVisual,
	AnimatedVisualPlayerProps
} from './components/AnimatedVisualPlayer.svelte';
export { default as AnnotatedScrollBar } from './components/AnnotatedScrollBar.svelte';
export type { AnnotatedScrollBarProps } from './components/AnnotatedScrollBar.svelte';
export { default as AppBarButton } from './components/AppBarButton.svelte';
export type { AppBarButtonProps } from './components/AppBarButton.svelte';
export { default as AppBarSeparator } from './components/AppBarSeparator.svelte';
export type { AppBarSeparatorProps } from './components/AppBarSeparator.svelte';
export { default as AppBarToggleButton } from './components/AppBarToggleButton.svelte';
export type { AppBarToggleButtonProps } from './components/AppBarToggleButton.svelte';
export { default as AutoSuggestBox } from './components/AutoSuggestBox.svelte';
export type { AutoSuggestBoxProps } from './components/AutoSuggestBox.svelte';
export { default as Border } from './components/Border.svelte';
export type { BorderProps } from './components/Border.svelte';
export { default as BreadcrumbBar } from './components/BreadcrumbBar.svelte';
export type { BreadcrumbBarItemData, BreadcrumbBarProps } from './components/BreadcrumbBar.svelte';
export { default as Button } from './components/Button.svelte';
export type { ButtonProps } from './components/Button.svelte';
export { default as CalendarView } from './components/CalendarView.svelte';
export type { CalendarViewProps } from './components/CalendarView.svelte';
export { default as CalendarDatePicker } from './components/CalendarDatePicker.svelte';
export type { CalendarDatePickerProps } from './components/CalendarDatePicker.svelte';
export { default as CheckBox } from './components/CheckBox.svelte';
export type { CheckBoxProps } from './components/CheckBox.svelte';
export { default as CommandBar } from './components/CommandBar.svelte';
export type { CommandBarProps } from './components/CommandBar.svelte';
export { default as CommandBarFlyout } from './components/CommandBarFlyout.svelte';
export type { CommandBarFlyoutProps } from './components/CommandBarFlyout.svelte';
export { default as ContentDialog } from './components/ContentDialog.svelte';
export type { ContentDialogButton, ContentDialogProps } from './components/ContentDialog.svelte';
export { default as ComboBox } from './components/ComboBox.svelte';
export type { ComboBoxItemData, ComboBoxProps } from './components/ComboBox.svelte';
export { default as DatePicker } from './components/DatePicker.svelte';
export type { DatePickerProps } from './components/DatePicker.svelte';
export { default as Ellipse } from './components/Ellipse.svelte';
export type { EllipseProps } from './components/Ellipse.svelte';
export { default as TimePicker } from './components/TimePicker.svelte';
export type { TimePickerProps } from './components/TimePicker.svelte';
export { default as DropDownButton } from './components/DropDownButton.svelte';
export type { DropDownButtonProps } from './components/DropDownButton.svelte';
export { default as Expander } from './components/Expander.svelte';
export type { ExpanderProps } from './components/Expander.svelte';
export { default as FlipView } from './components/FlipView.svelte';
export type { FlipViewProps } from './components/FlipView.svelte';
export { default as FlipViewItem } from './components/FlipViewItem.svelte';
export type { FlipViewItemProps } from './components/FlipViewItem.svelte';
export { default as Flyout } from './components/Flyout.svelte';
export type { FlyoutPlacement, FlyoutProps } from './components/Flyout.svelte';
export { default as HyperlinkButton } from './components/HyperlinkButton.svelte';
export type { HyperlinkButtonProps } from './components/HyperlinkButton.svelte';
export { default as GridView } from './components/GridView.svelte';
export type { GridViewProps } from './components/GridView.svelte';
export { default as GridViewItem } from './components/GridViewItem.svelte';
export type { GridViewItemProps } from './components/GridViewItem.svelte';
export { default as Image } from './components/Image.svelte';
export type { ImageProps } from './components/Image.svelte';
export { default as InfoBadge } from './components/InfoBadge.svelte';
export type { InfoBadgeProps } from './components/InfoBadge.svelte';
export { default as InfoBar } from './components/InfoBar.svelte';
export type { InfoBarProps } from './components/InfoBar.svelte';
export { default as ItemContainer } from './components/ItemContainer.svelte';
export type { ItemContainerProps } from './components/ItemContainer.svelte';
export { default as ItemsView } from './components/ItemsView.svelte';
export type { ItemsViewItemState, ItemsViewProps } from './components/ItemsView.svelte';
export { default as Line } from './components/Line.svelte';
export type { LineProps } from './components/Line.svelte';
export { default as ListView } from './components/ListView.svelte';
export type { ListViewProps } from './components/ListView.svelte';
export { default as ListViewItem } from './components/ListViewItem.svelte';
export type { ListViewItemProps } from './components/ListViewItem.svelte';
export { default as MediaPlayerElement } from './components/MediaPlayerElement.svelte';
export type { MediaPlayerElementProps } from './components/MediaPlayerElement.svelte';
export { default as MediaTransportControls } from './components/MediaTransportControls.svelte';
export type { MediaTransportControlsProps } from './components/MediaTransportControls.svelte';
export { default as ItemsRepeater } from './components/ItemsRepeater.svelte';
export type {
	ItemsRepeaterLayout,
	ItemsRepeaterProps,
	StackLayoutOptions,
	UniformGridLayoutOptions
} from './components/ItemsRepeater.svelte';
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
export { default as MenuBar } from './components/MenuBar.svelte';
export type { MenuBarProps } from './components/MenuBar.svelte';
export { default as MenuBarItem } from './components/MenuBarItem.svelte';
export type { MenuBarItemProps } from './components/MenuBarItem.svelte';
export { default as NavigationView } from './components/NavigationView.svelte';
export { default as NavigationViewItem } from './components/NavigationViewItem.svelte';
export type { NavigationViewItemProps } from './components/NavigationViewItem.svelte';
export { default as NumberBox } from './components/NumberBox.svelte';
export type { NumberBoxProps } from './components/NumberBox.svelte';
export { default as ParallaxView } from './components/ParallaxView.svelte';
export type { ParallaxViewProps } from './components/ParallaxView.svelte';
export { default as PasswordBox } from './components/PasswordBox.svelte';
export type { PasswordBoxProps } from './components/PasswordBox.svelte';
export { default as Path } from './components/Path.svelte';
export type { PathProps } from './components/Path.svelte';
export { default as PersonPicture } from './components/PersonPicture.svelte';
export type { PersonPictureProps } from './components/PersonPicture.svelte';
export { default as PipsPager } from './components/PipsPager.svelte';
export type { PipsPagerProps } from './components/PipsPager.svelte';
export { default as Polygon } from './components/Polygon.svelte';
export type { PolygonProps } from './components/Polygon.svelte';
export { default as Polyline } from './components/Polyline.svelte';
export type { PolylineProps } from './components/Polyline.svelte';
export { default as Pivot } from './components/Pivot.svelte';
export type { PivotItemData, PivotProps } from './components/Pivot.svelte';
export { default as ProgressBar } from './components/ProgressBar.svelte';
export type { ProgressBarProps } from './components/ProgressBar.svelte';
export { default as ProgressRing } from './components/ProgressRing.svelte';
export type { ProgressRingProps } from './components/ProgressRing.svelte';
export { default as Popup } from './components/Popup.svelte';
export type { PopupProps } from './components/Popup.svelte';
export { default as RadioButton } from './components/RadioButton.svelte';
export type { RadioButtonProps } from './components/RadioButton.svelte';
export { default as RadioButtons } from './components/RadioButtons.svelte';
export type { RadioButtonsProps } from './components/RadioButtons.svelte';
export { default as Rectangle } from './components/Rectangle.svelte';
export type { RectangleProps } from './components/Rectangle.svelte';
export { default as RefreshContainer } from './components/RefreshContainer.svelte';
export type { RefreshContainerProps } from './components/RefreshContainer.svelte';
export { default as RefreshVisualizer } from './components/RefreshVisualizer.svelte';
export type { RefreshVisualizerProps } from './components/RefreshVisualizer.svelte';
export { default as RepeatButton } from './components/RepeatButton.svelte';
export type { RepeatButtonProps } from './components/RepeatButton.svelte';
export { default as ScrollView } from './components/ScrollView.svelte';
export type { ScrollViewProps } from './components/ScrollView.svelte';
export { default as ScrollViewer } from './components/ScrollViewer.svelte';
export type { ScrollViewerProps } from './components/ScrollViewer.svelte';
export { default as SelectorBar } from './components/SelectorBar.svelte';
export type { SelectorBarItemData, SelectorBarProps } from './components/SelectorBar.svelte';
export { default as SemanticZoom } from './components/SemanticZoom.svelte';
export type { SemanticZoomProps } from './components/SemanticZoom.svelte';
export { default as Slider } from './components/Slider.svelte';
export type { SliderProps } from './components/Slider.svelte';
export { default as SplitButton } from './components/SplitButton.svelte';
export type { SplitButtonProps } from './components/SplitButton.svelte';
export { default as SplitView } from './components/SplitView.svelte';
export type { SplitViewProps } from './components/SplitView.svelte';
export { default as SystemBackdropElement } from './components/SystemBackdropElement.svelte';
export type { SystemBackdropElementProps } from './components/SystemBackdropElement.svelte';
export { default as TeachingTip } from './components/TeachingTip.svelte';
export type {
	TeachingTipHeroContentPlacementMode,
	TeachingTipPlacementMode,
	TeachingTipProps,
	TeachingTipTailVisibility
} from './components/TeachingTip.svelte';
export { default as TabView } from './components/TabView.svelte';
export type {
	TabViewCloseButtonOverlayMode,
	TabViewItemData,
	TabViewProps,
	TabViewWidthMode
} from './components/TabView.svelte';
export { default as TextBox } from './components/TextBox.svelte';
export type { TextBoxProps } from './components/TextBox.svelte';
export { default as TextBlock } from './components/TextBlock.svelte';
export type { TextBlockProps, TextBlockStyleName } from './components/TextBlock.svelte';
export { default as RichTextBlock } from './components/RichTextBlock.svelte';
export type { RichTextBlockProps } from './components/RichTextBlock.svelte';
export { default as TreeView } from './components/TreeView.svelte';
export type { TreeViewProps } from './components/TreeView.svelte';
export { default as TreeViewItem } from './components/TreeViewItem.svelte';
export type { TreeViewItemProps } from './components/TreeViewItem.svelte';
export { default as Viewbox } from './components/Viewbox.svelte';
export type { ViewboxProps } from './components/Viewbox.svelte';
export { default as WebView2 } from './components/WebView2.svelte';
export type { WebView2Props } from './components/WebView2.svelte';
export { default as ToggleButton } from './components/ToggleButton.svelte';
export type { ToggleButtonProps } from './components/ToggleButton.svelte';
export { default as ToggleSplitButton } from './components/ToggleSplitButton.svelte';
export type { ToggleSplitButtonProps } from './components/ToggleSplitButton.svelte';
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
export { default as Bold } from './components/Bold.svelte';
export type { BoldProps } from './components/Bold.svelte';
export { default as Hyperlink } from './components/Hyperlink.svelte';
export type { HyperlinkProps } from './components/Hyperlink.svelte';
export { default as RatingControl } from './components/RatingControl.svelte';
export type { RatingControlProps } from './components/RatingControl.svelte';
export { default as ColorSpectrum } from './components/ColorSpectrum.svelte';
export type {
	ColorSpectrumComponents,
	ColorSpectrumProps,
	ColorSpectrumShape,
	HsvColor
} from './components/ColorSpectrum.svelte';
export { default as ColorPickerSlider } from './components/ColorPickerSlider.svelte';
export type {
	ColorPickerHsvChannel,
	ColorPickerSliderProps
} from './components/ColorPickerSlider.svelte';
export { default as ColorPicker } from './components/ColorPicker.svelte';
export type { ColorPickerProps } from './components/ColorPicker.svelte';
export { default as Italic } from './components/Italic.svelte';
export type { ItalicProps } from './components/Italic.svelte';
export { default as LineBreak } from './components/LineBreak.svelte';
export type { LineBreakProps } from './components/LineBreak.svelte';
export { default as Paragraph } from './components/Paragraph.svelte';
export type { ParagraphProps } from './components/Paragraph.svelte';
export { default as InlineUIContainer } from './components/InlineUIContainer.svelte';
export type { InlineUIContainerProps } from './components/InlineUIContainer.svelte';
export { default as Run } from './components/Run.svelte';
export type { RunProps } from './components/Run.svelte';
export { default as Span } from './components/Span.svelte';
export type { SpanProps } from './components/Span.svelte';
export { default as Underline } from './components/Underline.svelte';
export type { UnderlineProps } from './components/Underline.svelte';
// Not a component: WinUI's `Symbol` enum as the code points `glyph` takes. ADR 0012's
// amendment. Generated — see `scripts/symbol/`.
export { Symbol } from './symbol';
export type { SymbolName } from './symbol';
