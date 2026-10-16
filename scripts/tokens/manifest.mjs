import { dropShadowRecipe } from './drop-shadow-recipe.mjs';

/**
 * The v1 token selection, as data.
 *
 * Everything here is a measurement or a decision, and neither is improved by being
 * expressed as control flow: a reader checking whether a key is deliberately absent
 * should find the answer by reading a list, not by following the generator. There is
 * no logic in this file on purpose.
 */

/**
 * The four base dictionaries v1 emits from — the palette, the small common
 * dictionary, the corner radii, and the type ramp. They are the larger half of the
 * seed; `ADDITIONAL_KEYS` below is the other, and the closure runs over both.
 *
 * Per-control tokens land with their control tranche: emitting all 3074 extracted keys
 * would drag in Reveal and the rest of the material vocabulary, which v1 cannot express
 * and must not fake. Acrylic is the exception the acceptance surface forced, and it is
 * not an exception to that rule — WD-002 emits the `FallbackColor` WinUI itself paints,
 * not an approximation of the material. D12, plan.md "Roadmap → v1".
 */
export const SOURCE_FILES = [
	'controls/dev/CommonStyles/Common_themeresources_any.xaml',
	'controls/dev/CommonStyles/Common_themeresources.xaml',
	'controls/dev/CommonStyles/CornerRadius_themeresources.xaml',
	'controls/dev/CommonStyles/TextBlock_themeresources.xaml'
];

/**
 * Keys the acceptance surface — the Gallery's Design pages — names that the four base
 * files do not. They are seeds the same way `SOURCE_FILES` are: the closure walks
 * through the records they describe and pulls in everything they reference, so a
 * single line here can drag in a whole second file's worth of tokens.
 *
 * Each entry names the page and the column the brush sits in, which is the only
 * documentation an absent reader can trust. A key that stops being named by the page
 * is a reason to delete the line, and a reason that is harder to manufacture than
 * "we still emit it".
 */
export const ADDITIONAL_KEYS = {
	TextControlElevationBorderBrush: "Color page, Stroke — defined in TextBox's dictionary",
	TextControlElevationBorderFocusedBrush: "Color page, Stroke — defined in TextBox's dictionary",
	TextOnAccentFillColorDefaultBrush: 'Color page, Fill — defined in the deprecated dictionary',
	AcrylicBackgroundFillColorDefaultBrush: 'Color page, Background',
	AcrylicBackgroundFillColorBaseBrush: 'Color page, Background',
	AccentAcrylicBackgroundFillColorDefaultBrush: 'Color page, Background',
	AccentAcrylicBackgroundFillColorBaseBrush: 'Color page, Background',
	SystemControlBackgroundChromeMediumLowBrush:
		'SplitView page, PaneBackground — SplitViewPage.xaml:61'
};

/**
 * Keys the app shell reads — the second seed set, and the first written under D15.
 *
 * v1 seeded four whole dictionaries because they are the shared vocabulary. A control's
 * own dictionary is not seeded that way and this is the measurement that settled it:
 * taking `NavigationView`, `NavigationBackButton`, `TitleBar` and `AutoSuggestBox` whole
 * drags in the Reveal material brushes, which nothing here can express, and sixteen names
 * that neither those four files nor anything the closure reaches from them defines — because those files also carry whole `Style` records for
 * controls this version does not build. A per-control dictionary is a place to look keys
 * up, not a set to take wholesale.
 *
 * So: one line per key, and the line says what the key paints. A key whose element stops
 * existing is a line to delete, which is a harder thing to skip than a file to keep.
 *
 * What this list leaves out, so that a gap reads as a decision rather than an oversight.
 * The three templates between them reference 104 resources; these are the ones not here:
 *
 * - **The top display mode** is built, and its keys are seeded below. What follows are the
 *   top-pane keys that are *not* seeded, and why each one is not.
 * - **`TopNavigationViewSettingsButtonWidth` and `TopNavigationViewSettingsButtonHeight`.**
 *   Both are 40, and both are read only by `MUX_NavigationViewSettingsItemStyleWhenOnTopPane`
 *   (`NavigationView_themeresources.xaml:635`) — a `Style` that is defined in the pin and
 *   applied by nothing in it: `grep -rn SettingsItemStyleWhenOnTopPane .upstream/` matches its
 *   own definition and nothing else. The settings item on the top pane goes through the
 *   ordinary item presenter instead, whose `IconOnly` state sizes it 36 rather than 40, and
 *   the reference render agrees with the state and not with the style. Same class as
 *   `TabViewButton*ActiveTab`: grep the whole pin before seeding a key, not only the
 *   dictionary that defines it.
 * - **`TopNavigationViewItemSeparatorWidth` and `TopNavigationViewItemSeparatorMargin`.** They
 *   are read by `NavigationViewItemSeparator`'s `VerticalLine` state
 *   (`NavigationView.xaml:588-596`), and that WinUI item type is not modelled here — this
 *   library's data record has headers and items and no separator.
 *   `TopNavigationViewItemSeparatorForeground` *is* seeded, because the top pane's own grid
 *   reads it as its `BorderBrush` (`NavigationView.xaml:214`).
 * - **`TopNavigationViewPaneCustomContentMinWidth` and `TopNavigationViewAutoSuggestBoxMargin`.**
 *   They size `PaneCustomContentOnTopPane` (`:274`) and `TopPaneAutoSuggestArea` (`:275`), two
 *   slots this control does not expose. `PaneCustomContent` and `AutoSuggestBox` are absent in
 *   the left pane too, so neither is a top-pane omission.
 * - **The three `TopNavigationViewItem*ExpandChevron*` margins, and
 *   `TopNavigationViewItemOnOverflowExpandChevron{Margin,Padding}`.** The top pane draws no
 *   chevron; see `WD-025`.
 * - **`TopNavigationViewItemMargin`.** It is `0`
 *   (`NavigationView_themeresources.xaml:246`) and `OnTopNavigationPrimary` applies it to the
 *   `NavigationViewItemPresenter` — the box *outside* the one this reproduction draws, whose
 *   own margin is `NavigationViewItemButtonMargin`. A zero margin on a box CSS does not need
 *   is a key with nothing to paint.
 * - **The pane title** — `NavigationViewPaneTitlePresenterMargin`. The Gallery sets no
 *   `PaneTitle`, so nothing renders in that slot. Two keys have been struck off this bullet
 *   for reading their name rather than their use: `NavigationViewItemInnerHeaderMargin`,
 *   which despite the name is the inset inside a *group header* in the item list, and
 *   `NavigationViewPaneHeaderRowMinHeight`, which is a *row's* floor rather than a header's
 *   size and is what reserves the toggle button's space in a pane with no header in it at
 *   all (`NavigationView.xaml:48`).
 * - **The title bar's deactivated and subtitle states** —
 *   `TitleBarDeactivatedForegroundBrush`, `TitleBarDeactivatedOpacity`,
 *   `TitleBarSubtitle*`. A web page has no deactivated window state, and the Gallery
 *   sets no subtitle.
 * - **The drag region** — `TitleBarMinDragRegionWidth`,
 *   `TitleBarHeaderNegativeInsetPaddingWidth`. Dragging a window is not a page's to do.
 * - **The four `TitleBar*Alignment` resources.** They hold XAML layout enums, not values
 *   a custom property can carry; the component writes the equivalent CSS directly.
 * - **Every `*Style` resource.** A `Style` is a control template, and this project writes
 *   its own. The two that are text rather than template —
 *   `NavigationViewItemHeaderTextStyle` and
 *   `NavigationViewTitleHeaderContentControlTextStyle` — flatten to values the type ramp
 *   already emits: 14px SemiBold is `.winui-BodyStrongTextBlockStyle` and 28px SemiBold is
 *   `.winui-TitleTextBlockStyle`, to the pixel and the weight.
 */
/**
 * Keys Button reads — the third seed set, and the first written as its own tranche.
 *
 * What this list leaves out, so a gap reads as a decision rather than an oversight.
 * The Button dictionary carries forty-eight resources; these are the ones not here:
 *
 * - **The ten pre-Fluent `*ThemeBrush` resources.** They are the `ButtonBackgroundThemeBrush`,
 *   `ButtonBorderThemeBrush`, `ButtonDisabledBackgroundThemeBrush`,
 *   `ButtonDisabledBorderThemeBrush`, `ButtonDisabledForegroundThemeBrush`,
 *   `ButtonForegroundThemeBrush`, `ButtonPointerOverBackgroundThemeBrush`,
 *   `ButtonPointerOverForegroundThemeBrush`, `ButtonPressedBackgroundThemeBrush`,
 *   `ButtonPressedForegroundThemeBrush` family. The current template references none of
 *   them and their Default values are literal colours from a palette this library does
 *   not use.
 * - **The three `*ButtonStyle` resources.** A `Style` is a control template, and this
 *   project writes its own.
 */
export const BUTTON_KEYS = {
	ButtonPadding: 'Button, the padding inside its border',
	ButtonBorderThemeThickness: 'Button, the border width',

	ButtonBackground: 'Button background, at rest',
	ButtonBackgroundPointerOver: 'Button background, pointer over',
	ButtonBackgroundPressed: 'Button background, pressed',
	ButtonBackgroundDisabled: 'Button background, disabled',
	ButtonForeground: 'Button foreground, at rest',
	ButtonForegroundPointerOver: 'Button foreground, pointer over',
	ButtonForegroundPressed: 'Button foreground, pressed',
	ButtonForegroundDisabled: 'Button foreground, disabled',
	ButtonBorderBrush: 'Button border, at rest',
	ButtonBorderBrushPointerOver: 'Button border, pointer over',
	ButtonBorderBrushPressed: 'Button border, pressed',
	ButtonBorderBrushDisabled: 'Button border, disabled',

	AccentButtonBackground: 'Accent button background, at rest',
	AccentButtonBackgroundPointerOver: 'Accent button background, pointer over',
	AccentButtonBackgroundPressed: 'Accent button background, pressed',
	AccentButtonBackgroundDisabled: 'Accent button background, disabled',
	AccentButtonForeground: 'Accent button foreground, at rest',
	AccentButtonForegroundPointerOver: 'Accent button foreground, pointer over',
	AccentButtonForegroundPressed: 'Accent button foreground, pressed',
	AccentButtonForegroundDisabled: 'Accent button foreground, disabled',
	AccentButtonBorderBrush: 'Accent button border, at rest',
	AccentButtonBorderBrushPointerOver: 'Accent button border, pointer over',
	AccentButtonBorderBrushPressed: 'Accent button border, pressed',
	AccentButtonBorderBrushDisabled: 'Accent button border, disabled',

	SubtleButtonBackground: 'Subtle button background, at rest',
	SubtleButtonBackgroundPointerOver: 'Subtle button background, pointer over',
	SubtleButtonBackgroundPressed: 'Subtle button background, pressed',
	SubtleButtonBackgroundDisabled: 'Subtle button background, disabled',
	SubtleButtonForeground: 'Subtle button foreground, at rest',
	SubtleButtonForegroundPointerOver: 'Subtle button foreground, pointer over',
	SubtleButtonForegroundPressed: 'Subtle button foreground, pressed',
	SubtleButtonForegroundDisabled: 'Subtle button foreground, disabled',
	SubtleButtonBorderBrush: 'Subtle button border, at rest',
	SubtleButtonBorderBrushPointerOver: 'Subtle button border, pointer over',
	SubtleButtonBorderBrushPressed: 'Subtle button border, pressed',
	SubtleButtonBorderBrushDisabled: 'Subtle button border, disabled',

	// The ten `*ThemeBrush` keys the Button dictionary defines and the three styles
	// reference nowhere. Seeded only so the EXCLUDED list below can name them — the
	// generator stops if an EXCLUDED key is not selected.
	ButtonBackgroundThemeBrush: 'Pre-Fluent Button *ThemeBrush family, listed for EXCLUDED',
	ButtonBorderThemeBrush: 'Pre-Fluent Button *ThemeBrush family, listed for EXCLUDED',
	ButtonDisabledBackgroundThemeBrush: 'Pre-Fluent Button *ThemeBrush family, listed for EXCLUDED',
	ButtonDisabledBorderThemeBrush: 'Pre-Fluent Button *ThemeBrush family, listed for EXCLUDED',
	ButtonDisabledForegroundThemeBrush: 'Pre-Fluent Button *ThemeBrush family, listed for EXCLUDED',
	ButtonForegroundThemeBrush: 'Pre-Fluent Button *ThemeBrush family, listed for EXCLUDED',
	ButtonPointerOverBackgroundThemeBrush:
		'Pre-Fluent Button *ThemeBrush family, listed for EXCLUDED',
	ButtonPointerOverForegroundThemeBrush:
		'Pre-Fluent Button *ThemeBrush family, listed for EXCLUDED',
	ButtonPressedBackgroundThemeBrush: 'Pre-Fluent Button *ThemeBrush family, listed for EXCLUDED',
	ButtonPressedForegroundThemeBrush: 'Pre-Fluent Button *ThemeBrush family, listed for EXCLUDED'
};

export const TOGGLEBUTTON_KEYS = {
	ToggleButtonBorderThemeThickness: 'ToggleButton, the border width',
	ToggleButtonCheckedStateBackgroundSizing: 'ToggleButton background sizing, checked',
	ToggleButtonBackground: 'ToggleButton background, at rest',
	ToggleButtonBackgroundPointerOver: 'ToggleButton background, pointer over',
	ToggleButtonBackgroundPressed: 'ToggleButton background, pressed',
	ToggleButtonBackgroundDisabled: 'ToggleButton background, disabled',
	ToggleButtonBackgroundChecked: 'ToggleButton background, checked',
	ToggleButtonBackgroundCheckedPointerOver: 'ToggleButton background, checked and pointer over',
	ToggleButtonBackgroundCheckedPressed: 'ToggleButton background, checked and pressed',
	ToggleButtonBackgroundCheckedDisabled: 'ToggleButton background, checked and disabled',
	ToggleButtonBackgroundIndeterminate: 'ToggleButton background, indeterminate',
	ToggleButtonBackgroundIndeterminatePointerOver:
		'ToggleButton background, indeterminate and pointer over',
	ToggleButtonBackgroundIndeterminatePressed: 'ToggleButton background, indeterminate and pressed',
	ToggleButtonBackgroundIndeterminateDisabled:
		'ToggleButton background, indeterminate and disabled',
	ToggleButtonForeground: 'ToggleButton foreground, at rest',
	ToggleButtonForegroundPointerOver: 'ToggleButton foreground, pointer over',
	ToggleButtonForegroundPressed: 'ToggleButton foreground, pressed',
	ToggleButtonForegroundDisabled: 'ToggleButton foreground, disabled',
	ToggleButtonForegroundChecked: 'ToggleButton foreground, checked',
	ToggleButtonForegroundCheckedPointerOver: 'ToggleButton foreground, checked and pointer over',
	ToggleButtonForegroundCheckedPressed: 'ToggleButton foreground, checked and pressed',
	ToggleButtonForegroundCheckedDisabled: 'ToggleButton foreground, checked and disabled',
	ToggleButtonForegroundIndeterminate: 'ToggleButton foreground, indeterminate',
	ToggleButtonForegroundIndeterminatePointerOver:
		'ToggleButton foreground, indeterminate and pointer over',
	ToggleButtonForegroundIndeterminatePressed: 'ToggleButton foreground, indeterminate and pressed',
	ToggleButtonForegroundIndeterminateDisabled:
		'ToggleButton foreground, indeterminate and disabled',
	ToggleButtonBorderBrush: 'ToggleButton border, at rest',
	ToggleButtonBorderBrushPointerOver: 'ToggleButton border, pointer over',
	ToggleButtonBorderBrushPressed: 'ToggleButton border, pressed',
	ToggleButtonBorderBrushDisabled: 'ToggleButton border, disabled',
	ToggleButtonBorderBrushChecked: 'ToggleButton border, checked',
	ToggleButtonBorderBrushCheckedPointerOver: 'ToggleButton border, checked and pointer over',
	ToggleButtonBorderBrushCheckedPressed: 'ToggleButton border, checked and pressed',
	ToggleButtonBorderBrushCheckedDisabled: 'ToggleButton border, checked and disabled',
	ToggleButtonBorderBrushIndeterminate: 'ToggleButton border, indeterminate',
	ToggleButtonBorderBrushIndeterminatePointerOver:
		'ToggleButton border, indeterminate and pointer over',
	ToggleButtonBorderBrushIndeterminatePressed: 'ToggleButton border, indeterminate and pressed',
	ToggleButtonBorderBrushIndeterminateDisabled: 'ToggleButton border, indeterminate and disabled',
	// The pre-Fluent family is selected only so EXCLUDED can record its deliberate omission.
	ToggleButtonBackgroundThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonBorderThemeBrush: 'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonCheckedBackgroundThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonCheckedBorderThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonCheckedDisabledBackgroundThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonCheckedDisabledForegroundThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonCheckedForegroundThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonCheckedPointerOverBackgroundThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonCheckedPointerOverBorderThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonCheckedPressedBackgroundThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonCheckedPressedBorderThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonCheckedPressedForegroundThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonDisabledBorderThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonDisabledForegroundThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonForegroundThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonPointerOverBackgroundThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonPressedBackgroundThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED',
	ToggleButtonPressedForegroundThemeBrush:
		'Pre-Fluent ToggleButton *ThemeBrush family, listed for EXCLUDED'
};

export const RATINGCONTROL_KEYS = {
	RatingControlUnselectedForeground: 'RatingControl, an unset star',
	RatingControlSelectedForeground: 'RatingControl, a set star',
	RatingControlPlaceholderForeground: 'RatingControl, a placeholder star',
	RatingControlPointerOverPlaceholderForeground: 'RatingControl, a placeholder star, pointer over',
	RatingControlPointerOverUnselectedForeground: 'RatingControl, an unset star, pointer over',
	RatingControlPointerOverSelectedForeground: 'RatingControl, a set star, pointer over',
	RatingControlDisabledSelectedForeground: 'RatingControl, a set star, disabled',
	RatingControlCaptionForeground: 'RatingControl caption',
	RatingControlItemSpacing: 'RatingControl, the gap between stars',
	RatingControlFontSizeForRendering: 'RatingControl, the glyph size before the resting scale'
};

// ColorSpectrum reads the border member of ColorPicker's dictionary. ColorPickerSlider reads
// its thumb and header brushes plus its inner-thumb dimensions. ColorPicker reads its root widths
// and heights, the label-column width its horizontal orientation uses, and its owned
// gradient-strip radius. Track-fill remains excluded because it paints only the opacity-zero
// ColorPickerSlider track rectangles.
export const COLORPICKER_KEYS = {
	ColorPickerBorderBrush: 'ColorSpectrum border, via ColorPickerBorderStyle',
	ColorPickerVerticalOrientationMinWidth: 'ColorPicker root, its minimum width',
	ColorPickerVerticalOrientationMaxWidth: 'ColorPicker root, its maximum width',
	ColorPickerVerticalOrientationMinHeight: 'ColorPicker root, its minimum height',
	ColorPickerVerticalOrientationMaxHeight: 'ColorPicker root, its maximum height',
	ColorPickerTextInputHorizontalOrientationMargin:
		'ColorPicker text input, its horizontal label column',
	ColorPickerSliderCornerRadius: 'ColorPicker slider strip, its corner radius',
	SystemControlBackgroundChromeWhiteBrush: 'ColorSpectrum SelectionEllipse default stroke',
	SystemControlBackgroundChromeBlackHighBrush:
		'ColorSpectrum SelectionEllipse dark and focus stroke',
	ColorPickerSliderThumbBackground: 'ColorPickerSlider inner thumb, at rest',
	ColorPickerSliderThumbBackgroundPointerOver: 'ColorPickerSlider inner thumb, pointer over',
	ColorPickerSliderThumbBackgroundPressed: 'ColorPickerSlider inner thumb, pressed',
	ColorPickerSliderThumbBackgroundDisabled: 'ColorPickerSlider inner thumb, disabled',
	ColorPickerHeaderContentDisabled: 'ColorPickerSlider header, disabled',
	ColorPickerSliderInnerThumbWidth: 'ColorPickerSlider inner thumb, its width',
	ColorPickerSliderInnerThumbHeight: 'ColorPickerSlider inner thumb, its height'
};

// `CommandBarFlyout.svelte` reads all thirty-one. The four surface keys paint the flyout
// itself and three more skin its overflow presenter; the rest are the implicit `Style`s at
// `:649`–`:651`, which upstream declares once in `LayoutRoot.Resources` and which therefore
// reach the bar, the ellipsis button and the overflow popup alike. `AppBarButton` and
// `AppBarToggleButton` are re-skinned from the same `CommandBarFlyoutAppBarButton*` names —
// the dictionary has no toggle-specific key — so the checked, chevron and accelerator brushes
// are read by both. The two margins are the inner borders, the command's own and the
// ellipsis's. `CommandBar` reads none of them, which is why they are their own group rather
// than additions to COMMANDBAR_KEYS.
export const COMMANDBARFLYOUT_KEYS = {
	CommandBarFlyoutBackground: 'CommandBarFlyout surface background',
	CommandBarFlyoutForeground: 'CommandBarFlyout surface foreground',
	CommandBarFlyoutBorderBrush: 'CommandBarFlyout surface border',
	CommandBarFlyoutBorderThemeThickness: 'CommandBarFlyout surface border width',
	CommandBarFlyoutBorderUpThemeThickness: 'CommandBarFlyout overflow border, expanded up',
	CommandBarFlyoutBorderDownThemeThickness: 'CommandBarFlyout overflow border, expanded down',
	CommandBarFlyoutButtonBackground: 'CommandBarFlyout overflow presenter background',
	CommandBarFlyoutAppBarButtonBackground:
		'CommandBarFlyout command and ellipsis background, at rest',
	CommandBarFlyoutAppBarButtonBackgroundPointerOver:
		'CommandBarFlyout command and ellipsis background, pointer over',
	CommandBarFlyoutAppBarButtonBackgroundPressed:
		'CommandBarFlyout command and ellipsis background, pressed',
	CommandBarFlyoutAppBarButtonBackgroundDisabled:
		'CommandBarFlyout command and ellipsis background, disabled',
	CommandBarFlyoutAppBarButtonForeground:
		'CommandBarFlyout command and ellipsis foreground, at rest',
	CommandBarFlyoutAppBarButtonForegroundPointerOver:
		'CommandBarFlyout command and ellipsis foreground, pointer over',
	CommandBarFlyoutAppBarButtonForegroundPressed:
		'CommandBarFlyout command and ellipsis foreground, pressed',
	CommandBarFlyoutAppBarButtonForegroundDisabled:
		'CommandBarFlyout command and ellipsis foreground, disabled',
	CommandBarFlyoutAppBarButtonSubItemChevronForeground:
		'CommandBarFlyout overflow command sub-item chevron',
	CommandBarFlyoutAppBarButtonKeyboardTextLabelForeground:
		'CommandBarFlyout overflow command accelerator text',
	CommandBarFlyoutAppBarButtonKeyboardTextLabelForegroundPointerOver:
		'CommandBarFlyout overflow command accelerator text, pointer over',
	CommandBarFlyoutAppBarButtonKeyboardTextLabelForegroundPressed:
		'CommandBarFlyout overflow command accelerator text, pressed',
	CommandBarFlyoutAppBarButtonSubItemChevronPointerOverForeground:
		'CommandBarFlyout overflow command sub-item chevron, pointer over',
	CommandBarFlyoutAppBarButtonSubItemChevronPressedForeground:
		'CommandBarFlyout overflow command sub-item chevron, pressed',
	CommandBarFlyoutAppBarButtonSubItemChevronDisabledForeground:
		'CommandBarFlyout overflow command sub-item chevron, disabled',
	CommandBarFlyoutAppBarButtonBorderBrush: 'CommandBarFlyout command border',
	CommandBarFlyoutAppBarButtonBackgroundChecked:
		'CommandBarFlyout toggle command background, checked',
	CommandBarFlyoutAppBarButtonBackgroundCheckedPointerOver:
		'CommandBarFlyout toggle command background, checked and pointer over',
	CommandBarFlyoutAppBarButtonBackgroundCheckedPressed:
		'CommandBarFlyout toggle command background, checked and pressed',
	CommandBarFlyoutAppBarButtonForegroundChecked:
		'CommandBarFlyout toggle command foreground, checked',
	CommandBarFlyoutAppBarButtonForegroundCheckedPointerOver:
		'CommandBarFlyout toggle command foreground, checked and pointer over',
	CommandBarFlyoutAppBarButtonForegroundCheckedPressed:
		'CommandBarFlyout toggle command foreground, checked and pressed',
	CommandBarFlyoutAppBarButtonInnerBorderMargin: 'CommandBarFlyout command inner-border margin',
	CommandBarFlyoutAppBarEllipsisButtonInnerBorderMargin:
		'CommandBarFlyout ellipsis inner-border margin'
};

export const HYPERLINK_KEYS = {
	HyperlinkForeground: 'Hyperlink foreground, at rest',
	HyperlinkForegroundPointerOver: 'Hyperlink foreground, pointer over',
	HyperlinkForegroundPressed: 'Hyperlink foreground, pressed'
};

export const HYPERLINKBUTTON_KEYS = {
	HyperlinkButtonBorderThemeThickness: 'HyperlinkButton, the border width',
	HyperlinkButtonBackground: 'HyperlinkButton background, at rest',
	HyperlinkButtonBackgroundPointerOver: 'HyperlinkButton background, pointer over',
	HyperlinkButtonBackgroundPressed: 'HyperlinkButton background, pressed',
	HyperlinkButtonBackgroundDisabled: 'HyperlinkButton background, disabled',
	HyperlinkButtonForeground: 'HyperlinkButton foreground, at rest',
	HyperlinkButtonForegroundPointerOver: 'HyperlinkButton foreground, pointer over',
	HyperlinkButtonForegroundPressed: 'HyperlinkButton foreground, pressed',
	HyperlinkButtonForegroundDisabled: 'HyperlinkButton foreground, disabled',
	HyperlinkButtonBorderBrush: 'HyperlinkButton border, at rest',
	HyperlinkButtonBorderBrushPointerOver: 'HyperlinkButton border, pointer over',
	HyperlinkButtonBorderBrushPressed: 'HyperlinkButton border, pressed',
	HyperlinkButtonBorderBrushDisabled: 'HyperlinkButton border, disabled'
};

export const DROPDOWNBUTTON_KEYS = {
	DropDownButtonForegroundSecondary: 'DropDownButton chevron foreground, at rest',
	DropDownButtonForegroundSecondaryPointerOver: 'DropDownButton chevron foreground, pointer over',
	DropDownButtonForegroundSecondaryPressed: 'DropDownButton chevron foreground, pressed'
};

export const SPLITBUTTON_KEYS = {
	SplitButtonBackground: 'SplitButton background, at rest',
	SplitButtonBackgroundPointerOver: 'SplitButton background, pointer over',
	SplitButtonBackgroundPressed: 'SplitButton background, pressed',
	SplitButtonBackgroundDisabled: 'SplitButton background, disabled',
	SplitButtonBackgroundChecked: 'SplitButton background, checked',
	SplitButtonBackgroundCheckedPointerOver: 'SplitButton background, checked and pointer over',
	SplitButtonBackgroundCheckedPressed: 'SplitButton background, checked and pressed',
	SplitButtonBackgroundCheckedDisabled:
		'SplitButton background, checked and disabled, listed for EXCLUDED',
	SplitButtonForeground: 'SplitButton foreground, at rest',
	SplitButtonForegroundPointerOver: 'SplitButton foreground, pointer over',
	SplitButtonForegroundPressed: 'SplitButton foreground, pressed',
	SplitButtonForegroundDisabled: 'SplitButton foreground, disabled',
	SplitButtonForegroundChecked: 'SplitButton foreground, checked',
	SplitButtonForegroundCheckedPointerOver: 'SplitButton foreground, checked and pointer over',
	SplitButtonForegroundCheckedPressed: 'SplitButton foreground, checked and pressed',
	SplitButtonForegroundCheckedDisabled:
		'SplitButton foreground, checked and disabled, listed for EXCLUDED',
	SplitButtonForegroundSecondary: 'SplitButton secondary foreground, at rest',
	SplitButtonForegroundSecondaryPressed: 'SplitButton secondary foreground, pressed',
	SplitButtonBorderBrush: 'SplitButton border, at rest',
	SplitButtonBorderBrushPointerOver: 'SplitButton border, pointer over',
	SplitButtonBorderBrushPressed: 'SplitButton border, pressed',
	SplitButtonBorderBrushDisabled: 'SplitButton border, disabled',
	SplitButtonBorderBrushDivider: 'SplitButton divider',
	SplitButtonBorderBrushChecked: 'SplitButton border, checked',
	SplitButtonBorderBrushCheckedPointerOver:
		'SplitButton border, checked and pointer over, listed for EXCLUDED',
	SplitButtonBorderBrushCheckedPressed: 'SplitButton border, checked and pressed',
	SplitButtonBorderBrushCheckedDisabled:
		'SplitButton border, checked and disabled, listed for EXCLUDED',
	SplitButtonBorderBrushCheckedDivider: 'SplitButton divider, checked',
	SplitButtonInAppBarUnfocusedPointerOver:
		'SplitButton CommandBar pointer over, listed for EXCLUDED',
	SplitButtonBorderThemeThickness: 'SplitButton border width',
	SplitButtonPrimaryButtonSize: 'SplitButton primary column minimum width',
	SplitButtonSecondaryButtonSize: 'SplitButton chevron column width',
	SplitButtonPadding: 'SplitButton primary padding'
};

/**
 * Keys AppBarButton reads. The three dimensions from CommandBar and Reveal are here because
 * this is the first library template to consume them: the two AppBarTheme keys are defined by
 * CommandBar, while AppBarButtonContentHeight has its sole control-pin definition in Reveal.
 * Border brushes, the no-op submenu chevron brush, the visibility enum, and Reveal-only compact
 * and touch values are selected only to record their deliberate omission in EXCLUDED.
 */
export const APPBARBUTTON_KEYS = {
	AppBarButtonBackground: 'AppBarButton background, at rest',
	AppBarButtonBackgroundPointerOver: 'AppBarButton background, pointer over',
	AppBarButtonBackgroundPressed: 'AppBarButton background, pressed',
	AppBarButtonBackgroundDisabled: 'AppBarButton background, disabled',
	AppBarButtonForeground: 'AppBarButton foreground, at rest',
	AppBarButtonForegroundPointerOver: 'AppBarButton foreground, pointer over',
	AppBarButtonForegroundPressed: 'AppBarButton foreground, pressed',
	AppBarButtonForegroundDisabled: 'AppBarButton foreground, disabled',
	AppBarButtonBorderBrush: 'AppBarButton border, at rest, listed for EXCLUDED',
	AppBarButtonBorderBrushPointerOver: 'AppBarButton border, pointer over, listed for EXCLUDED',
	AppBarButtonBorderBrushPressed: 'AppBarButton border, pressed, listed for EXCLUDED',
	AppBarButtonBorderBrushDisabled: 'AppBarButton border, disabled, listed for EXCLUDED',
	AppBarButtonKeyboardAcceleratorTextForeground: 'AppBarButton accelerator foreground, at rest',
	AppBarButtonKeyboardAcceleratorTextForegroundPointerOver:
		'AppBarButton accelerator foreground, pointer over',
	AppBarButtonKeyboardAcceleratorTextForegroundPressed:
		'AppBarButton accelerator foreground, pressed',
	AppBarButtonKeyboardAcceleratorTextForegroundDisabled:
		'AppBarButton accelerator foreground, disabled',
	AppBarButtonBackgroundSubMenuOpened: 'AppBarButton background, submenu opened',
	AppBarButtonForegroundSubMenuOpened: 'AppBarButton foreground, submenu opened',
	AppBarButtonKeyboardAcceleratorTextForegroundSubMenuOpened:
		'AppBarButton accelerator foreground, submenu opened',
	AppBarButtonBorderBrushSubMenuOpened: 'AppBarButton border, submenu opened, listed for EXCLUDED',
	AppBarButtonSubItemChevronForeground: 'AppBarButton submenu chevron foreground, at rest',
	AppBarButtonSubItemChevronForegroundPointerOver:
		'AppBarButton submenu chevron foreground, pointer over',
	AppBarButtonSubItemChevronForegroundPressed: 'AppBarButton submenu chevron foreground, pressed',
	AppBarButtonSubItemChevronForegroundSubMenuOpened:
		'AppBarButton submenu chevron foreground, submenu opened, listed for EXCLUDED',
	AppBarButtonSubItemChevronForegroundDisabled: 'AppBarButton submenu chevron foreground, disabled',
	AppBarButtonHasFlyoutChevronVisibility:
		'AppBarButton flyout chevron visibility, listed for EXCLUDED',
	AppBarButtonFlyoutGlyph: 'AppBarButton flyout glyph',
	AppBarButtonOverflowFlyoutGlyph: 'AppBarButton overflow flyout glyph',
	AppBarButtonLabelFontSize: 'AppBarButton label font size',
	AppBarButtonSubItemChevronFontSize: 'AppBarButton submenu chevron font size',
	AppBarButtonSecondarySubItemChevronFontSize: 'AppBarButton overflow chevron font size',
	AppBarButtonSubItemChevronMargin: 'AppBarButton submenu chevron margin',
	AppBarButtonSubItemChevronLabelOnRightMargin: 'AppBarButton right-label chevron margin',
	AppBarButtonSecondarySubItemChevronMargin: 'AppBarButton overflow chevron margin',
	AppBarButtonContentViewboxMargin: 'AppBarButton right-label icon margin',
	AppBarButtonContentViewboxCompactMargin: 'AppBarButton compact icon margin, listed for EXCLUDED',
	AppBarButtonContentViewboxCollapsedMargin: 'AppBarButton collapsed-label icon margin',
	AppBarButtonOverflowTextTouchMargin:
		'AppBarButton overflow touch label padding, listed for EXCLUDED',
	AppBarButtonOverflowTextLabelPadding: 'AppBarButton overflow label padding',
	AppBarButtonTextLabelMargin: 'AppBarButton label margin',
	AppBarButtonTextLabelOnRightMargin: 'AppBarButton right-label margin',
	AppBarButtonInnerBorderMargin: 'AppBarButton inner border margin',
	AppBarButtonInnerBorderCompactMargin: 'AppBarButton compact inner border margin',
	AppBarButtonInnerBorderOverflowMargin: 'AppBarButton overflow inner border margin',
	AppBarThemeMinHeight: 'AppBar content minimum height',
	AppBarThemeCompactHeight: 'AppBar compact content height',
	AppBarButtonContentHeight: 'AppBarButton icon height',
	// This key was EXCLUDED for four versions and the reason was sound as far as it went.
	// Three templates bind a font size to it — both overflow labels
	// (AppBarButton_themeresources.xaml:373, AppBarToggleButton_themeresources.xaml:488) and
	// SelectorBarItem (SelectorBar.xaml:60) — the value is 14, which is Body's size, and each
	// of those three elements carries `winui-BodyTextBlockStyle` instead, so a second name for
	// one number would give the two somewhere to drift apart. The v8 SelectorBar unit
	// re-opened it and re-closed it the same way.
	//
	// What that reasoning did not cover is three keys whose whole value is a reference to
	// this one: `BreadcrumbBarItemThemeFontSize`, `CalendarViewDayItemFontSize` and
	// `CalendarViewMonthYearItemFontSize`. While it was excluded, all three held the
	// guaranteed-invalid value, so BreadcrumbBar.svelte's `.root` and `.drop-row`
	// and CalendarView.svelte's `.main` each read a font size that was invalid at computed-value
	// time and fell back to `inherit`. Measured on the reference guest: the property came back
	// empty and the rendered size was 14px by inheritance, which is the right number by luck
	// rather than by the declaration. C9 does not catch it, because the name each component
	// reads *is* emitted and C9 does not follow a token into its own value.
	ControlContentThemeFontSize:
		"the overflow row's label size, and what three FontSize aliases resolve through"
};

/**
 * Keys AppBarToggleButton reads. The twelve legacy SolidColorBrush names ending in ThemeBrush
 * are not seeded: no template in the three pinned dictionaries references them. Touch-only
 * overflow metrics are seeded solely so EXCLUDED can record WD-020.
 */
