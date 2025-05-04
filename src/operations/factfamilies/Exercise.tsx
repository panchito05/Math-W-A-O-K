import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Types
interface FactFamily {
  numbers: [number, number, number]; // The three numbers in the triangle
  operation: 'addition' | 'multiplication';
  equations: string[]; // The four equations
}

interface Settings {
  operation: 'addition' | 'multiplication';
  maxNumber: number;
  problemCount: number;
  timeLimit: number;
  maxAttempts: number;
}

interface UserAnswer {
  factFamily: FactFamily;
  answers: string[];
  isCorrect: boolean;
  timeSpent: number;
  attemptsMade: number;
}

// Constants
const DEFAULT_SETTINGS: Settings = {
  operation: 'addition',
  maxNumber: 20,
  problemCount: 10,
  timeLimit: 0,
  maxAttempts: 3
};

const AUTO_CONTINUE_DELAY = 1500;
const TOOLTIP_DISPLAY_TIME = 3000;

// Utility Functions
function generateFactFamily(operation: 'addition' | 'multiplication', maxNumber: number): FactFamily {
  let a: number, b: number, c: number;
  if (operation === 'addition') {
    // For addition, ensure a + b = c
    do {
      a = Math.floor(Math.random() * maxNumber) + 1;
      b = Math.floor(Math.random() * (maxNumber - a)) + 1;
      c = a + b;
    } while (c > maxNumber);
  } else {
    // For multiplication, ensure a × b = c
    a = Math.floor(Math.random() * Math.sqrt(maxNumber)) + 1;
    b = Math.floor(Math.random() * (maxNumber / a)) + 1;
    c = a * b;
  }

  const equations = operation === 'addition'
    ? [
        `${a} + ${b} = ${c}`,
        `${b} + ${a} = ${c}`,
        `${c} - ${b} = ${a}`,
        `${c} - ${a} = ${b}`
      ]
    : [
        `${a} × ${b} = ${c}`,
        `${b} × ${a} = ${c}`,
        `${c} ÷ ${b} = ${a}`,
        `${c} ÷ ${a} = ${b}`
      ];

  return {
    numbers: [a, b, c],
    operation,
    equations
  };
}

// Settings Component
export const FactFamiliesSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('factfamilies_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('factfamilies_settings', JSON.stringify(settings));
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: string | number;

    if (type === 'number') {
      parsedValue = parseInt(value, 10);
      if (name === 'maxNumber' && (isNaN(parsedValue) || parsedValue < 1)) {
        parsedValue = 20;
      } else if (name === 'problemCount' && (isNaN(parsedValue) || parsedValue < 1)) {
        parsedValue = 10;
      } else if (name === 'timeLimit' && (isNaN(parsedValue) || parsedValue < 0)) {
        parsedValue = 0;
      } else if (name === 'maxAttempts' && (isNaN(parsedValue) || parsedValue < 0)) {
        parsedValue = 3;
      }
    } else {
      parsedValue = value;
    }

    setSettings(prev => ({ ...prev, [name]: parsedValue }));
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Fact Families Settings</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Operation Type
          </label>
          <select
            name="operation"
            value={settings.operation}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="addition">Addition/Subtraction</option>
            <option value="multiplication">Multiplication/Division</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Maximum Number
          </label>
          <input
            type="number"
            name="maxNumber"
            min="1"
            value={settings.maxNumber}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Number of Problems
          </label>
          <input
            type="number"
            name="problemCount"
            min="1"
            value={settings.problemCount}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Max Attempts per Problem
          </label>
          <input
            type="number"
            name="maxAttempts"
            min="0"
            value={settings.maxAttempts}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Time Limit (seconds, 0 for no limit)
          </label>
          <input
            type="number"
            name="timeLimit"
            min="0"
            value={settings.timeLimit}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>
      </div>
    </div>
  );
};

