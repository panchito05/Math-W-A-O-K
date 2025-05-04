import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Eye, RotateCcw } from 'lucide-react'; // Import icons

// --- Constants ---
const MAX_COMMUTATIVE_DIFFICULTY = 5;
const CORRECT_STREAK_THRESHOLD_COMM = 10; // Streak needed to increase difficulty
const AUTO_CONTINUE_DELAY_COMM = 2000;
const TOOLTIP_DISPLAY_TIME_COMM = 3000;

// --- Types ---

// Represents a part in the commutative structure (A or B), can be number, string (variable/expression)
type CommutativePart = number | string;

// Defines which pattern the problem uses (one blank '?' or two blanks '?' and '□')
type CommutativePattern = 'one_blank' | 'two_blanks';

interface CommutativeProblem {
    level: number; // Difficulty level
    operation: '+' | '×'; // The commutative operation

    // The two terms that commute (A and B in A op B = B op A)
    termA: CommutativePart;
    termB: CommutativePart;

    // The pattern used for blanks in this specific problem instance
    pattern: CommutativePattern;

    // String representations for display, showing the blanks
    displayLeft: string; // e.g. "12 + ?" or "(? - 13) + 18" or "?x + 24y"
    displayRight: string; // e.g. "□ + 15" or "25 + (□ - 13)" or "24y + □x"

    // The correct values the user must enter for '?' and '□' respectively.
    // For 'one_blank', only the '?' entry will be relevant.
    correctBlankValues: { symbol: '?' | '□', value: CommutativePart }[];
}

interface UserCommutativeAnswer {
  problem: CommutativeProblem;
  // userAnswers[0] for '?', userAnswers[1] for '□' (if two blanks)
  userAnswers: (number | string | null)[];
  isCorrect: boolean; // Correctness of all required blanks
  wasRevealed: boolean; // Were the answers revealed?
  timeSpent: number;
  attemptsMade: number; // Total attempts for the single step
  difficultyLevel: number;
}

interface CommutativeSettings {
  difficulty: number;
  problemCount: number;
  timeLimit: number;
  adaptiveDifficulty: boolean;
  maxAttempts: number;
  enableCompensation: boolean;
}

// --- Utility Functions (Reused or slightly adapted) ---

