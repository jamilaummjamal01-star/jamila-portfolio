# Brand font assets pending

No Nauryz or No Name 37 font binaries were found in the repository or the available Library materials.
Figma hero text node `8:2` reports the internal family `NauryzRedKeds`, style `Bold`.
The name is rendered using the exact local outlined SVG exported from Figma node `50:2`, with an accessible real-text h1.
Other display and interface text temporarily uses Arial/sans-serif, explicitly documented rather than mislabeled as either brand font.

When licensed font files are supplied: inspect name table IDs 1/2/16/17 and OS/2 `usWeightClass` (e.g. with fontTools), then add @font-face declarations in app/globals.css and update --font-display and --font-ui. Do not assign unverified weight ranges or fabricate files.
