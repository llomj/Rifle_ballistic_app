import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { UserStats, PersonaStage, QuestionAttempt } from './types';
import { TadpoleIcon } from './components/TadpoleIcon';
import { EvolutionHub } from './components/EvolutionHub';
import { SettingsMenu } from './components/SettingsMenu';
import { IdLogEntry, IdLogRifle } from './types';
import { LEVELS, XP_PER_QUESTION, QUESTIONS_PER_LEVEL, getStarsFromProgress, getStarsFromAccuracy, getStarsFromRandomCorrect, getRandomModeScore, getPersonaFromRandomScore, PERSONA_EMOJI } from './constants';
import { useLanguage } from './contexts/LanguageContext';
import { useBallisticSettings } from './contexts/BallisticSettingsContext';
import { formatTranslation } from './translations';
import { playStarMelodyShort, playStarMelodyLong, playUITapSound, triggerHaptic } from './utils/sounds';
import { SoundProvider } from './contexts/SoundContext';

const LOCAL_STORAGE_KEY = 'cli_exercises_learn_stats_v1';
const SOUND_STORAGE_KEY = 'cli_exercises_sound_v1';
const HAPTIC_STORAGE_KEY = 'cli_exercises_haptic_v1';

const FallingStars: React.FC = () => {
  const stars = React.useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        left: `${5 + (i * 4.5)}%`,
        delay: `${(i % 5) * 0.4}s`,
        duration: `${2.2 + (i % 4) * 0.3}s`,
        size: 10 + (i % 6)
      })),
    []
  );
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute text-theme-accent animate-fall opacity-80"
          style={{
            left: s.left,
            animationDelay: s.delay,
            animationDuration: s.duration,
            fontSize: s.size,
            top: '-20px'
          }}
        >
          <i className="fas fa-star" />
        </div>
      ))}
    </div>
  );
};

const INITIAL_STATS: UserStats = {
  currentLevel: 0,
  xp: 0,
  totalAttempts: 0,
  completedQuestionIds: [],
  highestUnlockedLevel: 1,
  levelProgress: {},
  correctPerLevel: {},
  acquiredStars: {},
  history: [],
  idLog: [],
  idLogRifles: [{ id: 'default', name: 'Default (Tikka .300)' }],
  randomModeStats: { totalAnswered: 0, totalCorrect: 0 },
  randomMode: false
};

const QuizView = lazy(() => import('./components/QuizView').then((module) => ({ default: module.QuizView })));
const HistoryLog = lazy(() => import('./components/HistoryLog').then((module) => ({ default: module.HistoryLog })));
const GlossaryView = lazy(() => import('./components/GlossaryView').then((module) => ({ default: module.GlossaryView })));
const BallisticHub = lazy(() => import('./components/BallisticHub').then((m) => ({ default: m.BallisticHub })));
const FirstPageView = lazy(() => import('./components/FirstPageView').then((m) => ({ default: m.FirstPageView })));
const DistanceView = lazy(() => import('./components/DistanceView').then((m) => ({ default: m.DistanceView })));
const HeightView = lazy(() => import('./components/HeightView').then((m) => ({ default: m.HeightView })));
const ReferenceView = lazy(() => import('./components/ReferenceView').then((m) => ({ default: m.ReferenceView })));
const RifleScopeSection = lazy(() => import('./components/RifleScopeSection').then((m) => ({ default: m.RifleScopeSection })));
const ViewLoading: React.FC = () => (
  <div className="max-w-md mx-auto p-8 glass rounded-3xl text-center text-slate-400">
    <i className="fas fa-spinner fa-spin"></i>
  </div>
);

