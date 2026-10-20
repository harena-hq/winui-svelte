/**
 * Where a non-editable ComboBox's list opens: over the box, with the selected item laid on it.
 *
 * Upstream positions this popup itself rather than through a flyout placement.
 * `ComboBox::ArrangePopup` (ComboBox_Partial.cpp:5169-5550) takes the box's Background part as
 * the anchor (`TransformComboBoxToVisual`, :5077-5093) and, for a pointer or a key, asks
 * `GetNonPannablePopupLayout` (:4767-4911) where the list's top goes and how tall it may be.
 * That function lays the centre item — the selected one, or the middle one when nothing is
 * selected — on the box, then adds items above and below it within the window. So a list opens
 * upward and downward at once, which is what a floating layer's `side` cannot express.
 *
 * The editable variant takes `GetEditableComboBoxPopupLayout` (:4913-4974), which opens below
 * the box and flips above it; that one stays on the floating layer.
 */

/**
 * `m_MaxNumberOfItemsThatCanBeShown` and `…OnOneSide` (ComboBox_Partial.h:572-573). The theme
 * dictionaries define `ComboBoxPopupMaxNumberOfItems` as 15 and 7, but `ComboBox::Initialize`
 * looks them up in the control's own `Resources` (ComboBox_Partial.cpp:127-142), as the control is
 * constructed and before markup can have given it any, so the defaults are read as the ones in
 * force.
 * That reading is from the sources; no list longer than nine items has been opened on the
 * reference to confirm it.
 */
export const MAX_ITEMS_SHOWN = 9;
export const MAX_ITEMS_ON_ONE_SIDE = 4;

/** `MaxDropDownHeight` in `DefaultComboBoxStyle` (ComboBox_themeresources.xaml:361). */
export const MAX_DROP_DOWN_HEIGHT = 504;

export interface NonPannableLayout {
	/** The list's top, in the window's coordinates. */
	popupY: number;
	/** The items' extent plus the content margin; the popup's border and padding are not in it. */
	height: number;
	/** The first item shown, which the list is scrolled to. */
	offset: number;
}

/**
 * `GetNonPannablePopupLayout` (ComboBox_Partial.cpp:4767-4911), line for line. `itemHeights` are
 * each item's desired height, which includes its margin (`GetItemLayoutHeight`, :4658-4712).
 * One departure: a centre index equal to the item count is out of bounds here, where upstream's
 * `itemCount < centerItemIndex` (:4780) lets it through to a container that does not exist.
 */
export function nonPannablePopupLayout(
	centerItemIndex: number,
	itemHeights: readonly number[],
	cbY: number,
	cbHeight: number,
	contentMargin: { top: number; bottom: number },
	windowHeight: number,
	popupMaxHeight: number
): NonPannableLayout {
	const itemCount = itemHeights.length;
	if (centerItemIndex >= itemCount || centerItemIndex < 0)
		centerItemIndex = Math.floor(itemCount / 2);
	if (itemCount === 0) return { popupY: cbY, height: cbHeight, offset: 0 };

	let currentItemHeight = itemHeights[centerItemIndex];
	// A box past the window's bottom is laid out as if it sat on that edge (:4797-4802).
	if (cbY + cbHeight >= windowHeight) cbY = windowHeight - cbHeight;

	const calculatedAbove = cbY + cbHeight / 2 - currentItemHeight / 2 - contentMargin.top;
	let above = Math.max(calculatedAbove, 0);
	const upperLimit = Math.max(cbY + cbHeight / 2 - popupMaxHeight / 2, 0);
	const calculatedBelow = above + currentItemHeight + contentMargin.top + contentMargin.bottom;
	let below = Math.min(calculatedBelow, windowHeight);
	const lowerLimit = Math.min(upperLimit + popupMaxHeight, windowHeight);
	let indexAbove = centerItemIndex - 1;
	let indexBelow = centerItemIndex + 1;
	let laid = 1;
	const maxOnOneSide = Math.min(MAX_ITEMS_ON_ONE_SIDE, itemCount);
	const maxAllowed = Math.min(MAX_ITEMS_SHOWN, itemCount);

	// The height the window's bottom cut off the centre item is taken from above it (:4816-4821).
	if (calculatedBelow > windowHeight) above = Math.max(above - calculatedBelow + windowHeight, 0);

	if (indexAbove >= 0) {
		currentItemHeight = itemHeights[indexAbove];
		while (indexAbove >= 0 && above - currentItemHeight >= upperLimit && laid < maxOnOneSide) {
			above -= currentItemHeight;
			laid++;
			indexAbove--;
			if (indexAbove >= 0) currentItemHeight = itemHeights[indexAbove];
		}
	}

	if (indexBelow < itemCount) {
		currentItemHeight = itemHeights[indexBelow];
		while (
			indexBelow < itemCount &&
			below + currentItemHeight < lowerLimit &&
			below - above < popupMaxHeight &&
			laid < maxAllowed
		) {
			below += currentItemHeight;
			laid++;
			indexBelow++;
			if (indexBelow < itemCount) currentItemHeight = itemHeights[indexBelow];
		}
	}

	// Fill with what is left on either side while it fits (:4865-4904). An item above the
	// window's top is still taken, and the room for it is made at the bottom.
	if (indexAbove >= 0 || indexBelow < itemCount) {
		let isAbove = indexAbove >= 0;
		currentItemHeight = itemHeights[isAbove ? indexAbove : indexBelow];
		while (
			below - above + currentItemHeight <= popupMaxHeight &&
			(below + currentItemHeight < windowHeight || above - currentItemHeight >= 0) &&
			laid < maxAllowed
		) {
			if (isAbove) indexAbove--;
			else indexBelow++;
			if (above - currentItemHeight <= 0) below += currentItemHeight;
			else above -= currentItemHeight;
			laid++;
			if (indexAbove >= 0 || indexBelow < itemCount) {
				isAbove = indexAbove >= 0;
				currentItemHeight = itemHeights[isAbove ? indexAbove : indexBelow];
			}
		}
	}

	return { popupY: above, height: below - above, offset: indexAbove + 1 };
}

