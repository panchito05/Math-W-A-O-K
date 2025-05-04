import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Eye, RotateCcw } from 'lucide-react'; // Import icons

// --- Constants ---
const MAX_DIFFICULTY = 5;
const CORRECT_STREAK_THRESHOLD = 10; // Adjusted for potential difficulty increase
const AUTO_CONTINUE_DELAY = 2000;
const TOOLTIP_DISPLAY_TIME = 3000;
const ALWAYS_STEP_TWO_MIN_DIFFICULTY = 3; // Nivel 3-4 siempre requiere Paso 2 numérico
const TWO_BLANKS_POSSIBLE_MIN_DIFFICULTY = 4; // Nivel 4 puede tener 1 o 2 blancos numéricos

// --- Types ---
type BlankPosition = 'a1' | 'b' | 'a2' | 'c'; // Original positions for levels 1-4
type Level5ProblemType = 'foil' | 'simpleDistVar' | 'combined' | 'coeffDist';

// --- MODIFIED Problem Interface ---
interface Problem {
    // --- Fields for Levels 1-4 ---
    num1?: number; // Optional now
    num2?: number; // Optional now
    num3?: number; // Optional now
    innerOperator?: '+' | '-'; // Optional now
    blankTargets?: BlankPosition[]; // Optional now
    correctAnswersStep1?: number[]; // Used for Levels 1-4 numerical blanks
    finalResult?: number; // Numeric result for Levels 1-4
    requiresStep2Calculation?: boolean; // Relevant for Levels 3-4

    // --- Fields specifically for Level 5 ---
    level5Type?: Level5ProblemType;
    leftSideString?: string; // e.g., "(a + ?) * (b - □)"
    rightSideStringTemplate?: string; // e.g., "ab - a□ + ?b - ?□" - template showing structure
    algebraicBlanks?: { symbol: '?' | '□', value: number }[]; // Correct values for ? and □
    variables?: string[]; // e.g., ['a', 'b']
    displayLeftSide?: string; // Pre-rendered left side for display
    displayRightSideParts?: (string | { blankSymbol: '?' | '□' })[]; // Parsed right side for rendering blanks

    // --- Common Fields ---
    difficultyLevelAtGeneration: number;
}


interface UserAnswer {
  problem: Problem;
  // MODIFICADO: Array para respuestas del paso 1 (numeric or algebraic)
  userAnswersStep1: (number | null)[]; // Stores user's numbers for ? and □
  userAnswerStep2: number | null; // Respuesta del paso 2 (only relevant for Levels 3-4)
  step1Correct: boolean | null; // ¿Fue el paso 1 (blanks) completamente correcto?
  isCorrect: boolean; // Correctitud general (Paso 1 + Paso 2 si aplica para L3/4)
  wasRevealed: boolean; // ¿Se reveló el Paso 1 (blanks)?
  timeSpent: number;
  attemptsMadeStep1: number;
  attemptsMadeStep2: number; // Only relevant for Levels 3-4
  difficultyLevel: number;
}

interface Settings {
  difficulty: number;
  problemCount: number;
  timeLimit: number;
  adaptiveDifficulty: boolean;
  maxAttempts: number;
  enableCompensation: boolean;
}

// --- Utility Functions ---

