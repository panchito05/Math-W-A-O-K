import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Eye, RotateCcw } from 'lucide-react';

import { Problem, UserAnswer, Settings } from './types';
import { generateProblem, checkAnswer } from './utils';

// Constants
const DEFAULT_SETTINGS: Settings = {
  difficulty: 1,
  problemCount: 10,
  timeLimit: 0,
  maxAttempts: 3,
  adaptiveDifficulty: true,
  enableCompensation: false,
  autoContinue: true,
  language: 'english',
  includeNonFactors: false
};

const MAX_DIFFICULTY = 3;
const CORRECT_STREAK_THRESHOLD = 10;
const AUTO_CONTINUE_DELAY = 1500;
const TOOLTIP_DISPLAY_TIME = 3000;

export const FractionReducerExercise: React.FC = () => {
  // Emit progress event
  const emitProgress = useCallback((data: { correct: boolean; timeSpent: number; difficulty: number; attempts: number; revealed: boolean }) => {
    const event = new CustomEvent('operationProgress', { 
      detail: { 
        operationType: 'fractionreducer', 
        ...data 
      } 
    });
    window.dispatchEvent(event);
  }, []);

  // Settings
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('fractionreducer_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // Problem State
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [numerator, setNumerator] = useState('');
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  
  // UI State
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [divisionFactor, setDivisionFactor] = useState<number | null>(null);
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [targetProblemCount, setTargetProblemCount] = useState(settings.problemCount);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [showAutoContinueTooltip, setShowAutoContinueTooltip] = useState(false);
  
  // Refs
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const numeratorInputRef = useRef<HTMLInputElement>(null);
  const startTime = useRef(Date.now());

  // Initialize first problem
  useEffect(() => {
    const newProblem = generateProblem(settings.difficulty, settings.includeNonFactors);
    setCurrentProblem(newProblem);
    startTime.current = Date.now();
  }, [settings.difficulty, settings.includeNonFactors]);

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
    } else {
      setShowAutoContinueTooltip(false);
    }
  };

  // Generate next problem
  const handleContinue = () => {
    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);

    if (currentIndex < targetProblemCount - 1) {
      setCurrentIndex(prev => prev + 1);
      setCurrentProblem(generateProblem(settings.difficulty, settings.includeNonFactors));
      setNumerator('');
      setShowSteps(false);
      setDivisionFactor(null);
      setCurrentAttempts(0);
      setShowContinueButton(false);
      setShowFeedback(false);
      setIsAnswerRevealed(false);
      setIsCorrect(false);
      startTime.current = Date.now();
      
      if (numeratorInputRef.current) numeratorInputRef.current.focus();
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

  const calculateDivisionFactor = (problem: Problem) => {
    return problem.originalDenominator / problem.targetDenominator;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProblem) return;

    const numValue = parseInt(numerator, 10);

    if (isNaN(numValue)) {
      toast.error(settings.language === 'english' 
        ? 'Please enter a valid number for the numerator.' 
        : 'Por favor, ingrese un número válido para el numerador.');
      return;
    }

    const userAnswer = { 
      numerator: numValue, 
      denominator: currentProblem.targetDenominator 
    };
    
    const timeSpent = (Date.now() - startTime.current) / 1000;
    const attemptsSoFar = currentAttempts + 1;
    const correct = checkAnswer(currentProblem, userAnswer);

    setCurrentAttempts(attemptsSoFar);
    setIsCorrect(correct);
    setShowFeedback(true);

    // Calculate and show steps for correct answers or when max attempts are reached
    const hasReachedMaxAttempts = settings.maxAttempts > 0 && attemptsSoFar >= settings.maxAttempts;
    if (correct || hasReachedMaxAttempts) {
      setShowSteps(true);
      setDivisionFactor(calculateDivisionFactor(currentProblem));
    }

    // Update consecutive correct answers
    if (correct && settings.adaptiveDifficulty) {
      const newStreak = consecutiveCorrectAnswers + 1;
      setConsecutiveCorrectAnswers(newStreak);

      if (newStreak >= CORRECT_STREAK_THRESHOLD && settings.difficulty < MAX_DIFFICULTY) {
        const newDifficulty = (settings.difficulty + 1) as 1 | 2 | 3;
        setSettings(prev => ({ ...prev, difficulty: newDifficulty }));
        setConsecutiveCorrectAnswers(0);
        toast.info(settings.language === 'english' 
          ? `Level Up! Difficulty increased to ${newDifficulty}` 
          : `¡Subió de nivel! La dificultad aumentó a ${newDifficulty}`);
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
      
      emitProgress({ 
        correct: true, 
        timeSpent, 
        difficulty: settings.difficulty, 
        attempts: attemptsSoFar, 
        revealed: false 
      });
      
      // For correct answers, show continue button if auto-continue is disabled
      if (!settings.autoContinue) {
        setShowContinueButton(true);
      }
    } else {
      // Check if we've reached the maximum attempts
      const hasReachedMaxAttempts = settings.maxAttempts > 0 && attemptsSoFar >= settings.maxAttempts;
      
      if (hasReachedMaxAttempts) {
        toast.error(settings.language === 'english' 
          ? `Incorrect. The correct answer is ${currentProblem.correctAnswer.numerator}/${currentProblem.correctAnswer.denominator}` 
          : `Incorrecto. La respuesta correcta es ${currentProblem.correctAnswer.numerator}/${currentProblem.correctAnswer.denominator}`);
        
        setUserAnswers(prev => [...prev, {
          problem: currentProblem,
          answer: userAnswer,
          isCorrect: false,
          wasRevealed: false,
          timeSpent,
          attemptsMade: attemptsSoFar
        }]);
        
        emitProgress({ 
          correct: false, 
          timeSpent, 
          difficulty: settings.difficulty, 
          attempts: attemptsSoFar, 
          revealed: false 
        });

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
    
    emitProgress({ 
      correct: false, 
      timeSpent, 
      difficulty: settings.difficulty, 
      attempts: attemptsCounted, 
      revealed: true 
    });

    if (settings.enableCompensation) {
      setTargetProblemCount(prev => prev + 1);
      toast.info(settings.language === 'english' 
        ? "Revealed answer, adding one more problem." 
        : "Respuesta revelada, se añade un problema más.");
    }

    setShowSteps(true);
    setDivisionFactor(calculateDivisionFactor(currentProblem));
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
    setCurrentProblem(generateProblem(settings.difficulty, settings.includeNonFactors));
    setNumerator('');
    setShowSteps(false);
    setDivisionFactor(null);
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

  // Check if max attempts have been reached to determine UI state
  const hasReachedMaxAttempts = settings.maxAttempts > 0 && currentAttempts >= settings.maxAttempts;

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
          {settings.language === 'english' 
            ? `Reviewing Problem ${reviewIndex + 1} / ${userAnswers.length}` 
            : `Revisando Problema ${reviewIndex + 1} / ${userAnswers.length}`
          }
        </h3>

        <div className="text-center mb-6">
          <div className="mb-6">
            <p className="text-xl text-red-600 dark:text-red-400 mb-2">
              {settings.language === 'english' ? 'Original Fraction' : 'Fracción Original'}
            </p>
            <div className="text-4xl font-bold flex items-center justify-center">
              <div className="flex flex-col items-center">
                <span className="text-yellow-600 dark:text-yellow-400">{reviewAnswer.problem.originalNumerator}</span>
                <div className="w-8 h-0.5 bg-current my-1"></div>
                <span className="text-cyan-600 dark:text-cyan-400">{reviewAnswer.problem.originalDenominator}</span>
              </div>
            </div>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
              {settings.language === 'english' 
                ? `Target Denominator: ${reviewAnswer.problem.targetDenominator}` 
                : `Denominador Objetivo: ${reviewAnswer.problem.targetDenominator}`
              }
            </p>
          </div>

          <div className="mb-6">
            <p className="text-xl text-red-600 dark:text-red-400 mb-2">
              {settings.language === 'english' ? 'Your Answer' : 'Tu Respuesta'}
            </p>
            {reviewAnswer.answer ? (
              <div className={`text-4xl font-bold flex items-center justify-center ${
                reviewAnswer.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                <div className="flex flex-col items-center">
                  <span>{reviewAnswer.answer.numerator}</span>
                  <div className="w-8 h-0.5 bg-current my-1"></div>
                  <span>{reviewAnswer.answer.denominator}</span>
                </div>
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
              <div className="text-4xl font-bold flex items-center justify-center text-green-600 dark:text-green-400">
                <div className="flex flex-col items-center">
                  <span>{reviewAnswer.problem.correctAnswer.numerator}</span>
                  <div className="w-8 h-0.5 bg-current my-1"></div>
                  <span>{reviewAnswer.problem.correctAnswer.denominator}</span>
                </div>
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
            {settings.language === 'english' 
              ? `Problem ${currentIndex + 1} of ${targetProblemCount}` 
              : `Problema ${currentIndex + 1} de ${targetProblemCount}`
            }
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {settings.language === 'english' 
              ? `Attempts: ${currentAttempts}/${settings.maxAttempts === 0 ? '∞' : settings.maxAttempts}` 
              : `Intentos: ${currentAttempts}/${settings.maxAttempts === 0 ? '∞' : settings.maxAttempts}`
            }
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
            {settings.language === 'english' 
              ? 'Reduce to Equivalent Fraction' 
              : 'Reducir a Fracción Equivalente'
            }
          </h2>

          <div className="mb-6">
            <p className="text-xl text-red-600 dark:text-red-400 mb-2">
              {settings.language === 'english' ? 'Original Fraction' : 'Fracción Original'}
            </p>
            <div className="text-4xl font-bold flex items-center justify-center">
              <div className="flex flex-col items-center">
                <span className="text-yellow-600 dark:text-yellow-400">{currentProblem.originalNumerator}</span>
                <div className="w-8 h-0.5 bg-current my-1"></div>
                <span className="text-cyan-600 dark:text-cyan-400">{currentProblem.originalDenominator}</span>
              </div>
            </div>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
              {settings.language === 'english' 
                ? `Reduce to a fraction with denominator ${currentProblem.targetDenominator}` 
                : `Reducir a una fracción con denominador ${currentProblem.targetDenominator}`
              }
            </p>
          </div>

          {showSteps && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-6 text-left"
            >
              {divisionFactor !== null && (
                <>
                  <div>
                    <p className="text-xl text-pink-600 dark:text-pink-400 mb-2">
                      {settings.language === 'english'
                        ? `Divide the original denominator (${currentProblem.originalDenominator}) by the target denominator (${currentProblem.targetDenominator})`
                        : `Divide el denominador original (${currentProblem.originalDenominator}) entre el denominador objetivo (${currentProblem.targetDenominator})`
                      }
                    </p>
                    <div className="text-2xl font-bold flex items-center justify-center space-x-2">
                      <span className="text-cyan-600 dark:text-cyan-400">{currentProblem.originalDenominator}</span>
                      <span className="text-gray-600 dark:text-gray-400">÷</span>
                      <span className="text-cyan-600 dark:text-cyan-400">{currentProblem.targetDenominator}</span>
                      <span className="text-gray-600 dark:text-gray-400">=</span>
                      <span className="text-green-600 dark:text-green-400">{divisionFactor}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xl text-pink-600 dark:text-pink-400 mb-2">
                      {settings.language === 'english'
                        ? `Divide the original numerator (${currentProblem.originalNumerator}) by the result (${divisionFactor})`
                        : `Divide el numerador original (${currentProblem.originalNumerator}) entre el resultado (${divisionFactor})`
                      }
                    </p>
                    <div className="text-2xl font-bold flex items-center justify-center space-x-2">
                      <span className="text-yellow-600 dark:text-yellow-400">{currentProblem.originalNumerator}</span>
                      <span className="text-gray-600 dark:text-gray-400">÷</span>
                      <span className="text-green-600 dark:text-green-400">{divisionFactor}</span>
                      <span className="text-gray-600 dark:text-gray-400">=</span>
                      <span className="text-yellow-600 dark:text-yellow-400">{currentProblem.correctAnswer.numerator}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xl text-pink-600 dark:text-pink-400 mb-2">
                      {settings.language === 'english'
                        ? 'Therefore, the equivalent fraction is:'
                        : 'Por lo tanto, la fracción equivalente es:'
                      }
                    </p>
                    <div className="text-2xl font-bold flex items-center justify-center">
                      <div className="flex flex-col items-center">
                        <span className="text-yellow-600 dark:text-yellow-400">{currentProblem.correctAnswer.numerator}</span>
                        <div className="w-8 h-0.5 bg-current my-1"></div>
                        <span className="text-cyan-600 dark:text-cyan-400">{currentProblem.correctAnswer.denominator}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <input
              ref={numeratorInputRef}
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
            <div className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-center bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100 cursor-not-allowed">
              {currentProblem.targetDenominator}
            </div>
          </div>

          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className={`p-3 rounded-md text-center ${
                  isCorrect
                    ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-200'
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
          </div>
        )}
      </div>
    </div>
  );
};

export default FractionReducerExercise;