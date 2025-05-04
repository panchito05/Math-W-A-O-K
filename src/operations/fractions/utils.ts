import { Fraction, Problem } from './types';

export const generateFraction = (maxDenominator: number): Fraction => {
  const denominator = Math.floor(Math.random() * maxDenominator) + 2; // Avoid denominator of 1
  const numerator = Math.floor(Math.random() * denominator * 2) + 1; // Allow improper fractions
  return { numerator, denominator };
};

export const generateProblem = (difficulty: number, operations: Array<'+' | '-' | '×' | '÷'>): Problem => {
  let maxDenominator = 10;
  
  switch (difficulty) {
    case 1: maxDenominator = 10; break;
    case 2: maxDenominator = 20; break;
    case 3: maxDenominator = 50; break;
    case 4: maxDenominator = 100; break;
    case 5: maxDenominator = 200; break;
    default: maxDenominator = 10;
  }
  
  const fraction1 = generateFraction(maxDenominator);
  const fraction2 = generateFraction(maxDenominator);
  
  // Choose a random operation from the available ones
  const operationIndex = Math.floor(Math.random() * operations.length);
  const operator = operations[operationIndex];
  
  let correctAnswer: Fraction;
  
  switch (operator) {
    case '+':
      correctAnswer = addFractions(fraction1, fraction2);
      break;
    case '-':
      correctAnswer = subtractFractions(fraction1, fraction2);
      break;
    case '×':
      correctAnswer = multiplyFractions(fraction1, fraction2);
      break;
    case '÷':
      // Avoid division by zero
      if (fraction2.numerator === 0) {
        fraction2.numerator = Math.floor(Math.random() * 10) + 1;
      }
      correctAnswer = divideFractions(fraction1, fraction2);
      break;
    default:
      correctAnswer = { numerator: 0, denominator: 1 };
  }
  
  return {
    fraction1,
    fraction2,
    operator,
    correctAnswer: simplifyFraction(correctAnswer)
  };
};

export const addFractions = (a: Fraction, b: Fraction): Fraction => {
  const lcm = findLCM(a.denominator, b.denominator);
  const newNumerator = (a.numerator * (lcm / a.denominator)) + (b.numerator * (lcm / b.denominator));
  return {
    numerator: newNumerator,
    denominator: lcm
  };
};

export const subtractFractions = (a: Fraction, b: Fraction): Fraction => {
  const lcm = findLCM(a.denominator, b.denominator);
  const newNumerator = (a.numerator * (lcm / a.denominator)) - (b.numerator * (lcm / b.denominator));
  return {
    numerator: newNumerator,
    denominator: lcm
  };
};

export const multiplyFractions = (a: Fraction, b: Fraction): Fraction => {
  return {
    numerator: a.numerator * b.numerator,
    denominator: a.denominator * b.denominator
  };
};

export const divideFractions = (a: Fraction, b: Fraction): Fraction => {
  return {
    numerator: a.numerator * b.denominator,
    denominator: a.denominator * b.numerator
  };
};

export const simplifyFraction = (fraction: Fraction): Fraction => {
  const gcd = findGCD(Math.abs(fraction.numerator), fraction.denominator);
  return {
    numerator: fraction.numerator / gcd,
    denominator: fraction.denominator / gcd
  };
};

export const findGCD = (a: number, b: number): number => {
  if (!b) {
    return a;
  }
  return findGCD(b, a % b);
};

export const findLCM = (a: number, b: number): number => {
  return (a * b) / findGCD(a, b);
};

export const fractionsAreEqual = (a: Fraction, b: Fraction): boolean => {
  const simplifiedA = simplifyFraction(a);
  const simplifiedB = simplifyFraction(b);
  return simplifiedA.numerator === simplifiedB.numerator && 
         simplifiedA.denominator === simplifiedB.denominator;
};

export const checkAnswer = (problem: Problem, userAnswer: Fraction): boolean => {
  return fractionsAreEqual(problem.correctAnswer, userAnswer);
};