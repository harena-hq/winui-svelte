import { expect } from '@playwright/test';
import { CDP_ENDPOINT, test } from './fixtures';
import { snapshotAllThemes } from './themes';

type Box = { x: number; y: number; width: number; height: number };

test('ToggleSwitch in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'ToggleSwitch', '/dev/toggle-switch');
});

// The `<input>` is what the accessibility tree and a form read, and a user's click left its
// `checked` one state behind the root's. `check-box.spec.ts` says why the clicks have to be real.
test('the input holds the state after a click and after Space', async ({ page }) => {
	await page.goto('/dev/toggle-switch');
	const input = page.getByRole('switch').first();
	const root = input.locator('xpath=ancestor::div[contains(@class, "root")][1]');
	// The input takes no pointer events; a press lands on the track, inside the label.
	await root.locator('.track').click();
	await expect(root).toHaveAttribute('data-checked', 'true');
	await expect(input).toBeChecked();
	await page.keyboard.press('Space');
	await expect(root).not.toHaveAttribute('data-checked');
	await expect(input).not.toBeChecked();
});

test('the input holds the state when the parent puts it back', async ({ page }) => {
	await page.goto('/dev/checked-input');
	const input = page.getByRole('switch');
	const root = input.locator('xpath=ancestor::div[contains(@class, "root")][1]');
	await root.locator('.track').click();
	await expect(page.locator('#log')).toHaveText('switch:true');
	await expect(root).not.toHaveAttribute('data-checked');
	await expect(input).not.toBeChecked();
});

// `SwitchKnobOn` binds a stroke brush and no `BorderThickness` (ToggleSwitch_themeresources.xaml
// :510), so the on knob is twelve pixels of fill and nothing else. Counted across the knob's
// middle row: the reference's on switch paints ten columns of solid fill there, the two at the
// ends anti-aliased; a one-pixel stroke inside the same twelve leaves eight.
test('the on knob is fill to its edge, with no stroke inside it', async ({ page }) => {
	await page.addInitScript(() => localStorage.setItem('winui-svelte:theme', 'light'));
	await page.goto('/dev/toggle-switch');
	await expect
		.poll(() => page.evaluate(() => document.documentElement.dataset.theme))
		.toBe('light');
	const knob = page.locator('.root[data-checked]:not([data-disabled]) .knob-on').first();
	await expect(knob).toHaveCSS('opacity', '1');
	const box = (await knob.boundingBox())!;
	// The token, resolved apart from the knob, so the colour expected does not depend on how the
	// knob paints it: under a layered background, as the stroked knob had, the knob's own
	// computed colour reads transparent.
	const fill = await page.evaluate(() => {
		const probe = document.createElement('div');
		probe.style.background = 'var(--winui-ToggleSwitchKnobFillOn)';
		document.body.append(probe);
		const value = getComputedStyle(probe).backgroundColor;
		probe.remove();
		return value;
	});
	expect(fill).not.toBe('rgba(0, 0, 0, 0)');
	const shot = await page.screenshot({
		clip: {
			x: Math.floor(box.x) - 2,
			y: Math.floor(box.y),
			width: Math.ceil(box.width) + 4,
			height: Math.ceil(box.height) + 1
		}
	});
	const solid = await page.evaluate(
		async ({ data, fill }) => {
			const image = new Image();
			image.src = `data:image/png;base64,${data}`;
			await image.decode();
			const canvas = document.createElement('canvas');
			canvas.width = image.width;
			canvas.height = image.height;
			const context = canvas.getContext('2d')!;
			context.drawImage(image, 0, 0);
			const target = fill.match(/\d+/g)!.slice(0, 3).map(Number);
			const y = Math.floor(image.height / 2);
			return [...Array(image.width).keys()].filter((x) => {
				const pixel = context.getImageData(x, y, 1, 1).data;
				return target.reduce((sum, value, i) => sum + Math.abs(pixel[i] - value), 0) <= 6;
			}).length;
		},
		{ data: shot.toString('base64'), fill }
	);
	expect(solid).toBeGreaterThanOrEqual(10);
});

test('a pressed knob holds its outer side and grows inward', async ({ page }) => {
	await page.goto('/dev/toggle-switch');
	for (const [state, face, inset] of [
		[':not([data-checked])', '.knob-off', (knob: Box, box: Box) => box.x - knob.x],
		['[data-checked]', '.knob-on', (knob: Box, box: Box) => knob.x + knob.width - box.x - box.width]
	] as const) {
		const root = page.locator(`.root${state}:not([data-disabled])`).first();
		const knob = root.locator('.knob');
		const pressed = root.locator(face);
		const bounds = (await knob.boundingBox())!;
		await page.mouse.move(bounds.x + 10, bounds.y + 10);
		await page.mouse.down();
		await expect(pressed).toHaveCSS('width', '17px');
		expect(inset((await knob.boundingBox())!, (await pressed.boundingBox())!)).toBe(3);
		// Off the switch first, so that the release leaves the next row where it was.
		await page.mouse.move(5, 5);
		await page.mouse.up();
	}
});

test('a disabled knob stays centred under a press', async ({ page }) => {
	await page.goto('/dev/toggle-switch');
	const root = page.locator('.root[data-disabled]:not([data-checked])').first();
	const knob = (await root.locator('.knob').boundingBox())!;
	await page.mouse.move(knob.x + 10, knob.y + 10);
	await page.mouse.down();
	const face = (await root.locator('.knob-off').boundingBox())!;
	expect(face.x - knob.x).toBe((knob.width - face.width) / 2);
	await page.mouse.move(5, 5);
	await page.mouse.up();
});