export const APPBARTOGGLEBUTTON_KEYS = {
	AppBarToggleButtonBackground: 'AppBarToggleButton background, at rest',
	AppBarToggleButtonBackgroundPointerOver: 'AppBarToggleButton background, pointer over',
	AppBarToggleButtonBackgroundPressed: 'AppBarToggleButton background, pressed',
	AppBarToggleButtonBackgroundDisabled: 'AppBarToggleButton background, disabled',
	AppBarToggleButtonBackgroundChecked: 'AppBarToggleButton background, checked',
	AppBarToggleButtonBackgroundCheckedPointerOver:
		'AppBarToggleButton background, checked and pointer over',
	AppBarToggleButtonBackgroundCheckedPressed: 'AppBarToggleButton background, checked and pressed',
	AppBarToggleButtonBackgroundCheckedDisabled:
		'AppBarToggleButton background, checked and disabled',
	AppBarToggleButtonBackgroundHighLightOverlay:
		'AppBarToggleButton highlight overlay, listed for EXCLUDED',
	AppBarToggleButtonBackgroundHighLightOverlayPointerOver:
		'AppBarToggleButton highlight overlay, pointer over',
	AppBarToggleButtonBackgroundHighLightOverlayPressed:
		'AppBarToggleButton highlight overlay, pressed',
	AppBarToggleButtonBackgroundHighLightOverlayCheckedPointerOver:
		'AppBarToggleButton highlight overlay, checked and pointer over',
	AppBarToggleButtonBackgroundHighLightOverlayCheckedPressed:
		'AppBarToggleButton highlight overlay, checked and pressed',
	AppBarToggleButtonForeground: 'AppBarToggleButton foreground, at rest',
	AppBarToggleButtonForegroundPointerOver: 'AppBarToggleButton foreground, pointer over',
	AppBarToggleButtonForegroundPressed: 'AppBarToggleButton foreground, pressed',
	AppBarToggleButtonForegroundDisabled: 'AppBarToggleButton foreground, disabled',
	AppBarToggleButtonForegroundChecked: 'AppBarToggleButton foreground, checked',
	AppBarToggleButtonForegroundCheckedPointerOver:
		'AppBarToggleButton foreground, checked and pointer over',
	AppBarToggleButtonForegroundCheckedPressed: 'AppBarToggleButton foreground, checked and pressed',
	AppBarToggleButtonForegroundCheckedDisabled:
		'AppBarToggleButton foreground, checked and disabled',
	AppBarToggleButtonBorderBrush: 'AppBarToggleButton border, at rest',
	AppBarToggleButtonBorderBrushPointerOver: 'AppBarToggleButton border, pointer over',
	AppBarToggleButtonBorderBrushPressed: 'AppBarToggleButton border, pressed',
	AppBarToggleButtonBorderBrushDisabled: 'AppBarToggleButton border, disabled',
	AppBarToggleButtonBorderBrushChecked: 'AppBarToggleButton border, checked',
	AppBarToggleButtonBorderBrushCheckedPointerOver:
		'AppBarToggleButton border, checked and pointer over',
	AppBarToggleButtonBorderBrushCheckedPressed: 'AppBarToggleButton border, checked and pressed',
	AppBarToggleButtonBorderBrushCheckedDisabled: 'AppBarToggleButton border, checked and disabled',
	AppBarToggleButtonCheckGlyphForeground: 'AppBarToggleButton check glyph foreground, at rest',
	AppBarToggleButtonCheckGlyphForegroundPointerOver:
		'AppBarToggleButton check glyph foreground, pointer over',
	AppBarToggleButtonCheckGlyphForegroundPressed:
		'AppBarToggleButton check glyph foreground, pressed',
	AppBarToggleButtonCheckGlyphForegroundDisabled:
		'AppBarToggleButton check glyph foreground, disabled, listed for EXCLUDED',
	AppBarToggleButtonCheckGlyphForegroundChecked:
		'AppBarToggleButton check glyph foreground, checked, listed for EXCLUDED',
	AppBarToggleButtonCheckGlyphForegroundCheckedPointerOver:
		'AppBarToggleButton check glyph foreground, checked and pointer over, listed for EXCLUDED',
	AppBarToggleButtonCheckGlyphForegroundCheckedPressed:
		'AppBarToggleButton check glyph foreground, checked and pressed, listed for EXCLUDED',
	AppBarToggleButtonCheckGlyphForegroundCheckedDisabled:
		'AppBarToggleButton check glyph foreground, checked and disabled, listed for EXCLUDED',
	AppBarToggleButtonOverflowLabelForegroundPointerOver:
		'AppBarToggleButton overflow label foreground, pointer over',
	AppBarToggleButtonOverflowLabelForegroundPressed:
		'AppBarToggleButton overflow label foreground, pressed',
	AppBarToggleButtonOverflowLabelForegroundDisabled:
		'AppBarToggleButton overflow label foreground, disabled',
	AppBarToggleButtonOverflowLabelForegroundCheckedPointerOver:
		'AppBarToggleButton overflow label foreground, checked and pointer over',
	AppBarToggleButtonOverflowLabelForegroundCheckedPressed:
		'AppBarToggleButton overflow label foreground, checked and pressed',
	AppBarToggleButtonOverflowLabelForegroundCheckedDisabled:
		'AppBarToggleButton overflow label foreground, checked and disabled',
	AppBarToggleButtonKeyboardAcceleratorTextForeground:
		'AppBarToggleButton accelerator foreground, at rest',
	AppBarToggleButtonKeyboardAcceleratorTextForegroundPointerOver:
		'AppBarToggleButton accelerator foreground, pointer over',
	AppBarToggleButtonKeyboardAcceleratorTextForegroundPressed:
		'AppBarToggleButton accelerator foreground, pressed',
	AppBarToggleButtonKeyboardAcceleratorTextForegroundDisabled:
		'AppBarToggleButton accelerator foreground, disabled',
	AppBarToggleButtonKeyboardAcceleratorTextForegroundChecked:
		'AppBarToggleButton accelerator foreground, checked',
	AppBarToggleButtonKeyboardAcceleratorTextForegroundCheckedPointerOver:
		'AppBarToggleButton accelerator foreground, checked and pointer over',
	AppBarToggleButtonKeyboardAcceleratorTextForegroundCheckedPressed:
		'AppBarToggleButton accelerator foreground, checked and pressed',
	AppBarToggleButtonKeyboardAcceleratorTextForegroundCheckedDisabled:
		'AppBarToggleButton accelerator foreground, checked and disabled',
	AppBarToggleButtonBorderThemeThickness: 'AppBarToggleButton border width',
	AppBarToggleButtonOverflowTextTouchMargin:
		'AppBarToggleButton overflow touch label padding, listed for EXCLUDED',
	AppBarToggleButtonOverflowCheckTouchMargin:
		'AppBarToggleButton overflow touch check margin, listed for EXCLUDED',
	AppBarToggleButtonOverflowCheckMargin: 'AppBarToggleButton overflow check margin',
	AppBarToggleButtonTextLabelMargin: 'AppBarToggleButton label margin',
	AppBarToggleButtonTextLabelOnRightMargin: 'AppBarToggleButton right-label margin',
	AppBarToggleButtonOverflowTextLabelPadding: 'AppBarToggleButton overflow label padding'
};

/** Keys AppBarSeparator reads; its template is one rectangle in three view states. */
export const APPBARSEPARATOR_KEYS = {
	AppBarSeparatorForeground: 'AppBarSeparator foreground',
	AppBarSeparatorMargin: 'AppBarSeparator margin',
	AppBarOverflowSeparatorMargin: 'AppBarSeparator overflow margin',
	AppBarSeparatorWidth: 'AppBarSeparator width',
	AppBarOverflowSeparatorHeight: 'AppBarSeparator overflow height',
	AppBarSeparatorCornerRadius: 'AppBarSeparator corner radius'
};

/**
 * Keys CommandBar reads. This tranche seeds the closed bar and the next unit's open bar,
 * because seed sets claim keys rather than individual component states. `AppBarThemeMinHeight`
 * and `AppBarThemeCompactHeight` are already claimed by APPBARBUTTON_KEYS. The two AppBarExpand
 * metrics come from the framework dictionary, while CommandBarMoreButtonMargin's only definition
 * in the extracted record is RevealBrush_themeresources.xaml:562; neither needs DEFINED_BY.
 */
export const COMMANDBAR_KEYS = {
	CommandBarOverflowMinWidth: 'CommandBar overflow minimum width',
	CommandBarOverflowTouchMinWidth: 'CommandBar overflow touch minimum width',
	CommandBarOverflowMaxWidth: 'CommandBar overflow maximum width',
	CommandBarOverflowMaxHeight: 'CommandBar overflow maximum height',
	CommandBarBackground: 'CommandBar background, closed',
	CommandBarBackgroundOpen: 'CommandBar background, open',
	CommandBarBorderBrushOpen: 'CommandBar border, open',
	CommandBarBorderThicknessOpen: 'CommandBar border thickness, open',
	CommandBarForeground: 'CommandBar foreground',
	CommandBarHighContrastBorder: 'CommandBar high contrast border',
	CommandBarEllipsisIconForegroundDisabled: 'CommandBar disabled ellipsis foreground',
	CommandBarOverflowPresenterBackground: 'CommandBar overflow presenter background',
	CommandBarOverflowPresenterBorderBrush: 'CommandBar overflow presenter border',
	CommandBarLightDismissOverlayBackground: 'CommandBar light-dismiss overlay background',
	CommandBarOverflowPresenterBorderThickness: 'CommandBar overflow presenter border thickness',
	CommandBarOverflowPresenterBorderDownThickness:
		'CommandBar downward overflow presenter border thickness',
	CommandBarOverflowPresenterBorderUpThickness:
		'CommandBar upward overflow presenter border thickness',
	CommandBarOverflowPresenterBorderPadding: 'CommandBar overflow presenter border padding',
	CommandBarOverflowPresenterBorderDownPadding:
		'CommandBar downward overflow presenter border padding',
	CommandBarOverflowPresenterBorderUpPadding: 'CommandBar upward overflow presenter border padding',
	AppBarEllipsisButtonInnerBorderMargin: 'CommandBar ellipsis button inner border margin',
	AppBarMoreButtonColumnMinWidth: 'CommandBar more-button column minimum width',
	CommandBarOverflowPresenterMargin: 'CommandBar overflow presenter margin',
	AppBarExpandButtonThemeWidth: 'CommandBar ellipsis button width',
	AppBarExpandButtonCircleDiameter: 'CommandBar ellipsis glyph layout height',
	CommandBarMoreButtonMargin: 'CommandBar more-button padding, listed for EXCLUDED'
};

export const REPEATBUTTON_KEYS = {
	// Defined in RepeatButton_themeresources.xaml, and selected only so EXCLUDED can
	// record why it is not emitted: the style takes ButtonBorderThemeThickness instead.
	RepeatButtonBorderThemeThickness: 'RepeatButton border width, listed for EXCLUDED',
	RepeatButtonBackground: 'RepeatButton background, at rest',
	RepeatButtonBackgroundPointerOver: 'RepeatButton background, pointer over',
	RepeatButtonBackgroundPressed: 'RepeatButton background, pressed',
	RepeatButtonBackgroundDisabled: 'RepeatButton background, disabled',
	RepeatButtonForeground: 'RepeatButton foreground, at rest',
	RepeatButtonForegroundPointerOver: 'RepeatButton foreground, pointer over',
	RepeatButtonForegroundPressed: 'RepeatButton foreground, pressed',
	RepeatButtonForegroundDisabled: 'RepeatButton foreground, disabled',
	RepeatButtonBorderBrush: 'RepeatButton border, at rest',
	RepeatButtonBorderBrushPointerOver: 'RepeatButton border, pointer over',
	RepeatButtonBorderBrushPressed: 'RepeatButton border, pressed',
	RepeatButtonBorderBrushDisabled: 'RepeatButton border, disabled',
	// The pre-Fluent family is selected only so EXCLUDED can record its deliberate omission.
	RepeatButtonBorderThemeBrush: 'Pre-Fluent RepeatButton *ThemeBrush family, listed for EXCLUDED',
	RepeatButtonDisabledBackgroundThemeBrush:
		'Pre-Fluent RepeatButton *ThemeBrush family, listed for EXCLUDED',
	RepeatButtonDisabledBorderThemeBrush:
		'Pre-Fluent RepeatButton *ThemeBrush family, listed for EXCLUDED',
	RepeatButtonDisabledForegroundThemeBrush:
		'Pre-Fluent RepeatButton *ThemeBrush family, listed for EXCLUDED',
	RepeatButtonForegroundThemeBrush:
		'Pre-Fluent RepeatButton *ThemeBrush family, listed for EXCLUDED',
	RepeatButtonPointerOverBackgroundThemeBrush:
		'Pre-Fluent RepeatButton *ThemeBrush family, listed for EXCLUDED',
	RepeatButtonPointerOverForegroundThemeBrush:
		'Pre-Fluent RepeatButton *ThemeBrush family, listed for EXCLUDED',
	RepeatButtonPressedBackgroundThemeBrush:
		'Pre-Fluent RepeatButton *ThemeBrush family, listed for EXCLUDED',
	RepeatButtonPressedForegroundThemeBrush:
		'Pre-Fluent RepeatButton *ThemeBrush family, listed for EXCLUDED'
};

/**
 * Keys TextBox reads — the fourth seed set, and the Text family's first tranche.
 *
 * What this list leaves out, so a gap reads as a decision rather than an oversight.
 * The TextBox dictionary carries forty-one resources; these are the ones not here:
 *
 * - **The header and description** — `TextBoxTopHeaderMargin`, and the four
 *   `TextControlHeaderForeground*` and `SystemControlDescriptionTextForegroundBrush`
 *   brushes. The header and description are deliberately out of scope for v1 — their
 *   resources are defined in the XAML framework dictionary inside Windows rather than
 *   in any per-control `*_themeresources.xaml`, the same hole ADR 0008 describes for
 *   the legacy brushes — and AutoSuggestBox, PasswordBox and NumberBox read through
 *   the same names, so they are measured once for the whole Text family in that
 *   tranche rather than guessed here for one control.
 * - **The seventeen pre-Fluent `TextBox*ThemeBrush` resources.** They are the
 *   `TextBoxForegroundHeaderThemeBrush`, `TextBoxPlaceholderTextThemeBrush`,
 *   `TextBoxBackgroundThemeBrush`, `TextBoxBorderThemeBrush`,
 *   `TextBoxForegroundThemeBrush`, `TextBoxDisabledBackgroundThemeBrush`,
 *   `TextBoxDisabledBorderThemeBrush`, `TextBoxDisabledForegroundThemeBrush`, and the
 *   nine `TextBoxButton*ThemeBrush` family. The current template references none of
 *   them and their `Default` values are literal colours from a palette this library
 *   does not use. This is the same family and the same reason as Button's ten.
 */
export const TEXTBOX_KEYS = {
	// The two layout keys the delete button needs.
	TextBoxInnerButtonMargin: 'TextBox delete button, the inset of its fill',
	TextBoxIconFontSize: 'TextBox delete button, the glyph inside it',
	TextControlThemeMinHeight:
		'the height an editable text box floors at, and the one key compact changes',

	// The four brushes each state reaches, plus the placeholder and the selection.
	TextControlBackground: 'TextBox background, at rest',
	TextControlBackgroundPointerOver: 'TextBox background, pointer over',
	TextControlBackgroundFocused: 'TextBox background, focused',
	TextControlBackgroundDisabled: 'TextBox background, disabled',
	TextControlBorderBrush: 'TextBox border, at rest',
	TextControlBorderBrushPointerOver: 'TextBox border, pointer over',
	TextControlBorderBrushFocused: 'TextBox border, focused',
	TextControlBorderBrushDisabled: 'TextBox border, disabled',
	TextControlForeground: 'TextBox foreground, at rest',
	TextControlForegroundPointerOver: 'TextBox foreground, pointer over',
	TextControlForegroundFocused: 'TextBox foreground, focused',
	// Upstream resolves this one to `TemporaryTextFillColorDisabled`, a literal `<Color>`
	// rather than an alias, and its HighContrast value is `#5C010101` — the same
	// near-black at 36% alpha that Light uses, not a system colour. That is what
	// TextBox_themeresources.xaml says, so it is what is emitted; the name upstream
	// chose says how settled it considers it. Left faithful on purpose: a reader who
	// finds a light literal in the high-contrast block will otherwise take it for our
	// bug and 'fix' it away from the original.
	TextControlForegroundDisabled: 'TextBox foreground, disabled',
	TextControlPlaceholderForeground: 'TextBox placeholder, at rest',
	TextControlPlaceholderForegroundPointerOver: 'TextBox placeholder, pointer over',
	TextControlPlaceholderForegroundFocused: 'TextBox placeholder, focused',
	TextControlPlaceholderForegroundDisabled: 'TextBox placeholder, disabled',
	TextControlSelectionHighlightColor: 'TextBox selection highlight, the text-range background',

	// The header and the description, which the pin references and does not define: both
	// are in the XAML framework dictionary, and these are the first keys this project
	// reads from it. `TextControlHeaderForeground` is `SystemControlForegroundBaseHighBrush`
	// — pure black in light and pure white in dark, measured on the reference guest against
	// the original, and notably *not* `TextFillColorPrimary`, which is what a guess would
	// have chosen. See ADR 0010.
	TextControlHeaderForeground: 'TextBox header, at rest',
	TextControlHeaderForegroundDisabled: 'TextBox header, disabled',
	TextBoxTopHeaderMargin: 'TextBox header, the gap between it and the box',
	SystemControlDescriptionTextForegroundBrush: 'TextBox description, every state',

	// The delete button: its three brushes and the three states each paints.
	TextControlButtonBackgroundPointerOver: 'TextBox delete button background, pointer over',
	TextControlButtonBackgroundPressed: 'TextBox delete button background, pressed',
	TextControlButtonBorderBrush: 'TextBox delete button border, at rest',
	TextControlButtonBorderBrushPointerOver: 'TextBox delete button border, pointer over',
	TextControlButtonBorderBrushPressed: 'TextBox delete button border, pressed',
	TextControlButtonForeground: 'TextBox delete button foreground, at rest',
	TextControlButtonForegroundPointerOver: 'TextBox delete button foreground, pointer over',
	TextControlButtonForegroundPressed: 'TextBox delete button foreground, pressed',

	// The fourteen `*ThemeBrush` keys the TextBox dictionary defines and the template
	// references nowhere. Seeded only so the EXCLUDED list below can name them — the
	// generator stops if an EXCLUDED key is not selected. The upstream source carries
	// fourteen of the family rather than the seventeen the family name suggests: the
	// three `TextBoxButtonDisabled*ThemeBrush` names are referenced by no template in the
	// pinned source and so were never defined as resources.
	TextBoxForegroundHeaderThemeBrush: 'Pre-Fluent TextBox *ThemeBrush family, listed for EXCLUDED',
	TextBoxPlaceholderTextThemeBrush: 'Pre-Fluent TextBox *ThemeBrush family, listed for EXCLUDED',
	TextBoxBackgroundThemeBrush: 'Pre-Fluent TextBox *ThemeBrush family, listed for EXCLUDED',
	TextBoxBorderThemeBrush: 'Pre-Fluent TextBox *ThemeBrush family, listed for EXCLUDED',
	TextBoxForegroundThemeBrush: 'Pre-Fluent TextBox *ThemeBrush family, listed for EXCLUDED',
	TextBoxDisabledBackgroundThemeBrush: 'Pre-Fluent TextBox *ThemeBrush family, listed for EXCLUDED',
	TextBoxDisabledBorderThemeBrush: 'Pre-Fluent TextBox *ThemeBrush family, listed for EXCLUDED',
	TextBoxDisabledForegroundThemeBrush: 'Pre-Fluent TextBox *ThemeBrush family, listed for EXCLUDED',
	TextBoxButtonBackgroundThemeBrush: 'Pre-Fluent TextBox *ThemeBrush family, listed for EXCLUDED',
	TextBoxButtonBorderThemeBrush: 'Pre-Fluent TextBox *ThemeBrush family, listed for EXCLUDED',
	TextBoxButtonForegroundThemeBrush: 'Pre-Fluent TextBox *ThemeBrush family, listed for EXCLUDED',
	TextBoxButtonPointerOverBackgroundThemeBrush:
		'Pre-Fluent TextBox *ThemeBrush family, listed for EXCLUDED',
	TextBoxButtonPointerOverBorderThemeBrush:
		'Pre-Fluent TextBox *ThemeBrush family, listed for EXCLUDED',
	TextBoxButtonPointerOverForegroundThemeBrush:
		'Pre-Fluent TextBox *ThemeBrush family, listed for EXCLUDED',
	// Seeded only so EXCLUDED can name them; see the note there.
	TextBoxButtonPressedBackgroundThemeBrush:
		'Pre-Fluent TextBox *ThemeBrush family, not referenced by the current template',
	TextBoxButtonPressedBorderThemeBrush:
		'Pre-Fluent TextBox *ThemeBrush family, not referenced by the current template',
	TextBoxButtonPressedForegroundThemeBrush:
		'Pre-Fluent TextBox *ThemeBrush family, not referenced by the current template'
};

/**
 * Keys PasswordBox reads — the tenth seed set, and the second in the Text family.
 *
 * PasswordBox is almost all of TextBox: the same four `TextControl*` background, border
 * and foreground families in the same four states, the same `BorderElement`, the same
 * header and description presenters. Three of the four keys below are unique to it:
 * `PasswordBoxTopHeaderMargin` and `PasswordBoxIconFontSize` are defined in the
 * PasswordBox dictionary and `TextBoxTopHeaderMargin` and `TextBoxIconFontSize` are
 * separate names with separate values; the fourth is the framework-dictionary key the
 * reveal button reads at rest, which the original paints as transparent.
 *
 * `PasswordBoxLeftHeaderMargin`, `PasswordBoxLeftHeaderMaxWidth` and
 * `PasswordBoxRevealButtonStyle` are defined in the PasswordBox dictionary and the
 * template references none of them — `PasswordBoxLeftHeaderMargin` and
 * `PasswordBoxLeftHeaderMaxWidth` are the inset and width of a header laid out left of
 * the box, and the gallery's pages do not use that placement. The reveal button's own
 * style is a `Style` resource, and this project writes its own templates rather than
 * reading XAML styles — the same reason every other `*Style` resource is dropped.
 *
 * `TextControl*` and `TextBoxInnerButtonMargin` are seeded by `TEXTBOX_KEYS` already
 * and the generator's disjointness check is what stops a key from being seeded twice;
 * a duplicate name here would fail the run rather than silently overwrite, which is the
 * reason the four lines below are narrower than the resources the dictionary defines.
 */
export const PASSWORDBOX_KEYS = {
	PasswordBoxTopHeaderMargin: 'PasswordBox header, the gap between it and the box',
	PasswordBoxIconFontSize: 'PasswordBox reveal button, the glyph inside it',
	TextControlButtonBackground: 'PasswordBox reveal button background, at rest',
	HelperButtonThemePadding: 'PasswordBox reveal button, its padding'
};

/**
 * Keys AutoSuggestBox reads — the eleventh seed set, and the third in the Text family.
 *
 * The text-editable popup is the `DefaultAutoSuggestBoxStyle` at
 * AutoSuggestBox_themeresources.xaml:250, which carries a `TextBox` styled by
 * `AutoSuggestBoxTextBoxStyle` so it reads the same `TextControl*` family TextBox does in
 * the same four states — those keys belong to `TEXTBOX_KEYS` and are not repeated here,
 * for the same disjointness reason `PasswordBox` does not repeat them.
 *
 * What this list leaves out, so a gap reads as a decision rather than an oversight.
 *
 * - **`AutoSuggestBoxLightDismissOverlayBackground`** — defined in all three themes but
 *   painted on the light-dismiss overlay that is out of scope for this unit.
 * - **`AutoSuggestBoxTextBoxStyle`** — a `Style` resource, not a value. This project writes
 *   its own templates rather than reading XAML styles — the same reason every other
 *   `*Style` resource is dropped.
 * The last four keys are framework-dictionary names — `generic.xaml` defines them in all
 * three themes — and this is the third control to read through that pin after ComboBox and
 * PasswordBox. `AutoSuggestListMaxHeight` is an `x:Double` that is a length, so it needs a
 * `DOUBLE_LENGTHS` row; the generator stops and names it if it is missing, which is the
 * guard working.
 *
 * `TextControl*`, `TextBoxInnerButtonMargin`, `TextBoxIconFontSize`, `TextControlButtonBackground*`,
 * `TextControlButtonForeground*` and `TextControlButtonBorderBrush*` are seeded by
 * `TEXTBOX_KEYS` already; `HelperButtonThemePadding` is seeded by `PASSWORDBOX_KEYS`;
 * `ComboBoxItem*` is seeded by `COMBOBOX_KEYS`. The generator's disjointness check is what
 * stops a key from being seeded twice.
 *
 * `TextControlThemeMinWidth` is added to the set even though the unit brief's enumeration
 * names thirteen keys: the popup's `min-width` floor is `max(anchor-width, …)` and
 * `TextControlThemeMinWidth` is the resource the source picks for that role on an
 * editable text box — `generic.xaml` defines it as `64` in all three themes. Seeding
 * here is the third control's read of it through the framework pin, and it is a key no
 * other set holds.
 */
export const AUTOSUGGESTBOX_KEYS = {
	// The two layout keys the header and the delete button reach, plus the five metrics the
	// inner buttons read directly. `AutoSuggestBoxInnerButtonMargin` and
	// `AutoSuggestBoxRightButtonMargin` are seeded by `SHELL_KEYS` already; the
	// disjointness check is what stops a key from being seeded twice, and the same
	// reason is why `TextControl*`, `TextBoxInnerButtonMargin`, `TextBoxIconFontSize`,
	// `HelperButtonThemePadding` and `ComboBoxItem*` are not repeated here.
	AutoSuggestBoxTopHeaderMargin: 'AutoSuggestBox header, the gap between it and the box',
	AutoSuggestBoxIconFontSize: 'AutoSuggestBox buttons, the glyph inside them',
	AutoSuggestBoxQueryButtonPadding: 'AutoSuggestBox query button, its padding',
	AutoSuggestBoxLeftButtonMargin: 'AutoSuggestBox delete button, the spacer column left of it',
	AutoSuggestBoxDeleteButtonMargin: 'AutoSuggestBox delete button, the inset of its fill',

	// The popup's two brushes — background and border — in each of the three themes the
	// dictionary defines. `AutoSuggestBoxSuggestionsListBackground` aliases
	// `AcrylicBackgroundFillColorDefaultBrush` rather than the in-app variant, the same
	// paint the source picks.
	AutoSuggestBoxSuggestionsListBackground: 'AutoSuggestBox popup, the background inside its border',
	AutoSuggestBoxSuggestionsListBorderBrush: 'AutoSuggestBox popup, its border',

	// The popup's four framework-dictionary keys: its `Margin`, its inner `Padding`, its
	// `MaxHeight`, and the `BorderThickness` of the popup's own `Border`. `MaxHeight` is
	// a `x:Double` length and so needs the `DOUBLE_LENGTHS` row below.
	AutoSuggestListMargin: 'AutoSuggestBox popup, the padding inside its border',
	AutoSuggestListPadding: 'AutoSuggestBox popup, the inset the list sits in',
	AutoSuggestListMaxHeight: 'AutoSuggestBox popup, the height the list never exceeds',
	AutoSuggestListBorderThemeThickness: 'AutoSuggestBox popup, its border width',

	// The popup's `min-width` floor: the `MaxWidth` of the box itself, the same resource
	// the editable text box reaches. `generic.xaml` defines it as `64` in all three themes.
	TextControlThemeMinWidth: 'AutoSuggestBox popup, the floor its width never goes below'
};

/**
 * Keys NumberBox reads — the twelfth seed set, and the fourth in the Text family.
 *
 * NumberBox is a TextBox with two RepeatButton spin buttons side by side beside it. The
 * header, description, placeholder and the box itself read the same `TextControl*` family
 * TextBox reads in the same four states — those keys belong to `TEXTBOX_KEYS` and are
 * not repeated here, for the same disjointness reason `PasswordBox` and
 * `AutoSuggestBox` do not repeat them.
 *
 * The spin buttons are `RepeatButton`s in `SourceNames` — `RepeatButton_themeresources.xaml`,
 * defined alongside the rest of the CommonStyles — rather than in the NumberBox dictionary
 * itself, so every brush the buttons paint is a `RepeatButton*` name. The button's own
 * style at `NumberBox.xaml:182` is `BasedOn` the default `RepeatButton`
 * style, so the background, foreground and border it paints come from the `RepeatButton*`
 * families, in the four `CommonStates` the source paints (Normal, PointerOver, Pressed,
 * Disabled).
 *
 * What this list leaves out, so a gap reads as a decision rather than an oversight. The
 * NumberBox dictionary and the framework dictionary together carry 26 `NumberBox*` keys;
 * these are the ones not here:
 *
 * - **The `NumberBoxPopup*` family and `NumberBoxIconMargin`.** The compact placement,
 *   where the spin buttons live in a popup beside the box. Not built in this unit — the
 *   brief's scope names only `Hidden` and `Inline`, and `SpinButtonPlacementMode="Compact"`
 *   arrives with its own tranche. `NumberBoxTextBoxStyle` is a `Style` resource, the same
 *   reason every other `*Style` resource is dropped: this project writes its own
 *   templates.
 *
 * `TextControl*` is seeded by `TEXTBOX_KEYS` already; `RepeatButton*` belongs to the
 * RepeatButton tranche. `NumberBoxMinWidth` is an `x:Double` and a length, so it
 * needs a `DOUBLE_LENGTHS` row; the generator stops and names it otherwise. The five
 * pre-Fluent `RepeatButton*ThemeBrush` names — `RepeatButtonBackgroundThemeBrush`,
 * `RepeatButtonBorderThemeBrush`, `RepeatButtonDisabled*ThemeBrush`,
 * `RepeatButtonForegroundThemeBrush`, `RepeatButtonPointerOver*ThemeBrush` and
 * `RepeatButtonPressed*ThemeBrush` — are defined in the dictionary and referenced nowhere
 * in the current `RepeatButton` template, the same family and same reason as Button's
 * ten and TextBox's seventeen. They are not seeded here because nothing in this component
 * reads them; if a later RepeatButton tranche takes the family whole, they arrive with it.
 */
export const NUMBERBOX_KEYS = {
	// The two NumberBox-only keys: the box's minimum width and the spin buttons' border
	// thickness (a four-part `Thickness` — `0,1,1,1`, no left border on a spin button).
	NumberBoxMinWidth: 'NumberBox, the width the box reserves when spin buttons are inline',
	NumberBoxSpinButtonBorderThickness: 'NumberBox spin button, the border the four sides paint'
};

/**
 * Keys CheckBox reads — the fifth seed set.
 *
 * The dictionary is a product: six painted properties across three checked states and
 * four pointer states. Every one of the 72 combinations is defined upstream, and
 * `CheckBox_themeresources.xaml:297` drives all of them from a single `CombinedStates`
 * group, so the list below is the template read straight through rather than a selection
 * made from it.
 *
 * Two things it leaves out, so a gap reads as a decision rather than an oversight.
 *
 * - **The four `CheckBoxCheckGlyphForegroundUnchecked*` brushes.** They are seeded for
 *   EXCLUDED, not emitted, because nothing paints them here: an unchecked box draws no
 *   glyph. Upstream's `CheckGlyph` is an `AnimatedIcon` whose four unchecked states set
 *   `AnimatedIcon.State` to a `…Off` value, and the glyph is hidden by the animation
 *   rather than by a colour. The four brushes exist for the down-level path, where
 *   `AnimatedIcon` shows its `FallbackIconSource` and ignores state entirely — there the
 *   glyph is always drawn and these four hide it by matching the fill. They almost do:
 *   in Light and Dark the pair is `TextOnAccentFillColorPrimary` on
 *   `ControlAltFillColorSecondary`, which is white on near-white and black on near-black.
 *   In HighContrast it breaks — `SystemColorHighlightColorBrush` glyph on
 *   `SystemColorHighlightTextColorBrush` fill, pointer over, is a checkmark on an
 *   unchecked box. WD-006 accepts rendering the fallback glyph; it does not accept
 *   rendering a state the original never shows, so this control follows the animated
 *   original's visibility and the four brushes have nothing to paint.
 * - **The fourteen pre-Fluent `CheckBox*ThemeBrush` resources** — the same family and the
 *   same reason as Button's ten and TextBox's seventeen. The current template references
 *   none of them.
 *
 * `CheckBoxFocusVisualMargin` is the one key in this set that changed sides. It was seeded
 * for `EXCLUDED` while no control in this library drew a focus visual, because the inset it
 * carries had nothing to inset. The component draws one now, so the key is emitted and read:
 * `CheckBox_themeresources.xaml:275` gives `-7,-3,-7,-3`, and the generator turns XAML's
 * left,top,right,bottom into CSS's top,right,bottom,left, which is exactly what `inset`
 * wants. The other three controls' margins are `Setter` values with no key, so those are
 * `c1-allow` citations in the components rather than tokens here.
 */
export const CHECKBOX_KEYS = {
	// The box, the glyph inside it, and the row they sit in.
	CheckBoxSize: 'CheckBox, the box the glyph is drawn in',
	CheckBoxBorderThickness: "CheckBox, the box's stroke width",
	CheckBoxGlyphSize: 'CheckBox, the glyph inside the box',
	CheckBoxHeight: 'CheckBox, the row',
	CheckBoxMinWidth: 'CheckBox, the row',
	CheckBoxPadding: 'CheckBox, the inset between the box and its content',

	// The two glyphs, both from Segoe Fluent Icons.
	CheckBoxCheckedGlyph: 'CheckBox, the checked glyph',
	CheckBoxIndeterminateGlyph: 'CheckBox, the indeterminate glyph',

	CheckBoxBackgroundUnchecked: 'CheckBox background, unchecked at rest',
	CheckBoxBackgroundUncheckedPointerOver: 'CheckBox background, unchecked pointer over',
	CheckBoxBackgroundUncheckedPressed: 'CheckBox background, unchecked pressed',
	CheckBoxBackgroundUncheckedDisabled: 'CheckBox background, unchecked disabled',
	CheckBoxBackgroundChecked: 'CheckBox background, checked at rest',
	CheckBoxBackgroundCheckedPointerOver: 'CheckBox background, checked pointer over',
	CheckBoxBackgroundCheckedPressed: 'CheckBox background, checked pressed',
	CheckBoxBackgroundCheckedDisabled: 'CheckBox background, checked disabled',
	CheckBoxBackgroundIndeterminate: 'CheckBox background, indeterminate at rest',
	CheckBoxBackgroundIndeterminatePointerOver: 'CheckBox background, indeterminate pointer over',
	CheckBoxBackgroundIndeterminatePressed: 'CheckBox background, indeterminate pressed',
	CheckBoxBackgroundIndeterminateDisabled: 'CheckBox background, indeterminate disabled',

	CheckBoxBorderBrushUnchecked: 'CheckBox border, unchecked at rest',
	CheckBoxBorderBrushUncheckedPointerOver: 'CheckBox border, unchecked pointer over',
	CheckBoxBorderBrushUncheckedPressed: 'CheckBox border, unchecked pressed',
	CheckBoxBorderBrushUncheckedDisabled: 'CheckBox border, unchecked disabled',
	CheckBoxBorderBrushChecked: 'CheckBox border, checked at rest',
	CheckBoxBorderBrushCheckedPointerOver: 'CheckBox border, checked pointer over',
	CheckBoxBorderBrushCheckedPressed: 'CheckBox border, checked pressed',
	CheckBoxBorderBrushCheckedDisabled: 'CheckBox border, checked disabled',
	CheckBoxBorderBrushIndeterminate: 'CheckBox border, indeterminate at rest',
	CheckBoxBorderBrushIndeterminatePointerOver: 'CheckBox border, indeterminate pointer over',
	CheckBoxBorderBrushIndeterminatePressed: 'CheckBox border, indeterminate pressed',
	CheckBoxBorderBrushIndeterminateDisabled: 'CheckBox border, indeterminate disabled',

	CheckBoxForegroundUnchecked: 'CheckBox content foreground, unchecked at rest',
	CheckBoxForegroundUncheckedPointerOver: 'CheckBox content foreground, unchecked pointer over',
	CheckBoxForegroundUncheckedPressed: 'CheckBox content foreground, unchecked pressed',
	CheckBoxForegroundUncheckedDisabled: 'CheckBox content foreground, unchecked disabled',
	CheckBoxForegroundChecked: 'CheckBox content foreground, checked at rest',
	CheckBoxForegroundCheckedPointerOver: 'CheckBox content foreground, checked pointer over',
	CheckBoxForegroundCheckedPressed: 'CheckBox content foreground, checked pressed',
	CheckBoxForegroundCheckedDisabled: 'CheckBox content foreground, checked disabled',
	CheckBoxForegroundIndeterminate: 'CheckBox content foreground, indeterminate at rest',
	CheckBoxForegroundIndeterminatePointerOver:
		'CheckBox content foreground, indeterminate pointer over',
	CheckBoxForegroundIndeterminatePressed: 'CheckBox content foreground, indeterminate pressed',
	CheckBoxForegroundIndeterminateDisabled: 'CheckBox content foreground, indeterminate disabled',

	CheckBoxCheckBackgroundFillUnchecked: 'CheckBox box fill, unchecked at rest',
	CheckBoxCheckBackgroundFillUncheckedPointerOver: 'CheckBox box fill, unchecked pointer over',
	CheckBoxCheckBackgroundFillUncheckedPressed: 'CheckBox box fill, unchecked pressed',
	CheckBoxCheckBackgroundFillUncheckedDisabled: 'CheckBox box fill, unchecked disabled',
	CheckBoxCheckBackgroundFillChecked: 'CheckBox box fill, checked at rest',
	CheckBoxCheckBackgroundFillCheckedPointerOver: 'CheckBox box fill, checked pointer over',
	CheckBoxCheckBackgroundFillCheckedPressed: 'CheckBox box fill, checked pressed',
	CheckBoxCheckBackgroundFillCheckedDisabled: 'CheckBox box fill, checked disabled',
	CheckBoxCheckBackgroundFillIndeterminate: 'CheckBox box fill, indeterminate at rest',
	CheckBoxCheckBackgroundFillIndeterminatePointerOver:
		'CheckBox box fill, indeterminate pointer over',
	CheckBoxCheckBackgroundFillIndeterminatePressed: 'CheckBox box fill, indeterminate pressed',
	CheckBoxCheckBackgroundFillIndeterminateDisabled: 'CheckBox box fill, indeterminate disabled',

	CheckBoxCheckBackgroundStrokeUnchecked: 'CheckBox box stroke, unchecked at rest',
	CheckBoxCheckBackgroundStrokeUncheckedPointerOver: 'CheckBox box stroke, unchecked pointer over',
	CheckBoxCheckBackgroundStrokeUncheckedPressed: 'CheckBox box stroke, unchecked pressed',
	CheckBoxCheckBackgroundStrokeUncheckedDisabled: 'CheckBox box stroke, unchecked disabled',
	CheckBoxCheckBackgroundStrokeChecked: 'CheckBox box stroke, checked at rest',
	CheckBoxCheckBackgroundStrokeCheckedPointerOver: 'CheckBox box stroke, checked pointer over',
	CheckBoxCheckBackgroundStrokeCheckedPressed: 'CheckBox box stroke, checked pressed',
	CheckBoxCheckBackgroundStrokeCheckedDisabled: 'CheckBox box stroke, checked disabled',
	CheckBoxCheckBackgroundStrokeIndeterminate: 'CheckBox box stroke, indeterminate at rest',
	CheckBoxCheckBackgroundStrokeIndeterminatePointerOver:
		'CheckBox box stroke, indeterminate pointer over',
	CheckBoxCheckBackgroundStrokeIndeterminatePressed: 'CheckBox box stroke, indeterminate pressed',
	CheckBoxCheckBackgroundStrokeIndeterminateDisabled: 'CheckBox box stroke, indeterminate disabled',

	CheckBoxCheckGlyphForegroundChecked: 'CheckBox glyph, checked at rest',
	CheckBoxCheckGlyphForegroundCheckedPointerOver: 'CheckBox glyph, checked pointer over',
	CheckBoxCheckGlyphForegroundCheckedPressed: 'CheckBox glyph, checked pressed',
	CheckBoxCheckGlyphForegroundCheckedDisabled: 'CheckBox glyph, checked disabled',
	CheckBoxCheckGlyphForegroundIndeterminate: 'CheckBox glyph, indeterminate at rest',
	CheckBoxCheckGlyphForegroundIndeterminatePointerOver:
		'CheckBox glyph, indeterminate pointer over',
	CheckBoxCheckGlyphForegroundIndeterminatePressed: 'CheckBox glyph, indeterminate pressed',
	CheckBoxCheckGlyphForegroundIndeterminateDisabled: 'CheckBox glyph, indeterminate disabled',

	// Seeded only so the EXCLUDED list below can name them — the generator stops if an
	// EXCLUDED key is not selected. The four unchecked glyph brushes, the focus visual's
	// inset, and the fourteen pre-Fluent `*ThemeBrush` resources; the reasons are the
	// three above, one each.
	CheckBoxCheckGlyphForegroundUnchecked: 'Unchecked glyph, listed for EXCLUDED',
	CheckBoxCheckGlyphForegroundUncheckedPointerOver: 'Unchecked glyph, listed for EXCLUDED',
	CheckBoxCheckGlyphForegroundUncheckedPressed: 'Unchecked glyph, listed for EXCLUDED',
	CheckBoxCheckGlyphForegroundUncheckedDisabled: 'Unchecked glyph, listed for EXCLUDED',

	CheckBoxFocusVisualMargin: 'CheckBox focus visual, how far outside the control it sits',

	CheckBoxBackgroundThemeBrush: 'Pre-Fluent CheckBox *ThemeBrush family, listed for EXCLUDED',
	CheckBoxBorderThemeBrush: 'Pre-Fluent CheckBox *ThemeBrush family, listed for EXCLUDED',
	CheckBoxContentDisabledForegroundThemeBrush:
		'Pre-Fluent CheckBox *ThemeBrush family, listed for EXCLUDED',
	CheckBoxContentForegroundThemeBrush:
		'Pre-Fluent CheckBox *ThemeBrush family, listed for EXCLUDED',
	CheckBoxDisabledBackgroundThemeBrush:
		'Pre-Fluent CheckBox *ThemeBrush family, listed for EXCLUDED',
	CheckBoxDisabledBorderThemeBrush: 'Pre-Fluent CheckBox *ThemeBrush family, listed for EXCLUDED',
	CheckBoxDisabledForegroundThemeBrush:
		'Pre-Fluent CheckBox *ThemeBrush family, listed for EXCLUDED',
	CheckBoxForegroundThemeBrush: 'Pre-Fluent CheckBox *ThemeBrush family, listed for EXCLUDED',
	CheckBoxPointerOverBackgroundThemeBrush:
		'Pre-Fluent CheckBox *ThemeBrush family, listed for EXCLUDED',
	CheckBoxPointerOverBorderThemeBrush:
		'Pre-Fluent CheckBox *ThemeBrush family, listed for EXCLUDED',
	CheckBoxPointerOverForegroundThemeBrush:
		'Pre-Fluent CheckBox *ThemeBrush family, listed for EXCLUDED',
	CheckBoxPressedBackgroundThemeBrush:
		'Pre-Fluent CheckBox *ThemeBrush family, listed for EXCLUDED',
	CheckBoxPressedBorderThemeBrush: 'Pre-Fluent CheckBox *ThemeBrush family, listed for EXCLUDED',
	CheckBoxPressedForegroundThemeBrush: 'Pre-Fluent CheckBox *ThemeBrush family, listed for EXCLUDED'
};

