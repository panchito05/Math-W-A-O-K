import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Eye, RotateCcw, RefreshCw, Check, HelpCircle, Lightbulb } from 'lucide-react';

// --- Tipos de datos ---
type SudokuDifficulty = 'easy' | 'medium' | 'hard' | 'expert';
type SudokuSize = 4 | 6 | 9;

interface SudokuSettings {
  size: SudokuSize;
  difficulty: SudokuDifficulty;
  timerEnabled: boolean;
  highlightSameNumbers: boolean;
  showMistakes: boolean;
  allowNotes: boolean;
  adaptiveDifficulty: boolean;
  enableCompensation: boolean;
}

interface SudokuCell {
  value: number | null;
  isGiven: boolean;
  isError?: boolean;
  userNotes: number[];
}

interface SudokuGameState {
  board: SudokuCell[][];
  solution: number[][];
  selectedCell: [number, number] | null;
  inNotesMode: boolean;
  startTime: number;
  pausedTime: number;
  isPaused: boolean;
  isComplete: boolean;
  mistakes: number;
  hintsUsed: number;
  revealedSolution: boolean;
}

interface SudokuStats {
  totalGames: number;
  completedGames: number;
  totalTime: number;
  consecutiveCorrectGames: number;
  bestTimes: {
    easy4x4: number;
    medium4x4: number;
    hard4x4: number;
    expert4x4: number;
    easy6x6: number;
    medium6x6: number;
    hard6x6: number;
    expert6x6: number;
    easy9x9: number;
    medium9x9: number;
    hard9x9: number;
    expert9x9: number;
  };
}

// --- Constantes ---
const CORRECT_STREAK_THRESHOLD = 10; // Número de juegos correctos consecutivos para aumentar dificultad

// --- Funciones de utilidad ---
function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffleArray<T>(array: T[]): T[] {
  const arrayCopy = [...array];
  for (let i = arrayCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j], arrayCopy[i]];
  }
  return arrayCopy;
}

// --- Generador de Sudoku ---
const generateSudokuPuzzle = (size: SudokuSize, difficulty: SudokuDifficulty): { board: SudokuCell[][], solution: number[][] } => {
  // Determinar el tamaño del subgrupo
  const boxSize = size === 9 ? 3 : size === 6 ? 2 : 2;
  
  // Inicializar la solución
  const solution: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  
  // Función para verificar si un número es válido en una posición
  const isValid = (row: number, col: number, num: number): boolean => {
    // Verificar fila y columna
    for (let i = 0; i < size; i++) {
      if (solution[row][i] === num || solution[i][col] === num) {
        return false;
      }
    }
    
    // Verificar caja
    const boxRow = Math.floor(row / boxSize) * boxSize;
    const boxCol = Math.floor(col / boxSize) * boxSize;
    for (let i = 0; i < boxSize; i++) {
      for (let j = 0; j < boxSize; j++) {
        if (solution[boxRow + i][boxCol + j] === num) {
          return false;
        }
      }
    }
    
    return true;
  };
  
  // Resolver el sudoku (generar una solución completa)
  const solveSudoku = (row: number = 0, col: number = 0): boolean => {
    if (row === size) {
      row = 0;
      col++;
      if (col === size) {
        return true; // Tablero resuelto
      }
    }
    
    if (solution[row][col] !== 0) {
      return solveSudoku(row + 1, col);
    }
    
    // Crear arreglo de números a probar en orden aleatorio
    const numbers = shuffleArray([...Array(size)].map((_, i) => i + 1));
    
    for (const num of numbers) {
      if (isValid(row, col, num)) {
        solution[row][col] = num;
        if (solveSudoku(row + 1, col)) {
          return true;
        }
        solution[row][col] = 0; // Backtrack
      }
    }
    
    return false;
  };
  
  // Generar la solución
  solveSudoku();
  
  // Crear una copia de la solución para eliminar números
  const puzzle: number[][] = solution.map(row => [...row]);
  
  // Determinar cuántos números eliminar basado en la dificultad y el tamaño
  const cellCount = size * size;
  let cellsToRemove: number;
  
  if (size === 4) {
    // 4x4 Sudoku
    switch (difficulty) {
      case 'easy': cellsToRemove = Math.floor(cellCount * 0.4); break; // ~6-7 celdas
      case 'medium': cellsToRemove = Math.floor(cellCount * 0.5); break; // ~8 celdas
      case 'hard': cellsToRemove = Math.floor(cellCount * 0.6); break; // ~9-10 celdas
      case 'expert': cellsToRemove = Math.floor(cellCount * 0.7); break; // ~11 celdas
      default: cellsToRemove = Math.floor(cellCount * 0.5);
    }
  } else if (size === 6) {
    // 6x6 Sudoku
    switch (difficulty) {
      case 'easy': cellsToRemove = Math.floor(cellCount * 0.4); break; // ~14-15 celdas
      case 'medium': cellsToRemove = Math.floor(cellCount * 0.5); break; // ~18 celdas
      case 'hard': cellsToRemove = Math.floor(cellCount * 0.6); break; // ~22 celdas
      case 'expert': cellsToRemove = Math.floor(cellCount * 0.65); break; // ~23-24 celdas
      default: cellsToRemove = Math.floor(cellCount * 0.5);
    }
  } else {
    // 9x9 Sudoku
    switch (difficulty) {
      case 'easy': cellsToRemove = Math.floor(cellCount * 0.5); break; // ~40 celdas
      case 'medium': cellsToRemove = Math.floor(cellCount * 0.6); break; // ~48-50 celdas
      case 'hard': cellsToRemove = Math.floor(cellCount * 0.7); break; // ~56-57 celdas
      case 'expert': cellsToRemove = Math.floor(cellCount * 0.75); break; // ~60 celdas
      default: cellsToRemove = Math.floor(cellCount * 0.6);
    }
  }
  
  // Función para verificar si un tablero tiene solución única
  const hasUniqueSolution = (board: number[][]): boolean => {
    const tmpBoard = board.map(row => [...row]);
    let solutions = 0;
    
    const countSolutions = (row: number = 0, col: number = 0): void => {
      if (solutions > 1) return; // Ya encontramos múltiples soluciones
      
      if (row === size) {
        row = 0;
        col++;
        if (col === size) {
          solutions++; // Encontramos una solución
          return;
        }
      }
      
      if (tmpBoard[row][col] !== 0) {
        countSolutions(row + 1, col);
        return;
      }
      
      for (let num = 1; num <= size; num++) {
        if (isValidPlacement(tmpBoard, row, col, num)) {
          tmpBoard[row][col] = num;
          countSolutions(row + 1, col);
          tmpBoard[row][col] = 0; // Backtrack
        }
      }
    };
    
    const isValidPlacement = (board: number[][], row: number, col: number, num: number): boolean => {
      // Verificar fila
      for (let i = 0; i < size; i++) {
        if (board[row][i] === num) return false;
      }
      
      // Verificar columna
      for (let i = 0; i < size; i++) {
        if (board[i][col] === num) return false;
      }
      
      // Verificar caja
      const boxRow = Math.floor(row / boxSize) * boxSize;
      const boxCol = Math.floor(col / boxSize) * boxSize;
      for (let i = 0; i < boxSize; i++) {
        for (let j = 0; j < boxSize; j++) {
          if (board[boxRow + i][boxCol + j] === num) return false;
        }
      }
      
      return true;
    };
    
    countSolutions();
    return solutions === 1;
  };
  
  // Remover números aleatoriamente manteniendo solución única
  const positions = shuffleArray(
    Array.from({ length: cellCount }, (_, i) => [Math.floor(i / size), i % size] as [number, number])
  );
  
  let removed = 0;
  for (const [row, col] of positions) {
    if (removed >= cellsToRemove) break;
    
    const temp = puzzle[row][col];
    puzzle[row][col] = 0;
    
    // Verificar si sigue teniendo solución única
    const uniqueSolution = hasUniqueSolution(puzzle);
    
    if (!uniqueSolution) {
      puzzle[row][col] = temp; // Restaurar el número
    } else {
      removed++;
    }
  }
  
  // Convertir el tablero a formato de celdas
  const board: SudokuCell[][] = puzzle.map(row => 
    row.map(value => ({
      value: value === 0 ? null : value,
      isGiven: value !== 0,
      userNotes: []
    }))
  );
  
  return { board, solution };
};

