import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
// Importar iconos necesarios
import { Eye, ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

// --- Constants ---
const MAX_DIFFICULTY = 5;
const CORRECT_STREAK_THRESHOLD = 10;
const AUTO_CONTINUE_DELAY = 1500;
const TOOLTIP_DISPLAY_TIME = 3000;
const PROBLEM_CACHE_SIZE = 20;
const SAME_RANGE_DIVISOR_PROBABILITY = 0.6;
const DECIMAL_PRECISION = 2;
const EPSILON = 1 / (10 ** (DECIMAL_PRECISION + 1));
type DivisionDisplayFormat = 'slash' | 'obelus' | 'long';
const DISPLAY_FORMATS: DivisionDisplayFormat[] = ['slash', 'obelus', 'long'];

// --- Types ---
interface Problem {
  num1: number; // Dividendo
  num2: number; // Divisor
  operator: string; // Siempre el símbolo ÷ ('\u00F7') internamente
  correctAnswer: number;
}

interface UserAnswer {
  problem: Problem;
  userAnswer: number | null;
  isCorrect: boolean;
  wasRevealed: boolean;
  timeSpent: number;
  attemptsMade: number;
  difficultyLevel: number;
  displayFormat: DivisionDisplayFormat;
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

const getRandomInt = (minNum: number, maxNum: number): number => {
    minNum = Math.ceil(minNum); maxNum = Math.floor(maxNum);
    if (maxNum < minNum) [minNum, maxNum] = [maxNum, minNum];
    return Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;
}

const generateProblem = (difficulty: number): Problem => {
    const validDifficulty = Math.max(1, Math.min(MAX_DIFFICULTY, Math.round(difficulty)));
    let num1: number, num2: number, correctAnswer: number;
    const operator = '\u00F7';

    if (validDifficulty < 4) { // División exacta
        let minDivisor: number, maxDivisor: number, minQuotient: number, maxQuotient: number;
        switch (validDifficulty) {
            case 1: minDivisor = 1; maxDivisor = 5; minQuotient = 1; maxQuotient = 9; break;
            case 2: minDivisor = 2; maxDivisor = 10; minQuotient = 2; maxQuotient = 12; break;
            case 3: minDivisor = 2; maxDivisor = 20; minQuotient = 5; maxQuotient = 25; break;
            default: minDivisor = 1; maxDivisor = 5; minQuotient = 1; maxQuotient = 9;
        }
        do { num2 = getRandomInt(minDivisor, maxDivisor); } while (num2 === 0);
        correctAnswer = getRandomInt(minQuotient, maxQuotient);
        num1 = num2 * correctAnswer;
    } else { // Potencialmente decimal
        let min1: number, max1: number, min2Main: number, max2Main: number, min2Lower: number, max2Lower: number;
        switch (validDifficulty) {
            case 4: min1=20; max1=500; min2Main=2; max2Main=25; min2Lower=2; max2Lower=10; break;
            case 5: min1=100; max1=2000; min2Main=5; max2Main=50; min2Lower=2; max2Lower=20; break;
            default: min1=20; max1=500; min2Main=2; max2Main=25; min2Lower=2; max2Lower=10;
        }
        num1 = getRandomInt(min1, max1);
        const useMainRangeDivisor = Math.random() < SAME_RANGE_DIVISOR_PROBABILITY;
        if (useMainRangeDivisor) do { num2 = getRandomInt(min2Main, max2Main); } while (num2 === 0);
        else do { num2 = getRandomInt(min2Lower, max2Lower); } while (num2 === 0);
        const rawAnswer = num1 / num2;
        correctAnswer = Math.round(rawAnswer * (10**DECIMAL_PRECISION)) / (10**DECIMAL_PRECISION);
        if (Number.isInteger(correctAnswer) && validDifficulty >=4 ) {
             const adjustment = Math.random() < 0.5 ? 1 : -1;
             num1 = Math.max(1, num1 + adjustment);
             const newRawAnswer = num1 / num2;
             correctAnswer = Math.round(newRawAnswer * (10**DECIMAL_PRECISION)) / (10**DECIMAL_PRECISION);
        }
    }
    return { num1, num2, operator, correctAnswer };
};

const checkAnswer = (problem: Problem, userAnswer: number | null): boolean => {
  if (userAnswer === null) return false;
  return Math.abs(userAnswer - problem.correctAnswer) < EPSILON;
};

// --- Settings Component for Division (Sin cambios internos aquí)---
export const DivisionSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('math_division_settings');
    const defaultSettings: Settings = { difficulty: 1, problemCount: 10, timeLimit: 0, adaptiveDifficulty: true, maxAttempts: 3, enableCompensation: false };
    if (!saved) return defaultSettings;
    try { const parsed = JSON.parse(saved);
      return {
        difficulty: parseInt(parsed.difficulty, 10) || defaultSettings.difficulty,
        problemCount: parseInt(parsed.problemCount, 10) > 0 ? parseInt(parsed.problemCount, 10) : defaultSettings.problemCount,
        timeLimit: parseInt(parsed.timeLimit, 10) || defaultSettings.timeLimit,
        adaptiveDifficulty: typeof parsed.adaptiveDifficulty === 'boolean' ? parsed.adaptiveDifficulty : defaultSettings.adaptiveDifficulty,
        maxAttempts: parseInt(parsed.maxAttempts, 10) >= 0 ? parseInt(parsed.maxAttempts, 10) : defaultSettings.maxAttempts,
        enableCompensation: typeof parsed.enableCompensation === 'boolean' ? parsed.enableCompensation : defaultSettings.enableCompensation,
       };
    } catch { return defaultSettings; }
  });

  useEffect(() => {
    requestAnimationFrame(() => { localStorage.setItem('math_division_settings', JSON.stringify(settings)); });
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target; let parsedValue: string | number | boolean;
      if (type === 'checkbox') parsedValue = (e.target as HTMLInputElement).checked;
      else if (type === 'number' || type === 'range' || ['problemCount', 'maxAttempts', 'timeLimit', 'difficulty'].includes(name)) {
          const numValue = parseInt(value, 10);
           if (name === 'problemCount') parsedValue = isNaN(numValue) || numValue <= 0 ? 1 : numValue;
           else if (name === 'maxAttempts') parsedValue = isNaN(numValue) || numValue < 0 ? 0 : numValue;
           else if (name === 'timeLimit') parsedValue = isNaN(numValue) || numValue < 0 ? 0 : numValue;
           else if (name === 'difficulty') parsedValue = isNaN(numValue) ? 1 : Math.max(1, Math.min(MAX_DIFFICULTY, numValue));
           else parsedValue = isNaN(numValue) ? 0 : numValue;
      } else parsedValue = value;
      setSettings(prev => ({ ...prev, [name]: parsedValue }));
  };

  const renderExample = (level: number) => {
      const p = generateProblem(level);
      const format = DISPLAY_FORMATS[Math.floor(Math.random() * DISPLAY_FORMATS.length)];
      const operatorSymbol = p.operator;
      switch (format) {
          case 'long':
              return ( <div className="inline-flex items-center text-sm"><span className="mr-1">{p.num1}</span><div className="inline-block relative border-l border-t border-gray-500 dark:border-gray-400 px-1 pt-0.5"><span>{p.num2}</span></div><span className="ml-1">= ?</span></div> );
          case 'slash': return <>{p.num1} / {p.num2} = ?</>;
          case 'obelus': default: return <>{p.num1} {operatorSymbol} {p.num2} = ?</>;
      }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Division Settings</h2>
      <div className="space-y-6">
         <div>
          <label htmlFor="difficultyRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Initial Difficulty Level ({settings.difficulty})</label>
          <input id="difficultyRange" type="range" name="difficulty" min="1" max="5" value={settings.difficulty} onChange={handleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"/>
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1"><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span></div>
          <div className="mt-2"><p className="text-sm text-gray-600 dark:text-gray-400">
                {settings.difficulty === 1 && 'Exact basic division (e.g., 12 \u00F7 3)'}
                {settings.difficulty === 2 && 'Exact division (e.g., 72 \u00F7 8)'}
                {settings.difficulty === 3 && 'Larger exact division (e.g., 250 \u00F7 10)'}
                {settings.difficulty === 4 && `Division with potential ${DECIMAL_PRECISION}-decimal answers`}
                {settings.difficulty === 5 && `Harder division with potential ${DECIMAL_PRECISION}-decimal answers`}
          </p></div>
        </div>
        <div><label htmlFor="problemCountInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Initial Number of Problems</label><input type="number" id="problemCountInput" name="problemCount" min="1" max="100" step="1" value={settings.problemCount} onChange={handleChange} className="input-field-style"/></div>
        <div><label htmlFor="maxAttempts" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Attempts per Problem (0 for unlimited)</label><input type="number" id="maxAttempts" name="maxAttempts" min="0" value={settings.maxAttempts} onChange={handleChange} className="input-field-style"/></div>
        <div><label htmlFor="timeLimitInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Time Limit (seconds per problem, 0 for no limit)</label><input id="timeLimitInput" type="number" name="timeLimit" min="0" max="120" value={settings.timeLimit} onChange={handleChange} className="input-field-style"/></div>
        <div className="flex items-center"><input type="checkbox" id="adaptiveDifficulty" name="adaptiveDifficulty" checked={settings.adaptiveDifficulty} onChange={handleChange} className="checkbox-style"/><label htmlFor="adaptiveDifficulty" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Enable Adaptive Difficulty (Increases level after {CORRECT_STREAK_THRESHOLD} correct in a row)</label></div>
        <div className="flex items-center"><input type="checkbox" id="enableCompensation" name="enableCompensation" checked={settings.enableCompensation} onChange={handleChange} className="checkbox-style"/><label htmlFor="enableCompensation" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">Enable Compensation (Add 1 problem for each incorrect/revealed)</label></div>
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium mb-4">Difficulty Examples (Formats vary)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 3, 5].map((level) => (
              <div key={level} className={`bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm ${ level === settings.difficulty ? 'ring-2 ring-indigo-500' : ''}`}>
                <h4 className="font-medium mb-2">Level {level} {level === settings.difficulty && ' (Initial)'}</h4>
                 <div className="text-gray-600 dark:text-gray-400 text-sm break-words">{renderExample(level)}</div>
                 <div className="text-gray-600 dark:text-gray-400 text-sm break-words mt-1">{renderExample(level)}</div>
              </div> ))}
          </div>
        </div>
      </div>
      <style jsx>{`.input-field-style { margin-top: 0.25rem; display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; box-shadow: sm; outline: none; focus:ring-indigo-500 focus:border-indigo-500; font-size: 0.875rem; background-color: white; dark:bg-gray-800 dark:border-gray-700 dark:text-white; } .checkbox-style { height: 1rem; width: 1rem; color: #4f46e5; focus:ring-indigo-500; border-color: #d1d5db; border-radius: 0.25rem; dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-600 dark:ring-offset-gray-800; }`}</style>
    </div>
  );
};

