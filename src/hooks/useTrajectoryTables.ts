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
  generateDistancesFromInterval,
  type TurretRow,
  type TurretResult,
  type CompensationRow,
} from '../data/ballistic';
import { useBallisticSettings } from '../contexts/BallisticSettingsContext';

/** Returns turret table, compensation table, getTurretRow, and getTurretForExactDistance for the current profile. Uses trajectory when bullet + scope + BC + MV are available; otherwise falls back to static table. Zero distance from profile drives drop, holdover, clicks. */
export function useTrajectoryTables(): {
  turretTable: TurretRow[];
  compensationTable: CompensationRow[];
  getTurretRowForDistance: (distanceM: number) => TurretResult | null;
  getTurretForExactDistance: (distanceM: number) => TurretResult | null;
} {
  const { currentProfile } = useBallisticProfile();
  const { scopeUnit, clicksConfig } = useBallisticSettings();

  return useMemo(() => {
    const scope = getScopeById(currentProfile.scopeId);
    const bullet = getBulletById(currentProfile.bulletId);
    // Use G7 BC when bullet has dragModel G7 (more accurate for long-range); otherwise G1
    const bc = currentProfile.bcOverride ?? (
      bullet?.dragModel?.toUpperCase() === 'G7' && bullet?.bcG7 != null ? bullet.bcG7 : bullet?.bcG1
    );
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
      };
    }

    const zeroM = currentProfile.zeroDistanceM ?? 100;
    const dropAtRange = (rangeM: number) =>
      computeDropAtRangeCm(bc, mv, zeroM, scopeH, rangeM);

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
    return {
      turretTable,
      compensationTable,
      getTurretRowForDistance: (distanceM: number) =>
        getTurretForExactDistance(distanceM, dropAtRange, scope.clickValue, scope.unit, maxM),
      getTurretForExactDistance: (distanceM: number) =>
        getTurretForExactDistance(distanceM, dropAtRange, scope.clickValue, scope.unit, maxM),
    };
  }, [
    currentProfile.scopeId,
    currentProfile.bulletId,
    currentProfile.bcOverride,
    currentProfile.muzzleVelocityMps,
    currentProfile.scopeHeightCm,
    currentProfile.zeroDistanceM,
    scopeUnit,
    clicksConfig.minM,
    clicksConfig.maxM,
    clicksConfig.intervalM,
  ]);
}
