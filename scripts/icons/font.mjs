// Builds the face the icon token names after the two Segoe families, for the token generator to
// emit as an `@font-face` rule. ADR 0018.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import svg2ttf from 'svg2ttf';
import svgpath from 'svgpath';
import { FALLBACK_FAMILY, FALLBACK_GLYPHS } from './fallback.mjs';

export const FALLBACK_RECORD = 'data/winui-icon-fallback.json';

// Segoe Fluent Icons' em, ascent and descent as the reference guest measures them, so a glyph
// drawn from this face sits in the line where the Segoe one would.
const EM = 1000;

// Its space's advance there, 292.97 at 1000px. CSS sizes a line from its first available font,
// the first family whose `unicode-range` covers a space, so a face of icons alone would leave the
// line to the browser's default text face and its taller ascent and descent. With an empty space
// of its own, this face is the first available one wherever both Segoe families are absent, and,
// with the line gap `withoutLineGap` removes, the line is an em tall with the glyph on its
// baseline, as Segoe's is.
const SPACE = 293;

// svg2ttf writes this into the font's `head` table as both its creation and modification time.
// Left out, it writes the time of the run, and the generated stylesheet would never match the
// committed one. 2026-10-16T00:00:00Z.
const TIMESTAMP = 1792108800;

/** The subpaths of an absolute, arc-free path, each as its own segment list. */
function subpaths(d) {
	const out = [];
	let closed = false;
	for (const segment of svgpath(d).abs().unshort().unarc().segments) {
		// A drawing command straight after a close starts a subpath of its own, which the split
		// below would merge into the last; no outline in the record does it, so it is refused.
		if (closed && segment[0] !== 'M') throw new Error(`a subpath starts without a move in ${d}`);
		closed = segment[0] === 'Z';
		if (segment[0] === 'M' || out.length === 0) out.push([]);
		out.at(-1).push(segment);
	}
	return out;
}

/** The ink box of a path, `[left, right, top, bottom]` in its own y-down units. */
function inkBox(segments) {
	let [left, right, top, bottom] = [Infinity, -Infinity, Infinity, -Infinity];
	const take = (x, y) => {
		left = Math.min(left, x);
		right = Math.max(right, x);
		top = Math.min(top, y);
		bottom = Math.max(bottom, y);
	};
	// A curve's extremes need not be at its control points, so each is sampled; at 64 steps an
	// icon of 16 units is out by well under a thousandth of an em.
	const curve = (points) => {
		for (let i = 0; i <= 64; i++) {
			const t = i / 64;
			const at = (k) =>
				points.length === 3
					? (1 - t) ** 2 * points[0][k] + 2 * (1 - t) * t * points[1][k] + t ** 2 * points[2][k]
					: (1 - t) ** 3 * points[0][k] +
						3 * (1 - t) ** 2 * t * points[1][k] +
						3 * (1 - t) * t ** 2 * points[2][k] +
						t ** 3 * points[3][k];
			take(at(0), at(1));
		}
	};
	for (const path of segments) {
		let [x, y] = [0, 0];
		let [startX, startY] = [0, 0];
		for (const [command, ...args] of path) {
			if (command === 'M') [x, y, startX, startY] = [args[0], args[1], args[0], args[1]];
			else if (command === 'L') [x, y] = args;
			else if (command === 'H') x = args[0];
			else if (command === 'V') y = args[0];
			else if (command === 'C') {
				curve([[x, y], args.slice(0, 2), args.slice(2, 4), args.slice(4, 6)]);
				[x, y] = args.slice(4, 6);
			} else if (command === 'Q') {
				curve([[x, y], args.slice(0, 2), args.slice(2, 4)]);
				[x, y] = args.slice(2, 4);
			} else if (command === 'Z') [x, y] = [startX, startY];
			else throw new Error(`no ink box for the path command ${command}`);
			take(x, y);
		}
	}
	return [left, right, top, bottom];
}

/**
 * The transform fitting `segments` into a Segoe ink box without distortion, centred, and
 * turning the SVG's y-down units into the font's y-up ones.
 */
function fit(segments, [boxLeft, boxRight, boxBottom, boxTop]) {
	const [left, right, top, bottom] = inkBox(segments);
	const scale = Math.min(
		(boxRight - boxLeft) / (right - left),
		(boxTop - boxBottom) / (bottom - top)
	);
	const x = (boxLeft + boxRight) / 2 - (scale * (left + right)) / 2;
	const y = (boxBottom + boxTop) / 2 + (scale * (top + bottom)) / 2;
	return [scale, 0, 0, -scale, x, y];
}

/** A table's checksum: its bytes as big-endian 32-bit words, padded with zeros, summed. */
function checksum(bytes, offset, length) {
	let sum = 0;
	for (let i = 0; i < length; i += 4) {
		let word = 0;
		for (let k = 0; k < 4; k++) word = word * 256 + (i + k < length ? bytes[offset + i + k] : 0);
		sum = (sum + word) >>> 0;
	}
	return sum;
}

