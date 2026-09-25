/**
 * The scroll behaviour for a view change upstream animates only while the platform's
 * animations are on. `ScrollViewer::ChangeViewInternal` sets `disableAnimation` from
 * `IsAnimationEnabled()` (ScrollViewer_Partial.cpp:3616), and `BringIntoViewport` passes
 * `animate && IsAnimationEnabled()` (:8733); ADR 0016 reads that switch as
 * `prefers-reduced-motion`. Chromium does not apply the preference to `behavior: 'smooth'`
 * itself — a smooth `scrollBy` is two pixels into its run two frames later either way — so the
 * caller asks here.
 */
export function scrollBehavior(): ScrollBehavior {
	if (typeof matchMedia !== 'function') return 'auto';
	return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}
