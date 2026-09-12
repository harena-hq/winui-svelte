type CharacterType = 'glyph' | 'symbolic' | 'standard' | 'other';

const GLYPH_RANGES: ReadonlyArray<readonly [number, number]> = [
	[0x0250, 0x02af],
	[0x0600, 0x06ff],
	[0x0750, 0x077f],
	[0x08a0, 0x08ff],
	[0xfb50, 0xfdff],
	[0xfe70, 0xfeff],
	[0x0900, 0x097f],
	[0xa8e0, 0xa8ff],
	[0x0980, 0x09ff],
	[0x0a00, 0x0a7f],
	[0x0a80, 0x0aff],
	[0x0b00, 0x0b7f],
	[0x0b80, 0x0bff],
	[0x0c00, 0x0c7f],
	[0x0c80, 0x0cff],
	[0x0d00, 0x0d7f],
	[0x0d80, 0x0dff],
	[0x0e00, 0x0e7f],
	[0x0e80, 0x0eff]
];

// Four of these ranges sit above FFFF and so can never match a UTF-16 code unit — they are dead
// in upstream too. They stay so the table is directly checkable against
// InitialsGenerator.cpp:292-583.
const SYMBOLIC_RANGES: ReadonlyArray<readonly [number, number]> = [
	[0x4e00, 0x9fff],
	[0x3400, 0x4dbf],
	[0x20000, 0x2a6df],
	[0x2a700, 0x2b73f],
	[0x2b740, 0x2b81f],
	[0x2e80, 0x2eff],
	[0x3000, 0x303f],
	[0x31c0, 0x31ef],
	[0x3200, 0x32ff],
	[0x3300, 0x33ff],
	[0xf900, 0xfaff],
	[0xfe30, 0xfe4f],
	[0x2f800, 0x2fa1f],
	[0x0370, 0x03ff],
	[0x0590, 0x05ff],
	[0x0530, 0x058f]
];

const STANDARD_RANGES: ReadonlyArray<readonly [number, number]> = [
	[0x0001, 0x007f],
	[0x0080, 0x00ff],
	[0x0100, 0x017f],
	[0x0180, 0x024f],
	[0x2c60, 0x2c7f],
	[0xa720, 0xa7ff],
	[0xab30, 0xab6f],
	[0x1e00, 0x1eff],
	[0x0400, 0x04ff],
	[0x0500, 0x052f],
	[0x0300, 0x036f]
];

const inRanges = (character: number, ranges: ReadonlyArray<readonly [number, number]>) =>
	ranges.some(([start, end]) => character >= start && character <= end);

function characterType(character: number): CharacterType {
	if (inRanges(character, GLYPH_RANGES)) return 'glyph';
	if (inRanges(character, SYMBOLIC_RANGES)) return 'symbolic';
	if (inRanges(character, STANDARD_RANGES)) return 'standard';
	return 'other';
}

function characterTypeOf(text: string): CharacterType {
	let result: CharacterType = 'other';
	for (let index = 0; index < 3; index += 1) {
		const character = text.charCodeAt(index);
		if (character === 0 || character === 0xfeff) break;
		const evaluated = characterType(character);
		if (evaluated === 'glyph') result = 'glyph';
		else if (evaluated === 'symbolic' && result !== 'glyph') result = 'symbolic';
		else if (evaluated === 'standard' && result !== 'glyph' && result !== 'symbolic')
			result = 'standard';
	}
	return result;
}

function stripTrailingBrackets(source: string): string {
	for (const [opener, closer] of [
		['{', '}'],
		['(', ')'],
		['[', ']']
	]) {
		if (!source.endsWith(closer)) continue;
		const start = source.lastIndexOf(opener);
		if (start !== -1) return source.slice(0, start);
	}
	return source;
}

function firstFullCharacter(word: string): string {
	let start = 0;
	while (start < word.length) {
		const character = word.charCodeAt(start);
		if (
			(character >= 0x0021 && character <= 0x002f) ||
			(character >= 0x003a && character <= 0x0040) ||
			(character >= 0x007b && character <= 0x007e)
		)
			start += 1;
		else break;
	}
	if (start === word.length) start = 0;
	let end = start + 1;
	while (end < word.length && word.charCodeAt(end) >= 0x0300 && word.charCodeAt(end) <= 0x036f)
		end += 1;
	return word.slice(start, end);
}

/** The initials WinUI derives from a display name, or `''` when it derives none. */
export function initialsFromDisplayName(displayName: string): string {
	// InitialsGenerator.cpp:26 says symbolic names use their first characters, but :73-124 returns
	// nothing for every non-Standard input. Rendering follows the code, not that stale intent.
	if (characterTypeOf(displayName) !== 'standard') return '';
	// `split(' ')` retains a trailing empty item while std::getline does not; that changes only the
	// iteration count for a trailing delimiter at the 25-piece boundary. Empty pieces still count
	// toward upstream's iteration cap before it drops them.
	const words = stripTrailingBrackets(displayName).split(' ').slice(0, 25).filter(Boolean);
	if (words.length === 0) return '';
	// Upstream's :100-102 says "John -Smith" becomes J-, but its skip loop removes `-`, yielding JS.
	const initials =
		words.length === 1
			? firstFullCharacter(words[0])
			: firstFullCharacter(words[0]) + firstFullCharacter(words[words.length - 1]);
	// `towupper` (:93, :109) maps one code unit to one; `toUpperCase` follows Unicode's full
	// mapping, so a name beginning with U+00DF gives `SS` where upstream gives `ß`.
	return initials.toUpperCase();
}
