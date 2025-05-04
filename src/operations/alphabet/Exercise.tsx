import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Volume2, VolumeX, RefreshCw, Hand, CheckCircle2, Star, Sparkles, Award, HelpCircle, Settings as SettingsIcon, BookOpen, LucideCrop as LucideProps } from 'lucide-react';
import { Settings, LetterObject, Problem, UserProgress } from './types';

// Default letters data
const getAlphabetData = (): LetterObject[] => [
  {
    letter: 'A',
    lowercase: 'a',
    image: 'https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Apple', spanish: 'Árbol' },
    color: '#FF5252'
  },
  {
    letter: 'B',
    lowercase: 'b',
    image: 'https://images.pexels.com/photos/1398655/pexels-photo-1398655.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Ball', spanish: 'Barco' },
    color: '#7C4DFF'
  },
  {
    letter: 'C',
    lowercase: 'c',
    image: 'https://images.pexels.com/photos/35612/cat-feline-cute-domestic.jpg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Cat', spanish: 'Casa' },
    color: '#FF9800'
  },
  {
    letter: 'D',
    lowercase: 'd',
    image: 'https://images.pexels.com/photos/160846/french-bulldog-summer-smile-joy-160846.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Dog', spanish: 'Dedo' },
    color: '#2196F3'
  },
  {
    letter: 'E',
    lowercase: 'e',
    image: 'https://images.pexels.com/photos/589816/pexels-photo-589816.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Elephant', spanish: 'Elefante' },
    color: '#4CAF50'
  },
  {
    letter: 'F',
    lowercase: 'f',
    image: 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Flower', spanish: 'Flor' },
    color: '#FF4081'
  },
  {
    letter: 'G',
    lowercase: 'g',
    image: 'https://images.pexels.com/photos/3628100/pexels-photo-3628100.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Giraffe', spanish: 'Gato' },
    color: '#FFC107'
  },
  {
    letter: 'H',
    lowercase: 'h',
    image: 'https://images.pexels.com/photos/994892/pexels-photo-994892.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'House', spanish: 'Hormiga' },
    color: '#3F51B5'
  },
  {
    letter: 'I',
    lowercase: 'i',
    image: 'https://images.pexels.com/photos/1114900/pexels-photo-1114900.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Ice cream', spanish: 'Iglú' },
    color: '#E91E63'
  },
  {
    letter: 'J',
    lowercase: 'j',
    image: 'https://images.pexels.com/photos/5577250/pexels-photo-5577250.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Jellyfish', spanish: 'Juguete' },
    color: '#009688'
  },
  {
    letter: 'K',
    lowercase: 'k',
    image: 'https://images.pexels.com/photos/162008/kite-red-beach-fly-162008.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Kite', spanish: 'Kilómetro' },
    color: '#673AB7'
  },
  {
    letter: 'L',
    lowercase: 'l',
    image: 'https://images.pexels.com/photos/1021073/pexels-photo-1021073.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Lion', spanish: 'Luna' },
    color: '#CDDC39'
  },
  {
    letter: 'M',
    lowercase: 'm',
    image: 'https://images.pexels.com/photos/51343/cow-calf-beef-stock-51343.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Monkey', spanish: 'Manzana' },
    color: '#795548'
  },
  {
    letter: 'N',
    lowercase: 'n',
    image: 'https://images.pexels.com/photos/37833/rainbow-lorikeet-parrots-australia-rainbow-37833.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Nest', spanish: 'Naranja' },
    color: '#607D8B'
  },
  {
    letter: 'O',
    lowercase: 'o',
    image: 'https://images.pexels.com/photos/1509751/pexels-photo-1509751.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Octopus', spanish: 'Oso' },
    color: '#FF5722'
  },
  {
    letter: 'P',
    lowercase: 'p',
    image: 'https://images.pexels.com/photos/156888/pexels-photo-156888.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Penguin', spanish: 'Pájaro' },
    color: '#00BCD4'
  },
  {
    letter: 'Q',
    lowercase: 'q',
    image: 'https://images.pexels.com/photos/4051986/pexels-photo-4051986.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Queen', spanish: 'Queso' },
    color: '#8BC34A'
  },
  {
    letter: 'R',
    lowercase: 'r',
    image: 'https://images.pexels.com/photos/86594/goat-animal-horns-black-goat-86594.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Rabbit', spanish: 'Ratón' },
    color: '#FF9800'
  },
  {
    letter: 'S',
    lowercase: 's',
    image: 'https://images.pexels.com/photos/4693311/pexels-photo-4693311.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Sun', spanish: 'Sol' },
    color: '#FFEB3B'
  },
  {
    letter: 'T',
    lowercase: 't',
    image: 'https://images.pexels.com/photos/1618423/pexels-photo-1618423.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Tiger', spanish: 'Tigre' },
    color: '#FF9100'
  },
  {
    letter: 'U',
    lowercase: 'u',
    image: 'https://images.pexels.com/photos/2907428/pexels-photo-2907428.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Umbrella', spanish: 'Uva' },
    color: '#7B1FA2'
  },
  {
    letter: 'V',
    lowercase: 'v',
    image: 'https://images.pexels.com/photos/159751/book-read-literature-pages-159751.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Violin', spanish: 'Vaca' },
    color: '#D32F2F'
  },
  {
    letter: 'W',
    lowercase: 'w',
    image: 'https://images.pexels.com/photos/128756/pexels-photo-128756.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Water', spanish: 'Waffle' },
    color: '#0288D1'
  },
  {
    letter: 'X',
    lowercase: 'x',
    image: 'https://images.pexels.com/photos/1887671/pexels-photo-1887671.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Xylophone', spanish: 'Xilófono' },
    color: '#689F38'
  },
  {
    letter: 'Y',
    lowercase: 'y',
    image: 'https://images.pexels.com/photos/85937/dog-puppy-tongue-fur-85937.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Yellow', spanish: 'Yoyo' },
    color: '#FFC107'
  },
  {
    letter: 'Z',
    lowercase: 'z',
    image: 'https://images.pexels.com/photos/37730/zebra-africa-equine-stripes-37730.jpeg?auto=compress&cs=tinysrgb&w=150',
    word: { english: 'Zebra', spanish: 'Zapato' },
    color: '#212121'
  }
];

