import record from '../../../../data/winui-gallery-samples.json' with { type: 'json' };

/** A `ControlExample.SampleDefinition` resolved from the Gallery's samples record. */
export interface SampleDefinition {
	header: string | null;
	xaml: string | null;
	csharp: string | null;
}

interface SectionSample extends SampleDefinition {
	kind: 'sections';
}

interface TextSample {
	kind: 'text';
	text: string;
}

type Sample = SectionSample | TextSample;

interface SamplesRecord {
	samples: Record<string, Sample>;
}

const samples = (record as unknown as SamplesRecord).samples;

/** The sample definition at a path relative to `WinUIGallery/Samples`. Throws when there is none. */
export function sampleOf(path: string): SampleDefinition {
	const sample = samples[path];
	if (sample === undefined)
		throw new Error(`samples: no sample definition at ${JSON.stringify(path)}`);
	if (sample.kind === 'text') {
		throw new Error(`samples: ${JSON.stringify(path)} is a text sample, not a sample definition`);
	}
	return { header: sample.header, xaml: sample.xaml, csharp: sample.csharp };
}

/** The text of a code sample at a path relative to `WinUIGallery/Samples`. Throws when there
 *  is none, and when the path names a sample definition rather than a bare code file. */
export function textOf(path: string): string {
	const sample = samples[path];
	if (sample === undefined) throw new Error(`samples: no sample at ${JSON.stringify(path)}`);
	if (sample.kind !== 'text') {
		throw new Error(`samples: ${JSON.stringify(path)} is a sample definition, not a text sample`);
	}
	return sample.text;
}
