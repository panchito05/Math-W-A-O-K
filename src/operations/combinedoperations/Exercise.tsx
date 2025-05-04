import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  ArrowLeft, ArrowRight, Eye, RotateCcw, AlertCircle, 
  CheckCircle, X, HelpCircle, Calculator, Award, Brain, 
  BookOpen, ListOrdered
} from 'lucide-react';

import { Problem, UserAnswer, Settings } from './types';
import { generateProblem, checkAnswer, getDifficultyLevels } from './utils';

// Constants
const DEFAULT_SETTINGS: Settings = {
  difficulty: 1,
  problemCount: 10,
  timeLimit: 0,
  maxAttempts: 3,
  adaptiveDifficulty: true,
  enableCompensation: false,
  autoContinue: true,
  language: 'spanish',
  showStepsImmediately: false,
  useDecimals: false,
  operatorsToInclude: {
    addition: true,
    subtraction: true,
    multiplication: true,
    division: true,
    exponents: false,
    parentheses: false,
    roots: false
  }
};

const CORRECT_STREAK_THRESHOLD = 10;
const AUTO_CONTINUE_DELAY = 2000;
const TOOLTIP_DISPLAY_TIME = 3000;

export const CombinedOperationsExercise: React.FC = () => {
  // Emit progress event
  const emitProgress = useCallback((data: { correct: boolean; timeSpent: number; difficulty: number; attempts: number; revealed: boolean }) => {
    const event = new CustomEvent('operationProgress', { 
      detail: { 
        operationType: 'combinedoperations', 
        ...data 
      } 
    });
    window.dispatchEvent(event);
  }, []);

  // Settings
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('combinedoperations_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // Problem State
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // UI State
  const [currentAttempts, setCurrentAttempts] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [consecutiveCorrectAnswers, setConsecutiveCorrectAnswers] = useState(0);
  const [targetProblemCount, setTargetProblemCount] = useState(settings.problemCount);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [showAutoContinueTooltip, setShowAutoContinueTooltip] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Refs
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTime = useRef(Date.now());
  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize first problem
  useEffect(() => {
    const newProblem = generateProblem(settings);
    setCurrentProblem(newProblem);
    startTime.current = Date.now();
    
    if (settings.showStepsImmediately) {
      setShowSteps(true);
    }
  }, [settings]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
      if (tooltipTimerRef.current) clearTimeout(tooltipTimerRef.current);
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
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
    if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);

    if (currentIndex < targetProblemCount - 1) {
      setCurrentIndex(prev => prev + 1);
      
      // Generate a new problem with current settings
      const newProblem = generateProblem(settings);
      setCurrentProblem(newProblem);
      
      // Reset state for new problem
      setInputValue('');
      setShowSteps(settings.showStepsImmediately);
      setCurrentStep(0);
      setCurrentAttempts(0);
      setShowContinueButton(false);
      setShowFeedback(false);
      setIsAnswerRevealed(false);
      setIsCorrect(false);
      startTime.current = Date.now();
      
      // Focus the input
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

  // PEMDAS explanation by language
  const getPemdasExplanation = (language: 'english' | 'spanish') => {
    return language === 'english' 
    ? (
      <div>
        <h3 className="font-bold text-lg mb-3">Order of Operations (PEMDAS)</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>P</strong>arentheses: Solve everything inside parentheses first</li>
          <li><strong>E</strong>xponents: Calculate all exponents and roots</li>
          <li><strong>M</strong>ultiplication & <strong>D</strong>ivision: From left to right</li>
          <li><strong>A</strong>ddition & <strong>S</strong>ubtraction: From left to right</li>
        </ol>
      </div>
    ) : (
      <div>
        <h3 className="font-bold text-lg mb-3">Orden de Operaciones (PEMDAS)</h3>
        <ol className="list-decimal pl-5 space-y-2">
          <li><strong>P</strong>aréntesis: Resolver todo lo que está dentro de paréntesis primero</li>
          <li><strong>E</strong>xponentes: Calcular todos los exponentes y raíces</li>
          <li><strong>M</strong>ultiplicación & <strong>D</strong>ivisión: De izquierda a derecha</li>
          <li><strong>A</strong>dición & <strong>S</strong>ustracción: De izquierda a derecha</li>
        </ol>
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProblem) return;

    if (!inputValue.trim()) {
      toast.error(settings.language === 'english' 
        ? 'Please enter an answer.' 
        : 'Por favor, ingresa una respuesta.');
      return;
    }

    // Validate numeric input
    if (isNaN(parseFloat(inputValue))) {
      toast.error(settings.language === 'english' 
        ? 'Please enter a valid number.' 
        : 'Por favor, ingresa un número válido.');
      return;
    }

    const timeSpent = (Date.now() - startTime.current) / 1000;
    const attemptsSoFar = currentAttempts + 1;
    const correct = checkAnswer(inputValue, currentProblem.solution);

    setCurrentAttempts(attemptsSoFar);
    setIsCorrect(correct);
    setShowFeedback(true);
    setShowSteps(true);

    // Always show all steps when checking answer
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
      stepIntervalRef.current = null;
      setCurrentStep(currentProblem.steps.length - 1);
    }

    // Update consecutive correct answers
    if (correct && settings.adaptiveDifficulty) {
      const newStreak = consecutiveCorrectAnswers + 1;
      setConsecutiveCorrectAnswers(newStreak);

      if (newStreak >= CORRECT_STREAK_THRESHOLD && settings.difficulty < 5) {
        const newDifficulty = (settings.difficulty + 1) as 1 | 2 | 3 | 4 | 5;
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
        answer: inputValue,
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
          ? `Incorrect. The correct answer is ${currentProblem.solution}` 
          : `Incorrecto. La respuesta correcta es ${currentProblem.solution}`);
        
        setUserAnswers(prev => [...prev, {
          problem: currentProblem,
          answer: inputValue,
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
      answer: '',
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

    // Show all steps when revealing answer
    setShowSteps(true);
    setCurrentStep(currentProblem.steps.length - 1);
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
    setCurrentProblem(generateProblem(settings));
    setInputValue('');
    setShowSteps(settings.showStepsImmediately);
    setCurrentStep(0);
    setUserAnswers([]);
    setIsComplete(false);
    setCurrentAttempts(0);
    setShowFeedback(false);
    setIsAnswerRevealed(false);
    setConsecutiveCorrectAnswers(0);
    setTargetProblemCount(settings.problemCount);
    startTime.current = Date.now();
  };

  // Toggle the help modal
  const toggleHelpModal = () => {
    setShowHelpModal(!showHelpModal);
  };

  // Format the expression with color-coding
  const formatColorizedExpression = (expression: string): JSX.Element => {
    // Replace operators with colored spans
    const parts = [];
    let i = 0;
    let inParentheses = false;
    let parenthesesDepth = 0;
    
    while (i < expression.length) {
      if (expression[i] === '(') {
        inParentheses = true;
        parenthesesDepth++;
        parts.push(<span key={`open-${i}`} className="text-purple-600 dark:text-purple-400 font-bold">(</span>);
        i++;
      } else if (expression[i] === ')') {
        parenthesesDepth--;
        if (parenthesesDepth === 0) inParentheses = false;
        parts.push(<span key={`close-${i}`} className="text-purple-600 dark:text-purple-400 font-bold">)</span>);
        i++;
      } else if (expression[i] === '+') {
        parts.push(<span key={`op-${i}`} className="text-green-600 dark:text-green-400 font-bold"> + </span>);
        i++;
      } else if (expression[i] === '-') {
        parts.push(<span key={`op-${i}`} className="text-red-600 dark:text-red-400 font-bold"> - </span>);
        i++;
      } else if (expression[i] === '×') {
        parts.push(<span key={`op-${i}`} className="text-blue-600 dark:text-blue-400 font-bold"> × </span>);
        i++;
      } else if (expression[i] === '÷') {
        parts.push(<span key={`op-${i}`} className="text-amber-600 dark:text-amber-400 font-bold"> ÷ </span>);
        i++;
      } else if (expression[i] === '^') {
        parts.push(<span key={`op-${i}`} className="text-pink-600 dark:text-pink-400 font-bold">^</span>);
        i++;
      } else if (expression[i] === '√') {
        parts.push(<span key={`op-${i}`} className="text-orange-600 dark:text-orange-400 font-bold">√</span>);
        i++;
      } else if (/\d/.test(expression[i])) {
        // Collect the entire number (including decimals)
        let numStr = '';
        while (i < expression.length && (/\d/.test(expression[i]) || expression[i] === '.')) {
          numStr += expression[i];
          i++;
        }
        parts.push(<span key={`num-${i}`} className={inParentheses ? "text-indigo-600 dark:text-indigo-400 font-semibold" : "text-gray-800 dark:text-gray-200"}>{numStr}</span>);
      } else {
        // Spaces and other characters
        parts.push(expression[i]);
        i++;
      }
    }
    
    return <>{parts}</>;
  };

  const showStepByStep = () => {
    if (!currentProblem) return;
    
    // Reset to beginning
    setCurrentStep(0);
    
    // Show one step at a time with interval
    if (stepIntervalRef.current) {
      clearInterval(stepIntervalRef.current);
    }
    
    stepIntervalRef.current = setInterval(() => {
      setCurrentStep(prevStep => {
        const nextStep = prevStep + 1;
        
        // Stop the interval when we've shown all steps
        if (nextStep >= currentProblem.steps.length) {
          if (stepIntervalRef.current) {
            clearInterval(stepIntervalRef.current);
            stepIntervalRef.current = null;
          }
        }
        
        return Math.min(nextStep, currentProblem.steps.length - 1);
      });
    }, 1500);
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
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
              <p className="text-sm text-indigo-600 dark:text-indigo-300">
                {settings.language === 'english' ? 'Difficulty' : 'Dificultad'}
              </p>
              <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-200">
                {settings.difficulty}/5
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">
              {settings.language === 'english' ? 'Problem Review' : 'Revisión de Problemas'}
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border dark:border-gray-700 rounded-md p-2">
              {userAnswers.map((answer, index) => (
                <div 
                  key={index} 
                  className={`p-3 rounded-md ${
                    answer.isCorrect 
                      ? 'bg-green-50 dark:bg-green-900/30' 
                      : answer.wasRevealed 
                        ? 'bg-amber-50 dark:bg-amber-900/30' 
                        : 'bg-red-50 dark:bg-red-900/30'
                  }`}
                >
                  <div className="flex justify-between">
                    <span className="font-mono">
                      {answer.problem.expression}
                    </span>
                    <span className="font-semibold">
                      {answer.isCorrect 
                        ? <CheckCircle className="text-green-500 inline-block" size={18} />
                        : answer.wasRevealed 
                          ? <Eye className="text-amber-500 inline-block" size={18} /> 
                          : <X className="text-red-500 inline-block" size={18} />
                      }
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {settings.language === 'english' ? 'Your answer:' : 'Tu respuesta:'} 
                      <span className={`font-bold ${
                        answer.isCorrect 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {' '}{answer.wasRevealed ? '-' : answer.answer}
                      </span>
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {settings.language === 'english' ? 'Correct:' : 'Correcta:'} 
                      <span className="font-bold text-green-600 dark:text-green-400">
                        {' '}{answer.problem.solution}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
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
              {settings.language === 'english' ? 'Expression' : 'Expresión'}
            </p>
            <div className="text-3xl font-mono font-bold bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-inner">
              {formatColorizedExpression(reviewAnswer.problem.expression)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
              <p className="text-lg text-red-600 dark:text-red-400 mb-2">
                {settings.language === 'english' ? 'Your Answer' : 'Tu Respuesta'}
              </p>
              {reviewAnswer.wasRevealed ? (
                <p className="text-lg italic text-amber-600 dark:text-amber-400">
                  {settings.language === 'english' ? '(Answer revealed)' : '(Respuesta revelada)'}
                </p>
              ) : (
                <p className={`text-2xl font-bold ${
                  reviewAnswer.isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  {reviewAnswer.answer}
                </p>
              )}
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
              <p className="text-lg text-green-600 dark:text-green-400 mb-2">
                {settings.language === 'english' ? 'Correct Answer' : 'Respuesta Correcta'}
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {reviewAnswer.problem.solution}
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
            <p className="text-lg text-blue-600 dark:text-blue-400 mb-2 flex items-center justify-center">
              <ListOrdered className="mr-2" size={20} />
              {settings.language === 'english' ? 'Solution Steps' : 'Pasos de Solución'}
            </p>
            <ol className="text-left list-decimal pl-6 space-y-2 mt-3">
              {reviewAnswer.problem.steps.map((step, stepIndex) => (
                <li 
                  key={stepIndex}
                  className={`text-gray-700 dark:text-gray-300 ${
                    stepIndex === reviewAnswer.problem.steps.length - 1 
                      ? 'font-bold text-green-600 dark:text-green-400' : ''
                  }`}
                >
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="mt-auto flex justify-between items-center pt-4">
          <button
            onClick={handleReviewPrev}
            disabled={reviewIndex === 0}
            className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 flex items-center gap-1 transition-colors"
            aria-label={settings.language === 'english' ? 'Previous Problem' : 'Problema Anterior'}
          >
            <ArrowLeft size={14} />
            {settings.language === 'english' ? 'Prev' : 'Anterior'}
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
            {settings.language === 'english' ? 'Next' : 'Siguiente'}
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>
    );
  }

  // Help modal
  const helpModal = (
    <AnimatePresence>
      {showHelpModal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowHelpModal(false)}
        >
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-lg w-full shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
                <BookOpen className="mr-2 text-indigo-600" size={22} />
                {settings.language === 'english' ? 'Order of Operations Help' : 'Ayuda con el Orden de Operaciones'}
              </h2>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* PEMDAS Explanation */}
              <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-lg">
                {getPemdasExplanation(settings.language)}
              </div>
              
              {/* Examples */}
              <div>
                <h3 className="font-bold text-lg mb-3">
                  {settings.language === 'english' ? 'Examples:' : 'Ejemplos:'}
                </h3>
                <div className="space-y-3">
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="font-mono font-bold">3 + 2 × 5 = 13</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {settings.language === 'english' 
                        ? 'First multiply: 2 × 5 = 10, then add: 3 + 10 = 13' 
                        : 'Primero multiplicar: 2 × 5 = 10, luego sumar: 3 + 10 = 13'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="font-mono font-bold">(4 + 2) × 3 = 18</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {settings.language === 'english' 
                        ? 'First parentheses: 4 + 2 = 6, then multiply: 6 × 3 = 18' 
                        : 'Primero paréntesis: 4 + 2 = 6, luego multiplicar: 6 × 3 = 18'}
                    </p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="font-mono font-bold">2² + 8 ÷ 4 = 6</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {settings.language === 'english' 
                        ? 'First exponent: 2² = 4, then division: 8 ÷ 4 = 2, then addition: 4 + 2 = 6' 
                        : 'Primero exponente: 2² = 4, luego división: 8 ÷ 4 = 2, luego suma: 4 + 2 = 6'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Mnemonic */}
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-2 text-yellow-800 dark:text-yellow-300">
                  {settings.language === 'english' ? 'Remember:' : 'Recuerda:'}
                </h3>
                <p className="text-yellow-700 dark:text-yellow-400">
                  {settings.language === 'english' 
                    ? 'Please Excuse My Dear Aunt Sally' 
                    : 'Primero Escucho Muy Despacio A Susana'}
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {settings.language === 'english' ? 'Got it!' : '¡Entendido!'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="max-w-3xl mx-auto">
      {helpModal}
      
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
          <div className="flex items-center gap-2">
            <button
              onClick={toggleHelpModal}
              className="p-1 text-gray-500 hover:text-indigo-600 transition-colors"
              aria-label={settings.language === 'english' ? 'PEMDAS Help' : 'Ayuda PEMDAS'}
              title={settings.language === 'english' ? 'PEMDAS Help' : 'Ayuda PEMDAS'}
            >
              <HelpCircle size={18} />
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              {settings.language === 'english' 
                ? `Difficulty: ${settings.difficulty}/5` 
                : `Dificultad: ${settings.difficulty}/5`
              }
            </span>
          </div>
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
          <h2 className="text-2xl font-bold mb-6 text-indigo-600 dark:text-indigo-400 flex items-center justify-center gap-2">
            <Calculator size={24} />
            {settings.language === 'english' ? 'Combined Operations' : 'Operaciones Combinadas'}
          </h2>

          {/* Problem display with color-coded operators */}
          <div className="mb-8 py-4 px-2 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner">
            <div className="text-3xl font-mono font-bold">
              {formatColorizedExpression(currentProblem.expression)}
            </div>
          </div>

          {/* Steps */}
          {showSteps && (
            <div className="mb-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 text-left">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center">
                  <Brain className="mr-2" size={18} />
                  {settings.language === 'english' ? 'Solution Steps' : 'Pasos de la Solución'}
                </h3>
                {currentProblem.steps.length > 2 && (
                  <button 
                    onClick={showStepByStep}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {settings.language === 'english' ? 'Show step by step' : 'Mostrar paso a paso'}
                  </button>
                )}
              </div>
              
              <ol className="space-y-1 text-gray-700 dark:text-gray-300 list-decimal pl-6">
                {currentProblem.steps.slice(0, currentStep + 1).map((step, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={`${
                      index === currentProblem.steps.length - 1 
                        ? 'font-bold text-indigo-600 dark:text-indigo-400' 
                        : ''
                    }`}
                  >
                    {step}
                  </motion.li>
                ))}
              </ol>
            </div>
          )}

          {/* Input form and feedback */}
          <div className={`${showFeedback ? 'mb-4' : ''}`}>
            {showFeedback && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-3 rounded-lg mb-4 ${
                  isCorrect 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                }`}
              >
                <div className="flex items-center">
                  {isCorrect ? (
                    <><CheckCircle size={20} className="mr-2" /> 
                    {settings.language === 'english' ? 'Correct!' : '¡Correcto!'}</>
                  ) : (
                    <><AlertCircle size={20} className="mr-2" /> 
                    {settings.language === 'english' 
                      ? `Incorrect. ${hasReachedMaxAttempts ? `The correct answer is ${currentProblem.solution}.` : 'Try again!'}`
                      : `Incorrecto. ${hasReachedMaxAttempts ? `La respuesta correcta es ${currentProblem.solution}.` : '¡Intenta de nuevo!'}`
                    }
                    </>
                  )}
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className={`${hasReachedMaxAttempts || isAnswerRevealed ? 'opacity-50' : ''}`}>
              <div className="mb-4">
                <label htmlFor="answer-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {settings.language === 'english' ? 'Your Answer' : 'Tu Respuesta'}
                </label>
                <input
                  ref={inputRef}
                  id="answer-input"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  placeholder={settings.language === 'english' ? 'Enter your answer' : 'Ingresa tu respuesta'}
                  disabled={hasReachedMaxAttempts || isAnswerRevealed}
                />
              </div>
            </form>

            {showContinueButton ? (
              <button
                onClick={handleContinue}
                className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                {settings.language === 'english' 
                  ? currentIndex < targetProblemCount - 1 ? 'Continue to Next Problem' : 'Show Results' 
                  : currentIndex < targetProblemCount - 1 ? 'Continuar al Siguiente Problema' : 'Mostrar Resultados'}
                <ArrowRight size={18} className="ml-2" />
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={hasReachedMaxAttempts || isAnswerRevealed}
                  className="w-full py-2 px-4 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {settings.language === 'english' ? 'Check Answer' : 'Verificar Respuesta'}
                </button>
                <button
                  onClick={handleShowAnswer}
                  disabled={hasReachedMaxAttempts || isAnswerRevealed}
                  className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {settings.language === 'english' ? 'Show Answer' : 'Mostrar Respuesta'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PEMDAS reference */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-indigo-100 dark:border-indigo-900">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center">
              <BookOpen className="mr-2" size={18} />
              PEMDAS
            </h3>
            <button
              onClick={toggleHelpModal}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center"
            >
              <HelpCircle size={14} className="mr-1" />
              {settings.language === 'english' ? 'More info' : 'Más información'}
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className={`p-1 rounded ${currentProblem.hasParentheses ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <span className="font-bold text-purple-600 dark:text-purple-400">P</span>
              <span className="text-gray-700 dark:text-gray-300">arenteses</span>
            </div>
            <div className={`p-1 rounded ${currentProblem.hasExponents ? 'bg-pink-100 dark:bg-pink-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <span className="font-bold text-pink-600 dark:text-pink-400">E</span>
              <span className="text-gray-700 dark:text-gray-300">xponentes</span>
            </div>
            <div className={`p-1 rounded ${currentProblem.operators.includes('×') || currentProblem.operators.includes('÷') ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <span className="font-bold text-blue-600 dark:text-blue-400">MD</span>
              <span className="text-gray-700 dark:text-gray-300">ult/Div</span>
            </div>
            <div className={`p-1 rounded ${currentProblem.operators.includes('+') || currentProblem.operators.includes('-') ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
              <span className="font-bold text-green-600 dark:text-green-400">AS</span>
              <span className="text-gray-700 dark:text-gray-300">uma/Resta</span>
            </div>
            <div className="col-span-2 text-right">
              <span className="text-gray-500 dark:text-gray-400 text-xs italic">
                {settings.language === 'english' 
                  ? '→ Solve from left to right' 
                  : '→ Resolver de izquierda a derecha'}
              </span>
            </div>
          </div>
        </div>

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
      
      {/* Adaptive difficulty indicator */}
      {settings.adaptiveDifficulty && (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg mb-6 text-center text-sm text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <Award className="mr-2" size={16} />
          {settings.language === 'english' 
            ? `Streak: ${consecutiveCorrectAnswers}/${CORRECT_STREAK_THRESHOLD} to level up` 
            : `Racha: ${consecutiveCorrectAnswers}/${CORRECT_STREAK_THRESHOLD} para subir de nivel`}
        </div>
      )}
    </div>
  );
};

export default CombinedOperationsExercise;