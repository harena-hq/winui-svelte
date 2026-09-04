export type ThemeChoice = '' | 'light' | 'dark' | 'high-contrast';

export const THEMES: { value: ThemeChoice; label: string }[] = [
	{ value: '', label: 'System' },
	{ value: 'light', label: 'Light' },
	{ value: 'dark', label: 'Dark' },
	{ value: 'high-contrast', label: 'High contrast' }
];

class Theme {
	value = $state<ThemeChoice>('');
}

export const theme = new Theme();
