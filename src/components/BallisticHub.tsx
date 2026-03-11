import React, { useState, useMemo, useEffect } from 'react';
import { useSound } from '../contexts/SoundContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBallisticProfile } from '../contexts/BallisticProfileContext';
import { useBallisticSettings } from '../contexts/BallisticSettingsContext';
import { ydToM, mToYd, cmToIn } from '../utils/ballisticUnits';
import { RifleScopeSection } from './RifleScopeSection';
import { SearchCombobox } from './SearchCombobox';
import { CliLine, CliSep, CliTable } from './CliBlock';
import { useTrajectoryTables } from '../hooks/useTrajectoryTables';
import { getUniqueCalibers, getBulletById, searchCalibers } from '../data/catalogs';
import type { CaliberOption } from '../data/catalogs';
import { DEFAULT_BALLISTIC_PROFILE } from '../data/ballistic';

export type BallisticView = 'distance' | 'height';

export type BallisticTab = 'rifles' | 'ballistics' | 'targets' | 'environment';

interface BallisticHubProps {
  /** Open the ballistic selection (trajectory table, etc.). */
  onOpenBallistics: () => void;
  /** Return to First Page (clicks circle). */
  onBackToFirstPage: () => void;
}

/** Profile page: user name, full ballistic setup (RifleScopeSection), Ballistics button, Save. */
export const BallisticHub: React.FC<BallisticHubProps> = ({
  onOpenBallistics,
  onBackToFirstPage,
}) => {
  const { playTapSound } = useSound();
  const { t } = useLanguage();
  const { currentProfile, savedProfiles, updateCurrentProfile, saveCurrent, addNewProfile, loadProfile } = useBallisticProfile();
  const { scopeUnit, setScopeUnit, measurement, setMeasurement, clicksConfig, setClicksConfig } = useBallisticSettings();
  const { turretTable } = useTrajectoryTables();
  const [setupExpanded, setSetupExpanded] = useState(false);
  const [targetsExpanded, setTargetsExpanded] = useState(false);
  const [turretTableExpanded, setTurretTableExpanded] = useState(false);
  const [ammunitionExpanded, setAmmunitionExpanded] = useState(false);
  const [filterCaliberKey, setFilterCaliberKey] = useState<string | null>(null);
  const [turretMinStr, setTurretMinStr] = useState('');
  const [turretMaxStr, setTurretMaxStr] = useState('');
  const [turretIntervalStr, setTurretIntervalStr] = useState('');

  useEffect(() => {
    if (turretTableExpanded) {
      setTurretMinStr(String(clicksConfig.minM));
      setTurretMaxStr(String(clicksConfig.maxM));
      setTurretIntervalStr(String(clicksConfig.intervalM));
    }
  }, [turretTableExpanded, clicksConfig.minM, clicksConfig.maxM, clicksConfig.intervalM]);

  const bullet = useMemo(() => getBulletById(currentProfile.bulletId), [currentProfile.bulletId]);
  const caliberOptions = useMemo(() => getUniqueCalibers(), []);
  const selectedCaliberKey = filterCaliberKey ?? bullet?.caliberKey ?? (caliberOptions[0]?.caliberKey ?? '');

  const handleSave = () => {
    playTapSound();
    saveCurrent();
  };

  return (
    <div className="max-w-lg mx-auto pb-48">
      {/* Profiles: Default + saved — switch between them */}
      <section className="mb-6 rounded-xl border border-white/10 bg-white/5 overflow-hidden px-4 py-3">
        <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">{t('ballistic.profiles')}</label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { playTapSound(); loadProfile('default'); }}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              currentProfile.id === 'default'
                ? 'border-theme-accent-50 bg-theme-accent-10 text-theme-accent'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
            }`}
          >
            {DEFAULT_BALLISTIC_PROFILE.userName}
          </button>
          {savedProfiles.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { playTapSound(); loadProfile(p.id); }}
              className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                currentProfile.id === p.id
                  ? 'border-theme-accent-50 bg-theme-accent-10 text-theme-accent'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
              }`}
            >
              {p.userName}
            </button>
          ))}
          <button
            type="button"
            onClick={() => { playTapSound(); addNewProfile(); }}
            className="px-3 py-2 rounded-lg border border-dashed border-theme-accent-50 text-theme-accent-90 text-sm font-medium hover:bg-theme-accent-10 hover:border-theme-accent-70 transition-colors"
          >
            <i className="fas fa-plus mr-1.5" />
            {t('ballistic.addProfile')}
          </button>
        </div>
      </section>

      {/* User name */}
      <section className="mb-6 rounded-xl border border-white/10 bg-white/5 overflow-hidden px-4 py-3">
        <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">{t('ballistic.userName')}</label>
        <input
          type="text"
          value={currentProfile.userName}
          onChange={(e) => updateCurrentProfile({ userName: e.target.value })}
          placeholder={t('ballistic.userNamePlaceholder')}
          className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2.5 text-slate-200 placeholder-slate-500 text-sm"
        />
      </section>

      {/* Scope unit + Measurement — MIL/MOA on top, Metric/Imperial underneath */}
      <section className="mb-6 rounded-xl border border-white/10 bg-white/5 overflow-hidden px-4 py-3 space-y-3">
        <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { playTapSound(); setScopeUnit('MIL'); }}
              className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${
                scopeUnit === 'MIL'
                  ? 'border-theme-accent-50 bg-theme-accent-10 text-theme-accent'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
              }`}
            >
              {t('ballistic.scopeUnitMIL')}
            </button>
            <button
              type="button"
              onClick={() => { playTapSound(); setScopeUnit('MOA'); }}
              className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${
                scopeUnit === 'MOA'
                  ? 'border-theme-accent-50 bg-theme-accent-10 text-theme-accent'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
              }`}
            >
              {t('ballistic.scopeUnitMOA')}
            </button>
        </div>
        <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { playTapSound(); setMeasurement('metric'); }}
              className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${
                measurement === 'metric'
                  ? 'border-theme-accent-50 bg-theme-accent-10 text-theme-accent'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
              }`}
            >
              {t('ballistic.measurementMetric')}
            </button>
            <button
              type="button"
              onClick={() => { playTapSound(); setMeasurement('imperial'); }}
              className={`flex-1 py-2 px-2 rounded-lg border text-xs font-medium transition-colors ${
                measurement === 'imperial'
                  ? 'border-theme-accent-50 bg-theme-accent-10 text-theme-accent'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
              }`}
            >
              {t('ballistic.measurementImperial')}
            </button>
        </div>
      </section>

      {/* Targets — zero distance: drives drop, holdover, clicks, compensation. Under MIL/MOA, Metric/Imperial. */}
      <section className="mb-6 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <button
          type="button"
          onClick={() => { playTapSound(); setTargetsExpanded((e) => !e); }}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <span className="text-sm font-medium text-white">{t('ballistic.tabTargets')}</span>
          <i className={`fas fa-chevron-down text-xs transition-transform ${targetsExpanded ? 'rotate-180' : ''}`} />
        </button>
        {targetsExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-white/10 space-y-3">
            <p className="text-xs text-slate-500">{t('ballistic.zeroDistanceNote')}</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                inputMode="decimal"
                value={
                  measurement === 'imperial'
                    ? Math.round(mToYd(currentProfile.zeroDistanceM ?? 100))
                    : (currentProfile.zeroDistanceM ?? 100)
                }
                onChange={(e) => {
                  const raw = parseFloat(e.target.value) || 0;
                  const m = measurement === 'imperial' ? ydToM(raw) : raw;
                  updateCurrentProfile({ zeroDistanceM: Math.max(1, Math.min(2000, m)) });
                }}
                className="w-24 rounded-lg bg-black/40 border border-white/20 px-3 py-2.5 text-theme-accent font-mono text-sm"
              />
              <span className="text-slate-500 text-sm">{measurement === 'imperial' ? 'yd' : 'm'}</span>
            </div>
          </div>
        )}
      </section>

      {/* Turret table — foldable panel with config and distance|drop|mrad|clicks table */}
      <section className="mb-6 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <button
          type="button"
          onClick={() => { playTapSound(); setTurretTableExpanded((e) => !e); }}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <span className="text-sm font-medium text-white">{t('ballistic.panelTurret')}</span>
          <i className={`fas fa-chevron-down text-xs transition-transform ${turretTableExpanded ? 'rotate-180' : ''}`} />
        </button>
        {turretTableExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-white/10 space-y-3 max-h-[60vh] overflow-y-auto overscroll-contain">
            <p className="text-xs text-slate-500">{t('ballistic.configAffectsTurretMildotComp')}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">{t('ballistic.clicksMinM')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={turretMinStr}
                  onChange={(e) => setTurretMinStr(e.target.value)}
                  onBlur={() => {
                    const v = parseFloat(turretMinStr);
                    if (Number.isFinite(v)) {
                      const clamped = Math.max(0, Math.min(10000, v));
                      setClicksConfig({ minM: clamped });
                      setTurretMinStr(String(clamped));
                    } else {
                      setTurretMinStr(String(clicksConfig.minM));
                    }
                  }}
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-theme-accent font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 uppercase tracking-wider block mb-1">{t('ballistic.maxMeters')}</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={turretMaxStr}
                  onChange={(e) => setTurretMaxStr(e.target.value)}
                  onBlur={() => {
                    const v = parseFloat(turretMaxStr);
                    if (Number.isFinite(v)) {
                      const clamped = Math.max(1, Math.min(10000, v));
                      setClicksConfig({ maxM: clamped });
                      setTurretMaxStr(String(clamped));
                    } else {
                      setTurretMaxStr(String(clicksConfig.maxM));
                    }
                  }}
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-theme-accent font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">{t('ballistic.incrementMeters')}</label>
              <input
                type="text"
                inputMode="decimal"
                value={turretIntervalStr}
                onChange={(e) => setTurretIntervalStr(e.target.value)}
                onBlur={() => {
                  const v = parseFloat(turretIntervalStr);
                  if (Number.isFinite(v) && v >= 1) {
                    const clamped = Math.max(1, Math.min(5000, v));
                    setClicksConfig({ intervalM: clamped });
                    setTurretIntervalStr(String(clamped));
                  } else {
                    setTurretIntervalStr(String(clicksConfig.intervalM));
                  }
                }}
                className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-theme-accent font-mono text-sm"
              />
            </div>
            <CliSep />
            <CliTable
              header={[
                t('ballistic.clicksHeaderDistance'),
                t('ballistic.clicksHeaderDrop'),
                scopeUnit === 'MOA' ? t('ballistic.clicksHeaderMoa') : t('ballistic.clicksHeaderMrad'),
                t('ballistic.clicksHeaderClicks'),
              ]}
              columnRoles={['amber', 'amber', 'white', 'cyan']}
              headerRoles={['amber', 'amber', 'white', 'cyan']}
              rows={turretTable.map((r) => {
                const dist = measurement === 'imperial' ? `${Math.round(mToYd(r.distanceMin))} yd` : `${r.distanceMin}m`;
                const drop = measurement === 'imperial'
                  ? `${(cmToIn(parseFloat(String(r.dropCm).replace(/[^\d.-]/g, '')) || 0)).toFixed(1)} in`
                  : r.dropCm;
                return [dist, drop, r.mrad, r.clicks];
              })}
              colWidths={['7rem', '7rem', '7rem', '8rem']}
            />
          </div>
        )}
      </section>

      {/* Ammunition — bullet type & bullet gram, auto-populates Rifle Profile */}
      <section className="mb-6 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <button
          type="button"
          onClick={() => { playTapSound(); setAmmunitionExpanded((e) => !e); }}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <span className="text-sm font-medium text-white">{t('ballistic.ammunition')}</span>
          <i className={`fas fa-chevron-down text-xs transition-transform ${ammunitionExpanded ? 'rotate-180' : ''}`} />
        </button>
        {ammunitionExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-white/10 space-y-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 uppercase tracking-wider">{t('ballistic.bulletType')}</label>
              <SearchCombobox<CaliberOption>
                items={caliberOptions}
                getItemId={(c) => c.caliberKey}
                getItemLabel={(c) => c.caliber}
                value={selectedCaliberKey || null}
                onSelect={(c) => {
                  if (c) {
                    setFilterCaliberKey(c.caliberKey);
                    playTapSound();
                  }
                }}
                search={searchCalibers}
                placeholder={t('ballistic.bulletType')}
                getLabelForId={(id) => caliberOptions.find((c) => c.caliberKey === id)?.caliber ?? id}
                className="w-full"
                inputClassName="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2.5 text-theme-accent font-mono text-sm min-w-0"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 uppercase tracking-wider">{t('ballistic.bulletGram')}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  value={currentProfile.bulletGram ?? ''}
                  onChange={(e) =>
                    updateCurrentProfile({
                      bulletGram: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="e.g. 180"
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2.5 text-theme-accent font-mono text-sm min-w-0"
                />
                <span className="text-slate-500 shrink-0">g</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Full ballistic setup — collapsible */}
      <section className="mb-6 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <button
          type="button"
          onClick={() => { playTapSound(); setSetupExpanded((e) => !e); }}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <span className="text-sm font-medium">{t('ballistic.rifleProfile')}</span>
          <i className={`fas fa-chevron-down text-xs transition-transform ${setupExpanded ? 'rotate-180' : ''}`} />
        </button>
        {setupExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-white/10">
            <RifleScopeSection editable showSaveAs />
          </div>
        )}
      </section>

      {/* Ballistics — opens ballistic section (DistanceView); green, always visible */}
      <section className="mb-6 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <button
          type="button"
          onClick={() => {
            onOpenBallistics();
            playTapSound();
          }}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left border border-emerald-400/30 bg-emerald-500/10 hover:bg-emerald-500/15 transition-colors cursor-pointer touch-manipulation"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpenBallistics();
              playTapSound();
            }
          }}
        >
          <span className="flex items-center gap-2 font-medium text-sm text-emerald-400">
            <i className="fas fa-chart-line" />
            {t('ballistic.ballistics')}
          </span>
          <i className="fas fa-chevron-right text-emerald-400/60 text-xs" />
        </button>
      </section>

      {/* Save — lower on screen */}
      <section className="mt-12 mb-6 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
        <button
          type="button"
          onClick={handleSave}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2 font-medium">
            <i className="fas fa-save text-theme-accent" />
            {t('ballistic.save')}
          </span>
          <i className="fas fa-chevron-right text-slate-500 text-xs" />
        </button>
      </section>

      {/* Back to Main — large bottom button */}
      <button
        type="button"
        onClick={() => { playTapSound(); onBackToFirstPage(); }}
        className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 font-mono text-base font-semibold"
      >
        {t('ballistic.backToMain')}
      </button>
    </div>
  );
};
