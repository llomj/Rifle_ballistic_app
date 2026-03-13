import React, { useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSound } from '../contexts/SoundContext';
import { useBallisticProfile } from '../contexts/BallisticProfileContext';
import { useBallisticSettings } from '../contexts/BallisticSettingsContext';
import { cmToIn, inToCm, mmToIn, inToMm, msToFps, fpsToMs, kgToLb, mToYd, formatScopeHeight, formatBarrelLength, formatMmLength } from '../utils/ballisticUnits';
import { formatTranslation } from '../translations';
import { CliLine } from './CliBlock';
import { SearchCombobox } from './SearchCombobox';
import {
  RIFLES,
  SCOPES,
  BULLETS,
  getRifleById,
  getScopeById,
  getBulletById,
  getBulletsForCaliberKey,
  searchRifles,
  searchScopes,
  searchBullets,
} from '../data/catalogs';
import type { RifleCatalogItem, ScopeCatalogItem, BulletCatalogItem } from '../data/ballistic';
import { computeRecoilEnergyJ, recoilCategory, getScopeMagnificationForMeasure } from '../data/ballistic';

interface RifleScopeSectionProps {
  /** When true, show editable form (comboboxes + inputs). When false, show read-only summary. */
  editable?: boolean;
  /** Show "Save as" button (only when editable). */
  showSaveAs?: boolean;
}