/**
 * Keys RadioButton reads — the sixth seed set.
 *
 * RadioButton's template has two orthogonal state groups where CheckBox has one combined
 * one: `CommonStates` (Normal, PointerOver, Pressed, Disabled) paints, and `CheckStates`
 * (Checked, Unchecked, Indeterminate) shows and hides. That is why the ring is two
 * elements — `OuterEllipse` for unchecked and `CheckOuterEllipse` for checked, each with
 * its own four-state brush pair — rather than one element with twelve. The XAML says so
 * itself, at `RadioButton_themeresources.xaml:378`: "A seperate element is added since the
 * two orthogonal state groups that cannot touch the same property".
 *
 * What this list leaves out:
 *
 * - **`RadioButtonCheckGlyphStrokeCheckedPointerOver`, `…CheckedPressed` and
 *   `…CheckedDisabled`.** All three are defined and the template references none of them —
 *   the `Checked` state sets `CheckGlyph.Stroke` once, to the base
 *   `RadioButtonCheckGlyphStrokeChecked`, and the three pointer states set it from the
 *   `CommonStates` family instead. This is the same category as the pre-Fluent
 *   `*ThemeBrush` names — defined, unreferenced — reached by a modern name, which is why
 *   it is called out separately rather than folded in with them.
 * - **The fifteen pre-Fluent `RadioButton*ThemeBrush` resources.** Same family and same
 *   reason as Button's ten, TextBox's seventeen and CheckBox's fourteen.
 *
 * `RadioButtonCheckGlyphFillDisabled` aliases `TextOnAccentFillColorPrimary`, a `Color`,
 * where its three siblings alias `TextOnAccentFillColorPrimaryBrush`. That is what the
 * source says and the values are the same one; it is noted because a reader comparing the
 * four lines will otherwise take the odd one for a transcription error here.
 */
export const RADIOBUTTON_KEYS = {
	// The ring, the dot, and the dot's two animated sizes.
	RadioButtonBorderThemeThickness: "RadioButton, the ring's stroke width",
	RadioButtonCheckGlyphSize: 'RadioButton, the dot at rest',
	RadioButtonCheckGlyphPointerOverSize: 'RadioButton, the dot under the pointer',
	RadioButtonCheckGlyphPressedOverSize: 'RadioButton, the dot while pressed',

	RadioButtonBackground: 'RadioButton background, at rest',
	RadioButtonBackgroundPointerOver: 'RadioButton background, pointer over',
	RadioButtonBackgroundPressed: 'RadioButton background, pressed',
	RadioButtonBackgroundDisabled: 'RadioButton background, disabled',

	RadioButtonBorderBrush: 'RadioButton border, at rest',
	RadioButtonBorderBrushPointerOver: 'RadioButton border, pointer over',
	RadioButtonBorderBrushPressed: 'RadioButton border, pressed',
	RadioButtonBorderBrushDisabled: 'RadioButton border, disabled',

	RadioButtonForeground: 'RadioButton content foreground, at rest',
	RadioButtonForegroundPointerOver: 'RadioButton content foreground, pointer over',
	RadioButtonForegroundPressed: 'RadioButton content foreground, pressed',
	RadioButtonForegroundDisabled: 'RadioButton content foreground, disabled',

	RadioButtonOuterEllipseFill: 'RadioButton ring fill, unchecked, at rest',
	RadioButtonOuterEllipseFillPointerOver: 'RadioButton ring fill, unchecked, pointer over',
	RadioButtonOuterEllipseFillPressed: 'RadioButton ring fill, unchecked, pressed',
	RadioButtonOuterEllipseFillDisabled: 'RadioButton ring fill, unchecked, disabled',

	RadioButtonOuterEllipseStroke: 'RadioButton ring stroke, unchecked, at rest',
	RadioButtonOuterEllipseStrokePointerOver: 'RadioButton ring stroke, unchecked, pointer over',
	RadioButtonOuterEllipseStrokePressed: 'RadioButton ring stroke, unchecked, pressed',
	RadioButtonOuterEllipseStrokeDisabled: 'RadioButton ring stroke, unchecked, disabled',

	RadioButtonOuterEllipseCheckedFill: 'RadioButton ring fill, checked, at rest',
	RadioButtonOuterEllipseCheckedFillPointerOver: 'RadioButton ring fill, checked, pointer over',
	RadioButtonOuterEllipseCheckedFillPressed: 'RadioButton ring fill, checked, pressed',
	RadioButtonOuterEllipseCheckedFillDisabled: 'RadioButton ring fill, checked, disabled',

	RadioButtonOuterEllipseCheckedStroke: 'RadioButton ring stroke, checked, at rest',
	RadioButtonOuterEllipseCheckedStrokePointerOver: 'RadioButton ring stroke, checked, pointer over',
	RadioButtonOuterEllipseCheckedStrokePressed: 'RadioButton ring stroke, checked, pressed',
	RadioButtonOuterEllipseCheckedStrokeDisabled: 'RadioButton ring stroke, checked, disabled',

	RadioButtonCheckGlyphFill: 'RadioButton dot fill, at rest',
	RadioButtonCheckGlyphFillPointerOver: 'RadioButton dot fill, pointer over',
	RadioButtonCheckGlyphFillPressed: 'RadioButton dot fill, pressed',
	RadioButtonCheckGlyphFillDisabled: 'RadioButton dot fill, disabled',

	RadioButtonCheckGlyphStroke: 'RadioButton dot stroke, at rest',
	RadioButtonCheckGlyphStrokePointerOver: 'RadioButton dot stroke, pointer over',
	RadioButtonCheckGlyphStrokePressed: 'RadioButton dot stroke, pressed',
	RadioButtonCheckGlyphStrokeDisabled: 'RadioButton dot stroke, disabled',

	// The one `…StrokeChecked` the `Checked` state sets. Its three pointer siblings are
	// seeded for EXCLUDED below.
	RadioButtonCheckGlyphStrokeChecked: 'RadioButton dot stroke, checked',

	// Seeded only so the EXCLUDED list below can name them — the generator stops if an
	// EXCLUDED key is not selected.
	RadioButtonCheckGlyphStrokeCheckedPointerOver: 'Defined, unreferenced; listed for EXCLUDED',
	RadioButtonCheckGlyphStrokeCheckedPressed: 'Defined, unreferenced; listed for EXCLUDED',
	RadioButtonCheckGlyphStrokeCheckedDisabled: 'Defined, unreferenced; listed for EXCLUDED',

	RadioButtonBackgroundThemeBrush: 'Pre-Fluent RadioButton *ThemeBrush family, listed for EXCLUDED',
	RadioButtonBorderThemeBrush: 'Pre-Fluent RadioButton *ThemeBrush family, listed for EXCLUDED',
	RadioButtonContentDisabledForegroundThemeBrush:
		'Pre-Fluent RadioButton *ThemeBrush family, listed for EXCLUDED',
	RadioButtonContentForegroundThemeBrush:
		'Pre-Fluent RadioButton *ThemeBrush family, listed for EXCLUDED',
	RadioButtonContentPointerOverForegroundThemeBrush:
		'Pre-Fluent RadioButton *ThemeBrush family, listed for EXCLUDED',
	RadioButtonDisabledBackgroundThemeBrush:
		'Pre-Fluent RadioButton *ThemeBrush family, listed for EXCLUDED',
	RadioButtonDisabledBorderThemeBrush:
		'Pre-Fluent RadioButton *ThemeBrush family, listed for EXCLUDED',
	RadioButtonDisabledForegroundThemeBrush:
		'Pre-Fluent RadioButton *ThemeBrush family, listed for EXCLUDED',
	RadioButtonForegroundThemeBrush: 'Pre-Fluent RadioButton *ThemeBrush family, listed for EXCLUDED',
	RadioButtonPointerOverBackgroundThemeBrush:
		'Pre-Fluent RadioButton *ThemeBrush family, listed for EXCLUDED',
	RadioButtonPointerOverBorderThemeBrush:
		'Pre-Fluent RadioButton *ThemeBrush family, listed for EXCLUDED',
	RadioButtonPointerOverForegroundThemeBrush:
		'Pre-Fluent RadioButton *ThemeBrush family, listed for EXCLUDED',
	RadioButtonPressedBackgroundThemeBrush:
		'Pre-Fluent RadioButton *ThemeBrush family, listed for EXCLUDED',
	RadioButtonPressedBorderThemeBrush:
		'Pre-Fluent RadioButton *ThemeBrush family, listed for EXCLUDED',
	RadioButtonPressedForegroundThemeBrush:
		'Pre-Fluent RadioButton *ThemeBrush family, listed for EXCLUDED'
};

/**
 * Keys RadioButtons reads — v11's first set. The group control around RadioButton
 * (`controls/dev/RadioButtons/RadioButtons.xaml`): a header with two foregrounds and the
 * margin below it, and the two gaps of the column-major grid its items fill.
 */
export const RADIOBUTTONS_KEYS = {
	RadioButtonsHeaderForeground: 'RadioButtons header text',
	RadioButtonsHeaderForegroundDisabled: 'RadioButtons header text, disabled',
	RadioButtonsColumnSpacing: 'RadioButtons, the gap between columns',
	RadioButtonsRowSpacing: 'RadioButtons, the gap between rows',
	RadioButtonsTopHeaderMargin: 'RadioButtons header, the gap below it'
};

/**
 * Keys CalendarView reads from DefaultCalendarViewStyle and its rounded item chrome. The three
 * Reveal-only brushes (CalendarViewCalendarItemRevealBackground,
 * CalendarViewCalendarItemRevealBorderBrush, and CalendarViewFocusBorderBrush) are excluded:
 * CalendarViewRevealStyle is not applied. CalendarViewBaseItemRoundedChromeEnabled is also
 * excluded because it is a native x:Boolean feature flag, not a value a CSS declaration accepts.
 *
 * Two more are excluded for v11's `SplitViewRightBorderThemeThickness` reason — defined by the
 * pin and applied by nothing in it. Neither `HeaderNavigationButtonStyle` nor
 * `NavigationButtonStyle` carries a `Foreground` setter, and neither template binds one, so
 * `CalendarViewHeaderNavigationButtonForeground` and `CalendarViewNavigationButtonForeground`
 * are read by no resting state: the header button takes the control's own
 * `CalendarViewForeground` through `{TemplateBinding Foreground}`, and the two arrow buttons
 * take the ordinary `ButtonForeground`. Measured on the reference guest, where the arrows are
 * the same (27, 27, 27) as the title rather than that key's grey. The three pointer-state
 * variants of each are kept, because the visual states do set those.
 */
export const CALENDARVIEW_KEYS = {
	CalendarViewBackground: 'CalendarView frame background',
	CalendarViewBlackoutBackground: 'CalendarView blackout day background',
	CalendarViewBlackoutForeground: 'CalendarView blackout day foreground',
	CalendarViewBlackoutStrikethroughBrush: 'CalendarView blackout day strikethrough',
	CalendarViewBorderBrush: 'CalendarView frame border and divider',
	CalendarViewCalendarItemBackground: 'CalendarView day background, at rest',
	CalendarViewCalendarItemBorderBrush: 'CalendarView day border, at rest',
	CalendarViewCalendarItemDisabledBackground: 'CalendarView disabled day background',
	CalendarViewCalendarItemForeground: 'CalendarView day foreground, at rest',
	CalendarViewCalendarItemHoverBackground: 'CalendarView day background, pointer over',
	CalendarViewCalendarItemPressedBackground: 'CalendarView day background, pressed',
	CalendarViewDisabledForeground: 'CalendarView disabled day foreground',
	CalendarViewFocusVisualPrimaryBrush: 'CalendarView focus visual outer stroke',
	CalendarViewFocusVisualSecondaryBrush: 'CalendarView focus visual inner stroke',
	CalendarViewForeground: 'CalendarView default foreground',
	CalendarViewHeaderNavigationButtonForegroundDisabled:
		'CalendarView disabled header button foreground',
	CalendarViewHeaderNavigationButtonForegroundPointerOver:
		'CalendarView header button foreground, pointer over',
	CalendarViewHeaderNavigationButtonForegroundPressed:
		'CalendarView header button foreground, pressed',
	CalendarViewHoverBorderBrush: 'CalendarView day border, pointer over',
	CalendarViewNavigationButtonBackground: 'CalendarView navigation button background',
	CalendarViewNavigationButtonBackgroundPointerOver:
		'CalendarView navigation button background, pointer over',
	CalendarViewNavigationButtonBackgroundPressed:
		'CalendarView navigation button background, pressed',
	CalendarViewNavigationButtonBorderBrush: 'CalendarView navigation button border',
	CalendarViewNavigationButtonBorderBrushPointerOver:
		'CalendarView navigation button border, pointer over',
	CalendarViewNavigationButtonForegroundDisabled:
		'CalendarView disabled navigation button foreground',
	CalendarViewNavigationButtonForegroundPointerOver:
		'CalendarView navigation button foreground, pointer over',
	CalendarViewNavigationButtonForegroundPressed:
		'CalendarView navigation button foreground, pressed',
	CalendarViewOutOfScopeBackground: 'CalendarView out-of-scope day background',
	CalendarViewOutOfScopeForeground: 'CalendarView out-of-scope day foreground',
	CalendarViewOutOfScopeHoverForeground: 'CalendarView out-of-scope day foreground, pointer over',
	CalendarViewOutOfScopePressedForeground: 'CalendarView out-of-scope day foreground, pressed',
	CalendarViewPressedBorderBrush: 'CalendarView day border, pressed',
	CalendarViewPressedForeground: 'CalendarView day foreground, pressed',
	CalendarViewSelectedBorderBrush: 'CalendarView selected day border',
	CalendarViewSelectedDisabledBorderBrush: 'CalendarView disabled selected day border',
	CalendarViewSelectedDisabledForeground: 'CalendarView disabled selected day foreground',
	CalendarViewSelectedForeground: 'CalendarView selected day foreground',
	CalendarViewSelectedHoverBorderBrush: 'CalendarView selected day border, pointer over',
	CalendarViewSelectedHoverForeground: 'CalendarView selected day foreground, pointer over',
	CalendarViewSelectedPressedBorderBrush: 'CalendarView selected day border, pressed',
	CalendarViewSelectedPressedForeground: 'CalendarView selected day foreground, pressed',
	CalendarViewTodayBackground: 'CalendarView today background',
	CalendarViewTodayBlackoutBackground: 'CalendarView blackout today background',
	CalendarViewTodayBlackoutForeground: 'CalendarView blackout today foreground',
	CalendarViewTodayDisabledBackground: 'CalendarView disabled today background',
	CalendarViewTodayForeground: 'CalendarView today foreground',
	CalendarViewTodayHoverBackground: 'CalendarView today background, pointer over',
	CalendarViewTodayPressedBackground: 'CalendarView today background, pressed',
	CalendarViewTodaySelectedInnerBorderBrush: 'CalendarView selected today inner border',
	CalendarViewWeekDayForegroundDisabled: 'CalendarView disabled weekday foreground',
	CalendarViewDayItemFontSize: 'CalendarView day number font size',
	CalendarViewFirstOfMonthLabelFontSize: 'CalendarView first-of-month label font size',
	CalendarViewFirstOfYearDecadeLabelFontSize: 'CalendarView first-of-year decade label font size',
	CalendarViewHeaderNavigationButtonFontSize: 'CalendarView header button font size',
	CalendarViewMonthYearItemFontSize: 'CalendarView month-year item font size',
	CalendarViewNavigationButtonFontSize: 'CalendarView navigation button font size',
	CalendarViewDayItemMargin: 'CalendarView day number margin',
	CalendarViewFirstOfMonthLabelMargin: 'CalendarView first-of-month label margin',
	CalendarViewFirstOfYearDecadeLabelMargin: 'CalendarView first-of-year decade label margin',
	CalendarViewHeaderNavigationButtonMargin: 'CalendarView header button margin',
	CalendarViewHeaderNavigationButtonPadding: 'CalendarView header button padding',
	CalendarViewMonthYearItemMargin: 'CalendarView month-year item margin',
	CalendarViewNavigationButtonFocusVisualMargin: 'CalendarView navigation focus visual margin',
	CalendarViewNavigationButtonPadding: 'CalendarView navigation button padding',
	CalendarViewNavigationNextButtonMargin: 'CalendarView next button margin',
	CalendarViewNavigationPreviousButtonMargin: 'CalendarView previous button margin',
	CalendarViewWeekDayMargin: 'CalendarView weekday margin',
	CalendarViewWeekDayPadding: 'CalendarView weekday padding',
	CalendarViewHeaderNavigationFontWeight: 'CalendarView header button font weight',
	CalendarViewTodayFontWeight: 'CalendarView today font weight',
	CalendarViewWeekDayFontWeight: 'CalendarView weekday font weight',
	CalendarViewNavigationButtonScalePressed: 'CalendarView navigation button pressed scale'
};

/**
 * Keys the closed CalendarDatePicker template paints. CalendarDatePickerBackgroundFocused is
 * deliberately excluded: every theme defines it, but the FocusStates group's three states are
 * empty (CalendarDatePicker_themeresources.xaml:155-159), so no template declaration reads it.
 * CalendarDatePickerLeftHeaderMargin and CalendarDatePickerLeftHeaderMaxWidth are also absent,
 * but not for that reason: both are defined, in the framework pin's generic.xaml (D23) rather
 * than in this control's dictionary, which is where a search of controls/dev stops. What keeps
 * HeaderPlacement="Left" owed is that no Gallery sample sets it, so there is no original render
 * to compare a transcription against.
 */
export const CALENDARDATEPICKER_KEYS = {
	CalendarDatePickerBorderThemeThickness: 'CalendarDatePicker button border thickness',
	CalendarDatePickerBackground: 'CalendarDatePicker button background',
	CalendarDatePickerBackgroundPointerOver: 'CalendarDatePicker button pointer-over background',
	CalendarDatePickerBackgroundPressed: 'CalendarDatePicker button pressed background',
	CalendarDatePickerBackgroundDisabled: 'CalendarDatePicker disabled button background',
	CalendarDatePickerBorderBrush: 'CalendarDatePicker button border',
	CalendarDatePickerBorderBrushPointerOver: 'CalendarDatePicker button pointer-over border',
	CalendarDatePickerBorderBrushPressed: 'CalendarDatePicker button pressed border',
	CalendarDatePickerBorderBrushDisabled: 'CalendarDatePicker disabled button border',
	CalendarDatePickerTextForeground: 'CalendarDatePicker date text',
	CalendarDatePickerTextForegroundPointerOver: 'CalendarDatePicker date text, pointer over',
	CalendarDatePickerTextForegroundPressed: 'CalendarDatePicker date text, pressed',
	CalendarDatePickerTextForegroundDisabled: 'CalendarDatePicker disabled date text',
	CalendarDatePickerTextForegroundSelected: 'CalendarDatePicker selected date text and glyph',
	CalendarDatePickerCalendarGlyphForeground: 'CalendarDatePicker calendar glyph',
	CalendarDatePickerCalendarGlyphForegroundPointerOver:
		'CalendarDatePicker calendar glyph, pointer over',
	CalendarDatePickerCalendarGlyphForegroundPressed: 'CalendarDatePicker calendar glyph, pressed',
	CalendarDatePickerCalendarGlyphForegroundDisabled: 'CalendarDatePicker disabled calendar glyph',
	CalendarDatePickerHeaderForeground: 'CalendarDatePicker header',
	CalendarDatePickerHeaderForegroundDisabled: 'CalendarDatePicker disabled header',
	CalendarDatePickerTopHeaderMargin: 'CalendarDatePicker header margin'
};

/**
 * Every resource DateTimePickerFlyout_themeresources.xaml defines. The accept and dismiss
 * button family arrives with the dictionary rather than with the unit that first draws it;
 * a token set is seeded by key, not by the first control to consume that key (D15).
 */
export const DATETIMEPICKERFLYOUT_KEYS = {
	DateTimePickerFlyoutButtonBackground: 'Date and time flyout accept/dismiss button background',
	DateTimePickerFlyoutButtonBackgroundPointerOver:
		'Date and time flyout accept/dismiss button pointer-over background',
	DateTimePickerFlyoutButtonBackgroundPressed:
		'Date and time flyout accept/dismiss button pressed background',
	DateTimePickerFlyoutButtonBorderBrush: 'Date and time flyout accept/dismiss button border',
	DateTimePickerFlyoutButtonBorderBrushPointerOver:
		'Date and time flyout accept/dismiss button pointer-over border',
	DateTimePickerFlyoutButtonBorderBrushPressed:
		'Date and time flyout accept/dismiss button pressed border',
	DateTimePickerFlyoutButtonForegroundPointerOver:
		'Date and time flyout accept/dismiss button pointer-over foreground',
	DateTimePickerFlyoutButtonForegroundPressed:
		'Date and time flyout accept/dismiss button pressed foreground',
	LoopingSelectorUpDownButtonForeground: 'LoopingSelector navigation button foreground',
	LoopingSelectorUpDownButtonForegroundPointerOver:
		'LoopingSelector navigation button pointer-over foreground',
	LoopingSelectorUpDownButtonForegroundPressed:
		'LoopingSelector navigation button pressed foreground',
	LoopingSelectorUpDownButtonBackground: 'LoopingSelector navigation button background',
	LoopingSelectorUpDownButtonBackgroundPointerOver:
		'LoopingSelector navigation button pointer-over background',
	LoopingSelectorUpDownButtonBackgroundPressed:
		'LoopingSelector navigation button pressed background',
	LoopingSelectorItemForeground: 'LoopingSelector item foreground',
	LoopingSelectorItemForegroundSelected: 'LoopingSelector selected item foreground',
	LoopingSelectorItemForegroundPointerOver: 'LoopingSelector item pointer-over foreground',
	LoopingSelectorItemForegroundPressed: 'LoopingSelector item pressed foreground',
	LoopingSelectorItemBackgroundSelected: 'LoopingSelector selected item background',
	LoopingSelectorItemBackgroundPointerOver: 'LoopingSelector item pointer-over background',
	LoopingSelectorItemBackgroundPressed: 'LoopingSelector item pressed background',
	LoopingSelectorItemMargin: 'LoopingSelector item margin',
	LoopingSelectorUpDownButtonMargin: 'LoopingSelector navigation button margin',
	LoopingSelectorUpDownButtonHeight: 'LoopingSelector navigation button height',
	LoopingSelectorUpDownButtonScalePressed: 'LoopingSelector navigation button pressed scale'
};

/**
 * Every resource DatePicker_themeresources.xaml defines for DatePicker and its presenter, plus
 * the two `DateTimeFlyout*Thickness` keys its template names.
 *
 * Those two are defined in **neither** control dictionary — they come from the framework pin's
 * `generic.xaml` (D23), which is why a search of `controls/dev` reports them missing. The button
 * one is the reason to seed it rather than write a literal: it is `0` in Default and Light and
 * `1` under HighContrast, so the accept and dismiss buttons have no border in the themes the
 * original was photographed in and a one-pixel one in the theme it was not.
 */
export const DATEPICKER_KEYS = {
	DateTimeFlyoutBorderThickness: 'DatePicker flyout border thickness',
	DateTimeFlyoutButtonBorderThickness: 'DatePicker flyout accept and dismiss button border',
	DatePickerBorderThemeThickness: 'DatePicker button border thickness',
	DatePickerButtonBackground: 'DatePicker button background',
	DatePickerButtonBackgroundDisabled: 'DatePicker disabled button background',
	DatePickerButtonBackgroundPointerOver: 'DatePicker button pointer-over background',
	DatePickerButtonBackgroundPressed: 'DatePicker button pressed background',
	DatePickerButtonBorderBrush: 'DatePicker button border',
	DatePickerButtonBorderBrushDisabled: 'DatePicker disabled button border',
	DatePickerButtonBorderBrushPointerOver: 'DatePicker button pointer-over border',
	DatePickerButtonBorderBrushPressed: 'DatePicker button pressed border',
	DatePickerButtonForeground: 'DatePicker button foreground',
	DatePickerButtonForegroundDefault: 'DatePicker empty button foreground',
	DatePickerButtonForegroundDisabled: 'DatePicker disabled button foreground',
	DatePickerButtonForegroundPointerOver: 'DatePicker button pointer-over foreground',
	DatePickerButtonForegroundPressed: 'DatePicker button pressed foreground',
	DatePickerFlyoutPresenterAcceptDismissHostGridHeight: 'DatePicker flyout action bar height',
	DatePickerFlyoutPresenterAcceptMargin: 'DatePicker flyout accept button margin',
	DatePickerFlyoutPresenterBackground: 'DatePicker flyout background',
	DatePickerFlyoutPresenterBorderBrush: 'DatePicker flyout border',
	DatePickerFlyoutPresenterDismissMargin: 'DatePicker flyout dismiss button margin',
	DatePickerFlyoutPresenterHighlightFill: 'DatePicker flyout selected-row fill',
	DatePickerFlyoutPresenterHighlightForegroundColor: 'DatePicker flyout selected-row foreground',
	DatePickerFlyoutPresenterHighlightHeight: 'DatePicker flyout selected-row height',
	DatePickerFlyoutPresenterItemHeight: 'DatePicker flyout item height',
	DatePickerFlyoutPresenterSpacerFill: 'DatePicker flyout spacer fill',
	DatePickerHeaderForeground: 'DatePicker header foreground',
	DatePickerHeaderForegroundDisabled: 'DatePicker disabled header foreground',
	DatePickerHostMonthPadding: 'DatePicker month field padding',
	DatePickerHostPadding: 'DatePicker day and year field padding',
	DatePickerSpacerFill: 'DatePicker closed spacer fill',
	DatePickerSpacerFillDisabled: 'DatePicker disabled closed spacer fill',
	DatePickerSpacerThemeWidth: 'DatePicker spacer width',
	DatePickerThemeMaxWidth: 'DatePicker maximum width',
	DatePickerThemeMinWidth: 'DatePicker minimum width',
	DatePickerTopHeaderMargin: 'DatePicker header margin'
};

/** Every TimePicker resource its closed template and distinct presenter paint. */
export const TIMEPICKER_KEYS = {
	TimePickerSpacerFill: 'TimePicker closed spacer fill',
	TimePickerSpacerFillDisabled: 'TimePicker disabled closed spacer fill',
	TimePickerHeaderForeground: 'TimePicker header foreground',
	TimePickerHeaderForegroundDisabled: 'TimePicker disabled header foreground',
	TimePickerButtonBorderBrush: 'TimePicker button pointer-state border',
	TimePickerButtonBorderBrushPointerOver: 'TimePicker button pointer-over border',
	TimePickerButtonBorderBrushPressed: 'TimePicker button pressed border',
	TimePickerButtonBorderBrushDisabled: 'TimePicker disabled button border',
	TimePickerButtonBackgroundPointerOver: 'TimePicker button pointer-over background',
	TimePickerButtonBackgroundPressed: 'TimePicker button pressed background',
	TimePickerButtonBackgroundDisabled: 'TimePicker disabled button background',
	TimePickerButtonForeground: 'TimePicker button foreground',
	TimePickerButtonForegroundDefault: 'TimePicker empty button foreground',
	TimePickerButtonForegroundPointerOver: 'TimePicker button pointer-over foreground',
	TimePickerButtonForegroundPressed: 'TimePicker button pressed foreground',
	TimePickerButtonForegroundDisabled: 'TimePicker disabled button foreground',
	TimePickerFlyoutPresenterBackground: 'TimePicker flyout background',
	TimePickerFlyoutPresenterBorderBrush: 'TimePicker flyout border',
	TimePickerFlyoutPresenterSpacerFill: 'TimePicker flyout spacer fill',
	TimePickerFlyoutPresenterHighlightFill: 'TimePicker flyout selected-row fill',
	TimePickerFlyoutPresenterHighlightForegroundColor: 'TimePicker flyout selected-row foreground',
	TimePickerSpacerThemeWidth: 'TimePicker spacer width',
	TimePickerTopHeaderMargin: 'TimePicker header margin',
	TimePickerFlyoutPresenterHighlightHeight: 'TimePicker flyout selected-row height',
	TimePickerFlyoutPresenterAcceptDismissHostGridHeight: 'TimePicker flyout action bar height',
	TimePickerThemeMinWidth: 'TimePicker minimum width',
	TimePickerThemeMaxWidth: 'TimePicker maximum width',
	TimePickerFlyoutPresenterItemHeight: 'TimePicker flyout item height',
	TimePickerHostPadding: 'TimePicker closed field padding'
};

/**
 * Keys SplitView reads from its template: its lengths, border, corner, inline motion, and
 * framework brushes. `SplitViewLightDismissOverlayBackground` is absent because desktop Auto
 * light dismiss remains transparent, and `SplitViewRightBorderThemeThickness` is defined but not
 * applied by the template, whose style always uses the left thickness.
 *
 * `SplitViewPaneAnimationOpenPreDuration` was absent for the same kind of reason and is here now,
 * which is worth a sentence because the reason was right when it was written. It times
 * `ContentTransform`, the translation that keeps `ContentRoot` smooth while `ColumnDefinition1`
 * jumps, and `SplitView.svelte` transcribes the column as a grid track it can transition
 * directly — so nothing read the key. `NavigationView.svelte` reserves that column as a negative
 * margin instead, and transitioning *that* is the content translation, at the duration the
 * template gives it. A key with no role acquires one when a second component transcribes the
 * same template differently.
 */
export const SPLITVIEW_KEYS = {
	SplitViewOpenPaneThemeLength: 'SplitView pane, open',
	SplitViewCompactPaneThemeLength: 'SplitView pane, the compact strip',
	SplitViewLeftBorderThemeThickness: 'SplitView pane border, whichever side the pane is on',
	SplitViewPaneRootCornerRadius: 'SplitView pane corner',
	SplitViewPaneAnimationOpenDuration: 'SplitView pane, opening inline',
	SplitViewPaneAnimationCloseDuration: 'SplitView pane, closing inline',
	SplitViewPaneAnimationOpenPreDuration:
		'SplitView content translation while the pane column jumps',
	SystemControlPageBackgroundChromeLowBrush:
		'SplitView pane background, the style default (framework dictionary)',
	SystemControlForegroundTransparentBrush:
		'SplitView pane border and high-contrast edge (framework dictionary)'
};

/**
 * Keys ToggleSwitch reads — the seventh seed set.
 *
 * The track is two stacked 40x20 rectangles, `OuterBorder` for off and `SwitchKnobBounds`
 * for on, and the knob is two more, `SwitchKnobOff` and `SwitchKnobOn`. Each pair is one
 * element per toggle state rather than one element repainted, for the same reason
 * RadioButton's ring is two: `ToggleStates` and `CommonStates` are orthogonal groups and
 * cannot both drive one property. Which is why every brush below is named `…Off` or `…On`
 * and then by pointer state, rather than the other way round.
 *
 * `ToggleSwitchOnStrokeThickness` is the one themed `x:Double` in the set: 0 in Light and
 * Dark and 1 under HighContrast, because the on track is a solid accent fill that needs no
 * edge until the palette is two colours.
 *
 * What this leaves out is only the twenty-three pre-Fluent `ToggleSwitch*ThemeBrush`
 * resources — the `Curtain`, `Thumb`, `Track` and `OuterBorder` families, which are the
 * pre-Fluent names for the same four parts. The current template references none of them.
 * Same family and same reason as Button's ten, TextBox's seventeen, CheckBox's fourteen and
 * RadioButton's fifteen.
 *
 * The header is in scope here where it was not for TextBox, and the difference is where the
 * resource lives rather than a change of mind: `ToggleSwitchHeaderForeground` and
 * `…Disabled` are defined in this dictionary, while `TextControlHeaderForeground` is in the
 * XAML framework dictionary inside Windows and has no value to read in the pin.
 */
export const TOGGLESWITCH_KEYS = {
	// The track's two stroke widths, the header's margin, the two content gutters, and the
	// width the whole control reserves.
	ToggleSwitchOnStrokeThickness: 'ToggleSwitch on track, its stroke width',
	ToggleSwitchOuterBorderStrokeThickness: 'ToggleSwitch off track, its stroke width',
	ToggleSwitchTopHeaderMargin: 'ToggleSwitch header, the gap below it',
	ToggleSwitchPreContentMargin: 'ToggleSwitch, the gutter above the track row',
	ToggleSwitchPostContentMargin: 'ToggleSwitch, the gutter below the track row',
	ToggleSwitchThemeMinWidth: 'ToggleSwitch, the width the control reserves',

	// The header and the on/off content.
	ToggleSwitchHeaderForeground: 'ToggleSwitch header text',
	ToggleSwitchHeaderForegroundDisabled: 'ToggleSwitch header text, disabled',
	ToggleSwitchContentForeground: 'ToggleSwitch on/off content text',
	ToggleSwitchContentForegroundDisabled: 'ToggleSwitch on/off content text, disabled',

	// The on knob's `BorderBrush`, bound with no `BorderThickness`, so upstream paints nothing
	// with it; carried because the dictionary declares it.
	ToggleSwitchKnobStrokeOn: 'ToggleSwitch knob stroke, on',

	ToggleSwitchContainerBackground: 'ToggleSwitch container background, at rest',
	ToggleSwitchContainerBackgroundPointerOver: 'ToggleSwitch container background, pointer over',
	ToggleSwitchContainerBackgroundPressed: 'ToggleSwitch container background, pressed',
	ToggleSwitchContainerBackgroundDisabled: 'ToggleSwitch container background, disabled',

	ToggleSwitchFillOff: 'ToggleSwitch track fill, off, at rest',
	ToggleSwitchFillOffPointerOver: 'ToggleSwitch track fill, off, pointer over',
	ToggleSwitchFillOffPressed: 'ToggleSwitch track fill, off, pressed',
	ToggleSwitchFillOffDisabled: 'ToggleSwitch track fill, off, disabled',

	ToggleSwitchStrokeOff: 'ToggleSwitch track stroke, off, at rest',
	ToggleSwitchStrokeOffPointerOver: 'ToggleSwitch track stroke, off, pointer over',
	ToggleSwitchStrokeOffPressed: 'ToggleSwitch track stroke, off, pressed',
	ToggleSwitchStrokeOffDisabled: 'ToggleSwitch track stroke, off, disabled',

	ToggleSwitchFillOn: 'ToggleSwitch track fill, on, at rest',
	ToggleSwitchFillOnPointerOver: 'ToggleSwitch track fill, on, pointer over',
	ToggleSwitchFillOnPressed: 'ToggleSwitch track fill, on, pressed',
	ToggleSwitchFillOnDisabled: 'ToggleSwitch track fill, on, disabled',

	ToggleSwitchStrokeOn: 'ToggleSwitch track stroke, on, at rest',
	ToggleSwitchStrokeOnPointerOver: 'ToggleSwitch track stroke, on, pointer over',
	ToggleSwitchStrokeOnPressed: 'ToggleSwitch track stroke, on, pressed',
	ToggleSwitchStrokeOnDisabled: 'ToggleSwitch track stroke, on, disabled',

	ToggleSwitchKnobFillOff: 'ToggleSwitch knob fill, off, at rest',
	ToggleSwitchKnobFillOffPointerOver: 'ToggleSwitch knob fill, off, pointer over',
	ToggleSwitchKnobFillOffPressed: 'ToggleSwitch knob fill, off, pressed',
	ToggleSwitchKnobFillOffDisabled: 'ToggleSwitch knob fill, off, disabled',

	ToggleSwitchKnobFillOn: 'ToggleSwitch knob fill, on, at rest',
	ToggleSwitchKnobFillOnPointerOver: 'ToggleSwitch knob fill, on, pointer over',
	ToggleSwitchKnobFillOnPressed: 'ToggleSwitch knob fill, on, pressed',
	ToggleSwitchKnobFillOnDisabled: 'ToggleSwitch knob fill, on, disabled',

	// Seeded only so the EXCLUDED list below can name them — the generator stops if an
	// EXCLUDED key is not selected.
	ToggleSwitchCurtainBackgroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchCurtainDisabledBackgroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchCurtainPointerOverBackgroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchCurtainPressedBackgroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchDisabledForegroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchForegroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchHeaderDisabledForegroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchHeaderForegroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchOuterBorderBorderThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchOuterBorderDisabledBorderThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchThumbBackgroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchThumbBorderThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchThumbDisabledBackgroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchThumbDisabledBorderThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchThumbPointerOverBackgroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchThumbPointerOverBorderThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchThumbPressedBackgroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchThumbPressedForegroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchTrackBackgroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchTrackBorderThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchTrackDisabledBackgroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchTrackPointerOverBackgroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED',
	ToggleSwitchTrackPressedBackgroundThemeBrush:
		'Pre-Fluent ToggleSwitch *ThemeBrush family, listed for EXCLUDED'
};

