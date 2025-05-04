import React, { useState, useEffect } from 'react';
import { Settings } from './types';
import { getDifficultyLevels } from './utils';

// Default settings
const DEFAULT_SETTINGS: Settings = {
  difficulty: 1,
  problemCount: 10,
  timeLimit: 0,
  maxAttempts: 3,
  adaptiveDifficulty: true,
  enableCompensation: false,
  autoContinue: true,
  language: 'spanish',  // Default to Spanish
  showStepsImmediately: false,
  useDecimals: false,
  operatorsToInclude: {
    addition: true,
    subtraction: true,
    multiplication: true,
    division: true,
    exponents: true,
    parentheses: true,
    roots: false
  }
};

export const CombinedOperationsSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('combinedoperations_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  
  const difficultyLevels = getDifficultyLevels();

  useEffect(() => {
    localStorage.setItem('combinedoperations_settings', JSON.stringify(settings));
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const isChecked = (e.target as HTMLInputElement).checked;
      
      if (name.startsWith('operator_')) {
        const operator = name.replace('operator_', '');
        setSettings(prev => ({
          ...prev,
          operatorsToInclude: {
            ...prev.operatorsToInclude,
            [operator]: isChecked
          }
        }));
      } else {
        setSettings(prev => ({ ...prev, [name]: isChecked }));
      }
    } else if (name === 'difficulty') {
      const difficultyValue = parseInt(value, 10) as 1 | 2 | 3 | 4 | 5;
      
      // Update operators based on the selected difficulty
      const level = difficultyLevels.find(level => level.level === difficultyValue);
      if (level) {
        const newOperators = {
          addition: level.allowedOperators.includes('+'),
          subtraction: level.allowedOperators.includes('-'),
          multiplication: level.allowedOperators.includes('×'),
          division: level.allowedOperators.includes('÷'),
          exponents: level.allowedOperators.includes('^'),
          parentheses: level.allowedOperators.includes('( )'),
          roots: level.allowedOperators.includes('√')
        };
        
        setSettings(prev => ({
          ...prev,
          difficulty: difficultyValue,
          operatorsToInclude: newOperators,
          useDecimals: level.canUseDecimals
        }));
      }
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
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {settings.language === 'english' 
          ? 'Combined Operations Settings' 
          : 'Configuración de Operaciones Combinadas'}
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
            max="5"
            value={settings.difficulty}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {settings.language === 'english' 
              ? difficultyLevels.find(level => level.level === settings.difficulty)?.description.english 
              : difficultyLevels.find(level => level.level === settings.difficulty)?.description.spanish}
          </p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-medium text-blue-700 dark:text-blue-300 mb-3 flex items-center">
            {settings.language === 'english' ? 'Examples:' : 'Ejemplos:'}
          </h3>
          <div className="space-y-2">
            {difficultyLevels
              .find(level => level.level === settings.difficulty)
              ?.examples.map((example, index) => (
                <div 
                  key={index} 
                  className="px-3 py-2 bg-white dark:bg-gray-800 rounded-md shadow-sm text-center"
                >
                  <code className="font-mono text-blue-600 dark:text-blue-300">{example}</code>
                </div>
              ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Operators to Include' : 'Operadores a Incluir'}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="operator_addition"
                name="operator_addition"
                checked={settings.operatorsToInclude.addition}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="operator_addition" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                {settings.language === 'english' ? 'Addition (+)' : 'Suma (+)'}
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="operator_subtraction"
                name="operator_subtraction"
                checked={settings.operatorsToInclude.subtraction}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="operator_subtraction" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                {settings.language === 'english' ? 'Subtraction (-)' : 'Resta (-)'}
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="operator_multiplication"
                name="operator_multiplication"
                checked={settings.operatorsToInclude.multiplication}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="operator_multiplication" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                {settings.language === 'english' ? 'Multiplication (×)' : 'Multiplicación (×)'}
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="operator_division"
                name="operator_division"
                checked={settings.operatorsToInclude.division}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="operator_division" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                {settings.language === 'english' ? 'Division (÷)' : 'División (÷)'}
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="operator_exponents"
                name="operator_exponents"
                checked={settings.operatorsToInclude.exponents}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={settings.difficulty < 3}
              />
              <label htmlFor="operator_exponents" className={`ml-2 block text-sm ${settings.difficulty < 3 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                {settings.language === 'english' ? 'Exponents (^)' : 'Exponentes (^)'}
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="operator_parentheses"
                name="operator_parentheses"
                checked={settings.operatorsToInclude.parentheses}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={settings.difficulty < 3}
              />
              <label htmlFor="operator_parentheses" className={`ml-2 block text-sm ${settings.difficulty < 3 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                {settings.language === 'english' ? 'Parentheses ( )' : 'Paréntesis ( )'}
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="operator_roots"
                name="operator_roots"
                checked={settings.operatorsToInclude.roots}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                disabled={settings.difficulty < 5}
              />
              <label htmlFor="operator_roots" className={`ml-2 block text-sm ${settings.difficulty < 5 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
                {settings.language === 'english' ? 'Square Roots (√)' : 'Raíces Cuadradas (√)'}
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
            {settings.language === 'english' ? 'Enable Adaptive Difficulty' : 'Habilitar Dificultad Adaptativa'}
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
            {settings.language === 'english' ? 'Enable Compensation (Add 1 problem for each incorrect/revealed)' : 'Habilitar Compensación (Añadir 1 problema por cada incorrecto/revelado)'}
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
            {settings.language === 'english' ? 'Auto-Continue (Automatically advance after correct answer)' : 'Auto-Continuar (Avanzar automáticamente después de una respuesta correcta)'}
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="showStepsImmediately"
            name="showStepsImmediately"
            checked={settings.showStepsImmediately}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="showStepsImmediately" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {settings.language === 'english' ? 'Show Steps Immediately' : 'Mostrar Pasos Inmediatamente'}
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="useDecimals"
            name="useDecimals"
            checked={settings.useDecimals}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            disabled={settings.difficulty < 4}
          />
          <label htmlFor="useDecimals" className={`ml-2 block text-sm ${settings.difficulty < 4 ? 'text-gray-400 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}`}>
            {settings.language === 'english' ? 'Include Decimal Numbers' : 'Incluir Números Decimales'}
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
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="english">English</option>
            <option value="spanish">Español</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CombinedOperationsSettings;