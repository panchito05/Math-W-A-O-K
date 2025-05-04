export interface Problem {
  type: 'identify' | 'true-false' | 'matching' | 'write';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
}

export interface UserAnswer {
  problem: Problem;
  answer: string | string[] | null;
  isCorrect: boolean;
  timeSpent: number;
  attemptsMade: number;
}

export interface Settings {
  difficulty: 1 | 2 | 3;
  problemCount: number;
  timeLimit: number;
  maxAttempts: number;
  adaptiveDifficulty: boolean;
  autoContinue: boolean;
  language: 'english' | 'spanish';
  problemTypes: ('identify' | 'true-false' | 'matching' | 'write')[];
}

export interface Fraction {
  numerator: number;
  denominator: number;
}

export interface MixedNumber {
  whole: number;
  numerator: number;
  denominator: number;
}

export type FractionType = 'proper' | 'improper' | 'mixed';