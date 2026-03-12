/**
 * Ballistic unit conversions and formatters.
 * All internal storage remains in metric; display converts when imperial.
 */

export type MeasurementSystem = 'metric' | 'imperial';

// --- Conversions ---
export const mToYd = (m: number) => m * 1.0936139;
export const ydToM = (yd: number) => yd / 1.0936139;
export const cmToIn = (cm: number) => cm / 2.54;
export const inToCm = (inVal: number) => inVal * 2.54;
export const mmToIn = (mm: number) => mm / 25.4;
export const inToMm = (inVal: number) => inVal * 25.4;
export const msToFps = (ms: number) => ms * 3.28084;
export const fpsToMs = (fps: number) => fps / 3.28084;
export const mToFt = (m: number) => m * 3.28084;
export const ftToM = (ft: number) => ft / 3.28084;
export const kgToLb = (kg: number) => kg * 2.20462;
export const gToGr = (g: number) => g * 15.4324;
export const jToFtLb = (j: number) => j * 0.737562;

// --- Formatted display ---
export function formatDistance(m: number, measurement: MeasurementSystem): string {
  if (measurement === 'imperial') {
    const yd = mToYd(m);
    return `${yd % 1 === 0 ? yd : yd.toFixed(1)} yd`;
  }
  return `${m % 1 === 0 ? m : m.toFixed(1)} m`;
}

export function formatHeight(m: number, measurement: MeasurementSystem): string {
  if (measurement === 'imperial') {
    const ft = mToFt(m);
    return `${ft.toFixed(2)} ft`;
  }
  return `${m.toFixed(2)} m`;
}

export function formatDrop(cm: number, measurement: MeasurementSystem): string {
  if (measurement === 'imperial') {
    const inVal = cmToIn(cm);
    return `${Math.round(inVal * 10) / 10} in`;
  }
  return `${Math.round(cm)} cm`;
}

export function formatVelocity(ms: number, measurement: MeasurementSystem): string {
  if (measurement === 'imperial') {
    const fps = msToFps(ms);
    return `${Math.round(fps)} fps`;
  }
  return `${Math.round(ms)} m/s`;
}

export function formatScopeHeight(cm: number, measurement: MeasurementSystem): string {
  if (measurement === 'imperial') {
    const inVal = cmToIn(cm);
    return `${inVal.toFixed(2)} in`;
  }
  return `${cm.toFixed(1)} cm`;
}

export function formatBarrelLength(cm: number, measurement: MeasurementSystem): string {
  if (measurement === 'imperial') {
    const inVal = cmToIn(cm);
    return `${inVal.toFixed(2)} in`;
  }
  return `${cm.toFixed(1)} cm`;
}

export function formatMmLength(mm: number, measurement: MeasurementSystem): string {
  if (measurement === 'imperial') {
    const inVal = mmToIn(mm);
    return `${inVal.toFixed(2)} in`;
  }
  return `${mm.toFixed(1)} mm`;
}

/** Parse turret line "Turret: 35cm -1.2 ^12 clicks" and convert drop to imperial if needed */
export function formatTurretLine(line: string, measurement: MeasurementSystem): string {
  if (measurement !== 'imperial') return line;
  const match = line.match(/^Turret:\s*(\d+(?:\.\d+)?)cm\s+(.+)$/);
  if (!match) return line;
  const cm = parseFloat(match[1]);
  const rest = match[2];
  const inVal = cmToIn(cm);
  const inStr = Math.round(inVal * 10) / 10;
  return `Turret: ${inStr} in ${rest}`;
}
