/**
 * XAML's eleven easing functions, transcribed from the pinned WinUI checkout.
 *
 * The maths is `dxaml/xcp/components/animation/EasingFunctions.cpp` and the default parameter
 * values are `dxaml/xcp/core/inc/EasingFunctions.h`; every function below carries the line its
 * closed form is written on, so any one of them can be checked against the pin without a
 * search. Two guards that look like defensive noise are the source's and are kept for that
 * reason: `BackEase` floors its input at zero (`:116-119`) and `CircleEase` clamps its to
 * [-1, 1] (`:90-98`).
 *
 * CSS can state two of these eleven as a `cubic-bezier` and none of the rest, so a curve
 * reaches the browser as a sampled `linear()`. See `LINEAR_STOPS`.
 */
export const EASING_NAMES = [
	'BackEase',
	'BounceEase',
	'CircleEase',
	'CubicEase',
	'ElasticEase',
	'ExponentialEase',
	'PowerEase',
	'QuadraticEase',
	'QuarticEase',
	'QuinticEase',
	'SineEase'
] as const;

export type EasingName = (typeof EASING_NAMES)[number];

export const EASING_MODES = ['EaseOut', 'EaseIn', 'EaseInOut'] as const;

export type EasingMode = (typeof EASING_MODES)[number];

export interface EasingOptions {
	amplitude?: number;
	bounces?: number;
	bounciness?: number;
	oscillations?: number;
	springiness?: number;
	exponent?: number;
	power?: number;
}

const EPSILON = 0.0001;

/**
 * How finely a closed form is sampled into a `linear()`.
 *
 * Measured rather than chosen, and measured against the **worst** of the thirty-three curves
 * rather than a typical one — the polynomials are easy and `BounceEase` and `ElasticEase` are
 * not. Rendered on the reference guest and compared against the closed forms at forty-one
 * sample points, over the 200px of travel the Gallery's own page uses:
 *
 * |   stops | worst error | the curve that decides it |
 * | ------: | ----------: | ------------------------- |
 * |      32 |      14.2px | `BounceEase`              |
 * |     128 |      0.81px | `BounceEase`              |
 * | **256** | **0.187px** | `ElasticEase`             |
 * |     512 |     0.029px | `ElasticEase`             |
 *
 * 256 is the first count that puts every curve inside a quarter of a pixel. Lowering it is not
 * a free saving: 32 is what a polynomial alone would suggest, and it is eighty times wrong on
 * the curve that actually binds.
 */
export const LINEAR_STOPS = 256;

export function easeInCore(name: EasingName, options: EasingOptions = {}): (t: number) => number {
	const amplitude = options.amplitude ?? 1;
	const bounces = Math.max(options.bounces ?? 3, 0);
	const bounciness = (options.bounciness ?? 2) <= 1 + EPSILON ? 1.01 : (options.bounciness ?? 2);
	const oscillations = Math.max(options.oscillations ?? 3, 0);
	const springiness = options.springiness ?? 3;
	const exponent = options.exponent ?? 2;
	const power = Math.max(options.power ?? 2, 0);

	switch (name) {
		case 'BackEase':
			// EasingFunctions.cpp:114
			return (t) => {
				const normalizedTime = Math.max(t, 0);
				return (
					normalizedTime * normalizedTime * normalizedTime -
					normalizedTime * amplitude * Math.sin(normalizedTime * Math.PI)
				);
			};
		case 'BounceEase':
			// EasingFunctions.cpp:288-321
			return (t) => {
				const pow = bounciness ** bounces;
				const oneMinusB = 1 - bounciness;
				const sumOfUnits = (1 - pow) / oneMinusB + pow / 2;
				const unitAtT = t * sumOfUnits;
				const bounceAtT = Math.log(-unitAtT * (1 - bounciness) + 1) / Math.log(bounciness);
				const start = Math.floor(bounceAtT);
				const end = start + 1;
				const startTime = (1 - bounciness ** start) / (oneMinusB * sumOfUnits);
				const endTime = (1 - bounciness ** end) / (oneMinusB * sumOfUnits);
				const midTime = (startTime + endTime) / 2;
				const timeRelToPeak = t - midTime;
				const radius = midTime - startTime;
				const amplitude = (1 / bounciness) ** (bounces - start);
				// A quadratic that hits (startTime, 0), (endTime, 0), and peaks at amplitude.
				return (
					(-amplitude / (radius * radius)) * (timeRelToPeak - radius) * (timeRelToPeak + radius)
				);
			};
		case 'CircleEase':
			// EasingFunctions.cpp:88
			return (t) => {
				const normalizedTime = Math.max(-1, Math.min(t, 1));
				return -1 * (Math.sqrt(1 - normalizedTime * normalizedTime) - 1);
			};
		case 'CubicEase':
			// EasingFunctions.cpp:194
			return (t) => t * t * t;
		case 'ElasticEase':
			// EasingFunctions.cpp:242-258
			return (t) => {
				const modifier =
					Math.abs(springiness) <= EPSILON
						? t
						: (Math.E ** (springiness * t) - 1) / (Math.E ** springiness - 1);
				return modifier * Math.sin(t * (2 * Math.PI * oscillations + Math.PI / 2));
			};
		case 'ExponentialEase':
			// EasingFunctions.cpp:139
			return (t) =>
				Math.abs(exponent) <= EPSILON
					? t
					: (Math.E ** (exponent * t) - 1) / (Math.E ** exponent - 1);
		case 'PowerEase':
			// EasingFunctions.cpp:160
			return (t) => t ** power;
		case 'QuadraticEase':
			// EasingFunctions.cpp:178
			return (t) => t * t;
		case 'QuarticEase':
			// EasingFunctions.cpp:210
			return (t) => t * t * t * t;
		case 'QuinticEase':
			// EasingFunctions.cpp:226
			return (t) => t * t * t * t * t;
		case 'SineEase':
			// EasingFunctions.cpp:339
			return (t) => 1 - Math.sin((1 - t) * (Math.PI / 2));
	}
}

/**
 * The three modes, derived from one `EaseInCore` — `EasingFunctions.cpp:57-85`. An easing is
 * written once and XAML folds it three ways; writing three functions per easing would be three
 * chances to disagree with the pin instead of one.
 */
export function ease(
	name: EasingName,
	mode: EasingMode,
	options: EasingOptions = {}
): (t: number) => number {
	const core = easeInCore(name, options);

	switch (mode) {
		case 'EaseIn':
			return (t) => core(t);
		case 'EaseOut':
			return (t) => 1 - core(1 - t);
		case 'EaseInOut':
			return (t) => (t < 0.5 ? core(t * 2) / 2 : (1 - core(2 - t * 2)) / 2 + 0.5);
	}
}

export function linearEasing(
	name: EasingName,
	mode: EasingMode,
	options: EasingOptions = {}
): string {
	const curve = ease(name, mode, options);
	const values = Array.from({ length: LINEAR_STOPS }, (_, index) =>
		curve(index / (LINEAR_STOPS - 1)).toFixed(6)
	);

	return `linear(${values.join(', ')})`;
}
