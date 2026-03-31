/**
 * Ballistic data and formulas. Single source of truth aligned with rifle_distance.py and rifle_height.py.
 * Trajectory: Ingalls G1 + G1 BC, or G7 drag curve + G7 BC (numerical), not vacuum gravity with a fake decay.
 * Supports MIL and MOA scopes. AGENTS.md §0.
 */

import { dropBoreBelowMetersG1, timeOfFlightToRangeG1, dvdtMps2G1 } from './ingallsG1';
import { dropBoreBelowMetersG7, timeOfFlightToRangeG7 } from './g7Trajectory';
import { interpolateCdG7 } from './g7DragTable';

/** Which drag model backs dropBoreBelow* for computeDropAtRangeCm. */
export type TrajectoryDragModel = 'G1' | 'G7';

/** Optional modifiers for vertical drop vs LOS (see computeDropAtRangeCm). */
export interface ComputeDropAtRangeOptions {
  /**
   * Inclination from horizontal in degrees (+ uphill, − downhill).
   * Uses horizontal equivalent range R·cos(θ) for trajectory drop vs a flat LOS zero.
   */
  inclinationDegFromHorizontal?: number;
  /**
   * Air density factor relative to ISA sea level (ρ/ρ0). 1 = sea level.
   * Approximates atmosphere effect on drag (and thus TOF, drop, wind) without full meteo inputs.
   */
  airDensityFactor?: number;
}

export type ScopeUnit = 'MIL' | 'MOA';

const GRAVITY_MPS2 = 9.80665;
const SPEED_OF_SOUND_MPS = 340.29;
// Same constant as g7Trajectory.ts; kept here so the 2D solver uses identical scaling.
const G7_DRAG_SCALE_K = 2.08551e-4;

type DragModelFn = (bc: number, vMps: number) => number; // dv/dt (m/s²), negative

function dvdtMps2G7(bcG7: number, velocityMps: number): number {
  if (bcG7 <= 0 || !Number.isFinite(velocityMps) || velocityMps <= 0) return 0;
  const mach = velocityMps / SPEED_OF_SOUND_MPS;
  const cd = interpolateCdG7(mach);
  const dragTerm = (cd * G7_DRAG_SCALE_K) / bcG7;
  const dvdt = -velocityMps * dragTerm;
  if (!Number.isFinite(dvdt)) return 0;
  return Math.max(-5000, Math.min(0, dvdt));
}

function getDvdtFn(dragModel: TrajectoryDragModel): DragModelFn {
  return dragModel === 'G7' ? dvdtMps2G7 : dvdtMps2G1;
}

/**
 * ISA density ratio ρ/ρ0 from altitude (m). Troposphere approximation.
 * Good enough for ballistics drag scaling out to typical hunting altitudes.
 */
export function isaDensityRatioFromAltitudeM(altitudeM: number): number {
  if (!Number.isFinite(altitudeM)) return 1;
  const h = Math.max(-500, Math.min(11000, altitudeM));
  const T0 = 288.15; // K
  const L = 0.0065; // K/m
  const g = 9.80665;
  const R = 287.05; // J/(kg·K)
  const T = T0 - L * h;
  const exponent = (g / (R * L)) - 1;
  const ratio = Math.pow(T / T0, exponent);
  if (!Number.isFinite(ratio) || ratio <= 0) return 1;
  return Math.max(0.4, Math.min(1.3, ratio));
}

interface SimResultAtX {
  yM: number;
  tS: number;
  vMps: number;
}

interface SimResult3DAtX {
  yM: number;
  zM: number; // +right
  tS: number;
  vMps: number;
}

/**
 * Simple 2D point-mass integrator (no atmosphere, no spin drift, no Coriolis).
 * - State: x, y, vx, vy
 * - Drag acts opposite velocity with magnitude dv/dt from the chosen drag model.
 * - Gravity acts downward (−g).
 *
 * Integration is done in small horizontal steps (dx) for stability.
 */
function simulatePointMassToX(
  targetX: number,
  bc: number,
  muzzleVelocityMps: number,
  launchAngleRad: number,
  dvdtFn: DragModelFn
): SimResultAtX {
  const dx = 0.5; // m
  const maxIter = Math.ceil(Math.max(1, targetX) / dx) + 20000;
  let x = 0;
  let y = 0;
  let t = 0;
  let vx = muzzleVelocityMps * Math.cos(launchAngleRad);
  let vy = muzzleVelocityMps * Math.sin(launchAngleRad);

  for (let i = 0; i < maxIter && x < targetX - 1e-9; i++) {
    const step = Math.min(dx, targetX - x);
    const v = Math.hypot(vx, vy);
    if (v < 1) break;
    if (vx <= 0) break;

    const dt = step / vx;
    const dvdt = dvdtFn(bc, v); // negative
    const axDrag = (dvdt * vx) / v;
    const ayDrag = (dvdt * vy) / v;
    const ax = axDrag;
    const ay = ayDrag - GRAVITY_MPS2;

    // Semi-implicit Euler: update velocity then position
    vx += ax * dt;
    vy += ay * dt;
    x += step;
    y += vy * dt;
    t += dt;
  }

  return { yM: y, tS: t, vMps: Math.hypot(vx, vy) };
}

/**
 * 3D point-mass integration with constant wind treated as moving air mass.
 * Axes: x toward target, y up, z right.
 *
 * Wind convention in this app: windFromClockDeg is "from" direction where 90° means from shooter’s right.
 * We convert it to an air velocity vector; drag depends on relative airspeed (bullet - wind).
 */
