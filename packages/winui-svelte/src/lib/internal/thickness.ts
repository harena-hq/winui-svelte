/**
 * XAML's `Thickness` as CSS's four values. XAML writes one, two or four numbers —
 * `"8"`, `"8,5"` (left/right then top/bottom), `"1,2,3,4"` (left, top, right, bottom) —
 * which is not CSS's order, so the string is read here rather than passed through.
 * A number is the one-value form. Anything else throws.
 */
export function thicknessToCss(value: number | string): string {
	if (typeof value === 'number') return `${value}px`;
	const values = readNumbers(value, 'Thickness', '1, 2 or 4');
	if (values.length === 1) return `${values[0]}px`;
	if (values.length === 2) return `${values[1]}px ${values[0]}px`;
	if (values.length === 4) return `${values[1]}px ${values[2]}px ${values[3]}px ${values[0]}px`;
	throw grammarError('Thickness', '1, 2 or 4', value);
}

/**
 * XAML's `CornerRadius` as CSS's four radii. One value or four — top-left, top-right,
 * bottom-right, bottom-left — which is CSS's order. Two values are not a CornerRadius.
 */
export function cornerRadiusToCss(value: number | string): string {
	if (typeof value === 'number') return `${value}px`;
	const values = readNumbers(value, 'CornerRadius', '1 or 4');
	if (values.length === 1) return `${values[0]}px`;
	if (values.length === 4) return values.map((part) => `${part}px`).join(' ');
	throw grammarError('CornerRadius', '1 or 4', value);
}

function readNumbers(value: string, grammar: string, expected: string): string[] {
	const values = value.split(/[\s,]+/).filter(Boolean);
	if (values.some((part) => !Number.isFinite(Number(part)))) {
		throw grammarError(grammar, expected, value);
	}
	return values;
}

function grammarError(grammar: string, expected: string, value: string): Error {
	return new Error(`${grammar}: expected ${expected} numbers, got ${JSON.stringify(value)}`);
}
