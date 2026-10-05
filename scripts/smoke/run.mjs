import { execFile } from 'node:child_process';
import {
	cp,
	copyFile,
	mkdtemp,
	readFile,
	readdir,
	realpath,
	rm,
	stat,
	writeFile
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(import.meta.dirname, '../..');
const LIBRARY_DIR = path.join(ROOT, 'packages/winui-svelte');
const DIST_INDEX = path.join(LIBRARY_DIR, 'dist/index.js');
const FIXTURE_DIR = path.join(ROOT, 'scripts/smoke/consumer');

function log(message) {
	console.log(`smoke: ${message}`);
}

function describeError(error) {
	return error instanceof Error ? error.message : String(error);
}

function commandOutput(result) {
	return [result.stdout, result.stderr, result.error].filter(Boolean).join('\n');
}

function compactOutput(result) {
	const output = commandOutput(result).trim().replace(/\s+/g, ' ');
	if (!output) return '(no output)';
	return output.length > 1000 ? `${output.slice(0, 997)}...` : output;
}

async function runCommand(command, args, cwd) {
	try {
		const { stdout, stderr } = await execFileAsync(command, args, {
			cwd,
			encoding: 'utf8',
			maxBuffer: 10 * 1024 * 1024
		});
		return { exitCode: 0, stdout, stderr };
	} catch (error) {
		return {
			exitCode: typeof error.code === 'number' ? error.code : 1,
			stdout: error.stdout ?? '',
			stderr: error.stderr ?? '',
			error: error.message
		};
	}
}

function assertExit(result, expected, action) {
	if (result.exitCode !== expected) {
		throw new Error(
			`expected ${action} to exit ${expected}, but found exit ${result.exitCode}; output: ${compactOutput(result)}`
		);
	}
}

async function assertBuilt() {
	try {
		await readFile(DIST_INDEX);
	} catch {
		throw new Error('run `pnpm build` first — this checks the packed dist, not the source');
	}
}

async function packLibrary(workdir) {
	const result = await runCommand('pnpm', ['pack', '--pack-destination', workdir], LIBRARY_DIR);
	assertExit(result, 0, 'pnpm pack');

	const entries = await readdir(workdir, { withFileTypes: true });
	const tarballs = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.tgz'));
	if (tarballs.length !== 1) {
		const found = tarballs.length ? tarballs.map((entry) => entry.name).join(', ') : 'none';
		throw new Error(`expected pnpm pack to produce one .tgz, but found ${found}`);
	}

	return path.join(workdir, tarballs[0].name);
}

async function prepareConsumer(directory, tarball) {
	await cp(FIXTURE_DIR, directory, { recursive: true });
	await copyFile(tarball, path.join(directory, 'winui-svelte.tgz'));
}

async function installConsumer(directory) {
	return runCommand('pnpm', ['install', '--ignore-workspace', '--prefer-offline'], directory);
}

async function collectFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await collectFiles(entryPath)));
		else if (entry.isFile()) files.push(entryPath);
	}
	return files;
}

async function readBuiltCss(directory) {
	const assetsDir = path.join(directory, 'dist/assets');
	let files;
	try {
		files = (await collectFiles(assetsDir)).filter((file) => file.endsWith('.css'));
	} catch (error) {
		throw new Error(
			`expected built CSS under dist/assets, but it could not be read: ${describeError(error)}`,
			{ cause: error }
		);
	}
	if (files.length === 0) {
		throw new Error('expected at least one .css file under dist/assets, but found none');
	}

	const contents = await Promise.all(files.map((file) => readFile(file, 'utf8')));
	return { files, source: contents.join('\n') };
}

function assertCssMarker(css, marker) {
	if (!css.source.includes(marker)) {
		throw new Error(
			`expected built CSS to contain ${marker}, but found no match in ${css.files.join(', ')}`
		);
	}
}

