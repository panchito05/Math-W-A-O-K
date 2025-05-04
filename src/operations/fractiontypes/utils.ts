import { Problem, Fraction, MixedNumber, FractionType } from './types';

// Find GCD using Euclidean algorithm
export function findGCD(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  if (b === 0) return a;
  return findGCD(b, a % b);
}

// Simplify a fraction
export function simplifyFraction(numerator: number, denominator: number): Fraction {
  const gcd = findGCD(numerator, denominator);
  return {
    numerator: numerator / gcd,
    denominator: denominator / gcd
  };
}

// Convert improper fraction to mixed number
export function toMixedNumber(numerator: number, denominator: number): MixedNumber {
  const whole = Math.floor(numerator / denominator);
  const remainder = numerator % denominator;
  
  if (remainder === 0) {
    return { whole, numerator: 0, denominator };
  }

  const simplified = simplifyFraction(remainder, denominator);
  
  return {
    whole,
    numerator: simplified.numerator,
    denominator: simplified.denominator
  };
}

// Convert mixed number to improper fraction
export function toImproperFraction(whole: number, numerator: number, denominator: number): Fraction {
  const improperNumerator = whole * denominator + numerator;
  return { numerator: improperNumerator, denominator };
}

// Determine the type of a fraction
export function getFractionType(fraction: Fraction | MixedNumber): FractionType {
  if ('whole' in fraction) {
    return 'mixed';
  }
  
  if (fraction.numerator < fraction.denominator) {
    return 'proper';
  }
  
  return 'improper';
}

// Format a fraction as a string
export function formatFraction(fraction: Fraction | MixedNumber): string {
  if ('whole' in fraction) {
    if (fraction.numerator === 0) {
      return `${fraction.whole}`;
    }
    return `${fraction.whole} ${fraction.numerator}/${fraction.denominator}`;
  }
  return `${fraction.numerator}/${fraction.denominator}`;
}

// Generate a random proper fraction
export function generateProperFraction(maxDenominator = 10): Fraction {
  const denominator = Math.floor(Math.random() * (maxDenominator - 2)) + 2; // 2 to maxDenominator
  const numerator = Math.floor(Math.random() * (denominator - 1)) + 1; // 1 to denominator-1
  return { numerator, denominator };
}

// Generate a random improper fraction (not simplified)
export function generateImproperFraction(maxDenominator = 10): Fraction {
  const denominator = Math.floor(Math.random() * (maxDenominator - 2)) + 2; // 2 to maxDenominator
  const minNumerator = denominator;
  const maxNumerator = denominator * 3; // Limiting how large the numerator can be
  const numerator = Math.floor(Math.random() * (maxNumerator - minNumerator + 1)) + minNumerator;
  return { numerator, denominator };
}

// Generate a random mixed number
export function generateMixedNumber(maxWhole = 10, maxDenominator = 10): MixedNumber {
  const whole = Math.floor(Math.random() * maxWhole) + 1; // 1 to maxWhole
  const denominator = Math.floor(Math.random() * (maxDenominator - 2)) + 2; // 2 to maxDenominator
  const numerator = Math.floor(Math.random() * (denominator - 1)) + 1; // 1 to denominator-1
  return { whole, numerator, denominator };
}

