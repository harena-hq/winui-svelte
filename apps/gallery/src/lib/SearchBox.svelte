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
		display: flex;
		align-items: center;
		width: 100%;
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
		flex: 1 1 auto;
		min-width: 0;
		padding: 0;
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

	.query {
		display: flex;
		align-items: center;
		justify-content: center;
		border: 0;
		background: transparent;
		cursor: pointer;
		margin: var(--winui-AutoSuggestBoxInnerButtonMargin);
		padding: var(--winui-AutoSuggestBoxQueryButtonPadding);
		margin-right: var(--winui-AutoSuggestBoxRightButtonMargin);
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
