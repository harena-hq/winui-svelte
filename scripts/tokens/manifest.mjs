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

	// The type ramp's composed `Style` elements: a font size, weight, family and line
	// height bundled into one named style. The seven `*FontSize` keys they read are
	// emitted; the bundles belong to the typography unit, which decides how a
	// composed style becomes a CSS class rather than a custom property.
	BaseTextBlockStyle: 'composed text style; deferred to the typography unit',
	CaptionTextBlockStyle: 'composed text style; deferred to the typography unit',
	BodyTextBlockStyle: 'composed text style; deferred to the typography unit',
	BodyStrongTextBlockStyle: 'composed text style; deferred to the typography unit',
	BodyLargeTextBlockStyle: 'composed text style; deferred to the typography unit',
	BodyLargeStrongTextBlockStyle: 'composed text style; deferred to the typography unit',
	SubtitleTextBlockStyle: 'composed text style; deferred to the typography unit',
	TitleTextBlockStyle: 'composed text style; deferred to the typography unit',
	TitleLargeTextBlockStyle: 'composed text style; deferred to the typography unit',
	DisplayTextBlockStyle: 'composed text style; deferred to the typography unit'
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
 * These are the only colors in the project written by hand rather than extracted.
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