function simulatePointMass3DToX(
  targetX: number,
  bc: number,
  muzzleVelocityMps: number,
  launchAngleRad: number,
  windFromRightMps: number,
  dvdtFn: DragModelFn
): SimResult3DAtX {
  const dx = 0.5; // m
  const maxIter = Math.ceil(Math.max(1, targetX) / dx) + 20000;
  let x = 0;
  let y = 0;
  let z = 0;
  let t = 0;
  let vx = muzzleVelocityMps * Math.cos(launchAngleRad);
  let vy = muzzleVelocityMps * Math.sin(launchAngleRad);
  let vz = 0;

  // Wind from right means air moves toward left (negative z).
  const windVz = -windFromRightMps;

  for (let i = 0; i < maxIter && x < targetX - 1e-9; i++) {
    const step = Math.min(dx, targetX - x);
    const v = Math.hypot(vx, vy, vz);
    if (v < 1) break;
    if (vx <= 0) break;

    const dt = step / vx;

    const vRelX = vx;
    const vRelY = vy;
    const vRelZ = vz - windVz;
    const vRel = Math.hypot(vRelX, vRelY, vRelZ);
    if (vRel < 1e-6) break;

    const dvdt = dvdtFn(bc, vRel); // negative magnitude along -vRel
    const axDrag = (dvdt * vRelX) / vRel;
    const ayDrag = (dvdt * vRelY) / vRel;
    const azDrag = (dvdt * vRelZ) / vRel;

    const ax = axDrag;
    const ay = ayDrag - GRAVITY_MPS2;
    const az = azDrag;

    vx += ax * dt;
    vy += ay * dt;
    vz += az * dt;
    x += step;
    y += vy * dt;
    z += vz * dt;
    t += dt;
  }

  return { yM: y, zM: z, tS: t, vMps: Math.hypot(vx, vy, vz) };
}

/**
 * Solve launch angle so the bullet intersects the (flat) line of sight at the zero distance.
 * We treat the line of sight as horizontal at y = scopeHeightM (scope above bore).
 */
function solveLaunchAngleForZero(
  bc: number,
  muzzleVelocityMps: number,
  zeroDistanceM: number,
  scopeHeightM: number,
  dvdtFn: DragModelFn
): number {
  // Reasonable bracket: 0 to ~6 degrees.
  let lo = 0;
  let hi = 0.12;

  const f = (a: number) => simulatePointMassToX(zeroDistanceM, bc, muzzleVelocityMps, a, dvdtFn).yM - scopeHeightM;
  let flo = f(lo);
  let fhi = f(hi);

  // If hi isn't enough (slow/heavy), expand a bit.
  let expand = 0;
  while (fhi < 0 && expand < 10) {
    hi *= 1.4;
    fhi = f(hi);
    expand++;
    if (hi > 0.35) break; // ~20°
  }
  // If we still cannot bracket, fall back to 0 to avoid NaN.
  if (!(flo <= 0 && fhi >= 0)) return 0;

  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (Math.abs(fm) < 1e-5) return mid;
    if (fm > 0) {
      hi = mid;
      fhi = fm;
    } else {
      lo = mid;
      flo = fm;
    }
  }
  return (lo + hi) / 2;
}

/** Catalog item: rifle from rifles.json */
export interface RifleCatalogItem {
  id: string;
  name: string;
  caliber: string;
  caliberKey: string;
  barrelLengthCm?: number;
  twistRate?: string;
  rifleWeightKg?: number;
}

/** Catalog item: scope from scopes.json */
export interface ScopeCatalogItem {
  id: string;
  name: string;
  unit: 'MIL' | 'MOA';
  clickValue: number;
  ffpOrSfp?: 'FFP' | 'SFP';
  magnificationRange?: string;
  /** Optional: brand for database / reference. */
  brand?: string;
  /** Optional: model for database / reference. */
  model?: string;
  /** Optional: tube diameter in mm (e.g. 25.4 = 1 inch, 30, 34). */
  tubeDiameterMm?: number;
  /** Optional: reticle type (e.g. TMR, Mil-Dot, EBR-2C). */
  reticleType?: string;
  /** Optional: zero stop. */
  zeroStop?: boolean;
  /** Optional: for SFP, magnification at which reticle subtensions are correct (e.g. 10 for 3–9×). */
  magnificationCalibration?: number;
}

/**
 * Parse magnification range string (e.g. "4-16x", "3-9x") and return the maximum magnification.
 * Used for SFP scopes: measure distance/height at this magnification for correct mil/MOA reading.
 */
