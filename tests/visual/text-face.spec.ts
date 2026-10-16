import { CDP_ENDPOINT, expect, test } from './fixtures';

/**
 * ADR 0019: every text stack names a face after the two Segoe families, a system font with
 * Segoe UI Variable's line metrics, so that where neither Segoe family is installed a line box
 * and its baseline are where Segoe puts them. At 14px, Body's size, that line is 19px, the
 * `normal` Chromium gives Segoe UI Variable Text (ADR 0011), with the baseline 15px down.
 *
 * Where Segoe is installed the stack must draw Segoe and nothing of the face, so the same text is
 * measured from the stack and from Segoe alone. Elsewhere each of the face's four rules, two
 * weights upright and italic, must have loaded, and the stack must draw Segoe's line box; a
 * family that is installed nowhere is measured too, as the line the stack would draw without
 * the face.
 */

const SAMPLE = 'Disable button';
const ABSENT = "'NoSuchFamilyIsInstalledAnywhere'";

test('a text stack draws a Segoe line box, from Segoe on Windows and from the face elsewhere', async ({
	page
}) => {
	await page.goto('/');
	const measured = await page.evaluate(
		async ({ sample, absent }) => {
			const root = getComputedStyle(document.documentElement);
			const stack = root.getPropertyValue('--winui-ContentControlThemeFontFamily').trim();
			const face = "'winui-svelte text'";

			/** The line box, the baseline's offset in it and the text's advance. */
			const line = async (family: string, weight: number, style = 'normal') => {
				const block = document.createElement('div');
				block.style.cssText = `position: absolute; font: ${style} ${weight} 14px ${family}; line-height: normal; white-space: nowrap;`;
				const text = document.createElement('span');
				text.textContent = sample;
				const baseline = document.createElement('span');
				baseline.style.cssText = 'display: inline-block; width: 0; height: 0;';
				block.append(text, baseline);
				document.body.append(block);
				await document.fonts.load(`${style} ${weight} 14px ${family}`, sample);
				const box = block.getBoundingClientRect();
				const result = {
					height: box.height,
					baseline: baseline.getBoundingClientRect().top - box.top,
					width: +text.getBoundingClientRect().width.toFixed(2)
				};
				block.remove();
				return result;
			};

			// Each rule is asked for before its status is read, so that what is read is whether
			// its `local()` fonts were found and not whether the page happened to use it.
			for (const style of ['normal', 'italic'])
				for (const weight of [400, 600])
					await document.fonts.load(`${style} ${weight} 14px ${face}`, sample);
			const faces = [...document.fonts]
				.filter((font) => font.family.replace(/["']/g, '') === 'winui-svelte text')
				.map((font) => ({ weight: font.weight, style: font.style, status: font.status }));

			return {
				stack,
				faces,
				stack400: await line(stack, 400),
				stack600: await line(stack, 600),
				stack400italic: await line(stack, 400, 'italic'),
				segoe400: await line("'Segoe UI Variable Text'", 400),
				segoe600: await line("'Segoe UI Variable Text'", 600),
				segoe400italic: await line("'Segoe UI Variable Text'", 400, 'italic'),
				face400: await line(face, 400),
				absent400: await line(`${absent}, sans-serif`, 400)
			};
		},
		{ sample: SAMPLE, absent: ABSENT }
	);

	expect(measured.stack.replace(/"/g, "'")).toContain("'winui-svelte text', sans-serif");
	for (const weight of ['stack400', 'stack600', 'stack400italic'] as const) {
		expect(measured[weight].height, `${weight}: the line box`).toBe(19);
		expect(measured[weight].baseline, `${weight}: the baseline`).toBe(15);
	}

	if (CDP_ENDPOINT) {
		// Segoe resolves, so the stack draws it and the face draws nothing.
		expect(measured.stack400).toEqual(measured.segoe400);
		expect(measured.stack600).toEqual(measured.segoe600);
		expect(measured.stack400italic).toEqual(measured.segoe400italic);
		expect(measured.stack400.width).not.toBe(measured.face400.width);
		// The face is reached only for what Segoe lacks, but it carries the same metrics here.
		expect(measured.face400).toMatchObject({ height: 19, baseline: 15 });
	} else {
		expect(measured.faces).toEqual([
			{ weight: '1 500', style: 'normal', status: 'loaded' },
			{ weight: '501 1000', style: 'normal', status: 'loaded' },
			{ weight: '1 500', style: 'italic', status: 'loaded' },
			{ weight: '501 1000', style: 'italic', status: 'loaded' }
		]);
		expect(measured.stack400).toEqual(measured.face400);
		// Without the face the line is the substitute's own, which is what the face is for.
		expect(measured.absent400.height).not.toBe(19);
	}
});
