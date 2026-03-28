/** Approximate MV change per °C powder/air temperature vs reference (field tuning; load-dependent). */
export const MV_CHANGE_MPS_PER_DEGREE_C = 0.45;

/**
 * Approximate MV change per cm barrel length vs catalog reference barrel (typical bottleneck rifle;
 * load-dependent — use as estimate).
 */
export const MV_CHANGE_MPS_PER_CM_BARREL = 1.2;

/** Default temperature (°C) at which the entered muzzle velocity is assumed measured when not specified. */
export const DEFAULT_MV_REFERENCE_TEMP_C = 15;
