import { DifficultyLevel, Problem, Settings } from './types';

// Define difficulty levels
export function getDifficultyLevels(): DifficultyLevel[] {
  return [
    {
      level: 1,
      description: {
        english: 'Basic operations: Addition and subtraction only',
        spanish: 'Operaciones básicas: Solo suma y resta'
      },
      examples: ['5 + 3 - 2', '10 - 4 + 7', '15 - 8 - 3'],
      allowedOperators: ['+', '-'],
      maxTerms: 4,
      maxDepth: 0,
      canUseDecimals: false,
      canUseNegatives: false,
      canUseExponents: false,
      canUseRoots: false,
      maxValue: 20
    },
    {
      level: 2,
      description: {
        english: 'Basic order of operations: Multiplication, division, addition, and subtraction',
        spanish: 'Orden básico de operaciones: Multiplicación, división, suma y resta'
      },
      examples: ['5 × 2 + 3', '10 - 8 ÷ 2', '3 + 4 × 2'],
      allowedOperators: ['+', '-', '×', '÷'],
      maxTerms: 5,
      maxDepth: 0,
      canUseDecimals: false,
      canUseNegatives: false,
      canUseExponents: false,
      canUseRoots: false,
      maxValue: 30
    },
    {
      level: 3,
      description: {
        english: 'Intermediate: Introducing parentheses and simple exponents',
        spanish: 'Intermedio: Introducción a paréntesis y exponentes simples'
      },
      examples: ['(5 + 3) × 2', '4 × (6 - 2)', '3² + 5'],
      allowedOperators: ['+', '-', '×', '÷', '^', '( )'],
      maxTerms: 6,
      maxDepth: 1,
      canUseDecimals: false,
      canUseNegatives: true,
      canUseExponents: true,
      canUseRoots: false,
      maxValue: 50
    },
    {
      level: 4,
      description: {
        english: 'Advanced: Multiple parentheses, exponents, and negative numbers',
        spanish: 'Avanzado: Paréntesis múltiples, exponentes y números negativos'
      },
      examples: ['2 × (3 + (4 - 1))', '(5 + 3)² - 4', '3 × 4 - (6 ÷ 2)²'],
      allowedOperators: ['+', '-', '×', '÷', '^', '( )'],
      maxTerms: 8,
      maxDepth: 2,
      canUseDecimals: true,
      canUseNegatives: true,
      canUseExponents: true,
      canUseRoots: false,
      maxValue: 100
    },
    {
      level: 5,
      description: {
        english: 'Expert: Complex expressions with all operations including square roots',
        spanish: 'Experto: Expresiones complejas con todas las operaciones incluyendo raíces cuadradas'
      },
      examples: ['√(16) + 3²', '2 × (√9 + 3) - 1', '(8 - 5)² ÷ √4'],
      allowedOperators: ['+', '-', '×', '÷', '^', '( )', '√'],
      maxTerms: 10,
      maxDepth: 3,
      canUseDecimals: true,
      canUseNegatives: true,
      canUseExponents: true,
      canUseRoots: true,
      maxValue: 200
    }
  ];
}

// Generate a random number between min and max (inclusive)
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random decimal between min and max with specified precision
export function getRandomDecimal(min: number, max: number, precision: number = 1): number {
  const random = Math.random() * (max - min) + min;
  return Number(random.toFixed(precision));
}

