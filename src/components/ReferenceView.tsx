import React, { useState, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSound } from '../contexts/SoundContext';
import { useBallisticSettings } from '../contexts/BallisticSettingsContext';
import { CLICKS_INTERVAL_PRESETS } from '../contexts/BallisticSettingsContext';
import { mToYd, cmToIn } from '../utils/ballisticUnits';
import { CliSep, CliLine, CliPre, CliTable } from './CliBlock';
import { generateDistancesFromInterval } from '../data/ballistic';
import { OPTICS_10X } from '../data/ballistic';
import { useTrajectoryTables } from '../hooks/useTrajectoryTables';
import { RifleScopeSection } from './RifleScopeSection';

interface ReferenceViewProps {
  onBack: () => void;
}

function CollapsiblePanel({
  title,
  expanded,
  onToggle,
  onTitleClick,
  children,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  /** When provided, clicking title opens config; chevron still toggles. */
  onTitleClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onTitleClick ?? onToggle}
          className="flex-1 text-left text-slate-300 hover:bg-white/5 hover:text-white transition-colors -mx-4 -my-3 px-4 py-3 rounded-lg"
        >
          <span className="text-sm font-medium text-white">{title}</span>
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={expanded ? 'Collapse' : 'Expand'}
          className="shrink-0 p-1 text-slate-400 hover:text-white transition-colors"
        >
          <i className={`fas fa-chevron-down text-xs transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-white/10 space-y-2 max-h-[60vh] overflow-y-auto overscroll-contain">
          {children}
        </div>
      )}
    </section>
  );
}

export const ReferenceView: React.FC<ReferenceViewProps> = ({ onBack }) => {
  const { t } = useLanguage();
  const { playTapSound } = useSound();
  const [rifleExpanded, setRifleExpanded] = useState(false);
  const [turretExpanded, setTurretExpanded] = useState(false);
  const [mildotExpanded, setMildotExpanded] = useState(false);
  const [compensationExpanded, setCompensationExpanded] = useState(false);
  const [opticsExpanded, setOpticsExpanded] = useState(false);
  const [targetHeightsExpanded, setTargetHeightsExpanded] = useState(false);
  const [windExpanded, setWindExpanded] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const { measurement, clicksConfig, setClicksConfig } = useBallisticSettings();
  const { turretTable, compensationTable } = useTrajectoryTables();

  const turretLines = useMemo(
    () =>
      turretTable.map((r) => {
        const dist = measurement === 'imperial' ? `${Math.round(mToYd(r.distanceMin))} yd` : `${r.distanceMin}m`;
        const drop = measurement === 'imperial'
          ? `${(cmToIn(parseFloat(String(r.dropCm).replace(/[^\d.-]/g, '')) || 0)).toFixed(1)} in`
          : r.dropCm;
        return `${dist.padEnd(6)}    ${drop.padEnd(6)}   ${r.mrad.padEnd(6)}    ${r.clicks}`;
      }),
    [turretTable, measurement]
  );

  const mildotHeader = useMemo(
    () => [t('ballistic.mildotTableDistance'), t('ballistic.mildotTableDeer'), t('ballistic.mildotTableMan')],
    [t]
  );
  const mildotDistances = useMemo(
    () => generateDistancesFromInterval(clicksConfig.minM, clicksConfig.maxM, clicksConfig.intervalM),
    [clicksConfig.minM, clicksConfig.maxM, clicksConfig.intervalM]
  );
  const mildotRows = useMemo(
    () =>
      mildotDistances.map((d) => {
        const deerMils = d > 0 ? Math.round((1000 / d) * 100) / 100 : 0;
        const manMils = d > 0 ? Math.round((1750 / d) * 100) / 100 : 0;
        return [
          measurement === 'imperial' ? `${Math.round(mToYd(d))} yd` : `${d} m`,
          String(deerMils),
          String(manMils),
        ];
      }),
    [mildotDistances, measurement]
  );

  const compensationLines = useMemo(
    () =>
      compensationTable.map((row) =>
        measurement === 'imperial'
          ? `${`mils: ${row.mils}`.padEnd(14)}  ${`${Math.round(mToYd(row.distance))} yards =`.padEnd(14)}  ${(cmToIn(row.cm)).toFixed(1)} in`
          : `${`mils: ${row.mils}`.padEnd(14)}  ${`${row.distance} meters =`.padEnd(14)}  ${row.cm}cm`
      ),
    [compensationTable, measurement]
  );

  const opticsLines = useMemo(
    () => [
      t('ballistic.optics10x'),
      ...OPTICS_10X.map(
        (row) =>
          `${(`${row.yd}y`).padEnd(6)}  ${row.inch.padEnd(12)}  ${(`${row.m}m`).padEnd(6)}  ${row.cm}`
      ),
    ],
    [t]
  );

  return (
    <div className="space-y-3 animate-in fade-in duration-300 pb-8">
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <button
          onClick={() => {
            playTapSound();
            onBack();
          }}
          className="flex items-center gap-2 text-slate-400 hover:text-white"
        >
          <i className="fas fa-arrow-left" />
          <span className="text-sm font-medium">{t('ballistic.backToHub')}</span>
        </button>
      </div>

      <CliLine role="yellow">{t('ballistic.referenceTitle')}</CliLine>
      <CliLine role="yellow">{t('ballistic.goodFor')}</CliLine>
      <CliSep />

      <CollapsiblePanel
        title={t('ballistic.rifleAndScope')}
        expanded={rifleExpanded}
        onToggle={() => { playTapSound(); setRifleExpanded((e) => !e); }}
      >
        <RifleScopeSection editable={false} />
      </CollapsiblePanel>

      <CollapsiblePanel
        title={t('ballistic.panelTurret')}
        expanded={turretExpanded}
        onToggle={() => { playTapSound(); setTurretExpanded((e) => !e); }}
        onTitleClick={() => { playTapSound(); setShowConfigModal(true); }}
      >
        <CliLine role="yellow">{t('ballistic.milliradianNote')}</CliLine>
        <CliPre lines={turretLines} />
      </CollapsiblePanel>

      <CollapsiblePanel
        title={t('ballistic.mildotReference')}
        expanded={mildotExpanded}
        onToggle={() => { playTapSound(); setMildotExpanded((e) => !e); }}
        onTitleClick={() => { playTapSound(); setShowConfigModal(true); }}
      >
        <CliLine role="yellow">{t('ballistic.deerShoulderNote')}</CliLine>
        <CliLine role="yellow">{t('ballistic.mildot10xNote')}</CliLine>
        <CliTable
          columnRoles={['sky', 'white', 'white']}
          rows={mildotRows}
          header={mildotHeader}
          colWidths={['8rem', '10rem', '10rem']}
        />
      </CollapsiblePanel>

      <CollapsiblePanel
        title={t('ballistic.panelCompensation')}
        expanded={compensationExpanded}
        onToggle={() => { playTapSound(); setCompensationExpanded((e) => !e); }}
        onTitleClick={() => { playTapSound(); setShowConfigModal(true); }}
      >
        <CliLine role="yellow">{t('ballistic.tenPer1000Comp')}</CliLine>
        <CliPre lines={compensationLines} />
      </CollapsiblePanel>

      <CollapsiblePanel
        title={t('ballistic.panelOptics')}
        expanded={opticsExpanded}
        onToggle={() => { playTapSound(); setOpticsExpanded((e) => !e); }}
      >
        <CliLine role="yellow">{t('ballistic.optics10x')}</CliLine>
        <CliPre lines={opticsLines.slice(1)} />
      </CollapsiblePanel>

      <CollapsiblePanel
        title={t('ballistic.panelTargetHeights')}
        expanded={targetHeightsExpanded}
        onToggle={() => { playTapSound(); setTargetHeightsExpanded((e) => !e); }}
      >
        <CliLine role="yellow">{t('ballistic.targetHeightsNote')}</CliLine>
      </CollapsiblePanel>

      <CollapsiblePanel
        title={t('ballistic.panelWind')}
        expanded={windExpanded}
        onToggle={() => { playTapSound(); setWindExpanded((e) => !e); }}
      >
        <CliLine role="yellow">{t('ballistic.windMirageCalc')}</CliLine>
        <CliLine role="white">{`${'22 ' + t('ballistic.degreesAngle')}`.padEnd(22)}  4 kph</CliLine>
        <CliLine role="white">{`${'45 ' + t('ballistic.degreesAngle')}`.padEnd(22)}  8 kph</CliLine>
        <CliLine role="white">{`${'90 ' + t('ballistic.degreesAngle')}`.padEnd(22)}  16 kph</CliLine>
      </CollapsiblePanel>

      <button
        onClick={() => {
          playTapSound();
          onBack();
        }}
        className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-sm"
      >
        {t('ballistic.backToHub')}
      </button>

      {showConfigModal && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="table-config-title"
          onClick={() => { playTapSound(); setShowConfigModal(false); }}
        >
          <div
            className="w-full max-w-lg rounded-t-2xl bg-zinc-900 border-t border-white/10 p-4 pb-safe animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="table-config-title" className="text-amber-400 font-medium mb-3">
              {t('ballistic.tableConfig')}
            </h2>
            <p className="text-xs text-slate-500 mb-4">{t('ballistic.configAffectsTurretMildotComp')}</p>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">
                  {t('ballistic.maxMeters')}
                </label>
                <input
                  type="number"
                  min={400}
                  max={1500}
                  step={50}
                  value={clicksConfig.maxM}
                  onChange={(e) => {
                    const v = Math.round(parseFloat(e.target.value) || 800);
                    setClicksConfig({ maxM: Math.max(400, Math.min(1500, v)) });
                  }}
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2.5 text-amber-300 font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">
                  {t('ballistic.incrementMeters')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {CLICKS_INTERVAL_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        playTapSound();
                        setClicksConfig({ intervalM: preset });
                      }}
                      className={`px-3 py-2 rounded-lg border text-sm font-mono transition-colors ${
                        clicksConfig.intervalM === preset
                          ? 'border-amber-400/50 bg-amber-500/10 text-amber-300'
                          : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                playTapSound();
                setShowConfigModal(false);
              }}
              className="mt-4 w-full py-3 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 font-medium"
            >
              {t('ballistic.configDone')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
