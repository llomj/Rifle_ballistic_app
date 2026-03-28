/**
 * G1 (Ingalls table) point-mass trajectory helpers — same BC-scaled model as GNU
 * exterior ballistics / pg-drag (MIT). Uses published G1 BC with Ingalls v/s/t tables.
 */
import { INGALS } from './ingallsG1Data';

const FPS_PER_MPS = 3.280839895013123;
const YARDS_PER_M = 1 / 0.9144;
const GRAVITY_MPS2 = 9.80665;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function ingalsSpaceFromVelocity(currentVelocity: number): number {
  const vel = clamp(currentVelocity, INGALS.v[INGALS.v.length - 1], INGALS.v[0]);
  let counter = 0;
  while (INGALS.v[counter] > vel) {
    counter++;
  }
  if (INGALS.v[counter] === vel) {
    return INGALS.s[counter];
  }
  const diffV = INGALS.v[counter - 1] - INGALS.v[counter];
  const distV = vel - INGALS.v[counter];
  const diffS = INGALS.s[counter] - INGALS.s[counter - 1];
  const pct = distV / diffV;
  return INGALS.s[counter] - diffS * pct;
}

function ingalsTimeFromVelocity(currentVelocity: number): number {
  const vel = clamp(currentVelocity, INGALS.v[INGALS.v.length - 1], INGALS.v[0]);
  let counter = 0;
  while (INGALS.v[counter] > vel) {
    counter++;
  }
  if (INGALS.v[counter] === vel) {
    return INGALS.t[counter];
  }
  const diffV = INGALS.v[counter - 1] - INGALS.v[counter];
  const distV = vel - INGALS.v[counter];
  const diffT = INGALS.t[counter] - INGALS.t[counter - 1];
  const pct = distV / diffV;
  return INGALS.t[counter] - diffT * pct;
}

function ingalsVelocityFromSpace(currentSpace: number): number {
  const { s, v } = INGALS;
  if (currentSpace <= s[0]) return v[0];
  if (currentSpace >= s[s.length - 1]) return v[v.length - 1];
  let counter = 0;
  while (counter < s.length && s[counter] < currentSpace) {
    counter++;
  }
  if (s[counter] === currentSpace) {
    return v[counter];
  }
  const diffS = s[counter] - s[counter - 1];
  const distS = s[counter] - currentSpace;
  const diffV = v[counter - 1] - v[counter];
  const pct = distS / diffS;
  return v[counter] + diffV * pct;
}

/** Remaining velocity (fps) at downrange distance (yards), G1 BC, muzzle fps. */
export function velocityFpsAtRangeYards(bc: number, muzzleVelocityFps: number, rangeYards: number): number {
  if (bc <= 0 || rangeYards < 0) return muzzleVelocityFps;
  const currentSpace = ingalsSpaceFromVelocity(muzzleVelocityFps) + (rangeYards * 3) / bc;
  return ingalsVelocityFromSpace(currentSpace);
}

/** Time of flight (s) from muzzle fps to currentVelocityFps, Ingalls + BC scale. */
export function timeOfFlightSeconds(bc: number, muzzleVelocityFps: number, currentVelocityFps: number): number {
  return bc * (ingalsTimeFromVelocity(currentVelocityFps) - ingalsTimeFromVelocity(muzzleVelocityFps));
}

/**
 * Bullet drop from bore line (meters) from gravity only, using Ingalls TOF.
 * Flat-fire approximation; pairs with LOS zero model in computeDropAtRangeCm.
 */
export function dropBoreBelowMetersG1(bc: number, muzzleVelocityMps: number, rangeM: number): number {
  if (bc <= 0 || muzzleVelocityMps <= 0 || rangeM <= 0) return 0;
  const v0Fps = muzzleVelocityMps * FPS_PER_MPS;
  const rangeYards = rangeM * YARDS_PER_M;
  const vAtFps = velocityFpsAtRangeYards(bc, v0Fps, rangeYards);
  const t = timeOfFlightSeconds(bc, v0Fps, vAtFps);
  if (t <= 0 || !Number.isFinite(t)) return 0;
  return 0.5 * GRAVITY_MPS2 * t * t;
}
