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

	// The search box in the title bar.
	AutoSuggestBoxIconFontSize: 'AutoSuggestBox, the query glyph'
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
	ThemeShadowIsUsingDropShadows: 'XAML engine flag, not a style value'
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
	TitleBarTitleMinWidth: 'the title text'
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
	NavigationViewItemExpandedGlyph: "an expandable item's chevron"
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