async function runPositive(workdir, tarball) {
	const directory = path.join(workdir, 'positive');
	await prepareConsumer(directory, tarball);

	log('positive: installing the consumer');
	const install = await installConsumer(directory);
	assertExit(install, 0, 'positive pnpm install');
	await assertNotTheWorkspace(directory);
	await assertPublishedSurface(directory);

	log('positive: type-checking the consumer against the published types');
	const check = await runCommand('pnpm', ['run', 'check'], directory);
	assertExit(check, 0, 'positive pnpm run check');

	log('positive: building the browser bundle');
	const build = await runCommand('pnpm', ['run', 'build'], directory);
	assertExit(build, 0, 'positive pnpm run build');
	const css = await readBuiltCss(directory);
	assertCssMarker(css, '--winui-ControlCornerRadius');
	assertCssMarker(css, 'data-variant');

	log('positive: building the SSR bundle');
	const ssrBuild = await runCommand('pnpm', ['run', 'build:ssr'], directory);
	assertExit(ssrBuild, 0, 'positive pnpm run build:ssr');

	log('positive: rendering the SSR bundle');
	const render = await runCommand('node', ['dist-ssr/ssr.js'], directory);
	assertExit(render, 0, 'positive node dist-ssr/ssr.js');
	if (!render.stdout.includes('<button') || !render.stdout.includes('data-variant="default"')) {
		throw new Error(
			`expected SSR output to contain <button and data-variant="default", but found: ${compactOutput(render)}`
		);
	}
}

async function assertNotTheWorkspace(directory) {
	// The whole point of this script is that it does not measure the workspace. With a
	// `file:` tarball dependency pnpm extracts the package into the consumer's own virtual
	// store, so the installed directory resolves under the temporary tree. A symlink back
	// into this repository would mean the run proved nothing at all.
	const installed = path.join(directory, 'node_modules/winui-svelte');
	const resolved = await realpath(installed);
	if (resolved.startsWith(`${ROOT}${path.sep}`) || resolved === ROOT) {
		throw new Error(
			`expected the installed package to resolve outside ${ROOT}, but found ${resolved}`
		);
	}
	return resolved;
}

function exportTargets(exportsField) {
	// The `exports` map nests conditions, and a wildcard entry names no single file. Collect
	// the literal relative paths and leave the rest to the bundler.
	const targets = [];
	const walk = (node) => {
		if (typeof node === 'string') {
			if (!node.includes('*')) targets.push(node);
			return;
		}
		if (node && typeof node === 'object') for (const value of Object.values(node)) walk(value);
	};
	walk(exportsField);
	return [...new Set(targets)];
}

async function assertPublishedSurface(directory) {
	const installed = await realpath(path.join(directory, 'node_modules/winui-svelte'));
	const manifest = JSON.parse(await readFile(path.join(installed, 'package.json'), 'utf8'));

	// Every literal path the `exports` map names has to exist in the tarball. This is the
	// check a broken `files` array fails and a bundle build does not: a consumer that never
	// imports the missing subpath still builds green.
	for (const target of exportTargets(manifest.exports)) {
		const file = path.join(installed, target);
		try {
			await stat(file);
		} catch {
			throw new Error(`expected the packed tarball to contain ${target}, but it is missing`);
		}
	}

	// The library carries no runtime dependencies of its own: everything it needs is a peer
	// the consumer supplies. A dependency appearing here would install a second tree behind
	// the consumer's back.
	const runtimeDeps = Object.keys(manifest.dependencies ?? {});
	if (runtimeDeps.length > 0) {
		throw new Error(
			`expected the packed package to declare no runtime dependencies, but found ${runtimeDeps.join(', ')}`
		);
	}

	// Nothing from the source tree ships. `files` lists `dist` alone, and the two negated
	// patterns drop the tests.
	const shipped = await readdir(installed);
	const unexpected = shipped.filter((name) => name === 'src' || name === 'node_modules');
	if (unexpected.length > 0) {
		throw new Error(
			`expected the packed tarball to ship no ${unexpected.join(' or ')} directory, but found one`
		);
	}
	const tests = (await collectFiles(path.join(installed, 'dist'))).filter((file) =>
		/\.(test|spec)\./.test(path.basename(file))
	);
	if (tests.length > 0) {
		throw new Error(
			`expected the packed tarball to ship no test files, but found ${tests.join(', ')}`
		);
	}
}

