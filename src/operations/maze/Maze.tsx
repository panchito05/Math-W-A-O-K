import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, Trophy, Eye, Settings } from 'lucide-react';
import { toast } from 'sonner';

// Types
type Cell = {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
  visited: boolean;
};
type Position = {
  x: number;
  y: number;
};

// Constants
const CELL_SIZE = 40;
const WALL_THICKNESS = 4;
const MAZE_SIZES = {
  small: { width: 10, height: 10 },
  medium: { width: 15, height: 15 },
  large: { width: 20, height: 20 }
};

// Utility Functions
function createEmptyMaze(width: number, height: number): Cell[][] {
  return Array(height).fill(null).map(() =>
    Array(width).fill(null).map(() => ({
      top: true,
      right: true,
      bottom: true,
      left: true,
      visited: false
    }))
  );
}

function generateMaze(width: number, height: number): Cell[][] {
  const maze = createEmptyMaze(width, height);
  const stack: Position[] = [];
  const start: Position = { x: 0, y: 0 };

  function isValid(x: number, y: number): boolean {
    return x >= 0 && x < width && y >= 0 && y < height;
  }

  function getUnvisitedNeighbors(pos: Position): Position[] {
    const neighbors: Position[] = [];
    const directions = [
      { x: 0, y: -1 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 }
    ];
    for (const dir of directions) {
      const newX = pos.x + dir.x;
      const newY = pos.y + dir.y;
      if (isValid(newX, newY) && !maze[newY][newX].visited) {
        neighbors.push({ x: newX, y: newY });
      }
    }
    return neighbors;
  }

  function removeWall(current: Position, next: Position) {
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    if (dx === 1) {
      maze[current.y][current.x].right = false;
      maze[next.y][next.x].left = false;
    } else if (dx === -1) {
      maze[current.y][current.x].left = false;
      maze[next.y][next.x].right = false;
    }
    if (dy === 1) {
      maze[current.y][current.x].bottom = false;
      maze[next.y][next.x].top = false;
    } else if (dy === -1) {
      maze[current.y][current.x].top = false;
      maze[next.y][next.x].bottom = false;
    }
  }

  maze[start.y][start.x].visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current);
    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      maze[next.y][next.x].visited = true;
      removeWall(current, next);
      stack.push(next);
    }
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      maze[y][x].visited = false;
    }
  }

  return maze;
}

// Components
const Cell: React.FC<{
  cell: Cell;
  size: number;
  isPlayer?: boolean;
  isEnd?: boolean;
  isVisited?: boolean;
  isSolution?: boolean;
}> = ({ cell, size, isPlayer, isEnd, isVisited, isSolution }) => {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {cell.top && (
        <div
          className="absolute top-0 left-0 right-0 bg-gray-800 dark:bg-gray-200"
          style={{ height: WALL_THICKNESS }}
        />
      )}
      {cell.right && (
        <div
          className="absolute top-0 right-0 bottom-0 bg-gray-800 dark:bg-gray-200"
          style={{ width: WALL_THICKNESS }}
        />
      )}
      {cell.bottom && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-gray-800 dark:bg-gray-200"
          style={{ height: WALL_THICKNESS }}
        />
      )}
      {cell.left && (
        <div
          className="absolute top-0 left-0 bottom-0 bg-gray-800 dark:bg-gray-200"
          style={{ width: WALL_THICKNESS }}
        />
      )}

      {isVisited && !isPlayer && (
        <div className="absolute inset-2 bg-indigo-400 dark:bg-indigo-300 rounded-full opacity-50"></div>
      )}

      {isSolution && (
        <div className="absolute inset-2 bg-yellow-400 dark:bg-yellow-300 rounded-full opacity-75"></div>
      )}

      {isPlayer && (
        <motion.div
          className="absolute inset-2 bg-blue-500 rounded-full z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
        />
      )}

      {isEnd && (
        <motion.div
          className="absolute inset-2 bg-green-500 rounded-full flex items-center justify-center z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
        >
          <Trophy className="w-5 h-5 text-white" />
        </motion.div>
      )}
    </div>
  );
};

