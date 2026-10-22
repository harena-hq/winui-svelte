import { expect, test } from './fixtures';

type Page = import('@playwright/test').Page;

/**
 * A non-editable ComboBox's item is one pixel larger on every side than its padding and its
 * label account for, and its fill stops at that pixel rather than running under it.
 *
 * Measured on the reference guest's Expander page: the ExpandDirection list's selected row
 * fills 33 rows of pixels at a 37-pixel pitch, its pill starts one pixel inside the row's edge,
 * and its label one pixel lower than padding alone puts it. The item template binds
 * `BorderThickness` and gives every state but `Normal` a `ComboBoxItemBorderBrush*`
 * (ComboBox_themeresources.xaml:614, :624-733); the width is, as far as traced, the
 * framework's built-in `ComboBoxItemRevealStyle`'s. ComboBox.svelte's comment on the item has
 * the chain and the link in it that is not confirmed.
 */

async function open(page: Page) {
	await page.goto('/basicinput/combobox');
	// The fonts sample, whose selected Courier New opens on the box.
	const trigger = page.locator('button.trigger').nth(1);
	await expect(trigger).toContainText('Courier New');
	await trigger.click();
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	const item = page.locator('.select-popup [data-select-item][data-selected]');
	await expect(item).toHaveText('Courier New');
	// The popup is hidden until it is placed, and a hidden row still has a box and its text.
	await expect(item).toBeVisible();
	return item;
}

test('an item’s pill and label sit one pixel further in than its padding puts them', async ({
	page
}) => {
	const item = await open(page);
	const g = await item.evaluate((el) => {
		const px = (value: string) => parseFloat(value) || 0;
		const style = getComputedStyle(el);
		const box = el.getBoundingClientRect();
		const pill = el.querySelector('.pill')!.getBoundingClientRect();
		const label = el.querySelector('.item-content')!.getBoundingClientRect();
		return {
			box: { left: box.left, top: box.top, height: box.height },
			pill: { left: pill.left, centre: pill.top + pill.height / 2 },
			label: { top: label.top, height: label.height },
			padding: { top: px(style.paddingTop), bottom: px(style.paddingBottom) }
		};
	});
	expect(g.pill.left - g.box.left).toBeCloseTo(1, 3);
	expect(g.label.top - g.box.top).toBeCloseTo(g.padding.top + 1, 3);
	expect(g.box.height).toBeCloseTo(g.label.height + g.padding.top + g.padding.bottom + 2, 3);
	// Not about the border, which is symmetric: the pill stays centred in the row with it.
	expect(g.pill.centre - g.box.top).toBeCloseTo(g.box.height / 2, 3);
});

test('the selected row under the pointer does not darken under its border', async ({ page }) => {
	const item = await open(page);
	// The row opens under the pointer as well as selected: it is laid on the box, under the
	// pointer that opened it, and Chromium enters it there without a move. That is
	// `SelectedPointerOver`, whose fill and border are both `SubtleFillColorTertiary`.
	await expect(item).toHaveAttribute('data-highlighted', '');
	// A row without a border at top or bottom would pass the comparison below as well.
	expect(
		await item.evaluate((el) => {
			const style = getComputedStyle(el);
			return [style.borderTopWidth, style.borderBottomWidth];
		})
	).toEqual(['1px', '1px']);
	const box = (await item.boundingBox())!;
	// A one-pixel column through the row six pixels from its right edge: clear of the
	// three-pixel corner's rounding, and inside the item's eleven pixels of right padding
	// (`ComboBoxItemThemePadding`, ComboBox_themeresources.xaml:335), so clear of the label.
	// One row more on each side, in the items' 2px margin, is the control: the popup's own
	// background, which the fill has to differ from for the comparison to mean anything. The
	// edges are rounded as the row's are painted, each on its own.
	const top = Math.round(box.y) - 1;
	const bottom = Math.round(box.y + box.height) + 1;
	const shot = await page.screenshot({
		clip: { x: Math.round(box.x + box.width - 6), y: top, width: 1, height: bottom - top }
	});
	const column = await page.evaluate(
		async (url) => {
			const image = new Image();
			image.src = url;
			await image.decode();
			const canvas = document.createElement('canvas');
			canvas.width = image.naturalWidth;
			canvas.height = image.naturalHeight;
			const context = canvas.getContext('2d')!;
			context.drawImage(image, 0, 0);
			return Array.from({ length: image.naturalHeight }, (_, y) =>
				Array.from(context.getImageData(0, y, 1, 1).data.slice(0, 3)).join(',')
			);
		},
		`data:image/png;base64,${shot.toString('base64')}`
	);
	// The border's rows read as the fill: the two do not stack.
	const centre = column[Math.floor(column.length / 2)];
	const control = 'the popup background beside the row reads as the row’s fill';
	expect(column[0], control).not.toBe(centre);
	expect(column[column.length - 1], control).not.toBe(centre);
	expect(column[1]).toBe(centre);
	expect(column[column.length - 2]).toBe(centre);
});
