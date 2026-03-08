import React, { useState, useMemo, useEffect } from 'react';
import { useSwipeLeft } from '../hooks/useSwipeLeft';
import { useSound } from '../contexts/SoundContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBallisticSettings } from '../contexts/BallisticSettingsContext';
import { CIRCLE_SIZE_PX } from '../constants/ballisticUI';

const DEG_TO_MRAD = (1000 * Math.PI) / 180;
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
  const { scopeUnit, measurement, compassMode } = useBallisticSettings();
  const [heading, setHeading] = useState<number | null>(null);
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

  useEffect(() => {
    if (!compassMode) {
      setHeading(null);
      return;
    }
    const handler = (e: DeviceOrientationEvent) => {
      const a = e.alpha;
      if (a != null && !Number.isNaN(a)) setHeading(a);
    };
    window.addEventListener('deviceorientation', handler);
    return () => window.removeEventListener('deviceorientation', handler);
  }, [compassMode]);

  const radius = CIRCLE_SIZE_PX / 2;

  return (
    <div className="flex flex-col items-center min-h-[calc(100dvh-200px)] px-4 font-mono text-xs touch-pan-y pb-8">
      <div className="flex-1 min-h-[min(55vh,400px)] flex-shrink-0 flex items-center justify-center w-full">
        <button
        type="button"
        onClick={() => { playTapSound(); setInputsSectionExpanded((e) => !e); }}
        className="relative rounded-full border-2 border-amber-400/50 bg-amber-500/10 flex flex-col items-center justify-center shadow-lg shadow-amber-500/10 gap-1.5 hover:bg-amber-500/20 hover:border-amber-400/70 active:scale-[0.98] transition-all touch-manipulation"
        style={{ width: CIRCLE_SIZE_PX, height: CIRCLE_SIZE_PX }}
        aria-label={t('ballistic.calculate')}
      >
        {/* Fixed center: calculator + Calculate + chevron */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <i className="fas fa-calculator text-amber-300 text-3xl" />
          {compassMode && heading != null && (
            <span className="text-sm text-amber-400/90 font-mono tabular-nums mt-2">
              {Math.round(heading * DEG_TO_MRAD)} mrad
            </span>
          )}
          <i className={`fas fa-chevron-${inputsSectionExpanded ? 'up' : 'down'} text-slate-500 text-[10px] mt-0.5`} />
        </div>

        {/* Fixed bezel: serrations */}
        {Array.from({ length: 120 }, (_, i) => {
          const d = (i / 120) * 360;
          const isCardinal = i % 30 === 0;
          return (
            <div
              key={`serration-${d}`}
              className="absolute left-1/2 top-1/2 w-px origin-top z-[5]"
              style={{
                height: isCardinal ? 8 : 4,
                backgroundColor: 'rgba(251, 191, 36, 0.35)',
                transform: `translate(-50%, -50%) rotate(${d}deg) translateY(-${radius}px)`,
              }}
            />
          );
        })}
        <div
          className="absolute left-1/2 top-0 w-0.5 h-4 -translate-x-1/2 rounded-b z-[5]"
          style={{ backgroundColor: 'rgba(251, 191, 36, 0.7)' }}
          aria-hidden
        />

        {/* Rotating dial: north arrow + N only (mrad in fixed centre) */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            transform: compassMode && heading != null ? `rotate(${-heading}deg)` : undefined,
            transition: compassMode ? 'transform 0.1s ease-out' : 'none',
          }}
        >
          <span
            className="absolute left-1/2 top-2 font-mono font-bold text-amber-400 text-xl -translate-x-1/2 drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]"
            aria-hidden
          >
            ^
          </span>
          <span
            className="absolute left-1/2 top-0 font-mono font-bold text-amber-400/95 text-base -translate-x-1/2 mt-3"
            style={{ transform: 'translateX(-50%)' }}
            aria-hidden
          >
            N
          </span>
        </div>
      </button>
      </div>
      {inputsSectionExpanded && (
        <div className="w-full max-w-md mt-1 rounded-xl border border-amber-400/30 bg-amber-500/5 overflow-hidden px-5 pb-5 space-y-4 pt-4 flex-shrink-0 text-[1.2em]">
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
                className="mt-1.5 w-full rounded-lg bg-black/40 border border-white/20 px-4 py-3 text-amber-300 font-mono text-base"
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
                className="mt-1.5 w-full rounded-lg bg-black/40 border border-white/20 px-4 py-3 text-amber-300 font-mono text-base"
                placeholder={isMIL ? 'e.g. 4' : 'e.g. 2'}
              />
            </label>
          </section>
          <div className="flex gap-3">
            <button
              onClick={() => { playTapSound(); onSwitchToDistance(); }}
              className="flex-1 py-3 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white font-medium text-sm"
            >
              {t('ballistic.hubDistance')}
            </button>
            <button
              disabled
              className="flex-1 py-3 rounded-lg border border-amber-400/30 bg-amber-500/10 text-amber-300 font-medium cursor-default text-sm"
            >
              {t('ballistic.hubHeight')}
            </button>
          </div>
          {hasResult ? (
            <section className="mt-4 pt-4 border-t border-white/10 space-y-1.5 max-h-[14.5rem] overflow-y-auto text-[1.2em]">
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
