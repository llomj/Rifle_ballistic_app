import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useBallisticSettings } from '../contexts/BallisticSettingsContext';
import { distanceFromHeight, type ScopeUnit } from '../data/ballistic';
import { mToYd, ftToM } from '../utils/ballisticUnits';
import { useTrajectoryTables } from '../hooks/useTrajectoryTables';

/** Quick Range: target height + mils/MOA → distance, holdover, clicks. Field-friendly, instant. */
export const QuickRangeView: React.FC = () => {
  const { t } = useLanguage();
  const { scopeUnit, measurement } = useBallisticSettings();
  const { getTurretRowForDistance } = useTrajectoryTables();
  const [heightStr, setHeightStr] = useState('');
  const [valueStr, setValueStr] = useState('');

  const heightRaw = useMemo(() => parseFloat(heightStr) || 0, [heightStr]);
  const height = useMemo(() => (measurement === 'imperial' ? ftToM(heightRaw) : heightRaw), [heightRaw, measurement]);
  const value = useMemo(() => parseFloat(valueStr) || 0, [valueStr]);

  const distanceM = useMemo(() => {
    if (height <= 0 || value <= 0) return null;
    return distanceFromHeight(height, value, scopeUnit);
  }, [height, value, scopeUnit]);

  const turret = useMemo(
    () => (distanceM != null ? getTurretRowForDistance(distanceM) : null),
    [distanceM, getTurretRowForDistance]
  );

  const hasResult = distanceM != null && distanceM > 0;
  const isMIL = scopeUnit === 'MIL';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {t('ballistic.enterTargetHeight')}
          </span>
          <input
            type="number"
            min="0.1"
            max={measurement === 'imperial' ? 33 : 10}
            step="0.01"
            value={heightStr}
            onChange={(e) => setHeightStr(e.target.value)}
            placeholder={measurement === 'imperial' ? 'ft' : 'm'}
            className="mt-1 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2.5 text-theme-accent font-mono text-sm placeholder-slate-500 focus:border-theme-accent-50 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            {t('ballistic.enterMilsOrMoa')} ({isMIL ? t('ballistic.mils') : t('ballistic.moa')})
          </span>
          <input
            type="number"
            min="0.1"
            max="20"
            step="0.1"
            value={valueStr}
            onChange={(e) => setValueStr(e.target.value)}
            placeholder={isMIL ? 'mils' : 'MOA'}
            className="mt-1 w-full rounded-lg border border-white/20 bg-black/40 px-3 py-2.5 text-theme-accent font-mono text-sm placeholder-slate-500 focus:border-theme-accent-50 focus:outline-none"
          />
        </label>
      </div>

      {hasResult && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wider">{t('ballistic.resultDistance')}</span>
            <span className="font-mono text-lg font-bold text-emerald-400">
              {measurement === 'imperial' ? `${(distanceM != null ? mToYd(distanceM) : 0).toFixed(1)} yd` : `${distanceM?.toFixed(1)} m`}
            </span>
          </div>
          {turret && !turret.outOfRange && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider">{t('ballistic.resultHoldover')}</span>
                <span className="font-mono text-sm text-theme-accent">
                  {turret.line.replace(/^Turret:\s*/, '').split(/\s+/)[1] ?? '—'} {isMIL ? 'mrad' : 'MOA'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider">{t('ballistic.resultClicks')}</span>
                <span className="font-mono text-sm text-cyan-400">{turret.line.match(/\^(\d+)\s*clicks/)?.[1] ?? '—'} {t('ballistic.clicks')}</span>
              </div>
            </>
          )}
          {(!turret || turret.outOfRange) && (
            <p className="text-xs text-slate-500">
              {turret?.outOfRange ? t('ballistic.targetTooFar') : `${t('ballistic.table150to800')}; ${t('ballistic.resultHoldover')} / ${t('ballistic.resultClicks')} ${t('ballistic.for150mPlus')}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
