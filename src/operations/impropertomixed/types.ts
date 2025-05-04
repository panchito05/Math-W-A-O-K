export interface Problem {
  numerator: number;
  denominator: number;
  correctAnswer: {
    whole: number;
    numerator: number;
    denominator: number;
  };
}

export interface UserAnswer {
  problem: Problem;
  answer: {
    whole: number;
    numerator: number;
    denominator: number;
  } | null;
  isCorrect: boolean;
  wasRevealed: boolean;
  timeSpent: number;
  attemptsMade: number;
}

export interface Settings {
  difficulty: 1 | 2 | 3;
  problemCount: number;
  timeLimit: number;
  maxAttempts: number;
  adaptiveDifficulty: boolean;
  enableCompensation: boolean;
  autoContinue: boolean;
  language: 'english' | 'spanish';
  requireSimplifiedForm: boolean;
}