const App: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();
  const { compassMode, setCompassMode, theme } = useBallisticSettings();
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [view, setView] = useState<'hub' | 'quiz' | 'log' | 'glossary'>('hub');
  const [showResult, setShowResult] = useState<{
    score: number;
    total: number;
    starEarned: number | null;
    randomMode?: boolean;
    prevScore?: number;
    newScore?: number;
    newPersona?: PersonaStage;
  } | null>(null);
  const [randomizeTrigger, setRandomizeTrigger] = useState(0);
  const [showRandomModeModal, setShowRandomModeModal] = useState(false);
  const randomMode = stats.randomMode ?? false;
  const [drillLevels] = useState<number[] | null>(null);
  const [ballisticView, setBallisticView] = useState<'first' | 'hub' | 'ballistics' | 'distance' | 'height'>('first');
  const [ballisticTab, setBallisticTab] = useState<'rifles' | 'ballistics' | 'targets' | 'environment'>('ballistics');
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(SOUND_STORAGE_KEY) !== 'false';
  });
  const [hapticEnabled, setHapticEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(HAPTIC_STORAGE_KEY) !== 'false';
  });
  const lastSwipeNavRef = useRef(0);
  const SWIPE_COOLDOWN_MS = 600;

  const handleOpenCalculate = () => {
    if (Date.now() - lastSwipeNavRef.current < SWIPE_COOLDOWN_MS) return;
    lastSwipeNavRef.current = Date.now();
    setBallisticView('distance');
  };
  const handleBackToFirstPage = () => {
    if (Date.now() - lastSwipeNavRef.current < SWIPE_COOLDOWN_MS) return;
    lastSwipeNavRef.current = Date.now();
    setBallisticView('first');
  };

  useEffect(() => {
    localStorage.setItem(SOUND_STORAGE_KEY, String(soundEnabled));
  }, [soundEnabled]);
  useEffect(() => {
    localStorage.setItem(HAPTIC_STORAGE_KEY, String(hapticEnabled));
  }, [hapticEnabled]);

  const toggleSound = () => setSoundEnabled((prev) => !prev);
  const toggleHaptic = () => setHapticEnabled((prev) => !prev);

  const handleToggleCompass = () => {
    if (compassMode) {
      setCompassMode(false);
      return;
    }
    const req = typeof DeviceOrientationEvent !== 'undefined' && 'requestPermission' in DeviceOrientationEvent
      ? (DeviceOrientationEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission()
      : Promise.resolve('granted');
    req.then((result) => {
      if (result === 'granted') setCompassMode(true);
    }).catch(() => {});
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.history) parsed.history = [];
        if (!parsed.completedQuestionIds) parsed.completedQuestionIds = [];
        if (!parsed.idLog) parsed.idLog = [];
        if (!Array.isArray(parsed.idLogRifles)) parsed.idLogRifles = [];
        // Migration: ensure ID Log has a non-deletable default rifle (matches rifle profile default label)
        if (!parsed.idLogRifles.some((r: { id?: string }) => r?.id === 'default')) {
          parsed.idLogRifles = [{ id: 'default', name: 'Default (Tikka .300)' }, ...parsed.idLogRifles];
        }
        if (parsed.totalAttempts === undefined) parsed.totalAttempts = parsed.history.length || 0;
        // Migration: shift question IDs when Level 0 was added (old 1–3000 → 301–3300)
        const stateVersion = parsed.stateVersion ?? 0;
        if (stateVersion < 2 && Array.isArray(parsed.completedQuestionIds)) {
          parsed.completedQuestionIds = parsed.completedQuestionIds.map((id: number) =>
            id >= 1 && id <= 3000 ? id + 300 : id
          );
          parsed.stateVersion = 2;
        }
        // Migration: backfill correctPerLevel from levelProgress (assume 100% for legacy users)
        const levelProgress = parsed.levelProgress || {};
        if (!parsed.correctPerLevel) {
          parsed.correctPerLevel = {};
          for (const level of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
            const progress = levelProgress[level] || 0;
            if (progress > 0) parsed.correctPerLevel[level] = progress;
          }
        }
        // Migration: derive acquiredStars from correctPerLevel + levelProgress (accuracy-based)
        const correctPerLevel = parsed.correctPerLevel || {};
        const existingStars = parsed.acquiredStars || {};
        const migratedStars: Record<number, number> = { ...existingStars };
        for (const level of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
          const correct = correctPerLevel[level] || 0;
          const total = levelProgress[level] || 0;
          const derivedStars = getStarsFromAccuracy(correct, total);
          if (derivedStars > (existingStars[level] || 0)) {
            migratedStars[level] = derivedStars;
          }
        }
        parsed.acquiredStars = migratedStars;
        // Migration: Random mode stats for dual-mode progression
        if (!parsed.randomModeStats) {
          parsed.randomModeStats = { totalAnswered: 0, totalCorrect: 0 };
        }
        if (parsed.randomMode === undefined) parsed.randomMode = false;
        setStats(parsed);
      } catch (e) {
        console.error("Corrupted state, resetting", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    if (showResult?.starEarned) {
      if (soundEnabled) {
        if (showResult.starEarned === 5) void playStarMelodyLong();
        else void playStarMelodyShort();
      }
      if (hapticEnabled) {
        if (showResult.starEarned === 5) triggerHaptic([50, 30, 50, 30, 100]);
        else triggerHaptic(20);
      }
    }
  }, [showResult?.starEarned, soundEnabled, hapticEnabled]);

  const currentLevelInfo = LEVELS.find(l => l.level === stats.currentLevel) || LEVELS[0];
  const currentPersona = (stats.randomMode && stats.randomModeStats)
    ? getPersonaFromRandomScore(getRandomModeScore(stats.randomModeStats))
    : currentLevelInfo.persona;
  const currentProgress = stats.levelProgress[stats.currentLevel] || 0;

  const handleStartEvolution = () => {
    setView('quiz');
    setShowResult(null);
    setDrillLevels(null);
  };

  const handleRandomModeToggle = () => {
    if (!randomMode) {
      // Show modal to confirm random mode
      setShowRandomModeModal(true);
    } else {
      // Show modal to confirm going back to level mode
      setShowRandomModeModal(true);
    }
  };

  const confirmRandomMode = () => {
    setStats(prev => ({ ...prev, randomMode: true }));
    setShowRandomModeModal(false);
    setRandomizeTrigger(prev => prev + 1);
  };

  const confirmLevelMode = () => {
    setStats(prev => ({ ...prev, randomMode: false }));
    setShowRandomModeModal(false);
    setRandomizeTrigger(prev => prev + 1);
  };

  const confirmResetApp = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setStats(INITIAL_STATS);
    setView('hub');
    setBallisticView('first');
    setShowResetModal(false);
    setShowSettingsMenu(false);
    setShowResult(null);
    setRandomizeTrigger(prev => prev + 1);
  };

  const recordAttempt = (attempt: QuestionAttempt) => {
    setStats(prev => ({
      ...prev,
      totalAttempts: (prev.totalAttempts ?? 0) + 1,
      history: [attempt, ...prev.history].slice(0, 1000),
      completedQuestionIds: attempt.isCorrect && !prev.completedQuestionIds.includes(attempt.id)
        ? [...prev.completedQuestionIds, attempt.id]
        : prev.completedQuestionIds
    }));
  };

  const saveToIdLog = (entry: { id: number; question: string; correctAnswer: string; explanation: string }) => {
    const idLogEntry: IdLogEntry = {
      ...entry,
      timestamp: Date.now()
    };

    setStats(prev => ({
      ...prev,
      idLog: [idLogEntry, ...prev.idLog.filter(e => e.id !== entry.id)].slice(0, 1000)
    }));
  };

  const addIdLogRifle = (name: string, userName?: string) => {
    const id = `rifle-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setStats(prev => ({
      ...prev,
      idLogRifles: [...(prev.idLogRifles ?? []), { id, name: name.trim() || 'Rifle', userName: userName?.trim() || undefined }]
    }));
  };

  const setRifleUserName = (rifleId: string, userName: string) => {
    setStats(prev => ({
      ...prev,
      idLogRifles: (prev.idLogRifles ?? []).map(r => (r.id === rifleId ? { ...r, userName: userName.trim() || undefined } : r))
    }));
  };

  const removeIdLogRifle = (rifleId: string) => {
    if (rifleId === 'default') return;
    setStats(prev => ({
      ...prev,
      idLogRifles: (prev.idLogRifles ?? []).filter(r => r.id !== rifleId),
      idLog: prev.idLog.map(e => (e.rifleId === rifleId ? { ...e, rifleId: undefined } : e))
    }));
  };

  const renameIdLogRifle = (rifleId: string, name: string) => {
    setStats(prev => ({
      ...prev,
      idLogRifles: (prev.idLogRifles ?? []).map(r => (r.id === rifleId ? { ...r, name: name.trim() || r.name } : r))
    }));
  };

  const setEntryRifle = (entryId: number, entryTimestamp: number, rifleId: string | undefined) => {
    setStats(prev => ({
      ...prev,
      idLog: prev.idLog.map(e =>
        e.id === entryId && e.timestamp === entryTimestamp ? { ...e, rifleId } : e
      )
    }));
  };

  const handleQuizComplete = (score: number) => {
    const total = 15;
    const xpGained = score * XP_PER_QUESTION;

    if (randomMode) {
      // Random mode: update randomModeStats only; levelProgress unchanged
      setStats(prev => {
        const newXp = prev.xp + xpGained;
        const rm = prev.randomModeStats ?? { totalAnswered: 0, totalCorrect: 0 };
        const newTotalAnswered = rm.totalAnswered + total;
        const newTotalCorrect = rm.totalCorrect + score;
        const newRm = {
          ...rm,
          totalAnswered: newTotalAnswered,
          totalCorrect: newTotalCorrect,
          lastSessionScore: score,
          lastSessionTotal: total
        };
        const prevScore = getRandomModeScore(rm);
        const newScore = getRandomModeScore(newRm);
        return {
          ...prev,
          xp: newXp,
          randomModeStats: newRm,
          lastSessionScore: score,
          lastSessionTotal: total
        };
      });

      const rm = stats.randomModeStats ?? { totalAnswered: 0, totalCorrect: 0 };
      const prevScore = getRandomModeScore(rm);
      const newTotalCorrect = rm.totalCorrect + score;
      const prevStars = getStarsFromRandomCorrect(rm.totalCorrect);
      const newStars = getStarsFromRandomCorrect(newTotalCorrect);
      const starEarned = newStars > prevStars ? newStars : null;
      const newScore = Math.floor(newTotalCorrect * (newTotalCorrect / (rm.totalAnswered + total)));

      setShowResult({
        score,
        total,
        starEarned,
        randomMode: true,
        prevScore,
        newScore,
        newPersona: getPersonaFromRandomScore(newScore)
      });
    } else {
      // Level mode: update levelProgress, correctPerLevel, stars, currentLevel
      setStats(prev => {
        const newXp = prev.xp + xpGained;
        const currentLevelProgress = prev.levelProgress[prev.currentLevel] || 0;
        const newLevelProgress = Math.min(QUESTIONS_PER_LEVEL, currentLevelProgress + total);
        const currentCorrect = prev.correctPerLevel?.[prev.currentLevel] || 0;
        const newCorrect = currentCorrect + score;

        const updatedLevelProgress = {
          ...prev.levelProgress,
          [prev.currentLevel]: newLevelProgress
        };

        const updatedCorrectPerLevel = {
          ...(prev.correctPerLevel || {}),
          [prev.currentLevel]: newCorrect
        };

        const currentStars = prev.acquiredStars?.[prev.currentLevel] || 0;
        const newStars = Math.max(currentStars, getStarsFromAccuracy(newCorrect, newLevelProgress));

        const updatedAcquiredStars = {
          ...(prev.acquiredStars || {}),
          [prev.currentLevel]: Math.max(currentStars, newStars)
        };

        let newLevel = prev.currentLevel;
        if (newLevelProgress >= QUESTIONS_PER_LEVEL && newLevel < 10) {
          newLevel += 1;
        }

        return {
          ...prev,
          xp: newXp,
          currentLevel: newLevel,
          highestUnlockedLevel: Math.max(prev.highestUnlockedLevel, newLevel),
          levelProgress: updatedLevelProgress,
          correctPerLevel: updatedCorrectPerLevel,
          acquiredStars: updatedAcquiredStars,
          lastSessionScore: score,
          lastSessionTotal: total
        };
      });

      const currentLevelProgress = stats.levelProgress[stats.currentLevel] || 0;
      const currentCorrect = stats.correctPerLevel?.[stats.currentLevel] || 0;
      const newLevelProgress = Math.min(QUESTIONS_PER_LEVEL, currentLevelProgress + total);
      const newCorrect = currentCorrect + score;
      const currentStars = stats.acquiredStars?.[stats.currentLevel] || 0;
      const newStars = Math.max(currentStars, getStarsFromAccuracy(newCorrect, newLevelProgress));
      const starEarned = newStars > currentStars ? newStars : null;

      setShowResult({ score, total, starEarned });
    }

    setView('hub');
  };

  return (
    <SoundProvider soundEnabled={soundEnabled} onPlay={() => void playUITapSound()}>
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30 pb-28 pt-[env(safe-area-inset-top)]" data-theme={theme}>
      {/* Settings at bottom centre */}
      <div className="fixed bottom-0 left-0 right-0 z-[110] flex justify-center pb-[max(2rem,env(safe-area-inset-bottom))] pt-2 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none">
        <button
          onClick={() => {
            if (soundEnabled) void playUITapSound();
            setShowSettingsMenu(!showSettingsMenu);
          }}
          className="w-16 h-16 flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all shadow-lg min-w-[64px] min-h-[64px] pointer-events-auto"
          title={t('settings.settings')}
        >
          <i className="fas fa-gear text-xl"></i>
        </button>
      </div>
      <SettingsMenu
        isOpen={showSettingsMenu}
        onClose={() => setShowSettingsMenu(false)}
        view={view}
        anchorBottom
          ballisticTab={ballisticTab}
          onNavigateToBallistic={(tab) => {
            setView('hub');
            setBallisticView(tab === 'ballistics' ? 'ballistics' : 'hub');
            setBallisticTab(tab);
            setShowSettingsMenu(false);
          }}
          onNavigateToProfile={() => {
            setView('hub');
            setBallisticView('hub');
            setShowSettingsMenu(false);
          }}
          randomMode={randomMode}
          onToggleRandomMode={view === 'hub' || view === 'quiz' ? handleRandomModeToggle : undefined}
          onShowGlossary={() => setView('glossary')}
          onShowLearningLog={() => setView('log')}
          onToggleLanguage={toggleLanguage}
          soundEnabled={soundEnabled}
          onToggleSound={toggleSound}
          hapticEnabled={hapticEnabled}
          onToggleHaptic={toggleHaptic}
          compassEnabled={compassMode}
          onToggleCompass={handleToggleCompass}
          onResetApp={() => setShowResetModal(true)}
      />

      <main className="container mx-auto px-4 py-1 max-w-4xl min-h-[calc(100dvh-160px)]">
        {view === 'quiz' ? (
          <Suspense fallback={<ViewLoading />}>
            <QuizView
              level={stats.currentLevel}
              currentProgress={currentProgress}
              levelStars={randomMode ? getStarsFromRandomCorrect(stats.randomModeStats?.totalCorrect ?? 0) : currentProgress === 0 ? 0 : (stats.acquiredStars?.[stats.currentLevel] ?? getStarsFromAccuracy(stats.correctPerLevel?.[stats.currentLevel] ?? 0, currentProgress))}
              completedIds={stats.completedQuestionIds}
              drillLevels={drillLevels ?? undefined}
              onAttempt={recordAttempt}
              onComplete={(score) => {
                handleQuizComplete(score);
                setDrillLevels(null);
              }}
              onExit={() => setView('hub')}
              randomizeTrigger={randomizeTrigger}
              randomMode={randomMode}
              randomModeStats={stats.randomModeStats}
              onSaveToIdLog={saveToIdLog}
              savedIdLogIds={stats.idLog.map(entry => entry.id)}
              soundEnabled={soundEnabled}
              hapticEnabled={hapticEnabled}
            />
          </Suspense>
        ) : view === 'log' ? (
          <Suspense fallback={<ViewLoading />}>
            <HistoryLog history={stats.history} onBack={() => setView('hub')} />
          </Suspense>
        ) : view === 'glossary' ? (
          <Suspense fallback={<ViewLoading />}>
            <GlossaryView onBack={() => setView('hub')} />
          </Suspense>
        ) : showResult ? (
          <div className="max-w-md mx-auto p-10 glass rounded-3xl text-center space-y-6 animate-in zoom-in duration-500 shadow-2xl relative overflow-hidden">
            {showResult.starEarned === 5 && (
              <FallingStars />
            )}
            {showResult.starEarned && showResult.starEarned < 5 && (
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-theme-accent-10 animate-pulse"></div>
              </div>
            )}

            {showResult.starEarned ? (
              <div className="w-28 h-28 rounded-full bg-theme-accent-20 text-theme-accent flex items-center justify-center text-6xl mx-auto shadow-theme-accent-10 border border-theme-accent-50 relative">
                <i className="fas fa-star animate-[spin_4s_linear_infinite]"></i>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center border-2 border-theme-accent text-lg font-black text-theme-accent z-10">
                  {showResult.starEarned}
                </div>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center text-5xl mx-auto shadow-2xl shadow-emerald-500/20 border border-emerald-500/30">
                <i className="fas fa-arrow-up-right-dots"></i>
              </div>
            )}

            <div className="relative z-10">
              {showResult.starEarned ? (
                <>
                  <h2 className="text-3xl font-black mb-2 text-theme-accent bg-clip-text">{t('stars.starEarned')}</h2>
                  <p className="text-slate-300">
                    {formatTranslation(t('stars.youEarnedStars'), { count: showResult.starEarned })}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-3xl font-bold mb-2">{t('result.mutationsComplete')}</h2>
                  <p className="text-slate-400">{formatTranslation(t('result.geneticsStabilized'), { score: showResult.score })}</p>
                </>
              )}
            </div>

            <div className="py-4 px-6 bg-white/5 rounded-2xl flex flex-wrap justify-around gap-4 border border-white/5 relative z-10">
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold mb-1 tracking-wider">{t('result.evolutionGain')}</div>
                <div className="text-2xl font-black text-theme-accent">+{showResult.score * XP_PER_QUESTION} XP</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 uppercase font-bold mb-1 tracking-wider">{t('result.successRate')}</div>
                <div className="text-2xl font-black text-sky-400">{Math.round((showResult.score / showResult.total) * 100)}%</div>
              </div>
              {showResult.randomMode && showResult.prevScore !== undefined && showResult.newScore !== undefined && showResult.newPersona && (
                <div className="w-full mt-2 pt-2 border-t border-white/10">
                  <div className="text-xs text-slate-500 uppercase font-bold mb-1 tracking-wider">{t('result.evolutionScore')}</div>
                  <div className="text-lg font-black text-emerald-400">
                    {showResult.prevScore} → {showResult.newScore} <span className="text-slate-400 font-normal">({showResult.newPersona})</span>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => { if (soundEnabled) void playUITapSound(); setShowResult(null); }}
              className={`w-full py-4 rounded-2xl font-bold text-white transition-all transform active:scale-95 shadow-xl relative z-10 ${showResult.starEarned
                  ? 'bg-theme-accent hover:bg-theme-accent-dark shadow-theme-accent-30 text-theme-accent-contrast text-lg'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
                }`}
            >
              {showResult.starEarned ? t('subLevels.continueEvolution') : t('result.backToHub')}
            </button>
          </div>
        ) : ballisticView === 'first' ? (
          <Suspense fallback={<ViewLoading />}>
            <FirstPageView
              onOpenHub={() => setBallisticView('hub')}
              onOpenCalculate={handleOpenCalculate}
            />
          </Suspense>
        ) : ballisticView === 'ballistics' ? (
          <Suspense fallback={<ViewLoading />}>
            <ReferenceView onBack={() => setBallisticView('first')} />
          </Suspense>
        ) : ballisticView === 'distance' ? (
          <Suspense fallback={<ViewLoading />}>
            <DistanceView
              onBack={() => setBallisticView('hub')}
              onSwitchToHeight={() => setBallisticView('height')}
              onBackToFirstPage={handleBackToFirstPage}
            />
          </Suspense>
        ) : ballisticView === 'height' ? (
          <Suspense fallback={<ViewLoading />}>
            <HeightView
              onBack={() => setBallisticView('hub')}
              onSwitchToDistance={() => setBallisticView('distance')}
              onBackToFirstPage={handleBackToFirstPage}
            />
          </Suspense>
        ) : (
          <Suspense fallback={<ViewLoading />}>
            <BallisticHub
              onOpenBallistics={() => setBallisticView('ballistics')}
              onBackToFirstPage={() => setBallisticView('first')}
            />
          </Suspense>
        )}
      </main>

      <footer className="mt-auto border-t border-white/5 p-8 text-center text-slate-600 text-sm">
        <p>{t('footer.copyright')}</p>
        <p className="mt-1 text-[10px] text-slate-700">SW v15</p>
      </footer>

      {/* Reset App Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
<div className="glass rounded-3xl p-8 max-w-md w-full space-y-6 animate-in zoom-in duration-300 shadow-2xl border border-theme-accent-20">
          <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl bg-theme-accent-20 text-theme-accent">
                <i className="fas fa-triangle-exclamation"></i>
              </div>
              <h2 className="text-2xl font-black text-white">
                {t('resetModal.title')}
              </h2>
              <p className="text-slate-400 leading-relaxed">
                {t('resetModal.warning')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { if (soundEnabled) void playUITapSound(); setShowResetModal(false); }}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-white transition-all border border-white/10"
              >
                {t('resetModal.cancel')}
              </button>
              <button
                onClick={() => { if (soundEnabled) void playUITapSound(); confirmResetApp(); }}
                className="flex-1 py-3 bg-theme-accent hover:bg-theme-accent-dark rounded-xl font-bold text-theme-accent-contrast transition-all shadow-xl shadow-theme-accent-30"
              >
                {t('resetModal.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Random Mode Confirmation Modal */}
      {showRandomModeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass rounded-3xl p-8 max-w-md w-full space-y-6 animate-in zoom-in duration-300 shadow-2xl border border-white/10">
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-3xl ${randomMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-green-500/20 text-green-400'
                }`}>
                <i className={`fas ${randomMode ? 'fa-layer-group' : 'fa-shuffle'}`}></i>
              </div>
              <h2 className="text-2xl font-black text-white">
                {randomMode ? t('randomMode.switchToLevel') : t('randomMode.switchToRandom')}
              </h2>
              <p className="text-slate-400 leading-relaxed">
                {randomMode ? t('randomMode.levelModeDesc') : t('randomMode.randomModeDesc')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { if (soundEnabled) void playUITapSound(); setShowRandomModeModal(false); }}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold text-white transition-all border border-white/10"
              >
                {t('randomMode.cancel')}
              </button>
              <button
                onClick={() => { if (soundEnabled) void playUITapSound(); (randomMode ? confirmLevelMode : confirmRandomMode)(); }}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition-all ${randomMode
                  ? 'bg-emerald-500 hover:bg-emerald-600 shadow-xl shadow-emerald-500/30'
                  : 'bg-green-500 hover:bg-green-600 shadow-xl shadow-green-500/30'
                  }`}
              >
                {randomMode ? t('randomMode.levelMode') : t('randomMode.randomMode')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </SoundProvider>
  );
};

export default App;
