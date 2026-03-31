import { useMemo } from 'react';
import { useBallisticProfile } from '../contexts/BallisticProfileContext';
import { getScopeById, getBulletById } from '../data/catalogs';
import {
  TURRET_TABLE,
  COMPENSATION_TABLE,
  getTurretForExactDistance,
  interpolateDropFromCompensation,
  buildTurretTableFromTrajectory,
  buildCompensationTableFromTrajectory,
  computeDropAtRangeCm,
  computeWindCorrectionAtDistance,
  generateDistancesFromInterval,
  type TrajectoryDragModel,
  type TurretRow,
  type TurretResult,
  type CompensationRow,
  type WindCorrectionAtRange,
} from '../data/ballistic';
import { useBallisticSettings } from '../contexts/BallisticSettingsContext';
import {
  computeEffectiveMuzzleVelocityMps,
  getReferenceBarrelLengthCm,
} from '../data/ballisticMvAdjust';
import { isaDensityRatioFromAltitudeM } from '../data/ballistic';

/** Returns turret table, compensation table, getTurretRow, getTurretForExactDistance, and wind (when profile wind speed set). Uses trajectory when bullet + scope + BC + MV are available; otherwise falls back to static table. Zero distance from profile drives drop, holdover, clicks. */
export function useTrajectoryTables(): {
  turretTable: TurretRow[];
  compensationTable: CompensationRow[];
  getTurretRowForDistance: (distanceM: number) => TurretResult | null;
  getTurretForExactDistance: (distanceM: number) => TurretResult | null;
  getWindForExactDistance: (distanceM: number) => WindCorrectionAtRange | null;
} {
  const { currentProfile } = useBallisticProfile();
  const { scopeUnit, clicksConfig, elevationEnabled, elevationData } = useBallisticSettings();

  return useMemo(() => {
    const scope = getScopeById(currentProfile.scopeId);
    const bullet = getBulletById(currentProfile.bulletId);
    const isG7Bullet = bullet?.dragModel?.toUpperCase() === 'G7';
    // G7 path: G7 BC + G7 drag curve. Fallback to G1 if G7 bullet has no G7 BC (unless user override).
    const bc =
      currentProfile.bcOverride ??
      (isG7Bullet && bullet?.bcG7 != null ? bullet.bcG7 : bullet?.bcG1);
    const trajectoryModel: TrajectoryDragModel =
      isG7Bullet && (currentProfile.bcOverride != null || bullet?.bcG7 != null) ? 'G7' : 'G1';
    const mv = currentProfile.muzzleVelocityMps;
    const scopeH = currentProfile.scopeHeightCm;

    const canCompute =
      scope &&
      bullet &&
      bc != null &&
      bc > 0 &&
      mv != null &&
      mv > 0 &&
      scopeH != null &&
      scopeH >= 0;

    if (!canCompute) {
      const scope = getScopeById(currentProfile.scopeId);
      const clickVal = scope?.clickValue ?? 0.1;
      const unit = scope?.unit ?? 'MIL';
      const dropAtRange = (d: number) =>
        interpolateDropFromCompensation(
          COMPENSATION_TABLE.map((r) => r.distance),
          COMPENSATION_TABLE.map((r) => r.cm),
          d
        );
      const customDistances = generateDistancesFromInterval(
        clicksConfig.minM,
        clicksConfig.maxM,
        clicksConfig.intervalM
      );
      const turretTable =
        customDistances.length > 0
          ? buildTurretTableFromTrajectory(dropAtRange, clickVal, unit, customDistances)
          : TURRET_TABLE;
      const compensationTable =
        customDistances.length > 0
          ? buildCompensationTableFromTrajectory(dropAtRange, customDistances)
          : COMPENSATION_TABLE;
      const maxM = clicksConfig.maxM;
      return {
        turretTable,
        compensationTable,
        getTurretRowForDistance: (distanceM: number) =>
          getTurretForExactDistance(distanceM, dropAtRange, clickVal, unit, maxM),
        getTurretForExactDistance: (distanceM: number) =>
          getTurretForExactDistance(distanceM, dropAtRange, clickVal, unit, maxM),
        getWindForExactDistance: () => null,
      };
    }

    const zeroM = currentProfile.zeroDistanceM ?? 100;
    const mvEff = computeEffectiveMuzzleVelocityMps({
      baseMuzzleVelocityMps: mv,
      powderTempC: currentProfile.powderTempC,
      mvReferenceTempC: currentProfile.mvReferenceTempC,
      barrelLengthCm: currentProfile.barrelLengthCm,
      referenceBarrelLengthCm: getReferenceBarrelLengthCm(bullet),
    });
    const inc = currentProfile.shotInclinationDeg;
    const densityFactor =
      elevationEnabled && elevationData.altitudeM != null && Number.isFinite(elevationData.altitudeM)
        ? isaDensityRatioFromAltitudeM(elevationData.altitudeM)
        : 1;
    const dropAtRange = (rangeM: number) =>
      computeDropAtRangeCm(bc, mvEff, zeroM, scopeH, rangeM, trajectoryModel, {
        inclinationDegFromHorizontal:
          inc != null && Number.isFinite(inc) ? inc : undefined,
        airDensityFactor: densityFactor,
      });

    const customDistances = generateDistancesFromInterval(
      clicksConfig.minM,
      clicksConfig.maxM,
      clicksConfig.intervalM
    );
    const turretTable = buildTurretTableFromTrajectory(
      dropAtRange,
      scope.clickValue,
      scope.unit,
      customDistances.length > 0 ? customDistances : undefined
    );
    const compensationTable = buildCompensationTableFromTrajectory(
      dropAtRange,
      customDistances.length > 0 ? customDistances : undefined
    );

    const maxM = clicksConfig.maxM;
    const windKph = currentProfile.windSpeedKph;
    const windClock = currentProfile.windFromClockDeg;
    const inclinationOpt =
      inc != null && Number.isFinite(inc) ? { inclinationDegFromHorizontal: inc } : undefined;
    const windOptions =
      inclinationOpt || densityFactor !== 1 ? { ...inclinationOpt, airDensityFactor: densityFactor } : undefined;
    return {
      turretTable,
      compensationTable,
      getTurretRowForDistance: (distanceM: number) =>
        getTurretForExactDistance(distanceM, dropAtRange, scope.clickValue, scope.unit, maxM),
      getTurretForExactDistance: (distanceM: number) =>
        getTurretForExactDistance(distanceM, dropAtRange, scope.clickValue, scope.unit, maxM),
      getWindForExactDistance: (distanceM: number) => {
        if (windKph == null || windKph <= 0) return null;
        return computeWindCorrectionAtDistance(
          distanceM,
          windKph,
          windClock,
          bc,
          mvEff,
          trajectoryModel,
          scope.clickValue,
          scope.unit,
          maxM,
          windOptions
        );
      },
    };
  }, [
    currentProfile.scopeId,
    currentProfile.bulletId,
    currentProfile.bcOverride,
    currentProfile.muzzleVelocityMps,
    currentProfile.scopeHeightCm,
    currentProfile.zeroDistanceM,
    currentProfile.shotInclinationDeg,
    currentProfile.powderTempC,
    currentProfile.mvReferenceTempC,
    currentProfile.barrelLengthCm,
    currentProfile.windSpeedKph,
    currentProfile.windFromClockDeg,
    elevationEnabled,
    elevationData.altitudeM,
    scopeUnit,
    clicksConfig.minM,
    clicksConfig.maxM,
    clicksConfig.intervalM,
  ]);
}
