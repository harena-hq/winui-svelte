/**
 * A key-frame animation of a scroll position: the shape of the Composition
 * `Vector3KeyFrameAnimation` that `ScrollView`'s `ScrollAnimationStarting` hands out, with the z
 * component dropped because a scroll position has two.
 */

/** A position or a delta in device-independent pixels, x across and y down. */
export interface ScrollVector {
	x: number;
	y: number;
}

/**
 * Composition's `LinearEasingFunction`, `CubicBezierEasingFunction` and `StepEasingFunction`.
 *
 * A step function holds the segment's start value and jumps at the ends of its steps, the last
 * one at the segment's end. When Composition jumps was not measured: the Gallery's only step
 * spans a millionth of its animation.
 */
export type ScrollAnimationEasing =
	| { type: 'linear' }
	| { type: 'cubic-bezier'; controlPoint1: ScrollVector; controlPoint2: ScrollVector }
	| { type: 'step'; stepCount: number };

/**
 * The easing a key frame takes when none is given. No document states Composition's, so it was
 * measured: on the reference WinUI Gallery's ScrollView page, whose "Default" programmatic scroll
 * keeps the stock key frame and sets only its duration, a cubic-bezier fit over two 5000 ms runs
 * gives (0.417, 0.555), (0.000, 0.932), and this curve fits within the same error (2026-10-03).
 */
const DEFAULT_EASING: ScrollAnimationEasing = Object.freeze({
	type: 'cubic-bezier',
	controlPoint1: Object.freeze({ x: 0.41, y: 0.52 }),
	controlPoint2: Object.freeze({ x: 0, y: 0.94 })
});

interface KeyFrame {
	progress: number;
	value: ScrollVector;
	easing: ScrollAnimationEasing;
}

export class ScrollAnimation {
	/** `KeyFrameAnimation.Duration`, in milliseconds. One that is not a positive finite number
	 * ends the animation at its first frame. */
	duration = 0;
	#keyFrames: KeyFrame[] = [];

	/** `KeyFrameAnimation.KeyFrameCount`. */
	get keyFrameCount(): number {
		return this.#keyFrames.length;
	}

	/**
	 * `InsertKeyFrame(normalizedProgressKey, value, easingFunction)`. A key already at that
	 * progress is replaced.
	 */
	insertKeyFrame(
		normalizedProgressKey: number,
		value: ScrollVector,
		easing: ScrollAnimationEasing = DEFAULT_EASING
	): void {
		if (!(normalizedProgressKey >= 0 && normalizedProgressKey <= 1)) {
			throw new RangeError(
				`normalizedProgressKey must be between 0 and 1, not ${normalizedProgressKey}`
			);
		}
		const frame = { progress: normalizedProgressKey, value: { x: value.x, y: value.y }, easing };
		const at = this.#keyFrames.findIndex((other) => other.progress >= normalizedProgressKey);
		if (at === -1) this.#keyFrames.push(frame);
		else if (this.#keyFrames[at].progress === normalizedProgressKey) this.#keyFrames[at] = frame;
		else this.#keyFrames.splice(at, 0, frame);
	}

	/**
	 * The position at `progress` (clamped to [0, 1]) of an animation that starts from `start`.
	 * With no key frame at 0 the animation starts from `start`; the segment that ends at a key
	 * frame is eased by that key frame's easing; past the last key frame the value holds. With no
	 * key frames at all the position is `start`.
	 */
	valueAt(progress: number, start: ScrollVector): ScrollVector {
		const p = Math.min(1, Math.max(0, progress));
		let previous: { progress: number; value: ScrollVector } = { progress: 0, value: start };
		for (const frame of this.#keyFrames) {
			if (frame.progress === 0 || p >= frame.progress) {
				previous = frame;
				continue;
			}
			const eased = ease(
				frame.easing,
				(p - previous.progress) / (frame.progress - previous.progress)
			);
			return {
				x: previous.value.x + (frame.value.x - previous.value.x) * eased,
				y: previous.value.y + (frame.value.y - previous.value.y) * eased
			};
		}
		return { x: previous.value.x, y: previous.value.y };
	}
}

function ease(easing: ScrollAnimationEasing, u: number): number {
	switch (easing.type) {
		case 'linear':
			return u;
		case 'step': {
			const steps = Math.max(1, Math.floor(easing.stepCount));
			return u >= 1 ? 1 : Math.floor(u * steps) / steps;
		}
		case 'cubic-bezier':
			return cubicBezier(easing.controlPoint1, easing.controlPoint2, u);
	}
}

/** One coordinate of a cubic Bézier from (0, 0) to (1, 1) with inner coordinates `a` and `b`. */
function coordinate(a: number, b: number, s: number): number {
	return 3 * (1 - s) * (1 - s) * s * a + 3 * (1 - s) * s * s * b + s * s * s;
}

/** Solves x(s) = u by bisection, then returns y(s). The x of each control point is clamped to
 * [0, 1], which keeps x monotonic and the solve well defined. */
function cubicBezier(p1: ScrollVector, p2: ScrollVector, u: number): number {
	if (u <= 0) return 0;
	if (u >= 1) return 1;
	const x1 = Math.min(1, Math.max(0, p1.x));
	const x2 = Math.min(1, Math.max(0, p2.x));
	let low = 0;
	let high = 1;
	for (let i = 0; i < 60; i++) {
		const middle = (low + high) / 2;
		if (coordinate(x1, x2, middle) < u) low = middle;
		else high = middle;
	}
	return coordinate(p1.y, p2.y, (low + high) / 2);
}