export function parseMaxMagnificationFromRange(range?: string): number | null {
  if (!range || typeof range !== 'string') return null;
  const match = range.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;
  const a = parseFloat(match[1]);
  const b = parseFloat(match[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(a, b);
}

/**
 * Magnification at which to measure distance and height with the scope.
 * FFP: any magnification (returns null). SFP: calibration mag or max of range (returns number).
 */
export function getScopeMagnificationForMeasure(scope: ScopeCatalogItem | undefined): number | null {
  if (!scope) return null;
  if (scope.ffpOrSfp === 'FFP') return null;
  if (scope.magnificationCalibration != null && Number.isFinite(scope.magnificationCalibration)) {
    return scope.magnificationCalibration;
  }
  return parseMaxMagnificationFromRange(scope.magnificationRange);
}

/** Catalog item: bullet from bullets.json */
export interface BulletCatalogItem {
  id: string;
  name: string;
  caliber: string;
  caliberKey: string;
  diameterMm: number;
  weightGrams: number;
  bcG1: number;
  bcG7?: number;
  /** Optional: manufacturer for database / reference. */
  manufacturer?: string;
  /** Optional: bullet construction type (e.g. SP, ELD-X, Sierra MatchKing). */
  bulletType?: string;
  /** Optional: bullet shape (e.g. Boat tail, Spitzer). */
  bulletShape?: string;
  /** Optional: drag model (G1, G7, etc.). Default G1 for bcG1. */
  dragModel?: string;
  /**
   * Optional: barrel length (cm) for which factory / catalog muzzle velocity is quoted.
   * When set with the user profile barrel length, MV can be adjusted for barrel difference (estimate).
   */
  referenceBarrelLengthCm?: number;
  /**
   * Optional: representative muzzle velocity (m/s) for this catalog load (factory / published).
   * When set, autopopulates profile average speed when this bullet is selected; otherwise a caliber default is used.
   */
  muzzleVelocityMps?: number;
  /**
   * Optional: typical propellant charge (g) for this load (factory / published load data).
   * When set, autopopulates powder charge when this bullet is selected; otherwise a caliber default is used.
   */
  powderChargeGrams?: number;
  /** Optional: override auto-filled rim diameter (mm) from caliber map. */
  rimDiametersMm?: number;
  /** Optional: override auto-filled case length (mm) from caliber map. */
  caseLengthMm?: number;
  /** Optional: override auto-filled cartridge OAL (mm) from caliber map. */
  overallLengthMm?: number;
}

/** User ballistic setup: rifle + scope + bullet + inputs. Saved with userName. */
export interface BallisticProfile {
  id: string;
  userName: string;
  rifleId: string;
  scopeId: string;
  scopeHeightCm: number;
  /** Zero distance (m). Drives drop, holdover, clicks, compensation. Default 100. */
  zeroDistanceM?: number;
  barrelLengthCm?: number;
  twistRate?: string;
  rimDiametersMm?: number;
  caseLengthMm?: number;
  overallLengthMm?: number;
  /** Bullet / groove nominal diameter (mm), from catalog when ammunition is selected. */
  bulletDiameterMm?: number;
  bulletId: string;
  /** Propellant charge in grams (recoil estimate). Optional per-bullet catalog `powderChargeGrams` or caliber default on select. */
  bulletGram?: number;
  muzzleVelocityMps: number;
  bcOverride?: number;
  createdAt?: number;
  /** Scope unit (MIL/MOA). Stored per profile so Default and saved profiles show correctly. */
  scopeUnit?: ScopeUnit;
  /** Measurement system. Stored per profile. */
  measurement?: 'metric' | 'imperial';
  /**
   * Shot inclination from horizontal (degrees). Positive = uphill, negative = downhill.
   * Used for horizontal-equivalent range in drop (rifleman-style). 0 = flat.
   */
  shotInclinationDeg?: number;
  /** Field powder / ambient temperature (°C). With mvReferenceTempC, adjusts MV for trajectory. */
  powderTempC?: number;
  /** Temperature (°C) at which the entered muzzle velocity was measured. Default 15 °C when powder temp is set. */
  mvReferenceTempC?: number;
  /**
   * Wind speed (km/h) for drift estimate. Crosswind uses windFromClockDeg.
   * Stored in km/h internally; UI may show mph when measurement is imperial.
   */
  windSpeedKph?: number;
  /**
   * Where wind blows from on a clock face: 12 = toward target (headwind), 90° = 3 o’clock = shooter’s right (full crosswind).
   * Degrees clockwise from 12. If wind speed is set and this is omitted, 90° is used (full crosswind).
   */
  windFromClockDeg?: number;
}

/** Whether a bullet's caliberKey matches a rifle's (for filtering). */
export function bulletMatchesRifleCaliber(bulletCaliberKey: string, rifleCaliberKey: string): boolean {
  return bulletCaliberKey === rifleCaliberKey;
}

/** Free recoil energy in joules. JBM formula: V = (m_b*v_b + m_c*v_gas)/m_r, E = 0.5*m_r*V^2. v_gas ~ 1.75 * v_muzzle. */
export function computeRecoilEnergyJ(
  rifleWeightKg: number,
  bulletWeightGrams: number,
  muzzleVelocityMps: number,
  powderChargeGrams?: number
): number {
  if (rifleWeightKg <= 0) return 0;
  const mBullet = bulletWeightGrams / 1000;
  const mRifle = rifleWeightKg;
  const vGas = 1.75 * muzzleVelocityMps;
  const mCharge = powderChargeGrams != null ? powderChargeGrams / 1000 : mBullet * 0.15;
  const vRecoil = (mBullet * muzzleVelocityMps + mCharge * vGas) / mRifle;
  return 0.5 * mRifle * vRecoil * vRecoil;
}

/** Recoil category from energy (J). */
export function recoilCategory(recoilJ: number): 'low' | 'medium' | 'high' | 'very_high' {
  if (recoilJ < 15) return 'low';
  if (recoilJ < 25) return 'medium';
  if (recoilJ < 35) return 'high';
  return 'very_high';
}

export const BALLISTIC_PROFILES_STORAGE_KEY = 'rifle_ballistic_setups_v2';

/** Default profile: Tikka .300 Win Mag + Hawke SideWinder + 180 gr, 922 m/s. MIL, metric. */
export const DEFAULT_BALLISTIC_PROFILE: BallisticProfile = {
  id: 'default',
  userName: 'Default (Tikka .300)',
  rifleId: 'tikka-t3x-300winmag-laminated',
  scopeId: 'hawke-sidewinder-30-4-16x50',
  scopeHeightCm: 4.6,
  zeroDistanceM: 100,
  barrelLengthCm: 60,
  twistRate: '1:11',
  rimDiametersMm: 13.5,
  caseLengthMm: 67,
  overallLengthMm: 85,
  bulletDiameterMm: 7.82,
  bulletId: '300winmag-180gr-g1',
  muzzleVelocityMps: 922,
  scopeUnit: 'MIL',
  measurement: 'metric',
};

/** Rifle profile — stored locally, user can switch quickly. */
export interface RifleProfile {
  id: string;
  name: string;
  caliber: string;
  barrelLengthCm: number;
  twistRate: string;
  scopeHeightAboveBarrelCm: number;
  zeroDistanceM: number;
  createdAt: number;
}

/** Scope settings: FFP/SFP, unit, click value, etc. */
export interface ScopeSettings {
  scopeType: 'FFP' | 'SFP';
  measurementUnit: ScopeUnit;
  clickValue: number; // e.g. 0.1 mil, 0.25 MOA
  clicksPerRevolution: number;
  magnificationCalibration?: number; // for SFP, e.g. 10
}

/** Ammunition data for ballistic calculations. */
export interface AmmunitionData {
  bulletWeightGrams?: number;
  bulletWeightGrains?: number;
  bulletType: string;
  ballisticCoefficientG1?: number;
  ballisticCoefficientG7?: number;
  muzzleVelocityMps: number;
  bulletDiameterMm: number;
}

/** Preset or custom target height for quick range. */
export interface TargetPreset {
  id: string;
  nameKey: string; // translation key or display name
  heightM: number;
  isCustom?: boolean;
}

/** Optional environment inputs for future ballistic correction. */
export interface EnvironmentInputs {
  windSpeedKph?: number;
  windDirectionDeg?: number;
  temperatureC?: number;
  altitudeM?: number;
  humidityPercent?: number;
}

export const RIFLE_PROFILES_STORAGE_KEY = 'rifle_ballistic_profiles_v1';
export const BALLISTIC_SETTINGS_STORAGE_KEY = 'rifle_ballistic_settings_v1';
export const TARGET_PRESETS_STORAGE_KEY = 'rifle_ballistic_targets_v1';

/** Default target presets (height in meters). User can edit/add. */
export const DEFAULT_TARGET_PRESETS: TargetPreset[] = [
  { id: 'human', nameKey: 'targets.human', heightM: 1.75, isCustom: false },
  { id: 'deer', nameKey: 'targets.deer', heightM: 1.2, isCustom: false },
  { id: 'pig', nameKey: 'targets.pig', heightM: 0.7, isCustom: false },
  { id: 'bird', nameKey: 'targets.bird', heightM: 0.3, isCustom: false },
  { id: 'steel', nameKey: 'targets.steel', heightM: 0.5, isCustom: false },
  { id: 'custom', nameKey: 'targets.custom', heightM: 1, isCustom: true },
];

/** Animals for mildot reference: average shoulder-to-feet height (m). Used with distance = (height × 1000) / mils. */
export interface MildotAnimal {
  id: string;
  nameKey: string;
  /** Shoulder (withers) to feet in meters. */
  heightM: number;
}

export const MILDOT_ANIMALS: MildotAnimal[] = [
  { id: 'deer', nameKey: 'targets.deer', heightM: 1.0 },
  { id: 'pig', nameKey: 'targets.pig', heightM: 0.6 },
  { id: 'boar', nameKey: 'targets.boar', heightM: 0.75 },
  { id: 'elk', nameKey: 'targets.elk', heightM: 1.35 },
  { id: 'goat', nameKey: 'targets.goat', heightM: 0.9 },
  { id: 'bear', nameKey: 'targets.bear', heightM: 1.1 },
  { id: 'fox', nameKey: 'targets.fox', heightM: 0.35 },
  { id: 'rabbit', nameKey: 'targets.rabbit', heightM: 0.2 },
  { id: 'wildcat', nameKey: 'targets.wildcat', heightM: 0.35 },
  { id: 'bird', nameKey: 'targets.bird', heightM: 0.3 },
];

/** Steel plates for mildot reference: height (m). Used with distance = (height × 1000) / mils. */
export interface MildotSteelPlate {
  id: string;
  labelKey: string;
  heightM: number;
}

export const MILDOT_STEEL_PLATES: MildotSteelPlate[] = [
  { id: 'plate10cm', labelKey: 'ballistic.plate10cm', heightM: 0.10 },
  { id: 'plate15cm', labelKey: 'ballistic.plate15cm', heightM: 0.15 },
  { id: 'plate20cm', labelKey: 'ballistic.plate20cm', heightM: 0.20 },
  { id: 'plate25cm', labelKey: 'ballistic.plate25cm', heightM: 0.25 },
  { id: 'plate30cm', labelKey: 'ballistic.plate30cm', heightM: 0.30 },
  { id: 'plate35cm', labelKey: 'ballistic.plate35cm', heightM: 0.35 },
  { id: 'plate40cm', labelKey: 'ballistic.plate40cm', heightM: 0.40 },
  { id: 'plate45cm', labelKey: 'ballistic.plate45cm', heightM: 0.45 },
  { id: 'plate50cm', labelKey: 'ballistic.plate50cm', heightM: 0.50 },
  { id: 'plate55cm', labelKey: 'ballistic.plate55cm', heightM: 0.55 },
  { id: 'plate60cm', labelKey: 'ballistic.plate60cm', heightM: 0.60 },
  { id: 'plate65cm', labelKey: 'ballistic.plate65cm', heightM: 0.65 },
  { id: 'plate70cm', labelKey: 'ballistic.plate70cm', heightM: 0.70 },
  { id: 'plate75cm', labelKey: 'ballistic.plate75cm', heightM: 0.75 },
  { id: 'plate80cm', labelKey: 'ballistic.plate80cm', heightM: 0.80 },
  { id: 'plate85cm', labelKey: 'ballistic.plate85cm', heightM: 0.85 },
  { id: 'plate90cm', labelKey: 'ballistic.plate90cm', heightM: 0.90 },
  { id: 'plate95cm', labelKey: 'ballistic.plate95cm', heightM: 0.95 },
  { id: 'plate100cm', labelKey: 'ballistic.plate100cm', heightM: 1.00 },
  { id: 'plate45x30cm', labelKey: 'ballistic.plate45x30cm', heightM: 0.45 },
];

export interface TurretRow {
  distanceMin: number;
  distanceMax: number;
  dropCm: string;
  mrad: string;
  clicks: string;
  /** In "comfortable" range (e.g. ≤400 m) for green display */
  inRange: boolean;
}

/** Turret adjustment table: 150 m–800 m. Same bands as rifle_distance.py. */
export const TURRET_TABLE: TurretRow[] = [
  { distanceMin: 150, distanceMax: 170, dropCm: '2.8cm', mrad: '-0.20', clicks: '^2 clicks', inRange: true },
  { distanceMin: 171, distanceMax: 200, dropCm: '9.5cm', mrad: '-0.50', clicks: '^5 clicks', inRange: true },
  { distanceMin: 201, distanceMax: 250, dropCm: '20cm', mrad: '-0.80', clicks: '^8 clicks', inRange: true },
  { distanceMin: 251, distanceMax: 300, dropCm: '35cm', mrad: '-1.2', clicks: '^12 clicks', inRange: true },
  { distanceMin: 301, distanceMax: 350, dropCm: '55cm', mrad: '-1.6', clicks: '^16 clicks', inRange: true },
  { distanceMin: 351, distanceMax: 400, dropCm: '80cm', mrad: '-2', clicks: '^20 clicks', inRange: true },
  { distanceMin: 401, distanceMax: 450, dropCm: '110cm', mrad: '-2.5', clicks: '^25 clicks', inRange: false },
  { distanceMin: 451, distanceMax: 500, dropCm: '150cm', mrad: '-3', clicks: '^30 clicks', inRange: false },
  { distanceMin: 501, distanceMax: 550, dropCm: '195cm', mrad: '-3.5', clicks: '^35 clicks', inRange: false },
  { distanceMin: 551, distanceMax: 600, dropCm: '250cm', mrad: '-4', clicks: '^40 clicks', inRange: false },
  { distanceMin: 601, distanceMax: 650, dropCm: '300cm', mrad: '-5', clicks: '^50 clicks', inRange: false },
  { distanceMin: 651, distanceMax: 700, dropCm: '370cm', mrad: '-5.8', clicks: '^58 clicks', inRange: false },
  { distanceMin: 701, distanceMax: 750, dropCm: '460cm', mrad: '-6.5', clicks: '^66 clicks', inRange: false },
  { distanceMin: 751, distanceMax: 800, dropCm: '540cm', mrad: '-7.5', clicks: '^75 clicks', inRange: false },
];

/**
 * True MOA (TMOA): small-angle range when height and distance are in metres.
 * distance_m = height_m × MOA_METERS_PER_TRUE_MOA / MOA, MOA_METERS_PER_TRUE_MOA = (180/π)×60 ≈ 3437.75.
 */
export const MOA_METERS_PER_TRUE_MOA = (180 / Math.PI) * 60;

/** Distance from target height and mils. Formula: height × 1000 / mils = distance (m). */
export function distanceFromHeightMils(heightM: number, mils: number): number {
  if (mils <= 0) return 0;
  return Math.round((heightM * 1000) / mils * 100) / 100;
}

/** Distance from target height and MOA (true MOA). Formula: height × MOA_METERS_PER_TRUE_MOA / MOA = distance (m). */
export function distanceFromHeightMOA(heightM: number, moa: number): number {
  if (moa <= 0) return 0;
  return Math.round((heightM * MOA_METERS_PER_TRUE_MOA) / moa * 100) / 100;
}

/** Unified: distance from target height and subtension (mils or MOA). */
export function distanceFromHeight(
  heightM: number,
  value: number,
  unit: ScopeUnit
): number {
  if (value <= 0) return 0;
  return unit === 'MIL'
    ? distanceFromHeightMils(heightM, value)
    : distanceFromHeightMOA(heightM, value);
}

/** Height from target distance and mils. Formula: distance × mils / 1000 = height (m). */
export function heightFromDistanceMils(distanceM: number, mils: number): number {
  return Math.round((distanceM * mils) / 1000 * 100) / 100;
}

/** Height from target distance and MOA (true MOA). Formula: distance × MOA / MOA_METERS_PER_TRUE_MOA = height (m). */
export function heightFromDistanceMOA(distanceM: number, moa: number): number {
  return Math.round((distanceM * moa) / MOA_METERS_PER_TRUE_MOA * 100) / 100;
}

export interface TurretResult {
  /** e.g. "Turret: 35cm -1.2 ^12 clicks" */
  line: string;
  inRange: boolean;
  /** true if distance is beyond the configured table max (e.g. > 1200 m) */
  outOfRange: boolean;
}

/** Mildot reference: deer height on scope, man height on scope, distance (m). rifle_distance.py */
export const MILDOT_DEER = [10, 6, 4.8, 4, 3.3, 2.9, 2.5, 2.2, 2, 1.8, 1.68, 1.6, 1.4, 1.3, 1.25, 1.15, 1.1];
export const MILDOT_MAN = [16, 12.5, 8.3, 7, 6, 5, 4.3, 3.9, 3.5, 3.2, 2.9, 2.7, 2.5, 2.3, 2.2, 2.1, 2];
export const MILDOT_DISTANCE = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900];

/** 10/1000=1mil compensation: mils, distance (m), cm. rifle_distance.py (mildots, distance_on_scope, cm zipped) */
const _DISTANCE_FOR_COMP = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800];
const _CM = [0, 2.8, 9.5, 20, 35, 55, 80, 110, 150, 195, 250, 300, 370, 460, 540];
export const COMPENSATION_TABLE = _DISTANCE_FOR_COMP.map((d, i) => ({
  mils: Math.round((1 / d) * 100000) / 100000,
  distance: d,
  cm: _CM[i],
}));

