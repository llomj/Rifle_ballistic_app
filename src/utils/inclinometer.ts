/**
 * Shot inclination from phone attitude (deviceorientation beta/gamma).
 * User calibrates while aiming level; then points at target. Positive ° = uphill (matches profile shotInclinationDeg).
 */

const LOWPASS = 0.12;

export function lowpassAngle(prev: number | null, raw: number): number {
  if (prev == null || !Number.isFinite(prev)) return raw;
  return prev + (raw - prev) * LOWPASS;
}

/**
 * Front-back tilt (degrees). Uses beta when roll (gamma) is moderate; otherwise blends toward beta-only.
 * Convention: ~90° when phone is upright in portrait; decreases when top tilts toward sky (typical iOS/Android).
 */
export function pitchDegFromBetaGamma(beta: number, gamma: number): number {
  const g = Math.abs(gamma);
  if (g < 35) return beta;
  const b = (beta * Math.PI) / 180;
  const gr = (gamma * Math.PI) / 180;
  const pitchRad = Math.atan2(Math.sin(b) * Math.cos(gr), Math.cos(b));
  return (pitchRad * 180) / Math.PI;
}

/** Inclination for ballistic profile: + uphill, − downhill. */
export function inclinationFromCalibratedPitch(pitchDeg: number, pitchRefDeg: number): number {
  return Math.round((pitchRefDeg - pitchDeg) * 10) / 10;
}
