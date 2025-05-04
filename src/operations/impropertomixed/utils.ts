import { Problem } from './types';

// Generate an improper fraction (numerator > denominator)
export function generateProblem(difficulty: number, requireSimplifiedForm: boolean): Problem {
  let numerator: number, denominator: number;

  switch (difficulty) {
    case 1:
      // Easy: Small denominators (2-10) and small resulting mixed numbers (whole part 1-5)
      denominator = Math.floor(Math.random() * 9) + 2; // 2-10
      const whole1 = Math.floor(Math.random() * 5) + 1; // 1-5
      const remainderNumerator1 = Math.floor(Math.random() * (denominator - 1)) + 1;
      numerator = whole1 * denominator + remainderNumerator1;
      break;
    case 2:
      // Medium: Moderate denominators (5-20) and moderate resulting mixed numbers (whole part 2-10)
      denominator = Math.floor(Math.random() * 16) + 5; // 5-20
      const whole2 = Math.floor(Math.random() * 9) + 2; // 2-10
      const remainderNumerator2 = Math.floor(Math.random() * (denominator - 1)) + 1;
      numerator = whole2 * denominator + remainderNumerator2;
      break;
    case 3:
      // Hard: Larger denominators (10-30) and larger resulting mixed numbers (whole part 5-20)
      denominator = Math.floor(Math.random() * 21) + 10; // 10-30
      const whole3 = Math.floor(Math.random() * 16) + 5; // 5-20
      const remainderNumerator3 = Math.floor(Math.random() * (denominator - 1)) + 1;
      numerator = whole3 * denominator + remainderNumerator3;
      break;
    default:
      // Default to easy
      denominator = Math.floor(Math.random() * 9) + 2; // 2-10
      const wholeDefault = Math.floor(Math.random() * 5) + 1; // 1-5
      const remainderNumeratorDefault = Math.floor(Math.random() * (denominator - 1)) + 1;
      numerator = wholeDefault * denominator + remainderNumeratorDefault;
  }

  // Sometimes generate exact divisions (no remainder)
  if (Math.random() < 0.2) {
    const whole = Math.floor(Math.random() * 10) + 1;
    numerator = whole * denominator;
  }

  // If not requiring simplified form, we might want to use non-simplified fractions 
  if (!requireSimplifiedForm && Math.random() < 0.3) {
    // Multiply both numerator and denominator by a common factor (2-5)
    const factor = Math.floor(Math.random() * 4) + 2;
    numerator *= factor;
    denominator *= factor;
  }

  // Calculate the correct answer (mixed number)
  const whole = Math.floor(numerator / denominator);
  const remainderNumerator = numerator % denominator;

  // Simplify the fractional part if required
  let simplifiedNum = remainderNumerator;
  let simplifiedDenom = denominator;

  if (requireSimplifiedForm && remainderNumerator > 0) {
    const gcd = findGCD(remainderNumerator, denominator);
    simplifiedNum = remainderNumerator / gcd;
    simplifiedDenom = denominator / gcd;
  }

  return {
    numerator,
    denominator,
    correctAnswer: {
      whole,
      numerator: simplifiedNum,
      denominator: simplifiedDenom
    }
  };
}

// Find the greatest common divisor (GCD) using the Euclidean algorithm
export function findGCD(a: number, b: number): number {
  if (b === 0) return a;
  return findGCD(b, a % b);
}

// Check if two fractions are equal
export function fractionsAreEqual(a: {whole: number, numerator: number, denominator: number}, b: {whole: number, numerator: number, denominator: number}): boolean {
  // Convert both to improper fractions
  const aImproper = a.whole * a.denominator + a.numerator;
  const bImproper = b.whole * b.denominator + b.numerator;
  
  // Compare the cross products
  return aImproper * b.denominator === bImproper * a.denominator;
}

// Check if the user's answer matches the correct answer
export function checkAnswer(problem: Problem, userAnswer: {whole: number, numerator: number, denominator: number}): boolean {
  // Handle the case where there's no fractional part in the user's answer
  if (userAnswer.numerator === 0) {
    // Convert the problem's correct answer to an improper fraction
    const correctImproper = problem.correctAnswer.whole * problem.correctAnswer.denominator + problem.correctAnswer.numerator;
    
    // Convert the user's answer to an improper fraction
    const userImproper = userAnswer.whole * userAnswer.denominator;
    
    return (correctImproper / problem.correctAnswer.denominator) === (userImproper / userAnswer.denominator);
  }
  
  // Standard case: compare the mixed numbers directly
  return fractionsAreEqual(problem.correctAnswer, userAnswer);
}

// Simplify a mixed number
export function simplifyMixedNumber(whole: number, numerator: number, denominator: number): {whole: number, numerator: number, denominator: number} {
  if (numerator === 0 || denominator === 0) {
    return { whole, numerator: 0, denominator: denominator === 0 ? 1 : denominator };
  }
  
  // First, ensure the fraction part is proper
  let adjustedWhole = whole;
  let adjustedNumerator = numerator;
  
  if (adjustedNumerator >= denominator) {
    const additionalWhole = Math.floor(adjustedNumerator / denominator);
    adjustedWhole += additionalWhole;
    adjustedNumerator %= denominator;
  }
  
  // Then simplify the fractional part
  if (adjustedNumerator > 0) {
    const gcd = findGCD(adjustedNumerator, denominator);
    return {
      whole: adjustedWhole,
      numerator: adjustedNumerator / gcd,
      denominator: denominator / gcd
    };
  }
  
  return { whole: adjustedWhole, numerator: 0, denominator };
}