import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { ScopeUnit } from '../data/ballistic';
import { BALLISTIC_SETTINGS_STORAGE_KEY } from '../data/ballistic';

export type MeasurementSystem = 'metric' | 'imperial';

export interface ClicksConfig {
  minM: number;
  maxM: number;
  intervalM: number;
}

export const DEFAULT_CLICKS_CONFIG: ClicksConfig = {
  minM: 100,
  maxM: 800,
  intervalM: 50,
};

export const CLICKS_INTERVAL_PRESETS = [10, 15, 20, 25, 30, 33, 45, 50, 60, 66, 100, 150, 200, 300] as const;

export type ThemeId = 'yellow' | 'green' | 'blue' | 'magenta';

export interface MildotConfig {
  /** Animal id from MILDOT_ANIMALS (e.g. 'deer'). */
  animalId: string;
  /** Human shoulder height (feet to shoulders) in meters for mildot table. */
  humanHeightM: number;
  /** Preset label for human height: 'small' | 'average' | 'tall' | 'custom'. */
  humanPreset: 'small' | 'average' | 'tall' | 'custom';
  /** Selected steel plate id from MILDOT_STEEL_PLATES. */
  plateId: string;
  /** Steel plate height (m). */
  plateHeightM: number;
}

export const DEFAULT_MILDOT_CONFIG: MildotConfig = {
  animalId: 'deer',
  humanHeightM: 1.4,
  humanPreset: 'average',
  plateId: 'plate30cm',
  plateHeightM: 0.3,
};

interface BallisticSettingsState {
  measurement: MeasurementSystem;
  scopeUnit: ScopeUnit;
  clicksConfig: ClicksConfig;
  mildotConfig: MildotConfig;
  compassMode: boolean;
  elevationEnabled: boolean;
  theme: ThemeId;
}

export interface ElevationData {
  altitudeM: number | null;
  error: string | null;
}

interface BallisticSettingsContextType {
  measurement: MeasurementSystem;
  scopeUnit: ScopeUnit;
  clicksConfig: ClicksConfig;
  mildotConfig: MildotConfig;
  compassMode: boolean;
  elevationEnabled: boolean;
  elevationData: ElevationData;
  theme: ThemeId;
  setMeasurement: (m: MeasurementSystem) => void;
  setScopeUnit: (u: ScopeUnit) => void;
  setClicksConfig: (c: Partial<ClicksConfig>) => void;
  setMildotConfig: (c: Partial<MildotConfig>) => void;
  setCompassMode: (on: boolean) => void;
  setElevationEnabled: (on: boolean) => void;
  setElevationData: (data: ElevationData) => void;
  setTheme: (t: ThemeId) => void;
}

const defaultState: BallisticSettingsState = {
  measurement: 'metric',
  scopeUnit: 'MIL',
  clicksConfig: DEFAULT_CLICKS_CONFIG,
  mildotConfig: DEFAULT_MILDOT_CONFIG,
  compassMode: true,
  elevationEnabled: false,
  theme: 'yellow',
};

const BallisticSettingsContext = createContext<BallisticSettingsContextType | undefined>(undefined);

