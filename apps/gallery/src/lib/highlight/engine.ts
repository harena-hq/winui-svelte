export type Theme = 'light' | 'dark';
export type SampleLanguage = 'xaml' | 'csharp';

/** One run of text with the colour ColorCode gives it. `color` is null where no rule scoped it. */
export interface HighlightSpan {
	text: string;
	color: string | null;
	bold: boolean;
	italic: boolean;
}

export interface ColorCodeStyle {
	scope: string;
	foreground: string | null;
	background?: string | null;
	referenceName: string;
	bold?: boolean;
	italic?: boolean;
}

export interface ColorCodeRule {
	pattern: string;
	captures: Record<string, string | undefined>;
}

export interface ColorCodeLanguage {
	id: string;
	aliases: string[];
	rules: ColorCodeRule[];
}

export interface ColorCodeRecord {
	palette: {
		light: ColorCodeStyle[];
		dark: ColorCodeStyle[];
		galleryDark: {
			removed: string[];
			added: ColorCodeStyle[];
		};
	};
	languages: ColorCodeLanguage[];
}

interface RepeatedCaptureGroup {
	regex: RegExp;
	firstCapture: number;
}

interface CompiledRule {
	regex: RegExp;
	captures: Map<number, string>;
	repeatedGroups: RepeatedCaptureGroup[];
}

interface CompiledLanguage {
	rules: CompiledRule[];
}

/** Everything derived from the record once, so a render does no regex compilation. */
export interface Highlighter {
	languages: Record<SampleLanguage, CompiledLanguage>;
	palettes: Record<Theme, Map<string, ColorCodeStyle>>;
}

interface Group {
	start: number;
	contentStart: number;
	end: number;
	capture: number | null;
}

interface Capture {
	start: number;
	end: number;
	scope: string;
}

function readOptions(pattern: string): { source: string; flags: string } {
	const start = /^\(\?([isxm]+)\)/.exec(pattern);
	const source = start === null ? pattern : pattern.slice(start[0].length);
	let inClass = false;

	for (let index = 0; index < source.length; index += 1) {
		if (source[index] === '\\') {
			index += 1;
			continue;
		}
		if (source[index] === '[') inClass = true;
		else if (source[index] === ']') inClass = false;
		else if (!inClass && source[index] === '(' && source[index + 1] === '?') {
			const option = /^\(\?[isxm-]+(?::|\))/.exec(source.slice(index));
			if (option !== null) {
				throw new Error(
					`ColorCode inline option group is only supported at the pattern start: ${pattern}`
				);
			}
		}
	}

	const options = start?.[1] ?? '';
	return {
		source: options.includes('x') ? removeFreeSpacing(source) : source,
		flags: `${options.includes('i') ? 'i' : ''}${options.includes('s') ? 's' : ''}m`
	};
}

function removeFreeSpacing(pattern: string): string {
	let result = '';
	let inClass = false;

	for (let index = 0; index < pattern.length; index += 1) {
		const character = pattern[index];
		if (character === '\\') {
			result += character + (pattern[index + 1] ?? '');
			index += 1;
			continue;
		}
		if (character === '[') inClass = true;
		if (character === ']') inClass = false;
		if (!inClass && character === '#') {
			while (index + 1 < pattern.length && pattern[index + 1] !== '\n') index += 1;
			continue;
		}
		if (!inClass && /\s/.test(character)) continue;
		result += character;
	}

	return result;
}

function isCapturingGroup(source: string, index: number): boolean {
	if (source[index + 1] !== '?') return true;
	return source[index + 2] === '<' && source[index + 3] !== '=' && source[index + 3] !== '!';
}

