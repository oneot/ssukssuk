// Prepares the site that visual and behaviour tests compare against.
//
// The baseline is the merge base with origin/main (override with BASELINE_REF).
// A tree without a build script is the legacy static site and is served as-is;
// otherwise the tree is installed and built in isolation.
//
// Output: .baseline/site (served on port 4301) and .baseline/info.json
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = '.baseline';
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();

function resolveRef() {
  if (process.env.BASELINE_REF) return process.env.BASELINE_REF;
  try {
    return git('merge-base', 'HEAD', 'origin/main');
  } catch {
    throw new Error('Cannot find origin/main. Fetch it (git fetch origin main) or set BASELINE_REF.');
  }
}

const ref = resolveRef();
const sha = git('rev-parse', `${ref}^{commit}`);
rmSync(OUT, { recursive: true, force: true });
const src = join(OUT, 'src');
mkdirSync(src, { recursive: true });
execSync(`git archive ${sha} | tar -x -C ${src}`, { stdio: 'inherit' });

const pkgPath = join(src, 'package.json');
const pkg = existsSync(pkgPath) ? JSON.parse(readFileSync(pkgPath, 'utf8')) : null;
const legacy = !pkg?.scripts?.build;

if (legacy) {
  renameSync(src, join(OUT, 'site'));
} else {
  execSync('npm ci --no-audit --no-fund', { cwd: src, stdio: 'inherit' });
  execSync('npm run build', { cwd: src, stdio: 'inherit' });
  renameSync(join(src, 'dist'), join(OUT, 'site'));
  rmSync(src, { recursive: true, force: true });
}

const info = { ref, sha, legacy };
writeFileSync(join(OUT, 'info.json'), `${JSON.stringify(info, null, 2)}\n`);
console.log(`Baseline ${sha.slice(0, 7)} (${legacy ? 'legacy static site' : 'built'}) ready in ${OUT}/site`);
