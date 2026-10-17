import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export interface Result {
  project: string;
  width: number;
  name: string;
  /** strict = every RGBA byte must match; tolerant = perceptual threshold, reviewed by eye. */
  mode: 'strict' | 'tolerant';
  size: string;
  diffPixels: number;
  ratio: number;
  sizeMismatch?: string;
  /** Set when this capture documents an intentional, reviewed change. */
  expectedChange?: string;
}

const RESULTS_DIR = 'visual-results';

function decode(png: Buffer) {
  return PNG.sync.read(png);
}

/** Counts pixels whose RGBA values differ at all. */
export function strictDiff(a: Buffer, b: Buffer) {
  const A = decode(a);
  const B = decode(b);
  if (A.width !== B.width || A.height !== B.height) {
    return { sizeMismatch: `${A.width}x${A.height} vs ${B.width}x${B.height}`, size: '', diffPixels: -1, total: 0 };
  }
  const out = new PNG({ width: A.width, height: A.height });
  let diffPixels = 0;
  for (let i = 0; i < A.data.length; i += 4) {
    const same =
      A.data[i] === B.data[i] &&
      A.data[i + 1] === B.data[i + 1] &&
      A.data[i + 2] === B.data[i + 2] &&
      A.data[i + 3] === B.data[i + 3];
    if (same) {
      const gray = 255 - (255 - (A.data[i] * 0.3 + A.data[i + 1] * 0.59 + A.data[i + 2] * 0.11)) * 0.15;
      out.data[i] = out.data[i + 1] = out.data[i + 2] = gray;
    } else {
      diffPixels++;
      out.data[i] = 255;
      out.data[i + 1] = out.data[i + 2] = 0;
    }
    out.data[i + 3] = 255;
  }
  return { diffPixels, size: `${A.width}x${A.height}`, total: A.width * A.height, diffPng: PNG.sync.write(out) };
}

/** pixelmatch with a perceptual threshold, for re-encoded photos. */
export function tolerantDiff(a: Buffer, b: Buffer, threshold = 0.1) {
  const A = decode(a);
  const B = decode(b);
  if (A.width !== B.width || A.height !== B.height) {
    return { sizeMismatch: `${A.width}x${A.height} vs ${B.width}x${B.height}`, size: '', diffPixels: -1, total: 0 };
  }
  const out = new PNG({ width: A.width, height: A.height });
  const diffPixels = pixelmatch(A.data, B.data, out.data, A.width, A.height, { threshold, alpha: 0.15 });
  return { diffPixels, size: `${A.width}x${A.height}`, total: A.width * A.height, diffPng: PNG.sync.write(out) };
}

export function record(
  result: Omit<Result, 'ratio'> & { total: number },
  images: { baseline: Buffer; target: Buffer; diff?: Buffer },
  keepImages: boolean,
): Result {
  const { total, ...rest } = result;
  const entry: Result = { ...rest, ratio: total ? result.diffPixels / total : 1 };
  const dir = join(RESULTS_DIR, result.project);
  mkdirSync(dir, { recursive: true });
  const stem = `${result.width}-${result.name}-${result.mode}`;
  writeFileSync(join(dir, `${stem}.json`), `${JSON.stringify(entry)}\n`);
  if (keepImages) {
    writeFileSync(join(dir, `${stem}-baseline.png`), images.baseline);
    writeFileSync(join(dir, `${stem}-target.png`), images.target);
    if (images.diff) writeFileSync(join(dir, `${stem}-diff.png`), images.diff);
  }
  return entry;
}
