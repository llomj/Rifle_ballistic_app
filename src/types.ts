export enum SubLevel {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  EXPERT = "Expert"
}

export type QuestionFormat = 'standard' | 'output' | 'bug' | 'blank';

export interface Question {
  id: number;
  level: number;
  persona_stage: string;
  concept: string;
  difficulty: number;
  question: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
  detailedExplanation?: string; // Optional detailed, verbose explanation for learning (fallback for all levels)
  /** Beginner-level explanation (simpler). Falls back to detailedExplanation if absent. */
  detailedExplanationBeginner?: string;
  /** Intermediate-level explanation. Falls back to detailedExplanation if absent. */
  detailedExplanationIntermediate?: string;
  /** Expert-level explanation (very in-depth). Falls back to detailedExplanation if absent. */
  detailedExplanationExpert?: string;
  subLevel?: SubLevel; // Optional for backwards compatibility, required for new questions
  questionFormat?: QuestionFormat; // Optional for new formats
}

export interface QuestionAttempt {
  id: number;
  question: string;
  selectedOption: string;
  correctOption: string;
  isCorrect: boolean;
  explanation: string;
  level: number;
  timestamp: number;
}

export enum PersonaStage {
  TADPOLE = "Tadpole",
  PLANKTON = "Plankton",
  SHRIMP = "Shrimp",
  CRAB = "Crab",
  SMALL_FISH = "Small Fish",
  OCTOPUS = "Octopus",
  SEAL = "Seal",
  DOLPHIN = "Dolphin",
  SHARK = "Shark",
  WHALE = "Whale",
  GOD_WHALE = "God Whale"
}

/** Named rifle profile for ID Log (user can register and name rifles). */
export interface IdLogRifle {
  id: string;
  name: string;
}

export interface IdLogEntry {
  id: number;
  question: string;
  correctAnswer: string;
  explanation: string;
  timestamp: number;
  /** Optional: link to a named rifle in idLogRifles. */
  rifleId?: string;
}

export interface RandomModeStats {
  totalAnswered: number;
  totalCorrect: number;
  lastSessionScore?: number;
  lastSessionTotal?: number;
}

export interface UserStats {
  currentLevel: number;
  xp: number;
  totalAttempts?: number;
  completedQuestionIds: number[];
  highestUnlockedLevel: number;
  levelProgress: Record<number, number>;
  history: QuestionAttempt[];
  idLog: IdLogEntry[];
  /** Named rifles for ID Log (user-registered, each with a name). */
  idLogRifles?: IdLogRifle[];
  lastSessionScore?: number;
  lastSessionTotal?: number;
  acquiredStars?: Record<number, number>; // Maps level ID to number of stars (1–5) based on accuracy
  correctPerLevel?: Record<number, number>; // Correct answers per level, for accuracy-based stars
  randomModeStats?: RandomModeStats;
  randomMode?: boolean; // Persisted preference: Level vs Random mode
  stateVersion?: number; // For migrations (e.g. question ID shift when adding Level 0)
}

export interface LevelInfo {
  level: number;
  persona: PersonaStage;
  concepts: string[];
  description: string;
  color: string;
}
