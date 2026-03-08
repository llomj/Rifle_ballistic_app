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

export const CLICKS_INTERVAL_PRESETS = [10, 15, 20, 25, 30, 45, 50, 60, 100, 200, 300] as const;

interface BallisticSettingsState {
  measurement: MeasurementSystem;
  scopeUnit: ScopeUnit;
  clicksConfig: ClicksConfig;
  compassMode: boolean;
}

interface BallisticSettingsContextType {
  measurement: MeasurementSystem;
  scopeUnit: ScopeUnit;
  clicksConfig: ClicksConfig;
  compassMode: boolean;
  setMeasurement: (m: MeasurementSystem) => void;
  setScopeUnit: (u: ScopeUnit) => void;
  setClicksConfig: (c: Partial<ClicksConfig>) => void;
  setCompassMode: (on: boolean) => void;
}

const defaultState: BallisticSettingsState = {
  measurement: 'metric',
  scopeUnit: 'MIL',
  clicksConfig: DEFAULT_CLICKS_CONFIG,
  compassMode: false,
};

const BallisticSettingsContext = createContext<BallisticSettingsContextType | undefined>(undefined);

export const BallisticSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BallisticSettingsState>(() => {
    try {
      const raw = localStorage.getItem(BALLISTIC_SETTINGS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const measurement = parsed.measurement === 'imperial' || parsed.measurement === 'metric' ? parsed.measurement : defaultState.measurement;
        const scopeUnit = parsed.scopeUnit === 'MIL' || parsed.scopeUnit === 'MOA' ? parsed.scopeUnit : defaultState.scopeUnit;
        const clicksConfig: ClicksConfig = parsed.clicksConfig && typeof parsed.clicksConfig.minM === 'number' && typeof parsed.clicksConfig.maxM === 'number' && typeof parsed.clicksConfig.intervalM === 'number'
          ? {
              minM: Math.max(50, Math.min(200, Math.round(parsed.clicksConfig.minM))),
              maxM: Math.max(400, Math.min(1300, Math.round(parsed.clicksConfig.maxM))),
              intervalM: Math.max(5, Math.min(500, Math.round(parsed.clicksConfig.intervalM))),
            }
          : defaultState.clicksConfig;
        const compassMode = parsed.compassMode === true ? false : parsed.compassMode === true;
        return { measurement, scopeUnit, clicksConfig, compassMode };
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
      next.minM = Math.max(50, Math.min(200, Math.round(next.minM)));
      next.maxM = Math.max(400, Math.min(1300, Math.round(next.maxM)));
      next.intervalM = Math.max(5, Math.min(500, Math.round(next.intervalM)));
      return { ...prev, clicksConfig: next };
    });
  };

  const setCompassMode = (compassMode: boolean) => {
    setState((prev) => ({ ...prev, compassMode }));
  };

  return (
    <BallisticSettingsContext.Provider
      value={{
        measurement: state.measurement,
        scopeUnit: state.scopeUnit,
        clicksConfig: state.clicksConfig,
        compassMode: state.compassMode,
        setMeasurement,
        setScopeUnit,
        setClicksConfig,
        setCompassMode,
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