/**
 * Keys Slider reads — the eighth seed set.
 *
 * The `DefaultSliderStyle` at Slider_themeresources.xaml:176 has horizontal and vertical
 * templates. Both paint a header row and a `SliderContainer` holding a track, decrease
 * rectangle, TickBars, and thumb. `SliderContainerBackground` and its three pointer siblings
 * all alias `ControlFillColorTransparentBrush`/`ControlFillColorTransparent` at every theme,
 * which means they resolve to transparent at this pin and the four are read anyway so a re-pin
 * that gives them a value is not silently ignored.
 *
 * Both header margins are emitted. `Slider.svelte` reads `SliderTopHeaderMargin` from
 * `DefaultSliderStyle`, while `ColorPickerSlider.svelte` reads `SliderHeaderThemeMargin`
 * from the presenter in its complete replacement template.
 *
 * What this list leaves out, so a gap reads as a decision rather than an oversight.
 * The Slider dictionary carries sixty-one resources; these are the ones not here:
 *
 * - **The border** — `SliderBorderThemeThickness`. The `DefaultSliderStyle` sets it to
 *   `0` and the template never paints it.
 * - **The twenty-two pre-Fluent `Slider*ThemeBrush` resources.** They are the `Border`,
 *   `DisabledBorder`, `HeaderForeground`, `Thumb*`, `TickMark*` and `Track*` families.
 *   The current template references none of them and their `Default` values are literal
 *   colours from a palette this library does not use. Same family and same reason as
 *   Button's ten, TextBox's seventeen, CheckBox's fourteen, RadioButton's fifteen and
 *   ToggleSwitch's twenty-three.
 */
export const SLIDER_KEYS = {
	// The horizontal and vertical track metrics, plus the thumb box, painted circles, and corner.
	SliderHorizontalHeight: 'Slider, the horizontal track row',
	SliderVerticalWidth: 'Slider, the vertical track column',
	SliderTrackThemeHeight: 'Slider track, at rest',
	SliderTrackCornerRadius: 'Slider track, its corner radius',
	SliderHorizontalThumbWidth: 'Slider thumb, its box',
	SliderHorizontalThumbHeight: 'Slider thumb, its box',
	SliderVerticalThumbWidth: 'Slider thumb, its box when vertical',
	SliderVerticalThumbHeight: 'Slider thumb, its box when vertical',
	SliderThumbCornerRadius: 'Slider thumb, its corner radius',
	SliderInnerThumbWidth: 'Slider thumb, the accent circle',
	SliderInnerThumbHeight: 'Slider thumb, the accent circle',
	SliderTopHeaderMargin: 'Slider header, the gap below it',
	SliderHeaderThemeMargin: 'Slider header, the margin the ColorPickerSlider template applies',
	SliderHeaderThemeFontWeight: 'Slider header, its weight',
	SliderTickBarFill: 'Slider tick marks outside the track',
	SliderTickBarFillDisabled: 'Slider tick marks outside the track, disabled',
	SliderInlineTickBarFill: 'Slider tick marks inside the track',
	SliderOutsideTickBarThemeHeight: 'Slider tick marks outside the track, their thickness',

	// The container background in all four states — all four alias a transparent brush
	// at this pin, but they are read so a re-pin that gives them a value is not silently
	// ignored.
	//
	// Two keys here are deliberately not seeded, both because of upstream source bugs
	// that the generator correctly rejects:
	//
	// - `SliderContainerBackgroundDisabled` is defined twice in `Default` —
	//   Slider_themeresources.xaml:12 aliases `ControlFillColorTransparentBrush` and
	//   :13 aliases `ControlFillColorTransparent`. The generator's `select()` rejects
	//   duplicate definitions of one key in one theme, which is the rule that stops
	//   the run from being built on a precedence decision the source itself does not
	//   make.
	// - `SliderContainerBackground` is defined in `HighContrast` and `Light` only; the
	//   `Default` dictionary never defines it. The generator's `select()` requires a
	//   key to be defined in all three themes, in `Default` and `Light` only as an alias
	//   that resolves under high contrast, or theme-independent, and `HighContrast`+
	//   `Light` is none of those.
	//
	// Both records resolve to transparent so the rendered colour is right either way;
	// the variables just do not exist in tokens.css.
	SliderContainerBackgroundPointerOver: 'Slider container background, pointer over',
	SliderContainerBackgroundPressed: 'Slider container background, pressed',

	// The track's fill in all four states. Pointer over and pressed alias the same brush
	// as rest, but are listed separately so the four paints track the source one-for-one.
	SliderTrackFill: 'Slider track fill, at rest',
	SliderTrackFillPointerOver: 'Slider track fill, pointer over',
	SliderTrackFillPressed: 'Slider track fill, pressed',
	SliderTrackFillDisabled: 'Slider track fill, disabled',

	// The decrease-rect's fill — the accent portion from the track start to the value.
	SliderTrackValueFill: 'Slider value fill, at rest',
	SliderTrackValueFillPointerOver: 'Slider value fill, pointer over',
	SliderTrackValueFillPressed: 'Slider value fill, pressed',
	SliderTrackValueFillDisabled: 'Slider value fill, disabled',

	// The thumb's accent fill in all four states. The `Disabled` brush keeps the accent
	// family but switches to `AccentFillColorDisabledBrush` so the thumb fades with the
	// palette rather than going neutral.
	SliderThumbBackground: 'Slider thumb accent fill, at rest',
	SliderThumbBackgroundPointerOver: 'Slider thumb accent fill, pointer over',
	SliderThumbBackgroundPressed: 'Slider thumb accent fill, pressed',
	SliderThumbBackgroundDisabled: 'Slider thumb accent fill, disabled',

	// The outer ring the accent circle sits on and the gradient that strokes it.
	SliderOuterThumbBackground: 'Slider thumb, the ring around the accent',
	SliderThumbBorderBrush: 'Slider thumb, the stroke around the ring',

	// The header text in both states.
	SliderHeaderForeground: 'Slider header text, at rest',
	SliderHeaderForegroundDisabled: 'Slider header text, disabled',

	// Seeded only so the EXCLUDED list below can name them — the generator stops if an
	// EXCLUDED key is not selected.
	SliderBorderThemeBrush: 'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderDisabledBorderThemeBrush: 'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderHeaderForegroundThemeBrush: 'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderThumbBackgroundThemeBrush: 'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderThumbBorderThemeBrush: 'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderThumbDisabledBackgroundThemeBrush:
		'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderThumbPointerOverBackgroundThemeBrush:
		'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderThumbPointerOverBorderThemeBrush:
		'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderThumbPressedBackgroundThemeBrush:
		'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderThumbPressedBorderThemeBrush: 'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderTickMarkInlineBackgroundThemeBrush:
		'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderTickMarkInlineDisabledForegroundThemeBrush:
		'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderTickmarkOutsideBackgroundThemeBrush:
		'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderTickMarkOutsideDisabledForegroundThemeBrush:
		'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderTrackBackgroundThemeBrush: 'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderTrackDecreaseBackgroundThemeBrush:
		'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderTrackDecreaseDisabledBackgroundThemeBrush:
		'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderTrackDecreasePointerOverBackgroundThemeBrush:
		'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderTrackDecreasePressedBackgroundThemeBrush:
		'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderTrackDisabledBackgroundThemeBrush:
		'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderTrackPointerOverBackgroundThemeBrush:
		'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED',
	SliderTrackPressedBackgroundThemeBrush:
		'Pre-Fluent Slider *ThemeBrush family, listed for EXCLUDED'
};

/**
 * Keys ComboBox reads — the ninth seed set.
 *
 * The non-editable template is the `DefaultComboBoxStyle` at
 * ComboBox_themeresources.xaml:359, which paints a three-row, two-column grid: a
 * `HeaderContentPresenter` row, a `Background` row carrying the closed state, and a
 * `DescriptionPresenter` row. The closed state's `BorderBrush` and `Background` are
 * wired through `TemplateBinding`, so the four `ComboBoxBackground*` and four
 * `ComboBoxBorderBrush*` brushes paint the box itself. The `DropDownGlyph` is an
 * `AnimatedIcon` whose `FallbackIconSource` at :585 is a `FontIconSource` with
 * `Glyph="&#xE70D;"`, and WD-006 accepts the static fallback. The `Pill` selector
 * indicator is a 3x16 `Rectangle` filled with `ComboBoxItemPillFillBrush` and scaled
 * by `ComboBoxItemPillMinScale` in the `SelectedPressed` state — the five
 * `Selected*` states are the only ones that set the pill's opacity to 1.
 *
 * What this list leaves out, so a gap reads as a decision rather than an oversight.
 * The ComboBox dictionary carries many more resources; these are the ones not here:
 *
 * - **Editable keys are seeded.** `ComboBoxFocusedDropDownBackgroundPointerOver` alone
 *   is omitted: the focused-hover setter reads `ComboBoxDropDownBackgroundPointerOver`
 *   instead (ComboBox_themeresources.xaml:537-538).
 * - **The touch and game-controller padding variants** — `ComboBoxItemThemeTouchPadding` and
 *   `ComboBoxItemThemeGameControllerPadding`. The two non-mouse input modes are not built.
 * - **`ComboBoxArrowThemeFontSize`** — the chevron's animated source font size; irrelevant
 *   under WD-006, which renders the fallback glyph instead.
 * - **`ComboBoxPopupBorderThemeThickness`** — the popup's own border, which this
 *   reproduction paints from `ComboBoxDropdownBorderThickness` instead.
 *
 * `ComboBoxHiglightBorderCornerRadius` and `ComboBoxBackgroundBorderThicknessFocused` were
 * in that bullet beside it, on the grounds that the control never painted
 * `HighlightBackground`. It paints one now, so both are seeded below and read by
 * `ComboBox.svelte`'s focus rule — the same move `CheckBoxFocusVisualMargin` made above, and
 * for the same reason.
 * - **`ComboBoxPopupThemeTouchMinWidth`** — the popup's minimum width in touch input mode.
 * - **The thirty-five pre-Fluent `ComboBox*ThemeBrush` resources.** They are the
 *   `ComboBoxArrow*ThemeBrush`, `ComboBoxBackgroundThemeBrush`, `ComboBoxBorderThemeBrush`,
 *   `ComboBoxDisabled*ThemeBrush`, `ComboBoxFocused*ThemeBrush`, `ComboBoxForegroundThemeBrush`,
 *   `ComboBoxHeaderForegroundThemeBrush`, `ComboBoxItem*ThemeBrush`, `ComboBoxPlaceholderTextForegroundThemeBrush`,
 *   `ComboBoxPointerOver*ThemeBrush`, `ComboBoxPopup*ThemeBrush`, `ComboBoxPressed*ThemeBrush`,
 *   `ComboBoxSelected*ThemeBrush` families. The current template references none of them
 *   and their `Default` values are literal colours from a palette this library does not use.
 *   Same family and same reason as Button's ten, TextBox's seventeen, CheckBox's fourteen,
 *   RadioButton's fifteen, ToggleSwitch's twenty-three and Slider's twenty-two.
 */
export const COMBOBOX_KEYS = {
	// The editable variant — the `EditableText` padding, the `EditableModeStates` brushes
	// the overlay and the chevron take, and the overlay's corner.
	ComboBoxEditableTextPadding: 'ComboBox editable text, its padding',
	ComboBoxEditableDropDownGlyphForeground: 'ComboBox editable chevron, input focused',
	ComboBoxDropDownBackgroundPointerOver: 'ComboBox overlay background, pointer over',
	ComboBoxDropDownBackgroundPointerPressed: 'ComboBox overlay background, pressed',
	ComboBoxFocusedDropDownBackgroundPointerPressed:
		'ComboBox overlay background, input focused and pressed',
	ComboBoxDropDownButtonBackgroundCornerRadius: 'ComboBox overlay, its corner radius',

	// The box and its header — the three layout keys the trigger and header reach, the two
	// font-weight resources, and the four metrics that size the box, the popup and the
	// selection pill.
	ComboBoxMinHeight: 'ComboBox, the box minimum height',
	ComboBoxThemeMinWidth: 'ComboBox, the box minimum width',
	ComboBoxPadding: 'ComboBox, the padding inside its border',
	ComboBoxTopHeaderMargin: 'ComboBox header, the gap below it',
	ComboBoxHeaderThemeFontWeight: 'ComboBox header, its weight',
	ComboBoxPlaceholderTextThemeFontWeight: 'ComboBox placeholder, its weight',
	ComboBoxBorderThemeThickness: 'ComboBox, the border width',

	// The four `Background` brushes — rest, hover, pressed and disabled — that the
	// `Background` Border's `TemplateBinding Background` resolves through the four
	// `PointerOver`/`Pressed`/`Disabled` states.
	ComboBoxBackground: 'ComboBox background, at rest',
	ComboBoxBackgroundPointerOver: 'ComboBox background, pointer over',
	ComboBoxBackgroundPressed: 'ComboBox background, pressed',
	ComboBoxBackgroundDisabled: 'ComboBox background, disabled',

	// The four `BorderBrush` brushes. `ComboBoxBorderBrush` and `…PointerOver` both alias
	// `ControlElevationBorderBrush`, a gradient in the token layer — the same shape
	// TextBox's border and Slider's thumb ring carry, and the same reason a CSS
	// `border-color` cannot hold it (see those components for the technique).
	ComboBoxBorderBrush: 'ComboBox border, at rest',
	ComboBoxBorderBrushPointerOver: 'ComboBox border, pointer over',
	ComboBoxBorderBrushPressed: 'ComboBox border, pressed',
	ComboBoxBorderBrushDisabled: 'ComboBox border, disabled',

	// The focused highlight — the `HighlightBackground` Border at
	// ComboBox_themeresources.xaml:570, which the `Focused` state takes from `Opacity="0"`
	// to 1 at :475. It sits at `Margin="-4"` and is declared before the `Background` Border
	// that covers it, so what shows is the four pixels outside the box: two of fill and two
	// of stroke. This, and not a system focus band, is the ComboBox's focus visual —
	// `UseSystemFocusVisuals` at :380 reads `IsApplicationFocusVisualKindReveal`, which is
	// `False` in all three of generic.xaml's dictionaries (:331, :2956, :5940), while
	// `DefaultComboBoxItemStyle` sets the same property to a literal `True` at :608 for the
	// popup item. High contrast keeps the highlight and drops its outline: the stroke is
	// `SystemControlHighlightTransparentBrush` (:143) and the fill resolves through
	// `ComboBoxBackgroundUnfocused` (:142) to `SystemControlHighlightListAccentLowBrush`, so
	// what a focused box grows there is four pixels of accent and no edge. That alias is why
	// `ComboBoxBackgroundUnfocused` is emitted without being named here — the generator
	// closes over it. `Higlight` is upstream's spelling, at :343.
	ComboBoxBackgroundFocused: 'ComboBox focus highlight, its fill',
	ComboBoxBackgroundBorderBrushFocused: 'ComboBox focus highlight, its stroke',
	ComboBoxBackgroundBorderThicknessFocused: 'ComboBox focus highlight, the stroke width',
	ComboBoxHiglightBorderCornerRadius: 'ComboBox focus highlight, its corner radius',

	// The five `Foreground` brushes — the `ContentPresenter`'s colour, holding the
	// selected item's text.
	ComboBoxForeground: 'ComboBox foreground, at rest',
	ComboBoxForegroundPointerOver: 'ComboBox foreground, pointer over',
	ComboBoxForegroundPressed: 'ComboBox foreground, pressed',
	ComboBoxForegroundDisabled: 'ComboBox foreground, disabled',
	ComboBoxForegroundFocusedPressed: 'ComboBox foreground, focused and pressed',

	// The header in both states, and the placeholder at rest, pressed and disabled (the focus
	// state is its own column). `ComboBoxPlaceHolderForegroundFocusedPressed` is the placeholder
	// colour the `FocusedPressed` state drives, over `Pressed`'s.
	ComboBoxHeaderForeground: 'ComboBox header text, at rest',
	ComboBoxHeaderForegroundDisabled: 'ComboBox header text, disabled',
	ComboBoxPlaceHolderForeground: 'ComboBox placeholder text, at rest',
	ComboBoxPlaceHolderForegroundPressed: 'ComboBox placeholder text, pressed',
	ComboBoxPlaceHolderForegroundDisabled: 'ComboBox placeholder text, disabled',
	ComboBoxPlaceHolderForegroundFocusedPressed: 'ComboBox placeholder text, focused and pressed',

	// The chevron at rest, disabled, and in the two focus states that name a brush of their
	// own: `Focused`'s is a different key from rest's in high contrast only, and resolves to
	// the same colour there; `FocusedPressed`'s is a different key in every theme, and a
	// different colour outside high contrast.
	ComboBoxDropDownGlyphForeground: 'ComboBox chevron, at rest',
	ComboBoxDropDownGlyphForegroundDisabled: 'ComboBox chevron, disabled',
	ComboBoxDropDownGlyphForegroundFocused: 'ComboBox chevron, keyboard focused',
	ComboBoxDropDownGlyphForegroundFocusedPressed: 'ComboBox chevron, focused and pressed',

	// The popup and its list: the popup's `Background`, `BorderBrush`, four layout keys, the
	// list's `Foreground`, and the two layout keys the list's `ScrollViewer` and items reach.
	ComboBoxDropDownBackground: 'ComboBox popup, the background inside its border',
	ComboBoxDropDownBorderBrush: 'ComboBox popup, its border',
	ComboBoxDropdownBorderThickness: 'ComboBox popup, its border width',
	ComboBoxDropdownBorderPadding: 'ComboBox popup, the padding inside its border',
	ComboBoxDropdownContentMargin: 'ComboBox popup, the gap between its border and its list',
	ComboBoxPopupThemeMinWidth: 'ComboBox popup, the floor its width never goes below',
	ComboBoxDropDownForeground: 'ComboBox popup, the list text colour',

	// The item: its corner radius, its padding, and its eight brushes across the four
	// `CommonStates` (Normal, PointerOver, Pressed, Disabled) the modern item template
	// reaches.
	ComboBoxItemCornerRadius: 'ComboBox item, its corner radius',
	ComboBoxItemThemePadding: 'ComboBox item, the padding around its text',
	ComboBoxItemBackground: 'ComboBox item background, at rest',
	ComboBoxItemBackgroundPointerOver: 'ComboBox item background, pointer over',
	ComboBoxItemBackgroundPressed: 'ComboBox item background, pressed',
	ComboBoxItemBackgroundDisabled: 'ComboBox item background, disabled',
	ComboBoxItemForeground: 'ComboBox item text, at rest',
	ComboBoxItemForegroundPointerOver: 'ComboBox item text, pointer over',
	ComboBoxItemForegroundPressed: 'ComboBox item text, pressed',
	ComboBoxItemForegroundDisabled: 'ComboBox item text, disabled',

	// The item's `Selected*` variants — the four `Selected*` states override the fill, the
	// foreground, and the pill's opacity. The four missing siblings
	// (`ComboBoxItem*SelectedUnfocused`) sit between `Selected` and `SelectedPointerOver`
	// in the upstream `CommonStates` and are reachable only via a tab navigation that takes
	// focus off the popup without a pointer over it — out of scope for this unit.
	ComboBoxItemBackgroundSelected: 'ComboBox item background, selected',
	ComboBoxItemBackgroundSelectedPointerOver: 'ComboBox item background, selected pointer over',
	ComboBoxItemBackgroundSelectedPressed: 'ComboBox item background, selected pressed',
	ComboBoxItemBackgroundSelectedDisabled: 'ComboBox item background, selected disabled',
	ComboBoxItemForegroundSelected: 'ComboBox item text, selected',
	ComboBoxItemForegroundSelectedPointerOver:
		'ComboBox item, the selected foreground with the pointer over it',
	ComboBoxItemForegroundSelectedPressed: 'ComboBox item, the selected foreground while pressed',
	ComboBoxItemForegroundSelectedDisabled: 'ComboBox item text, selected disabled',

	// The selection pill: its brush, its two sizes, its corner radius, and the scale the
	// `SelectedPressed` state animates to and the duration it animates over.
	ComboBoxItemPillFillBrush: 'ComboBox item, the selection pill fill',
	ComboBoxItemPillWidth: 'ComboBox item, the selection pill width',
	ComboBoxItemPillHeight: 'ComboBox item, the selection pill height',
	ComboBoxItemPillCornerRadius: 'ComboBox item, the selection pill corner radius',
	ComboBoxItemPillMinScale: 'ComboBox item, the selection pill pressed scale',
	ComboBoxItemScaleAnimationDuration:
		'ComboBox item, how long the pressed pill takes to shrink (and SelectorBar, the selected pill to grow)',

	// Seeded only so the EXCLUDED list below can name them — the generator stops if an
	// EXCLUDED key is not selected. The thirty-five pre-Fluent `*ThemeBrush` resources;
	// the reason is the same as Button's ten, TextBox's seventeen, CheckBox's fourteen,
	// RadioButton's fifteen, ToggleSwitch's twenty-three and Slider's twenty-two.
	ComboBoxArrowDisabledForegroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxArrowForegroundThemeBrush: 'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxArrowPressedForegroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxBackgroundThemeBrush: 'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxBorderThemeBrush: 'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxDisabledBackgroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxDisabledBorderThemeBrush: 'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxDisabledForegroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxFocusedBackgroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxFocusedBorderThemeBrush: 'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxFocusedForegroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxForegroundThemeBrush: 'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxHeaderForegroundThemeBrush: 'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxItemDisabledForegroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxItemPointerOverBackgroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxItemPointerOverForegroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxItemPressedBackgroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxItemPressedForegroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxItemSelectedBackgroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxItemSelectedDisabledBackgroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxItemSelectedDisabledForegroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxItemSelectedForegroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxItemSelectedPointerOverBackgroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxPlaceholderTextForegroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxPointerOverBackgroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxPointerOverBorderThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxPopupBackgroundThemeBrush: 'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxPopupBorderThemeBrush: 'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxPopupForegroundThemeBrush: 'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxPressedBackgroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxPressedBorderThemeBrush: 'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxPressedForegroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxPressedHighlightThemeBrush: 'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxSelectedBackgroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED',
	ComboBoxSelectedPointerOverBackgroundThemeBrush:
		'Pre-Fluent ComboBox *ThemeBrush family, listed for EXCLUDED'
};

export const SHELL_KEYS = {
	// NavigationView — the pane, the content area, and the metrics that size them.
	NavigationViewDefaultPaneBackground: 'NavigationView pane, the surface behind the items',
	NavigationViewExpandedPaneBackground:
		'NavigationView pane, the surface when the pane sits beside the content rather than over it',
	NavigationViewContentBackground: 'NavigationView content area',
	NavigationViewContentGridBorderBrush: 'NavigationView content area, its own border',
	NavigationViewContentGridBorderThickness: 'NavigationView content area, its own border',
	NavigationViewContentGridCornerRadius: 'NavigationView content area, its own border',
	NavigationViewBorderThickness: 'NavigationView, the border between pane and content',
	NavigationViewContentMargin: 'NavigationView content area, its two nested insets',
	NavigationViewMinimalContentMargin: 'NavigationView content area, minimal display mode',
	NavigationViewMinimalContentGridBorderThickness:
		'NavigationView content area, its border in minimal display mode',
	NavigationViewMinimalContentGridCornerRadius:
		'NavigationView content area, its corners in minimal display mode',
	NavigationViewMinimalHeaderMargin: 'NavigationView content area, the page header when minimal',
	NavigationViewContentPresenterMargin: 'NavigationView content area, its two nested insets',
	NavigationViewPaneContentGridMargin: 'NavigationView pane, its inset',
	NavigationViewCompactPaneLength: 'NavigationView pane, its width when collapsed',
	NavigationViewIconBoxWidth: 'NavigationView item, the icon column',
	NavigationViewButtonHolderGridMargin: 'NavigationView, the row holding the pane-toggle button',
	NavigationViewPaneHeaderRowMinHeight:
		'NavigationView pane, the row that keeps the pane-toggle button its space',
	// Neither of these is the toggle button's box, which is 48 by 40 and written by the control:
	// `UpdatePaneButtonsWidths` takes the width from `CompactPaneLength`
	// (`NavigationView.cpp:1811`) and the height falls out of the paint plus the 2s of
	// `NavigationViewItemButtonMargin`. The height key sizes the box the button paints inside
	// that, and floors the pane row that keeps it space — by a second route, `:4662` reading the
	// application resource through `GetPaneToggleButtonHeight` (`:4090`) rather than through the
	// style's `MinHeight`. The width key is not the
	// button's at all: `GetPaneToggleButtonWidth` (`:4085`) spends it as the pane header's left
	// inset (`:4663`) and as the pane title's margin (`:4764`), while the button's own `MinWidth`
	// is a different 40 that `NavigationView.xaml:197` binds over this style's setter.
	PaneToggleButtonHeight:
		'NavigationView pane-toggle button, the box it paints and the pane row it floors',
	PaneToggleButtonWidth: 'NavigationView pane, the inset that clears the pane-toggle button',
	NavigationViewAutoSuggestAreaHeight: 'NavigationView pane, the search row',
	NavigationViewAutoSuggestBoxMargin: 'NavigationView pane, the search row',
	NavigationViewHeaderMargin: 'NavigationView content area, the page header',

	// A NavigationView item: the three brushes it paints with, in each of the eight
	// states the left-pane template names.
	NavigationViewItemBackground: 'NavigationView item background, at rest',
	NavigationViewItemBackgroundPointerOver: 'NavigationView item background, pointer over',
	NavigationViewItemBackgroundPressed: 'NavigationView item background, pressed',
	NavigationViewItemBackgroundDisabled: 'NavigationView item background, disabled',
	NavigationViewItemBackgroundSelected: 'NavigationView item background, selected',
	NavigationViewItemBackgroundSelectedPointerOver:
		'NavigationView item background, selected pointer over',
	NavigationViewItemBackgroundSelectedPressed: 'NavigationView item background, selected pressed',
	NavigationViewItemBackgroundSelectedDisabled: 'NavigationView item background, selected disabled',
	NavigationViewItemForeground: 'NavigationView item foreground, at rest',
	NavigationViewItemForegroundPointerOver: 'NavigationView item foreground, pointer over',
	NavigationViewItemForegroundPressed: 'NavigationView item foreground, pressed',
	NavigationViewItemForegroundDisabled: 'NavigationView item foreground, disabled',
	NavigationViewItemForegroundSelected: 'NavigationView item foreground, selected',
	NavigationViewItemForegroundSelectedPointerOver:
		'NavigationView item foreground, selected pointer over',
	NavigationViewItemForegroundSelectedPressed: 'NavigationView item foreground, selected pressed',
	NavigationViewItemForegroundSelectedDisabled: 'NavigationView item foreground, selected disabled',
	NavigationViewItemBorderBrush: 'NavigationView item border, at rest',
	NavigationViewItemBorderBrushPointerOver: 'NavigationView item border, pointer over',
	NavigationViewItemBorderBrushPressed: 'NavigationView item border, pressed',
	NavigationViewItemBorderBrushDisabled: 'NavigationView item border, disabled',
	NavigationViewItemBorderBrushSelected: 'NavigationView item border, selected',
	NavigationViewItemBorderBrushSelectedPointerOver:
		'NavigationView item border, selected pointer over',
	NavigationViewItemBorderBrushSelectedPressed: 'NavigationView item border, selected pressed',
	NavigationViewItemBorderBrushSelectedDisabled: 'NavigationView item border, selected disabled',

	// The rest of an item: the icon box, the selection indicator, the separator, the
	// group header, and the chevron on an item that expands.
	NavigationViewItemIconBackground: 'NavigationView item, behind the icon',
	NavigationViewItemMargin: 'NavigationView item, its two nested insets',
	NavigationViewItemButtonMargin: 'NavigationView item, its two nested insets',
	NavigationViewItemOnLeftMinHeight: 'NavigationView item, its height in the left pane',
	NavigationViewItemOnLeftIconBoxHeight: 'NavigationView item, the icon box',
	NavigationViewItemOnLeftIconBoxMargin: 'NavigationView item, the icon box',
	NavigationViewItemContentPresenterMargin: 'NavigationView item, around its label',
	NavigationViewItemChildrenMenuFlyoutPadding:
		'NavigationView item, inside the rail flyout that holds its children',
	NavigationViewItemBorderThickness: 'NavigationView item, its border width',
	NavigationViewSelectionIndicatorForeground: 'NavigationView item, the selection indicator',
	NavigationViewSelectionIndicatorWidth: 'NavigationView item, the selection indicator',
	NavigationViewSelectionIndicatorHeight: 'NavigationView item, the selection indicator',
	NavigationViewSelectionIndicatorRadius: 'NavigationView item, the selection indicator',
	NavigationViewItemSeparatorForeground: 'NavigationView, the separator between item groups',
	NavigationViewItemSeparatorHeight: 'NavigationView, the separator between item groups',
	NavigationViewItemSeparatorMargin: 'NavigationView, the separator between item groups',
	NavigationViewCompactItemSeparatorMargin:
		'NavigationView, the separator between item groups when the pane is compact',
	NavigationViewItemHeaderForeground: 'NavigationView, a group header in the pane',
	NavigationViewItemInnerHeaderMargin: 'NavigationView, the inset inside a group header',
	NavigationViewItemExpandChevronMargin: 'NavigationView item, the expand chevron',
	NavigationViewItemExpandedGlyph: 'NavigationView item, the expand chevron',
	NavigationViewItemExpandedGlyphFontSize: 'NavigationView item, the expand chevron',

	// The top display mode.
	NavigationViewTopPaneBackground: 'NavigationView top pane background',
	TopNavigationViewItemForeground: 'top NavigationView item foreground',
	TopNavigationViewItemForegroundPointerOver: 'top NavigationView item foreground, pointer over',
	TopNavigationViewItemForegroundPressed: 'top NavigationView item foreground, pressed',
	TopNavigationViewItemForegroundDisabled: 'top NavigationView item foreground, disabled',
	TopNavigationViewItemForegroundSelected: 'top NavigationView item foreground, selected',
	TopNavigationViewItemForegroundSelectedPointerOver:
		'top NavigationView item foreground, selected pointer over',
	TopNavigationViewItemForegroundSelectedPressed:
		'top NavigationView item foreground, selected pressed',
	TopNavigationViewItemBackgroundPointerOver: 'top NavigationView item background, pointer over',
	TopNavigationViewItemBackgroundPressed: 'top NavigationView item background, pressed',
	TopNavigationViewItemBackgroundSelected: 'top NavigationView item background, selected',
	TopNavigationViewItemBackgroundSelectedPointerOver:
		'top NavigationView item background, selected pointer over',
	TopNavigationViewItemBackgroundSelectedPressed:
		'top NavigationView item background, selected pressed',
	TopNavigationViewItemSeparatorForeground: 'top NavigationView pane separator',
	NavigationViewTopPaneHeight: 'NavigationView top pane row',
	TopNavigationViewOverflowButtonWidth: 'top NavigationView overflow button',
	TopNavigationViewOverflowButtonHeight: 'top NavigationView overflow button',
	TopNavigationViewTopNavGridMargin: 'top NavigationView pane inset',
	TopNavigationViewContentGridBorderThickness: 'top NavigationView content border',
	TopNavigationViewContentGridCornerRadius: 'top NavigationView content corners',
	TopNavigationViewContentMargin: 'top NavigationView content inset',
	TopNavigationViewOverflowButtonMargin: 'top NavigationView overflow button inset',
	TopNavigationViewItemContentPresenterMargin: 'top NavigationView item label inset',
	TopNavigationViewItemContentOnlyContentPresenterMargin:
		'top NavigationView item label inset without icon',
	TopNavigationViewItemInnerHeaderMargin: 'top NavigationView header inset',
	TopNavigationViewItemOnOverflowContentPresenterMargin:
		'top NavigationView overflow item label inset',
	TopNavigationViewItemOnOverflowNoIconContentPresenterMargin:
		'top NavigationView overflow item label inset without icon',
	TopNavigationViewOverflowMenuPadding: 'top NavigationView overflow menu inset',

	// The pane-toggle and back buttons, which are Buttons with their own brushes.
	NavigationViewButtonBackgroundPointerOver: 'NavigationView pane button background, pointer over',
	NavigationViewButtonBackgroundPressed: 'NavigationView pane button background, pressed',
	NavigationViewButtonBackgroundDisabled: 'NavigationView pane button background, disabled',
	NavigationViewButtonForegroundPointerOver: 'NavigationView pane button foreground, pointer over',
	NavigationViewButtonForegroundPressed: 'NavigationView pane button foreground, pressed',
	NavigationViewButtonForegroundDisabled: 'NavigationView pane button foreground, disabled',
	NavigationViewBackButtonBackground: 'NavigationView back button',
	NavigationBackButtonWidth: 'NavigationView back button',
	NavigationBackButtonHeight: 'NavigationView back button',

	// TitleBar: the row itself, then its two buttons in each of their four states.
	TitleBarForegroundBrush: 'TitleBar, the title text',
	TitleBarCompactHeight: 'TitleBar, its two heights',
	TitleBarExpandedHeight: 'TitleBar, its two heights',
	TitleBarLeftPaddingWidth: 'TitleBar, the insets the window controls reserve',
	TitleBarMinDragRegionWidth: 'TitleBar, the column kept clear right of the content',
	TitleBarRightPaddingWidth: 'TitleBar, the insets the window controls reserve',
	TitleBarLeftHeaderPaddingWidth: 'TitleBar, the insets the window controls reserve',
	TitleBarCompactContentMargin: 'TitleBar, around its content when compact',
	TitleBarIconMaxWidth: 'TitleBar, the app icon',
	TitleBarIconMaxHeight: 'TitleBar, the app icon',
	TitleBarIconMargin: 'TitleBar, the app icon',
	TitleBarTitleMargin: 'TitleBar, the title text',
	TitleBarTitleMinWidth: 'TitleBar, the title text',
	TitleBarSubtitleForegroundBrush: 'TitleBar, the subtitle text',
	TitleBarSubtitleMargin: 'TitleBar, the subtitle text',
	TitleBarSubtitleMinWidth: 'TitleBar, the subtitle text',
	TitleBarBackButtonWidth: 'TitleBar, its two buttons',
	TitleBarPaneToggleButtonWidth: 'TitleBar, its two buttons',
	TitleBarBackButtonBackground: 'TitleBar back button background, at rest',
	TitleBarBackButtonBackgroundPointerOver: 'TitleBar back button background, pointer over',
	TitleBarBackButtonBackgroundPressed: 'TitleBar back button background, pressed',
	TitleBarBackButtonBackgroundDisabled: 'TitleBar back button background, disabled',
	TitleBarBackButtonForeground: 'TitleBar back button foreground, at rest',
	TitleBarBackButtonForegroundPointerOver: 'TitleBar back button foreground, pointer over',
	TitleBarBackButtonForegroundPressed: 'TitleBar back button foreground, pressed',
	TitleBarBackButtonForegroundDisabled: 'TitleBar back button foreground, disabled',
	TitleBarPaneToggleButtonBackground: 'TitleBar pane-toggle button background, at rest',
	TitleBarPaneToggleButtonBackgroundPointerOver:
		'TitleBar pane-toggle button background, pointer over',
	TitleBarPaneToggleButtonBackgroundPressed: 'TitleBar pane-toggle button background, pressed',
	TitleBarPaneToggleButtonBackgroundDisabled: 'TitleBar pane-toggle button background, disabled',
	TitleBarPaneToggleButtonForeground: 'TitleBar pane-toggle button foreground, at rest',
	TitleBarPaneToggleButtonForegroundPointerOver:
		'TitleBar pane-toggle button foreground, pointer over',
	TitleBarPaneToggleButtonForegroundPressed: 'TitleBar pane-toggle button foreground, pressed',
	TitleBarPaneToggleButtonForegroundDisabled: 'TitleBar pane-toggle button foreground, disabled',

	// The search box in the title bar. The Gallery puts an AutoSuggestBox in
	// `TitleBar.Content`, and an AutoSuggestBox is a TextBox with a query button.
	//
	// Only the box's own metrics are seeded. Its colours are deliberately not, and the
	// reason is a property of the source rather than a preference: the `TextControl*`
	// family is defined in `Default` and `Light` and almost entirely absent from the
	// `HighContrast` dictionary — TextBox_themeresources.xaml defines six of them there and
	// no more — because Windows supplies the rest, the way it supplies the legacy brushes of
	// ADR 0008. A key defined in two themes of three cannot be emitted; the generator says
	// so and is right to.
	//
	// What the Default and Light dictionaries do say is that each of those names is a
	// `StaticResource` alias onto a base-palette key: `TextControlBackground` is
	// `ControlFillColorDefaultBrush` (:23), the placeholder and the query glyph are
	// `TextFillColorSecondaryBrush` (:35, :45), the query button's states are
	// `SubtleFillColor{Secondary,Tertiary}Brush` (:40, :41), the selection is
	// `AccentFillColorSelectedTextBackgroundBrush` (:39). Every one of those is already
	// emitted in all three themes, because the base palette is where high contrast is
	// aliased onto system colours under D10. So the search box reads through the alias to
	// the key the source itself names, which is identical in light and dark and is defined
	// under high contrast where the alias is not.
	// `AutoSuggestBoxQueryButtonPadding` is deliberately absent: it is defined at :26 and
	// applied nowhere in that file. The other two are the query button's — its style is
	// `QueryButtonStyle` at :97 and the presenter that paints its background is at :101,
	// inside it.
	AutoSuggestBoxInnerButtonMargin: 'AutoSuggestBox query button, the inset of its fill',
	AutoSuggestBoxRightButtonMargin: 'AutoSuggestBox query button, the spacer column right of it'
};

