export interface Problem {
  type: 'convert' | 'true-false' | 'free-input';
  originalNumerator: number;
  originalDenominator: number;
  targetDenominator?: number;
  comparisonFraction?: {
    numerator: number;
    denominator: number;
  };
  correctAnswer: boolean | {
    numerator: number;
    denominator: number;
  };
}

export interface UserAnswer {
  problem: Problem;
  answer: boolean | {
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
  includeNonMultiples: boolean; // Whether to include problems where target denominator is not a multiple of original
  problemTypes: ('convert' | 'true-false' | 'free-input')[];
}