function removeEmptyTopLevelAlternatives(source: string, group: Group): string {
	const prefix = source.slice(group.start, group.contentStart);
	const content = source.slice(group.contentStart, group.end);
	const alternatives: string[] = [];
	let start = 0;
	let depth = 0;
	let inClass = false;

	for (let index = 0; index < content.length; index += 1) {
		if (content[index] === '\\') {
			index += 1;
			continue;
		}
		if (content[index] === '[') inClass = true;
		else if (content[index] === ']') inClass = false;
		else if (!inClass && content[index] === '(') depth += 1;
		else if (!inClass && content[index] === ')') depth -= 1;
		else if (!inClass && depth === 0 && content[index] === '|') {
			alternatives.push(content.slice(start, index));
			start = index + 1;
		}
	}
	alternatives.push(content.slice(start));
	const nonEmpty = alternatives.filter((alternative) => alternative.length > 0);
	if (nonEmpty.length === 0)
		throw new Error(`ColorCode repeated capture group has only empty alternatives: ${source}`);
	return `${prefix}${nonEmpty.join('|')})`;
}

function repeatedCaptureGroups(source: string, flags: string): RepeatedCaptureGroup[] {
	const groups: Group[] = [];
	const stack: Group[] = [];
	let captureCount = 0;
	let inClass = false;

	for (let index = 0; index < source.length; index += 1) {
		if (source[index] === '\\') {
			index += 1;
			continue;
		}
		if (source[index] === '[') {
			inClass = true;
			continue;
		}
		if (source[index] === ']') {
			inClass = false;
			continue;
		}
		if (inClass) continue;
		if (source[index] === '(') {
			const capture = isCapturingGroup(source, index) ? ++captureCount : null;
			let contentStart = index + 1;
			if (source[index + 1] === '?') {
				if (source[index + 2] === ':') contentStart += 2;
				else if (source[index + 2] === '<') {
					const nameEnd = source.indexOf('>', index + 3);
					contentStart = nameEnd + 1;
				}
			}
			const group = { start: index, contentStart, end: -1, capture };
			groups.push(group);
			stack.push(group);
		} else if (source[index] === ')') {
			const group = stack.pop();
			if (group === undefined)
				throw new Error(`ColorCode pattern has an unmatched closing group: ${source}`);
			group.end = index;
		}
	}
	if (stack.length > 0) throw new Error(`ColorCode pattern has an unclosed group: ${source}`);

	return groups.flatMap((group) => {
		const quantifier = source[group.end + 1];
		const captures = groups.filter(
			(candidate) =>
				candidate.capture !== null && candidate.start >= group.start && candidate.end <= group.end
		);
		if (!['*', '+', '{'].includes(quantifier) || captures.length === 0) return [];
		const firstCapture = captures[0].capture;
		if (firstCapture === null) return [];
		return [
			{
				regex: new RegExp(removeEmptyTopLevelAlternatives(source, group), `${flags}gd`),
				firstCapture
			}
		];
	});
}

function compileRule(rule: ColorCodeRule): CompiledRule {
	const { source, flags } = readOptions(rule.pattern);
	const captures = new Map<number, string>();
	for (const [index, scope] of Object.entries(rule.captures)) {
		if (scope !== undefined) captures.set(Number(index), scope);
	}
	return {
		regex: new RegExp(source, `${flags}dy`),
		captures,
		repeatedGroups: repeatedCaptureGroups(source, flags)
	};
}

function languageFor(record: ColorCodeRecord, alias: SampleLanguage): CompiledLanguage {
	const language = record.languages.find((candidate) => candidate.aliases.includes(alias));
	if (language === undefined)
		throw new Error(`ColorCode record has no language with the ${alias} alias`);
	return { rules: language.rules.map(compileRule) };
}

export function compile(record: ColorCodeRecord): Highlighter {
	const darkStyles = record.palette.dark.filter(
		(style) => !record.palette.galleryDark.removed.includes(style.scope)
	);
	darkStyles.push(...record.palette.galleryDark.added);
	return {
		languages: { xaml: languageFor(record, 'xaml'), csharp: languageFor(record, 'csharp') },
		palettes: {
			light: new Map(record.palette.light.map((style) => [style.scope, style])),
			dark: new Map(darkStyles.map((style) => [style.scope, style]))
		}
	};
}