// Generate a identification problem
function generateIdentifyProblem(difficulty: number, language: 'english' | 'spanish'): Problem {
  const type = 'identify';
  const randomType = Math.random();
  let fraction: Fraction | MixedNumber;
  
  if (randomType < 0.33) {
    fraction = generateProperFraction(difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50);
    const fractionString = formatFraction(fraction);
    const correctAnswer = 'proper';
    
    const question = language === 'english' 
      ? `Identify the type of fraction: ${fractionString}`
      : `Identifica el tipo de fracción: ${fractionString}`;
      
    return {
      type,
      question,
      options: language === 'english' 
        ? ['Proper Fraction', 'Improper Fraction', 'Mixed Number'] 
        : ['Fracción Propia', 'Fracción Impropia', 'Número Mixto'],
      correctAnswer: language === 'english' ? 'Proper Fraction' : 'Fracción Propia',
      explanation: language === 'english'
        ? `${fractionString} is a proper fraction because the numerator (${fraction.numerator}) is less than the denominator (${fraction.denominator}).`
        : `${fractionString} es una fracción propia porque el numerador (${fraction.numerator}) es menor que el denominador (${fraction.denominator}).`
    };
  } else if (randomType < 0.66) {
    fraction = generateImproperFraction(difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50);
    const fractionString = formatFraction(fraction);
    const correctAnswer = 'improper';
    
    const question = language === 'english' 
      ? `Identify the type of fraction: ${fractionString}`
      : `Identifica el tipo de fracción: ${fractionString}`;
      
    return {
      type,
      question,
      options: language === 'english' 
        ? ['Proper Fraction', 'Improper Fraction', 'Mixed Number'] 
        : ['Fracción Propia', 'Fracción Impropia', 'Número Mixto'],
      correctAnswer: language === 'english' ? 'Improper Fraction' : 'Fracción Impropia',
      explanation: language === 'english'
        ? `${fractionString} is an improper fraction because the numerator (${fraction.numerator}) is greater than or equal to the denominator (${fraction.denominator}).`
        : `${fractionString} es una fracción impropia porque el numerador (${fraction.numerator}) es mayor o igual que el denominador (${fraction.denominator}).`
    };
  } else {
    fraction = generateMixedNumber(
      difficulty === 1 ? 5 : difficulty === 2 ? 10 : 20,
      difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50
    );
    const fractionString = formatFraction(fraction);
    const correctAnswer = 'mixed';
    
    const question = language === 'english' 
      ? `Identify the type of fraction: ${fractionString}`
      : `Identifica el tipo de fracción: ${fractionString}`;
      
    return {
      type,
      question,
      options: language === 'english' 
        ? ['Proper Fraction', 'Improper Fraction', 'Mixed Number'] 
        : ['Fracción Propia', 'Fracción Impropia', 'Número Mixto'],
      correctAnswer: language === 'english' ? 'Mixed Number' : 'Número Mixto',
      explanation: language === 'english'
        ? `${fractionString} is a mixed number because it has a whole number part (${fraction.whole}) and a proper fraction part (${fraction.numerator}/${fraction.denominator}).`
        : `${fractionString} es un número mixto porque tiene una parte entera (${fraction.whole}) y una parte fraccionaria (${fraction.numerator}/${fraction.denominator}).`
    };
  }
}

