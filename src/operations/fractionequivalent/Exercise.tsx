import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Eye, RotateCcw } from 'lucide-react';

import { Problem, UserAnswer, Settings } from './types';
import { generateProblem, checkAnswer, areEquivalentFractions, findGCD } from './utils';

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
  includeNonMultiples: false,
  problemTypes: ['convert', 'true-false', 'free-input']
};

const MAX_DIFFICULTY = 3;
const CORRECT_STREAK_THRESHOLD = 10;
const AUTO_CONTINUE_DELAY = 1500;
const TOOLTIP_DISPLAY_TIME = 3000;

export const FractionEquivalentExercise: React.FC = () => {
  // Emit progress event
  const emitProgress = useCallback((data: { correct: boolean; timeSpent: number; difficulty: number; attempts: number; revealed: boolean }) => {
    const event = new CustomEvent('operationProgress', { 
      detail: { 
        operationType: 'fractionequivalent', 
        ...data 
      } 
    });
    window.dispatchEvent(event);
  }, []);

  // Settings
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('fractionequivalent_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // Problem State
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Input state for different problem types
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<boolean | null>(null);
  
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
    const newProblem = generateProblem(
      settings.difficulty, 
      settings.includeNonMultiples, 
      settings.problemTypes,
      settings.language
    );
    setCurrentProblem(newProblem);
    startTime.current = Date.now();
  }, [settings.difficulty, settings.includeNonMultiples, settings.problemTypes, settings.language]);

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
      setCurrentProblem(generateProblem(
        settings.difficulty, 
        settings.includeNonMultiples, 
        settings.problemTypes,
        settings.language
      ));
      
      // Reset all input states
      setNumerator('');
      setDenominator('');
      setTrueFalseAnswer(null);
      
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
    if (problem.type === 'convert' && problem.targetDenominator) {
      return problem.targetDenominator / problem.originalDenominator;
    }
    return null;
  };

  // Helper function to get the correct answer text based on problem type
  const getCorrectAnswerText = (problem: Problem, language: 'english' | 'spanish'): string => {
    if (problem.type === 'true-false') {
      return language === 'english'
        ? `The correct answer is ${problem.correctAnswer ? 'True' : 'False'}.`
        : `La respuesta correcta es ${problem.correctAnswer ? 'Verdadero' : 'Falso'}.`;
    } 
    else if (problem.type === 'convert' && typeof problem.correctAnswer !== 'boolean') {
      return language === 'english'
        ? `The correct answer is ${problem.correctAnswer.numerator}/${problem.correctAnswer.denominator}.`
        : `La respuesta correcta es ${problem.correctAnswer.numerator}/${problem.correctAnswer.denominator}.`;
    }
    else if (problem.type === 'free-input') {
      // For free-input, provide examples of equivalent fractions
      const { originalNumerator, originalDenominator } = problem;
      
      // Generate a few examples of equivalent fractions
      const examples = [];
      for (let i = 2; i <= 4; i++) {
        examples.push(`${originalNumerator * i}/${originalDenominator * i}`);
      }
      
      return language === 'english'
        ? `Some equivalent fractions to ${originalNumerator}/${originalDenominator} are: ${examples.join(', ')}`
        : `Algunas fracciones equivalentes a ${originalNumerator}/${originalDenominator} son: ${examples.join(', ')}`;
    }
    
    return language === 'english' ? 'The answer was incorrect.' : 'La respuesta fue incorrecta.';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProblem) return;

    let userAnswer: { numerator: number; denominator: number } | boolean | null = null;
    let isValid = false;
    
    // Process different answer types based on problem type
    if (currentProblem.type === 'convert') {
      const numValue = parseInt(numerator, 10);
      if (isNaN(numValue)) {
        toast.error(settings.language === 'english' 
          ? 'Please enter a valid number for the numerator.' 
          : 'Por favor, ingrese un número válido para el numerador.');
        return;
      }
      userAnswer = { 
        numerator: numValue, 
        denominator: currentProblem.targetDenominator || 1 
      };
      isValid = true;
    } 
    else if (currentProblem.type === 'true-false') {
      if (trueFalseAnswer === null) {
        toast.error(settings.language === 'english'
          ? 'Please select True or False.'
          : 'Por favor, seleccione Verdadero o Falso.');
        return;
      }
      userAnswer = trueFalseAnswer;
      isValid = true;
    }
    else if (currentProblem.type === 'free-input') {
      const numValue = parseInt(numerator, 10);
      const denValue = parseInt(denominator, 10);
      
      // Validate inputs
      if (isNaN(numValue) || isNaN(denValue)) {
        toast.error(settings.language === 'english'
          ? 'Please enter valid numbers for both numerator and denominator.'
          : 'Por favor, ingrese números válidos para el numerador y el denominador.');
        return;
      }
      
      if (denValue <= 0) {
        toast.error(settings.language === 'english'
          ? 'Denominator must be a positive number.'
          : 'El denominador debe ser un número positivo.');
        return;
      }

      if (numValue <= 0) {
        toast.error(settings.language === 'english'
          ? 'Numerator must be a positive number.'
          : 'El numerador debe ser un número positivo.');
        return;
      }
      
      userAnswer = { numerator: numValue, denominator: denValue };
      isValid = true;
    }
    
    if (!isValid || userAnswer === null) {
      toast.error(settings.language === 'english'
        ? 'Please provide a valid answer before submitting.'
        : 'Por favor proporciona una respuesta válida antes de enviar.');
      return;
    }
    
    const timeSpent = (Date.now() - startTime.current) / 1000;
    const attemptsSoFar = currentAttempts + 1;
    const correct = checkAnswer(currentProblem, userAnswer);

    setCurrentAttempts(attemptsSoFar);
    setIsCorrect(correct);
    setShowFeedback(true);

    // Calculate and show steps for correct answers or when max attempts are reached
    const hasReachedMaxAttempts = settings.maxAttempts > 0 && attemptsSoFar >= settings.maxAttempts;
    if (correct || hasReachedMaxAttempts) {
      // Only show steps for convert problems
      if (currentProblem.type === 'convert') {
        setShowSteps(true);
        setDivisionFactor(calculateDivisionFactor(currentProblem));
      }
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
      
      setUserAnswers(prev => [
        ...prev, 
        {
          problem: currentProblem,
          answer: userAnswer,
          isCorrect: true,
          wasRevealed: false,
          timeSpent,
          attemptsMade: attemptsSoFar
        }
      ]);
      
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
          ? `Incorrect. ${getCorrectAnswerText(currentProblem, settings.language)}`
          : `Incorrecto. ${getCorrectAnswerText(currentProblem, settings.language)}`);
        
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

    // Show the correct answer
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
    
    // Only calculate division factor for convert problems
    if (currentProblem.type === 'convert') {
      setDivisionFactor(calculateDivisionFactor(currentProblem));
    }
    
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
    setCurrentProblem(generateProblem(
      settings.difficulty, 
      settings.includeNonMultiples, 
      settings.problemTypes,
      settings.language
    ));
    setNumerator('');
    setDenominator('');
    setTrueFalseAnswer(null);
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
    const problem = reviewAnswer.problem;
    
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
          {/* Problem display based on type */}
          {problem.type === 'convert' && (
            <div className="mb-6">
              <p className="text-xl text-red-600 dark:text-red-400 mb-2">
                {settings.language === 'english' ? 'Original Fraction' : 'Fracción Original'}
              </p>
              <div className="text-4xl font-bold flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <span className="text-yellow-600 dark:text-yellow-400">{problem.originalNumerator}</span>
                  <div className="w-8 h-0.5 bg-current my-1"></div>
                  <span className="text-cyan-600 dark:text-cyan-400">{problem.originalDenominator}</span>
                </div>
              </div>
              
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-4">
                {settings.language === 'english' 
                  ? `Target Denominator: ${problem.targetDenominator}` 
                  : `Denominador Objetivo: ${problem.targetDenominator}`
                }
              </p>
            </div>
          )}
          
          {problem.type === 'true-false' && (
            <div className="mb-6">
              <p className="text-xl text-red-600 dark:text-red-400 mb-2">
                {settings.language === 'english' ? 'Question' : 'Pregunta'}
              </p>
              <p className="text-lg text-gray-800 dark:text-gray-200">
                {problem.questionText || (
                  settings.language === 'english'
                    ? `Are these fractions equivalent? ${problem.originalNumerator}/${problem.originalDenominator} and ${problem.comparisonFraction?.numerator}/${problem.comparisonFraction?.denominator}`
                    : `¿Son estas fracciones equivalentes? ${problem.originalNumerator}/${problem.originalDenominator} y ${problem.comparisonFraction?.numerator}/${problem.comparisonFraction?.denominator}`
                )}
              </p>
            </div>
          )}
          
          {problem.type === 'free-input' && (
            <div className="mb-6">
              <p className="text-xl text-red-600 dark:text-red-400 mb-2">
                {settings.language === 'english' ? 'Question' : 'Pregunta'}
              </p>
              <p className="text-lg text-gray-800 dark:text-gray-200">
                {problem.questionText || (
                  settings.language === 'english'
                    ? `Write an equivalent fraction for ${problem.originalNumerator}/${problem.originalDenominator}`
                    : `Escribe una fracción equivalente para ${problem.originalNumerator}/${problem.originalDenominator}`
                )}
              </p>
            </div>
          )}

          <div className="mb-6">
            <p className="text-xl text-red-600 dark:text-red-400 mb-2">
              {settings.language === 'english' ? 'Your Answer' : 'Tu Respuesta'}
            </p>
            {reviewAnswer.answer === null ? (
              <p className="text-gray-500 dark:text-gray-400 italic">
                {settings.language === 'english' ? 'No answer submitted' : 'No se envió ninguna respuesta'}
              </p>
            ) : typeof reviewAnswer.answer === 'boolean' ? (
              <div className={`text-2xl font-bold ${
                reviewAnswer.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {reviewAnswer.answer 
                  ? (settings.language === 'english' ? 'True' : 'Verdadero')
                  : (settings.language === 'english' ? 'False' : 'Falso')
                }
              </div>
            ) : (
              <div className={`text-4xl font-bold flex items-center justify-center ${
                reviewAnswer.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                <div className="flex flex-col items-center">
                  <span>{reviewAnswer.answer.numerator}</span>
                  <div className="w-8 h-0.5 bg-current my-1"></div>
                  <span>{reviewAnswer.answer.denominator}</span>
                </div>
              </div>
            )}
          </div>

          {(!reviewAnswer.isCorrect || reviewAnswer.wasRevealed) && (
            <div className="mb-6">
              <p className="text-xl text-red-600 dark:text-red-400 mb-2">
                {settings.language === 'english' ? 'Correct Answer' : 'Respuesta Correcta'}
              </p>
              <div className="text-lg font-medium text-green-600 dark:text-green-400">
                {getCorrectAnswerText(problem, settings.language)}
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

  // Render different problem types
  const renderProblem = () => {
    if (!currentProblem) return null;

    switch(currentProblem.type) {
      case 'convert':
        return (
          <div>
            <p className="text-xl text-pink-600 dark:text-pink-400 mb-4">
              {settings.language === 'english' ? 'Convert to Equivalent Fraction' : 'Convertir a Fracción Equivalente'}
            </p>
            
            <div className="mb-6">
              <p className="text-lg text-red-600 dark:text-red-400 mb-2">
                {settings.language === 'english' ? 'Original Fraction' : 'Fracción Original'}
              </p>
              <div className="text-4xl font-bold flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <span className="text-yellow-600 dark:text-yellow-400">{currentProblem.originalNumerator}</span>
                  <div className="w-8 h-0.5 bg-current my-1"></div>
                  <span className="text-cyan-600 dark:text-cyan-400">{currentProblem.originalDenominator}</span>
                </div>
              </div>

              <p className="text-base text-gray-600 dark:text-gray-400 mt-4">
                {settings.language === 'english'
                  ? `Convert to a fraction with denominator ${currentProblem.targetDenominator}`
                  : `Convertir a una fracción con denominador ${currentProblem.targetDenominator}`
                }
              </p>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <input
                ref={numeratorInputRef}
                type="number"
                value={numerator}
                onChange={(e) => setNumerator(e.target.value)}
                min="0"
                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="?"
                disabled={isAnswerRevealed || hasReachedMaxAttempts}
              />
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">/</div>
              <div className="w-20 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-center bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                {currentProblem.targetDenominator}
              </div>
            </div>
          </div>
        );

      case 'true-false':
        return (
          <div>
            <p className="text-xl text-pink-600 dark:text-pink-400 mb-4">
              {settings.language === 'english' ? 'Equivalent Fractions' : 'Fracciones Equivalentes'}
            </p>
            
            <p className="text-lg mb-6">{currentProblem.questionText}</p>
            
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => setTrueFalseAnswer(true)}
                className={`px-6 py-3 rounded-md ${
                  trueFalseAnswer === true 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                } ${
                  isAnswerRevealed && currentProblem.correctAnswer === true
                    ? 'ring-2 ring-green-500'
                    : ''
                }`}
                disabled={isAnswerRevealed || hasReachedMaxAttempts}
              >
                {settings.language === 'english' ? 'True' : 'Verdadero'}
              </button>
              <button
                onClick={() => setTrueFalseAnswer(false)}
                className={`px-6 py-3 rounded-md ${
                  trueFalseAnswer === false 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                } ${
                  isAnswerRevealed && currentProblem.correctAnswer === false
                    ? 'ring-2 ring-green-500'
                    : ''
                }`}
                disabled={isAnswerRevealed || hasReachedMaxAttempts}
              >
                {settings.language === 'english' ? 'False' : 'Falso'}
              </button>
            </div>
          </div>
        );

      case 'free-input':
        return (
          <div>
            <p className="text-xl text-pink-600 dark:text-pink-400 mb-4">
              {settings.language === 'english' ? 'Create an Equivalent Fraction' : 'Crear una Fracción Equivalente'}
            </p>
            
            <div className="mb-6">
              <p className="text-lg text-red-600 dark:text-red-400 mb-2">
                {settings.language === 'english' ? 'Original Fraction' : 'Fracción Original'}
              </p>
              <div className="text-4xl font-bold flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <span className="text-yellow-600 dark:text-yellow-400">{currentProblem.originalNumerator}</span>
                  <div className="w-8 h-0.5 bg-current my-1"></div>
                  <span className="text-cyan-600 dark:text-cyan-400">{currentProblem.originalDenominator}</span>
                </div>
              </div>

              <p className="text-base text-gray-600 dark:text-gray-400 mt-4">
                {settings.language === 'english'
                  ? 'Create an equivalent fraction with different numbers'
                  : 'Crea una fracción equivalente con números diferentes'
                }
              </p>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <input
                ref={numeratorInputRef}
                type="number"
                value={numerator}
                onChange={(e) => setNumerator(e.target.value)}
                min="1"
                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="?"
                disabled={isAnswerRevealed || hasReachedMaxAttempts}
              />
              <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">/</div>
              <input
                type="number"
                value={denominator}
                onChange={(e) => setDenominator(e.target.value)}
                min="1"
                className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-center bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="?"
                disabled={isAnswerRevealed || hasReachedMaxAttempts}
              />
            </div>
          </div>
        );

      default:
        return <p>Unknown problem type</p>;
    }
  };

  // Main render function
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
          ></div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mb-6">
        <div className="text-center mb-6">
          {renderProblem()}

          {showSteps && currentProblem.type === 'convert' && (
            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-left">
              <h3 className="font-bold text-blue-700 dark:text-blue-300 mb-2">
                {settings.language === 'english' ? 'Step-by-Step Solution' : 'Solución Paso a Paso'}
              </h3>
              <ol className="space-y-2">
                <li className="text-blue-600 dark:text-blue-400">
                  {settings.language === 'english'
                    ? `1. Find the multiplier: ${currentProblem.targetDenominator} ÷ ${currentProblem.originalDenominator} = ${divisionFactor}`
                    : `1. Encuentra el multiplicador: ${currentProblem.targetDenominator} ÷ ${currentProblem.originalDenominator} = ${divisionFactor}`
                  }
                </li>
                <li className="text-blue-600 dark:text-blue-400">
                  {settings.language === 'english'
                    ? `2. Multiply the numerator: ${currentProblem.originalNumerator} × ${divisionFactor} = ${currentProblem.correctAnswer.numerator}`
                    : `2. Multiplica el numerador: ${currentProblem.originalNumerator} × ${divisionFactor} = ${currentProblem.correctAnswer.numerator}`
                  }
                </li>
                <li className="text-blue-600 dark:text-blue-400">
                  {settings.language === 'english'
                    ? `3. The equivalent fraction is: ${currentProblem.correctAnswer.numerator}/${currentProblem.correctAnswer.denominator}`
                    : `3. La fracción equivalente es: ${currentProblem.correctAnswer.numerator}/${currentProblem.correctAnswer.denominator}`
                  }
                </li>
              </ol>
            </div>
          )}

          {showFeedback && (
            <div className={`mt-6 p-4 rounded-lg ${
              isCorrect 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
            }`}>
              {isCorrect 
                ? (settings.language === 'english' ? '✓ Correct!' : '✓ ¡Correcto!') 
                : (settings.language === 'english' 
                    ? `✗ Incorrect. ${hasReachedMaxAttempts ? getCorrectAnswerText(currentProblem, settings.language) : 'Try again!'}`
                    : `✗ Incorrecto. ${hasReachedMaxAttempts ? getCorrectAnswerText(currentProblem, settings.language) : '¡Intenta de nuevo!'}`)}
            </div>
          )}
        </div>

        {showContinueButton ? (
          <button
            onClick={handleContinue}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            {settings.language === 'english' ? 'Continue' : 'Continuar'}
          </button>
        ) : (
          <>
            <button
              onClick={handleSubmit}
              className="w-full py-3 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors mb-3"
              disabled={isAnswerRevealed || hasReachedMaxAttempts}
            >
              {settings.language === 'english' ? 'Check Answer' : 'Verificar Respuesta'}
            </button>
            
            {!isAnswerRevealed && !hasReachedMaxAttempts && (
              <button
                onClick={handleShowAnswer}
                className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {settings.language === 'english' ? 'Show Answer' : 'Mostrar Respuesta'}
              </button>
            )}
          </>
        )}

        {/* Auto-continue toggle */}
        {!isAnswerRevealed && !showContinueButton && (
          <div className="mt-4 flex items-center justify-center">
            <label className="inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.autoContinue}
                onChange={handleAutoContinueChange}
              />
              <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                {settings.language === 'english' ? 'Auto-Continue' : 'Auto-Continuar'}
              </span>
            </label>
            {showAutoContinueTooltip && (
              <div className="ml-2 bg-gray-900 text-white text-xs rounded py-1 px-2">
                {settings.language === 'english' ? 'Continues automatically after correct answer' : 'Continúa automáticamente después de respuesta correcta'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};