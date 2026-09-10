/**
 * XAML's `Geometry` mini-language is SVG's path-data grammar with one addition, and this module
 * is that one addition and nothing else.
 *
 * `CPathGeometry::ParseGeometry` — `core/core/elements/geometry.cpp:1689-1990` — takes the same
 * command letters with the same argument counts, the same implicit `lineto` after an `M`, the
 * same repeat-on-a-bare-number rule and the same arc flags as SVG's `d`. What it also takes is a
 * leading `F0` or `F1` naming the geometry's fill mode (`case 'F'`, `geometry.cpp:1836`, where 0
 * is Alternate and 1 is Winding), and it stops accepting one after the first token
 * (`geometry.cpp:1986`). SVG spells the same thing as the `fill-rule` presentation attribute
 * instead, so the token has to come off the string and go onto the element.
 *
 * The browser is the parser for everything else. Validating any of it here would be a second,
 * less complete implementation of a grammar the platform already has, and its disagreements
 * would be silent — which is the argument ADR 0001 and ADR 0007 make about transcription.
 */

/** The result of reading a XAML `Geometry` mini-language string. */
export interface PathData {
	/** The SVG `d` attribute: the input with any `F0`/`F1` prefix removed. */
	d: string;
	/** The fill rule the prefix named, or EvenOdd when it named none. */
	fillRule: 'evenOdd' | 'nonzero';
}

/**
 * Read a `Path.Data` string: the fill rule its prefix names, and the rest as an SVG `d`.
 *
 * Only the front of the string is examined, because `bAllowFill` is cleared after the first
 * token (`geometry.cpp:1986`) — an `F` anywhere else is not a fill token and is left for the
 * browser. The `F` is matched case-insensitively because the parser masks the command with
 * `& 0x00df` (`geometry.cpp:1922`), which folds case. A separator after the token is optional:
 * `F1M10,10` is as legal as `F1 M10,10`.
 *
 * No prefix means EvenOdd, which is `CPathGeometry`'s own initialiser
 * (`core/inc/geometry.h:370`) and not SVG's `nonzero`. An empty string is a Path that draws
 * nothing rather than an error, so it returns rather than throwing.
 */
export function readPathData(data: string): PathData {
	const match = /^\s*f([01])[\s,]*/i.exec(data);
	if (!match) return { d: data.trim(), fillRule: 'evenOdd' };
	return {
		d: data.slice(match[0].length).trim(),
		fillRule: match[1] === '0' ? 'evenOdd' : 'nonzero'
	};
}