export const RifleScopeSection: React.FC<RifleScopeSectionProps> = ({
  editable = true,
  showSaveAs = true,
}) => {
  const { t } = useLanguage();
  const { playTapSound } = useSound();
  const { currentProfile, updateCurrentProfile, saveCurrentAs } = useBallisticProfile();
  const { measurement, setMeasurement } = useBallisticSettings();

  const rifle = useMemo(() => getRifleById(currentProfile.rifleId), [currentProfile.rifleId]);
  const scope = useMemo(() => getScopeById(currentProfile.scopeId), [currentProfile.scopeId]);
  const bullet = useMemo(() => getBulletById(currentProfile.bulletId), [currentProfile.bulletId]);

  const recoilJ = useMemo(() => {
    if (!rifle?.rifleWeightKg || !bullet) return null;
    return computeRecoilEnergyJ(
      rifle.rifleWeightKg,
      bullet.weightGrams,
      currentProfile.muzzleVelocityMps,
      currentProfile.bulletGram
    );
  }, [rifle, bullet, currentProfile.muzzleVelocityMps, currentProfile.bulletGram]);

  const recoilCat = recoilJ != null ? recoilCategory(recoilJ) : null;
  const bcDisplay = currentProfile.bcOverride ?? bullet?.bcG1 ?? null;

  const bulletSearch = useMemo(
    () => (q: string, limit?: number) =>
      searchBullets(q, rifle?.caliberKey, limit ?? 20),
    [rifle?.caliberKey]
  );
  const bulletItems = useMemo(
    () => getBulletsForCaliberKey(rifle?.caliberKey ?? ''),
    [rifle?.caliberKey]
  );

  const [saveName, setSaveName] = useState('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);

  const handleSaveAs = () => {
    const name = saveName.trim() || currentProfile.userName;
    if (name) {
      saveCurrentAs(name);
      setSaveName('');
      setShowSavePrompt(false);
      playTapSound();
    }
  };

  /** Game weight range by caliber for "Good for game X–Y kg" or "X–Y lb" in imperial */
  const gameRangeDisplay = useMemo(() => {
    const key = rifle?.caliberKey ?? '';
    const map: Record<string, string> = {
      '300winmag': '90–320',
      '300weatherby': '90–320',
      '308': '70–250',
      '65creedmoor': '50–200',
      '223': '20–80',
    };
    const kg = map[key] ?? '90–320';
    if (measurement === 'imperial') {
      const [lo, hi] = kg.split('–').map((s) => parseFloat(s));
      if (!isNaN(lo) && !isNaN(hi)) {
        return `${Math.round(kgToLb(lo))}–${Math.round(kgToLb(hi))}`;
      }
    }
    return kg;
  }, [rifle?.caliberKey, measurement]);

  const goodForGameText = measurement === 'imperial'
    ? formatTranslation(t('ballistic.goodForGameRangeLb'), { range: gameRangeDisplay })
    : formatTranslation(t('ballistic.goodForGameRange'), { range: gameRangeDisplay });

  const measureLine1 = scope?.ffpOrSfp === 'FFP' ? t('ballistic.measureDistanceFfp') : t('ballistic.measureDistanceSfp');
  const zeroM = currentProfile.zeroDistanceM ?? 100;
  const zeroDisplay = measurement === 'imperial' ? Math.round(mToYd(zeroM)) : zeroM;
  const measureMag = getScopeMagnificationForMeasure(scope);
  const measureLine2 = measureMag != null
    ? (measurement === 'imperial'
        ? formatTranslation(t('ballistic.zeroAtYdZoomMag'), { distance: zeroDisplay, mag: measureMag })
        : formatTranslation(t('ballistic.zeroAtZoomMag'), { distance: zeroDisplay, mag: measureMag }))
    : (measurement === 'imperial'
        ? formatTranslation(t('ballistic.zeroAtYdZoomAnyMag'), { distance: zeroDisplay })
        : formatTranslation(t('ballistic.zeroAtZoomAnyMag'), { distance: zeroDisplay }));
  const measureLine3 = scope?.unit === 'MOA' ? t('ballistic.formulaHeightMoa') : t('ballistic.formulaHeightMils');

  const inputCls = 'rounded bg-black/40 border border-white/20 px-2 py-1.5 text-theme-accent font-mono text-xs min-w-0';
  const labelCls = 'text-slate-400 font-mono text-xs shrink-0';
  const numInputCls = 'w-20 min-w-[5rem]'; // same size as other small panels

  return (
    <div className="space-y-2 min-w-0 overflow-x-hidden">
      <section className="pb-1 border-b border-white/10">
        <div className="rounded border border-theme-accent-30 bg-theme-accent-5 px-2 py-1.5 space-y-0.5">
          <CliLine role="yellow">{measureLine1}</CliLine>
          <CliLine role="yellow">{measureLine2}</CliLine>
          <CliLine role="yellow">{measureLine3}</CliLine>
        </div>
        <div className="rounded border border-theme-accent-30 bg-theme-accent-5 px-2 py-1.5 mt-1">
          <CliLine role="yellow">{goodForGameText}</CliLine>
        </div>
      </section>

      {editable ? (
        <section className="space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className={`${labelCls} w-28`}>{t('ballistic.rifle')}</span>
            <SearchCombobox<RifleCatalogItem>
              items={RIFLES}
              getItemId={(r) => r.id}
              getItemLabel={(r) => r.name}
              value={currentProfile.rifleId}
              onSelect={(r) => r && updateCurrentProfile({ rifleId: r.id, barrelLengthCm: r.barrelLengthCm, twistRate: r.twistRate })}
              search={searchRifles}
              placeholder={t('ballistic.rifle')}
              getLabelForId={(id) => getRifleById(id)?.name ?? id}
              className="flex-1 min-w-0"
              inputClassName={inputCls}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className={`${labelCls} w-28`}>{t('ballistic.scope')}</span>
            <SearchCombobox<ScopeCatalogItem>
              items={SCOPES}
              getItemId={(s) => s.id}
              getItemLabel={(s) => s.name}
              value={currentProfile.scopeId}
              onSelect={(s) => s && updateCurrentProfile({ scopeId: s.id, scopeUnit: s.unit })}
              search={searchScopes}
              placeholder={t('ballistic.scope')}
              getLabelForId={(id) => getScopeById(id)?.name ?? id}
              className="flex-1 min-w-0"
              inputClassName={inputCls}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className={`${labelCls} w-28`}>{t('ballistic.scopeHeight')}</span>
            <input
              type="number"
              min="0"
              step={measurement === 'imperial' ? 0.01 : 0.1}
              value={currentProfile.scopeHeightCm != null
                ? (measurement === 'imperial' ? Math.round(cmToIn(currentProfile.scopeHeightCm) * 100) / 100 : currentProfile.scopeHeightCm)
                : ''}
              onChange={(e) => {
                const raw = parseFloat(e.target.value) || 0;
                updateCurrentProfile({ scopeHeightCm: measurement === 'imperial' ? inToCm(raw) : raw });
              }}
              className={`${inputCls} ${numInputCls}`}
              placeholder={measurement === 'imperial' ? '1.8 in' : '4.6 cm'}
            />
            <span className="text-slate-500 shrink-0">{measurement === 'imperial' ? 'in' : 'cm'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`${labelCls} w-28`}>{t('ballistic.barrelLength')}</span>
            <input
              type="number"
              min="0"
              step={measurement === 'imperial' ? 0.1 : 0.1}
              value={currentProfile.barrelLengthCm != null
                ? (measurement === 'imperial' ? Math.round(cmToIn(currentProfile.barrelLengthCm) * 100) / 100 : currentProfile.barrelLengthCm)
                : ''}
              onChange={(e) => {
                if (e.target.value === '') {
                  updateCurrentProfile({ barrelLengthCm: undefined });
                  return;
                }
                const raw = parseFloat(e.target.value) || 0;
                updateCurrentProfile({ barrelLengthCm: measurement === 'imperial' ? inToCm(raw) : raw });
              }}
              className={`${inputCls} ${numInputCls}`}
              placeholder={measurement === 'imperial' ? '24 in' : '60 cm'}
            />
            <span className="text-slate-500 shrink-0">{measurement === 'imperial' ? 'in' : 'cm'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`${labelCls} w-28`}>{t('ballistic.twist')}</span>
            <input
              type="text"
              value={currentProfile.twistRate ?? ''}
              onChange={(e) => updateCurrentProfile({ twistRate: e.target.value || undefined })}
              className={`${inputCls} ${numInputCls}`}
              placeholder="1:11"
            />
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className={`${labelCls} w-28`}>{t('ballistic.rimDiameters')} ({t('ballistic.optional')})</span>
            <input
              type="number"
              min="0"
              step={measurement === 'imperial' ? 0.01 : 0.1}
              value={currentProfile.rimDiametersMm != null
                ? (measurement === 'imperial'
                  ? Math.round(mmToIn(currentProfile.rimDiametersMm) * 100) / 100
                  : currentProfile.rimDiametersMm)
                : ''}
              onChange={(e) => {
                if (e.target.value === '') {
                  updateCurrentProfile({ rimDiametersMm: undefined });
                  return;
                }
                const raw = parseFloat(e.target.value) || 0;
                updateCurrentProfile({ rimDiametersMm: measurement === 'imperial' ? inToMm(raw) : raw });
              }}
              className={`${inputCls} ${numInputCls}`}
              placeholder={measurement === 'imperial' ? '0.52 in' : '13.3 mm'}
            />
            <span className="text-slate-500 shrink-0">{measurement === 'imperial' ? 'in' : 'mm'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className={`${labelCls} w-28`}>{t('ballistic.caseLength')} ({t('ballistic.optional')})</span>
            <input
              type="number"
              min="0"
              step={measurement === 'imperial' ? 0.01 : 0.1}
              value={currentProfile.caseLengthMm != null
                ? (measurement === 'imperial'
                  ? Math.round(mmToIn(currentProfile.caseLengthMm) * 100) / 100
                  : currentProfile.caseLengthMm)
                : ''}
              onChange={(e) => {
                if (e.target.value === '') {
                  updateCurrentProfile({ caseLengthMm: undefined });
                  return;
                }
                const raw = parseFloat(e.target.value) || 0;
                updateCurrentProfile({ caseLengthMm: measurement === 'imperial' ? inToMm(raw) : raw });
              }}
              className={`${inputCls} ${numInputCls}`}
              placeholder={measurement === 'imperial' ? '2.6 in' : '67 mm'}
            />
            <span className="text-slate-500 shrink-0">{measurement === 'imperial' ? 'in' : 'mm'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span className={`${labelCls} w-28`}>{t('ballistic.overallLength')} ({t('ballistic.optional')})</span>
            <input
              type="number"
              min="0"
              step={measurement === 'imperial' ? 0.01 : 0.1}
              value={currentProfile.overallLengthMm != null
                ? (measurement === 'imperial'
                  ? Math.round(mmToIn(currentProfile.overallLengthMm) * 100) / 100
                  : currentProfile.overallLengthMm)
                : ''}
              onChange={(e) => {
                if (e.target.value === '') {
                  updateCurrentProfile({ overallLengthMm: undefined });
                  return;
                }
                const raw = parseFloat(e.target.value) || 0;
                updateCurrentProfile({ overallLengthMm: measurement === 'imperial' ? inToMm(raw) : raw });
              }}
              className={`${inputCls} ${numInputCls}`}
              placeholder={measurement === 'imperial' ? '3.3 in' : '85 mm'}
            />
            <span className="text-slate-500 shrink-0">{measurement === 'imperial' ? 'in' : 'mm'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`${labelCls} w-28`}>{t('ballistic.bullet')}</span>
            <SearchCombobox<BulletCatalogItem>
              items={bulletItems}
              getItemId={(b) => b.id}
              getItemLabel={(b) => b.name}
              value={currentProfile.bulletId}
              onSelect={(b) => b && updateCurrentProfile({ bulletId: b.id })}
              search={bulletSearch}
              placeholder={rifle ? t('ballistic.bullet') : t('ballistic.rifle') + ' first'}
              getLabelForId={(id) => getBulletById(id)?.name ?? id}
              className="flex-1 min-w-0"
              inputClassName={inputCls}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className={`${labelCls} w-28`}>{t('ballistic.bulletGram')}</span>
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
              className={`${inputCls} ${numInputCls}`}
            />
            <span className="text-slate-500 shrink-0">g</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`${labelCls} w-28`}>{t('ballistic.averageSpeed')}</span>
            <input
              type="number"
              min="0"
              step={measurement === 'imperial' ? 1 : 1}
              value={currentProfile.muzzleVelocityMps != null
                ? (measurement === 'imperial' ? Math.round(msToFps(currentProfile.muzzleVelocityMps)) : currentProfile.muzzleVelocityMps)
                : ''}
              onChange={(e) => {
                const raw = parseFloat(e.target.value) || 0;
                updateCurrentProfile({ muzzleVelocityMps: measurement === 'imperial' ? fpsToMs(raw) : raw });
              }}
              className={`${inputCls} ${numInputCls}`}
              placeholder={measurement === 'imperial' ? '3025 fps' : '922 m/s'}
            />
            <span className="text-slate-500 shrink-0">{measurement === 'imperial' ? 'fps' : 'm/s'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`${labelCls} w-28`}>{t('ballistic.recoil')}</span>
            <div className="rounded border border-theme-accent-30 bg-theme-accent-5 px-2 py-1.5 flex-1 min-w-0 text-slate-300 font-mono text-xs">
              {recoilJ != null ? (
                <>
                  {measurement === 'imperial'
                    ? `${(recoilJ * 0.737562).toFixed(2)} ft·lb`
                    : `${recoilJ.toFixed(2)} J`}
                  {recoilCat && ` (${t(recoilCat === 'low' ? 'ballistic.recoilLow' : recoilCat === 'medium' ? 'ballistic.recoilMedium' : recoilCat === 'high' ? 'ballistic.recoilHigh' : 'ballistic.recoilVeryHigh')})`}
                </>
              ) : (
                <span className="text-slate-500">—</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`${labelCls} w-28`}>{t('ballistic.coefficient')}</span>
            <input
              type="number"
              min="0"
              max="1"
              step="0.001"
              value={currentProfile.bcOverride != null ? currentProfile.bcOverride : ''}
              onChange={(e) => {
                const v = e.target.value === '' ? undefined : parseFloat(e.target.value);
                updateCurrentProfile({ bcOverride: v });
              }}
              placeholder={bullet ? String(bullet.bcG1) : '—'}
              className={`${inputCls} ${numInputCls}`}
            />
            {bcDisplay != null && <span className="text-theme-accent">G1</span>}
          </div>
          {showSaveAs && (
            <div className="pt-1 border-t border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {!showSavePrompt ? (
                  <button
                    type="button"
                    onClick={() => { playTapSound(); setShowSavePrompt(true); }}
                    className="py-1.5 px-2 rounded border border-theme-accent-50 bg-theme-accent-10 text-theme-accent text-xs font-medium"
                  >
                    {t('ballistic.saveProfileAs')}
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder={t('ballistic.profileName')}
                      className={`${inputCls} min-w-[100px] w-32`}
                    />
                    <button type="button" onClick={handleSaveAs} className="py-1.5 px-2 rounded border border-emerald-500/50 bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                      {t('ballistic.saveProfile')}
                    </button>
                    <button type="button" onClick={() => { setShowSavePrompt(false); setSaveName(''); }} className="py-1.5 px-2 rounded border border-white/10 text-slate-400 text-xs">
                      {t('ballistic.cancel')}
                    </button>
                  </div>
                )}
                <div className="rounded border border-white/20 bg-black/20 px-1 py-0.5 flex gap-0.5">
                  <button
                    type="button"
                    onClick={() => { playTapSound(); setMeasurement('metric'); }}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${measurement === 'metric' ? 'bg-theme-accent-20 text-theme-accent border border-theme-accent-30' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {t('ballistic.measurementMetric')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { playTapSound(); setMeasurement('imperial'); }}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${measurement === 'imperial' ? 'bg-theme-accent-20 text-theme-accent border border-theme-accent-30' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {t('ballistic.measurementImperial')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-0.5 font-mono text-xs">
          <CliLine role="white">{t('ballistic.rifle')}:   {rifle?.name ?? currentProfile.rifleId}</CliLine>
          <CliLine role="white">{t('ballistic.scope')}: {scope?.name ?? currentProfile.scopeId}</CliLine>
          <CliLine role="white">{t('ballistic.scopeHeight')}:{"\t"}{currentProfile.scopeHeightCm != null ? formatScopeHeight(currentProfile.scopeHeightCm, measurement) : '—'} · {t('ballistic.barrelLength')}: {currentProfile.barrelLengthCm != null ? formatBarrelLength(currentProfile.barrelLengthCm, measurement) : '—'} · {t('ballistic.twist')}: {currentProfile.twistRate ?? '—'}</CliLine>
          <CliLine role="white">{t('ballistic.rimDiameters')}: {currentProfile.rimDiametersMm != null ? formatMmLength(currentProfile.rimDiametersMm, measurement) : '—'} · {t('ballistic.caseLength')}: {currentProfile.caseLengthMm != null ? formatMmLength(currentProfile.caseLengthMm, measurement) : '—'} · {t('ballistic.overallLength')}: {currentProfile.overallLengthMm != null ? formatMmLength(currentProfile.overallLengthMm, measurement) : '—'}</CliLine>
          <CliLine role="white">{t('ballistic.bullet')}:{"\t"}{bullet?.name ?? currentProfile.bulletId} · {t('ballistic.bulletGram')}: {currentProfile.bulletGram != null ? `${currentProfile.bulletGram} g` : '—'} · {t('ballistic.averageSpeed')}: {currentProfile.muzzleVelocityMps != null ? (measurement === 'imperial' ? `${Math.round(msToFps(currentProfile.muzzleVelocityMps))} fps` : `${currentProfile.muzzleVelocityMps} m/s`) : '—'}</CliLine>
          <CliLine role="white">{t('ballistic.recoil')}:{"\t"}{recoilJ != null ? (measurement === 'imperial' ? `${(recoilJ * 0.737562).toFixed(2)} ft·lb` : `${recoilJ.toFixed(2)} J`) : '—'} · {t('ballistic.coefficient')}: {bcDisplay != null ? `${bcDisplay} G1` : '—'}</CliLine>
        </section>
      )}
    </div>
  );
};
