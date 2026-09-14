/**
 * `FlyoutPlacementMode` mapped onto the floating layer's `side` and `align`.
 *
 * Shared because two controls sit on it. `Flyout` and `CommandBarFlyout` are siblings upstream —
 * both derive from `FlyoutBase`, and neither uses the other — so each supplies its own presenter
 * and neither can compose the other's chrome. What they do share is this table, and a second copy
 * of it is a table that drifts.
 *
 * Collisions are avoided for every placement, not only for `auto`. `FlyoutPlacementMode` is a
 * *preferred* placement upstream, and the popup hosting a flyout has `ShouldConstrainToRootBounds`
 * true by default, so a flyout that will not fit is moved until it does rather than drawn off the
 * edge. Measured with avoidance off: the Gallery's own example — a 355px flyout centred on a
 * button 60px from the left of the dev page — rendered at x = -109, a hundred pixels outside the
 * viewport and unreachable. The consequence is that `auto` and `top` resolve to the same
 * behaviour in this reproduction. That is not a collapse of two different things: upstream `Auto`
 * asks the framework to choose, and for a button flyout it chooses Top, which is also why Top is
 * the default.
 */
export type FlyoutPlacement =
	| 'top'
	| 'bottom'
	| 'left'
	| 'right'
	| 'topEdgeAlignedLeft'
	| 'topEdgeAlignedRight'
	| 'bottomEdgeAlignedLeft'
	| 'bottomEdgeAlignedRight'
	| 'leftEdgeAlignedTop'
	| 'leftEdgeAlignedBottom'
	| 'rightEdgeAlignedTop'
	| 'rightEdgeAlignedBottom'
	| 'auto';

export const FLYOUT_PLACEMENTS = {
	top: { side: 'top', align: 'center' },
	bottom: { side: 'bottom', align: 'center' },
	left: { side: 'left', align: 'center' },
	right: { side: 'right', align: 'center' },
	topEdgeAlignedLeft: { side: 'top', align: 'start' },
	topEdgeAlignedRight: { side: 'top', align: 'end' },
	bottomEdgeAlignedLeft: { side: 'bottom', align: 'start' },
	bottomEdgeAlignedRight: { side: 'bottom', align: 'end' },
	leftEdgeAlignedTop: { side: 'left', align: 'start' },
	leftEdgeAlignedBottom: { side: 'left', align: 'end' },
	rightEdgeAlignedTop: { side: 'right', align: 'start' },
	rightEdgeAlignedBottom: { side: 'right', align: 'end' },
	auto: { side: 'top', align: 'center' }
} as const;
