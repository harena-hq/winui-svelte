import record from '../../../../data/winui-gallery-design.json' with { type: 'json' };

/**
 * The Design pages' content, extracted from microsoft/WinUI-Gallery at the commit
 * stored in `record.source.commit` and verified by the SHA-256s in `record.source.files`.
 *
 * The record is the content. Every string, colour and count on these pages comes from it, never
 * typed out — except the Geometry and Spacing tables, which `design-tables.ts` transcribes with a
 * citation. ADR 0007 says why.
 *
 * Types are deliberately narrow: nothing here is `any`, and the two `kind`s are
 * distinguished at the type level so the page cannot read an example field off a
 * tiles item by accident.
 */

export type NavItem = (typeof record.nav)[number];

export interface ColorTile {
	colorName: string;
	colorBrushName: string;
	colorExplanation: string;
	colorValue: string;
	background: string | null;
	foreground: string | null;
	showSeparator: string | null;
	backdrop: string | null;
	column: string | null;
	row: string | null;
	hasComment: boolean;
}

export interface ColorExample {
	kind: 'example';
	title: string;
	description: string;
	background: string | null;
	foreground: string | null;
	illustration: string[];
	section: string;
}

export interface ColorTiles {
	kind: 'tiles';
	columns: number;
	rows: number;
	tiles: ColorTile[];
	section: string;
}

export type ColorItem = ColorExample | ColorTiles;

export interface TypographyRow {
	example: string;
	variableFont: string;
	sizeLineHeight: string;
	weight: string;
	resourceName: string;
	exampleStyle: string;
}

export interface Icon {
	Code: string;
	Name: string;
	Tags: string[];
}

export default record;
export const nav: NavItem[] = record.nav;
export const colorSections: string[] = record.color.sections;
export const colorItems = record.color.items as ColorItem[];
export const typographyRows: TypographyRow[] = record.typography.rows;
export const icons: Icon[] = record.icons;
