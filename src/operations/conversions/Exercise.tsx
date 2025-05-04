import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Eye, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

// Types
type ConversionType = 'fraction' | 'decimal' | 'percent' | 'ratio';

interface ConversionProblem {
  value: string;
  type: ConversionType;
  answers: Record<ConversionType, string>;
}

interface Settings {
  problemCount: number;
  timeLimit: number;
  maxAttempts: number;
  adaptiveDifficulty: boolean;
  enableCompensation: boolean;
  difficultyLevel: number; // Added difficulty level
}

interface UserAnswer {
  problem: ConversionProblem;
  userAnswers: Record<ConversionType, string>;
  isCorrect: boolean;
  wasRevealed: boolean;
  timeSpent: number;
  attemptsMade: number;
}

// Constants
const DEFAULT_SETTINGS: Settings = {
  problemCount: 10,
  timeLimit: 0,
  maxAttempts: 3,
  adaptiveDifficulty: false, // Note: Adaptive difficulty logic is not implemented in generateProblem yet
  enableCompensation: false,
  difficultyLevel: 3, // Default difficulty level
};

const AUTO_CONTINUE_DELAY = 1500;
const TOOLTIP_DISPLAY_TIME = 3000;

// --- Updated Difficulty Examples ---
const DIFFICULTY_LEVELS = {
  1: {
    description: "Very basic conversions (halves, quarters, fifths, tenths)",
    // Examples reflecting the new Level 1 generation logic
    examples: ["1/2", "0.5", "50%", "1:4", "25%"]
  },
  2: {
    description: "Basic fractions and decimals up to hundredths", // Adjusted description
    examples: ["3/4", "1.20", "65%", "3:2", "7/10"] // Slightly adjusted examples
  },
  3: {
    description: "Varied fractions, decimals, and basic percent decimals", // Adjusted description
    examples: ["7/5", "0.85", "150.5%", "5:8", "11/4"] // Slightly adjusted examples
  },
  4: {
    description: "More complex fractions, multi-digit decimals/percents", // Adjusted description
    examples: ["13/8", "2.375", "45.5%", "11:6", "9/15"]
  },
  5: {
    description: "Complex fractions & conversions, higher precision", // Adjusted description
    examples: ["17/12", "3.125", "287.5%", "15:7", "21/16"]
  }
};


// Utility Functions
function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function simplifyFraction(numerator: number, denominator: number): [number, number] {
  if (denominator === 0) {
      console.error("Denominator cannot be zero in simplifyFraction");
      return [numerator, denominator]; // Or throw an error
  }
  const divisor = gcd(Math.abs(numerator), Math.abs(denominator));
  const num = numerator / divisor;
  const den = denominator / divisor;
  // Ensure denominator is positive if numerator is not zero
  if (den < 0 && num !== 0) {
      return [-num, -den];
  }
  return [num, den];
}


