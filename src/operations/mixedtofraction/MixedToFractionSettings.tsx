import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowRight, Eye, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

// Types
interface MixedNumber {
  whole: number;
  numerator: number;
  denominator: number;
}

interface Fraction {
  numerator: number;
  denominator: number;
}

interface Problem {
  mixedNumber: MixedNumber;
  correctAnswer: Fraction;
}

interface UserAnswer {
  problem: Problem;
  answer: Fraction | null;
  isCorrect: boolean;
  wasRevealed: boolean;
  timeSpent: number;
  attemptsMade: number;
}

interface Settings {
  difficulty: 1 | 2 | 3;
  problemCount: number;
  timeLimit: number;
  maxAttempts: number;
  adaptiveDifficulty: boolean;
  enableCompensation: boolean;
  autoContinue: boolean;
  language: 'english' | 'spanish'; // Added language setting
}

// Constants
const MAX_DIFFICULTY = 3;
const CORRECT_STREAK_THRESHOLD = 10;
const AUTO_CONTINUE_DELAY = 1500;
const TOOLTIP_DISPLAY_TIME = 3000;

// Utils
function generateMixedNumber(difficulty: number): MixedNumber {
  let maxWhole: number, maxNumerator: number, maxDenominator: number;

  switch (difficulty) {
    case 1:
      maxWhole = 10;
      maxNumerator = 5;
      maxDenominator = 10;
      break;
    case 2:
      maxWhole = 20;
      maxNumerator = 10;
      maxDenominator = 20;
      break;
    case 3:
      maxWhole = 50;
      maxNumerator = 20;
      maxDenominator = 50;
      break;
    default:
      maxWhole = 10;
      maxNumerator = 5;
      maxDenominator = 10;
  }

  const whole = Math.floor(Math.random() * maxWhole) + 1;
  const numerator = Math.floor(Math.random() * maxNumerator) + 1;
  let denominator: number;

  do {
    denominator = Math.floor(Math.random() * maxDenominator) + 2;
  } while (denominator <= numerator);

  return { whole, numerator, denominator };
}

function generateProblem(difficulty: number): Problem {
  const mixedNumber = generateMixedNumber(difficulty);
  const correctAnswer = convertMixedToFraction(mixedNumber);
  return { mixedNumber, correctAnswer };
}

function convertMixedToFraction(mixedNumber: MixedNumber): Fraction {
  const numerator = mixedNumber.whole * mixedNumber.denominator + mixedNumber.numerator;
  return {
    numerator,
    denominator: mixedNumber.denominator
  };
}

function simplifyFraction(fraction: Fraction): Fraction {
  const gcd = (a: number, b: number): number => {
    if (!b) return a;
    return gcd(b, a % b);
  };

  const divisor = gcd(fraction.numerator, fraction.denominator);
  return {
    numerator: fraction.numerator / divisor,
    denominator: fraction.denominator / divisor
  };
}

function checkAnswer(answer: Fraction, correctAnswer: Fraction): boolean {
  const simplifiedAnswer = simplifyFraction(answer);
  const simplifiedCorrect = simplifyFraction(correctAnswer);
  return (
    simplifiedAnswer.numerator === simplifiedCorrect.numerator &&
    simplifiedAnswer.denominator === simplifiedCorrect.denominator
  );
}

// Settings Component
const DEFAULT_SETTINGS: Settings = {
  difficulty: 1,
  problemCount: 10,
  timeLimit: 0,
  maxAttempts: 3,
  adaptiveDifficulty: true,
  enableCompensation: false,
  autoContinue: true,
  language: 'english' // Default language setting
};

