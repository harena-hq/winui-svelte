/**
 * A non-validating reader for the WinUI theme dictionaries.
 *
 * Deliberately not an XML implementation: the input is 85 machine-generated files
 * from one source at one pinned commit, so the cost of general correctness buys
 * nothing here. What it must handle is exactly what those files contain — a BOM,
 * comments, namespace prefixes, start tags spanning lines, and attribute values
 * such as `Value="{StaticResource X}"` whose `>` must not end the tag. Anything
 * outside that throws, because a reader that silently returns a partial tree
 * would show up downstream as a plausible census with resources missing from it.
 */

const NAME = /[^\s/>=]/;

/**
 * XML character references, resolved.
 *
 * Only numeric ones occur upstream, and only in the icon-glyph strings —
 * `<x:String x:Key="PipsPagerSelectedGlyph">&#xEA3B;</x:String>`. Resolving them is
 * reading the document rather than interpreting it: the resource's value is the
 * character, and a later generator handed `&#xEA3B;` would emit XML syntax into CSS.
 */
const entity = (text) =>
	text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|amp|lt|gt|quot|apos);/g, (whole, code) => {
		if (code[0] !== '#') return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }[code];
		return String.fromCodePoint(
			code[1] === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10)
		);
	});

/**
 * Parse `source` into a tree of `{ tag, attrs, children, line, text, parent }`.
 *
 * `text` is the element's own text content, trimmed — never the serialisation of
 * its children. `parent` makes a node cyclic, so a caller must project a node
 * before serialising it; carrying the link is worth that, because theme
 * attribution is a question about ancestors and a depth counter is the wrong
 * answer to it.
 */
export function parse(source) {
	// Every upstream file starts with one, and a BOM left in place would make the
	// first tag unrecognisable rather than merely ugly.
	const src = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;

	let i = 0;
	let line = 1;

	const fail = (what) => {
		throw new Error(`${what} at line ${line}`);
	};

	// Every move through the source goes through here, so the reported line is the
	// one the reader is actually standing on rather than one recomputed later.
	const seek = (to) => {
		for (let n = i; n < to; n++) if (src.charCodeAt(n) === 10) line++;
		i = to;
	};

	const roots = [];
	const stack = [];
	const top = () => stack[stack.length - 1];

	const addText = (raw) => {
		const node = top();
		if (node) node.text += raw;
	};

	while (i < src.length) {
		const at = src.indexOf('<', i);
		if (at === -1) {
			addText(src.slice(i));
			seek(src.length);
			break;
		}
		addText(src.slice(i, at));
		seek(at);

		if (src.startsWith('<!--', i)) {
			const end = src.indexOf('-->', i + 4);
			if (end === -1) fail('unterminated comment');
			seek(end + 3);
			continue;
		}

		if (src.startsWith('<?', i)) {
			const end = src.indexOf('?>', i + 2);
			if (end === -1) fail('unterminated processing instruction');
			seek(end + 2);
			continue;
		}

		// `<!DOCTYPE`, `<![CDATA[` and friends do not occur upstream. Naming them as
		// unsupported beats guessing at a shape nothing here has ever produced.
		if (src.startsWith('<!', i)) fail('unsupported declaration');

		if (src.startsWith('</', i)) {
			const end = src.indexOf('>', i + 2);
			if (end === -1) fail('unterminated end tag');
			const tag = src.slice(i + 2, end).trim();
			const open = top();
			if (!open) fail(`end tag </${tag}> with no open element`);
			if (open.tag !== tag) fail(`end tag </${tag}> closing <${open.tag}>`);
			seek(end + 1);
			stack.pop();
			open.text = open.text.trim();
			continue;
		}

		// A start tag. The name runs to whitespace, `/` or `>`.
		const startLine = line;
		seek(i + 1);
		let n = i;
		while (n < src.length && NAME.test(src[n])) n++;
		if (n === i) fail('element with no name');
		const tag = src.slice(i, n);
		seek(n);

		const attrs = {};
		let selfClosing = false;
		for (;;) {
			while (i < src.length && /\s/.test(src[i])) seek(i + 1);
			if (i >= src.length) fail(`unterminated start tag <${tag}>`);

			if (src[i] === '>') {
				seek(i + 1);
				break;
			}
			if (src.startsWith('/>', i)) {
				selfClosing = true;
				seek(i + 2);
				break;
			}

			let k = i;
			while (k < src.length && NAME.test(src[k])) k++;
			if (k === i) fail(`unexpected ${JSON.stringify(src[i])} in <${tag}>`);
			const name = src.slice(i, k);
			seek(k);

			while (i < src.length && /\s/.test(src[i])) seek(i + 1);
			if (src[i] !== '=') fail(`attribute ${name} without a value in <${tag}>`);
			seek(i + 1);
			while (i < src.length && /\s/.test(src[i])) seek(i + 1);

			const quote = src[i];
			if (quote !== '"' && quote !== "'") fail(`unquoted value for ${name} in <${tag}>`);
			// Reading to the closing quote is what keeps `Value="{StaticResource X}"`
			// from ending the tag at the `>` inside it.
			const close = src.indexOf(quote, i + 1);
			if (close === -1) fail(`unterminated value for ${name} in <${tag}>`);
			attrs[name] = entity(src.slice(i + 1, close));
			seek(close + 1);
		}

		const node = { tag, attrs, children: [], line: startLine, text: '', parent: top() ?? null };
		if (node.parent) node.parent.children.push(node);
		else roots.push(node);
		if (selfClosing) node.text = '';
		else stack.push(node);
	}

	if (stack.length) {
		line = stack[stack.length - 1].line;
		fail(`unclosed element <${stack[stack.length - 1].tag}>`);
	}
	if (roots.length === 0) throw new Error('no element found in document');
	if (roots.length > 1) {
		line = roots[1].line;
		fail(`second root element <${roots[1].tag}>`);
	}

	decode(roots[0]);
	return roots[0];
}

// Entity decoding is deferred to the end so it runs once per node over the whole
// accumulated text rather than per chunk, and so a `&lt;` in text can never be
// mistaken for markup on the way in.
function decode(node) {
	node.text = entity(node.text);
	for (const child of node.children) decode(child);
}
