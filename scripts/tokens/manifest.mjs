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
	AccentAcrylicBackgroundFillColorBaseBrush: 'Color page, Background'
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
 * - **The top display mode** — every `Top*` key, `NavigationViewTopPane*`, and the two
 *   overflow-button styles. Not built. It arrives with the Navigation tranche, and its
 *   keys arrive with it.
 * - **The pane header and pane title** — `NavigationViewPaneHeaderRowMinHeight` and
 *   `NavigationViewPaneTitlePresenterMargin`. The Gallery sets neither property, so
 *   nothing renders in either slot. `NavigationViewItemInnerHeaderMargin` was listed here
 *   too and does not belong: despite the name it is the inset inside a *group header* in
 *   the item list, which the Gallery does render.
 * - **The compact-mode child flyout** — `NavigationViewItemChildrenMenuFlyoutPadding`.
 *   That flyout is a Flyout, which belongs to the Dialogs and flyouts tranche.
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
 * `CheckBoxFocusVisualMargin` is seeded for EXCLUDED for a third reason again: the system
 * focus visual it insets is not drawn by any control here. WD-008.
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

	CheckBoxFocusVisualMargin: 'System focus visual inset, listed for EXCLUDED',

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
	PaneToggleButtonHeight: 'NavigationView pane-toggle button, its box',
	PaneToggleButtonWidth: 'NavigationView pane-toggle button, its box',
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

	// The inset of the system focus visual, which no control in this library draws. WD-008.
	CheckBoxFocusVisualMargin: 'System focus visual inset; WD-008 records that none is drawn',

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
		'Pre-Fluent *ThemeBrush family; not referenced by the current RadioButton template'
};

/**
 * The two columns of the type ramp the XAML does not carry: the optical-size face
 * and the line height for each step. The ramp's `FontSize` and `FontWeight` come
 * from the `Style` records; `FontFamily` is `XamlAutoFontFamily` in the source and
 * is replaced by an explicit per-step family here because Windows registers Segoe
 * UI Variable as three separate families rather than one with an `opsz` axis.
 * ADR 0003 is where both decisions were made.
 */
export const TYPE_RAMP = {
	BaseTextBlockStyle: { face: 'Text', lineHeight: 20 },
	CaptionTextBlockStyle: { face: 'Small', lineHeight: 16 },
	BodyTextBlockStyle: { face: 'Text', lineHeight: 20 },
	BodyStrongTextBlockStyle: { face: 'Text', lineHeight: 20 },
	BodyLargeTextBlockStyle: { face: 'Text', lineHeight: 24 },
	BodyLargeStrongTextBlockStyle: { face: 'Text', lineHeight: 24 },
	SubtitleTextBlockStyle: { face: 'Display', lineHeight: 28 },
	TitleTextBlockStyle: { face: 'Display', lineHeight: 36 },
	TitleLargeTextBlockStyle: { face: 'Display', lineHeight: 52 },
	DisplayTextBlockStyle: { face: 'Display', lineHeight: 92 }
};

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
	NavigationBackButtonHeight: 'the back button box',
	NavigationBackButtonWidth: 'the back button box',
	AutoSuggestBoxRightButtonMargin: 'the spacer column right of the query button',
	TitleBarMinDragRegionWidth: 'the column the title bar keeps clear for dragging',
	NavigationViewAutoSuggestAreaHeight: 'the search row in the pane',
	NavigationViewCompactPaneLength: 'the collapsed pane',
	NavigationViewIconBoxWidth: "an item's icon column",
	NavigationViewItemOnLeftIconBoxHeight: "an item's icon box",
	NavigationViewItemOnLeftMinHeight: 'an item in the left pane',
	NavigationViewItemSeparatorHeight: 'the rule between item groups',
	NavigationViewSelectionIndicatorHeight: 'the selection indicator',
	NavigationViewSelectionIndicatorRadius: 'the selection indicator',
	NavigationViewSelectionIndicatorWidth: 'the selection indicator',
	PaneToggleButtonHeight: 'the pane toggle button box',
	PaneToggleButtonWidth: 'the pane toggle button box',
	TitleBarBackButtonWidth: 'the title bar back button',
	TitleBarCompactHeight: 'the title bar row',
	TitleBarExpandedHeight: 'the title bar row',
	TitleBarIconMaxHeight: 'the app icon',
	TitleBarIconMaxWidth: 'the app icon',
	TitleBarLeftHeaderPaddingWidth: 'the inset before the header content',
	TitleBarLeftPaddingWidth: 'the inset the window controls reserve',
	TitleBarPaneToggleButtonWidth: 'the title bar pane toggle button',
	TitleBarRightPaddingWidth: 'the inset the window controls reserve',
	TitleBarTitleMinWidth: 'the title text',

	ButtonBorderThemeThickness: 'the border all three Button styles share',

	CheckBoxSize: 'the box a CheckBox draws its glyph in',
	CheckBoxBorderThickness: "the stroke around a CheckBox's box",
	CheckBoxGlyphSize: "the glyph inside a CheckBox's box",
	CheckBoxHeight: 'the row a CheckBox occupies',
	CheckBoxMinWidth: 'the row a CheckBox occupies',

	RadioButtonBorderThemeThickness: "the stroke around a RadioButton's ring",
	RadioButtonCheckGlyphSize: 'the dot inside a checked RadioButton',
	RadioButtonCheckGlyphPointerOverSize: 'the dot inside a RadioButton under the pointer',
	RadioButtonCheckGlyphPressedOverSize: 'the dot inside a RadioButton while pressed'
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
	NavigationViewItemExpandedGlyph: "an expandable item's chevron",
	CheckBoxCheckedGlyph: "a checked CheckBox's checkmark",
	CheckBoxIndeterminateGlyph: "an indeterminate CheckBox's dash"
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
 * Font families the platform supplies rather than the dictionaries this project reads.
 *
 * `SymbolThemeFontFamily` is referenced from theme resources all over the source — every
 * `FontIcon` in every control template resolves its family through it — and defined in none
 * of them. Its definition lives in the framework dictionary that ships with WinUI rather
 * than in the per-control `*_themeresources.xaml` files the extractor walks, so there is
 * nothing to extract and the value is written here.
 *
 * The value is ADR 0003's decision, not a new one: reference the family by name and embed
 * nothing. `tests/visual/fonts.spec.ts` fails if it stops resolving where the baselines are
 * taken, which is the only place the reference can be checked.
 *
 * One entry, because one is what the acceptance surface needs. WinUI's text-family resource
 * is not here for the same reason the rest of the per-control vocabulary is not: emitting a
 * name nothing reads makes the layer harder to audit and easier to trust wrongly.
 */
