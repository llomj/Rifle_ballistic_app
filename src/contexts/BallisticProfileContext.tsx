import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { BallisticProfile } from '../data/ballistic';
import {
  BALLISTIC_PROFILES_STORAGE_KEY,
  DEFAULT_BALLISTIC_PROFILE,
} from '../data/ballistic';
import {
  getCatalogMuzzleVelocityMps,
  getCatalogPowderChargeGrams,
  getProfileAmmoFieldsFromBullet,
} from '../data/catalogBulletMv';
import { getProfileCartridgeFieldsFromBullet } from '../data/cartridgeDimensions';
import { getBulletById, getRifleById, resolveBulletIdForRifle } from '../data/catalogs';
import { fpsToMs } from '../utils/ballisticUnits';

/**
 * Fills rim / case / OAL / bullet diameter from the catalog bullet when the profile has gaps.
 * Used on load so saved profiles and first paint match `updateCurrentProfile` behaviour after ammo pick.
 */
function fillMissingCartridgeFieldsFromBullet(profile: BallisticProfile): BallisticProfile {
  const bullet = getBulletById(profile.bulletId);
  if (!bullet) return profile;
  const extra = getProfileCartridgeFieldsFromBullet(bullet);
  return {
    ...profile,
    rimDiametersMm: profile.rimDiametersMm ?? extra.rimDiametersMm,
    caseLengthMm: profile.caseLengthMm ?? extra.caseLengthMm,
    overallLengthMm: profile.overallLengthMm ?? extra.overallLengthMm,
    bulletDiameterMm: profile.bulletDiameterMm ?? extra.bulletDiameterMm,
  };
}

/**
 * Fills powder charge (g) from catalog when missing — same source as `getProfileAmmoFieldsFromBullet` on ammo pick.
 */
function fillMissingAmmoFieldsFromBullet(profile: BallisticProfile): BallisticProfile {
  const bullet = getBulletById(profile.bulletId);
  if (!bullet) return profile;
  if (profile.bulletGram != null && Number.isFinite(profile.bulletGram)) return profile;
  return {
    ...profile,
    bulletGram: getCatalogPowderChargeGrams(bullet),
  };
}

/** Ensures `bulletId` references a round compatible with `rifleId` (same caliberKey in catalog). */
function profileWithBulletMatchingRifle(profile: BallisticProfile): BallisticProfile {
  const bulletId = resolveBulletIdForRifle(profile.rifleId, profile.bulletId);
  if (bulletId === profile.bulletId) return profile;
  return { ...profile, bulletId };
}

/**
 * Canonical MV storage is m/s. If a legacy profile accidentally stored fps in `muzzleVelocityMps`,
 * normalize it during hydration so metrics (drop/recoil/TOF) remain correct.
 *
 * Heuristic: any value > 1500 is almost certainly fps (1500 m/s is implausible for rifles).
 */
function normalizeMuzzleVelocityMps(profile: BallisticProfile): BallisticProfile {
  const v = profile.muzzleVelocityMps;
  if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) return profile;
  if (v > 1500) {
    return { ...profile, muzzleVelocityMps: fpsToMs(v) };
  }
  return profile;
}

/** Align rifle/bullet, rim/case/OAL, then powder charge for first paint / localStorage loads. */
function hydrateProfileFromBulletCatalog(profile: BallisticProfile): BallisticProfile {
  const aligned = profileWithBulletMatchingRifle(profile);
  const filled = fillMissingAmmoFieldsFromBullet(fillMissingCartridgeFieldsFromBullet(aligned));
  return normalizeMuzzleVelocityMps(filled);
}

interface BallisticProfileContextType {
  /** Currently active profile (default or a saved one). */
  currentProfile: BallisticProfile;
  /** Saved user profiles (excludes default). */
  savedProfiles: BallisticProfile[];
  setCurrentProfile: (profile: BallisticProfile) => void;
  updateCurrentProfile: (updates: Partial<BallisticProfile>) => void;
  /** Save current setup as a new named profile. */
  saveCurrentAs: (userName: string) => void;
  /** Save current state: if default → create new profile; if saved → update in place. Optional overrides (e.g. userName from input) applied at save time. */
  saveCurrent: (overrides?: Partial<BallisticProfile>) => void;
  /** Create a new profile (from default setup), add to saved list, and switch to it. */
  addNewProfile: () => void;
  /** Load a profile by id ('default' or a saved id). */
  loadProfile: (id: string) => void;
  deleteSavedProfile: (id: string) => void;
}

