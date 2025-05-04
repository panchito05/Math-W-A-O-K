import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Variable } from 'lucide-react';

// Types
interface Problem {
  type: 'evaluate' | 'solve' | 'simplify';
  question: string;
  expression: string;
  correctAnswer: string;
  variables?: Record<string, number>;
  steps?: string[];
}

interface Settings {
  problemCount: number;
  timeLimit: number;
  maxAttempts: number;
  difficulty: 1 | 2 | 3;
  topics: ('evaluate' | 'solve' | 'simplify')[];
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
  problemCount: 10,
  timeLimit: 0,
  maxAttempts: 3,
  difficulty: 1,
  topics: ['evaluate', 'solve', 'simplify']
};

const AUTO_CONTINUE_DELAY = 1500;
const TOOLTIP_DISPLAY_TIME = 3000;

// Problem Generation Functions
function generateProblem(difficulty: number, topics: string[]): Problem {
  const type = topics[Math.floor(Math.random() * topics.length)] as 'evaluate' | 'solve' | 'simplify';
  
  switch (type) {
    case 'evaluate':
      return generateEvaluationProblem(difficulty);
    case 'solve':
      return generateSolvingProblem(difficulty);
    case 'simplify':
      return generateSimplificationProblem(difficulty);
    default:
      return generateEvaluationProblem(difficulty);
  }
}

function generateEvaluationProblem(difficulty: number): Problem {
  let expression = '';
  let variables: Record<string, number> = {};
  let correctAnswer = '';
  let steps: string[] = [];

  switch (difficulty) {
    case 1:
      // Simple one-variable expressions
      const x = Math.floor(Math.random() * 10) + 1;
      const coefficient = Math.floor(Math.random() * 5) + 1;
      expression = `${coefficient}x`;
      variables = { x };
      correctAnswer = (coefficient * x).toString();
      steps = [
        `Let x = ${x}`,
        `${coefficient}x = ${coefficient} × ${x}`,
        `${coefficient}x = ${correctAnswer}`
      ];
      break;

    case 2:
      // Two-variable expressions with addition/subtraction
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      const coef1 = Math.floor(Math.random() * 5) + 1;
      const coef2 = Math.floor(Math.random() * 5) + 1;
      expression = `${coef1}a + ${coef2}b`;
      variables = { a, b };
      correctAnswer = (coef1 * a + coef2 * b).toString();
      steps = [
        `Let a = ${a}, b = ${b}`,
        `${coef1}a + ${coef2}b = (${coef1} × ${a}) + (${coef2} × ${b})`,
        `${coef1}a + ${coef2}b = ${coef1 * a} + ${coef2 * b}`,
        `${coef1}a + ${coef2}b = ${correctAnswer}`
      ];
      break;

    case 3:
      // Complex expressions with multiple operations
      const m = Math.floor(Math.random() * 10) + 1;
      const n = Math.floor(Math.random() * 10) + 1;
      expression = `${m}x² + ${n}x`;
      variables = { x: Math.floor(Math.random() * 5) + 1 };
      const x2 = variables.x;
      correctAnswer = (m * x2 * x2 + n * x2).toString();
      steps = [
        `Let x = ${x2}`,
        `${m}x² + ${n}x = ${m}(${x2})² + ${n}(${x2})`,
        `${m}x² + ${n}x = ${m}(${x2 * x2}) + ${n * x2}`,
        `${m}x² + ${n}x = ${m * x2 * x2} + ${n * x2}`,
        `${m}x² + ${n}x = ${correctAnswer}`
      ];
      break;
  }

  return {
    type: 'evaluate',
    question: `Evaluate the expression when ${Object.entries(variables).map(([key, value]) => `${key} = ${value}`).join(', ')}:`,
    expression,
    correctAnswer,
    variables,
    steps
  };
}

function generateSolvingProblem(difficulty: number): Problem {
  let expression = '';
  let correctAnswer = '';
  let steps: string[] = [];

  switch (difficulty) {
    case 1:
      // Simple one-step equations
      const x = Math.floor(Math.random() * 10) + 1;
      const coefficient = Math.floor(Math.random() * 5) + 1;
      const result = coefficient * x;
      expression = `${coefficient}x = ${result}`;
      correctAnswer = x.toString();
      steps = [
        `${coefficient}x = ${result}`,
        `x = ${result} ÷ ${coefficient}`,
        `x = ${correctAnswer}`
      ];
      break;

    case 2:
      // Two-step equations
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      const solution = Math.floor(Math.random() * 10) + 1;
      const rightSide = a * solution + b;
      expression = `${a}x + ${b} = ${rightSide}`;
      correctAnswer = solution.toString();
      steps = [
        `${a}x + ${b} = ${rightSide}`,
        `${a}x = ${rightSide} - ${b}`,
        `${a}x = ${rightSide - b}`,
        `x = ${rightSide - b} ÷ ${a}`,
        `x = ${correctAnswer}`
      ];
      break;

    case 3:
      // Multi-step equations with variables on both sides
      const c = Math.floor(Math.random() * 5) + 1;
      const d = Math.floor(Math.random() * 5) + 1;
      const e = Math.floor(Math.random() * 10) + 1;
      const f = Math.floor(Math.random() * 10) + 1;
      const sol = Math.floor(Math.random() * 10) + 1;
      expression = `${c}x + ${e} = ${d}x + ${f}`;
      correctAnswer = sol.toString();
      steps = [
        `${c}x + ${e} = ${d}x + ${f}`,
        `${c}x - ${d}x = ${f} - ${e}`,
        `${c - d}x = ${f - e}`,
        `x = ${f - e} ÷ ${c - d}`,
        `x = ${correctAnswer}`
      ];
      break;
  }

  return {
    type: 'solve',
    question: 'Solve for x:',
    expression,
    correctAnswer,
    steps
  };
}

