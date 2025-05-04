import React, { useState, useEffect } from 'react';
import { Settings } from './types';

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

export const AlphabetSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('alphabet_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('alphabet_settings', JSON.stringify(settings));
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setSettings(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'quizFrequency') {
      const numValue = parseInt(value, 10);
      setSettings(prev => ({ 
        ...prev, 
        quizFrequency: Math.max(0, numValue || DEFAULT_SETTINGS.quizFrequency)
      }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {settings.language === 'english' ? 'Alphabet Learning Settings' : 'Configuración de Aprendizaje del Alfabeto'}
      </h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Language' : 'Idioma'}
          </label>
          <select
            name="language"
            value={settings.language}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="english">English</option>
            <option value="spanish">Español</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Learning Mode' : 'Modo de Aprendizaje'}
          </label>
          <select
            name="learningMode"
            value={settings.learningMode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="explore">
              {settings.language === 'english' ? 'Explore (Free Navigation)' : 'Explorar (Navegación Libre)'}
            </option>
            <option value="guided">
              {settings.language === 'english' ? 'Guided (Step by Step)' : 'Guiado (Paso a Paso)'}
            </option>
            <option value="quiz">
              {settings.language === 'english' ? 'Quiz (Test Knowledge)' : 'Cuestionario (Evaluar Conocimiento)'}
            </option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Letter Style' : 'Estilo de Letra'}
          </label>
          <select
            name="letterStyle"
            value={settings.letterStyle}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="basic">
              {settings.language === 'english' ? 'Basic' : 'Básico'}
            </option>
            <option value="fancy">
              {settings.language === 'english' ? 'Fancy' : 'Decorativo'}
            </option>
            <option value="handwritten">
              {settings.language === 'english' ? 'Handwritten' : 'Manuscrito'}
            </option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Quiz Frequency' : 'Frecuencia de Cuestionarios'}
          </label>
          <select
            name="quizFrequency"
            value={settings.quizFrequency.toString()}
            onChange={(e) => setSettings(prev => ({ ...prev, quizFrequency: parseInt(e.target.value, 10) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="0">{settings.language === 'english' ? 'Disabled' : 'Desactivado'}</option>
            <option value="5">{settings.language === 'english' ? 'Every 5 Letters' : 'Cada 5 Letras'}</option>
            <option value="10">{settings.language === 'english' ? 'Every 10 Letters' : 'Cada 10 Letras'}</option>
            <option value="26">{settings.language === 'english' ? 'At the End' : 'Al Final'}</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="showLowercase"
            name="showLowercase"
            checked={settings.showLowercase}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="showLowercase" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {settings.language === 'english' 
              ? 'Show Lowercase Letters' 
              : 'Mostrar Letras Minúsculas'}
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="colorful"
            name="colorful"
            checked={settings.colorful}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="colorful" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {settings.language === 'english' 
              ? 'Use Colorful Letters' 
              : 'Usar Letras Coloridas'}
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="audioEnabled"
            name="audioEnabled"
            checked={settings.audioEnabled}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="audioEnabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {settings.language === 'english' 
              ? 'Enable Audio' 
              : 'Habilitar Audio'}
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="animationsEnabled"
            name="animationsEnabled"
            checked={settings.animationsEnabled}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="animationsEnabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {settings.language === 'english' 
              ? 'Enable Animations' 
              : 'Habilitar Animaciones'}
          </label>
        </div>
      </div>
    </div>
  );
};

export default AlphabetSettings;