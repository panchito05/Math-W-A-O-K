export interface ObjectSet {
  name: string;
  objects: string[]; // Array of image URLs
  colors: string[];
}

export interface Problem {
  currentNumber: number;
  objectSet: ObjectSet;
}

export interface UserAnswer {
  problem: Problem;
  isCorrect: boolean;
  timeSpent: number;
}

export interface Settings {
  maximumNumber: number;
  objectSet: string; // Name of the object set
  audioEnabled: boolean;
  language: 'english' | 'spanish';
  progressiveMode: boolean; // If true, gradually increase the count
  countingStyle: 'tap' | 'sequence'; // Tap objects or count in sequence
  rewardFrequency: number; // How often to show rewards (every N numbers)
}