/**
 * Selected keys that are deliberately not emitted, each with its reason.
 *
 * The generator fails on a selected key that is neither emitted nor listed here, so
 * this map is the only way a token can be absent from the output. A key that stops
 * being emitted for some other reason is a bug rather than a decision, and this is
 * the structure that tells the two apart.
 */
export const EXCLUDED = {
	// AppBarButton has no BorderThickness setter and no AppBarButtonBorderThemeThickness
	// resource, so its inner border has the control default thickness of zero in every state.
	AppBarButtonBorderBrush: 'No AppBarButton border thickness exists; the border paints nothing',
	AppBarButtonBorderBrushPointerOver:
		'No AppBarButton border thickness exists; the border paints nothing',
	AppBarButtonBorderBrushPressed:
		'No AppBarButton border thickness exists; the border paints nothing',
	AppBarButtonBorderBrushDisabled:
		'No AppBarButton border thickness exists; the border paints nothing',
	AppBarButtonBorderBrushSubMenuOpened:
		'No AppBarButton border thickness exists; the border paints nothing',
	// AppBarButton_themeresources.xaml:318 paints the chevron in the same state that :319 hides it.
	AppBarButtonSubItemChevronForegroundSubMenuOpened:
		'Submenu-opened state hides the chevron it would paint',
	// The non-Reveal Compact state changes the inner border rather than this viewbox margin.
	AppBarButtonContentViewboxCompactMargin: 'Referenced only by Reveal templates',
	AppBarButtonHasFlyoutChevronVisibility:
		'Visibility enum has no scalar conversion; the flyout state renders the chevron',
	CommandBarMoreButtonMargin:
		'EllipsisButton\'s ContentPresenter writes Padding="0" literally at :1021 rather than template-binding the Button padding, so nothing reads this value; its only definition in the extracted record is RevealBrush_themeresources.xaml:562',
	AppBarButtonOverflowTextTouchMargin:
		'WD-020: touch and game-controller overflow padding is not reproduced',
	AppBarToggleButtonOverflowTextTouchMargin:
		'WD-020: touch and game-controller overflow padding is not reproduced',
	AppBarToggleButtonOverflowCheckTouchMargin:
		'WD-020: touch and game-controller overflow check margin is not reproduced',
	// No template setter reads the unsuffixed overlay; its state-specific variants are emitted.
	AppBarToggleButtonBackgroundHighLightOverlay:
		'No template setter reads the unsuffixed highlight overlay',
	// These five glyph brushes belong only to Reveal templates; the non-Reveal states use
	// overflow-label or AppBarToggleButtonForeground brushes instead.
	AppBarToggleButtonCheckGlyphForegroundDisabled:
		'Referenced only by Reveal templates; Disabled uses OverflowLabelForegroundDisabled',
	AppBarToggleButtonCheckGlyphForegroundChecked: 'Referenced only by Reveal templates',
	AppBarToggleButtonCheckGlyphForegroundCheckedPointerOver: 'Referenced only by Reveal templates',
	AppBarToggleButtonCheckGlyphForegroundCheckedPressed: 'Referenced only by Reveal templates',
	AppBarToggleButtonCheckGlyphForegroundCheckedDisabled: 'Referenced only by Reveal templates',

	// These five SplitButton resources are defined but the default template never reads them.
	// Disabled wins before checked in SplitButton.cpp:133, and its checked hover states retain
	// `SplitButtonBorderBrushChecked`; the CommandBar brush is referenced nowhere in the pin.
	SplitButtonBackgroundCheckedDisabled:
		'Disabled wins before checked; the template has no CheckedDisabled state',
	SplitButtonForegroundCheckedDisabled:
		'Disabled wins before checked; the template has no CheckedDisabled state',
	SplitButtonBorderBrushCheckedDisabled:
		'Disabled wins before checked; the template has no CheckedDisabled state',
	SplitButtonBorderBrushCheckedPointerOver:
		'Checked hover states retain SplitButtonBorderBrushChecked',
	SplitButtonInAppBarUnfocusedPointerOver:
		'Referenced nowhere in the pinned checkout, including SplitButtonCommandBarStyle',

	// Value converters a XAML template binds through. They are code, not values, and
	// CSS has nowhere to put them — a border radius is filtered by the property it
	// lands on rather than by a converter instance.
	TopCornerRadiusFilterConverter: 'XAML value converter; no CSS equivalent',
	RightCornerRadiusFilterConverter: 'XAML value converter; no CSS equivalent',
	BottomCornerRadiusFilterConverter: 'XAML value converter; no CSS equivalent',
	LeftCornerRadiusFilterConverter: 'XAML value converter; no CSS equivalent',
	TopLeftCornerRadiusDoubleValueConverter: 'XAML value converter; no CSS equivalent',
	BottomRightCornerRadiusDoubleValueConverter: 'XAML value converter; no CSS equivalent',
	TopThicknessFilterConverter: 'XAML value converter; no CSS equivalent',
	BottomThicknessFilterConverter: 'XAML value converter; no CSS equivalent',
	LeftThicknessFilterConverter: 'XAML value converter; no CSS equivalent',
	RightThicknessFilterConverter: 'XAML value converter; no CSS equivalent',
	TabViewLeftInsetCornerConverter: 'XAML value converter; no CSS equivalent',
	TabViewRightInsetCornerConverter: 'XAML value converter; no CSS equivalent',

	// Flyout instances, not values.
	TextControlCommandBarContextFlyout: 'XAML flyout instance; no CSS equivalent',
	TextControlCommandBarSelectionFlyout: 'XAML flyout instance; no CSS equivalent',

	// Engine switches the XAML framework reads. Nothing about them is styling.
	UseSystemFocusVisuals: 'XAML engine flag, not a style value',
	ThemeShadowIsUsingDropShadows: 'XAML engine flag, not a style value',

	// The pre-Fluent Button `*ThemeBrush` family, defined in Button_themeresources.xaml
	// and referenced nowhere in any of the three styles at :154, :235 or :297. Their
	// `Default` values are literal colours from the UWP palette — `#FFFFFFFF`, `#FF000000`,
	// `#21FFFFFF` — this library does not use, and emitting them would add a stylesheet
	// full of values nobody reads.
	ButtonBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by any of the three Button styles',
	ButtonBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by any of the three Button styles',
	ButtonDisabledBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by any of the three Button styles',
	ButtonDisabledBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by any of the three Button styles',
	ButtonDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by any of the three Button styles',
	ButtonForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by any of the three Button styles',
	ButtonPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by any of the three Button styles',
	ButtonPointerOverForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by any of the three Button styles',
	ButtonPressedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by any of the three Button styles',
	ButtonPressedForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by any of the three Button styles',

	// A `BackgroundSizing` enum rather than a colour or a length, so there is no CSS value
	// it could take. It is `OuterBorderEdge` in all three themes — ToggleButton_themeresources.xaml
	// :6, :64 and :122 — and the Checked, CheckedPointerOver and CheckedPressed states are the
	// three that apply it, at :256, :272 and :288. The component spells that as
	// `background-clip: border-box` on those three states and `padding-box` everywhere else,
	// CheckedDisabled included, because that state does not set it.
	ToggleButtonCheckedStateBackgroundSizing:
		'XAML BackgroundSizing enum; the component applies the clipping directly in CSS',

	// The pre-Fluent ToggleButton `*ThemeBrush` family, defined in
	// ToggleButton_themeresources.xaml and referenced nowhere in the current template,
	// which paints from the `ToggleButton{Background,Foreground,BorderBrush}*` names
	// instead. Eighteen keys, the same shape as Button's ten above.
	ToggleButtonBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonCheckedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonCheckedBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonCheckedDisabledBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonCheckedDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonCheckedForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonCheckedPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonCheckedPointerOverBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonCheckedPressedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonCheckedPressedBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonCheckedPressedForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonDisabledBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonPressedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	ToggleButtonPressedForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleButton template',
	// The same family for RepeatButton, nine keys, defined in
	// RepeatButton_themeresources.xaml and referenced by neither the RepeatButton template
	// nor NumberBox's spin buttons, whose style is `BasedOn` it.
	RepeatButtonBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RepeatButton template',
	RepeatButtonDisabledBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RepeatButton template',
	RepeatButtonDisabledBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RepeatButton template',
	RepeatButtonDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RepeatButton template',
	RepeatButtonForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RepeatButton template',
	RepeatButtonPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RepeatButton template',
	RepeatButtonPointerOverForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RepeatButton template',
	RepeatButtonPressedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RepeatButton template',
	RepeatButtonPressedForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RepeatButton template',

	// Defined at RepeatButton_themeresources.xaml:5, and the one key of its own the
	// control's style declines: `BorderThickness` at :83 is set from Button's
	// `ButtonBorderThemeThickness`, not from this. Emitting it would publish a width no
	// RepeatButton draws.
	RepeatButtonBorderThemeThickness:
		'Defined but unused; RepeatButton_themeresources.xaml:83 sets BorderThickness from ButtonBorderThemeThickness',

	// The pre-Fluent TextBox `*ThemeBrush` family, defined in TextBox_themeresources.xaml
	// and referenced nowhere in the current TextBox template. Their `Default` values are
	// literal colours from the UWP palette this library does not use, and emitting them
	// would add a stylesheet full of values nobody reads. The upstream source carries
	// fourteen of the family rather than the seventeen the family name suggests — the three
	// `TextBoxButtonDisabled*ThemeBrush` names are referenced by no template and so were
	// never defined as resources, and are not listed here for the same reason.
	TextBoxForegroundHeaderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current TextBox template',
	TextBoxPlaceholderTextThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current TextBox template',
	TextBoxBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current TextBox template',
	TextBoxBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current TextBox template',
	TextBoxForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current TextBox template',
	TextBoxDisabledBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current TextBox template',
	TextBoxDisabledBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current TextBox template',
	TextBoxDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current TextBox template',
	TextBoxButtonBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current TextBox template',
	TextBoxButtonBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current TextBox template',
	TextBoxButtonForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current TextBox template',
	TextBoxButtonPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current TextBox template',
	TextBoxButtonPointerOverBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current TextBox template',
	TextBoxButtonPointerOverForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current TextBox template',
	// The pressed trio was reported absent from the extraction and is not: all three are
	// there. Nothing emits them either way, which is why the omission was invisible — but
	// EXCLUDED is the record of what this selection drops on purpose, and three real
	// pre-Fluent literals were missing from it.
	TextBoxButtonPressedBackgroundThemeBrush:
		'Pre-Fluent TextBox *ThemeBrush family, not referenced by the current template',
	TextBoxButtonPressedBorderThemeBrush:
		'Pre-Fluent TextBox *ThemeBrush family, not referenced by the current template',
	TextBoxButtonPressedForegroundThemeBrush:
		'Pre-Fluent TextBox *ThemeBrush family, not referenced by the current template',

	// The four brushes an unchecked CheckBox would paint its glyph with, if it painted
	// one. It does not: the four unchecked visual states of
	// `CheckBox_themeresources.xaml:297` set `AnimatedIcon.State` to a `…Off` value and the
	// glyph is hidden by the animation. These exist for the down-level path, where
	// `AnimatedIcon` shows its `FallbackIconSource` and ignores state, so the glyph is
	// hidden by being painted the colour of the fill instead — which holds in Light and
	// Dark and fails in HighContrast, where pointer-over pairs a `Highlight` glyph with a
	// `HighlightText` fill. WD-006 accepts the fallback glyph, not a checkmark on an
	// unchecked box, so nothing here reads these four.
	CheckBoxCheckGlyphForegroundUnchecked:
		'Unchecked CheckBox draws no glyph; the animated original hides it by state',
	CheckBoxCheckGlyphForegroundUncheckedPointerOver:
		'Unchecked CheckBox draws no glyph; the animated original hides it by state',
	CheckBoxCheckGlyphForegroundUncheckedPressed:
		'Unchecked CheckBox draws no glyph; the animated original hides it by state',
	CheckBoxCheckGlyphForegroundUncheckedDisabled:
		'Unchecked CheckBox draws no glyph; the animated original hides it by state',

	// The pre-Fluent CheckBox `*ThemeBrush` family, defined in CheckBox_themeresources.xaml
	// and referenced nowhere in the template at :297. Same family and same reason as
	// Button's ten and TextBox's seventeen.
	CheckBoxBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current CheckBox template',
	CheckBoxBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current CheckBox template',
	CheckBoxContentDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current CheckBox template',
	CheckBoxContentForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current CheckBox template',
	CheckBoxDisabledBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current CheckBox template',
	CheckBoxDisabledBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current CheckBox template',
	CheckBoxDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current CheckBox template',
	CheckBoxForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current CheckBox template',
	CheckBoxPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current CheckBox template',
	CheckBoxPointerOverBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current CheckBox template',
	CheckBoxPointerOverForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current CheckBox template',
	CheckBoxPressedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current CheckBox template',
	CheckBoxPressedBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current CheckBox template',
	CheckBoxPressedForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current CheckBox template',

	// Three modern names that are defined and referenced by nothing. RadioButton's `Checked`
	// state sets `CheckGlyph.Stroke` once, to the base `RadioButtonCheckGlyphStrokeChecked`;
	// the three pointer states set the same property from the `CommonStates` family instead,
	// so these three have no template that reads them. Called out apart from the pre-Fluent
	// families because the name gives no hint — a reader checking the four-value pattern will
	// find three of the four missing from the output and needs to find a decision here.
	RadioButtonCheckGlyphStrokeCheckedPointerOver:
		'Defined upstream; no RadioButton visual state reads it',
	RadioButtonCheckGlyphStrokeCheckedPressed:
		'Defined upstream; no RadioButton visual state reads it',
	RadioButtonCheckGlyphStrokeCheckedDisabled:
		'Defined upstream; no RadioButton visual state reads it',

	// The pre-Fluent RadioButton `*ThemeBrush` family, defined in
	// RadioButton_themeresources.xaml and referenced nowhere in the template at :198.
	RadioButtonBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template',
	RadioButtonBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template',
	RadioButtonContentDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template',
	RadioButtonContentForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template',
	RadioButtonContentPointerOverForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template',
	RadioButtonDisabledBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template',
	RadioButtonDisabledBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template',
	RadioButtonDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template',
	RadioButtonForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template',
	RadioButtonPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template',
	RadioButtonPointerOverBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template',
	RadioButtonPointerOverForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template',
	RadioButtonPressedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template',
	RadioButtonPressedBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template',
	RadioButtonPressedForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template',

	// The pre-Fluent ToggleSwitch `*ThemeBrush` family — the `Curtain`, `Thumb`, `Track` and
	// `OuterBorder` names for the same four parts the modern brushes paint. Defined in
	// ToggleSwitch_themeresources.xaml and referenced nowhere in the template at :198.
	ToggleSwitchCurtainBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchCurtainDisabledBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchCurtainPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchCurtainPressedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchHeaderDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchHeaderForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchOuterBorderBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchOuterBorderDisabledBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchThumbBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchThumbBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchThumbDisabledBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchThumbDisabledBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchThumbPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchThumbPointerOverBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchThumbPressedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchThumbPressedForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchTrackBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchTrackBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchTrackDisabledBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchTrackPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',
	ToggleSwitchTrackPressedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ToggleSwitch template',

	// The pre-Fluent Slider `*ThemeBrush` family — the `Border`, `DisabledBorder`,
	// `HeaderForeground`, `Thumb*`, `TickMark*` and `Track*` names for the same parts the
	// modern brushes paint. Defined in Slider_themeresources.xaml and referenced nowhere
	// in the template at :176.
	SliderBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderDisabledBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderHeaderForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderThumbBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderThumbBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderThumbDisabledBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderThumbPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderThumbPointerOverBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderThumbPressedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderThumbPressedBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderTickMarkInlineBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderTickMarkInlineDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderTickmarkOutsideBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderTickMarkOutsideDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderTrackBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderTrackDecreaseBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderTrackDecreaseDisabledBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderTrackDecreasePointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderTrackDecreasePressedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderTrackDisabledBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderTrackPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',
	SliderTrackPressedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current Slider template',

	// The pre-Fluent ComboBox `*ThemeBrush` family — the `Arrow`, `Background`, `Border`,
	// `Disabled`, `Focused`, `Foreground`, `HeaderForeground`, `Item*`, `PlaceholderText`,
	// `PointerOver`, `Popup`, `Pressed` and `Selected` names for the same parts the modern
	// brushes paint. Defined in ComboBox_themeresources.xaml and referenced nowhere in the
	// template at :359.
	ComboBoxArrowDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxArrowForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxArrowPressedForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxDisabledBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxDisabledBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxFocusedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxFocusedBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxFocusedForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxHeaderForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxItemDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxItemPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxItemPointerOverForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxItemPressedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxItemPressedForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxItemSelectedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxItemSelectedDisabledBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxItemSelectedDisabledForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxItemSelectedForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxItemSelectedPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxPlaceholderTextForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxPointerOverBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxPopupBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxPopupBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxPopupForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxPressedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxPressedBorderThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxPressedForegroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxPressedHighlightThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxSelectedBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	ComboBoxSelectedPointerOverBackgroundThemeBrush:
		'Pre-Fluent *ThemeBrush family; not referenced by the current ComboBox template',
	// A Grid column width. Every other Thickness and Double in a dictionary describes a box
	// this library draws; a GridLength describes one of the tracks a XAML Grid divides itself
	// into, and the CSS analogue is a value in `grid-template-columns` or `gap` rather than a
	// custom property. The 8 it carries is written into the component with this line cited.
	ContentDialogButtonSpacing: 'GridLength; a Grid track width, stated in the component gap',
	// The two tracks the tail grid is built from. Same reason as the line above: a GridLength
	// is a Grid track width, not a box this library draws, so the 8 and the 10 are written
	// into the component with these lines cited rather than emitted as custom properties.
	TeachingTipTailShortSideLength: 'GridLength; the tail track, stated in the component',
	TeachingTipTailMargin: 'GridLength; the track beside the tail, stated in the component'
};

/**
 * The one column of the type ramp the XAML does not carry: the optical-size face for
 * each step. The ramp's `FontSize` and `FontWeight` come from the `Style` records;
 * `FontFamily` is `XamlAutoFontFamily` in the source and is replaced by an explicit
 * per-step family here because Windows registers Segoe UI Variable as three separate
 * families rather than one with an `opsz` axis. ADR 0003 is where that was decided.
 *
 * Line height used to be a second column here, one number per step, taken from the
 * published Windows type ramp. It is gone: no ramp `Style` sets `LineHeight`, so what
 * the control draws is the font's own spacing, and the published numbers are a design
 * specification that the shipped control does not implement. ADR 0011.
 */
export const TYPE_RAMP = {
	BaseTextBlockStyle: { face: 'Text' },
	CaptionTextBlockStyle: { face: 'Small' },
	BodyTextBlockStyle: { face: 'Text' },
	BodyStrongTextBlockStyle: { face: 'Text' },
	BodyLargeTextBlockStyle: { face: 'Text' },
	BodyLargeStrongTextBlockStyle: { face: 'Text' },
	SubtitleTextBlockStyle: { face: 'Display' },
	TitleTextBlockStyle: { face: 'Display' },
	TitleLargeTextBlockStyle: { face: 'Display' },
	DisplayTextBlockStyle: { face: 'Display' }
};

/**
 * Why the ramp classes carry `line-height: normal` and not a number.
 *
 * No ramp `Style` sets `LineHeight`, so a ramp-styled `TextBlock` draws the font's own
 * spacing: `(hhea.ascender - hhea.descender + hhea.lineGap) / head.unitsPerEm`, which for
 * `SegUIVar.ttf` is `(2210 + 514 + 0) / 2048` = 1.330078125 — 18.62px at Body size, where the
 * published ramp says 20. `OS/2.fsSelection` has USE_TYPO_METRICS clear, so the hhea metrics
 * are the ones in force; `MVAR` varies only `xhgt`, so the three optical faces share them;
 * and `segoeui.ttf`, the next family in the stack, carries the identical 2210 / -514 / 0 over
 * 2048.
 *
 * That is the advance *within* one text block. Across sibling elements WinUI rounds: every
 * `FrameworkElement` has `UseLayoutRounding` on by default, which is why the pin opts thirty-two
 * individual elements out with `UseLayoutRounding="False"` and never opts one in. So a
 * single-line `TextBlock` occupies a whole number of pixels, and that number is the font's
 * spacing rounded.
 *
 * `normal` is that rounded number. Chromium computes it as `round(ascent_px) +
 * round(descent_px)`, which equals `round(ascent_px + descent_px)` at all seven ramp sizes for
 * this font — 16, 19, 24, 27, 37, 53, 90. A ratio would reproduce the within-block advance and
 * lose the per-element rounding; `normal` does the reverse, and the reverse is what this library
 * is made of. ADR 0011 carries the measurement and WD-018 records what is given up.
 */

/**
 * The `x:Double` keys that are lengths, and so emit `px`.
 *
 * A double is not a length by default: an opacity, a ratio and a line count are spelled
 * the same way, and `*FontSize` is the only suffix the generator will take on trust. Every
 * other double is named here, with the thing it measures, or the generator stops on it.
 *
 * Note `NavigationViewCompactPaneLength` and `NavigationViewIconBoxWidth`: WinUI computes
 * the icon column's real width from the two together at runtime, and a component reading
 * these gets the inputs rather than the answer.
 */
export const DOUBLE_LENGTHS = {
	CommandBarFlyoutBorderThemeThickness: 'CommandBarFlyout surface border width',
	RatingControlFontSizeForRendering: 'RatingControl glyph size before the resting scale',
	RatingControlItemSpacing: 'RatingControl gap between stars',
	ColorPickerSliderInnerThumbWidth: 'ColorPickerSlider inner thumb width',
	ColorPickerSliderInnerThumbHeight: 'ColorPickerSlider inner thumb height',
	ColorPickerVerticalOrientationMinWidth: 'ColorPicker root minimum width',
	ColorPickerVerticalOrientationMaxWidth: 'ColorPicker root maximum width',
	ColorPickerVerticalOrientationMinHeight: 'ColorPicker root minimum height',
	ColorPickerVerticalOrientationMaxHeight: 'ColorPicker root maximum height',
	ColorPickerTextInputHorizontalOrientationMargin: 'ColorPicker text input horizontal label column',
	ScrollBarTrackBorderThemeThickness: 'ScrollBar track border width',
	ScrollBarThumbOffset: 'ScrollBar collapsed thumb offset',
	ScrollBarSize: 'ScrollBar rail thickness and arrow button size',
	ScrollBarVerticalThumbMinHeight: 'ScrollBar vertical thumb minimum length',
	ScrollBarVerticalThumbMinWidth: 'ScrollBar vertical thumb collapsed width',
	ScrollBarHorizontalThumbMinWidth: 'ScrollBar horizontal thumb minimum length',
	ScrollBarHorizontalThumbMinHeight: 'ScrollBar horizontal thumb collapsed height',
	ScrollBarThumbStrokeThickness: 'ScrollBar thumb transparent stroke width',
	DatePickerFlyoutPresenterAcceptDismissHostGridHeight: 'DatePicker flyout action bar height',
	DatePickerFlyoutPresenterHighlightHeight: 'DatePicker flyout selected-row height',
	DatePickerFlyoutPresenterItemHeight: 'DatePicker flyout item height',
	DatePickerSpacerThemeWidth: 'DatePicker spacer width',
	DatePickerThemeMaxWidth: 'DatePicker maximum width',
	DatePickerThemeMinWidth: 'DatePicker minimum width',
	TimePickerFlyoutPresenterAcceptDismissHostGridHeight: 'TimePicker flyout action bar height',
	TimePickerFlyoutPresenterHighlightHeight: 'TimePicker flyout selected-row height',
	TimePickerFlyoutPresenterItemHeight: 'TimePicker flyout item height',
	TimePickerSpacerThemeWidth: 'TimePicker spacer width',
	TimePickerThemeMaxWidth: 'TimePicker maximum width',
	TimePickerThemeMinWidth: 'TimePicker minimum width',
	SplitViewOpenPaneThemeLength: 'SplitView open pane length',
	SplitViewCompactPaneThemeLength: 'SplitView compact pane length',
	TreeViewItemMinHeight: 'TreeViewItem minimum height',
	TreeViewItemPresenterMargin: 'TreeViewItem presenter outer inset',
	TreeViewItemPresenterPadding: 'TreeViewItem presenter inner inset',
	TextControlThemeMinHeight: 'the height an editable text box floors at',
	TreeViewItemContentHeight: 'TreeViewItem content minimum height',
	ListViewItemMinWidth: 'ListViewItem minimum width',
	ListViewItemMinHeight: 'ListViewItem minimum height',
	GridViewItemMinWidth: 'GridViewItem minimum width',
	GridViewItemMinHeight: 'GridViewItem minimum height',
	TabViewItemHeaderIconSize: 'TabViewItem icon box size',
	TabViewItemHeaderCloseButtonHeight: 'TabViewItem close button height',
	TabViewItemHeaderCloseButtonWidth: 'TabViewItem close button width',
	TabViewItemAddButtonWidth: 'TabView add button width',
	TabViewItemAddButtonHeight: 'TabView add button height',
	TabViewItemScrollButtonWidth: 'TabView scroll button width',
	TabViewItemScrollButtonHeight: 'TabView scroll button height',
	TabViewItemMinHeight: 'TabViewItem minimum height',
	TabViewItemMinWidth: 'TabViewItem minimum width',
	TabViewItemMaxWidth: 'TabViewItem maximum width',
	SelectorBarItemSpacing: 'the SelectorBarItem icon-to-text gap',
	SelectorBarItemPillWidth: 'the SelectorBarItem pill base width',
	SelectorBarItemPillHeight: 'the SelectorBarItem pill height',
	MenuBarHeight: 'the MenuBar row height',
	AppBarThemeMinHeight: 'AppBar content minimum height',
	AppBarThemeCompactHeight: 'AppBar compact content height',
	AppBarButtonContentHeight: 'AppBarButton icon height',
	AppBarSeparatorWidth: 'AppBarSeparator rule width',
	AppBarOverflowSeparatorHeight: 'AppBarSeparator overflow rule height',
	AppBarSeparatorCornerRadius: 'AppBarSeparator rule corner radius',
	CommandBarOverflowMinWidth: 'CommandBar overflow minimum width',
	CommandBarOverflowTouchMinWidth: 'CommandBar overflow touch minimum width',
	CommandBarOverflowMaxWidth: 'CommandBar overflow maximum width',
	CommandBarOverflowMaxHeight: 'CommandBar overflow maximum height',
	AppBarMoreButtonColumnMinWidth: 'CommandBar more-button column minimum width',
	AppBarExpandButtonThemeWidth: 'CommandBar ellipsis button width',
	AppBarExpandButtonCircleDiameter: 'CommandBar ellipsis glyph layout height',
	SplitButtonPrimaryButtonSize: "the floor under the primary half's column",
	SplitButtonSecondaryButtonSize: "the chevron half's column",
	NavigationBackButtonHeight: 'the back button box',
	NavigationBackButtonWidth: 'the back button box',
	AutoSuggestBoxRightButtonMargin: 'the spacer column right of the query button',
	TitleBarMinDragRegionWidth: 'the column the title bar keeps clear for dragging',
	NavigationViewAutoSuggestAreaHeight: 'the search row in the pane',
	NavigationViewTopPaneHeight: 'the top pane row',
	TopNavigationViewOverflowButtonWidth: 'the top pane overflow button',
	TopNavigationViewOverflowButtonHeight: 'the top pane overflow button',
	NavigationViewCompactPaneLength: 'the collapsed pane',
	NavigationViewIconBoxWidth: "an item's icon column",
	NavigationViewItemOnLeftIconBoxHeight: "an item's icon box",
	NavigationViewItemOnLeftMinHeight: 'an item in the left pane',
	NavigationViewItemSeparatorHeight: 'the rule between item groups',
	NavigationViewSelectionIndicatorHeight: 'the selection indicator',
	NavigationViewSelectionIndicatorRadius: 'the selection indicator',
	NavigationViewSelectionIndicatorWidth: 'the selection indicator',
	NavigationViewPaneHeaderRowMinHeight: 'the pane row that keeps the toggle button its space',
	PaneToggleButtonHeight: 'the box the pane toggle button paints, and the pane row it floors',
	PaneToggleButtonWidth: 'the pane inset that clears the toggle button, not the button',
	TitleBarBackButtonWidth: 'the title bar back button',
	TitleBarCompactHeight: 'the title bar row',
	TitleBarExpandedHeight: 'the title bar row',
	TitleBarIconMaxHeight: 'the app icon',
	TitleBarIconMaxWidth: 'the app icon',
	TitleBarLeftHeaderPaddingWidth: 'the inset before the header content',
	TitleBarLeftPaddingWidth: 'the inset the window controls reserve',
	TitleBarPaneToggleButtonWidth: 'the title bar pane toggle button',
	TitleBarRightPaddingWidth: 'the inset the window controls reserve',
	TitleBarSubtitleMinWidth: 'the subtitle text',
	TitleBarTitleMinWidth: 'the title text',

	FlyoutThemeMaxWidth: 'the widest a flyout-sized surface gets',
	FlyoutThemeMinHeight: 'the floor under a flyout-sized surface',
	FlyoutThemeMaxHeight: 'the tallest a flyout-sized surface gets before it scrolls',

	ExpanderMinHeight: 'the Expander header row',
	ExpanderChevronButtonSize: "the Expander chevron button's box",
	ExpanderChevronGlyphSize: "the Expander chevron's glyph",
	FlyoutThemeMinWidth: 'the floor under a flyout-sized surface',

	ButtonBorderThemeThickness: 'the border all three Button styles share',

	CheckBoxSize: 'the box a CheckBox draws its glyph in',
	CheckBoxBorderThickness: "the stroke around a CheckBox's box",
	CheckBoxGlyphSize: "the glyph inside a CheckBox's box",
	CheckBoxHeight: 'the row a CheckBox occupies',
	CheckBoxMinWidth: 'the row a CheckBox occupies',

	RadioButtonBorderThemeThickness: "the stroke around a RadioButton's ring",
	RadioButtonCheckGlyphSize: 'the dot inside a checked RadioButton',
	RadioButtonCheckGlyphPointerOverSize: 'the dot inside a RadioButton under the pointer',
	RadioButtonCheckGlyphPressedOverSize: 'the dot inside a RadioButton while pressed',
	RadioButtonsColumnSpacing: 'the gap between RadioButtons columns',
	RadioButtonsRowSpacing: 'the gap between RadioButtons rows',

	ToggleSwitchOnStrokeThickness: "the stroke around a ToggleSwitch's on track",
	ToggleSwitchOuterBorderStrokeThickness: "the stroke around a ToggleSwitch's off track",
	ToggleSwitchPreContentMargin: 'the gutter above a ToggleSwitch track row',
	ToggleSwitchPostContentMargin: 'the gutter below a ToggleSwitch track row',
	ToggleSwitchThemeMinWidth: 'the width a ToggleSwitch reserves',

	SliderHorizontalHeight: 'the horizontal track row',
	SliderVerticalWidth: 'the vertical track column',
	SliderTrackThemeHeight: 'the bar a Slider track draws',
	SliderHorizontalThumbWidth: 'a Slider thumb box',
	SliderHorizontalThumbHeight: 'a Slider thumb box',
	SliderVerticalThumbWidth: 'a vertical Slider thumb box',
	SliderVerticalThumbHeight: 'a vertical Slider thumb box',
	SliderInnerThumbWidth: 'the accent circle inside a Slider thumb',
	SliderInnerThumbHeight: 'the accent circle inside a Slider thumb',
	SliderOutsideTickBarThemeHeight: 'the thickness of a Slider outside tick bar',

	ComboBoxItemPillWidth: 'the selection pill width inside a ComboBox item',
	ComboBoxItemPillHeight: 'the selection pill height inside a ComboBox item',
	ComboBoxThemeMinWidth: 'the minimum width the ComboBox reserves',
	ComboBoxPopupThemeMinWidth: 'the floor the dropdown width never goes below',
	ComboBoxMinHeight: 'the minimum height the ComboBox reserves',

	AutoSuggestListMaxHeight: 'the height the AutoSuggestBox suggestion list never exceeds',
	AutoSuggestBoxLeftButtonMargin: 'the spacer column left of the AutoSuggestBox delete button',
	TextControlThemeMinWidth: 'the minimum width an editable text box reserves',
	NumberBoxMinWidth: 'the width the NumberBox reserves when spin buttons are inline',

	ToolTipMaxWidth: 'the width a ToolTip content never exceeds',

	// InfoBadge's dot is its whole box; content states never exceed this height.
	InfoBadgeMinHeight: 'the dot an InfoBadge shrinks to',
	InfoBadgeMinWidth: 'the dot an InfoBadge shrinks to',
	InfoBadgeMaxHeight: 'the height an InfoBadge never exceeds',

	// ProgressBar's two x:Double lengths.
	ProgressBarMinHeight: 'the bar a ProgressBar draws',
	ProgressBarTrackHeight: 'the unfilled track inside it',

	InfoBarMinHeight: 'the minimum height an InfoBar reserves',
	InfoBarCloseButtonSize: 'the InfoBar close button box',
	InfoBarCloseButtonGlyphSize: 'the InfoBar close button glyph',

	MenuFlyoutThemeMinHeight: 'the floor under a menu surface',
	MenuFlyoutSeparatorHeight: 'the rule between two groups of menu items',
	SplitMenuFlyoutItemSeparatorHeight: "the rule between a split item's two halves",
	SplitMenuFlyoutItemChevronButtonWidth: "a split item's chevron half",

	ContentDialogMinWidth: 'the width a dialog never goes under',
	ContentDialogMaxWidth: 'the width a dialog never exceeds',
	ContentDialogMinHeight: 'the height a dialog never goes under',
	ContentDialogMaxHeight: 'the height a dialog never exceeds',

	TeachingTipMinWidth: 'the width a tip never goes under',
	TeachingTipMaxWidth: 'the width a tip never exceeds',
	TeachingTipMinHeight: 'the height a tip never goes under',
	TeachingTipMaxHeight: 'the height a tip never exceeds',
	TeachingTipBorderThickness: "the tail's stroke width",
	TeachingTipAlternateCloseButtonSize: 'the tip header close button box',
	TeachingTipAlternateCloseButtonGlyphSize: 'the tip header close button glyph',
	LoopingSelectorUpDownButtonHeight: 'the LoopingSelector navigation button height',
	PipsPagerHorizontalOrientationButtonWidth: 'the pip box width in horizontal orientation',
	PipsPagerHorizontalOrientationButtonHeight: 'the pip box height in horizontal orientation',
	PipsPagerVerticalOrientationButtonWidth: 'the pip box width in vertical orientation',
	PipsPagerVerticalOrientationButtonHeight: 'the pip box height in vertical orientation',
	PipsPagerNavigationButtonWidth: 'the PipsPager navigation button width',
	PipsPagerNavigationButtonHeight: 'the PipsPager navigation button height',
	// AnnotatedScrollBar's five, all of them generically named and all of them its own.
	ThumbHeight: "the AnnotatedScrollBar thumb's height",
	ThumbWidth: "the AnnotatedScrollBar thumb's width",
	LabelsGridMinWidth: "the AnnotatedScrollBar label column's minimum width",
	AnnotatedScrollBarTooltipMaxWidth: 'the width the detail-label tooltip never exceeds',
	AnnotatedScrollBarTooltipMinHeight: 'the height the detail-label tooltip never goes under',
	PersonPictureEllipseStrokeThickness: 'PersonPicture ellipse border width',
	PersonPictureEllipseBadgeStrokeThickness: 'PersonPicture badge border width',
	MediaTransportControlsBorderThickness: 'MediaTransportControls panel border width',
	MediaTransportControlsAppBarButtonHeight: 'MediaTransportControls command button height',
	MediaTransportControlsAppBarButtonWidth: 'MediaTransportControls command button width',
	MediaTransportControlsSliderHeight: 'MediaTransportControls slider height',
	MediaTransportControlsSliderWidth: 'MediaTransportControls volume slider width',
	MediaTransportControlsMinWidth: 'MediaTransportControls minimum width',
	MediaTransportControlsMaxWidth: 'MediaTransportControls maximum width'
};

/**
 * `x:Double` keys that are ratios rather than lengths, emitted unitless.
 *
 * The generator's `x:Double` arm says a length unit is not right for every double — an
 * opacity, a ratio and a line count are spelled the same way — and stops on a double it
 * cannot place. This is where a ratio is placed. Emitting one as `px` and dividing the unit
 * back out at the point of use (`calc(var(--x) / 1px)`) reaches the same number and leaves
 * every reader of the stylesheet a puzzle to solve, so the unit is not put on in the first
 * place.
 */
export const DOUBLE_RATIOS = {
	ScrollBarButtonArrowScalePressed: "the ScrollBar arrow glyph's 0.875 pressed scale",
	SelectorBarItemIconScale: "the SelectorBarItem icon's 0.8 scale",
	ComboBoxItemPillMinScale: "the selection pill's pressed scale, 0.625",
	ItemContainerDisabledOpacity: "the disabled ItemContainer's 0.3 opacity",
	FlipViewButtonScalePressed: "the pressed flip button's 0.875 scale",
	CalendarViewNavigationButtonScalePressed:
		"the pressed CalendarView navigation button's 0.875 scale",
	LoopingSelectorUpDownButtonScalePressed:
		"the pressed LoopingSelector navigation button's 0.875 scale",
	ListViewItemDisabledThemeOpacity: "the disabled ListViewItem's 0.3 opacity",
	PipsPagerNavigationButtonScalePressed: "the pressed PipsPager navigation button's 0.875 scale"
};

/**
 * `x:String` keys whose value is a font size, emitted as `px` the way an `x:Double` one is.
 *
 * Upstream declares every other font size in both pins as an `x:Double`; these two are
 * `x:String` (`PipsPager_themeresources.xaml:107-108`) and are read as sizes all the same —
 * `PipsPagerButtonBaseStyle` sets `FontSize` from `PipsPagerNormalGlyphFontSize` at `:209`
 * and `PipsPagerSelectedPipButtonStyle` from `PipsPagerSelectedGlyphFontSize` at `:282`, and
 * both pip states animate that property between the two (`:229-231`, `:245-247`).
 *
 * Named rather than matched on the `FontSize` suffix, for the reason `GLYPHS` gives below:
 * an `x:String` this file has not read is a value the generator should stop on.
 */
