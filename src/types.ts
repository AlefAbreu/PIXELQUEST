export type QuestionType = 'multiple_choice' | 'notebook';

export interface Question {
  id: string;
  type: QuestionType;
  contextText?: string; // Introductory text
  text: string;
  options?: string[]; // Only for multiple_choice
  correctAnswer?: string; // Only for multiple_choice
  hint?: string; // Only for multiple_choice
}

export interface AnswerRecord {
  questionId: string;
  questionText: string;
  type: QuestionType;
  userAnswer?: string;
  correctAnswer?: string;
  isCorrect: boolean;
  attempts: number;
  xpEarned: number;
  notebookGrade?: number;
}

export interface Level {
  id: string;
  title: string;
  questions: Question[];
  completed: boolean;
  grade?: string; // A+, B, etc.
  score?: number; // XP earned in this level
  maxScore?: number; // Max possible XP
  answers?: AnswerRecord[];
  teacherCorrected?: boolean;
  createdAt?: string;
}

export interface GameState {
  xp: number;
  levels: Level[];
  currentLevelId: string | null;
  status: 'map' | 'playing' | 'level_clear' | 'correction' | 'uploading' | 'professor_area';
}