const SettingsMenu: React.FC<{
  mazeSize: keyof typeof MAZE_SIZES;
  handleSizeChange: (size: keyof typeof MAZE_SIZES) => void;
  onClose: () => void;
}> = ({ mazeSize, handleSizeChange, onClose }) => {
  return (
    <div className="absolute top-12 right-4 bg-white dark:bg-gray-800 p-4 rounded-md shadow-md z-10">
      <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Tamaño del Laberinto</h2>
      <div className="flex flex-col gap-2">
        {(Object.keys(MAZE_SIZES) as Array<keyof typeof MAZE_SIZES>).map((size) => (
          <button
            key={size}
            onClick={() => handleSizeChange(size)}
            className={`px-4 py-2 rounded-md ${
              mazeSize === size
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {size.charAt(0).toUpperCase() + size.slice(1)}
          </button>
        ))}
      </div>
      <button
        onClick={onClose}
        className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Cerrar
      </button>
    </div>
  );
};

export const MazeGame: React.FC = () => {
  const [mazeSize, setMazeSize] = useState<keyof typeof MAZE_SIZES>('small');
  const [maze, setMaze] = useState<Cell[][]>([]);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [showContinueButton, setShowContinueButton] = useState(false);
  const [moves, setMoves] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [bestTimes, setBestTimes] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('maze_best_times');
    return saved ? JSON.parse(saved) : {};
  });
  const [visitedPositions, setVisitedPositions] = useState<Position[]>([{ x: 0, y: 0 }]);
  const [solutionPath, setSolutionPath] = useState<Position[]>([]);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const autoContinueTimerRef = useRef<NodeJS.Timeout | null>(null);
  const mazeRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const initializeMaze = useCallback(() => {
    const { width, height } = MAZE_SIZES[mazeSize];
    const newMaze = generateMaze(width, height);
    setMaze(newMaze);
    setPlayerPos({ x: 0, y: 0 });
    setIsComplete(false);
    setShowContinueButton(false);
    setMoves(0);
    setStartTime(Date.now());
    setVisitedPositions([{ x: 0, y: 0 }]);
    setSolutionPath([]);
  }, [mazeSize]);

  useEffect(() => {
    initializeMaze();
  }, [initializeMaze]);

  const canMoveTo = useCallback((newX: number, newY: number): boolean => {
    const { width, height } = MAZE_SIZES[mazeSize];
    if (newX < 0 || newX >= width || newY < 0 || newY >= height) return false;

    const dx = newX - playerPos.x;
    const dy = newY - playerPos.y;

    if (dx === 1) {
      return !maze[playerPos.y][playerPos.x].right && !maze[newY][newX].left;
    }
    if (dx === -1) {
      return !maze[playerPos.y][playerPos.x].left && !maze[newY][newX].right;
    }
    if (dy === 1) {
      return !maze[playerPos.y][playerPos.x].bottom && !maze[newY][newX].top;
    }
    if (dy === -1) {
      return !maze[playerPos.y][playerPos.x].top && !maze[newY][newX].bottom;
    }
    return false;
  }, [maze, mazeSize, playerPos]);

  const movePlayer = useCallback((newX: number, newY: number) => {
    if (canMoveTo(newX, newY)) {
      setPlayerPos({ x: newX, y: newY });
      setMoves(prev => prev + 1);

      setVisitedPositions(prev => [...prev, { x: newX, y: newY }]);

      const { width, height } = MAZE_SIZES[mazeSize];
      if (newX === width - 1 && newY === height - 1) {
        const timeSpent = (Date.now() - startTime) / 1000;
        setIsComplete(true);
        setShowContinueButton(true);

        const currentBest = bestTimes[mazeSize] || Infinity;
        if (timeSpent < currentBest) {
          const updatedBestTimes = { ...bestTimes, [mazeSize]: timeSpent };
          setBestTimes(updatedBestTimes);
          localStorage.setItem('maze_best_times', JSON.stringify(updatedBestTimes));
          toast.success(`🎉 ¡Nuevo récord! ${timeSpent.toFixed(1)} segundos`);
        } else {
          toast.success(`✅ ¡Completado en ${timeSpent.toFixed(1)} segundos!`);
        }
      }
    }
  }, [canMoveTo, mazeSize, playerPos, startTime, bestTimes]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isComplete || !maze.length) return;

    let newX = playerPos.x;
    let newY = playerPos.y;

    switch (e.key) {
      case 'ArrowUp':
        newY--;
        break;
      case 'ArrowRight':
        newX++;
        break;
      case 'ArrowDown':
        newY++;
        break;
      case 'ArrowLeft':
        newX--;
        break;
      default:
        return;
    }

    movePlayer(newX, newY);
  }, [movePlayer, playerPos, isComplete, maze]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isComplete || !maze.length) return;
    isDragging.current = true;
    handleMouseMove(e);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging.current || isComplete || !maze.length) return;

    const mazeElement = mazeRef.current;
    if (!mazeElement) return;

    const rect = mazeElement.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const cellX = Math.floor(clickX / CELL_SIZE);
    const cellY = Math.floor(clickY / CELL_SIZE);

    const path = findPath(playerPos, { x: cellX, y: cellY });
    if (path.length > 0) {
      path.forEach(({ x, y }) => {
        movePlayer(x, y);
      });
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const findPath = (start: Position, end: Position): Position[] => {
    const { width, height } = MAZE_SIZES[mazeSize];
    const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }];
    const visited: boolean[][] = Array(height).fill(false).map(() => Array(width).fill(false));
    visited[start.y][start.x] = true;

    while (queue.length > 0) {
      const { pos, path } = queue.shift()!;

      if (pos.x === end.x && pos.y === end.y) {
        return path;
      }

      const directions = [
        { x: 0, y: -1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: -1, y: 0 }
      ];

      for (const dir of directions) {
        const newX = pos.x + dir.x;
        const newY = pos.y + dir.y;
        if (newX >= 0 && newX < width && newY >= 0 && newY < height && !visited[newY][newX] && canMoveTo(newX, newY)) {
          visited[newY][newX] = true;
          queue.push({ pos: { x: newX, y: newY }, path: [...path, { x: newX, y: newY }] });
        }
      }
    }

    return [];
  };

  const showSolution = () => {
    const endPos = { x: MAZE_SIZES[mazeSize].width - 1, y: MAZE_SIZES[mazeSize].height - 1 };
    const path = findPath(playerPos, endPos);
    setSolutionPath(path);
    path.forEach(({ x, y }) => {
      movePlayer(x, y);
    });
  };

  const handleEnterReview = () => {
    if (visitedPositions.length === 0) return;
    setIsReviewMode(true);
    setReviewIndex(visitedPositions.length - 1);
    if (autoContinueTimerRef.current) clearTimeout(autoContinueTimerRef.current);
    autoContinueTimerRef.current = null;
  };

  const handleContinue = () => {
    initializeMaze();
    setShowContinueButton(false);
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleSizeChange = (size: keyof typeof MAZE_SIZES) => {
    setMazeSize(size);
    setIsSettingsOpen(false);
  };

  const mazeContainerStyle = {
    maxWidth: '100%',
    maxHeight: '100%',
    width: '100%',
    height: '100%',
    position: 'relative'
  };

  // Mejora: Soporte para pantalla táctil
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isComplete || !maze.length) return;
    isDragging.current = true;
    handleMouseMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging.current || isComplete || !maze.length) return;

    const mazeElement = mazeRef.current;
    if (!mazeElement) return;

    const rect = mazeElement.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const touchY = e.touches[0].clientY - rect.top;

    const cellX = Math.floor(touchX / CELL_SIZE);
    const cellY = Math.floor(touchY / CELL_SIZE);

    const path = findPath(playerPos, { x: cellX, y: cellY });
    if (path.length > 0) {
      path.forEach(({ x, y }) => {
        movePlayer(x, y);
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 relative">
      <button
        onClick={handleEnterReview}
        disabled={visitedPositions.length === 0}
        className="absolute top-4 left-4 bg-purple-500 text-white rounded-md px-4 py-2 hover:bg-purple-600 transition-colors"
        aria-label="Review Previous Maze"
        title="Review Previous Maze"
      >
        <Eye size={18} />
      </button>
      <button
        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
        className="absolute top-4 right-4 bg-purple-500 text-white rounded-md px-4 py-2 hover:bg-purple-600 transition-colors"
        aria-label="Settings"
        title="Settings"
      >
        <Settings size={18} />
      </button>
      {isSettingsOpen && (
        <SettingsMenu
          mazeSize={mazeSize}
          handleSizeChange={handleSizeChange}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Maze Game</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Usa flechas o haz clic y arrastra para moverte. ¡El camino se marca conforme avanzas!
        </p>
      </div>

      <div className="flex flex-col items-center gap-8">
        <div className="flex-grow flex items-center justify-center relative">
          <div
            ref={mazeRef}
            className="grid gap-0 cursor-pointer"
            style={{
              ...mazeContainerStyle,
              gridTemplateColumns: `repeat(${MAZE_SIZES[mazeSize].width}, ${CELL_SIZE}px)`,
              padding: WALL_THICKNESS
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            {maze.map((row, y) =>
              row.map((cell, x) => (
                <Cell
                  key={`${x}-${y}`}
                  cell={cell}
                  size={CELL_SIZE}
                  isPlayer={playerPos.x === x && playerPos.y === y}
                  isEnd={x === MAZE_SIZES[mazeSize].width - 1 && y === MAZE_SIZES[mazeSize].height - 1}
                  isVisited={visitedPositions.some(pos => pos.x === x && pos.y === y)}
                  isSolution={solutionPath.some(pos => pos.x === x && pos.y === y)}
                />
              ))
            )}
          </div>
          {showContinueButton && (
            <button
              onClick={handleContinue}
              className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Continuar
            </button>
          )}
        </div>

        <div className="md:w-64 w-full space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Controles</h2>
            <div className="grid grid-cols-3 gap-2 max-w-[150px] mx-auto">
              <div />
              <button
                onClick={() => {
                  if (!isComplete) {
                    movePlayer(playerPos.x, playerPos.y - 1);
                  }
                }}
                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
              <div />
              <button
                onClick={() => {
                  if (!isComplete) {
                    movePlayer(playerPos.x - 1, playerPos.y);
                  }
                }}
                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (!isComplete) {
                    movePlayer(playerPos.x, playerPos.y + 1);
                  }
                }}
                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (!isComplete) {
                    movePlayer(playerPos.x + 1, playerPos.y);
                  }
                }}
                className="p-2 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Estadísticas</h2>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-300">Movimientos: {moves}</p>
              <p className="text-gray-600 dark:text-gray-300">
                Mejor Tiempo: {bestTimes[mazeSize] ? `${bestTimes[mazeSize].toFixed(1)}s` : 'N/A'}
              </p>
            </div>
          </div>

          <button
            onClick={initializeMaze}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Nuevo Laberinto
          </button>

          <button
            onClick={showSolution}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            Mostrar Respuesta
          </button>
        </div>
      </div>
    </div>
  );
};