/** 10x optics: yards/inch and m/cm. rifle_distance.py */
export const OPTICS_10X: { yd: number; inch: string; m: number; cm: string }[] = [
  { yd: 200, inch: '7.2 Inch', m: 200, cm: '20cm' },
  { yd: 300, inch: '10.8 Inch', m: 300, cm: '30cm' },
  { yd: 400, inch: '14.4 Inch', m: 400, cm: '40cm' },
  { yd: 500, inch: '18.0 Inch', m: 500, cm: '50cm' },
  { yd: 600, inch: '21.6 Inch', m: 600, cm: '60cm' },
  { yd: 700, inch: '25.2 Inch', m: 700, cm: '70cm' },
  { yd: 800, inch: '28.8 Inch', m: 800, cm: '80cm' },
  { yd: 900, inch: '32.4 Inch', m: 900, cm: '90cm' },
  { yd: 1000, inch: '36.0 Inch', m: 1000, cm: '100cm/1m' },
];

/** Formatted reference lines for display (column-aligned). AGENTS.md §10. */
export const TURRET_LINES = TURRET_TABLE.map((r) =>
  `${(`${r.distanceMin}m`).padEnd(5)}    ${r.dropCm.padEnd(6)}   ${r.mrad.padEnd(6)}    ${r.clicks}`
);

