import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, RotateCcw, Trophy, MapPin, Sparkles, Info, HelpCircle, Check, X } from 'lucide-react';
import { toast } from 'sonner';

interface Continent {
  id: string;
  name: string;
  description: string;
  funFact: string;
  population: string;
  area: string;
  countries: number;
  image: string;
  position: { x: number; y: number };
  correctPosition: { x: number; y: number };
  color: string;
}

const continents: Continent[] = [
  {
    id: 'north-america',
    name: 'North America',
    description: 'Third largest continent, home to diverse landscapes from Arctic tundra to tropical forests.',
    funFact: 'The Grand Canyon in North America is so big that it can fit 19 Eiffel Towers stacked on top of each other!',
    population: '592 million',
    area: '24.7 million km²',
    countries: 23,
    image: 'https://images.pexels.com/photos/3225529/pexels-photo-3225529.jpeg?auto=compress&cs=tinysrgb&w=300',
    position: { x: 0, y: 0 },
    correctPosition: { x: 20, y: 30 },
    color: '#FFEB3B' // Yellow
  },
  {
    id: 'south-america',
    name: 'South America',
    description: 'Known for the Amazon rainforest, Andes mountains, and diverse wildlife.',
    funFact: 'The Amazon River in South America is so big that it carries more water than the next seven largest rivers combined!',
    population: '434 million',
    area: '17.8 million km²',
    countries: 12,
    image: 'https://images.pexels.com/photos/1770775/pexels-photo-1770775.jpeg?auto=compress&cs=tinysrgb&w=300',
    position: { x: 0, y: 0 },
    correctPosition: { x: 30, y: 60 },
    color: '#9C27B0' // Purple
  },
  {
    id: 'europe',
    name: 'Europe',
    description: 'Rich in history and culture, known for its diverse nations and architectural heritage.',
    funFact: 'Europe is the only continent without a desert! It has many different types of land, but no true deserts.',
    population: '748 million',
    area: '10.2 million km²',
    countries: 44,
    image: 'https://images.pexels.com/photos/532263/pexels-photo-532263.jpeg?auto=compress&cs=tinysrgb&w=300',
    position: { x: 0, y: 0 },
    correctPosition: { x: 50, y: 25 },
    color: '#4CAF50' // Green
  },
  {
    id: 'africa',
    name: 'Africa',
    description: 'Second largest continent, featuring the Sahara Desert and diverse wildlife.',
    funFact: 'Africa has the world\'s longest river (the Nile) and the world\'s largest hot desert (the Sahara)!',
    population: '1.4 billion',
    area: '30.4 million km²',
    countries: 54,
    image: 'https://images.pexels.com/photos/259447/pexels-photo-259447.jpeg?auto=compress&cs=tinysrgb&w=300',
    position: { x: 0, y: 0 },
    correctPosition: { x: 50, y: 50 },
    color: '#FF9800' // Orange
  },
  {
    id: 'asia',
    name: 'Asia',
    description: 'Largest continent, home to diverse cultures and the highest mountains.',
    funFact: 'Asia is home to Mount Everest, the tallest mountain in the world. It\'s as tall as 643 giraffes stacked on top of each other!',
    population: '4.7 billion',
    area: '44.6 million km²',
    countries: 48,
    image: 'https://images.pexels.com/photos/1440476/pexels-photo-1440476.jpeg?auto=compress&cs=tinysrgb&w=300',
    position: { x: 0, y: 0 },
    correctPosition: { x: 70, y: 35 },
    color: '#F44336' // Red
  },
  {
    id: 'australia',
    name: 'Australia',
    description: 'Smallest continent, known for unique wildlife and the Great Barrier Reef.',
    funFact: 'Australia is the only continent that is also a country! It\'s home to kangaroos, koalas, and many other unique animals.',
    population: '43 million',
    area: '8.6 million km²',
    countries: 14,
    image: 'https://images.pexels.com/photos/1878293/pexels-photo-1878293.jpeg?auto=compress&cs=tinysrgb&w=300',
    position: { x: 0, y: 0 },
    correctPosition: { x: 80, y: 70 },
    color: '#FF5722' // Deep Orange
  },
  {
    id: 'antarctica',
    name: 'Antarctica',
    description: 'Southernmost continent, covered in ice and home to unique wildlife.',
    funFact: 'Antarctica is almost entirely covered in ice that can be up to 4.8 kilometers (3 miles) thick! That\'s as tall as 16 Eiffel Towers!',
    population: '0 permanent residents',
    area: '14.2 million km²',
    countries: 0,
    image: 'https://images.pexels.com/photos/48178/mountains-ice-bergs-antarctica-48178.jpeg?auto=compress&cs=tinysrgb&w=300',
    position: { x: 0, y: 0 },
    correctPosition: { x: 50, y: 90 },
    color: '#03A9F4' // Light Blue
  }
];

