import record from '../../../../../data/colorcode.json';
import {
	compile,
	highlight as applyHighlight,
	type HighlightSpan,
	type SampleLanguage,
	type Theme
} from './engine.js';

export type {
	ColorCodeRecord,
	ColorCodeRule,
	ColorCodeLanguage,
	ColorCodeStyle,
	Highlighter,
	HighlightSpan,
	SampleLanguage,
	Theme
} from './engine.js';

// One compilation for the life of the app: every rule's regex is built here rather than on
// each render, which is what `compile` exists to separate from `highlight`.
const highlighter = compile(record);

export function highlight(code: string, language: SampleLanguage, theme: Theme): HighlightSpan[] {
	return applyHighlight(highlighter, code, language, theme);
}