// Generate a true/false problem
function generateTrueFalseProblem(difficulty: number, language: 'english' | 'spanish'): Problem {
  const type = 'true-false';
  const randomChoice = Math.floor(Math.random() * 6);
  let question: string;
  let correctAnswer: string;
  let explanation: string;
  
  // Generate a variety of true/false questions
  switch (randomChoice) {
    case 0: {
      // Proper fraction statement - true
      const fraction = generateProperFraction(difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50);
      question = language === 'english' 
        ? `True or False: ${fraction.numerator}/${fraction.denominator} is a proper fraction.`
        : `Verdadero o Falso: ${fraction.numerator}/${fraction.denominator} es una fracción propia.`;
      correctAnswer = language === 'english' ? 'True' : 'Verdadero';
      explanation = language === 'english'
        ? `${fraction.numerator}/${fraction.denominator} is a proper fraction because the numerator (${fraction.numerator}) is less than the denominator (${fraction.denominator}).`
        : `${fraction.numerator}/${fraction.denominator} es una fracción propia porque el numerador (${fraction.numerator}) es menor que el denominador (${fraction.denominator}).`;
      break;
    }
    case 1: {
      // Improper fraction statement - false (it's actually proper)
      const fraction = generateProperFraction(difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50);
      question = language === 'english' 
        ? `True or False: ${fraction.numerator}/${fraction.denominator} is an improper fraction.`
        : `Verdadero o Falso: ${fraction.numerator}/${fraction.denominator} es una fracción impropia.`;
      correctAnswer = language === 'english' ? 'False' : 'Falso';
      explanation = language === 'english'
        ? `${fraction.numerator}/${fraction.denominator} is NOT an improper fraction because the numerator (${fraction.numerator}) is less than the denominator (${fraction.denominator}). It is a proper fraction.`
        : `${fraction.numerator}/${fraction.denominator} NO es una fracción impropia porque el numerador (${fraction.numerator}) es menor que el denominador (${fraction.denominator}). Es una fracción propia.`;
      break;
    }
    case 2: {
      // Improper fraction statement - true
      const fraction = generateImproperFraction(difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50);
      question = language === 'english' 
        ? `True or False: ${fraction.numerator}/${fraction.denominator} is an improper fraction.`
        : `Verdadero o Falso: ${fraction.numerator}/${fraction.denominator} es una fracción impropia.`;
      correctAnswer = language === 'english' ? 'True' : 'Verdadero';
      explanation = language === 'english'
        ? `${fraction.numerator}/${fraction.denominator} is an improper fraction because the numerator (${fraction.numerator}) is greater than or equal to the denominator (${fraction.denominator}).`
        : `${fraction.numerator}/${fraction.denominator} es una fracción impropia porque el numerador (${fraction.numerator}) es mayor o igual que el denominador (${fraction.denominator}).`;
      break;
    }
    case 3: {
      // Proper fraction statement - false (it's actually improper)
      const fraction = generateImproperFraction(difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50);
      question = language === 'english' 
        ? `True or False: ${fraction.numerator}/${fraction.denominator} is a proper fraction.`
        : `Verdadero o Falso: ${fraction.numerator}/${fraction.denominator} es una fracción propia.`;
      correctAnswer = language === 'english' ? 'False' : 'Falso';
      explanation = language === 'english'
        ? `${fraction.numerator}/${fraction.denominator} is NOT a proper fraction because the numerator (${fraction.numerator}) is greater than or equal to the denominator (${fraction.denominator}). It is an improper fraction.`
        : `${fraction.numerator}/${fraction.denominator} NO es una fracción propia porque el numerador (${fraction.numerator}) es mayor o igual que el denominador (${fraction.denominator}). Es una fracción impropia.`;
      break;
    }
    case 4: {
      // Mixed number can be written as an improper fraction - true
      const mixedNumber = generateMixedNumber(
        difficulty === 1 ? 5 : difficulty === 2 ? 10 : 20,
        difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50
      );
      question = language === 'english' 
        ? `True or False: ${mixedNumber.whole} ${mixedNumber.numerator}/${mixedNumber.denominator} can be written as an improper fraction.`
        : `Verdadero o Falso: ${mixedNumber.whole} ${mixedNumber.numerator}/${mixedNumber.denominator} puede ser escrito como una fracción impropia.`;
      correctAnswer = language === 'english' ? 'True' : 'Verdadero';
      const improperFraction = toImproperFraction(mixedNumber.whole, mixedNumber.numerator, mixedNumber.denominator);
      explanation = language === 'english'
        ? `${mixedNumber.whole} ${mixedNumber.numerator}/${mixedNumber.denominator} can be converted to the improper fraction ${improperFraction.numerator}/${improperFraction.denominator} by multiplying the whole number by the denominator and adding the numerator.`
        : `${mixedNumber.whole} ${mixedNumber.numerator}/${mixedNumber.denominator} puede ser convertido a la fracción impropia ${improperFraction.numerator}/${improperFraction.denominator} al multiplicar el número entero por el denominador y añadir el numerador.`;
      break;
    }
    default: {
      // Improper fraction can be written as a mixed number - true
      const fraction = generateImproperFraction(difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50);
      question = language === 'english' 
        ? `True or False: ${fraction.numerator}/${fraction.denominator} can be written as a mixed number.`
        : `Verdadero o Falso: ${fraction.numerator}/${fraction.denominator} puede ser escrito como un número mixto.`;
      correctAnswer = language === 'english' ? 'True' : 'Verdadero';
      const mixedNumber = toMixedNumber(fraction.numerator, fraction.denominator);
      const mixedNumberString = mixedNumber.numerator === 0 
        ? `${mixedNumber.whole}`
        : `${mixedNumber.whole} ${mixedNumber.numerator}/${mixedNumber.denominator}`;
      explanation = language === 'english'
        ? `${fraction.numerator}/${fraction.denominator} can be converted to the mixed number ${mixedNumberString} by dividing the numerator by the denominator.`
        : `${fraction.numerator}/${fraction.denominator} puede ser convertido al número mixto ${mixedNumberString} al dividir el numerador entre el denominador.`;
      break;
    }
  }
  
  return {
    type,
    question,
    options: language === 'english' ? ['True', 'False'] : ['Verdadero', 'Falso'],
    correctAnswer,
    explanation
  };
}