export const BallisticSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [elevationData, setElevationData] = useState<ElevationData>({ altitudeM: null, error: null });
  const [state, setState] = useState<BallisticSettingsState>(() => {
    try {
      const raw = localStorage.getItem(BALLISTIC_SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const measurement = parsed.measurement === 'imperial' || parsed.measurement === 'metric' ? parsed.measurement : defaultState.measurement;
        const scopeUnit = parsed.scopeUnit === 'MIL' || parsed.scopeUnit === 'MOA' ? parsed.scopeUnit : defaultState.scopeUnit;
        const clicksConfig: ClicksConfig = parsed.clicksConfig && typeof parsed.clicksConfig.minM === 'number' && typeof parsed.clicksConfig.maxM === 'number' && typeof parsed.clicksConfig.intervalM === 'number'
          ? {
              minM: Math.max(0, Math.min(10000, parsed.clicksConfig.minM)),
              maxM: Math.max(1, Math.min(10000, parsed.clicksConfig.maxM)),
              intervalM: Math.max(1, Math.min(5000, parsed.clicksConfig.intervalM)),
            }
          : defaultState.clicksConfig;
        const compassMode = parsed.compassMode === true || parsed.compassMode === false ? parsed.compassMode : defaultState.compassMode;
        const elevationEnabled = parsed.elevationEnabled === true || parsed.elevationEnabled === false ? parsed.elevationEnabled : defaultState.elevationEnabled;
        const theme = ['yellow', 'green', 'blue', 'magenta'].includes(parsed.theme) ? parsed.theme : defaultState.theme;
        const mildotConfig: MildotConfig = parsed.mildotConfig && typeof parsed.mildotConfig.animalId === 'string' && typeof parsed.mildotConfig.humanHeightM === 'number'
          ? {
              animalId: parsed.mildotConfig.animalId,
              humanHeightM: Math.max(0.2, Math.min(2.5, parsed.mildotConfig.humanHeightM)),
              humanPreset:
                parsed.mildotConfig.humanPreset === 'small' ||
                parsed.mildotConfig.humanPreset === 'average' ||
                parsed.mildotConfig.humanPreset === 'tall' ||
                parsed.mildotConfig.humanPreset === 'custom'
                  ? parsed.mildotConfig.humanPreset
                  : 'custom',
              plateId: typeof parsed.mildotConfig.plateId === 'string' ? parsed.mildotConfig.plateId : defaultState.mildotConfig.plateId,
              plateHeightM:
                typeof parsed.mildotConfig.plateHeightM === 'number'
                  ? Math.max(0.05, Math.min(2.0, parsed.mildotConfig.plateHeightM))
                  : defaultState.mildotConfig.plateHeightM,
            }
          : defaultState.mildotConfig;
        return { measurement, scopeUnit, clicksConfig, mildotConfig, compassMode, elevationEnabled, theme };
      }
    } catch (_) {}
    return defaultState;
  });

  useEffect(() => {
    try {
      localStorage.setItem(BALLISTIC_SETTINGS_STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }, [state]);

  const setMeasurement = (measurement: MeasurementSystem) => {
    setState((prev) => ({ ...prev, measurement }));
  };
  const setScopeUnit = (scopeUnit: ScopeUnit) => {
    setState((prev) => ({ ...prev, scopeUnit }));
  };

  const setClicksConfig = (partial: Partial<ClicksConfig>) => {
    setState((prev) => {
      const next = { ...prev.clicksConfig, ...partial };
      next.minM = Math.max(0, Math.min(10000, next.minM));
      next.maxM = Math.max(1, Math.min(10000, next.maxM));
      next.intervalM = Math.max(1, Math.min(5000, next.intervalM));
      if (next.maxM < next.minM) next.maxM = next.minM;
      return { ...prev, clicksConfig: next };
    });
  };

  const setMildotConfig = (partial: Partial<MildotConfig>) => {
    setState((prev) => {
      const next = { ...prev.mildotConfig, ...partial };
      if (next.humanHeightM != null) next.humanHeightM = Math.max(0.2, Math.min(2.5, next.humanHeightM));
      if (next.plateHeightM != null) next.plateHeightM = Math.max(0.05, Math.min(2.0, next.plateHeightM));
      return { ...prev, mildotConfig: next };
    });
  };

  const setCompassMode = (compassMode: boolean) => {
    setState((prev) => ({ ...prev, compassMode }));
  };
  const setElevationEnabled = (elevationEnabled: boolean) => {
    setState((prev) => ({ ...prev, elevationEnabled }));
  };
  const setTheme = (theme: ThemeId) => {
    setState((prev) => ({ ...prev, theme }));
  };

  // When elevation is enabled, get altitude from device GPS (works offline).
  useEffect(() => {
    if (!state.elevationEnabled) {
      setElevationData({ altitudeM: null, error: null });
      return;
    }
    if (!navigator.geolocation) {
      setElevationData({ altitudeM: null, error: 'Unavailable' });
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const alt = pos.coords.altitude;
        setElevationData({
          altitudeM: typeof alt === 'number' && !Number.isNaN(alt) ? alt : null,
          error: null,
        });
      },
      (err) => {
        const msg =
          err.code === 1 ? 'Permission denied' :
          err.code === 2 ? 'Position unavailable' :
          err.code === 3 ? 'Timeout' : 'Error';
        setElevationData({ altitudeM: null, error: msg });
      },
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [state.elevationEnabled]);

  return (
    <BallisticSettingsContext.Provider
      value={{
        measurement: state.measurement,
        scopeUnit: state.scopeUnit,
        clicksConfig: state.clicksConfig,
        mildotConfig: state.mildotConfig,
        compassMode: state.compassMode,
        elevationEnabled: state.elevationEnabled,
        elevationData,
        theme: state.theme,
        setMeasurement,
        setScopeUnit,
        setClicksConfig,
        setMildotConfig,
        setCompassMode,
        setElevationEnabled,
        setElevationData,
        setTheme,
      }}
    >
      {children}
    </BallisticSettingsContext.Provider>
  );
};

export const useBallisticSettings = () => {
  const ctx = useContext(BallisticSettingsContext);
  if (ctx === undefined) {
    throw new Error('useBallisticSettings must be used within BallisticSettingsProvider');
  }
  return ctx;
};