/** Pad so second column aligns (deer/cerf label may vary by language). */
const MILDOT_FIRST_COL_LEN = 28;
export const MILDOT_LINES = MILDOT_DEER.slice(
  0,
  Math.min(MILDOT_DEER.length, MILDOT_MAN.length, MILDOT_DISTANCE.length)
).map(
  (deer, i) =>
    `${`mildot:${deer}(cerf)=${MILDOT_DISTANCE[i]}`.padEnd(MILDOT_FIRST_COL_LEN)}  ${MILDOT_MAN[i]}(homme)=${MILDOT_DISTANCE[i]}m`
);

export const COMPENSATION_LINES = COMPENSATION_TABLE.map(
  (row) =>
    `${`mils: ${row.mils}`.padEnd(14)}  ${`${row.distance} meters =`.padEnd(14)}  ${row.cm}cm`
);

export const OPTICS_LINES = [
  '10x optics (100y/3.6 Inch, 100m/10cm)',
  ...OPTICS_10X.map(
    (r) =>
      `${(`${r.yd}y`).padEnd(6)}  ${r.inch.padEnd(12)}  ${(`${r.m}m`).padEnd(6)}  ${r.cm}`
  ),
];

export const WIND_MIRAGE_LINES = [
  'Comment calculer le mirage du vent',
  '',
  `${'22 degrees angle'.padEnd(20)}  environ 4  kph`,
  '',
  `${'45 degrees angle'.padEnd(20)}  environ 8  kph`,
  '',
  `${'90 degrees angle'.padEnd(20)}  environ 16 kph`,
];

