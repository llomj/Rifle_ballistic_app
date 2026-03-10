/**
 * Ballistic data and formulas. Single source of truth aligned with rifle_distance.py and rifle_height.py.
 * Supports MIL and MOA scopes. AGENTS.md §0.
 */

export type ScopeUnit = 'MIL' | 'MOA';

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
  bulletId: string;
  /** Powder charge in grams (user input). */
  bulletGram?: number;
  muzzleVelocityMps: number;
  bcOverride?: number;
  createdAt?: number;
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

/** Default profile: Tikka .300 Win Mag + Hawke SideWinder + 180 gr, 922 m/s. */
export const DEFAULT_BALLISTIC_PROFILE: BallisticProfile = {
  id: 'default',
  userName: 'Default (Tikka .300)',
  rifleId: 'tikka-t3x-300winmag-laminated',
  scopeId: 'hawke-sidewinder-30-4-16x50',
  scopeHeightCm: 4.6,
  zeroDistanceM: 100,
  barrelLengthCm: 60,
  twistRate: '1:11',
  rimDiametersMm: 13.3,
  caseLengthMm: 67,
  overallLengthMm: 85,
  bulletId: '300winmag-180gr-g1',
  muzzleVelocityMps: 922,
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

/** Distance from target height and mils. Formula: height × 1000 / mils = distance (m). */
export function distanceFromHeightMils(heightM: number, mils: number): number {
  if (mils <= 0) return 0;
  return Math.round((heightM * 1000) / mils * 100) / 100;
}

/** Distance from target height and MOA. Formula: height × 95.5 / moa = distance (m). */
export function distanceFromHeightMOA(heightM: number, moa: number): number {
  if (moa <= 0) return 0;
  return Math.round((heightM * 95.5) / moa * 100) / 100;
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

/** Height from target distance and MOA. Formula: distance × moa / 95.5 = height (m). */
export function heightFromDistanceMOA(distanceM: number, moa: number): number {
  return Math.round((distanceM * moa) / 95.5 * 100) / 100;
}

export interface TurretResult {
  /** e.g. "Turret: 35cm -1.2 ^12 clicks" */
  line: string;
  inRange: boolean;
  /** true if distance is beyond the table (e.g. > 800 m) */
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

// --- Trajectory engine (G1 simplified point-mass) ---
const G = 9.80665;
const ZERO_DISTANCE_DEFAULT_M = 100;

/** Simple velocity decay: v(x) = v0 / (1 + x / (BC*1000)). Returns time to reach distance (s). */
function timeToDistance(v0: number, bc: number, distanceM: number): number {
  if (v0 <= 0 || bc <= 0 || distanceM <= 0) return 0;
  const k = 1000 * bc;
  return (distanceM + (distanceM * distanceM) / (2 * k)) / v0;
}

/** Gravity drop at distance (m) in meters, no zero. */
function dropGravityM(v0: number, bc: number, distanceM: number): number {
  const t = timeToDistance(v0, bc, distanceM);
  return 0.5 * G * t * t;
}

/** Drop relative to LOS zeroed at zeroDist, in cm. scopeHeight in cm. */
export function computeDropAtRangeCm(
  bcG1: number,
  muzzleVelocityMps: number,
  zeroDistanceM: number,
  scopeHeightCm: number,
  rangeM: number
): number {
  if (bcG1 <= 0 || muzzleVelocityMps <= 0 || rangeM < 0) return 0;
  const scopeH = scopeHeightCm / 100;
  const dropAtZero = dropGravityM(muzzleVelocityMps, bcG1, zeroDistanceM);
  const dropAtRange = dropGravityM(muzzleVelocityMps, bcG1, rangeM);
  const losAtRange = scopeH + (rangeM / zeroDistanceM) * (dropAtZero + scopeH);
  const dropRel = dropAtRange - losAtRange;
  return dropRel * 100;
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
    const dMid = (dMin + dMax) / 2;
    const dropCm = dropAtRangeCm(dMid);
    const dropM = dropCm / 100;
    const mrad = dropM / (dMid / 1000);
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
  maxM: number = 800
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
