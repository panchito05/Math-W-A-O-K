// Asegúrate de tener estas importaciones
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { X, Circle, Users, Bot, RotateCcw, RefreshCw, Settings as SettingsIcon, Trophy } from 'lucide-react';

// --- Tipos de datos ---
type SquareValue = 'X' | 'O' | null;
type GameMode = 'pvp' | 'pvc';
type FirstPlayer = 'human' | 'computer' | 'random';
type GameStatus = 'ongoing' | 'X wins' | 'O wins' | 'draw' | 'match over';

interface TicTacToeSettings {
  matchWinsNeeded: number;
  mode: GameMode;
  firstPlayer: FirstPlayer;
  aiDelay: number;
}

interface Scores {
  X: number;
  O: number;
}

// --- Constantes ---
const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

const DEFAULT_SETTINGS: TicTacToeSettings = {
  matchWinsNeeded: 3,
  mode: 'pvc',
  firstPlayer: 'random',
  aiDelay: 500,
};

// --- Funciones de Utilidad ---
function calculateWinner(squares: SquareValue[]): { winner: 'X' | 'O' | null; line: number[] | null; isDraw: boolean } {
    for (let i = 0; i < WINNING_LINES.length; i++) { const [a, b, c] = WINNING_LINES[i]; if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) { return { winner: squares[a], line: WINNING_LINES[i], isDraw: false }; } }
    const isDraw = squares.every(square => square !== null); return { winner: null, line: null, isDraw };
}
function getRandomInt(min: number, max: number): number { min = Math.ceil(min); max = Math.floor(max); return Math.floor(Math.random() * (max - min + 1)) + min; }

// --- Componente de Configuración ---
// (Incluido aquí para que sea un solo bloque de código)
interface SettingsProps { settings: TicTacToeSettings; onSettingsChange: (newSettings: Partial<TicTacToeSettings>) => void; onResetMatch: () => void; onClose: () => void; }
const TicTacToeSettingsComponent: React.FC<SettingsProps> = ({ settings, onSettingsChange, onResetMatch, onClose }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { const { name, value, type } = e.target; if (name === 'matchWinsNeeded' || name === 'aiDelay') { onSettingsChange({ [name]: parseInt(value, 10) || 0 }); } else { onSettingsChange({ [name]: value as any }); } };
    return ( <div className="relative max-w-md mx-auto p-6 pt-12 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"> <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" title="Cerrar Configuración" aria-label="Cerrar Configuración"> <X size={24} /> </button> <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200 flex items-center justify-center"> <SettingsIcon className="mr-2" size={22} /> Configuración </h2> <div className="space-y-5"> {/* Inputs */} <div><label htmlFor="matchWinsNeeded" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Victorias: <span className="font-semibold">{settings.matchWinsNeeded}</span></label><input type="range" id="matchWinsNeeded" name="matchWinsNeeded" min="1" max="10" value={settings.matchWinsNeeded} onChange={handleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 dark:focus:ring-offset-gray-800" /></div><div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Modo</label><div className="flex space-x-2"><button onClick={()=>onSettingsChange({mode:'pvp'})} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1 t ${settings.mode==='pvp'?'bg-violet-600 text-white shadow':'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300'}`}><Users size={16}/><span>PvP</span></button><button onClick={()=>onSettingsChange({mode:'pvc'})} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center space-x-1 t ${settings.mode==='pvc'?'bg-violet-600 text-white shadow':'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300'}`}><Bot size={16}/><span>PvC</span></button></div></div>{settings.mode==='pvc'&&(<div><label htmlFor="firstPlayer" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empieza (PvC)</label><select id="firstPlayer" name="firstPlayer" value={settings.firstPlayer} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"><option value="human">Humano</option><option value="computer">CPU</option><option value="random">Aleatorio</option></select></div>)}{settings.mode==='pvc'&&(<div><label htmlFor="aiDelay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Retraso IA (ms): <span className="font-semibold">{settings.aiDelay}</span></label><input type="range" id="aiDelay" name="aiDelay" min="0" max="2000" step="100" value={settings.aiDelay} onChange={handleChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 dark:focus:ring-offset-gray-800"/></div>)}<button onClick={()=>{onResetMatch();}} className="w-full mt-6 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-gray-800 text-sm flex items-center justify-center space-x-1 transition-colors"><RefreshCw size={16}/><span>Reiniciar Partida</span></button> </div> </div> );
};

