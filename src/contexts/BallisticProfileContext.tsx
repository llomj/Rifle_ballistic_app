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
    return parsed.filter(
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
      if (prev.id !== 'default') {
        setSavedProfiles((list) =>
          list.map((p) =>
            p.id === prev.id
              ? { ...next, id: prev.id, userName: prev.userName, createdAt: p.createdAt }
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
