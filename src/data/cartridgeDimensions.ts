/**
 * SAAMI/CIP-style reference dimensions per caliberKey (rim, case, typical loaded OAL).
 * Used to auto-fill optional profile fields when the user selects a catalog bullet.
 * Values are approximate references; users can still edit fields manually.
 */

import type { BallisticProfile, BulletCatalogItem } from './ballistic';

export interface CartridgeDimensionSet {
  rimDiametersMm: number;
  caseLengthMm: number;
  /** Representative factory / max OAL for typical loads (mm). */
  overallLengthMm: number;
}

/**
 * Reference dimensions by `caliberKey` (matches bullets.json / rifles.json).
 * Missing keys: no auto-fill for that caliber until added.
 */
export const CARTRIDGE_DIMENSIONS_BY_CALIBER_KEY: Record<string, CartridgeDimensionSet> = {
  '223': { rimDiametersMm: 9.6, caseLengthMm: 45.7, overallLengthMm: 57.0 },
  '308': { rimDiametersMm: 12.0, caseLengthMm: 51.0, overallLengthMm: 71.0 },
  '300winmag': { rimDiametersMm: 13.5, caseLengthMm: 67.0, overallLengthMm: 85.0 },
  '65creedmoor': { rimDiametersMm: 12.0, caseLengthMm: 48.8, overallLengthMm: 72.0 },
  '30-30': { rimDiametersMm: 12.0, caseLengthMm: 51.6, overallLengthMm: 65.0 },
  '243win': { rimDiametersMm: 12.0, caseLengthMm: 51.0, overallLengthMm: 71.0 },
  '270win': { rimDiametersMm: 12.0, caseLengthMm: 64.5, overallLengthMm: 84.0 },
  '30-06': { rimDiametersMm: 12.0, caseLengthMm: 63.3, overallLengthMm: 84.0 },
  '300weatherby': { rimDiametersMm: 13.5, caseLengthMm: 73.0, overallLengthMm: 95.0 },
  '300rum': { rimDiametersMm: 13.5, caseLengthMm: 72.0, overallLengthMm: 93.0 },
  '300saum': { rimDiametersMm: 12.0, caseLengthMm: 51.0, overallLengthMm: 71.0 },
  '300wsm': { rimDiametersMm: 14.0, caseLengthMm: 53.3, overallLengthMm: 73.0 },
  '338winmag': { rimDiametersMm: 13.5, caseLengthMm: 64.0, overallLengthMm: 84.0 },
  '6.5prc': { rimDiametersMm: 12.0, caseLengthMm: 58.5, overallLengthMm: 78.0 },
  '7mm-08': { rimDiametersMm: 12.0, caseLengthMm: 51.0, overallLengthMm: 71.0 },
  '7mmremmag': { rimDiametersMm: 13.5, caseLengthMm: 63.0, overallLengthMm: 84.0 },
  '280rem': { rimDiametersMm: 12.0, caseLengthMm: 57.0, overallLengthMm: 78.0 },
  '280ai': { rimDiametersMm: 12.0, caseLengthMm: 57.0, overallLengthMm: 78.0 },
  '6mmcreedmoor': { rimDiametersMm: 12.0, caseLengthMm: 48.8, overallLengthMm: 72.0 },
  '7mmprc': { rimDiametersMm: 12.0, caseLengthMm: 58.5, overallLengthMm: 78.0 },
  '300prc': { rimDiametersMm: 12.0, caseLengthMm: 58.5, overallLengthMm: 78.0 },
  '270wsm': { rimDiametersMm: 14.0, caseLengthMm: 53.3, overallLengthMm: 73.0 },
  '7x57': { rimDiametersMm: 12.0, caseLengthMm: 57.0, overallLengthMm: 78.0 },
  '6.5x55': { rimDiametersMm: 12.2, caseLengthMm: 55.0, overallLengthMm: 80.0 },
  '93x62': { rimDiametersMm: 16.0, caseLengthMm: 67.0, overallLengthMm: 85.0 },
};

export type ProfileCartridgeFields = Partial<
  Pick<
    BallisticProfile,
    'rimDiametersMm' | 'caseLengthMm' | 'overallLengthMm' | 'bulletDiameterMm'
  >
>;

/**
 * Fields to merge into the current profile when the user selects a catalog bullet.
 * Bullet-level optional fields override the caliber map when present.
 */
/**
 * Merge SAAMI/CIP reference dimensions onto a catalog row (per-caliber defaults).
 * Called when building `BULLETS` so every load carries rim / case / OAL for UI and profile autofill.
 */
export function enrichBulletCatalogItem(b: BulletCatalogItem): BulletCatalogItem {
  const ref = CARTRIDGE_DIMENSIONS_BY_CALIBER_KEY[b.caliberKey];
  if (!ref) return b;
  return {
    ...b,
    rimDiametersMm: b.rimDiametersMm ?? ref.rimDiametersMm,
    caseLengthMm: b.caseLengthMm ?? ref.caseLengthMm,
    overallLengthMm: b.overallLengthMm ?? ref.overallLengthMm,
  };
}

export function getProfileCartridgeFieldsFromBullet(
  bullet: BulletCatalogItem
): ProfileCartridgeFields {
  const ref = CARTRIDGE_DIMENSIONS_BY_CALIBER_KEY[bullet.caliberKey];
  const rim = bullet.rimDiametersMm ?? ref?.rimDiametersMm;
  const caseLen = bullet.caseLengthMm ?? ref?.caseLengthMm;
  const oal = bullet.overallLengthMm ?? ref?.overallLengthMm;
  const bd = bullet.diameterMm;
  return {
    ...(rim != null && Number.isFinite(rim) ? { rimDiametersMm: rim } : {}),
    ...(caseLen != null && Number.isFinite(caseLen) ? { caseLengthMm: caseLen } : {}),
    ...(oal != null && Number.isFinite(oal) ? { overallLengthMm: oal } : {}),
    ...(bd != null && Number.isFinite(bd) ? { bulletDiameterMm: bd } : {}),
  };
}