// --- Validador de Sudoku ---
const validateSudoku = (board: SudokuCell[][], size: SudokuSize): boolean => {
  const boxSize = size === 9 ? 3 : size === 6 ? 2 : 2;
  
  // Verificar filas
  for (let row = 0; row < size; row++) {
    const seen = new Set<number>();
    for (let col = 0; col < size; col++) {
      const value = board[row][col].value;
      if (value !== null) {
        if (seen.has(value)) return false;
        seen.add(value);
      }
    }
  }
  
  // Verificar columnas
  for (let col = 0; col < size; col++) {
    const seen = new Set<number>();
    for (let row = 0; row < size; row++) {
      const value = board[row][col].value;
      if (value !== null) {
        if (seen.has(value)) return false;
        seen.add(value);
      }
    }
  }
  
  // Verificar cajas
  for (let boxRow = 0; boxRow < size; boxRow += boxSize) {
    for (let boxCol = 0; boxCol < size; boxCol += boxSize) {
      const seen = new Set<number>();
      for (let i = 0; i < boxSize; i++) {
        for (let j = 0; j < boxSize; j++) {
          const value = board[boxRow + i][boxCol + j].value;
          if (value !== null) {
            if (seen.has(value)) return false;
            seen.add(value);
          }
        }
      }
    }
  }
  
  // Verificar si está completo
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col].value === null) return false;
    }
  }
  
  return true;
};

// --- Funciones auxiliares del juego ---
const isSudokuComplete = (board: SudokuCell[][]): boolean => {
  for (const row of board) {
    for (const cell of row) {
      if (cell.value === null) return false;
    }
  }
  return true;
};

