import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('Hyperlink in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'Hyperlink', '/dev/hyperlink');
});

test('the rest state is underlined and the accent foreground', async ({ page }) => {
	await page.goto('/dev/hyperlink');
	const colors = await page.getByTestId('bare').evaluate((element) => ({
		hyperlink: getComputedStyle(element).color,
		host: getComputedStyle(document.querySelector<HTMLElement>('[data-testid="bare-host"]')!).color
	}));
	await expect(page.getByTestId('bare')).toHaveCSS('text-decoration-line', 'underline');
	expect(colors.hyperlink).not.toBe(colors.host);
});

test('WD-081: the pointer-over state drops the underline', async ({ page }) => {
	await page.goto('/dev/hyperlink');
	const link = page.getByTestId('bare');
	const rest = await link.evaluate((element) => {
		const computed = getComputedStyle(element);
		return { color: computed.color, textDecorationLine: computed.textDecorationLine };
	});
	await page.hover('[data-testid="bare"]');
	const hovered = await link.evaluate((element) => {
		const computed = getComputedStyle(element);
		return { color: computed.color, textDecorationLine: computed.textDecorationLine };
	});
	expect(rest.textDecorationLine).toBe('underline');
	expect(hovered.textDecorationLine).toBe('none');
	expect(hovered.color).not.toBe(rest.color);
});

test('underlineStyle none has no underline at rest either', async ({ page }) => {
	await page.goto('/dev/hyperlink');
	await expect(page.getByTestId('no-underline')).toHaveCSS('text-decoration-line', 'none');
});

test('a Hyperlink with no NavigateUri renders no href', async ({ page }) => {
	await page.goto('/dev/hyperlink');
	await expect(page.getByTestId('no-uri')).not.toHaveAttribute('href');
	await expect(page.getByTestId('not-tab-stop')).toHaveAttribute('tabindex', '-1');
	await expect(page.getByTestId('bare')).not.toHaveAttribute('tabindex');
});

test('a local Foreground reaches the rest state and not the pointer-over one', async ({ page }) => {
	await page.goto('/dev/hyperlink');
	// The pairing this component gets wrong if `foreground` is written as an inline `color`:
	// `UpdateForegroundColor` (Hyperlink.cpp:590-660) reads a locally set Foreground in
	// HYPERLINK_NORMAL only, and the pointer-over and pressed cases go straight to their theme
	// resources. An inline style beats every class rule, so it would hold in all three states and
	// no gate would say so.
	const link = page.getByTestId('own-foreground');
	const rest = await link.evaluate((element) => getComputedStyle(element).color);
	await page.hover('[data-testid="own-foreground"]');
	const hovered = await link.evaluate((element) => getComputedStyle(element).color);

	// What it changes *to* is the assertion that matters, and it needs a hovered link to compare
	// against — a link at rest carries HyperlinkForeground, which is a different question. So
	// `bare` is hovered too and the two pointer-over colours must be the same value.
	await page.hover('[data-testid="bare"]');
	const themeHover = await page
		.getByTestId('bare')
		.evaluate((element) => getComputedStyle(element).color);

	expect(rest).toBe('rgb(100, 149, 237)');
	expect(hovered).not.toBe(rest);
	expect(hovered).toBe(themeHover);
});

test('WD-081: a Hyperlink with no NavigateUri is not in the tab order', async ({ page }) => {
	await page.goto('/dev/hyperlink');
	// The row says the Click-only shape cannot be reached, and this is what says it stays true:
	// if someone adds `tabindex="0"` to the href-less anchor without the keydown half, this fails
	// and sends them to the row rather than letting a dead tab stop ship.
	const reached: string[] = [];
	for (let i = 0; i < 8; i++) {
		await page.keyboard.press('Tab');
		const id = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') ?? '');
		if (id) reached.push(id);
	}
	expect(reached).toContain('bare');
	expect(reached).not.toContain('no-uri');
	expect(reached).not.toContain('not-tab-stop');
});

test('the pressed state has its own colour, and it is not the pointer-over one', async ({
	page
}) => {
	await page.goto('/dev/hyperlink');
	// `HyperlinkForegroundPressed` is emitted and read by `.root:active`, and nothing else in this
	// suite ever enters that state: a screenshot cannot hold it, and every other assertion here
	// stops at hover. `mouse.down()` without an `up` is what holds it.
	const read = () =>
		page.getByTestId('bare').evaluate((element) => {
			const computed = getComputedStyle(element);
			return { color: computed.color, textDecorationLine: computed.textDecorationLine };
		});

	const box = (await page.getByTestId('bare').boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	const hovered = await read();
	await page.mouse.down();
	const pressed = await read();
	await page.mouse.up();

	expect(pressed.color).not.toBe(hovered.color);
	// The underline is gone in this state too — the other half of `m_state == HYPERLINK_NORMAL`
	// being the only disjunct that holds once the resource is false.
	expect(pressed.textDecorationLine).toBe('none');
});