// --- Revised generateProblem function with improved Level 1 ---
function generateProblem(difficultyLevel: number = 3): ConversionProblem {
  const types: ConversionType[] = ['fraction', 'decimal', 'percent', 'ratio'];
  let type = types[Math.floor(Math.random() * types.length)];

  let value: string, decimal: number;

  // --- LEVEL 1 Special Logic ---
  if (difficultyLevel === 1) {
      // Define very simple, common conversion pairs for Level 1
      const simpleConversions = [
          { f: '1/2', d: 0.5, p: '50%', r: '1:2' },
          { f: '1/4', d: 0.25, p: '25%', r: '1:4' },
          { f: '3/4', d: 0.75, p: '75%', r: '3:4' },
          { f: '1/5', d: 0.2, p: '20%', r: '1:5' },
          { f: '2/5', d: 0.4, p: '40%', r: '2:5' },
          { f: '3/5', d: 0.6, p: '60%', r: '3:5' },
          { f: '4/5', d: 0.8, p: '80%', r: '4:5' },
          { f: '1/1', d: 1.0, p: '100%', r: '1:1' }, // Whole number
          { f: '1/10', d: 0.1, p: '10%', r: '1:10' }, // Basic tenth
          { f: '3/10', d: 0.3, p: '30%', r: '3:10' },
      ];

      const chosenConversion = simpleConversions[Math.floor(Math.random() * simpleConversions.length)];

      // Randomly pick which type to present as the problem
      const typeKeys: ConversionType[] = ['fraction', 'decimal', 'percent', 'ratio'];
      type = typeKeys[Math.floor(Math.random() * typeKeys.length)]; // Overwrite the initially chosen type

      // Assign the value and the consistent decimal value
      switch(type) {
          case 'fraction':
              value = chosenConversion.f;
              break;
          case 'decimal':
              // Ensure correct formatting for decimals (0.5 vs 0.25)
              value = chosenConversion.d.toFixed(chosenConversion.d === 1 ? 0 : (chosenConversion.d * 10) % 1 === 0 ? 1 : 2);
              break;
          case 'percent':
              value = chosenConversion.p;
              break;
          case 'ratio':
              value = chosenConversion.r;
              break;
           default: // Fallback if type is somehow invalid
               value = chosenConversion.f;
               type = 'fraction';
      }
      decimal = chosenConversion.d; // Use the precise decimal for internal calculations

      // Prepare all answers based on the chosen simple conversion
       const answers: Record<ConversionType, string> = {
          fraction: chosenConversion.f,
          // Format decimal answer correctly
          decimal: chosenConversion.d.toFixed(chosenConversion.d === 1 ? 0 : (chosenConversion.d * 10) % 1 === 0 ? 1 : 2),
          percent: chosenConversion.p,
          ratio: chosenConversion.r
      };

      return { value, type, answers };

  }
  // --- END OF LEVEL 1 Special Logic ---


  // --- Logic for Levels 2-5 (Keep the previous logic, maybe adjust ranges slightly if needed) ---
  let maxDenominator: number, maxNumeratorMultiplier: number, maxDecimalMultiplier: number, maxRatio: number;
  let decimalPrecision: number = 2; // Default decimal places
  let percentPrecision: number = 0; // Default percent decimal places

  switch (difficultyLevel) {
    // Note: Level 1 is handled above
    case 2:
      maxDenominator = 10; maxNumeratorMultiplier = 1.5; maxDecimalMultiplier = 150; maxRatio = 9;
      percentPrecision = 0; decimalPrecision = 2;
      break;
    case 3:
      maxDenominator = 12; maxNumeratorMultiplier = 2; maxDecimalMultiplier = 200; maxRatio = 10;
      percentPrecision = 1; decimalPrecision = 2; // Allow one decimal for percent
      break;
    case 4:
      maxDenominator = 15; maxNumeratorMultiplier = 2.5; maxDecimalMultiplier = 300; maxRatio = 15;
      percentPrecision = 1; decimalPrecision = 3; // Allow three decimals
      break;
    case 5:
      maxDenominator = 20; maxNumeratorMultiplier = 3; maxDecimalMultiplier = 500; maxRatio = 20;
      percentPrecision = 1; decimalPrecision = 3;
      break;
    default: // Fallback to level 3 if difficultyLevel is unexpected
      maxDenominator = 12; maxNumeratorMultiplier = 2; maxDecimalMultiplier = 200; maxRatio = 10;
      percentPrecision = 1; decimalPrecision = 2;
  }

  // Generation logic for levels 2-5 (similar to before)
  switch (type) {
    case 'fraction':
        const denominator = getRandomInt(2, maxDenominator);
        const numerator = getRandomInt(1, Math.max(denominator + 1, Math.floor(denominator * maxNumeratorMultiplier)));
        const [simpNum, simpDen] = simplifyFraction(numerator, denominator);
        value = `${simpNum}/${simpDen}`;
        decimal = simpNum / simpDen;
        break;
    case 'decimal':
        decimal = getRandomInt(1, maxDecimalMultiplier) / 100;
        value = decimal.toFixed(decimalPrecision);
        decimal = parseFloat(value); // Recalculate decimal from rounded value
        break;
    case 'percent':
        decimal = getRandomInt(1, maxDecimalMultiplier) / 100;
        value = `${(decimal * 100).toFixed(percentPrecision)}%`;
        decimal = parseFloat(value.replace('%','')) / 100; // Recalculate
        break;
    case 'ratio':
        let r1 = getRandomInt(1, maxRatio);
        let r2 = getRandomInt(1, maxRatio);
         // Avoid trivial or identical ratios if possible at higher levels
         if (r1 === r2 && difficultyLevel > 1) {
             r1 = getRandomInt(1, maxRatio); // Try again
             if (r1 === r2 && r1 > 0) r1 = (r1 % maxRatio) + 1; // Force difference if still same, handle edge case maxRatio=1
             else if (r1 === r2) r1 +=1; // Handle case where maxRatio might be 1 or numbers are 0
         }
         if (r2 === 0) r2 = 1; // Ensure denominator is not zero
        const [sR1, sR2] = simplifyFraction(r1, r2);
        value = `${sR1}:${sR2}`;
        decimal = r1 / r2; // Use original for calculation
        break;
    default: // Should not happen
        decimal = 0.5; value = "1/2"; type = 'fraction';
  }


  // Calculate all equivalent forms for levels 2-5
  const percent = (decimal * 100).toFixed(percentPrecision) + '%';
  const decimalStr = decimal.toFixed(decimalPrecision);

  // Convert to fraction
  let fractionStr;
  if (Math.abs(decimal) < 1e-9) {
    fractionStr = '0/1';
  } else {
    const effectivePrecision = Math.pow(10, decimalPrecision);
    const num = Math.round(decimal * effectivePrecision);
    const den = effectivePrecision;
    const [simpNum, simpDen] = simplifyFraction(num, den);
    fractionStr = `${simpNum}/${simpDen}`;
  }

  // Convert to ratio
  let ratioStr;
  if (Math.abs(decimal) < 1e-9) {
    ratioStr = '0:1';
  } else {
    const effectivePrecision = Math.pow(10, decimalPrecision); // Use same precision
    const [ratioNum, ratioDen] = simplifyFraction(Math.round(decimal * effectivePrecision), effectivePrecision);
     ratioStr = `${ratioNum}:${ratioDen}`;
  }

  // Final answers object for levels 2-5
  const answersLvl2_5: Record<ConversionType, string> = {
      fraction: fractionStr,
      decimal: decimalStr,
      percent: percent,
      ratio: ratioStr
  };
  answersLvl2_5[type] = value; // Ensure the generated value matches the specific type key

  return { value, type, answers: answersLvl2_5 };
}


