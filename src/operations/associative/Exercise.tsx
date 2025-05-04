import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Eye, RotateCcw } from 'lucide-react'; // Import icons

// --- Constants ---
const MAX_ASSOCIATIVE_DIFFICULTY = 5;
const CORRECT_STREAK_THRESHOLD_ASSOC = 10; // Streak needed to increase difficulty
const AUTO_CONTINUE_DELAY_ASSOC = 2000;
const TOOLTIP_DISPLAY_TIME_ASSOC = 3000;

// --- Types ---

// Represents a part in the associative structure (A, B, or C)
type AssociativePart = number | string;

interface AssociativeProblem {
    level: number; // Difficulty level
    operation: '+' | '×'; // The main associative operation

    // The three main parts of the associative structure (A, B, C)
    // These are the *correct* components if the blanks were filled.
    parts: [AssociativePart, AssociativePart, AssociativePart];

    // Describes where the blanks ('?' and '□') are placed within the structure.
    // We will aim to always have exactly two blanks ('?' and '□')
    // placed in corresponding positions to justify two input fields.
    // e.g., pattern (A op ?) op C = A op (□ op C) means blank '?' replaces B on LHS, blank '□' replaces B on RHS.
    blankInfo: {
        symbol: '?' | '□';
        partIndex: 0 | 1 | 2; // Index in the 'parts' array (0=A, 1=B, 2=C) that this blank *replaces*
        // Note: For L5, the blank might be *inside* a part expression, but for simplicity
        // we'll model it as replacing the whole part for check logic, and use
        // display strings to show blanks inside parts.
    }[]; // Will always have exactly 2 elements: one for '?' and one for '□'

    // The correct values the user must enter for '?' and '□' respectively
    correctBlankValues: { symbol: '?' | '□', value: AssociativePart }[];

    // String representations for display, showing the blanks
    displayLeft: string; // e.g. "(2 + ?) + 3"
    displayRight: string; // e.g. "2 + (□ + 3)"
}

interface UserAssociativeAnswer {
  problem: AssociativeProblem;
  // userAnswersStep1 corresponds to input field 1 ('?') and input field 2 ('□')
  userAnswers: (number | string | null)[];
  isCorrect: boolean; // Correctness of both blanks
  wasRevealed: boolean; // Were the answers revealed?
  timeSpent: number;
  attemptsMade: number; // Total attempts for the single step
  difficultyLevel: number;
}

interface AssociativeSettings {
  difficulty: number;
  problemCount: number;
  timeLimit: number;
  adaptiveDifficulty: boolean;
  maxAttempts: number;
  enableCompensation: boolean;
}

// --- Utility Functions ---

