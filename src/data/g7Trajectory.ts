/**
 * G7 BC + G7 drag curve: numerical horizontal-range integration (flat fire).
 * Drag scaling matches js-ballistics base_engine.dragByMach: (cd * 2.08551e-4) / BC, dv/dt = -v * drag term.
 * Bore-line drop uses the same ½ g t² model as ingallsG1.dropBoreBelowMetersG1.
 */
import { interpolateCdG7 } from './g7DragTable';

const GRAVITY_MPS2 = 9.80665;
/** Same constant as o-murphy/js-ballistics BaseIntegrationEngine.dragByMach (imperial G-drag scale). */
const DRAG_SCALE_K = 2.08551e-4;
/** ISA sea level; pairs with densityFactor = 1 (same spirit as Ingalls G1 path). */
const SPEED_OF_SOUND_MPS = 340.29;

/**
 * Time of flight (s) for horizontal distance rangeM (m), G7 BC, muzzle speed m/s.
 */
export function timeOfFlightToRangeG7(bcG7: number, muzzleVelocityMps: number, rangeM: number): number {
  if (bcG7 <= 0 || muzzleVelocityMps <= 0 || rangeM <= 0) return 0;
  let x = 0;
  let v = muzzleVelocityMps;
  let t = 0;
  const dx = 0.25; // m; small fixed steps for stable TOF
  const maxIter = Math.ceil(rangeM / dx) + 50000;
  let iter = 0;
  while (x < rangeM - 1e-12 && iter < maxIter) {
    iter++;
    if (v < 0.5) break;
    const step = Math.min(dx, rangeM - x);
    const mach = v / SPEED_OF_SOUND_MPS;
    const cd = interpolateCdG7(mach);
    const dragTerm = (cd * DRAG_SCALE_K) / bcG7;
    const dvdt = -v * dragTerm;
    const dt = step / v;
    v += dvdt * dt;
    t += dt;
    x += step;
  }
  if (!Number.isFinite(t) || t <= 0) return 0;
  return t;
}

/**
 * Bullet drop from bore line (meters) from gravity only, using G7 drag TOF.
 * Flat-fire approximation; pairs with LOS zero model in computeDropAtRangeCm.
 */
export function dropBoreBelowMetersG7(bcG7: number, muzzleVelocityMps: number, rangeM: number): number {
  if (bcG7 <= 0 || muzzleVelocityMps <= 0 || rangeM <= 0) return 0;
  const t = timeOfFlightToRangeG7(bcG7, muzzleVelocityMps, rangeM);
  if (t <= 0 || !Number.isFinite(t)) return 0;
  return 0.5 * GRAVITY_MPS2 * t * t;
}