// Positive messages by language
const POSITIVE_MESSAGES: Record<string, string[]> = {
  english: ['Great job!', 'Excellent!', 'You did it!', 'Well done!', 'Amazing!'],
  spanish: ['¡Muy bien!', '¡Excelente!', '¡Lo lograste!', '¡Bien hecho!', '¡Asombroso!']
};

// Default settings
const DEFAULT_SETTINGS: Settings = {
  language: 'spanish', // Default to Spanish
  showLowercase: true,
  audioEnabled: true,
  animationsEnabled: true,
  letterStyle: 'basic',
  learningMode: 'explore',
  quizFrequency: 5,
  colorful: true
};

// Font families for different letter styles
const LETTER_STYLES = {
  basic: 'Arial, sans-serif',
  fancy: 'Georgia, serif',
  handwritten: 'Comic Sans MS, cursive'
};

// Helper component for fancy letter display
const LetterDisplay: React.FC<{ 
  letter: string;
  lowercase?: string;
  showLowercase: boolean;
  color: string;
  style: string;
  size?: 'small' | 'medium' | 'large';
  highlight?: boolean;
  onClick?: () => void;
}> = ({ 
  letter, 
  lowercase,
  showLowercase, 
  color, 
  style,
  size = 'large',
  highlight = false,
  onClick
}) => {
  // Size mappings
  const sizes = {
    small: 'text-4xl',
    medium: 'text-6xl',
    large: 'text-9xl'
  };

  return (
    <div 
      className={`relative flex flex-col items-center cursor-pointer
        ${highlight ? 'animate-pulse' : ''}`}
      onClick={onClick}
    >
      <div 
        className={`${sizes[size]} font-bold ${highlight ? 'scale-110' : ''}`}
        style={{ 
          fontFamily: LETTER_STYLES[style as keyof typeof LETTER_STYLES],
          color: color,
          textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
        }}
      >
        {letter}
      </div>
      {showLowercase && lowercase && (
        <div 
          className="text-3xl font-medium mt-2"
          style={{ 
            fontFamily: LETTER_STYLES[style as keyof typeof LETTER_STYLES],
            color: color,
            opacity: 0.8
          }}
        >
          {lowercase}
        </div>
      )}
    </div>
  );
};

// Quiz component
interface QuizProps {
  letter: LetterObject;
  language: 'english' | 'spanish';
  onComplete: (success: boolean) => void;
}