/** Get turret suggestion for a given distance (m). Matches rifle_distance.py logic. */
export function getTurretRow(distanceM: number): TurretResult | null {
  if (!Number.isFinite(distanceM) || distanceM < 0) return null;
  const row = TURRET_TABLE.find(
    (r) => distanceM >= r.distanceMin && distanceM <= r.distanceMax
  );
  if (row) {
    return {
      line: `Turret: ${row.dropCm} ${row.mrad} ${row.clicks}`,
      inRange: row.inRange,
      outOfRange: false,
    };
  }
  if (distanceM >= 150 && distanceM <= 800) return null; // gap (shouldn't happen)
  return {
    line: '',
    inRange: false,
    outOfRange: true,
  };
}

/**
 * Vertical correction (cm) relative to line of sight zeroed at zeroDist.
 * Positive = bullet hits low (dial up / hold over). Zero at range === zero distance.
 * LOS: straight line from scope height above bore to the point where the bullet
 * crosses LOS at the zero distance (standard rifle zero model).
 * Drop vs bore: G1 uses Ingalls + G1 BC; G7 uses G7 CD(Mach) integration + G7 BC (same LOS model).
 * Inclined fire: horizontal equivalent range R·cos(θ) drives bore drop; LOS term uses the same horizontal distance (flat zero).
 */
