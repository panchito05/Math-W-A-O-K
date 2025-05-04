import { Problem } from './types';

// Generate a whole number problem with a specified denominator
export function generateProblem(difficulty: number, includeDivisibleOnly: boolean): Problem {
  let wholeNumber: number;
  let targetDenominator: number;

  switch (difficulty) {
    case 1:
      wholeNumber = Math.floor(Math.random() * 10) + 1; // 1-10
      targetDenominator = includeDivisibleOnly ? 1 : Math.floor(Math.random() * 5) + 1; // 1-5
      break;
    case 2:
      wholeNumber = Math.floor(Math.random() * 15) + 1; // 1-15
      targetDenominator = includeDivisibleOnly ? 1 : Math.floor(Math.random() * 9) + 1; // 1-9
      break;
    case 3:
      wholeNumber = Math.floor(Math.random() * 20) + 5; // 5-25
      targetDenominator = includeDivisibleOnly ? 1 : Math.floor(Math.random() * 10) + 2; // 2-12
      break;
    default:
      wholeNumber = Math.floor(Math.random() * 10) + 1; // 1-10
      targetDenominator = includeDivisibleOnly ? 1 : Math.floor(Math.random() * 5) + 1; // 1-5
  }

  const correctNumerator = wholeNumber * targetDenominator;

  return {
    wholeNumber,
    targetDenominator,
    correctAnswer: {
      numerator: correctNumerator,
      denominator: targetDenominator
    }
  };
}

// Check if the user's answer matches the correct answer
export function checkAnswer(
  problem: Problem,
  userAnswer: { numerator: number; denominator: number }
): boolean {
  // Check for direct match
  if (
    userAnswer.numerator === problem.correctAnswer.numerator &&
    userAnswer.denominator === problem.correctAnswer.denominator
  ) {
    return true;
  }

  // Check for equivalent fractions (simplified)
  const userGcd = gcd(userAnswer.numerator, userAnswer.denominator);
  const userSimplified = {
    numerator: userAnswer.numerator / userGcd,
    denominator: userAnswer.denominator / userGcd
  };

  const correctGcd = gcd(problem.correctAnswer.numerator, problem.correctAnswer.denominator);
  const correctSimplified = {
    numerator: problem.correctAnswer.numerator / correctGcd,
    denominator: problem.correctAnswer.denominator / correctGcd
  };

  return (
    userSimplified.numerator === correctSimplified.numerator &&
    userSimplified.denominator === correctSimplified.denominator
  );
}

// Find the greatest common divisor
export function gcd(a: number, b: number): number {
  if (b === 0) return a;
  return gcd(b, a % b);
}

// Simplify a fraction
export function simplifyFraction(numerator: number, denominator: number): { numerator: number; denominator: number } {
  if (denominator === 0) {
    throw new Error('Cannot simplify a fraction with denominator 0');
  }
  if (numerator === 0) {
    return { numerator: 0, denominator: 1 };
  }
  
  const divisor = gcd(Math.abs(numerator), Math.abs(denominator));
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor
  };
}