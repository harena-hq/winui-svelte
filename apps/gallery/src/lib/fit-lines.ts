/**
 * A wrapping TextBlock is as wide as its widest wrapped line: its desired width is the text
 * layout's, which the ceiling at the rasterization scale rounds up (TextBlock.cpp:1730-1737), and a
 * Button around it is that plus its padding and border. CSS has no length for the width a wrapped
 * box's lines used — `fit-content` takes the width offered once the unwrapped text exceeds it — so
 * this attachment measures the lines once the fonts are in and sets the element's width to the
 * widest, rounded up the same way. The lines it was measured at are the ones it keeps: each is no
 * wider than the width it gets.
 *
 * It measures once. A sample whose text or offered width changes after that is not one it fits.
 * The server-rendered first paint is the unfitted width, so the box narrows once the script
 * runs, where the original's never shows another; and an element that lays out no lines when it
 * runs, inside a hidden ancestor, is left alone.
 */
export function fitLines(node: HTMLElement) {
	let detached = false;
	void document.fonts.ready.then(() => {
		if (detached) return;
		const range = document.createRange();
		range.selectNodeContents(node);
		const rects = Array.from(range.getClientRects(), (rect) => rect.width);
		if (rects.length === 0) return;
		const widest = Math.max(...rects);
		const scale = window.devicePixelRatio;
		node.style.width = `${Math.ceil(widest * scale) / scale}px`;
	});
	return () => {
		detached = true;
	};
}
