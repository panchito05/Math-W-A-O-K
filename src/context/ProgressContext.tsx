import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

export interface OperationProgress {
  operationId: string;
  totalCompleted: number;
  correctAnswers: number;
  averageTime: number;
  lastPracticed: string;
  difficultyLevel: number;
  history: {
    date: string;
    score: number;
    difficulty: number;
  }[];
}

export interface UserProgress {
  userId: string;
  operations: Record<string, OperationProgress>;
  streakDays: number;
  lastActive: string;
}

interface ProgressContextType {
  progress: UserProgress | null;
  updateOperationProgress: (operationId: string, results: {
    correct: boolean;
    timeSpent: number;
    difficulty: number;
  }) => void;
  exportProgress: () => string;
  resetProgress: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = (): ProgressContextType => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

// Debounce function to reduce frequent localStorage writes
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    const context = this;
    
    const later = function() {
      timeoutId = null;
      func.apply(context, args);
    };
    
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(later, wait);
  };
}

export const ProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const pendingUpdateRef = useRef<UserProgress | null>(null);

  // Create debounced save function that persists across renders
  const debouncedSave = useCallback(
    debounce((userId: string, progressData: UserProgress) => {
      localStorage.setItem(`mathProgress_${userId}`, JSON.stringify(progressData));
    }, 300), // 300ms debounce
    []
  );

  useEffect(() => {
    if (user) {
      // Load progress from localStorage on mount or user change
      const savedProgress = localStorage.getItem(`mathProgress_${user.id}`);
      if (savedProgress) {
        try {
          setProgress(JSON.parse(savedProgress));
        } catch (e) {
          console.error('Error parsing progress data:', e);
        }
      } else {
        // Initialize empty progress for new user
        const newProgress: UserProgress = {
          userId: user.id,
          operations: {},
          streakDays: 0,
          lastActive: new Date().toISOString().split('T')[0]
        };
        setProgress(newProgress);
        localStorage.setItem(`mathProgress_${user.id}`, JSON.stringify(newProgress));
      }
    } else {
      setProgress(null);
    }
  }, [user]);

  // Flush any pending updates when component unmounts
  useEffect(() => {
    return () => {
      if (user && pendingUpdateRef.current) {
        localStorage.setItem(
          `mathProgress_${user.id}`, 
          JSON.stringify(pendingUpdateRef.current)
        );
      }
    };
  }, [user]);

  const updateOperationProgress = (
    operationId: string,
    results: { correct: boolean; timeSpent: number; difficulty: number; attempts?: number; revealed?: boolean }
  ): void => {
    if (!user || !progress) return;

    setProgress(prevProgress => {
      if (!prevProgress) return null;

      const today = new Date().toISOString().split('T')[0];
      const existingProgress = prevProgress.operations[operationId] || {
        operationId,
        totalCompleted: 0,
        correctAnswers: 0,
        averageTime: 0,
        lastPracticed: today,
        difficultyLevel: results.difficulty,
        history: []
      };

      const newTotalCompleted = existingProgress.totalCompleted + 1;
      const newCorrectAnswers = existingProgress.correctAnswers + (results.correct ? 1 : 0);
      
      // Calculate new average time
      const totalTime = existingProgress.averageTime * existingProgress.totalCompleted + results.timeSpent;
      const newAverageTime = totalTime / newTotalCompleted;

      // Update streak if it's a new day
      const lastActive = prevProgress.lastActive;
      let streakDays = prevProgress.streakDays;
      
      if (today !== lastActive) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];
        
        if (lastActive === yesterdayString) {
          streakDays += 1;
        } else if (today > lastActive) {
          streakDays = 1;
        }
      }

      // Create history entry
      const historyEntry = {
        date: today,
        score: results.correct ? 1 : 0,
        difficulty: results.difficulty
      };

      // Create updated operation progress
      const updatedOperationProgress: OperationProgress = {
        ...existingProgress,
        totalCompleted: newTotalCompleted,
        correctAnswers: newCorrectAnswers,
        averageTime: newAverageTime,
        lastPracticed: today,
        difficultyLevel: results.difficulty,
        history: [...existingProgress.history, historyEntry]
      };

      // Create updated overall progress
      const updatedProgress: UserProgress = {
        ...prevProgress,
        operations: {
          ...prevProgress.operations,
          [operationId]: updatedOperationProgress
        },
        streakDays,
        lastActive: today
      };

      // Store the latest update for potential flush on unmount
      pendingUpdateRef.current = updatedProgress;
      
      // Save to localStorage using debounced function
      debouncedSave(user.id, updatedProgress);
      
      return updatedProgress;
    });
  };

  const exportProgress = (): string => {
    if (!progress) return '';
    
    // Convert progress to CSV format
    const operationRows: string[] = [];
    
    Object.values(progress.operations).forEach(op => {
      operationRows.push(`"${op.operationId}",${op.totalCompleted},${op.correctAnswers},${(op.correctAnswers / op.totalCompleted * 100).toFixed(2)}%,${op.averageTime.toFixed(2)},${op.lastPracticed},${op.difficultyLevel}`);
    });
    
    const csv = [
      '"Operation","Total Completed","Correct Answers","Success Rate","Avg Time (s)","Last Practiced","Difficulty Level"',
      ...operationRows
    ].join('\n');
    
    return csv;
  };

  const resetProgress = (): void => {
    if (!user) return;
    
    const newProgress: UserProgress = {
      userId: user.id,
      operations: {},
      streakDays: 0,
      lastActive: new Date().toISOString().split('T')[0]
    };
    
    setProgress(newProgress);
    // Use direct localStorage update for important operations like reset
    localStorage.setItem(`mathProgress_${user.id}`, JSON.stringify(newProgress));
    pendingUpdateRef.current = null;
  };

  return (
    <ProgressContext.Provider value={{ 
      progress, 
      updateOperationProgress, 
      exportProgress,
      resetProgress 
    }}>
      {children}
    </ProgressContext.Provider>
  );
};