import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowRight, Star, Sparkles, Award, Volume2, VolumeX, RefreshCw, Hand, CheckCircle2, SettingsIcon as Confetti } from 'lucide-react';
import { Settings, Problem, ObjectSet } from './types';

// Default object sets
const getObjectSets = (): Record<string, ObjectSet> => ({
  animals: {
    name: 'animals',
    objects: [
      'https://images.pexels.com/photos/47547/squirrel-animal-cute-rodents-47547.jpeg?auto=compress&cs=tinysrgb&w=150',
      'https://images.pexels.com/photos/133459/pexels-photo-133459.jpeg?auto=compress&cs=tinysrgb&w=150',
      'https://images.pexels.com/photos/45170/kittens-cat-cat-puppy-rush-45170.jpeg?auto=compress&cs=tinysrgb&w=150',
      'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=150',
      'https://images.pexels.com/photos/1618606/pexels-photo-1618606.jpeg?auto=compress&cs=tinysrgb&w=150'
    ],
    colors: ['#FFC107', '#FF9800', '#FF5722', '#E91E63', '#9C27B0']
  },
  fruits: {
    name: 'fruits',
    objects: [
      'https://images.pexels.com/photos/161559/background-bitter-breakfast-bright-161559.jpeg?auto=compress&cs=tinysrgb&w=150',
      'https://images.pexels.com/photos/1132047/pexels-photo-1132047.jpeg?auto=compress&cs=tinysrgb&w=150',
      'https://images.pexels.com/photos/175727/pexels-photo-175727.jpeg?auto=compress&cs=tinysrgb&w=150',
      'https://images.pexels.com/photos/8566474/pexels-photo-8566474.jpeg?auto=compress&cs=tinysrgb&w=150',
      'https://images.pexels.com/photos/70746/strawberries-red-fruit-royalty-free-70746.jpeg?auto=compress&cs=tinysrgb&w=150'
    ],
    colors: ['#FFEB3B', '#CDDC39', '#8BC34A', '#4CAF50', '#009688']
  },
  stars: {
    name: 'stars',
    objects: Array(5).fill('https://images.pexels.com/photos/998641/pexels-photo-998641.jpeg?auto=compress&cs=tinysrgb&w=150'),
    colors: ['#FFC107', '#FF9800', '#FF5722', '#E91E63', '#9C27B0']
  },
  shapes: {
    name: 'shapes',
    objects: Array(5).fill('https://images.pexels.com/photos/5849577/pexels-photo-5849577.jpeg?auto=compress&cs=tinysrgb&w=150'),
    colors: ['#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50']
  }
});

// Default settings with Spanish as default
const DEFAULT_SETTINGS: Settings = {
  maximumNumber: 10,
  objectSet: 'animals',
  audioEnabled: true,
  language: 'spanish',
  progressiveMode: true,
  countingStyle: 'tap',
  rewardFrequency: 5
};

// Number names in different languages
const NUMBER_NAMES: Record<string, string[]> = {
  english: [
    'zero', 'one', 'two', 'three', 'four', 'five', 
    'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
    'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty',
    'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four', 'twenty-five',
    'twenty-six', 'twenty-seven', 'twenty-eight', 'twenty-nine', 'thirty',
    'thirty-one', 'thirty-two', 'thirty-three', 'thirty-four', 'thirty-five',
    'thirty-six', 'thirty-seven', 'thirty-eight', 'thirty-nine', 'forty',
    'forty-one', 'forty-two', 'forty-three', 'forty-four', 'forty-five',
    'forty-six', 'forty-seven', 'forty-eight', 'forty-nine', 'fifty'
  ],
  spanish: [
    'cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco',
    'seis', 'siete', 'ocho', 'nueve', 'diez',
    'once', 'doce', 'trece', 'catorce', 'quince',
    'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
    'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco',
    'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve', 'treinta',
    'treinta y uno', 'treinta y dos', 'treinta y tres', 'treinta y cuatro', 'treinta y cinco',
    'treinta y seis', 'treinta y siete', 'treinta y ocho', 'treinta y nueve', 'cuarenta',
    'cuarenta y uno', 'cuarenta y dos', 'cuarenta y tres', 'cuarenta y cuatro', 'cuarenta y cinco',
    'cuarenta y seis', 'cuarenta y siete', 'cuarenta y ocho', 'cuarenta y nueve', 'cincuenta'
  ]
};

