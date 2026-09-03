/**
 * The Geometry and Spacing tables are the only two Design pages whose tables are not
 * in `winui-gallery-design.json`. ADR 0007 says why: they are ad-hoc `Grid`s with
 * positional children and no repeated component, so they are transcribed here with a
 * citation rather than extracted.
 *
 * Source files, at the commit pinned in `winui-gallery-design.json`:
 *   - WinUIGallery/Samples/Geometry/GeometryPage.xaml
 *   - WinUIGallery/Samples/Spacing/SpacingPage.xaml
 */

export interface GeometryRow {
	radius: string;
	label: string;
	usage: string;
	style: string;
}

export const geometryRows: GeometryRow[] = [
	{
		radius: 'var(--winui-OverlayCornerRadius)',
		label: '8px',
		usage: 'Top-level containers such as app windows, flyouts, cards and dialogs.',
		style: 'OverlayCornerRadius'
	},
	{
		radius: 'var(--winui-ControlCornerRadius)',
		label: '4px',
		usage: 'In-page elements such as controls and list backplates.',
		style: 'ControlCornerRadius'
	},
	{
		radius: '0',
		label: '0px',
		usage: 'Straight edges that intersect with other straight edges.',
		style: 'N/a'
	}
];

export interface SpacingRow {
	value: string;
	usage: string;
}

export const spacingRows: SpacingRow[] = [
	{ value: '4epx', usage: 'Spacing used for compact sizing.' },
	{ value: '8epx', usage: 'Spacing between UI controls, control + label.' },
	{
		value: '12epx',
		usage: 'Spacing between control + header, surface and edge text, text sections.'
	},
	{ value: '16epx', usage: 'Padding used in list styles, cards.' },
	{ value: '24epx', usage: 'Spacing between content sections.' },
	{ value: '36epx', usage: 'Padding on pages.' },
	{ value: '48epx', usage: 'Spacing between page sections with title.' }
];