// Fisher-Yates shuffle (no changes)
function shuffleArray<T>(array: T[]): T[] {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// Helper to get random integer in a range
function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// --- NEW: Function to generate Level 5 problems ---
const generateLevel5Problem = (): Problem => {
    const problemType: Level5ProblemType = shuffleArray<Level5ProblemType>(['foil', 'simpleDistVar', 'combined', 'coeffDist'])[0];
    let leftSideString = "";
    let rightSideStringTemplate = "";
    const algebraicBlanks: { symbol: '?' | '□', value: number }[] = [];
    let variables: string[] = [];
    let displayLeftSide = "";
    let displayRightSideParts: (string | { blankSymbol: '?' | '□' })[] = [];

    // Define blank values first (usually small integers)
    const blankValue1 = getRandomInt(1, 9); // Value for '?'
    const blankValue2 = getRandomInt(1, 9); // Value for '□'
    algebraicBlanks.push({ symbol: '?', value: blankValue1 });
    algebraicBlanks.push({ symbol: '□', value: blankValue2 });

    // Generate based on type
    switch (problemType) {
        case 'foil':
            // Pattern: (v1 + ?) * (v2 - □) = v1*v2 - v1*□ + ?*v2 - ?*□
            variables = ['a', 'b']; // Simple variables
            leftSideString = `(a + ${blankValue1}) * (b - ${blankValue2})`; // Store actual values for calculation if needed, display uses symbols
            displayLeftSide = `(a + ?) * (b - □)`;
            // Right side template *must* use the symbols correctly for replacement logic
            rightSideStringTemplate = `ab - a□ + ?b - ?□`;
            displayRightSideParts = ['ab - a', { blankSymbol: '□' }, ' + ', { blankSymbol: '?' }, 'b - ', { blankSymbol: '?' }, { blankSymbol: '□' }];
            break;

        case 'simpleDistVar':
            // Pattern: c1*v1 * (c2*v2 + □*v3) = (c1*c2)*v1*v2 + (c1*□)*v1*v3
            variables = ['x', 'y', 'z'];
            const c1 = getRandomInt(2, 5); // Coefficient 1
            const c2 = getRandomInt(2, 5); // Coefficient 2
            leftSideString = `${c1}${variables[0]} * (${c2}${variables[1]} + ${blankValue2}${variables[2]})`; // □ is blankValue2 here
            displayLeftSide = `${c1}${variables[0]} * (${c2}${variables[1]} + □${variables[2]})`;
            // Right side template
            rightSideStringTemplate = `${c1 * c2}${variables[0]}${variables[1]} + ${c1}x□${variables[0]}${variables[2]}`; // Use 'x' for multiplication context if needed, or adjust
            displayRightSideParts = [`${c1 * c2}${variables[0]}${variables[1]} + ${c1}`, { blankSymbol: '□' }, `${variables[0]}${variables[2]}`];
            // Override □ blank value as it's used differently here
            algebraicBlanks[1] = { symbol: '□', value: blankValue2 }; // Reaffirm or adjust if needed
             // Note: This pattern only uses □. We might adapt it to use both or randomly pick one. Let's keep □ for now.
             // We only need one input field for this specific case. We'll handle this in rendering/submit.
             // Let's simplify and always require 2 blanks for consistency in L5 for now.
             // Alternative pattern: ?v1 * (c1*v2 + □*v3) = (?*c1)*v1*v2 + (?*□)*v1*v3
             const c3 = getRandomInt(2, 5);
             leftSideString = `${blankValue1}${variables[0]} * (${c3}${variables[1]} + ${blankValue2}${variables[2]})`;
             displayLeftSide = `?${variables[0]} * (${c3}${variables[1]} + □${variables[2]})`;
             rightSideStringTemplate = `?*${c3}${variables[0]}${variables[1]} + ?*□${variables[0]}${variables[2]}`; // Need logic to calculate coefficients later
             // Calculate actual coeffs for display parts
             const coeff1 = blankValue1 * c3;
             const coeff2 = blankValue1 * blankValue2;
             // displayRightSideParts = [`${coeff1}${variables[0]}${variables[1]} + ${coeff2}${variables[0]}${variables[2]}`]; // This displays the answer directly
             // Let's keep the template structure for user input:
             displayRightSideParts = [{ blankSymbol: '?' },`*${c3}${variables[0]}${variables[1]} + `,{ blankSymbol: '?' },{ blankSymbol: '□' },`${variables[0]}${variables[2]}`]; // This is complex - shows how user might see it before calculation
             // Let's simplify the right side for the user to fill blanks representing coefficients:
             // Example: 2x * (3y + □z) = 6xy + 2□xz
             const c_sv1 = getRandomInt(2, 5);
             const c_sv2 = getRandomInt(2, 5);
             variables = ['x', 'y', 'z'];
             leftSideString = `${c_sv1}${variables[0]} * (${c_sv2}${variables[1]} + ${blankValue2}${variables[2]})`; // Only □ is used here
             displayLeftSide = `${c_sv1}${variables[0]} * (${c_sv2}${variables[1]} + □${variables[2]})`;
             rightSideStringTemplate = `${c_sv1 * c_sv2}${variables[0]}${variables[1]} + ${c_sv1}□${variables[0]}${variables[2]}`;
             displayRightSideParts = [`${c_sv1 * c_sv2}${variables[0]}${variables[1]} + ${c_sv1}`, { blankSymbol: '□' }, `${variables[0]}${variables[2]}`];
             // Since only □ is used, let's force the unused '?' blank to 0 or remove it. For simplicity, let's keep two blanks required, maybe adjust the pattern.
             // How about: ?x * (cy + □z) = ?c xy + ?□ xz -> user fills ? and □ coefficients. No, too complex.
             // Let's stick to the example: 2x * (3y + □z) = 6xy + 2x□z -> User fills □.
             // How to handle two inputs? We can make the *second* pattern require `?`.
             // Pattern 2: c1*v1 * (?*v2 + c2*v3) = (c1*?)*v1*v2 + (c1*c2)*v1*v3
             const c_sv3 = getRandomInt(2, 5);
             const c_sv4 = getRandomInt(2, 5);
             leftSideString = `${c_sv3}${variables[0]} * (${blankValue1}${variables[1]} + ${c_sv4}${variables[2]})`; // Use '?' (blankValue1)
             displayLeftSide = `${c_sv3}${variables[0]} * (?${variables[1]} + ${c_sv4}${variables[2]})`;
             rightSideStringTemplate = `${c_sv3}?${variables[0]}${variables[1]} + ${c_sv3 * c_sv4}${variables[0]}${variables[2]}`;
             displayRightSideParts = [`${c_sv3}`, { blankSymbol: '?' }, `${variables[0]}${variables[1]} + ${c_sv3 * c_sv4}${variables[0]}${variables[2]}`];
             // Combine: Randomly choose if ? or □ is used. Let's revert to the example pattern for clarity and force 2 blanks later.
             // Reverting to: 2x × (3y + □z) = 6xy + 2x□z
             variables = ['x', 'y', 'z'];
             const c_sv_1 = getRandomInt(2, 6);
             const c_sv_2 = getRandomInt(2, 6);
             leftSideString = `${c_sv_1}${variables[0]} * (${c_sv_2}${variables[1]} + ${blankValue2}${variables[2]})`;
             displayLeftSide = `${c_sv_1}${variables[0]} * (${c_sv_2}${variables[1]} + □${variables[2]})`;
             rightSideStringTemplate = `${c_sv_1 * c_sv_2}${variables[0]}${variables[1]} + ${c_sv_1}□${variables[0]}${variables[2]}`; // Raw template
             // For display, the user fills the *value* of □ in the second term's coefficient calculation
             // The actual right side shown should be expanded: 6xy + 2□xz
             displayRightSideParts = [`${c_sv_1 * c_sv_2}${variables[0]}${variables[1]} + ${c_sv_1}`, { blankSymbol: '□' }, `${variables[0]}${variables[2]}`];
             // This pattern only uses □. To enforce two blanks, let's just make the second blank '?' have a value of 0 or 1 and not display it, or adjust patterns.
             // *Decision*: Modify patterns slightly to always include both ? and □ naturally if possible.
             // Let's try: c1*v1 * (c2*v2 + □*v3) = c1c2*v1v2 + ?*v1v3 (where ? = c1*□)
             variables = ['x', 'y', 'z'];
             const c_svd1 = getRandomInt(2, 6);
             const c_svd2 = getRandomInt(2, 6);
             leftSideString = `${c_svd1}${variables[0]} * (${c_svd2}${variables[1]} + ${blankValue2}${variables[2]})`; // □ = blankValue2
             displayLeftSide = `${c_svd1}${variables[0]} * (${c_svd2}${variables[1]} + □${variables[2]})`;
             const actualCoeff2 = c_svd1 * blankValue2; // This is the value for '?'
             algebraicBlanks[0] = { symbol: '?', value: actualCoeff2 }; // Override '?' value
             rightSideStringTemplate = `${c_svd1 * c_svd2}${variables[0]}${variables[1]} + ?${variables[0]}${variables[2]}`;
             displayRightSideParts = [`${c_svd1 * c_svd2}${variables[0]}${variables[1]} + `, { blankSymbol: '?' }, `${variables[0]}${variables[2]}`];
             // Now we have two blanks: ? (calculated coefficient) and □ (original factor).
             break;

        case 'combined':
             // Pattern: (? + c1)(□ + c2) + c3(? - □) = ?□ + c2? + c1□ + c1c2 + c3? - c3□
             // Right side shown is UNCOMBINED. User fills ? and □ values.
             variables = []; // No explicit variables needed, ? and □ act like variables here
             const c_c1 = getRandomInt(1, 6); // Constant 1
             const c_c2 = getRandomInt(-6, -1); // Constant 2 (negative)
             const c_c3 = getRandomInt(2, 5); // Constant 3
             leftSideString = `(${blankValue1} + ${c_c1})(${blankValue2} + ${c_c2}) + ${c_c3}(${blankValue1} - ${blankValue2})`; // Internal calculation uses values
             displayLeftSide = `(? + ${c_c1})(□ + ${c_c2}) + ${c_c3}(? - □)`;
             // User sees the template for the expanded unsimplified form
             rightSideStringTemplate = `?□ + ${c_c2}? + ${c_c1}□ + ${c_c1 * c_c2} + ${c_c3}? - ${c_c3}□`;
             displayRightSideParts = [
                { blankSymbol: '?' }, { blankSymbol: '□' }, ` + ${c_c2}`, { blankSymbol: '?' }, ` + ${c_c1}`,
                { blankSymbol: '□' }, ` + ${c_c1 * c_c2} + ${c_c3}`, { blankSymbol: '?' }, ` - ${c_c3}`, { blankSymbol: '□' }
             ];
            break;

        case 'coeffDist':
            // Pattern: c1(c2*v1 + ?*v2) - c3(v1 - □*v2) = c1c2*v1 + c1?*v2 - c3*v1 + c3□*v2
            variables = ['a', 'b'];
            const c_cd1 = getRandomInt(2, 5);
            const c_cd2 = getRandomInt(2, 5);
            const c_cd3 = getRandomInt(2, 5);
            leftSideString = `${c_cd1}(${c_cd2}${variables[0]} + ${blankValue1}${variables[1]}) - ${c_cd3}(${variables[0]} - ${blankValue2}${variables[1]})`; // ?=blankValue1, □=blankValue2
            displayLeftSide = `${c_cd1}(${c_cd2}${variables[0]} + ?${variables[1]}) - ${c_cd3}(${variables[0]} - □${variables[1]})`;
            // Right side is expanded but unsimplified
            rightSideStringTemplate = `${c_cd1 * c_cd2}${variables[0]} + ${c_cd1}?${variables[1]} - ${c_cd3}${variables[0]} + ${c_cd3}□${variables[1]}`;
            displayRightSideParts = [
                `${c_cd1 * c_cd2}${variables[0]} + ${c_cd1}`, { blankSymbol: '?' }, `${variables[1]} - ${c_cd3}${variables[0]} + ${c_cd3}`,
                { blankSymbol: '□' }, `${variables[1]}`
            ];
            break;
    }

    return {
        level5Type: problemType,
        leftSideString,
        rightSideStringTemplate,
        algebraicBlanks,
        variables,
        displayLeftSide,
        displayRightSideParts,
        difficultyLevelAtGeneration: 5,
        requiresStep2Calculation: false, // Level 5 is about expansion/blanks, not final numeric calc
    };
};


// --- MODIFIED: generateProblem function ---
const generateProblem = (difficulty: number): Problem => {
    const validDifficulty = Math.max(1, Math.min(MAX_DIFFICULTY, Math.round(difficulty)));

    // --- LEVEL 5 Branch ---
    if (validDifficulty === 5) {
        return generateLevel5Problem();
    }

    // --- Levels 1-4 Logic (Mostly unchanged) ---
    let min: number, max: number;
    switch (validDifficulty) {
        case 1: min = 1; max = 5; break; case 2: min = 1; max = 10; break; case 3: min = 2; max = 12; break; case 4: min = 2; max = 15; break; default: min = 1; max = 5; // Should not happen
    }
    const range = max - min + 1;
    const nums = new Set<number>(); while (nums.size < 3 && (nums.size < range || range < 3)) { nums.add(Math.floor(Math.random() * range) + min); if (nums.size >= range && range < 3) break; } while (nums.size < 3) { nums.add(Math.floor(Math.random() * range) + min); }
    const [num1, num2, num3] = Array.from(nums);
    const innerOperator = (validDifficulty >= 3 && Math.random() < 0.4) ? '-' : '+'; // More likely subtraction at higher levels

    const requiresStep2Calculation = validDifficulty >= ALWAYS_STEP_TWO_MIN_DIFFICULTY;
    let blankTargets: BlankPosition[] = [];
    let correctAnswersStep1: number[] = [];
    const allPossibleTargets: BlankPosition[] = ['a1', 'b', 'a2', 'c'];

    // Determine number of blanks (1 for L1-3, 1 or 2 for L4)
    const numberOfBlanks = (validDifficulty >= TWO_BLANKS_POSSIBLE_MIN_DIFFICULTY && Math.random() < 0.5) ? 2 : 1;

    if (numberOfBlanks === 2) {
        const shuffledTargets = shuffleArray([...allPossibleTargets]);
        blankTargets = [shuffledTargets[0], shuffledTargets[1]].sort();
    } else {
        blankTargets = [allPossibleTargets[Math.floor(Math.random() * allPossibleTargets.length)]];
    }

    // Determine correct answers for numerical blanks
    blankTargets.forEach(target => {
        if (target === 'a1' || target === 'a2') correctAnswersStep1.push(num1);
        else if (target === 'b') correctAnswersStep1.push(num2);
        else correctAnswersStep1.push(num3);
    });

    const finalResult = num1 * (innerOperator === '+' ? num2 + num3 : num2 - num3);

    return {
        num1, num2, num3, innerOperator,
        blankTargets,
        correctAnswersStep1,
        finalResult,
        requiresStep2Calculation,
        difficultyLevelAtGeneration: validDifficulty,
        // Ensure Level 5 fields are undefined/null for L1-4
        level5Type: undefined,
        leftSideString: undefined,
        rightSideStringTemplate: undefined,
        algebraicBlanks: undefined,
        variables: undefined,
        displayLeftSide: undefined,
        displayRightSideParts: undefined,
    };
};

// --- MODIFIED: checkAnswersStep1 (Handles both numeric and algebraic) ---
const checkAnswersStep1 = (problem: Problem, userAnswers: (number | null)[]): boolean => {
    if (problem.difficultyLevelAtGeneration === 5) {
        // Level 5 Check (always 2 blanks: ? and □)
        if (!problem.algebraicBlanks || problem.algebraicBlanks.length !== 2) {
            console.error("Level 5 Problem structure error: Missing algebraicBlanks");
            return false;
        }
        if (userAnswers.length !== 2) return false; // Expecting two answers

        const correctAnswer1 = problem.algebraicBlanks.find(b => b.symbol === '?')?.value;
        const correctAnswer2 = problem.algebraicBlanks.find(b => b.symbol === '□')?.value;

        // Need to handle potential undefined if structure is wrong, though check above helps
        if (correctAnswer1 === undefined || correctAnswer2 === undefined) return false;

        // Compare user input (which corresponds to ? then □)
        return userAnswers[0] === correctAnswer1 && userAnswers[1] === correctAnswer2;

    } else {
        // Levels 1-4 Check (Original Logic)
        if (!problem.correctAnswersStep1 || !problem.blankTargets) return false; // Type guard
        if (userAnswers.length !== problem.correctAnswersStep1.length) return false;
        for (let i = 0; i < problem.correctAnswersStep1.length; i++) {
            if (userAnswers[i] === null || userAnswers[i] !== problem.correctAnswersStep1[i]) {
                return false;
            }
        }
        return true;
    }
};

// checkAnswerStep2 remains the same (only relevant for L3/4 numeric calculation)
const checkAnswerStep2 = (problem: Problem, userAnswer: number): boolean => {
    // Check if finalResult exists and is a number before comparing
    return typeof problem.finalResult === 'number' && userAnswer === problem.finalResult;
}


// --- Settings Component ---
export const DistributiveSettings: React.FC = () => {
  // ... (State and handleChange remain mostly the same) ...
   const [settings, setSettings] = useState<Settings>(() => { /* ... Carga sin cambios ... */
      const saved = localStorage.getItem('math_distributive_settings');
      const defaultSettings: Settings = { difficulty: 1, problemCount: 10, timeLimit: 0, adaptiveDifficulty: true, maxAttempts: 1, enableCompensation: false };
      if (!saved) return defaultSettings;
      try {
          const parsed = JSON.parse(saved);
          return { /* ... Parsing sin cambios ... */
              difficulty: parseInt(parsed.difficulty, 10) || defaultSettings.difficulty,
              problemCount: parseInt(parsed.problemCount, 10) > 0 ? parseInt(parsed.problemCount, 10) : defaultSettings.problemCount,
              timeLimit: parseInt(parsed.timeLimit, 10) || defaultSettings.timeLimit,
              adaptiveDifficulty: typeof parsed.adaptiveDifficulty === 'boolean' ? parsed.adaptiveDifficulty : defaultSettings.adaptiveDifficulty,
              maxAttempts: parseInt(parsed.maxAttempts, 10) >= 1 ? parseInt(parsed.maxAttempts, 10) : defaultSettings.maxAttempts,
              enableCompensation: typeof parsed.enableCompensation === 'boolean' ? parsed.enableCompensation : defaultSettings.enableCompensation,
          };
      } catch { return defaultSettings; }
  });

  useEffect(() => { /* ... Guardado sin cambios ... */
      localStorage.setItem('math_distributive_settings', JSON.stringify(settings));
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { /* ... Sin cambios ... */
      const { name, value, type } = e.target;
      let parsedValue: string | number | boolean;
      if (type === 'checkbox') { parsedValue = (e.target as HTMLInputElement).checked; }
      else if (type === 'number' || type === 'range' || ['problemCount', 'maxAttempts', 'timeLimit', 'difficulty'].includes(name)) {
          const numValue = parseInt(value, 10);
          if (name === 'problemCount') parsedValue = isNaN(numValue) || numValue <= 0 ? 1 : numValue;
          else if (name === 'maxAttempts') parsedValue = Math.max(1, isNaN(numValue) || numValue < 1 ? 1 : numValue);
          else if (name === 'timeLimit') parsedValue = isNaN(numValue) || numValue < 0 ? 0 : numValue;
          else if (name === 'difficulty') parsedValue = isNaN(numValue) ? 1 : Math.max(1, Math.min(MAX_DIFFICULTY, numValue));
          else parsedValue = isNaN(numValue) ? 0 : numValue;
      } else { parsedValue = value; }
      setSettings(prev => ({ ...prev, [name]: parsedValue }));
  };

  // --- MODIFIED renderExampleProblem ---
  const renderExampleProblem = (level: number) => {
      let prob: Problem;
      let attempts = 0;
      // Try to get a representative problem
      do {
          prob = generateProblem(level);
          attempts++;
          // For level 4, prefer showing 2 blanks if possible
          if (level === 4 && prob.blankTargets?.length !== 2 && attempts < 10) continue;
          break; // Found suitable or max attempts reached
      } while (attempts < 10);


      if (level === 5) {
          // Level 5 Example Rendering
          if (!prob.displayLeftSide || !prob.displayRightSideParts) return <p>Error generating L5 example.</p>;
          // Just show the structure
          const rightSideExample = prob.displayRightSideParts.map((part, index) =>
             typeof part === 'string' ? <span key={`rs-${index}`}>{part}</span> : <span key={`rs-${index}`} className="font-bold text-indigo-600 dark:text-indigo-400">{part.blankSymbol}</span>
          ).reduce((prev, curr) => <>{prev}{curr}</>, <></>); // Use reduce to avoid extra space issues

          return (
              <>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1 break-words flex flex-wrap items-center gap-x-1">
                      <span>{prob.displayLeftSide}</span>
                      <span className="mx-1">=</span>
                      {rightSideExample}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Step 1: Find the numeric values for ? and □.</p>
              </>
          );
      } else {
          // Levels 1-4 Example Rendering (Original logic adapted)
          if (!prob.num1 || !prob.num2 || !prob.num3 || !prob.innerOperator || !prob.blankTargets) return <p>Error generating example.</p>;
          let equationStr = `${prob.num1} * (${prob.num2} ${prob.innerOperator} ${prob.num3}) = `;
          const parts = { a1: prob.num1, b: prob.num2, a2: prob.num1, c: prob.num3 };
          const leftTerm = `(${prob.blankTargets.includes('a1') ? '?' : parts.a1} * ${prob.blankTargets.includes('b') ? '?' : parts.b})`;
          const rightTerm = `(${prob.blankTargets.includes('a2') ? '?' : parts.a2} * ${prob.blankTargets.includes('c') ? '?' : parts.c})`;
          equationStr += `${leftTerm} ${prob.innerOperator} ${rightTerm}`;

          let stepDescription = `Step 1: Find the missing number${prob.blankTargets.length > 1 ? 's' : ''} (?).`;
          if (prob.requiresStep2Calculation) {
              stepDescription += ` Step 2: Calculate the final result.`;
          }
          return (
              <>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-1 break-words">{equationStr}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stepDescription}</p>
              </>
          );
      }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Distributive Property Settings</h2>
      <div className="space-y-6">
        {/* Difficulty */}
        <div>
          <label htmlFor="difficultyRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty Level ({settings.difficulty})</label>
          <input id="difficultyRange" type="range" name="difficulty" min="1" max="5" value={settings.difficulty} onChange={handleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1"><span>1</span><span>2</span><span>3</span><span>4</span><span>5 (Algebra)</span></div>
             {/* MODIFICADO: Texto explicativo */}
             <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    L1-2: Basic distribution, numbers up to 10.
                    L3: Includes subtraction, numbers up to 12, requires calculation.
                    L4: May have 2 blanks, numbers up to 15, requires calculation.
                    L5: Algebraic variables, find missing coefficients/constants (always 2 blanks: ?, □).
                </p>
             </div>
        </div>
        {/* ... Other settings unchanged ... */}
        <div><label htmlFor="problemCountInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Initial Number of Problems</label><input type="number" id="problemCountInput" name="problemCount" min="1" max="100" step="1" value={settings.problemCount} onChange={handleChange} className="input-field-style"/></div>
        <div><label htmlFor="maxAttempts" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Attempts per Step</label><input type="number" id="maxAttempts" name="maxAttempts" min="1" value={settings.maxAttempts} onChange={handleChange} className="input-field-style"/><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Applies to finding blank(s) (Step 1) and calculation (Step 2, L3/4 only).</p></div>
        <div className="flex items-center"><input type="checkbox" id="enableCompensation" name="enableCompensation" checked={settings.enableCompensation} onChange={handleChange} className="checkbox-style"/><label htmlFor="enableCompensation" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Enable Compensation (Add 1 problem for each incorrect)</label></div>
        <div><label htmlFor="timeLimitInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Limit (seconds per problem, 0 for no limit)</label><input id="timeLimitInput" type="number" name="timeLimit" min="0" max="120" value={settings.timeLimit} onChange={handleChange} className="input-field-style"/></div>
        <div className="flex items-center"><input type="checkbox" id="adaptiveDifficulty" name="adaptiveDifficulty" checked={settings.adaptiveDifficulty} onChange={handleChange} className="checkbox-style"/><label htmlFor="adaptiveDifficulty" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Enable Adaptive Difficulty (Increases level after {CORRECT_STREAK_THRESHOLD} correct in a row)</label></div>

         {/* Examples (MODIFICADO to show L1, L4, L5) */}
         <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-4">Example Problem Formats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 4, 5].map((level) => ( // Show L1, L4, and L5
                    <div key={level} className={`bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm ${level === 5 ? 'md:col-span-2' : ''}`}> {/* Make L5 span full width on md */}
                        <h4 className="font-medium mb-2">Example (Level {level})</h4>
                        {renderExampleProblem(level)}
                    </div>
                ))}
            </div>
        </div>
      </div>
       <style jsx>{`.input-field-style { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; box-shadow: sm; outline: none; focus:ring-indigo-500 focus:border-indigo-500; font-size: 0.875rem; background-color: white; dark:bg-gray-800 dark:border-gray-700 dark:text-white; } .checkbox-style { height: 1rem; width: 1rem; color: #4f46e5; focus:ring-indigo-500; border-color: #d1d5db; border-radius: 0.25rem; dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-600 dark:ring-offset-gray-800; }`}</style>
    </div>
  );
};


// --- Exercise Component ---
export const DistributiveExercise: React.FC = () => {
  // ... (emitProgressInternal, userSettingsInternal state - unchanged) ...
  const emitProgressInternal = useCallback((data: { correct: boolean; timeSpent: number; difficulty: number; attempts: number; revealed: boolean }) => { /* ... sin cambios ... */
      const event = new CustomEvent('operationProgress', { detail: { operationType: 'distributive', ...data } }); window.dispatchEvent(event);
  }, []);
  const [userSettingsInternal, setUserSettingsInternal] = useState<Settings>(() => { /* ... carga sin cambios ... */
      const saved = localStorage.getItem('math_distributive_settings'); const defaultSettings: Settings = { difficulty: 1, problemCount: 10, timeLimit: 0, adaptiveDifficulty: true, maxAttempts: 1, enableCompensation: false }; if (!saved) return defaultSettings; try { const parsed = JSON.parse(saved); return { difficulty: parseInt(parsed.difficulty, 10) || defaultSettings.difficulty, problemCount: parseInt(parsed.problemCount, 10) > 0 ? parseInt(parsed.problemCount, 10) : defaultSettings.problemCount, timeLimit: parseInt(parsed.timeLimit, 10) || defaultSettings.timeLimit, adaptiveDifficulty: typeof parsed.adaptiveDifficulty === 'boolean' ? parsed.adaptiveDifficulty : defaultSettings.adaptiveDifficulty, maxAttempts: parseInt(parsed.maxAttempts, 10) >= 1 ? parseInt(parsed.maxAttempts, 10) : defaultSettings.maxAttempts, enableCompensation: typeof parsed.enableCompensation === 'boolean' ? parsed.enableCompensation : defaultSettings.enableCompensation, }; } catch { return defaultSettings; }
  });

  // --- State ---
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [inputValue1, setInputValue1] = useState(''); // Corresponds to '?'
  const [inputValue2, setInputValue2] = useState(''); // Corresponds to '□'
  const [problemStartTime, setProblemStartTime] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string; step?: number } | null>(null);
  const [error1, setError1] = useState<string>(''); // Error for input 1 ('?')
  const [error2, setError2] = useState<string>(''); // Error for input 2 ('□')
  const [currentAttemptsStep1, setCurrentAttemptsStep1] = useState(0);
  const [currentAttemptsStep2, setCurrentAttemptsStep2] = useState(0); // Only for L3/4 calculation
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false); // Reveal blanks
  const [currentProblemStep, setCurrentProblemStep] = useState<1 | 2>(1); // 1 = fill blanks, 2 = calculate (L3/4 only)
  const [tempCorrectStep1Answers, setTempCorrectStep1Answers] = useState<(number | null)[]>([]); // Store Step 1 answers before Step 2 (L3/4)
  const [problemDisplayState, setProblemDisplayState] = useState<'active' | 'showing_answer' | 'review'>('active');
  const [targetProblemCount, setTargetProblemCount] = useState(userSettingsInternal.problemCount);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [currentExerciseDifficulty, setCurrentExerciseDifficulty] = useState<number>(userSettingsInternal.difficulty);
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [isAutoContinueEnabled, setIsAutoContinueEnabled] = useState(false);
  const [showAutoContinueTooltip, setShowAutoContinueTooltip] = useState(false);

  // --- Refs (Input refs are important) ---
  const isSubmitting = useRef(false);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const input1Ref = useRef<HTMLInputElement>(null); // Ref for input 1 ('?')
  const input2Ref = useRef<HTMLInputElement>(null); // Ref for input 2 ('□')
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // --- Effects ---
  // Settings Listener (no changes)
  useEffect(() => { /* ... sin cambios ... */
      const handleStorageChange = (event: StorageEvent) => { if (event.key === 'math_distributive_settings' && event.newValue) { try { const newSettings = JSON.parse(event.newValue) as Partial<Settings>; const validatedSettings: Settings = { difficulty: Math.max(1, Math.min(MAX_DIFFICULTY, newSettings.difficulty ?? 1)), problemCount: newSettings.problemCount ?? 10 > 0 ? newSettings.problemCount ?? 10 : 10, timeLimit: newSettings.timeLimit ?? 0 >= 0 ? newSettings.timeLimit ?? 0 : 0, adaptiveDifficulty: typeof newSettings.adaptiveDifficulty === 'boolean' ? newSettings.adaptiveDifficulty : true, maxAttempts: newSettings.maxAttempts ?? 1 >= 1 ? newSettings.maxAttempts ?? 1 : 1, enableCompensation: typeof newSettings.enableCompensation === 'boolean' ? newSettings.enableCompensation : false, }; setUserSettingsInternal(validatedSettings); setTargetProblemCount(validatedSettings.problemCount); } catch (error) { console.error('Error parsing settings from storage:', error); } } }; window.addEventListener('storage', handleStorageChange); return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  // Initialize/Restart Exercise (MODIFIED: Always reset both inputs)
  useEffect(() => {
    console.log("Initializing/Restarting distributive exercise:", userSettingsInternal);
    const initialDifficulty = userSettingsInternal.difficulty;
    setCurrentExerciseDifficulty(initialDifficulty);
    setCurrentProblem(generateProblem(initialDifficulty));
    setCurrentIndex(0);
    setUserAnswers([]);
    setInputValue1(''); // Reset input 1 ('?')
    setInputValue2(''); // Reset input 2 ('□')
    setProblemStartTime(Date.now());
    setIsComplete(false);
    setFeedback(null);
    setError1('');
    setError2('');
    setCurrentAttemptsStep1(0);
    setCurrentAttemptsStep2(0);
    setProblemDisplayState('active');
    setIsAnswerRevealed(false);
    setCurrentProblemStep(1); // Always start at step 1 (finding blanks)
    setTempCorrectStep1Answers([]);
    setConsecutiveCorrectAnswers(0);
    setTargetProblemCount(userSettingsInternal.problemCount);
    setIsReviewMode(false);
    setReviewIndex(0);
    setShowAutoContinueTooltip(false);
    isSubmitting.current = false;

    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    autoContinueTimerRef.current = null; tooltipTimerRef.current = null; holdTimeoutRef.current = null;

    // Enfocar el primer input
    const focusTimeout = setTimeout(() => input1Ref.current?.focus(), 100);
    return () => clearTimeout(focusTimeout);

  }, [userSettingsInternal]); // Dependency array includes userSettingsInternal

  // Cleanup timers (no changes)
  useEffect(() => { /* ... sin cambios ... */
      return () => { if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current); };
  }, []);

   // Focus input (MODIFIED: Focus logic considers errors on both inputs or defaults to input1)
   useEffect(() => {
    if (problemDisplayState === 'active' && !isComplete && currentProblem && !autoContinueTimerRef.current && !isReviewMode) {
        const focusTimeout = setTimeout(() => {
            if (error1) {
                input1Ref.current?.focus();
                input1Ref.current?.select();
            } else if (error2) {
                input2Ref.current?.focus();
                input2Ref.current?.select();
            } else if (currentProblemStep === 1) {
                 input1Ref.current?.focus(); // Default focus to input 1 ('?') in step 1
            } else if (currentProblemStep === 2) { // Only for L3/4
                 input1Ref.current?.focus(); // Re-use input 1 for Step 2 calculation
            }
        }, 50);
        return () => clearTimeout(focusTimeout);
    }
    // Check currentProblem existence and difficulty level
   }, [currentIndex, currentProblemStep, problemDisplayState, isComplete, currentProblem, error1, error2, isReviewMode]);

    // Auto-continue logic (no changes)
    useEffect(() => { /* ... sin cambios ... */
        if (problemDisplayState === 'showing_answer' && isAutoContinueEnabled && !isReviewMode) { if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = setTimeout(handleContinue, AUTO_CONTINUE_DELAY); } return () => { if (autoContinueTimerRef.current) { clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; } };
    }, [problemDisplayState, isAutoContinueEnabled, isReviewMode, currentIndex]);


  // --- Handlers ---

  // handleSubmit (REWRITTEN/ADAPTED for all levels)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswerRevealed || problemDisplayState !== 'active' || isSubmitting.current || !currentProblem) return;

    isSubmitting.current = true;
    setError1('');
    setError2('');
    // setFeedback(null); // Keep feedback until success/fail

    const isLevel5 = currentProblem.difficultyLevelAtGeneration === 5;
    const isStep1 = currentProblemStep === 1; // Filling blanks
    const isStep2 = currentProblemStep === 2; // Calculation (L3/4 only)
    const requiresStep2 = currentProblem.requiresStep2Calculation ?? false; // Only true for L3/4
    const timeSpent = (Date.now() - problemStartTime) / 1000;
    const numBlanksExpected = isLevel5 ? 2 : (currentProblem.blankTargets?.length ?? 0);

    // --- STEP 1 LOGIC (Finding Blanks - All Levels) ---
    if (isStep1) {
        let localError1 = ''; // For Input 1 ('?')
        let localError2 = ''; // For Input 2 ('□')
        let step1AttemptAnswers: (number | null)[] = [null, null]; // Always store 2 attempts for consistency
        let numericAnswer1: number | null = null;
        let numericAnswer2: number | null = null;

        // Validate Input 1 ('?')
        if (inputValue1.trim() === '') { localError1 = 'Please enter a number for ?.'; }
        else { numericAnswer1 = parseInt(inputValue1, 10); if (isNaN(numericAnswer1)) localError1 = 'Invalid number for ?.'; }
        step1AttemptAnswers[0] = numericAnswer1;

        // Validate Input 2 ('□') - Required for L5, or if L4 has 2 blanks
        if (isLevel5 || numBlanksExpected === 2) {
            if (inputValue2.trim() === '') { localError2 = 'Please enter a number for □.'; }
            else { numericAnswer2 = parseInt(inputValue2, 10); if (isNaN(numericAnswer2)) localError2 = 'Invalid number for □.'; }
            step1AttemptAnswers[1] = numericAnswer2;
        } else {
             step1AttemptAnswers.pop(); // Only one answer needed if not L5 and not 2 blanks
        }


        // If validation errors, show them and stop
        if (localError1 || localError2) {
            setError1(localError1);
            setError2(localError2);
            isSubmitting.current = false;
            return;
        }

        // Check correctness using the unified checkAnswersStep1
        const attemptsSoFarThisStep = currentAttemptsStep1 + 1;
        setCurrentAttemptsStep1(attemptsSoFarThisStep);
        // Pass only the relevant number of answers based on expectation
        const answersToCheck = isLevel5 || numBlanksExpected == 2 ? step1AttemptAnswers : [step1AttemptAnswers[0]];
        const isCorrectThisStep = checkAnswersStep1(currentProblem, answersToCheck);

        if (isCorrectThisStep) {
            // Correct Step 1 (Blanks)
            setTempCorrectStep1Answers(answersToCheck); // Save correct answers

            if (requiresStep2) { // Only for L3/4
                setFeedback({ correct: true, message: `Correct! Now calculate the final result.`, step: 1 });
                setCurrentProblemStep(2); // Move to Step 2 (calculation)
                setInputValue1(''); // Clear input 1 (reused for Step 2 calc)
                setInputValue2(''); // Clear input 2 (not used for Step 2 calc)
                setError1('');
                setError2('');
                isSubmitting.current = false;
            } else {
                // Correct Step 1, and no Step 2 needed (Levels 1-2, Level 5)
                const message = isLevel5 ? "Correct! Algebraic distribution applied." : "Correct! Property demonstrated.";
                setFeedback({ correct: true, message: message, step: 1 });
                setProblemDisplayState('showing_answer');
                setUserAnswers(prev => [...prev, {
                    problem: currentProblem, userAnswersStep1: answersToCheck, userAnswerStep2: null,
                    step1Correct: true, isCorrect: true, wasRevealed: false, timeSpent,
                    attemptsMadeStep1: attemptsSoFarThisStep, attemptsMadeStep2: 0, // No step 2 attempts here
                    difficultyLevel: currentExerciseDifficulty
                }]);
                emitProgressInternal({ correct: true, timeSpent, difficulty: currentExerciseDifficulty, attempts: attemptsSoFarThisStep, revealed: false });
                setConsecutiveCorrectAnswers(prev => prev + 1);
                isSubmitting.current = false;
            }
        } else {
            // Incorrect Step 1 (Blanks)
            const hasAttemptsLeft = userSettingsInternal.maxAttempts === 0 || attemptsSoFarThisStep < userSettingsInternal.maxAttempts;
            if (hasAttemptsLeft || userSettingsInternal.maxAttempts === 0) {
                const attemptsRemaining = userSettingsInternal.maxAttempts === 0 ? "Unlimited" : userSettingsInternal.maxAttempts - attemptsSoFarThisStep;
                const errorMsg = `Incorrect value${numBlanksExpected > 1 ? 's' : ''}. Try again.`;
                setFeedback({ correct: false, message: `${errorMsg} (Attempts left: ${attemptsRemaining})`, step: 1 });

                // Provide specific errors if possible (L5 always compares both)
                let specificError1 = 'Incorrect value for ?.';
                let specificError2 = 'Incorrect value for □.';
                 if (isLevel5) {
                     const correctAnswer1 = currentProblem.algebraicBlanks?.find(b => b.symbol === '?')?.value;
                     const correctAnswer2 = currentProblem.algebraicBlanks?.find(b => b.symbol === '□')?.value;
                     if (numericAnswer1 === correctAnswer1) { specificError1 = ''; setError1(''); } else { setError1(specificError1); setInputValue1('');}
                     if (numericAnswer2 === correctAnswer2) { specificError2 = ''; setError2(''); } else { setError2(specificError2); setInputValue2('');}
                 } else if (numBlanksExpected === 2 && currentProblem.correctAnswersStep1) { // L4 with 2 blanks
                     if (numericAnswer1 === currentProblem.correctAnswersStep1[0]) { specificError1 = ''; setError1(''); } else { setError1(specificError1); setInputValue1(''); }
                     if (numericAnswer2 === currentProblem.correctAnswersStep1[1]) { specificError2 = ''; setError2(''); } else { setError2(specificError2); setInputValue2(''); }
                 } else if (numBlanksExpected === 1){ // L1-3, or L4 with 1 blank
                     setError1('Incorrect value.'); setInputValue1('');
                     setError2(''); setInputValue2(''); // Clear second input if it exists but wasn't needed
                 } else { // Fallback
                     setError1('Incorrect.'); setInputValue1('');
                     setError2(''); setInputValue2('');
                 }

                isSubmitting.current = false;
            } else {
                // Incorrect Step 1, no attempts left
                let correctValuesString = "";
                if (isLevel5 && currentProblem.algebraicBlanks) {
                    correctValuesString = `? = ${currentProblem.algebraicBlanks.find(b => b.symbol === '?')?.value}, □ = ${currentProblem.algebraicBlanks.find(b => b.symbol === '□')?.value}`;
                } else if (currentProblem.correctAnswersStep1) {
                    correctValuesString = currentProblem.correctAnswersStep1.join(' and ');
                }
                setFeedback({ correct: false, message: `Incorrect. Correct value${numBlanksExpected > 1 ? 's were' : ' was'}: ${correctValuesString}.`, step: 1 });
                setProblemDisplayState('showing_answer');
                setUserAnswers(prev => [...prev, {
                    problem: currentProblem, userAnswersStep1: answersToCheck, userAnswerStep2: null,
                    step1Correct: false, isCorrect: false, wasRevealed: false, timeSpent,
                    attemptsMadeStep1: attemptsSoFarThisStep, attemptsMadeStep2: 0, difficultyLevel: currentExerciseDifficulty
                }]);
                emitProgressInternal({ correct: false, timeSpent, difficulty: currentExerciseDifficulty, attempts: attemptsSoFarThisStep, revealed: false });
                setConsecutiveCorrectAnswers(0);
                 if (userSettingsInternal.enableCompensation) {
                    setTargetProblemCount(prev => prev + 1);
                    toast.info("Incorrect problem (Step 1), adding one more.", { duration: 2000 });
                 }
                isSubmitting.current = false;
            }
        }
    }
    // --- STEP 2 LOGIC (Final Calculation - Only for Levels 3-4) ---
    else if (isStep2 && requiresStep2) {
        let localError1 = ''; // Step 2 uses Input 1
        let numericAnswerStep2: number | null = null;

        // Validate Input 1 (reused for Step 2)
        if (inputValue1.trim() === '') { localError1 = 'Please enter the result.'; }
        else { numericAnswerStep2 = parseInt(inputValue1, 10); if (isNaN(numericAnswerStep2)) localError1 = 'Invalid number.'; }

        if (localError1) {
            setError1(localError1);
            setError2(''); // Clear error 2
            isSubmitting.current = false;
            return;
        }

        // Check correctness
        const attemptsSoFarThisStep = currentAttemptsStep2 + 1;
        setCurrentAttemptsStep2(attemptsSoFarThisStep);
        const isCorrectThisStep = checkAnswerStep2(currentProblem, numericAnswerStep2!);

        if (isCorrectThisStep) {
            // Correct Step 2
            setFeedback({ correct: true, message: `Excellent! Both steps correct.`, step: 2 });
            setProblemDisplayState('showing_answer');
            setUserAnswers(prev => [...prev, {
                problem: currentProblem,
                userAnswersStep1: tempCorrectStep1Answers, // Use the saved correct Step 1 answers
                userAnswerStep2: numericAnswerStep2,
                step1Correct: true, isCorrect: true, wasRevealed: false, timeSpent,
                attemptsMadeStep1: currentAttemptsStep1,
                attemptsMadeStep2: attemptsSoFarThisStep, difficultyLevel: currentExerciseDifficulty
            }]);
            emitProgressInternal({ correct: true, timeSpent, difficulty: currentExerciseDifficulty, attempts: currentAttemptsStep1 + attemptsSoFarThisStep, revealed: false });
            setConsecutiveCorrectAnswers(prev => prev + 1);
            isSubmitting.current = false;
        } else {
            // Incorrect Step 2
            const hasAttemptsLeft = userSettingsInternal.maxAttempts === 0 || attemptsSoFarThisStep < userSettingsInternal.maxAttempts;
             if (hasAttemptsLeft || userSettingsInternal.maxAttempts === 0) {
                 const attemptsRemaining = userSettingsInternal.maxAttempts === 0 ? "Unlimited" : userSettingsInternal.maxAttempts - attemptsSoFarThisStep;
                 setFeedback({ correct: false, message: `Incorrect calculation. Try again. (Attempts left: ${attemptsRemaining})`, step: 2 });
                 setError1(`Incorrect result. Try again.`); // Error on Input 1
                 setError2('');
                 setInputValue1(''); // Clear Input 1 for retry
                 isSubmitting.current = false;
             } else {
                 // Incorrect Step 2, no attempts left
                 setFeedback({ correct: false, message: `Incorrect calculation. Result was ${currentProblem.finalResult}.`, step: 2 });
                 setProblemDisplayState('showing_answer');
                 setUserAnswers(prev => [...prev, {
                    problem: currentProblem,
                    userAnswersStep1: tempCorrectStep1Answers, // Step 1 was correct
                    userAnswerStep2: numericAnswerStep2, // But Step 2 failed
                    step1Correct: true, isCorrect: false, wasRevealed: false, timeSpent,
                    attemptsMadeStep1: currentAttemptsStep1, attemptsMadeStep2: attemptsSoFarThisStep, difficultyLevel: currentExerciseDifficulty
                 }]);
                 emitProgressInternal({ correct: false, timeSpent, difficulty: currentExerciseDifficulty, attempts: currentAttemptsStep1 + attemptsSoFarThisStep, revealed: false });
                 setConsecutiveCorrectAnswers(0);
                  if (userSettingsInternal.enableCompensation) {
                    setTargetProblemCount(prev => prev + 1);
                    toast.info("Incorrect problem (Step 2), adding one more.", { duration: 2000 });
                  }
                 isSubmitting.current = false;
            }
        }
    } // End Step 2 Logic

     // Adaptive Difficulty Check (Common Logic)
     // Needs to determine if the current state corresponds to a fully correct problem completion
     const wasFullyCorrect = problemDisplayState === 'showing_answer' && feedback?.correct === true;

     if (wasFullyCorrect && userSettingsInternal.adaptiveDifficulty) {
       const currentStreak = consecutiveCorrectAnswers + 1; // Already incremented if correct
       if (currentStreak >= CORRECT_STREAK_THRESHOLD && currentExerciseDifficulty < MAX_DIFFICULTY) {
           const nextDifficulty = currentExerciseDifficulty + 1;
           setCurrentExerciseDifficulty(nextDifficulty);
           setConsecutiveCorrectAnswers(0); // Reset streak
            let nextRangeDesc = ""; // Provide context for level up
            switch (nextDifficulty) { case 2: nextRangeDesc="numbers up to 10"; break; case 3: nextRangeDesc="subtraction, numbers up to 12"; break; case 4: nextRangeDesc="potential 2 blanks, numbers up to 15"; break; case 5: nextRangeDesc="algebraic expressions"; break; default: nextRangeDesc="numbers up to 5"; }
           toast.info(`Level Up! Difficulty increased to ${nextDifficulty} (${nextRangeDesc}).`, { duration: 3000 });
       }
       // No else needed here, consecutiveCorrectAnswers was already incremented if correct
     } else if (problemDisplayState === 'showing_answer' && feedback?.correct === false) {
        // If the problem ended incorrectly (either Step 1 fail or Step 2 fail)
        setConsecutiveCorrectAnswers(0); // Reset streak
     }
     // Note: consecutiveCorrectAnswers is handled correctly inside the correct paths now. This block just handles level up.

  }; // End handleSubmit


  // handleShowAnswer (MODIFIED: Reveals blanks for all levels)
  const handleShowAnswer = () => {
    // Can only reveal in Step 1 (finding blanks)
    if (isAnswerRevealed || currentProblemStep !== 1 || problemDisplayState !== 'active' || isSubmitting.current || !currentProblem) return;
    isSubmitting.current = true; // Prevent race conditions
    setConsecutiveCorrectAnswers(0); // Revealing breaks streak

    const timeSpent = (Date.now() - problemStartTime) / 1000;
    const attemptsCounted = userSettingsInternal.maxAttempts > 0 ? userSettingsInternal.maxAttempts : 1; // Count as max attempts used for Step 1
    const isLevel5 = currentProblem.difficultyLevelAtGeneration === 5;
    const numBlanks = isLevel5 ? 2 : (currentProblem.blankTargets?.length ?? 0);

    setIsAnswerRevealed(true);

    let correctValues: (number | string)[] = [];
    let revealMessage = "";

    if (isLevel5 && currentProblem.algebraicBlanks) {
        const val1 = currentProblem.algebraicBlanks.find(b => b.symbol === '?')?.value ?? 'N/A';
        const val2 = currentProblem.algebraicBlanks.find(b => b.symbol === '□')?.value ?? 'N/A';
        correctValues = [val1, val2];
        revealMessage = `Revealed: ? = ${val1}, □ = ${val2}.`;
        setInputValue1(val1.toString());
        setInputValue2(val2.toString());
    } else if (currentProblem.correctAnswersStep1) { // Levels 1-4
        correctValues = [...currentProblem.correctAnswersStep1];
        revealMessage = `Revealed: The missing number${numBlanks > 1 ? 's were' : ' was'} ${correctValues.join(' and ')}.`;
        setInputValue1(correctValues[0]?.toString() ?? '');
        if (numBlanks > 1) {
            setInputValue2(correctValues[1]?.toString() ?? '');
        } else {
            setInputValue2(''); // Clear second input if only one blank
        }
    } else {
        revealMessage = "Could not determine correct values to reveal.";
         setInputValue1('');
         setInputValue2('');
    }

    setFeedback({ correct: false, message: revealMessage, step: 1 });
    setProblemDisplayState('showing_answer'); // Move to showing answer state

    // Record the revealed attempt
    setUserAnswers(prev => [...prev, {
        problem: currentProblem,
        userAnswersStep1: Array(numBlanks).fill(null), // Mark Step 1 answers as null/not provided by user
        userAnswerStep2: null,
        step1Correct: false, isCorrect: false, // Mark overall as incorrect
        wasRevealed: true, timeSpent,
        attemptsMadeStep1: attemptsCounted, attemptsMadeStep2: 0, // Step 2 not attempted
        difficultyLevel: currentExerciseDifficulty
    }]);
    emitProgressInternal({ correct: false, timeSpent, difficulty: currentExerciseDifficulty, attempts: attemptsCounted, revealed: true });

    if (userSettingsInternal.enableCompensation) {
        setTargetProblemCount(prev => prev + 1);
         toast.info("Revealed answer, adding one more problem.", { duration: 2000 });
    }

    setError1(''); setError2('');
    isSubmitting.current = false; // Allow continue button etc.
    // Auto-continue will be handled by useEffect if enabled
  };

  // handleContinue (MODIFIED: Reset both inputs consistently)
  const handleContinue = useCallback(() => {
    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
    if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current);
    autoContinueTimerRef.current = null; holdTimeoutRef.current = null;

    if (currentIndex >= targetProblemCount - 1) {
      setIsComplete(true);
      setProblemDisplayState('review'); // Or 'finished'
      return;
    }

    const nextProblemIndex = currentIndex + 1;
    // generateProblem uses currentExerciseDifficulty which might have adapted
    const nextProblem = generateProblem(currentExerciseDifficulty);

    setCurrentProblem(nextProblem);
    setCurrentIndex(nextProblemIndex);
    setProblemDisplayState('active');
    setFeedback(null);
    setInputValue1(''); // Reset input 1 ('?')
    setInputValue2(''); // Reset input 2 ('□')
    setError1('');
    setError2('');
    setCurrentAttemptsStep1(0);
    setCurrentAttemptsStep2(0); // Reset step 2 attempts too
    setIsAnswerRevealed(false);
    setCurrentProblemStep(1); // Always start at step 1 (finding blanks)
    setTempCorrectStep1Answers([]);
    setProblemStartTime(Date.now());
    isSubmitting.current = false;

    // Focus handled by useEffect
  }, [currentIndex, targetProblemCount, currentExerciseDifficulty, generateProblem]); // generateProblem depends on currentExerciseDifficulty


  // handleAutoContinueChange, handleCheckboxAreaClick, HOLD LOGIC, restartExercise (No changes needed)
  const handleAutoContinueChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... */ const isChecked = e.target.checked; setIsAutoContinueEnabled(isChecked); if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); if (isChecked) { setShowAutoContinueTooltip(true); tooltipTimerRef.current = setTimeout(() => setShowAutoContinueTooltip(false), TOOLTIP_DISPLAY_TIME); } else { setShowAutoContinueTooltip(false); if (autoContinueTimerRef.current) { clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; } } };
  const handleCheckboxAreaClick = (e: React.MouseEvent) => e.stopPropagation();
  const handleHoldPress = () => { /* ... */ if (!isAutoContinueEnabled || problemDisplayState !== 'showing_answer') return; if (autoContinueTimerRef.current) { clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; } if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current); holdTimeoutRef.current = setTimeout(() => { /* Held */ }, 150); };
  const handleHoldRelease = () => { /* ... */ if (!isAutoContinueEnabled || problemDisplayState !== 'showing_answer') return; if (holdTimeoutRef.current) { clearTimeout(holdTimeoutRef.current); holdTimeoutRef.current = null; } };
  const restartExercise = () => { setIsReviewMode(false); setUserSettingsInternal(prev => ({ ...prev })); }; // Trigger re-init via useEffect on userSettingsInternal

  // REVIEW MODE HANDLERS (No changes needed for L5 logic here, rendering handles it)
  const handleEnterReview = () => { /* ... */ if (userAnswers.length === 0) return; setIsReviewMode(true); setReviewIndex(userAnswers.length - 1); if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; };
  const handleExitReview = () => { /* ... */ setIsReviewMode(false); if(problemDisplayState === 'active') { input1Ref.current?.focus(); } if (problemDisplayState === 'showing_answer' && isAutoContinueEnabled) { if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = setTimeout(handleContinue, AUTO_CONTINUE_DELAY); } };
  const handleReviewNext = () => { /* ... */ setReviewIndex(prev => Math.min(prev + 1, userAnswers.length - 1)); };
  const handleReviewPrev = () => { /* ... */ setReviewIndex(prev => Math.max(prev - 1, 0)); };


  // --- Render Helper for Equation (MODIFIED for All Levels) ---
  const renderEquation = (
      problem: Problem | null,
      highlightStep: 1 | 2 | null = null, // 1=blanks, 2=calculation (L3/4)
      step1AnswersToShow: (number | null)[] = [], // Correct answers from Step 1 for display after completion
      showFinalResult: boolean = false // Show L3/4 final calculated result
   ) => {
      if (!problem) return null;

      // --- Level 5 Rendering ---
      if (problem.difficultyLevelAtGeneration === 5) {
          if (!problem.displayLeftSide || !problem.displayRightSideParts || !problem.algebraicBlanks) {
             return <span className="text-red-500">Error rendering L5 problem.</span>;
          }

          const getAnswerForSymbol = (symbol: '?' | '□'): number | string => {
              // Show correct answer if revealed or showing final answer state
              if (isAnswerRevealed || problemDisplayState === 'showing_answer') {
                  return problem.algebraicBlanks?.find(b => b.symbol === symbol)?.value ?? symbol;
              }
              // Otherwise, show the symbol as placeholder
              return symbol;
          };

          // Build the right side string with placeholders or answers
          const rightSideRendered = problem.displayRightSideParts.map((part, index) => {
              if (typeof part === 'string') {
                  return <span key={`rs-${index}`}>{part}</span>;
              } else {
                  const isBlankToHighlight = highlightStep === 1; // Step 1 is always finding blanks
                  const symbol = part.blankSymbol;
                  const content = getAnswerForSymbol(symbol); // Gets '?' or '□' or the revealed/correct number
                  const isActualSymbol = content === '?' || content === '□'; // Check if we are showing the symbol

                  return (
                      <span key={`rs-${index}`} className={`inline-block text-center font-semibold mx-px ${
                          isBlankToHighlight && isActualSymbol
                              ? 'text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-2 px-1' // Highlight active input symbol
                              : isActualSymbol
                              ? 'text-gray-900 dark:text-gray-100 px-1' // Non-highlighted symbol
                              : 'text-green-700 dark:text-green-300' // Correct answer shown
                         }`}
                      >
                          {content}
                      </span>
                  );
              }
          }).reduce((prev, curr) => <>{prev}{curr}</>, <></>); // Use reduce to handle spacing better


          return (
            <>
              {/* Left Side (Algebraic) */}
              <span className="font-mono">{problem.displayLeftSide}</span>
              <span className="mx-1.5 text-gray-500 dark:text-gray-400">=</span>
              {/* Right Side (Algebraic with blanks/answers) */}
              <span className="font-mono">{rightSideRendered}</span>
            </>
          );
      }
      // --- Levels 1-4 Rendering ---
      else {
         if (!problem.num1 || !problem.num2 || !problem.num3 || !problem.innerOperator || !problem.blankTargets || !problem.correctAnswersStep1) {
            return <span className="text-red-500">Error rendering L1-4 problem.</span>;
         }
          const { num1, num2, num3, innerOperator, blankTargets, correctAnswersStep1, finalResult } = problem;
          const parts = { a1: num1, b: num2, a2: num1, c: num3 };

          const renderNumericPart = (partKey: BlankPosition, partValue: number) => {
              const isBlank = blankTargets.includes(partKey);
              if (isBlank) {
                  const highlightBlank = highlightStep === 1; // Highlight blanks in step 1
                  const answerIndex = blankTargets.indexOf(partKey);
                  let content: string | number = '?';

                  if (isAnswerRevealed || problemDisplayState === 'showing_answer') {
                      content = correctAnswersStep1[answerIndex] ?? '?'; // Show correct if revealed/done
                  } else if (highlightStep !== 1 && step1AnswersToShow && step1AnswersToShow.length > answerIndex && step1AnswersToShow[answerIndex] !== null) {
                       content = step1AnswersToShow[answerIndex]!; // Show user's correct step 1 answer before step 2
                  }

                  return <span key={`${partKey}`} className={`inline-block text-center font-semibold mx-1 ${highlightBlank && content === '?' ? 'text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-2' : (content !== '?' ? 'text-green-700 dark:text-green-300' : 'text-gray-900 dark:text-gray-100')}`}>{content}</span>;
              } else {
                  return <span key={partKey}>{partValue}</span>;
              }
          };

          const leftSideClasses = highlightStep === 2 ? "font-bold text-green-700 dark:text-green-300" : ""; // Highlight left side for step 2 calc

          return (
            <>
              {/* Left Side: a * (b op c) */}
              <span className={leftSideClasses}>{num1}</span> <span className={`mx-1 text-red-600 dark:text-red-400 font-semibold ${leftSideClasses}`}>*</span> <span className={leftSideClasses}>(</span> <span className={leftSideClasses}>{num2}</span> <span className={`mx-1 text-blue-600 dark:text-blue-400 font-semibold ${leftSideClasses}`}>{innerOperator}</span> <span className={leftSideClasses}>{num3}</span> <span className={leftSideClasses}>)</span>
              <span className="mx-1.5 text-gray-500 dark:text-gray-400">=</span>
              {/* Right Side: (a*b) op (a*c) con blancos */}
              <span>(</span> {renderNumericPart('a1', num1)} <span className="mx-1 text-red-600 dark:text-red-400 font-semibold">*</span> {renderNumericPart('b', num2)} <span>)</span>
              <span className="mx-1 text-blue-600 dark:text-blue-400 font-semibold">{innerOperator}</span>
              <span>(</span> {renderNumericPart('a2', num1)} <span className="mx-1 text-red-600 dark:text-red-400 font-semibold">*</span> {renderNumericPart('c', num3)} <span>)</span>
              {/* Mostrar el resultado final si estamos en 'showing_answer' y se requería cálculo */}
              {showFinalResult && problem.requiresStep2Calculation && typeof finalResult === 'number' && (
                <span className="ml-2 font-bold text-green-700 dark:text-green-300"> = {finalResult}</span>
              )}
            </>
          );
      }
  };


    // --- Render Helper for Review Screen (ADAPTED for All Levels) ---
   const renderReviewScreen = () => {
        if (!isReviewMode || userAnswers.length === 0) return null;
        const reviewAnswer = userAnswers[reviewIndex];
        if (!reviewAnswer) return <div>Error: Review answer not found.</div>;

         const { problem, userAnswersStep1, userAnswerStep2, step1Correct, isCorrect: isCorrectOverall, wasRevealed, timeSpent, attemptsMadeStep1, attemptsMadeStep2, difficultyLevel } = reviewAnswer;
         const isLevel5Review = difficultyLevel === 5;
         const neededStep2Numeric = problem.requiresStep2Calculation ?? false; // L3/4

         // --- Helper to render equation in REVIEW mode ---
          const renderReviewEquationInternalHelper = (
              problem: Problem,
              step1UserAnswers: (number | null)[],
              step1Correct: boolean | null,
              wasRevealed: boolean
          ) => {
               // --- L5 Review Rendering ---
               if (problem.difficultyLevelAtGeneration === 5) {
                   if (!problem.displayLeftSide || !problem.displayRightSideParts || !problem.algebraicBlanks) return <>Error L5 Review</>;

                    const getReviewSymbolDisplay = (symbol: '?' | '□', index: number): React.ReactNode => {
                       const userAnswer = (step1UserAnswers && step1UserAnswers.length > index) ? step1UserAnswers[index] : null;
                       const correctAnswer = problem.algebraicBlanks?.find(b => b.symbol === symbol)?.value;
                       const displayValue = userAnswer ?? symbol; // Show user answer or symbol if no answer
                       let spanClass = "";
                       let correctValueSpan: React.ReactNode = null;

                       if (wasRevealed) {
                           spanClass = "font-semibold text-orange-700 dark:text-orange-400";
                           correctValueSpan = <span className="ml-1 text-xs text-green-600 dark:text-green-400 font-semibold">({correctAnswer ?? '?'})</span>;
                       } else if (step1Correct === true) {
                           spanClass = "font-semibold text-green-700 dark:text-green-300"; // Correct blank
                       } else if (step1Correct === false && userAnswer !== null) {
                           // Step 1 failed overall, but check this specific blank
                           if (userAnswer === correctAnswer) {
                               spanClass = "font-semibold text-green-700 dark:text-green-300 opacity-70"; // Correct blank, but others were wrong
                           } else {
                               spanClass = "font-semibold line-through text-red-700 dark:text-red-400"; // Incorrect blank
                               correctValueSpan = <span className="ml-1 text-xs text-green-600 dark:text-green-400 font-semibold">({correctAnswer ?? '?'})</span>;
                           }
                       } else { // No user answer and not revealed or correct -> show symbol plainly
                           spanClass = "font-semibold text-gray-900 dark:text-gray-100";
                       }

                       return (
                           <span className="inline-flex items-center">
                               <span className={spanClass}>{displayValue}</span>
                               {correctValueSpan}
                           </span>
                       );
                   };


                   const rightSideRendered = problem.displayRightSideParts.map((part, index) => {
                       if (typeof part === 'string') {
                           return <span key={`rsr-${index}`}>{part}</span>;
                       } else {
                           const symbol = part.blankSymbol;
                           // Determine if this corresponds to the first or second user answer based on symbol
                           const answerIndex = symbol === '?' ? 0 : 1;
                           return <span key={`rsr-${index}`}>{getReviewSymbolDisplay(symbol, answerIndex)}</span>;
                       }
                   }).reduce((prev, curr) => <>{prev}{curr}</>, <></>);

                   return (
                     <>
                       <span className="font-mono">{problem.displayLeftSide}</span>
                       <span className="mx-1">=</span>
                       <span className="font-mono">{rightSideRendered}</span>
                       {wasRevealed && <span className="ml-1 text-xs text-orange-700 dark:text-orange-400 opacity-80">(R)</span>}
                     </>
                   );
               }
               // --- L1-4 Review Rendering ---
               else {
                    if (!problem.num1 || !problem.num2 || !problem.num3 || !problem.innerOperator || !problem.blankTargets || !problem.correctAnswersStep1) return <>Error L1-4 Review</>;
                    const { num1, num2, num3, innerOperator, blankTargets, correctAnswersStep1 } = problem;
                    const parts = { a1: num1, b: num2, a2: num1, c: num3 };

                     const renderReviewPartNumeric = (partKey: BlankPosition, partValue: number) => {
                         const isBlank = blankTargets.includes(partKey);
                         if (isBlank) {
                             const answerIndex = blankTargets.indexOf(partKey);
                             const userAnswer = (step1UserAnswers && step1UserAnswers.length > answerIndex) ? step1UserAnswers[answerIndex] : null;
                             const correctAnswer = correctAnswersStep1[answerIndex];
                             const displayValue = userAnswer ?? '?';
                             let spanClass = "";
                             let correctValueSpan: React.ReactNode = null;

                              if (wasRevealed) { spanClass = "font-semibold text-orange-700 dark:text-orange-400"; correctValueSpan = <span className="ml-1 text-sm text-green-600 dark:text-green-400 font-semibold">({correctAnswer})</span>; }
                              else if (step1Correct === true) { spanClass = "font-semibold text-green-700 dark:text-green-300"; }
                              else if (step1Correct === false && userAnswer !== null) { if (userAnswer === correctAnswer) { spanClass = "font-semibold text-green-700 dark:text-green-300 opacity-70"; } else { spanClass = "font-semibold line-through text-red-700 dark:text-red-400"; correctValueSpan = <span className="ml-1 text-sm text-green-600 dark:text-green-400 font-semibold">({correctAnswer})</span>; }
                              } else { spanClass = "text-gray-900 dark:text-gray-100"; }


                             return <span key={`${partKey}-rev`} className="inline-flex items-center">
                                        <span className={spanClass}>{displayValue}</span>
                                        {correctValueSpan}
                                    </span>;
                         } else {
                             return <span key={partKey + '-rev'}>{partValue}</span>;
                         }
                     };

                    return (
                     <>
                       <span>{num1}</span><span className="mx-0.5">*</span><span>({num2}{innerOperator}{num3})</span>
                       <span className="mx-1">=</span>
                       <span>(</span> {renderReviewPartNumeric('a1', num1)} <span className="mx-0.5">*</span> {renderReviewPartNumeric('b', num2)} <span>)</span>
                       <span className="mx-1">{innerOperator}</span>
                       <span>(</span> {renderReviewPartNumeric('a2', num1)} <span className="mx-0.5">*</span> {renderReviewPartNumeric('c', num3)} <span>)</span>
                       {wasRevealed && <span className="ml-1 text-xs text-orange-700 dark:text-orange-400 opacity-80">(R)</span>}
                     </>
                    );
               }
          }; // End renderReviewEquationInternalHelper


        return (
            <div className="absolute inset-0 bg-white dark:bg-gray-800 p-6 rounded-xl z-20 flex flex-col">
                <h3 className="text-lg font-semibold mb-4 text-center text-gray-700 dark:text-gray-200">Reviewing Problem {reviewIndex + 1} / {userAnswers.length}</h3>
                 {/* Problema Mostrado */}
                 <div className="text-base sm:text-lg font-medium mb-3 text-gray-800 dark:text-gray-100 flex justify-center items-center flex-wrap gap-x-1 sm:gap-x-1.5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                     {renderReviewEquationInternalHelper(problem, userAnswersStep1, step1Correct, wasRevealed)}
                 </div>

                 {/* Resultado Paso 2 (Only L3/4) */}
                 {neededStep2Numeric && !isLevel5Review && !wasRevealed && step1Correct && userAnswerStep2 !== null && (
                    <div className="mt-2 text-sm text-center">
                         <span className="text-gray-600 dark:text-gray-400">Your Result Calculation: </span>
                         {isCorrectOverall ? ( <span className="font-semibold text-green-700 dark:text-green-300">{userAnswerStep2} (Correct)</span>
                         ) : ( <> <span className="font-semibold line-through text-red-700 dark:text-red-400">{userAnswerStep2}</span> <span className="ml-1 text-sm text-green-600 dark:text-green-400 font-semibold">({problem.finalResult ?? '?'})</span> </>
                         )}
                    </div>
                  )}
                 {neededStep2Numeric && !isLevel5Review && (!step1Correct || wasRevealed) && ( // Show correct result if step 1 failed/revealed (L3/4)
                    <div className="mt-2 text-sm text-center text-gray-500 dark:text-gray-400">
                         (Final result calculation: {problem.finalResult ?? '?'})
                    </div>
                 )}

                {/* Stats */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center border-t dark:border-gray-700 pt-3">
                   {`Level: ${difficultyLevel}, Attempts: S1: ${attemptsMadeStep1}`}{neededStep2Numeric && !isLevel5Review ? `, S2: ${attemptsMadeStep2}` : ''}{`, Time: ${timeSpent.toFixed(1)}s`}
                   {wasRevealed && <span className="text-orange-600 dark:text-orange-400"> (Revealed)</span>}
                </div>

                {/* Navigation (no changes) */}
                <div className="mt-auto flex justify-between items-center pt-4">
                    <button onClick={handleReviewPrev} disabled={reviewIndex === 0} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 flex items-center gap-1" aria-label="Previous problem"><ArrowLeft size={14} /> Prev</button>
                    <button onClick={handleExitReview} className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700" aria-label="Return to exercise">Return to Exercise</button>
                    <button onClick={handleReviewNext} disabled={reviewIndex === userAnswers.length - 1} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 flex items-center gap-1" aria-label="Next problem">Next <ArrowRight size={14} /></button>
                </div>
            </div>
        );
   };


  // --- Renderizado Principal ---

  // Estado Completado (ADAPTED Summary Rendering)
  if (isComplete) {
       // --- Summary calculation logic (unchanged) ---
       const correctCount = userAnswers.filter(a => a.isCorrect).length;
       const revealedCount = userAnswers.filter(a => a.wasRevealed).length;
       const accuracy = userAnswers.length > 0 ? (correctCount / userAnswers.length) * 100 : 0;
       const totalTime = userAnswers.reduce((acc, a) => acc + a.timeSpent, 0);
       const avgTime = userAnswers.length > 0 ? totalTime / userAnswers.length : 0;
       const totalAttempts = userAnswers.reduce((acc, a) => acc + a.attemptsMadeStep1 + a.attemptsMadeStep2, 0);
       const avgAttempts = userAnswers.length > 0 ? totalAttempts / userAnswers.length : 0;
       const finalDifficulty = userAnswers.length > 0 ? userAnswers[userAnswers.length - 1].difficultyLevel : userSettingsInternal.difficulty;
       const finalProblemCount = userAnswers.length;

       // --- Helper to render summary item (Uses same logic as interactive review helper) ---
       const renderReviewItem = (answer: UserAnswer, index: number) => {
            const { problem, userAnswersStep1, userAnswerStep2, step1Correct, isCorrect: isCorrectOverall, wasRevealed, attemptsMadeStep1, attemptsMadeStep2, difficultyLevel, timeSpent } = answer;
            const isLevel5Review = difficultyLevel === 5;
            const neededStep2Numeric = problem.requiresStep2Calculation ?? false;

            // Re-use the interactive review equation renderer
            const renderReviewEquationInternalHelper = (
              problem: Problem,
              step1UserAnswers: (number | null)[],
              step1Correct: boolean | null,
              wasRevealed: boolean
            ) => {
               if (problem.difficultyLevelAtGeneration === 5) { // L5 Summary Item
                   if (!problem.displayLeftSide || !problem.displayRightSideParts || !problem.algebraicBlanks) return <>Error L5 Summary</>;
                    const getReviewSymbolDisplay = (symbol: '?' | '□', index: number): React.ReactNode => {
                       const userAnswer = (step1UserAnswers && step1UserAnswers.length > index) ? step1UserAnswers[index] : null;
                       const correctAnswer = problem.algebraicBlanks?.find(b => b.symbol === symbol)?.value;
                       const displayValue = userAnswer ?? symbol;
                       let spanClass = ""; let correctValueSpan: React.ReactNode = null;
                       if (wasRevealed) { spanClass = "font-semibold text-orange-700 dark:text-orange-400"; correctValueSpan = <span className="ml-1 text-xs text-green-600 dark:text-green-400 font-semibold">({correctAnswer ?? '?'})</span>;
                       } else if (step1Correct === true) { spanClass = "font-semibold text-green-700 dark:text-green-300";
                       } else if (step1Correct === false && userAnswer !== null) { if (userAnswer === correctAnswer) { spanClass = "font-semibold text-green-700 dark:text-green-300 opacity-70"; } else { spanClass = "font-semibold line-through text-red-700 dark:text-red-400"; correctValueSpan = <span className="ml-1 text-xs text-green-600 dark:text-green-400 font-semibold">({correctAnswer ?? '?'})</span>; }
                       } else { spanClass = "font-semibold text-gray-900 dark:text-gray-100"; }
                       return (<span className="inline-flex items-center"><span className={spanClass}>{displayValue}</span>{correctValueSpan}</span>);
                   };
                   const rightSideRendered = problem.displayRightSideParts.map((part, idx) => { if (typeof part === 'string') { return <span key={`rsrs-${idx}`}>{part}</span>; } else { const symbol = part.blankSymbol; const answerIndex = symbol === '?' ? 0 : 1; return <span key={`rsrs-${idx}`}>{getReviewSymbolDisplay(symbol, answerIndex)}</span>; } }).reduce((prev, curr) => <>{prev}{curr}</>, <></>);
                   return (<><span className="font-mono">{problem.displayLeftSide}</span><span className="mx-1">=</span><span className="font-mono">{rightSideRendered}</span>{wasRevealed && <span className="ml-1 text-xs text-orange-700 dark:text-orange-400 opacity-80">(R)</span>}</>);
               } else { // L1-4 Summary Item
                    if (!problem.num1 || !problem.num2 || !problem.num3 || !problem.innerOperator || !problem.blankTargets || !problem.correctAnswersStep1) return <>Error L1-4 Summary</>;
                    const { num1, num2, num3, innerOperator, blankTargets, correctAnswersStep1 } = problem; const parts = { a1: num1, b: num2, a2: num1, c: num3 };
                     const renderReviewPartNumeric = (partKey: BlankPosition, partValue: number) => { const isBlank = blankTargets.includes(partKey); if (isBlank) { const answerIndex = blankTargets.indexOf(partKey); const userAnswer = (step1UserAnswers && step1UserAnswers.length > answerIndex) ? step1UserAnswers[answerIndex] : null; const correctAnswer = correctAnswersStep1[answerIndex]; const displayValue = userAnswer ?? '?'; let spanClass = ""; let correctValueSpan: React.ReactNode = null; if (wasRevealed) { spanClass = "font-semibold text-orange-700 dark:text-orange-400"; correctValueSpan = <span className="ml-1 text-sm text-green-600 dark:text-green-400 font-semibold">({correctAnswer})</span>; } else if (step1Correct === true) { spanClass = "font-semibold text-green-700 dark:text-green-300"; } else if (step1Correct === false && userAnswer !== null) { if (userAnswer === correctAnswer) { spanClass = "font-semibold text-green-700 dark:text-green-300 opacity-70"; } else { spanClass = "font-semibold line-through text-red-700 dark:text-red-400"; correctValueSpan = <span className="ml-1 text-sm text-green-600 dark:text-green-400 font-semibold">({correctAnswer})</span>; } } else { spanClass = "text-gray-900 dark:text-gray-100"; } return <span key={`${partKey}-srev`} className="inline-flex items-center"><span className={spanClass}>{displayValue}</span>{correctValueSpan}</span>; } else { return <span key={partKey + '-srev'}>{partValue}</span>; } };
                    return (<><span>{num1}</span><span className="mx-0.5">*</span><span>({num2}{innerOperator}{num3})</span><span className="mx-1">=</span><span>(</span> {renderReviewPartNumeric('a1', num1)} <span className="mx-0.5">*</span> {renderReviewPartNumeric('b', num2)} <span>)</span><span className="mx-1">{innerOperator}</span><span>(</span> {renderReviewPartNumeric('a2', num1)} <span className="mx-0.5">*</span> {renderReviewPartNumeric('c', num3)} <span>)</span>{wasRevealed && <span className="ml-1 text-xs text-orange-700 dark:text-orange-400 opacity-80">(R)</span>}</>);
               }
            }; // End renderReviewEquationInternalHelper (for summary)

           return (
             <div key={index} className={`p-3 rounded-md shadow-sm ${ isCorrectOverall ? 'bg-green-100 dark:bg-green-900/30 ring-1 ring-green-200 dark:ring-green-700' : wasRevealed ? 'bg-orange-100 dark:bg-orange-900/30 ring-1 ring-orange-200 dark:ring-orange-700' : 'bg-red-100 dark:bg-red-900/30 ring-1 ring-red-200 dark:ring-red-700'}`} >
               <div className="flex justify-between items-start text-sm">
                 <div className="text-left flex-grow">
                   {/* Ecuación */}
                   <p className="font-medium text-gray-800 dark:text-gray-100 flex flex-wrap items-center gap-x-1 text-xs sm:text-sm">
                     <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">(#{index+1})</span>
                     {renderReviewEquationInternalHelper(problem, userAnswersStep1, step1Correct, wasRevealed)}
                   </p>
                    {/* Resultado Paso 2 (L3/4 Only) */}
                    {neededStep2Numeric && !isLevel5Review && !wasRevealed && step1Correct && userAnswerStep2 !== null && (
                       <div className="mt-1 text-xs flex items-center gap-x-1 pl-4">
                           <span className="text-gray-600 dark:text-gray-400">Calc:</span>
                           {isCorrectOverall ? ( <span className="font-semibold text-green-700 dark:text-green-300">{userAnswerStep2 ?? '?'}</span>
                           ) : ( <> <span className="font-semibold line-through text-red-700 dark:text-red-400">{userAnswerStep2 ?? '?'}</span> <span className="ml-1 text-sm text-green-600 dark:text-green-400 font-semibold">({problem.finalResult ?? '?'})</span> </>
                           )}
                       </div>
                    )}
                    {neededStep2Numeric && !isLevel5Review && (!step1Correct || wasRevealed) && (
                        <div className="mt-1 text-xs pl-4 text-gray-500 dark:text-gray-400">
                           (Result: {problem.finalResult ?? '?'})
                        </div>
                    )}
                   {/* Stats */}
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {`Lvl: ${difficultyLevel}, Att S1: ${attemptsMadeStep1}`}{neededStep2Numeric && !isLevel5Review ? `, S2: ${attemptsMadeStep2}` : ''}{`, T: ${timeSpent.toFixed(1)}s`}
                   </p>
                 </div>
                 {/* Icono de estado (unchanged) */}
                 <div className="text-right pl-2 shrink-0">
                    {isCorrectOverall ? ( <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : wasRevealed ? ( <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 102 0V5zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                    ) : ( <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.607a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    )}
                  </div>
               </div>
             </div>
           );
       };

      // --- Renderizado pantalla completado (structure unchanged) ---
      return ( <div className="max-w-lg mx-auto text-center p-4"> <h2 className="text-2xl font-bold mb-4">Distributive Property Exercise Complete!</h2> <div className="bg-indigo-50 dark:bg-gray-900/50 p-6 rounded-lg mb-6 ring-1 ring-inset ring-indigo-100 dark:ring-gray-700"> <div className="grid grid-cols-2 gap-4"> {/* ... Stats divs (unchanged) ... */} <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Score</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{correctCount} / {finalProblemCount}</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Accuracy</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{accuracy.toFixed(1)}%</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Avg. Time</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{avgTime.toFixed(1)}s</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Avg. Total Attempts</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{avgAttempts.toFixed(1)}</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Blanks Revealed</p><p className="text-xl font-bold text-orange-600 dark:text-orange-400">{revealedCount}</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Final Level</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{finalDifficulty}</p></div> {userSettingsInternal.enableCompensation && finalProblemCount > userSettingsInternal.problemCount && ( <div className="col-span-2 bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md text-sm text-yellow-800 dark:text-yellow-200"> {finalProblemCount - userSettingsInternal.problemCount} extra problem(s) added due to compensation. </div> )} </div> </div> <div className="mb-6"> <h3 className="text-xl font-semibold mb-3">Problem Review</h3> <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800/50"> {userAnswers.map((answer, index) => renderReviewItem(answer, index))} </div> </div> <button onClick={restartExercise} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"> Start New Exercise </button> </div> );
  }


  // --- Exercise in Progress UI (ADAPTED for All Levels) ---
  const currentProblemData = isReviewMode ? userAnswers[reviewIndex]?.problem : currentProblem;
  const isLevel5Active = currentProblemData?.difficultyLevelAtGeneration === 5;
  const requiresStep2Active = currentProblemData?.requiresStep2Calculation ?? false; // For L3/4 calculation step
  const numBlanksActive = isLevel5Active ? 2 : (currentProblemData?.blankTargets?.length ?? 0); // L5 always 2, L1-4 depends

  return (
    <div className="max-w-md mx-auto p-4 relative min-h-[32rem]">

      {/* Review Mode Overlay (Uses adapted helper) */}
      {isReviewMode && renderReviewScreen()}

      {/* Active Exercise Screen */}
      <AnimatePresence>
       {!isReviewMode && currentProblemData && (
           <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Progress Info (Adapted attempts display) */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-2 text-sm">
                        <button onClick={handleEnterReview} disabled={currentIndex === 0 || userAnswers.length === 0} className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Review Previous Problems" title="Review Previous Problems"><Eye size={18} /></button>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Problem {currentIndex + 1} of {targetProblemCount}</span>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400 mr-3">Lvl: <span className="font-semibold text-indigo-700 dark:text-indigo-300">{currentExerciseDifficulty}</span></span>
                            {/* Show S2 attempts only if applicable */}
                            <span className="text-gray-600 dark:text-gray-400">Att: S1: {currentAttemptsStep1}{requiresStep2Active ? `, S2: ${currentAttemptsStep2}` : ''} / {userSettingsInternal.maxAttempts || '∞'}</span>
                        </div>
                    </div>
                    {/* Progress bar and streak (unchanged) */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden"><motion.div className="bg-indigo-600 h-full rounded-full" style={{ width: `${((currentIndex + 1) / targetProblemCount) * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }}/></div>
                    {userSettingsInternal.adaptiveDifficulty && (<div className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">Streak: {consecutiveCorrectAnswers}/{CORRECT_STREAK_THRESHOLD}</div>)}
                </div>

                {/* Main Problem Area */}
                <motion.div key={`${currentIndex}-${currentProblemStep}-${problemDisplayState}-${currentProblemData?.level5Type ?? 'numeric'}-${numBlanksActive}`} // More keys for robust animation
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg mb-6 text-center border border-gray-200 dark:border-gray-700 relative">
                    {/* Problem Display (Uses adapted renderEquation) */}
                    <div className="mb-4 text-left">
                        <div className={`text-lg sm:text-xl font-medium mb-2 text-gray-800 dark:text-gray-100 flex justify-center items-center flex-wrap gap-x-1 sm:gap-x-1.5 ${isLevel5Active ? 'font-mono' : 'font-semibold'}`}>
                            {renderEquation(
                                currentProblemData,
                                problemDisplayState === 'active' ? currentProblemStep : null,
                                tempCorrectStep1Answers,
                                problemDisplayState === 'showing_answer'
                            )}
                        </div>
                        {/* Prompt dinámico (Adapted for L5) */}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                           {problemDisplayState === 'active' && currentProblemStep === 1 && (isLevel5Active ? `Step 1: Find the numeric values for ? and □.` : `Step 1: Fill in the missing number${numBlanksActive > 1 ? 's' : ''} (?).`)}
                           {problemDisplayState === 'active' && currentProblemStep === 2 && requiresStep2Active && `Step 2: Now calculate the final result.`}
                           {problemDisplayState === 'showing_answer' && feedback?.correct && "Correct! Answers shown above."}
                           {problemDisplayState === 'showing_answer' && !feedback?.correct && !isAnswerRevealed && "Incorrect. Correct answers shown above."}
                           {problemDisplayState === 'showing_answer' && isAnswerRevealed && feedback?.message} {/* Show reveal message */}
                        </p>
                    </div>

                    {/* Feedback Area (Unchanged structure, uses feedback state) */}
                    <AnimatePresence>{feedback && problemDisplayState === 'showing_answer' && ( <motion.div key="feedback-message" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.2 }} className={`p-3 rounded-md text-sm font-medium overflow-hidden ${ feedback.correct ? 'bg-green-100 text-green-800 dark:bg-green-800/80 dark:text-green-100' : isAnswerRevealed ? 'bg-orange-100 text-orange-800 dark:bg-orange-800/80 dark:text-orange-100' : 'bg-red-100 text-red-800 dark:bg-red-800/80 dark:text-red-100'}`} > {feedback.message} </motion.div> )} </AnimatePresence>

                    {/* --- Form / Continue Button --- */}
                    {problemDisplayState === 'active' ? (
                        <>
                            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                {/* Inputs: L5 always shows 2, L1-4 shows 1 or 2 */}
                                <div className={`grid ${numBlanksActive === 2 ? 'grid-cols-2 gap-4' : 'grid-cols-1'}`}>
                                    {/* Input 1 (Always present in active Step 1, or for Step 2 calc) */}
                                     <div>
                                        <label htmlFor="input1" className="sr-only">
                                          {currentProblemStep === 1 ? (isLevel5Active ? "Value for ?" : (numBlanksActive === 1 ? "Missing Number" : "First Missing Number")) : "Final Result"}
                                        </label>
                                         <input
                                            ref={input1Ref}
                                            id="input1"
                                            type="number" // Keep as number for coefficients/constants
                                            inputMode="numeric"
                                            value={inputValue1}
                                            onChange={(e) => setInputValue1(e.target.value)}
                                            placeholder={currentProblemStep === 1 ? "?" : "Result"} // Placeholder is '?' for step 1
                                            aria-label={currentProblemStep === 1 ? (isLevel5Active ? "Enter value for ?" : (numBlanksActive === 1 ? "Enter the missing number" : "Enter the first missing number")) : "Enter the final result"}
                                            aria-invalid={!!error1}
                                            aria-describedby={error1 ? "input1-error" : undefined}
                                            className={`w-full px-4 py-3 text-lg sm:text-xl text-center rounded-md border ${ error1 ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500' } focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 dark:disabled:opacity-60`}
                                            required
                                            disabled={isSubmitting.current || (currentProblemStep === 2 && !requiresStep2Active)} // Disable if in step 2 but not needed
                                        />
                                        {error1 && (<p id="input1-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">{error1}</p>)}
                                    </div>

                                    {/* Input 2 (Only if 2 blanks required in Step 1) */}
                                    {currentProblemStep === 1 && numBlanksActive === 2 && (
                                        <div>
                                            <label htmlFor="input2" className="sr-only">Value for □</label>
                                            <input
                                                ref={input2Ref}
                                                id="input2"
                                                type="number"
                                                inputMode="numeric"
                                                value={inputValue2}
                                                onChange={(e) => setInputValue2(e.target.value)}
                                                placeholder="□" // Placeholder is '□'
                                                aria-label="Enter value for □"
                                                aria-invalid={!!error2}
                                                aria-describedby={error2 ? "input2-error" : undefined}
                                                className={`w-full px-4 py-3 text-lg sm:text-xl text-center rounded-md border ${ error2 ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500' } focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 dark:disabled:opacity-60`}
                                                required
                                                disabled={isSubmitting.current}
                                            />
                                            {error2 && (<p id="input2-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">{error2}</p>)}
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button type="submit" className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                                    // Disable if submitting, or if required inputs are empty
                                    disabled={isSubmitting.current || !inputValue1.trim() || (currentProblemStep === 1 && numBlanksActive === 2 && !inputValue2.trim()) || (currentProblemStep === 2 && !requiresStep2Active) }
                                >
                                    {isSubmitting.current ? 'Checking...' : (currentProblemStep === 2 ? 'Submit Result' : 'Submit Answer')}
                                </button>
                            </form>
                             {/* Botón Show Answer (Solo en Paso 1 - finding blanks) */}
                            {currentProblemStep === 1 && !isAnswerRevealed && (
                                <button onClick={handleShowAnswer} className="mt-3 w-full px-6 py-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 dark:focus:ring-offset-gray-800 disabled:opacity-50" disabled={isSubmitting.current}>
                                   Show Correct Value{numBlanksActive > 1 ? 's' : ''}
                                </button>
                            )}
                        </>
                    ) : (
                        // Botón Continuar/Hold (unchanged structure)
                        <div className="mt-8"> <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} onClick={handleContinue} onMouseDown={handleHoldPress} onMouseUp={handleHoldRelease} onTouchStart={handleHoldPress} onTouchEnd={handleHoldRelease} className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 relative overflow-hidden" > <span className="relative z-0"> {isAutoContinueEnabled ? "Hold to Pause" : (currentIndex < targetProblemCount - 1 ? 'Continue' : 'Show Results')} </span> {/* Checkbox Auto Continue */} <div className="absolute bottom-0 right-0 mb-1 mr-1 flex items-center z-10 group" onClick={handleCheckboxAreaClick}> <AnimatePresence>{showAutoContinueTooltip && (<motion.div initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute bottom-full right-0 mb-1 p-1.5 bg-gray-900 text-white text-xs rounded shadow-lg w-max max-w-[180px] pointer-events-none" role="tooltip" id="auto-continue-tooltip">Auto-proceeds after {AUTO_CONTINUE_DELAY/1000}s</motion.div>)}</AnimatePresence> <label htmlFor="auto-continue-checkbox" className="flex items-center px-1.5 py-0.5 bg-white/80 dark:bg-black/50 rounded cursor-pointer hover:bg-white dark:hover:bg-black/70 backdrop-blur-sm transition-colors"> <input type="checkbox" id="auto-continue-checkbox" checked={isAutoContinueEnabled} onChange={handleAutoContinueChange} className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-1 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-600 dark:ring-offset-gray-800" aria-describedby={showAutoContinueTooltip ? "auto-continue-tooltip" : undefined}/> <span className="text-xs font-medium text-gray-700 dark:text-gray-200 select-none">Auto</span> </label> </div> </motion.button> </div>
                    )}
                    {/* --- End Form/Continue --- */}
                </motion.div>
            </motion.div>
        )}
        </AnimatePresence>

      {/* Loading State */}
      {!currentProblemData && !isComplete && (
         <div className="text-center py-10"><p className="text-gray-500 dark:text-gray-400">Loading exercise...</p></div>
      )}
    </div>
  );
};