const px = (value: string) => parseFloat(value) || 0;

/**
 * Places `popup` over `box` as `ArrangePopup` does for a pointer or a key, and returns the first
 * item shown. The window is the layout viewport, which is what `position: fixed` is laid out in.
 *
 * Not ported: the touch path. Upstream opens a list that pans — more than nine items, or more
 * than fit — as a carousel when a touch opened it (:5363-5377); here a touch takes the pointer's
 * layout (WD-105). Nor the right-to-left arm (:5348-5354).
 */
export function placeDropDown(
	popup: HTMLElement,
	box: HTMLElement,
	list: HTMLElement,
	selectedIndex: number
): number {
	const rect = box.getBoundingClientRect();
	const windowWidth = document.documentElement.clientWidth;
	const windowHeight = document.documentElement.clientHeight;
	if (rect.width === 0 || rect.height === 0) return 0;

	// `MinWidth` is the box's width and `MinHeight` its height; `MaxWidth` is the window's, or
	// the box's when that is wider (:5398-5403).
	popup.style.setProperty('--combo-box-width', `${rect.width}px`);
	popup.style.minHeight = `${rect.height}px`;
	popup.style.maxWidth = `${Math.max(rect.width, windowWidth)}px`;

	const items = Array.from(list.children).filter((child) => child instanceof HTMLElement);
	const heights = items.map((item) => {
		const style = getComputedStyle(item);
		return item.getBoundingClientRect().height + px(style.marginTop) + px(style.marginBottom);
	});
	const listStyle = getComputedStyle(list);
	const contentMargin = { top: px(listStyle.marginTop), bottom: px(listStyle.marginBottom) };
	const layout = nonPannablePopupLayout(
		selectedIndex,
		heights,
		rect.top,
		rect.height,
		contentMargin,
		windowHeight,
		MAX_DROP_DOWN_HEIGHT
	);

	// The visuals between the popup and the items are added back, less the content margin the
	// layout already counted (:5405-5416): what remains is the border and the padding.
	const popupStyle = getComputedStyle(popup);
	const chrome =
		px(popupStyle.borderTopWidth) +
		px(popupStyle.borderBottomWidth) +
		px(popupStyle.paddingTop) +
		px(popupStyle.paddingBottom);
	const maxHeight = layout.height + chrome;
	let popupY = layout.popupY;
	// Kept from running past the window's bottom (:5418-5426).
	if (popupY + maxHeight > windowHeight)
		popupY = Math.max(popupY - (popupY + maxHeight - windowHeight), 0);
	popup.style.maxHeight = `${Math.max(0, maxHeight)}px`;

	// Left-aligned with the box, moved left until it fits (:5332-5347), at the width upstream
	// takes, no wider than the window unless the box is (:5327-5329).
	const width = Math.max(rect.width, Math.min(popup.getBoundingClientRect().width, windowWidth));
	let popupX = rect.left < 0 ? -rect.left : 0;
	if (windowWidth < rect.left + width) popupX = windowWidth - (width + rect.left);

	// Rounded to device pixels, as layout rounding rounds the offsets from the box (:5448-5460).
	// Upstream's box is itself on that grid, so its rounded offset and this rounded position
	// land on the same pixel; a box here can sit between two, and its list then still does not.
	const snap = (value: number) =>
		Math.round(value * window.devicePixelRatio) / window.devicePixelRatio;
	popup.style.top = `${snap(popupY)}px`;
	popup.style.left = `${snap(rect.left + popupX)}px`;
	popup.style.visibility = 'visible';
	return layout.offset;
}
