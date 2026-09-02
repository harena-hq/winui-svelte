import { CDP_ENDPOINT, expect, test } from './fixtures';

/**
 * The families the token layer names. Only these three optical sizes are registered —
 * `Segoe UI Variable` without a suffix is not a resolvable family name, however
 * reasonable it looks in a stack.
 */
const REQUIRED = [
	'Segoe UI Variable Small',
	'Segoe UI Variable Text',
	'Segoe UI Variable Display',
	'Segoe Fluent Icons',
	'Segoe UI'
];

test('the families the token layer names resolve where baselines are taken', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'only meaningful on the machine the tracked baselines come from');

	await page.goto('/');
	const measured = await page.evaluate(
		async ({ families }) => {
			await document.fonts.ready;

			// `document.fonts.check()` is not a presence test: it answers whether the text
			// could be rendered, so it returns true for a family that does not exist. The
			// honest test is to measure a glyph run against a name that certainly is not
			// installed — a family that resolves renders at a different width than the
			// fallback does.
			const context = document.createElement('canvas').getContext('2d');
			if (!context) throw new Error('no 2d context');
			const width = (family: string) => {
				context.font = `32px "${family}", monospace`;
				return +context.measureText('Windows 11 Fluent').width.toFixed(2);
			};

			return {
				control: width('NoSuchFamilyIsInstalledAnywhere'),
				widths: Object.fromEntries(families.map((f) => [f, width(f)])),
				devicePixelRatio: window.devicePixelRatio
			};
		},
		{ families: REQUIRED }
	);

	for (const family of REQUIRED) {
		expect(measured.widths[family], `${family} fell back to the default face`).not.toBe(
			measured.control
		);
	}

	// A scaled display rewrites every captured coordinate, so a baseline taken at
	// anything but 1 pins the scaling rather than the design.
	expect(measured.devicePixelRatio).toBe(1);
});