export function computeDropAtRangeCm(
  bc: number,
  muzzleVelocityMps: number,
  zeroDistanceM: number,
  scopeHeightCm: number,
  rangeM: number,
  dragModel: TrajectoryDragModel = 'G1',
  options?: ComputeDropAtRangeOptions
): number {
  if (bc <= 0 || muzzleVelocityMps <= 0 || rangeM < 0 || zeroDistanceM <= 0) return 0;
  const inc =
    options?.inclinationDegFromHorizontal != null &&
    Number.isFinite(options.inclinationDegFromHorizontal)
      ? options.inclinationDegFromHorizontal
      : 0;
  const cos = Math.cos((inc * Math.PI) / 180);
  const rangeHorizontalM = rangeM * cos;
  const scopeHeightM = scopeHeightCm / 100;
  const density = options?.airDensityFactor != null && Number.isFinite(options.airDensityFactor)
    ? Math.max(0.3, Math.min(1.5, options.airDensityFactor))
    : 1;

  // 2D point-mass: solve launch angle that hits the LOS at zero, then compute drop at range.
  // Falls back to legacy ½ g t² model if something goes wrong.
  try {
    const baseDvdtFn = getDvdtFn(dragModel);
    const dvdtFn: DragModelFn = (bcIn, vIn) => density * baseDvdtFn(bcIn, vIn);
    const alpha = solveLaunchAngleForZero(bc, muzzleVelocityMps, zeroDistanceM, scopeHeightM, dvdtFn);
    const yAtRange = simulatePointMassToX(rangeHorizontalM, bc, muzzleVelocityMps, alpha, dvdtFn).yM;
    const dropM = scopeHeightM - yAtRange; // positive = bullet below LOS
    if (!Number.isFinite(dropM)) return 0;
    return dropM * 100;
  } catch (_) {
    const dropBore = dragModel === 'G7' ? dropBoreBelowMetersG7 : dropBoreBelowMetersG1;
    const dropAtZero = dropBore(bc, muzzleVelocityMps, zeroDistanceM);
    const dropAtRange = dropBore(bc, muzzleVelocityMps, rangeHorizontalM);
    const h = scopeHeightM;
    const offsetM = h - (rangeHorizontalM / zeroDistanceM) * (h + dropAtZero) + dropAtRange;
    return offsetM * 100;
  }
}

/** Time of flight (s) to horizontal range (m); same drag model and BC as drop. */
export function timeOfFlightToRange(
  bc: number,
  muzzleVelocityMps: number,
  rangeM: number,
  dragModel: TrajectoryDragModel = 'G1'
): number {
  if (bc <= 0 || muzzleVelocityMps <= 0 || rangeM <= 0) return 0;
  return dragModel === 'G7'
    ? timeOfFlightToRangeG7(bc, muzzleVelocityMps, rangeM)
    : timeOfFlightToRangeG1(bc, muzzleVelocityMps, rangeM);
}

const DEFAULT_WIND_CLOCK_DEG = 90;

/** Wind drift solution at one distance; windage in scope unit + clicks (same click value as elevation). */
export interface WindCorrectionAtRange {
  driftCm: number;
  /** Magnitude in MIL or MOA (always ≥ 0). */
  angleAbs: number;
  windageClicks: number;
  /** True = hold / dial windage toward shooter’s right (wind from right pushes impact left). */
  holdRight: boolean;
  outOfRange: boolean;
}

/**
 * Constant crosswind × time-of-flight (lag) drift; angular correction matches drop small-angle convention.
 * Clock: 12 = toward target, 90° = from shooter’s right (full crosswind). Uses horizontal range if inclined.
 */
export function computeWindCorrectionAtDistance(
  distanceM: number,
  windSpeedKph: number,
  windFromClockDeg: number | undefined,
  bc: number,
  muzzleVelocityMps: number,
  dragModel: TrajectoryDragModel,
  scopeClickValue: number,
  scopeUnit: ScopeUnit,
  maxM: number,
  options?: ComputeDropAtRangeOptions
): WindCorrectionAtRange | null {
  if (
    !Number.isFinite(distanceM) ||
    distanceM <= 0 ||
    !Number.isFinite(windSpeedKph) ||
    windSpeedKph <= 0 ||
    scopeClickValue <= 0
  ) {
    return null;
  }
  const clock =
    windFromClockDeg != null && Number.isFinite(windFromClockDeg)
      ? windFromClockDeg
      : DEFAULT_WIND_CLOCK_DEG;
  const inc =
    options?.inclinationDegFromHorizontal != null &&
    Number.isFinite(options.inclinationDegFromHorizontal)
      ? options.inclinationDegFromHorizontal
      : 0;
  const rangeH = distanceM * Math.cos((inc * Math.PI) / 180);
  const windMs = windSpeedKph / 3.6;
  const crosswindFromRightMps = windMs * Math.sin((clock * Math.PI) / 180);
  const density = options?.airDensityFactor != null && Number.isFinite(options.airDensityFactor)
    ? Math.max(0.3, Math.min(1.5, options.airDensityFactor))
    : 1;

  // Use the same 3D point-mass model as drop: solve launch angle from zero is handled outside,
  // but for wind correction here we approximate using a flat-fire launch angle (0) and drag+wind.
  // This is still a large improvement over wind × TOF because it uses relative airspeed and deceleration.
  const baseDvdtFn = getDvdtFn(dragModel);
  const dvdtFn: DragModelFn = (bcIn, vIn) => density * baseDvdtFn(bcIn, vIn);

  const sim = simulatePointMass3DToX(rangeH, bc, muzzleVelocityMps, 0, crosswindFromRightMps, dvdtFn);
  if (sim.tS <= 0 || !Number.isFinite(sim.tS)) return null;
  const lateralDriftM = sim.zM; // +right
  const correctionM = -lateralDriftM; // aim/dial opposite drift
  const mradRaw = rangeH > 0 ? correctionM / (rangeH / 1000) : 0;
  const mradRounded = Math.round(mradRaw * 100) / 100;
  const moa = mradRounded * (180 / Math.PI) * (60 / 1000);
  const value = scopeUnit === 'MIL' ? mradRounded : moa;
  const angleAbs = Math.round(Math.abs(value) * 100) / 100;
  const windageClicks = Math.round(Math.abs(value) / scopeClickValue);
  return {
    driftCm: Math.abs(lateralDriftM) * 100,
    angleAbs,
    windageClicks,
    holdRight: mradRounded > 0,
    outOfRange: distanceM > maxM,
  };
}

/** Distance bands for turret table (same as static TURRET_TABLE). */
const TURRET_DISTANCE_BANDS = [
  [150, 170], [171, 200], [201, 250], [251, 300], [301, 350], [351, 400],
  [401, 450], [451, 500], [501, 550], [551, 600], [601, 650], [651, 700], [701, 750], [751, 800],
] as const;

