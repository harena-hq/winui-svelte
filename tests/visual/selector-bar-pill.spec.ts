import { expect, test } from './fixtures';

type Locator = import('@playwright/test').Locator;

/**
 * When the selection pill moves, and when it does not.
 *
 * Each of SelectorBar.xaml's three `Selected*` states (:97, :116, :133) animates the pill's
 * `ScaleX` to 4 and its `Opacity` to 1 over `ComboBoxItemScaleAnimationDuration` along
 * `KeySpline="0,0,0,1"` — `SelectedNormal`'s keyframes are :109 and :112, and the other two
 * carry the same. The `CombinedStates` group declares no `VisualTransition`, so leaving a
 * selected state ends its storyboard and the pill is back at rest in the same frame. Selecting
 * animates; deselecting does not. Until 2026-09-25 this reproduction declared the transition on
 * the pill at rest, which animated both.
 *
 * Every read is a computed style, or a transition held still, rather than a sample of a running
 * animation, so the load on the machine cannot decide it.
 */

const ROUTE = '/dev/selector-bar';

/** The second bar on the route: five plain pages, `Page1` selected. */
const BAR = 1;

const transitionOf = (pill: Locator) =>
	pill.evaluate((el) => {
		const style = getComputedStyle(el);
		return {
			property: style.transitionProperty,
			duration: style.transitionDuration,
			easing: style.transitionTimingFunction
		};
	});

test('selecting animates the pill and deselecting does not', async ({ page }) => {
	// Pinned, so the reading does not depend on the host's animation setting.
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	await page.goto(ROUTE);
	const items = page.locator('[role="listbox"]').nth(BAR).locator('[role="option"]');
	const selected = items.first();
	const other = items.nth(1);
	await expect(selected).toHaveAttribute('data-selected', 'true');
	await expect(other).not.toHaveAttribute('data-selected');

	// `ComboBoxItemScaleAnimationDuration` is `00:00:00.167` at ComboBox_themeresources.xaml:330,
	// and a computed duration is always written in seconds, so the literal below pins it. The
	// easing is `KeySpline="0,0,0,1"` in `cubic-bezier` order.
	const animated = {
		property: 'opacity, transform',
		duration: '0.167s, 0.167s',
		easing: 'cubic-bezier(0, 0, 0, 1), cubic-bezier(0, 0, 0, 1)'
	};
	// The selected pill carries the transition — which is what runs when a pill becomes selected —
	// and the unselected one carries none, which is what a pill that stops being selected takes.
	expect(await transitionOf(selected.locator('.pill'))).toEqual(animated);
	expect((await transitionOf(other.locator('.pill'))).duration).toBe('0s');

	// And they trade places when the selection moves.
	await other.click();
	await expect(other).toHaveAttribute('data-selected', 'true');
	await expect(selected).not.toHaveAttribute('data-selected');
	expect(await transitionOf(other.locator('.pill'))).toEqual(animated);
	expect((await transitionOf(selected.locator('.pill'))).duration).toBe('0s');
});

test('a bar that loads with a selection grows its pill', async ({ page }) => {
	// `ItemContainer::OnApplyTemplate` calls `UpdateVisualState(true)` (:76), so the
	// selected item enters `SelectedNormal` as it loads and its storyboard runs from the pill's
	// rest values. Animation playback is frozen through the DevTools protocol before the page
	// loads, so the transition the load starts is still there to be read, however long the
	// machine takes to get to the read. Until the component held the pill back itself this read
	// nothing on 7 of 30 loads on the reference machine. In a separate 20, a `transitionrun`
	// listener installed before the page parsed heard none on 6: the transition had not started.
	await page.emulateMedia({ reducedMotion: 'no-preference' });
	const session = await page.context().newCDPSession(page);
	await session.send('Animation.enable');
	await session.send('Animation.setPlaybackRate', { playbackRate: 0 });
	await page.goto(ROUTE);
	const bar = page.locator('[role="listbox"]').nth(BAR);
	const pill = bar.locator('[role="option"][data-selected="true"] .pill');
	// The flag is set two frames after the component mounts, later than the fixture's own
	// hydration signal, and the transition starts when it lands.
	await expect(bar).toHaveAttribute('data-applied');
	// Where each transition starts, not only that it exists: from the pill's rest values, which
	// is what the `data-applied` rule holds it at and what upstream's storyboard starts from. A
	// transition begun for any other reason, or from any other value, fails here.
	const running = await pill.evaluate((el) =>
		el
			.getAnimations()
			.map((animation) => {
				const property = (animation as CSSTransition).transitionProperty;
				const from = (animation.effect as KeyframeEffect).getKeyframes()[0];
				return `${property} from ${String(from[property])}`;
			})
			.sort()
	);
	expect(running).toEqual(['opacity from 0', 'transform from scaleX(1)']);

	// What makes that happen on every load rather than on the loads the parser happened to race:
	// until the bar carries `data-applied`, a selected pill is held at its rest values. Read
	// with transitions off, so this is the rule and not the clock.
	const held = await pill.evaluate((el) => {
		(el as HTMLElement).style.transition = 'none';
		el.closest('[data-applied]')!.removeAttribute('data-applied');
		const style = getComputedStyle(el);
		return `${style.opacity} ${style.transform}`;
	});
	expect(held).toBe('0 matrix(1, 0, 0, 1, 0, 0)');
});

test('under reduced motion selecting still takes the storyboard’s time', async ({ page }) => {
	// ADR 0016: `SelectedNormal`'s growth is the state's own storyboard, which the visual state
	// manager runs whatever the system animation setting. Transitions are skipped and theme
	// animations settled; a state's keyframes run.
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto(ROUTE);
	const items = page.locator('[role="listbox"]').nth(BAR).locator('[role="option"]');
	await items.nth(1).click();
	await expect(items.nth(1)).toHaveAttribute('data-selected', 'true');
	const pill = items.nth(1).locator('.pill');
	expect((await transitionOf(pill)).duration).toBe('0.167s, 0.167s');
	await expect.poll(() => pill.evaluate((el) => getComputedStyle(el).opacity)).toBe('1');
});
