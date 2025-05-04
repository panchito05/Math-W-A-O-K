import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Minus, X, Divide, Percent, Calculator, Sigma, PieChart, Grid3X3, Circle, Hash, Repeat, Globe, Haze as Maze, Triangle, Variable, Pointer as Integer, ChevronDown, BookOpen, CalculatorIcon, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProgress } from '../context/ProgressContext';
import { motion } from 'framer-motion';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ModuleList } from '../components/ModuleList';
import { OperationCardProps } from '../store/moduleStore';

type GridSize = 1 | 3 | 6 | 8;

const operationsList: OperationCardProps[] = [
  {
    id: 'alphabet',
    title: 'Alphabet Learning',
    description: 'Learn the alphabet with engaging interactive activities and visual aids.',
    icon: <BookOpen className="h-10 w-10 text-white" />,
    color: 'bg-purple-400'
  },
  {
    id: 'counting',
    title: 'Counting Numbers',
    description: 'Interactive learning to count from 1 onwards, perfect for young children.',
    icon: <Hash className="h-10 w-10 text-white" />,
    color: 'bg-blue-400'
  },
  {
    id: 'combinedoperations',
    title: 'Combined Operations',
    description: 'Learn the order of operations (PEMDAS) with combined mathematical expressions.',
    icon: <CalculatorIcon className="h-10 w-10 text-white" />,
    color: 'bg-teal-500'
  },
  {
    id: 'addition',
    title: 'Addition',
    description: 'Practice adding numbers with various difficulty levels.',
    icon: <Plus className="h-10 w-10 text-white" />,
    color: 'bg-blue-500'
  },
  {
    id: 'mixedtofraction',
    title: 'Mixed to Fraction',
    description: 'Convert mixed numbers to improper fractions with step-by-step guidance.',
    icon: <Percent className="h-10 w-10 text-white" />,
    color: 'bg-purple-500'
  },
  {
    id: 'wholetofraction',
    title: 'Whole to Fraction',
    description: 'Convert whole numbers to fractions with specified denominators.',
    icon: <Percent className="h-10 w-10 text-white" />,
    color: 'bg-amber-500'
  },
  {
    id: 'impropertomixed',
    title: 'Improper to Mixed',
    description: 'Convert improper fractions to mixed numbers with step-by-step explanation.',
    icon: <Percent className="h-10 w-10 text-white" />,
    color: 'bg-red-500'
  },
  {
    id: 'fractionequivalent',
    title: 'Equivalent Fractions',
    description: 'Convert fractions to equivalent fractions with a given denominator.',
    icon: <Percent className="h-10 w-10 text-white" />,
    color: 'bg-green-500'
  },
  {
    id: 'fractionreducer',
    title: 'Fraction Reducer',
    description: 'Reduce fractions to simpler equivalent forms with smaller denominators.',
    icon: <Percent className="h-10 w-10 text-white" />,
    color: 'bg-orange-500'
  },
  {
    id: 'fractiontypes',
    title: 'Fraction Types',
    description: 'Learn to identify and differentiate between proper fractions, improper fractions, and mixed numbers.',
    icon: <Percent className="h-10 w-10 text-white" />,
    color: 'bg-teal-500'
  },
  {
    id: 'subtraction',
    title: 'Subtraction',
    description: 'Master the art of subtracting numbers quickly and accurately.',
    icon: <Minus className="h-10 w-10 text-white" />,
    color: 'bg-pink-500'
  },
  {
    id: 'multiplication',
    title: 'Multiplication',
    description: 'Learn to multiply numbers efficiently.',
    icon: <X className="h-10 w-10 text-white" />,
    color: 'bg-purple-500'
  },
  {
    id: 'division',
    title: 'Division',
    description: 'Develop skills in dividing numbers with ease.',
    icon: <Divide className="h-10 w-10 text-white" />,
    color: 'bg-orange-500'
  },
  {
    id: 'fractions',
    title: 'Fractions',
    description: 'Work with fractions and mixed numbers.',
    icon: <Percent className="h-10 w-10 text-white" />,
    color: 'bg-green-500'
  },
  {
    id: 'tictactoe',
    title: 'Tic Tac Toe',
    description: 'Play the classic game of Tic Tac Toe.',
    icon: <Hash className="h-10 w-10 text-white" />,
    color: 'bg-cyan-500'
  },
  {
    id: 'geometry',
    title: 'Geometry',
    description: 'Calculate area and perimeter of geometric shapes.',
    icon: <Circle className="h-10 w-10 text-white" />,
    color: 'bg-violet-500'
  },
  {
    id: 'conversions',
    title: 'Number Conversions',
    description: 'Convert between fractions, decimals, percentages, and ratios.',
    icon: <Repeat className="h-10 w-10 text-white" />,
    color: 'bg-rose-500'
  },
  {
    id: 'continents',
    title: 'World Continents',
    description: 'Learn about the seven continents through an interactive drag-and-drop game.',
    icon: <Globe className="h-10 w-10 text-white" />,
    color: 'bg-emerald-500'
  },
  {
    id: 'maze',
    title: 'Maze Game',
    description: 'Navigate through randomly generated mazes using arrow keys.',
    icon: <Maze className="h-10 w-10 text-white" />,
    color: 'bg-violet-500'
  },
  {
    id: 'factfamilies',
    title: 'Fact Families',
    description: 'Practice related addition/subtraction and multiplication/division facts.',
    icon: <Triangle className="h-10 w-10 text-white" />,
    color: 'bg-amber-500'
  },
  {
    id: 'prealgebra',
    title: 'Pre-Algebra',
    description: 'Learn basic algebraic concepts with variables, expressions, and equations.',
    icon: <Variable className="h-10 w-10 text-white" />,
    color: 'bg-fuchsia-500'
  },
  {
    id: 'integers',
    title: 'Integer Numbers',
    description: 'Practice operations with positive and negative integers.',
    icon: <Integer className="h-10 w-10 text-white" />,
    color: 'bg-pink-500'
  },
  {
    id: 'commutative',
    title: 'Commutative Property',
    description: 'Understand how changing the order of operations affects the result.',
    icon: <Calculator className="h-10 w-10 text-white" />,
    color: 'bg-indigo-500'
  },
  {
    id: 'associative',
    title: 'Associative Property',
    description: 'Learn how grouping numbers differently can maintain the same result.',
    icon: <Sigma className="h-10 w-10 text-white" />,
    color: 'bg-red-500'
  },
  {
    id: 'distributive',
    title: 'Distributive Property',
    description: 'Understand how multiplication distributes over addition or subtraction.',
    icon: <PieChart className="h-10 w-10 text-white" />,
    color: 'bg-yellow-500'
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'Solve Sudoku puzzles to enhance logical thinking.',
    icon: <Grid3X3 className="h-10 w-10 text-white" />,
    color: 'bg-teal-500'
  }
];

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const { progress } = useProgress();
  const [gridCols, setGridCols] = useState<GridSize>(() => {
    const saved = localStorage.getItem('homepage_grid_cols');
    return (saved ? parseInt(saved, 10) : 3) as GridSize;
  });
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleModulesCount, setVisibleModulesCount] = useState(operationsList.length);
  
  // Save grid preference
  useEffect(() => {
    localStorage.setItem('homepage_grid_cols', gridCols.toString());
  }, [gridCols]);

  const handleGridChange = (cols: GridSize) => {
    setGridCols(cols);
    setIsGridMenuOpen(false);
  };
  
  // Handler for updating the visible modules count
  const handleVisibleCountChange = (count: number) => {
    setVisibleModulesCount(count);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Welcome to Math W+A+O+K
            {user && <span className="ml-2">{user.name}</span>}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Improve your math skills through interactive exercises and track your progress.
            Choose an operation below to get started.
          </p>
        </div>

        {user && progress && (
          <div className="mb-10 bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4 text-indigo-700 dark:text-indigo-300">Your Progress</h2>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
                <p className="text-gray-600 dark:text-gray-300">Current Streak</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{progress.streakDays} days</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
                <p className="text-gray-600 dark:text-gray-300">Operations Practiced</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{Object.keys(progress.operations).length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
                <p className="text-gray-600 dark:text-gray-300">Total Exercises</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {Object.values(progress.operations).reduce((acc, op) => acc + op.totalCompleted, 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4">
          {/* Search input */}
          <div className="w-full md:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Grid layout selector with visible count */}
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 rounded-lg text-sm font-medium text-indigo-600 dark:text-indigo-300">
              Showing {visibleModulesCount} of {operationsList.length} modules
            </div>
            
            <div className="relative">
              <button
                onClick={() => setIsGridMenuOpen(!isGridMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {gridCols} {gridCols === 1 ? 'Column' : 'Columns'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isGridMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <div className={`absolute right-0 mt-2 py-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10 ${isGridMenuOpen ? 'block' : 'hidden'}`}>
                {([1, 3, 6, 8] as const).map((size) => (
                  <button key={size} onClick={() => handleGridChange(size)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                    {size} {size === 1 ? 'Column' : 'Columns'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <ModuleList 
          modules={operationsList} 
          gridCols={gridCols}
          searchQuery={searchQuery}
          onVisibleCountChange={handleVisibleCountChange}
        />
      </div>
    </DndProvider>
  );
};

export default HomePage;