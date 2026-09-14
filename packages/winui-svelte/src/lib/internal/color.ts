/**
 * HSV-to-RGB conversion transcribed from
 * `controls/dev/Common/ColorConversion.cpp:136-…` in the WinUI 3 pin.
 */
export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
	while (h < 0) h += 360;
	while (h >= 360) h -= 360;
	s = Math.min(1, Math.max(0, s));
	v = Math.min(1, Math.max(0, v));

	const chroma = s * v;
	const minimum = v - chroma;
	if (chroma === 0) {
		const channel = Math.round(minimum * 255);
		return { r: channel, g: channel, b: channel };
	}

	const sector = h / 60;
	const second = chroma * (1 - Math.abs((sector % 2) - 1));
	let red = 0;
	let green = 0;
	let blue = 0;
	if (sector < 1) [red, green] = [chroma, second];
	else if (sector < 2) [red, green] = [second, chroma];
	else if (sector < 3) [green, blue] = [chroma, second];
	else if (sector < 4) [green, blue] = [second, chroma];
	else if (sector < 5) [red, blue] = [second, chroma];
	else [red, blue] = [chroma, second];

	return {
		r: Math.round((red + minimum) * 255),
		g: Math.round((green + minimum) * 255),
		b: Math.round((blue + minimum) * 255)
	};
}
