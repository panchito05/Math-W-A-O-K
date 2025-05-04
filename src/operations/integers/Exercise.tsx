import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Plus, Minus, X, Divide } from 'lucide-react';

// Types
interface Problem {
  num1: number;
  num2: number;
  operator: '+' | '-' | '×' | '÷';
  correctAnswer: number;
  steps: string[];
}

interface Settings {
  operations: ('+' | '-' | '×' | '÷')[];
  difficulty: 1 | 2 | 3;
  problemCount: number;
  timeLimit: number;
  maxAttempts: number;
}

interface UserAnswer {
  problem: Problem;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
  attemptsMade: number;
}

// Constants
const DEFAULT_SETTINGS: Settings = {
  operations: ['+', '-', '×', '÷'],
  difficulty: 1,
  problemCount: 10,
  timeLimit: 0,
  maxAttempts: 3
};

const AUTO_CONTINUE_DELAY = 1500;
const TOOLTIP_DISPLAY_TIME = 3000;

// Utility Functions
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateProblem(difficulty: number, operations: ('+' | '-' | '×' | '÷')[]): Problem {
  let num1: number, num2: number;
  const operator = operations[Math.floor(Math.random() * operations.length)];
  const steps: string[] = [];

  // Generate numbers based on difficulty
  switch (difficulty) {
    case 1: // Small integers (-10 to 10, excluding 0)
      num1 = getRandomInt(-10, 10);
      num2 = getRandomInt(-10, 10);
      while (num1 === 0) num1 = getRandomInt(-10, 10);
      while (num2 === 0) num2 = getRandomInt(-10, 10);
      break;
    case 2: // Medium integers (-50 to 50, excluding 0)
      num1 = getRandomInt(-50, 50);
      num2 = getRandomInt(-50, 50);
      while (num1 === 0) num1 = getRandomInt(-50, 50);
      while (num2 === 0) num2 = getRandomInt(-50, 50);
      break;
    case 3: // Large integers (-100 to 100, excluding 0)
      num1 = getRandomInt(-100, 100);
      num2 = getRandomInt(-100, 100);
      while (num1 === 0) num1 = getRandomInt(-100, 100);
      while (num2 === 0) num2 = getRandomInt(-100, 100);
      break;
    default:
      num1 = getRandomInt(-10, 10);
      num2 = getRandomInt(-10, 10);
  }

  let correctAnswer: number;
  steps.push(`Start with ${num1} ${operator} ${num2}`);

  switch (operator) {
    case '+':
      correctAnswer = num1 + num2;
      if (num2 < 0) {
        steps.push(`Adding a negative number is the same as subtracting its positive value`);
        steps.push(`${num1} + (${num2}) = ${num1} - ${Math.abs(num2)}`);
      } else if (num1 < 0 && num2 > 0) {
        steps.push(`When adding a positive to a negative, subtract the smaller absolute value from the larger`);
        if (Math.abs(num1) > num2) {
          steps.push(`|${num1}| > ${num2}, so the result will be negative`);
        } else {
          steps.push(`|${num1}| < ${num2}, so the result will be positive`);
        }
      }
      break;

    case '-':
      correctAnswer = num1 - num2;
      if (num2 < 0) {
        steps.push(`Subtracting a negative number is the same as adding its positive value`);
        steps.push(`${num1} - (${num2}) = ${num1} + ${Math.abs(num2)}`);
      }
      break;

    case '×':
      correctAnswer = num1 * num2;
      steps.push(`When multiplying integers:`);
      steps.push(`• Positive × Positive = Positive`);
      steps.push(`• Negative × Negative = Positive`);
      steps.push(`• Positive × Negative = Negative`);
      steps.push(`In this case: ${num1 < 0 ? 'negative' : 'positive'} × ${num2 < 0 ? 'negative' : 'positive'} = ${correctAnswer < 0 ? 'negative' : 'positive'}`);
      break;

    case '÷':
      // Ensure division results in an integer
      correctAnswer = num1 / num2;
      if (!Number.isInteger(correctAnswer)) {
        // Adjust num1 to make division result in an integer
        num1 = num2 * Math.floor(correctAnswer);
        correctAnswer = num1 / num2;
      }
      steps.push(`When dividing integers:`);
      steps.push(`• Positive ÷ Positive = Positive`);
      steps.push(`• Negative ÷ Negative = Positive`);
      steps.push(`• Positive ÷ Negative = Negative`);
      steps.push(`• Negative ÷ Positive = Negative`);
      steps.push(`In this case: ${num1 < 0 ? 'negative' : 'positive'} ÷ ${num2 < 0 ? 'negative' : 'positive'} = ${correctAnswer < 0 ? 'negative' : 'positive'}`);
      break;

    default:
      correctAnswer = 0;
  }

  steps.push(`Therefore, ${num1} ${operator} ${num2} = ${correctAnswer}`);

  return {
    num1,
    num2,
    operator,
    correctAnswer,
    steps
  };
}