const LetterQuiz: React.FC<QuizProps> = ({ letter, language, onComplete }) => {
  const [options, setOptions] = useState<LetterObject[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const alphabet = getAlphabetData();
  
  useEffect(() => {
    // Generate options including the correct letter and 2 random ones
    const allLetters = alphabet.filter(l => l.letter !== letter.letter);
    const shuffled = [...allLetters].sort(() => 0.5 - Math.random());
    const randomLetters = shuffled.slice(0, 2);
    
    const allOptions = [...randomLetters, letter]
      .sort(() => 0.5 - Math.random());
      
    setOptions(allOptions);
    setSelected(null);
    setCorrect(null);
  }, [letter]);
  
  const handleSelect = (selectedLetter: string) => {
    if (selected !== null) return; // Already answered
    
    setSelected(selectedLetter);
    const isCorrect = selectedLetter === letter.letter;
    setCorrect(isCorrect);
    
    setTimeout(() => {
      onComplete(isCorrect);
    }, 1500);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold text-center mb-6">
        {language === 'english' 
          ? `Which letter is this?` 
          : `¿Qué letra es esta?`
        }
      </h3>
      
      <div className="flex justify-center mb-8">
        <img 
          src={letter.image} 
          alt={letter.word[language]}
          className="w-32 h-32 object-cover rounded-lg shadow-md"
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        {options.map((option) => (
          <motion.button
            key={option.letter}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSelect(option.letter)}
            className={`p-4 rounded-lg text-center ${
              selected === option.letter 
                ? option.letter === letter.letter 
                  ? 'bg-green-100 dark:bg-green-800 border-2 border-green-500' 
                  : 'bg-red-100 dark:bg-red-800 border-2 border-red-500'
                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="text-4xl font-bold block" style={{ color: option.color }}>
              {option.letter}
            </span>
          </motion.button>
        ))}
      </div>
      
      {selected && (
        <div className={`mt-6 p-3 rounded-lg text-center ${
          correct ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200' 
                 : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
        }`}>
          {correct 
            ? (language === 'english' ? 'Correct!' : '¡Correcto!') 
            : (language === 'english' 
                ? `Incorrect. The correct answer is ${letter.letter}.` 
                : `Incorrecto. La respuesta correcta es ${letter.letter}.`)}
        </div>
      )}
    </div>
  );
};

export const AlphabetExercise: React.FC = () => {
  // Load settings
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('alphabet_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // State
  const [currentLetterIndex, setCurrentLetterIndex] = useState<number>(0);
  const [alphabet] = useState<LetterObject[]>(getAlphabetData());
  const [currentLetter, setCurrentLetter] = useState<LetterObject>(alphabet[0]);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [showReward, setShowReward] = useState<boolean>(false);
  const [completedLetters, setCompletedLetters] = useState<string[]>([]);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(!settings.audioEnabled);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hintTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize with current letter
  useEffect(() => {
    setCurrentLetter(alphabet[currentLetterIndex]);
    setIsRevealed(false);
  }, [currentLetterIndex, alphabet]);

  // Update settings when they change
  useEffect(() => {
    setIsAudioMuted(!settings.audioEnabled);
  }, [settings.audioEnabled]);

  // Show hint after delay if user hasn't interacted
  useEffect(() => {
    if (settings.learningMode === 'explore' && !isRevealed) {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
      
      hintTimeoutRef.current = setTimeout(() => {
        setShowHint(true);
        // Hide hint after 3 seconds
        setTimeout(() => setShowHint(false), 3000);
      }, 5000);
    }

    // Play letter sound
    playLetterAudio();

    // Check if should show quiz
    if (settings.quizFrequency > 0 && 
        (currentLetterIndex + 1) % settings.quizFrequency === 0 && 
        currentLetterIndex > 0) {
      setTimeout(() => {
        setShowQuiz(true);
      }, 1000);
    }

    return () => {
      if (hintTimeoutRef.current) {
        clearTimeout(hintTimeoutRef.current);
      }
    };
  }, [currentLetterIndex, isRevealed, settings.learningMode, settings.quizFrequency]);

  // Play audio for letter
  const playLetterAudio = () => {
    if (isAudioMuted) return;
    
    try {
      // In a real app, this would use actual audio files
      // For this demo, we're just showing the concept
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      // This would be replaced with actual audio playback
      const letterName = currentLetter.letter;
      
      console.log(`Playing audio for letter: ${letterName}`);
      // Audio playback would happen here
    } catch (error) {
      console.error("Error playing letter audio:", error);
    }
  };

  // Handle letter tap/click
  const handleLetterTap = () => {
    if (settings.learningMode !== 'explore') return;
    
    setIsRevealed(true);
    playLetterAudio();
    
    // Add to completed letters
    if (!completedLetters.includes(currentLetter.letter)) {
      setCompletedLetters(prev => [...prev, currentLetter.letter]);
    }
  };

  // Handle proceeding to the next letter
  const handleNextLetter = () => {
    if (currentLetterIndex >= alphabet.length - 1) {
      // Exercise completed
      setIsCompleted(true);
      toast.success(
        settings.language === 'english'
          ? `Great job! You've learned the whole alphabet!`
          : `¡Muy bien! ¡Has aprendido todo el alfabeto!`
      );
      
      // Show completion reward
      setShowReward(true);
      setTimeout(() => {
        setShowReward(false);
        // Reset to start over
        setCurrentLetterIndex(0);
        setIsCompleted(false);
      }, 5000);
    } else {
      // Move to the next letter
      setCurrentLetterIndex(currentLetterIndex + 1);
    }
  };

  // Handle proceeding to the previous letter
  const handlePreviousLetter = () => {
    if (currentLetterIndex > 0) {
      setCurrentLetterIndex(currentLetterIndex - 1);
    }
  };

  // Handle quiz completion
  const handleQuizComplete = (success: boolean) => {
    setShowQuiz(false);
    if (success) {
      toast.success(
        settings.language === 'english'
          ? 'Great job on the quiz!'
          : '¡Excelente trabajo en el cuestionario!'
      );
    }
  };

  // Handle resetting the exercise
  const handleReset = () => {
    setCurrentLetterIndex(0);
    setCompletedLetters([]);
    setIsRevealed(false);
    setShowReward(false);
    setIsCompleted(false);
    
    toast.info(
      settings.language === 'english'
        ? 'Starting over from A!'
        : '¡Comenzando de nuevo desde A!'
    );
  };

  // Random positive message
  const getRandomPositiveMessage = (): string => {
    const messages = POSITIVE_MESSAGES[settings.language];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  // Progress percentage
  const progressPercentage = ((currentLetterIndex + 1) / alphabet.length) * 100;

  // Get appropriate fonts for letter style
  const letterFont = LETTER_STYLES[settings.letterStyle];

  // Render the alphabet learning exercise
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
              ? `Learning the Alphabet: ${currentLetterIndex + 1} of ${alphabet.length}`
              : `Aprendiendo el Alfabeto: ${currentLetterIndex + 1} de ${alphabet.length}`
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

      {/* Main content area */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 relative min-h-[500px]">
        <AnimatePresence mode="wait">
          {showQuiz ? (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex items-center justify-center p-4"
            >
              <LetterQuiz 
                letter={currentLetter} 
                language={settings.language} 
                onComplete={handleQuizComplete} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="letter-display"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center"
            >
              {/* Letter */}
              <div 
                className="mb-6 cursor-pointer"
                onClick={handleLetterTap}
              >
                <LetterDisplay
                  letter={currentLetter.letter}
                  lowercase={currentLetter.lowercase}
                  showLowercase={settings.showLowercase}
                  color={settings.colorful ? currentLetter.color : '#000000'}
                  style={settings.letterStyle}
                  highlight={showHint}
                />
              </div>
              
              {/* Word and image */}
              <AnimatePresence mode="wait">
                {isRevealed || settings.learningMode === 'guided' ? (
                  <motion.div
                    key="revealed-content"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex flex-col items-center"
                  >
                    <motion.div 
                      className="bg-gray-100 dark:bg-gray-700 p-1 rounded-lg shadow-md mb-4"
                      initial={{ rotate: -5 }}
                      animate={{ rotate: 5 }}
                      transition={{ 
                        repeat: Infinity, 
                        repeatType: "reverse",
                        duration: 2 
                      }}
                    >
                      <img 
                        src={currentLetter.image} 
                        alt={currentLetter.word[settings.language]}
                        className="w-40 h-40 object-cover rounded-md"
                      />
                    </motion.div>
                    
                    <motion.h3
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className="text-2xl font-bold mb-2"
                      style={{ color: settings.colorful ? currentLetter.color : 'inherit' }}
                    >
                      {currentLetter.word[settings.language]}
                    </motion.h3>
                    
                    <p className="text-gray-600 dark:text-gray-400">
                      {settings.language === 'english' 
                        ? `${currentLetter.letter} is for ${currentLetter.word.english}`
                        : `${currentLetter.letter} es de ${currentLetter.word.spanish}`
                      }
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="hidden-content"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center h-60"
                  >
                    {settings.learningMode === 'explore' && (
                      <div className="mb-6 text-center">
                        <button
                          onClick={handleLetterTap}
                          className="px-6 py-3 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800/40 transition-colors shadow-md"
                        >
                          {settings.language === 'english' 
                            ? 'Tap to see the picture!' 
                            : '¡Toca para ver la imagen!'}
                        </button>
                      </div>
                    )}
                    
                    {showHint && settings.learningMode === 'explore' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-2 flex items-center justify-center space-x-2 text-yellow-600 dark:text-yellow-400"
                      >
                        <Hand className="animate-bounce" size={24} />
                        <p className="text-lg">
                          {settings.language === 'english' 
                            ? 'Tap on the letter to see what it stands for!' 
                            : '¡Toca la letra para ver qué representa!'}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="absolute bottom-6 left-0 right-0 flex justify-between px-6">
          <button
            onClick={handlePreviousLetter}
            disabled={currentLetterIndex === 0}
            className={`p-3 rounded-full ${
              currentLetterIndex === 0 
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800'
            } shadow-md transition-colors`}
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="flex space-x-2">
            {alphabet.slice(0, 7).map((l, idx) => (
              <div
                key={l.letter}
                className={`w-2 h-2 rounded-full ${
                  idx === currentLetterIndex
                    ? 'bg-indigo-600 dark:bg-indigo-400'
                    : completedLetters.includes(l.letter)
                      ? 'bg-green-500 dark:bg-green-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
            {currentLetterIndex >= 7 && <div className="text-sm text-gray-500 dark:text-gray-400">...</div>}
          </div>
          
          <button
            onClick={handleNextLetter}
            className="p-3 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-800 shadow-md transition-colors"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
      
      {/* Learning mode info */}
      <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
        <div className="flex items-center gap-2 mb-2 text-indigo-700 dark:text-indigo-300">
          <BookOpen size={18} />
          <h3 className="font-bold">
            {settings.language === 'english' ? 'Learning Mode' : 'Modo de Aprendizaje'}
          </h3>
        </div>
        
        <p className="text-sm text-indigo-600 dark:text-indigo-400">
          {settings.learningMode === 'explore' && (settings.language === 'english' 
            ? 'Tap on each letter to discover what it represents.' 
            : 'Toca cada letra para descubrir qué representa.')}
            
          {settings.learningMode === 'guided' && (settings.language === 'english' 
            ? 'Follow along as we guide you through the alphabet.' 
            : 'Sigue la guía mientras te enseñamos el alfabeto.')}
            
          {settings.learningMode === 'quiz' && (settings.language === 'english' 
            ? 'Test your knowledge with quizzes as you learn the letters.' 
            : 'Pon a prueba tu conocimiento con cuestionarios mientras aprendes las letras.')}
        </p>

        {/* Help button */}
        <button
          className="mt-2 inline-flex items-center text-xs text-indigo-500 dark:text-indigo-300 hover:text-indigo-700 dark:hover:text-indigo-100"
          onClick={() => {
            toast.info(
              settings.language === 'english'
                ? 'Use the arrows to navigate through the alphabet. Click on letters to learn more!'
                : '¡Usa las flechas para navegar por el alfabeto. ¡Haz clic en las letras para aprender más!'
            );
          }}
        >
          <HelpCircle size={12} className="mr-1" />
          {settings.language === 'english' ? 'How to use' : 'Cómo usar'}
        </button>
      </div>

      {/* Alphabet quick navigation */}
      <div className="overflow-x-auto pb-2 mb-4">
        <div className="flex space-x-1 min-w-max">
          {alphabet.map((letter, idx) => (
            <button
              key={letter.letter}
              onClick={() => setCurrentLetterIndex(idx)}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-colors ${
                idx === currentLetterIndex
                  ? 'bg-indigo-600 text-white'
                  : completedLetters.includes(letter.letter)
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
              style={{ 
                color: idx === currentLetterIndex 
                  ? 'white' 
                  : (completedLetters.includes(letter.letter) && settings.colorful)
                    ? letter.color 
                    : undefined
              }}
            >
              {letter.letter}
            </button>
          ))}
        </div>
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
                        ? `You learned the whole alphabet!` 
                        : `You learned the letter ${currentLetter.letter}!`
                    : isCompleted 
                        ? `¡Aprendiste todo el alfabeto!`
                        : `¡Aprendiste la letra ${currentLetter.letter}!`
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
                <SettingsIcon className="w-16 h-16 text-indigo-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-indigo-700 dark:text-indigo-400 mb-4">
                  {settings.language === 'english' ? 'Congratulations!' : '¡Felicidades!'}
                </h2>
                <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">
                  {settings.language === 'english'
                    ? `You've learned the entire alphabet!`
                    : `¡Has aprendido todo el alfabeto!`
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

export default AlphabetExercise;