export const PLATFORM_FONTS = {
	SymbolThemeFontFamily: "'Segoe Fluent Icons'"
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
 * `themes` is a guard, not decoration. Six of these ten are referenced from `Default` and
 * `Light` records elsewhere in the extraction; those references are outside this
 * selection today, and the day a tranche reaches one, the generator stops rather than
 * silently applying a high-contrast reading to a light one.
 *
 * The values are read from `RevealBrush_themeresources.xaml`, the one place in the pinned
 * source that states high-contrast values for this family; ADR 0008 carries the evidence
 * per row and marks the two that rest on a single witness.
 */
export const PLATFORM_BRUSHES = {
	SystemControlForegroundBaseHighBrush: {
		to: 'SystemColorButtonTextColor',
		themes: ['HighContrast']
	},
	SystemControlBackgroundBaseLowBrush: {
		to: 'SystemColorButtonFaceColor',
		themes: ['HighContrast']
	},
	SystemControlHighlightAltBaseHighBrush: {
		to: 'SystemColorHighlightTextColor',
		themes: ['HighContrast']
	},
	SystemControlHighlightListLowBrush: { to: 'SystemColorHighlightColor', themes: ['HighContrast'] },
	SystemControlHighlightListMediumBrush: {
		to: 'SystemColorHighlightColor',
		themes: ['HighContrast']
	},
	SystemControlDisabledBaseMediumLowBrush: {
		to: 'SystemColorGrayTextColor',
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
	SystemControlHighlightBaseHighBrush: {
		to: 'SystemColorHighlightColor',
		themes: ['HighContrast']
	},
	SystemControlHighlightBaseMediumLowBrush: {
		to: 'SystemColorHighlightColor',
		themes: ['HighContrast']
	},
	SystemControlHighlightTransparentBrush: {
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
	// Why the rule rather than reading the name as a whole: the Button tranche first
	// mapped four rows by reading names whole, and two of its states came out painting
	// `SystemColorHighlightTextColor` on `SystemColorHighlightTextColor` — the label
	// gone on hover, in high contrast, with every gate green. Resolving the pairs is
	// the check; §7.4 of the unit makes the agent run it.
	SystemControlBackgroundAltHighBrush: {
		to: 'SystemColorButtonFaceColor',
		themes: ['HighContrast']
	},
	SystemControlForegroundBaseMediumBrush: {
		to: 'SystemColorButtonTextColor',
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