// --- Exercise Component for Division ---
export const DivisionExercise: React.FC = () => {
  const emitProgress = useCallback((data: { correct: boolean; timeSpent: number; difficulty: number; attempts: number; revealed: boolean }) => {
    const event = new CustomEvent('operationProgress', { detail: { operationType: 'division', ...data } });
    window.dispatchEvent(event);
  }, []);

  const [userSettings, setUserSettings] = useState<Settings>(() => { /* ... (carga idéntica) ... */
       const saved = localStorage.getItem('math_division_settings'); const defaultSettings: Settings = { difficulty: 1, problemCount: 10, timeLimit: 0, adaptiveDifficulty: true, maxAttempts: 3, enableCompensation: false }; if (!saved) return defaultSettings; try { const parsed = JSON.parse(saved); return { difficulty: Math.max(1, Math.min(MAX_DIFFICULTY, parseInt(parsed.difficulty, 10))) || defaultSettings.difficulty, problemCount: parseInt(parsed.problemCount, 10) > 0 ? parseInt(parsed.problemCount, 10) : defaultSettings.problemCount, timeLimit: parseInt(parsed.timeLimit, 10) >= 0 ? parseInt(parsed.timeLimit, 10) : 0, adaptiveDifficulty: typeof parsed.adaptiveDifficulty === 'boolean' ? parsed.adaptiveDifficulty : defaultSettings.adaptiveDifficulty, maxAttempts: parseInt(parsed.maxAttempts, 10) >= 0 ? parseInt(parsed.maxAttempts, 10) : defaultSettings.maxAttempts, enableCompensation: typeof parsed.enableCompensation === 'boolean' ? parsed.enableCompensation : defaultSettings.enableCompensation, }; } catch { return defaultSettings; }
  });
  const [problemCache, setProblemCache] = useState<Problem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [problemStartTime, setProblemStartTime] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [error, setError] = useState<string>('');
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [currentExerciseDifficulty, setCurrentExerciseDifficulty] = useState<number>(userSettings.difficulty);
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [targetProblemCount, setTargetProblemCount] = useState(userSettings.problemCount);
  const [isAutoContinueEnabled, setIsAutoContinueEnabled] = useState(false);
  const [showAutoContinueTooltip, setShowAutoContinueTooltip] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [currentDisplayFormat, setCurrentDisplayFormat] = useState<DivisionDisplayFormat>('obelus');

  const isSubmitting = useRef(false);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const holdTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const chooseRandomFormat = (): DivisionDisplayFormat => DISPLAY_FORMATS[Math.floor(Math.random() * DISPLAY_FORMATS.length)];

  useEffect(() => { /* ... (Listener localStorage idéntico) ... */
       const handleStorageChange = (event: StorageEvent) => { if (event.key === 'math_division_settings' && event.newValue) { try { const newSettings = JSON.parse(event.newValue) as Partial<Settings>; const validatedSettings: Settings = { difficulty: Math.max(1, Math.min(MAX_DIFFICULTY, newSettings.difficulty ?? 1)), problemCount: newSettings.problemCount ?? 10 > 0 ? newSettings.problemCount ?? 10 : 10, timeLimit: newSettings.timeLimit ?? 0 >= 0 ? newSettings.timeLimit ?? 0 : 0, adaptiveDifficulty: typeof newSettings.adaptiveDifficulty === 'boolean' ? newSettings.adaptiveDifficulty : true, maxAttempts: newSettings.maxAttempts ?? 3 >= 0 ? newSettings.maxAttempts ?? 3 : 3, enableCompensation: typeof newSettings.enableCompensation === 'boolean' ? newSettings.enableCompensation : false, }; setUserSettings(validatedSettings); } catch (error) { console.error('Error parsing settings from storage:', error); } } }; window.addEventListener('storage', handleStorageChange); return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  useEffect(() => { /* ... (Iniciar/Reiniciar idéntico) ... */
      console.log("Initializing/Restarting division exercise with settings:", userSettings); const initialDifficulty = userSettings.difficulty; const generateCache = (difficulty: number, size: number) => Array(size).fill(null).map(() => generateProblem(difficulty)); const cacheSize = Math.max(PROBLEM_CACHE_SIZE, userSettings.problemCount); const newCache = generateCache(initialDifficulty, cacheSize); setProblemCache(newCache); setCurrentExerciseDifficulty(initialDifficulty); setCurrentProblem(newCache[0]); setCurrentDisplayFormat(chooseRandomFormat()); setCurrentIndex(0); setUserAnswers([]); setInputValue(''); setProblemStartTime(Date.now()); setIsComplete(false); setFeedback(null); setError(''); setCurrentAttempts(0); setShowContinueButton(false); setIsAnswerRevealed(false); setConsecutiveCorrectAnswers(0); setTargetProblemCount(userSettings.problemCount); setIsReviewMode(false); setReviewIndex(0); setShowAutoContinueTooltip(false); isSubmitting.current = false; if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current); autoContinueTimerRef.current = null; tooltipTimerRef.current = null; holdTimeoutRef.current = null; const focusTimeout = setTimeout(() => inputRef.current?.focus(), 100); return () => clearTimeout(focusTimeout);
  }, [userSettings]);
  useEffect(() => { /* ... (Cleanup timers idéntico) ... */ return () => { if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); if (holdTimeoutRef.current) clearTimeout(holdTimeoutRef.current); }; }, []);
  useEffect(() => { /* ... (Enfocar input idéntico) ... */ if (!isReviewMode && !isComplete && currentProblem && !showContinueButton && !autoContinueTimerRef.current) { const focusTimeout = setTimeout(() => { inputRef.current?.focus(); if (error) inputRef.current?.select(); }, 50); return () => clearTimeout(focusTimeout); } }, [currentIndex, showContinueButton, isComplete, currentProblem, error, isReviewMode]);

  const handleContinue = useCallback(() => { /* ... (lógica idéntica, elige nuevo formato) ... */
        if (autoContinueTimerRef.current) { clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; } if (currentIndex >= targetProblemCount - 1) { setIsComplete(true); setShowContinueButton(false); return; } const nextProblemIndex = currentIndex + 1; let nextProblem: Problem; if (nextProblemIndex < problemCache.length) nextProblem = problemCache[nextProblemIndex]; else { console.warn("Generating division problem outside cache for index:", nextProblemIndex); nextProblem = generateProblem(currentExerciseDifficulty); setProblemCache(cache => [...cache, nextProblem]); } setCurrentProblem(nextProblem); setCurrentDisplayFormat(chooseRandomFormat()); setCurrentIndex(nextProblemIndex); setShowContinueButton(false); setFeedback(null); setInputValue(''); setError(''); setCurrentAttempts(0); setIsAnswerRevealed(false); setProblemStartTime(Date.now()); isSubmitting.current = false;
  }, [currentIndex, targetProblemCount, problemCache, currentExerciseDifficulty, chooseRandomFormat]);

  useEffect(() => { /* ... (Lógica Auto-Continuar idéntica, usa handleContinue actualizado) ... */ if (feedback && isAutoContinueEnabled && !isReviewMode) { if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = setTimeout(handleContinue, AUTO_CONTINUE_DELAY); } return () => { if (autoContinueTimerRef.current && (!feedback || !isAutoContinueEnabled)) { clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; } }; }, [feedback, isAutoContinueEnabled, isReviewMode, currentIndex, handleContinue]);

  const triggerContinuation = useCallback(() => { /* ... (idéntico) ... */ if (isAutoContinueEnabled && !isReviewMode) setShowContinueButton(false); else setShowContinueButton(true); }, [isAutoContinueEnabled, isReviewMode]);
  const handleSubmit = (e: React.FormEvent) => { /* ... (lógica idéntica, guarda displayFormat) ... */ e.preventDefault(); if (isAnswerRevealed || showContinueButton || isSubmitting.current || !currentProblem) return; isSubmitting.current = true; setError(''); if (inputValue.trim() === '') { setError('Please enter an answer'); isSubmitting.current = false; inputRef.current?.focus(); return; } const numericAnswer = parseFloat(inputValue); if (isNaN(numericAnswer)) { setError('Please enter a valid number'); isSubmitting.current = false; inputRef.current?.focus(); inputRef.current?.select(); return; } const attemptsSoFar = currentAttempts + 1; setCurrentAttempts(attemptsSoFar); const isCorrect = checkAnswer(currentProblem, numericAnswer); const timeSpent = (Date.now() - problemStartTime) / 1000; let shouldProceed = false; if (isCorrect) { let feedbackMessage = `Correct! (${attemptsSoFar} ${attemptsSoFar === 1 ? 'attempt' : 'attempts'})`; setFeedback({ correct: true, message: feedbackMessage }); setUserAnswers(prev => [...prev, { problem: currentProblem, userAnswer: numericAnswer, isCorrect: true, wasRevealed: false, timeSpent, attemptsMade: attemptsSoFar, difficultyLevel: currentExerciseDifficulty, displayFormat: currentDisplayFormat }]); emitProgress({ correct: true, timeSpent, difficulty: currentExerciseDifficulty, attempts: attemptsSoFar, revealed: false }); if (userSettings.adaptiveDifficulty) { const newStreak = consecutiveCorrectAnswers + 1; setConsecutiveCorrectAnswers(newStreak); if (newStreak >= CORRECT_STREAK_THRESHOLD && currentExerciseDifficulty < MAX_DIFFICULTY) { const nextDifficulty = currentExerciseDifficulty + 1; setCurrentExerciseDifficulty(nextDifficulty); setConsecutiveCorrectAnswers(0); const cacheSize = Math.max(PROBLEM_CACHE_SIZE, targetProblemCount - (currentIndex + 1)); const newProblems = Array(cacheSize).fill(null).map(() => generateProblem(nextDifficulty)); setProblemCache(prev => [...prev.slice(0, currentIndex + 1), ...newProblems]); toast.info(`Level Up! Difficulty increased to ${nextDifficulty}.`, { duration: 2500 }); } } shouldProceed = true; } else { if (userSettings.adaptiveDifficulty) setConsecutiveCorrectAnswers(0); const hasAttemptsLeft = userSettings.maxAttempts === 0 || attemptsSoFar < userSettings.maxAttempts; if (hasAttemptsLeft) { const attemptsRemaining = userSettings.maxAttempts === 0 ? 'Unlimited' : userSettings.maxAttempts - attemptsSoFar; setError(`Incorrect. Attempts left: ${attemptsRemaining}`); setFeedback({ correct: false, message: `Incorrect. Try again!` }); setInputValue(''); isSubmitting.current = false; } else { const displayCorrectAnswer = !Number.isInteger(currentProblem.correctAnswer) ? currentProblem.correctAnswer.toFixed(DECIMAL_PRECISION) : currentProblem.correctAnswer; setFeedback({ correct: false, message: `Incorrect. No attempts left. The answer was ${displayCorrectAnswer}.` }); setUserAnswers(prev => [...prev, { problem: currentProblem, userAnswer: numericAnswer, isCorrect: false, wasRevealed: false, timeSpent, attemptsMade: attemptsSoFar, difficultyLevel: currentExerciseDifficulty, displayFormat: currentDisplayFormat }]); emitProgress({ correct: false, timeSpent, difficulty: currentExerciseDifficulty, attempts: attemptsSoFar, revealed: false }); if (userSettings.enableCompensation) { setTargetProblemCount(prev => prev + 1); toast.info("Incorrect answer, adding one more problem.", { duration: 2000 }); } shouldProceed = true; } } if (shouldProceed) triggerContinuation(); };
  const handleShowAnswer = () => { /* ... (lógica idéntica, guarda displayFormat) ... */ if (isAnswerRevealed || showContinueButton || isSubmitting.current || !currentProblem) return; isSubmitting.current = true; if (userSettings.adaptiveDifficulty) setConsecutiveCorrectAnswers(0); const timeSpent = (Date.now() - problemStartTime) / 1000; const attemptsCounted = userSettings.maxAttempts > 0 ? userSettings.maxAttempts : 1; setIsAnswerRevealed(true); const displayCorrectAnswer = !Number.isInteger(currentProblem.correctAnswer) ? currentProblem.correctAnswer.toFixed(DECIMAL_PRECISION) : currentProblem.correctAnswer; setFeedback({ correct: false, message: `Answer revealed: ${displayCorrectAnswer}` }); setUserAnswers(prev => [...prev, { problem: currentProblem, userAnswer: null, isCorrect: false, wasRevealed: true, timeSpent, attemptsMade: attemptsCounted, difficultyLevel: currentExerciseDifficulty, displayFormat: currentDisplayFormat }]); emitProgress({ correct: false, timeSpent, difficulty: currentExerciseDifficulty, attempts: attemptsCounted, revealed: true }); if (userSettings.enableCompensation) { setTargetProblemCount(prev => prev + 1); toast.info("Revealed answer, adding one more problem.", { duration: 2000 }); } setError(''); setInputValue(''); triggerContinuation(); };
  const handleAutoContinueChange = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... (idéntico) ... */ const isChecked = e.target.checked; setIsAutoContinueEnabled(isChecked); if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current); if (isChecked) { setShowAutoContinueTooltip(true); tooltipTimerRef.current = setTimeout(() => setShowAutoContinueTooltip(false), TOOLTIP_DISPLAY_TIME); } else { setShowAutoContinueTooltip(false); if (autoContinueTimerRef.current) { clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; if (feedback && !isComplete) setShowContinueButton(true); } } };
  const handleCheckboxAreaClick = (e: React.MouseEvent) => e.stopPropagation();
  const restartExercise = () => setUserSettings(prev => ({ ...prev }));
  const handleEnterReview = () => { /* ... (idéntico) ... */ if (userAnswers.length === 0) return; setIsReviewMode(true); setReviewIndex(userAnswers.length - 1); if (autoContinueTimerRef.current) { clearTimeout(autoContinueTimerRef.current); autoContinueTimerRef.current = null; } setShowContinueButton(false); };
  const handleExitReview = () => { /* ... (idéntico) ... */ setIsReviewMode(false); if (feedback && isAutoContinueEnabled && !isComplete) triggerContinuation(); else if (feedback && !isAutoContinueEnabled && !isComplete) setShowContinueButton(true); };
  const handleReviewNext = () => setReviewIndex(prev => Math.min(prev + 1, userAnswers.length - 1));
  const handleReviewPrev = () => setReviewIndex(prev => Math.max(prev - 1, 0));

   // --- Render Helper para Modo Revisión (usa displayFormat guardado con casita INVERTIDA) ---
   const renderReviewScreen = () => {
        if (!isReviewMode || userAnswers.length === 0) return null;
        const reviewAnswer = userAnswers[reviewIndex];
        if (!reviewAnswer) return <div>Error: Review data not found.</div>;
        const { problem, userAnswer, isCorrect, wasRevealed, timeSpent, attemptsMade, difficultyLevel, displayFormat } = reviewAnswer;

        const renderReviewEquation = () => {
            const displayCorrectAnswer = !Number.isInteger(problem.correctAnswer) ? problem.correctAnswer.toFixed(DECIMAL_PRECISION) : problem.correctAnswer;
            const displayUserAnswerVal = userAnswer !== null ? (!Number.isInteger(userAnswer) ? userAnswer.toFixed(DECIMAL_PRECISION) : userAnswer) : '?';
            let valueClass = ""; let correctionSpan: React.ReactNode = null;
            if (wasRevealed) valueClass = "font-semibold text-orange-700 dark:text-orange-400";
            else if (isCorrect) valueClass = "font-semibold text-green-700 dark:text-green-300";
            else { valueClass = "font-semibold line-through text-red-700 dark:text-red-400"; correctionSpan = <span className="ml-1 text-sm text-green-600 dark:text-green-400 font-semibold">({displayCorrectAnswer})</span>; }
            const answerValue = wasRevealed ? displayCorrectAnswer : displayUserAnswerVal;

            let problemDisplay: React.ReactNode;
            switch(displayFormat) {
                // *** MODIFICADO: Casita invertida en Revisión ***
                case 'long':
                    problemDisplay = ( <div className="inline-flex items-center"><span className="mr-1">{problem.num1}</span><div className="inline-block relative border-l border-t border-gray-500 dark:border-gray-400 px-1 pt-0.5"><span>{problem.num2}</span></div><span className="mx-1">=</span><span className="inline-flex items-center"><span className={valueClass}>{answerValue}</span>{correctionSpan}</span></div> ); break;
                case 'slash': problemDisplay = <><span className="mx-1">{problem.num1} / {problem.num2}</span><span className="mx-1">=</span><span className="inline-flex items-center"><span className={valueClass}>{answerValue}</span>{correctionSpan}</span></>; break;
                case 'obelus': default: problemDisplay = <><span className="mx-1">{problem.num1} {problem.operator} {problem.num2}</span><span className="mx-1">=</span><span className="inline-flex items-center"><span className={valueClass}>{answerValue}</span>{correctionSpan}</span></>; break;
            }
            return ( <div className="text-lg sm:text-xl font-medium mb-3 text-gray-800 dark:text-gray-100 flex justify-center items-center flex-wrap gap-x-1 sm:gap-x-1.5 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">{problemDisplay}{wasRevealed && <span className="ml-1 text-xs text-orange-700 dark:text-orange-400 opacity-80">(R)</span>}</div> );
        };
        return ( /* ... (estructura overlay idéntica) ... */ <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl z-20 flex flex-col shadow-2xl border dark:border-gray-700"> <h3 className="text-lg font-semibold mb-4 text-center text-gray-700 dark:text-gray-200">Reviewing Problem {reviewIndex + 1} / {userAnswers.length}</h3> {renderReviewEquation()} <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center border-t dark:border-gray-700 pt-3 space-y-1"> <p>Level: {difficultyLevel}</p> {!wasRevealed && <p>Attempts: {attemptsMade}</p>} <p>Time: {timeSpent.toFixed(1)}s</p> {wasRevealed && <p className="text-orange-600 dark:text-orange-400 font-medium">Answer was Revealed</p>} </div> <div className="mt-auto flex justify-between items-center pt-4"> <button onClick={handleReviewPrev} disabled={reviewIndex === 0} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 flex items-center gap-1 transition-colors" aria-label="Previous problem"><ArrowLeft size={14} /> Prev</button> <button onClick={handleExitReview} className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors" aria-label="Return to exercise">Return</button> <button onClick={handleReviewNext} disabled={reviewIndex === userAnswers.length - 1} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 flex items-center gap-1 transition-colors" aria-label="Next problem">Next <ArrowRight size={14} /></button> </div> </motion.div> );
   };

  // --- Renderizado Principal ---
  if (isComplete) { // Pantalla de Resumen Final (usa displayFormat guardado con casita INVERTIDA)
       const correctCount = userAnswers.filter(a => a.isCorrect).length; const revealedCount = userAnswers.filter(a => a.wasRevealed).length; const finalProblemCount = userAnswers.length; const accuracy = finalProblemCount > 0 ? (correctCount / finalProblemCount) * 100 : 0; const totalTime = userAnswers.reduce((acc, a) => acc + a.timeSpent, 0); const avgTime = finalProblemCount > 0 ? totalTime / finalProblemCount : 0; const totalAttempts = userAnswers.reduce((acc, a) => acc + a.attemptsMade, 0); const avgAttempts = finalProblemCount > 0 ? totalAttempts / finalProblemCount : 0; const finalDifficulty = userAnswers.length > 0 ? userAnswers[userAnswers.length - 1].difficultyLevel : userSettings.difficulty;

       const renderSummaryItem = (answer: UserAnswer, index: number) => { // *** CASITA INVERTIDA AQUI ***
           const { problem, userAnswer, isCorrect, wasRevealed, timeSpent, attemptsMade, difficultyLevel, displayFormat } = answer;
           const displayCorrectAnswer = !Number.isInteger(problem.correctAnswer) ? problem.correctAnswer.toFixed(DECIMAL_PRECISION) : problem.correctAnswer;
           const displayUserAnswerVal = userAnswer !== null ? (!Number.isInteger(userAnswer) ? userAnswer.toFixed(DECIMAL_PRECISION) : userAnswer) : '?';
           let valueClass = ""; let correctionSpan: React.ReactNode = null; let statusIcon: React.ReactNode = null;
           if (wasRevealed) { valueClass = "font-semibold text-orange-700 dark:text-orange-400"; statusIcon = <svg className="h-5 w-5 text-orange-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v4a1 1 0 102 0V5zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /></svg>; }
           else if (isCorrect) { valueClass = "font-semibold text-green-700 dark:text-green-300"; statusIcon = <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>; }
           else { valueClass = "font-semibold line-through text-red-700 dark:text-red-400"; correctionSpan = <span className="ml-1 text-xs text-green-600 dark:text-green-400 font-semibold">({displayCorrectAnswer})</span>; statusIcon = <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.607a1 1 0 010-1.414z" clipRule="evenodd" /></svg>; }
           const answerValue = wasRevealed ? displayCorrectAnswer : displayUserAnswerVal;
            let problemDisplay: React.ReactNode;
            switch(displayFormat) {
                case 'long': problemDisplay = <div className="inline-flex items-center"><span className="mr-0.5">{problem.num1}</span><div className="inline-block relative border-l border-t border-gray-500 dark:border-gray-400 px-0.5 pt-0"><span>{problem.num2}</span></div></div>; break;
                case 'slash': problemDisplay = <>{problem.num1} / {problem.num2}</>; break;
                case 'obelus': default: problemDisplay = <>{problem.num1} {problem.operator} {problem.num2}</>; break;
            }
           return ( <div key={index} className={`p-3 rounded-md shadow-sm ${ isCorrect ? 'bg-green-100 dark:bg-green-900/30 ring-1 ring-green-200 dark:ring-green-700' : wasRevealed ? 'bg-orange-100 dark:bg-orange-900/30 ring-1 ring-orange-200 dark:ring-orange-700' : 'bg-red-100 dark:bg-red-900/30 ring-1 ring-red-200 dark:ring-red-700'}`} > <div className="flex justify-between items-start text-sm"> <div className="text-left flex-grow"> <p className="font-medium text-gray-800 dark:text-gray-100 flex flex-wrap items-center gap-x-1 text-xs sm:text-sm"> <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">(#{index+1})</span> {problemDisplay} <span className="mx-0.5">=</span> <span className="inline-flex items-center"><span className={valueClass}>{answerValue}</span>{correctionSpan}</span> </p> <p className="text-xs text-gray-500 dark:text-gray-400 mt-1"> {`Lvl: ${difficultyLevel}`}{!wasRevealed ? `, Att: ${attemptsMade}`:''}{`, T: ${timeSpent.toFixed(1)}s`} </p> </div> <div className="text-right pl-2 shrink-0">{statusIcon}</div> </div> </div> );
       };
      return ( /* ... (estructura idéntica, título actualizado) ... */ <div className="max-w-lg mx-auto text-center p-4"> <h2 className="text-2xl font-bold mb-4">Division Exercise Complete!</h2> <div className="bg-indigo-50 dark:bg-gray-900/50 p-6 rounded-lg mb-6 ring-1 ring-inset ring-indigo-100 dark:ring-gray-700"> <div className="grid grid-cols-2 gap-4"> {/* Stats */} <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Score</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{correctCount} / {finalProblemCount}</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Accuracy</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{accuracy.toFixed(1)}%</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Avg. Time</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{avgTime.toFixed(1)}s</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Avg. Attempts</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{avgAttempts.toFixed(1)}</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Revealed</p><p className="text-xl font-bold text-orange-600 dark:text-orange-400">{revealedCount}</p></div> <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm"><p className="text-sm text-gray-600 dark:text-gray-300">Final Level</p><p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{finalDifficulty}</p></div> {userSettings.enableCompensation && finalProblemCount > userSettings.problemCount && ( <div className="col-span-2 bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md text-sm text-yellow-800 dark:text-yellow-200"> {finalProblemCount - userSettings.problemCount} extra problem(s) added due to compensation. </div> )} </div> </div> <div className="mb-6"> <h3 className="text-xl font-semibold mb-3">Problem Review</h3> <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800/50"> {userAnswers.map((answer, index) => renderSummaryItem(answer, index))} </div> </div> <button onClick={restartExercise} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900 flex items-center justify-center gap-2 mx-auto"> <RotateCcw size={16} /> Start New Exercise </button> </div> );
  }

  // --- Renderizado Ejercicio en Curso (usa renderProblemDisplay con casita INVERTIDA y altura mínima) ---
  const renderProblemDisplay = () => {
      if (!currentProblem) return null;
      switch(currentDisplayFormat) {
          case 'long': // *** CASITA INVERTIDA AQUI ***
              return (
                  <div className="inline-flex items-center">
                      <span className="mr-1">{currentProblem.num1}</span> {/* Dividendo afuera */}
                      <div className="inline-block relative border-l-2 border-t-2 border-current text-current px-2 pt-1">
                          <span>{currentProblem.num2}</span> {/* Divisor adentro */}
                      </div>
                      <span className="ml-2">=</span>
                      <span className="ml-2 text-indigo-600 dark:text-indigo-400">?</span>
                  </div>
              );
          case 'slash': return <><span>{currentProblem.num1}</span> <span className="text-indigo-600 dark:text-indigo-400">/</span> <span>{currentProblem.num2}</span> <span>=</span> <span className="text-indigo-600 dark:text-indigo-400">?</span></>;
          case 'obelus': default: return <><span>{currentProblem.num1}</span> <span className="text-indigo-600 dark:text-indigo-400">{currentProblem.operator}</span> <span>{currentProblem.num2}</span> <span>=</span> <span className="text-indigo-600 dark:text-indigo-400">?</span></>;
      }
  }

  return (
    // *** SOLUCIÓN: Añadida altura mínima al contenedor padre ***
    <div className="max-w-md mx-auto p-4 relative min-h-[32rem]"> {/* <-- SOLUCIÓN ALTURA */}
      {isReviewMode && renderReviewScreen()}
      <AnimatePresence>
      {!isReviewMode && currentProblem && (
        <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* ... (Info y progreso idéntico) ... */}
             <div className="mb-8"> <div className="flex justify-between items-center mb-2 text-sm"> <button onClick={handleEnterReview} disabled={userAnswers.length === 0} className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" aria-label="Review Previous Problems" title="Review Previous Problems"> <Eye size={18} /> </button> <span className="font-medium text-gray-700 dark:text-gray-300">Problem {currentIndex + 1} of {targetProblemCount}</span> <div><span className="text-gray-600 dark:text-gray-400 mr-3">Lvl: <span className="font-semibold text-indigo-700 dark:text-indigo-300">{currentExerciseDifficulty}</span></span> <span className="text-gray-600 dark:text-gray-400">Att: {currentAttempts} / {userSettings.maxAttempts === 0 ? '∞' : userSettings.maxAttempts}</span></div> </div> <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden"><motion.div className="bg-indigo-600 h-full rounded-full" animate={{ width: `${((currentIndex + 1) / targetProblemCount) * 100}%` }} transition={{ duration: 0.5, ease: "easeOut" }}/></div> {userSettings.adaptiveDifficulty && (<div className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">Streak: {consecutiveCorrectAnswers}/{CORRECT_STREAK_THRESHOLD}</div>)} </div>
            {/* Contenedor principal */}
            <motion.div key={`problem-container-${currentIndex}-${currentDisplayFormat}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg mb-6 text-center border border-gray-200 dark:border-gray-700 relative">
                 {/* Problema de división (usa helper modificado) */}
                 <div className="text-3xl sm:text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100 flex justify-center items-center space-x-3 sm:space-x-4 flex-wrap min-h-[3rem]">
                     {renderProblemDisplay()}
                 </div>
                 {/* ... (Feedback idéntico) ... */}
                 <AnimatePresence mode="wait">{feedback && (<motion.div key={`feedback-${currentIndex}-${feedback.correct}-${isAnswerRevealed}`} initial={{ opacity: 0, height: 0, marginBottom: 0 }} animate={{ opacity: 1, height: 'auto', marginBottom: '1rem' }} exit={{ opacity: 0, height: 0, marginBottom: 0 }} transition={{ duration: 0.2 }} className={`p-3 rounded-md text-sm font-medium overflow-hidden ${ feedback.correct ? 'bg-green-100 text-green-800 dark:bg-green-800/80 dark:text-green-100' : isAnswerRevealed ? 'bg-orange-100 text-orange-800 dark:bg-orange-800/80 dark:text-orange-100' : 'bg-red-100 text-red-800 dark:bg-red-800/80 dark:text-red-100'}`} > {feedback.message} </motion.div>)}</AnimatePresence>
                 {/* ... (Formulario / Botón Continuar idéntico) ... */}
                 <AnimatePresence mode="wait">{!showContinueButton ? (<motion.div key="input-form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}> <form onSubmit={handleSubmit} className="mt-4 space-y-4"> <input ref={inputRef} type="number" step="any" inputMode="decimal" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Your Answer" aria-label="Enter your answer" aria-invalid={!!error} aria-describedby={error ? "input-error" : undefined} className={`w-full px-4 py-3 text-lg sm:text-xl text-center rounded-md border ${ error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500 focus:border-indigo-500' } focus:outline-none focus:ring-2 dark:bg-gray-700 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 dark:disabled:opacity-60`} required disabled={isAnswerRevealed || isSubmitting.current} /> {error && !feedback && (<p id="input-error" className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>)} <button type="submit" className="w-full px-6 py-3 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800 disabled:opacity-50" disabled={!inputValue.trim() || isAnswerRevealed || (isSubmitting.current && !feedback)}> {(isSubmitting.current && !feedback) ? 'Checking...' : 'Submit Answer'} </button> </form> {!isAnswerRevealed && ( <button onClick={handleShowAnswer} className="mt-3 w-full px-6 py-2 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400 dark:focus:ring-offset-gray-800 disabled:opacity-50" disabled={isSubmitting.current}> Show Answer </button> )} </motion.div>) : (<motion.div key="continue-button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="mt-8"> <motion.button onClick={handleContinue} className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 relative overflow-hidden"> <span className="relative z-0"> {currentIndex < targetProblemCount - 1 ? 'Continue' : 'Show Results'} </span> <div className="absolute bottom-0 right-0 mb-1 mr-1 flex items-center z-10 group" onClick={handleCheckboxAreaClick}> <AnimatePresence>{showAutoContinueTooltip && (<motion.div initial={{ opacity: 0, y: 5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 5, scale: 0.95 }} transition={{ duration: 0.15 }} className="absolute bottom-full right-0 mb-1 p-1.5 bg-gray-900 text-white text-xs rounded shadow-lg w-max max-w-[180px] pointer-events-none" role="tooltip" id="auto-continue-tooltip">Auto-proceeds after {AUTO_CONTINUE_DELAY/1000}s</motion.div>)}</AnimatePresence> <label htmlFor="auto-continue-checkbox" className="flex items-center px-1.5 py-0.5 bg-white/80 dark:bg-black/50 rounded cursor-pointer hover:bg-white dark:hover:bg-black/70 backdrop-blur-sm transition-colors"> <input type="checkbox" id="auto-continue-checkbox" checked={isAutoContinueEnabled} onChange={handleAutoContinueChange} className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-1 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-600 dark:ring-offset-gray-800" aria-describedby={showAutoContinueTooltip ? "auto-continue-tooltip" : undefined}/> <span className="text-xs font-medium text-gray-700 dark:text-gray-200 select-none">Auto</span> </label> </div> </motion.button> </motion.div>)}</AnimatePresence>
            </motion.div>
        </motion.div>
        )}
       </AnimatePresence>
      {!currentProblem && !isComplete && (<div className="text-center py-10"><p className="text-gray-500 dark:text-gray-400">Loading exercise...</p></div>)}
    </div>
  );
};