// Settings Component
export const IntegerSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('integers_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('integers_settings', JSON.stringify(settings));
  }, [settings]);

  const handleOperationToggle = (op: '+' | '-' | '×' | '÷') => {
    setSettings(prev => {
      const newOps = prev.operations.includes(op)
        ? prev.operations.filter(o => o !== op)
        : [...prev.operations, op];
      
      // Ensure at least one operation is selected
      return newOps.length > 0
        ? { ...prev, operations: newOps }
        : prev;
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    let parsedValue: number;

    if (type === 'number') {
      parsedValue = parseInt(value, 10);
      if (name === 'difficulty') {
        parsedValue = Math.max(1, Math.min(3, parsedValue));
      } else if (name === 'problemCount') {
        parsedValue = Math.max(1, parsedValue);
      } else if (name === 'timeLimit') {
        parsedValue = Math.max(0, parsedValue);
      } else if (name === 'maxAttempts') {
        parsedValue = Math.max(0, parsedValue);
      }
    } else {
      return;
    }

    setSettings(prev => ({ ...prev, [name]: parsedValue }));
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Integer Operations Settings</h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Operations
          </label>
          <div className="grid grid-cols-2 gap-2">
            {([
              { op: '+' as const, icon: Plus, label: 'Addition' },
              { op: '-' as const, icon: Minus, label: 'Subtraction' },
              { op: '×' as const, icon: X, label: 'Multiplication' },
              { op: '÷' as const, icon: Divide, label: 'Division' }
            ]).map(({ op, icon: Icon, label }) => (
              <button
                key={op}
                onClick={() => handleOperationToggle(op)}
                className={`p-3 rounded-lg flex items-center justify-center gap-2 ${
                  settings.operations.includes(op)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                } ${settings.operations.length === 1 && settings.operations.includes(op) ? 'cursor-not-allowed opacity-50' : 'hover:bg-indigo-500 hover:text-white'}`}
                disabled={settings.operations.length === 1 && settings.operations.includes(op)}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Difficulty Level
          </label>
          <input
            type="range"
            name="difficulty"
            min="1"
            max="3"
            value={settings.difficulty}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>Easy (-10 to 10)</span>
            <span>Medium (-50 to 50)</span>
            <span>Hard (-100 to 100)</span>
          </div>
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
export const IntegerExercise: React.FC = () => {
  // State
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('integers_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isAutoContinueEnabled, setIsAutoContinueEnabled] = useState(false);
  const [showAutoContinueTooltip, setShowAutoContinueTooltip] = useState(false);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [showSteps, setShowSteps] = useState(false);
  const [problemStartTime] = useState(Date.now());

  // Refs
  const isSubmitting = useRef(false);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Effects
  useEffect(() => {
    const problem = generateProblem(settings.difficulty, settings.operations);
    setCurrentProblem(problem);
    setInputValue('');
    setShowSteps(false);
  }, [settings]);

  useEffect(() => {
    return () => {
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  // Handlers
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setError('');
  };

  const validateAnswer = (answer: string, correctAnswer: number): boolean => {
    const numericAnswer = parseInt(answer, 10);
    return !isNaN(numericAnswer) && numericAnswer === correctAnswer;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProblem || isSubmitting.current) return;

    isSubmitting.current = true;
    setError('');

    if (!inputValue.trim()) {
      setError('Please enter an answer');
      isSubmitting.current = false;
      return;
    }

    if (isNaN(parseInt(inputValue, 10))) {
      setError('Please enter a valid integer');
      isSubmitting.current = false;
      return;
    }

    const timeSpent = (Date.now() - problemStartTime) / 1000;
    const attemptsSoFar = currentAttempts + 1;
    const isCorrect = validateAnswer(inputValue, currentProblem.correctAnswer);

    if (isCorrect) {
      setFeedback({
        correct: true,
        message: `Correct! (${attemptsSoFar} ${attemptsSoFar === 1 ? 'attempt' : 'attempts'})`
      });
      setUserAnswers(prev => [...prev, {
        problem: currentProblem,
        answer: inputValue,
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
        setFeedback({
          correct: false,
          message: `Incorrect. Try again! (Attempts left: ${attemptsRemaining})`
        });
        setShowSteps(true);
        isSubmitting.current = false;
      } else {
        setFeedback({
          correct: false,
          message: `Incorrect. The correct answer is: ${currentProblem.correctAnswer}`
        });
        setUserAnswers(prev => [...prev, {
          problem: currentProblem,
          answer: inputValue,
          isCorrect: false,
          timeSpent,
          attemptsMade: attemptsSoFar
        }]);
        setShowSteps(true);
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

    const nextProblem = generateProblem(settings.difficulty, settings.operations);
    setCurrentProblem(nextProblem);
    setInputValue('');
    setCurrentIndex(prev => prev + 1);
    setCurrentAttempts(0);
    setFeedback(null);
    setError('');
    setShowContinueButton(false);
    setShowSteps(false);
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
                      {answer.problem.num1} {answer.problem.operator} {answer.problem.num2}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      Your answer: {answer.answer}
                      {!answer.isCorrect && (
                        <span className="text-red-500 ml-2">
                          → {answer.problem.correctAnswer}
                        </span>
                      )}
                    </p>
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
            <div className="mb-6">
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg font-mono text-2xl text-center">
                {currentProblem.num1} {currentProblem.operator} {currentProblem.num2} = ?
              </div>
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
                </motion.div>
              )}
            </AnimatePresence>

            {showSteps && currentProblem.steps && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-md"
              >
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Solution Steps:</h3>
                <div className="space-y-1 font-mono text-sm text-blue-700 dark:text-blue-300">
                  {currentProblem.steps.map((step, index) => (
                    <p key={index}>{step}</p>
                  ))}
                </div>
              </motion.div>
            )}

            {!showContinueButton ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Your Answer
                  </label>
                  <input
                    ref={inputRef}
                    type="number"
                    value={inputValue}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter your answer"
                  />
                </div>

                {error && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                )}

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Check Answer
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