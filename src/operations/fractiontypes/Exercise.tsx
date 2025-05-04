import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Eye, RotateCcw, HelpCircle, CheckCircle, XCircle, Circle as CircleX } from 'lucide-react';
import { Problem, UserAnswer, Settings } from './types';
import { generateProblem, checkAnswer, validateFraction, validateMixedNumber } from './utils';

// Constants
const DEFAULT_SETTINGS: Settings = {
  difficulty: 1,
  problemCount: 10,
  timeLimit: 0,
  maxAttempts: 2,
  adaptiveDifficulty: true,
  autoContinue: true,
  language: 'english',
  problemTypes: ['identify', 'true-false', 'matching', 'write']
};

const MAX_DIFFICULTY = 3;
const CORRECT_STREAK_THRESHOLD = 10;
const AUTO_CONTINUE_DELAY = 1500;
const TOOLTIP_DISPLAY_TIME = 3000;

export const FractionTypesExercise: React.FC = () => {
  // Emit progress event
  const emitProgress = useCallback((data: { correct: boolean; timeSpent: number; difficulty: number; attempts: number; revealed: boolean }) => {
    const event = new CustomEvent('operationProgress', { 
      detail: { 
        operationType: 'fractiontypes', 
        ...data 
      } 
    });
    window.dispatchEvent(event);
  }, []);

  // Settings
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('fractiontypes_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // Problem State
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [matchingAnswers, setMatchingAnswers] = useState<string[]>([]);
  const [writeAnswer, setWriteAnswer] = useState<string>('');
  
  // UI State
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [targetProblemCount, setTargetProblemCount] = useState(settings.problemCount);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [showAutoContinueTooltip, setShowAutoContinueTooltip] = useState(false);
  const [showTips, setShowTips] = useState(false);
  
  // Refs
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTime = useRef(Date.now());

  // Initialize first problem
  useEffect(() => {
    const newProblem = generateProblem(settings.difficulty, settings.language, settings.problemTypes);
    setCurrentProblem(newProblem);
    resetUserInputs();
    startTime.current = Date.now();
  }, [settings.difficulty, settings.language, settings.problemTypes]);

  // Reset user inputs for a new problem
  const resetUserInputs = () => {
    setSelectedOption('');
    setMatchingAnswers([]);
    setWriteAnswer('');
  };

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
      setCurrentProblem(generateProblem(settings.difficulty, settings.language, settings.problemTypes));
      resetUserInputs();
      setCurrentAttempts(0);
      setShowContinueButton(false);
      setShowFeedback(false);
      setIsAnswerRevealed(false);
      setIsCorrect(false);
      setShowTips(false);
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

  // Handle matching answers
  const handleMatchingChange = (fraction: string, type: string) => {
    setMatchingAnswers(prev => {
      // Create a copy of the current answers
      const newAnswers = [...prev];
      
      // Check if the fraction is already matched
      const existingIndex = newAnswers.findIndex(a => a.startsWith(fraction));
      
      if (existingIndex >= 0) {
        // If the fraction is already matched, update its type
        newAnswers[existingIndex] = `${fraction}=${type}`;
      } else {
        // Otherwise, add the new matching
        newAnswers.push(`${fraction}=${type}`);
      }
      
      return newAnswers;
    });
  };

  // Check if all fractions in a matching exercise have been matched
  const isMatchingComplete = () => {
    if (!currentProblem || currentProblem.type !== 'matching' || !Array.isArray(currentProblem.correctAnswer)) {
      return false;
    }
    
    const fractions = currentProblem.correctAnswer.map(a => a.split('=')[0]);
    return fractions.every(fraction => matchingAnswers.some(a => a.startsWith(fraction)));
  };

  // Submit the user's answer
  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentProblem) return;

    let userAnswer: string | string[] = '';
    let isValid = false;

    // Get the appropriate answer based on the problem type
    if (currentProblem.type === 'identify' || currentProblem.type === 'true-false') {
      userAnswer = selectedOption;
      isValid = !!userAnswer;
    } else if (currentProblem.type === 'matching') {
      userAnswer = matchingAnswers;
      isValid = isMatchingComplete();
    } else if (currentProblem.type === 'write') {
      userAnswer = writeAnswer.trim();
      
      // Special validation for write problems
      if (currentProblem.correctAnswer === 'proper' || currentProblem.correctAnswer === 'improper') {
        // For writing proper/improper fractions, validate the format
        const validation = validateFraction(userAnswer);
        isValid = validation.valid;
        
        if (!isValid && validation.error) {
          toast.error(validation.error);
          return;
        }
      } else if (currentProblem.correctAnswer.includes(' ')) {
        // For mixed number answers
        const validation = validateMixedNumber(userAnswer);
        isValid = validation.valid;
        
        if (!isValid && validation.error) {
          toast.error(validation.error);
          return;
        }
      } else if (currentProblem.correctAnswer.includes('/')) {
        // For fraction answers
        const validation = validateFraction(userAnswer);
        isValid = validation.valid;
        
        if (!isValid && validation.error) {
          toast.error(validation.error);
          return;
        }
      } else {
        isValid = !!userAnswer;
      }
    }

    if (!isValid) {
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
        const correctAnswerDisplay = 
          currentProblem.type === 'matching' ? 
            settings.language === 'english' ? "See the correct matching below." : "Vea la correspondencia correcta a continuación." :
            settings.language === 'english' ? 
              `The correct answer is: ${Array.isArray(currentProblem.correctAnswer) ? currentProblem.correctAnswer.join(', ') : currentProblem.correctAnswer}` : 
              `La respuesta correcta es: ${Array.isArray(currentProblem.correctAnswer) ? currentProblem.correctAnswer.join(', ') : currentProblem.correctAnswer}`;
            
        toast.error(settings.language === 'english' 
          ? `Incorrect. ${correctAnswerDisplay}` 
          : `Incorrecto. ${correctAnswerDisplay}`);
        
        setUserAnswers(prev => [...prev, {
          problem: currentProblem,
          answer: userAnswer,
          isCorrect: false,
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

    setShowContinueButton(true);
    setShowTips(true);

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
    setCurrentProblem(generateProblem(settings.difficulty, settings.language, settings.problemTypes));
    resetUserInputs();
    setUserAnswers([]);
    setIsComplete(false);
    setCurrentAttempts(0);
    setShowFeedback(false);
    setIsAnswerRevealed(false);
    setConsecutiveCorrectAnswers(0);
    setTargetProblemCount(settings.problemCount);
    setShowTips(false);
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
              {settings.language === 'english' ? 'Question' : 'Pregunta'}
            </p>
            <div className="text-lg font-medium text-gray-800 dark:text-gray-200">
              {reviewAnswer.problem.question}
            </div>
          </div>

          <div className="mb-6">
            <p className="text-xl text-blue-600 dark:text-blue-400 mb-2">
              {settings.language === 'english' ? 'Your Answer' : 'Tu Respuesta'}
            </p>
            {reviewAnswer.answer ? (
              <div className={`text-lg font-medium ${
                reviewAnswer.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {Array.isArray(reviewAnswer.answer) 
                  ? reviewAnswer.answer.join(', ') 
                  : reviewAnswer.answer}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 italic">
                {settings.language === 'english' ? 'No answer submitted' : 'No se envió ninguna respuesta'}
              </p>
            )}
          </div>

          <div className="mb-6">
            <p className="text-xl text-green-600 dark:text-green-400 mb-2">
              {settings.language === 'english' ? 'Correct Answer' : 'Respuesta Correcta'}
            </p>
            <div className="text-lg font-medium text-green-600 dark:text-green-400">
              {Array.isArray(reviewAnswer.problem.correctAnswer) 
                ? reviewAnswer.problem.correctAnswer.join(', ') 
                : reviewAnswer.problem.correctAnswer}
            </div>
          </div>

          {reviewAnswer.problem.explanation && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200">
                {settings.language === 'english' ? 'Explanation' : 'Explicación'}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                {reviewAnswer.problem.explanation}
              </p>
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

    switch (currentProblem.type) {
      case 'identify':
        return (
          <div className="space-y-4">
            <p className="text-lg text-gray-800 dark:text-gray-200">{currentProblem.question}</p>
            
            <div className="space-y-2 mt-4">
              {currentProblem.options?.map(option => (
                <button
                  key={option}
                  className={`w-full p-3 rounded-md text-left ${
                    selectedOption === option 
                      ? 'bg-indigo-100 dark:bg-indigo-700 border-2 border-indigo-500'
                      : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                  } hover:bg-indigo-50 dark:hover:bg-indigo-800/50 transition-colors ${
                    (isAnswerRevealed || hasReachedMaxAttempts) && option === currentProblem.correctAnswer
                      ? 'ring-2 ring-green-500 dark:ring-green-400'
                      : ''
                  }`}
                  onClick={() => setSelectedOption(option)}
                  disabled={isAnswerRevealed || hasReachedMaxAttempts}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'true-false':
        return (
          <div className="space-y-4">
            <p className="text-lg text-gray-800 dark:text-gray-200">{currentProblem.question}</p>
            
            <div className="flex space-x-4 mt-4">
              {currentProblem.options?.map(option => (
                <button
                  key={option}
                  className={`flex-1 p-3 rounded-md flex items-center justify-center ${
                    selectedOption === option 
                      ? 'bg-indigo-100 dark:bg-indigo-700 border-2 border-indigo-500'
                      : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600'
                  } hover:bg-indigo-50 dark:hover:bg-indigo-800/50 transition-colors ${
                    (isAnswerRevealed || hasReachedMaxAttempts) && option === currentProblem.correctAnswer
                      ? 'ring-2 ring-green-500 dark:ring-green-400'
                      : ''
                  }`}
                  onClick={() => setSelectedOption(option)}
                  disabled={isAnswerRevealed || hasReachedMaxAttempts}
                >
                  {option === 'True' || option === 'Verdadero' ? (
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 mr-2 text-red-500" />
                  )}
                  {option}
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'matching':
        if (Array.isArray(currentProblem.correctAnswer) && currentProblem.options) {
          const fractions = currentProblem.correctAnswer.map(a => a.split('=')[0]);
          const types = currentProblem.options;
          
          return (
            <div className="space-y-4">
              <p className="text-lg text-gray-800 dark:text-gray-200">{currentProblem.question}</p>
              
              <div className="mt-4 space-y-4">
                {fractions.map(fraction => {
                  const matchedType = matchingAnswers.find(a => a.startsWith(fraction))?.split('=')?.[1] || '';
                  
                  return (
                    <div key={fraction} className="flex items-center space-x-3">
                      <div className="w-24 p-2 bg-gray-100 dark:bg-gray-700 rounded-md text-center font-mono">
                        {fraction}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">=</div>
                      <div className="flex-grow">
                        <select
                          value={matchedType}
                          onChange={(e) => handleMatchingChange(fraction, e.target.value)}
                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                          disabled={isAnswerRevealed || hasReachedMaxAttempts}
                        >
                          <option value="">{settings.language === 'english' ? '-- Select Type --' : '-- Seleccionar Tipo --'}</option>
                          {types.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {hasReachedMaxAttempts && currentProblem.correctAnswer && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md">
                  <h3 className="text-sm font-medium text-green-800 dark:text-green-300 mb-2">
                    {settings.language === 'english' ? 'Correct Matching:' : 'Correspondencia Correcta:'}
                  </h3>
                  <ul className="text-sm text-green-700 dark:text-green-400">
                    {currentProblem.correctAnswer.map(answer => {
                      const [fraction, type] = answer.split('=');
                      return (
                        <li key={answer}>{fraction} = {type}</li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          );
        }
        return null;
        
      case 'write':
        return (
          <div className="space-y-4">
            <p className="text-lg text-gray-800 dark:text-gray-200">{currentProblem.question}</p>
            
            <div className="mt-4">
              <input
                ref={inputRef}
                type="text"
                value={writeAnswer}
                onChange={(e) => setWriteAnswer(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500"
                placeholder={settings.language === 'english' ? 'Your answer' : 'Tu respuesta'}
                disabled={isAnswerRevealed || hasReachedMaxAttempts}
              />
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {settings.language === 'english' 
                  ? 'For fractions use format "numerator/denominator", for mixed numbers use "whole numerator/denominator"' 
                  : 'Para fracciones usa el formato "numerador/denominador", para números mixtos usa "entero numerador/denominador"'
                }
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

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
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-pink-600 dark:text-pink-400">
            {settings.language === 'english' 
              ? 'Fraction Types' 
              : 'Tipos de Fracciones'
            }
          </h2>
          
          <button
            onClick={() => setShowTips(!showTips)}
            className={`p-2 rounded-full transition-colors ${
              showTips 
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-800 dark:text-indigo-200' 
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            <HelpCircle size={20} />
          </button>
        </div>

        <AnimatePresence>
          {showTips && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg mb-6 border border-indigo-200 dark:border-indigo-700"
            >
              <div className="space-y-3">
                <div>
                  <h3 className="font-bold text-indigo-700 dark:text-indigo-300">
                    {settings.language === 'english' ? 'Proper Fraction' : 'Fracción Propia'}
                  </h3>
                  <p className="text-indigo-600 dark:text-indigo-400 text-sm">
                    {settings.language === 'english'
                      ? 'Numerator < Denominator (e.g., 1/4, 3/5)'
                      : 'Numerador < Denominador (ej., 1/4, 3/5)'}
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-indigo-700 dark:text-indigo-300">
                    {settings.language === 'english' ? 'Improper Fraction' : 'Fracción Impropia'}
                  </h3>
                  <p className="text-indigo-600 dark:text-indigo-400 text-sm">
                    {settings.language === 'english'
                      ? 'Numerator ≥ Denominator (e.g., 7/5, 12/3)'
                      : 'Numerador ≥ Denominador (ej., 7/5, 12/3)'}
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-indigo-700 dark:text-indigo-300">
                    {settings.language === 'english' ? 'Mixed Number' : 'Número Mixto'}
                  </h3>
                  <p className="text-indigo-600 dark:text-indigo-400 text-sm">
                    {settings.language === 'english'
                      ? 'Whole Number + Proper Fraction (e.g., 2 1/3, 5 2/7)'
                      : 'Número Entero + Fracción Propia (ej., 2 1/3, 5 2/7)'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="text-center mb-6">
          {renderProblem()}
        </div>

        <AnimatePresence>
          {showFeedback && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`p-3 rounded-md text-center mb-4 ${
                isCorrect
                  ? 'bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-200'
              }`}
            >
              {isCorrect 
                ? (settings.language === 'english' ? '✓ Correct!' : '✓ ¡Correcto!') 
                : (settings.language === 'english' ? '✗ Incorrect' : '✗ Incorrecto')}
              
              {currentProblem.explanation && hasReachedMaxAttempts && (
                <div className="mt-2 text-sm italic">
                  {currentProblem.explanation}
                </div>
              )}
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
              type="button"
              onClick={() => handleSubmit()}
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors mb-2"
              disabled={isAnswerRevealed || hasReachedMaxAttempts}
            >
              {settings.language === 'english' ? 'Check Answer' : 'Verificar Respuesta'}
            </button>

            {!isAnswerRevealed && !hasReachedMaxAttempts && (
              <button
                type="button"
                onClick={handleShowAnswer}
                className="w-full mt-2 px-4 py-2 bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {settings.language === 'english' ? 'Show Answer' : 'Mostrar Respuesta'}
              </button>
            )}
          </>
        )}

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

export default FractionTypesExercise;