// Exercise Component
export const FactFamiliesExercise: React.FC = () => {
  // State
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('factfamilies_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [currentProblem, setCurrentProblem] = useState<FactFamily | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValues, setInputValues] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isAutoContinueEnabled, setIsAutoContinueEnabled] = useState(false);
  const [showAutoContinueTooltip, setShowAutoContinueTooltip] = useState(false);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [problemStartTime] = useState(Date.now());

  // Refs
  const isSubmitting = useRef(false);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Effects
  useEffect(() => {
    const problem = generateFactFamily(settings.operation, settings.maxNumber);
    setCurrentProblem(problem);
    setInputValues(['', '', '', '']);
  }, [settings]);

  useEffect(() => {
    return () => {
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  // Handlers
  const handleInputChange = (index: number, value: string) => {
    setInputValues(prev => {
      const newValues = [...prev];
      newValues[index] = value;
      return newValues;
    });
    setError('');
  };

  const validateAnswers = () => {
    if (!currentProblem) return false;

    // Normaliza y crea conjuntos para comparar sin importar el orden
    const normalizedInputSet = new Set(
      inputValues
        .filter(eq => eq.trim()) // Ignora campos vacíos
        .map(eq => eq.replace(/\s+/g, '')) // Elimina todos los espacios
    );

    const normalizedExpectedSet = new Set(
      currentProblem.equations.map(eq => eq.replace(/\s+/g, ''))
    );

    // Verifica cantidad de ecuaciones
    if (normalizedInputSet.size !== normalizedExpectedSet.size) {
      setError(`You must enter exactly ${normalizedExpectedSet.size} unique equations.`);
      return false;
    }

    // Verifica cada ecuación contra el conjunto esperado
    let isCorrect = true;
    for (const eq of normalizedInputSet) {
      if (!normalizedExpectedSet.has(eq)) {
        isCorrect = false;
        break;
      }
    }

    return isCorrect;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProblem || isSubmitting.current) return;
    isSubmitting.current = true;
    const isCorrect = validateAnswers();
    const timeSpent = (Date.now() - problemStartTime) / 1000;
    const attemptsSoFar = currentAttempts + 1;

    if (isCorrect) {
      setFeedback({ correct: true, message: `Correct! (${attemptsSoFar} ${attemptsSoFar === 1 ? 'attempt' : 'attempts'})` });
      setUserAnswers(prev => [...prev, {
        factFamily: currentProblem,
        answers: [...inputValues],
        isCorrect: true,
        timeSpent,
        attemptsMade: attemptsSoFar
      }]);
      triggerContinuation();
    } else {
      const hasAttemptsLeft = settings.maxAttempts === 0 || attemptsSoFar < settings.maxAttempts;
      if (hasAttemptsLeft) {
        setCurrentAttempts(attemptsSoFar);
        const attemptsRemaining = settings.maxAttempts === 0 ? 'Unlimited' : settings.maxAttempts - attemptsSoFar;
        setFeedback({ correct: false, message: `Incorrect. Try again! (Attempts left: ${attemptsRemaining})` });
        isSubmitting.current = false;
      } else {
        setFeedback({ correct: false, message: 'No attempts left. Here are the correct equations:' });
        setUserAnswers(prev => [...prev, {
          factFamily: currentProblem,
          answers: [...inputValues],
          isCorrect: false,
          timeSpent,
          attemptsMade: attemptsSoFar
        }]);
        triggerContinuation();
      }
    }
  };

  const triggerContinuation = () => {
    if (currentIndex >= settings.problemCount - 1) {
      setIsComplete(true);
    } else {
      setShowContinueButton(true);
      if (isAutoContinueEnabled) {
        if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
        autoContinueTimerRef.current = setTimeout(handleContinue, AUTO_CONTINUE_DELAY);
      }
    }
  };

  const handleContinue = () => {
    if (autoContinueTimerRef.current) {
      clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = null;
    }
    if (currentIndex >= settings.problemCount - 1) {
      setIsComplete(true);
      return;
    }
    const nextProblem = generateFactFamily(settings.operation, settings.maxNumber);
    setCurrentProblem(nextProblem);
    setInputValues(['', '', '', '']);
    setCurrentIndex(prev => prev + 1);
    setCurrentAttempts(0);
    setFeedback(null);
    setError('');
    setShowContinueButton(false);
    isSubmitting.current = false;
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
      if (autoContinueTimerRef.current) {
        clearTimeout(autoContinueTimerRef.current);
        autoContinueTimerRef.current = null;
      }
    }
  };

  const handleCheckboxAreaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const restartExercise = () => {
    setSettings(prev => ({ ...prev }));
  };

  // Render Complete State
  if (isComplete) {
    const correctCount = userAnswers.filter(a => a.isCorrect).length;
    const accuracy = (correctCount / userAnswers.length) * 100;
    const totalTime = userAnswers.reduce((acc, a) => acc + a.timeSpent, 0);
    const avgTime = totalTime / userAnswers.length;
    const totalAttempts = userAnswers.reduce((acc, a) => acc + a.attemptsMade, 0);
    const avgAttempts = totalAttempts / userAnswers.length;

    return (
      <div className="max-w-lg mx-auto text-center p-4">
        <h2 className="text-2xl font-bold mb-4">Exercise Complete!</h2>
        <div className="bg-indigo-50 dark:bg-gray-900/50 p-6 rounded-lg mb-6 ring-1 ring-inset ring-indigo-100 dark:ring-gray-700">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Score</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{correctCount} / {userAnswers.length}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Accuracy</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{accuracy.toFixed(1)}%</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Avg. Time</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{avgTime.toFixed(1)}s</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
              <p className="text-sm text-gray-600 dark:text-gray-300">Avg. Attempts</p>
              <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{avgAttempts.toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-3">Problem Review</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border dark:border-gray-700 rounded-md p-2 bg-gray-50 dark:bg-gray-800/50">
            {userAnswers.map((answer, index) => (
              <div
                key={index}
                className={`p-3 rounded-md shadow-sm ${
                  answer.isCorrect
                    ? 'bg-green-100 dark:bg-green-900/30 ring-1 ring-green-200 dark:ring-green-700'
                    : 'bg-red-100 dark:bg-red-900/30 ring-1 ring-red-200 dark:ring-red-700'
                }`}
              >
                <div className="flex justify-between items-start text-sm">
                  <div className="text-left flex-grow">
                    <p className="font-medium text-gray-800 dark:text-gray-100">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">
                        (#{index + 1})
                      </span>
                      Numbers: {answer.factFamily.numbers.join(', ')}
                    </p>
                    <div className="mt-1 text-sm">
                      {answer.factFamily.equations.map((eq, i) => (
                        <p key={i} className="text-gray-600 dark:text-gray-300">
                          {answer.answers[i] || '(no answer)'} 
                          {answer.answers[i] !== eq && (
                            <span className="text-red-500 ml-2">
                              → {eq}
                            </span>
                          )}
                        </p>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Time: {answer.timeSpent.toFixed(1)}s, Attempts: {answer.attemptsMade}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <button
          onClick={restartExercise}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-900"
        >
          Start New Exercise
        </button>
      </div>
    );
  }

  // Render Main Exercise
  return (
    <div className="max-w-4xl mx-auto p-4">
      {currentProblem && (
        <>
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2 text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Problem {currentIndex + 1} of {settings.problemCount}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                Attempts: {currentAttempts} / {settings.maxAttempts === 0 ? '∞' : settings.maxAttempts}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <motion.div
                className="bg-indigo-600 h-full rounded-full"
                initial={{ width: `${(currentIndex / settings.problemCount) * 100}%` }}
                animate={{ width: `${((currentIndex + 1) / settings.problemCount) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 relative">
            {/* Triangle Display */}
            <div className="relative w-48 h-48 mx-auto mb-8">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full transform rotate-180"
              >
                <path
                  d="M50 10 L90 90 L10 90 Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-400 dark:text-gray-600"
                />
                {/* Numbers */}
                <text x="50" y="30" textAnchor="middle" className="text-2xl fill-current">
                  {currentProblem.numbers[2]}
                </text>
                <text x="25" y="80" textAnchor="middle" className="text-2xl fill-current">
                  {currentProblem.numbers[0]}
                </text>
                <text x="75" y="80" textAnchor="middle" className="text-2xl fill-current">
                  {currentProblem.numbers[1]}
                </text>
              </svg>
            </div>
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mb-6 p-4 rounded-md ${
                    feedback.correct
                      ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-200'
                  }`}
                >
                  {feedback.message}
                  {!feedback.correct && currentProblem.equations && (
                    <div className="mt-2 text-sm">
                      {currentProblem.equations.map((eq, i) => (
                        <p key={i}>{eq}</p>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            {!showContinueButton ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Equation {i + 1}
                      </label>
                      <input
                        ref={el => inputRefs.current[i] = el}
                        type="text"
                        value={inputValues[i]}
                        onChange={(e) => handleInputChange(i, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder={`Enter equation ${i + 1}`}
                      />
                    </div>
                  ))}
                </div>
                {error && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                )}
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Check Answers
                </button>
              </form>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6"
              >
                <button
                  onClick={handleContinue}
                  className="w-full px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 relative"
                >
                  <span className="relative z-0">
                    {currentIndex < settings.problemCount - 1 ? 'Continue' : 'Show Results'}
                  </span>
                  <div
                    className="absolute bottom-0 right-0 mb-1 mr-1 flex items-center z-10 group"
                    onClick={handleCheckboxAreaClick}
                  >
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
                          Auto-proceeds after {AUTO_CONTINUE_DELAY / 1000}s
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <label
                      htmlFor="auto-continue-checkbox"
                      className="flex items-center px-1.5 py-0.5 bg-white/80 dark:bg-black/50 rounded cursor-pointer hover:bg-white dark:hover:bg-black/70 backdrop-blur-sm transition-colors"
                    >
                      <input
                        type="checkbox"
                        id="auto-continue-checkbox"
                        checked={isAutoContinueEnabled}
                        onChange={handleAutoContinueChange}
                        className="h-3 w-3 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-1 dark:border-gray-600 dark:bg-gray-700 dark:focus:ring-indigo-600 dark:ring-offset-gray-800"
                      />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-200 select-none">
                        Auto
                      </span>
                    </label>
                  </div>
                </button>
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
};