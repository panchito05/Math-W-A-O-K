import { Problem } from './types';

// Find GCD using Euclidean algorithm
export function findGCD(a: number, b: number): number {
  if (b === 0) return a;
  return findGCD(b, a % b);
}

// Simplify a fraction
export function simplifyFraction(numerator: number, denominator: number): { numerator: number; denominator: number } {
  if (denominator === 0) {
    throw new Error('Cannot simplify a fraction with denominator 0');
  }
  if (numerator === 0) {
    return { numerator: 0, denominator: 1 };
  }
  
  const divisor = findGCD(Math.abs(numerator), Math.abs(denominator));
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor
  };
}

// Generate a problem for reducing a fraction to an equivalent with smaller denominator
export function generateProblem(difficulty: number, includeNonFactors: boolean): Problem {
  let originalNumerator: number;
  let originalDenominator: number;
  let targetDenominator: number;
  let factor: number;

  switch (difficulty) {
    case 1:
      // Easy: small denominators (10-50), simple factors (2-5)
      factor = Math.floor(Math.random() * 4) + 2; // 2-5
      targetDenominator = Math.floor(Math.random() * 9) + 2; // 2-10
      originalDenominator = targetDenominator * factor;
      originalNumerator = Math.floor(Math.random() * (originalDenominator - 1)) + 1; // 1 to denominator-1
      break;
    case 2:
      // Medium: moderate denominators (20-100), moderate factors (2-10)
      factor = Math.floor(Math.random() * 9) + 2; // 2-10
      targetDenominator = Math.floor(Math.random() * 16) + 5; // 5-20
      originalDenominator = targetDenominator * factor;
      originalNumerator = Math.floor(Math.random() * (originalDenominator - 1)) + 1; // 1 to denominator-1
      break;
    case 3:
      // Hard: larger denominators (50-200), various factors (2-20)
      factor = Math.floor(Math.random() * 19) + 2; // 2-20
      targetDenominator = Math.floor(Math.random() * 41) + 10; // 10-50
      originalDenominator = targetDenominator * factor;
      originalNumerator = Math.floor(Math.random() * (originalDenominator - 1)) + 1; // 1 to denominator-1
      break;
    default:
      // Default to easy
      factor = Math.floor(Math.random() * 4) + 2; // 2-5
      targetDenominator = Math.floor(Math.random() * 9) + 2; // 2-10
      originalDenominator = targetDenominator * factor;
      originalNumerator = Math.floor(Math.random() * (originalDenominator - 1)) + 1; // 1 to denominator-1
  }
  
  // For some variety, sometimes make the original fraction non-simplified
  if (Math.random() < 0.3) {
    const multiplyBy = Math.floor(Math.random() * 4) + 2; // 2-5
    originalNumerator *= multiplyBy;
    originalDenominator *= multiplyBy;
    targetDenominator *= multiplyBy;
  }
  
  // Option to include problems where target denominator is not a factor
  // of the original (requiring finding the GCD and simplifying)
  if (includeNonFactors && Math.random() < 0.3) {
    do {
      const baseValue = difficulty === 1 ? 10 : difficulty === 2 ? 30 : 100;
      targetDenominator = Math.floor(Math.random() * baseValue) + 2;
      // Ensure the new target is smaller than original but not a direct factor
    } while (
      targetDenominator >= originalDenominator || 
      originalDenominator % targetDenominator === 0 || 
      findGCD(originalDenominator, targetDenominator) === 1
    );
    
    // For non-factor denominators, make sure we can create an equivalent fraction
    const gcd = findGCD(originalDenominator, targetDenominator);
    if (gcd > 1) {
      factor = originalDenominator / gcd;
      targetDenominator = originalDenominator / factor;
    }
  }
  
  // Calculate the correct answer - division for reduction
  const reductionFactor = originalDenominator / targetDenominator;
  const correctNumerator = Math.round(originalNumerator / reductionFactor); // Round for precision

  return {
    originalNumerator,
    originalDenominator,
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
  // First check if the denominator is correct
  if (userAnswer.denominator !== problem.targetDenominator) {
    return false;
  }
  
  // Then check if the numerator is correct
  return userAnswer.numerator === problem.correctAnswer.numerator;
}