export const STRING_FONT_SIZES = {
	PipsPagerSelectedGlyphFontSize: 'the selected pip glyph size, 6',
	PipsPagerNormalGlyphFontSize: 'the unselected pip glyph size, 4'
};

/**
 * `x:String` keys whose value is a single glyph, emitted as a CSS string so a component
 * can put it in `content`.
 *
 * Named rather than matched on a `Glyph` suffix: the suffix is what these happen to be
 * called, not what makes them convertible, and an `x:String` this file has not read is a
 * value the generator should stop on rather than escape.
 */
export const GLYPHS = {
	AppBarButtonFlyoutGlyph: 'AppBarButton flyout chevron',
	AppBarButtonOverflowFlyoutGlyph: 'AppBarButton overflow flyout chevron',
	NavigationViewItemExpandedGlyph: "an expandable item's chevron",
	CheckBoxCheckedGlyph: "a checked CheckBox's checkmark",
	CheckBoxIndeterminateGlyph: "an indeterminate CheckBox's dash",
	InfoBarIconBackgroundGlyph: 'the InfoBar severity icon disc',
	InfoBarInformationalIconGlyph: 'the InfoBar informational icon',
	InfoBarErrorIconGlyph: 'the InfoBar error icon',
	InfoBarWarningIconGlyph: 'the InfoBar warning icon',
	InfoBarSuccessIconGlyph: 'the InfoBar success icon',
	ExpanderChevronUpGlyph: "the Expander chevron's up form",
	ExpanderChevronDownGlyph: "the Expander chevron's down form",
	BreadcrumbBarChevronLeftToRight: 'the BreadcrumbBar chevron pointing left to right',
	// PipsPager_themeresources.xaml:100-101 gives the selected and the unselected pip the same
	// code point; only the font size and the brush differ between them. Both keys are kept
	// because the template reads both names and a consumer overriding one expects the other.
	PipsPagerSelectedGlyph: 'the selected pip',
	PipsPagerNormalGlyph: 'an unselected pip',
	PipsPagerPreviousPageButtonGlyph: "the previous-page button's chevron",
	PipsPagerNextPageButtonGlyph: "the next-page button's chevron"
};

/**
 * The eight OS system colors, and the CSS system color each one corresponds to.
 *
 * `value` is Windows' own High Contrast theme, read from
 * `C:\Windows\Resources\Ease of Access Themes\hc1.theme` on the reference Windows 11
 * guest (build 26200) — one of the four contrast themes Windows ships. It is what
 * makes `[data-theme='high-contrast']` inspectable on a machine that is not in
 * forced-colors mode; `keyword` is what the browser fills from the user's actual
 * theme when it is. ADR 0005.
 *
 * These are the only colors in the project written by hand rather than extracted, and
 * seven of the eight are corroborated by the Gallery's own High Contrast chart, which
 * documents all four contrast themes Windows ships.
 *
 * The eighth is not, and the disagreement is recorded here because it is the value
 * someone will eventually doubt. That chart gives `Hilight` as `#ABCFF2`; this guest's
 * `hc1.theme` gives `Hilight=161 191 222`, which is `#A1BFDE`, and the theme file is what
 * Windows actually paints. The other seven agree to the byte, so it is one stale entry in
 * Microsoft's documentation rather than a different theme. The Gallery reproduction still
 * shows `#ABCFF2` on that tile, because that tile is a picture of the original's chart and
 * reproducing the original includes reproducing what it gets wrong.
 */
export const SYSTEM_COLORS = {
	SystemColorWindowColor: { value: '#2D3236', keyword: 'Canvas' },
	SystemColorWindowTextColor: { value: '#FFFFFF', keyword: 'CanvasText' },
	SystemColorButtonFaceColor: { value: '#2D3236', keyword: 'ButtonFace' },
	SystemColorButtonTextColor: { value: '#B6F6F0', keyword: 'ButtonText' },
	SystemColorGrayTextColor: { value: '#A6A6A6', keyword: 'GrayText' },
	SystemColorHighlightColor: { value: '#A1BFDE', keyword: 'Highlight' },
	SystemColorHighlightTextColor: { value: '#212D3B', keyword: 'HighlightText' },
	SystemColorHotlightColor: { value: '#70EBDE', keyword: 'LinkText' }
};

/**
 * Font families written by hand, as the generator converts no `FontFamily` record; three of
 * the four records say `XamlAutoFontFamily`, which no CSS font resolves.
 *
 * `SymbolThemeFontFamily` is referenced from theme resources all over the source — every
 * `FontIcon` in every control template resolves its family through it — and defined in none
 * of the per-control dictionaries. Its definition is in the framework record, in all three
 * themes, as the XAML list `Segoe Fluent Icons,Segoe MDL2 Assets`, so the CSS stack is written
 * here, and `build()` in `scripts/tokens/generate.mjs` fails when it is not the record's. The
 * second family is Windows 10's icon font, which Windows 11 still carries; where the first is
 * absent, WinUI draws from MDL2, and so does this stack.
 *
 * `ContentControlThemeFontFamily` is the second one. `DefaultToolTipStyle` at
 * ToolTip_themeresources.xaml:48 binds `FontFamily` to it directly — and the tooltips are
 * the only place in the acceptance surface that does, because every other control reads
 * the family through one of the `*TextBlockStyle` records in the type ramp rather than
 * through a `Setter` on the control's own template. The control pin does not define it, and
 * the framework record defines it as `XamlAutoFontFamily` in all three themes, a name that
 * resolves only inside WinUI, so the family it stands for is written here.
 *
 * The two stack values are kept in step: the `Text` row here is the same stack
 * `style()` in `scripts/tokens/generate.mjs` builds for the type ramp's Text face, and ADR 0003
 * fixes both — a future change to one is a change to the other.
 *
 * The values are ADR 0003's decision, not a new one: reference the family by name and embed
 * nothing. `tests/visual/fonts.spec.ts` fails if they stop resolving where the baselines
 * are taken, which is the only place the reference can be checked. The generator emits the
 * icon stack with one family after the two written here, the face of the release's own glyphs
 * that ADR 0018 embeds in `tokens.css` for where Segoe is absent; `checkIconStack` compares
 * the two written here alone. Each text stack ends in `TEXT_FACE`'s family and then
 * `sans-serif`, which the generator checks (ADR 0019).
 *
 * `PivotHeaderItemFontFamily` and `PivotTitleFontFamily` are records in the control pin, in all
 * three Pivot dictionaries, and like `ContentControlThemeFontFamily` each says
 * `XamlAutoFontFamily`, so they take the same written stack.
 *
 * ADR 0003 gives the type ramp an explicit family per step because Windows registers Segoe UI
 * Variable as three families rather than one with an `opsz` axis, and the ramp switches to the
 * Display face at 20px. Pivot's 24px header uses the Text face: the reference labels measure
 * 26, 75 and 82px for All, Unread and Flagged; Text at weight 350 measures 26.02, 75.50 and
 * 82.50, while Display measures 24.63, 73.50 and 79.97. The ramp's family is a property of
 * its step, not a rule about size, so XamlAutoFontFamily outside it gets Text whatever size.
 *
 * Four entries, because four are what the acceptance surface needs. WinUI's other text-family
 * resources are not here for the same reason the rest of the per-control vocabulary is not:
 * emitting a name nothing reads makes the layer harder to audit and easier to trust wrongly.
 */
export const PLATFORM_FONTS = {
	SymbolThemeFontFamily: "'Segoe Fluent Icons', 'Segoe MDL2 Assets'",
	ContentControlThemeFontFamily:
		"'Segoe UI Variable Text', 'Segoe UI', 'winui-svelte text', sans-serif",
	PivotHeaderItemFontFamily:
		"'Segoe UI Variable Text', 'Segoe UI', 'winui-svelte text', sans-serif",
	PivotTitleFontFamily: "'Segoe UI Variable Text', 'Segoe UI', 'winui-svelte text', sans-serif"
};

/**
 * The face every text stack names after the two Segoe families, for where neither is installed.
 * ADR 0019.
 *
 * Off Windows a stack used to fall through to `sans-serif`, whose line metrics are its own: at
 * 14px DejaVu Sans draws a 16px line where Segoe UI Variable draws 19, and every control
 * that places its text from the top of its box, as a CheckBox's label is, drew it out of line
 * with what sits beside it. This face is a system font the platform already has, named by
 * `local()` and embedded nowhere, with Segoe UI Variable's vertical metrics laid over it by the
 * `ascent-override`, `descent-override` and `line-gap-override` descriptors, so the line box and
 * the baseline in it are Segoe's and only the shapes are not.
 *
 * `metrics` is `SegUIVar.ttf`'s, as ADR 0011 records it: `hhea` ascender 2210 and descender 514
 * over 2048 units, no line gap, and `segoeui.ttf` carries the same. `faces` are two weights,
 * upright and italic, each weight a range so that nothing the ramp and the components ask for
 * is synthesized: 350 and 400 draw from the regular face, 600 and 700 from the bold one, and
 * italic text from an italic face rather than a slanted upright one. Each lists the same
 * families in the same order, by full name and then by PostScript name, as `local()` matches
 * either: Arial, which Windows and macOS both install, Helvetica Neue, which macOS does, and
 * Liberation Sans, Arimo and DejaVu Sans, one of which most Linux distributions do. A face
 * none of whose fonts is installed fails to load, and text asking for it falls through to
 * `sans-serif` and that font's own line.
 */
export const TEXT_FACE = {
	family: 'winui-svelte text',
	metrics: { unitsPerEm: 2048, ascent: 2210, descent: 514, lineGap: 0 },
	faces: [
		{
			weight: '1 500',
			style: 'normal',
			local: [
				'Arial',
				'ArialMT',
				'Helvetica Neue',
				'HelveticaNeue',
				'Liberation Sans',
				'LiberationSans',
				'Arimo',
				'Arimo-Regular',
				'DejaVu Sans',
				'DejaVuSans'
			]
		},
		{
			weight: '501 1000',
			style: 'normal',
			local: [
				'Arial Bold',
				'Arial-BoldMT',
				'Helvetica Neue Bold',
				'HelveticaNeue-Bold',
				'Liberation Sans Bold',
				'LiberationSans-Bold',
				'Arimo Bold',
				'Arimo-Bold',
				'DejaVu Sans Bold',
				'DejaVuSans-Bold'
			]
		},
		{
			weight: '1 500',
			style: 'italic',
			local: [
				'Arial Italic',
				'Arial-ItalicMT',
				'Helvetica Neue Italic',
				'HelveticaNeue-Italic',
				'Liberation Sans Italic',
				'LiberationSans-Italic',
				'Arimo Italic',
				'Arimo-Italic',
				'DejaVu Sans Oblique',
				'DejaVuSans-Oblique'
			]
		},
		{
			weight: '501 1000',
			style: 'italic',
			local: [
				'Arial Bold Italic',
				'Arial-BoldItalicMT',
				'Helvetica Neue Bold Italic',
				'HelveticaNeue-BoldItalic',
				'Liberation Sans Bold Italic',
				'LiberationSans-BoldItalic',
				'Arimo Bold Italic',
				'Arimo-BoldItalic',
				'DejaVu Sans Bold Oblique',
				'DejaVuSans-BoldOblique'
			]
		}
	]
};

/**
 * Two sizes Windows supplies that no dictionary defines.
 *
 * `FocusVisualPrimaryThickness` and `FocusVisualSecondaryThickness` are property defaults
 * on `Control` rather than theme resources, so there is no record to read them from — not
 * in the control pin and not in the framework record. Every `Setter` in the pinned source
 * that overrides the pair sets 2 and 1, and a Button on the reference guest measures a 2px
 * outer stroke over a 1px inner one. Theme-independent, so `:root` only.
 */
export const PLATFORM_METRICS = {
	FocusVisualPrimaryThickness: '2px',
	FocusVisualSecondaryThickness: '1px'
};

// The recipe moved so the Gallery's page can drive it continuously; it is re-exported here
// because this manifest is where a reader looks for it.
export { dropShadowRecipe };

/**
 * The drop-shadow recipe is `GetDropShadowRecipe` in the pinned
 * `dxaml/xcp/components/graphics/inc/DropShadowRecipe.h`. `Translation.Z` selects its depth:
 * ToolTip uses 16 at `ToolTip_Partial.cpp:647`, the default elevated control uses 32 at
 * `ElevationHelper.cpp:19`, and ContentDialog uses 128 at `ContentDialog_Partial.cpp:1165`.
 * The alpha emitted here is the source's own `uint8` truncation, not its float opacity.
 *
 * These values were previously fitted by eye, and this manifest recorded "No pinned dictionary
 * states this recipe" while the recipe was in the control pin, one directory outside the sparse
 * checkout. The one quantity the recipe does not give is what a composition `BlurRadius` is in
 * CSS pixels of `box-shadow` blur. It was fitted against two photographs of the Gallery's own
 * ThemeShadow page — a 200x200 card at `Translation.Z` 32 and at 64, light theme, sampled 45
 * pixels along each of the bottom, right and top ramps. CSS blur radius is
 * `(2 / 3) * composition BlurRadius`, which is the same as saying the composition states its
 * blur as three standard deviations; against the recipe's own opacities and with no free scale
 * factor, the residual over those 270 samples is 0.0016 in alpha — 0.40 of one level of the
 * card's 243-level background, and 1.74 levels at the worst single pixel.
 *
 * `Common_themeresources.xaml:48` sets `ThemeShadowIsUsingDropShadows` to `True`, so the
 * right primitive is CSS `box-shadow`, not an approximation of a different composition effect.
 *
 * `PopupShadow`, `DialogShadow`, and `ToolTipShadow` are not WinUI resource names because there
 * is no resource to name them after. This is the same situation as `PLATFORM_METRICS` and its
 * `FocusVisualPrimaryThickness`: the values have nowhere to be read from, so the manifest
 * records the platform-supplied values. Unlike `PLATFORM_METRICS` and `ACCENT_COLORS`, this
 * family is per theme.
 *
 * `highContrast` is `none` by decision, not by measurement. The recipe has no high-contrast
 * branch, but ADR 0005 makes high contrast a remapping onto eight system colours, and a black
 * drop shadow has no system colour to be remapped from.
 *
 * `MenuFlyoutPresenter` calls `ApplyElevationEffect(this, GetDepth())` at
 * `MenuFlyoutPresenter_Partial.cpp:483`, so a submenu at nesting depth 1 is `Translation.Z` 40
 * and Elevation 20, past the boundary where the ambient layer switches on. No token is emitted
 * for it and no component is changed for it.
 *
 * `PaneShadow` is the one member of this family whose depth a resource does state.
 * `PaneOverlayShadowDepth` is 16 in `NavigationView_themeresources.xaml:207`, and
 * `NavigationView::SetDropShadow` (`NavigationView.cpp:5028`) reads it, puts a `ThemeShadow` on
 * the `ShadowCaster` grid and translates it to that Z. The resource names the depth and not the
 * shadow, so the row is still named the way the rest of the family is. Sixteen is ToolTip's
 * depth as well, so the two rows carry the same bytes today; they are two rows because they are
 * two readings, and one of them moving would not be the other moving.
 */
export const PLATFORM_SHADOWS = {
	ToolTipShadow: {
		light: dropShadowRecipe(16, 'light'),
		dark: dropShadowRecipe(16, 'dark'),
		highContrast: 'none'
	},
	PaneShadow: {
		light: dropShadowRecipe(16, 'light'),
		dark: dropShadowRecipe(16, 'dark'),
		highContrast: 'none'
	},
	PopupShadow: {
		light: dropShadowRecipe(32, 'light'),
		dark: dropShadowRecipe(32, 'dark'),
		highContrast: 'none'
	},
	DialogShadow: {
		light: dropShadowRecipe(128, 'light'),
		dark: dropShadowRecipe(128, 'dark'),
		highContrast: 'none'
	}
};

/**
 * The UWP-era brushes Windows supplies and no dictionary here defines, each with the
 * system colour it resolves to and the themes that mapping is warranted for. ADR 0008.
 *
 * Substituted at emission, never emitted: a reference to one of these becomes
 * `var(--winui-<to>)` directly, so the name itself never reaches the stylesheet. The
 * alternative — a token per name — fails on the first objection, that these names appear
 * only under high contrast and no source gives them a light or dark value.
 *
 * `themes` is a guard, not decoration, and it has now fired twice for real. It said that the
 * day a tranche referenced one of these from `Default` or `Light` the generator would stop
 * rather than silently apply a high-contrast reading to a light record. The Text tranche was
 * the first day: the framework dictionary defines `TextControlHeaderForeground` as an alias
 * onto `SystemControlForegroundBaseHighBrush` in all three themes. The Navigation tranche's
 * Pivot is the second, and it took three rows at once — `PivotHeaderItemForegroundUnselected`,
 * `…ForegroundSelected` and the seven `PivotHeaderItemBackground*` keys name
 * `SystemControlForegroundBaseMediumBrush`, `SystemControlHighlightAltBaseHighBrush` and
 * `SystemControlHighlightTransparentBrush` from `Default` and `Light` as well as from
 * `HighContrast`. All three left the table, and the framework dictionary's high-contrast value
 * matched the reading each row had chosen, three times out of three.
 *
 * **A row is deleted, not widened, when that happens.** ADR 0008 chose substitution
 * because these names had no definition anywhere and no light or dark value could be
 * written without inventing one. ADR 0010 changed that: the framework dictionary defines
 * every one of them, in all three themes, and it agrees with this table's high-contrast
 * readings six times out of six. So a forced row stops being a hand-chosen mapping and
 * becomes an ordinary token read from a source — which is strictly less judgement, not
 * more. `SystemControlForegroundBaseHighBrush` and `SystemControlDisabledBaseMediumLowBrush`
 * left this table that way.
 *
 * The rest stay until something forces them, for the same reason the table was populated
 * one tranche at a time rather than all at once: each departure changes the declarations
 * that referenced it, and those are worth reading in a diff small enough to read.
 *
 * The values are read from `RevealBrush_themeresources.xaml`, the one place in the pinned
 * source that states high-contrast values for this family; ADR 0008 carries the evidence
 * per row and marks the two that rest on a single witness.
 */
export const PLATFORM_BRUSHES = {
	SystemControlBackgroundBaseLowBrush: {
		to: 'SystemColorButtonFaceColor',
		themes: ['HighContrast']
	},
	SystemControlHighlightListLowBrush: { to: 'SystemColorHighlightColor', themes: ['HighContrast'] },
	SystemControlHighlightListMediumBrush: {
		to: 'SystemColorHighlightColor',
		themes: ['HighContrast']
	},
	SystemControlHighlightListLowRevealBackgroundBrush: {
		to: 'SystemColorHighlightColor',
		themes: ['HighContrast']
	},
	SystemControlHighlightListMediumRevealBackgroundBrush: {
		to: 'SystemColorHighlightColor',
		themes: ['HighContrast']
	},
	SystemControlHighlightAltTransparentRevealBorderBrush: {
		to: 'SystemColorHighlightTextColor',
		themes: ['HighContrast']
	},
	SystemControlBackgroundTransparentRevealBorderBrush: {
		to: 'SystemColorButtonTextColor',
		themes: ['HighContrast']
	},

	// The Button tranche's HighContrast dictionary references ten more of the family. Each
	// is resolved by ADR 0008's rule and by nothing else: across the 34 witnesses in
	// `Materials/Reveal/RevealBrush_themeresources.xaml`'s HighContrast dictionary the tone
	// word does not matter and the role word decides — `Background…` is
	// `SystemColorButtonFaceColor`, `Highlight…` is `SystemColorHighlightColor`,
	// `HighlightAlt…` is `SystemColorHighlightTextColor`, `Foreground…` is
	// `SystemColorButtonTextColor`, and `Disabled…` is `SystemColorGrayTextColor` from the
	// 32-of-32 measurement the ADR records.
	//
	// Four of these ten were first mapped by reading the name as a whole rather than by the
	// role word, and the result was checked by resolving every Button background/foreground
	// pair through the table: `Button` and `SubtleButton` came out with `PointerOver` and
	// `Pressed` painting `SystemColorHighlightTextColor` on `SystemColorHighlightTextColor`,
	// so the label vanished on hover in high contrast. The rule produces an inversion in
	// every one of the twelve pairs. This is what ADR 0008 means by a wrong colour becoming
	// a silent one, and resolving the pairs is the check that makes it loud.
	SystemControlHighlightAccentBrush: {
		to: 'SystemColorHighlightColor',
		themes: ['HighContrast']
	},
	SystemControlForegroundAccentBrush: {
		to: 'SystemColorButtonTextColor',
		themes: ['HighContrast']
	},
	SystemControlBackgroundBaseMediumLowBrush: {
		to: 'SystemColorButtonFaceColor',
		themes: ['HighContrast']
	},
	SystemControlHighlightAltAccentBrush: {
		to: 'SystemColorHighlightTextColor',
		themes: ['HighContrast']
	},
	SystemControlBackgroundChromeWhiteBrush: {
		to: 'SystemColorButtonFaceColor',
		themes: ['HighContrast']
	},
	SystemControlBackgroundChromeBlackHighBrush: {
		to: 'SystemColorButtonFaceColor',
		themes: ['HighContrast']
	},
	SystemControlHighlightBaseHighBrush: {
		to: 'SystemColorHighlightColor',
		themes: ['HighContrast']
	},
	SystemControlHighlightBaseMediumLowBrush: {
		to: 'SystemColorHighlightColor',
		themes: ['HighContrast']
	},
	SystemControlDisabledTransparentBrush: {
		to: 'SystemColorGrayTextColor',
		themes: ['HighContrast']
	},
	SystemControlForegroundTransparentBrush: {
		to: 'SystemColorButtonTextColor',
		themes: ['HighContrast']
	},

	// The TextBox tranche's HighContrast dictionary reaches five more of the family.
	// Each is resolved by ADR 0008's role rule and by nothing else — across the 34
	// witnesses in `Materials/Reveal/RevealBrush_themeresources.xaml`'s HighContrast
	// dictionary the tone word does not matter and the role word decides:
	// `Background…` is `SystemColorButtonFaceColor`, `Foreground…` is
	// `SystemColorButtonTextColor`, `Highlight…` is `SystemColorHighlightColor`.
	//
	// Why the rule rather than reading the name as a whole: the Button tranche first mapped four rows
	// by reading names whole, and two of its states came out painting `SystemColorHighlightTextColor`
	// on `SystemColorHighlightTextColor` — the label gone on hover, in high contrast, with every gate
	// green. Resolving the pairs is the check; whoever adds or changes a row here resolves every
	// foreground/background pair the row takes part in before relying on it.
	SystemControlBackgroundAltHighBrush: {
		to: 'SystemColorButtonFaceColor',
		themes: ['HighContrast']
	},
	SystemControlForegroundBaseMediumHighBrush: {
		to: 'SystemColorButtonTextColor',
		themes: ['HighContrast']
	},
	SystemControlForegroundBaseMediumLowBrush: {
		to: 'SystemColorButtonTextColor',
		themes: ['HighContrast']
	},
	SystemControlHighlightBaseMediumHighBrush: {
		to: 'SystemColorHighlightColor',
		themes: ['HighContrast']
	}
};

/**
 * Keys ToolTip reads — the thirteenth seed set, after NumberBox.
 *
 * `DefaultToolTipStyle` is a `Setter`-only template at ToolTip_themeresources.xaml:42 —
 * the dictionary defines twelve `ToolTip*` resources and the style reads seven of them,
 * the two down-level aliases and the three UWP-era `*ThemeBrush` names being the five
 * left out. `ToolTipContentThemeFontSize` is the one themed `x:Double` (12 in all three
 * themes); `ToolTipBorderThemeThickness` is the one themed `Thickness` (1 in all three);
 * `ToolTipBorderPadding` and `ToolTipMaxWidth` are theme-independent (`Thickness` 9,6,9,8
 * and `x:Double` 320). The three brushes — `ToolTipForegroundBrush`,
 * `ToolTipBackgroundBrush`, `ToolTipBorderBrush` — are themed and aliased onto
 * `TextFillColorPrimaryBrush`, `AcrylicInAppFillColorDefaultBrush` and
 * `SurfaceStrokeColorFlyoutBrush` in the Default and Light dictionaries, with all three
 * resolving to system colour keys under HighContrast. `ControlCornerRadius` is the one
 * resource the template reads that is already emitted.
 *
 * What this list leaves out, so a gap reads as a decision rather than an oversight. The
 * ToolTip dictionary carries twelve resources; these are the five not here:
 *
 * - **`ToolTipForeground` and `ToolTipBackground`.** Down-level aliases of the
 *   `…Brush` pair the template actually reads. The legacy alias names are not referenced
 *   in the current template, the same shape as the pre-Fluent `*ThemeBrush` families
 *   called out by every other control's preamble. They are not seeded here because nothing
 *   in this component reads them; if a later ToolTip tranche takes the dictionary whole,
 *   they arrive with it.
 * - **`ToolTipForegroundThemeBrush`, `ToolTipBackgroundThemeBrush` and
 *   `ToolTipBorderThemeBrush`.** The UWP-era `*ThemeBrush` names, with hardcoded
 *   `<Color>` values — `#FF666666`, `#FFFFFFFF`, `#FF808080` — from a palette this
 *   library does not use, and the current template references none of them. Same family
 *   and same reason as the pre-Fluent brushes Button, TextBox, CheckBox, RadioButton,
 *   ToggleSwitch, Slider and ComboBox each list in their own preamble.
 *
 * `ToolTipBorderThemePadding` is a fourth name a reader will expect to find discussed
 * here and it is not this dictionary's: it lives in `Deprecated_themeresources.xaml` at
 * `8,5,8,7`, which is the pre-Fluent padding `ToolTipBorderPadding` replaced. It is out
 * of this set because it is out of this file.
 *
 * `ContentControlThemeFontFamily` is not seeded here because it is a `FontFamily` rather
 * than a colour or length, and the per-theme font is reached through `PLATFORM_FONTS`
 * below. `ControlCornerRadius` is not seeded here because it is already emitted through
 * the corner-radii source file. `ToolTipMaxWidth` is an `x:Double` that is a length, so
 * it needs a `DOUBLE_LENGTHS` row; the generator stops and names it otherwise.
 */
export const TOOLTIP_KEYS = {
	// The three themed brushes the template binds onto Foreground, Background and
	// BorderBrush.
	ToolTipForegroundBrush: 'ToolTip text',
	ToolTipBackgroundBrush: 'ToolTip background',
	ToolTipBorderBrush: 'ToolTip border',

	// The themed border thickness (1 in all three themes) and the themed font size
	// (12 in all three themes).
	ToolTipBorderThemeThickness: 'ToolTip border width',
	ToolTipContentThemeFontSize: 'ToolTip text size',

	// The theme-independent padding (9,6,9,8) and the theme-independent max width
	// (320). `ToolTipMaxWidth` is the `DOUBLE_LENGTHS` row.
	ToolTipBorderPadding: 'ToolTip padding inside its border',
	ToolTipMaxWidth: 'ToolTip, the width its content never exceeds'
};

/**
 * Keys InfoBadge reads — the fourteenth seed set, immediately after ToolTip.
 *
 * Its dictionary contains twelve resources, ten of which the default template reads:
 * foreground and background paint the root; the minimum and maximum dimensions constrain
 * its box; the value font size, padding, and three margins place its possible content.
 * `IconInfoBadgeIconMargin` remains here even though this component renders its narrowed
 * glyph source through the FontIcon-shaped path: it is one of the two margins the
 * template's display-kind states select, so this set records the dictionary surface rather
 * than only this implementation's reads.
 *
 * The two omitted resources are `InfoBadgeIconHeight` and `InfoBadgeIconWidth`. All three
 * dictionaries define them (height 8 in Default and 9 in Light/HighContrast; width 12),
 * but neither pin's template references either. They are unused upstream resources, not a
 * missing extraction: padding-and-margin arithmetic determines the drawn glyph box, which
 * is 8 in Light rather than the height resource's 9.
 */
export const INFOBADGE_KEYS = {
	InfoBadgeForeground: 'InfoBadge content',
	InfoBadgeBackground: 'InfoBadge fill',
	InfoBadgeMinHeight: 'InfoBadge dot height',
	InfoBadgeMinWidth: 'InfoBadge dot width',
	InfoBadgeMaxHeight: 'InfoBadge maximum height',
	InfoBadgeValueFontSize: 'InfoBadge value text size',
	InfoBadgePadding: 'InfoBadge root inset',
	IconInfoBadgeFontIconMargin: 'InfoBadge FontIcon inset',
	// The template's non-FontIcon display state selects this margin.
	IconInfoBadgeIconMargin: 'InfoBadge Icon inset',
	ValueInfoBadgeTextMargin: 'InfoBadge value text inset'
};

/**
 * Keys ProgressBar reads — the fifteenth seed set, immediately after InfoBadge.
 *
 * The current ProgressBar template reads these ten resources: its foreground, track and
 * border paints; the paused and error colors; the border thickness; and the three bar
 * dimensions plus the track radius. The two `...ForegroundColor` names are colors rather
 * than brushes because the upstream storyboards animate the SolidColorBrush color.
 *
 * Six other names begin with `ProgressBar`, but they are deliberately left out because
 * they are in `controls/dev/CommonStyles/Deprecated_themeresources.xaml`, not this
 * control's dictionary, and the current template references none of them:
 *
 * - `ProgressBarBackgroundThemeBrush`, `ProgressBarBorderThemeBrush`,
 *   `ProgressBarForegroundThemeBrush` and `ProgressBarIndeterminateForegroundThemeBrush`
 *   at :11–:14 are the pre-Fluent `*ThemeBrush` family, the same obsolete family other
 *   controls list in their own preambles.
 * - `ProgressBarThemeMinHeight` at :10 is the pre-Fluent 4px metric replaced by the
 *   current 3px `ProgressBarMinHeight`; choosing it would make the bar a third too tall.
 * - `ProgressBarIndicatorPauseOpacity` at :9 (0.6, and 1 under HighContrast) is the
 *   pre-Fluent opacity metric replaced by the current color swap.
 *
 * `ProgressBarTemplateSettings` also carries `EllipseAnimationEndPosition`,
 * `EllipseAnimationWellPosition`, `EllipseDiameter` and `EllipseOffset` at
 * `ProgressBar.idl:18-21`. The current template never binds them, and
 * `ProgressBar.cpp:248` marks them as template-setting properties from WUXC for backwards
 * compatibility, so there is nothing for them to paint here.
 */
export const PROGRESSBAR_KEYS = {
	ProgressBarForeground: 'ProgressBar determinate and indeterminate fill',
	ProgressBarBackground: 'ProgressBar unfilled track',
	ProgressBarBorderBrush: 'ProgressBar border',
	ProgressBarBorderThemeThickness: 'ProgressBar border width',
	ProgressBarPausedForegroundColor: 'ProgressBar paused fill',
	ProgressBarErrorForegroundColor: 'ProgressBar error fill',
	ProgressBarMinHeight: 'ProgressBar bar height',
	ProgressBarTrackHeight: 'ProgressBar unfilled track height',
	ProgressBarCornerRadius: 'ProgressBar bar corner radius',
	ProgressBarTrackCornerRadius: 'ProgressBar track corner radius'
};

/**
 * Keys ProgressRing reads — the sixteenth seed set, immediately after ProgressBar.
 *
 * The control's template reads these two brushes: the foreground for the arc and the
 * background for the track. The track is transparent in Light and Default and visible in
 * HighContrast because that is what the dictionary says; the track element remains in the
 * component in every theme.
 *
 * The dictionary has a third resource, `ProgressRingStrokeThickness`, set to `4` at
 * `ProgressRing_themeresources.xaml:17` and again at `.upstream/windows-app-sdk/generic.xaml:35861`.
 * No template in either pinned source references it, the same defined-but-unreferenced shape
 * as `InfoBadgeIconHeight` and `InfoBadgeIconWidth`. It does not describe the geometry the
 * control actually draws either: the determinate stroke is `2.655` and the indeterminate
 * stroke is `3` in a 32-unit box.
 *
 * The ring's geometry is not in a dictionary. It is in the two generated Lottie compositions
 * under `AnimatedVisuals/`, so this seed set is two brushes and nothing else. A reader looking
 * for the radius or stroke should continue to `ProgressRing.svelte`; neither key is an
 * `x:Double`, so there is no `DOUBLE_LENGTHS` row.
 *
 * `ProgressRingTemplateSettings` carries `EllipseDiameter`, `EllipseOffset` and
 * `MaxSideLength` at `ProgressRing.idl:8-12`, but the current template never binds them. The
 * idl marks them "TemplateSetting properties from WUXC for backwards compatibility".
 */
export const PROGRESSRING_KEYS = {
	ProgressRingForegroundThemeBrush: 'ProgressRing foreground arc',
	ProgressRingBackgroundThemeBrush: 'ProgressRing background track'
};

/**
 * Keys InfoBar reads — the seventeenth seed set, immediately after ProgressRing.
 *
 * `InfoBarCloseButtonSymbol` (`InfoBar_themeresources.xaml:87`) and
 * `InfoBarCloseButtonStyle` (`InfoBar_themeresources.xaml:88`) are deliberately absent: the
 * first is a `Symbol` and the second a `Style`, and the generator emits neither type. The
 * close button's glyph is Cancel, `E711`, which the component writes directly.
 * `InfoBarHyperlinkButtonMargin` is included even though this unit renders no
 * `HyperlinkButton`, because the token layer's job is the dictionary, not this component's
 * current use of it.
 */
export const INFOBAR_KEYS = {
	InfoBarErrorSeverityBackgroundBrush: 'InfoBar error severity background',
	InfoBarInformationalSeverityBackgroundBrush: 'InfoBar informational severity background',
	InfoBarWarningSeverityBackgroundBrush: 'InfoBar warning severity background',
	InfoBarSuccessSeverityBackgroundBrush: 'InfoBar success severity background',

	InfoBarErrorSeverityIconBackground: 'InfoBar error icon background',
	InfoBarInformationalSeverityIconBackground: 'InfoBar informational icon background',
	InfoBarWarningSeverityIconBackground: 'InfoBar warning icon background',
	InfoBarSuccessSeverityIconBackground: 'InfoBar success icon background',

	InfoBarErrorSeverityIconForeground: 'InfoBar error icon foreground',
	InfoBarInformationalSeverityIconForeground: 'InfoBar informational icon foreground',
	InfoBarWarningSeverityIconForeground: 'InfoBar warning icon foreground',
	InfoBarSuccessSeverityIconForeground: 'InfoBar success icon foreground',

	InfoBarTitleForeground: 'InfoBar title text',
	InfoBarMessageForeground: 'InfoBar message text',
	InfoBarHyperlinkButtonForeground: 'InfoBar HyperlinkButton text',
	InfoBarBorderBrush: 'InfoBar border',
	InfoBarBorderThickness: 'InfoBar border width',

	InfoBarTitleFontSize: 'InfoBar title text size',
	InfoBarTitleFontWeight: 'InfoBar title text weight',
	InfoBarMessageFontSize: 'InfoBar message text size',
	InfoBarMessageFontWeight: 'InfoBar message text weight',
	InfoBarMinHeight: 'InfoBar minimum height',
	InfoBarCloseButtonSize: 'InfoBar close button size',
	InfoBarCloseButtonGlyphSize: 'InfoBar close button glyph size',

	InfoBarHyperlinkButtonMargin: 'InfoBar HyperlinkButton margin',
	InfoBarIconBackgroundGlyph: 'InfoBar icon background glyph',
	InfoBarInformationalIconGlyph: 'InfoBar informational icon glyph',
	InfoBarErrorIconGlyph: 'InfoBar error icon glyph',
	InfoBarWarningIconGlyph: 'InfoBar warning icon glyph',
	InfoBarSuccessIconGlyph: 'InfoBar success icon glyph',

	InfoBarContentRootPadding: 'InfoBar content root padding',
	InfoBarIconMargin: 'InfoBar icon margin',
	InfoBarIconFontSize: 'InfoBar icon size',
	InfoBarPanelMargin: 'InfoBar panel margin',
	InfoBarPanelHorizontalOrientationPadding: 'InfoBar horizontal panel padding',
	InfoBarPanelVerticalOrientationPadding: 'InfoBar vertical panel padding',
	InfoBarTitleHorizontalOrientationMargin: 'InfoBar title horizontal margin',
	InfoBarTitleVerticalOrientationMargin: 'InfoBar title vertical margin',
	InfoBarMessageHorizontalOrientationMargin: 'InfoBar message horizontal margin',
	InfoBarMessageVerticalOrientationMargin: 'InfoBar message vertical margin',
	InfoBarActionHorizontalOrientationMargin: 'InfoBar action horizontal margin',
	InfoBarActionVerticalOrientationMargin: 'InfoBar action vertical margin'
};

/**
 * Keys Expander reads — the eighteenth seed set, and the first of the Surfaces tranche.
 *
 * The dictionary is unusually regular: twenty-two themed resources in three parallel
 * families — nine for the header ToggleButton, nine for the chevron button inside it, and
 * two for the content border — plus two themed thicknesses, then twelve theme-independent
 * records. All twenty-two are seeded, including the six the reproduction resolves to the
 * same value as another state, because this set records the dictionary's surface rather
 * than this implementation's reads. Measured on the reference guest, only the chevron's
 * background changes under the pointer: the header's own fill is one brush in every state,
 * and `ExpanderHeaderBackground` has no `PointerOver` or `Pressed` sibling to change to.
 *
 * Two of the twelve theme-independent records are deliberately absent.
 * `ExpanderHeaderHorizontalContentAlignment` and `ExpanderHeaderVerticalContentAlignment`
 * are `HorizontalAlignment` and `VerticalAlignment` records, and the generator emits
 * neither type — the same reason `Symbol` and `Style` records never reach the layer. Their
 * values (Stretch and Center) are layout decisions the component states in CSS.
 *
 * `FlyoutThemeMinWidth` is not in this dictionary at all. The Expander's own style binds
 * its `MinWidth` to it (`Expander.xaml:20`), and it is defined once in the framework
 * dictionary at `generic.xaml:56` as 96 in all three themes. It is seeded here because
 * this is the control that reads it; the first surface control to need it would otherwise
 * find a hole.
 */
