/**
 * The record keeps attribute values exactly as the XAML writes them. Three shapes
 * occur across the 234 colour-bearing values on the Color page: `{ThemeResource X}`,
 * `#RRGGBB`, and `Black` — both measured, both rounded.
 *
 * `resolve` is the only place these strings turn into CSS, and the only place a new
 * shape would have to be taught. The pages are prerendered, so a shape this does
 * not know fails the build rather than rendering a broken swatch — which is the
 * only place that failure can still be cheap.
 *
 * `{StaticResource X}` is accepted alongside `{ThemeResource X}`: none occur today,
 * they mean the same thing in CSS, and the distinction is about when XAML
 * re-evaluates a lookup.
 */
export function resolve(value: string | null): string | null {
	if (value === null) return null;

	const theme = value.match(/^\{(?:Theme|Static)Resource\s+([A-Za-z0-9]+)\}$/);
	if (theme) return `var(--winui-${theme[1]})`;

	if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();

	if (value === 'Black') return 'black';

	throw new Error(`resolve: unrecognised color value ${JSON.stringify(value)}`);
}
