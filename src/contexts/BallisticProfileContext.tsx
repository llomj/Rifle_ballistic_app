import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { BallisticProfile } from '../data/ballistic';
import {
  BALLISTIC_PROFILES_STORAGE_KEY,
  DEFAULT_BALLISTIC_PROFILE,
} from '../data/ballistic';

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
    return valid.filter(
      (p) => (p.userName || '').trim().toLowerCase() !== 'test'
    );
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
  const [currentProfile, setCurrentProfileState] = useState<BallisticProfile>(() => ({
    ...DEFAULT_BALLISTIC_PROFILE,
  }));

  useEffect(() => {
    persistSaved(savedProfiles);
  }, [savedProfiles]);

  const setCurrentProfile = useCallback((profile: BallisticProfile) => {
    setCurrentProfileState({ ...profile });
  }, []);

  const updateCurrentProfile = useCallback((updates: Partial<BallisticProfile>) => {
    setCurrentProfileState((prev) => {
      const next = { ...prev, ...updates };
      // When user selects rifle, scope, or ammunition, lock into current profile; persist if saved.
      if (prev.id !== 'default') {
        setSavedProfiles((list) =>
          list.map((p) =>
            p.id === prev.id
              ? { ...next, id: prev.id, userName: next.userName, createdAt: p.createdAt }
              : p
          )
        );
      }
      return next;
    });
  }, []);

  const saveCurrentAs = useCallback((userName: string) => {
    const id = `saved-${Date.now()}`;
    const newProfile: BallisticProfile = {
      ...currentProfile,
      id,
      userName: userName.trim() || 'My setup',
      createdAt: Date.now(),
    };
    setSavedProfiles((prev) => [...prev, newProfile]);
    setCurrentProfileState(newProfile);
  }, [currentProfile]);

  const saveCurrent = useCallback((overrides?: Partial<BallisticProfile>) => {
    const profile = { ...currentProfile, ...overrides };
    const name = (profile.userName || '').trim() || 'My setup';
    if (profile.id === 'default') {
      saveCurrentAs(name);
    } else {
      setSavedProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id
            ? { ...profile, userName: name, createdAt: p.createdAt }
            : p
        )
      );
      setCurrentProfileState((prev) => (prev.id === profile.id ? { ...profile, userName: name } : prev));
    }
  }, [currentProfile, saveCurrentAs]);

  const addNewProfile = useCallback(() => {
    const id = `saved-${Date.now()}`;
    const newProfile: BallisticProfile = {
      ...DEFAULT_BALLISTIC_PROFILE,
      id,
      userName: 'New profile',
      createdAt: Date.now(),
    };
    setSavedProfiles((prev) => [...prev, newProfile]);
    setCurrentProfileState(newProfile);
  }, []);

  const loadProfile = useCallback((id: string) => {
    if (id === 'default') {
      setCurrentProfileState({ ...DEFAULT_BALLISTIC_PROFILE });
      return;
    }
    const found = savedProfiles.find((p) => p.id === id);
    if (found) setCurrentProfileState({ ...found });
  }, [savedProfiles]);

  const deleteSavedProfile = useCallback((id: string) => {
    setSavedProfiles((prev) => prev.filter((p) => p.id !== id));
    if (currentProfile.id === id) {
      setCurrentProfileState({ ...DEFAULT_BALLISTIC_PROFILE });
    }
  }, [currentProfile.id]);

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