/**
 * Keys more than one pinned dictionary defines, and the file each one's definition is read
 * from. Every record of that key in any other file is dropped before selection.
 *
 * This exists because `Deprecated_themeresources.xaml` and its `_any` sibling carry a
 * pre-Fluent vocabulary that reuses four of the current Expander's names, and the two
 * deprecated files also duplicate each other — twenty-one key/theme pairs are defined in
 * both. Without a rule the generator stops on `defined twice`, which is the right default:
 * keeping whichever record sorted first would answer a precedence question silently.
 *
 * The rule is not "prefer the newer file". It is a measurement. Three of the four agree on
 * their value anyway — 48, `16`, `16,0,0,0` — so only `ExpanderHeaderBackground` decides
 * anything, and the deprecated files give it `Transparent` while the Expander's own
 * dictionary aliases it onto `CardBackgroundFillColorDefaultBrush`. On the reference guest
 * the Gallery's Expander header measures `#FBFBFB`, which is that alias in the light theme
 * and is not transparent over the `#F3F3F3` behind it. The control's own dictionary is what
 * WinUI paints from, so it is what this layer emits from.
 *
 * A row whose file defines no record of the key stops the run. That is the failure mode
 * worth guarding: a re-pin that moves a definition would otherwise leave a row silently
 * selecting nothing and the duplicate returning.
 */
export const DEFINED_BY = {
	FlipViewItemBackground: 'controls/dev/CommonStyles/FlipViewItem_themeresources.xaml',
	AppBarThemeMinHeight: 'controls/dev/CommonStyles/CommandBar_themeresources.xaml',
	AppBarThemeCompactHeight: 'controls/dev/CommonStyles/CommandBar_themeresources.xaml',
	ExpanderHeaderBackground: 'controls/dev/Expander/Expander_themeresources.xaml',
	ExpanderMinHeight: 'controls/dev/Expander/Expander_themeresources.xaml',
	ExpanderHeaderPadding: 'controls/dev/Expander/Expander_themeresources.xaml',
	ExpanderContentPadding: 'controls/dev/Expander/Expander_themeresources.xaml'
};

/**
 * Keys Flyout reads — the nineteenth seed set, and the second of the Surfaces tranche.
 *
 * `FlyoutPresenter_themeresources.xaml` is unusually complete: `DefaultFlyoutPresenterStyle`
 * at `:22` is the whole visual, and its template at `:43` is one `Border` with a background,
 * a border, a corner radius and `BackgroundSizing="InnerBorderEdge"` around a `ScrollViewer`.
 * Every value it sets is here except the two the layer already emits — `OverlayCornerRadius`
 * from the corner-radius dictionary, and `FlyoutThemeMinWidth`, which the Expander's set
 * brought in from the framework dictionary because `Expander.xaml:19` reads it too.
 *
 * `FlyoutThemeTouchMinWidth` is defined beside the other four sizes and is deliberately
 * absent: no style in the pinned source references it, and this selection records what a
 * control reads rather than what its neighbourhood defines.
 */
export const FLYOUT_KEYS = {
	FlyoutPresenterBackground: 'the flyout surface',
	FlyoutBorderThemeBrush: 'the flyout border',
	FlyoutBorderThemeThickness: 'the flyout border width — 1, and 2 under high contrast',
	FlyoutContentPadding: 'the inset around the flyout content',
	FlyoutThemeMaxWidth: 'the width a flyout never exceeds',
	FlyoutThemeMinHeight: 'the floor under a flyout',
	FlyoutThemeMaxHeight: 'the height a flyout never exceeds, past which it scrolls'
};

export const EXPANDER_KEYS = {
	// The header ToggleButton. Foreground has three states and border brush three; the
	// background has one, which is why there is no `ExpanderHeaderBackgroundPointerOver`.
	ExpanderHeaderBackground: 'the header fill',
	ExpanderHeaderForeground: 'the header text',
	ExpanderHeaderForegroundPointerOver: 'the header text under the pointer',
	ExpanderHeaderForegroundPressed: 'the header text while pressed',
	ExpanderHeaderBorderBrush: 'the header border',
	ExpanderHeaderBorderPointerOverBrush: 'the header border under the pointer',
	ExpanderHeaderBorderPressedBrush: 'the header border while pressed',
	ExpanderHeaderDisabledForeground: 'the header text when disabled',
	ExpanderHeaderDisabledBorderBrush: 'the header border when disabled',
	ExpanderHeaderBorderThickness: 'the header border width',

	// The chevron button. This is the one part that reacts to the pointer.
	ExpanderChevronBackground: 'the chevron button fill',
	ExpanderChevronPointerOverBackground: 'the chevron button fill under the pointer',
	ExpanderChevronPressedBackground: 'the chevron button fill while pressed',
	ExpanderChevronForeground: 'the chevron glyph',
	ExpanderChevronPointerOverForeground: 'the chevron glyph under the pointer',
	ExpanderChevronPressedForeground: 'the chevron glyph while pressed',
	ExpanderChevronBorderBrush: 'the chevron button border',
	ExpanderChevronBorderPointerOverBrush: 'the chevron button border under the pointer',
	ExpanderChevronBorderPressedBrush: 'the chevron button border while pressed',
	ExpanderChevronBorderThickness: 'the chevron button border width',

	// The content border.
	ExpanderContentBackground: 'the content fill',
	ExpanderContentBorderBrush: 'the content border',

	// The theme-independent records. The two border thicknesses are the direction switch:
	// expanding downward the content has no top border, expanding upward no bottom one.
	ExpanderMinHeight: 'the header row, and the floor under the content',
	ExpanderHeaderPadding: 'the inset before the header content',
	ExpanderChevronMargin: 'the gap around the chevron button',
	ExpanderChevronUpGlyph: 'the chevron pointing up',
	ExpanderChevronDownGlyph: 'the chevron pointing down',
	ExpanderChevronButtonSize: 'the chevron button box',
	ExpanderChevronGlyphSize: 'the chevron glyph',
	ExpanderContentPadding: 'the inset around the content',
	ExpanderContentDownBorderThickness: 'the content border expanding downward',
	ExpanderContentUpBorderThickness: 'the content border expanding upward',
	FlyoutThemeMinWidth: "the floor under the Expander's own width, `Expander.xaml:20`"
};

/**
 * Keys BreadcrumbBar reads. `BreadcrumbBarChevronRightToLeft` is absent because this unit does
 * not build RTL (`BreadcrumbBar.xaml:82-85` and :103-108). `BreadcrumbBarFocusForegroundBrush`
 * and `BreadcrumbBarCurrentFocusForegroundBrush` are absent because their declared states
 * (`BreadcrumbBar.xaml:232-240`) cannot be composed by `UpdateButtonCommonVisualState`
 * (`BreadcrumbBarItem.cpp:390-424`). `BreadcrumbBarCurrentHoverForegroundBrush`,
 * `BreadcrumbBarCurrentPressedForegroundBrush` and `BreadcrumbBarCurrentDisabledForegroundBrush`
 * are absent because they paint `PART_ItemButton` (`BreadcrumbBar.xaml:201-229`), which
 * `LastItem` collapses (`BreadcrumbBar.xaml:87-95`).
 */
export const BREADCRUMBBAR_KEYS = {
	BreadcrumbBarBackgroundBrush: 'BreadcrumbBar item background',
	BreadcrumbBarBorderBrush: 'BreadcrumbBar item border',
	BreadcrumbBarItemThemeFontSize: 'BreadcrumbBar item text size',
	BreadcrumbBarItemFontWeight: 'BreadcrumbBar item text weight',
	BreadcrumbBarNormalForegroundBrush: 'BreadcrumbBar item text, at rest',
	BreadcrumbBarHoverForegroundBrush: 'BreadcrumbBar item text under the pointer',
	BreadcrumbBarPressedForegroundBrush: 'BreadcrumbBar item text while pressed',
	BreadcrumbBarDisabledForegroundBrush: 'BreadcrumbBar item text when disabled',
	BreadcrumbBarCurrentNormalForegroundBrush: 'BreadcrumbBar current item text',
	BreadcrumbBarChevronFontSize: 'BreadcrumbBar chevron size',
	BreadcrumbBarChevronPadding: 'BreadcrumbBar chevron inset',
	BreadcrumbBarChevronLeftToRight: 'BreadcrumbBar left-to-right chevron',
	BreadcrumbBarEllipsisDropDownItemBackground: 'BreadcrumbBar ellipsis row, at rest',
	BreadcrumbBarEllipsisDropDownItemBackgroundPointerOver:
		'BreadcrumbBar ellipsis row under the pointer',
	BreadcrumbBarEllipsisDropDownItemBackgroundPressed: 'BreadcrumbBar ellipsis row while pressed',
	BreadcrumbBarEllipsisDropDownItemBackgroundDisabled: 'BreadcrumbBar ellipsis row when disabled',
	BreadcrumbBarEllipsisDropDownItemForegroundPointerOver:
		'BreadcrumbBar ellipsis row text under the pointer',
	BreadcrumbBarEllipsisDropDownItemForegroundPressed:
		'BreadcrumbBar ellipsis row text while pressed',
	BreadcrumbBarEllipsisDropDownItemForegroundDisabled:
		'BreadcrumbBar ellipsis row text when disabled',
	BreadcrumbBarForegroundBrush: 'BreadcrumbBar ellipsis row text, at rest',
	BreadcrumbBarEllipsisFlyoutPresenterBackground: 'BreadcrumbBar ellipsis flyout surface',
	BreadcrumbBarEllipsisFlyoutPresenterBorderBrush: 'BreadcrumbBar ellipsis flyout border',
	BreadcrumbBarEllipsisFlyoutPresenterBorderThemeThickness:
		'BreadcrumbBar ellipsis flyout border width'
};

/**
 * Keys SelectorBar reads. `SelectorBarBackground` and `SelectorBarBorderThickness` are absent
 * because the bar template binds them from properties nothing sets (`SelectorBar.xaml:17-21`);
 * `SelectorBarSelectedInnerThickness` is absent because it is `PART_CommonVisual`'s stroke
 * width (`SelectorBar.xaml:216-227`), and that part draws nothing.
 *
 * `SelectorBarItemBorderThickness` and all five `SelectorBarItemBorderBrush*` keys are absent
 * for the same reason one step further out: `SelectorBar.xaml:50-51` sets `BorderBrush` and
 * `BorderThickness` on the item's Style, and the item's template binds **neither**.
 * `PART_ContainerRoot` (`:64`) takes only `Background` and `CornerRadius`, and the single
 * element that names a border brush is `PART_CommonVisual` (`:221`) — the part that draws
 * nothing. A border here is not merely invisible, it is 2px of width per item that the
 * original never spends.
 *
 * Every background brush below is `SystemControlTransparentBrush` in Default, Light and
 * HighContrast (`SelectorBar_themeresources.xaml:8-24`, `:39-55`, `:70-86`), and those are
 * kept: `PART_ContainerRoot.Background` is genuinely animated by the six combined states, so
 * a consumer overriding one through the cascade gets the fill the states would paint.
 */
export const SELECTORBAR_KEYS = {
	SelectorBarPadding: 'SelectorBar outer inset',
	SelectorBarItemPadding: 'SelectorBarItem content inset',
	SelectorBarItemSpacing: 'SelectorBarItem icon-to-text gap',
	SelectorBarItemIconVisualMargin: 'SelectorBarItem icon margin',
	SelectorBarItemIconScale: 'SelectorBarItem icon scale',
	SelectorBarItemTextVisualMargin: 'SelectorBarItem text margin',
	SelectorBarItemSelectionVisualMargin: 'SelectorBarItem pill margin',
	SelectorBarItemFocusVisualMargin: 'SelectorBarItem focus band margin',
	SelectorBarItemPillWidth: 'SelectorBarItem pill base width',
	SelectorBarItemPillHeight: 'SelectorBarItem pill height',
	SelectorBarItemPillFill: 'SelectorBarItem selected pill',
	SelectorBarItemDisabledPillFill: 'SelectorBarItem disabled selected pill',
	SelectorBarItemForeground: 'SelectorBarItem foreground, at rest',
	SelectorBarItemForegroundPointerOver: 'SelectorBarItem foreground under the pointer',
	SelectorBarItemForegroundSelected: 'SelectorBarItem selected foreground',
	SelectorBarItemForegroundPressed: 'SelectorBarItem foreground while pressed',
	SelectorBarItemForegroundDisabled: 'SelectorBarItem disabled foreground',
	SelectorBarItemBackground: 'SelectorBarItem background, at rest',
	SelectorBarItemBackgroundPointerOver: 'SelectorBarItem background under the pointer',
	SelectorBarItemBackgroundSelected: 'SelectorBarItem selected background',
	SelectorBarItemBackgroundPressed: 'SelectorBarItem background while pressed',
	SelectorBarItemBackgroundDisabled: 'SelectorBarItem disabled background'
};

/**
 * Keys Pivot reads — the third seed set of the Navigation tranche, after BreadcrumbBar and
 * SelectorBar.
 *
 * `PivotHeaderItemCharacterSpacing` (`Pivot_themeresources.xaml:10`) is absent, and it is the
 * omission worth reading first because a reader who checks the Style will expect it. The Style
 * sets it (`:479`) and **the template binds nothing to it**: the item's ContentPresenter
 * (`:586`) binds FontSize, FontFamily and FontWeight and stops. The difference is measurable
 * and was measured — the original's four header labels have content-box widths of 26, 75 and
 * 82px for All, Unread and Flagged, which is `letter-spacing: normal` at 24px to within half a
 * pixel and 3 to 6px per label wider than the −0.025em that `CharacterSpacing="-25"` means.
 *
 * `PivotHeaderItemLockedTranslation` (`:8`) and the navigation
 * buttons (`PivotNavButtonBorderThemeThickness` (`:14`), `PivotNavButtonMargin` (`:15`),
 * `PivotNextButtonBackground`, `PivotNextButtonBackgroundPointerOver`,
 * `PivotNextButtonBackgroundPressed`, `PivotNextButtonBorderBrush`,
 * `PivotNextButtonBorderBrushPointerOver`, `PivotNextButtonBorderBrushPressed`,
 * `PivotNextButtonForeground`, `PivotNextButtonForegroundPointerOver`,
 * `PivotNextButtonForegroundPressed` (`:21-29`), `PivotPreviousButtonBackground`,
 * `PivotPreviousButtonBackgroundPointerOver`, `PivotPreviousButtonBackgroundPressed`,
 * `PivotPreviousButtonBorderBrush`, `PivotPreviousButtonBorderBrushPointerOver`,
 * `PivotPreviousButtonBorderBrushPressed`, `PivotPreviousButtonForeground`,
 * `PivotPreviousButtonForegroundPointerOver`, and `PivotPreviousButtonForegroundPressed`
 * (`:30-38`)) are declined by WD-021.
 *
 * `PivotLandscapeThemePadding` (`:13`) equals Portrait in every dictionary, so the template's
 * Orientation group (`:243`) cannot change a pixel and only Portrait is read. The unreferenced
 * `PivotHeaderItemFocusPipeFill` (`:54`) is absent because the template only fills SelectedPipe.
 *
 * The pre-Fluent `*ThemeBrush` family (`:56-69`) is absent because no current template reads it:
 * PivotForegroundThemeBrush, PivotHeaderBackgroundSelectedBrush,
 * PivotHeaderBackgroundUnselectedBrush, PivotHeaderForegroundSelectedBrush,
 * PivotHeaderForegroundUnselectedBrush, PivotNavButtonBackgroundThemeBrush,
 * PivotNavButtonBorderThemeBrush, PivotNavButtonForegroundThemeBrush,
 * PivotNavButtonPointerOverBackgroundThemeBrush, PivotNavButtonPointerOverBorderThemeBrush,
 * PivotNavButtonPointerOverForegroundThemeBrush, PivotNavButtonPressedBackgroundThemeBrush,
 * PivotNavButtonPressedBorderThemeBrush, and PivotNavButtonPressedForegroundThemeBrush.
 */
export const PIVOT_KEYS = {
	PivotBackground: 'Pivot background',
	PivotHeaderBackground: 'Pivot header background',
	PivotItemBackground: 'PivotItem background',
	PivotItemMargin: 'PivotItem panel margin',
	PivotPortraitThemePadding: 'Pivot title margin',
	PivotTitleFontSize: 'Pivot title font size',
	PivotTitleThemeFontWeight: 'Pivot title font weight',
	PivotHeaderItemFontSize: 'PivotHeaderItem font size',
	PivotHeaderItemThemeFontWeight: 'PivotHeaderItem font weight',
	PivotHeaderItemMargin: 'PivotHeaderItem padding',
	PivotHeaderItemBackgroundUnselected: 'PivotHeaderItem unselected background',
	PivotHeaderItemBackgroundUnselectedPointerOver: 'PivotHeaderItem unselected hover background',
	PivotHeaderItemBackgroundUnselectedPressed: 'PivotHeaderItem unselected pressed background',
	PivotHeaderItemBackgroundSelected: 'PivotHeaderItem selected background',
	PivotHeaderItemBackgroundSelectedPointerOver: 'PivotHeaderItem selected hover background',
	PivotHeaderItemBackgroundSelectedPressed: 'PivotHeaderItem selected pressed background',
	PivotHeaderItemBackgroundDisabled: 'PivotHeaderItem disabled background',
	PivotHeaderItemForegroundUnselected: 'PivotHeaderItem unselected foreground',
	PivotHeaderItemForegroundUnselectedPointerOver: 'PivotHeaderItem unselected hover foreground',
	PivotHeaderItemForegroundUnselectedPressed: 'PivotHeaderItem unselected pressed foreground',
	PivotHeaderItemForegroundSelected: 'PivotHeaderItem selected foreground',
	PivotHeaderItemForegroundSelectedPointerOver: 'PivotHeaderItem selected hover foreground',
	PivotHeaderItemForegroundSelectedPressed: 'PivotHeaderItem selected pressed foreground',
	PivotHeaderItemForegroundDisabled: 'PivotHeaderItem disabled foreground',
	PivotHeaderItemSelectedPipeFill: 'PivotHeaderItem selected pipe fill',
	PivotHeaderItemSelectedPipeCornerRadius: 'PivotHeaderItem selected pipe radius'
};

/**
 * Keys TabView and TabViewItem read — the strip, its direct item rendering, and the selected
 * item's geometry. `TabViewBackground` is the strip's own Background; the rest map to the
 * corresponding template paint, metrics, and visual states.
 *
 * `TabViewButtonBackgroundActiveTab` and `TabViewButtonForegroundActiveTab`
 * (`TabView_themeresources.xaml:66-67`, `:144-145`, `:222-223`) are absent because they are
 * defined in all three themes and in the framework dictionary but are referenced by nothing
 * in this pin. `TabViewItemScrollButtonPadding` (`:258`) is absent because
 * `TabViewScrollButtonStyle` (`TabView.xaml:583-596`) and its template bind no Padding.
 * `TabViewItemHeaderCloseButtonSize` (`:250`) is defined but referenced by nothing. The
 * `TabViewScrollButton*` family has no border-thickness key of its own: the scroll style reads
 * `TabViewButtonBorderThickness` (`TabView.xaml:592`), the add button's key.
 *
 * **`TabViewItemHeaderPadding` is absent, and its two variants are here instead.** The item's
 * Style binds it as `TabContainer.Padding` (`TabView.xaml:562`), and then the `CloseIconStates`
 * group (`:492-503`) overwrites it in *both* of its states —
 * `TabViewItemHeaderPaddingWithCloseButton` (`8,3,4,3`, identical to it) when the close button
 * shows and `TabViewItemHeaderPaddingWithoutCloseButton` (`8,3,8,3`) when it is collapsed.
 * `TabViewItem::UpdateCloseButton` (`TabViewItem.cpp:251-282`) enters one of the two on load and
 * on every change, so the Style's own value is never the effective one and a tab whose
 * `IsClosable` is false is 4px wider on the right than seeding the base key would draw it.
 *
 * `TabViewSelectedItemHeaderPadding` (`TabView_themeresources.xaml:241`) is absent for the
 * neighbouring reason: nothing binds it at all. The Selected state changes
 * `TabViewSelectedItemHeaderMargin`, not the padding. Likewise,
 * `TabViewItemHeaderFontSize` (`TabView_themeresources.xaml:245`) is absent because the label
 * carries `winui-CaptionTextBlockStyle`, whose 12px Small face is the measured source of its
 * typography. `TabViewItemHeaderDragBackground` (`TabView.xaml:554`) and `TabViewShadowDepth`
 * are declined by WD-023.
 */
export const TABVIEW_KEYS = {
	TabViewBackground: 'TabView strip background',
	TabViewBorderBrush: 'TabView strip and selected tab border',
	TabViewHeaderPadding: 'TabView tab list padding',
	TabViewItemHeaderBackground: 'TabViewItem resting background',
	TabViewItemHeaderBackgroundSelected: 'TabViewItem selected background',
	TabViewItemHeaderBackgroundPointerOver: 'TabViewItem hover background',
	TabViewItemHeaderBackgroundPressed: 'TabViewItem pressed background',
	TabViewItemHeaderBackgroundDisabled: 'TabViewItem disabled background',
	TabViewItemHeaderForeground: 'TabViewItem resting label foreground',
	TabViewItemHeaderForegroundSelected: 'TabViewItem selected label foreground',
	TabViewItemHeaderForegroundPointerOver: 'TabViewItem hover label foreground',
	TabViewItemHeaderForegroundPressed: 'TabViewItem pressed label foreground',
	TabViewItemHeaderForegroundDisabled: 'TabViewItem disabled label foreground',
	TabViewItemIconForeground: 'TabViewItem resting icon foreground',
	TabViewItemIconForegroundSelected: 'TabViewItem selected icon foreground',
	TabViewItemIconForegroundPointerOver: 'TabViewItem hover icon foreground',
	TabViewItemIconForegroundPressed: 'TabViewItem pressed icon foreground',
	TabViewItemIconForegroundDisabled: 'TabViewItem disabled icon foreground',
	TabViewItemHeaderCloseButtonBackground: 'TabViewItem resting close button background',
	TabViewItemHeaderCloseButtonBackgroundPointerOver: 'TabViewItem close button hover background',
	TabViewItemHeaderCloseButtonBackgroundPressed: 'TabViewItem close button pressed background',
	TabViewItemHeaderCloseButtonForeground: 'TabViewItem resting close button foreground',
	TabViewItemHeaderCloseButtonForegroundPointerOver: 'TabViewItem close button hover foreground',
	TabViewItemHeaderCloseButtonForegroundPressed: 'TabViewItem close button pressed foreground',
	TabViewItemHeaderPointerOverCloseButtonBackground: 'TabViewItem hover close button background',
	TabViewItemHeaderPointerOverCloseButtonForeground: 'TabViewItem hover close button foreground',
	TabViewItemHeaderPressedCloseButtonBackground: 'TabViewItem pressed close button background',
	TabViewItemHeaderPressedCloseButtonForeground: 'TabViewItem pressed close button foreground',
	TabViewItemHeaderSelectedCloseButtonBackground: 'TabViewItem selected close button background',
	TabViewItemHeaderSelectedCloseButtonForeground: 'TabViewItem selected close button foreground',
	TabViewItemHeaderDisabledCloseButtonBackground: 'TabViewItem disabled close button background',
	TabViewItemHeaderDisabledCloseButtonForeground: 'TabViewItem disabled close button foreground',
	TabViewItemSeparator: 'TabViewItem separator',
	TabViewItemSeparatorMargin: 'TabViewItem separator inset',
	TabViewItemHeaderPaddingWithCloseButton: 'TabViewItem padding while its close button shows',
	TabViewItemHeaderPaddingWithoutCloseButton:
		'TabViewItem padding while its close button is collapsed',
	TabViewItemHeaderIconSize: 'TabViewItem icon box size',
	TabViewItemHeaderIconMargin: 'TabViewItem icon trailing margin',
	TabViewItemHeaderCloseButtonHeight: 'TabViewItem close button height',
	TabViewItemHeaderCloseButtonWidth: 'TabViewItem close button width',
	TabViewItemHeaderCloseFontSize: 'TabViewItem close glyph size',
	TabViewItemHeaderCloseMargin: 'TabViewItem close button margin',
	TabViewItemMinHeight: 'TabViewItem minimum height',
	TabViewItemMinWidth: 'TabViewItem minimum width',
	TabViewItemMaxWidth: 'TabViewItem maximum width',
	TabViewItemBorderThickness: 'TabViewItem resting border width',
	TabViewSelectedItemBorderThickness: 'TabViewItem selected border width',
	TabViewSelectedItemHeaderMargin: 'TabViewItem selected header margin',

	// The add button's four brush states and shared border thickness.
	TabViewButtonBackground: 'TabView add button resting background',
	TabViewButtonBackgroundPointerOver: 'TabView add button hover background',
	TabViewButtonBackgroundPressed: 'TabView add button pressed background',
	TabViewButtonBackgroundDisabled: 'TabView add button disabled background',
	TabViewButtonForeground: 'TabView add button resting foreground',
	TabViewButtonForegroundPointerOver: 'TabView add button hover foreground',
	TabViewButtonForegroundPressed: 'TabView add button pressed foreground',
	TabViewButtonForegroundDisabled: 'TabView add button disabled foreground',
	TabViewButtonBorderBrush: 'TabView add button resting border',
	TabViewButtonBorderBrushPointerOver: 'TabView add button hover border',
	TabViewButtonBorderBrushPressed: 'TabView add button pressed border',
	TabViewButtonBorderBrushDisabled: 'TabView add button disabled border',
	TabViewButtonBorderThickness: 'TabView add and scroll button border width',

	// The scroll buttons' four brush states.
	TabViewScrollButtonBackground: 'TabView scroll button resting background',
	TabViewScrollButtonBackgroundPointerOver: 'TabView scroll button hover background',
	TabViewScrollButtonBackgroundPressed: 'TabView scroll button pressed background',
	TabViewScrollButtonBackgroundDisabled: 'TabView scroll button disabled background',
	TabViewScrollButtonForeground: 'TabView scroll button resting foreground',
	TabViewScrollButtonForegroundPointerOver: 'TabView scroll button hover foreground',
	TabViewScrollButtonForegroundPressed: 'TabView scroll button pressed foreground',
	TabViewScrollButtonForegroundDisabled: 'TabView scroll button disabled foreground',
	TabViewScrollButtonBorderBrush: 'TabView scroll button resting border',
	TabViewScrollButtonBorderBrushPointerOver: 'TabView scroll button hover border',
	TabViewScrollButtonBorderBrushPressed: 'TabView scroll button pressed border',
	TabViewScrollButtonBorderBrushDisabled: 'TabView scroll button disabled border',

	// The add and scroll button metrics and their containers.
	TabViewItemAddButtonWidth: 'TabView add button width',
	TabViewItemAddButtonHeight: 'TabView add button height',
	TabViewItemAddButtonFontSize: 'TabView add button glyph size',
	TabViewItemAddButtonContainerPadding: 'TabView add button container padding',
	TabViewItemScrollButtonWidth: 'TabView scroll button width',
	TabViewItemScrollButtonHeight: 'TabView scroll button height',
	// `Buton`, one t, is how upstream spells it (`TabView_themeresources.xaml:257`, read by
	// `TabView.xaml:159`, `:165` and `:587`). ADR 0006 keeps the WinUI key verbatim, so the
	// misspelling is the name — correcting it here changes the emitted custom property, which
	// is what C2 compares against the generator and what a consumer overrides.
	TabViewItemScrollButonFontSize: 'TabView scroll button glyph size',
	TabViewItemLeftScrollButtonContainerPadding: 'TabView left scroll button container padding',
	TabViewItemRightScrollButtonContainerPadding: 'TabView right scroll button container padding'
};

/**
 * Keys the menu surface and its three plainest items read — the twentieth seed set, and the
 * fourth of the Surfaces tranche. `MenuFlyout_themeresources.xaml` is 1050 lines and most of
 * it is for a later unit or for no unit at all.
 *
 * Four of its families are deliberately absent. The `*Reveal*` sets are Reveal material,
 * which nothing here can express; the `*ThemeBrush` set at `:51-58` is pre-Fluent and writes
 * `#FF212121` by hand; `MenuFlyoutLightDismissOverlayBackground` is the overlay a menu does
 * not draw on desktop; and the sub-item, keyboard-accelerator, split-item and chevron
 * families belong to unit 044b, whose controls are the ones that read them.
 *
 * `MenuFlyoutSystemBackdrop` is absent for a different reason: it resolves to
 * `AcrylicBackgroundFillColorDefaultBackdrop`, which `AcrylicBrush_themeresources.xaml:54`
 * defines as a bare `<DesktopAcrylicBackdrop />` — an element with no value to convert. It
 * is what actually paints the card, because `MenuFlyoutPresenterBackground` resolves to
 * `DesktopAcrylicTransparentBrush`, `#00000000` in all three themes. The surface therefore
 * paints `AcrylicBackgroundFillColorDefaultBrush`, which the layer already emits, and
 * composites the presenter's own brush over it: `#f9f9f9` is the measured fill to the byte,
 * and the consumer keeps the override point the presenter's key is.
 *
 * `MenuFlyoutItemThemePadding` `11,8,11,9` is absent and `…Narrow` `11,4,11,5` is present,
 * which is the opposite of what the names suggest. The template's own comment settles it —
 * narrow padding is what a flyout invoked with pen, mouse or keyboard draws, and the wide
 * form is for touch — and the ruler agrees: 4 + 19 + 5 is the 28-tall item box measured on
 * the guest. A control with no pointer-device state reads one of the two, and this is it.
 * WD-013.
 *
 * `MenuFlyoutItemDoublePlaceholderThemeThickness` `56,0,0,0` is the gutter for a menu with
 * both a check column and an icon column. 044a has no icons, so 044a does not read it.
 */
export const MENUFLYOUT_KEYS = {
	// The surface. Its corner radius is `OverlayCornerRadius` and its floor width is
	// `FlyoutThemeMinWidth`, both of which the layer already emits.
	MenuFlyoutPresenterBackground: 'the menu surface, over the backdrop it does not paint',
	MenuFlyoutPresenterBorderBrush: 'the menu border',
	MenuFlyoutPresenterBorderThemeThickness: 'the menu border width',
	MenuFlyoutPresenterThemePadding: 'the inset between the border and the first item',
	MenuFlyoutThemeMinHeight: 'the floor under the menu surface',

	// An item. `MenuFlyoutItemBackgroundBrush` is the border brush despite its name, which
	// is upstream's spelling and not a transcription slip.
	MenuFlyoutItemBackground: 'an item at rest',
	MenuFlyoutItemBackgroundPointerOver: 'an item under the pointer',
	MenuFlyoutItemBackgroundPressed: 'an item while pressed',
	MenuFlyoutItemBackgroundDisabled: 'a disabled item',
	MenuFlyoutItemBackgroundBrush: "an item's border",
	MenuFlyoutItemForeground: "an item's text",
	MenuFlyoutItemForegroundPointerOver: "an item's text under the pointer",
	MenuFlyoutItemForegroundPressed: "an item's text while pressed",
	MenuFlyoutItemForegroundDisabled: "a disabled item's text",
	MenuFlyoutItemBorderThickness: "an item's border width",
	MenuFlyoutItemMargin: 'the gap between an item box and the surface edge',
	MenuFlyoutItemThemePaddingNarrow: "the inset around an item's text",
	MenuFlyoutItemPlaceholderThemeThickness: 'the gutter an item reserves for a check',

	// The separator. Its padding is negative on both sides, which is how a rule 4px wider
	// than the item boxes reaches the surface's inner edge.
	MenuFlyoutSeparatorBackground: 'the rule between two groups of items',
	MenuFlyoutSeparatorHeight: 'the rule',
	MenuFlyoutSeparatorThemePadding: 'the gap above and below the rule, and its overhang',

	// A toggle item. Its pointer-over, pressed and disabled states read the *sub-item*
	// brushes rather than the item ones, and its check glyph takes the sub-item chevron's
	// colour. That is `DefaultToggleMenuFlyoutItemStyle` as written, not a mis-reading.
	MenuFlyoutSubItemBackgroundPointerOver: 'a toggle item under the pointer',
	MenuFlyoutSubItemBackgroundPressed: 'a toggle item while pressed',
	MenuFlyoutSubItemForegroundPressed: "a toggle item's text while pressed",
	MenuFlyoutSubItemForegroundDisabled: "a disabled toggle item's text",
	MenuFlyoutSubItemChevron: "a toggle item's checkmark",

	// The accelerator label. Two parallel families, because `MenuFlyoutItem` and
	// `ToggleMenuFlyoutItem` each name their own — identical in value, and the templates
	// read them separately rather than sharing one.
	MenuFlyoutItemKeyboardAcceleratorTextForeground: "an item's accelerator label",
	MenuFlyoutItemKeyboardAcceleratorTextForegroundPointerOver:
		"an item's accelerator label under the pointer",
	MenuFlyoutItemKeyboardAcceleratorTextForegroundPressed:
		"an item's accelerator label while pressed",
	MenuFlyoutItemKeyboardAcceleratorTextForegroundDisabled: "a disabled item's accelerator label",
	ToggleMenuFlyoutItemKeyboardAcceleratorTextForeground: "a toggle item's accelerator label",
	ToggleMenuFlyoutItemKeyboardAcceleratorTextForegroundPointerOver:
		"a toggle item's accelerator label under the pointer",
	ToggleMenuFlyoutItemKeyboardAcceleratorTextForegroundPressed:
		"a toggle item's accelerator label while pressed",
	ToggleMenuFlyoutItemKeyboardAcceleratorTextForegroundDisabled:
		"a disabled toggle item's accelerator label",

	// The gutter a menu holding both a check column and an icon column reserves. 044a left
	// it out because a menu with no icons cannot reach the state; the icon unit is what
	// reaches it.
	MenuFlyoutItemDoublePlaceholderThemeThickness:
		'the gutter an item reserves for a check and an icon together',

	// The sub item — a row that opens a menu of its own. Five of its family were already here,
	// because `DefaultToggleMenuFlyoutItemStyle` reads them for a row that opens nothing; these
	// are the rest, including the fourth state no other row has.
	MenuFlyoutSubItemBackground: 'a sub item at rest',
	MenuFlyoutSubItemBackgroundBrush: "a sub item's border",
	MenuFlyoutSubItemBorderThickness: "a sub item's border width",
	MenuFlyoutSubItemBackgroundDisabled: 'a disabled sub item',
	MenuFlyoutSubItemBackgroundSubMenuOpened: 'a sub item whose menu is open',
	MenuFlyoutSubItemForeground: "a sub item's text",
	MenuFlyoutSubItemForegroundPointerOver: "a sub item's text under the pointer",
	MenuFlyoutSubItemForegroundSubMenuOpened: "a sub item's text while its menu is open",
	MenuFlyoutSubItemChevronPointerOver: "a sub item's chevron under the pointer",
	MenuFlyoutSubItemChevronPressed: "a sub item's chevron while pressed",
	MenuFlyoutSubItemChevronSubMenuOpened: "a sub item's chevron while its menu is open",
	MenuFlyoutSubItemChevronDisabled: "a disabled sub item's chevron",
	MenuFlyoutItemChevronMargin: 'the gap around a sub item chevron',

	// The split item — one row that is two buttons. Every fill and every text colour it uses
	// is the item row's or the sub item's; these three are the only records that exist for it.
	SplitMenuFlyoutItemButtonDividerBrush: 'the rule between the two halves',
	SplitMenuFlyoutItemSeparatorHeight: 'the rule between the two halves',
	SplitMenuFlyoutItemChevronButtonWidth: 'the chevron half'
};

/**
 * `controls/dev/CommonStyles/ContentDialog_themeresources.xaml`, all fifteen records.
 *
 * No state family among them. A dialog has no pointer-over, no pressed and no disabled,
 * because nothing in it is interactive except the three command Buttons, and those read the
 * Button dictionary. What the fifteen describe instead is a stack of three fills: the smoke
 * layer over the window, `ContentDialogBackground` over the whole card, and
 * `ContentDialogTopOverlay` over the title and content area only — which is why the measured
 * dialog is white above the separator and 243 below it out of one `Background` setter.
 *
 * `ContentDialogButtonSpacing` is seeded and then excluded: its XAML type is `GridLength`,
 * which is a Grid column width and has no custom-property analogue. It is seeded anyway so
 * that the completeness check counts it, and the 8px it carries is stated in the component's
 * `gap` with the dictionary line cited beside it.
 */
export const CONTENTDIALOG_KEYS = {
	ContentDialogForeground: 'the dialog text',
	ContentDialogBackground: 'the dialog card, and so the command area',
	ContentDialogSmokeFill: 'the layer that dims the window behind a dialog',
	ContentDialogTopOverlay: 'the fill over the title and content area only',
	ContentDialogBorderBrush: 'the dialog border',
	ContentDialogSeparatorBorderBrush: 'the rule above the command area',
	ContentDialogBorderWidth: 'the dialog border width — 1, and 2 under high contrast',
	ContentDialogMinWidth: 'the width a dialog never goes under',
	ContentDialogMaxWidth: 'the width a dialog never exceeds',
	ContentDialogMinHeight: 'the height a dialog never goes under',
	ContentDialogMaxHeight: 'the height a dialog never exceeds, past which it scrolls',
	ContentDialogButtonSpacing: 'the gap between two command buttons',
	ContentDialogTitleMargin: 'the gap under the title',
	ContentDialogPadding: 'the inset around the content, and around the commands',
	ContentDialogSeparatorThickness: 'the rule above the command area'
};

/**
 * `controls/dev/TeachingTip/TeachingTip_themeresources.xaml`, the records the control
 * draws with.
 *
 * The dictionary carries fifty keys and these thirty-six are the selection. The other
 * fourteen are named here rather than left to be counted, because a reader who cannot see
 * which keys are missing cannot tell an unselected key from an emitted one — and the two
 * are indistinguishable until C9 fails on a `var()` for a key that was never chosen.
 *
 * Dead in the template, and expanded on in `docs/surface.md`:
 * `TeachingTipContentBorderThicknessTop`/`Bottom`/`Left`/`Right`, four placement-specific
 * border thicknesses nothing ever assigns — the Style sets `...Untargeted` once and no code
 * or visual state replaces it — and `TeachingTipTopHighlightBrush`/`Height`/
 * `OffsetForBorder`, whose `TopHighlightLeft` and `TopHighlightRight` parts are gone from
 * the template.
 *
 * Live upstream and deliberately unselected: `TeachingTipTailPolygonMarginTop`/`Bottom`/
 * `Left`/`Right`, the -1 nudges that pull the tail back over the card's border, which this
 * reproduction gets from the tail's own viewBox instead of from a margin; and
 * `TeachingTipIconPresenterMarginWithoutIcon`, `TeachingTipMainContentAbsentMargin` and
 * `TeachingTipTitleStackPanelMarginWithFooterCloseButton`, the three absent-state variants,
 * every one of them `0,0,0,0`. A component writes `margin: 0` for those with the dictionary
 * line cited, because a custom property whose whole content is a zero says less than the
 * line number does.
 *
 * `TeachingTipTailShortSideLength` and `TeachingTipTailMargin` are seeded and then excluded:
 * both are `GridLength`, the width of one of the tracks the tail grid divides itself into,
 * and the 8 and 10 they carry are written into the component with their lines cited.
 */
