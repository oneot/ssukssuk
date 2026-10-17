import { readFileSync } from 'node:fs';

export const SITES = {
  baseline: 'http://127.0.0.1:4301',
  target: 'http://127.0.0.1:4302',
} as const;

export type Side = keyof typeof SITES;
export const SIDES = Object.keys(SITES) as Side[];

/** Written by `npm run baseline` (scripts/prepare-baseline.mjs). */
export const baseline: { ref: string; sha: string; legacy: boolean } = JSON.parse(
  readFileSync('.baseline/info.json', 'utf8'),
);
