import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSwipeLeft } from '../hooks/useSwipeLeft';
import { useSound } from '../contexts/SoundContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBallisticSettings } from '../contexts/BallisticSettingsContext';
import { useBallisticProfile } from '../contexts/BallisticProfileContext';
import { getScopeById } from '../data/catalogs';
import { CIRCLE_SIZE_PX, CIRCLE_SLOT_HEIGHT } from '../constants/ballisticUI';

const DEG_TO_MRAD = (1000 * Math.PI) / 180;
import { mToYd, cmToIn, ftToM, mToFt, formatTurretLine } from '../utils/ballisticUnits';
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
  const { currentProfile } = useBallisticProfile();
  const { scopeUnit, measurement, compassMode, elevationEnabled, elevationData } = useBallisticSettings();
  const [heading, setHeading] = useState<number | null>(null);
  const [heightStr, setHeightStr] = useState('');
  const [valueStr, setValueStr] = useState('');
  const [inputsSectionExpanded, setInputsSectionExpanded] = useState(false);

  const { getTurretRowForDistance } = useTrajectoryTables();
  const scope = useMemo(() => getScopeById(currentProfile.scopeId), [currentProfile.scopeId]);
  const scopeUnitForFormula = scope?.unit === 'MIL' || scope?.unit === 'MOA' ? scope.unit : scopeUnit;
  const parseNum = (s: string) => parseFloat(String(s).replace(',', '.')) || 0;
  const heightRaw = useMemo(() => parseNum(heightStr), [heightStr]);
  const height = useMemo(() => (measurement === 'imperial' ? ftToM(heightRaw) : heightRaw), [heightRaw, measurement]);
  const value = useMemo(() => parseNum(valueStr), [valueStr]);
  const distance = useMemo(() => {
    if (height <= 0 || value <= 0) return null;
    return distanceFromHeight(height, value, scopeUnitForFormula);
  }, [height, value, scopeUnitForFormula]);
  const turret = useMemo(
    () => (distance != null ? getTurretRowForDistance(distance) : null),
    [distance, getTurretRowForDistance]
  );
  const result = distance != null ? Math.round(distance * 1000) / 1000 : null;
  const isMIL = scopeUnitForFormula === 'MIL';
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

  const smoothedHeading = useRef<number | null>(null);
  const lastHeadingSet = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);
  useEffect(() => {
    if (!compassMode) {
      setHeading(null);
      smoothedHeading.current = null;
      lastHeadingSet.current = null;
      return;
    }
    const SMOOTH = 0.06;
    const MIN_DEG_CHANGE = 1.5;
    const handler = (e: DeviceOrientationEvent) => {
      const a = e.alpha;
      if (a == null || Number.isNaN(a)) return;
      const raw = (a + 360) % 360;
      const prev = smoothedHeading.current;
      const next =
        prev == null
          ? raw
          : (() => {
              let diff = raw - prev;
              if (diff > 180) diff -= 360;
              if (diff < -180) diff += 360;
              return (prev + diff * SMOOTH + 360) % 360;
            })();
      smoothedHeading.current = next;
      if (rafId.current == null) {
        rafId.current = requestAnimationFrame(() => {
          rafId.current = null;
          const current = smoothedHeading.current;
          if (current == null) return;
          const last = lastHeadingSet.current;
          let delta = Math.abs(current - (last ?? current));
          if (delta > 180) delta = 360 - delta;
          if (last == null || delta >= MIN_DEG_CHANGE) {
            lastHeadingSet.current = current;
            setHeading(current);
          }
        });
      }
    };
    window.addEventListener('deviceorientation', handler);
    return () => {
      window.removeEventListener('deviceorientation', handler);
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, [compassMode]);

  const [showInfo, setShowInfo] = useState(false);
  const radius = CIRCLE_SIZE_PX / 2;

  return (
    <div className="flex flex-col items-center min-h-[calc(100dvh-200px)] px-4 font-mono text-xs touch-pan-y pb-8">
      <div
        className="flex-shrink-0 flex items-center justify-center w-full"
        style={{ height: CIRCLE_SLOT_HEIGHT }}
      >
        <button
        type="button"
        onClick={() => { playTapSound(); setInputsSectionExpanded((e) => !e); }}
        className="relative rounded-full border-2 border-theme-accent-50 bg-theme-accent-10 flex flex-col items-center justify-center shadow-lg shadow-theme-accent-10 gap-1.5 hover:bg-theme-accent-20 hover:border-theme-accent-70 active:scale-[0.98] transition-all touch-manipulation"
        style={{ width: CIRCLE_SIZE_PX, height: CIRCLE_SIZE_PX }}
        aria-label={t('ballistic.calculate')}
      >
        {/* Fixed center: calculator + Press here + chevron */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
          <i className="fas fa-calculator text-theme-accent text-3xl" />
          <span className="text-sm text-slate-500 uppercase tracking-wider mt-1.5">{t('infoCalc.pressHere')}</span>
          {compassMode && heading != null && (
            <span className="text-sm text-theme-accent-90 font-mono tabular-nums mt-2">
              {Math.round(heading * DEG_TO_MRAD)} mrad
            </span>
          )}
          {elevationEnabled && (
            <span className="text-xs text-theme-accent-80 font-mono tabular-nums mt-1">
              {elevationData.altitudeM != null
                ? measurement === 'imperial'
                  ? `${Math.round(mToFt(elevationData.altitudeM))} ft`
                  : `${Math.round(elevationData.altitudeM)} m`
                : elevationData.error
                  ? '—'
                  : '…'}
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
                backgroundColor: 'var(--theme-accent-35)',
                transform: `translate(-50%, -50%) rotate(${d}deg) translateY(-${radius}px)`,
              }}
            />
          );
        })}
        <div
          className="absolute left-1/2 top-0 w-0.5 h-4 -translate-x-1/2 rounded-b z-[5]"
          style={{ backgroundColor: 'var(--theme-accent-70)' }}
          aria-hidden
        />

        {/* Rotating dial: single north arrow ^ */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            transform: compassMode && heading != null ? `rotate(${-heading}deg)` : undefined,
            transition: compassMode ? 'transform 0.2s ease-out' : 'none',
          }}
        >
          <span
            className="absolute left-1/2 top-2 font-mono font-bold text-theme-accent text-xl -translate-x-1/2 drop-shadow-[0_0_4px_rgba(0,0,0,0.8)]"
            aria-hidden
          >
            ^
          </span>
        </div>
      </button>
      </div>
      {inputsSectionExpanded && (
        <div className="w-full max-w-md -mt-[8vh] rounded-xl border border-theme-accent-30 bg-theme-accent-5 overflow-hidden px-5 pb-5 space-y-4 pt-4 flex-shrink-0 text-[1.2em]">
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
                className="mt-1.5 w-full rounded-lg bg-black/40 border border-white/20 px-4 py-3 text-theme-accent font-mono text-base"
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
                className="mt-1.5 w-full rounded-lg bg-black/40 border border-white/20 px-4 py-3 text-theme-accent font-mono text-base"
                placeholder={isMIL ? 'e.g. 4' : 'e.g. 2'}
              />
            </label>
          </section>
          <div className="flex gap-3">
            <button
              disabled
              className="flex-1 py-3 rounded-lg border border-theme-accent-30 bg-theme-accent-10 text-theme-accent font-medium cursor-default text-sm"
            >
              {t('ballistic.hubDistance')}
            </button>
            <button
              onClick={() => { playTapSound(); onSwitchToHeight(); }}
              className="flex-1 py-3 rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white font-medium text-sm"
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
      {/* Info icon — bottom centre */}
      <div className="mt-auto pt-4 pb-2 flex justify-center w-full">
        <button
          type="button"
          onClick={() => { playTapSound(); setShowInfo(true); }}
          className="p-2 rounded-full text-slate-500 hover:text-theme-accent-80 hover:bg-white/5 transition-colors"
          aria-label={t('infoCalc.distanceTitle')}
        >
          <i className="fas fa-circle-info text-lg" />
        </button>
      </div>
      {/* Info modal — placed just under the circle so it does not obscure it */}
      {showInfo && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center px-4 bg-black/60" style={{ paddingTop: `calc(${CIRCLE_SLOT_HEIGHT} + 0.5rem)` }} onClick={() => setShowInfo(false)}>
          <div
            className="glass rounded-xl p-5 max-w-sm w-full border border-theme-accent-20 shadow-xl animate-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-theme-accent font-semibold text-sm mb-2">{t('infoCalc.distanceTitle')}</h3>
            <p className="text-slate-300 text-xs leading-relaxed mb-4">{t('infoCalc.distanceText')}</p>
            <button
              type="button"
              onClick={() => { playTapSound(); setShowInfo(false); }}
              className="w-full py-2 rounded-lg bg-theme-accent-20 text-theme-accent text-sm font-medium hover:bg-theme-accent-30 transition-colors"
            >
              {t('ballistic.configDone')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
