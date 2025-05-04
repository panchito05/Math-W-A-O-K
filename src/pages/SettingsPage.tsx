import React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Volume2, VolumeX, Zap, BarChart, Monitor } from 'lucide-react';
import { useSettings, AppSettings } from '../context/SettingsContext';

const SettingsPage: React.FC = () => {
  const { settings, updateSettings } = useSettings();

  const handleThemeChange = (theme: AppSettings['theme']) => {
    updateSettings({ theme });
  };

  const handleToggleSound = () => {
    updateSettings({ soundEnabled: !settings.soundEnabled });
  };

  const handleToggleAnimations = () => {
    updateSettings({ animationsEnabled: !settings.animationsEnabled });
  };

  const handleToggleAdaptiveDifficulty = () => {
    updateSettings({ adaptiveDifficulty: !settings.adaptiveDifficulty });
  };

  const handleFontSizeChange = (fontSize: AppSettings['fontSize']) => {
    updateSettings({ fontSize });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-white">Application Settings</h1>

        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Display</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`flex items-center justify-center p-3 rounded-md ${
                      settings.theme === 'light' 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Sun className="h-5 w-5 mr-2" />
                    Light
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex items-center justify-center p-3 rounded-md ${
                      settings.theme === 'dark' 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Moon className="h-5 w-5 mr-2" />
                    Dark
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`flex items-center justify-center p-3 rounded-md ${
                      settings.theme === 'system' 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <Monitor className="h-5 w-5 mr-2" />
                    System
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Font Size
                </label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleFontSizeChange('small')}
                    className={`p-3 rounded-md ${
                      settings.fontSize === 'small' 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Small
                  </button>
                  <button
                    onClick={() => handleFontSizeChange('medium')}
                    className={`p-3 rounded-md ${
                      settings.fontSize === 'medium' 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => handleFontSizeChange('large')}
                    className={`p-3 rounded-md ${
                      settings.fontSize === 'large' 
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-700 dark:text-indigo-100' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Large
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Experience</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white">Sound Effects</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enable or disable sounds</p>
                </div>
                <button
                  onClick={handleToggleSound}
                  className={`p-2 rounded-md ${
                    settings.soundEnabled 
                      ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' 
                      : 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'
                  }`}
                >
                  {settings.soundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white">Animations</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Enable or disable animations</p>
                </div>
                <button
                  onClick={handleToggleAnimations}
                  className={`p-2 rounded-md ${
                    settings.animationsEnabled 
                      ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' 
                      : 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'
                  }`}
                >
                  <Zap className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Learning</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800 dark:text-white">Adaptive Difficulty</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Automatically adjust difficulty based on your performance
                  </p>
                </div>
                <button
                  onClick={handleToggleAdaptiveDifficulty}
                  className={`p-2 rounded-md ${
                    settings.adaptiveDifficulty 
                      ? 'bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100' 
                      : 'bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100'
                  }`}
                >
                  <BarChart className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SettingsPage;