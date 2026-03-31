/**
 * Typical catalog muzzle velocity (m/s), reference barrel (cm), and propellant charge (g) per caliberKey.
 * Used when the user selects a catalog bullet so average speed, powder charge, and barrel-length
 * correction stay coherent. Per-bullet JSON may override via `muzzleVelocityMps` / `powderChargeGrams`.
 */

import type { BallisticProfile, BulletCatalogItem } from './ballistic';

/** Representative factory / SAAMI-style MV (m/s) for each caliber in the bullet catalog. */
export const DEFAULT_MUZZLE_VELOCITY_MPS_BY_CALIBER_KEY: Record<string, number> = {
  '223': 945,
  '243win': 915,
  '270win': 915,
  '270wsm': 900,
  '280rem': 890,
  '280ai': 910,
  '30-06': 825,
  '30-30': 640,
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

/** Typical test / catalog barrel length (cm) when a bullet row has no `referenceBarrelLengthCm`. */
export const DEFAULT_REFERENCE_BARREL_LENGTH_CM_BY_CALIBER_KEY: Record<string, number> = {
  '223': 61,
  '243win': 61,
  '270win': 61,
  '270wsm': 61,
  '280rem': 61,
  '280ai': 61,
  '30-06': 61,
  '30-30': 51,
  '300prc': 61,
  '300rum': 65,
  '300saum': 61,
  '300weatherby': 66,
  '300winmag': 61,
  '300wsm': 61,
  '308': 61,
  '338winmag': 61,
  '6.5prc': 61,
  '6.5x55': 61,
  '65creedmoor': 61,
  '6mmcreedmoor': 61,
  '7mm-08': 61,
  '7mmprc': 61,
  '7mmremmag': 61,
  '7x57': 61,
  '93x62': 61,
};

const FALLBACK_MV_MPS = 800;

/**
 * Representative factory-style propellant mass (g) per caliber for recoil estimate.
 * Approximate; handloads vary — user can edit. Matches `computeRecoilEnergyJ` when set vs 15% bullet mass default.
 */
export const DEFAULT_POWDER_CHARGE_GRAMS_BY_CALIBER_KEY: Record<string, number> = {
  '223': 2.7,
  '243win': 3.8,
  '270win': 4.5,
  '270wsm': 4.8,
  '280rem': 4.5,
  '280ai': 4.8,
  '30-06': 4.7,
  '30-30': 2.8,
  '300prc': 5.5,
  '300rum': 6.2,
  '300saum': 4.8,
  '300weatherby': 7.0,
  '300winmag': 6.0,
  '300wsm': 5.5,
  '308': 4.5,
  '338winmag': 5.8,
  '6.5prc': 4.5,
  '6.5x55': 4.0,
  '65creedmoor': 4.2,
  '6mmcreedmoor': 3.8,
  '7mm-08': 4.5,
  '7mmprc': 5.2,
  '7mmremmag': 5.5,
  '7x57': 4.0,
  '93x62': 5.0,
};

export function getCatalogPowderChargeGrams(bullet: BulletCatalogItem): number {
  if (
    bullet.powderChargeGrams != null &&
    Number.isFinite(bullet.powderChargeGrams) &&
    bullet.powderChargeGrams > 0
  ) {
    return Math.round(bullet.powderChargeGrams * 10) / 10;
  }
  const d = DEFAULT_POWDER_CHARGE_GRAMS_BY_CALIBER_KEY[bullet.caliberKey];
  if (d != null && Number.isFinite(d) && d > 0) return d;
  const heuristic = bullet.weightGrams * 0.15;
  return Math.round(Math.max(0.5, heuristic) * 10) / 10;
}

export function getCatalogMuzzleVelocityMps(bullet: BulletCatalogItem): number {
  if (
    bullet.muzzleVelocityMps != null &&
    Number.isFinite(bullet.muzzleVelocityMps) &&
    bullet.muzzleVelocityMps > 0
  ) {
    return bullet.muzzleVelocityMps;
  }
  const d = DEFAULT_MUZZLE_VELOCITY_MPS_BY_CALIBER_KEY[bullet.caliberKey];
  if (d != null && Number.isFinite(d) && d > 0) return d;
  return FALLBACK_MV_MPS;
}

export function getDefaultReferenceBarrelLengthCmForCaliber(caliberKey: string): number | undefined {
  const d = DEFAULT_REFERENCE_BARREL_LENGTH_CM_BY_CALIBER_KEY[caliberKey];
  if (d != null && Number.isFinite(d) && d > 0) return d;
  return undefined;
}

/**
 * Autofill propellant charge (g), catalog MV (m/s) when the user picks a catalog bullet.
 */
export function getProfileAmmoFieldsFromBullet(
  bullet: BulletCatalogItem
): Pick<BallisticProfile, 'bulletGram' | 'muzzleVelocityMps'> {
  return {
    bulletGram: getCatalogPowderChargeGrams(bullet),
    muzzleVelocityMps: getCatalogMuzzleVelocityMps(bullet),
  };
}
