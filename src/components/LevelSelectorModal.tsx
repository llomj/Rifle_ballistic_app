import React from 'react';
import { LEVELS, PERSONA_EMOJI, getStarsFromAccuracy, getStarsFromRandomCorrect } from '../constants';
import { PersonaStage, RandomModeStats } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { formatTranslation } from '../translations';

interface LevelSelectorModalProps {
  currentLevel: number;
  highestUnlockedLevel: number;
  onSelectLevel: (level: number) => void;
  onClose: () => void;
  acquiredStars?: Record<number, number>;
  levelProgress?: Record<number, number>;
  correctPerLevel?: Record<number, number>;
  randomMode?: boolean;
  randomModeStats?: RandomModeStats;
}

export const LevelSelectorModal: React.FC<LevelSelectorModalProps> = ({
  currentLevel,
  highestUnlockedLevel,
  onSelectLevel,
  onClose,
  acquiredStars = {},
  levelProgress = {},
  correctPerLevel = {},
  randomMode = false,
  randomModeStats
}) => {
  const { t } = useLanguage();

  const handleLevelSelect = (level: number) => {
    if (level <= highestUnlockedLevel) {
      onSelectLevel(level);
      onClose();
    }
  };

  const getPersonaEmoji = (persona: PersonaStage): string =>
    PERSONA_EMOJI[persona] ?? '🐟';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in duration-300 shadow-2xl border border-white/10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-white flex items-center gap-3">
            <i className="fas fa-layer-group text-emerald-400"></i> {t('levelSelector.selectLevel')}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {LEVELS.map((levelInfo) => {
            const isLocked = levelInfo.level > highestUnlockedLevel;
            const isCurrent = levelInfo.level === currentLevel;
            const isUnlocked = levelInfo.level <= highestUnlockedLevel;
            const progress = levelProgress[levelInfo.level] || 0;
            const correct = correctPerLevel[levelInfo.level] || 0;
            const stars = acquiredStars[levelInfo.level] ?? getStarsFromAccuracy(correct, progress);

            return (
              <button
                key={levelInfo.level}
                onClick={() => handleLevelSelect(levelInfo.level)}
                disabled={isLocked}
                className={`
                  relative p-4 rounded-2xl border-2 transition-all
                  ${isCurrent
                    ? 'bg-emerald-500/20 border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : isUnlocked
                      ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer'
                      : 'bg-slate-800/50 border-slate-700/50 opacity-50 cursor-not-allowed'
                  }
                `}
              >
                {isLocked && (
                  <div className="absolute top-2 right-2 flex gap-1">
                    <i className="fas fa-lock text-slate-500 text-xs"></i>
                  </div>
                )}
                <div className="flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${isCurrent
                      ? 'bg-emerald-500'
                      : isUnlocked
                        ? 'bg-slate-700'
                        : 'bg-slate-800'
                    }`}>
                    <span className={isCurrent ? 'text-white' : isUnlocked ? 'text-slate-400' : 'text-slate-600'}>
                      {getPersonaEmoji(levelInfo.persona)}
                    </span>
                  </div>
                  {isUnlocked && (
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(starNum => (
                        <i
                          key={starNum}
                          className={`fas fa-star text-[9px] ${starNum <= stars ? 'text-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]' : 'text-slate-700/50'}`}
                        ></i>
                      ))}
                    </div>
                  )}
                  <div className="text-center">
                    <div className={`text-sm font-black ${isCurrent ? 'text-emerald-400' : isUnlocked ? 'text-white' : 'text-slate-500'
                      }`}>
                      {formatTranslation(t('levelSelector.level'), { level: levelInfo.level })}
                    </div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider mt-1 ${isCurrent ? 'text-emerald-300' : isUnlocked ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                      {levelInfo.persona}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {randomModeStats && (
          <div className="glass rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎲</span>
                <span className="font-bold text-white">{t('hub.randomModeLabel')}</span>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map(starNum => {
                  const randomStars = getStarsFromRandomCorrect(randomModeStats.totalCorrect);
                  return (
                    <i
                      key={starNum}
                      className={`fas fa-star text-[10px] ${starNum <= randomStars ? 'text-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]' : 'text-slate-700/50'}`}
                    ></i>
                  );
                })}
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              {t('stars.randomStarsHint')}
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-white/10 space-y-2">
          {randomMode && (
            <p className="text-xs text-emerald-400 text-center font-medium">
              {t('levelSelector.randomModeNote')}
            </p>
          )}
          <p className="text-xs text-slate-400 text-center">
            {currentLevel === highestUnlockedLevel
              ? formatTranslation(t('levelSelector.youAreOnLevel'), { level: currentLevel })
              : formatTranslation(t('levelSelector.currentLevelInfo'), { current: currentLevel, highest: highestUnlockedLevel })
            }
          </p>
        </div>
      </div>
    </div>
  );
};
