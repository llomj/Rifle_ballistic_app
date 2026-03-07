import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSound } from '../contexts/SoundContext';

interface SettingsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  view: 'hub' | 'quiz' | 'log' | 'glossary';
  randomMode?: boolean;
  anchorBottom?: boolean; // When true, menu opens near top-right (mobile-friendly placement)
  onToggleRandomMode?: () => void;
  onShowGlossary?: () => void;
  onShowMethods?: () => void;
  onShowFlags?: () => void;
  onShowFlow?: () => void;
  onShowIdSearch?: () => void;
  onShowIdLog?: () => void;
  onShowLearningLog?: () => void;
  onShowOperations?: () => void;
  onShowLevelSelector?: () => void;
  onShowWeakSpotDrills?: () => void;
  onShowPlatform?: () => void;
  onToggleLanguage?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
  hapticEnabled?: boolean;
  onToggleHaptic?: () => void;
  onResetApp?: () => void;
}

interface MenuItem {
  type: 'item' | 'rules' | 'toggle';
  icon?: string;
  label?: string;
  onClick?: () => void;
  active?: boolean;
  toggled?: boolean;
  subItems?: Array<{ icon: string; label: string; onClick: () => void }>;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  isOpen,
  onClose,
  view,
  randomMode = false,
  anchorBottom = false,
  onToggleRandomMode,
  onShowGlossary,
  onShowMethods,
  onShowFlags,
  onShowFlow,
  onShowIdSearch,
  onShowIdLog,
  onShowLearningLog,
  onShowOperations,
  onShowLevelSelector,
  onShowWeakSpotDrills,
  onShowPlatform,
  onToggleLanguage,
  soundEnabled = true,
  onToggleSound,
  hapticEnabled = true,
  onToggleHaptic,
  onResetApp
}) => {
  const { t, language } = useLanguage();
  const { playTapSound } = useSound();
  const [rulesExpanded, setRulesExpanded] = useState(false);

  useEffect(() => {
    if (!isOpen) setRulesExpanded(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const menuItems: MenuItem[] = [];

  // 1. Switch to random (TOP)
  if (onToggleRandomMode) {
    menuItems.push({
      type: 'item',
      icon: 'fa-shuffle',
      label: randomMode ? t('settings.switchToLevelMode') : t('settings.switchToRandomMode'),
      onClick: () => {
        onToggleRandomMode();
        onClose();
      }
    });
  }

  // 2. Select level (under switch to random)
  if (onShowLevelSelector) {
    menuItems.push({
      type: 'item',
      icon: 'fa-layer-group',
      label: t('settings.selectLevel'),
      onClick: () => {
        onShowLevelSelector();
        onClose();
      }
    });
  }

  // 3. Rules (expandable: Commands, Flags, Flow, Glossary, Operations & Math)
  if (onShowMethods || onShowFlags || onShowFlow || onShowGlossary || onShowOperations) {
    const rulesSubItems: Array<{ icon: string; label: string; onClick: () => void }> = [];
    if (onShowMethods) {
      rulesSubItems.push({
        icon: 'fa-code',
        label: t('app.methods'),
        onClick: () => { onShowMethods!(); onClose(); }
      });
    }
    if (onShowFlags) {
      rulesSubItems.push({
        icon: 'fa-flag',
        label: t('app.flags'),
        onClick: () => { onShowFlags!(); onClose(); }
      });
    }
    if (onShowFlow) {
      rulesSubItems.push({
        icon: 'fa-diagram-project',
        label: t('app.flow'),
        onClick: () => { onShowFlow(); onClose(); }
      });
    }
    if (onShowGlossary) {
      rulesSubItems.push({
        icon: 'fa-circle-info',
        label: t('app.glossary'),
        onClick: () => { onShowGlossary(); onClose(); }
      });
    }
    if (onShowOperations) {
      rulesSubItems.push({
        icon: 'fa-calculator',
        label: t('app.operations'),
        onClick: () => { onShowOperations(); onClose(); }
      });
    }
    if (onShowPlatform) {
      rulesSubItems.push({
        icon: 'fa-laptop',
        label: t('rules.platform'),
        onClick: () => { onShowPlatform(); onClose(); }
      });
    }
    if (onShowWeakSpotDrills) {
      rulesSubItems.push({
        icon: 'fa-bullseye',
        label: t('rules.weakSpotDrills'),
        onClick: () => { onShowWeakSpotDrills(); onClose(); }
      });
    }
    rulesSubItems.sort((a, b) => a.label.localeCompare(b.label, language));
    if (rulesSubItems.length > 0) {
      menuItems.push({
        type: 'rules',
        icon: 'fa-book',
        label: t('settings.rules'),
        subItems: rulesSubItems
      });
    }
  }

  // Search, ID Log, Learning Log — show in all views for consistent access
  if (onShowIdSearch) {
    menuItems.push({
      type: 'item',
      icon: 'fa-hashtag',
      label: t('settings.searchById'),
      onClick: () => { onShowIdSearch(); onClose(); }
    });
  }
  if (onShowIdLog) {
    menuItems.push({
      type: 'item',
      icon: 'fa-list',
      label: t('settings.idLog'),
      onClick: () => { onShowIdLog(); onClose(); }
    });
  }
  if (onShowLearningLog) {
    menuItems.push({
      type: 'item',
      icon: 'fa-book-open',
      label: t('app.learningLog'),
      onClick: () => { onShowLearningLog(); onClose(); },
      active: view === 'log'
    });
  }

  // Language
  if (onToggleLanguage) {
    menuItems.push({
      type: 'item',
      icon: 'fa-language',
      label: language === 'en' ? 'Français' : 'English',
      onClick: () => { onToggleLanguage(); onClose(); }
    });
  }

  // Sound (under Language)
  if (onToggleSound) {
    menuItems.push({
      type: 'toggle',
      icon: soundEnabled ? 'fa-volume-high' : 'fa-volume-xmark',
      label: t('settings.sound'),
      toggled: soundEnabled,
      onClick: () => { onToggleSound(); }
    });
  }
  // Haptic (under Sound)
  if (onToggleHaptic) {
    menuItems.push({
      type: 'toggle',
      icon: hapticEnabled ? 'fa-hand-pointer' : 'fa-hand',
      label: t('settings.haptic'),
      toggled: hapticEnabled,
      onClick: () => { onToggleHaptic(); }
    });
  }

  // Refresh app
  const basePath = typeof window !== 'undefined' ? (import.meta.env.BASE_URL || '/') : '/';
  menuItems.push({
    type: 'item',
    icon: 'fa-arrows-rotate',
    label: t('settings.refreshApp'),
    onClick: () => {
      onClose();
      window.location.href = `${basePath}clear-sw.html`;
    }
  });

  const renderItem = (item: MenuItem, index: number) => {
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
        <div className="glass rounded-2xl p-2 shadow-2xl border border-white/10 animate-in slide-in-from-top-2 duration-200 !bg-slate-900/[0.02]">
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
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
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
