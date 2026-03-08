import React, { useState, useMemo } from 'react';
import { useSwipeLeft } from '../hooks/useSwipeLeft';
import { useSound } from '../contexts/SoundContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBallisticSettings } from '../contexts/BallisticSettingsContext';
import { cmToIn, ydToM, mToFt, formatTurretLine } from '../utils/ballisticUnits';
import { formatTranslation } from '../translations';
import { CliLine } from './CliBlock';
import { heightFromDistanceMils, heightFromDistanceMOA } from '../data/ballistic';
import { useTrajectoryTables } from '../hooks/useTrajectoryTables';

interface HeightViewProps {
  onBack: () => void;
  onSwitchToDistance: () => void;
  /** Swipe left goes back to first page (clicks circle). */
  onBackToFirstPage?: () => void;
}

export const HeightView: React.FC<HeightViewProps> = ({
  onBack,
  onSwitchToDistance,
  onBackToFirstPage,
}) => {
  const { playTapSound } = useSound();
  const { t } = useLanguage();
  const { scopeUnit, measurement } = useBallisticSettings();
  const [distanceStr, setDistanceStr] = useState('');
  const [valueStr, setValueStr] = useState('');
  const [inputsSectionExpanded, setInputsSectionExpanded] = useState(false);

  const { getTurretRowForDistance } = useTrajectoryTables();
  const parseNum = (s: string) => parseFloat(String(s).replace(',', '.')) || 0;
  const distanceRaw = useMemo(() => parseNum(distanceStr), [distanceStr]);
  const distance = useMemo(() => (measurement === 'imperial' ? ydToM(distanceRaw) : distanceRaw), [distanceRaw, measurement]);
  const value = useMemo(() => parseNum(valueStr), [valueStr]);
  const isMIL = scopeUnit === 'MIL';
  const height = useMemo(() => {
    if (distance <= 0 || value <= 0) return null;
    return isMIL ? heightFromDistanceMils(distance, value) : heightFromDistanceMOA(distance, value);
  }, [distance, value, isMIL]);
  const turret = useMemo(
    () => (distance > 0 ? getTurretRowForDistance(distance) : null),
    [distance, getTurretRowForDistance]
  );
  const result = height != null ? Math.round(height * 1000) / 1000 : null;
  const reticleCm =
    result != null && value > 0
      ? isMIL ? Math.round((distance / 10) * 100) / 100 : Math.round((2.91 * distance / 100) * 100) / 100
      : null;
  const hasResult = result != null && result > 0;
  const resultFormatted = result != null
    ? (measurement === 'imperial' ? `${mToFt(result).toFixed(2)} ft` : `${result} m`)
    : '';
  const reticleFormatted = reticleCm != null
    ? (measurement === 'imperial' ? `${cmToIn(reticleCm).toFixed(2)} in` : `${reticleCm} cm`)
    : '';

  useSwipeLeft(onBackToFirstPage ? () => { playTapSound(); onBackToFirstPage(); } : undefined);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-200px)] px-4 font-mono text-xs">
      <button
        type="button"
        onClick={() => { playTapSound(); setInputsSectionExpanded((e) => !e); }}
        className="w-48 h-48 rounded-full border-2 border-amber-400/50 bg-amber-500/10 flex flex-col items-center justify-center shadow-lg shadow-amber-500/10 gap-1.5 hover:bg-amber-500/20 hover:border-amber-400/70 active:scale-[0.98] transition-all touch-manipulation"
        aria-label={t('ballistic.calculate')}
      >
        <i className="fas fa-calculator text-amber-300 text-2xl" />
        <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">{t('ballistic.calculate')}</span>
        <i className={`fas fa-chevron-${inputsSectionExpanded ? 'up' : 'down'} text-slate-500 text-[10px]`} />
      </button>
      {inputsSectionExpanded && (
        <div className="w-full max-w-md mt-4 rounded-xl border border-amber-400/30 bg-amber-500/5 overflow-hidden px-4 pb-4 space-y-3 pt-3">
          <section className="space-y-2">
            <label className="block">
              <CliLine role="yellow">{measurement === 'imperial' ? t('ballistic.targetDistanceLabelYd') : t('ballistic.targetDistanceLabel')}</CliLine>
              <input
                type="number"
                min={measurement === 'imperial' ? 55 : 50}
                max={measurement === 'imperial' ? 1094 : 1000}
                step="1"
                value={distanceStr}
                onChange={(e) => setDistanceStr(e.target.value)}
                className="mt-1 w-full rounded bg-black/40 border border-white/20 px-3 py-2 text-amber-300 font-mono text-xs"
                placeholder={measurement === 'imperial' ? 'e.g. 329' : 'e.g. 300'}
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
              onClick={() => { playTapSound(); onSwitchToDistance(); }}
              className="flex-1 py-2 rounded border border-white/10 bg-white/5 text-slate-400 hover:text-white font-medium"
            >
              {t('ballistic.hubDistance')}
            </button>
            <button
              disabled
              className="flex-1 py-2 rounded border border-amber-400/30 bg-amber-500/10 text-amber-300 font-medium cursor-default"
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
              <CliLine role="yellow">
                {formatTranslation(t('ballistic.heightEquals'), { value: resultFormatted })}
              </CliLine>
              <CliLine role="white">
                {formatTranslation(t('ballistic.reticleEquals'), { value: reticleFormatted })}
              </CliLine>
              <CliLine role="white">
                {isMIL ? formatTranslation(t('ballistic.targetHeightResult'), { value: reticleFormatted, mils: String(value), height: resultFormatted }) : formatTranslation(t('ballistic.targetHeightResultMoa'), { value: reticleFormatted, moa: String(value), height: resultFormatted })}
              </CliLine>
              <CliLine role="white">{isMIL ? `mils = ${value}` : `MOA = ${value}`}</CliLine>
            </section>
          ) : (
            (distanceStr.trim() !== '' || valueStr.trim() !== '') && (
              <div className="mt-2">
                <CliLine role="cyan">{isMIL ? t('ballistic.enterBothDistanceAndMils') : t('ballistic.enterBothDistanceAndMoa')}</CliLine>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};
