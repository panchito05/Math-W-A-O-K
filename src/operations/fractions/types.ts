export interface Fraction {
  numerator: number;
  denominator: number;
}

export interface Problem {
  fraction1: Fraction;
  fraction2: Fraction;
  operator: '+' | '-' | '×' | '÷';
  correctAnswer: Fraction;
}

export interface UserAnswer {
  problem: Problem;
  userAnswer: Fraction;
  isCorrect: boolean;
  timeSpent: number;
}

export interface Settings {
  difficulty: number;
  problemCount: number;
  timeLimit: number;
  operations: Array<'+' | '-' | '×' | '÷'>;
  adaptiveDifficulty: boolean;
  requireSimplifiedAnswers: boolean;
}