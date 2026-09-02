import { fail, pass, read, walk } from './lib.mjs';

export const id = 'C6';
export const title = 'the published package needs no build tooling from consumers';

const DIST = 'packages/winui-svelte/dist';

// Anything here in shipped source means a consumer must run a preprocessor or a
// framework CSS build that ADR 0002 promised they would not need.
const REQUIRES_TOOLING = [
	[/@import\s+["']tailwindcss/i, 'Tailwind 4 entry point'],
	[/@(tailwind|apply|config|plugin|source|theme|utility|variant|screen)\b/, 'Tailwind directive'],
	[/lang=["'](scss|sass|less|stylus|postcss)["']/i, 'CSS preprocessor'],
	[/lang=["'](ts|typescript|coffee)["']/i, 'script preprocessor']
];

export async function run() {
	const dist = await walk(DIST, (n) => /\.(svelte|css|js|ts)$/.test(n));

	// `pending` would be a lie here: the gate is due, it simply cannot see its subject.
	// A CI job that runs `conform` without building would otherwise carry a permanently
	// green C6 while shipping whatever it liked.
	if (dist.length === 0)
		return fail(`${DIST} is empty — run \`pnpm build\` before \`pnpm conform\``);

	const sites = [];
	for (const file of dist) {
		const source = await read(file);
		for (const [pattern, what] of REQUIRES_TOOLING) {
			const m = source.match(pattern);
			if (m) sites.push(`${file}  ${what}: ${m[0]}`);
		}
	}

	return sites.length
		? fail('shipped source requires consumer build tooling', sites)
		: pass(`${dist.length} shipped file(s) clean`);
}