/** Generate distance points from min, max, and interval (e.g. 100, 150, 200... up to max). */
export function generateDistancesFromInterval(
  minM: number,
  maxM: number,
  intervalM: number
): number[] {
  if (intervalM <= 0 || maxM < minM) return [];
  const out: number[] = [];
  for (let d = minM; d <= maxM; d += intervalM) {
    out.push(Math.round(d));
  }
  return out;
}

/** Build turret table from trajectory with optional custom distances. If distances provided, uses them; otherwise uses default bands. scopeClickValue in mrad or MOA per click, scopeUnit MIL|MOA. */
export function buildTurretTableFromTrajectory(
  dropAtRangeCm: (rangeM: number) => number,
  scopeClickValue: number,
  scopeUnit: ScopeUnit,
  customDistances?: number[]
): TurretRow[] {
  const rows: TurretRow[] = [];
  const bands: [number, number][] = customDistances && customDistances.length > 0
    ? customDistances.map((d) => [d, d] as [number, number])
    : TURRET_DISTANCE_BANDS;
  for (let i = 0; i < bands.length; i++) {
    const [dMin, dMax] = bands[i];
    // Match printed reference rows: 150 m for 150–170; otherwise band end (200, 250, …).
    const dSample =
      customDistances && customDistances.length > 0
        ? (dMin + dMax) / 2
        : dMin === 150 && dMax === 170
          ? 150
          : dMax;
    const dropCm = dropAtRangeCm(dSample);
    const dropM = dropCm / 100;
    const mrad = dropM / (dSample / 1000);
    const mradRounded = Math.round(mrad * 100) / 100;
    const moa = mradRounded * (180 / Math.PI) * (60 / 1000);
    const value = scopeUnit === 'MIL' ? mradRounded : moa;
    const clicks = Math.round(Math.abs(value) / scopeClickValue);
    const inRange = dMax <= 400;
    rows.push({
      distanceMin: dMin,
      distanceMax: dMax,
      dropCm: `${Math.round(dropCm)}cm`,
      mrad: scopeUnit === 'MIL' ? `${-mradRounded.toFixed(2)}` : `${-moa.toFixed(2)}`,
      clicks: `^${clicks} clicks`,
      inRange,
    });
  }
  return rows;
}

/** Compensation table distances. */
const COMP_DISTANCES = [100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800];

export interface CompensationRow {
  mils: number;
  distance: number;
  cm: number;
}

/** Build compensation table from trajectory (drop at each distance). */
export function buildCompensationTableFromTrajectory(
  dropAtRangeCm: (rangeM: number) => number,
  customDistances?: number[]
): CompensationRow[] {
  const distances = customDistances && customDistances.length > 0 ? customDistances : COMP_DISTANCES;
  return distances.map((distance) => {
    const cm = Math.round(dropAtRangeCm(distance));
    const mils = distance > 0 ? Math.round((1 / distance) * 100000) / 100000 : 0;
    return { mils, distance, cm };
  });
}

/** Get turret row for a distance from a custom turret table. */
export function getTurretRowFromTable(
  distanceM: number,
  table: TurretRow[]
): TurretResult | null {
  if (!Number.isFinite(distanceM) || distanceM < 0 || table.length === 0) return null;
  const row = table.find((r) => distanceM >= r.distanceMin && distanceM <= r.distanceMax);
  if (row) {
    return {
      line: `Turret: ${row.dropCm} ${row.mrad} ${row.clicks}`,
      inRange: row.inRange,
      outOfRange: false,
    };
  }
  const minD = table[0].distanceMin;
  const maxD = table[table.length - 1].distanceMax;
  const outOfRange = distanceM < minD || distanceM > maxD;
  return { line: '', inRange: false, outOfRange };
}

/** Compute turret (drop, mrad, clicks) for an exact distance (meter-precise). maxM optional; used for outOfRange when beyond table range. */
export function getTurretForExactDistance(
  distanceM: number,
  dropAtRangeCm: (rangeM: number) => number,
  scopeClickValue: number,
  scopeUnit: ScopeUnit,
  maxM: number = 1200
): TurretResult | null {
  if (!Number.isFinite(distanceM) || distanceM <= 0 || scopeClickValue <= 0) return null;
  const dropCm = dropAtRangeCm(distanceM);
  const dropM = dropCm / 100;
  const mrad = dropM / (distanceM / 1000);
  const mradRounded = Math.round(mrad * 100) / 100;
  const moa = mradRounded * (180 / Math.PI) * (60 / 1000);
  const value = scopeUnit === 'MIL' ? mradRounded : moa;
  const clicks = Math.round(Math.abs(value) / scopeClickValue);
  const inRange = distanceM <= 400;
  const outOfRange = distanceM > maxM;
  return {
    line: `Turret: ${Math.round(dropCm)}cm ${scopeUnit === 'MIL' ? -mradRounded.toFixed(2) : -moa.toFixed(2)} ^${clicks} clicks`,
    inRange,
    outOfRange,
  };
}

/** Interpolate drop (cm) from static compensation distances for exact-meter lookup when no trajectory. */
export function interpolateDropFromCompensation(distances: number[], cms: number[], distanceM: number): number {
  if (distanceM <= distances[0]) return cms[0];
  if (distanceM >= distances[distances.length - 1]) return cms[cms.length - 1];
  for (let i = 0; i < distances.length - 1; i++) {
    if (distanceM >= distances[i] && distanceM <= distances[i + 1]) {
      const t = (distanceM - distances[i]) / (distances[i + 1] - distances[i]);
      return cms[i] + t * (cms[i + 1] - cms[i]);
    }
  }
  return cms[cms.length - 1];
}
