import * as c1 from './c1-no-visual-literals.mjs';
import * as c2 from './c2-tokens-generated.mjs';
import * as c3 from './c3-layer-separation.mjs';
import * as c4 from './c4-theme-matrix.mjs';
import * as c5 from './c5-divergences.mjs';
import * as c6 from './c6-no-consumer-tooling.mjs';
import * as c7 from './c7-acceptance-surface-covered.mjs';
import * as c8 from './c8-gallery-records-current.mjs';
import * as c9 from './c9-tokens-resolve.mjs';
import * as c10 from './c10-commit-subjects.mjs';
import * as c11 from './c11-template-parts.mjs';
import * as c12 from './c12-citations-resolve.mjs';
import * as c13 from './c13-popup-layer.mjs';
import * as c14 from './c14-gradient-in-colour-property.mjs';
import * as c15 from './c15-generated-line-citations.mjs';
import * as c16 from './c16-own-line-citations.mjs';
import * as c17 from './c17-gate-list.mjs';
import * as c18 from './c18-generated-content-alt.mjs';
import * as c19 from './c19-drawn-glyphs-have-a-fallback.mjs';
import * as c20 from './c20-prop-names.mjs';
import * as c21 from './c21-component-text.mjs';

// The suite `pnpm conform` runs, in order. `C17` holds this list to the `c<N>-*.mjs` files
// beside it and to the apparatus row in `docs/keyboard.md`, so a gate lands as a file, an entry
// here and that row together.
export const GATES = [
	c1,
	c2,
	c3,
	c4,
	c5,
	c6,
	c7,
	c8,
	c9,
	c10,
	c11,
	c12,
	c13,
	c14,
	c15,
	c16,
	c17,
	c18,
	c19,
	c20,
	c21
];
