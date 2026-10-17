import { existsSync, rmSync } from 'node:fs';

export default function globalSetup() {
  if (!existsSync('.baseline/info.json')) {
    throw new Error('No baseline found. Run `npm run baseline` first.');
  }
  if (!existsSync('dist/index.html')) {
    throw new Error('No build found. Run `npm run build` first.');
  }
  rmSync('visual-results', { recursive: true, force: true });
}