// Generate a matching problem
function generateMatchingProblem(difficulty: number, language: 'english' | 'spanish'): Problem {
  // Generate three different fractions, one of each type
  const properFraction = generateProperFraction(difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50);
  const improperFraction = generateImproperFraction(difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50);
  const mixedNumber = generateMixedNumber(
    difficulty === 1 ? 5 : difficulty === 2 ? 10 : 20,
    difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50
  );
  
  // Format them as strings
  const properString = formatFraction(properFraction);
  const improperString = formatFraction(improperFraction);
  const mixedString = formatFraction(mixedNumber);
  
  const fractions = [properString, improperString, mixedString];
  
  // Create question and answers
  const question = language === 'english'
    ? 'Match each fraction with its correct type.'
    : 'Relaciona cada fracción con su tipo correcto.';
    
  const options = language === 'english' 
    ? ['Proper Fraction', 'Improper Fraction', 'Mixed Number']
    : ['Fracción Propia', 'Fracción Impropia', 'Número Mixto'];
  
  // The correct answer is an array of pairs like "fraction=type"
  const correctAnswer = [
    `${properString}=${language === 'english' ? 'Proper Fraction' : 'Fracción Propia'}`,
    `${improperString}=${language === 'english' ? 'Improper Fraction' : 'Fracción Impropia'}`,
    `${mixedString}=${language === 'english' ? 'Mixed Number' : 'Número Mixto'}`
  ];
  
  // Explanation for feedback
  const explanation = language === 'english'
    ? `${properString} is a proper fraction with numerator < denominator. ${improperString} is an improper fraction with numerator ≥ denominator. ${mixedString} is a mixed number with a whole number and a fraction.`
    : `${properString} es una fracción propia con numerador < denominador. ${improperString} es una fracción impropia con numerador ≥ denominador. ${mixedString} es un número mixto con una parte entera y una fracción.`;
  
  return {
    type: 'matching',
    question,
    options,
    correctAnswer,
    explanation
  };
}

