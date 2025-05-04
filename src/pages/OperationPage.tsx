import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { MixedToFractionExercise, MixedToFractionSettings } from '../operations/mixedtofraction/MixedToFractionSettings';
// Import all operations
import { Exercise as AdditionExercise, Settings as AdditionSettings } from '../operations/addition/Addition';
import { SubtractionExercise, SubtractionSettings } from '../operations/subtraction/Subtraction';
import { MultiplicationExercise, MultiplicationSettings } from '../operations/multiplication/Exercise';
import { DivisionExercise, DivisionSettings } from '../operations/division/Exercise';
import * as FractionsOp from '../operations/fractions';
import { TicTacToeGame } from '../operations/tictactoe/Tictactoe';
import { ConversionsExercise, ConversionsSettings } from '../operations/conversions/Exercise';
import { GeometryExercise, GeometrySettings } from '../operations/geometry/Exercise';
import { ContinentsGame } from '../operations/continents/Continents';
import { MazeGame } from '../operations/maze/Maze';
import { FactFamiliesExercise, FactFamiliesSettings } from '../operations/factfamilies/Exercise';
import { PreAlgebraExercise, PreAlgebraSettings } from '../operations/prealgebra/Exercise';
import { IntegerExercise, IntegerSettings } from '../operations/integers/Exercise';
import { CommutativeExercise, CommutativeSettings } from '../operations/commutative/Exercise';
import { AssociativeExercise, AssociativeSettings } from '../operations/associative/Exercise';
import { DistributiveExercise, DistributiveSettings } from '../operations/distributive/Exercise';
import { SudokuGame as SudokuExercise, SudokuSettings } from '../operations/sudoku/Sudoku';
import { Exercise as WholeToFractionExercise, Settings as WholeToFractionSettings } from '../operations/wholetofraction';
import { Exercise as ImproperToMixedExercise, Settings as ImproperToMixedSettings } from '../operations/impropertomixed';
import { Exercise as FractionEquivalentExercise, Settings as FractionEquivalentSettings } from '../operations/fractionequivalent';
import { Exercise as FractionReducerExercise, Settings as FractionReducerSettings } from '../operations/fractionreducer';
import { Exercise as FractionTypesExercise, Settings as FractionTypesSettings } from '../operations/fractiontypes';
import { Exercise as CountingExercise, Settings as CountingSettings } from '../operations/counting';
import { Exercise as AlphabetExercise, Settings as AlphabetSettings } from '../operations/alphabet';
import { Exercise as CombinedOperationsExercise, Settings as CombinedOperationsSettings } from '../operations/combinedoperations';

// Define operations once to avoid re-creating on every render
const operations = {
  addition: { Exercise: AdditionExercise, Settings: AdditionSettings },
  subtraction: { Exercise: SubtractionExercise, Settings: SubtractionSettings },
  multiplication: { Exercise: MultiplicationExercise, Settings: MultiplicationSettings },
  division: { Exercise: DivisionExercise, Settings: DivisionSettings },
  fractions: FractionsOp,
  tictactoe: { Exercise: TicTacToeGame },
  conversions: { Exercise: ConversionsExercise, Settings: ConversionsSettings },
  geometry: { Exercise: GeometryExercise, Settings: GeometrySettings },
  continents: { Exercise: ContinentsGame },
  maze: { Exercise: MazeGame },
  factfamilies: { Exercise: FactFamiliesExercise, Settings: FactFamiliesSettings },
  prealgebra: { Exercise: PreAlgebraExercise, Settings: PreAlgebraSettings },
  integers: { Exercise: IntegerExercise, Settings: IntegerSettings },
  commutative: { Exercise: CommutativeExercise, Settings: CommutativeSettings },
  associative: { Exercise: AssociativeExercise, Settings: AssociativeSettings },
  distributive: { Exercise: DistributiveExercise, Settings: DistributiveSettings },
  sudoku: { Exercise: SudokuExercise, Settings: SudokuSettings },
  mixedtofraction: { Exercise: MixedToFractionExercise, Settings: MixedToFractionSettings },
  wholetofraction: { Exercise: WholeToFractionExercise, Settings: WholeToFractionSettings },
  impropertomixed: { Exercise: ImproperToMixedExercise, Settings: ImproperToMixedSettings },
  fractionequivalent: { Exercise: FractionEquivalentExercise, Settings: FractionEquivalentSettings },
  fractionreducer: { Exercise: FractionReducerExercise, Settings: FractionReducerSettings },
  fractiontypes: { Exercise: FractionTypesExercise, Settings: FractionTypesSettings },
  counting: { Exercise: CountingExercise, Settings: CountingSettings },
  alphabet: { Exercise: AlphabetExercise, Settings: AlphabetSettings },
  combinedoperations: { Exercise: CombinedOperationsExercise, Settings: CombinedOperationsSettings }
};

