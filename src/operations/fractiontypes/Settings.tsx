import React, { useState, useEffect } from 'react';
import { Settings } from './types';

// Default settings
const DEFAULT_SETTINGS: Settings = {
  difficulty: 1,
  problemCount: 10,
  timeLimit: 0,
  maxAttempts: 2,
  adaptiveDifficulty: true,
  autoContinue: true,
  language: 'english',
  problemTypes: ['identify', 'true-false', 'matching', 'write']
};

export const FractionTypesSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('fractiontypes_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('fractiontypes_settings', JSON.stringify(settings));
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'problemType') {
        // Handle problem type checkboxes
        const problemType = value as 'identify' | 'true-false' | 'matching' | 'write';
        setSettings(prev => {
          // Add or remove the problem type
          const newProblemTypes = checked 
            ? [...prev.problemTypes, problemType]
            : prev.problemTypes.filter(t => t !== problemType);
            
          // Ensure at least one problem type is selected
          return {
            ...prev,
            problemTypes: newProblemTypes.length > 0 ? newProblemTypes : prev.problemTypes
          };
        });
      } else {
        // Handle other checkboxes
        setSettings(prev => ({ ...prev, [name]: checked }));
      }
    } else if (name === 'difficulty') {
      const numValue = parseInt(value, 10);
      setSettings(prev => ({ ...prev, difficulty: Math.max(1, Math.min(3, numValue)) as 1 | 2 | 3 }));
    } else if (name === 'problemCount' || name === 'timeLimit' || name === 'maxAttempts') {
      const numValue = parseInt(value, 10);
      setSettings(prev => ({ 
        ...prev, 
        [name]: name === 'problemCount' 
          ? Math.max(1, numValue) 
          : Math.max(0, numValue) 
      }));
    } else if (name === 'language') {
      setSettings(prev => ({ ...prev, language: value as 'english' | 'spanish' }));
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {settings.language === 'english' ? 'Fraction Types Settings' : 'Configuración de Tipos de Fracciones'}
      </h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Difficulty Level' : 'Nivel de Dificultad'} ({settings.difficulty})
          </label>
          <input
            type="range"
            name="difficulty"
            min="1"
            max="3"
            value={settings.difficulty}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>{settings.language === 'english' ? 'Basic' : 'Básico'}</span>
            <span>{settings.language === 'english' ? 'Intermediate' : 'Intermedio'}</span>
            <span>{settings.language === 'english' ? 'Advanced' : 'Avanzado'}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Problem Types' : 'Tipos de Problemas'}
          </label>
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="identify"
                name="problemType"
                value="identify"
                checked={settings.problemTypes.includes('identify')}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={settings.problemTypes.length === 1 && settings.problemTypes.includes('identify')}
              />
              <label htmlFor="identify" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                {settings.language === 'english' ? 'Identification Questions' : 'Preguntas de Identificación'}
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="true-false"
                name="problemType"
                value="true-false"
                checked={settings.problemTypes.includes('true-false')}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={settings.problemTypes.length === 1 && settings.problemTypes.includes('true-false')}
              />
              <label htmlFor="true-false" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                {settings.language === 'english' ? 'True/False Questions' : 'Preguntas de Verdadero/Falso'}
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="matching"
                name="problemType"
                value="matching"
                checked={settings.problemTypes.includes('matching')}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={settings.problemTypes.length === 1 && settings.problemTypes.includes('matching')}
              />
              <label htmlFor="matching" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                {settings.language === 'english' ? 'Matching Exercises' : 'Ejercicios de Relacionar'}
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="write"
                name="problemType"
                value="write"
                checked={settings.problemTypes.includes('write')}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={settings.problemTypes.length === 1 && settings.problemTypes.includes('write')}
              />
              <label htmlFor="write" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                {settings.language === 'english' ? 'Writing Exercises' : 'Ejercicios de Escritura'}
              </label>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Number of Problems' : 'Número de Problemas'}
          </label>
          <input
            type="number"
            name="problemCount"
            min="1"
            value={settings.problemCount}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Time Limit (seconds, 0 for no limit)' : 'Límite de Tiempo (segundos, 0 para sin límite)'}
          </label>
          <input
            type="number"
            name="timeLimit"
            min="0"
            value={settings.timeLimit}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Max Attempts per Problem (0 for unlimited)' : 'Máximo de Intentos por Problema (0 para ilimitado)'}
          </label>
          <input
            type="number"
            name="maxAttempts"
            min="0"
            value={settings.maxAttempts}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          />
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
            {settings.language === 'english' 
              ? 'Enable Adaptive Difficulty' 
              : 'Habilitar Dificultad Adaptativa'}
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoContinue"
            name="autoContinue"
            checked={settings.autoContinue}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="autoContinue" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {settings.language === 'english' 
              ? 'Auto-Continue (Automatically advance after correct answer)' 
              : 'Auto-Continuar (Avanzar automáticamente después de una respuesta correcta)'}
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Language' : 'Idioma'}
          </label>
          <select
            name="language"
            value={settings.language}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="english">{settings.language === 'english' ? 'English' : 'Inglés'}</option>
            <option value="spanish">{settings.language === 'english' ? 'Spanish' : 'Español'}</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FractionTypesSettings;