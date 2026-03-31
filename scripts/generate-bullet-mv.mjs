/**
 * Regenerates src/data/bulletMuzzleVelocityById.json from bullets.json.
 * Hand-tuned IDs (factory / SAAMI ballpark m/s) — edit HAND_* below, then run:
 *   node scripts/generate-bullet-mv.mjs
 * See averagespeed.md for workflow and notes.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const bulletsPath = path.join(root, 'src/data/bullets.json');
const bullets = JSON.parse(fs.readFileSync(bulletsPath, 'utf8'));

/** Caliber midpoint MV (m/s) — tuned with bullet weight scaling below. */
const DEFAULT_MV_BY_CALIBER = {
  '223': 945,
  '243win': 915,
  '270win': 915,
  '270wsm': 900,
  '280rem': 890,
  '280ai': 910,
  '30-06': 825,
  '30-30': 718,
  '300prc': 875,
  '300rum': 915,
  '300saum': 900,
  '300weatherby': 1050,
  '300winmag': 922,
  '300wsm': 900,
  '308': 820,
  '338winmag': 850,
  '6.5prc': 880,
  '6.5x55': 800,
  '65creedmoor': 820,
  '6mmcreedmoor': 920,
  '7mm-08': 825,
  '7mmprc': 880,
  '7mmremmag': 920,
  '7x57': 780,
  '93x62': 720,
};

const FALLBACK = 800;

/** Override m/s for specific catalog bullet ids (measured / published factory typical). */
const HAND_MV_MPS_BY_ID = {
  '300winmag-180gr-g1': 922,
  '3030-150gr-g1': 725,
  '3030-170gr-g1': 678,
};

const sums = new Map();
for (const b of bullets) {
  if (!sums.has(b.caliberKey)) sums.set(b.caliberKey, { sum: 0, n: 0 });
  const s = sums.get(b.caliberKey);
  s.sum += b.weightGrams;
  s.n += 1;
}
const meanW = {};
for (const [k, { sum, n }] of sums) meanW[k] = sum / n;

function mvFor(b) {
  if (HAND_MV_MPS_BY_ID[b.id] != null) return HAND_MV_MPS_BY_ID[b.id];
  const base = DEFAULT_MV_BY_CALIBER[b.caliberKey] ?? FALLBACK;
  const refW = meanW[b.caliberKey] ?? b.weightGrams;
  const w = b.weightGrams;
  const factor = Math.sqrt(refW / w);
  const clamped = Math.min(1.08, Math.max(0.92, factor));
  return Math.round(base * clamped * 10) / 10;
}

const out = {};
for (const b of bullets) {
  out[b.id] = mvFor(b);
}

const outPath = path.join(root, 'src/data/bulletMuzzleVelocityById.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
console.log('Wrote', Object.keys(out).length, 'entries →', outPath);
