import { Problem } from './types';

// Find GCD using Euclidean algorithm
export function findGCD(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  if (b === 0) return a;
  return findGCD(b, a % b);
}

// Find LCM (Least Common Multiple)
export function findLCM(a: number, b: number): number {
  return (a * b) / findGCD(a, b);
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

// Check if two fractions are equivalent
export function areEquivalentFractions(
  num1: number, den1: number, 
  num2: number, den2: number
): boolean {
  // Validate inputs first - all must be non-zero except numerators which can be 0
  if (den1 === 0 || den2 === 0) {
    return false;
  }

  // Direct comparison of cross products
  return num1 * den2 === num2 * den1;
}

// Generate a standard conversion problem
function generateConversionProblem(difficulty: number, includeNonMultiples: boolean): Problem {
  let originalNumerator: number;
  let originalDenominator: number;
  let targetDenominator: number;
  let factor: number;

  switch (difficulty) {
    case 1:
      // Easy: small denominators (2-10), simple factors (2-5)
      originalDenominator = Math.floor(Math.random() * 9) + 2; // 2-10
      factor = Math.floor(Math.random() * 4) + 2; // 2-5
      targetDenominator = originalDenominator * factor;
      originalNumerator = Math.floor(Math.random() * (originalDenominator - 1)) + 1; // 1 to denominator-1
      break;
    case 2:
      // Medium: moderate denominators (5-20), moderate factors (2-10)
      originalDenominator = Math.floor(Math.random() * 16) + 5; // 5-20
      factor = Math.floor(Math.random() * 9) + 2; // 2-10
      targetDenominator = originalDenominator * factor;
      originalNumerator = Math.floor(Math.random() * (originalDenominator - 1)) + 1; // 1 to denominator-1
      break;
    case 3:
      // Hard: larger denominators (10-50), various factors (2-20)
      originalDenominator = Math.floor(Math.random() * 41) + 10; // 10-50
      factor = Math.floor(Math.random() * 19) + 2; // 2-20
      targetDenominator = originalDenominator * factor;
      originalNumerator = Math.floor(Math.random() * (originalDenominator - 1)) + 1; // 1 to denominator-1
      break;
    default:
      // Default to easy
      originalDenominator = Math.floor(Math.random() * 9) + 2; // 2-10
      factor = Math.floor(Math.random() * 4) + 2; // 2-5
      targetDenominator = originalDenominator * factor;
      originalNumerator = Math.floor(Math.random() * (originalDenominator - 1)) + 1; // 1 to denominator-1
  }
  
  // For some variety, sometimes (rarely) simplify the original fraction
  if (Math.random() < 0.2) {
    const simplified = simplifyFraction(originalNumerator, originalDenominator);
    originalNumerator = simplified.numerator;
    originalDenominator = simplified.denominator;
  }
  
  // Option to include problems where target denominator is not a multiple
  // of the original (requiring finding a common denominator)
  if (includeNonMultiples && Math.random() < 0.3) {
    // Make sure it's a different denominator that's not a multiple/factor
    do {
      const baseValue = difficulty === 1 ? 10 : difficulty === 2 ? 30 : 100;
      targetDenominator = Math.floor(Math.random() * baseValue) + 5;
    } while (
      targetDenominator === originalDenominator || 
      targetDenominator % originalDenominator === 0 || 
      originalDenominator % targetDenominator === 0
    );
    
    // Find the LCM if we're going to use it
    if (Math.random() < 0.5) {
      targetDenominator = findLCM(originalDenominator, targetDenominator);
    }
  }
  
  // Calculate the correct answer
  const factor2 = targetDenominator / originalDenominator;
  const correctNumerator = Math.round(originalNumerator * factor2); // Round for precision

  return {
    type: 'convert',
    originalNumerator,
    originalDenominator,
    targetDenominator,
    correctAnswer: {
      numerator: correctNumerator,
      denominator: targetDenominator
    }
  };
}

// Generate a true/false problem about equivalent fractions (updated)
function generateTrueFalseProblem(difficulty: number, language: 'english' | 'spanish' = 'english'): Problem {
  let originalNumerator: number;
  let originalDenominator: number;
  let comparisonNumerator: number;
  let comparisonDenominator: number;
  let areEquivalent: boolean;

  switch (difficulty) {
    case 1:
      // Easy: small denominators (2-10)
      originalDenominator = Math.floor(Math.random() * 9) + 2; // 2-10
      originalNumerator = Math.floor(Math.random() * (originalDenominator - 1)) + 1; // 1 to denominator-1
      break;
    case 2:
      // Medium: moderate denominators (5-20)
      originalDenominator = Math.floor(Math.random() * 16) + 5; // 5-20
      originalNumerator = Math.floor(Math.random() * (originalDenominator - 1)) + 1; // 1 to denominator-1
      break;
    case 3:
      // Hard: larger denominators (10-50)
      originalDenominator = Math.floor(Math.random() * 41) + 10; // 10-50
      originalNumerator = Math.floor(Math.random() * (originalDenominator - 1)) + 1; // 1 to denominator-1
      break;
    default:
      // Default to easy
      originalDenominator = Math.floor(Math.random() * 9) + 2; // 2-10
      originalNumerator = Math.floor(Math.random() * (originalDenominator - 1)) + 1; // 1 to denominator-1
  }

  // Decide if we want to generate an equivalent fraction (true) or non-equivalent (false)
  areEquivalent = Math.random() < 0.5;

  if (areEquivalent) {
    // Generate an equivalent fraction by multiplying both by the same factor
    const factor = Math.floor(Math.random() * 5) + 2; // 2-6
    comparisonNumerator = originalNumerator * factor;
    comparisonDenominator = originalDenominator * factor;
  } else {
    // Generate a non-equivalent fraction
    // Method 1: Change just the numerator slightly
    if (Math.random() < 0.5) {
      comparisonDenominator = originalDenominator;
      do {
        comparisonNumerator = originalNumerator + (Math.random() < 0.5 ? 1 : -1);
      } while (comparisonNumerator <= 0 || comparisonNumerator >= comparisonDenominator);
    } 
    // Method 2: Use a different fraction entirely
    else {
      comparisonDenominator = Math.floor(Math.random() * 20) + 2; // 2-21
      comparisonNumerator = Math.floor(Math.random() * (comparisonDenominator - 1)) + 1;
      
      // Make sure it's not accidentally equivalent
      while (areEquivalentFractions(originalNumerator, originalDenominator, comparisonNumerator, comparisonDenominator)) {
        comparisonNumerator = Math.floor(Math.random() * (comparisonDenominator - 1)) + 1;
      }
    }
  }

  const questionText = language === 'english'
    ? `Are these fractions equivalent? ${originalNumerator}/${originalDenominator} and ${comparisonNumerator}/${comparisonDenominator}`
    : `¿Son estas fracciones equivalentes? ${originalNumerator}/${originalDenominator} y ${comparisonNumerator}/${comparisonDenominator}`;

  return {
    type: 'true-false',
    originalNumerator,
    originalDenominator,
    comparisonFraction: { 
      numerator: comparisonNumerator,
      denominator: comparisonDenominator
    },
    correctAnswer: areEquivalent,
    questionText
  };
}

// Generate a problem where user must provide an equivalent fraction (updated)
function generateFreeInputProblem(difficulty: number, language: 'english' | 'spanish' = 'english'): Problem {
  let originalNumerator: number;
  let originalDenominator: number;

  switch (difficulty) {
    case 1: originalDenominator = Math.floor(Math.random() * 9) + 2; break; // 2-10
    case 2: originalDenominator = Math.floor(Math.random() * 16) + 5; break; // 5-20
    case 3: originalDenominator = Math.floor(Math.random() * 41) + 10; break; // 10-50
    default: originalDenominator = Math.floor(Math.random() * 9) + 2; // 2-10
  }
  
  originalNumerator = Math.floor(Math.random() * (originalDenominator - 1)) + 1; // 1 to denominator-1

  const questionText = language === 'english'
    ? `Write an equivalent fraction for ${originalNumerator}/${originalDenominator}`
    : `Escribe una fracción equivalente para ${originalNumerator}/${originalDenominator}`;

  return {
    type: 'free-input',
    originalNumerator,
    originalDenominator,
    correctAnswer: { numerator: originalNumerator, denominator: originalDenominator },
    questionText
  };
}

// Main function to generate problems based on settings
export function generateProblem(
  difficulty: number, 
  includeNonMultiples: boolean, 
  problemTypes: ('convert' | 'true-false' | 'free-input')[] = ['convert'],
  language: 'english' | 'spanish' = 'english'
): Problem {
  // Choose a random problem type from the available types
  const availableTypes = problemTypes.length > 0 ? problemTypes : ['convert'];
  const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
  
  switch (randomType) {
    case 'true-false':
      return generateTrueFalseProblem(difficulty, language);
    case 'free-input':
      return generateFreeInputProblem(difficulty, language);
    case 'convert':
    default:
      return generateConversionProblem(difficulty, includeNonMultiples);
  }
}

// Check if the user's answer matches the correct answer
export function checkAnswer(
  problem: Problem,
  userAnswer: { numerator: number; denominator: number } | boolean | null
): boolean {
  if (userAnswer === null) return false;
  
  // For true/false problems
  if (problem.type === 'true-false' && typeof userAnswer === 'boolean') {
    return userAnswer === problem.correctAnswer;
  }
  
  // For free-input problems with fractions
  if (problem.type === 'free-input' && typeof userAnswer !== 'boolean') {
    // First check if user input is valid (positive numbers)
    const userAnswerObj = userAnswer as { numerator: number; denominator: number };
    const userNum = userAnswerObj.numerator;
    const userDen = userAnswerObj.denominator;
    
    if (userNum <= 0 || userDen <= 0) {
      return false; // Invalid input - not positive numbers
    }
    
    // Get original fraction values
    const { originalNumerator: origNum, originalDenominator: origDen } = problem;
    
    // Check if the user entered exactly the same fraction (which isn't allowed)
    if (origNum === userNum && origDen === userDen) {
      return false;
    }
    
    // Check if the fractions are mathematically equivalent
    return areEquivalentFractions(origNum, origDen, userNum, userDen);
  }
  
  // For convert problems
  if (problem.type === 'convert' && typeof userAnswer !== 'boolean' && typeof problem.correctAnswer !== 'boolean') {
    if (!problem.targetDenominator) return false;
    
    // First check if the denominator is correct
    if ((userAnswer as { numerator: number; denominator: number }).denominator !== problem.targetDenominator) {
      return false;
    }
    
    // Then check if the numerator is correct
    return (userAnswer as { numerator: number; denominator: number }).numerator === 
           (problem.correctAnswer as { numerator: number; denominator: number }).numerator;
  }
  
  return false;
}