export interface LetterObject {
  letter: string; // The letter (uppercase)
  lowercase: string; // Lowercase version
  image: string; // URL of an image that starts with this letter
  word: {
    english: string;
    spanish: string;
  };
  color: string; // Color for visual representation
}

export interface Problem {
  currentLetter: LetterObject;
  index: number; // Position in alphabet (0-25)
}

export interface UserProgress {
  completedLetters: string[]; // Array of completed letter
  mastered: string[]; // Letters the child has mastered
}

export interface Settings {
  language: 'english' | 'spanish';
  showLowercase: boolean;
  audioEnabled: boolean;
  animationsEnabled: boolean;
  letterStyle: 'basic' | 'fancy' | 'handwritten';
  learningMode: 'explore' | 'guided' | 'quiz';
  quizFrequency: number; // How often to show quizzes (every N letters)
  colorful: boolean; // Use colorful letters
}