// Function to format expressions with proper spacing
export function formatExpression(expression: string): string {
  // Replace operators with properly spaced versions
  return expression
    .replace(/\+/g, ' + ')
    .replace(/\-/g, ' - ')
    .replace(/\×/g, ' × ')
    .replace(/\÷/g, ' ÷ ')
    .replace(/\^/g, '^')
    .replace(/\(/g, '(')
    .replace(/\)/g, ')')
    .replace(/√/g, '√')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse and evaluate expressions safely
export function evaluateExpression(expression: string): number {
  try {
    // First, normalize the expression to handle negative numbers better
    let normalized = expression
      // Add space after operators for better parsing
      .replace(/([+\-×÷\^])/g, ' $1 ')
      // Remove double spaces
      .replace(/\s+/g, ' ')
      .trim();
    
    // Convert the expression to JavaScript-compatible form
    let jsExpression = normalized
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      // Use Math.pow for exponents to handle negative numbers better
      .replace(/(\-?\d+\.?\d*)\s*\^\s*(\-?\d+\.?\d*)/g, 'Math.pow($1, $2)');
    
    // Handle square roots with parentheses: √(expression)
    jsExpression = jsExpression.replace(/√\s*\(\s*([^()]*)\s*\)/g, function(match, content) {
      return `(function(x) { return x < 0 ? 0 : Math.sqrt(x); })(${content})`;
    });
    
    // Handle square roots without parentheses: √number
    jsExpression = jsExpression.replace(/√\s*(\-?\d+\.?\d*)/g, function(match, number) {
      const num = parseFloat(number);
      return (isNaN(num) || num < 0) ? '0' : `Math.sqrt(${num})`;
    });
    
    // Using Function constructor to evaluate the expression
    return Function(`'use strict'; return (${jsExpression})`)() as number;
  } catch (error) {
    console.error("Error evaluating expression:", error);
    throw new Error(`Invalid expression: ${expression}`);
  }
}

// Get the steps for solving an expression according to PEMDAS
export function generateSolutionSteps(expression: string, language: 'english' | 'spanish'): string[] {
  const steps: string[] = [];
  
  // 1. Start with the original expression
  steps.push(
    language === 'english' 
      ? `Start with the expression: ${expression}`
      : `Comenzar con la expresión: ${expression}`
  );
  
  // For a real implementation, we would have a comprehensive step-by-step solution generator
  // For this example, we'll use a simplified approach
  
  try {
    // Handle parentheses first
    let workingExpression = expression;
    let parenthesesMatch: RegExpExecArray | null;
    const parenthesesRegex = /\(([^()]+)\)/g;
    
    while ((parenthesesMatch = parenthesesRegex.exec(workingExpression)) !== null) {
      const fullMatch = parenthesesMatch[0];
      const innerExpression = parenthesesMatch[1];
      
      try {
        // Evaluate the expression inside parentheses
        const innerResult = evaluateExpression(innerExpression);
        
        steps.push(
          language === 'english' 
            ? `Evaluate the expression inside parentheses: ${fullMatch} = ${innerResult}`
            : `Evaluar la expresión dentro de paréntesis: ${fullMatch} = ${innerResult}`
        );
        
        // Replace the parenthesized expression with its result in the working expression
        workingExpression = workingExpression.replace(fullMatch, innerResult.toString());
        
        steps.push(
          language === 'english' 
            ? `Expression is now: ${workingExpression}`
            : `La expresión ahora es: ${workingExpression}`
        );
      } catch (error) {
        // Handle the error for square root of negative number
        console.error("Error in parentheses evaluation:", error);
        steps.push(
          language === 'english' 
            ? `Error evaluating expression inside parentheses: ${fullMatch}. Using 0 instead.`
            : `Error al evaluar la expresión dentro de paréntesis: ${fullMatch}. Usando 0 en su lugar.`
        );
        
        // Replace with 0 as fallback
        workingExpression = workingExpression.replace(fullMatch, "0");
        
        steps.push(
          language === 'english' 
            ? `Expression is now: ${workingExpression}`
            : `La expresión ahora es: ${workingExpression}`
        );
      }
      
      // Reset the regex to find more parentheses
      parenthesesRegex.lastIndex = 0;
    }
    
    // Handle exponents
    const exponentRegex = /(\d+\.?\d*)\s*\^\s*(\d+\.?\d*)/g;
    let exponentMatch: RegExpExecArray | null;
    
    while ((exponentMatch = exponentRegex.exec(workingExpression)) !== null) {
      const fullMatch = exponentMatch[0];
      const base = parseFloat(exponentMatch[1]);
      const exponent = parseFloat(exponentMatch[2]);
      
      const result = Math.pow(base, exponent);
      
      steps.push(
        language === 'english' 
          ? `Calculate exponent: ${base}^${exponent} = ${result}`
          : `Calcular exponente: ${base}^${exponent} = ${result}`
      );
      
      workingExpression = workingExpression.replace(fullMatch, result.toString());
      
      steps.push(
        language === 'english' 
          ? `Expression is now: ${workingExpression}`
          : `La expresión ahora es: ${workingExpression}`
      );
      
      // Reset the regex
      exponentRegex.lastIndex = 0;
    }
    
    // Handle square roots - Updated to handle decimal numbers, parentheses, and negative numbers
    const rootRegex = /√\s*\((\-?\d+\.?\d*)\)|√\s*(\-?\d+\.?\d*)/g;
    let rootMatch: RegExpExecArray | null;
    
    while ((rootMatch = rootRegex.exec(workingExpression)) !== null) {
      const fullMatch = rootMatch[0];
      // Either the first group (with parentheses) or the second group (without parentheses) will have a value
      const number = parseFloat(rootMatch[1] || rootMatch[2]);
      
      // Check if the number is negative
      if (number < 0) {
        // Handle square root of negative number
        steps.push(
          language === 'english' 
            ? `Cannot calculate square root of negative number: ${fullMatch}. Square roots of negative numbers are not real numbers.`
            : `No se puede calcular la raíz cuadrada de un número negativo: ${fullMatch}. Las raíces cuadradas de números negativos no son números reales.`
        );
        
        // Replace with 0 as fallback
        workingExpression = workingExpression.replace(fullMatch, "0");
        
        steps.push(
          language === 'english' 
            ? `Using 0 instead. Expression is now: ${workingExpression}`
            : `Usando 0 en su lugar. La expresión ahora es: ${workingExpression}`
        );
      } else {
        const result = Math.sqrt(number);
        
        steps.push(
          language === 'english' 
            ? `Calculate square root: ${fullMatch} = ${result}`
            : `Calcular raíz cuadrada: ${fullMatch} = ${result}`
        );
        
        workingExpression = workingExpression.replace(fullMatch, result.toString());
        
        steps.push(
          language === 'english' 
            ? `Expression is now: ${workingExpression}`
            : `La expresión ahora es: ${workingExpression}`
        );
      }
      
      // Reset the regex
      rootRegex.lastIndex = 0;
    }
    
    // Handle multiplication and division (left to right)
    let multiDivMatch: RegExpExecArray | null;
    const multiDivRegex = /(\-?\d+\.?\d*)\s*([×÷])\s*(\-?\d+\.?\d*)/;
    
    while ((multiDivMatch = multiDivRegex.exec(workingExpression)) !== null) {
      const fullMatch = multiDivMatch[0];
      const leftOperand = parseFloat(multiDivMatch[1]);
      const operator = multiDivMatch[2];
      const rightOperand = parseFloat(multiDivMatch[3]);
      
      let result: number;
      let operationText: string;
      
      if (operator === '×') {
        result = leftOperand * rightOperand;
        operationText = language === 'english' 
          ? `Multiply: ${leftOperand} × ${rightOperand} = ${result}`
          : `Multiplicar: ${leftOperand} × ${rightOperand} = ${result}`;
      } else {
        // Check for division by zero
        if (rightOperand === 0) {
          steps.push(
            language === 'english' 
              ? `Cannot divide by zero: ${leftOperand} ÷ ${rightOperand}. Using 0 instead.`
              : `No se puede dividir por cero: ${leftOperand} ÷ ${rightOperand}. Usando 0 en su lugar.`
          );
          workingExpression = workingExpression.replace(fullMatch, "0");
          steps.push(
            language === 'english' 
              ? `Expression is now: ${workingExpression}`
              : `La expresión ahora es: ${workingExpression}`
          );
          continue;
        }
        
        result = leftOperand / rightOperand;
        operationText = language === 'english' 
          ? `Divide: ${leftOperand} ÷ ${rightOperand} = ${result}`
          : `Dividir: ${leftOperand} ÷ ${rightOperand} = ${result}`;
      }
      
      steps.push(operationText);
      
      workingExpression = workingExpression.replace(fullMatch, result.toString());
      
      steps.push(
        language === 'english' 
          ? `Expression is now: ${workingExpression}`
          : `La expresión ahora es: ${workingExpression}`
      );
    }
    
    // Handle addition and subtraction (left to right)
    let addSubMatch: RegExpExecArray | null;
    const addSubRegex = /(\-?\d+\.?\d*)\s*([+\-])\s*(\d+\.?\d*)/;
    
    while ((addSubMatch = addSubRegex.exec(workingExpression)) !== null) {
      const fullMatch = addSubMatch[0];
      const leftOperand = parseFloat(addSubMatch[1]);
      const operator = addSubMatch[2];
      const rightOperand = parseFloat(addSubMatch[3]);
      
      let result: number;
      let operationText: string;
      
      if (operator === '+') {
        result = leftOperand + rightOperand;
        operationText = language === 'english' 
          ? `Add: ${leftOperand} + ${rightOperand} = ${result}`
          : `Sumar: ${leftOperand} + ${rightOperand} = ${result}`;
      } else {
        result = leftOperand - rightOperand;
        operationText = language === 'english' 
          ? `Subtract: ${leftOperand} - ${rightOperand} = ${result}`
          : `Restar: ${leftOperand} - ${rightOperand} = ${result}`;
      }
      
      steps.push(operationText);
      
      workingExpression = workingExpression.replace(fullMatch, result.toString());
      
      steps.push(
        language === 'english' 
          ? `Expression is now: ${workingExpression}`
          : `La expresión ahora es: ${workingExpression}`
      );
    }
    
    // Add the final result
    try {
      const finalResult = evaluateExpression(expression);
      steps.push(
        language === 'english' 
          ? `Final answer: ${finalResult}`
          : `Respuesta final: ${finalResult}`
      );
      return steps;
    } catch (error) {
      // If there's an error in final evaluation, try to format the expression better
      try {
        const cleanedExpression = formatExpressionForEvaluation(expression);
        const finalResult = evaluateExpression(cleanedExpression);
        steps.push(
          language === 'english' 
            ? `Final answer: ${finalResult}`
            : `Respuesta final: ${finalResult}`
        );
      } catch (innerError) {
        // If still error, provide a graceful message
        steps.push(
          language === 'english' 
            ? `Cannot compute final answer for expression: ${expression}. This may involve square roots of negative numbers.`
            : `No se puede calcular la respuesta final para la expresión: ${expression}. Puede incluir raíces cuadradas de números negativos.`
        );
      }
      return steps;
    }
  } catch (error) {
    console.error("Error generating steps:", error);
    return [
      language === 'english' 
        ? `Error solving the expression: ${expression}. This expression may involve operations like square roots of negative numbers.`
        : `Error al resolver la expresión: ${expression}. Esta expresión puede involucrar operaciones como raíces cuadradas de números negativos.`
    ];
  }
}

// Helper function to better format expressions for evaluation
function formatExpressionForEvaluation(expression: string): string {
  let formattedExpression = expression
    // Add parentheses around square root expressions if they don't already have them
    // First handle expressions that already have parentheses
    .replace(/√\s*\((\-?\d+\.?\d*)\)/g, '√($1)')
    // Then handle expressions without parentheses
    .replace(/√\s*(\-?\d+\.?\d*)/g, '√($1)')
    // Ensure spaces between operators
    .replace(/([+\-×÷\^])/g, ' $1 ')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
  
  return formattedExpression;
}

// Generate random terms for expressions based on settings
export function getRandomTerm(settings: Settings): { term: string, value: number } {
  const useDecimals = settings.useDecimals && settings.difficulty >= 4;
  const useNegatives = settings.difficulty >= 3;
  const maxValue = getDifficultyLevels().find(l => l.level === settings.difficulty)?.maxValue || 20;
  
  // Decide if we should use a negative number
  const isNegative = useNegatives && Math.random() < 0.2;
  
  // Decide if we should use a decimal
  const isDecimal = useDecimals && Math.random() < 0.3;
  
  let value: number;
  
  if (isDecimal) {
    value = getRandomDecimal(1, maxValue);
  } else {
    value = getRandomInt(1, maxValue);
  }
  
  if (isNegative) {
    value = -value;
  }
  
  return { term: value.toString(), value };
}

// Generate an expression with or without parentheses
export function generateParenthesizedExpression(settings: Settings, depth: number = 0): { expression: string, value: number } {
  const level = getDifficultyLevels().find(l => l.level === settings.difficulty);
  const maxDepth = level?.maxDepth ?? 0;
  
  // If we've reached the maximum depth or parentheses are not allowed, generate a simple expression
  if (depth >= maxDepth || !settings.operatorsToInclude.parentheses || Math.random() < 0.5) {
    return generateSimpleExpression(settings);
  }
  
  // Generate a parenthesized expression
  const innerExpression = generateSimpleExpression(settings);
  
  // Decide if we need another term
  if (Math.random() < 0.5 && depth < maxDepth - 1) {
    // Generate another simple expression to combine with the parenthesized one
    const operators = getAvailableOperators(settings);
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    if (operator === '^' && settings.operatorsToInclude.exponents) {
      // For exponents, the parenthesized expression should be the base
      // Use only positive exponents to avoid complex math
      const exponent = getRandomInt(2, 3); // Small exponents to avoid huge numbers
      const newExpression = `(${innerExpression.expression})^${exponent}`;
      return {
        expression: newExpression,
        value: Math.pow(innerExpression.value, exponent)
      };
    } else if (operator === '√' && settings.operatorsToInclude.roots) {
      // For square roots, ensure the inner value is positive
      // If the inner expression evaluates to a negative number, generate a positive one instead
      if (innerExpression.value < 0) {
        // Create a new positive expression for square root
        const positiveExpr = generateSimpleExpression({
          ...settings,
          useNegatives: false // Ensure positive results
        });
        const newExpression = `√(${positiveExpr.expression})`;
        return {
          expression: newExpression,
          value: Math.sqrt(positiveExpr.value)
        };
      } else {
        // Original expression is already positive
        const newExpression = `√(${innerExpression.expression})`;
        return {
          expression: newExpression,
          value: Math.sqrt(innerExpression.value)
        };
      }
    } else {
      // For other operators, combine the parenthesized expression with another term
      const secondTerm = generateSimpleExpression(settings);
      
      // Randomly decide the order of terms
      const isFirstTerm = Math.random() < 0.5;
      
      const newExpression = isFirstTerm
        ? `(${innerExpression.expression}) ${operator} ${secondTerm.expression}`
        : `${secondTerm.expression} ${operator} (${innerExpression.expression})`;
        
      let newValue: number;
      
      switch (operator) {
        case '+': 
          newValue = isFirstTerm 
            ? innerExpression.value + secondTerm.value 
            : secondTerm.value + innerExpression.value;
          break;
        case '-': 
          newValue = isFirstTerm 
            ? innerExpression.value - secondTerm.value 
            : secondTerm.value - innerExpression.value;
          break;
        case '×': 
          newValue = innerExpression.value * secondTerm.value;
          break;
        case '÷': 
          // Avoid division by zero
          newValue = isFirstTerm && secondTerm.value !== 0
            ? innerExpression.value / secondTerm.value
            : secondTerm.value !== 0 
              ? secondTerm.value / innerExpression.value
              : 1; // Fallback
          break;
        default:
          newValue = innerExpression.value;
      }
      
      return { expression: newExpression, value: newValue };
    }
  } else {
    // Just use the parenthesized expression
    return {
      expression: `(${innerExpression.expression})`,
      value: innerExpression.value
    };
  }
}

// Get available operators based on settings
export function getAvailableOperators(settings: Settings): string[] {
  const operators: string[] = [];
  
  if (settings.operatorsToInclude.addition) operators.push('+');
  if (settings.operatorsToInclude.subtraction) operators.push('-');
  if (settings.operatorsToInclude.multiplication) operators.push('×');
  if (settings.operatorsToInclude.division) operators.push('÷');
  
  // Only add these for higher difficulty levels
  if (settings.difficulty >= 3) {
    if (settings.operatorsToInclude.exponents) operators.push('^');
    if (settings.difficulty >= 5 && settings.operatorsToInclude.roots) operators.push('√');
  }
  
  // Ensure we have at least one operator
  if (operators.length === 0) {
    operators.push('+');
  }
  
  return operators;
}

// Generate a simple expression without parentheses
export function generateSimpleExpression(settings: Settings): { expression: string, value: number } {
  const level = getDifficultyLevels().find(l => l.level === settings.difficulty);
  
  // Determine the number of terms (2 to maxTerms for the difficulty level)
  const maxTermsForLevel = Math.min(4, level?.maxTerms ?? 3);
  const numTerms = getRandomInt(2, maxTermsForLevel);
  
  // Get available operators
  const availableOperators = getAvailableOperators(settings);
  
  // Generate the first term
  const firstTerm = getRandomTerm(settings);
  let expression = firstTerm.term;
  let value = firstTerm.value;
  
  // Add the rest of the terms
  for (let i = 1; i < numTerms; i++) {
    const operator = availableOperators[Math.floor(Math.random() * availableOperators.length)];
    const nextTerm = getRandomTerm(settings);
    
    // Special handling for division to avoid very small or complex results
    if (operator === '÷' && (nextTerm.value === 0 || value % nextTerm.value !== 0)) {
      // For simplicity, use a divisor that divides evenly
      const divisors = [2, 3, 4, 5, 10];
      const divisor = divisors[Math.floor(Math.random() * divisors.length)];
      
      if (value % divisor === 0) {
        expression += ` ${operator} ${divisor}`;
        value /= divisor;
      } else {
        // If not divisible, switch to multiplication
        expression += ` × ${nextTerm.term}`;
        value *= nextTerm.value;
      }
    } else if (operator === '√') {
      // For square roots, ensure we use a positive value
      const positiveValue = Math.abs(nextTerm.value);
      expression += ` + √(${positiveValue})`;
      value += Math.sqrt(positiveValue);
    } else if (operator === '^') {
      // For exponents, use only small, positive exponents to avoid errors
      const exponent = Math.min(Math.abs(nextTerm.value), 3); // Use positive exponents only
      expression += ` ${operator} ${exponent}`;
      value = Math.pow(value, exponent); 
    } else {
      expression += ` ${operator} ${nextTerm.term}`;
      
      // Calculate the new value
      switch (operator) {
        case '+': value += nextTerm.value; break;
        case '-': value -= nextTerm.value; break;
        case '×': value *= nextTerm.value; break;
        case '÷': 
          // Avoid division by zero
          value = nextTerm.value !== 0 ? value / nextTerm.value : value; 
          break;
      }
    }
  }
  
  return { expression, value };
}

// Generate a problem based on settings
export function generateProblem(settings: Settings): Problem {
  const level = getDifficultyLevels().find(l => l.level === settings.difficulty);
  
  // Decide whether to use parentheses based on settings and difficulty
  const useParentheses = settings.operatorsToInclude.parentheses && 
                         level?.maxDepth && 
                         level.maxDepth > 0 && 
                         Math.random() < 0.7;
  
  // Create the problem expression
  let problemData: { expression: string, value: number };
  
  if (useParentheses) {
    problemData = generateParenthesizedExpression(settings);
  } else {
    problemData = generateSimpleExpression(settings);
  }
  
  // Format the expression
  const formattedExpression = formatExpression(problemData.expression);
  
  // For exact calculations, round the value to avoid floating point issues
  const solution = Math.round(problemData.value * 100) / 100;
  
  // Generate the step-by-step solution
  const steps = generateSolutionSteps(formattedExpression, settings.language);
  
  // Determine which operators are used
  const usedOperators = [];
  if (formattedExpression.includes('+')) usedOperators.push('+');
  if (formattedExpression.includes('-')) usedOperators.push('-');
  if (formattedExpression.includes('×')) usedOperators.push('×');
  if (formattedExpression.includes('÷')) usedOperators.push('÷');
  if (formattedExpression.includes('^')) usedOperators.push('^');
  if (formattedExpression.includes('√')) usedOperators.push('√');
  
  return {
    expression: formattedExpression,
    solution,
    steps,
    difficultyLevel: settings.difficulty,
    operators: usedOperators,
    hasParentheses: useParentheses,
    hasExponents: formattedExpression.includes('^') || formattedExpression.includes('√')
  };
}

// Check if an answer is correct (with a small tolerance for floating-point)
export function checkAnswer(userAnswer: string, correctAnswer: number): boolean {
  const parsed = parseFloat(userAnswer.trim());
  
  if (isNaN(parsed)) {
    return false;
  }
  
  // Use a small tolerance for floating point comparisons
  const tolerance = 0.001;
  return Math.abs(parsed - correctAnswer) < tolerance;
}