const BallisticProfileContext = createContext<BallisticProfileContextType | undefined>(undefined);

function loadSavedFromStorage(): BallisticProfile[] {
  try {
    const raw = localStorage.getItem(BALLISTIC_PROFILES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const valid = parsed.filter(
      (p: unknown): p is BallisticProfile =>
        p != null &&
        typeof p === 'object' &&
        typeof (p as BallisticProfile).id === 'string' &&
        (p as BallisticProfile).id !== 'default' &&
        typeof (p as BallisticProfile).userName === 'string' &&
        typeof (p as BallisticProfile).rifleId === 'string' &&
        typeof (p as BallisticProfile).scopeId === 'string' &&
        typeof (p as BallisticProfile).scopeHeightCm === 'number' &&
        typeof (p as BallisticProfile).bulletId === 'string' &&
        typeof (p as BallisticProfile).muzzleVelocityMps === 'number'
    );
    // Only show user-added profiles: remove any "test" entries (legacy/demo)
    const cleaned = valid.filter(
      (p) => (p.userName || '').trim().toLowerCase() !== 'test'
    );
    // Align ammunition with rifle caliber for any legacy or edited JSON; fill cartridge dims from bullet.
    return cleaned.map((p) => hydrateProfileFromBulletCatalog(p));
  } catch {
    return [];
  }
}

function persistSaved(saved: BallisticProfile[]) {
  try {
    localStorage.setItem(BALLISTIC_PROFILES_STORAGE_KEY, JSON.stringify(saved));
  } catch (_) {}
}

export const BallisticProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [savedProfiles, setSavedProfiles] = useState<BallisticProfile[]>(loadSavedFromStorage);
  const [currentProfile, setCurrentProfileState] = useState<BallisticProfile>(() =>
    hydrateProfileFromBulletCatalog({ ...DEFAULT_BALLISTIC_PROFILE })
  );

  const setSavedProfilesAndPersist = useCallback((updater: (prev: BallisticProfile[]) => BallisticProfile[]) => {
    setSavedProfiles((prev) => {
      const next = updater(prev);
      persistSaved(next);
      return next;
    });
  }, []);

  useEffect(() => {
    persistSaved(savedProfiles);
  }, [savedProfiles]);

  /**
   * Heal profiles stuck at the default Tikka .300 Win Mag MV (922 m/s) while a non-.300 WM bullet is selected.
   * (Merge rules do not always run for old localStorage state.)
   */
  useEffect(() => {
    setCurrentProfileState((prev) => {
      const bullet = getBulletById(prev.bulletId);
      if (!bullet) return prev;
      const legacy = DEFAULT_BALLISTIC_PROFILE.muzzleVelocityMps;
      if (prev.muzzleVelocityMps !== legacy) return prev;
      if (bullet.caliberKey === '300winmag') return prev;
      const catalogMv = getCatalogMuzzleVelocityMps(bullet);
      if (Math.abs(prev.muzzleVelocityMps - catalogMv) < 0.5) return prev;
      return { ...prev, muzzleVelocityMps: catalogMv };
    });
  }, [currentProfile.bulletId]);

  const setCurrentProfile = useCallback((profile: BallisticProfile) => {
    setCurrentProfileState(hydrateProfileFromBulletCatalog({ ...profile }));
  }, []);

  const updateCurrentProfile = useCallback((updates: Partial<BallisticProfile>) => {
    setCurrentProfileState((prev) => {
      const bulletIdBefore = prev.bulletId;
      // Explicit ammunition pick must be kept: do not replace with resolveBulletIdForRifle (caliber mismatch).
      let next: BallisticProfile =
        updates.bulletId !== undefined
          ? { ...prev, ...updates }
          : profileWithBulletMatchingRifle({ ...prev, ...updates });
      const bulletIdExplicit = updates.bulletId !== undefined;
      const bulletResolvedChanged = next.bulletId !== bulletIdBefore;
      const rifleChanged = updates.rifleId !== undefined;
      const prevRifle = getRifleById(prev.rifleId);
      const nextRifle = getRifleById(next.rifleId);
      const caliberChanged =
        rifleChanged && prevRifle?.caliberKey !== nextRifle?.caliberKey;
      /** Rim / case / OAL: any explicit ammo pick, resolved bullet id change, or rifle/caliber change. */
      const needsCartridgeDims =
        Boolean(next.bulletId) &&
        (bulletIdExplicit || bulletResolvedChanged || rifleChanged || caliberChanged);
      /**
       * MV / powder: refresh when the catalog load changes, user picks ammo, or rifle caliber changes
       * (e.g. user chose .30-30 bullet while still on a .300 WM rifle, then selects Marlin — same bullet id, must still replace 922 with catalog MV).
       * Same-caliber rifle swap (e.g. two .30-30 levers) does not merge ammo — preserves chrono-tuned MV.
       */
      const shouldMergeAmmo =
        next.bulletId &&
        (bulletResolvedChanged || bulletIdExplicit || caliberChanged);
      if (needsCartridgeDims || shouldMergeAmmo) {
        const bullet = getBulletById(next.bulletId);
        if (bullet) {
          if (needsCartridgeDims) {
            next = { ...next, ...getProfileCartridgeFieldsFromBullet(bullet) };
          }
          if (shouldMergeAmmo) {
            next = { ...next, ...getProfileAmmoFieldsFromBullet(bullet) };
          }
        }
      }
      // When user selects rifle, scope, or ammunition, lock into current profile; persist if saved.
      if (prev.id !== 'default') {
        setSavedProfilesAndPersist((list) =>
          list.map((p) =>
            p.id === prev.id
              ? { ...next, id: prev.id, userName: next.userName, createdAt: p.createdAt }
              : p
          )
        );
      }
      return next;
    });
  }, [setSavedProfilesAndPersist]);

  const saveCurrentAs = useCallback((userName: string) => {
    const id = `saved-${Date.now()}`;
    const newProfile: BallisticProfile = {
      ...currentProfile,
      id,
      userName: userName.trim() || 'My setup',
      createdAt: Date.now(),
    };
    setSavedProfilesAndPersist((prev) => [...prev, newProfile]);
    setCurrentProfileState(newProfile);
  }, [currentProfile, setSavedProfilesAndPersist]);

  const saveCurrent = useCallback((overrides?: Partial<BallisticProfile>) => {
    const profile = { ...currentProfile, ...overrides };
    const name = (profile.userName || '').trim() || 'My setup';
    if (profile.id === 'default') {
      saveCurrentAs(name);
    } else {
      setSavedProfilesAndPersist((prev) =>
        prev.map((p) =>
          p.id === profile.id
            ? { ...profile, userName: name, createdAt: p.createdAt }
            : p
        )
      );
      setCurrentProfileState((prev) => (prev.id === profile.id ? { ...profile, userName: name } : prev));
    }
  }, [currentProfile, saveCurrentAs, setSavedProfilesAndPersist]);

  const addNewProfile = useCallback(() => {
    const id = `saved-${Date.now()}`;
    const newProfile: BallisticProfile = hydrateProfileFromBulletCatalog({
      ...DEFAULT_BALLISTIC_PROFILE,
      id,
      userName: 'New profile',
      createdAt: Date.now(),
    });
    setSavedProfilesAndPersist((prev) => [...prev, newProfile]);
    setCurrentProfileState(newProfile);
  }, [setSavedProfilesAndPersist]);

  const loadProfile = useCallback((id: string) => {
    if (id === 'default') {
      setCurrentProfileState(hydrateProfileFromBulletCatalog({ ...DEFAULT_BALLISTIC_PROFILE }));
      return;
    }
    const found = savedProfiles.find((p) => p.id === id);
    if (found) {
      setCurrentProfileState(hydrateProfileFromBulletCatalog({ ...found }));
    }
  }, [savedProfiles]);

  const deleteSavedProfile = useCallback((id: string) => {
    setSavedProfilesAndPersist((prev) => prev.filter((p) => p.id !== id));
    if (currentProfile.id === id) {
      setCurrentProfileState(hydrateProfileFromBulletCatalog({ ...DEFAULT_BALLISTIC_PROFILE }));
    }
  }, [currentProfile.id, setSavedProfilesAndPersist]);

  return (
    <BallisticProfileContext.Provider
      value={{
        currentProfile,
        savedProfiles,
        setCurrentProfile,
        updateCurrentProfile,
        saveCurrentAs,
        saveCurrent,
        addNewProfile,
        loadProfile,
        deleteSavedProfile,
      }}
    >
      {children}
    </BallisticProfileContext.Provider>
  );
};

export const useBallisticProfile = () => {
  const ctx = useContext(BallisticProfileContext);
  if (ctx === undefined) {
    throw new Error('useBallisticProfile must be used within BallisticProfileProvider');
  }
  return ctx;
};