export const TEACHINGTIP_KEYS = {
	TeachingTipBackgroundBrush: 'the card, and the tail that is cut out of it',
	TeachingTipTransientBackground: 'the card when the tip is light-dismissable',
	TeachingTipForegroundBrush: 'the card text',
	TeachingTipBorderBrush: "the card border, and the tail's two slanted edges",
	TeachingTipTitleForegroundBrush: 'the title',
	TeachingTipSubtitleForegroundBrush: 'the subtitle',

	TeachingTipBorderThickness: "the tail's stroke width",
	TeachingTipContentBorderThicknessUntargeted: "the card's border, on all four sides",
	TeachingTipContentMargin: 'the inset around everything but the hero',
	TeachingTipIconPresenterMarginWithIcon: 'the gap after the icon',
	TeachingTipTitleStackPanelMarginWithHeaderCloseButton:
		'the column the header close button takes out of the title',
	TeachingTipMainContentPresentMargin: 'the gap above the content',
	TeachingTipButtonPanelMargin: 'the gap above a lone command button',
	TeachingTipLeftButtonMargin: 'the gap above and right of the action button',
	TeachingTipRightButtonMargin: 'the gap above and left of the close button',

	TeachingTipMinWidth: 'the width a tip never goes under',
	TeachingTipMaxWidth: 'the width a tip never exceeds, tail tracks included',
	TeachingTipMinHeight: 'the height a tip never goes under',
	TeachingTipMaxHeight: 'the height a tip never exceeds, past which it scrolls',
	TeachingTipTailShortSideLength: 'how far the tail stands off the card',
	TeachingTipTailMargin: 'the track between the tail and the card corner',

	TeachingTipAlternateCloseButtonSize: 'the header close button box',
	TeachingTipAlternateCloseButtonGlyphSize: 'the header close button glyph',
	TeachingTipAlternateCloseButtonBorderThickness: 'the header close button border width',
	TeachingTipAlternateCloseButtonBackground: 'the header close button at rest',
	TeachingTipAlternateCloseButtonBackgroundPointerOver: 'the header close button, hovered',
	TeachingTipAlternateCloseButtonBackgroundPressed: 'the header close button, pressed',
	TeachingTipAlternateCloseButtonBackgroundDisabled: 'the header close button, disabled',
	TeachingTipAlternateCloseButtonForeground: 'the header close glyph at rest',
	TeachingTipAlternateCloseButtonForegroundPointerOver: 'the header close glyph, hovered',
	TeachingTipAlternateCloseButtonForegroundPressed: 'the header close glyph, pressed',
	TeachingTipAlternateCloseButtonForegroundDisabled: 'the header close glyph, disabled',
	TeachingTipAlternateCloseButtonBorderBrush: 'the header close button border at rest',
	TeachingTipAlternateCloseButtonBorderBrushPointerOver: 'the header close button border, hovered',
	TeachingTipAlternateCloseButtonBorderBrushPressed: 'the header close button border, pressed',
	TeachingTipAlternateCloseButtonBorderBrushDisabled: 'the header close button border, disabled'
};

/**
 * Keys MenuBar and MenuBarItem read. The control dictionary defines exactly these fourteen
 * resources: eleven themed colours/thicknesses and three theme-independent layout metrics.
 * Every key is live in the two templates; notably, the item border thickness is zero in the
 * light and dark dictionaries but two in HighContrast, where the four border brushes paint.
 */
export const MENUBAR_KEYS = {
	MenuBarBackground: 'MenuBar background',
	MenuBarItemForeground: 'MenuBarItem foreground',
	MenuBarItemBackground: 'MenuBarItem background, at rest',
	MenuBarItemBackgroundPointerOver: 'MenuBarItem background, pointer over',
	MenuBarItemBackgroundPressed: 'MenuBarItem background, pressed',
	MenuBarItemBackgroundSelected: 'MenuBarItem background, selected',
	MenuBarItemBorderThickness: 'MenuBarItem border width',
	MenuBarItemBorderBrush: 'MenuBarItem border, at rest',
	MenuBarItemBorderBrushPointerOver: 'MenuBarItem border, pointer over',
	MenuBarItemBorderBrushPressed: 'MenuBarItem border, pressed',
	MenuBarItemBorderBrushSelected: 'MenuBarItem border, selected',
	MenuBarHeight: 'MenuBar minimum height',
	MenuBarItemButtonPadding: 'MenuBarItem content padding',
	MenuBarItemMargin: 'MenuBarItem outer margin'
};

/**
 * Keys ItemContainer reads — the Collections tranche's first seed set, and the first control
 * in it that draws anything at all.
 *
 * The eighteen below are every key `ItemContainer.xaml` and `ItemContainer_themeresources.xaml`
 * put on screen. Four of the file's twenty-two are absent and each for its own reason:
 *
 * `ItemContainerSelectionCheckboxStyle` (`:70`) is a `Style`, not a token — this layer emits
 * custom properties, and a re-templated CheckBox is a component's markup.
 *
 * `ItemContainerCheckboxHorizontalAlignment` and `ItemContainerCheckboxVerticalAlignment`
 * (`:66-67`) are `Right` and `Top`, and no `HorizontalAlignment` or `VerticalAlignment`
 * resource is emitted anywhere in this layer: an alignment is a CSS placement, not a value a
 * property can hold.
 *
 * `ItemContainerCheckboxMinWidth` (`:64`) is `0`, and it exists to defeat `CheckBox`'s own
 * `MinWidth` — a default the reproduction's checkbox never has, because it is markup written
 * for this control rather than a `CheckBox` re-templated. Emitting it would publish a token
 * nothing reads.
 */
export const ITEMCONTAINER_KEYS = {
	ItemContainerBackground: 'ItemContainer background, at rest',
	ItemContainerPointerOverBackground: 'ItemContainer fill under the pointer',
	ItemContainerPressedBackground: 'ItemContainer fill while pressed',
	ItemContainerBorderBrush: 'ItemContainer inner stroke, at rest',
	ItemContainerPointerOverBorderBrush: 'ItemContainer inner stroke under the pointer',
	ItemContainerPressedBorderBrush: 'ItemContainer inner stroke while pressed',
	ItemContainerSelectedBackground: 'ItemContainer selected fill',
	ItemContainerSelectedPointerOverBackground: 'ItemContainer selected fill under the pointer',
	ItemContainerSelectedPressedBackground: 'ItemContainer selected fill while pressed',
	ItemContainerSelectionVisualBackground: 'ItemContainer selection ring',
	ItemContainerSelectionVisualPointerOverBackground:
		'ItemContainer selection ring under the pointer',
	ItemContainerSelectionVisualPressedBackground: 'ItemContainer selection ring while pressed',
	ItemContainerSelectedInnerBorderBrush: 'ItemContainer inner stroke while selected',
	ItemContainerCheckboxBackgroundUnchecked: 'ItemContainer multi-select checkbox fill, unchecked',
	ItemContainerDisabledOpacity: 'ItemContainer opacity while disabled',
	ItemContainerCheckboxMargin: 'ItemContainer multi-select checkbox margin',
	ItemContainerSelectedInnerMargin: 'ItemContainer inner stroke inset while selected',
	ItemContainerSelectedInnerThickness: 'ItemContainer inner stroke width'
};

/**
 * Keys ListViewItem reads — the Collections tranche's second seed set.
 *
 * `ListViewItem` has no `.cpp` in the pin and no `ControlTemplate` anywhere in it: the
 * template is a single `ListViewItemPresenter` (`generic.xaml:27546`), which the framework
 * draws in C++. What that leaves readable is more than v9's plan expected. The `Style`
 * itself (`generic.xaml:27524-27545`) gives `Padding` 16,0,12,0, `MinWidth` 88, `MinHeight`
 * 40, `VerticalContentAlignment` Center, a `FocusVisualMargin` of 1 with a 2 and 1 band, and
 * every brush by state. What is genuinely nowhere is the presenter's own inset — the
 * background is not the item's box — and that was measured on the reference machine: 2 above
 * and below, 4 either side, in a 40-tall row.
 *
 * Absent, with reasons. The drag, reorder, placeholder and multi-arrange families
 * (`ListViewItem_themeresources.xaml:7-11`, `:35-39`) belong to reordering, which this
 * version does not build. The fifteen pre-Fluent `*ThemeBrush` entries (`:42-56`) are
 * read by no current template — the same category `PIVOT_KEYS` records. `ListViewItemBorderBackground`,
 * `ListViewItemSelectedBorderThemeThickness` and `ListViewItemCompactSelectedBorderThemeThickness`
 * (`:12`, `:15-16`) are the pre-Fluent selection border, replaced by the indicator.
 * `ListViewItemFocusBorderBrush` and `ListViewItemFocusSecondaryBorderBrush` (`:31-32`) are
 * the presenter's own focus rectangle, which the system focus visual supersedes.
 * `ListViewItemContentOffsetX`, `ListViewItemCheckMode`, the two `*VisualEnabled` booleans and
 * the whole `ListViewItemCheckBox*` family are the inline check box, which v9 leaves owed —
 * see docs/plan.md.
 */
export const LISTVIEWITEM_KEYS = {
	ListViewItemMinWidth: 'ListViewItem minimum width',
	ListViewItemMinHeight: 'ListViewItem minimum height',
	ListViewItemCornerRadius: 'ListViewItem background corner radius',
	ListViewItemSelectionIndicatorCornerRadius: 'ListViewItem selection indicator corner radius',
	ListViewItemDisabledThemeOpacity: 'ListViewItem opacity while disabled',
	ListViewItemBackground: 'ListViewItem background, at rest',
	ListViewItemBackgroundPointerOver: 'ListViewItem background under the pointer',
	ListViewItemBackgroundPressed: 'ListViewItem background while pressed',
	ListViewItemBackgroundSelected: 'ListViewItem selected background',
	ListViewItemBackgroundSelectedPointerOver: 'ListViewItem selected background under the pointer',
	ListViewItemBackgroundSelectedPressed: 'ListViewItem selected background while pressed',
	ListViewItemBackgroundSelectedDisabled: 'ListViewItem selected background while disabled',
	ListViewItemForeground: 'ListViewItem foreground, at rest',
	ListViewItemForegroundPointerOver: 'ListViewItem foreground under the pointer',
	ListViewItemForegroundPressed: 'ListViewItem foreground while pressed',
	ListViewItemForegroundSelected: 'ListViewItem selected foreground',
	ListViewItemForegroundSelectedPointerOver: 'ListViewItem selected foreground under the pointer',
	ListViewItemForegroundSelectedPressed: 'ListViewItem selected foreground while pressed',
	ListViewItemFocusVisualPrimaryBrush: 'ListViewItem focus band, outer',
	ListViewItemFocusVisualSecondaryBrush: 'ListViewItem focus band, inner',
	ListViewItemSelectionIndicatorBrush: 'ListViewItem selection indicator',
	ListViewItemSelectionIndicatorPointerOverBrush:
		'ListViewItem selection indicator under the pointer',
	ListViewItemSelectionIndicatorPressedBrush: 'ListViewItem selection indicator while pressed',
	ListViewItemSelectionIndicatorDisabledBrush: 'ListViewItem selection indicator while disabled'
};

/**
 * Keys GridViewItem reads — the Collections tranche's third seed set, and the same shape as
 * ListViewItem's with one difference that decides the whole control: a grid item has no
 * selection indicator and draws a ring instead. `GridViewItemSelectedBorderThickness` is 2 and
 * `GridViewItemSelectedInnerBorderBrush` is the line inside it, which is `ItemContainer`'s
 * chrome one pixel thinner — measured on the reference machine as 2 of accent and 1 of ink at
 * the item's own edge.
 *
 * `GridViewItemMinWidth` and `GridViewItemMinHeight` are 44 and live in the framework
 * dictionary (`generic.xaml:112-113`) rather than in the control's own, which is why they are
 * named here rather than pulled in by the closure.
 *
 * Absent, for the reasons LISTVIEWITEM_KEYS gives: the drag and placeholder families, the
 * presenter's own focus rectangle, and the whole `GridViewItemCheckBox*` family with the check
 * box v9 leaves owed. `GridViewItemPointerOverBorderBrush` is absent because it paints
 * nothing: an unselected grid item under the pointer was measured on the reference machine
 * and its content runs to the item's own edge with no ring at all.
 */
export const GRIDVIEWITEM_KEYS = {
	GridViewItemMinWidth: 'GridViewItem minimum width',
	GridViewItemMinHeight: 'GridViewItem minimum height',
	GridViewItemCornerRadius: 'GridViewItem corner radius',
	GridViewItemSelectedBorderThickness: 'GridViewItem selection ring width',
	GridViewItemBackground: 'GridViewItem background, at rest',
	GridViewItemBackgroundPointerOver: 'GridViewItem background under the pointer',
	GridViewItemBackgroundPressed: 'GridViewItem background while pressed',
	GridViewItemBackgroundSelected: 'GridViewItem selected background',
	GridViewItemBackgroundSelectedPointerOver: 'GridViewItem selected background under the pointer',
	GridViewItemBackgroundSelectedPressed: 'GridViewItem selected background while pressed',
	GridViewItemBackgroundSelectedDisabled: 'GridViewItem selected background while disabled',
	GridViewItemForeground: 'GridViewItem foreground, at rest',
	GridViewItemForegroundPointerOver: 'GridViewItem foreground under the pointer',
	GridViewItemForegroundSelected: 'GridViewItem selected foreground',
	GridViewItemFocusVisualPrimaryBrush: 'GridViewItem focus band, outer',
	GridViewItemFocusVisualSecondaryBrush: 'GridViewItem focus band, inner',
	GridViewItemSelectedBorderBrush: 'GridViewItem selection ring',
	GridViewItemSelectedPointerOverBorderBrush: 'GridViewItem selection ring under the pointer',
	GridViewItemSelectedPressedBorderBrush: 'GridViewItem selection ring while pressed',
	GridViewItemSelectedDisabledBorderBrush: 'GridViewItem selection ring while disabled',
	GridViewItemSelectedInnerBorderBrush: 'GridViewItem line inside the selection ring'
};

/**
 * Keys TreeViewItem reads — the Collections tranche's fourth seed set, and the first in it
 * whose control is written down in full: `TreeViewItem.xaml` is 154 lines of readable
 * template, based on `DefaultListViewItemStyle` and then replacing all of it.
 *
 * Absent, with reasons. `TreeViewItemCheckBoxBackgroundSelected`,
 * `TreeViewItemCheckBoxBorderSelected` and `TreeViewItemCheckGlyphSelected`
 * (`TreeView_themeresources.xaml:26-28`) belong to the multi-select check box, which is
 * v9's `TreeViewSelectionMode.Multiple` and is not built — the plan records it.
 * `TreeViewItemMultiSelectBorderBrushSelected`, `TreeViewItemMultiSelectCheckBoxMinHeight`
 * and `TreeViewItemMultiSelectSelectedItemBorderMargin` are the same check box's own frame.
 * `TreeViewItemBorderThemeThickness` is emitted because the template binds it at two levels
 * and it is zero outside high contrast, where it is what draws the item's edge.
 */
export const TREEVIEWITEM_KEYS = {
	TreeViewItemMinHeight: 'TreeViewItem minimum height',
	TreeViewItemContentHeight: 'TreeViewItem content minimum height',
	TreeViewItemPresenterMargin: 'TreeViewItem outer margin',
	TreeViewItemPresenterPadding: 'TreeViewItem inner padding',
	TreeViewItemBorderThemeThickness: 'TreeViewItem border width',
	TreeViewItemBackground: 'TreeViewItem background, at rest',
	TreeViewItemBackgroundPointerOver: 'TreeViewItem background under the pointer',
	TreeViewItemBackgroundPressed: 'TreeViewItem background while pressed',
	TreeViewItemBackgroundSelected: 'TreeViewItem selected background',
	TreeViewItemBackgroundSelectedPointerOver: 'TreeViewItem selected background under the pointer',
	TreeViewItemBackgroundSelectedPressed: 'TreeViewItem selected background while pressed',
	TreeViewItemBackgroundDisabled: 'TreeViewItem background while disabled',
	TreeViewItemBackgroundSelectedDisabled: 'TreeViewItem selected background while disabled',
	TreeViewItemForeground: 'TreeViewItem foreground, at rest',
	TreeViewItemForegroundPointerOver: 'TreeViewItem foreground under the pointer',
	TreeViewItemForegroundPressed: 'TreeViewItem foreground while pressed',
	TreeViewItemForegroundSelected: 'TreeViewItem selected foreground',
	TreeViewItemForegroundSelectedPointerOver: 'TreeViewItem selected foreground under the pointer',
	TreeViewItemForegroundSelectedPressed: 'TreeViewItem selected foreground while pressed',
	TreeViewItemForegroundDisabled: 'TreeViewItem foreground while disabled',
	TreeViewItemForegroundSelectedDisabled: 'TreeViewItem selected foreground while disabled',
	TreeViewItemBorderBrush: 'TreeViewItem border, at rest',
	TreeViewItemBorderBrushPointerOver: 'TreeViewItem border under the pointer',
	TreeViewItemBorderBrushPressed: 'TreeViewItem border while pressed',
	TreeViewItemBorderBrushSelected: 'TreeViewItem selected border',
	TreeViewItemBorderBrushSelectedPointerOver: 'TreeViewItem selected border under the pointer',
	TreeViewItemBorderBrushSelectedPressed: 'TreeViewItem selected border while pressed',
	TreeViewItemBorderBrushDisabled: 'TreeViewItem border while disabled',
	TreeViewItemBorderBrushSelectedDisabled: 'TreeViewItem selected border while disabled',
	TreeViewItemSelectionIndicatorForeground: 'TreeViewItem selection indicator',
	TreeViewItemSelectionIndicatorForegroundPointerOver:
		'TreeViewItem selection indicator under the pointer',
	TreeViewItemSelectionIndicatorForegroundPressed: 'TreeViewItem selection indicator while pressed',
	TreeViewItemSelectionIndicatorForegroundDisabled:
		'TreeViewItem selection indicator while disabled'
};

/**
 * Keys FlipView and FlipViewItem read — the Collections tranche's fifth and last seed set.
 *
 * Absent: the nine `FlipViewButton*ThemeBrush` entries
 * (`FlipView_themeresources.xaml:17-25`), which are the pre-Fluent button palette — hard
 * colours like `#59D5D5D5` that no current template reads, the same category `PIVOT_KEYS`
 * records. The four `FlipViewNextPreviousButtonBackground*` brushes resolve to an acrylic,
 * and WD-002 is why what lands is its `FallbackColor`; measured on the reference machine, the
 * original's own flip button renders at that fallback exactly.
 *
 * `FlipViewItemBackground` is defined identically in both `FlipView_themeresources.xaml:16`
 * and `FlipViewItem_themeresources.xaml:5`, so `DEFINED_BY` names the item's own file as
 * the one this layer reads it from.
 */
export const FLIPVIEW_KEYS = {
	FlipViewBackground: 'FlipView background',
	FlipViewItemBackground: 'FlipViewItem background',
	FlipViewButtonBorderThemeThickness: 'FlipView flip button border width',
	FlipViewButtonFontSize: 'FlipView flip button arrow size',
	FlipViewButtonScalePressed: 'FlipView flip button scale while pressed',
	FlipViewNextPreviousButtonBackground: 'FlipView flip button background, at rest',
	FlipViewNextPreviousButtonBackgroundPointerOver:
		'FlipView flip button background under the pointer',
	FlipViewNextPreviousButtonBackgroundPressed: 'FlipView flip button background while pressed',
	FlipViewNextPreviousButtonBorderBrush: 'FlipView flip button border, at rest',
	FlipViewNextPreviousButtonBorderBrushPointerOver: 'FlipView flip button border under the pointer',
	FlipViewNextPreviousButtonBorderBrushPressed: 'FlipView flip button border while pressed',
	FlipViewNextPreviousArrowForeground: 'FlipView flip button arrow, at rest',
	FlipViewNextPreviousArrowForegroundPointerOver: 'FlipView flip button arrow under the pointer',
	FlipViewNextPreviousArrowForegroundPressed: 'FlipView flip button arrow while pressed'
};

/**
 * Keys `controls/dev/CommonStyles/ScrollBar_themeresources.xaml` defines for the `ScrollBar`
 * template. `ScrollView`, `ScrollViewer`, and every scrolling region in this library put that
 * template inside themselves.
 *
 * `ScrollBarSize` is 12 in the control pin's themeless block while the framework pin's themed
 * blocks retain an older 16. D23's per-key-and-theme merge already selects 12 because the control
 * pin defines the key without a theme, so this set needs no exception.
 *
 * Collapse is timed by `ScrollBarContractBeginTime` (500ms), not `ScrollBarContractDelay` (2s):
 * the latter belongs to ScrollView's indicator transitions and is deliberately absent. Also absent
 * are `ScrollBarButtonBorderBrush*`, which the template binds but every theme resolves to a
 * transparent brush and this implementation's arrows do not draw, and the pre-Fluent legacy
 * `ScrollBar*ThemeBrush` family (`ScrollBarThumbBackgroundThemeBrush`,
 * `ScrollBarTrackBackgroundThemeBrush`, and siblings), which the WinUI 11 template does not read.
 */
export const SCROLLBAR_KEYS = {
	ScrollBarSize: 'ScrollBar rail thickness and arrow button box size',
	ScrollBarCornerRadius: 'ScrollBar track and thumb corner radius',
	ScrollBarThumbOffset: 'Collapsed thumb offset from the rail edge',
	ScrollBarThumbStrokeThickness: 'Transparent stroke that insets the thumb fill',
	ScrollBarVerticalThumbMinWidth: 'Collapsed vertical thumb width',
	ScrollBarVerticalThumbMinHeight: 'Minimum vertical thumb length',
	ScrollBarHorizontalThumbMinHeight: 'Collapsed horizontal thumb height',
	ScrollBarHorizontalThumbMinWidth: 'Minimum horizontal thumb length',
	ScrollBarVerticalDecreaseMargin: 'Vertical leading arrow padding',
	ScrollBarVerticalIncreaseMargin: 'Vertical trailing arrow padding',
	ScrollBarHorizontalDecreaseMargin: 'Horizontal leading arrow padding',
	ScrollBarHorizontalIncreaseMargin: 'Horizontal trailing arrow padding',
	ScrollBarButtonArrowIconFontSize: 'Arrow glyph size',
	ScrollBarButtonArrowScalePressed: 'Arrow glyph scale while pressed',
	ScrollBarTrackBorderThemeThickness: 'Track border width',
	ScrollBarExpandBeginTime: 'Expanded-state transition delay',
	ScrollBarExpandDuration: 'Expanded-state transition duration',
	ScrollBarContractBeginTime: 'Collapsed-state transition delay',
	ScrollBarContractDuration: 'Collapsed-state transition duration',
	ScrollBarOpacityChangeDuration: 'Rail opacity transition duration',
	ScrollBarColorChangeDuration: 'Thumb colour transition duration',
	ScrollBarBackground: 'ScrollBar root background at rest',
	ScrollBarBackgroundPointerOver: 'ScrollBar root background under the pointer',
	ScrollBarBackgroundDisabled: 'ScrollBar root background while disabled',
	ScrollBarBorderBrush: 'ScrollBar root border at rest',
	ScrollBarBorderBrushPointerOver: 'ScrollBar root border under the pointer',
	ScrollBarBorderBrushDisabled: 'ScrollBar root border while disabled',
	ScrollBarTrackFill: 'Track fill at rest',
	ScrollBarTrackFillPointerOver: 'Track fill under the pointer',
	ScrollBarTrackFillDisabled: 'Track fill while disabled',
	ScrollBarTrackStroke: 'Track stroke at rest',
	ScrollBarTrackStrokePointerOver: 'Track stroke under the pointer',
	ScrollBarTrackStrokeDisabled: 'Track stroke while disabled',
	ScrollBarButtonBackground: 'Arrow button background at rest',
	ScrollBarButtonBackgroundPointerOver: 'Arrow button background under the pointer',
	ScrollBarButtonBackgroundPressed: 'Arrow button background while pressed',
	ScrollBarButtonBackgroundDisabled: 'Arrow button background while disabled',
	ScrollBarButtonArrowForeground: 'Arrow glyph foreground at rest',
	ScrollBarButtonArrowForegroundPointerOver: 'Arrow glyph foreground under the pointer',
	ScrollBarButtonArrowForegroundPressed: 'Arrow glyph foreground while pressed',
	ScrollBarButtonArrowForegroundDisabled: 'Arrow glyph foreground while disabled',
	ScrollBarThumbBackground: 'Expanded thumb fill',
	ScrollBarThumbBorderBrush: 'Transparent thumb border brush',
	ScrollBarThumbFillDisabled: 'Thumb fill while disabled',
	ScrollBarPanningThumbBackground: 'Collapsed and touch thumb fill',
	ScrollBarPanningThumbBackgroundDisabled: 'Collapsed and touch thumb fill while disabled'
};

/**
 * Keys `controls/dev/ScrollView/ScrollView_themeresources.xaml` defines for the ScrollView
 * template beyond its ScrollBar parts. The separator is transparent in every shipped theme,
 * but remains a token because the template deliberately paints it when both bars are present.
 */
export const SCROLLVIEW_KEYS = {
	ScrollViewScrollBarsMargin: 'Inset around each ScrollView scrollbar',
	ScrollViewScrollBarsSeparatorBackground: 'Corner between two visible ScrollView scrollbars'
};

/**
 * Keys `controls/dev/PipsPager/PipsPager_themeresources.xaml` defines for the PipsPager
 * template: the twenty-seven brushes of its three theme dictionaries and the twelve themeless
 * values the two button styles read.
 *
 * `PipsPagerButtonWidth` (20) and `PipsPagerButtonHeight` (12) are defined at `:92-93` and
 * deliberately absent. `PipsPagerButtonBaseStyle`'s template sizes its root from
 * `PipsPagerHorizontalOrientationButton{Width,Height}` (`:214`) and its vertical state swaps in
 * the two `PipsPagerVerticalOrientationButton…` twins (`:268-269`); nothing in either pin reads
 * the unqualified pair. This selection records what a control reads rather than what its
 * dictionary defines.
 *
 * `PipsPagerSelectedGlyphFontSize` and `PipsPagerNormalGlyphFontSize` are declared `x:String`
 * upstream (`:107-108`) where every other font size in the pins is an `x:Double`. They are sizes
 * all the same — `PipsPagerButtonBaseStyle` sets `FontSize` from them at `:209` and `:282` — so
 * `scalar()` reads a `FontSize`-suffixed `x:String` as one, and the two keys are the only
 * records that take that branch.
 */
export const PIPSPAGER_KEYS = {
	PipsPagerSelectionIndicatorBackground: 'Pip background, at rest',
	PipsPagerSelectionIndicatorBackgroundPointerOver: 'Pip background under the pointer',
	PipsPagerSelectionIndicatorBackgroundPressed: 'Pip background while pressed',
	PipsPagerSelectionIndicatorBackgroundSelected: 'Pip background while selected',
	PipsPagerSelectionIndicatorBackgroundDisabled: 'Pip background while disabled',
	PipsPagerSelectionIndicatorBorderBrush: 'Pip border, at rest',
	PipsPagerSelectionIndicatorBorderBrushPointerOver: 'Pip border under the pointer',
	PipsPagerSelectionIndicatorBorderBrushPressed: 'Pip border while pressed',
	PipsPagerSelectionIndicatorBorderBrushSelected: 'Pip border while selected',
	PipsPagerSelectionIndicatorBorderBrushDisabled: 'Pip border while disabled',
	PipsPagerSelectionIndicatorForeground: 'Pip glyph, at rest',
	PipsPagerSelectionIndicatorForegroundPointerOver: 'Pip glyph under the pointer',
	PipsPagerSelectionIndicatorForegroundPressed: 'Pip glyph while pressed',
	PipsPagerSelectionIndicatorForegroundSelected: 'Pip glyph while selected',
	PipsPagerSelectionIndicatorForegroundDisabled: 'Pip glyph while disabled',
	PipsPagerNavigationButtonBackground: 'Navigation button background, at rest',
	PipsPagerNavigationButtonBackgroundPointerOver: 'Navigation button background under the pointer',
	PipsPagerNavigationButtonBackgroundPressed: 'Navigation button background while pressed',
	PipsPagerNavigationButtonBackgroundDisabled: 'Navigation button background while disabled',
	PipsPagerNavigationButtonBorderBrush: 'Navigation button border, at rest',
	PipsPagerNavigationButtonBorderBrushPointerOver: 'Navigation button border under the pointer',
	PipsPagerNavigationButtonBorderBrushPressed: 'Navigation button border while pressed',
	PipsPagerNavigationButtonBorderBrushDisabled: 'Navigation button border while disabled',
	PipsPagerNavigationButtonForeground: 'Navigation button chevron, at rest',
	PipsPagerNavigationButtonForegroundPointerOver: 'Navigation button chevron under the pointer',
	PipsPagerNavigationButtonForegroundPressed: 'Navigation button chevron while pressed',
	PipsPagerNavigationButtonForegroundDisabled: 'Navigation button chevron while disabled',
	PipsPagerHorizontalOrientationButtonWidth: 'Pip box width in horizontal orientation',
	PipsPagerHorizontalOrientationButtonHeight: 'Pip box height in horizontal orientation',
	PipsPagerVerticalOrientationButtonWidth: 'Pip box width in vertical orientation',
	PipsPagerVerticalOrientationButtonHeight: 'Pip box height in vertical orientation',
	PipsPagerButtonBorderThickness: 'Pip border width',
	PipsPagerNavigationButtonBorderThickness: 'Navigation button border width',
	PipsPagerNavigationButtonHeight: 'Navigation button box height',
	PipsPagerNavigationButtonWidth: 'Navigation button box width',
	PipsPagerNavigationButtonFontSize: 'Navigation button chevron size',
	PipsPagerSelectedGlyphFontSize: 'Pip glyph size while selected',
	PipsPagerNormalGlyphFontSize: 'Pip glyph size at rest',
	PipsPagerNavigationButtonScalePressed: 'Navigation button chevron scale while pressed',
	PipsPagerSelectedGlyph: 'the selected pip glyph',
	PipsPagerNormalGlyph: 'the unselected pip glyph',
	PipsPagerPreviousPageButtonGlyph: 'the previous-page chevron',
	PipsPagerNextPageButtonGlyph: 'the next-page chevron'
};

/**
 * Keys `controls/dev/AnnotatedScrollBar/AnnotatedScrollBar_themeresources.xaml` defines for
 * the AnnotatedScrollBar template: the seven brushes and one thickness of its three theme
 * dictionaries, and the seven themeless values its template and its scroll-button style read.
 *
 * Six of these names carry no control prefix — `ThumbHeight`, `ThumbWidth`,
 * `ThumbCornerRadius`, `LabelsGridMinWidth`, `ScrollButtonFontSize` and the six
 * `ScrollButton…` brushes and thickness. **They all belong to AnnotatedScrollBar.**
 * `--winui-ThumbHeight` reads like Slider's or ScrollBar's and is this control's 3-pixel
 * accent thumb; `--winui-ScrollButtonForeground` reads like ScrollBar's arrow and is this
 * control's chevron. ADR 0006 emits a token as `--winui-` plus the key unchanged, and no
 * other dictionary in either pin defines any of the fifteen, so nothing collides and the
 * rule stands as written — but a reader who meets the emitted name first has no way to know
 * which control owns it, which is what this paragraph is for.
 */
export const ANNOTATEDSCROLLBAR_KEYS = {
	ScrollButtonBackground: 'Chevron button background',
	ScrollButtonForeground: 'Chevron glyph, at rest',
	ScrollButtonForegroundPointerOver: 'Chevron glyph under the pointer',
	ScrollButtonForegroundPressed: 'Chevron glyph while pressed',
	ScrollButtonForegroundDisabled: 'Chevron glyph while disabled',
	ScrollButtonBorderBrush: 'Chevron button border',
	ScrollButtonStyleBorderThickness: 'Chevron button border width',
	VerticalThumbBrush: 'The thumb that marks where the scrolled region is',
	ThumbHeight: 'Thumb height',
	ThumbWidth: 'Thumb width',
	ThumbCornerRadius: 'Thumb corner radius',
	LabelsGridMinWidth: 'Minimum width of the label column, and of the control',
	ScrollButtonFontSize: 'Chevron glyph size',
	AnnotatedScrollBarTooltipMaxWidth: 'Detail-label tooltip maximum width',
	AnnotatedScrollBarTooltipMinHeight: 'Detail-label tooltip minimum height'
};

/**
 * Keys the two `PullToRefresh` dictionaries define —
 * `controls/dev/PullToRefresh/RefreshVisualizer/RefreshVisualizer_themeresources.xaml` and
 * `.../RefreshContainer/RefreshContainer_themeresources.xaml`.
 *
 * Four brushes for two controls, and every one of them is `Transparent` or a plain
 * black/white/system foreground in all three themes. They are seeded rather than written into
 * the components as literals for the reason a zero token and a missing one are indistinguishable
 * in a snapshot: a consumer overriding `RefreshVisualizerForeground` is exactly who finds out
 * that the control never read it.
 */
export const PULLTOREFRESH_KEYS = {
	RefreshVisualizerForeground: 'The refresh indicator',
	RefreshVisualizerBackground: 'The area the indicator is revealed in',
	RefreshContainerForegroundBrush: 'The container, inherited by its content',
	RefreshContainerBackgroundBrush: 'The container behind its content and its visualizer'
};

/**
 * Keys `controls/dev/PersonPicture/PersonPicture_themeresources.xaml` defines for the
 * PersonPicture template. The two badge stroke opacity keys are absent: both are `1` in all
 * three themes, and the component renders badge forms conditionally rather than toggling them.
 */
export const PERSONPICTURE_KEYS = {
	PersonPictureForegroundThemeBrush: 'PersonPicture content foreground',
	PersonPictureEllipseFillThemeBrush: 'PersonPicture ellipse fill',
	PersonPictureEllipseFillStrokeBrush: 'PersonPicture ellipse border',
	PersonPictureEllipseStrokeThickness: 'PersonPicture ellipse border width',
	PersonPictureEllipseBadgeForegroundThemeBrush: 'PersonPicture badge content foreground',
	PersonPictureEllipseBadgeFillThemeBrush: 'PersonPicture badge fill',
	PersonPictureEllipseBadgeStrokeThemeBrush: 'PersonPicture badge border',
	PersonPictureEllipseBadgeStrokeThickness: 'PersonPicture badge border width',
	PersonPictureBadgeGridMargin: 'PersonPicture badge overhang margin'
};

/**
 * `MediaTransportControls_themeresources.xaml`'s dictionary, whole. The three
 * `MediaTransportControls*` entries the template overrides inside a resource scope —
 * `AppBarButtonInnerBorderMargin`, `AppBarButtonContentViewboxCollapsedMargin` and
 * `AppBarThemeCompactHeight` at `:311`-`:313` — are not here: they are AppBarButton's own
 * keys, already emitted, and the panel re-declares them locally the way the template does.
 *
 * `MTCMediaFontSize` and `MTCMediaFontFamily` are read by `MediaTextBlockStyle` at `:99`
 * and `:100`, and are defined in the framework pin rather than this one (`generic.xaml:66`
 * and `:18`). They are not here either: the same style sets
 * `Style="{ThemeResource CaptionTextBlockStyle}"`, whose ramp already carries the 12px this
 * reproduction emits, so the volume readout takes the Caption class and needs neither key.
 */
export const MEDIATRANSPORTCONTROLS_KEYS = {
	MediaTransportControlsTitleSafeBounds: 'MediaTransportControls title-safe bounds',
	MediaTransportControlsPanelBackground: 'MediaTransportControls panel fill',
	MediaTransportControlsFlyoutBackground: 'MediaTransportControls flyout fill',
	MediaTransportControlsThumbBorderBackground: 'MediaTransportControls slider thumb border',
	MediaTransportControlsFillTimeElapsedText: 'MediaTransportControls elapsed time foreground',
	MediaTransportControlsFillMediaText: 'MediaTransportControls media text foreground',
	MediaTransportControlsBorderBrush: 'MediaTransportControls panel border',
	MediaTransportControlsMargin: 'MediaTransportControls inset inside the player',
	MediaTransportControlsProgressSliderMargin: 'MediaTransportControls progress slider margin',
	MediaTransportControlsProgressSliderCompactMargin:
		'MediaTransportControls progress slider margin, compact',
	MediaTransportControlsBorderThickness: 'MediaTransportControls panel border width',
	MediaTransportControlsAppBarButtonHeight: 'MediaTransportControls command button height',
	MediaTransportControlsAppBarButtonWidth: 'MediaTransportControls command button width',
	MediaTransportControlsSliderHeight: 'MediaTransportControls slider height',
	MediaTransportControlsSliderWidth: 'MediaTransportControls volume slider width',
	MediaTransportControlsMinWidth: 'MediaTransportControls minimum width',
	MediaTransportControlsMaxWidth: 'MediaTransportControls maximum width'
};

/**
 * The Windows accent ramp: the stock accent `#0078D4` and the six steps WinUI
 * derives from it, measured on the same guest through
 * `Windows.UI.ViewManagement.UISettings.GetColorValue`.
 *
 * WinUI derives one ramp from the OS accent regardless of theme, so these are
 * emitted once in `:root` rather than per theme. `SystemAccentColorLight1` is not
 * referenced by this selection and is emitted anyway, because D8's promise is a
 * six-step surface a consumer can override whole — a hole in it would be found by
 * whoever overrides the ramp, at the point it is hardest to explain.
 */
export const ACCENT_COLORS = {
	SystemAccentColorDark3: '#001A68',
	SystemAccentColorDark2: '#003E92',
	SystemAccentColorDark1: '#0067C0',
	SystemAccentColor: '#0078D4',
	SystemAccentColorLight1: '#0091F8',
	SystemAccentColorLight2: '#4CC2FF',
	SystemAccentColorLight3: '#99EBFF'
};