// Positive messages by language
const POSITIVE_MESSAGES: Record<string, string[]> = {
  english: ['Great job!', 'Excellent!', 'You did it!', 'Well done!', 'Amazing!'],
  spanish: ['¡Muy bien!', '¡Excelente!', '¡Lo lograste!', '¡Bien hecho!', '¡Asombroso!']
};

export const CountingExercise: React.FC = () => {
  // Load settings
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('counting_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // State
  const [currentNumber, setCurrentNumber] = useState<number>(1);
  const [tappedCount, setTappedCount] = useState<number>(0);
  const [objectSet, setObjectSet] = useState<ObjectSet>(getObjectSets()[settings.objectSet]);
  const [objects, setObjects] = useState<string[]>([]);
  const [showReward, setShowReward] = useState<boolean>(false);
  const [completedNumbers, setCompletedNumbers] = useState<number[]>([]);
  const [isTapping, setIsTapping] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(!settings.audioEnabled);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update objects based on current number
  useEffect(() => {
    if (currentNumber <= 0) return;
    
    // Create the array of objects to display based on current number
    const selectedSet = getObjectSets()[settings.objectSet];
    const objectsToShow: string[] = [];
    
    for (let i = 0; i < currentNumber; i++) {
      const index = i % selectedSet.objects.length;
      objectsToShow.push(selectedSet.objects[index]);
    }
    
    setObjectSet(selectedSet);
    setObjects(objectsToShow);
    
    // Reset tapped count when new number is set
    if (settings.countingStyle === 'tap') {
      setTappedCount(0);
    }

    // Show a hint after 5 seconds if the child hasn't started tapping
    if (settings.countingStyle === 'tap') {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
      
      hintTimeoutRef.current = setTimeout(() => {
        if (tappedCount === 0) {
          setShowHint(true);
          // Hide hint after 3 seconds
          setTimeout(() => setShowHint(false), 3000);
        }
      }, 5000);
    }

    // Play audio for the current number
    playNumberAudio();

    // Check if should show reward
    if (settings.rewardFrequency > 0 && currentNumber % settings.rewardFrequency === 0) {
      setTimeout(() => {
        setShowReward(true);
        setTimeout(() => setShowReward(false), 3000);
      }, 500);
    }

    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, [currentNumber, settings.objectSet, settings.countingStyle, settings.rewardFrequency]);

  // Update settings when they change
  useEffect(() => {
    setIsAudioMuted(!settings.audioEnabled);
  }, [settings.audioEnabled]);

  // Play audio for number
  const playNumberAudio = () => {
    if (isAudioMuted) return;
    
    try {
      // In a real app, this would use actual audio files
      // For this demo, we're just showing the concept
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // This would be replaced with actual audio playback in a real app
      const language = settings.language;
      const numberName = NUMBER_NAMES[language][currentNumber] || currentNumber.toString();
      
      console.log(`Playing audio for number: ${numberName} in ${language}`);
      // Audio playback would happen here
    } catch (error) {
      console.error("Error playing number audio:", error);
    }
  };

  // Handle tapping on an object
  const handleObjectTap = (index: number) => {
    if (settings.countingStyle !== 'tap' || isTapping) return;
    
    if (tappedCount >= currentNumber) return;
    
    setIsTapping(true);
    
    // Increment count
    const newCount = tappedCount + 1;
    setTappedCount(newCount);
    
    // Play tap sound
    if (!isAudioMuted) {
      // Play tap sound (would be implemented in a real app)
      console.log("Playing tap sound");
    }
    
    // Show success when all objects are tapped
    if (newCount === currentNumber) {
      // Show success feedback
      toast.success(
        settings.language === 'english' 
          ? `You counted to ${currentNumber}!` 
          : `¡Contaste hasta ${currentNumber}!`
      );
      
      // Add to completed numbers
      setCompletedNumbers(prev => [...prev, currentNumber]);
      
      // Show next button after a brief delay
      setTimeout(() => {
        setIsTapping(false);
      }, 500);
    } else {
      setIsTapping(false);
    }
  };

  // Handle proceeding to the next number
  const handleNextNumber = () => {
    if (currentNumber >= settings.maximumNumber) {
      // Exercise completed
      setIsCompleted(true);
      toast.success(
        settings.language === 'english'
          ? `Great job! You've learned to count to ${settings.maximumNumber}!`
          : `¡Muy bien! ¡Has aprendido a contar hasta ${settings.maximumNumber}!`
      );
      
      // Show completion reward
      setShowReward(true);
      setTimeout(() => {
        setShowReward(false);
        // Reset to start over
        setCurrentNumber(1);
        setCompletedNumbers([]);
        setIsCompleted(false);
      }, 5000);
    } else {
      // Move to the next number
      setCurrentNumber(currentNumber + 1);
    }
  };

  // Handle resetting the exercise
  const handleReset = () => {
    setCurrentNumber(1);
    setCompletedNumbers([]);
    setTappedCount(0);
    setShowReward(false);
    setIsCompleted(false);
    
    toast.info(
      settings.language === 'english'
        ? 'Starting over from 1!'
        : '¡Comenzando de nuevo desde 1!'
    );
  };

  // Random positive message
  const getRandomPositiveMessage = (): string => {
    const messages = POSITIVE_MESSAGES[settings.language];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Progress percentage
  const progressPercentage = (currentNumber / settings.maximumNumber) * 100;

  // Render the counting exercise
  return (
    <div className="max-w-4xl mx-auto">
      {/* Audio element (would be used in real implementation) */}
      <audio ref={audioRef} />
      
      {/* Top controls */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          <button 
            onClick={handleReset}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
            title={settings.language === 'english' ? 'Reset' : 'Reiniciar'}
          >
            <RefreshCw size={20} />
          </button>
          <button
            onClick={() => setIsAudioMuted(!isAudioMuted)}
            className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
            title={settings.language === 'english' ? (isAudioMuted ? 'Unmute' : 'Mute') : (isAudioMuted ? 'Activar sonido' : 'Silenciar')}
          >
            {isAudioMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
        
        <div className="text-center flex-grow">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {settings.language === 'english'
              ? `Counting from 1 to ${settings.maximumNumber}`
              : `Contando del 1 al ${settings.maximumNumber}`
            }
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <motion.div 
          className="bg-indigo-600 h-2.5 rounded-full" 
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Current number display */}
      <div className="mb-8 text-center">
        <motion.div
          key={`number-${currentNumber}`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="text-8xl sm:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400"
        >
          {currentNumber}
        </motion.div>
        <p className="mt-4 text-3xl text-gray-600 dark:text-gray-300">
          {NUMBER_NAMES[settings.language][currentNumber] || currentNumber}
        </p>
      </div>

      {/* Objects to count */}
      <div className="mb-8">
        <div className="flex flex-wrap justify-center gap-4 items-center">
          <AnimatePresence>
            {objects.map((objectUrl, index) => (
              <motion.div
                key={`object-${currentNumber}-${index}`}
                initial={{ scale: 0, opacity: 0, rotate: -10 }}
                animate={{ 
                  scale: 1, 
                  opacity: 1, 
                  rotate: Math.random() * 20 - 10,
                  transition: { delay: settings.countingStyle === 'sequence' ? index * 0.2 : 0.1 }
                }}
                whileTap={{ scale: 0.9 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={() => handleObjectTap(index)}
                className={`relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white dark:bg-gray-700 rounded-lg shadow-md overflow-hidden cursor-pointer
                  ${tappedCount > index ? 'ring-2 ring-green-500' : ''}
                  ${showHint && tappedCount === 0 && index === 0 ? 'animate-pulse ring-2 ring-yellow-500' : ''}
                `}
                style={{ backgroundColor: objectSet.colors[index % objectSet.colors.length] }}
              >
                <img 
                  src={objectUrl} 
                  alt={`Counting object ${index + 1}`} 
                  className="w-full h-full object-cover"
                />
                
                {tappedCount > index && settings.countingStyle === 'tap' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                    <span className="text-white text-xl font-bold">{index + 1}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Instruction and hint */}
      <div className="text-center mb-6">
        <p className="text-xl text-gray-700 dark:text-gray-300">
          {settings.countingStyle === 'tap' 
            ? (settings.language === 'english' ? 'Tap to count!' : '¡Toca para contar!') 
            : (settings.language === 'english' ? 'Count along!' : '¡Cuenta conmigo!')}
        </p>
        
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-2 flex items-center justify-center space-x-2 text-yellow-600 dark:text-yellow-400"
          >
            <Hand className="animate-bounce" size={24} />
            <p className="text-lg">
              {settings.language === 'english' 
                ? 'Tap on the objects to count them!' 
                : '¡Toca los objetos para contarlos!'}
            </p>
          </motion.div>
        )}
      </div>

      {/* Control buttons */}
      <div className="flex justify-center">
        {settings.countingStyle === 'tap' ? (
          // For tap mode, show next button only when all objects are tapped
          tappedCount === currentNumber && (
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleNextNumber}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors shadow-lg"
            >
              <span className="mr-2">
                {settings.language === 'english' ? 'Next Number' : 'Siguiente Número'}
              </span>
              <ArrowRight size={20} />
            </motion.button>
          )
        ) : (
          // For sequence mode, show next button always
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNextNumber}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-lg"
          >
            <span className="mr-2">
              {settings.language === 'english' ? 'Next Number' : 'Siguiente Número'}
            </span>
            <ArrowRight size={20} />
          </motion.button>
        )}
      </div>

      {/* Rewards animation */}
      <AnimatePresence>
        {showReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="relative">
              <motion.div 
                initial={{ scale: 0.5, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="bg-yellow-100 dark:bg-yellow-900 p-6 rounded-xl shadow-xl border-4 border-yellow-500 dark:border-yellow-600"
              >
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 flex items-center mb-3">
                  <Award size={32} className="mr-2" />
                  {settings.language === 'english' ? 'Great job!' : '¡Muy bien!'}
                </div>
                <p className="text-xl text-gray-800 dark:text-gray-200">
                  {settings.language === 'english'
                    ? isCompleted 
                        ? `You learned to count to ${settings.maximumNumber}!` 
                        : `You counted to ${currentNumber}!`
                    : isCompleted 
                        ? `¡Aprendiste a contar hasta el ${settings.maximumNumber}!`
                        : `¡Contaste hasta el ${currentNumber}!`
                  }
                </p>
                <div className="mt-3 flex justify-center">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1], 
                      rotate: [0, 5, -5, 0] 
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <CheckCircle2 size={48} className="text-green-500" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Animated stars */}
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={`star-${i}`}
                  initial={{ 
                    x: 0, 
                    y: 0,
                    scale: 0,
                    opacity: 0 
                  }}
                  animate={{ 
                    x: (Math.random() - 0.5) * 300,
                    y: (Math.random() - 0.5) * 300,
                    scale: Math.random() * 0.5 + 0.5,
                    opacity: Math.random() * 0.7 + 0.3,
                    rotate: Math.random() * 360
                  }}
                  transition={{ 
                    duration: 1.5, 
                    delay: i * 0.05,
                    ease: "easeOut" 
                  }}
                  className="absolute text-yellow-400 dark:text-yellow-300"
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                  }}
                >
                  {i % 2 === 0 ? (
                    <Star size={Math.random() * 20 + 10} fill="currentColor" />
                  ) : (
                    <Sparkles size={Math.random() * 20 + 10} />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completion screen */}
      <AnimatePresence>
        {isCompleted && !showReward && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-40 bg-black bg-opacity-50"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="text-center">
                <Confetti className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">
                  {settings.language === 'english' ? 'Congratulations!' : '¡Felicidades!'}
                </h2>
                <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
                  {settings.language === 'english'
                    ? `You've learned to count to ${settings.maximumNumber}!`
                    : `¡Has aprendido a contar hasta ${settings.maximumNumber}!`
                  }
                </p>
                
                <div className="flex justify-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleReset}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors shadow-lg"
                  >
                    {settings.language === 'english' ? 'Start Again' : 'Comenzar de Nuevo'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CountingExercise;