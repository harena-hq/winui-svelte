# Notices

## Not affiliated with Microsoft

This is an independent reimplementation. "WinUI", "Fluent", "Segoe" and "Windows"
are trademarks of Microsoft Corporation. This project is not affiliated with,
endorsed by, or sponsored by Microsoft.

## What is taken from Microsoft's repositories

Both repositories below are MIT licensed, under the notice that follows the list.

- [microsoft-ui-xaml](https://github.com/microsoft/microsoft-ui-xaml), at the commit
  `scripts/tokens/fetch.mjs` pins. Theme-resource values — colors, corner radii, the type
  ramp, motion durations and easings — are extracted from its control and framework theme
  dictionaries into `data/winui-tokens.json` and `data/winui-framework.json`, and generated
  into the package's `tokens.css` and `type-ramp.css`. The `Symbol` table is extracted from
  its source into `data/winui-symbol.json`, and template part names into
  `data/winui-template-parts.json`.
- [WinUI-Gallery](https://github.com/microsoft/WinUI-Gallery), at the commit
  `scripts/gallery/fetch.mjs` pins. The Gallery app's structure and control catalogue follow
  it; its page content, sample code and navigation are extracted into
  `data/winui-gallery-*.json`; and the sample photographs, videos and images in
  `apps/gallery/static/` are copied from its `Assets/SampleMedia`, byte for byte except
  `ladybug.mp4` and `fishes.mp4`, which are re-encoded from its `.wmv` originals. Its
  `MapExample.png` is not copied: the map data it shows carries a third party's
  attribution, which this licence does not extend to. Its `linux.png` draws Tux, the Linux
  mascot, whose original Larry Ewing drew with The GIMP and asks only to be acknowledged for;
  it is acknowledged here.

```
Copyright (c) Microsoft Corporation.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The Windows App SDK's `Microsoft.WindowsAppSDK.WinUI` package is under Microsoft's own
software licence terms, not MIT. Nothing from it is in this repository: comments cite line
numbers in its `generic.xaml`, which a reader fetches with `pnpm framework:fetch`.

## ColorCode-Universal

The Gallery app's syntax highlighting reproduces
[ColorCode-Universal](https://github.com/CommunityToolkit/ColorCode-Universal), at the commit
`scripts/colorcode/fetch.mjs` pins: its scope names, palettes and language rules are
extracted into `data/colorcode.json`, together with the WinUI-Gallery's
`SampleCodePresenter`, and read by `apps/gallery/src/lib/highlight/`.

```
Copyright © .NET Foundation and Contributors

All rights reserved.

MIT License (MIT)

Permission is hereby granted, free of charge, to any person obtaining a copy of this
software and associated documentation files (the "Software"), to deal in the Software
without restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons
to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or
substantial portions of the Software.

THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE AND NON-INFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
DEALINGS IN THE SOFTWARE.
```

## Fluent UI System Icons

`tokens.css` embeds a font of the glyphs the package's own components draw and the
glyphs its `Symbol` export names, for where the Segoe icon fonts are not installed. Each
is an outline, or part of one, from
[Fluent UI System Icons](https://github.com/microsoft/fluentui-system-icons), scaled and
placed at a Segoe Fluent Icons code point. `data/winui-icon-fallback.json` holds the
outlines as they were extracted, except the three drawn as more than one path, which are
made absolute and joined into one. They are MIT licensed:

```
MIT License

Copyright (c) 2020 Microsoft Corporation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Segoe fonts are not redistributed

Segoe UI Variable, Segoe UI, Segoe Fluent Icons and Segoe MDL2 Assets ship with
Windows and are referenced by name from the local system, never embedded. See
`docs/adr/0003-fonts-and-icons.md`, and for the embedded glyphs above,
`docs/adr/0018-the-release-glyphs-fall-back-to-fluent-system-icons.md`.
