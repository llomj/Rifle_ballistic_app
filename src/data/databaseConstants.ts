/**
 * Database constants for the hunting rifle ballistic calculator.
 * Reference data for scope systems, reticles, brands, bullet types, drag models.
 * AGENTS.md §11.
 */

/** Scope adjustment systems used in rifle scopes. */
export const SCOPE_ADJUSTMENT_SYSTEMS = [
  'MOA',
  'TMOA',
  'SMOA',
  'MIL',
  'MRAD',
  'IPHY',
] as const;
export type ScopeAdjustmentSystem = (typeof SCOPE_ADJUSTMENT_SYSTEMS)[number];

/** Key conversion: 1 MIL = 3.438 MOA. */
export const MIL_TO_MOA = 3.438;

/** Typical click values by system. */
export const TYPICAL_CLICK_VALUES: Record<string, number[]> = {
  MOA: [0.25, 0.125, 0.5],
  MIL: [0.1, 0.05, 0.2],
  MRAD: [0.1, 0.05],
  IPHY: [0.1, 0.2],
};

/** Classic hunting reticles. */
export const RETICLE_CLASSIC = [
  'Duplex',
  'German #1',
  'German #4',
  'Fine Crosshair',
  'Post',
] as const;

/** Rangefinding reticles. */
export const RETICLE_RANGEFINDING = [
  'Mil-Dot',
  'Half Mil Dot',
  'TMR',
  'MSR',
  'H59',
  'Tremor3',
] as const;

/** Grid / Christmas tree reticles. */
export const RETICLE_GRID = ['Horus', 'EBR-2C', 'SCR', 'MSR2'] as const;

/** BDC reticles. */
export const RETICLE_BDC = ['BDC 600', 'BDC 800', 'Rapid-Z', 'Dead-Hold'] as const;

/** All reticle types. */
export const RETICLE_TYPES = [
  ...RETICLE_CLASSIC,
  ...RETICLE_RANGEFINDING,
  ...RETICLE_GRID,
  ...RETICLE_BDC,
] as const;
export type ReticleType = (typeof RETICLE_TYPES)[number];

/** Focal planes. */
export const FOCAL_PLANES = ['FFP', 'SFP'] as const;
export type FocalPlane = (typeof FOCAL_PLANES)[number];

/** Scope tube diameters (mm). */
export const SCOPE_TUBE_DIAMETERS = [25.4, 30, 34, 35, 36, 40] as const; // 25.4 = 1 inch
export type ScopeTubeDiameter = (typeof SCOPE_TUBE_DIAMETERS)[number];

/** Premium scope brands. */
export const SCOPE_BRANDS_PREMIUM = [
  'Swarovski',
  'Zeiss',
  'Schmidt & Bender',
  'Kahles',
  'Tangent Theta',
  'Hensoldt',
] as const;

/** High-end scope brands. */
export const SCOPE_BRANDS_HIGHEND = ['Nightforce', 'Leica', 'Steiner'] as const;

/** Popular hunting scope brands. */
export const SCOPE_BRANDS_HUNTING = [
  'Vortex',
  'Leupold',
  'Burris',
  'Meopta',
  'Athlon',
  'Trijicon',
] as const;

/** Budget scope brands. */
export const SCOPE_BRANDS_BUDGET = [
  'Bushnell',
  'Hawke',
  'Primary Arms',
  'Sig Sauer',
] as const;

/** All scope brands. */
export const SCOPE_BRANDS = [
  ...SCOPE_BRANDS_PREMIUM,
  ...SCOPE_BRANDS_HIGHEND,
  ...SCOPE_BRANDS_HUNTING,
  ...SCOPE_BRANDS_BUDGET,
] as const;

/** Soft point bullet types. */
export const BULLET_TYPE_SOFT = ['SP', 'JSP', 'PSP'] as const;

/** Hollow point bullet types. */
export const BULLET_TYPE_HP = ['HP', 'HPBT'] as const;

/** Polymer tip bullet types. */
export const BULLET_TYPE_POLYMER = [
  'Ballistic Tip',
  'SST',
  'AccuTip',
  'ELD-X',
] as const;

/** Bonded bullet types. */
export const BULLET_TYPE_BONDED = [
  'Accubond',
  'Swift A-Frame',
  'InterBond',
] as const;

/** Monolithic copper bullet types. */
export const BULLET_TYPE_MONOLITHIC = [
  'Barnes TSX',
  'Barnes TTSX',
  'Hornady CX',
] as const;

/** Match bullet types. */
export const BULLET_TYPE_MATCH = [
  'Sierra MatchKing',
  'ELD-Match',
  'Berger Hybrid',
] as const;

/** All bullet construction types. */
export const BULLET_TYPES = [
  ...BULLET_TYPE_SOFT,
  ...BULLET_TYPE_HP,
  ...BULLET_TYPE_POLYMER,
  ...BULLET_TYPE_BONDED,
  ...BULLET_TYPE_MONOLITHIC,
  ...BULLET_TYPE_MATCH,
] as const;
export type BulletType = (typeof BULLET_TYPES)[number];

/** Bullet shape types. */
export const BULLET_SHAPES = [
  'Flat base',
  'Boat tail',
  'Boat tail hollow point',
  'Spitzer',
  'Round nose',
  'Wadcutter',
] as const;
export type BulletShape = (typeof BULLET_SHAPES)[number];

/** Drag models supported by ballistic solver. */
export const DRAG_MODELS = ['G1', 'G2', 'G5', 'G6', 'G7', 'G8', 'GL'] as const;
export type DragModel = (typeof DRAG_MODELS)[number];
