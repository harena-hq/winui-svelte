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

const GATES = [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15];

const MARK = { pass: '  ok  ', fail: ' FAIL ', pending: 'pending' };

let failed = 0;
let pending = 0;

for (const gate of GATES) {
	let result;
	try {
		result = await gate.run();
	} catch (error) {
		result = { status: 'fail', detail: `gate threw: ${error.message}`, sites: [] };
	}

	const suffix =
		result.status === 'pending' ? `${result.detail} — active in ${result.activeIn}` : result.detail;
	console.log(`${MARK[result.status]}  ${gate.id}  ${gate.title}\n         ${suffix}`);

	for (const site of result.sites ?? []) console.log(`           ${site}`);

	if (result.status === 'fail') failed++;
	if (result.status === 'pending') pending++;
}

console.log(`\n${GATES.length - failed - pending} passing, ${pending} pending, ${failed} failing`);
if (pending) {
	console.log('Pending gates are wired but have nothing to check yet. They are listed');
	console.log('every run on purpose: a gate that goes quiet is a gate nobody notices died.');
}

process.exit(failed ? 1 : 0);