function addCaptures(
	captures: Capture[],
	indices: RegExpIndicesArray,
	scopes: Map<number, string>,
	offset: number
): void {
	for (const [index, scope] of scopes) {
		const range = indices[index];
		if (range !== undefined && range[1] > range[0])
			captures.push({ start: offset + range[0], end: offset + range[1], scope });
	}
}

function capturesForMatch(rule: CompiledRule, match: RegExpExecArray): Capture[] {
	const captures: Capture[] = [];
	const indices = match.indices;
	if (indices === undefined) throw new Error('ColorCode regex did not provide match indices');
	addCaptures(captures, indices, rule.captures, 0);

	for (const repeated of rule.repeatedGroups) {
		for (const rescanned of match[0].matchAll(repeated.regex)) {
			if (rescanned[0].length === 0) continue;
			const rescanIndices = rescanned.indices;
			if (rescanIndices === undefined)
				throw new Error('ColorCode rescan regex did not provide match indices');
			for (let index = 1; index < rescanIndices.length; index += 1) {
				const scope = rule.captures.get(repeated.firstCapture + index - 1);
				const range = rescanIndices[index];
				if (scope !== undefined && range !== undefined && range[1] > range[0]) {
					captures.push({ start: match.index + range[0], end: match.index + range[1], scope });
				}
			}
		}
	}

	return captures.filter(
		(capture, index, all) =>
			all.findIndex(
				(candidate) =>
					candidate.scope === capture.scope &&
					candidate.start === capture.start &&
					candidate.end === capture.end
			) === index
	);
}

function styleFor(
	highlighter: Highlighter,
	scope: string | null,
	theme: Theme
): Pick<HighlightSpan, 'color' | 'bold' | 'italic'> {
	if (scope === null) return { color: null, bold: false, italic: false };
	const style = highlighter.palettes[theme].get(scope);
	if (style === undefined || style.foreground === null)
		return { color: null, bold: style?.bold ?? false, italic: style?.italic ?? false };
	if (!/^#[0-9a-fA-F]{8}$/.test(style.foreground)) {
		throw new Error(
			`Invalid ColorCode foreground for scope ${scope} in ${theme} theme: ${style.foreground}`
		);
	}
	return {
		color: `#${style.foreground.slice(3)}${style.foreground.slice(1, 3)}`,
		bold: style.bold ?? false,
		italic: style.italic ?? false
	};
}

export function highlight(
	highlighter: Highlighter,
	code: string,
	language: SampleLanguage,
	theme: Theme
): HighlightSpan[] {
	const captures: Capture[] = [];
	const rules = highlighter.languages[language].rules;

	for (let position = 0; position < code.length;) {
		let match: RegExpExecArray | null = null;
		let matchedRule: CompiledRule | null = null;
		for (const rule of rules) {
			rule.regex.lastIndex = position;
			const candidate = rule.regex.exec(code);
			if (candidate !== null && candidate[0].length > 0) {
				match = candidate;
				matchedRule = rule;
				break;
			}
		}
		if (match === null || matchedRule === null) {
			position += 1;
			continue;
		}
		captures.push(...capturesForMatch(matchedRule, match));
		position += match[0].length;
	}

	const painted: (Capture | null)[] = Array.from({ length: code.length }, () => null);
	for (const capture of captures) {
		for (let index = capture.start; index < capture.end; index += 1) {
			const current = painted[index];
			if (current === undefined) {
				throw new Error(`ColorCode capture falls outside the matched source: ${capture.scope}`);
			}
			if (current === null || capture.end - capture.start < current.end - current.start)
				painted[index] = capture;
		}
	}

	const spans: HighlightSpan[] = [];
	for (let index = 0; index < code.length;) {
		const scope = painted[index]?.scope ?? null;
		const style = styleFor(highlighter, scope, theme);
		let end = index + 1;
		while (end < code.length && (painted[end]?.scope ?? null) === scope) end += 1;
		spans.push({ text: code.slice(index, end), ...style });
		index = end;
	}
	return spans;
}