function generateSimplificationProblem(difficulty: number): Problem {
  let expression = '';
  let correctAnswer = '';
  let steps: string[] = [];

  switch (difficulty) {
    case 1:
      // Combine like terms
      const a = Math.floor(Math.random() * 5) + 1;
      const b = Math.floor(Math.random() * 5) + 1;
      expression = `${a}x + ${b}x`;
      correctAnswer = `${a + b}x`;
      steps = [
        `${a}x + ${b}x`,
        `Combine like terms: ${a} + ${b} = ${a + b}`,
        `${correctAnswer}`
      ];
      break;

    case 2:
      // Distribute and combine like terms
      const c = Math.floor(Math.random() * 5) + 1;
      const d = Math.floor(Math.random() * 5) + 1;
      const e = Math.floor(Math.random() * 5) + 1;
      expression = `${c}(x + ${d}) + ${e}x`;
      correctAnswer = `${c + e}x + ${c * d}`;
      steps = [
        `${c}(x + ${d}) + ${e}x`,
        `${c}x + ${c * d} + ${e}x`,
        `Combine like terms: ${c}x + ${e}x = ${c + e}x`,
        `${correctAnswer}`
      ];
      break;

    case 3:
      // Complex expressions with multiple variables
      const f = Math.floor(Math.random() * 5) + 1;
      const g = Math.floor(Math.random() * 5) + 1;
      const h = Math.floor(Math.random() * 5) + 1;
      const i = Math.floor(Math.random() * 5) + 1;
      expression = `${f}x + ${g}y + ${h}x - ${i}y`;
      correctAnswer = `${f + h}x + ${g - i}y`;
      steps = [
        `${f}x + ${g}y + ${h}x - ${i}y`,
        `Combine like terms:`,
        `${f}x + ${h}x = ${f + h}x`,
        `${g}y - ${i}y = ${g - i}y`,
        `${correctAnswer}`
      ];
      break;
  }

  return {
    type: 'simplify',
    question: 'Simplify the expression:',
    expression,
    correctAnswer,
    steps
  };
}

// Settings Component
export const PreAlgebraSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('prealgebra_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('prealgebra_settings', JSON.stringify(settings));
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      const topic = name as 'evaluate' | 'solve' | 'simplify';
      
      // Ensure at least one topic is selected
      const newTopics = checkbox.checked
        ? [...settings.topics, topic]
        : settings.topics.filter(t => t !== topic);
      
      if (newTopics.length > 0) {
        setSettings(prev => ({ ...prev, topics: newTopics }));
      }
    } else {
      let parsedValue: number | string[] = parseInt(value, 10);
      
      if (name === 'difficulty') {
        parsedValue = Math.max(1, Math.min(3, parsedValue)) as 1 | 2 | 3;
      } else if (name === 'problemCount') {
        parsedValue = Math.max(1, parsedValue);
      } else if (name === 'timeLimit') {
        parsedValue = Math.max(0, parsedValue);
      } else if (name === 'maxAttempts') {
        parsedValue = Math.max(0, parsedValue);
      }
      
      setSettings(prev => ({ ...prev, [name]: parsedValue }));
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Pre-Algebra Settings</h2>
      <div className="space-y-6">
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
            <span>Basic</span>
            <span>Intermediate</span>
            <span>Advanced</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Topics
          </label>
          <div className="space-y-2">
            {['evaluate', 'solve', 'simplify'].map(topic => (
              <label key={topic} className="flex items-center">
                <input
                  type="checkbox"
                  name={topic}
                  checked={settings.topics.includes(topic as any)}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  disabled={settings.topics.length === 1 && settings.topics.includes(topic as any)}
                />
                <span className="ml-2 text-gray-700 dark:text-gray-300 capitalize">
                  {topic} expressions
                </span>
              </label>
            ))}
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
export const PreAlgebraExercise: React.FC = () => {
  // State
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('prealgebra_settings');
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
    const problem = generateProblem(settings.difficulty, settings.topics);
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

  const validateAnswer = (answer: string, correctAnswer: string): boolean => {
    // Remove all whitespace and make case-insensitive
    const normalizedAnswer = answer.replace(/\s+/g, '').toLowerCase();
    const normalizedCorrect = correctAnswer.replace(/\s+/g, '').toLowerCase();
    return normalizedAnswer === normalizedCorrect;
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

    const nextProblem = generateProblem(settings.difficulty, settings.topics);
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
                      {answer.problem.question}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 mt-1 font-mono">
                      {answer.problem.expression}
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
            <div className="flex items-center justify-center gap-2 mb-6">
              <Variable className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                {currentProblem.type.charAt(0).toUpperCase() + currentProblem.type.slice(1)}
              </h2>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300 mb-2">{currentProblem.question}</p>
              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg font-mono text-lg text-center">
                {currentProblem.expression}
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
                    type="text"
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