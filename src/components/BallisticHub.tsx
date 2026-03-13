import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSound } from '../contexts/SoundContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBallisticProfile } from '../contexts/BallisticProfileContext';
import { useBallisticSettings } from '../contexts/BallisticSettingsContext';
import { ydToM, mToYd, cmToIn } from '../utils/ballisticUnits';
import { RifleScopeSection } from './RifleScopeSection';
import { CliLine, CliSep, CliTable } from './CliBlock';
import { useTrajectoryTables } from '../hooks/useTrajectoryTables';
import { getUniqueCalibers, getBulletById, getScopeById, getRifleById, getBulletsForCaliberKey, searchBullets, searchCalibers, searchScopes, searchRifles } from '../data/catalogs';
import type { CaliberOption } from '../data/catalogs';
import { DEFAULT_BALLISTIC_PROFILE } from '../data/ballistic';

export type BallisticView = 'distance' | 'height';

export type BallisticTab = 'rifles' | 'ballistics' | 'targets';

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
  const { currentProfile, savedProfiles, updateCurrentProfile, saveCurrent, addNewProfile, loadProfile, deleteSavedProfile } = useBallisticProfile();
  const { scopeUnit, setScopeUnit, measurement, setMeasurement, clicksConfig, setClicksConfig } = useBallisticSettings();

  // When profile changes (Default or saved), show its scope unit and measurement (MIL, metric, target, etc.)
  useEffect(() => {
    const u = currentProfile.scopeUnit === 'MIL' || currentProfile.scopeUnit === 'MOA' ? currentProfile.scopeUnit : 'MIL';
    const m = currentProfile.measurement === 'metric' || currentProfile.measurement === 'imperial' ? currentProfile.measurement : 'metric';
    setScopeUnit(u);
    setMeasurement(m);
  }, [currentProfile.id, currentProfile.scopeUnit, currentProfile.measurement, setScopeUnit, setMeasurement]);
  const { turretTable } = useTrajectoryTables();
  const [setupExpanded, setSetupExpanded] = useState(false);
  const [targetsExpanded, setTargetsExpanded] = useState(false);
  const [turretTableExpanded, setTurretTableExpanded] = useState(false);
  const [ammunitionExpanded, setAmmunitionExpanded] = useState(false);
  const [scopeExpanded, setScopeExpanded] = useState(false);
  const [rifleExpanded, setRifleExpanded] = useState(false);
  const [scopeFilterQuery, setScopeFilterQuery] = useState('');
  const [rifleFilterQuery, setRifleFilterQuery] = useState('');
  const [caliberFilterQuery, setCaliberFilterQuery] = useState('');
  const [bulletFilterQuery, setBulletFilterQuery] = useState('');
  const [filterCaliberKey, setFilterCaliberKey] = useState<string | null>(null);
  const [turretMinStr, setTurretMinStr] = useState('');
  const [turretMaxStr, setTurretMaxStr] = useState('');
  const [turretIntervalStr, setTurretIntervalStr] = useState('');
  const [profileNameInput, setProfileNameInput] = useState(currentProfile.userName);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [savePanelExpanded, setSavePanelExpanded] = useState(false);
  const [highlightNameInput, setHighlightNameInput] = useState(false);
  const userNameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfileNameInput(currentProfile.userName);
  }, [currentProfile.id]);

  const handleAddProfile = () => {
    playTapSound();
    addNewProfile();
    setHighlightNameInput(true);
    setTimeout(() => {
      userNameInputRef.current?.focus();
      userNameInputRef.current?.select();
    }, 100);
    setTimeout(() => setHighlightNameInput(false), 2500);
  };

  useEffect(() => {
    if (turretTableExpanded) {
      setTurretMinStr(String(clicksConfig.minM));
      setTurretMaxStr(String(clicksConfig.maxM));
      setTurretIntervalStr(String(clicksConfig.intervalM));
    }
  }, [turretTableExpanded, clicksConfig.minM, clicksConfig.maxM, clicksConfig.intervalM]);

  const bullet = useMemo(() => getBulletById(currentProfile.bulletId), [currentProfile.bulletId]);
  const scope = useMemo(() => getScopeById(currentProfile.scopeId), [currentProfile.scopeId]);
  const rifle = useMemo(() => getRifleById(currentProfile.rifleId), [currentProfile.rifleId]);
  const caliberOptions = useMemo(() => getUniqueCalibers(), []);
  // When rifle is selected, ammunition list shows only bullets for that rifle's caliber.
  const ammunitionForRifle = useMemo(
    () => (rifle ? getBulletsForCaliberKey(rifle.caliberKey) : []),
    [rifle?.id, rifle?.caliberKey]
  );
  const filteredAmmunitionList = useMemo(() => {
    const q = bulletFilterQuery.trim().toLowerCase();
    if (!q) return ammunitionForRifle.slice(0, 200);
    return ammunitionForRifle
      .filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.caliber.toLowerCase().includes(q) ||
          b.caliberKey.toLowerCase().includes(q)
      )
      .slice(0, 200);
  }, [ammunitionForRifle, bulletFilterQuery]);
  const selectedCaliberKey = rifle?.caliberKey ?? filterCaliberKey ?? bullet?.caliberKey ?? (caliberOptions[0]?.caliberKey ?? '');

  useEffect(() => {
    if (rifle?.caliberKey) setFilterCaliberKey(rifle.caliberKey);
  }, [rifle?.caliberKey]);

  const handleSave = () => {
    playTapSound();
    saveCurrent({ userName: profileNameInput });
  };

  return (
    <div className="max-w-lg mx-auto pb-48">
      {/* Delete profile confirmation */}
      {profileToDelete != null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60"
          onClick={() => setProfileToDelete(null)}
        >
          <div
            className="rounded-xl border border-white/20 bg-slate-900 p-5 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-slate-200 text-sm mb-4">{t('ballistic.deleteProfileWarning')}</p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { playTapSound(); setProfileToDelete(null); }}
                className="px-4 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/10 text-sm font-medium"
              >
                {t('ballistic.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  playTapSound();
                  if (profileToDelete) deleteSavedProfile(profileToDelete);
                  setProfileToDelete(null);
                }}
                className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 border border-red-400/40 hover:bg-red-500/30 text-sm font-medium"
              >
                {t('ballistic.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profiles: Default + saved — switch between them */}
      <section className="glass mb-6 rounded-xl border border-white/10 overflow-hidden px-4 py-3 !bg-slate-900/[0.0009]">
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
          {savedProfiles
            .filter((p) => (p.userName || '').trim() !== 'New profile')
            .map((p) => (
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
            onClick={handleAddProfile}
            className="px-3 py-2 rounded-lg border border-dashed border-theme-accent-50 text-theme-accent-90 text-sm font-medium hover:bg-theme-accent-10 hover:border-theme-accent-70 transition-colors"
          >
            <i className="fas fa-plus mr-1.5" />
            {t('ballistic.addProfile')}
          </button>
        </div>
      </section>

      {/* User name — local state only while typing; push to profile on blur/save so panel stays in sync and no dropped letters */}
      <section className="glass mb-6 rounded-xl border border-white/10 overflow-hidden px-4 py-3 !bg-slate-900/[0.0009]">
        <label className="text-xs text-slate-400 uppercase tracking-wider block mb-2">{t('ballistic.userName')}</label>
        <input
          ref={userNameInputRef}
          type="text"
          value={profileNameInput}
          onChange={(e) => setProfileNameInput(e.target.value)}
          onBlur={() => {
            updateCurrentProfile({ userName: profileNameInput });
          }}
          placeholder={t('ballistic.userNamePlaceholder')}
          autoComplete="off"
          className={`w-full rounded-lg bg-black/40 px-3 py-2.5 text-slate-200 placeholder-slate-500 text-sm transition-all ${
            highlightNameInput
              ? 'border-2 border-theme-accent shadow-theme-accent-30'
              : 'border border-white/20'
          }`}
        />
      </section>

      {/* Scope unit + Measurement — MIL/MOA on top, Metric/Imperial underneath */}
      <section className="glass mb-6 rounded-xl border border-white/10 overflow-hidden px-4 py-3 space-y-3 !bg-slate-900/[0.0009]">
        <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { playTapSound(); setScopeUnit('MIL'); updateCurrentProfile({ scopeUnit: 'MIL' }); }}
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
              onClick={() => { playTapSound(); setScopeUnit('MOA'); updateCurrentProfile({ scopeUnit: 'MOA' }); }}
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
              onClick={() => { playTapSound(); setMeasurement('metric'); updateCurrentProfile({ measurement: 'metric' }); }}
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
              onClick={() => { playTapSound(); setMeasurement('imperial'); updateCurrentProfile({ measurement: 'imperial' }); }}
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
      <section className="glass mb-6 rounded-2xl border border-white/10 overflow-hidden !bg-slate-900/[0.0009]">
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
      <section className="glass mb-6 rounded-2xl border border-white/10 overflow-hidden !bg-slate-900/[0.0009]">
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
              columnRoles={['amber', 'amber', 'white', 'white']}
              headerRoles={['amber', 'amber', 'white', 'white']}
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

      {/* Rifle — list of rifles; selection fills rifle profile. List persists so user can re-select. */}
      <section className="glass mb-6 rounded-2xl border border-white/10 overflow-hidden !bg-slate-900/[0.0009]">
        <button
          type="button"
          onClick={() => { playTapSound(); setRifleExpanded((e) => !e); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <span className="text-sm font-medium text-white shrink-0 min-w-[5.5rem]">{t('ballistic.rifle')}</span>
          <span className="text-sm text-theme-accent min-w-0 flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded" title={rifle?.name ?? currentProfile.rifleId}>
            {(rifle?.name ?? currentProfile.rifleId) || '—'}
          </span>
          <i className={`fas fa-chevron-down text-xs transition-transform shrink-0 ${rifleExpanded ? 'rotate-180' : ''}`} />
        </button>
        {rifleExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-white/10 space-y-3">
            <label className="text-xs text-slate-400 uppercase tracking-wider">{t('ballistic.rifle')}</label>
            <input
              type="text"
              value={rifleFilterQuery}
              onChange={(e) => setRifleFilterQuery(e.target.value)}
              placeholder={t('ballistic.rifle')}
              className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2.5 text-theme-accent font-mono text-sm min-w-0 placeholder-slate-500"
            />
            <div className="max-h-[40vh] overflow-y-auto overscroll-contain space-y-1 pb-24" onClick={(e) => e.stopPropagation()}>
              {searchRifles(rifleFilterQuery, 200).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    updateCurrentProfile({ rifleId: r.id, barrelLengthCm: r.barrelLengthCm, twistRate: r.twistRate });
                    setRifleFilterQuery('');
                    playTapSound();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    currentProfile.rifleId === r.id
                      ? 'border-theme-accent-50 bg-theme-accent-10 text-theme-accent'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Ammunition — filtered by rifle caliber; list persists so user can re-select. */}
      <section className="glass mb-6 rounded-2xl border border-white/10 overflow-hidden !bg-slate-900/[0.0009]">
        <button
          type="button"
          onClick={() => { playTapSound(); setAmmunitionExpanded((e) => !e); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <span className="text-sm font-medium text-white shrink-0 min-w-[5.5rem]">{t('ballistic.ammunition')}</span>
          <span className="text-sm text-theme-accent min-w-0 flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded" title={bullet?.name ?? currentProfile.bulletId}>
            {(bullet?.name ?? currentProfile.bulletId) || '—'}
          </span>
          <i className={`fas fa-chevron-down text-xs transition-transform shrink-0 ${ammunitionExpanded ? 'rotate-180' : ''}`} />
        </button>
        {ammunitionExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-white/10 space-y-3">
            {rifle ? (
              <>
                <p className="text-xs text-slate-400 uppercase tracking-wider">
                  {t('ballistic.ammunitionForCaliber') ?? 'Ammunition for'} {rifle.caliber}
                </p>
                <label className="text-xs text-slate-400 uppercase tracking-wider">{t('ballistic.bullet')}</label>
                <input
                  type="text"
                  value={bulletFilterQuery}
                  onChange={(e) => setBulletFilterQuery(e.target.value)}
                  placeholder={t('ballistic.bullet')}
                  className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2.5 text-theme-accent font-mono text-sm min-w-0 placeholder-slate-500"
                />
                <div className="max-h-[40vh] overflow-y-auto overscroll-contain space-y-1 pb-24" onClick={(e) => e.stopPropagation()}>
                  {filteredAmmunitionList.length === 0 ? (
                    <p className="text-slate-500 text-sm py-2">{t('ballistic.noBulletsForCaliber') ?? 'No ammunition entries for this caliber.'}</p>
                  ) : (
                    filteredAmmunitionList.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          updateCurrentProfile({ bulletId: b.id });
                          setBulletFilterQuery('');
                          playTapSound();
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                          currentProfile.bulletId === b.id
                            ? 'border-theme-accent-50 bg-theme-accent-10 text-theme-accent'
                            : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                        }`}
                      >
                        {b.name}
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <p className="text-slate-500 text-sm py-2">{t('ballistic.selectRifleFirst') ?? 'Select a rifle above to see compatible ammunition.'}</p>
            )}
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

      {/* Scope — list of scopes; selection fills rifle profile. List persists so user can re-select. */}
      <section className="glass mb-6 rounded-2xl border border-white/10 overflow-hidden !bg-slate-900/[0.0009]">
        <button
          type="button"
          onClick={() => { playTapSound(); setScopeExpanded((e) => !e); }}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <span className="text-sm font-medium text-white shrink-0 min-w-[5.5rem]">{t('ballistic.scope')}</span>
          <span className="text-sm text-theme-accent min-w-0 flex-1 overflow-x-auto overflow-y-hidden whitespace-nowrap [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded" title={scope?.name ?? currentProfile.scopeId}>
            {(scope?.name ?? currentProfile.scopeId) || '—'}
          </span>
          <i className={`fas fa-chevron-down text-xs transition-transform shrink-0 ${scopeExpanded ? 'rotate-180' : ''}`} />
        </button>
        {scopeExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-white/10 space-y-3">
            <label className="text-xs text-slate-400 uppercase tracking-wider">{t('ballistic.scope')}</label>
            <input
              type="text"
              value={scopeFilterQuery}
              onChange={(e) => setScopeFilterQuery(e.target.value)}
              placeholder={t('ballistic.scope')}
              className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2.5 text-theme-accent font-mono text-sm min-w-0 placeholder-slate-500"
            />
            <div className="max-h-[40vh] overflow-y-auto overscroll-contain space-y-1 pb-24" onClick={(e) => e.stopPropagation()}>
              {searchScopes(scopeFilterQuery, 200).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    updateCurrentProfile({ scopeId: s.id, scopeUnit: s.unit });
                    setScopeFilterQuery('');
                    playTapSound();
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    currentProfile.scopeId === s.id
                      ? 'border-theme-accent-50 bg-theme-accent-10 text-theme-accent'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200 hover:border-white/20'
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Full ballistic setup — collapsible */}
      <section className="glass mb-6 rounded-xl border border-white/10 overflow-hidden !bg-slate-900/[0.0009]">
        <button
          type="button"
          onClick={() => { playTapSound(); setSetupExpanded((e) => !e); }}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <span className="text-sm font-medium">{t('ballistic.rifleProfile')}</span>
          <i className={`fas fa-chevron-down text-xs transition-transform ${setupExpanded ? 'rotate-180' : ''}`} />
        </button>
        {setupExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-white/10 overflow-x-hidden overflow-y-auto max-h-[60vh] overscroll-contain">
            <RifleScopeSection editable showSaveAs />
          </div>
        )}
      </section>

      {/* Ballistics — opens ballistic section (DistanceView); green, always visible */}
      <section className="glass mb-6 rounded-xl border border-white/10 overflow-hidden !bg-slate-900/[0.0009]">
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

      {/* Save — expandable: save current + list of saved profiles with delete */}
      <section className="glass mt-12 mb-6 rounded-xl border border-white/10 overflow-hidden !bg-slate-900/[0.0009]">
        <button
          type="button"
          onClick={() => { playTapSound(); setSavePanelExpanded((e) => !e); }}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2 font-medium">
            <i className="fas fa-save text-theme-accent" />
            {t('ballistic.save')}
          </span>
          <i className={`fas fa-chevron-down text-xs transition-transform ${savePanelExpanded ? 'rotate-180' : ''}`} />
        </button>
        {savePanelExpanded && (
          <div className="px-4 pb-4 pt-0 border-t border-white/10 space-y-3">
            <button
              type="button"
              onClick={handleSave}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-theme-accent-50 bg-theme-accent-10 text-theme-accent text-sm font-medium hover:bg-theme-accent-20 transition-colors"
            >
              <span>{t('ballistic.save')}</span>
              <i className="fas fa-save text-xs" />
            </button>
            <label className="text-xs text-slate-400 uppercase tracking-wider block pt-1">{t('ballistic.savedProfiles')}</label>
            <div className="space-y-1.5">
              {savedProfiles.length === 0 ? (
                <p className="text-slate-500 text-sm py-1">{t('ballistic.noSavedProfiles')}</p>
              ) : (
                savedProfiles.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { playTapSound(); loadProfile(p.id); setSavePanelExpanded(false); }}
                      className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentProfile.id === p.id
                          ? 'bg-theme-accent-20 text-theme-accent border border-theme-accent-30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-white/10'
                      }`}
                    >
                      {p.userName}
                    </button>
                    <button
                      type="button"
                      onClick={() => { playTapSound(); setProfileToDelete(p.id); }}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors"
                      title={t('ballistic.delete')}
                      aria-label={t('ballistic.delete')}
                    >
                      <i className="fas fa-trash-alt text-xs" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
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