function shuffleArray<T>(array: T[]): T[] {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getUniqueRandomInts(count: number, min: number, max: number): number[] {
    const nums = new Set<number>();
    const range = max - min + 1;
    if (range < count) {
         const allNumbers = Array.from({ length: range }, (_, i) => min + i);
         return allNumbers;
    }
    while (nums.size < count) {
        nums.add(Math.floor(Math.random() * range) + min);
    }
    return Array.from(nums);
}

// Helper to wrap complex terms in parentheses for display
const wrapIfComplex = (part: CommutativePart | '?' | '□', operation: '+' | '×'): string => {
    const s = String(part);
    if (s === '?' || s === '□') return s; // Don't wrap the blanks themselves

    // Criteria for wrapping: contains operators, or is a term with coefficient + variable (e.g., 2x), etc.
    // Avoid wrapping simple numbers or single variables.
     const needsWrap =
        s.includes('+') || s.includes('-') || s.includes('×') || s.includes('/') ||
        (s.match(/[a-z]/i) && s.match(/\d/)) || // e.g. 2x
        s.match(/\^/) || // powers
        s.match(/√/); // roots

    // Special case: For multiplication, wrap terms that contain + or -
    if (operation === '×' && (s.includes('+') || s.includes('-'))) {
        return `(${s})`;
    }

    if (needsWrap) {
        return `(${s})`;
    }
    return s;
};


// --- NEW: Function to generate Commutative Problems ---
const generateCommutativeProblem = (level: number): CommutativeProblem => {
    const validLevel = Math.max(1, Math.min(MAX_COMMUTATIVE_DIFFICULTY, Math.round(level)));

    let operation: '+' | '×';
    let termA: CommutativePart;
    let termB: CommutativePart;
    const pattern: CommutativePattern = Math.random() < 0.5 ? 'one_blank' : 'two_blanks'; // 50/50 chance for simplicity across levels

    // Define terms A and B based on level
    switch (validLevel) {
        case 1: // Natural Numbers Simples (1-20)
            operation = Math.random() < 0.5 ? '+' : '×';
            [termA, termB] = getUniqueRandomInts(2, 1, 20);
            break;
        case 2: // Integers and Decimals
            operation = Math.random() < 0.5 ? '+' : '×';
            // Use integers or decimals
            const isDecimal = Math.random() < 0.3;
            if (isDecimal) {
                 termA = parseFloat((getRandomInt(5, 20) + Math.random()).toFixed(1));
                 termB = parseFloat((getRandomInt(5, 20) + Math.random()).toFixed(1));
            } else {
                 termA = getRandomInt(-15, 20); // Allow negative integers
                 termB = getRandomInt(-15, 20);
                 // Ensure they are reasonably distinct if both integers
                 if (termA === termB && Math.abs(termA) < 50) termB += (termB >= 0 ? 5 : -5);
            }
            break;
        case 3: // Simple Algebraic Expressions (Coefficient + Variable or just variable)
            operation = Math.random() < 0.5 ? '+' : '×';
            const varsL3 = shuffleArray(['a', 'b', 'm', 'n', 'x', 'y']);
            const useCoeff1 = Math.random() < 0.7;
            const useCoeff2 = Math.random() < 0.7;
            termA = useCoeff1 ? `${getRandomInt(2, 15)}${varsL3[0]}` : varsL3[0];
            termB = useCoeff2 ? `${getRandomInt(2, 15)}${varsL3[1]}` : varsL3[1];
            // Add a chance for simple numbers to be involved too
            if (Math.random() < 0.3) termA = getRandomInt(5, 25);
            if (Math.random() < 0.3) termB = getRandomInt(5, 25);
            break;
        case 4: // Mixed Expressions and Potencias
             operation = Math.random() < 0.5 ? '+' : '×';
             const varsL4 = shuffleArray(['x', 'y', 'a', 'b']);
             const constsL4 = getUniqueRandomInts(2, 5, 20);
             const patternsL4: ((v: string[], c: number[]) => CommutativePart)[] = [
                 (v, c) => `${v[0]}^2`,
                 (v, c) => c[0],
                 (v, c) => `${c[0]}${v[0]}`,
                 (v, c) => `(${v[0]} + ${v[1]})`,
                 (v, c) => `(${c[0]} - ${c[1]})^2`,
                 (v, c) => `${c[0]} / ${c[1]}`, // Resulting fraction might not be simple, but structure shown
                 (v, c) => c[0] * c[1] // simple number
             ];
             termA = shuffleArray([...patternsL4])[0](varsL4, constsL4);
             termB = shuffleArray([...patternsL4])[0](varsL4, constsL4.reverse()); // Use slightly different consts/vars maybe
            break;
        case 5: // Complex Expressions
             operation = Math.random() < 0.6 ? '+' : '×'; // Slightly favour addition for complex terms
             const varsL5 = shuffleArray(['x', 'y', 'a', 'b', 'z']);
             const constsL5 = getUniqueRandomInts(4, 2, 15); // More constants needed

              const patternsL5: ((v: string[], c: number[]) => CommutativePart)[] = [
                 (v, c) => `${c[0]}√${v[0]}`, // e.g., 5√x
                 (v, c) => `${v[0]}^2 ${operation === '+' ? '+' : '-'} ${c[0]}`, // e.g., x² - 14
                 (v, c) => `(${v[0]} + ${c[0]})^2`, // e.g., (a + 17)²
                 (v, c) => `${c[0]}`, // Simple constant
                 (v, c) => `${c[0]}${operation === '+' ? '' : '('}${v[0]} ${operation} ${v[1]}${operation === '+' ? '' : ')'}`, // e.g. 2x + 3y or 2(x × y) - simplified structure
                 (v, c) => `${c[0]}(${v[0]} ${operation === '+' ? '-' : '/'} ${v[1]})`, // e.g. 19(x-y) or 19(x/y)
                 (v, c) => `(${v[0]}${operation==='+' ? '+' : '×'}${c[0]})${operation==='+' ? '' : v[1]}`, // e.g. (a+5) or (a×5)b
              ];

             termA = shuffleArray([...patternsL5])[0](varsL5, constsL5);
             termB = shuffleArray([...patternsL5])[0](varsL5.reverse(), constsL5.slice(2)); // Use different vars/consts
            break;
        default: // Fallback to Level 1
            operation = '+';
            [termA, termB] = getUniqueRandomInts(2, 1, 10);
    }

     // Ensure termA and termB are not identical (especially for L1-3 numbers)
     if (String(termA) === String(termB) && typeof termA !== 'string') { // Avoid infinite loop if only one variable available
          termB = (typeof termA === 'number' ? termA + 5 : String(termB) + 'z'); // Add a small offset or suffix
     }


    // --- Construct Display Strings and Correct Values ---
    const opSymbol = operation === '+' ? '+' : (validLevel >= 4 ? '×' : '×'); // Use × symbol consistently

    let displayLeft = "";
    let displayRight = "";
    const correctBlankValues: CommutativeProblem['correctBlankValues'] = [];

    const termA_disp = wrapIfComplex(termA, operation);
    const termB_disp = wrapIfComplex(termB, operation);

    if (pattern === 'one_blank') {
        // Pattern: termA op termB = termB op ?
        displayLeft = `${termA_disp} ${opSymbol} ${termB_disp}`;
        displayRight = `${termB_disp} ${opSymbol} ?`;
        correctBlankValues.push({ symbol: '?', value: termA });

    } else { // two_blanks
        // Pattern: termA op ? = □ op termB
        displayLeft = `${termA_disp} ${opSymbol} ?`;
        displayRight = `□ ${opSymbol} ${termB_disp}`;
        correctBlankValues.push({ symbol: '?', value: termB });
        correctBlankValues.push({ symbol: '□', value: termA });
    }

     // Re-sort correctBlankValues to always have '?' first, then '□' for consistent indexing
     correctBlankValues.sort((a, b) => (a.symbol === '?' ? -1 : 1));


    return {
        level: validLevel,
        operation,
        termA,
        termB,
        pattern,
        displayLeft,
        displayRight,
        correctBlankValues,
    };
};


// --- NEW: checkCommutativeAnswers function ---
const checkCommutativeAnswers = (problem: CommutativeProblem, userAnswers: (number | string | null)[]): boolean => {
    if (!problem.correctBlankValues || (problem.pattern === 'one_blank' && problem.correctBlankValues.length !== 1) || (problem.pattern === 'two_blanks' && problem.correctBlankValues.length !== 2)) {
        console.error("Commutative Problem structure error: Missing correctBlankValues or incorrect count");
        return false; // Problem malformed
    }
    // Always expect two user inputs from the fields, even if only one is used
    if (userAnswers.length !== 2) {
        return false; // Expecting two user answers from the UI fields
    }

    // Get correct values by symbol
    const correctQValue = problem.correctBlankValues.find(b => b.symbol === '?')?.value;
    const correctSValue = problem.correctBlankValues.find(b => b.symbol === '□')?.value;

    // Get user input values (input1 always for '?', input2 always for '□')
    const userAnswerQ = userAnswers[0];
    const userAnswerS = userAnswers[1];

    let isCorrectQ = false;
    let isCorrectS = false;

    // Check '?'
    if (correctQValue !== undefined) {
        if (typeof correctQValue === 'number') {
             // Attempt to parse user input as number
            const numUserAnswerQ = parseFloat(String(userAnswerQ));
            // Compare numbers (handle potential floating point issues loosely if needed, but examples are simple)
            isCorrectQ = userAnswerQ !== null && !isNaN(numUserAnswerQ) && numUserAnswerQ === correctQValue;
        } else { // String (variable or expression)
             // Compare strings (case-sensitive, trim whitespace)
            isCorrectQ = userAnswerQ !== null && typeof userAnswerQ === 'string' && userAnswerQ.trim() === String(correctQValue).trim();
        }
    } else {
         console.error("Correct value for '?' not found in problem structure.");
         isCorrectQ = false; // Cannot check if correct value is missing
    }


    // Check '□' only if the problem pattern is 'two_blanks'
    if (problem.pattern === 'one_blank') {
        // If it's a one-blank problem, '□' input doesn't need to be checked
        isCorrectS = true; // This part of the check is satisfied if only '?' is required
    } else { // two_blanks
        if (correctSValue !== undefined) {
             if (typeof correctSValue === 'number') {
                const numUserAnswerS = parseFloat(String(userAnswerS));
                isCorrectS = userAnswerS !== null && !isNaN(numUserAnswerS) && numUserAnswerS === correctSValue;
            } else { // String
                isCorrectS = userAnswerS !== null && typeof userAnswerS === 'string' && userAnswerS.trim() === String(correctSValue).trim();
            }
        } else {
             console.error("Correct value for '□' not found in problem structure for two-blank problem.");
             isCorrectS = false; // Cannot check if correct value is missing
        }
    }

    return isCorrectQ && isCorrectS;
};


// --- Settings Component ---
export const CommutativeSettings: React.FC = () => {
  const [settings, setSettings] = useState<CommutativeSettings>(() => {
      const saved = localStorage.getItem('math_commutative_settings');
      const defaultSettings: CommutativeSettings = { difficulty: 1, problemCount: 10, timeLimit: 0, adaptiveDifficulty: true, maxAttempts: 1, enableCompensation: false };
      if (!saved) return defaultSettings;
      try {
          const parsed = JSON.parse(saved);
          return {
              difficulty: parseInt(parsed.difficulty, 10) || defaultSettings.difficulty,
              problemCount: parseInt(parsed.problemCount, 10) > 0 ? parseInt(parsed.problemCount, 10) : defaultSettings.problemCount,
              timeLimit: parseInt(parsed.timeLimit, 10) >= 0 ? parseInt(parsed.timeLimit, 10) : 0,
              adaptiveDifficulty: typeof parsed.adaptiveDifficulty === 'boolean' ? parsed.adaptiveDifficulty : true,
              maxAttempts: parseInt(parsed.maxAttempts, 10) >= 1 ? parseInt(parsed.maxAttempts, 10) : 1,
              enableCompensation: typeof parsed.enableCompensation === 'boolean' ? parsed.enableCompensation : false,
          };
      } catch { return defaultSettings; }
  });

  useEffect(() => {
      localStorage.setItem('math_commutative_settings', JSON.stringify(settings));
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
          else if (name === 'difficulty') parsedValue = isNaN(numValue) ? 1 : Math.max(1, Math.min(MAX_COMMUTATIVE_DIFFICULTY, numValue));
          else parsedValue = isNaN(numValue) ? 0 : numValue;
      } else { parsedValue = value; }
      setSettings(prev => ({ ...prev, [name]: parsedValue }));
  };

  // --- NEW renderExampleProblem ---
  const renderExampleProblem = (level: number) => {
      let prob: CommutativeProblem | null = null;
      let attempts = 0;
       // Try generating until we get a valid problem structure
      do {
          prob = generateCommutativeProblem(level);
          attempts++;
           // Ensure correctBlankValues match the pattern length
      } while (
          !prob ||
          (prob.pattern === 'one_blank' && (!prob.correctBlankValues || prob.correctBlankValues.length !== 1 || prob.correctBlankValues[0].value === 'Error')) ||
          (prob.pattern === 'two_blanks' && (!prob.correctBlankValues || prob.correctBlankValues.length !== 2 || prob.correctBlankValues[0].value === 'Error' || prob.correctBlankValues[1].value === 'Error')) ||
          attempts < 10
      );


      if (!prob || !prob.displayLeft || !prob.displayRight || !prob.correctBlankValues) return <p>Error generating example.</p>;

      // Show the structure with blanks
      return (
          <>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-1 break-words flex flex-wrap items-center gap-x-1">
                  <span>{prob.displayLeft}</span>
                  <span className="mx-1">=</span>
                  <span>{prob.displayRight}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Find the value{prob.pattern === 'two_blanks' ? 's' : ''} for {prob.pattern === 'two_blanks' ? '? and □' : '?'}.</p>
          </>
      );
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Commutative Property Settings</h2>
      <div className="space-y-6">
        {/* Difficulty */}
        <div>
          <label htmlFor="difficultyRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Difficulty Level ({settings.difficulty})</label>
          <input id="difficultyRange" type="range" name="difficulty" min="1" max="5" value={settings.difficulty} onChange={handleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
             {/* Text explanation */}
             <div className="mt-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    L1: Natural numbers (1-20).
                    L2: Integers and decimals.
                    L3: Simple algebraic terms (e.g., 5x, y).
                    L4: Mixed expressions (e.g., x², a+b).
                    L5: Complex expressions (e.g., √x, (a+b)², fractions).
                    All levels can use one blank (?) or two blanks (? and □).
                </p>
             </div>
        </div>
        {/* ... Other settings (unchanged structure, using commutative settings state) ... */}
        <div><label htmlFor="problemCountInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Initial Number of Problems</label><input type="number" id="problemCountInput" name="problemCount" min="1" max="100" step="1" value={settings.problemCount} onChange={handleChange} className="input-field-style"/></div>
        <div><label htmlFor="maxAttempts" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Attempts per Problem</label><input type="number" id="maxAttempts" name="maxAttempts" min="1" value={settings.maxAttempts} onChange={handleChange} className="input-field-style"/><p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Applies to finding the blank(s).</p></div>
        <div className="flex items-center"><input type="checkbox" id="enableCompensation" name="enableCompensation" checked={settings.enableCompensation} onChange={handleChange} className="checkbox-style"/><label htmlFor="enableCompensation" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Enable Compensation (Add 1 problem for each incorrect)</label></div>
        <div><label htmlFor="timeLimitInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Limit (seconds per problem, 0 for no limit)</label><input id="timeLimitInput" type="number" name="timeLimit" min="0" max="120" value={settings.timeLimit} onChange={handleChange} className="input-field-style"/></div>
        <div className="flex items-center"><input type="checkbox" id="adaptiveDifficulty" name="adaptiveDifficulty" checked={settings.adaptiveDifficulty} onChange={handleChange} className="checkbox-style"/><label htmlFor="adaptiveDifficulty" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Enable Adaptive Difficulty (Increases level after {CORRECT_STREAK_THRESHOLD_COMM} correct in a row)</label></div>

         {/* Examples (Show L1, L3, L5) */}
         <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-4">Example Problem Formats</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 3, 5].map((level) => ( // Show L1, L3, and L5
                    <div key={level} className={`bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm ${level >= 4 ? 'md:col-span-2' : ''}`}> {/* Make L4/5 span full width on md */}
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
export const CommutativeExercise: React.FC = () => {
  const emitProgressInternal = useCallback((data: { correct: boolean; timeSpent: number; difficulty: number; attempts: number; revealed: boolean }) => {
      const event = new CustomEvent('operationProgress', { detail: { operationType: 'commutative', ...data } }); window.dispatchEvent(event);
  }, []);

  const [userSettingsInternal, setUserSettingsInternal] = useState<CommutativeSettings>(() => {
      const saved = localStorage.getItem('math_commutative_settings');
      const defaultSettings: CommutativeSettings = { difficulty: 1, problemCount: 10, timeLimit: 0, adaptiveDifficulty: true, maxAttempts: 1, enableCompensation: false };
      if (!saved) return defaultSettings;
      try {
          const parsed = JSON.parse(saved);
          return { difficulty: parseInt(parsed.difficulty, 10) || defaultSettings.difficulty, problemCount: parseInt(parsed.problemCount, 10) > 0 ? parseInt(parsed.problemCount, 10) : defaultSettings.problemCount, timeLimit: parseInt(parsed.timeLimit, 10) >= 0 ? parseInt(parsed.timeLimit, 10) : 0, adaptiveDifficulty: typeof parsed.adaptiveDifficulty === 'boolean' ? parsed.adaptiveDifficulty : true, maxAttempts: parseInt(parsed.maxAttempts, 10) >= 1 ? parseInt(parsed.maxAttempts, 10) : 1, enableCompensation: typeof parsed.enableCompensation === 'boolean' ? parsed.enableCompensation : false, };
      } catch { return defaultSettings; }
  });

  // --- State ---
  const [currentProblem, setCurrentProblem] = useState<CommutativeProblem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswersHistory, setUserAnswersHistory] = useState<UserCommutativeAnswer[]>([]);
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
          if (event.key === 'math_commutative_settings' && event.newValue) {
              try {
                  const newSettings = JSON.parse(event.newValue) as Partial<CommutativeSettings>;
                  const validatedSettings: CommutativeSettings = {
                      difficulty: Math.max(1, Math.min(MAX_COMMUTATIVE_DIFFICULTY, newSettings.difficulty ?? 1)),
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
    console.log("Initializing/Restarting commutative exercise:", userSettingsInternal);
    const initialDifficulty = userSettingsInternal.difficulty;
    setCurrentExerciseDifficulty(initialDifficulty);
    setCurrentProblem(generateCommutativeProblem(initialDifficulty));
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
    const focusTimeout = setTimeout(() => input1Ref.current?.focus(), 100);
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
            // Prioritize errors, then input 1
            if (error1) {
                input1Ref.current?.focus();
                input1Ref.current?.select();
            } else if (currentProblem.pattern === 'two_blanks' && error2) {
                 input2Ref.current?.focus();
                 input2Ref.current?.select();
            } else {
                 input1Ref.current?.focus(); // Default focus to input 1 ('?')
            }
        }, 50);
        return () => clearTimeout(focusTimeout);
    }
   }, [currentIndex, problemDisplayState, isComplete, currentProblem, error1, error2, isReviewMode]);

    // Auto-continue logic (reused)
    useEffect(() => {
        if (problemDisplayState === 'showing_answer' && isAutoContinueEnabled && !isReviewMode) { if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = setTimeout(handleContinue, AUTO_CONTINUE_DELAY_COMM); } return () => { if (autoContinueTimerRef.current) { clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; } };
    }, [problemDisplayState, isAutoContinueEnabled, isReviewMode, currentIndex]);


  // --- Handlers ---

  // handleSubmit (adapted for single step, two inputs, conditional check)
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
    let userAttemptValue2: number | string | null = null; // Always read input 2, even if not needed

    // Validate Input 1 ('?') - Always required
    if (inputValue1.trim() === '') { localError1 = 'Enter value for ?.'; }
    else { userAttemptValue1 = inputValue1.trim(); } // Use trim for both numbers and strings for consistency

    // Validate Input 2 ('□') - Only required if two blanks are needed
    if (currentProblem.pattern === 'two_blanks') {
         if (inputValue2.trim() === '') { localError2 = 'Enter value for □.'; }
         else { userAttemptValue2 = inputValue2.trim(); } // Use trim
    } else {
        // If pattern is one_blank, input2 is not strictly required to be filled by the user
        // We can optionally check if they *did* fill it and it's wrong, but for simplicity,
        // let's just not require it and clear any potential error if it exists.
         userAttemptValue2 = inputValue2.trim(); // Still get the value if they entered something
         localError2 = ''; // Clear any previous error on input 2
    }


    // If validation errors for required inputs, show them and stop
    if (localError1 || (currentProblem.pattern === 'two_blanks' && localError2)) {
        setError1(localError1);
        setError2(localError2);
        isSubmitting.current = false;
        // Focus on the first errored input
         if(localError1) input1Ref.current?.focus();
         else if (localError2) input2Ref.current?.focus();
        return;
    }

     // Attempt numeric conversion if the correct answer is a number type (L1-3 usually)
     const correctQValue = currentProblem.correctBlankValues.find(v => v.symbol === '?')?.value;
     const correctSValue = currentProblem.correctBlankValues.find(v => v.symbol === '□')?.value;

     let finalUserValue1: CommutativePart | null = userAttemptValue1;
     if (typeof correctQValue === 'number' && typeof userAttemptValue1 === 'string') {
         const num = parseFloat(userAttemptValue1);
         if (!isNaN(num)) finalUserValue1 = num; else finalUserValue1 = userAttemptValue1; // Keep string if not valid number
     }

     let finalUserValue2: CommutativePart | null = userAttemptValue2;
      if (typeof correctSValue === 'number' && typeof userAttemptValue2 === 'string') {
         const num = parseFloat(userAttemptValue2);
         if (!isNaN(num)) finalUserValue2 = num; else finalUserValue2 = userAttemptValue2;
     }

    // Check correctness using the new checkCommutativeAnswers
    const isCorrect = checkCommutativeAnswers(currentProblem, [finalUserValue1, finalUserValue2]);

    if (isCorrect) {
        // Correct
        setFeedback({ correct: true, message: `Correct! The blanks are filled correctly.` });
        setProblemDisplayState('showing_answer');
        setUserAnswersHistory(prev => [...prev, {
            problem: currentProblem, userAnswers: [finalUserValue1, finalUserValue2],
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
            const errorMsg = `Incorrect value${currentProblem.pattern === 'two_blanks' ? 's' : ''}. Try again.`;
            setFeedback({ correct: false, message: `${errorMsg} (Attempts left: ${attemptsRemaining})` });

            // Provide specific errors if possible
             const correctQ = currentProblem.correctBlankValues.find(v => v.symbol === '?')?.value;
             const correctS = currentProblem.correctBlankValues.find(v => v.symbol === '□')?.value;

             let specificError1 = '';
             // Only show specific error if user entered something AND it's wrong
             if (finalUserValue1 !== null && finalUserValue1 !== correctQ) {
                 specificError1 = `Incorrect value for ?.`;
                 setError1(specificError1);
                 setInputValue1(''); // Clear for retry
             } else {
                 setError1(''); // Clear if correct or empty
             }

             let specificError2 = '';
             if (currentProblem.pattern === 'two_blanks') {
                 if (finalUserValue2 !== null && finalUserValue2 !== correctS) {
                      specificError2 = `Incorrect value for □.`;
                      setError2(specificError2);
                      setInputValue2(''); // Clear for retry
                 } else {
                      setError2(''); // Clear if correct or empty
                 }
             } else {
                  setError2(''); // Always clear input 2 error for one-blank problems
             }

            isSubmitting.current = false;
        } else {
            // Incorrect, no attempts left
            const correctQValue = currentProblem.correctBlankValues.find(v => v.symbol === '?')?.value;
            const correctSValue = currentProblem.correctBlankValues.find(v => v.symbol === '□')?.value;
            let message = `Incorrect. Correct value for ?: ${correctQValue}`;
            if (currentProblem.pattern === 'two_blanks') {
                 message += `, and for □: ${correctSValue}.`;
            } else {
                 message += `.`;
            }

            setFeedback({ correct: false, message: message });
            setProblemDisplayState('showing_answer');
            setUserAnswersHistory(prev => [...prev, {
                problem: currentProblem, userAnswers: [finalUserValue1, finalUserValue2],
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
       if (currentStreak >= CORRECT_STREAK_THRESHOLD_COMM && currentExerciseDifficulty < MAX_COMMUTATIVE_DIFFICULTY) {
           const nextDifficulty = currentExerciseDifficulty + 1;
           setCurrentExerciseDifficulty(nextDifficulty);
           setConsecutiveCorrectAnswers(0); // Reset streak
            let nextLevelDesc = "";
            switch (nextDifficulty) { case 2: nextLevelDesc="Integers/Decimals"; break; case 3: nextLevelDesc="Simple Algebra"; break; case 4: nextLevelDesc="Mixed/Powers"; break; case 5: nextLevelDesc="Complex Expressions"; break; default: nextLevelDesc="Natural Numbers"; }
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

    let revealMessage = `Revealed: ? = ${correctQValue}`;
    if (currentProblem.pattern === 'two_blanks') {
         revealMessage += `, □ = ${correctSValue}.`;
    } else {
         revealMessage += `.`;
    }

    // Set input values to correct answers for display
    setInputValue1(String(correctQValue));
    if (currentProblem.pattern === 'two_blanks') {
        setInputValue2(String(correctSValue));
    } else {
         setInputValue2(''); // Ensure input 2 is empty if not needed
    }


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
    const nextProblem = generateCommutativeProblem(currentExerciseDifficulty); // Generate based on adapted difficulty

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
  }, [currentIndex, targetProblemCount, currentExerciseDifficulty, generateCommutativeProblem]);


  // handleAutoContinueChange, handleCheckboxAreaClick, HOLD LOGIC, restartExercise (reused)
  const handleAutoContinueChange = (e: React.ChangeEvent<HTMLInputElement>) => { const isChecked = e.target.checked; setIsAutoContinueEnabled(isChecked); if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); if (isChecked) { setShowAutoContinueTooltip(true); tooltipTimerRef.current = setTimeout(() => setShowAutoContinueTooltip(false), TOOLTIP_DISPLAY_TIME_COMM); } else { setShowAutoContinueTooltip(false); if (autoContinueTimerRef.current) { clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; } } };
  const handleCheckboxAreaClick = (e: React.MouseEvent) => e.stopPropagation();
  const handleHoldPress = () => { if (!isAutoContinueEnabled || problemDisplayState !== 'showing_answer') return; if (autoContinueTimerRef.current) { clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; } if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current); holdTimeoutRef.current = setTimeout(() => { /* Held */ }, 150); }; // Small delay to distinguish click from hold
  const handleHoldRelease = () => { if (!isAutoContinueEnabled || problemDisplayState !== 'showing_answer') return; if (holdTimeoutRef.current) { clearTimeout(holdTimeoutRef.current); holdTimeoutRef.current = null; } };
  const restartExercise = () => { setIsReviewMode(false); setUserSettingsInternal(prev => ({ ...prev })); }; // Trigger re-init via useEffect on userSettingsInternal

  // REVIEW MODE HANDLERS (adapted)
  const handleEnterReview = () => { if (userAnswersHistory.length === 0) return; setIsReviewMode(true); setReviewIndex(userAnswersHistory.length - 1); if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; };
  const handleExitReview = () => { setIsReviewMode(false); if(problemDisplayState === 'active') { input1Ref.current?.focus(); } if (problemDisplayState === 'showing_answer' && isAutoContinueEnabled) { if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = setTimeout(handleContinue, AUTO_CONTINUE_DELAY_COMM); } };
  const handleReviewNext = () => { setReviewIndex(prev => Math.min(prev + 1, userAnswersHistory.length - 1)); };
  const handleReviewPrev = () => { setReviewIndex(prev => Math.max(prev - 1, 0)); };


  // --- Render Helper for Equation (NEW) ---
  const renderEquation = (
      problem: CommutativeProblem | null,
      problemState: 'active' | 'showing_answer' | 'review',
      userInputs: (number | string | null)[] = [] // User inputs for the *current* active problem attempt
   ) => {
      if (!problem) return null;

       const renderSide = (sideString: string, blankValuesToShow: { symbol: '?' | '□', value: CommutativePart }[] | null, highlightBlanks: boolean) => {
           let displayString = sideString;
           const opSymbol = problem.operation === '+' ? '+' : (problem.level >= 4 ? '×' : '×'); // Use × symbol consistently for multiplication display

           // Replace blanks with spans for styling and potential interaction
           const parts: (string | { symbol: '?' | '□', value: CommutativePart | '?' })[] = [];
           let lastIndex = 0;
           const blankRegex = /(\?)|(□)/g;
           let match;

           while ((match = blankRegex.exec(displayString)) !== null) {
               // Add text before the blank
               if (match.index > lastIndex) {
                   parts.push(displayString.substring(lastIndex, match.index));
               }

               const symbol = match[0] as '?' | '□';
               let valueToShow: CommutativePart | '?';

               if (problemState === 'showing_answer' || problemState === 'review') {
                  // In solved/review state, show the correct value
                  valueToShow = blankValuesToShow?.find(b => b.symbol === symbol)?.value ?? symbol;
               } else { // In active state, show the blank symbol
                   valueToShow = symbol;
               }

               const isActualSymbol = valueToShow === '?' || valueToShow === '□';

               parts.push({
                   symbol: symbol,
                   value: valueToShow, // This could be the correct value or the symbol itself
               });

               lastIndex = blankRegex.lastIndex;
           }

           // Add any remaining text after the last blank
           if (lastIndex < displayString.length) {
               parts.push(displayString.substring(lastIndex));
           }

            // Render the parts, correctly handling the multiplication symbol
            return (
                <>
                    {parts.map((part, index) => {
                        if (typeof part === 'string') {
                             // Split by the multiplication symbol to add spacing/styling
                             const stringParts = part.split('×').reduce((acc, current, i, arr) => {
                                if (i > 0) acc.push(<span key={`op-${i}`} className="mx-0.5">{opSymbol}</span>);
                                acc.push(<span key={`str-${i}`}>{current}</span>);
                                return acc;
                             }, [] as React.ReactNode[]);
                            return <React.Fragment key={index}>{stringParts}</React.Fragment>;

                        } else {
                             const isBlankToHighlight = highlightBlanks && (part.symbol === '?' || part.symbol === '□');
                             const content = String(part.value); // Ensure it's a string for display comparison
                             const isPlaceholder = content === '?' || content === '□';

                              return (
                                  <span key={index} className={`inline-block text-center font-semibold mx-px ${
                                      isBlankToHighlight && isPlaceholder
                                          ? 'text-indigo-600 dark:text-indigo-400 underline decoration-dotted underline-offset-2 px-0.5' // Highlight active input symbol
                                          : !isPlaceholder
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
       const valuesToShow = problemState === 'active' ? null : problem.correctBlankValues; // Show correct values if not active

      return (
        <>
          <span className={problem.level >= 3 ? 'font-mono' : ''}>
              {renderSide(problem.displayLeft, valuesToShow, highlightBlanks)}
          </span>
          <span className="mx-1.5 text-gray-500 dark:text-gray-400">=</span>
           <span className={problem.level >= 3 ? 'font-mono' : ''}>
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
          const opSymbol = problem.operation === '+' ? '+' : (problem.level >= 4 ? '×' : '×');


         // Helper to render equation in REVIEW mode
          const renderReviewEquationInternalHelper = (
              problem: CommutativeProblem,
              userAnswers: (number | string | null)[],
              isCorrectOverall: boolean,
              wasRevealed: boolean
          ) => {
               const renderSide = (sideString: string) => {
                   const parts: (string | { symbol: '?' | '□', userAnswer: number | string | null, correctAnswer: CommutativePart })[] = [];
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

                    // Render the parts, correctly handling the multiplication symbol
                    return (
                        <>
                            {parts.map((part, index) => {
                                if (typeof part === 'string') {
                                     // Split by the multiplication symbol to add spacing/styling
                                     const stringParts = part.split('×').reduce((acc, current, i, arr) => {
                                        if (i > 0) acc.push(<span key={`rop-${i}`} className="mx-0.5">{opSymbol}</span>);
                                        acc.push(<span key={`rstr-${i}`}>{current}</span>);
                                        return acc;
                                     }, [] as React.ReactNode[]);
                                    return <React.Fragment key={index}>{stringParts}</React.Fragment>;
                                } else {
                                    const displayValue = wasRevealed ? part.correctAnswer : (part.userAnswer ?? part.symbol);
                                     let spanClass = ""; let correctValueSpan: React.ReactNode = null;
                                     const isPlaceholder = displayValue === '?' || displayValue === '□';

                                     if (wasRevealed) { spanClass = "font-semibold text-orange-700 dark:text-orange-400";
                                     } else if (isCorrectOverall) { spanClass = "font-semibold text-green-700 dark:text-green-300";
                                     } else { // Incorrect overall, check this specific blank
                                        // Note: Need to re-check if user answer matches correct answer, handling types
                                         let userBlankAnswer: CommutativePart | null = null;
                                         if (part.symbol === '?') userBlankAnswer = userAnswers[0];
                                         else if (part.symbol === '□') userBlankAnswer = userAnswers[1];

                                         let blankWasCorrect = false;
                                          if (userBlankAnswer !== null && part.correctAnswer !== 'Error') {
                                              if (typeof part.correctAnswer === 'number' && typeof userBlankAnswer !== 'string') {
                                                   blankWasCorrect = userBlankAnswer === part.correctAnswer;
                                              } else if (typeof part.correctAnswer === 'string' && typeof userBlankAnswer === 'string') {
                                                  blankWasCorrect = userBlankAnswer.trim() === String(part.correctAnswer).trim();
                                              } else { // Compare as is if types unexpected or mismatch
                                                   blankWasCorrect = userBlankAnswer === part.correctAnswer;
                                              }
                                          }


                                         if (blankWasCorrect) {
                                             spanClass = "font-semibold text-green-700 dark:text-green-300 opacity-70"; // This blank was correct, but others wrong
                                             // For clarity in review, still show the correct answer next to it if it was wrong overall? No, that's confusing. Just mark it correct.
                                         } else {
                                              spanClass = "font-semibold line-through text-red-700 dark:text-red-400"; // This blank was incorrect
                                              correctValueSpan = <span className="ml-0.5 text-xs text-green-600 dark:text-green-400 font-semibold">({part.correctAnswer})</span>; // Show correct next to wrong
                                         }
                                     }

                                     // Ensure correct answer is displayed if revealed or if the attempt for this blank was wrong
                                    const finalDisplayValue = wasRevealed || (!isCorrectOverall && correctValueSpan) ? part.correctAnswer : displayValue;


                                    return (<span key={`r-${index}`} className="inline-flex items-center mx-px"><span className={spanClass}>{finalDisplayValue}</span>{correctValueSpan}</span>);
                                }
                            })}
                        </>
                    );
               };


               return (
                 <>
                   <span className={problem.level >= 3 ? 'font-mono' : ''}>{renderSide(problem.displayLeft)}</span>
                   <span className="mx-1.5">=</span>
                   <span className={problem.level >= 3 ? 'font-mono' : ''}>{renderSide(problem.displayRight)}</span>
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
       const renderSummaryItem = (answer: UserCommutativeAnswer, index: number) => {
            const { problem, userAnswers, isCorrect, wasRevealed, timeSpent, attemptsMade, difficultyLevel } = answer;
            const opSymbol = problem.operation === '+' ? '+' : (problem.level >= 4 ? '×' : '×');


           const renderSide = (sideString: string) => {
                   const parts: (string | { symbol: '?' | '□', userAnswer: number | string | null, correctAnswer: CommutativePart })[] = [];
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

                    // Render the parts, correctly handling the multiplication symbol
                    return (
                        <>
                            {parts.map((part, idx) => {
                                if (typeof part === 'string') {
                                     // Split by the multiplication symbol to add spacing/styling
                                     const stringParts = part.split('×').reduce((acc, current, i, arr) => {
                                        if (i > 0) acc.push(<span key={`srop-${i}`} className="mx-0.5">{opSymbol}</span>);
                                        acc.push(<span key={`srstr-${i}`}>{current}</span>);
                                        return acc;
                                     }, [] as React.ReactNode[]);
                                    return <React.Fragment key={`s-${idx}`}>{stringParts}</React.Fragment>;
                                } else {
                                    const displayValue = wasRevealed ? part.correctAnswer : (part.userAnswer ?? part.symbol);
                                     let spanClass = ""; let correctValueSpan: React.ReactNode = null;
                                     const isPlaceholder = displayValue === '?' || displayValue === '□';

                                     if (wasRevealed) { spanClass = "font-semibold text-orange-700 dark:text-orange-400";
                                     } else if (isCorrect) { spanClass = "font-semibold text-green-700 dark:text-green-300";
                                     } else {
                                          // Need to re-check if user answer matches correct answer for this blank
                                          let userBlankAnswer: CommutativePart | null = null;
                                          if (part.symbol === '?') userBlankAnswer = userAnswers[0];
                                          else if (part.symbol === '□') userBlankAnswer = userAnswers[1];

                                          let blankWasCorrect = false;
                                           if (userBlankAnswer !== null && part.correctAnswer !== 'Error') {
                                               if (typeof part.correctAnswer === 'number' && typeof userBlankAnswer !== 'string') {
                                                    blankWasCorrect = userBlankAnswer === part.correctAnswer;
                                               } else if (typeof part.correctAnswer === 'string' && typeof userBlankAnswer === 'string') {
                                                   blankWasCorrect = userBlankAnswer.trim() === String(part.correctAnswer).trim();
                                               } else {
                                                    blankWasCorrect = userBlankAnswer === part.correctAnswer;
                                               }
                                           }

                                          if (blankWasCorrect) {
                                              spanClass = "font-semibold text-green-700 dark:text-green-300 opacity-70";
                                          } else {
                                               spanClass = "font-semibold line-through text-red-700 dark:text-red-400";
                                               correctValueSpan = <span className="ml-0.5 text-xs text-green-600 dark:text-green-400 font-semibold">({part.correctAnswer})</span>;
                                          }
                                     }

                                     const finalDisplayValue = wasRevealed || (!isCorrect && correctValueSpan) ? part.correctAnswer : displayValue;


                                    return (<span key={`s-${idx}`} className="inline-flex items-center mx-px"><span className={spanClass}>{finalDisplayValue}</span>{correctValueSpan}</span>);
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
                     <span className={problem.level >= 3 ? 'font-mono' : ''}>{renderSide(problem.displayLeft)}</span>
                     <span className="mx-1">=</span>
                     <span className={problem.level >= 3 ? 'font-mono' : ''}>{renderSide(problem.displayRight)}</span>
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

      return ( <div className="max-w-lg mx-auto text-center p-4"> <h2 className="text-2xl font-bold mb-4">Commutative Property Exercise Complete!</h2> <div className="bg-indigo-50 dark:bg-gray-900/50 p-6 rounded-lg mb-6 ring-1 ring-inset ring-indigo-100 dark:ring-gray-700"> <div className="grid grid-cols-2 gap-4"> {/* ... Stats divs (reused) ... */} <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Score</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{correctCount} / {finalProblemCount}</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Accuracy</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{accuracy.toFixed(1)}%</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Avg. Time</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{avgTime.toFixed(1)}s</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Avg. Attempts</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{avgAttempts.toFixed(1)}</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Blanks Revealed</p><p className="text-xl font-bold text-orange-600 dark:text-orange-400">{revealedCount}</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Final Level</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{finalDifficulty}</p></div> {userSettingsInternal.enableCompensation && finalProblemCount > userSettingsInternal.problemCount && ( <div className="col-span-2 bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md text-sm text-yellow-800 dark:text-yellow-200"> {finalProblemCount - userSettingsInternal.problemCount} extra problem(s) added due to compensation. </div> )} </div> </div> <div className="mb-6"> <h3 className="text-xl font-semibold mb-3">Problem Review</h3> <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800/50"> {userAnswersHistory.map((answer, index) => renderSummaryItem(answer, index))} </div> </div> <button onClick={restartExercise} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"> Start New Exercise </button> </div> );
  }


  // --- Exercise in Progress UI (adapted) ---
  const currentProblemData = isReviewMode ? userAnswersHistory[reviewIndex]?.problem : currentProblem;
  const isLevel3Plus = currentProblemData ? currentProblemData.level >= 3 : false; // Use monospace/text input for L3+

  return (
    <div className="max-w-md mx-auto p-4 relative min-h-[32rem]">

      {/* Review Mode Overlay (Uses adapted helper) */}
      {isReviewMode && renderReviewScreen()}

      {/* Active Exercise Screen */}
      <AnimatePresence>
       {!isReviewMode && currentProblemData && (
           <motion.div key={`${currentIndex}-${problemDisplayState}-${currentProblemData?.level}-${currentProblemData?.pattern}`} // Key includes relevant state for animation
            initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
                    {userSettingsInternal.adaptiveDifficulty && (<div className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">Streak: {consecutiveCorrectAnswers}/{CORRECT_STREAK_THRESHOLD_COMM}</div>)}
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
                           {problemDisplayState === 'active' && `Find the value${currentProblemData.pattern === 'two_blanks' ? 's' : ''} for ${currentProblemData.pattern === 'two_blanks' ? '? and □' : '?'} that satisfy the property.`}
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
                                <div className={`grid ${currentProblemData.pattern === 'two_blanks' ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                                    {/* Input 1 (?) - Always present */}
                                     <div>
                                        <label htmlFor="input1" className="sr-only">Value for ?</label>
                                         <input
                                            ref={input1Ref}
                                            id="input1"
                                            type={isLevel3Plus ? "text" : "number"} // Text for L3+, Number for L1-2
                                            inputMode={isLevel3Plus ? "text" : "numeric"}
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

                                    {/* Input 2 (□) - Only if two blanks needed */}
                                    {currentProblemData.pattern === 'two_blanks' && (
                                        <div>
                                            <label htmlFor="input2" className="sr-only">Value for □</label>
                                            <input
                                                ref={input2Ref}
                                                id="input2"
                                                type={isLevel3Plus ? "text" : "number"} // Text for L3+, Number for L1-2
                                                inputMode={isLevel3Plus ? "text" : "numeric"}
                                                value={inputValue2}
                                                onChange={(e) => setInputValue2(e.target.value)}
                                                placeholder="□"
                                                aria-label="Enter value for □"
                                                aria-invalid={!!error2}
                                                aria-describedby={error2 ? "input2-error" : undefined}
                                                className={`w-full px-4 py-3 text-lg sm:text-xl text-center rounded-md border ${ error2 ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500' } focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 dark:disabled:opacity-60`}
                                                required // Required if two blanks
                                                disabled={isSubmitting.current}
                                            />
                                            {error2 && (<p id="input2-error" className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">{error2}</p>)}
                                        </div>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <button type="submit" className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50"
                                    // Disable if submitting, or if required inputs are empty
                                    disabled={isSubmitting.current || !inputValue1.trim() || (currentProblemData.pattern === 'two_blanks' && !inputValue2.trim()) }
                                >
                                    {isSubmitting.current ? 'Checking...' : 'Submit Answer'}
                                </button>
                            </form>
                             {/* Show Answer Button */}
                            {!isAnswerRevealed && (
                                <button onClick={handleShowAnswer} className="mt-3 w-full px-6 py-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 dark:focus:ring-offset-gray-800 disabled:opacity-50" disabled={isSubmitting.current}>
                                   Show Correct Value{currentProblemData.pattern === 'two_blanks' ? 's' : ''}
                                </button>
                            )}
                        </>
                    ) : (
                        // Continue/Hold Button (reused)
                        <div className="mt-8"> <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} onClick={handleContinue} onMouseDown={handleHoldPress} onMouseUp={handleHoldRelease} onTouchStart={handleHoldPress} onTouchEnd={handleHoldRelease} className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 relative overflow-hidden" > <span className="relative z-0"> {isAutoContinueEnabled ? "Hold to Pause" : (currentIndex < targetProblemCount - 1 ? 'Continue' : 'Show Results')} </span> {/* Checkbox Auto Continue */} <div className="absolute bottom-0 right-0 mb-1 mr-1 flex items-center z-10 group" onClick={handleCheckboxAreaClick}> <AnimatePresence>{showAutoContinueTooltip && (<motion.div initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute bottom-full right-0 mb-1 p-1.5 bg-gray-900 text-white text-xs rounded shadow-lg w-max max-w-[180px] pointer-events-none" role="tooltip" id="auto-continue-tooltip">Auto-proceeds after {AUTO_CONTINUE_DELAY_COMM/1000}s</motion.div>)}</AnimatePresence> <label htmlFor="auto-continue-checkbox" className="flex items-center px-1.5 py-0.5 bg-white/80 dark:bg-black/50 rounded cursor-pointer hover:bg-white dark:hover:bg-black/70 backdrop-blur-sm transition-colors"> <input type="checkbox" id="auto-continue-checkbox" checked={isAutoContinueEnabled} onChange={handleAutoContinueChange} className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-1 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-600 dark:ring-offset-gray-800" aria-describedby={showAutoContinueTooltip ? "auto-continue-tooltip" : undefined}/><span className="text-xs font-medium text-gray-700 dark:text-gray-200 select-none">Auto</span> </label> </div> </motion.button> </div>
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