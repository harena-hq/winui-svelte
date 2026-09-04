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
		/* Not stretched. The original keeps its width when the window is resized and is
		   clipped from the right when the window is narrow, so it is sized to its content
		   and `MainWindow.xaml`'s `Stretch` override does not take. `field-sizing: content`
		   is the one declaration that gives an input a XAML measure pass: its width comes
		   from its own content, and from the placeholder while it is empty. Where the
		   property is unsupported the input falls back to its default width, which is
		   narrower and not wrong in the way stretching was. */
		flex: 0 0 auto;
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
		/* The query button is out of flow, so the text reserves its width here: the glyph,
		   its own padding and margin, and the spacer column at the right end. */
		/* c1-allow: AutoSuggestBox_themeresources.xaml:24, :26 and :28 — the inner margin's
		   1 a side, the query padding's 3 a side, and the 4 of the right spacer column */
		margin-right: calc(var(--winui-AutoSuggestBoxIconFontSize) + 12px);
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

	/* Out of flow, and that is the template's own structure rather than a trick: the button
	   sits in a grid column whose row height is the text box's, so it stretches to the row
	   and never sets it — AutoSuggestBox_themeresources.xaml:230. In flow its glyph's line
	   box was the tallest thing in the row and drove the box three pixels past the 32 the
	   original measures.
	   Stretching it is also what widens the pointer target: the original's is a rectangle
	   taller and wider than the glyph, not a box drawn around it. */
	.query {
		position: absolute;
		top: 0;
		bottom: 0;
		right: var(--winui-AutoSuggestBoxRightButtonMargin);
		display: flex;
		align-items: center;
		justify-content: center;
		border: 0;
		background: transparent;
		cursor: pointer;
		margin: var(--winui-AutoSuggestBoxInnerButtonMargin);
		padding: var(--winui-AutoSuggestBoxQueryButtonPadding);
		border-radius: var(--winui-ControlCornerRadius);
		font-family: var(--winui-SymbolThemeFontFamily);
		font-size: var(--winui-AutoSuggestBoxIconFontSize);
		line-height: normal;
		color: var(--winui-TextFillColorSecondaryBrush);
	}

	.query:hover {
		background: var(--winui-SubtleFillColorSecondaryBrush);
	}

	.query:active {
		background: var(--winui-SubtleFillColorTertiaryBrush);
		color: var(--winui-TextFillColorTertiaryBrush);
	}
</style>
