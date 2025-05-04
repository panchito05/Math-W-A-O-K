export interface Problem {
  expression: string;        // The mathematical expression to solve
  solution: number;          // The correct numerical answer
  steps: string[];           // Step-by-step solution explanation
  difficultyLevel: number;   // Difficulty level (1-5)
  operators: string[];       // Operators used in this problem
  hasParentheses: boolean;   // Whether the problem contains parentheses
  hasExponents: boolean;     // Whether the problem contains exponents
}

export interface UserAnswer {
  problem: Problem;
  answer: string;            // User's answer as a string
  isCorrect: boolean;        // Whether the answer was correct
  wasRevealed: boolean;      // Whether the solution was revealed
  timeSpent: number;         // Time spent in seconds
  attemptsMade: number;      // Number of attempts made
}

export interface Settings {
  difficulty: 1 | 2 | 3 | 4 | 5;
  problemCount: number;
  timeLimit: number;         // Time limit in seconds (0 for unlimited)
  maxAttempts: number;       // Max attempts per problem (0 for unlimited)
  adaptiveDifficulty: boolean; // Whether to adapt difficulty based on performance
  enableCompensation: boolean; // Add extra problems when incorrect
  autoContinue: boolean;     // Auto-continue after correct answers
  language: 'english' | 'spanish';
  showStepsImmediately: boolean; // Show steps immediately or after submitting
  useDecimals: boolean;      // Whether to include decimal numbers
  operatorsToInclude: {      // Which operators to include based on difficulty
    addition: boolean;
    subtraction: boolean;
    multiplication: boolean;
    division: boolean;
    exponents: boolean;
    parentheses: boolean;
    roots: boolean;
  };
}

export interface DifficultyLevel {
  level: number;
  description: {
    english: string;
    spanish: string;
  };
  examples: string[];
  allowedOperators: string[];
  maxTerms: number;
  maxDepth: number;         // Maximum nesting level for parentheses
  canUseDecimals: boolean;
  canUseNegatives: boolean;
  canUseExponents: boolean;
  canUseRoots: boolean;
  maxValue: number;
}