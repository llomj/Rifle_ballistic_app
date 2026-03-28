/**
 * G7 standard drag curve: Mach vs CD (dimensionless), used with BC in the point-mass model.
 * Values match the G7 table in o-murphy/js-ballistics (ISC); same family as common G7 datasets.
 */

/** Mach breakpoints (monotonic increasing). */
export const G7_MACH: readonly number[] = [
  0, 0.05, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.725, 0.75, 0.775, 0.8, 0.825, 0.85,
  0.875, 0.9, 0.925, 0.95, 0.975, 1, 1.025, 1.05, 1.075, 1.1, 1.125, 1.15, 1.2, 1.25, 1.3, 1.35, 1.4, 1.5, 1.55, 1.6,
  1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 1.95, 2, 2.05, 2.1, 2.15, 2.2, 2.25, 2.3, 2.35, 2.4, 2.45, 2.5, 2.55, 2.6, 2.65, 2.7,
  2.75, 2.8, 2.85, 2.9, 2.95, 3, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 4, 4.2, 4.4, 4.6, 4.8, 5,
];

/** Drag coefficient CD(Mach) for G7 reference projectile. */
export const G7_CD: readonly number[] = [
  0.1198, 0.1197, 0.1196, 0.1194, 0.1193, 0.1194, 0.1194, 0.1194, 0.1193, 0.1193, 0.1194, 0.1193, 0.1194, 0.1197, 0.1202,
  0.1207, 0.1215, 0.1226, 0.1242, 0.1266, 0.1306, 0.1368, 0.1464, 0.166, 0.2054, 0.2993, 0.3803, 0.4015, 0.4043, 0.4034,
  0.4014, 0.3987, 0.3955, 0.3884, 0.381, 0.3732, 0.3657, 0.358, 0.344, 0.3376, 0.3315, 0.326, 0.3209, 0.316, 0.3117,
  0.3078, 0.3042, 0.301, 0.298, 0.2951, 0.2922, 0.2892, 0.2864, 0.2835, 0.2807, 0.2779, 0.2752, 0.2725, 0.2697, 0.267,
  0.2643, 0.2615, 0.2588, 0.2561, 0.2533, 0.2506, 0.2479, 0.2451, 0.2424, 0.2368, 0.2313, 0.2258, 0.2205, 0.2154, 0.2106,
  0.206, 0.2017, 0.1975, 0.1935, 0.1861, 0.1793, 0.173, 0.1672, 0.1618,
];

export function interpolateCdG7(mach: number): number {
  if (mach <= G7_MACH[0]) return G7_CD[0];
  if (mach >= G7_MACH[G7_MACH.length - 1]) return G7_CD[G7_CD.length - 1];
  let lo = 0;
  let hi = G7_MACH.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (G7_MACH[mid] <= mach) lo = mid;
    else hi = mid;
  }
  const t = (mach - G7_MACH[lo]) / (G7_MACH[hi] - G7_MACH[lo]);
  return G7_CD[lo] + t * (G7_CD[hi] - G7_CD[lo]);
}