// The peers `peerDependenciesMeta` marks optional: only `preview`'s NumberBox imports them, so a
// consumer of the release does not install them.
const OPTIONAL_PEERS = ['@zag-js/number-input', '@zag-js/svelte'];

async function prepareWithoutOptionalPeers(directory, tarball) {
	await prepareConsumer(directory, tarball);
	const manifestPath = path.join(directory, 'package.json');
	const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
	for (const name of OPTIONAL_PEERS) delete manifest.dependencies[name];
	await writeFile(manifestPath, `${JSON.stringify(manifest, null, '\t')}\n`);

	const install = await installConsumer(directory);
	assertExit(install, 0, `${path.basename(directory)} pnpm install`);
	// pnpm installs a missing required peer of its own accord, so a manifest that had not
	// marked these optional would put them back and every build below would pass anyway. It
	// puts them in the virtual store only, under the name with its slash as a plus, not at the
	// top of `node_modules`, which is why the store is what is read.
	const store = await readdir(path.join(directory, 'node_modules/.pnpm'));
	// The listing's positive control: a required peer is there under the same naming, so an
	// empty or renamed store fails rather than passing the check below by finding nothing.
	if (!store.some((entry) => entry.startsWith('bits-ui@'))) {
		throw new Error(`expected bits-ui in the consumer's pnpm store, but found ${store.join(', ')}`);
	}
	for (const name of OPTIONAL_PEERS) {
		const found = store.filter((entry) => entry.startsWith(`${name.replace('/', '+')}@`));
		if (found.length > 0) {
			throw new Error(
				`expected ${name} to be left uninstalled as an optional peer, but found ${found.join(', ')}`
			);
		}
	}
}

async function runReleaseOnly(workdir, tarball) {
	// The release without the optional peers, at the required peers' floors. The whole index is
	// imported, so a component of it that made a named import from an optional peer, directly or
	// through a module it shares with `preview`, fails here rather than in a consumer's build.
	// A namespace or default import would not: Vite resolves an absent optional peer to a stub
	// whose default export is empty, and only a missing name fails the bundle.
	const directory = path.join(workdir, 'release-only');
	log('release only: installing the consumer without the optional peers');
	await prepareWithoutOptionalPeers(directory, tarball);
	await writeFile(
		path.join(directory, 'src/App.svelte'),
		`<script lang="ts">\n\timport * as winui from 'winui-svelte';\n\n\t// @ts-expect-error VERSION is typed as a string, which fails if the types do not resolve.\n\tconst wrong: number = winui.VERSION;\n\tconst names = Object.keys(winui);\n</script>\n\n<p>{wrong} {names.length}</p>\n`
	);
	await writeFile(
		path.join(directory, 'src/ssr.js'),
		`import { render } from 'svelte/server';\nimport * as winui from 'winui-svelte';\n\nconst { body } = render(winui.Button, { props: {} });\n\nprocess.stdout.write(\`\${winui.VERSION}\\n\${body}\`);\n`
	);

	log('release only: type-checking, building, and rendering the whole index');
	assertExit(await runCommand('pnpm', ['run', 'check'], directory), 0, 'release-only check');
	assertExit(await runCommand('pnpm', ['run', 'build'], directory), 0, 'release-only build');
	const ssrBuild = await runCommand('pnpm', ['run', 'build:ssr'], directory);
	assertExit(ssrBuild, 0, 'release-only build:ssr');
	const render = await runCommand('node', ['dist-ssr/ssr.js'], directory);
	assertExit(render, 0, 'release-only node dist-ssr/ssr.js');

	const manifestOf = async (name) =>
		JSON.parse(
			await readFile(
				path.join(await realpath(path.join(directory, 'node_modules', name)), 'package.json'),
				'utf8'
			)
		);
	const packed = await manifestOf('winui-svelte');

	// A floor this run did not install is a floor nothing tested. What is read is the version
	// installed, not the fixture's pin, so an override cannot stand between the two.
	for (const [name, range] of Object.entries(packed.peerDependencies)) {
		if (packed.peerDependenciesMeta?.[name]?.optional) continue;
		const { version: installed } = await manifestOf(name);
		if (`^${installed}` !== range) {
			throw new Error(
				`expected ${name} to be installed at its peer floor ${range}, but found ${installed}`
			);
		}
	}

	// `VERSION` is written by hand in `index.ts`, and nothing else ties it to the manifest.
	const { version } = packed;
	const [printed] = render.stdout.split('\n');
	if (printed !== version) {
		throw new Error(`expected VERSION to be the packed version ${version}, but found ${printed}`);
	}
	if (!render.stdout.includes('<button')) {
		throw new Error(`expected SSR output to contain <button, but found: ${compactOutput(render)}`);
	}
}