/**
 * svg2ttf writes OS/2 `sTypoLineGap` as 9% of ascent to descent, here the em, and sets
 * `USE_TYPO_METRICS`, and offers no
 * option for either, so a renderer that reads the typo metrics, as Chromium does on Linux, spaces
 * a `line-height: normal` line at 1.09em. Segoe Fluent Icons' line is an em, so the gap is
 * zeroed here, `usWinAscent` drops to the larger of the glyphs' top and the ascent, and the
 * checksums are redone.
 */
function withoutLineGap(font) {
	const tables = {};
	for (let i = 0, count = font.readUInt16BE(4); i < count; i++) {
		const record = 12 + i * 16;
		tables[font.toString('latin1', record, record + 4)] = record;
	}
	const offset = (tag) => font.readUInt32BE(tables[tag] + 8);
	const length = (tag) => font.readUInt32BE(tables[tag] + 12);

	const os2 = offset('OS/2');
	font.writeInt16BE(0, os2 + 72); // sTypoLineGap
	const yMax = font.readInt16BE(offset('head') + 42);
	font.writeUInt16BE(Math.max(yMax, font.readInt16BE(os2 + 68)), os2 + 74); // usWinAscent, against sTypoAscender
	font.writeUInt32BE(checksum(font, os2, length('OS/2')), tables['OS/2'] + 4);

	const head = offset('head');
	font.writeUInt32BE(0, head + 8); // checkSumAdjustment, summed as zero
	font.writeUInt32BE((0xb1b0afba - checksum(font, 0, font.length)) >>> 0, head + 8);
	return font;
}

const draw = (segments, matrix) =>
	svgpath(segments.map((path) => path.map((segment) => segment.join(' ')).join(' ')).join(' '))
		.matrix(matrix)
		.round(1)
		.toString();

/** The fallback face as base64 TrueType, the code points it covers, and its outlines' source. */
export async function fontFace(root) {
	const record = JSON.parse(await readFile(join(root, FALLBACK_RECORD), 'utf8'));
	const outline = (row) => {
		const icon = record.icons[row.fluent];
		if (!icon)
			throw new Error(`${FALLBACK_RECORD} has no ${row.fluent}; run \`pnpm icons:extract\``);
		return subpaths(icon.d);
	};

	const matrices = {};
	const glyphs = [];
	for (const row of FALLBACK_GLYPHS.filter((glyph) => glyph.part !== 'holes')) {
		const segments = outline(row);
		matrices[row.point] = fit(segments, row.box);
		glyphs.push([row.point, draw(segments, matrices[row.point])]);
	}
	for (const row of FALLBACK_GLYPHS.filter((glyph) => glyph.part === 'holes')) {
		const circle = FALLBACK_GLYPHS.find((glyph) => glyph.point === row.with);
		if (!circle || !matrices[row.with]) throw new Error(`${row.point}: no fitted row ${row.with}`);
		const [first, ...holes] = outline(row);
		// The symbol is what follows the circle, so the first subpath has to be that circle.
		const ring = inkBox(outline(circle));
		const same = inkBox([first]).every((edge, i) => Math.abs(edge - ring[i]) < 0.01);
		if (!same) throw new Error(`${row.fluent} does not start with ${circle.fluent}'s circle`);
		if (holes.length === 0) throw new Error(`${row.fluent} has nothing cut out of its circle`);
		glyphs.push([row.point, draw(holes, matrices[row.with])]);
	}
	glyphs.sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

	const svg = `<svg xmlns="http://www.w3.org/2000/svg"><defs><font id="winui-svelte-icons" horiz-adv-x="${EM}"><font-face font-family="${FALLBACK_FAMILY}" units-per-em="${EM}" ascent="${EM}" descent="0"/><missing-glyph horiz-adv-x="${EM}"/><glyph glyph-name="space" unicode=" " horiz-adv-x="${SPACE}" d=""/>${glyphs
		.map(
			([point, d]) =>
				`<glyph glyph-name="u${point}" unicode="&#x${point};" horiz-adv-x="${EM}" d="${d}"/>`
		)
		.join('')}</font></defs></svg>`;
	const font = svg2ttf(svg, {
		ts: TIMESTAMP,
		version: '1.0',
		copyright:
			'Outlines from Fluent UI System Icons, Copyright (c) 2020 Microsoft Corporation, MIT',
		description: 'The glyphs winui-svelte draws for itself, for where Segoe Fluent Icons is absent',
		url: record.source.url
	});
	const base64 = withoutLineGap(Buffer.from(font.buffer)).toString('base64');
	const range = ['U+0020', ...glyphs.map(([point]) => `U+${point}`)];
	return { base64, range, source: record.source };
}
