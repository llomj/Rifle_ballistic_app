import type { BulletCatalogItem } from './ballistic';
import { getDefaultReferenceBarrelLengthCmForCaliber } from './catalogBulletMv';
import {
  DEFAULT_MV_REFERENCE_TEMP_C,
  MV_CHANGE_MPS_PER_CM_BARREL,
  MV_CHANGE_MPS_PER_DEGREE_C,
} from '../constants/ballisticAdjust';

export interface MuzzleVelocityAdjustInputs {
  baseMuzzleVelocityMps: number;
  /** Current or field powder / ambient temperature (°C). When set, adjusts MV from mvReferenceTempC. */
  powderTempC?: number | null;
  /** Temperature (°C) at which base MV was obtained. Defaults to DEFAULT_MV_REFERENCE_TEMP_C when powder temp is used. */
  mvReferenceTempC?: number | null;
  /** User rifle barrel length (cm). */
  barrelLengthCm?: number | null;
  /** Catalog: barrel length (cm) for which factory MV is quoted. */
  referenceBarrelLengthCm?: number | null;
}

/**
 * Effective muzzle velocity for trajectory after optional powder-temperature and barrel-length corrections.
 * Barrel correction applies only when both barrelLengthCm and referenceBarrelLengthCm are positive.
 */
export function computeEffectiveMuzzleVelocityMps(inputs: MuzzleVelocityAdjustInputs): number {
  const { baseMuzzleVelocityMps } = inputs;
  if (!Number.isFinite(baseMuzzleVelocityMps) || baseMuzzleVelocityMps <= 0) return 0;
  let v = baseMuzzleVelocityMps;

  if (inputs.powderTempC != null && Number.isFinite(inputs.powderTempC)) {
    const refT =
      inputs.mvReferenceTempC != null && Number.isFinite(inputs.mvReferenceTempC)
        ? inputs.mvReferenceTempC
        : DEFAULT_MV_REFERENCE_TEMP_C;
    v += (inputs.powderTempC - refT) * MV_CHANGE_MPS_PER_DEGREE_C;
  }

  const refB = inputs.referenceBarrelLengthCm;
  const userB = inputs.barrelLengthCm;
  if (
    refB != null &&
    Number.isFinite(refB) &&
    refB > 0 &&
    userB != null &&
    Number.isFinite(userB) &&
    userB > 0
  ) {
    v += (userB - refB) * MV_CHANGE_MPS_PER_CM_BARREL;
  }

  return Math.max(50, v);
}

export function getReferenceBarrelLengthCm(bullet: BulletCatalogItem | undefined): number | undefined {
  if (!bullet) return undefined;
  if (bullet.referenceBarrelLengthCm != null && bullet.referenceBarrelLengthCm > 0) {
    return bullet.referenceBarrelLengthCm;
  }
  return getDefaultReferenceBarrelLengthCmForCaliber(bullet.caliberKey);
}
