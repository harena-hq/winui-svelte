import { CDP_ENDPOINT, expect, test } from './fixtures';
import { snapshotAllThemes } from './themes';

test('ItemPage in three themes', async ({ page }) => {
	test.skip(!CDP_ENDPOINT, 'no tracked baseline exists for this browser');
	await snapshotAllThemes(page, 'ItemPage', '/dev/item-page');
});

test('the source flyout spaces its label and its links as the pin does', async ({ page }) => {
	await page.goto('/dev/item-page');
	await page.getByRole('button', { name: 'Source code' }).first().click();
	// Nothing photographs this popup. `ItemPage`'s baseline is taken with the flyout shut, so
	// every measurement inside it was unguarded until this test — which is how the four pixels
	// below came to be eight.
	//
	// `ControlSourcePanel` (PageHeader.xaml:147) and its sample-page sibling (:179) carry no
	// `Spacing`. The four pixels between a section's label row and its link, and between one
	// link and the next, are each link's own `Margin="-12,4,-12,0"` (:169, :204, :212). A `gap`
	// beside that margin counts them twice.
	const gaps = await page.evaluate(() => {
		const list = document.querySelector('.source-list')!;
		const top = (selector: string, root: Element) =>
			root.querySelector(selector)!.getBoundingClientRect().top;
		const bottom = (selector: string, root: Element) =>
			root.querySelector(selector)!.getBoundingClientRect().bottom;
		const sections = [...list.querySelectorAll(':scope > section')];
		const links = [...sections[1].querySelectorAll('.source-link')].map((element) =>
			element.getBoundingClientRect()
		);
		const separator = list.querySelector('.separator')!.getBoundingClientRect();
		return {
			labelToLink: sections.map((section) =>
				Math.round(top('.source-link', section) - bottom('.source-label', section))
			),
			linkToLink: Math.round(links[1].top - links[0].bottom),
			linkToSeparator: Math.round(separator.top - sections[0].getBoundingClientRect().bottom),
			separatorToNextSection: Math.round(
				sections[1].getBoundingClientRect().top - separator.bottom
			),
			separatorBleed: Math.round((separator.width - list.getBoundingClientRect().width) / 2)
		};
	});
	expect(gaps.labelToLink).toEqual([4, 4]);
	expect(gaps.linkToLink).toBe(4);
	// The rule sits **below** the link's box, never through it. `ControlSourcePanel`'s
	// `Margin="0,0,0,4"` (:147) is the whole gap above it and the sample panel's
	// `Margin="0,8,0,0"` (:179) the whole gap below; `MenuFlyoutSeparator Margin="-12"` (:177)
	// is applied horizontally only, which is what the twelve on each side below is. Applying it
	// vertically as well drew the rule four pixels inside the link, across its pointer-over
	// fill — measured against a capture of the shipped Gallery, where it is clear of the fill.
	expect(gaps.linkToSeparator).toBe(4);
	expect(gaps.separatorToNextSection).toBe(8);
	expect(gaps.separatorBleed).toBe(12);
});
