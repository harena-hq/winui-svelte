import { GATES } from './gates.mjs';

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
