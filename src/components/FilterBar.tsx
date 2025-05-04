import React, { useState } from 'react';
import { Star, EyeOff, Filter, X, AlertTriangle, ArrowDownAZ } from 'lucide-react';

interface FilterBarProps {
  showFavoritesOnly: boolean;
  showHiddenModules: boolean;
  setShowFavoritesOnly: (show: boolean) => void;
  setShowHiddenModules: (show: boolean) => void;
  onResetFilters: () => void;
}

const FilterBar: React.FC<FilterBarProps> = ({
  showFavoritesOnly,
  showHiddenModules,
  setShowFavoritesOnly,
  setShowHiddenModules,
  onResetFilters
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const anyFilterActive = showFavoritesOnly || showHiddenModules;
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`flex items-center space-x-1 px-3 py-2 rounded-lg border ${
          anyFilterActive || isExpanded
            ? 'bg-indigo-50 text-indigo-700 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
        aria-expanded={isExpanded}
        aria-haspopup="true"
      >
        <Filter className="w-4 h-4" />
        <span>Filter</span>
        {anyFilterActive && (
          <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white">
            {(showFavoritesOnly ? 1 : 0) + (showHiddenModules ? 1 : 0)}
          </span>
        )}
      </button>
      
      {isExpanded && (
        <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Filter Modules
              </h3>
              {anyFilterActive && (
                <button
                  onClick={onResetFilters}
                  className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                >
                  Reset
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="flex items-center justify-between space-x-2 cursor-pointer">
                <span className="text-sm flex items-center text-gray-700 dark:text-gray-300">
                  <Star className={`w-4 h-4 mr-1.5 ${showFavoritesOnly ? 'text-yellow-500 fill-yellow-500' : ''}`} />
                  Favorites Only
                </span>
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
              
              <label className="flex items-center justify-between space-x-2 cursor-pointer">
                <span className="text-sm flex items-center text-gray-700 dark:text-gray-300">
                  <EyeOff className="w-4 h-4 mr-1.5" />
                  Show Hidden Modules
                </span>
                <input
                  type="checkbox"
                  checked={showHiddenModules}
                  onChange={() => setShowHiddenModules(!showHiddenModules)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>
            
            {!anyFilterActive && (
              <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <AlertTriangle className="w-3 h-3 mr-1" />
                No filters currently active
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;