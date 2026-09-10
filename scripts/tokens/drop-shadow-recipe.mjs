/**
 * `GetDropShadowRecipe` from the pinned `dxaml/xcp/components/graphics/inc/DropShadowRecipe.h`.
 * `manifest.mjs` uses it at three fixed depths and the Gallery's ThemeShadow page drives it
 * continuously from a slider, so it sits where both can read it and is transcribed once.
 *
 * @param {number} translationZ
 * @param {'light' | 'dark'} theme
 * @returns {string}
 */
export function dropShadowRecipe(translationZ, theme) {
	if (theme !== 'light' && theme !== 'dark') {
		throw new Error(`Unsupported drop-shadow theme: ${theme}`);
	}

	const elevation = Math.min(64, translationZ / 2);
	const format = (/** @type {number} */ value) => value.toFixed(3).replace(/\.?0+$/, '');
	const layer = (
		/** @type {number} */ yOffset,
		/** @type {number} */ blurRadius,
		/** @type {number} */ opacity
	) => {
		if (opacity === 0) return null;
		const alpha = Math.trunc(opacity * 255) / 255;
		return `0 ${format(yOffset)}px ${format((2 / 3) * blurRadius)}px rgba(0, 0, 0, ${format(alpha)})`;
	};

	let ambientOpacity = 0;
	let ambientBlurRadius = 2;
	let ambientYOffset = 0;
	let directionalOpacity = 0;

	if (elevation >= 2 && elevation <= 16) {
		directionalOpacity = theme === 'light' ? Math.min(elevation / 100 + 0.06, 0.14) : 0.26;
	} else if (elevation > 16) {
		ambientBlurRadius = elevation / 3;
		ambientYOffset = 2;
		ambientOpacity = theme === 'light' ? 0.15 : 0.37;
		directionalOpacity = theme === 'light' ? 0.19 : 0.37;
	}

	return (
		[
			layer(ambientYOffset, ambientBlurRadius, ambientOpacity),
			layer(elevation * 0.5, elevation, directionalOpacity)
		]
			.filter(Boolean)
			.join(', ') || 'none'
	);
}
