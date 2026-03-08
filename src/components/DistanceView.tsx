import React, { useState, useMemo } from 'react';
import { useSwipeLeft } from '../hooks/useSwipeLeft';
import { useSound } from '../contexts/SoundContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBallisticSettings } from '../contexts/BallisticSettingsContext';
import { CIRCLE_SIZE_PX } from '../constants/ballisticUI';
import { mToYd, cmToIn, ftToM, formatTurretLine } from '../utils/ballisticUnits';
import { formatTranslation } from '../translations';
import { CliLine } from './CliBlock';
import { distanceFromHeight } from '../data/ballistic';
import { useTrajectoryTables } from '../hooks/useTrajectoryTables';

interface DistanceViewProps {
  onBack: () => void;
  onSwitchToHeight: () => void;
  /** Swipe left goes back to first page (clicks circle). */
  onBackToFirstPage?: () => void;
}

export const DistanceView: React.FC<DistanceViewProps> = ({
  onBack,
  onSwitchToHeight,
  onBackToFirstPage,
}) => {
  const { playTapSound } = useSound();
  const { t } = useLanguage();
  const { scopeUnit, measurement } = useBallisticSettings();
  const [heightStr, setHeightStr] = useState('');
  const [valueStr, setValueStr] = useState('');
  const [inputsSectionExpanded, setInputsSectionExpanded] = useState(false);

  const { getTurretRowForDistance } = useTrajectoryTables();
  const parseNum = (s: string) => parseFloat(String(s).replace(',', '.')) || 0;
  const heightRaw = useMemo(() => parseNum(heightStr), [heightStr]);
  const height = useMemo(() => (measurement === 'imperial' ? ftToM(heightRaw) : heightRaw), [heightRaw, measurement]);
  const value = useMemo(() => parseNum(valueStr), [valueStr]);
  const distance = useMemo(() => {
    if (height <= 0 || value <= 0) return null;
    return distanceFromHeight(height, value, scopeUnit);
  }, [height, value, scopeUnit]);
  const turret = useMemo(
    () => (distance != null ? getTurretRowForDistance(distance) : null),
    [distance, getTurretRowForDistance]
  );
  const result = distance != null ? Math.round(distance * 1000) / 1000 : null;
  const isMIL = scopeUnit === 'MIL';
  const reticleCm = result != null && value > 0
    ? isMIL ? Math.round((result / 10) * 100) / 100 : Math.round((2.91 * result / 100) * 100) / 100
    : null;
  const hasResult = result != null && result > 0;
  const resultFormatted = result != null
    ? (measurement === 'imperial' ? `${(mToYd(result)).toFixed(1)} yd` : `${result} m`)
    : '';
  const reticleFormatted = reticleCm != null
    ? (measurement === 'imperial' ? `${(cmToIn(reticleCm)).toFixed(2)} in` : `${reticleCm} cm`)
    : '';
  const heightFormatted = height > 0
    ? (measurement === 'imperial' ? `${heightRaw.toFixed(2)} ft` : `${height} m`)
    : String(height);

  useSwipeLeft(onBackToFirstPage ? () => { playTapSound(); onBackToFirstPage(); } : undefined);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-200px)] px-4 font-mono text-xs touch-pan-y">
      <button
        type="button"
        onClick={() => { playTapSound(); setInputsSectionExpanded((e) => !e); }}
        className="rounded-full border-2 border-amber-400/50 bg-amber-500/10 flex flex-col items-center justify-center shadow-lg shadow-amber-500/10 gap-1.5 hover:bg-amber-500/20 hover:border-amber-400/70 active:scale-[0.98] transition-all touch-manipulation"
        style={{ width: CIRCLE_SIZE_PX, height: CIRCLE_SIZE_PX }}
        aria-label={t('ballistic.calculate')}
      >
        <i className="fas fa-calculator text-amber-300 text-3xl" />
        <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">{t('ballistic.calculate')}</span>
        <i className={`fas fa-chevron-${inputsSectionExpanded ? 'up' : 'down'} text-slate-500 text-[10px]`} />
      </button>
      {inputsSectionExpanded && (
        <div className="w-full max-w-md mt-4 rounded-xl border border-amber-400/30 bg-amber-500/5 overflow-hidden px-4 pb-4 space-y-3 pt-3">
          <section className="space-y-2">
            <label className="block">
              <CliLine role="yellow">{measurement === 'imperial' ? t('ballistic.targetHeightLabelFt') : t('ballistic.targetHeightLabel')}</CliLine>
              <input
                type="number"
                min="0.1"
                max={measurement === 'imperial' ? 33 : 10}
                step={0.01}
                value={heightStr}
                onChange={(e) => setHeightStr(e.target.value)}
                className="mt-1 w-full rounded bg-black/40 border border-white/20 px-3 py-2 text-amber-300 font-mono text-xs"
                placeholder={measurement === 'imperial' ? 'e.g. 5.74' : 'e.g. 1.75'}
              />
            </label>
            <label className="block">
              <CliLine role="yellow">{isMIL ? t('ballistic.enterMilsLabel') : t('ballistic.enterMoaLabel')}</CliLine>
              <input
                type="number"
                min="0.1"
                max="20"
                step="0.1"
                value={valueStr}
                onChange={(e) => setValueStr(e.target.value)}
                className="mt-1 w-full rounded bg-black/40 border border-white/20 px-3 py-2 text-amber-300 font-mono text-xs"
                placeholder={isMIL ? 'e.g. 4' : 'e.g. 2'}
              />
            </label>
          </section>
          <div className="flex gap-2">
            <button
              disabled
              className="flex-1 py-2 rounded border border-amber-400/30 bg-amber-500/10 text-amber-300 font-medium cursor-default"
            >
              {t('ballistic.hubDistance')}
            </button>
            <button
              onClick={() => { playTapSound(); onSwitchToHeight(); }}
              className="flex-1 py-2 rounded border border-white/10 bg-white/5 text-slate-400 hover:text-white font-medium"
            >
              {t('ballistic.hubHeight')}
            </button>
          </div>
          {hasResult ? (
            <section className="mt-3 pt-3 border-t border-white/10 space-y-1 max-h-[12rem] overflow-y-auto">
              {turret &&
                (turret.outOfRange ? (
                  <CliLine role="white">{t('ballistic.targetTooFar')}</CliLine>
                ) : (
                  <CliLine role="white">{formatTurretLine(turret.line, measurement)}</CliLine>
                ))}
              <CliLine role="yellow">{formatTranslation(t('ballistic.distanceIs'), { result: resultFormatted })}</CliLine>
              <CliLine role="white">{formatTranslation(t('ballistic.distanceEquals'), { result: resultFormatted })}</CliLine>
              <CliLine role="white">{formatTranslation(t('ballistic.reticleEquals'), { value: reticleFormatted })}</CliLine>
              <CliLine role="white">{isMIL ? formatTranslation(t('ballistic.targetHeightResult'), { value: reticleFormatted, mils: String(value), height: heightFormatted }) : formatTranslation(t('ballistic.targetHeightResultMoa'), { value: reticleFormatted, moa: String(value), height: heightFormatted })}</CliLine>
              <CliLine role="white">{isMIL ? `mils = ${value}` : `MOA = ${value}`}</CliLine>
            </section>
          ) : (
            (heightStr.trim() !== '' || valueStr.trim() !== '') && (
              <div className="mt-2">
                <CliLine role="cyan">{isMIL ? t('ballistic.enterBothHeightAndMils') : t('ballistic.enterBothHeightAndMoa')}</CliLine>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