async function runOptionalPeerControl(workdir, tarball) {
	// The control for the case above: the same consumer reaching for the component that needs
	// the optional peers. Vite resolves an absent optional peer to a stub with no named exports,
	// and names it and the package that declared it, so the failure is the one this package's manifest caused and not another.
	const directory = path.join(workdir, 'optional-peer-control');
	log('optional peer control: installing the consumer without the optional peers');
	await prepareWithoutOptionalPeers(directory, tarball);
	await writeFile(
		path.join(directory, 'src/App.svelte'),
		`<script>\n\timport { NumberBox } from 'winui-svelte/preview';\n</script>\n\n<NumberBox />\n`
	);

	log('optional peer control: building NumberBox without its peers');
	const build = await runCommand('pnpm', ['run', 'build'], directory);
	if (build.exitCode === 0) {
		throw new Error(
			`expected the build to fail without the optional peers, but it exited 0; output: ${compactOutput(build)}`
		);
	}
	if (!/__vite-optional-peer-dep:@zag-js\/[a-z-]+:winui-svelte/.test(commandOutput(build))) {
		throw new Error(
			`expected the failed build to name an optional @zag-js peer, but found: ${compactOutput(build)}`
		);
	}
}

const UNKNOWN_EXPORT = 'NotAControl';
// A component the library builds and the release holds back (ADR 0017): `preview` exports it and
// the root must not.
const HELD_BACK_EXPORT = 'Flyout';

async function runRootRejects(workdir, tarball, name, label) {
	// The negative case. It has to be about this package rather than about the package
	// manager: pnpm auto-installs a missing required peer, so deleting one from the consumer changes
	// nothing, and a consumer that imports only components with no peer of their own builds
	// green either way. Both were measured here before this shape was chosen. Importing a
	// name the package does not export is the failure the package itself owns, and it is
	// what proves the positive build resolved against the tarball's entry point instead of
	// quietly emitting nothing. The held-back case is the same build with a component the
	// package does build, which `preview` exports and the root must not (ADR 0017): it is what
	// proves the release is narrower than the preview.
	const directory = path.join(workdir, label.replaceAll(' ', '-'));
	await prepareConsumer(directory, tarball);
	await writeFile(
		path.join(directory, 'src/App.svelte'),
		`<script>\n\timport { ${name} } from 'winui-svelte';\n</script>\n\n<${name} />\n`
	);

	log(`${label}: installing the consumer`);
	const install = await installConsumer(directory);
	assertExit(install, 0, `${label} pnpm install`);

	log(`${label}: building against a name the package root does not export`);
	const build = await runCommand('pnpm', ['run', 'build'], directory);
	if (build.exitCode === 0) {
		throw new Error(
			`expected the build to fail on the missing export ${name}, but it exited 0; output: ${compactOutput(build)}`
		);
	}
	// The bundler's own words for a missing export, with the name quoted, rather than the name
	// alone: `Flyout` is also in `MenuFlyout`, and in the path of a module the root does reach,
	// so a build that failed for another reason could still mention it.
	if (!commandOutput(build).includes(`"${name}" is not exported by`)) {
		throw new Error(
			`expected the failed build to say "${name}" is not exported, but found: ${compactOutput(build)}`
		);
	}
}