// Operation names in a static object
const operationNames: Record<string, string> = {
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiplication',
  division: 'Division',
  fractions: 'Fractions',
  tictactoe: 'Tic Tac Toe',
  conversions: 'Number Conversions',
  geometry: 'Geometry',
  continents: 'World Continents',
  maze: 'Maze Game',
  factfamilies: 'Fact Families',
  prealgebra: 'Pre-Algebra',
  integers: 'Integer Numbers',
  commutative: 'Commutative Property',
  associative: 'Associative Property',
  distributive: 'Distributive Property',
  sudoku: 'Sudoku',
  mixedtofraction: 'Mixed to Fraction Converter',
  wholetofraction: 'Whole to Fraction Converter',
  impropertomixed: 'Improper Fraction to Mixed Number',
  fractionequivalent: 'Equivalent Fractions',
  fractionreducer: 'Fraction Reducer',
  fractiontypes: 'Fraction Types',
  counting: 'Counting Numbers',
  alphabet: 'Alphabet Learning',
  combinedoperations: 'Combined Operations'
};

const OperationPage: React.FC = () => {
  const { operationId } = useParams<{ operationId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { updateOperationProgress } = useProgress();
  const [showSettings, setShowSettings] = useState(false);
  
  // Memoize operation checking to reduce computation 
  const validOperation = useMemo(() => {
    return operationId && Object.keys(operations).includes(operationId);
  }, [operationId]);

  // Handle operation progress events with memoization
  const handleOperationProgress = useCallback((event: Event) => {
    if (isAuthenticated && event instanceof CustomEvent) {
      const detail = event.detail;
      if (detail && detail.operationType) {
        const { operationType, correct, timeSpent, difficulty, attempts = 1, revealed = false } = detail;
        updateOperationProgress(
          operationType, 
          { correct, timeSpent, difficulty, attempts, revealed }
        );
      }
    }
  }, [isAuthenticated, updateOperationProgress]);

  // Redirect to home if operation is invalid
  useEffect(() => {
    if (operationId && !validOperation) {
      navigate('/', { replace: true });
    }
  }, [operationId, navigate, validOperation]);

  // Set up and tear down the event listener
  useEffect(() => {
    window.addEventListener('operationProgress', handleOperationProgress as EventListener);
    return () => {
      window.removeEventListener('operationProgress', handleOperationProgress as EventListener);
    };
  }, [handleOperationProgress]);

  // Return early if operation is invalid
  if (!operationId || !validOperation) {
    return null;
  }

  // Only access the operation when we know it's valid
  const operation = operations[operationId as keyof typeof operations];
  const ExerciseComponent = operation.Exercise;
  const SettingsComponent = operation.Settings;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{operationNames[operationId]}</h1>
        </div>
        {SettingsComponent && (
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
          >
            {showSettings ? 'Back to Exercise' : 'Settings'}
          </button>
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        {showSettings && SettingsComponent ? (
          <SettingsComponent />
        ) : (
          <ExerciseComponent />
        )}
      </div>
    </div>
  );
};

export default OperationPage;