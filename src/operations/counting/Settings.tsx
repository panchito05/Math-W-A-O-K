import React, { useState, useEffect } from 'react';
import { Settings } from './types';

// Default settings with Spanish as default
const DEFAULT_SETTINGS: Settings = {
  maximumNumber: 10,
  objectSet: 'animals',
  audioEnabled: true,
  language: 'spanish',
  progressiveMode: true,
  countingStyle: 'tap',
  rewardFrequency: 5
};

const objectSets = [
  { id: 'animals', name: { english: 'Animals', spanish: 'Animales' } },
  { id: 'fruits', name: { english: 'Fruits', spanish: 'Frutas' } },
  { id: 'stars', name: { english: 'Stars', spanish: 'Estrellas' } },
  { id: 'shapes', name: { english: 'Shapes', spanish: 'Formas' } }
];

export const CountingSettings: React.FC = () => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('counting_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem('counting_settings', JSON.stringify(settings));
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      setSettings(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'maximumNumber') {
      const numValue = parseInt(value, 10);
      setSettings(prev => ({ 
        ...prev, 
        maximumNumber: Math.max(5, Math.min(50, numValue || DEFAULT_SETTINGS.maximumNumber))
      }));
    } else {
      setSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-center">
        {settings.language === 'english' ? 'Counting Settings' : 'Configuración de Conteo'}
      </h2>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Maximum Number' : 'Número Máximo'}
          </label>
          <input
            type="range"
            name="maximumNumber"
            min="5"
            max="50"
            value={settings.maximumNumber}
            onChange={handleChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span>5</span>
            <span>20</span>
            <span>35</span>
            <span>50</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            {settings.language === 'english' 
              ? `Current maximum: ${settings.maximumNumber}` 
              : `Máximo actual: ${settings.maximumNumber}`
            }
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Object Set' : 'Tipo de Objetos'}
          </label>
          <select
            name="objectSet"
            value={settings.objectSet}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            {objectSets.map(set => (
              <option key={set.id} value={set.id}>
                {settings.language === 'english' ? set.name.english : set.name.spanish}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Counting Style' : 'Estilo de Conteo'}
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="countingStyle"
                value="tap"
                checked={settings.countingStyle === 'tap'}
                onChange={handleChange}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="text-gray-700 dark:text-gray-300">
                {settings.language === 'english' ? 'Tap to Count' : 'Tocar para Contar'}
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="countingStyle"
                value="sequence"
                checked={settings.countingStyle === 'sequence'}
                onChange={handleChange}
                className="mr-2 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
              />
              <span className="text-gray-700 dark:text-gray-300">
                {settings.language === 'english' ? 'Count in Sequence' : 'Contar en Secuencia'}
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="progressiveMode"
            name="progressiveMode"
            checked={settings.progressiveMode}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label htmlFor="progressiveMode" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            {settings.language === 'english' 
              ? 'Progressive Mode (gradually increase numbers)' 
              : 'Modo Progresivo (aumentar números gradualmente)'}
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
            {settings.language === 'english' ? 'Enable Audio' : 'Habilitar Audio'}
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="english">English</option>
            <option value="spanish">Español</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {settings.language === 'english' ? 'Reward Frequency' : 'Frecuencia de Recompensas'}
          </label>
          <select
            name="rewardFrequency"
            value={settings.rewardFrequency.toString()}
            onChange={(e) => setSettings(prev => ({ ...prev, rewardFrequency: parseInt(e.target.value, 10) }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="1">{settings.language === 'english' ? 'Every Number' : 'Cada Número'}</option>
            <option value="5">{settings.language === 'english' ? 'Every 5 Numbers' : 'Cada 5 Números'}</option>
            <option value="10">{settings.language === 'english' ? 'Every 10 Numbers' : 'Cada 10 Números'}</option>
            <option value="0">{settings.language === 'english' ? 'Disabled' : 'Desactivado'}</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CountingSettings;