// --- Componente Square ---
// (Incluido aquí)
interface SquareProps { value: SquareValue; onClick: () => void; isWinning: boolean; disabled: boolean; }
const Square: React.FC<SquareProps> = ({ value, onClick, isWinning, disabled }) => { const squareVariants = { hidden: { scale: 0.8, opacity: 0 }, visible: { scale: 1, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }, }; return ( <motion.button className={`w-20 h-20 md:w-24 md:h-24 border border-gray-400 dark:border-gray-600 flex items-center justify-center text-4xl md:text-5xl font-bold focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-md transition-colors duration-200 ${isWinning ? 'bg-green-300 dark:bg-green-700' : 'bg-white dark:bg-gray-800'} ${disabled ? 'cursor-not-allowed opacity-70' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`} onClick={onClick} disabled={disabled || value !== null} aria-label={`Casilla ${value ? `contiene ${value}` : 'vacía'}`} layout > <AnimatePresence mode="wait"> {value === 'X' && ( <motion.div key="X" variants={squareVariants} initial="hidden" animate="visible" exit="hidden" className="text-blue-500"> <X size={48} strokeWidth={3} /> </motion.div> )} {value === 'O' && ( <motion.div key="O" variants={squareVariants} initial="hidden" animate="visible" exit="hidden" className="text-red-500"> <Circle size={48} strokeWidth={3} /> </motion.div> )} </AnimatePresence> </motion.button> ); };

// --- Componente Board ---
// (Incluido aquí)
interface BoardProps { squares: SquareValue[]; onClick: (i: number) => void; winningLine: number[] | null; disabled: boolean; }
const Board: React.FC<BoardProps> = ({ squares, onClick, winningLine, disabled }) => { const renderSquare = (i: number) => { const isWinning = winningLine ? winningLine.includes(i) : false; return ( <Square key={i} value={squares[i]} onClick={() => onClick(i)} isWinning={isWinning} disabled={disabled} /> ); }; return ( <div className="grid grid-cols-3 gap-1 bg-gray-400 dark:bg-gray-600 p-1 rounded-lg shadow-md"> {squares.map((_, i) => renderSquare(i))} </div> ); };