// The type gate's negative cases. The positive check passing proves nothing on its own: a
// consumer whose components typed as `any`, or that the check never read, would pass it too. Each case is one
// line the published types refuse, and the check has to fail with exactly one error, on that
// line, saying what the case says. A props interface that ends in an index signature takes a
// misspelled prop name, so the cases are a known prop given a value its type refuses, and a
// required prop left out.
const TYPE_ERRORS = [
	{
		label: 'type error',
		what: 'a prop value the published type refuses',
		markup: `import { InfoBar } from 'winui-svelte';\n</script>\n\n<InfoBar severity="notASeverity" title="Smoke" />`,
		message: `Type '"notASeverity"' is not assignable to type`
	},
	{
		label: 'missing prop',
		what: 'a component without a required prop',
		markup: `import { TabView } from 'winui-svelte';\n</script>\n\n<TabView />`,
		message: `Property 'items' is missing`
	}
];

// `--output machine` in the consumer's `check` script is what makes this readable: without it
// svelte-check picks its format from the environment, and its human-verbose format, the fallback
// outside `CLAUDECODE=1`, prints each diagnostic's surrounding source, which would echo the
// offending line into any other error. A machine diagnostic is
// `<time> ERROR "<file>" <line>:<column> "<message>"`, the file and the message JSON strings.
const DIAGNOSTIC = /^\d+ (ERROR|WARNING) ("(?:[^"\\]|\\.)*") (\d+):\d+ (".*")$/gm;

async function runTypeError(workdir, tarball, { label, what, markup, message }) {
	const directory = path.join(workdir, label.replaceAll(' ', '-'));
	await prepareConsumer(directory, tarball);
	await writeFile(path.join(directory, 'src/App.svelte'), `<script lang="ts">\n\t${markup}\n`);

	log(`${label}: installing the consumer`);
	const install = await installConsumer(directory);
	assertExit(install, 0, `${label} pnpm install`);

	log(`${label}: type-checking ${what}`);
	const check = await runCommand('pnpm', ['run', 'check'], directory);
	if (check.exitCode === 0) {
		throw new Error(
			`expected the type check to refuse ${what}, but it exited 0; output: ${compactOutput(check)}`
		);
	}
	const errors = [...commandOutput(check).matchAll(DIAGNOSTIC)]
		.filter(([, severity]) => severity === 'ERROR')
		.map(([, , file, line, text]) => ({
			file: JSON.parse(file).replaceAll('\\', '/'),
			line: Number(line),
			text: JSON.parse(text)
		}));
	const [only] = errors;
	// The written file is the script's opening tag, the import, its closing tag, a blank line and
	// the element, so the element is on the fifth line.
	if (
		errors.length !== 1 ||
		only.file !== 'src/App.svelte' ||
		only.line !== 5 ||
		!only.text.includes(message)
	) {
		throw new Error(
			`expected exactly one error, on the element the case wrote, saying ${message}, but found: ${compactOutput(check)}`
		);
	}
}

async function main() {
	let workdir;
	let failure;

	try {
		log('checking for the built library');
		await assertBuilt();

		workdir = await mkdtemp(path.join(os.tmpdir(), 'winui-svelte-smoke-'));
		log('packing the library');
		const tarball = await packLibrary(workdir);

		await runPositive(workdir, tarball);
		await runReleaseOnly(workdir, tarball);
		await runOptionalPeerControl(workdir, tarball);
		await runRootRejects(workdir, tarball, UNKNOWN_EXPORT, 'unknown export');
		await runRootRejects(workdir, tarball, HELD_BACK_EXPORT, 'held-back export');
		for (const typeError of TYPE_ERRORS) await runTypeError(workdir, tarball, typeError);
	} catch (error) {
		failure = error;
	} finally {
		if (workdir) {
			if (process.env.WINUI_SMOKE_KEEP) log(`keeping temporary workdir at ${workdir}`);
			else {
				try {
					await rm(workdir, { recursive: true, force: true });
					log('removed the temporary workdir');
				} catch (error) {
					failure ??= new Error(
						`expected the temporary workdir to be removed, but found: ${describeError(error)}`
					);
				}
			}
		}
	}

	if (failure) {
		console.error(`smoke: ${describeError(failure)}`);
		process.exitCode = 1;
		return;
	}

	log('all assertions passed');
}

await main();