// Fisher-Yates shuffle (reused)
function shuffleArray<T>(array: T[]): T[] {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// Helper to get random integer in a range (reused)
function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper to get unique random integers
function getUniqueRandomInts(count: number, min: number, max: number): number[] {
    const nums = new Set<number>();
    const range = max - min + 1;
     // Handle cases where range is smaller than count
    if (range < count) {
        console.warn(`Range ${min}-${max} is too small for ${count} unique numbers. Returning all numbers in range.`);
         const allNumbers = Array.from({ length: range }, (_, i) => min + i);
         // If still need more than available, just duplicate? Or return less? Let's return less.
         return allNumbers; // Return all unique numbers possible
    }

    while (nums.size < count) {
        nums.add(Math.floor(Math.random() * range) + min);
    }
    return Array.from(nums);
}


// --- NEW: Function to generate Associative Problems ---
const generateAssociativeProblem = (level: number): AssociativeProblem => {
    const validLevel = Math.max(1, Math.min(MAX_ASSOCIATIVE_DIFFICULTY, Math.round(level)));

    let operation: '+' | '×';
    let parts: [AssociativePart, AssociativePart, AssociativePart];
    let blankInfo: AssociativeProblem['blankInfo'];
    let displayLeft = "";
    let displayRight = "";
    const correctBlankValues: AssociativeProblem['correctBlankValues'] = [];

    // Define the parts (A, B, C) based on level
    switch (validLevel) {
        case 1: // Numbers 1-10, Addition only
            operation = '+';
             // Ensure A, B, C are distinct small numbers
            const numsL1 = getUniqueRandomInts(3, 1, 10);
            parts = [numsL1[0], numsL1[1], numsL1[2]];
            break;
        case 2: // Numbers 1-10, Multiplication only
            operation = '×';
             // Ensure A, B, C are distinct small numbers, avoid 0 and 1 if possible for more meaningful multiplication
            const numsL2 = getUniqueRandomInts(3, 2, 8); // Use a slightly smaller range to increase chance of distinct
            parts = [numsL2[0], numsL2[1], numsL2[2]];
            break;
        case 3: // Numbers 1-25, easier arithmetic values, mixed operations
            operation = Math.random() < 0.5 ? '+' : '×';
             if (operation === '+') {
                 const numsL3_add = getUniqueRandomInts(3, 5, 25);
                 parts = [numsL3_add[0], numsL3_add[1], numsL3_add[2]];
             } else { // Multiplication: include 1, 10, 25, 100 potentially
                  const baseNums = getUniqueRandomInts(2, 2, 15); // Two distinct base numbers
                  const commonFactors = shuffleArray([1, 10, 25]); // Numbers that simplify multiplication
                   parts = [baseNums[0], commonFactors[0], baseNums[1]];
                   if (parts.length < 3) { // Fallback if unique failed
                       parts = getUniqueRandomInts(3, 2, 15);
                   }
                  // Ensure parts are AssociativePart type
                   parts = parts.map(String).map(Number) as [number, number, number]; // Force number type
             }
            break;
        case 4: // Single variables (a, b, c, x, y, z)
            operation = Math.random() < 0.5 ? '+' : '×';
            const variables = shuffleArray(['a', 'b', 'c', 'x', 'y', 'z']);
            parts = [variables[0], variables[1], variables[2]] as [string, string, string]; // Ensure parts are strings
            break;
        case 5: // Expressions/Terms (2x, a+b, etc.)
            operation = Math.random() < 0.6 ? '+' : '×'; // Slightly favour addition for complex terms
            // Generate more complex parts
            const varsL5 = shuffleArray(['a', 'b', 'x', 'y']);
            const coeffsL5 = getUniqueRandomInts(3, 2, 6);
            const constsL5 = getUniqueRandomInts(3, 1, 5);

            let partA: AssociativePart, partB: AssociativePart, partC: AssociativePart;

            if (operation === '+') {
                // Examples: (a+b), 2x, 5
                partA = Math.random() < 0.5 ? `${varsL5[0]} + ${varsL5[1]}` : `${coeffsL5[0]}${varsL5[0]}`;
                partB = `${coeffsL5[1]}${varsL5[2]}`;
                partC = `${constsL5[0]}`;
            } else { // Multiplication
                // Examples: 2x, 3y, z
                partA = `${coeffsL5[0]}${varsL5[0]}`;
                partB = `${coeffsL5[1]}${varsL5[1]}`;
                partC = `${coeffsL5[2]}${varsL5[2]}`;
            }
             // Ensure parts are strings
            parts = [String(partA), String(partB), String(partC)];

            // Special L5 structure adaptation based on user examples if needed?
            // The user examples like [(a + ?) + b] + c = a + [? + (b + c)] are tricky.
            // They imply the blank is *inside* a part, and the structure is nested.
            // Let's simplify L5 to use complex terms (2x, a+b) as A, B, C, and place blanks *as* the parts.
            // E.g., (2x op ?) op 3z = 2x op (□ op 3z) -> ?=B, □=B.
            // Or using the forced two-blank pattern: (? op TermB) op TermC = TermA op (□ op TermC)
             partA = `${coeffsL5[0]}${varsL5[0]}`;
             partB = `${coeffsL5[1]}${varsL5[1]}`;
             partC = `${coeffsL5[2]}${varsL5[2]}`;
             parts = [partA, partB, partC];

            break;
        default: // Fallback to Level 1
            operation = '+';
            const numsDefault = getUniqueRandomInts(3, 1, 5);
            parts = [numsDefault[0], numsDefault[1], numsDefault[2]];
    }

    // --- Determine Blank Placement and Correct Values (Always 2 blanks: ?, □) ---
    // We need to choose two *different* blanks ('?' and '□') placed in corresponding
    // positions in the (A op B) op C = A op (B op C) structure, such that they
    // represent different *parts* (A, B, or C) on the RHS, forcing the user
    // to identify which part goes where.
    // Let's use pattern: (? op B) op C = A op (□ op C)
    // Correct: ? = A (parts[0]), □ = B (parts[1])
    blankInfo = [
        { symbol: '?', partIndex: 0 }, // '?' replaces A on LHS
        { symbol: '□', partIndex: 1 }  // '□' replaces B on RHS
    ];
    correctBlankValues.push({ symbol: '?', value: parts[0] });
    correctBlankValues.push({ symbol: '□', value: parts[1] });


    // --- Construct Display Strings ---
    const opSymbol = operation === '+' ? '+' : '×'; // Use × symbol for multiplication display

    // Construct LHS: (? op B) op C
    const lhsPartA = blankInfo.some(b => b.symbol === '?' && b.partIndex === 0) ? '?' : parts[0];
    const lhsPartB = parts[1]; // B is not blanked in LHS
    const lhsPartC = parts[2]; // C is not blanked in LHS
    displayLeft = `(${lhsPartA} ${opSymbol} ${lhsPartB}) ${opSymbol} ${lhsPartC}`;

    // Construct RHS: A op (□ op C)
    const rhsPartA = parts[0]; // A is not blanked in RHS
    const rhsPartB = blankInfo.some(b => b.symbol === '□' && b.partIndex === 1) ? '□' : parts[1];
    const rhsPartC = parts[2]; // C is not blanked in RHS
    displayRight = `${rhsPartA} ${opSymbol} (${rhsPartB} ${opSymbol} ${rhsPartC})`;


    // Add parenthesis for clarity if parts are expressions in L5
    if (validLevel === 5) {
         const wrapIfComplex = (part: AssociativePart | '?' | '□') => {
             const s = String(part);
             // Wrap if it contains an operator or is a complex term like '2x' or 'a+b'
             // Don't wrap single variables, numbers, or the blank symbols themselves
             if (s.includes('+') || s.includes('-') || (s.match(/[a-z]/i) && s.match(/\d/))) {
                 return `(${s})`;
             }
             return s;
         };

         const lhsPartA_disp = blankInfo.some(b => b.symbol === '?' && b.partIndex === 0) ? '?' : wrapIfComplex(parts[0]);
         const lhsPartB_disp = wrapIfComplex(parts[1]);
         const lhsPartC_disp = wrapIfComplex(parts[2]);

         const rhsPartA_disp = wrapIfComplex(parts[0]);
         const rhsPartB_disp = blankInfo.some(b => b.symbol === '□' && b.partIndex === 1) ? '□' : wrapIfComplex(parts[1]);
         const rhsPartC_disp = wrapIfComplex(parts[2]);

         displayLeft = `(${lhsPartA_disp} ${opSymbol} ${lhsPartB_disp}) ${opSymbol} ${lhsPartC_disp}`;
         displayRight = `${rhsPartA_disp} ${opSymbol} (${rhsPartB_disp} ${opSymbol} ${rhsPartC_disp})`;

         // Handle L5 nested structure examples from prompt?
         // The prompt examples are different patterns!
         // Let's add a few more distinct patterns for L5 to use the blanks differently
         const L5_PATTERNS = ['(? op B) op C = A op (□ op C)', '(A op ?) op C = A op (B op □)', '(A op B) op ? = A op (B op □)'];
         const chosenPattern = shuffleArray([...L5_PATTERNS])[0];

         let partA_val = parts[0];
         let partB_val = parts[1];
         let partC_val = parts[2];

         if (chosenPattern === '(? op B) op C = A op (□ op C)') {
             blankInfo = [{ symbol: '?', partIndex: 0 }, { symbol: '□', partIndex: 1 }];
             correctBlankValues.push({ symbol: '?', value: partA_val });
             correctBlankValues.push({ symbol: '□', value: partB_val });
             displayLeft = `(${wrapIfComplex('?')} ${opSymbol} ${wrapIfComplex(partB_val)}) ${opSymbol} ${wrapIfComplex(partC_val)}`;
             displayRight = `${wrapIfComplex(partA_val)} ${opSymbol} (${wrapIfComplex('□')} ${opSymbol} ${wrapIfComplex(partC_val)})`;
         } else if (chosenPattern === '(A op ?) op C = A op (B op □)') {
              blankInfo = [{ symbol: '?', partIndex: 1 }, { symbol: '□', partIndex: 2 }];
              correctBlankValues.push({ symbol: '?', value: partB_val });
              correctBlankValues.push({ symbol: '□', value: partC_val });
              displayLeft = `(${wrapIfComplex(partA_val)} ${opSymbol} ${wrapIfComplex('?')}) ${opSymbol} ${wrapIfComplex(partC_val)}`;
              displayRight = `${wrapIfComplex(partA_val)} ${opSymbol} (${wrapIfComplex(partB_val)} ${opSymbol} ${wrapIfComplex('□')})`;
         } else { // '(A op B) op ? = A op (B op □)' - Blanks replace C on both sides
              blankInfo = [{ symbol: '?', partIndex: 2 }, { symbol: '□', partIndex: 2 }]; // Both blanks represent C
              correctBlankValues.push({ symbol: '?', value: partC_val });
              correctBlankValues.push({ symbol: '□', value: partC_val }); // Both correct answers are C
              displayLeft = `(${wrapIfComplex(partA_val)} ${opSymbol} ${wrapIfComplex(partB_val)}) ${opSymbol} ${wrapIfComplex('?')}`;
              displayRight = `${wrapIfComplex(partA_val)} ${opSymbol} (${wrapIfComplex(partB_val)} ${opSymbol} ${wrapIfComplex('□')})`;
         }

         // Note: The user's L5 examples like [(a + ?) + b] + c are still not perfectly matched by these simpler (A op B) op C patterns,
         // but this provides a consistent two-blank associative exercise structure.
         // If needing to match the exact nested structure examples, the Problem type and rendering would need to become significantly more complex.
         // For now, we follow the principle of 'fill blanks to complete associative structure', using two distinct blanks.
    }


    // Ensure correctBlankValues are always 2 elements, corresponding to '?' then '□'
    const finalCorrectValues: AssociativeProblem['correctBlankValues'] = [
         { symbol: '?', value: correctBlankValues.find(v => v.symbol === '?')?.value ?? 'Error' },
         { symbol: '□', value: correctBlankValues.find(v => v.symbol === '□')?.value ?? 'Error' },
    ];

    // Fallback if only one blank was generated (shouldn't happen with current logic, but defensive)
     if (blankInfo.length === 1) {
         // Decide how to handle the second blank. Let's make it require the same value as the first blank.
         // This doesn't fit the "distinct blanks" goal, but is better than an error.
         // Or, make the second blank fill a DIFFERENT part. e.g. if only '?' was used for B, add '□' for C.
         // Let's stick to the chosen two-blank patterns (`(? op B) op C = A op (□ op C)`, etc.) to ensure 2 distinct blanks needing answers.
     }


    return {
        level: validLevel,
        operation,
        parts,
        blankInfo, // Describes placement, but correctBlankValues holds the *values*
        correctBlankValues: finalCorrectValues, // Correct values for '?' and '□'
        displayLeft,
        displayRight,
    };
};


// --- NEW: checkAssociativeAnswers function ---
const checkAssociativeAnswers = (problem: AssociativeProblem, userAnswers: (number | string | null)[]): boolean => {
    if (!problem.correctBlankValues || problem.correctBlankValues.length !== 2) {
        console.error("Associative Problem structure error: Missing correctBlankValues or not 2 values");
        return false; // Problem malformed
    }
    if (userAnswers.length !== 2) {
        return false; // Expecting two user answers
    }

    const correctAnswerQ = problem.correctBlankValues.find(b => b.symbol === '?')?.value;
    const correctAnswerS = problem.correctBlankValues.find(b => b.symbol === '□')?.value;

    // Convert user inputs to the correct type if possible for comparison
    let userAnswerQ: AssociativePart | null = userAnswers[0];
    let userAnswerS: AssociativePart | null = userAnswers[1];

     // Attempt type conversion for numbers
    if (typeof correctAnswerQ === 'number') {
        const numQ = parseFloat(String(userAnswerQ)); // Use parseFloat to handle potential decimals, though examples are integers
        userAnswerQ = isNaN(numQ) ? userAnswerQ : numQ;
    } else if (typeof correctAnswerQ === 'string') {
        // Trim whitespace for string comparison
        userAnswerQ = typeof userAnswerQ === 'string' ? userAnswerQ.trim() : userAnswerQ;
    }

     if (typeof correctAnswerS === 'number') {
        const numS = parseFloat(String(userAnswerS));
        userAnswerS = isNaN(numS) ? userAnswerS : numS;
    } else if (typeof correctAnswerS === 'string') {
         userAnswerS = typeof userAnswerS === 'string' ? userAnswerS.trim() : userAnswerS;
    }


    // Compare values. Use loose equality (==) or convert types carefully.
    // Strict equality (===) is safer after attempting type conversion/standardization.
    const isCorrectQ = userAnswerQ !== null && userAnswerQ === correctAnswerQ;
    const isCorrectS = userAnswerS !== null && userAnswerS === correctAnswerS;

    return isCorrectQ && isCorrectS;
};


// --- Settings Component ---
export const AssociativeSettings: React.FC = () => {
  const [settings, setSettings] = useState<AssociativeSettings>(() => {
      const saved = localStorage.getItem('math_associative_settings');
      const defaultSettings: AssociativeSettings = { difficulty: 1, problemCount: 10, timeLimit: 0, adaptiveDifficulty: true, maxAttempts: 1, enableCompensation: false };
      if (!saved) return defaultSettings;
      try {
          const parsed = JSON.parse(saved);
          return {
              difficulty: parseInt(parsed.difficulty, 10) || defaultSettings.difficulty,
              problemCount: parseInt(parsed.problemCount, 10) > 0 ? parseInt(parsed.problemCount, 10) : defaultSettings.problemCount,
              timeLimit: parseInt(parsed.timeLimit, 10) || defaultSettings.timeLimit,
              adaptiveDifficulty: typeof parsed.adaptiveDifficulty === 'boolean' ? parsed.adaptiveDifficulty : defaultSettings.adaptiveDifficulty,
              maxAttempts: parseInt(parsed.maxAttempts, 10) >= 1 ? parseInt(parsed.maxAttempts, 10) : defaultSettings.maxAttempts,
              enableCompensation: typeof parsed.enableCompensation === 'boolean' ? parsed.enableCompensation : defaultSettings.enableCompensation,
          };
      } catch { return defaultSettings; }
  });

  useEffect(() => {
      localStorage.setItem('math_associative_settings', JSON.stringify(settings));
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      let parsedValue: string | number | boolean;
      if (type === 'checkbox') { parsedValue = (e.target as HTMLInputElement).checked; }
      else if (type === 'number' || type === 'range' || ['problemCount', 'maxAttempts', 'timeLimit', 'difficulty'].includes(name)) {
          const numValue = parseInt(value, 10);
          if (name === 'problemCount') parsedValue = isNaN(numValue) || numValue <= 0 ? 1 : numValue;
          else if (name === 'maxAttempts') parsedValue = Math.max(1, isNaN(numValue) || numValue < 1 ? 1 : numValue);
          else if (name === 'timeLimit') parsedValue = isNaN(numValue) || numValue < 0 ? 0 : numValue;
          else if (name === 'difficulty') parsedValue = isNaN(numValue) ? 1 : Math.max(1, Math.min(MAX_ASSOCIATIVE_DIFFICULTY, numValue));
          else parsedValue = isNaN(numValue) ? 0 : numValue;
      } else { parsedValue = value; }
      setSettings(prev => ({ ...prev, [name]: parsedValue }));
  };

  // --- NEW renderExampleProblem ---
  const renderExampleProblem = (level: number) => {
      let prob: AssociativeProblem;
      let attempts = 0;
       // Try generating until we get one with both blanks and correct values set
      do {
          prob = generateAssociativeProblem(level);
          attempts++;
      } while (
          (!prob.correctBlankValues || prob.correctBlankValues.length !== 2 ||
          prob.correctBlankValues[0].value === 'Error' || prob.correctBlankValues[1].value === 'Error') &&
          attempts < 10
      );


      if (!prob || !prob.displayLeft || !prob.displayRight || !prob.correctBlankValues) return <p>Error generating example.</p>;

      // Just show the structure with blanks
      return (
          <>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1 break-words flex flex-wrap items-center gap-x-1">
                  <span>{prob.displayLeft}</span>
                  <span className="mx-1">=</span>
                  <span>{prob.displayRight}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Find the values for ? and □.</p>
          </>
      );
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Associative Property Settings</h2>
      <div className="space-y-6">
        {/* Difficulty */}
        <div>
          <label htmlFor="difficultyRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty Level ({settings.difficulty})</label>
          <input id="difficultyRange" type="range" name="difficulty" min="1" max="5" value={settings.difficulty} onChange={handleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
             {/* MODIFICADO: Texto explicativo */}
             <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    L1: Addition, numbers 1-10.
                    L2: Multiplication, numbers 1-10.
                    L3: Mixed operations, numbers up to 25 (some simplify well).
                    L4: Single variables (a, b, x, y).
                    L5: Terms/Expressions (2x, a+b, etc.).
                </p>
             </div>
        </div>
        {/* ... Other settings (unchanged structure, using associative settings state) ... */}
        <div><label htmlFor="problemCountInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Initial Number of Problems</label><input type="number" id="problemCountInput" name="problemCount" min="1" max="100" step="1" value={settings.problemCount} onChange={handleChange} className="input-field-style"/></div>
        <div><label htmlFor="maxAttempts" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Attempts per Problem</label><input type="number" id="maxAttempts" name="maxAttempts" min="1" value={settings.maxAttempts} onChange={handleChange} className="input-field-style"/><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Applies to finding the blanks.</p></div>
        <div className="flex items-center"><input type="checkbox" id="enableCompensation" name="enableCompensation" checked={settings.enableCompensation} onChange={handleChange} className="checkbox-style"/><label htmlFor="enableCompensation" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Enable Compensation (Add 1 problem for each incorrect)</label></div>
        <div><label htmlFor="timeLimitInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Limit (seconds per problem, 0 for no limit)</label><input id="timeLimitInput" type="number" name="timeLimit" min="0" max="120" value={settings.timeLimit} onChange={handleChange} className="input-field-style"/></div>
        <div className="flex items-center"><input type="checkbox" id="adaptiveDifficulty" name="adaptiveDifficulty" checked={settings.adaptiveDifficulty} onChange={handleChange} className="checkbox-style"/><label htmlFor="adaptiveDifficulty" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Enable Adaptive Difficulty (Increases level after {CORRECT_STREAK_THRESHOLD_ASSOC} correct in a row)</label></div>

         {/* Examples (Show L1, L3, L5) */}
         <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-4">Example Problem Formats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 3, 5].map((level) => ( // Show L1, L3, and L5
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
export const AssociativeExercise: React.FC = () => {
  const emitProgressInternal = useCallback((data: { correct: boolean; timeSpent: number; difficulty: number; attempts: number; revealed: boolean }) => {
      const event = new CustomEvent('operationProgress', { detail: { operationType: 'associative', ...data } }); window.dispatchEvent(event);
  }, []);

  const [userSettingsInternal, setUserSettingsInternal] = useState<AssociativeSettings>(() => {
      const saved = localStorage.getItem('math_associative_settings');
      const defaultSettings: AssociativeSettings = { difficulty: 1, problemCount: 10, timeLimit: 0, adaptiveDifficulty: true, maxAttempts: 1, enableCompensation: false };
      if (!saved) return defaultSettings;
      try {
          const parsed = JSON.parse(saved);
          return { difficulty: parseInt(parsed.difficulty, 10) || defaultSettings.difficulty, problemCount: parseInt(parsed.problemCount, 10) > 0 ? parseInt(parsed.problemCount, 10) : defaultSettings.problemCount, timeLimit: parseInt(parsed.timeLimit, 10) >= 0 ? parseInt(parsed.timeLimit, 10) : 0, adaptiveDifficulty: typeof parsed.adaptiveDifficulty === 'boolean' ? parsed.adaptiveDifficulty : true, maxAttempts: parseInt(parsed.maxAttempts, 10) >= 1 ? parseInt(parsed.maxAttempts, 10) : 1, enableCompensation: typeof parsed.enableCompensation === 'boolean' ? parsed.enableCompensation : false, };
      } catch { return defaultSettings; }
  });

  // --- State ---
  const [currentProblem, setCurrentProblem] = useState<AssociativeProblem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswersHistory, setUserAnswersHistory] = useState<UserAssociativeAnswer[]>([]);
  const [inputValue1, setInputValue1] = useState(''); // Corresponds to '?'
  const [inputValue2, setInputValue2] = useState(''); // Corresponds to '□'
  const [problemStartTime, setProblemStartTime] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [error1, setError1] = useState<string>(''); // Error for input 1 ('?')
  const [error2, setError2] = useState<string>(''); // Error for input 2 ('□')
  const [currentAttempts, setCurrentAttempts] = useState(0); // Single attempt count
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [problemDisplayState, setProblemDisplayState] = useState<'active' | 'showing_answer' | 'review'>('active');
  const [targetProblemCount, setTargetProblemCount] = useState(userSettingsInternal.problemCount);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [currentExerciseDifficulty, setCurrentExerciseDifficulty] = useState<number>(userSettingsInternal.difficulty);
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [isAutoContinueEnabled, setIsAutoContinueEnabled] = useState(false);
  const [showAutoContinueTooltip, setShowAutoContinueTooltip] = useState(false);

  // --- Refs ---
  const isSubmitting = useRef(false);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const input1Ref = useRef<HTMLInputElement>(null); // Ref for input 1 ('?')
  const input2Ref = useRef<HTMLInputElement>(null); // Ref for input 2 ('□')
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);


  // --- Effects ---
  // Settings Listener (reused, updated key and type)
  useEffect(() => {
      const handleStorageChange = (event: StorageEvent) => {
          if (event.key === 'math_associative_settings' && event.newValue) {
              try {
                  const newSettings = JSON.parse(event.newValue) as Partial<AssociativeSettings>;
                  const validatedSettings: AssociativeSettings = {
                      difficulty: Math.max(1, Math.min(MAX_ASSOCIATIVE_DIFFICULTY, newSettings.difficulty ?? 1)),
                      problemCount: newSettings.problemCount ?? 10 > 0 ? newSettings.problemCount ?? 10 : 10,
                      timeLimit: newSettings.timeLimit ?? 0 >= 0 ? newSettings.timeLimit ?? 0 : 0,
                      adaptiveDifficulty: typeof newSettings.adaptiveDifficulty === 'boolean' ? newSettings.adaptiveDifficulty : true,
                      maxAttempts: newSettings.maxAttempts ?? 1 >= 1 ? newSettings.maxAttempts ?? 1 : 1,
                      enableCompensation: typeof newSettings.enableCompensation === 'boolean' ? newSettings.enableCompensation : false,
                  };
                  setUserSettingsInternal(validatedSettings);
                  setTargetProblemCount(validatedSettings.problemCount);
              } catch (error) { console.error('Error parsing settings from storage:', error); }
          }
      }; window.addEventListener('storage', handleStorageChange); return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Initialize/Restart Exercise (adapted)
  useEffect(() => {
    console.log("Initializing/Restarting associative exercise:", userSettingsInternal);
    const initialDifficulty = userSettingsInternal.difficulty;
    setCurrentExerciseDifficulty(initialDifficulty);
    setCurrentProblem(generateAssociativeProblem(initialDifficulty));
    setCurrentIndex(0);
    setUserAnswersHistory([]);
    setInputValue1(''); // Reset input 1 ('?')
    setInputValue2(''); // Reset input 2 ('□')
    setProblemStartTime(Date.now());
    setIsComplete(false);
    setFeedback(null);
    setError1('');
    setError2('');
    setCurrentAttempts(0); // Single attempt count
    setProblemDisplayState('active');
    setIsAnswerRevealed(false);
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
    const focusTimeout = setTimeout(() => {
        // Focus input 1 if it's a number input (L1-3) otherwise focus input 1 (text)
         if (currentProblem?.level <= 3) {
              input1Ref.current?.focus();
         } else {
              input1Ref.current?.focus(); // L4/5 text input
         }
    }, 100);
    return () => clearTimeout(focusTimeout);

  }, [userSettingsInternal]);

  // Cleanup timers (reused)
  useEffect(() => {
      return () => { if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current); };
  }, []);

   // Focus input (adapted)
   useEffect(() => {
    if (problemDisplayState === 'active' && !isComplete && currentProblem && !autoContinueTimerRef.current && !isReviewMode) {
        const focusTimeout = setTimeout(() => {
            if (error1) {
                input1Ref.current?.focus();
                input1Ref.current?.select();
            } else if (error2) {
                input2Ref.current?.focus();
                input2Ref.current?.select();
            } else {
                 // Default focus to input 1 ('?')
                 input1Ref.current?.focus();
            }
        }, 50);
        return () => clearTimeout(focusTimeout);
    }
   }, [currentIndex, problemDisplayState, isComplete, currentProblem, error1, error2, isReviewMode]);

    // Auto-continue logic (reused)
    useEffect(() => {
        if (problemDisplayState === 'showing_answer' && isAutoContinueEnabled && !isReviewMode) { if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = setTimeout(handleContinue, AUTO_CONTINUE_DELAY_ASSOC); } return () => { if (autoContinueTimerRef.current) { clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; } };
    }, [problemDisplayState, isAutoContinueEnabled, isReviewMode, currentIndex]);


  // --- Handlers ---

  // handleSubmit (adapted for single step, two inputs)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAnswerRevealed || problemDisplayState !== 'active' || isSubmitting.current || !currentProblem) return;

    isSubmitting.current = true;
    setError1('');
    setError2('');

    const timeSpent = (Date.now() - problemStartTime) / 1000;
    const attemptsSoFar = currentAttempts + 1;
    setCurrentAttempts(attemptsSoFar);

    let localError1 = '';
    let localError2 = '';
    let userAttemptValue1: number | string | null = null;
    let userAttemptValue2: number | string | null = null;

     // Determine expected input type based on problem level/correct answer type
    const correctAnswerQ = currentProblem.correctBlankValues.find(v => v.symbol === '?')?.value;
    const correctAnswerS = currentProblem.correctBlankValues.find(v => v.symbol === '□')?.value;

    const isNumericInput = typeof correctAnswerQ === 'number' || typeof correctAnswerS === 'number' || currentProblem.level <= 3;

    // Validate Input 1 ('?')
    if (inputValue1.trim() === '') { localError1 = 'Enter value for ?.'; }
    else {
         if (isNumericInput) {
             userAttemptValue1 = parseFloat(inputValue1); // Use parseFloat
             if (isNaN(userAttemptValue1)) localError1 = 'Invalid number for ?.';
         } else { // Text input for variables/expressions
             userAttemptValue1 = inputValue1.trim();
         }
    }

    // Validate Input 2 ('□')
    if (inputValue2.trim() === '') { localError2 = 'Enter value for □.'; }
    else {
         if (isNumericInput) {
             userAttemptValue2 = parseFloat(inputValue2); // Use parseFloat
             if (isNaN(userAttemptValue2)) localError2 = 'Invalid number for □.';
         } else { // Text input for variables/expressions
              userAttemptValue2 = inputValue2.trim();
         }
    }

    // If validation errors, show them and stop
    if (localError1 || localError2) {
        setError1(localError1);
        setError2(localError2);
        isSubmitting.current = false;
        return;
    }

    // Check correctness using the new checkAssociativeAnswers
    const isCorrect = checkAssociativeAnswers(currentProblem, [userAttemptValue1, userAttemptValue2]);

    if (isCorrect) {
        // Correct
        setFeedback({ correct: true, message: `Correct! The blanks are filled correctly.` });
        setProblemDisplayState('showing_answer');
        setUserAnswersHistory(prev => [...prev, {
            problem: currentProblem, userAnswers: [userAttemptValue1, userAttemptValue2],
            isCorrect: true, wasRevealed: false, timeSpent,
            attemptsMade: attemptsSoFar,
            difficultyLevel: currentExerciseDifficulty
        }]);
        emitProgressInternal({ correct: true, timeSpent, difficulty: currentExerciseDifficulty, attempts: attemptsSoFar, revealed: false });
        setConsecutiveCorrectAnswers(prev => prev + 1);
        isSubmitting.current = false;

    } else {
        // Incorrect
        const hasAttemptsLeft = userSettingsInternal.maxAttempts === 0 || attemptsSoFar < userSettingsInternal.maxAttempts;
        if (hasAttemptsLeft || userSettingsInternal.maxAttempts === 0) {
            const attemptsRemaining = userSettingsInternal.maxAttempts === 0 ? "Unlimited" : userSettingsInternal.maxAttempts - attemptsSoFar;
            const errorMsg = `Incorrect values. Try again.`;
            setFeedback({ correct: false, message: `${errorMsg} (Attempts left: ${attemptsRemaining})` });

            // Provide specific errors
             const correctQ = currentProblem.correctBlankValues.find(v => v.symbol === '?')?.value;
             const correctS = currentProblem.correctBlankValues.find(v => v.symbol === '□')?.value;

             let specificError1 = '';
             if (userAttemptValue1 !== correctQ) {
                 specificError1 = 'Incorrect value for ?.';
                 setError1(specificError1);
                 setInputValue1(''); // Clear for retry
             } else {
                 // If ? is correct, clear its error
                 setError1('');
             }

             let specificError2 = '';
             if (userAttemptValue2 !== correctS) {
                  specificError2 = 'Incorrect value for □.';
                  setError2(specificError2);
                  setInputValue2(''); // Clear for retry
             } else {
                  // If □ is correct, clear its error
                  setError2('');
             }


            isSubmitting.current = false;
        } else {
            // Incorrect, no attempts left
            const correctQValue = currentProblem.correctBlankValues.find(v => v.symbol === '?')?.value;
            const correctSValue = currentProblem.correctBlankValues.find(v => v.symbol === '□')?.value;
            setFeedback({ correct: false, message: `Incorrect. Correct values: ? = ${correctQValue}, □ = ${correctSValue}.` });
            setProblemDisplayState('showing_answer');
            setUserAnswersHistory(prev => [...prev, {
                problem: currentProblem, userAnswers: [userAttemptValue1, userAttemptValue2],
                isCorrect: false, wasRevealed: false, timeSpent,
                attemptsMade: attemptsSoFar, difficultyLevel: currentExerciseDifficulty
            }]);
            emitProgressInternal({ correct: false, timeSpent, difficulty: currentExerciseDifficulty, attempts: attemptsSoFar, revealed: false });
            setConsecutiveCorrectAnswers(0);
             if (userSettingsInternal.enableCompensation) {
                setTargetProblemCount(prev => prev + 1);
                toast.info("Incorrect problem, adding one more.", { duration: 2000 });
             }
            isSubmitting.current = false;
        }
    }

     // Adaptive Difficulty Check
     const wasFullyCorrect = problemDisplayState === 'showing_answer' && feedback?.correct === true;

     if (wasFullyCorrect && userSettingsInternal.adaptiveDifficulty) {
       const currentStreak = consecutiveCorrectAnswers + 1; // Already incremented if correct
       if (currentStreak >= CORRECT_STREAK_THRESHOLD_ASSOC && currentExerciseDifficulty < MAX_ASSOCIATIVE_DIFFICULTY) {
           const nextDifficulty = currentExerciseDifficulty + 1;
           setCurrentExerciseDifficulty(nextDifficulty);
           setConsecutiveCorrectAnswers(0); // Reset streak
            let nextLevelDesc = "";
            switch (nextDifficulty) { case 2: nextLevelDesc="Multiplication"; break; case 3: nextLevelDesc="Larger Numbers/Mixed Ops"; break; case 4: nextLevelDesc="Variables"; break; case 5: nextLevelDesc="Expressions"; break; default: nextLevelDesc="Basic Addition"; }
           toast.info(`Level Up! Difficulty increased to ${nextDifficulty} (${nextLevelDesc}).`, { duration: 3000 });
       }
     } else if (problemDisplayState === 'showing_answer' && feedback?.correct === false) {
        setConsecutiveCorrectAnswers(0); // Reset streak on any incorrect
     }
  };


  // handleShowAnswer (adapted)
  const handleShowAnswer = () => {
    if (isAnswerRevealed || problemDisplayState !== 'active' || isSubmitting.current || !currentProblem) return;
    isSubmitting.current = true;
    setConsecutiveCorrectAnswers(0); // Revealing breaks streak

    const timeSpent = (Date.now() - problemStartTime) / 1000;
    const attemptsCounted = userSettingsInternal.maxAttempts > 0 ? userSettingsInternal.maxAttempts : 1; // Count as max attempts used

    setIsAnswerRevealed(true);

    const correctQValue = currentProblem.correctBlankValues.find(v => v.symbol === '?')?.value ?? 'N/A';
    const correctSValue = currentProblem.correctBlankValues.find(v => v.symbol === '□')?.value ?? 'N/A';

    const revealMessage = `Revealed: ? = ${correctQValue}, □ = ${correctSValue}.`;

    // Set input values to correct answers for display
    setInputValue1(String(correctQValue));
    setInputValue2(String(correctSValue));


    setFeedback({ correct: false, message: revealMessage });
    setProblemDisplayState('showing_answer');

    // Record the revealed attempt
    setUserAnswersHistory(prev => [...prev, {
        problem: currentProblem,
        userAnswers: [null, null], // Mark answers as null/not provided by user
        isCorrect: false, // Mark overall as incorrect
        wasRevealed: true, timeSpent,
        attemptsMade: attemptsCounted,
        difficultyLevel: currentExerciseDifficulty
    }]);
    emitProgressInternal({ correct: false, timeSpent, difficulty: currentExerciseDifficulty, attempts: attemptsCounted, revealed: true });

    if (userSettingsInternal.enableCompensation) {
        setTargetProblemCount(prev => prev + 1);
         toast.info("Revealed answer, adding one more problem.", { duration: 2000 });
    }

    setError1(''); setError2('');
    isSubmitting.current = false;
    // Auto-continue will be handled by useEffect if enabled
  };

  // handleContinue (adapted)
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
    const nextProblem = generateAssociativeProblem(currentExerciseDifficulty); // Generate based on adapted difficulty

    setCurrentProblem(nextProblem);
    setCurrentIndex(nextProblemIndex);
    setProblemDisplayState('active');
    setFeedback(null);
    setInputValue1(''); // Reset input 1 ('?')
    setInputValue2(''); // Reset input 2 ('□')
    setError1('');
    setError2('');
    setCurrentAttempts(0); // Reset attempts
    setIsAnswerRevealed(false);
    setProblemStartTime(Date.now());
    isSubmitting.current = false;

    // Focus handled by useEffect
  }, [currentIndex, targetProblemCount, currentExerciseDifficulty, generateAssociativeProblem]);


  // handleAutoContinueChange, handleCheckboxAreaClick, HOLD LOGIC, restartExercise (reused)
  const handleAutoContinueChange = (e: React.ChangeEvent<HTMLInputElement>) => { const isChecked = e.target.checked; setIsAutoContinueEnabled(isChecked); if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); if (isChecked) { setShowAutoContinueTooltip(true); tooltipTimerRef.current = setTimeout(() => setShowAutoContinueTooltip(false), TOOLTIP_DISPLAY_TIME_ASSOC); } else { setShowAutoContinueTooltip(false); if (autoContinueTimerRef.current) { clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; } } };
  const handleCheckboxAreaClick = (e: React.MouseEvent) => e.stopPropagation();
  const handleHoldPress = () => { if (!isAutoContinueEnabled || problemDisplayState !== 'showing_answer') return; if (autoContinueTimerRef.current) { clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; } if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current); holdTimeoutRef.current = setTimeout(() => { /* Held */ }, 150); }; // Small delay to distinguish click from hold
  const handleHoldRelease = () => { if (!isAutoContinueEnabled || problemDisplayState !== 'showing_answer') return; if (holdTimeoutRef.current) { clearTimeout(holdTimeoutRef.current); holdTimeoutRef.current = null; } };
  const restartExercise = () => { setIsReviewMode(false); setUserSettingsInternal(prev => ({ ...prev })); }; // Trigger re-init via useEffect on userSettingsInternal

  // REVIEW MODE HANDLERS (adapted)
  const handleEnterReview = () => { if (userAnswersHistory.length === 0) return; setIsReviewMode(true); setReviewIndex(userAnswersHistory.length - 1); if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; };
  const handleExitReview = () => { setIsReviewMode(false); if(problemDisplayState === 'active') { input1Ref.current?.focus(); } if (problemDisplayState === 'showing_answer' && isAutoContinueEnabled) { if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = setTimeout(handleContinue, AUTO_CONTINUE_DELAY_ASSOC); } };
  const handleReviewNext = () => { setReviewIndex(prev => Math.min(prev + 1, userAnswersHistory.length - 1)); };
  const handleReviewPrev = () => { setReviewIndex(prev => Math.max(prev - 1, 0)); };


  // --- Render Helper for Equation (NEW) ---
  const renderEquation = (
      problem: AssociativeProblem | null,
      problemState: 'active' | 'showing_answer' | 'review',
      userInputs: (number | string | null)[] = [] // User inputs for the *current* active problem attempt
   ) => {
      if (!problem) return null;

       const renderSide = (sideString: string, blankValuesToShow: { symbol: '?' | '□', value: AssociativePart }[], highlightBlanks: boolean) => {
           let displayString = sideString;

           // Replace blanks with spans for styling and potential interaction
           const parts: (string | { symbol: '?' | '□', value: AssociativePart | '?', isUserAnswer?: boolean })[] = [];
           let lastIndex = 0;
           const blankRegex = /(\?)|(□)/g;
           let match;

           while ((match = blankRegex.exec(displayString)) !== null) {
               // Add text before the blank
               if (match.index > lastIndex) {
                   parts.push(displayString.substring(lastIndex, match.index));
               }

               const symbol = match[0] as '?' | '□';
               let valueToShow: AssociativePart | '?';

               if (problemState === 'showing_answer' || problemState === 'review') {
                  // In solved/review state, show the correct value
                  valueToShow = blankValuesToShow.find(b => b.symbol === symbol)?.value ?? symbol;
               } else { // In active state, show the blank symbol
                   valueToShow = symbol;
               }

               const isActualSymbol = valueToShow === '?' || valueToShow === '□';
               const isUserFilled = !isActualSymbol && userInputs.length > (symbol === '?' ? 0 : 1) && userInputs[symbol === '?' ? 0 : 1] !== null;

               parts.push({
                   symbol: symbol,
                   value: valueToShow, // This could be the correct value or the symbol itself
                   isUserAnswer: problemState === 'active' && isUserFilled // Flag if showing user input in active state (less common, but possible)
               });

               lastIndex = blankRegex.lastIndex;
           }

           // Add any remaining text after the last blank
           if (lastIndex < displayString.length) {
               parts.push(displayString.substring(lastIndex));
           }

           // Render the parts
           return (
               <>
                   {parts.map((part, index) => {
                       if (typeof part === 'string') {
                           return <span key={index}>{part}</span>;
                       } else {
                            const isBlankToHighlight = highlightBlanks && (part.symbol === '?' || part.symbol === '□');
                            const content = part.value; // This is either '?'/'□' or the number/string value

                             return (
                                 <span key={index} className={`inline-block text-center font-semibold ${
                                     isBlankToHighlight && (content === '?' || content === '□')
                                        ? 'text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-2 px-0.5' // Highlight active input symbol
                                        : (content !== '?' && content !== '□')
                                        ? 'text-green-700 dark:text-green-300' // Correct answer shown
                                        : 'text-gray-900 dark:text-gray-100' // Non-highlighted symbol
                                    }`}>
                                     {content}
                                 </span>
                            );
                       }
                   })}
               </>
           );
       };


       const highlightBlanks = problemState === 'active';
       const valuesToShow = problemState === 'active' ? [] : problem.correctBlankValues; // Show correct values if not active

      return (
        <>
          <span className={problem.level >= 4 ? 'font-mono' : ''}>
              {renderSide(problem.displayLeft, valuesToShow, highlightBlanks)}
          </span>
          <span className="mx-1.5 text-gray-500 dark:text-gray-400">=</span>
           <span className={problem.level >= 4 ? 'font-mono' : ''}>
              {renderSide(problem.displayRight, valuesToShow, highlightBlanks)}
           </span>
        </>
      );
  };


    // --- Render Helper for Review Screen (NEW) ---
   const renderReviewScreen = () => {
        if (!isReviewMode || userAnswersHistory.length === 0) return null;
        const reviewAnswer = userAnswersHistory[reviewIndex];
        if (!reviewAnswer) return <div>Error: Review answer not found.</div>;

         const { problem, userAnswers, isCorrect, wasRevealed, timeSpent, attemptsMade, difficultyLevel } = reviewAnswer;

         // Helper to render equation in REVIEW mode
          const renderReviewEquationInternalHelper = (
              problem: AssociativeProblem,
              userAnswers: (number | string | null)[],
              isCorrectOverall: boolean,
              wasRevealed: boolean
          ) => {
               const renderSide = (sideString: string) => {
                   const parts: (string | { symbol: '?' | '□', userAnswer: number | string | null, correctAnswer: AssociativePart })[] = [];
                   let lastIndex = 0;
                   const blankRegex = /(\?)|(□)/g;
                   let match;

                   while ((match = blankRegex.exec(sideString)) !== null) {
                       if (match.index > lastIndex) {
                           parts.push(sideString.substring(lastIndex, match.index));
                       }

                       const symbol = match[0] as '?' | '□';
                       const answerIndex = symbol === '?' ? 0 : 1;
                       const userAnswer = (userAnswers && userAnswers.length > answerIndex) ? userAnswers[answerIndex] : null;
                       const correctAnswer = problem.correctBlankValues.find(b => b.symbol === symbol)?.value ?? 'Error';

                       parts.push({ symbol, userAnswer, correctAnswer });

                       lastIndex = blankRegex.lastIndex;
                   }

                   if (lastIndex < sideString.length) {
                       parts.push(sideString.substring(lastIndex));
                   }

                   return (
                       <>
                           {parts.map((part, index) => {
                               if (typeof part === 'string') {
                                   return <span key={index}>{part}</span>;
                               } else {
                                   const displayValue = wasRevealed ? part.correctAnswer : (part.userAnswer ?? part.symbol); // Show correct if revealed, else user answer or symbol
                                   let spanClass = "";
                                   let correctValueSpan: React.ReactNode = null;

                                   if (wasRevealed) {
                                       spanClass = "font-semibold text-orange-700 dark:text-orange-400"; // Revealed color
                                   } else if (isCorrectOverall) {
                                        spanClass = "font-semibold text-green-700 dark:text-green-300"; // All correct
                                   } else {
                                        // Incorrect overall, check this specific blank
                                        if (part.userAnswer !== null && part.userAnswer === part.correctAnswer) {
                                            spanClass = "font-semibold text-green-700 dark:text-green-300 opacity-70"; // This blank was correct, but others wrong
                                        } else {
                                             spanClass = "font-semibold line-through text-red-700 dark:text-red-400"; // This blank was incorrect
                                             correctValueSpan = <span className="ml-1 text-xs text-green-600 dark:text-green-400 font-semibold">({part.correctAnswer})</span>; // Show correct next to wrong
                                        }
                                   }


                                   return (
                                       <span key={index} className="inline-flex items-center mx-px">
                                           <span className={spanClass}>{displayValue}</span>
                                           {correctValueSpan}
                                       </span>
                                   );
                               }
                           })}
                       </>
                   );
               };

               return (
                 <>
                   <span className={problem.level >= 4 ? 'font-mono' : ''}>{renderSide(problem.displayLeft)}</span>
                   <span className="mx-1.5">=</span>
                   <span className={problem.level >= 4 ? 'font-mono' : ''}>{renderSide(problem.displayRight)}</span>
                   {wasRevealed && <span className="ml-1 text-xs text-orange-700 dark:text-orange-400 opacity-80">(R)</span>}
                 </>
               );
          };


        return (
            <div className="absolute inset-0 bg-white dark:bg-gray-800 p-6 rounded-xl z-20 flex flex-col">
                <h3 className="text-lg font-semibold mb-4 text-center text-gray-700 dark:text-gray-200">Reviewing Problem {reviewIndex + 1} / {userAnswersHistory.length}</h3>
                 {/* Problema Mostrado */}
                 <div className="text-base sm:text-lg font-medium mb-3 text-gray-800 dark:text-gray-100 flex justify-center items-center flex-wrap gap-x-1 sm:gap-x-1.5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                     {renderReviewEquationInternalHelper(problem, userAnswers, isCorrect, wasRevealed)}
                 </div>

                {/* Stats */}
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center border-t dark:border-gray-700 pt-3">
                   {`Level: ${difficultyLevel}, Attempts: ${attemptsMade}`}{`, Time: ${timeSpent.toFixed(1)}s`}
                   {wasRevealed && <span className="text-orange-600 dark:text-orange-400"> (Revealed)</span>}
                </div>

                {/* Navigation (reused) */}
                <div className="mt-auto flex justify-between items-center pt-4">
                    <button onClick={handleReviewPrev} disabled={reviewIndex === 0} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 flex items-center gap-1" aria-label="Previous problem"><ArrowLeft size={14} /> Prev</button>
                    <button onClick={handleExitReview} className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700" aria-label="Return to exercise">Return to Exercise</button>
                    <button onClick={handleReviewNext} disabled={reviewIndex === userAnswersHistory.length - 1} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 flex items-center gap-1" aria-label="Next problem">Next <ArrowRight size={14} /></button>
                </div>
            </div>
        );
   };


  // --- Main Render ---

  // Completed State (adapted summary rendering)
  if (isComplete) {
       const correctCount = userAnswersHistory.filter(a => a.isCorrect).length;
       const revealedCount = userAnswersHistory.filter(a => a.wasRevealed).length;
       const accuracy = userAnswersHistory.length > 0 ? (correctCount / userAnswersHistory.length) * 100 : 0;
       const totalTime = userAnswersHistory.reduce((acc, a) => acc + a.timeSpent, 0);
       const avgTime = userAnswersHistory.length > 0 ? totalTime / userAnswersHistory.length : 0;
       const totalAttempts = userAnswersHistory.reduce((acc, a) => acc + a.attemptsMade, 0);
       const avgAttempts = userAnswersHistory.length > 0 ? totalAttempts / userAnswersHistory.length : 0;
       const finalDifficulty = userAnswersHistory.length > 0 ? userAnswersHistory[userAnswersHistory.length - 1].difficultyLevel : userSettingsInternal.difficulty;
       const finalProblemCount = userAnswersHistory.length;

       // Helper to render summary item (Uses same logic as interactive review helper)
       const renderSummaryItem = (answer: UserAssociativeAnswer, index: number) => {
            const { problem, userAnswers, isCorrect, wasRevealed, timeSpent, attemptsMade, difficultyLevel } = answer;

           const renderSide = (sideString: string) => {
                   const parts: (string | { symbol: '?' | '□', userAnswer: number | string | null, correctAnswer: AssociativePart })[] = [];
                   let lastIndex = 0;
                   const blankRegex = /(\?)|(□)/g;
                   let match;

                   while ((match = blankRegex.exec(sideString)) !== null) {
                       if (match.index > lastIndex) {
                           parts.push(sideString.substring(lastIndex, match.index));
                       }

                       const symbol = match[0] as '?' | '□';
                       const answerIndex = symbol === '?' ? 0 : 1;
                       const userAnswer = (userAnswers && userAnswers.length > answerIndex) ? userAnswers[answerIndex] : null;
                       const correctAnswer = problem.correctBlankValues.find(b => b.symbol === symbol)?.value ?? 'Error';

                       parts.push({ symbol, userAnswer, correctAnswer });

                       lastIndex = blankRegex.lastIndex;
                   }

                   if (lastIndex < sideString.length) {
                       parts.push(sideString.substring(lastIndex));
                   }

                   return (
                       <>
                           {parts.map((part, index) => {
                               if (typeof part === 'string') {
                                   return <span key={`s-${index}`}>{part}</span>;
                               } else {
                                   const displayValue = wasRevealed ? part.correctAnswer : (part.userAnswer ?? part.symbol);
                                    let spanClass = ""; let correctValueSpan: React.ReactNode = null;
                                    if (wasRevealed) { spanClass = "font-semibold text-orange-700 dark:text-orange-400";
                                    } else if (isCorrect) { spanClass = "font-semibold text-green-700 dark:text-green-300";
                                    } else { if (part.userAnswer !== null && part.userAnswer === part.correctAnswer) { spanClass = "font-semibold text-green-700 dark:text-green-300 opacity-70"; } else { spanClass = "font-semibold line-through text-red-700 dark:text-red-400"; correctValueSpan = <span className="ml-0.5 text-xs text-green-600 dark:text-green-400 font-semibold">({part.correctAnswer})</span>; } }

                                   return (<span key={`s-${index}`} className="inline-flex items-center mx-px"><span className={spanClass}>{displayValue}</span>{correctValueSpan}</span>);
                               }
                           })}
                       </>
                   );
               };


           return (
             <div key={index} className={`p-3 rounded-md shadow-sm ${ isCorrect ? 'bg-green-100 dark:bg-green-900/30 ring-1 ring-green-200 dark:ring-green-700' : wasRevealed ? 'bg-orange-100 dark:bg-orange-900/30 ring-1 ring-orange-200 dark:ring-orange-700' : 'bg-red-100 dark:bg-red-900/30 ring-1 ring-red-200 dark:ring-red-700'}`} >
               <div className="flex justify-between items-start text-sm">
                 <div className="text-left flex-grow">
                   <p className="font-medium text-gray-800 dark:text-gray-100 flex flex-wrap items-center gap-x-1 text-xs sm:text-sm">
                     <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">(#{index+1})</span>
                     <span className={problem.level >= 4 ? 'font-mono' : ''}>{renderSide(problem.displayLeft)}</span>
                     <span className="mx-1">=</span>
                     <span className={problem.level >= 4 ? 'font-mono' : ''}>{renderSide(problem.displayRight)}</span>
                   </p>
                   {/* Stats */}
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {`Lvl: ${difficultyLevel}, Att: ${attemptsMade}`}{`, T: ${timeSpent.toFixed(1)}s`}
                   </p>
                 </div>
                 {/* Icono de estado (reused) */}
                 <div className="text-right pl-2 shrink-0">
                    {isCorrect ? ( <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    ) : wasRevealed ? ( <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 102 0V5zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>
                    ) : ( <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.607a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    )}
                  </div>
               </div>
             </div>
           );
       };

      return ( <div className="max-w-lg mx-auto text-center p-4"> <h2 className="text-2xl font-bold mb-4">Associative Property Exercise Complete!</h2> <div className="bg-indigo-50 dark:bg-gray-900/50 p-6 rounded-lg mb-6 ring-1 ring-inset ring-indigo-100 dark:ring-gray-700"> <div className="grid grid-cols-2 gap-4"> {/* ... Stats divs (reused) ... */} <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Score</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{correctCount} / {finalProblemCount}</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Accuracy</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{accuracy.toFixed(1)}%</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Avg. Time</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{avgTime.toFixed(1)}s</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Avg. Attempts</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{avgAttempts.toFixed(1)}</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Blanks Revealed</p><p className="text-xl font-bold text-orange-600 dark:text-orange-400">{revealedCount}</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Final Level</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{finalDifficulty}</p></div> {userSettingsInternal.enableCompensation && finalProblemCount > userSettingsInternal.problemCount && ( <div className="col-span-2 bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md text-sm text-yellow-800 dark:text-yellow-200"> {finalProblemCount - userSettingsInternal.problemCount} extra problem(s) added due to compensation. </div> )} </div> </div> <div className="mb-6"> <h3 className="text-xl font-semibold mb-3">Problem Review</h3> <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800/50"> {userAnswersHistory.map((answer, index) => renderSummaryItem(answer, index))} </div> </div> <button onClick={restartExercise} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"> Start New Exercise </button> </div> );
  }


  // --- Exercise in Progress UI (adapted) ---
  const currentProblemData = isReviewMode ? userAnswersHistory[reviewIndex]?.problem : currentProblem;
  const isLevel4Or5 = currentProblemData ? currentProblemData.level >= 4 : false; // Use text input for L4+

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
                        <button onClick={handleEnterReview} disabled={currentIndex === 0 || userAnswersHistory.length === 0} className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed" aria-label="Review Previous Problems" title="Review Previous Problems"><Eye size={18} /></button>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Problem {currentIndex + 1} of {targetProblemCount}</span>
                        <div>
                            <span className="text-gray-600 dark:text-gray-400 mr-3">Lvl: <span className="font-semibold text-indigo-700 dark:text-indigo-300">{currentExerciseDifficulty}</span></span>
                             <span className="text-gray-600 dark:text-gray-400">Att: {currentAttempts} / {userSettingsInternal.maxAttempts || '∞'}</span>
                        </div>
                    </div>
                    {/* Progress bar and streak (reused) */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden"><motion.div className="bg-indigo-600 h-full rounded-full" style={{ width: `${((currentIndex + 1) / targetProblemCount) * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }}/></div>
                    {userSettingsInternal.adaptiveDifficulty && (<div className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">Streak: {consecutiveCorrectAnswers}/{CORRECT_STREAK_THRESHOLD_ASSOC}</div>)}
                </div>

                {/* Main Problem Area */}
                <motion.div key={`${currentIndex}-${problemDisplayState}-${currentProblemData?.level}`} // Key includes relevant state
                 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg mb-6 text-center border border-gray-200 dark:border-gray-700 relative">
                    {/* Problem Display (Uses adapted renderEquation) */}
                    <div className="mb-4 text-left">
                        <div className={`text-lg sm:text-xl font-medium mb-2 text-gray-800 dark:text-gray-100 flex justify-center items-center flex-wrap gap-x-1 sm:gap-x-1.5`}>
                            {renderEquation(currentProblemData, problemDisplayState)}
                        </div>
                        {/* Prompt (adapted) */}
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                           {problemDisplayState === 'active' && `Find the values for ? and □ that satisfy the property.`}
                           {problemDisplayState === 'showing_answer' && feedback?.correct && "Correct! Answers shown above."}
                           {problemDisplayState === 'showing_answer' && !feedback?.correct && !isAnswerRevealed && "Incorrect. Correct answers shown above."}
                           {problemDisplayState === 'showing_answer' && isAnswerRevealed && feedback?.message} {/* Show reveal message */}
                        </p>
                    </div>

                    {/* Feedback Area (reused) */}
                    <AnimatePresence>{feedback && problemDisplayState === 'showing_answer' && ( <motion.div key="feedback-message" initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.2 }} className={`p-3 rounded-md text-sm font-medium overflow-hidden ${ feedback.correct ? 'bg-green-100 text-green-800 dark:bg-green-800/80 dark:text-green-100' : isAnswerRevealed ? 'bg-orange-100 text-orange-800 dark:bg-orange-800/80 dark:text-orange-100' : 'bg-red-100 text-red-800 dark:bg-red-800/80 dark:text-red-100'}`} > {feedback.message} </motion.div> )} </AnimatePresence>

                    {/* --- Form / Continue Button --- */}
                    {problemDisplayState === 'active' ? (
                        <>
                            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                {/* Inputs for ? and □ */}
                                <div className={`grid grid-cols-2 gap-4`}>
                                    {/* Input 1 (?) */}
                                     <div>
                                        <label htmlFor="input1" className="sr-only">Value for ?</label>
                                         <input
                                            ref={input1Ref}
                                            id="input1"
                                            type={isLevel4Or5 ? "text" : "number"} // Text for L4/5, Number for L1-3
                                            inputMode={isLevel4Or5 ? "text" : "numeric"}
                                            value={inputValue1}
                                            onChange={(e) => setInputValue1(e.target.value)}
                                            placeholder="?"
                                            aria-label="Enter value for ?"
                                            aria-invalid={!!error1}
                                            aria-describedby={error1 ? "input1-error" : undefined}
                                            className={`w-full px-4 py-3 text-lg sm:text-xl text-center rounded-md border ${ error1 ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500' } focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 dark:disabled:opacity-60`}
                                            required
                                            disabled={isSubmitting.current}
                                        />
                                        {error1 && (<p id="input1-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">{error1}</p>)}
                                    </div>

                                    {/* Input 2 (□) */}
                                    <div>
                                        <label htmlFor="input2" className="sr-only">Value for □</label>
                                        <input
                                            ref={input2Ref}
                                            id="input2"
                                            type={isLevel4Or5 ? "text" : "number"} // Text for L4/5, Number for L1-3
                                            inputMode={isLevel4Or5 ? "text" : "numeric"}
                                            value={inputValue2}
                                            onChange={(e) => setInputValue2(e.target.value)}
                                            placeholder="□"
                                            aria-label="Enter value for □"
                                            aria-invalid={!!error2}
                                            aria-describedby={error2 ? "input2-error" : undefined}
                                            className={`w-full px-4 py-3 text-lg sm:text-xl text-center rounded-md border ${ error2 ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500' } focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 dark:disabled:opacity-60`}
                                            required
                                            disabled={isSubmitting.current}
                                        />
                                        {error2 && (<p id="input2-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">{error2}</p>)}
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button type="submit" className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                                    disabled={isSubmitting.current || !inputValue1.trim() || !inputValue2.trim()} // Require both inputs
                                >
                                    {isSubmitting.current ? 'Checking...' : 'Submit Answer'}
                                </button>
                            </form>
                             {/* Show Answer Button */}
                            {!isAnswerRevealed && (
                                <button onClick={handleShowAnswer} className="mt-3 w-full px-6 py-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 dark:focus:ring-offset-gray-800 disabled:opacity-50" disabled={isSubmitting.current}>
                                   Show Correct Values
                                </button>
                            )}
                        </>
                    ) : (
                        // Continue/Hold Button (reused)
                        <div className="mt-8"> <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} onClick={handleContinue} onMouseDown={handleHoldPress} onMouseUp={handleHoldRelease} onTouchStart={handleHoldPress} onTouchEnd={handleHoldRelease} className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 relative overflow-hidden" > <span className="relative z-0"> {isAutoContinueEnabled ? "Hold to Pause" : (currentIndex < targetProblemCount - 1 ? 'Continue' : 'Show Results')} </span> {/* Checkbox Auto Continue */} <div className="absolute bottom-0 right-0 mb-1 mr-1 flex items-center z-10 group" onClick={handleCheckboxAreaClick}> <AnimatePresence>{showAutoContinueTooltip && (<motion.div initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute bottom-full right-0 mb-1 p-1.5 bg-gray-900 text-white text-xs rounded shadow-lg w-max max-w-[180px] pointer-events-none" role="tooltip" id="auto-continue-tooltip">Auto-proceeds after {AUTO_CONTINUE_DELAY_ASSOC/1000}s</motion.div>)}</AnimatePresence> <label htmlFor="auto-continue-checkbox" className="flex items-center px-1.5 py-0.5 bg-white/80 dark:bg-black/50 rounded cursor-pointer hover:bg-white dark:hover:bg-black/70 backdrop-blur-sm transition-colors"> <input type="checkbox" id="auto-continue-checkbox" checked={isAutoContinueEnabled} onChange={handleAutoContinueChange} className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-1 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-600 dark:ring-offset-gray-800" aria-describedby={showAutoContinueTooltip ? "auto-continue-tooltip" : undefined}/><span className="text-xs font-medium text-gray-700 dark:text-gray-200 select-none">Auto</span> </label> </div> </motion.button> </div>
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