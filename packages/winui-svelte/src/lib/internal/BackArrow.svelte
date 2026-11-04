<script lang="ts" module>
	/**
	 * The back arrow WinUI draws: the first frame of `AnimatedBackVisualSource`, the `AnimatedIcon`
	 * NavigationView's and TitleBar's back buttons carry (NavigationBackButton.xaml:58-63,
	 * TitleBar_themeresources.xaml:161). At progress 0 only its second layer is visible: the first
	 * starts hidden (AnimatedBackVisualSource.cpp:402) and shows at 0.125 (:183-187), and the
	 * second is opaque from frame 0 (:509-512). That layer's shape visual (:625-637) is three
	 * filled paths, the round cap, the stem and the head (:361-392, geometry at :199-262), each
	 * scaled by 2.25 about the centre of a 48-unit box. The icon is 16 square, so the box is drawn
	 * at a third: a scale of 0.75 about (8, 8). The stem's offset of 23.99975 rather than 24 is
	 * a quarter of a thousandth of the 48-unit box, about 0.0001 pixel here, and is drawn as 24.
	 *
	 * The fallback glyph, U+E72B at 16px, inks 16 by 15 on the reference guest, where the
	 * original's arrow inks 12 by 12 (WD-006); this frame's geometry is 12 by 10.5, which
	 * reaches 12 rows of pixels about the centre. That is why the frame is drawn, not the glyph.
	 * WD-006 still holds for the rest of the composition: the animation between states is not
	 * played, and neither is the shorter arrow it holds while pressed (its stem scaled to 1.62211
	 * at `NormalToPressed_End`).
	 */
	const CAP = 'M7.5 0.499C7.776 0.499 8 0.275 8 -0.001C8 -0.277 7.776 -0.501 7.5 -0.501Z';
	const STEM = 'M-5.334 0.495L7.5 0.499L7.5 -0.501L-5.331 -0.505Z';
	const HEAD =
		'M-0.837 6.868C-0.633 7.054 -0.317 7.04 -0.131 6.836C0.055 6.632 0.041 6.315 -0.163 6.129' +
		'L-6.331 0.499L-5.328 0.489L-5.328 -0.511L-6.328 -0.501L-0.163 -6.129' +
		'C0.041 -6.315 0.055 -6.632 -0.131 -6.836C-0.317 -7.04 -0.633 -7.054 -0.837 -6.868' +
		'L-7.753 -0.554C-7.893 -0.426 -7.973 -0.258 -7.993 -0.085C-7.998 -0.058 -8 -0.03 -8 -0.001' +
		'C-8 0.026 -7.998 0.052 -7.994 0.078C-7.976 0.254 -7.895 0.424 -7.753 0.554Z';
</script>

<svg class="arrow" viewBox="0 0 16 16" aria-hidden="true">
	<g transform="matrix(0.75 0 0 0.75 8 8)" fill="currentColor">
		<path d={CAP} />
		<path d={STEM} />
		<path d={HEAD} />
	</g>
</svg>

<style>
	.arrow {
		display: block;
		/* c1-allow: NavigationBackButton.xaml:58, AnimatedIcon Height="16" Width="16" */
		width: 16px;
		/* c1-allow: NavigationBackButton.xaml:58, AnimatedIcon Height="16" Width="16" */
		height: 16px;
	}

	@media (forced-colors: active) {
		* {
			forced-color-adjust: none;
		}
	}
</style>