export const MixedToFractionSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('mixedtofraction_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('mixedtofraction_settings', JSON.stringify(settings));
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);

    if (name === 'difficulty') {
      setSettings(prev => ({ ...prev, difficulty: Math.max(1, Math.min(3, numValue)) as 1 | 2 | 3 }));
    } else if (name === 'problemCount') {
      setSettings(prev => ({ ...prev, problemCount: Math.max(1, numValue) }));
    } else if (name === 'timeLimit') {
      setSettings(prev => ({ ...prev, timeLimit: Math.max(0, numValue) }));
    } else if (name === 'maxAttempts') {
      setSettings(prev => ({ ...prev, maxAttempts: Math.max(0, numValue) }));
    } else if (name === 'adaptiveDifficulty' || name === 'enableCompensation' || name === 'autoContinue') {
      setSettings(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'language') {
      setSettings(prev => ({ ...prev, language: value as 'english' | 'spanish' }));
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {settings.language === 'english' ? 'Mixed Numbers to Fractions Settings' : 'Configuración de Números Mixtos a Fracciones'}
      </h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Difficulty Level' : 'Nivel de Dificultad'} ({settings.difficulty})
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
            <span>{settings.language === 'english' ? 'Basic' : 'Básico'}</span>
            <span>{settings.language === 'english' ? 'Intermediate' : 'Intermedio'}</span>
            <span>{settings.language === 'english' ? 'Advanced' : 'Avanzado'}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Number of Problems' : 'Número de Problemas'}
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
            {settings.language === 'english' ? 'Time Limit (seconds, 0 for no limit)' : 'Límite de Tiempo (segundos, 0 para sin límite)'}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Max Attempts per Problem (0 for unlimited)' : 'Máximo de Intentos por Problema (0 para ilimitado)'}
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

        <div className="flex items-center">
          <input
            type="checkbox"
            id="adaptiveDifficulty"
            name="adaptiveDifficulty"
            checked={settings.adaptiveDifficulty}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="adaptiveDifficulty" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {settings.language === 'english' ? 'Enable Adaptive Difficulty (Increases level after 10 correct in a row)' : 'Habilitar Dificultad Adaptativa (Aumenta el nivel después de 10 respuestas correctas consecutivas)'}
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="enableCompensation"
            name="enableCompensation"
            checked={settings.enableCompensation}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="enableCompensation" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {settings.language === 'english' ? 'Enable Compensation (Add 1 problem for each incorrect/revealed)' : 'Habilitar Compensación (Añadir 1 problema por cada incorrecto/revelado)'}
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoContinue"
            name="autoContinue"
            checked={settings.autoContinue}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="autoContinue" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {settings.language === 'english' ? 'Auto-Continue (Automatically advance after correct answer)' : 'Auto-Continuar (Avanzar automáticamente después de una respuesta correcta)'}
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Language' : 'Idioma'}
          </label>
          <select
            name="language"
            value={settings.language}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="english">{settings.language === 'english' ? 'English' : 'Inglés'}</option>
            <option value="spanish">{settings.language === 'english' ? 'Spanish' : 'Español'}</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Exercise Component
export const MixedToFractionExercise: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('mixedtofraction_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [intermediateResult, setIntermediateResult] = useState<number | null>(null);
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [targetProblemCount, setTargetProblemCount] = useState(settings.problemCount);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [showAutoContinueTooltip, setShowAutoContinueTooltip] = useState(false);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTime = useRef(Date.now());

  // Initialize first problem
  useEffect(() => {
    const newProblem = generateProblem(settings.difficulty);
    setCurrentProblem(newProblem);
    startTime.current = Date.now();
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
    };
  }, []);

  // Auto-continue effect - only for correct answers
  useEffect(() => {
    if (showFeedback && settings.autoContinue && isCorrect && !isAnswerRevealed) {
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = setTimeout(handleContinue, AUTO_CONTINUE_DELAY);
    }

    return () => {
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
    };
  }, [showFeedback, settings.autoContinue, isCorrect, isAnswerRevealed]);

  // Handle auto-continue toggle
  const handleAutoContinueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, autoContinue: e.target.checked }));
    if (e.target.checked) {
      setShowAutoContinueTooltip(true);
      tooltipTimerRef.current = setTimeout(() => setShowAutoContinueTooltip(false), TOOLTIP_DISPLAY_TIME);
    }
  };

  // Generate next problem
  const handleContinue = () => {
    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);

    if (currentIndex < targetProblemCount - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentProblem(generateProblem(settings.difficulty));
      setNumerator('');
      setDenominator('');
      setShowSteps(false);
      setCurrentStep(0);
      setIntermediateResult(null);
      setCurrentAttempts(0);
      setShowContinueButton(false);
      setShowFeedback(false);
      setIsAnswerRevealed(false);
      setIsCorrect(false);
      startTime.current = Date.now();
      if (inputRef.current) inputRef.current.focus();
    } else {
      setIsComplete(true);
    }
  };

  // Review mode handlers
  const handleEnterReview = () => {
    if (userAnswers.length === 0) return;
    setIsReviewMode(true);
    setReviewIndex(userAnswers.length - 1);
  };

  const handleExitReview = () => {
    setIsReviewMode(false);
  };

  const handleReviewNext = () => {
    setReviewIndex(prev => Math.min(prev + 1, userAnswers.length - 1));
  };

  const handleReviewPrev = () => {
    setReviewIndex(prev => Math.max(prev - 1, 0));
  };

  const calculateIntermediateResult = (problem: Problem) => {
    const { whole, denominator } = problem.mixedNumber;
    return whole * denominator;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProblem) return;

    const numValue = parseInt(numerator, 10);
    const denValue = parseInt(denominator, 10);

    if (isNaN(numValue) || isNaN(denValue) || denValue === 0) {
      toast.error(settings.language === 'english' ? 'Please enter valid numbers. Denominator cannot be zero.' : 'Por favor, ingrese números válidos. El denominador no puede ser cero.');
      return;
    }

    const userAnswer: Fraction = { numerator: numValue, denominator: denValue };
    const timeSpent = (Date.now() - startTime.current) / 1000;
    const attemptsSoFar = currentAttempts + 1;
    const correct = checkAnswer(userAnswer, currentProblem.correctAnswer);

    console.log(`Attempt ${attemptsSoFar}/${settings.maxAttempts === 0 ? '∞' : settings.maxAttempts}, Correct: ${correct}`);
    
    setCurrentAttempts(attemptsSoFar);
    setIsCorrect(correct);
    setShowFeedback(true);

    // Only show steps for correct answers or when max attempts are reached
    const hasReachedMaxAttempts = settings.maxAttempts > 0 && attemptsSoFar >= settings.maxAttempts;
    if (correct || hasReachedMaxAttempts) {
      setShowSteps(true);
      setIntermediateResult(calculateIntermediateResult(currentProblem));
    }

    // Update consecutive correct answers
    if (correct && settings.adaptiveDifficulty) {
      const newStreak = consecutiveCorrectAnswers + 1;
      setConsecutiveCorrectAnswers(newStreak);

      if (newStreak >= CORRECT_STREAK_THRESHOLD && settings.difficulty < MAX_DIFFICULTY) {
        const newDifficulty = (settings.difficulty + 1) as 1 | 2 | 3;
        setSettings(prev => ({ ...prev, difficulty: newDifficulty }));
        setConsecutiveCorrectAnswers(0);
        toast.info(settings.language === 'english' ? `Level Up! Difficulty increased to ${newDifficulty}` : `¡Subió de nivel! La dificultad aumentó a ${newDifficulty}`);
      }
    } else if (!correct && settings.adaptiveDifficulty) {
      setConsecutiveCorrectAnswers(0);
    }

    if (correct) {
      toast.success(settings.language === 'english' ? 'Correct!' : '¡Correcto!');
      setUserAnswers(prev => [...prev, {
        problem: currentProblem,
        answer: userAnswer,
        isCorrect: true,
        wasRevealed: false,
        timeSpent,
        attemptsMade: attemptsSoFar
      }]);
      
      // For correct answers, show continue button if auto-continue is disabled
      if (!settings.autoContinue) {
        setShowContinueButton(true);
      }
      // If auto-continue, the useEffect will handle it
    } else {
      // Check if we've reached the maximum attempts
      const hasReachedMaxAttempts = settings.maxAttempts > 0 && attemptsSoFar >= settings.maxAttempts;
      console.log(`Has reached max attempts: ${hasReachedMaxAttempts} (${attemptsSoFar} >= ${settings.maxAttempts})`);
      
      if (hasReachedMaxAttempts) {
        toast.error(settings.language === 'english' 
          ? `Incorrect. The correct answer was ${currentProblem.correctAnswer.numerator}/${currentProblem.correctAnswer.denominator}` 
          : `Incorrecto. La respuesta correcta era ${currentProblem.correctAnswer.numerator}/${currentProblem.correctAnswer.denominator}`);
        
        setUserAnswers(prev => [...prev, {
          problem: currentProblem,
          answer: userAnswer,
          isCorrect: false,
          wasRevealed: false,
          timeSpent,
          attemptsMade: attemptsSoFar
        }]);

        if (settings.enableCompensation) {
          setTargetProblemCount(prev => prev + 1);
          toast.info(settings.language === 'english' 
            ? "Incorrect answer, adding one more problem." 
            : "Respuesta incorrecta, se añade un problema más.");
        }
        
        // Always show continue button after max attempts reached
        setShowContinueButton(true);
        
        // Cancel auto-continue if it was set
        if (autoContinueTimerRef.current) {
          clearTimeout(autoContinueTimerRef.current);
          autoContinueTimerRef.current = null;
        }
      } else {
        toast.error(settings.language === 'english' ? 'Incorrect. Try again!' : 'Incorrecto. ¡Inténtalo de nuevo!');
      }
    }
  };

  const handleShowAnswer = () => {
    if (!currentProblem || isAnswerRevealed) return;

    setIsAnswerRevealed(true);
    const timeSpent = (Date.now() - startTime.current) / 1000;
    const attemptsCounted = settings.maxAttempts > 0 ? settings.maxAttempts : 1;

    setUserAnswers(prev => [...prev, {
      problem: currentProblem,
      answer: null,
      isCorrect: false,
      wasRevealed: true,
      timeSpent,
      attemptsMade: attemptsCounted
    }]);

    if (settings.enableCompensation) {
      setTargetProblemCount(prev => prev + 1);
      toast.info(settings.language === 'english' ? "Revealed answer, adding one more problem." : "Respuesta revelada, se añade un problema más.");
    }

    setShowSteps(true);
    setIntermediateResult(calculateIntermediateResult(currentProblem));
    setShowContinueButton(true);

    if (settings.adaptiveDifficulty) {
      setConsecutiveCorrectAnswers(0);
    }
    
    // Cancel any auto-continue in progress
    if (autoContinueTimerRef.current) {
      clearTimeout(autoContinueTimerRef.current);
      autoContinueTimerRef.current = null;
    }
  };

  const restartExercise = () => {
    setCurrentIndex(0);
    setCurrentProblem(generateProblem(settings.difficulty));
    setNumerator('');
    setDenominator('');
    setShowSteps(false);
    setCurrentStep(0);
    setIntermediateResult(null);
    setUserAnswers([]);
    setIsComplete(false);
    setCurrentAttempts(0);
    setShowFeedback(false);
    setIsAnswerRevealed(false);
    setConsecutiveCorrectAnswers(0);
    setTargetProblemCount(settings.problemCount);
    startTime.current = Date.now();
  };

  if (isComplete) {
    const totalCorrect = userAnswers.filter(a => a.isCorrect).length;
    const accuracy = (totalCorrect / userAnswers.length) * 100;
    const avgTime = userAnswers.reduce((acc, curr) => acc + curr.timeSpent, 0) / userAnswers.length;

    return (
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">
          {settings.language === 'english' ? 'Exercise Complete!' : '¡Ejercicio Completado!'}
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 dark:text-indigo-300">
                {settings.language === 'english' ? 'Score' : 'Puntuación'}
              </p>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">
                {totalCorrect}/{userAnswers.length}
              </p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 dark:text-indigo-300">
                {settings.language === 'english' ? 'Accuracy' : 'Precisión'}
              </p>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">
                {accuracy.toFixed(1)}%
              </p>
            </div>
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 dark:text-indigo-300">
                {settings.language === 'english' ? 'Avg. Time' : 'Tiempo Promedio'}
              </p>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">
                {avgTime.toFixed(1)}s
              </p>
            </div>
          </div>
          <button
            onClick={restartExercise}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mx-auto"
          >
            <RotateCcw size={18} />
            {settings.language === 'english' ? 'Try Again' : 'Intentar de Nuevo'}
          </button>
        </div>
      </div>
    );
  }

  if (!currentProblem) return null;

  // Render review screen
  if (isReviewMode && userAnswers.length > 0) {
    const reviewAnswer = userAnswers[reviewIndex];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl z-20 flex flex-col shadow-2xl border dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold mb-4 text-center text-gray-700 dark:text-gray-200">
          {settings.language === 'english' ? `Reviewing Problem ${reviewIndex + 1} / ${userAnswers.length}` : `Revisando Problema ${reviewIndex + 1} / ${userAnswers.length}`}
        </h3>

        <div className="text-center mb-6">
          <div className="mb-6">
            <p className="text-xl text-red-600 dark:text-red-400 mb-2">
              {settings.language === 'english' ? 'Mixed Number' : 'Número Mixto'}
            </p>
            <div className="text-4xl font-bold flex items-center justify-center space-x-2">
              <span className="text-green-600 dark:text-green-400">
                {reviewAnswer.problem.mixedNumber.whole}
              </span>
              <span className="flex flex-col items-center mx-2">
                <span className="text-yellow-600 dark:text-yellow-400">
                  {reviewAnswer.problem.mixedNumber.numerator}
                </span>
                <div className="w-8 h-0.5 bg-current my-1"></div>
                <span className="text-cyan-600 dark:text-cyan-400">
                  {reviewAnswer.problem.mixedNumber.denominator}
                </span>
              </span>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xl text-red-600 dark:text-red-400 mb-2">
              {settings.language === 'english' ? 'Your Answer' : 'Tu Respuesta'}
            </p>
            {reviewAnswer.answer ? (
              <div className={`text-4xl font-bold flex items-center justify-center space-x-2 ${
                reviewAnswer.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                <span className="flex flex-col items-center">
                  <span>{reviewAnswer.answer.numerator}</span>
                  <div className="w-8 h-0.5 bg-current my-1"></div>
                  <span>{reviewAnswer.answer.denominator}</span>
                </span>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                {settings.language === 'english' ? 'No answer submitted' : 'No se envió ninguna respuesta'}
              </p>
            )}
          </div>

          {(!reviewAnswer.isCorrect || reviewAnswer.wasRevealed) && (
            <div className="mb-6">
              <p className="text-xl text-red-600 dark:text-red-400 mb-2">
                {settings.language === 'english' ? 'Correct Answer' : 'Respuesta Correcta'}
              </p>
              <div className="text-4xl font-bold flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                <span className="flex flex-col items-center">
                  <span>{reviewAnswer.problem.correctAnswer.numerator}</span>
                  <div className="w-8 h-0.5 bg-current my-1"></div>
                  <span>{reviewAnswer.problem.correctAnswer.denominator}</span>
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto flex justify-between items-center pt-4">
          <button
            onClick={handleReviewPrev}
            disabled={reviewIndex === 0}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 flex items-center gap-1 transition-colors"
            aria-label={settings.language === 'english' ? 'Previous Problem' : 'Problema Anterior'}
          >
            <ArrowLeft size={14} />
            {settings.language === 'english' ? 'Prev' : 'Ant'}
          </button>
          <button
            onClick={handleExitReview}
            className="px-4 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            {settings.language === 'english' ? 'Return' : 'Volver'}
          </button>
          <button
            onClick={handleReviewNext}
            disabled={reviewIndex === userAnswers.length - 1}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 flex items-center gap-1 transition-colors"
            aria-label={settings.language === 'english' ? 'Next Problem' : 'Siguiente Problema'}
          >
            {settings.language === 'english' ? 'Next' : 'Sig'}
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    );
  }

  // Check if max attempts have been reached to determine UI state
  const hasReachedMaxAttempts = settings.maxAttempts > 0 && currentAttempts >= settings.maxAttempts;

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2 text-sm">
          <button
            onClick={handleEnterReview}
            disabled={userAnswers.length === 0}
            className="p-1 text-gray-500 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label={settings.language === 'english' ? 'Review Previous Problems' : 'Revisar Problemas Anteriores'}
            title={settings.language === 'english' ? 'Review Previous Problems' : 'Revisar Problemas Anteriores'}
          >
            <Eye size={18} />
          </button>
          <span className="text-sm font-medium">
            {settings.language === 'english' ? `Problem ${currentIndex + 1} of ${targetProblemCount}` : `Problema ${currentIndex + 1} de ${targetProblemCount}`}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {settings.language === 'english' ? `Attempts: ${currentAttempts}/${settings.maxAttempts === 0 ? '∞' : settings.maxAttempts}` : `Intentos: ${currentAttempts}/${settings.maxAttempts === 0 ? '∞' : settings.maxAttempts}`}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / targetProblemCount) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-4 text-pink-600 dark:text-pink-400">
            {settings.language === 'english' ? 'Convert Mixed Number to Fraction' : 'Convertir Número Mixto a Fracción'}
          </h2>

          <div className="mb-6">
            <p className="text-xl text-red-600 dark:text-red-400 mb-2">
              {settings.language === 'english' ? 'Mixed Number' : 'Número Mixto'}
            </p>
            <div className="text-4xl font-bold flex items-center justify-center space-x-2">
              <span className="text-green-600 dark:text-green-400">{currentProblem.mixedNumber.whole}</span>
              <span className="flex flex-col items-center mx-2">
                <span className="text-yellow-600 dark:text-yellow-400">{currentProblem.mixedNumber.numerator}</span>
                <div className="w-8 h-0.5 bg-current my-1"></div>
                <span className="text-cyan-600 dark:text-cyan-400">{currentProblem.mixedNumber.denominator}</span>
              </span>
            </div>
          </div>

          {showSteps && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-6 text-left"
            >
              <div>
                <p className="text-xl text-pink-600 dark:text-pink-400 mb-2">
                  {settings.language === 'english'
                    ? `Multiply the whole number ${currentProblem.mixedNumber.whole} by the denominator ${currentProblem.mixedNumber.denominator}`
                    : `Multiplica el número entero ${currentProblem.mixedNumber.whole} por el denominador ${currentProblem.mixedNumber.denominator}`}
                </p>
                <div className="text-2xl font-bold flex items-center space-x-2">
                  <span className="text-green-600 dark:text-green-400">{currentProblem.mixedNumber.whole}</span>
                  <span className="text-gray-600 dark:text-gray-400">×</span>
                  <span className="text-cyan-600 dark:text-cyan-400">{currentProblem.mixedNumber.denominator}</span>
                  <span className="text-gray-600 dark:text-gray-400">=</span>
                  <span className="text-yellow-600 dark:text-yellow-400">{intermediateResult}</span>
                </div>
              </div>

              <div>
                <p className="text-xl text-pink-600 dark:text-pink-400 mb-2">
                  {settings.language === 'english'
                    ? `Add the result ${intermediateResult} to the numerator ${currentProblem.mixedNumber.numerator}`
                    : `Suma el resultado ${intermediateResult} al numerador ${currentProblem.mixedNumber.numerator}`}
                </p>
                <div className="text-2xl font-bold flex items-center space-x-2">
                  <span className="text-yellow-600 dark:text-yellow-400">{intermediateResult}</span>
                  <span className="text-gray-600 dark:text-gray-400">+</span>
                  <span className="text-yellow-600 dark:text-yellow-400">{currentProblem.mixedNumber.numerator}</span>
                  <span className="text-gray-600 dark:text-gray-400">=</span>
                  <span className="text-yellow-600 dark:text-yellow-400">{currentProblem.correctAnswer.numerator}</span>
                </div>
              </div>

              <div>
                <p className="text-xl text-pink-600 dark:text-pink-400 mb-2">
                  {settings.language === 'english'
                    ? `Use the original denominator ${currentProblem.mixedNumber.denominator}`
                    : `Usa el denominador original ${currentProblem.mixedNumber.denominator}`}
                </p>
                <div className="text-2xl font-bold flex items-center justify-center space-x-4">
                  <div className="flex flex-col items-center">
                    <span className="text-yellow-600 dark:text-yellow-400">{currentProblem.correctAnswer.numerator}</span>
                    <div className="w-12 h-0.5 bg-current my-1"></div>
                    <span className="text-cyan-600 dark:text-cyan-400">{currentProblem.correctAnswer.denominator}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <input
              ref={inputRef}
              type="number"
              value={numerator}
              onChange={(e) => setNumerator(e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder={settings.language === 'english' ? 'Num' : 'Num'}
              aria-label={settings.language === 'english' ? 'Numerator' : 'Numerador'}
              aria-invalid={!!numerator && isNaN(parseInt(numerator))}
              disabled={isAnswerRevealed || hasReachedMaxAttempts}
            />
            <div className="text-2xl font-bold">/</div>
            <input
              type="number"
              value={denominator}
              onChange={(e) => setDenominator(e.target.value)}
              className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder={settings.language === 'english' ? 'Den' : 'Den'}
              aria-label={settings.language === 'english' ? 'Denominator' : 'Denominador'}
              aria-invalid={!!denominator && (isNaN(parseInt(denominator)) || parseInt(denominator) === 0)}
              disabled={isAnswerRevealed || hasReachedMaxAttempts}
            />
          </div>

          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`p-3 rounded-md text-center ${
                  isCorrect
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {isCorrect 
                  ? (settings.language === 'english' ? 'Correct!' : '¡Correcto!') 
                  : (settings.language === 'english' 
                      ? `Incorrect. ${settings.maxAttempts > 0 && currentAttempts >= settings.maxAttempts 
                          ? `The correct answer is ${currentProblem.correctAnswer.numerator}/${currentProblem.correctAnswer.denominator}` 
                          : 'Try again!'}`
                      : `Incorrecto. ${settings.maxAttempts > 0 && currentAttempts >= settings.maxAttempts 
                          ? `La respuesta correcta es ${currentProblem.correctAnswer.numerator}/${currentProblem.correctAnswer.denominator}` 
                          : '¡Inténtalo de nuevo!'}`)}
              </motion.div>
            )}
          </AnimatePresence>

          {showContinueButton ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleContinue}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                {settings.language === 'english' ? 'Continue' : 'Continuar'}
              </button>
            </div>
          ) : (
            <>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                disabled={isAnswerRevealed || hasReachedMaxAttempts}
              >
                {settings.language === 'english' ? 'Check Answer' : 'Verificar Respuesta'}
              </button>

              {!isAnswerRevealed && !hasReachedMaxAttempts && (
                <button
                  type="button"
                  onClick={handleShowAnswer}
                  className="w-full mt-2 px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  disabled={hasReachedMaxAttempts}
                >
                  {settings.language === 'english' ? 'Show Answer' : 'Mostrar Respuesta'}
                </button>
              )}
            </>
          )}
        </form>

        {/* Auto-continue toggle with tooltip */}
        {!isAnswerRevealed && !showContinueButton && !hasReachedMaxAttempts && (
          <div className="mt-4 flex items-center justify-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoContinue}
              onChange={handleAutoContinueChange}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
            <span className="ms-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              {settings.language === 'english' ? 'Auto-Continue' : 'Auto-Continuar'}
            </span>
          </label>
          {showAutoContinueTooltip && (
            <div className="ml-2 relative group">
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-100 transition-opacity duration-300">
                {settings.language === 'english'
                  ? `Automatically advances to the next problem after ${AUTO_CONTINUE_DELAY/1000}s`
                  : `Avanzar automáticamente al siguiente problema después de ${AUTO_CONTINUE_DELAY/1000}s`}
              </div>
            </div>
          )}
        </div>)}
      </div>
    </div>
  );
};