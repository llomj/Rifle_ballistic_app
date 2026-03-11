import React, { useState, useMemo, useEffect } from 'react';
import { formatTranslation } from '../translations';
import { useLanguage } from '../contexts/LanguageContext';
import { useSound } from '../contexts/SoundContext';
import { useBallisticSettings } from '../contexts/BallisticSettingsContext';
import { mToYd, cmToIn } from '../utils/ballisticUnits';
import { CliSep, CliLine, CliPre, CliTable } from './CliBlock';
import { generateDistancesFromInterval, MILDOT_ANIMALS, MILDOT_STEEL_PLATES } from '../data/ballistic';
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
        <div className="px-4 pb-4 pt-0 border-t border-white/10 space-y-2 max-h-[60vh] overflow-y-auto overflow-x-hidden overscroll-contain">
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
  const [clicksExpanded, setClicksExpanded] = useState(false);
  const [mildotExpanded, setMildotExpanded] = useState(false);
  const [compensationExpanded, setCompensationExpanded] = useState(false);
  const [opticsExpanded, setOpticsExpanded] = useState(false);
  const [targetHeightsExpanded, setTargetHeightsExpanded] = useState(false);
  const [windExpanded, setWindExpanded] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMildotConfigModal, setShowMildotConfigModal] = useState(false);
  const [refMaxStr, setRefMaxStr] = useState('');
  const [refIntervalStr, setRefIntervalStr] = useState('');
  const [mildotHumanHeightStr, setMildotHumanHeightStr] = useState('');
  const { measurement, scopeUnit, clicksConfig, setClicksConfig, mildotConfig, setMildotConfig } = useBallisticSettings();

  useEffect(() => {
    if (showConfigModal) {
      setRefMaxStr(String(clicksConfig.maxM));
      setRefIntervalStr(String(clicksConfig.intervalM));
    }
  }, [showConfigModal, clicksConfig.maxM, clicksConfig.intervalM]);

  useEffect(() => {
    if (showMildotConfigModal) {
      setMildotHumanHeightStr(String(mildotConfig.humanHeightM));
    }
  }, [showMildotConfigModal, mildotConfig.humanHeightM]);
  const { turretTable, compensationTable } = useTrajectoryTables();

  const mildotAnimal = useMemo(
    () => MILDOT_ANIMALS.find((a) => a.id === mildotConfig.animalId) ?? MILDOT_ANIMALS[0],
    [mildotConfig.animalId]
  );
  const mildotHeader = useMemo(
    () => [
      t('ballistic.mildotTableDistance'),
      `${t(mildotAnimal.nameKey)} (${t('ballistic.mils').toLowerCase()})`,
      t('ballistic.mildotTableMan'),
      t('ballistic.mildotTableSteel'),
    ],
    [t, mildotAnimal.nameKey]
  );
  const mildotDistances = useMemo(
    () => generateDistancesFromInterval(clicksConfig.minM, clicksConfig.maxM, clicksConfig.intervalM),
    [clicksConfig.minM, clicksConfig.maxM, clicksConfig.intervalM]
  );
  const mildotRows = useMemo(
    () =>
      mildotDistances.map((d) => {
        const animalMils = d > 0 ? Math.round((mildotAnimal.heightM * 1000 / d) * 100) / 100 : 0;
        const humanMils = d > 0 ? Math.round((mildotConfig.humanHeightM * 1000 / d) * 100) / 100 : 0;
        const steelMils = d > 0 ? Math.round((mildotConfig.plateHeightM * 1000 / d) * 100) / 100 : 0;
        return [
          measurement === 'imperial' ? `${Math.round(mToYd(d))} yd` : `${d} m`,
          String(animalMils),
          String(humanMils),
          String(steelMils),
        ];
      }),
    [mildotDistances, measurement, mildotAnimal.heightM, mildotConfig.humanHeightM, mildotConfig.plateHeightM]
  );

  /** Holdover in mrad or MOA from drop and distance (same formula as turret table). */
  const getHoldoverStr = (dropCm: number, distanceM: number): string => {
    if (distanceM <= 0) return '—';
    const dropM = dropCm / 100;
    const mrad = dropM / (distanceM / 1000);
    const mradRounded = Math.round(mrad * 100) / 100;
    const moa = mradRounded * (180 / Math.PI) * (60 / 1000);
    const value = scopeUnit === 'MOA' ? moa : mradRounded;
    return `-${value.toFixed(2)}`;
  };

  const compensationLines = useMemo(
    () =>
      compensationTable.map((row) => {
        const distStr =
          measurement === 'imperial'
            ? `${Math.round(mToYd(row.distance))} yd`
            : `${row.distance} m`;
        const dropStr =
          measurement === 'imperial'
            ? `${cmToIn(row.cm).toFixed(1)} in`
            : `${row.cm} cm`;
        const holdover = getHoldoverStr(row.cm, row.distance);
        return `${distStr.padEnd(8)}  ${dropStr.padEnd(10)}  ${holdover} ${scopeUnit === 'MOA' ? 'MOA' : 'mrad'}`;
      }),
    [compensationTable, measurement, scopeUnit]
  );

  const clicksHeader = useMemo(
    () => [
      t('ballistic.clicksHeaderDistance'),
      t('ballistic.clicksHeaderDrop'),
      scopeUnit === 'MOA' ? t('ballistic.clicksHeaderMoa') : t('ballistic.clicksHeaderMrad'),
      t('ballistic.clicksHeaderClicks'),
    ],
    [t, scopeUnit]
  );

  const clicksRows = useMemo(
    () =>
      turretTable.map((r) => {
        const dist = measurement === 'imperial' ? `${Math.round(mToYd(r.distanceMin))} yd` : `${r.distanceMin}m`;
        const drop = measurement === 'imperial'
          ? `${(cmToIn(parseFloat(String(r.dropCm).replace(/[^\d.-]/g, '')) || 0)).toFixed(1)} in`
          : r.dropCm;
        return [dist, drop, r.mrad, r.clicks];
      }),
    [turretTable, measurement]
  );

  const compensationHeader = useMemo(
    () => [
      t('ballistic.compHeaderDistance'),
      t('ballistic.compHeaderDrop'),
      scopeUnit === 'MOA' ? t('ballistic.clicksHeaderMoa') : t('ballistic.clicksHeaderMrad'),
    ],
    [t, scopeUnit]
  );
  const compensationRows = useMemo(
    () =>
      compensationTable.map((row) => [
        measurement === 'imperial' ? `${Math.round(mToYd(row.distance))} yd` : `${row.distance} m`,
        measurement === 'imperial' ? `${cmToIn(row.cm).toFixed(1)} in` : `${row.cm} cm`,
        getHoldoverStr(row.cm, row.distance),
      ]),
    [compensationTable, measurement, scopeUnit]
  );

  const opticsHeader = useMemo(
    () => [
      t('ballistic.opticsHeaderDistanceM'),
      t('ballistic.opticsHeaderCm'),
      t('ballistic.opticsHeaderDistanceYd'),
      t('ballistic.opticsHeaderIn'),
    ],
    [t]
  );
  const opticsRows = useMemo(() => {
    // 10x optics rule of thumb: 100m = 10cm, 100y = 3.6"
    return mildotDistances.map((d) => {
      const yd = Math.round(mToYd(d));
      const cm = Math.round((d / 10) * 10) / 10;
      const inch = Math.round(((yd * 3.6) / 100) * 10) / 10;
      return [`${d} m`, `${cm} cm`, `${yd} y`, `${inch} in`];
    });
  }, [mildotDistances]);

  return (
    <div className="space-y-3 animate-in fade-in duration-300 pb-8">
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
        title={t('ballistic.clicksSection')}
        expanded={clicksExpanded}
        onToggle={() => { playTapSound(); setClicksExpanded((e) => !e); }}
        onTitleClick={() => { playTapSound(); setShowConfigModal(true); }}
      >
        <CliLine role="yellow">{t('ballistic.tableConfig')}</CliLine>
        <CliLine role="white">{`${t('ballistic.clicksMaxM')}: ${clicksConfig.maxM}m`}</CliLine>
        <CliLine role="white">{`${t('ballistic.clicksIntervalM')}: ${clicksConfig.intervalM}m`}</CliLine>
        <CliSep />
        <CliTable
          header={clicksHeader}
          columnRoles={['amber', 'amber', 'white', 'white']}
          headerRoles={['amber', 'amber', 'white', 'white']}
          rows={clicksRows}
          colWidths={['7rem', '7rem', '7rem', '8rem']}
        />
      </CollapsiblePanel>

      <CollapsiblePanel
        title={t('ballistic.mildotReference')}
        expanded={mildotExpanded}
        onToggle={() => { playTapSound(); setMildotExpanded((e) => !e); }}
        onTitleClick={() => { playTapSound(); setShowMildotConfigModal(true); }}
      >
        <CliLine role="yellow">{formatTranslation(t('ballistic.mildotShoulderNote'), { animal: t(mildotAnimal.nameKey), animalM: mildotAnimal.heightM, humanM: mildotConfig.humanHeightM.toFixed(2) })}</CliLine>
        <CliLine role="yellow">{t('ballistic.mildot10xNote')}</CliLine>
        <CliTable
          columnRoles={['sky', 'white', 'white', 'white']}
          rows={mildotRows}
          header={mildotHeader}
          colWidths={['7rem', '8rem', '8rem', '8rem']}
        />
      </CollapsiblePanel>

      <CollapsiblePanel
        title={t('ballistic.panelCompensation')}
        expanded={compensationExpanded}
        onToggle={() => { playTapSound(); setCompensationExpanded((e) => !e); }}
        onTitleClick={() => { playTapSound(); setShowConfigModal(true); }}
      >
        <CliLine role="yellow">{t('ballistic.tenPer1000Comp')}</CliLine>
        <CliLine role="white" wrap>{t('ballistic.compProfileNote')}</CliLine>
        <CliSep />
        <CliTable
          header={compensationHeader}
          columnRoles={['sky', 'amber', 'white']}
          headerRoles={['sky', 'amber', 'white']}
          rows={compensationRows}
          colWidths={['7rem', '7rem', '7rem']}
        />
        <CliSep />
        <CliPre lines={compensationLines} />
      </CollapsiblePanel>

      <CollapsiblePanel
        title={t('ballistic.panelOptics')}
        expanded={opticsExpanded}
        onToggle={() => { playTapSound(); setOpticsExpanded((e) => !e); }}
        onTitleClick={() => { playTapSound(); setShowConfigModal(true); }}
      >
        <CliLine role="yellow">{t('ballistic.optics10x')}</CliLine>
        <CliTable
          header={opticsHeader}
          columnRoles={['amber', 'amber', 'amber', 'amber']}
          headerRoles={['amber', 'amber', 'amber', 'amber']}
          rows={opticsRows}
          colWidths={['7rem', '7rem', '7rem', '7rem']}
        />
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
        className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-base font-semibold"
      >
        {t('ballistic.backToMain')}
      </button>

      {showConfigModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 animate-in fade-in duration-200 pt-[10vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="table-config-title"
          onClick={() => { playTapSound(); setShowConfigModal(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 p-4 pb-safe animate-in slide-in-from-top duration-300 bg-slate-950/[0.009] backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[70vh] overflow-y-auto overscroll-contain">
              <h2 id="table-config-title" className="text-theme-accent font-medium mb-3">
                {t('ballistic.tableConfig')}
              </h2>
              <p className="text-xs text-slate-500 mb-4">{t('ballistic.configAffectsTurretMildotComp')}</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">
                    {t('ballistic.maxMeters')}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={refMaxStr}
                    onChange={(e) => setRefMaxStr(e.target.value)}
                    onBlur={() => {
                      const v = parseFloat(refMaxStr);
                      if (Number.isFinite(v)) {
                        const clamped = Math.max(1, Math.min(10000, v));
                        setClicksConfig({ maxM: clamped });
                        setRefMaxStr(String(clamped));
                      } else {
                        setRefMaxStr(String(clicksConfig.maxM));
                      }
                    }}
                    className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2.5 text-theme-accent font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">
                    {t('ballistic.incrementMeters')}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={refIntervalStr}
                    onChange={(e) => setRefIntervalStr(e.target.value)}
                    onBlur={() => {
                      const v = parseFloat(refIntervalStr);
                      if (Number.isFinite(v) && v >= 1) {
                        const clamped = Math.max(1, Math.min(5000, v));
                        setClicksConfig({ intervalM: clamped });
                        setRefIntervalStr(String(clamped));
                      } else {
                        setRefIntervalStr(String(clicksConfig.intervalM));
                      }
                    }}
                    className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2.5 text-theme-accent font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMildotConfigModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 animate-in fade-in duration-200 pt-[10vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mildot-config-title"
          onClick={() => { playTapSound(); setShowMildotConfigModal(false); }}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 p-4 pb-safe animate-in slide-in-from-top duration-300 bg-slate-950/[0.009] backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[70vh] overflow-y-auto overscroll-contain">
              <h2 id="mildot-config-title" className="text-theme-accent font-medium mb-3">
                {t('ballistic.mildotConfigTitle')}
              </h2>
              <p className="text-xs text-slate-500 mb-4">{t('ballistic.mildotConfigDesc')}</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">
                    {t('ballistic.mildotSelectAnimal')}
                  </label>
                  <select
                    value={mildotConfig.animalId}
                    onChange={(e) => setMildotConfig({ animalId: e.target.value })}
                    className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2.5 text-theme-accent font-mono text-sm"
                  >
                    {MILDOT_ANIMALS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {t(a.nameKey)} — {a.heightM} m {t('ballistic.mildotShoulderToFeet')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">
                    {t('ballistic.mildotHumanShoulderHeight')}
                  </label>
                  <div className="flex gap-2 mb-2">
                    {(['small', 'average', 'tall'] as const).map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          const value =
                            preset === 'small' ? 1.3 :
                            preset === 'tall' ? 1.6 :
                            1.4;
                          setMildotConfig({ humanPreset: preset, humanHeightM: value });
                          setMildotHumanHeightStr(String(value));
                        }}
                        className={`flex-1 rounded-lg border px-2 py-1 text-xs font-mono ${
                          mildotConfig.humanPreset === preset
                            ? 'border-theme-accent text-theme-accent bg-white/5'
                            : 'border-white/15 text-slate-400'
                        }`}
                      >
                        {preset === 'small' && t('ballistic.mildotHumanSmall')}
                        {preset === 'average' && t('ballistic.mildotHumanAverage')}
                        {preset === 'tall' && t('ballistic.mildotHumanTall')}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={mildotHumanHeightStr}
                    onChange={(e) => setMildotHumanHeightStr(e.target.value)}
                    onBlur={() => {
                      const v = parseFloat(mildotHumanHeightStr);
                      if (Number.isFinite(v)) {
                        const clamped = Math.max(0.2, Math.min(2.5, v));
                        const preset =
                          Math.abs(clamped - 1.3) < 0.01 ? 'small' as const :
                          Math.abs(clamped - 1.4) < 0.01 ? 'average' as const :
                          Math.abs(clamped - 1.6) < 0.01 ? 'tall' as const :
                          'custom' as const;
                        setMildotConfig({ humanHeightM: clamped, humanPreset: preset });
                        setMildotHumanHeightStr(String(clamped));
                      } else {
                        setMildotHumanHeightStr(String(mildotConfig.humanHeightM));
                      }
                    }}
                    className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2.5 text-theme-accent font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">{t('ballistic.mildotHumanShoulderNote')}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">
                    {t('ballistic.mildotSteelSection')}
                  </label>
                  <select
                    value={mildotConfig.plateId}
                    onChange={(e) => {
                      const plate = MILDOT_STEEL_PLATES.find((p) => p.id === e.target.value) ?? MILDOT_STEEL_PLATES[0];
                      setMildotConfig({ plateId: plate.id, plateHeightM: plate.heightM });
                    }}
                    className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2.5 text-theme-accent font-mono text-sm mb-2"
                  >
                    {MILDOT_STEEL_PLATES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {t(p.labelKey)} — {p.heightM} m
                      </option>
                    ))}
                  </select>
                  <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">
                    {t('ballistic.mildotSteelCustomHeight')}
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={String(mildotConfig.plateHeightM)}
                    onChange={(e) => {
                      const raw = e.target.value;
                      const v = parseFloat(raw);
                      if (Number.isFinite(v)) {
                        setMildotConfig({ plateHeightM: v });
                      }
                    }}
                    className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2.5 text-theme-accent font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">{t('ballistic.mildotSteelNote')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
