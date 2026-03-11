import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSound } from '../contexts/SoundContext';
import { useBallisticProfile } from '../contexts/BallisticProfileContext';
import { useBallisticSettings, type ThemeId } from '../contexts/BallisticSettingsContext';

export type BallisticTab = 'rifles' | 'ballistics' | 'targets' | 'environment';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  view: 'hub' | 'quiz' | 'log' | 'glossary';
  ballisticTab?: BallisticTab;
  onNavigateToBallistic?: (tab: BallisticTab) => void;
  onNavigateToProfile?: () => void;
  randomMode?: boolean;
  anchorBottom?: boolean; // When true, menu opens near top-right (mobile-friendly placement)
  onToggleRandomMode?: () => void;
  onShowGlossary?: () => void;
  onShowLearningLog?: () => void;
  onToggleLanguage?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  hapticEnabled?: boolean;
  onToggleHaptic?: () => void;
  compassEnabled?: boolean;
  onToggleCompass?: () => void;
  onResetApp?: () => void;
}

interface MenuItem {
  type: 'item' | 'rules' | 'users' | 'toggle' | 'divider' | 'customize' | 'settings';
  icon?: string;
  label?: string;
  onClick?: () => void;
  active?: boolean;
  toggled?: boolean;
  subItems?: Array<{ icon: string; label: string; onClick: () => void; active?: boolean }>;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isOpen,
  onClose,
  view,
  ballisticTab = 'ballistics',
  onNavigateToBallistic,
  onNavigateToProfile,
  randomMode = false,
  anchorBottom = false,
  onToggleRandomMode,
  onShowGlossary,
  onShowLearningLog,
  onToggleLanguage,
  soundEnabled = true,
  onToggleSound,
  hapticEnabled = true,
  onToggleHaptic,
  compassEnabled = false,
  onToggleCompass,
  onResetApp
}) => {
  const { t, language } = useLanguage();
  const { playTapSound } = useSound();
  const { currentProfile, savedProfiles, loadProfile, deleteSavedProfile } = useBallisticProfile();
  const { theme, setTheme } = useBallisticSettings();
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [usersExpanded, setUsersExpanded] = useState(false);
  const [customizeExpanded, setCustomizeExpanded] = useState(false);
  const [settingsExpanded, setSettingsExpanded] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setRulesExpanded(false);
      setUsersExpanded(false);
      setCustomizeExpanded(false);
      setSettingsExpanded(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const menuItems: MenuItem[] = [];

  // 0. Users — saved profiles (from main page Save). Shown on every view so menu is consistent.
  menuItems.push({ type: 'users' } as MenuItem);

  // 1. Customize — Profile, Ballistics, Environment. Shown on every view so menu is consistent.
  if (onNavigateToProfile || onNavigateToBallistic) {
    const customizeSubItems: Array<{ icon: string; label: string; onClick: () => void }> = [];
    if (onNavigateToProfile) {
      customizeSubItems.push({ icon: 'fa-user', label: t('settings.profile'), onClick: () => { onNavigateToProfile(); onClose(); } });
    }
    if (onNavigateToBallistic) {
      customizeSubItems.push(
        { icon: 'fa-bullseye', label: t('ballistic.tabBallistics'), onClick: () => { onNavigateToBallistic('ballistics'); onClose(); }, active: true },
        { icon: 'fa-wind', label: t('ballistic.tabEnvironment'), onClick: () => { onNavigateToBallistic('environment'); onClose(); } },
      );
    }
    menuItems.push({
      type: 'customize',
      icon: 'fa-sliders-h',
      label: t('settings.customize'),
      subItems: customizeSubItems,
    });
  }

  // Rules: Glossary only (rifle/ballistic terms)
  if (onShowGlossary) {
    menuItems.push({
      type: 'rules',
      icon: 'fa-book',
      label: t('settings.rules'),
      subItems: [{
        icon: 'fa-circle-info',
        label: t('app.glossary'),
        onClick: () => { onShowGlossary(); onClose(); }
      }]
    });
  }

  // Settings — Language, Sound, Haptic, Compass, Refresh (general app preferences)
  const hasSettings = onToggleLanguage || onToggleSound || onToggleHaptic || onToggleCompass;
  if (hasSettings) {
    menuItems.push({
      type: 'settings',
      icon: 'fa-gear',
      label: t('settings.settings'),
    } as MenuItem);
  }

  const renderItem = (item: MenuItem, index: number) => {
    if (item.type === 'divider') {
      return <div key={index} className="my-2 border-t border-white/10" />;
    }
    if (item.type === 'users') {
      return (
        <div key={index}>
          <button
            onClick={() => { playTapSound(); setUsersExpanded((prev) => !prev); }}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all text-left text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <i className="fas fa-users text-sm w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{t('settings.users')}</span>
            </div>
            <i className={`fas fa-chevron-down text-xs transition-transform ${usersExpanded ? 'rotate-180' : ''}`} />
          </button>
          {usersExpanded && (
            <div className="ml-4 pl-2 border-l border-white/10 mt-1 space-y-0.5 pb-2">
              {/* Default user — always shown, restores default metrics */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { playTapSound(); loadProfile('default'); onClose(); }}
                  className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentProfile.id === 'default'
                      ? 'bg-theme-accent-20 text-theme-accent border border-theme-accent-30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t('ballistic.defaultUser')}
                </button>
              </div>
              {savedProfiles.length === 0 ? null : (
                savedProfiles.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <button
                      onClick={() => { playTapSound(); loadProfile(p.id); onClose(); }}
                      className={`flex-1 text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentProfile.id === p.id
                          ? 'bg-theme-accent-20 text-theme-accent border border-theme-accent-30'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {p.userName}
                    </button>
                    <button
                      onClick={() => { playTapSound(); deleteSavedProfile(p.id); }}
                      className="p-2 text-slate-500 hover:text-red-400"
                      title={t('ballistic.delete')}
                      aria-label={t('ballistic.delete')}
                    >
                      <i className="fas fa-trash-alt text-xs" />
                    </button>
                  </div>
                ))
              )}
              <button
                onClick={() => { playTapSound(); loadProfile('default'); onClose(); }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-theme-accent-90 border border-dashed border-theme-accent-50 hover:bg-theme-accent-10 mt-1"
              >
                <i className="fas fa-plus text-xs" />
                {t('ballistic.addProfile')}
              </button>
            </div>
          )}
        </div>
      );
    }
    if (item.type === 'rules' && item.subItems && item.subItems.length > 0) {
      return (
        <div key={index}>
          <button
            onClick={() => { playTapSound(); setRulesExpanded(prev => !prev); }}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all text-left text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <i className={`fas ${item.icon} text-sm w-5 flex-shrink-0`}></i>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <i className={`fas fa-chevron-down text-xs transition-transform ${rulesExpanded ? 'rotate-180' : ''}`}></i>
          </button>
          {rulesExpanded && (
            <div className="ml-4 pl-2 border-l border-white/10 mt-1 space-y-0.5">
              {item.subItems.map((sub, i) => (
                <button
                  key={i}
                  onClick={() => { playTapSound(); sub.onClick(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <i className={`fas ${sub.icon} text-sm w-5 flex-shrink-0`}></i>
                  <span className="text-sm font-medium">{sub.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (item.type === 'customize' && item.subItems && item.subItems.length > 0) {
      return (
        <div key={index}>
          <button
            onClick={() => { playTapSound(); setCustomizeExpanded(prev => !prev); }}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all text-left text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <i className={`fas ${item.icon} text-sm w-5 flex-shrink-0`}></i>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <i className={`fas fa-chevron-down text-xs transition-transform ${customizeExpanded ? 'rotate-180' : ''}`}></i>
          </button>
          {customizeExpanded && (
            <div className="ml-4 pl-2 border-l border-white/10 mt-1 space-y-0.5">
              {item.subItems.map((sub, i) => (
                <button
                  key={i}
                  onClick={() => { playTapSound(); sub.onClick(); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left ${sub.active ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
                >
                  <i className={`fas ${sub.icon} text-sm w-5 flex-shrink-0`}></i>
                  <span className="text-sm font-medium">{sub.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (item.type === 'settings') {
      const basePath = typeof window !== 'undefined' ? (import.meta.env.BASE_URL || '/') : '/';
      return (
        <div key={index}>
          <button
            onClick={() => { playTapSound(); setSettingsExpanded(prev => !prev); }}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all text-left text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <i className={`fas ${item.icon} text-sm w-5 flex-shrink-0`}></i>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <i className={`fas fa-chevron-down text-xs transition-transform ${settingsExpanded ? 'rotate-180' : ''}`}></i>
          </button>
          {settingsExpanded && (
            <div className="ml-4 pl-2 border-l border-white/10 mt-1 space-y-0.5">
              {/* Theme: Yellow, Green, Blue, Magenta */}
              <div className="flex items-center gap-3 px-3 py-2.5">
                <i className="fas fa-palette text-sm w-5 flex-shrink-0 text-slate-400" />
                <span className="text-sm font-medium text-slate-400 shrink-0">{t('settings.theme')}</span>
                <div className="flex gap-1.5 flex-wrap">
                  {(['yellow', 'green', 'blue', 'magenta'] as const).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => { playTapSound(); setTheme(id); }}
                      className={`w-8 h-8 rounded-full border-2 transition-all shrink-0 ${
                        theme === id ? 'border-white scale-110' : 'border-white/30 hover:border-white/60'
                      }`}
                      style={{ backgroundColor: id === 'yellow' ? '#fbbf24' : id === 'green' ? '#34d399' : id === 'blue' ? '#38bdf8' : '#ff00ff' }}
                      title={t(`settings.theme${id.charAt(0).toUpperCase() + id.slice(1)}`)}
                      aria-label={t(`settings.theme${id.charAt(0).toUpperCase() + id.slice(1)}`)}
                    />
                  ))}
                </div>
              </div>
              {onToggleLanguage && (
                <button
                  onClick={() => { playTapSound(); onToggleLanguage(); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <i className="fas fa-language text-sm w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{language === 'en' ? t('settings.french') : t('settings.english')}</span>
                </button>
              )}
              {onToggleSound && (
                <button
                  onClick={() => { playTapSound(); onToggleSound(); }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all text-left text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    <i className={`fas ${soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark'} text-sm w-5 flex-shrink-0`} />
                    <span className="text-sm font-medium">{t('settings.sound')}</span>
                  </div>
                  <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${soundEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${soundEnabled ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </button>
              )}
              {onToggleHaptic && (
                <button
                  onClick={() => { playTapSound(); onToggleHaptic(); }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all text-left text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    <i className={`fas ${hapticEnabled ? 'fa-hand-pointer' : 'fa-hand'} text-sm w-5 flex-shrink-0`} />
                    <span className="text-sm font-medium">{t('settings.haptic')}</span>
                  </div>
                  <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${hapticEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${hapticEnabled ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </button>
              )}
              {onToggleCompass && (
                <button
                  onClick={() => { playTapSound(); onToggleCompass(); }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-all text-left text-slate-400 hover:bg-white/10 hover:text-white"
                >
                  <div className="flex items-center gap-3">
                    <i className="fas fa-compass text-sm w-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{t('settings.compass')}</span>
                  </div>
                  <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${compassEnabled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${compassEnabled ? 'left-5' : 'left-0.5'}`} />
                  </div>
                </button>
              )}
              <button
                onClick={() => { playTapSound(); onClose(); window.location.href = `${basePath}clear-sw.html`; }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <i className="fas fa-arrows-rotate text-sm w-5 flex-shrink-0" />
                <span className="text-sm font-medium">{t('settings.refreshApp')}</span>
              </button>
            </div>
          )}
        </div>
      );
    }
    if (item.type === 'toggle' && item.onClick) {
      return (
        <button
          key={index}
          onClick={() => { playTapSound(); item.onClick!(); }}
          className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all text-left text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <div className="flex items-center gap-3">
            <i className={`fas ${item.icon} text-sm w-5 flex-shrink-0`}></i>
            <span className="text-sm font-medium">{item.label}</span>
          </div>
          <div className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${item.toggled ? 'bg-emerald-500' : 'bg-slate-600'}`}>
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${item.toggled ? 'left-5' : 'left-0.5'}`} />
          </div>
        </button>
      );
    }
    if (item.type === 'item' && item.onClick) {
      return (
        <button
          key={index}
          onClick={() => { playTapSound(); item.onClick!(); }}
          className={`
            w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left
            ${item.active
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }
          `}
        >
          <i className={`fas ${item.icon} text-sm w-5 flex-shrink-0`}></i>
          <span className="text-sm font-medium">{item.label}</span>
        </button>
      );
    }
    return null;
  };

  return (
    <>
      {/* Backdrop - z-[110] so Settings stays above modals (z-[100]) */}
      <div
        className="fixed inset-0 z-[110]"
        onClick={onClose}
      />

      {/* Menu - near top-right on mobile, below trigger on desktop */}
      <div className={`z-[110] min-w-[200px] ${anchorBottom ? 'fixed top-[max(4rem,env(safe-area-inset-top))] right-4' : 'absolute top-full right-0 mt-2'}`}>
        <div className="glass rounded-2xl p-2 shadow-2xl border border-white/10 animate-in slide-in-from-top-2 duration-200 !bg-slate-900/[0.0009]">
          {menuItems.map((item, index) => renderItem(item, index))}

          {/* Reset App button - at bottom with warning styling */}
          {onResetApp && (
            <>
              <div className="my-2 border-t border-white/10" />
              <button
                onClick={() => {
                  playTapSound();
                  onResetApp?.();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-theme-accent hover:bg-theme-accent-10 hover:text-theme-accent"
              >
                <i className="fas fa-rotate-left text-sm w-5 flex-shrink-0"></i>
                <span className="text-sm font-medium">{t('settings.resetApp')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
