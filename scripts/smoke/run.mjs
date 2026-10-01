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

const UNKNOWN_EXPORT = 'NotAControl';
// A component the library builds and the release holds back (ADR 0017): `preview` exports it and
// the root must not.
const HELD_BACK_EXPORT = 'Flyout';

async function runRootRejects(workdir, tarball, name, label) {
	// The negative case. It has to be about this package rather than about the package
	// manager: pnpm auto-installs a missing peer, so deleting one from the consumer changes
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
		await runRootRejects(workdir, tarball, UNKNOWN_EXPORT, 'unknown export');
		await runRootRejects(workdir, tarball, HELD_BACK_EXPORT, 'held-back export');
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
