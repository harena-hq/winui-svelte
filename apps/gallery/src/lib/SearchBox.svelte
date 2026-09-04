<script lang="ts">
	interface Props {
		placeholder: string;
		glyph: string;
	}

	let { placeholder, glyph }: Props = $props();
</script>

<div class="search-box">
	<input type="search" {placeholder} aria-label={placeholder} />
	<button type="button" class="query" aria-label="Search">
		{String.fromCodePoint(parseInt(glyph, 16))}
	</button>
</div>

<!--
	Why the base-palette keys (`ControlFillColorDefaultBrush` and friends) and not the
	TextBox theme resources (`TextControlBackground` and similar): the latter are
	defined in the `Default` and `Light` dictionaries and almost entirely absent from
	the `HighContrast` one, so the token layer cannot carry them. The `Default` and
	`Light` dictionaries do say that each is a `StaticResource` alias onto exactly the
	key used here. A comment, not a token, because what fails in HighContrast is the
	emission, not the key.
-->
<style>
	.search-box {
		position: relative;
		display: flex;
		align-items: center;
		/* Not stretched, and not tight to its content either. The original keeps its width
		   when the window is resized and is clipped from the right when the window is
		   narrow, so `MainWindow.xaml`'s `Stretch` override does not take; and its
		   placeholder ends about seventy pixels short of the query button, so the width is
		   a floor rather than a measure of the text. That floor is
		   `TextControlThemeMinWidth`, which `TextBox_themeresources.xaml:193` binds and
		   which nothing in `controls/dev` defines — the same hole ADR 0008 describes for
		   the legacy brushes, and measured here instead.

		   `field-sizing: content` on the input is what lets the box grow past the floor as
		   text is typed, up to the `MaxWidth` the Gallery sets. Where the property is
		   unsupported the box simply stays at its floor. */
		flex: 0 0 auto;
		/* c1-allow: TextBox_themeresources.xaml:193 binds MinWidth to
		   TextControlThemeMinWidth, which controls/dev defines nowhere. Measured 318px on a
		   capture of the real Gallery — box edges at x=657 and x=975. */
		min-width: 318px;
		/* XAML's `MaxWidth` and `MinHeight` are measured to the outside of the border,
		   which is CSS's border box and not its default. Without this the 580 and the 32
		   below are both understated by the padding and the border — measured 598 by 45
		   before it was added. */
		box-sizing: border-box;
		/* c1-allow: MainWindow.xaml:44, the AutoSuggestBox's MaxWidth="580" */
		max-width: 580px;
		/* c1-allow: TextBox_themeresources.xaml:192 binds MinHeight to
		   TextControlThemeMinHeight, which controls/dev defines only for compact
		   density (dll/DensityStyles/Compact.xaml:10, 24). Measured 32px on a capture
		   of the real Gallery at standard density. */
		min-height: 32px;
		padding: var(--winui-TextControlThemePadding);
		border-style: solid;
		border-width: var(--winui-TextControlBorderThemeThickness);
		border-color: transparent;
		border-radius: var(--winui-ControlCornerRadius);
		/* `TextControlElevationBorderBrush` is a gradient — the token emits
		   `linear-gradient(...)` — and `border-image` would force a square corner
		   that the source rounds. Two background layers keep the round: the fill
		   clipped to the padding box, the gradient to the border box, with the
		   border itself transparent so the second layer shows through exactly where
		   the border is. The fill is written as a two-stop gradient of one colour
		   because a background layer takes an image, not a colour. */
		background:
			linear-gradient(
					var(--winui-ControlFillColorDefaultBrush),
					var(--winui-ControlFillColorDefaultBrush)
				)
				padding-box,
			var(--winui-TextControlElevationBorderBrush) border-box;
		color: var(--winui-TextFillColorPrimaryBrush);
	}

	.search-box:hover {
		background:
			linear-gradient(
					var(--winui-ControlFillColorSecondaryBrush),
					var(--winui-ControlFillColorSecondaryBrush)
				)
				padding-box,
			var(--winui-TextControlElevationBorderBrush) border-box;
	}

	.search-box:focus-within {
		background:
			linear-gradient(
					var(--winui-ControlFillColorInputActiveBrush),
					var(--winui-ControlFillColorInputActiveBrush)
				)
				padding-box,
			var(--winui-TextControlElevationBorderFocusedBrush) border-box;
		border-width: var(--winui-TextControlBorderThemeThicknessFocused);
	}

	.search-box input {
		field-sizing: content;
		min-width: 0;
		padding: 0;
		/* The query button is out of flow, so the text reserves its width here: the button's
		   32, its 2 of left margin, and the 4 of the spacer column at the right end. */
		/* c1-allow: AutoSuggestBox_themeresources.xaml:244, Width="32" and Margin="2,0,0,0" */
		margin-right: 38px;
		border: 0;
		background: transparent;
		color: inherit;
		font: inherit;
		/* `font: inherit` brings the Gallery's body line height with it, and the original's
		   text box has none of ours: its `FontSize` is `ControlContentThemeFontSize` and
		   its line spacing is the font's own. `normal` is that, and it is a keyword rather
		   than a number, so it is a value and not a measurement. */
		line-height: normal;
		outline: none;
	}

	.search-box input::placeholder {
		color: var(--winui-TextFillColorSecondaryBrush);
	}

	.search-box input::selection {
		background: var(--winui-AccentFillColorSelectedTextBackgroundBrush);
	}

	/* `QueryButton` is 32 by 28 with 2 of left margin — AutoSuggestBox_themeresources.xaml:244
	   — and it sits in a grid column, so it is a fixed rectangle rather than a box drawn
	   around its glyph. Out of flow here for the same reason: in the template the row's
	   height comes from the text box, and in flow this button's line box was the tallest
	   thing in the row and pushed the box three pixels past the 32 the original measures.

	   Its glyph takes `{TemplateBinding FontSize}` — the text box's own, not
	   `AutoSuggestBoxIconFontSize`, which this template applies to the delete button at
	   :101 and never to this one. That is why the magnifier was reading light: 12 where
	   the original draws 14. */
	.query {
		position: absolute;
		top: 50%;
		translate: 0 -50%;
		right: var(--winui-AutoSuggestBoxRightButtonMargin);
		display: flex;
		align-items: center;
		justify-content: center;
		/* c1-allow: AutoSuggestBox_themeresources.xaml:244, QueryButton Width="32" */
		width: 32px;
		/* c1-allow: AutoSuggestBox_themeresources.xaml:244, QueryButton Height="28" */
		height: 28px;
		padding: 0;
		/* The fill is inset from the button. `QueryButtonStyle`'s presenter — the element
		   that paints the background, :101 inside the style at :97 — carries
		   `AutoSuggestBoxInnerButtonMargin`, so a 32 by 28 button fills 30 by 22. Measured
		   on the original with the pointer over it: 30 wide and 22 tall, which is why the
		   fill has a gap above and below and ours did not. A transparent border of that
		   width, with the background clipped to the padding box, is that inset without a
		   second element. */
		border-style: solid;
		border-color: transparent;
		/* Longhand, because the `border` shorthand takes one width and this token is two —
		   written as a shorthand the whole declaration is dropped, silently, exactly as a
		   negative padding was earlier in this repository. */
		border-width: var(--winui-AutoSuggestBoxInnerButtonMargin);
		background: transparent;
		background-clip: padding-box;
		cursor: pointer;
		border-radius: var(--winui-ControlCornerRadius);
		font-family: var(--winui-SymbolThemeFontFamily);
		/* 14 is what `{TemplateBinding FontSize}` resolves to and it overshoots: it draws 13
		   by 12 of ink against the original's 11 by 11, where 12 draws 11 by 10 and 13
		   draws 12 by 11. */
		/* c1-allow: measured 13px against a capture of the real Gallery's magnifier */
		font-size: 13px;
		line-height: normal;
		color: var(--winui-TextFillColorSecondaryBrush);
	}

	.query:hover {
		background: var(--winui-SubtleFillColorSecondaryBrush);
		background-clip: padding-box;
	}

	.query:active {
		background: var(--winui-SubtleFillColorTertiaryBrush);
		background-clip: padding-box;
		color: var(--winui-TextFillColorTertiaryBrush);
	}
</style>