interface ContinentInfoProps {
  continent: Continent;
  onClose: () => void;
}

const ContinentInfo: React.FC<ContinentInfoProps> = ({ continent, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-4"
      style={{ borderColor: continent.color }}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-2xl font-bold" style={{ color: continent.color }}>
          {continent.name}
        </h3>
        <button 
          onClick={onClose}
          className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <img 
          src={continent.image} 
          alt={continent.name}
          className="w-full sm:w-1/3 h-40 object-cover rounded-lg"
        />
        
        <div className="flex-1">
          <div className="mb-3">
            <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
              <Globe size={18} style={{ color: continent.color }} />
              About
            </h4>
            <p className="text-gray-700 dark:text-gray-300">{continent.description}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
              <p className="text-xs text-gray-500 dark:text-gray-400">Population</p>
              <p className="font-bold">{continent.population}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
              <p className="text-xs text-gray-500 dark:text-gray-400">Area</p>
              <p className="font-bold">{continent.area}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
              <p className="text-xs text-gray-500 dark:text-gray-400">Countries</p>
              <p className="font-bold">{continent.countries}</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-bold text-yellow-800 dark:text-yellow-400 flex items-center gap-2 mb-1">
              <Info size={16} />
              Fun Fact!
            </h4>
            <p className="text-yellow-700 dark:text-yellow-300 text-sm">{continent.funFact}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  continent: Continent | null;
}

const QuizModal: React.FC<QuizModalProps> = ({ isOpen, onClose, continent }) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      setSelectedAnswer(null);
      setIsCorrect(null);
    }
  }, [isOpen, continent]);
  
  if (!isOpen || !continent) return null;
  
  // Generate quiz question based on continent
  const questions = [
    {
      question: `Which continent is ${continent.name}?`,
      correctAnswer: 0,
      options: [
        `${continent.name}`,
        `${continents.find(c => c.id !== continent.id)?.name}`,
        `${continents.find(c => c.id !== continent.id && c.name !== continents.find(c => c.id !== continent.id)?.name)?.name}`,
      ]
    },
    {
      question: `How many countries are in ${continent.name}?`,
      correctAnswer: 0,
      options: [
        `${continent.countries}`,
        `${continent.countries + 10}`,
        `${Math.max(1, continent.countries - 15)}`,
      ]
    },
    {
      question: `What is special about ${continent.name}?`,
      correctAnswer: 0,
      options: [
        continent.id === 'antarctica' ? 'It is covered in ice' : 
        continent.id === 'australia' ? 'It is both a continent and a country' :
        continent.id === 'asia' ? 'It has the highest mountain in the world' :
        continent.id === 'africa' ? 'It has the largest hot desert' :
        continent.id === 'europe' ? 'It has no deserts' :
        continent.id === 'south-america' ? 'It has the Amazon rainforest' :
        'It has the Grand Canyon',
        'It has the most volcanoes',
        'It is the smallest continent'
      ]
    }
  ];
  
  // Select a random question
  const randomQuestionIndex = Math.floor(Math.random() * questions.length);
  const quizQuestion = questions[randomQuestionIndex];
  
  const handleAnswerSelect = (index: number) => {
    setSelectedAnswer(index);
    setIsCorrect(index === quizQuestion.correctAnswer);
    
    if (index === quizQuestion.correctAnswer) {
      toast.success("Correct answer! 🎉");
    } else {
      toast.error("Not quite right. Try again!");
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full"
        style={{ boxShadow: `0 0 20px ${continent.color}40` }}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold" style={{ color: continent.color }}>
            Quiz Time: {continent.name}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-6">
          <p className="text-lg font-medium mb-4 text-gray-800 dark:text-gray-200">
            {quizQuestion.question}
          </p>
          
          <div className="space-y-3">
            {quizQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                  selectedAnswer === index
                    ? selectedAnswer === quizQuestion.correctAnswer
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                      : 'border-red-500 bg-red-50 dark:bg-red-900/30'
                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                }`}
                disabled={selectedAnswer !== null}
              >
                <div className="flex items-center">
                  <span className="mr-2 flex-shrink-0">
                    {selectedAnswer === index && (
                      selectedAnswer === quizQuestion.correctAnswer ? (
                        <Check className="text-green-500" size={18} />
                      ) : (
                        <X className="text-red-500" size={18} />
                      )
                    )}
                  </span>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {selectedAnswer !== null && (
          <div className={`p-3 rounded-lg mb-4 ${
            isCorrect 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}>
            {isCorrect 
              ? 'Great job! You got it right!' 
              : `The correct answer is: ${quizQuestion.options[quizQuestion.correctAnswer]}`
            }
          </div>
        )}
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {selectedAnswer !== null ? 'Continue' : 'Skip Question'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface DraggableItemProps {
  continent: Continent;
  onDragStart: (e: React.DragEvent, continent: Continent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isPlaced: boolean;
  onInfoClick: () => void;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ 
  continent, 
  onDragStart, 
  onDragEnd, 
  isDragging, 
  isPlaced,
  onInfoClick
}) => {
  return (
    <motion.div
      className={`p-4 rounded-lg shadow-lg cursor-move border-4 ${
        isPlaced ? 'border-green-500 bg-green-50 dark:bg-green-900/30' : `border-${continent.id === 'antarctica' ? 'blue' : continent.color.replace('#', '')}-300 dark:border-${continent.id === 'antarctica' ? 'blue' : continent.color.replace('#', '')}-700 bg-white dark:bg-gray-800`
      } ${isDragging ? 'opacity-70' : 'opacity-100'} hover:shadow-xl transition-all duration-200`}
      animate={{ 
        scale: isDragging ? 1.05 : 1,
        rotate: isDragging ? [0, -1, 1, -1, 0] : 0
      }}
      transition={{
        rotate: {
          repeat: isDragging ? Infinity : 0,
          duration: 0.5
        }
      }}
      draggable
      onDragStart={(e) => onDragStart(e, continent)}
      onDragEnd={onDragEnd}
      style={{
        boxShadow: `0 4px 14px 0 ${continent.color}40`
      }}
    > 
      <div className="flex items-center space-x-3">
        <img
          src={continent.image}
          alt={continent.name}
          className="w-16 h-16 object-cover rounded-lg border-2 border-white shadow-sm"
          style={{ borderColor: continent.color }}
        />
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-gray-800 dark:text-white text-lg" style={{ color: isPlaced ? '#22c55e' : continent.color }}>
              {continent.name}
              {isPlaced && <Trophy className="inline-block ml-1 w-4 h-4 text-green-500" />}
            </h3>
            <button 
              onClick={(e) => { e.stopPropagation(); onInfoClick(); }}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-blue-500"
              aria-label={`Learn more about ${continent.name}`}
            >
              <Info size={18} />
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 pr-4">{continent.description}</p>
        </div>
      </div>
    </motion.div>
  );
};

interface DropZoneProps {
  continent: Continent;
  onDrop: (e: React.DragEvent, targetContinent: Continent) => void;
  onDragOver: (e: React.DragEvent) => void;
  isCorrect: boolean;
  onQuizClick: () => void;
}

const DropZone: React.FC<DropZoneProps> = ({ 
  continent, 
  onDrop, 
  onDragOver, 
  isCorrect,
  onQuizClick
}) => {
  return (
    <div
      className={`absolute w-28 h-28 rounded-full border-4 ${
        isCorrect 
          ? 'border-green-500 bg-green-100/70 dark:bg-green-900/50' 
          : `border-dashed border-${continent.id === 'antarctica' ? 'blue' : continent.color.replace('#', '')}-400 dark:border-${continent.id === 'antarctica' ? 'blue' : continent.color.replace('#', '')}-600 bg-${continent.id === 'antarctica' ? 'blue' : continent.color.replace('#', '')}-100/30 dark:bg-${continent.id === 'antarctica' ? 'blue' : continent.color.replace('#', '')}-900/20`
      } flex items-center justify-center transition-all duration-300 hover:scale-105`}
      style={{
        left: `${continent.correctPosition.x}%`,
        top: `${continent.correctPosition.y}%`,
        transform: 'translate(-50%, -50%)',
        boxShadow: isCorrect ? '0 0 15px rgba(34, 197, 94, 0.5)' : `0 0 10px ${continent.color}30`
      }}
      onDrop={(e) => onDrop(e, continent)}
      onDragOver={onDragOver}
    >
      <motion.div
        initial={isCorrect ? { scale: 0 } : { scale: 0.8 }}
        animate={isCorrect 
          ? { scale: 1, rotate: [0, 10, -10, 10, 0] } 
          : { scale: [0.8, 1, 0.8], opacity: [0.7, 1, 0.7] }
        }
        transition={isCorrect 
          ? { duration: 0.5, type: "spring" } 
          : { repeat: Infinity, duration: 2 }
        }
        className={isCorrect 
          ? "text-green-600 dark:text-green-400" 
          : `text-${continent.id === 'antarctica' ? 'blue' : continent.color.replace('#', '')}-500 dark:text-${continent.id === 'antarctica' ? 'blue' : continent.color.replace('#', '')}-400`
        }
      >
        {isCorrect ? (
          <div className="relative">
            <Sparkles size={32} />
            <button
              onClick={onQuizClick}
              className="absolute -top-1 -right-1 bg-white dark:bg-gray-800 rounded-full p-1 shadow-md text-blue-500 hover:text-blue-700 transition-colors"
              title="Take a quiz about this continent"
            >
              <HelpCircle size={16} />
            </button>
          </div>
        ) : (
          <MapPin size={24} />
        )}
      </motion.div>
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        <span className={`text-xs font-bold ${
          isCorrect 
            ? 'text-green-600 dark:text-green-400' 
            : `text-${continent.id === 'antarctica' ? 'blue' : continent.color.replace('#', '')}-600 dark:text-${continent.id === 'antarctica' ? 'blue' : continent.color.replace('#', '')}-400`
        }`}>
          {continent.name}
        </span>
      </div>
    </div>
  );
};

export const ContinentsGame: React.FC = () => {
  const [draggedContinent, setDraggedContinent] = useState<Continent | null>(null);
  const [placedContinents, setPlacedContinents] = useState<Record<string, boolean>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startTime] = useState(Date.now());
  const [selectedContinent, setSelectedContinent] = useState<Continent | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizContinent, setQuizContinent] = useState<Continent | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  useEffect(() => {
    if (Object.keys(placedContinents).length === continents.length) {
      const timeSpent = ((Date.now() - startTime) / 1000).toFixed(1);
      setIsComplete(true);
      toast.success(`¡Felicitaciones! Completaste el ejercicio en ${timeSpent} segundos con ${attempts} intentos.`);
    }
  }, [placedContinents, attempts, startTime]);

  const handleDragStart = (e: React.DragEvent, continent: Continent) => {
    setDraggedContinent(continent);
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', continent.id);
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragEnd = () => {
    setDraggedContinent(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDrop = (e: React.DragEvent, targetContinent: Continent) => {
    e.preventDefault();
    if (!draggedContinent) return;

    setAttempts(prev => prev + 1);

    if (draggedContinent.id === targetContinent.id) {
      setPlacedContinents(prev => ({
        ...prev,
        [draggedContinent.id]: true
      }));
      toast.success(`¡Correcto! ${draggedContinent.name} está en su lugar.`);
    } else {
      toast.error('Ubicación incorrecta. Intenta de nuevo.');
    }
  };

  const handleInfoClick = (continent: Continent) => {
    setSelectedContinent(continent);
  };

  const handleQuizClick = (continent: Continent) => {
    setQuizContinent(continent);
    setShowQuiz(true);
  };

  const resetGame = () => {
    setPlacedContinents({});
    setIsComplete(false);
    setAttempts(0);
    setCorrectAnswers(0);
  };

  const remainingContinents = continents.filter(c => !placedContinents[c.id]);
  const completedCount = Object.keys(placedContinents).length;
  const totalContinents = continents.length;

  return (
    <div className="max-w-6xl mx-auto p-4 relative">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Globe className="w-10 h-10 text-blue-500 animate-pulse" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">World Continents</h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-2">
          Learn about our world! Drag and drop each colorful continent to its correct location on the map.
        </p>
        <div className="flex justify-center gap-2">
          <button 
            onClick={() => setShowHint(!showHint)}
            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium flex items-center gap-1 hover:bg-blue-200 dark:hover:bg-blue-800/30 transition-colors"
          >
            <HelpCircle size={16} />
            {showHint ? "Hide Hints" : "Show Hints"}
          </button>
        </div>
        
        {showHint && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-200 max-w-2xl mx-auto"
          >
            <p className="mb-2"><strong>Hints:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-left">
              <li>North America is in the northwest part of the map</li>
              <li>South America is below North America</li>
              <li>Europe is in the northeast, above Africa</li>
              <li>Africa is in the center of the map</li>
              <li>Asia is the largest continent, located in the east</li>
              <li>Australia is in the southeast corner</li>
              <li>Antarctica is at the very bottom of the map</li>
            </ul>
          </motion.div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side: Draggable continents */}
        <div className="space-y-5">
          <h2 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400 flex items-center">
            {remainingContinents.length > 0 ? (
              <>Continents to Place <span className="ml-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm py-1 px-2 rounded-full">{remainingContinents.length}</span></>
            ) : (
              <><Sparkles className="mr-2 text-yellow-500" /> All Continents Placed!</>
            )}
          </h2>
          <AnimatePresence>
            {remainingContinents.map(continent => (
              <motion.div
                key={continent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <DraggableItem
                  continent={continent}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  isDragging={draggedContinent?.id === continent.id}
                  isPlaced={placedContinents[continent.id]}
                  onInfoClick={() => handleInfoClick(continent)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Right side: Drop zones */}
        <div className="lg:col-span-2 relative">
          <div className="relative w-full h-[600px] bg-blue-100 dark:bg-blue-900/30 rounded-xl overflow-hidden">
            {/* World map background with educational grid lines */}
            <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/41953/earth-blue-planet-globe-planet-41953.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1')] bg-cover bg-center opacity-30" />

            {/* Drop zones */}
            {continents.map(continent => (
              <DropZone
                key={continent.id}
                continent={continent}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                isCorrect={placedContinents[continent.id]}
                onQuizClick={() => handleQuizClick(continent)}
              />
            ))}
          </div>
        </div>
        
        {/* Confetti effect when all continents are placed */}
        {isComplete && (
          <div className="absolute inset-0 pointer-events-none z-10">
            {Array.from({ length: 50 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                initial={{ 
                  top: "-10%", 
                  left: `${Math.random() * 100}%`,
                  backgroundColor: continents[i % continents.length].color
                }}
                animate={{ 
                  top: "110%",
                  rotate: Math.random() * 360,
                  scale: [0, 1, 0.5, 0]
                }}
                transition={{ 
                  duration: 4 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 5
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Game stats and controls */}
      <div className="mt-8 flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md">
        <div className="text-center sm:text-left mb-4 sm:mb-0">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Attempts</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{attempts}</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Placed</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {completedCount} / {totalContinents}
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Quiz Score</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {correctAnswers}
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={resetGame}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-bold shadow-md hover:shadow-lg transform hover:-translate-y-1 active:translate-y-0"
        >
          <RotateCcw size={20} />
          New Game
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-gray-800 dark:text-gray-200">Your Progress</h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">{completedCount} of {totalContinents} continents</span>
        </div>
        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${(completedCount / totalContinents) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        {/* Instructions panel */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h3 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2 flex items-center">
              <MapPin className="mr-2" size={16} /> How to Play
            </h3>
            <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 space-y-1 text-sm">
              <li>Drag each continent from the left panel</li>
              <li>Drop it on its matching colored zone on the map</li>
              <li>Click the info button to learn about each continent</li>
              <li>Take quizzes after placing continents correctly</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-bold text-blue-800 dark:text-blue-400 mb-2 flex items-center">
              <Info className="mr-2" size={16} /> Learning Goals
            </h3>
            <ul className="list-disc list-inside text-blue-700 dark:text-blue-300 space-y-1 text-sm">
              <li>Identify the seven continents of the world</li>
              <li>Learn where each continent is located</li>
              <li>Discover interesting facts about each continent</li>
              <li>Remember key information through fun quizzes</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Continent Info Modal */}
      <AnimatePresence>
        {selectedContinent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedContinent(null)}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <ContinentInfo 
                continent={selectedContinent} 
                onClose={() => setSelectedContinent(null)} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Quiz Modal */}
      <QuizModal 
        isOpen={showQuiz} 
        onClose={() => setShowQuiz(false)} 
        continent={quizContinent} 
      />
    </div>
  );
};