// Settings Component
export const ConversionsSettings = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    try {
        const saved = localStorage.getItem('conversions_settings');
        // Ensure default difficulty is applied if missing from saved settings
        const parsed = saved ? JSON.parse(saved) : {};
        const initialSettings = { ...DEFAULT_SETTINGS, ...parsed };
        // Validate loaded settings values
        initialSettings.problemCount = Math.max(1, parseInt(String(initialSettings.problemCount), 10) || DEFAULT_SETTINGS.problemCount);
        initialSettings.maxAttempts = Math.max(0, parseInt(String(initialSettings.maxAttempts), 10)); // 0 is valid
        initialSettings.timeLimit = Math.max(0, parseInt(String(initialSettings.timeLimit), 10)); // 0 is valid
        initialSettings.difficultyLevel = Math.min(5, Math.max(1, parseInt(String(initialSettings.difficultyLevel), 10) || DEFAULT_SETTINGS.difficultyLevel));
        initialSettings.adaptiveDifficulty = Boolean(initialSettings.adaptiveDifficulty);
        initialSettings.enableCompensation = Boolean(initialSettings.enableCompensation);

        return initialSettings;
    } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
        return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem('conversions_settings', JSON.stringify(settings));
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setSettings(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'range') { // Handle range input specifically
       setSettings(prev => ({ ...prev, [name]: parseInt(value, 10) }));
    } else { // Handle number inputs
      const numValue = parseInt(value, 10);

      if (name === 'problemCount') {
        const validValue = isNaN(numValue) || numValue <= 0 ? 1 : Math.min(numValue, 100); // Added max limit
        setSettings(prev => ({ ...prev, [name]: validValue }));
      } else if (name === 'maxAttempts' || name === 'timeLimit') {
        const validValue = isNaN(numValue) || numValue < 0 ? 0 : Math.min(numValue, 120); // Added max limit for time
        setSettings(prev => ({ ...prev, [name]: validValue }));
      }
       // Add other specific handlers if needed
    }
  };

  // Get current difficulty description
  const currentDifficultyDescription = DIFFICULTY_LEVELS[settings.difficultyLevel]?.description || '';

  return (
    <div className="max-w-2xl mx-auto p-4"> {/* Increased max-width for examples */}
      <h2 className="text-2xl font-bold mb-6 text-center">Number Conversions Settings</h2>
      <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">

        {/* --- Difficulty Level Slider --- */}
        <div>
          <label htmlFor="difficultyLevel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Initial Difficulty Level ({settings.difficultyLevel})
          </label>
          <input
            type="range"
            id="difficultyLevel"
            name="difficultyLevel"
            min="1"
            max="5"
            step="1"
            value={settings.difficultyLevel}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-indigo-600 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-indigo-600"
          />
           <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center italic">
            {currentDifficultyDescription}
          </p>
        </div>

        {/* --- Other Settings (Problem Count, Attempts, Time Limit) --- */}
        <div>
          <label htmlFor="problemCount" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Number of Problems
          </label>
          <input
            type="number"
            id="problemCount"
            name="problemCount"
            min="1"
            max="100"
            value={settings.problemCount}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="maxAttempts" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max Attempts per Problem (0 for unlimited)
          </label>
          <input
            type="number"
            id="maxAttempts"
            name="maxAttempts"
            min="0"
            value={settings.maxAttempts}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label htmlFor="timeLimit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Time Limit (seconds per problem, 0 for no limit)
          </label>
          <input
            type="number"
            id="timeLimit"
            name="timeLimit"
            min="0"
            max="120"
            value={settings.timeLimit}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        {/* --- Checkboxes (Adaptive Difficulty, Compensation) --- */}
         <div className="flex items-center">
          <input
            type="checkbox"
            id="adaptiveDifficulty"
            name="adaptiveDifficulty"
            checked={settings.adaptiveDifficulty}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-600 dark:ring-offset-gray-800"
          />
          <label htmlFor="adaptiveDifficulty" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Enable Adaptive Difficulty
            <span className="text-xs italic ml-1">(Note: Currently does not change problem generation logic dynamically during the exercise)</span>
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableCompensation"
            name="enableCompensation"
            checked={settings.enableCompensation}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-600 dark:ring-offset-gray-800"
          />
          <label htmlFor="enableCompensation" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Enable Compensation (Add 1 problem for each incorrect/revealed)
          </label>
        </div>

        {/* --- Difficulty Examples --- */}
        <div className="pt-4 border-t dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3 text-center">
                Difficulty Examples
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
                {[1, 3, 5].map(level => { // Display levels 1, 3, and 5 like the image
                    const isSelected = level === settings.difficultyLevel;
                    return (
                        <div
                            key={level}
                            className={`p-3 border rounded-lg transition-all duration-200 ${
                                isSelected
                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-300 dark:ring-indigo-700 scale-105'
                                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50'
                            }`}
                        >
                            <p className={`font-semibold mb-2 text-gray-800 dark:text-gray-100 ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>
                                Level {level} {isSelected ? '(Initial)' : ''}
                            </p>
                            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                {DIFFICULTY_LEVELS[level]?.examples.map((ex, index) => (
                                    <p key={index} className="font-mono text-xs sm:text-sm">{ex}</p>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

      </div>
    </div>
  );
};


// Exercise Component
export const ConversionsExercise = () => {
  // States
  const [settings, setSettings] = useState<Settings>(() => {
     try {
        const saved = localStorage.getItem('conversions_settings');
        const parsed = saved ? JSON.parse(saved) : {};
        const initialSettings = { ...DEFAULT_SETTINGS, ...parsed };
        // Validate loaded settings values
        initialSettings.problemCount = Math.max(1, parseInt(String(initialSettings.problemCount), 10) || DEFAULT_SETTINGS.problemCount);
        initialSettings.maxAttempts = Math.max(0, parseInt(String(initialSettings.maxAttempts), 10)); // 0 is valid
        initialSettings.timeLimit = Math.max(0, parseInt(String(initialSettings.timeLimit), 10)); // 0 is valid
        initialSettings.difficultyLevel = Math.min(5, Math.max(1, parseInt(String(initialSettings.difficultyLevel), 10) || DEFAULT_SETTINGS.difficultyLevel));
        initialSettings.adaptiveDifficulty = Boolean(initialSettings.adaptiveDifficulty);
        initialSettings.enableCompensation = Boolean(initialSettings.enableCompensation);
        return initialSettings;
     } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
        return DEFAULT_SETTINGS;
     }
  });

  const [currentProblem, setCurrentProblem] = useState<ConversionProblem | null>(null);
  const [userAnswersHistory, setUserAnswersHistory] = useState<UserAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValues, setInputValues] = useState<Record<ConversionType, string>>({
    fraction: '',
    decimal: '',
    percent: '',
    ratio: ''
  });

  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isAutoContinueEnabled, setIsAutoContinueEnabled] = useState(false);
  const [showAutoContinueTooltip, setShowAutoContinueTooltip] = useState(false);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [problemStartTime, setProblemStartTime] = useState(0);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [targetProblemCount, setTargetProblemCount] = useState(settings.problemCount);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [problemCache, setProblemCache] = useState<ConversionProblem[]>([]);

  // Refs
  const isSubmitting = useRef(false);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRefs = {
    fraction: useRef<HTMLInputElement>(null),
    decimal: useRef<HTMLInputElement>(null),
    percent: useRef<HTMLInputElement>(null),
    ratio: useRef<HTMLInputElement>(null),
  };

  // Helper Functions
  const resetProblemState = (problem: ConversionProblem) => {
    setCurrentProblem(problem);
    const initialInputs: Record<ConversionType, string> = { fraction: '', decimal: '', percent: '', ratio: '' };
    initialInputs[problem.type] = problem.value; // Set the given value
    setInputValues(initialInputs);
    setProblemStartTime(Date.now());
    setFeedback(null);
    setError('');
    setCurrentAttempts(0);
    setShowContinueButton(false);
    setIsAnswerRevealed(false);
    isSubmitting.current = false;
  };

  const normalizeAnswer = (answer: string, type: ConversionType): string => {
    let normalized = answer.trim().replace(/\s/g, '');

    try {
      switch (type) {
        case 'fraction':
          if (!normalized.includes('/')) return normalized; // Keep invalid format as is
          const [numStr, denStr] = normalized.split('/');
          const num = parseInt(numStr);
          const den = parseInt(denStr);
          if (isNaN(num) || isNaN(den) || den === 0) return normalized; // Keep invalid as is
          const [sNum, sDen] = simplifyFraction(num, den);
          return `${sNum}/${sDen}`;

        case 'decimal':
          const floatValDec = parseFloat(normalized);
          if (isNaN(floatValDec)) return normalized;
           // Normalize based on problem's expected precision (or default if problem context unavailable)
          const correctDecimal = currentProblem?.answers?.decimal;
          const precision = correctDecimal ? (correctDecimal.split('.')[1] || '').length : (settings.difficultyLevel > 3 ? 3 : 2);
          return floatValDec.toFixed(precision);

        case 'percent':
          const percentVal = normalized.replace('%', '');
          const floatValPer = parseFloat(percentVal);
          if (isNaN(floatValPer)) return normalized;
          // Normalize based on problem's expected precision (or default if problem context unavailable)
          const correctPercent = currentProblem?.answers?.percent;
           // Handle cases like "50%" having 0 decimal places in the value itself
          const correctPercentValue = correctPercent ? correctPercent.replace('%', '') : '';
          const precisionPercent = correctPercentValue ? (correctPercentValue.split('.')[1] || '').length : (settings.difficultyLevel > 2 ? 1 : 0);
          return floatValPer.toFixed(precisionPercent) + '%';

        case 'ratio':
          if (!normalized.includes(':')) return normalized;
          const [r1Str, r2Str] = normalized.split(':');
          const r1 = parseInt(r1Str);
          const r2 = parseInt(r2Str);
          if (isNaN(r1) || isNaN(r2) || r2 === 0) return normalized;
          const [sR1, sR2] = simplifyFraction(r1, r2);
          return `${sR1}:${sR2}`;

        default:
          return normalized;
      }
    } catch (error) {
      console.error("Error normalizing answer:", error);
      return normalized; // Return original if error occurs
    }
  };


  const validateAnswers = (): { allCorrect: boolean; incorrectFields: ConversionType[] } => {
    if (!currentProblem) return { allCorrect: false, incorrectFields: [] };

    const correctAnswers = currentProblem.answers;
    let isCorrect = true;
    const incorrectFields: ConversionType[] = [];
    const types: ConversionType[] = ['fraction', 'decimal', 'percent', 'ratio'];

    for (const type of types) {
      if (type === currentProblem.type) continue; // Skip the given type

      const userAnswer = inputValues[type];
      const correctAnswer = correctAnswers[type];

      if (!userAnswer || userAnswer.trim() === '') {
        isCorrect = false;
        incorrectFields.push(type);
        continue;
      }

      const normalizedUserAnswer = normalizeAnswer(userAnswer, type);
      const normalizedCorrectAnswer = normalizeAnswer(correctAnswer, type); // Also normalize correct answer for consistent comparison

      // Debugging log
      // console.log(`Type: ${type}, User: '${userAnswer}' -> '${normalizedUserAnswer}', Correct: '${correctAnswer}' -> '${normalizedCorrectAnswer}'`);

      if (normalizedUserAnswer !== normalizedCorrectAnswer) {
        isCorrect = false;
        incorrectFields.push(type);
      }
    }

    return { allCorrect: isCorrect, incorrectFields };
  };


  const emitProgress = (data: { correct: boolean; timeSpent: number; attempts: number; revealed: boolean }) => {
    const event = new CustomEvent('operationProgress', {
      detail: { operationType: 'conversion', ...data }
    });
    window.dispatchEvent(event);
  };

  const triggerContinuation = () => {
    if (isAutoContinueEnabled && !isReviewMode) {
       // Auto-continue will handle it via useEffect
      setShowContinueButton(true); // Still show button briefly while timer runs
    } else {
      setShowContinueButton(true);
    }
  };

  // Initialize/Restart Exercise
  useEffect(() => {
    console.log("Initializing exercise with settings:", settings);
    // Generate problems using the CURRENT difficulty level from settings
    const generateCache = (size: number) => Array(size).fill(null).map(() => generateProblem(settings.difficultyLevel)); // Pass difficulty here
    const cacheSize = Math.max(20, settings.problemCount);
    const newCache = generateCache(cacheSize);

    setProblemCache(newCache);
    if (newCache.length > 0) {
      resetProblemState(newCache[0]);
    } else {
        setCurrentProblem(null); // Handle case where cache is empty
    }
    setCurrentIndex(0);
    setUserAnswersHistory([]);
    setTargetProblemCount(settings.problemCount); // Reset target count
    setIsComplete(false);
    setIsReviewMode(false);
    setReviewIndex(0);

    // Clear timers
    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    autoContinueTimerRef.current = null;
    tooltipTimerRef.current = null;

  }, [settings]); // Re-run when settings (including difficulty) change


  // Clean up timers
  useEffect(() => {
    return () => {
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);


  // Focus input field
  useEffect(() => {
    if (!isReviewMode && !isComplete && currentProblem && !showContinueButton && !autoContinueTimerRef.current && feedback === null) {
        const firstEditableField = (['fraction', 'decimal', 'percent', 'ratio'] as ConversionType[])
            .find(t => t !== currentProblem.type);

        if (firstEditableField && inputRefs[firstEditableField]?.current) {
            const focusTimeout = setTimeout(() => {
            try {
                inputRefs[firstEditableField].current?.focus();
                // console.log(`Focusing on ${firstEditableField}`);
            } catch (e) {
                console.error("Error focusing:", e);
            }
            }, 150); // Slightly increased delay might help

            return () => clearTimeout(focusTimeout);
        }
    }
}, [currentIndex, showContinueButton, isComplete, currentProblem, isReviewMode, feedback]); // Added feedback dependency


  // Define handleContinue function
  const handleContinue = () => {
    if (autoContinueTimerRef.current) {
      clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = null;
    }

    if (currentIndex >= targetProblemCount - 1) {
      setIsComplete(true);
      return;
    }

    const nextProblemIndex = currentIndex + 1;
    let nextProblem: ConversionProblem;

    if (nextProblemIndex < problemCache.length) {
      nextProblem = problemCache[nextProblemIndex];
    } else {
      // Generate new problem with current difficulty if cache runs out
      console.log("Generating new problem on the fly, difficulty:", settings.difficultyLevel);
      nextProblem = generateProblem(settings.difficultyLevel); // Pass difficulty here
      setProblemCache(cache => [...cache, nextProblem]);
    }

    setCurrentIndex(nextProblemIndex);
    resetProblemState(nextProblem);
  };


  // Auto-continue logic
  useEffect(() => {
    if (feedback?.correct && isAutoContinueEnabled && !isReviewMode && !isComplete) { // Only auto-continue on correct answers
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);

      autoContinueTimerRef.current = setTimeout(() => {
         if (!isReviewMode && !isComplete) { // Double check state before continuing
            handleContinue();
         }
      }, AUTO_CONTINUE_DELAY);
    }

    // Cleanup function to clear timer if conditions change
    return () => {
      if (autoContinueTimerRef.current) {
          clearTimeout(autoContinueTimerRef.current);
          autoContinueTimerRef.current = null;
      }
    };
  }, [feedback, isAutoContinueEnabled, isReviewMode, isComplete]); // Dependencies


  // Handlers
  const handleInputChange = (type: ConversionType, value: string) => {
    setInputValues(prev => ({ ...prev, [type]: value }));
    setError('');
    // Clear feedback immediately on input change if it wasn't a correct final answer
    if (feedback && !feedback.correct) {
        setFeedback(null);
    }
    // Or clear feedback if it *was* correct, but user changes input
    if (feedback?.correct && !showContinueButton) {
         setFeedback(null);
    }
  };


  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    if (isAnswerRevealed || showContinueButton || isSubmitting.current || !currentProblem) return;

    isSubmitting.current = true;
    setError('');
    setFeedback(null); // Clear previous feedback

    const validationResult = validateAnswers();
    const timeSpent = (Date.now() - problemStartTime) / 1000;
    const attemptsSoFar = currentAttempts + 1;

    if (validationResult.allCorrect) {
      setFeedback({
        correct: true,
        message: `Correct! (${attemptsSoFar} ${attemptsSoFar === 1 ? 'attempt' : 'attempts'})`
      });

      setUserAnswersHistory(prev => [...prev, {
        problem: currentProblem,
        userAnswers: { ...inputValues },
        isCorrect: true,
        wasRevealed: false,
        timeSpent,
        attemptsMade: attemptsSoFar
      }]);

      emitProgress({
        correct: true,
        timeSpent,
        attempts: attemptsSoFar,
        revealed: false
      });

      // setShowContinueButton(true); // Let triggerContinuation handle this
      triggerContinuation(); // Check if auto-continue should start timer
      isSubmitting.current = false; // Allow continue button to work

    } else { // Incorrect Answer
      const hasAttemptsLeft = settings.maxAttempts === 0 || attemptsSoFar < settings.maxAttempts;

      if (hasAttemptsLeft) {
        setCurrentAttempts(attemptsSoFar);
        const attemptsRemaining = settings.maxAttempts === 0 ? 'Unlimited' : settings.maxAttempts - attemptsSoFar;

        setFeedback({
          correct: false,
          message: `Incorrect. Try again! (Attempts left: ${attemptsRemaining})`
        });

         if (validationResult.incorrectFields.length > 0) {
            setError(`Check: ${validationResult.incorrectFields.join(', ')}`);
            // Focus on the first incorrect field
            const firstIncorrect = validationResult.incorrectFields[0];
             setTimeout(() => { // Timeout needed to allow state update before focus
                 if (inputRefs[firstIncorrect]?.current) {
                    inputRefs[firstIncorrect].current?.focus();
                    inputRefs[firstIncorrect].current?.select();
                 }
             }, 50);
        }

        isSubmitting.current = false; // Allow another attempt

      } else { // No attempts left
        setFeedback({
          correct: false,
          message: 'Incorrect. No attempts left. Correct answers shown.'
        });

        setUserAnswersHistory(prev => [...prev, {
          problem: currentProblem,
          userAnswers: { ...inputValues },
          isCorrect: false,
          wasRevealed: false, // Not revealed by user action
          timeSpent,
          attemptsMade: attemptsSoFar
        }]);

        emitProgress({
          correct: false,
          timeSpent,
          attempts: attemptsSoFar,
          revealed: false
        });

        if (settings.enableCompensation) {
          setTargetProblemCount(prev => prev + 1);
          toast.info("Incorrect answer, adding one more problem.", { duration: 2000 });
        }

        // Show correct answers in the inputs
        const correctInputs = { ...currentProblem.answers };
        correctInputs[currentProblem.type] = currentProblem.value; // Ensure given value is present
        setInputValues(correctInputs);

        setIsAnswerRevealed(true); // Mark as effectively revealed
        // setShowContinueButton(true); // Let triggerContinuation handle this
        triggerContinuation(); // Check if auto-continue should run (it shouldn't on incorrect)
        isSubmitting.current = false; // Allow continue button to work
      }
    }
  };


  const handleShowAnswer = () => {
    if (isAnswerRevealed || showContinueButton || isSubmitting.current || !currentProblem) return;

    isSubmitting.current = true; // Prevent actions while processing
    setError('');
    setFeedback(null);

    const timeSpent = (Date.now() - problemStartTime) / 1000;
    // If max attempts is set, count revealing as using all attempts. If unlimited, count as 1 attempt.
    // const attemptsCounted = settings.maxAttempts > 0 ? settings.maxAttempts : 1;
    const currentAttemptNumber = currentAttempts + 1; // Count reveal as an attempt

    const correctAnswers = { ...currentProblem.answers };
    correctAnswers[currentProblem.type] = currentProblem.value; // Ensure given value is present

    setInputValues(correctAnswers);
    setIsAnswerRevealed(true);
    setFeedback({
      correct: false, // Revealing is considered not getting it correct
      message: 'Answers revealed.'
    });

    setUserAnswersHistory(prev => [...prev, {
      problem: currentProblem,
      userAnswers: correctAnswers, // Store the correct answers as 'user' answer since they revealed
      isCorrect: false,
      wasRevealed: true, // Mark as revealed
      timeSpent,
      attemptsMade: currentAttemptNumber // Use the calculated attempt number
    }]);

    emitProgress({
      correct: false,
      timeSpent,
      attempts: currentAttemptNumber, // Use the calculated attempt number
      revealed: true
    });

    if (settings.enableCompensation) {
      setTargetProblemCount(prev => prev + 1);
      toast.info("Revealed answer, adding one more problem.", { duration: 2000 });
    }

    // setShowContinueButton(true); // Let triggerContinuation handle this
    triggerContinuation(); // Check if auto-continue should run (it shouldn't on reveal)
    isSubmitting.current = false; // Allow continue button
  };


  const handleAutoContinueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsAutoContinueEnabled(isChecked);

    if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);

    if (isChecked) {
      setShowAutoContinueTooltip(true);
      tooltipTimerRef.current = setTimeout(() => {
        setShowAutoContinueTooltip(false);
      }, TOOLTIP_DISPLAY_TIME);
    } else {
      setShowAutoContinueTooltip(false);
      // If auto-continue is disabled while a timer is running, clear it
      if (autoContinueTimerRef.current) {
        clearTimeout(autoContinueTimerRef.current);
        autoContinueTimerRef.current = null;
         // Ensure continue button shows if needed
         if (feedback && !isComplete && showContinueButton) {
             // No change needed, button is already showing
         }
      }
    }
  };

  const handleCheckboxAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent the main button click when clicking the checkbox area
  };


  const restartExercise = () => {
    // Re-read settings from localStorage to ensure fresh start in case they changed in another tab/window
     try {
         const saved = localStorage.getItem('conversions_settings');
         const parsed = saved ? JSON.parse(saved) : {};
         const initialSettings = { ...DEFAULT_SETTINGS, ...parsed };
        // Validate loaded settings values again
        initialSettings.problemCount = Math.max(1, parseInt(String(initialSettings.problemCount), 10) || DEFAULT_SETTINGS.problemCount);
        initialSettings.maxAttempts = Math.max(0, parseInt(String(initialSettings.maxAttempts), 10)); // 0 is valid
        initialSettings.timeLimit = Math.max(0, parseInt(String(initialSettings.timeLimit), 10)); // 0 is valid
        initialSettings.difficultyLevel = Math.min(5, Math.max(1, parseInt(String(initialSettings.difficultyLevel), 10) || DEFAULT_SETTINGS.difficultyLevel));
        initialSettings.adaptiveDifficulty = Boolean(initialSettings.adaptiveDifficulty);
        initialSettings.enableCompensation = Boolean(initialSettings.enableCompensation);
         setSettings(initialSettings);
     } catch (error) {
         console.error("Failed to parse settings on restart", error);
         setSettings(DEFAULT_SETTINGS); // Fallback to defaults
     }
     // The useEffect listening to [settings] will handle the full reset of cache, state etc.
  };


  const handleEnterReview = () => {
    if (userAnswersHistory.length === 0) return;

    setIsReviewMode(true);
    setReviewIndex(0); // Start review from the beginning

    // Clear auto-continue timer if active
    if (autoContinueTimerRef.current) {
      clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = null;
    }

    setShowContinueButton(false); // Hide continue button in review mode
    setFeedback(null); // Clear any lingering feedback
  };

  const handleExitReview = () => {
    setIsReviewMode(false);
     // Restore continue button visibility if needed based on the last problem state BEFORE entering review
     // We need to know if the 'continue' button *should* have been visible based on the non-review state
     const lastProblemState = userAnswersHistory[currentIndex]; // Get the state of the current problem index
      if (!isComplete && lastProblemState && (lastProblemState.isCorrect || lastProblemState.wasRevealed || (settings.maxAttempts > 0 && lastProblemState.attemptsMade >= settings.maxAttempts && !lastProblemState.isCorrect) ) ) {
         setShowContinueButton(true);
         // Re-trigger auto-continue check if applicable and the last answer was correct
         if (lastProblemState.isCorrect) {
            triggerContinuation();
         }
     } else if (!isComplete && feedback) { // Or if feedback was showing before review
         setShowContinueButton(true);
         if (feedback.correct) {
            triggerContinuation();
         }
     }
      else {
         setShowContinueButton(false);
     }
  };

  const handleReviewNext = () => {
    setReviewIndex(prev => Math.min(prev + 1, userAnswersHistory.length - 1));
  };

  const handleReviewPrev = () => {
    setReviewIndex(prev => Math.max(prev - 1, 0));
  };

  // Render Review Screen
  const renderReviewScreen = () => {
    if (!isReviewMode || userAnswersHistory.length === 0) return null;

    const reviewAnswer = userAnswersHistory[reviewIndex];
    if (!reviewAnswer) return <div className="text-red-500 p-4">Error: Review data not found for index {reviewIndex}.</div>;

    const { problem, userAnswers, isCorrect, wasRevealed, timeSpent, attemptsMade } = reviewAnswer;
    const types: ConversionType[] = ['fraction', 'decimal', 'percent', 'ratio'];

    return (
      <motion.div
        key={`review-${reviewIndex}`} // Add key for animation on index change
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl z-20 flex flex-col shadow-2xl border dark:border-gray-700 overflow-y-auto" // Added overflow
      >
        <h3 className="text-lg font-semibold mb-4 text-center text-gray-700 dark:text-gray-200 sticky top-0 bg-white dark:bg-gray-800 py-2 z-10 border-b dark:border-gray-700"> {/* Sticky header */}
          Reviewing Problem {reviewIndex + 1} / {userAnswersHistory.length}
        </h3>

        <div className="mb-4 text-center p-3 bg-gray-100 dark:bg-gray-700/50 rounded">
          <p className="text-sm text-gray-600 dark:text-gray-400">Original:</p>
          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-300 break-words"> {/* Allow long values to wrap */}
            {problem.value} <span className="text-sm font-normal">({problem.type})</span>
          </p>
        </div>

        <div className="space-y-3 mb-4 flex-grow"> {/* Allow content to grow */}
          {types.map(type => {
            if (type === problem.type) return null; // Don't show input for the given type

            const userAnswerText = userAnswers[type] || '(empty)';
            const correctAnswerText = problem.answers[type];
            // Check correctness based on normalized values for this specific field
            // Pass currentProblem to normalizeAnswer context if needed
            const normalizedUser = normalizeAnswer(userAnswerText, type);
            const normalizedCorrect = normalizeAnswer(correctAnswerText, type);
            const isFieldCorrect = !wasRevealed && userAnswerText !== '(empty)' && normalizedUser === normalizedCorrect;


            // Determine if the user's answer for *this specific field* was incorrect
            const fieldWasIncorrect = !isCorrect && !isFieldCorrect && !wasRevealed && userAnswerText !== '(empty)';

            return (
              <div key={type} className={`p-2 rounded border ${
                isFieldCorrect
                  ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                  : fieldWasIncorrect
                    ? 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                    : wasRevealed // Highlight revealed answers differently
                      ? 'border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20'
                      : 'border-gray-200 dark:border-gray-600' // Default for empty or not applicable
              }`}>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 capitalize">
                  {type}:
                </p>
                <p className={`text-sm break-words ${ // Allow wrapping
                  fieldWasIncorrect
                    ? 'line-through text-red-600 dark:text-red-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  Your Answer: {wasRevealed ? '(Revealed)' : userAnswerText}
                </p>
                {/* Show correct answer if field was incorrect, revealed, or empty */}
                {(!isFieldCorrect || wasRevealed || userAnswerText === '(empty)') && (
                  <p className="text-sm text-green-700 dark:text-green-300 font-semibold break-words"> {/* Allow wrapping */}
                    Correct: {correctAnswerText}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 mt-auto text-center border-t dark:border-gray-700 pt-3 space-y-1">
          <p>
            Overall Result:
            <span className={`font-bold ml-1 ${isCorrect ? 'text-green-600' : wasRevealed ? 'text-orange-600' : 'text-red-600'}`}>
              {isCorrect ? 'Correct' : wasRevealed ? 'Revealed' : 'Incorrect'}
            </span>
          </p>
          <p>Attempts: {attemptsMade}</p>
          <p>Time: {timeSpent.toFixed(1)}s</p>
        </div>

        <div className="mt-4 flex justify-between items-center pt-4 border-t dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 pb-2 z-10"> {/* Sticky footer */}
          <button
            onClick={handleReviewPrev}
            disabled={reviewIndex === 0}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 flex items-center gap-1 transition-colors"
            aria-label="Previous problem"
          >
            <ArrowLeft size={14} /> Prev
          </button>

          <button
            onClick={handleExitReview}
            className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
            aria-label="Return to exercise"
          >
            Return
          </button>

          <button
            onClick={handleReviewNext}
            disabled={reviewIndex === userAnswersHistory.length - 1}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 flex items-center gap-1 transition-colors"
            aria-label="Next problem"
          >
            Next <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    );
  };


  // Render Complete State
  if (isComplete) {
    const correctCount = userAnswersHistory.filter(a => a.isCorrect).length;
    const revealedCount = userAnswersHistory.filter(a => a.wasRevealed).length;
    const finalProblemCount = userAnswersHistory.length;
    const accuracy = finalProblemCount > 0 ? (correctCount / finalProblemCount) * 100 : 0;
    const totalTime = userAnswersHistory.reduce((acc, a) => acc + a.timeSpent, 0);
    const avgTime = finalProblemCount > 0 ? totalTime / finalProblemCount : 0;
    const totalAttempts = userAnswersHistory.reduce((acc, a) => acc + a.attemptsMade, 0);
    const avgAttempts = finalProblemCount > 0 ? totalAttempts / finalProblemCount : 0;

    return (
      <div className="max-w-lg mx-auto text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Conversions Exercise Complete!</h2>

        <div className="bg-indigo-50 dark:bg-gray-900/50 p-6 rounded-lg mb-6 ring-1 ring-inset ring-indigo-100 dark:ring-gray-700">
          <div className="grid grid-cols-2 gap-4">
            {/* Score */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Score</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {correctCount} / {finalProblemCount}
              </p>
            </div>
             {/* Accuracy */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Accuracy</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {accuracy.toFixed(1)}%
              </p>
            </div>
             {/* Avg. Time */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Avg. Time</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {avgTime.toFixed(1)}s
              </p>
            </div>
             {/* Avg. Attempts */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Avg. Attempts</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {avgAttempts.toFixed(1)}
              </p>
            </div>
             {/* Revealed */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Revealed</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {revealedCount}
              </p>
            </div>
            {/* Compensation Info */}
            {settings.enableCompensation && finalProblemCount > settings.problemCount && (
              <div className="col-span-2 bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
                {finalProblemCount - settings.problemCount} extra problem(s) added due to compensation.
              </div>
            )}
          </div>
        </div>

        {/* Detailed Review Summary (Optional but good) */}
        {userAnswersHistory.length > 0 && (
             <div className="mb-6 text-left">
                <h3 className="text-xl font-semibold mb-3 text-center">Problem Summary</h3>
                 <button
                    onClick={handleEnterReview}
                    className="mb-3 w-full px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 flex items-center justify-center gap-2 transition-colors"
                    aria-label="Review Problems in Detail"
                 >
                    <Eye size={16} /> Review Problems in Detail
                 </button>
                {/* Maybe add a small summary list here if needed, or rely on the detailed review button */}
             </div>
        )}


        <button
          onClick={restartExercise}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 flex items-center justify-center gap-2 mx-auto"
        >
          <RotateCcw size={16} /> Start New Exercise
        </button>
      </div>
    );
  }


  // Render Main Exercise
  return (
    <div className="max-w-4xl mx-auto p-4 relative min-h-[42rem]"> {/* Increased min height slightly */}
      {/* Review Screen Overlay */}
      {isReviewMode && renderReviewScreen()}

      {/* Main Exercise Content Area (conditionally rendered) */}
      <AnimatePresence>
        {!isReviewMode && currentProblem && (
          <motion.div
             key={`exercise-view-${currentIndex}`} // Ensure animation on problem change
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             transition={{ duration: 0.3 }}
          >
            {/* Progress Bar and Info */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2 text-sm">
                <button
                  onClick={handleEnterReview}
                  disabled={userAnswersHistory.length === 0}
                  className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Review Previous Problems"
                  title="Review Previous Problems"
                >
                  <Eye size={18} />
                </button>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  Problem {currentIndex + 1} of {targetProblemCount}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  Attempts: {currentAttempts} / {settings.maxAttempts === 0 ? '∞' : settings.maxAttempts}
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  className="bg-indigo-600 h-full rounded-full"
                  initial={{ width: `${(currentIndex / targetProblemCount) * 100}%` }} // Start from previous width
                  animate={{ width: `${((currentIndex + 1) / targetProblemCount) * 100}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Problem Container */}
            <div className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg mb-6 text-center border border-gray-200 dark:border-gray-700 relative">
              <h2 className="text-xl md:text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white break-words"> {/* Allow wrap */}
                Convert <span className="text-indigo-600 dark:text-indigo-300">{currentProblem.value}</span> ({currentProblem.type}) to:
              </h2>

              {/* Feedback Area */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`p-3 rounded-md text-sm font-medium overflow-hidden ${
                      feedback.correct
                        ? 'bg-green-100 text-green-800 dark:bg-green-800/80 dark:text-green-100'
                        : 'bg-red-100 text-red-800 dark:bg-red-800/80 dark:text-red-100'
                    }`}
                  >
                    {feedback.message}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message Area */}
              {error && !feedback && ( // Show error only if there's no feedback message
                <p className="text-red-600 dark:text-red-400 text-sm mb-4" role="alert">
                  {error}
                </p>
              )}

              {/* Input Form */}
              <div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(['fraction', 'decimal', 'percent', 'ratio'] as ConversionType[]).map((type) => {
                      const isGiven = type === currentProblem.type;
                      const isDisabled = isGiven || showContinueButton || isSubmitting.current || isAnswerRevealed;
                      return (
                        <div key={type}>
                          <label htmlFor={`input-${type}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                            {type}
                          </label>
                          <input
                            ref={inputRefs[type]}
                            id={`input-${type}`}
                            type="text"
                            value={inputValues[type]}
                            onChange={(e) => handleInputChange(type, e.target.value)}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                              isGiven
                                ? 'bg-gray-100 dark:bg-gray-600 font-medium cursor-not-allowed'
                                : isDisabled
                                    ? 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600/50 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500' // Normal editable style
                             } ${ // Error styling specific to this field
                                error && !feedback && error.toLowerCase().includes(type)
                                  ? 'border-red-500 dark:border-red-400 ring-1 ring-red-500 dark:ring-red-400'
                                  : ''
                             }`
                            }
                            placeholder={`Enter ${type}`}
                            disabled={isDisabled}
                            readOnly={isGiven} // Keep readOnly for the given field
                            aria-invalid={error && !feedback && error.toLowerCase().includes(type) ? "true" : "false"}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Buttons */}
                  {!showContinueButton && (
                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <button
                        type="submit" // Changed to submit
                        onClick={() => handleSubmit()} // Ensure submit logic runs even if button clicked directly
                        className="flex-1 px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isAnswerRevealed || isSubmitting.current}
                      >
                        {isSubmitting.current ? 'Checking...' : 'Check Answers'}
                      </button>

                      {!isAnswerRevealed && (
                        <button
                          type="button"
                          onClick={handleShowAnswer}
                          className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={isSubmitting.current || currentAttempts >= (settings.maxAttempts > 0 ? settings.maxAttempts : Infinity) } // Disable if max attempts reached
                        >
                          Show Answers
                        </button>
                      )}
                    </div>
                  )}
                </form>

                 {/* Continue Button Area */}
                {showContinueButton && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="mt-8"
                  >
                    <motion.button
                      onClick={handleContinue}
                      className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 relative overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed"
                     // Disable button briefly if auto-continue timer is running
                     disabled={autoContinueTimerRef.current !== null}
                    >
                      {/* Button Text */}
                      <span className="relative z-0">
                        {currentIndex < targetProblemCount - 1 ? 'Continue' : 'Show Results'}
                      </span>

                      {/* Auto-Continue Checkbox (only show if NOT the last problem) */}
                      {currentIndex < targetProblemCount - 1 && (
                          <div
                            className="absolute bottom-0 right-0 mb-1 mr-1 flex items-center z-10 group"
                            onClick={handleCheckboxAreaClick} // Prevent button click
                            title={isAutoContinueEnabled ? "Disable Auto-Continue" : "Enable Auto-Continue (proceeds automatically on correct answer)"}
                          >
                            {/* Tooltip */}
                            <AnimatePresence>
                              {showAutoContinueTooltip && (
                                <motion.div
                                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute bottom-full right-0 mb-1 p-1.5 bg-gray-900 text-white text-xs rounded shadow-lg w-max max-w-[180px] pointer-events-none"
                                  role="tooltip"
                                  id="auto-continue-tooltip"
                                >
                                  Auto-proceeds after {AUTO_CONTINUE_DELAY/1000}s on correct
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Checkbox Label */}
                            <label
                              htmlFor="auto-continue-checkbox"
                              className="flex items-center px-1.5 py-0.5 bg-white/80 dark:bg-black/50 rounded cursor-pointer hover:bg-white dark:hover:bg-black/70 backdrop-blur-sm transition-colors"
                              aria-describedby={showAutoContinueTooltip ? "auto-continue-tooltip" : undefined}
                            >
                              <input
                                type="checkbox"
                                id="auto-continue-checkbox"
                                checked={isAutoContinueEnabled}
                                onChange={handleAutoContinueChange}
                                className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-1 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 cursor-pointer"
                              />
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-200 select-none">
                                Auto
                              </span>
                            </label>
                          </div>
                      )}

                    </motion.button>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading/Initial State */}
      {!isReviewMode && !currentProblem && !isComplete && (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">Loading exercise...</p>
          {/* Add a spinner here if desired */}
           <div role="status" className="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
        </div>
      )}
    </div>
  );
};