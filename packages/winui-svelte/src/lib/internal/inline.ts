import type { Snippet } from 'svelte';

/**
 * The inherited text formatting every `TextElement` carries, as the props the five
 * content-bearing inlines share.
 *
 * The set is not invented here: `corep.h:487-499` is XAML's whole inherited text formatting
 * record, and FontFamily, Foreground, FontSize, CharacterSpacing, FontWeight, FontStyle,
 * FontStretch, TextDecorations and FlowDirection are its members. Six of those nine are
 * spelled below, with the same names and the same CSS mapping `TextBlock` already gives them,
 * because an inline and the block it sits in take the same members from the same record.
 *
 * The three that are absent, each for its own reason:
 *
 * - `FontStretch` — one CSS declaration (`font-stretch`), unbuilt on `TextBlock` too, and
 *   waiting for the first unit that needs it.
 * - `TextDecorations` — `Underline` sets it internally (`Inline.cpp:331`), so this unit has the
 *   value without needing the prop. Nothing else asks for it: a case-insensitive search of the
 *   whole Gallery checkout, `.xaml` and `.cs` both, returns **zero** writes of
 *   `TextDecorations`, so `Strikethrough` — the only value no element stands for — has no site
 *   to serve. It becomes a prop when one appears.
 * - `FlowDirection` — a member of `Run` rather than of `TextElement` in the generated metadata
 *   (`Indexes.g.h:2082` is `Run_FlowDirection`, and there is no `TextElement_FlowDirection`),
 *   so it is declared on `RunProps` alone.
 *
 * Two more are in that record and are absent anyway. `m_strLanguageString` (`corep.h:490`) and
 * `m_isTextScaleFactorEnabled` (`corep.h:499`) sit between the nine above, and neither is built
 * here: `Language` is `lang`, which belongs to a document rather than to a run of text and which
 * nothing in this library sets; `IsTextScaleFactorEnabled` opts out of the OS text-size setting,
 * whose web analogue is the browser's own font scaling and is not a property a page can decline.
 * The Gallery does write the second of them — `WinUIGallery/Controls/CopyButton.xaml:43` is
 * `<Setter Property="IsTextScaleFactorEnabled" Value="False" />` — so this is a declined member
 * with a live site, not an unused one.
 *
 * Outside the record entirely: the seven `TextElement_` members whose names carry `AccessKey`
 * (`Indexes.g.h:1405`, `:1406`, `:1409`, `:1416`, `:4224`, `:4225`, `:4226`). They are the access
 * key display and invocation surface, which is keyboard behaviour rather than text formatting —
 * roadmap item 18's territory. `AccessibilityKeyboardPage.xaml` writes them 25 times, so this one
 * also has sites; they are simply not this unit's.
 */
export interface InlineProps {
	/** FontFamily. */
	fontFamily?: string;
	/** FontSize. A number is a XAML DIP, rendered as px. */
	fontSize?: number | string;
	/** FontStyle. */
	fontStyle?: 'normal' | 'italic' | 'oblique';
	/** FontWeight. */
	fontWeight?: number | string;
	/**
	 * Foreground, as a CSS colour. XAML's Foreground is a Brush and CSS's `color` is not, so a
	 * gradient brush has no equivalent here and is dropped rather than approximated.
	 */
	foreground?: string;
	/** CharacterSpacing, in thousandths of an em. */
	characterSpacing?: number;
	/** Inlines, as the default snippet. */
	children?: Snippet;
	class?: string;
	style?: string;
	[key: string]: unknown;
}