// Generate a write problem
function generateWriteProblem(difficulty: number, language: 'english' | 'spanish'): Problem {
  const type = 'write';
  const randomChoice = Math.floor(Math.random() * 4);
  let question: string;
  let correctAnswer: string;
  let explanation: string;
  
  switch (randomChoice) {
    case 0: {
      // Convert mixed to improper
      const mixedNumber = generateMixedNumber(
        difficulty === 1 ? 5 : difficulty === 2 ? 10 : 20,
        difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50
      );
      const improperFraction = toImproperFraction(mixedNumber.whole, mixedNumber.numerator, mixedNumber.denominator);
      
      question = language === 'english'
        ? `Convert the mixed number ${mixedNumber.whole} ${mixedNumber.numerator}/${mixedNumber.denominator} to an improper fraction.`
        : `Convierte el número mixto ${mixedNumber.whole} ${mixedNumber.numerator}/${mixedNumber.denominator} a una fracción impropia.`;
      
      correctAnswer = `${improperFraction.numerator}/${improperFraction.denominator}`;
      
      explanation = language === 'english'
        ? `To convert a mixed number to an improper fraction, multiply the whole number (${mixedNumber.whole}) by the denominator (${mixedNumber.denominator}) and add the numerator (${mixedNumber.numerator}). Put this sum (${improperFraction.numerator}) over the original denominator (${mixedNumber.denominator}).`
        : `Para convertir un número mixto a una fracción impropia, multiplica el número entero (${mixedNumber.whole}) por el denominador (${mixedNumber.denominator}) y suma el numerador (${mixedNumber.numerator}). Coloca esta suma (${improperFraction.numerator}) sobre el denominador original (${mixedNumber.denominator}).`;
      
      break;
    }
    case 1: {
      // Convert improper to mixed
      const fraction = generateImproperFraction(difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50);
      const mixedNumber = toMixedNumber(fraction.numerator, fraction.denominator);
      
      const mixedNumberString = mixedNumber.numerator === 0
        ? `${mixedNumber.whole}`
        : `${mixedNumber.whole} ${mixedNumber.numerator}/${mixedNumber.denominator}`;
      
      question = language === 'english'
        ? `Convert the improper fraction ${fraction.numerator}/${fraction.denominator} to a mixed number.`
        : `Convierte la fracción impropia ${fraction.numerator}/${fraction.denominator} a un número mixto.`;
      
      correctAnswer = mixedNumberString;
      
      explanation = language === 'english'
        ? `To convert an improper fraction to a mixed number, divide the numerator (${fraction.numerator}) by the denominator (${fraction.denominator}). The quotient (${mixedNumber.whole}) is the whole number part, and the remainder (${mixedNumber.numerator}) over the original denominator is the fractional part.`
        : `Para convertir una fracción impropia a un número mixto, divide el numerador (${fraction.numerator}) entre el denominador (${fraction.denominator}). El cociente (${mixedNumber.whole}) es la parte entera, y el resto (${mixedNumber.numerator}) sobre el denominador original es la parte fraccionaria.`;
      
      break;
    }
    case 2: {
      // Write a proper fraction for a given denominator
      const denominator = difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50;
      
      question = language === 'english'
        ? `Write a proper fraction with denominator ${denominator}.`
        : `Escribe una fracción propia con denominador ${denominator}.`;
      
      // Any numerator less than denominator is correct
      correctAnswer = 'proper';
      
      explanation = language === 'english'
        ? `A proper fraction has a numerator that is less than the denominator. Any fraction with numerator < ${denominator} and denominator = ${denominator} is correct.`
        : `Una fracción propia tiene un numerador menor que el denominador. Cualquier fracción con numerador < ${denominator} y denominador = ${denominator} es correcta.`;
      
      break;
    }
    default: {
      // Write an improper fraction for a given denominator
      const denominator = difficulty === 1 ? 10 : difficulty === 2 ? 20 : 50;
      
      question = language === 'english'
        ? `Write an improper fraction with denominator ${denominator}.`
        : `Escribe una fracción impropia con denominador ${denominator}.`;
      
      // Any numerator greater than or equal to denominator is correct
      correctAnswer = 'improper';
      
      explanation = language === 'english'
        ? `An improper fraction has a numerator that is greater than or equal to the denominator. Any fraction with numerator ≥ ${denominator} and denominator = ${denominator} is correct.`
        : `Una fracción impropia tiene un numerador mayor o igual que el denominador. Cualquier fracción con numerador ≥ ${denominator} y denominador = ${denominator} es correcta.`;
      
      break;
    }
  }
  
  return {
    type,
    question,
    correctAnswer,
    explanation
  };
}

// Main function to generate a random problem based on settings
export function generateProblem(difficulty: number, language: 'english' | 'spanish', problemTypes: string[]): Problem {
  // Choose a random problem type from the available types
  const availableTypes = problemTypes.length > 0 ? problemTypes : ['identify', 'true-false', 'matching', 'write'];
  const randomIndex = Math.floor(Math.random() * availableTypes.length);
  const problemType = availableTypes[randomIndex];
  
  // Generate the appropriate problem type
  switch (problemType) {
    case 'identify':
      return generateIdentifyProblem(difficulty, language);
    case 'true-false':
      return generateTrueFalseProblem(difficulty, language);
    case 'matching':
      return generateMatchingProblem(difficulty, language);
    case 'write':
      return generateWriteProblem(difficulty, language);
    default:
      return generateIdentifyProblem(difficulty, language);
  }
}