const checkForErrors = (board: SudokuCell[][], row: number, col: number, size: SudokuSize): boolean => {
  const boxSize = size === 9 ? 3 : size === 6 ? 2 : 2;
  const value = board[row][col].value;
  
  if (value === null) return false;
  
  // Verificar fila
  for (let i = 0; i < size; i++) {
    if (i !== col && board[row][i].value === value) {
      return true;
    }
  }
  
  // Verificar columna
  for (let i = 0; i < size; i++) {
    if (i !== row && board[i][col].value === value) {
      return true;
    }
  }
  
  // Verificar caja
  const boxRow = Math.floor(row / boxSize) * boxSize;
  const boxCol = Math.floor(col / boxSize) * boxSize;
  for (let i = 0; i < boxSize; i++) {
    for (let j = 0; j < boxSize; j++) {
      const r = boxRow + i;
      const c = boxCol + j;
      if (r !== row || c !== col) {
        if (board[r][c].value === value) {
          return true;
        }
      }
    }
  }
  
  return false;
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

const getInitialStats = (): SudokuStats => {
  return {
    totalGames: 0,
    completedGames: 0,
    totalTime: 0,
    consecutiveCorrectGames: 0,
    bestTimes: {
      easy4x4: Infinity,
      medium4x4: Infinity,
      hard4x4: Infinity,
      expert4x4: Infinity,
      easy6x6: Infinity,
      medium6x6: Infinity,
      hard6x6: Infinity,
      expert6x6: Infinity,
      easy9x9: Infinity,
      medium9x9: Infinity,
      hard9x9: Infinity,
      expert9x9: Infinity
    }
  };
};

// Función para obtener el siguiente nivel de dificultad
const getNextDifficulty = (current: SudokuDifficulty): SudokuDifficulty => {
  switch (current) {
    case 'easy': return 'medium';
    case 'medium': return 'hard';
    case 'hard': return 'expert';
    case 'expert': return 'expert'; // No hay nivel superior
    default: return 'medium';
  }
};

// --- Componente de Configuración ---
export const SudokuSettings: React.FC = () => {
  const [settings, setSettings] = useState<SudokuSettings>(() => {
    const saved = localStorage.getItem('sudoku_settings');
    const defaultSettings: SudokuSettings = {
      size: 4,
      difficulty: 'easy',
      timerEnabled: true,
      highlightSameNumbers: true,
      showMistakes: true,
      allowNotes: true,
      adaptiveDifficulty: true,
      enableCompensation: false
    };
    
    if (!saved) return defaultSettings;
    try {
      return { ...defaultSettings, ...JSON.parse(saved) };
    } catch {
      return defaultSettings;
    }
  });
  
  const [stats, setStats] = useState<SudokuStats>(() => {
    const saved = localStorage.getItem('sudoku_stats');
    if (!saved) return getInitialStats();
    try {
      return JSON.parse(saved);
    } catch {
      return getInitialStats();
    }
  });
  
  useEffect(() => {
    localStorage.setItem('sudoku_settings', JSON.stringify(settings));
  }, [settings]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'size') {
      setSettings(prev => ({ ...prev, [name]: parseInt(value) as SudokuSize }));
    } else if (name === 'difficulty') {
      setSettings(prev => ({ ...prev, [name]: value as SudokuDifficulty }));
    } else if (type === 'checkbox') {
      setSettings(prev => ({ 
        ...prev, 
        [name]: (e.target as HTMLInputElement).checked 
      }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const resetStats = () => {
    if (window.confirm('¿Estás seguro de que deseas reiniciar todas tus estadísticas? Esta acción no se puede deshacer.')) {
      const newStats = getInitialStats();
      setStats(newStats);
      localStorage.setItem('sudoku_stats', JSON.stringify(newStats));
      toast.success('Estadísticas reiniciadas con éxito');
    }
  };
  
  const formatBestTime = (time: number): string => {
    if (time === Infinity) return '—';
    return formatTime(time);
  };
  
  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">Configuración de Sudoku</h2>
      
      <div className="space-y-6">
        {/* Tamaño del tablero */}
        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tamaño del tablero
          </label>
          <select
            id="size"
            name="size"
            value={settings.size}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value={4}>4x4 (Fácil)</option>
            <option value={6}>6x6 (Medio)</option>
            <option value={9}>9x9 (Clásico)</option>
          </select>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Selecciona el tamaño del tablero de Sudoku.
          </p>
        </div>
        
        {/* Dificultad */}
        <div>
          <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nivel de dificultad
          </label>
          <select
            id="difficulty"
            name="difficulty"
            value={settings.difficulty}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="easy">Fácil</option>
            <option value="medium">Medio</option>
            <option value="hard">Difícil</option>
            <option value="expert">Experto</option>
          </select>
        </div>
        
        {/* Opciones adicionales */}
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="timerEnabled"
              name="timerEnabled"
              checked={settings.timerEnabled}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="timerEnabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Mostrar temporizador
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="highlightSameNumbers"
              name="highlightSameNumbers"
              checked={settings.highlightSameNumbers}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="highlightSameNumbers" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Resaltar números iguales
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showMistakes"
              name="showMistakes"
              checked={settings.showMistakes}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="showMistakes" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Mostrar errores (solo en nivel fácil)
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="allowNotes"
              name="allowNotes"
              checked={settings.allowNotes}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="allowNotes" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Permitir notas
            </label>
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
              Habilitar dificultad adaptativa (aumenta después de {CORRECT_STREAK_THRESHOLD} juegos correctos)
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
              Habilitar compensación (añadir un problema adicional por cada incorrecto)
            </label>
          </div>
        </div>
      </div>
      
      {/* Estadísticas */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4">Estadísticas</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-300">Partidas jugadas</p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{stats.totalGames}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-300">Partidas completadas</p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{stats.completedGames}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-300">Racha actual</p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{stats.consecutiveCorrectGames}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm">
            <p className="text-sm text-gray-600 dark:text-gray-300">Tiempo total</p>
            <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatTime(stats.totalTime)}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm mb-4">
          <h4 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Mejores tiempos</h4>
          
          <div className="space-y-2 mb-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">4x4</p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="block text-gray-500 dark:text-gray-400">Fácil</span>
                <span className="font-medium">{formatBestTime(stats.bestTimes.easy4x4)}</span>
              </div>
              <div>
                <span className="block text-gray-500 dark:text-gray-400">Medio</span>
                <span className="font-medium">{formatBestTime(stats.bestTimes.medium4x4)}</span>
              </div>
              <div>
                <span className="block text-gray-500 dark:text-gray-400">Difícil</span>
                <span className="font-medium">{formatBestTime(stats.bestTimes.hard4x4)}</span>
              </div>
              <div>
                <span className="block text-gray-500 dark:text-gray-400">Experto</span>
                <span className="font-medium">{formatBestTime(stats.bestTimes.expert4x4)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mb-3">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">6x6</p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="block text-gray-500 dark:text-gray-400">Fácil</span>
                <span className="font-medium">{formatBestTime(stats.bestTimes.easy6x6)}</span>
              </div>
              <div>
                <span className="block text-gray-500 dark:text-gray-400">Medio</span>
                <span className="font-medium">{formatBestTime(stats.bestTimes.medium6x6)}</span>
              </div>
              <div>
                <span className="block text-gray-500 dark:text-gray-400">Difícil</span>
                <span className="font-medium">{formatBestTime(stats.bestTimes.hard6x6)}</span>
              </div>
              <div>
                <span className="block text-gray-500 dark:text-gray-400">Experto</span>
                <span className="font-medium">{formatBestTime(stats.bestTimes.expert6x6)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">9x9</p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div>
                <span className="block text-gray-500 dark:text-gray-400">Fácil</span>
                <span className="font-medium">{formatBestTime(stats.bestTimes.easy9x9)}</span>
              </div>
              <div>
                <span className="block text-gray-500 dark:text-gray-400">Medio</span>
                <span className="font-medium">{formatBestTime(stats.bestTimes.medium9x9)}</span>
              </div>
              <div>
                <span className="block text-gray-500 dark:text-gray-400">Difícil</span>
                <span className="font-medium">{formatBestTime(stats.bestTimes.hard9x9)}</span>
              </div>
              <div>
                <span className="block text-gray-500 dark:text-gray-400">Experto</span>
                <span className="font-medium">{formatBestTime(stats.bestTimes.expert9x9)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <button
          onClick={resetStats}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 text-sm"
        >
          Reiniciar estadísticas
        </button>
      </div>
    </div>
  );
};

// --- Componente del Juego ---
export const SudokuGame: React.FC = () => {
  // Obtener la configuración del juego
  const [settings, setSettings] = useState<SudokuSettings>(() => {
    const saved = localStorage.getItem('sudoku_settings');
    const defaultSettings: SudokuSettings = {
      size: 4,
      difficulty: 'easy',
      timerEnabled: true,
      highlightSameNumbers: true,
      showMistakes: true,
      allowNotes: true,
      adaptiveDifficulty: true,
      enableCompensation: false
    };
    
    if (!saved) return defaultSettings;
    try {
      return { ...defaultSettings, ...JSON.parse(saved) };
    } catch {
      return defaultSettings;
    }
  });
  
  // Estado para seguir los cambios de tamaño o dificultad
  const [gameConfig, setGameConfig] = useState({
    size: settings.size,
    difficulty: settings.difficulty
  });

  // Estado del juego
  const [gameState, setGameState] = useState<SudokuGameState>(() => {
    const { board, solution } = generateSudokuPuzzle(settings.size, settings.difficulty);
    return {
      board,
      solution,
      selectedCell: null,
      inNotesMode: false,
      startTime: Date.now(),
      pausedTime: 0,
      isPaused: false,
      isComplete: false,
      mistakes: 0,
      hintsUsed: 0,
      revealedSolution: false
    };
  });
  
  // Estado para el tiempo transcurrido
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  
  // Estado para el modal de victoria
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  
  // Estado para el tutorial
  const [showTutorial, setShowTutorial] = useState<boolean>(false);
  const [tutorialStep, setTutorialStep] = useState<number>(1);
  
  // Referencias
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const gameInitializedRef = useRef<boolean>(false);
  
  // Cargar o inicializar estadísticas
  const [stats, setStats] = useState<SudokuStats>(() => {
    const saved = localStorage.getItem('sudoku_stats');
    if (!saved) return getInitialStats();
    try {
      return JSON.parse(saved);
    } catch {
      return getInitialStats();
    }
  });
  
  // Iniciar nuevo juego
  const startNewGame = useCallback(() => {
    // Detener el temporizador actual si existe
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Generar nuevo tablero
    const { board, solution } = generateSudokuPuzzle(settings.size, settings.difficulty);
    
    // Actualizar el estado del juego
    setGameState({
      board,
      solution,
      selectedCell: null,
      inNotesMode: false,
      startTime: Date.now(),
      pausedTime: 0,
      isPaused: false,
      isComplete: false,
      mistakes: 0,
      hintsUsed: 0,
      revealedSolution: false
    });
    
    // Reiniciar el tiempo transcurrido
    setElapsedTime(0);
    
    // Ocultar modal de victoria si está visible
    setShowVictoryModal(false);
    
    // Actualizar estadísticas (total de juegos)
    const newStats = { ...stats };
    newStats.totalGames++;
    setStats(newStats);
    localStorage.setItem('sudoku_stats', JSON.stringify(newStats));
    
    // Actualizar la configuración actual del juego
    setGameConfig({
      size: settings.size,
      difficulty: settings.difficulty
    });
    
    // Mostrar mensaje de nuevo juego
    toast.success(`Nuevo juego iniciado (${settings.size}x${settings.size} - ${settings.difficulty})`);
  }, [settings.size, settings.difficulty, stats]);
  
  // Efectos
  
  // Efecto para el temporizador
  useEffect(() => {
    if (settings.timerEnabled && !gameState.isPaused && !gameState.isComplete) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - gameState.startTime) / 1000) - gameState.pausedTime);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [settings.timerEnabled, gameState.isPaused, gameState.isComplete, gameState.startTime, gameState.pausedTime]);
  
  // Efecto para escuchar configuración actualizada
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'sudoku_settings' && event.newValue) {
        try {
          const newSettings = JSON.parse(event.newValue) as Partial<SudokuSettings>;
          setSettings(prev => ({ ...prev, ...newSettings }));
        } catch (error) {
          console.error('Error parsing settings from storage:', error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Efecto para verificar si el tablero está completo
  useEffect(() => {
    if (!gameState.isComplete && isSudokuComplete(gameState.board)) {
      const isValid = validateSudoku(gameState.board, settings.size);
      
      if (isValid) {
        // Detener el temporizador
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        // Actualizar el estado del juego
        setGameState(prev => ({ ...prev, isComplete: true }));
        
        // Actualizar estadísticas
        const gameTime = elapsedTime;
        const newStats = { ...stats };
        newStats.totalGames++;
        newStats.completedGames++;
        newStats.totalTime += gameTime;
        
        // Actualizar consecutiveCorrectGames si no se reveló la solución
        if (!gameState.revealedSolution) {
          newStats.consecutiveCorrectGames++;
          
          // Si tenemos habilitada la dificultad adaptativa, verificar si debemos aumentar la dificultad
          if (settings.adaptiveDifficulty && newStats.consecutiveCorrectGames >= CORRECT_STREAK_THRESHOLD) {
            const nextDifficulty = getNextDifficulty(settings.difficulty);
            if (nextDifficulty !== settings.difficulty) {
              // Actualizar configuración solo si hay un nivel superior disponible
              setSettings(prev => ({ ...prev, difficulty: nextDifficulty }));
              localStorage.setItem('sudoku_settings', JSON.stringify({
                ...settings,
                difficulty: nextDifficulty
              }));
              
              // Mostrar mensaje de aumento de dificultad
              toast.info(`¡Nivel aumentado a ${nextDifficulty} después de ${newStats.consecutiveCorrectGames} juegos correctos!`, { duration: 4000 });
              
              // Reiniciar contador de juegos correctos
              newStats.consecutiveCorrectGames = 0;
            }
          }
        } else {
          // Si se reveló la solución, reiniciar el contador de consecutivos
          newStats.consecutiveCorrectGames = 0;
        }
        
        // Actualizar mejor tiempo si corresponde
        const timeKey = `${settings.difficulty}${settings.size}x${settings.size}` as keyof typeof newStats.bestTimes;
        if (gameTime < newStats.bestTimes[timeKey]) {
          newStats.bestTimes[timeKey] = gameTime;
        }
        
        setStats(newStats);
        localStorage.setItem('sudoku_stats', JSON.stringify(newStats));
        
        // Mostrar modal de victoria
        setShowVictoryModal(true);
      }
    }
  }, [gameState.board, gameState.isComplete, settings.size, settings.difficulty, settings.adaptiveDifficulty, stats, elapsedTime, gameState.revealedSolution]);
  
  // Efecto para iniciar un nuevo juego cuando cambia el tamaño o dificultad
  useEffect(() => {
    // Verificar si los datos son diferentes a los actuales
    if (gameInitializedRef.current && 
        (gameConfig.size !== settings.size || gameConfig.difficulty !== settings.difficulty)) {
      startNewGame();
    } else {
      gameInitializedRef.current = true;
    }
  }, [settings.size, settings.difficulty, gameConfig, startNewGame]);
  
  // Funciones de juego
  
  // Seleccionar celda
  const selectCell = (row: number, col: number) => {
    if (gameState.isPaused || gameState.isComplete || gameState.revealedSolution) return;
    
    setGameState(prev => ({
      ...prev,
      selectedCell: [row, col]
    }));
  };
  
 const placeNumber = (number: number) => {
  if (
    !gameState.selectedCell ||
    gameState.isPaused ||
    gameState.isComplete ||
    gameState.revealedSolution ||
    gameState.board[gameState.selectedCell[0]][gameState.selectedCell[1]].isGiven
  ) return;

  const [row, col] = gameState.selectedCell;

  // Si estamos en modo notas
  if (gameState.inNotesMode && settings.allowNotes) {
    setGameState(prev => {
      // --- SOLUCIÓN: Actualizar el estado de manera inmutable ---
      const newBoard = [...prev.board];
      const newRow = [...newBoard[row]]; // Crea una copia de la fila
      const newCell = { ...newRow[col] }; // Crea una copia de la celda

      // Toggling the note
      if (newCell.userNotes.includes(number)) {
        newCell.userNotes = newCell.userNotes.filter(n => n !== number);
      } else {
        newCell.userNotes = [...newCell.userNotes, number].sort((a, b) => a - b);
      }

      // Asigna la celda copiada de nuevo en la fila copiada
      newRow[col] = newCell;
      // Asigna la fila copiada de nuevo en el tablero copiado
      newBoard[row] = newRow;

      return { ...prev, board: newBoard }; // Devuelve el nuevo estado con el tablero correctamente actualizado de forma inmutable
    });
    return; // Sale de la función después de manejar las notas
  }

  // --- Resto de la lógica para colocar números (que ya maneja la inmutabilidad con deep copy o necesita ser revisada) ---
  setGameState(prev => {
    // NOTA: La siguiente línea para el modo normal usa un deep copy completo del tablero.
    // Aunque funciona para la inmutabilidad, es menos eficiente que la solución de notas.
    // Una mejora podría ser aplicar el mismo patrón de copia por niveles aquí también.
    const newBoard = [...prev.board.map(row => [...row.map(cell => ({ ...cell }))])];

    // Si el número ya está en la celda, lo quitamos
    if (newBoard[row][col].value === number) {
      newBoard[row][col].value = null;
      newBoard[row][col].isError = false;
      // Si estás en modo notas, también deberías limpiar las notas aquí si se remueve el valor.
      // Aunque el código actual solo llega aquí si NO estás en modo notas.
      // newBoard[row][col].userNotes = []; // Considerar añadir si la lógica cambia.
      return { ...prev, board: newBoard };
    }

    // Verificar si el número es correcto (la solución no se muestra, solo se usa para validar)
    const isCorrect = number === prev.solution[row][col];

    // Colocar el número
    newBoard[row][col].value = number;
    newBoard[row][col].userNotes = []; // Limpiar notas al colocar un número

    // Verificar si hay error (solo en nivel fácil o si showMistakes está activado)
    const shouldShowMistakes = settings.showMistakes && settings.difficulty === 'easy';

    if (shouldShowMistakes) {
      // Recalcular errores para *todo* el tablero que pueda verse afectado por este nuevo número
      // (Esto no está en el código original, el original solo marcaba el error en la celda actual.
      // Para una validación completa, podrías necesitar recorrer el tablero o revalidar la fila/col/caja).
      // Para mantener la lógica original que solo marca la celda actual:
      const hasError = !isCorrect || checkForErrors(newBoard, row, col, settings.size); // checkForErrors usa el nuevo board
      newBoard[row][col].isError = hasError;

      const newMistakes = hasError ? prev.mistakes + 1 : prev.mistakes;

      if (hasError) {
        toast.error('¡Número incorrecto!', { duration: 2000 });
      }

      return {
        ...prev,
        board: newBoard,
        mistakes: newMistakes
      };
    }

    // En niveles superiores o si showMistakes está desactivado
    const hasError = !isCorrect || checkForErrors(newBoard, row, col, settings.size);
    const newMistakes = hasError ? prev.mistakes + 1 : prev.mistakes;

    return {
      ...prev,
      board: newBoard,
      mistakes: newMistakes
      // No se marca isError en la celda para niveles superiores/showMistakes=false
    };
  });
}; 
  // Usar pista
  const useHint = () => {
    if (
      !gameState.selectedCell || 
      gameState.isPaused || 
      gameState.isComplete ||
      gameState.revealedSolution ||
      gameState.board[gameState.selectedCell[0]][gameState.selectedCell[1]].isGiven ||
      gameState.board[gameState.selectedCell[0]][gameState.selectedCell[1]].value === gameState.solution[gameState.selectedCell[0]][gameState.selectedCell[1]]
    ) return;
    
    const [row, col] = gameState.selectedCell;
    const correctValue = gameState.solution[row][col];
    
    setGameState(prev => {
      const newBoard = [...prev.board.map(row => [...row.map(cell => ({ ...cell }))])];
      newBoard[row][col].value = correctValue;
      newBoard[row][col].isError = false;
      newBoard[row][col].userNotes = [];
      
      return {
        ...prev,
        board: newBoard,
        hintsUsed: prev.hintsUsed + 1
      };
    });
    
    toast.info('Se ha usado una pista', { duration: 2000 });
  };
  
  // Revelar solución completa
  const revealSolution = () => {
    if (gameState.isPaused || gameState.isComplete || gameState.revealedSolution) return;
    
    // Preguntar confirmación
    if (!window.confirm('¿Estás seguro de que quieres revelar toda la solución? Esto se considerará como un juego incompleto.')) {
      return;
    }
    
    // Crear un nuevo tablero con la solución
    const newBoard = gameState.board.map((row, rowIndex) => 
      row.map((cell, colIndex) => ({
        ...cell,
        value: gameState.solution[rowIndex][colIndex],
        isError: false,
        userNotes: []
      }))
    );
    
    setGameState(prev => ({
      ...prev,
      board: newBoard,
      revealedSolution: true,
      isComplete: true  // Marcar como completo aunque realmente es rendirse
    }));
    
    // Actualizar estadísticas - considerar como un juego no completado
    const newStats = { ...stats };
    
    // Reiniciar contador de juegos correctos consecutivos
    newStats.consecutiveCorrectGames = 0;
    setStats(newStats);
    localStorage.setItem('sudoku_stats', JSON.stringify(newStats));
    
    toast.info('Se ha revelado la solución completa', { duration: 3000 });
    
    // Detener el temporizador
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Mostrar modal de victoria/finalización
    setShowVictoryModal(true);
  };
  
  // Borrar número o notas
  const clearCell = () => {
    if (
      !gameState.selectedCell || 
      gameState.isPaused || 
      gameState.isComplete ||
      gameState.revealedSolution ||
      gameState.board[gameState.selectedCell[0]][gameState.selectedCell[1]].isGiven
    ) return;
    
    const [row, col] = gameState.selectedCell;
    
    setGameState(prev => {
      const newBoard = [...prev.board.map(row => [...row.map(cell => ({ ...cell }))])];
      newBoard[row][col].value = null;
      newBoard[row][col].isError = false;
      
      // Si estamos en modo notas, limpiamos sólo las notas
      if (gameState.inNotesMode && settings.allowNotes) {
        newBoard[row][col].userNotes = [];
      }
      
      return { ...prev, board: newBoard };
    });
  };
  
  // Alternar modo de notas
  const toggleNotesMode = () => {
    if (gameState.isPaused || gameState.isComplete || gameState.revealedSolution || !settings.allowNotes) return;
    
    setGameState(prev => ({
      ...prev,
      inNotesMode: !prev.inNotesMode
    }));
  };
  
  // Pausar/reanudar juego
  const togglePause = () => {
    if (gameState.isComplete || gameState.revealedSolution) return;
    
    setGameState(prev => {
      if (prev.isPaused) {
        // Reanudar: actualizar hora de inicio para mantener el tiempo transcurrido
        const newStartTime = Date.now() - (elapsedTime + prev.pausedTime) * 1000;
        return {
          ...prev,
          isPaused: false,
          startTime: newStartTime
        };
      } else {
        // Pausar: guardar el tiempo transcurrido hasta ahora
        return {
          ...prev,
          isPaused: true,
          pausedTime: elapsedTime
        };
      }
    });
  };
  
  // Manejo de eventos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState.isPaused || gameState.isComplete || gameState.revealedSolution || !gameState.selectedCell) return;
      
      const key = e.key;
      
      // Navegación con teclas de flecha
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();
        const [row, col] = gameState.selectedCell;
        let newRow = row;
        let newCol = col;
        
        switch (key) {
          case 'ArrowUp':
            newRow = Math.max(0, row - 1);
            break;
          case 'ArrowDown':
            newRow = Math.min(settings.size - 1, row + 1);
            break;
          case 'ArrowLeft':
            newCol = Math.max(0, col - 1);
            break;
          case 'ArrowRight':
            newCol = Math.min(settings.size - 1, col + 1);
            break;
        }
        
        selectCell(newRow, newCol);
        return;
      }
      
      // Teclas numéricas
      if (/^[1-9]$/.test(key) && parseInt(key) <= settings.size) {
        placeNumber(parseInt(key));
        return;
      }
      
      // Tecla de borrado
      if (key === 'Delete' || key === 'Backspace') {
        clearCell();
        return;
      }
      
      // Tecla para notas (n)
      if (key === 'n' && settings.allowNotes) {
        toggleNotesMode();
        return;
      }
      
      // Tecla para pausar (espacio o p)
      if (key === ' ' || key === 'p') {
        e.preventDefault();
        togglePause();
        return;
      }
      
      // Tecla para pista (h)
      if (key === 'h') {
        useHint();
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.selectedCell, gameState.isPaused, gameState.isComplete, gameState.inNotesMode, gameState.revealedSolution, settings.size, settings.allowNotes]);
  
  // Renderizado de celdas
  const renderCell = (row: number, col: number) => {
    const cell = gameState.board[row][col];
    const isSelected = gameState.selectedCell ? gameState.selectedCell[0] === row && gameState.selectedCell[1] === col : false;
    const selectedValue = gameState.selectedCell ? gameState.board[gameState.selectedCell[0]][gameState.selectedCell[1]].value : null;
    const isSameValue = settings.highlightSameNumbers && selectedValue !== null && cell.value === selectedValue && cell.value !== null;
    const isInSameRow = gameState.selectedCell ? gameState.selectedCell[0] === row : false;
    const isInSameCol = gameState.selectedCell ? gameState.selectedCell[1] === col : false;
    
    // Determinar coordenadas de la caja (box)
    const boxSize = settings.size === 9 ? 3 : settings.size === 6 ? 2 : 2;
    const boxRow = Math.floor(row / boxSize);
    const boxCol = Math.floor(col / boxSize);
    const selectedBoxRow = gameState.selectedCell ? Math.floor(gameState.selectedCell[0] / boxSize) : -1;
    const selectedBoxCol = gameState.selectedCell ? Math.floor(gameState.selectedCell[1] / boxSize) : -1;
    const isInSameBox = boxRow === selectedBoxRow && boxCol === selectedBoxCol;
    
    // Construir clases CSS
    let cellClassName = "relative flex items-center justify-center aspect-square text-lg md:text-xl font-medium transition-colors duration-150";
    
    // Bordes
    const isTopEdge = row % boxSize === 0 && row > 0;
    const isLeftEdge = col % boxSize === 0 && col > 0;
    const isRightEdge = (col + 1) % boxSize === 0 && col < settings.size - 1;
    const isBottomEdge = (row + 1) % boxSize === 0 && row < settings.size - 1;
    
    // Aplicar bordes para formar las cajas
    cellClassName += " border border-gray-300 dark:border-gray-600";
    if (isTopEdge) cellClassName += " border-t-2 border-t-gray-400 dark:border-t-gray-500";
    if (isLeftEdge) cellClassName += " border-l-2 border-l-gray-400 dark:border-l-gray-500";
    if (isRightEdge) cellClassName += " border-r-2 border-r-gray-400 dark:border-r-gray-500";
    if (isBottomEdge) cellClassName += " border-b-2 border-b-gray-400 dark:border-b-gray-500";
    
    // Colores de fondo según el estado
    if (isSelected) {
      cellClassName += " bg-indigo-200 dark:bg-indigo-900 z-10";
    } else if (isSameValue) {
      cellClassName += " bg-indigo-100 dark:bg-indigo-900/40";
    } else if (isInSameRow || isInSameCol || isInSameBox) {
      cellClassName += " bg-gray-100 dark:bg-gray-800/70";
    } else {
      cellClassName += " bg-white dark:bg-gray-800";
    }
    
    // Valores dados vs. ingresados por el usuario
    if (cell.isGiven) {
      cellClassName += " text-black dark:text-white font-bold";
    } else if (cell.value !== null) {
      // Solo mostrar errores en nivel fácil y si showMistakes está activado
      if (cell.isError && settings.showMistakes && settings.difficulty === 'easy') {
        cellClassName += " text-red-600 dark:text-red-400";
      } else {
        cellClassName += " text-blue-600 dark:text-blue-400";
      }
    }
    
    // Celdas de solución revelada
    if (gameState.revealedSolution && !cell.isGiven) {
      cellClassName += " text-orange-600 dark:text-orange-400";
    }
    
    // Desactivar interacción cuando el juego está pausado, completo o se reveló la solución
    if (gameState.isPaused || gameState.isComplete || gameState.revealedSolution) {
      cellClassName += " pointer-events-none";
    }
    
    return (
      <button
        key={`cell-${row}-${col}`}
        className={cellClassName}
        onClick={() => selectCell(row, col)}
        disabled={cell.isGiven && gameState.board[row][col].value !== null}
        aria-label={`Celda en fila ${row + 1}, columna ${col + 1}${cell.value ? `, valor ${cell.value}` : ''}`}
      >
        {cell.value ? (
          <span>{cell.value}</span>
        ) : cell.userNotes.length > 0 ? (
          <div className={`grid ${ settings.size === 4 ? 'grid-cols-2' : settings.size === 6 ? 'grid-cols-3' : 'grid-cols-3' } gap-0.5 w-full h-full p-0.5`}>
            {Array.from({ length: settings.size }).map((_, i) => (
              <div key={`note-${i+1}`} className="flex items-center justify-center">
                {cell.userNotes.includes(i + 1) && (
                  <span className={`text-[0.5rem] md:text-xs text-gray-500 dark:text-gray-400`}>
                    {i + 1}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : null}
        
        {isSelected && gameState.inNotesMode && settings.allowNotes && (
          <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
        )}
      </button>
    );
  };
  
  // Renderizar teclado numérico
  const renderNumberPad = () => {
    return (
      <div className={`grid ${settings.size <= 5 ? 'grid-cols-' + settings.size : 'grid-cols-5'} gap-2 mt-4`}
           style={{ gridTemplateColumns: `repeat(${Math.min(5, settings.size)}, 1fr)` }}>
        {Array.from({ length: settings.size }).map((_, i) => (
          <button
            key={`numpad-${i+1}`}
            className={`p-3 rounded-lg font-bold text-lg ${
              gameState.inNotesMode 
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' 
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
            } hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors`}
            onClick={() => placeNumber(i + 1)}
            disabled={gameState.isPaused || gameState.isComplete || gameState.revealedSolution}
          >
            {i + 1}
          </button>
        ))}
      </div>
    );
  };
  
  // Renderizar controles del juego
  const renderControls = () => {
    return (
      <div className="flex flex-wrap justify-center gap-2 mt-4">
        <button
          className="p-3 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          onClick={clearCell}
          disabled={gameState.isPaused || gameState.isComplete || gameState.revealedSolution || !gameState.selectedCell}
          aria-label="Borrar celda"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6.707 4.879A3 3 0 018.828 4H15a3 3 0 013 3v6a3 3 0 01-3 3H8.828a3 3 0 01-2.12-.879l-4.415-4.414a1 1 0 010-1.414l4.414-4.414zm4 2.414a1 1 0 00-1.414 1.414L10.586 10l-1.293 1.293a1 1 0 101.414 1.414L12 11.414l1.293 1.293a1 1 0 001.414-1.414L13.414 10l1.293-1.293a1 1 0 00-1.414-1.414L12 8.586l-1.293-1.293z" clipRule="evenodd" />
          </svg>
        </button>
        
        {settings.allowNotes && (
          <button
            className={`p-3 rounded-lg ${
              gameState.inNotesMode 
                ? 'bg-indigo-600 text-white dark:bg-indigo-500' 
                : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white'
            } hover:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors`}
            onClick={toggleNotesMode}
            disabled={gameState.isPaused || gameState.isComplete || gameState.revealedSolution}
            aria-label={`${gameState.inNotesMode ? 'Desactivar' : 'Activar'} modo de notas`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        
        {/* Botón de Pista */}
        <button
          className="p-3 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          onClick={useHint}
          disabled={
            gameState.isPaused || 
            gameState.isComplete || 
            gameState.revealedSolution ||
            !gameState.selectedCell || 
            gameState.board[gameState.selectedCell[0]]?.[gameState.selectedCell[1]]?.isGiven ||
            (gameState.selectedCell && gameState.board[gameState.selectedCell[0]][gameState.selectedCell[1]].value === gameState.solution[gameState.selectedCell[0]][gameState.selectedCell[1]])
          }
          aria-label="Usar pista"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        
        {/* Botón Revelar Solución */}
        <button
          className="p-3 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors"
          onClick={revealSolution}
          disabled={gameState.isPaused || gameState.isComplete || gameState.revealedSolution}
          aria-label="Revelar solución"
        >
          <Lightbulb className="h-5 w-5" />
        </button>
        
        {/* Botón de Pausar/Reanudar */}
        <button
          className="p-3 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          onClick={togglePause}
          disabled={gameState.isComplete || gameState.revealedSolution}
          aria-label={gameState.isPaused ? "Reanudar juego" : "Pausar juego"}
        >
          {gameState.isPaused ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        {/* Botón Nuevo Juego */}
        <button
          className="p-3 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          onClick={startNewGame}
          aria-label="Nuevo juego"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
        
        {/* Botón Ayuda */}
        <button
          className="p-3 rounded-lg bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          onClick={() => setShowTutorial(true)}
          aria-label="Mostrar ayuda"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>
    );
  };
  
  // Renderizar tablero
  const renderBoard = () => {
    return (
      <div 
        ref={boardRef}
        className="aspect-square max-w-md mx-auto border-2 border-gray-500 dark:border-gray-500 bg-white dark:bg-gray-800 shadow-lg rounded-sm overflow-hidden relative"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${settings.size}, 1fr)` // Asegura el número correcto de columnas
        }}
      >
        {gameState.board.map((row, rowIndex) => 
          row.map((_, colIndex) => renderCell(rowIndex, colIndex))
        )}
        
        {/* Overlay de pausa */}
        {gameState.isPaused && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-20">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Juego en pausa</h2>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                onClick={togglePause}
              >
                Continuar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  // Renderizar modal de victoria
  const renderVictoryModal = () => {
    if (!showVictoryModal) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-30 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full text-center shadow-xl"
        >
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
            {gameState.revealedSolution ? "Juego Finalizado" : "¡Felicidades!"}
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            {gameState.revealedSolution 
              ? "Has revelado la solución del Sudoku."
              : `Has completado el Sudoku ${settings.size}x${settings.size} en dificultad ${settings.difficulty}.`
            }
          </p>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tiempo</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{formatTime(elapsedTime)}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
              <p className="text-sm text-gray-500 dark:text-gray-400">Errores</p>
              <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{gameState.mistakes}</p>
            </div>
            {gameState.hintsUsed > 0 && (
              <div className="col-span-2 bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                <p className="text-sm text-gray-500 dark:text-gray-400">Pistas usadas</p>
                <p className="text-lg font-bold text-gray-800 dark:text-gray-200">{gameState.hintsUsed}</p>
              </div>
            )}
            {gameState.revealedSolution && (
              <div className="col-span-2 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 p-3 rounded-md">
                <p className="font-medium">Se reveló la solución completa</p>
              </div>
            )}
          </div>
          
          {/* Información de racha y dificultad adaptativa */}
          {settings.adaptiveDifficulty && !gameState.revealedSolution && (
            <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 p-3 rounded-md mb-6">
              <p className="font-medium">
                Racha actual: {stats.consecutiveCorrectGames}/{CORRECT_STREAK_THRESHOLD} para subir de nivel
              </p>
            </div>
          )}
          
          {/* Mejor tiempo */}
          {!gameState.revealedSolution && stats.bestTimes[`${settings.difficulty}${settings.size}x${settings.size}` as keyof typeof stats.bestTimes] === elapsedTime && (
            <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-3 rounded-md mb-6">
              <p className="font-medium">¡Nuevo récord de tiempo!</p>
            </div>
          )}
          
          {/* Comprobación para dificultad adaptativa */}
          {settings.adaptiveDifficulty && stats.consecutiveCorrectGames >= CORRECT_STREAK_THRESHOLD && !gameState.revealedSolution && settings.difficulty !== 'expert' && (
            <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 p-3 rounded-md mb-6">
              <p className="font-medium">
                ¡Has alcanzado {stats.consecutiveCorrectGames} juegos correctos seguidos! La dificultad aumentará en el próximo juego.
              </p>
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
              onClick={() => setShowVictoryModal(false)}
            >
              Cerrar
            </button>
            <button
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              onClick={startNewGame}
            >
              Nuevo juego
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };
  
  // Renderizar tutorial
  const renderTutorial = () => {
    if (!showTutorial) return null;
    
    const tutorialSteps = [
      {
        title: "Bienvenido al Sudoku",
        content: "El objetivo del juego es completar todas las celdas con números del 1 al " + settings.size + " de manera que cada fila, columna y región contenga todos los números exactamente una vez."
      },
      {
        title: "Cómo jugar",
        content: "Haz clic en una celda vacía y luego presiona un número en el teclado o usa el teclado numérico en pantalla para colocar un número."
      },
      {
        title: "Notas",
        content: "Activa el modo de notas para anotar posibles números candidatos en una celda. Esto te ayuda a recordar qué números podrían ir en cada celda."
      },
      {
        title: "Controles",
        content: `
          • Flechas: Navegar por el tablero
          • Números 1-${settings.size}: Colocar un número
          • Borrar/Retroceso: Eliminar número
          • N: Activar/desactivar modo de notas
          • Espacio/P: Pausar/reanudar
          • H: Usar pista
        `
      },
      {
        title: "Funciones Adicionales",
        content: `
          • Pista: Revela el número correcto en la celda seleccionada
          • Revelar Solución: Muestra la solución completa del tablero
          • Dificultad Adaptativa: El nivel aumenta automáticamente después de completar ${CORRECT_STREAK_THRESHOLD} sudokus correctamente
        `
      },
      {
        title: "Consejos",
        content: "Busca celdas que sólo puedan contener un número específico. Analiza filas, columnas y regiones simultáneamente para encontrar restricciones."
      }
    ];
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-30 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl"
        >
          <h2 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
            {tutorialSteps[tutorialStep - 1].title}
          </h2>
          <div className="text-gray-700 dark:text-gray-300 mb-6 text-sm whitespace-pre-line">
            {tutorialSteps[tutorialStep - 1].content}
          </div>
          
          <div className="flex justify-between items-center">
            <button
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
              onClick={() => setTutorialStep(prev => Math.max(1, prev - 1))}
              disabled={tutorialStep === 1}
            >
              Anterior
            </button>
            
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {tutorialStep} / {tutorialSteps.length}
            </div>
            
            {tutorialStep < tutorialSteps.length ? (
              <button
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                onClick={() => setTutorialStep(prev => Math.min(tutorialSteps.length, prev + 1))}
              >
                Siguiente
              </button>
            ) : (
              <button
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
                onClick={() => {
                  setShowTutorial(false);
                  setTutorialStep(1);
                }}
              >
                Cerrar
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    );
  };
  
  return (
    <div className="max-w-md mx-auto p-4 relative min-h-[32rem]">
      {/* Barra superior */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-bold">
          Sudoku {settings.size}x{settings.size} {/* Muestra tamaño del tablero */}
        </div>
        
        <div className="flex items-center space-x-4">
          {settings.timerEnabled && (
            <div className="text-sm font-medium bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-md">
              {formatTime(elapsedTime)}
            </div>
          )}
          
          <div className="text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">{settings.difficulty}</span>
          </div>
        </div>
      </div>
      
      {/* Estadísticas del juego */}
      <div className="flex justify-between mb-4 text-xs text-gray-600 dark:text-gray-400">
        <div>
          {settings.showMistakes && (
            <span>Errores: <span className="font-medium text-red-600 dark:text-red-400">{gameState.mistakes}</span></span>
          )}
        </div>
        
        <div>
          Pistas: <span className="font-medium">{gameState.hintsUsed}</span>
        </div>
      </div>
      
      {/* Racha actual si dificultad adaptativa está activada */}
      {settings.adaptiveDifficulty && (
        <div className="mb-4 text-xs text-center text-gray-600 dark:text-gray-400">
          Racha: <span className="font-medium">{stats.consecutiveCorrectGames}</span>/{CORRECT_STREAK_THRESHOLD}
        </div>
      )}
      
      {/* Tablero */}
      <div className="relative">
        {renderBoard()}
      </div>
      
      {/* Teclado numérico */}
      {renderNumberPad()}
      
      {/* Controles */}
      {renderControls()}
      
      {/* Modal de victoria */}
      {renderVictoryModal()}
      
      {/* Tutorial */}
      {renderTutorial()}
    </div>
  );
};

// --- Módulo Completo ---
export const SudokuModule: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  
  return (
    <div className="container mx-auto py-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Sudoku</h1>
        <button
          onClick={() => setShowSettings(prev => !prev)}
          className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          {showSettings ? "Volver al juego" : "Configuración"}
        </button>
      </div>
      
      {showSettings ? <SudokuSettings /> : <SudokuGame />}
    </div>
  );
};