// --- Componente Modal ---
// (Incluido aquí)
interface ModalProps { isOpen: boolean; onClose: () => void; title: string; message: string; children?: React.ReactNode; }
const ResultModal: React.FC<ModalProps> = ({ isOpen, onClose, title, message, children }) => { if (!isOpen) return null; return ( <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose} > <motion.div initial={{ scale: 0.9, y: -20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }} className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full text-center shadow-xl" onClick={(e) => e.stopPropagation()} > <h2 className="text-2xl font-bold text-violet-600 dark:text-violet-400 mb-3">{title}</h2> <p className="text-gray-700 dark:text-gray-300 mb-5">{message}</p> {children} <button onClick={onClose} className="mt-4 w-full px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800" > Cerrar </button> </motion.div> </motion.div> ); };


// --- Componente Principal del Juego ---
export const TicTacToeGame: React.FC = () => {
  // --- State ---
  const [settings, setSettings] = useState<TicTacToeSettings>(() => { try { const saved = localStorage.getItem('ticTacToeSettings'); return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS; } catch (e) { console.error("Failed to parse settings from localStorage", e); return DEFAULT_SETTINGS; } });
  const [board, setBoard] = useState<SquareValue[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState<boolean>(true);
  const [scores, setScores] = useState<Scores>({ X: 0, O: 0 });
  const [currentGameNumber, setCurrentGameNumber] = useState<number>(1);
  const [gameStatus, setGameStatus] = useState<GameStatus>('ongoing');
  const [matchWinner, setMatchWinner] = useState<'X' | 'O' | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [isAIMoving, setIsAIMoving] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(false);

  // Refs
  const isAIMovingRef = useRef(isAIMoving);
  const gameEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update ref
  useEffect(() => { isAIMovingRef.current = isAIMoving; }, [isAIMoving]);

  // --- Effects --- (Definidos con useCallback para estabilidad)
   const determineFirstPlayerForGame = useCallback((firstPlayerSetting: FirstPlayer, mode: GameMode) => { let startsX = true; if (mode === 'pvc') { if (firstPlayerSetting === 'computer') { startsX = false; } else if (firstPlayerSetting === 'random') { startsX = Math.random() < 0.5; } } setXIsNext(startsX); }, []);
   const aiMove = useCallback(() => { if (gameStatus !== 'ongoing' || xIsNext || settings.mode !== 'pvc') { setIsAIMoving(false); return; } const availableSquares = board.map((v, i) => (v === null ? i : null)).filter((v): v is number => v !== null); if (availableSquares.length === 0) { setIsAIMoving(false); return; } const aiPlayer = 'O', humanPlayer = 'X'; let bestMove = -1; for(const i of availableSquares){ const b = board.slice(); b[i]=aiPlayer; if(calculateWinner(b).winner===aiPlayer){bestMove=i; break;}} if(bestMove===-1)for(const i of availableSquares){ const b = board.slice(); b[i]=humanPlayer; if(calculateWinner(b).winner===humanPlayer){bestMove=i; break;}} if(bestMove===-1 && availableSquares.includes(4)) bestMove=4; if(bestMove===-1){ const c=[0,2,6,8].filter(i=>availableSquares.includes(i)); if(c.length>0) bestMove=c[getRandomInt(0,c.length-1)];} if(bestMove===-1){ const s=[1,3,5,7].filter(i=>availableSquares.includes(i)); if(s.length>0) bestMove=s[getRandomInt(0,s.length-1)];} if(bestMove===-1) bestMove=availableSquares[getRandomInt(0,availableSquares.length-1)]; if (bestMove !== -1) { const newBoard = board.slice(); newBoard[bestMove] = aiPlayer; setBoard(newBoard); const { winner, line, isDraw } = calculateWinner(newBoard); if (winner) { setWinningLine(line); setGameStatus('O wins'); } else if (isDraw) { setGameStatus('draw'); } else { setXIsNext(true); } } setIsAIMoving(false); }, [board, gameStatus, xIsNext, settings.mode]);
   const startNewGame = useCallback(() => { if (gameEndTimeoutRef.current) { clearTimeout(gameEndTimeoutRef.current); gameEndTimeoutRef.current = null; } setBoard(Array(9).fill(null)); setWinningLine(null); setShowResultModal(false); const nextPlayerIsX = !xIsNext; setXIsNext(nextPlayerIsX); setGameStatus('ongoing'); setCurrentGameNumber(prev => prev + 1); toast.info(`Iniciando Juego ${currentGameNumber + 1}`); }, [xIsNext, currentGameNumber]);

   useEffect(() => { determineFirstPlayerForGame(settings.firstPlayer, settings.mode); }, [determineFirstPlayerForGame, settings.firstPlayer, settings.mode]);
   useEffect(() => { localStorage.setItem('ticTacToeSettings', JSON.stringify(settings)); }, [settings]);
   useEffect(() => { if (settings.mode === 'pvc' && !xIsNext && gameStatus === 'ongoing' && !isAIMovingRef.current) { setIsAIMoving(true); const delay = Math.max(settings.aiDelay, 50); const timeoutId = setTimeout(() => { if (settings.mode === 'pvc' && !xIsNext && gameStatus === 'ongoing') { aiMove(); } else { setIsAIMoving(false); } }, delay); return () => clearTimeout(timeoutId); } }, [xIsNext, gameStatus, settings.mode, settings.aiDelay, aiMove]);
   useEffect(() => { if (gameStatus === 'ongoing' || gameStatus === 'match over') return; if (gameEndTimeoutRef.current) { clearTimeout(gameEndTimeoutRef.current); gameEndTimeoutRef.current = null; } let title = ''; let message = ''; let matchOver = false; let newScores = { ...scores }; if (gameStatus === 'X wins') { title = '¡Ganador!'; message = 'Jugador X ganó.'; newScores.X++; } else if (gameStatus === 'O wins') { title = '¡Ganador!'; message = `Jugador O ${settings.mode === 'pvc' ? '(CPU) ' : ''}ganó.`; newScores.O++; } else if (gameStatus === 'draw') { title = '¡Empate!'; message = 'Juego empatado.'; } setScores(newScores); if (newScores.X >= settings.matchWinsNeeded) { setMatchWinner('X'); title = '¡Partida Terminada!'; message = `X ganó la partida ${newScores.X} a ${newScores.O}!`; setGameStatus('match over'); matchOver = true; } else if (newScores.O >= settings.matchWinsNeeded) { setMatchWinner('O'); title = '¡Partida Terminada!'; message = `O ${settings.mode === 'pvc' ? '(CPU) ' : ''}ganó la partida ${newScores.O} a ${newScores.X}!`; setGameStatus('match over'); matchOver = true; } setModalContent({ title, message }); setShowResultModal(true); if (!matchOver) { gameEndTimeoutRef.current = setTimeout(() => { startNewGame(); }, 2500); } return () => { if (gameEndTimeoutRef.current) { clearTimeout(gameEndTimeoutRef.current); } }; }, [gameStatus, settings.matchWinsNeeded, settings.mode, scores, startNewGame]);

  // --- Game Control Functions --- (useCallback)
  const handleClick = useCallback((i: number) => { if (board[i] || gameStatus !== 'ongoing' || (settings.mode === 'pvc' && (!xIsNext || isAIMovingRef.current))) { return; } const newBoard = board.slice(); newBoard[i] = xIsNext ? 'X' : 'O'; setBoard(newBoard); const { winner, line, isDraw } = calculateWinner(newBoard); if (winner) { setWinningLine(line); setGameStatus(winner === 'X' ? 'X wins' : 'O wins'); } else if (isDraw) { setGameStatus('draw'); } else { setXIsNext(!xIsNext); } }, [board, gameStatus, settings.mode, xIsNext]);
  const startNewMatch = useCallback(() => { if (gameEndTimeoutRef.current) { clearTimeout(gameEndTimeoutRef.current); gameEndTimeoutRef.current = null; } setScores({ X: 0, O: 0 }); setMatchWinner(null); setCurrentGameNumber(1); setBoard(Array(9).fill(null)); setWinningLine(null); setShowResultModal(false); setShowSettingsPanel(false); determineFirstPlayerForGame(settings.firstPlayer, settings.mode); setGameStatus('ongoing'); toast.success("¡Nueva Partida Iniciada!"); }, [settings, determineFirstPlayerForGame]);

  // --- Settings Handling --- (useCallback)
  const handleSettingsChange = useCallback((newSettings: Partial<TicTacToeSettings>) => { setSettings(prevSettings => ({ ...prevSettings, ...newSettings })); toast.info("Configuración actualizada."); }, []);

  // --- UI Rendering ---
  let statusText; if (gameStatus === 'match over') { statusText = `¡Partida Terminada! Ganador: ${matchWinner}`; } else if (gameStatus === 'X wins') { statusText = "Ganador: Jugador X"; } else if (gameStatus === 'O wins') { statusText = `Ganador: Jugador O ${settings.mode === 'pvc' ? '(CPU)' : ''}`; } else if (gameStatus === 'draw') { statusText = "¡Es un Empate!"; } else if (isAIMoving) { statusText = "Turno de la CPU (O)..."; } else { statusText = `Siguiente Jugador: ${xIsNext ? 'X' : 'O'}${settings.mode === 'pvc' && !xIsNext ? " (CPU)" : ""}`; }
  const isBoardDisabled = gameStatus !== 'ongoing' || (settings.mode === 'pvc' && isAIMoving);

  return (
    <div className="relative min-h-screen bg-gray-100 dark:bg-gray-900 p-4 flex flex-col items-center font-sans">

      {/* Botón Settings (Absoluto, Texto) */}
      {!showSettingsPanel && (
          <motion.button
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
            onClick={() => setShowSettingsPanel(true)}
            className="absolute top-4 right-4 z-10 px-4 py-2 rounded-md bg-violet-600 text-white hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 dark:bg-violet-700 dark:hover:bg-violet-800 dark:focus:ring-offset-gray-900 transition-colors shadow-md text-sm font-medium"
            title="Abrir Configuración" aria-label="Abrir Configuración"
          >
           Settings
          </motion.button>
      )}

      {/* Contenido Principal Centrado */}
      <div className="w-full max-w-md flex flex-col items-center mt-8"> {/* Added mt-8 for spacing below absolute button */}

          {/* Título Principal */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">
            Tic Tac Toe
          </h1>

          {/* Área Dinámica: Juego o Configuración */}
          <AnimatePresence mode="wait">
            {showSettingsPanel ? (
              <motion.div key="settings-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="w-full">
                <TicTacToeSettingsComponent settings={settings} onSettingsChange={handleSettingsChange} onResetMatch={startNewMatch} onClose={() => setShowSettingsPanel(false)} />
              </motion.div>
            ) : (
              <motion.div key="game-view" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="flex flex-col items-center w-full">
                 <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 text-center"> Partida a {settings.matchWinsNeeded} {settings.matchWinsNeeded === 1 ? 'victoria' : 'victorias'} | Juego {currentGameNumber} </div>
                <div className="mb-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-md w-full text-center min-h-[48px] flex items-center justify-center"> <p className="text-lg font-semibold text-violet-700 dark:text-violet-300">{statusText}</p> </div>
                <div className="mb-5"> <Board squares={board} onClick={handleClick} winningLine={winningLine} disabled={isBoardDisabled} /> </div>
                <div className="flex justify-around w-full max-w-xs mb-5 text-center"> <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg shadow w-28"> <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Jugador X</p> <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{scores.X}</p> </div> <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg shadow w-28"> <p className="text-sm font-medium text-red-800 dark:text-red-200">Jugador O {settings.mode === 'pvc' ? '(CPU)' : ''}</p> <p className="text-2xl font-bold text-red-600 dark:text-red-400">{scores.O}</p> </div> </div>
                <div className="flex justify-center space-x-4"> <button onClick={startNewMatch} className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-900 flex items-center space-x-1.5 shadow transition-colors" title="Reiniciar Partida Completa"> <RefreshCw size={18}/> <span>Nueva Partida</span> </button> </div>
              </motion.div>
            )}
          </AnimatePresence>
      </div>

      {/* Modal Resultados */}
      <ResultModal isOpen={showResultModal} onClose={() => { setShowResultModal(false); if (gameStatus !== 'match over' && gameEndTimeoutRef.current) { clearTimeout(gameEndTimeoutRef.current); gameEndTimeoutRef.current = null; } }} title={modalContent.title} message={modalContent.message} >
         {gameStatus === 'match over' && ( <button onClick={() => { setShowResultModal(false); startNewMatch(); }} className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:focus:ring-offset-gray-800 flex items-center justify-center space-x-1"> <Trophy size={18}/> <span>Jugar Otra Partida</span> </button> )}
      </ResultModal>

    </div>
  );
};

// --- RECORDATORIO IMPORTANTE ---
// Instala: npm install react framer-motion sonner lucide-react (o yarn add ...)
// Configura Tailwind CSS.
// Usa <Toaster /> en tu App.tsx o index.tsx:
// import { Toaster } from 'sonner';
// function App() { return (<> <TicTacToeGame /> <Toaster richColors /> </>); }
// --- FIN RECORDATORIO ---