// Check if the user's answer is correct for the given problem
export function checkAnswer(problem: Problem, userAnswer: string | string[]): boolean {
  // For a single answer
  if (typeof userAnswer === 'string' && typeof problem.correctAnswer === 'string') {
    if (problem.type === 'write') {
      // Special case for write problems with 'proper' or 'improper' as correct answer
      if (problem.correctAnswer === 'proper' || problem.correctAnswer === 'improper') {
        // Parse the fraction from user input (expected format: "numerator/denominator")
        const parts = userAnswer.split('/');
        if (parts.length !== 2) return false;
        
        const numerator = parseInt(parts[0], 10);
        const denominator = parseInt(parts[1], 10);
        
        if (isNaN(numerator) || isNaN(denominator) || denominator === 0) return false;
        
        if (problem.correctAnswer === 'proper') {
          return numerator < denominator;
        } else { // improper
          return numerator >= denominator;
        }
      }
      
      // Regular string comparison for other write problems
      return userAnswer.trim() === problem.correctAnswer.trim();
    }
    
    // Regular string comparison for other problem types
    return userAnswer === problem.correctAnswer;
  }
  
  // For matching problems with multiple answers
  if (Array.isArray(userAnswer) && Array.isArray(problem.correctAnswer)) {
    if (userAnswer.length !== problem.correctAnswer.length) return false;
    
    // Create sets of answers for comparison (order doesn't matter)
    const correctSet = new Set(problem.correctAnswer);
    return userAnswer.every(answer => correctSet.has(answer));
  }
  
  return false;
}

// Validate a fraction input
export function validateFraction(input: string): { valid: boolean; error?: string; fraction?: Fraction } {
  // Check if input is empty
  if (!input.trim()) {
    return { valid: false, error: 'Please enter a fraction.' };
  }
  
  // Check if the format is "numerator/denominator"
  const parts = input.trim().split('/');
  if (parts.length !== 2) {
    return { valid: false, error: 'Please use the format "numerator/denominator".' };
  }
  
  // Parse the numerator and denominator
  const numerator = parseInt(parts[0], 10);
  const denominator = parseInt(parts[1], 10);
  
  // Check if numerator and denominator are valid numbers
  if (isNaN(numerator) || isNaN(denominator)) {
    return { valid: false, error: 'Both numerator and denominator must be numbers.' };
  }
  
  // Check if denominator is not zero
  if (denominator === 0) {
    return { valid: false, error: 'Denominator cannot be zero.' };
  }
  
  // Valid fraction!
  return { 
    valid: true, 
    fraction: { 
      numerator, 
      denominator 
    } 
  };
}

// Validate a mixed number input
export function validateMixedNumber(input: string): { valid: boolean; error?: string; mixedNumber?: MixedNumber } {
  // Check if input is empty
  if (!input.trim()) {
    return { valid: false, error: 'Please enter a mixed number.' };
  }
  
  // Try to parse input in format "whole numerator/denominator"
  const parts = input.trim().split(' ');
  
  // Check if we have at least two parts (whole and fraction)
  if (parts.length !== 2) {
    return { valid: false, error: 'Please use the format "whole numerator/denominator".' };
  }
  
  // Parse the whole number
  const whole = parseInt(parts[0], 10);
  
  // Check if whole is a valid number
  if (isNaN(whole)) {
    return { valid: false, error: 'Whole number part must be a valid number.' };
  }
  
  // Parse the fraction part
  const fractionParts = parts[1].split('/');
  if (fractionParts.length !== 2) {
    return { valid: false, error: 'Fraction part must be in the format "numerator/denominator".' };
  }
  
  // Parse numerator and denominator
  const numerator = parseInt(fractionParts[0], 10);
  const denominator = parseInt(fractionParts[1], 10);
  
  // Check if numerator and denominator are valid numbers
  if (isNaN(numerator) || isNaN(denominator)) {
    return { valid: false, error: 'Both numerator and denominator must be numbers.' };
  }
  
  // Check if denominator is not zero
  if (denominator === 0) {
    return { valid: false, error: 'Denominator cannot be zero.' };
  }
  
  // Check if numerator is less than denominator for a proper fraction part
  if (numerator >= denominator) {
    return { valid: false, error: 'The fraction part must be a proper fraction (numerator < denominator).' };
  }
  
  // Valid mixed number!
  return { 
    valid: true, 
    mixedNumber: { 
      whole, 
      numerator, 
      denominator 
    } 
  };
}