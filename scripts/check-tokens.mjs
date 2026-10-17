// Checks that every "-rgb" channel token in tokens.css matches its colour token,
// e.g. --blush: #eea6a8 and --blush-rgb: 238, 166, 168.
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/tokens.css', 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value]));

const hexToRgb = (hex) => {
  const full = hex.length === 4 ? [...hex.slice(1)].map((c) => c + c).join('') : hex.slice(1);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};

const errors = [];
let checked = 0;
for (const [name, value] of Object.entries(tokens)) {
  if (!name.endsWith('-rgb')) continue;
  const channels = value.split(',').map((part) => Number(part.trim()));
  if (channels.length !== 3 || channels.some((c) => !Number.isInteger(c) || c < 0 || c > 255)) {
    errors.push(`${name}: expected "R, G, B", got "${value}"`);
    continue;
  }
  const colour = tokens[name.slice(0, -'-rgb'.length)];
  if (!colour) continue; // channel-only colour (shadows, soft light)
  checked++;
  if (!/^#[\da-f]{3}([\da-f]{3})?$/i.test(colour.trim())) {
    errors.push(`${name}: its colour token is not a hex value (${colour})`);
  } else if (hexToRgb(colour.trim()).join() !== channels.join()) {
    errors.push(`${name} (${channels.join(', ')}) does not match ${colour.trim()}`);
  }
}

if (errors.length) {
  console.error(`Token check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Token check passed: ${checked} colour/channel pairs match`);
