// Renders visual-results/ as Markdown (used for the CI job summary).
// Cells: diff pixels for exact comparisons, perceptual diff % for re-encoded photos.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIR = 'visual-results';
if (!existsSync(DIR)) {
  console.log('No visual results.');
  process.exit(0);
}

const lines = [];
for (const project of readdirSync(DIR).sort()) {
  const results = readdirSync(join(DIR, project))
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(readFileSync(join(DIR, project, file), 'utf8')));
  const widths = [...new Set(results.map((r) => r.width))].sort((a, b) => a - b);
  const captures = [...new Set(results.map((r) => `${r.name}|${r.mode}`))].sort();

  const strict = results.filter((r) => r.mode === 'strict' && !r.expectedChange);
  const exact = strict.filter((r) => r.diffPixels === 0).length;
  lines.push(`### ${project}`, '', `${exact}/${strict.length} exact captures identical (0px).`, '');
  lines.push(`| capture | ${widths.map((w) => `${w}px`).join(' | ')} |`);
  lines.push(`| --- | ${widths.map(() => '---:').join(' | ')} |`);
  for (const key of captures) {
    const [name, mode] = key.split('|');
    const cells = widths.map((width) => {
      const r = results.find((x) => x.width === width && x.name === name && x.mode === mode);
      if (!r) return '–';
      if (r.sizeMismatch) return `size ${r.sizeMismatch}`;
      if (mode === 'tolerant') return `${(r.ratio * 100).toFixed(2)}%`;
      if (r.expectedChange) return `${r.diffPixels}px (expected)`;
      return r.diffPixels === 0 ? '0' : `**${r.diffPixels}px**`;
    });
    lines.push(`| ${name}${mode === 'tolerant' ? ' (photos, perceptual)' : ''} | ${cells.join(' | ')} |`);
  }
  lines.push('');
}
console.log(lines.join('\n'));
