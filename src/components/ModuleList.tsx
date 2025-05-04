import React, { useState, useCallback, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, EyeOff, Filter, SortDesc, GripVertical } from 'lucide-react';

import DraggableModuleCard from './DraggableModuleCard';
import { useModuleStore, OperationCardProps } from '../store/moduleStore';

interface ModuleListProps {
  modules: OperationCardProps[];
  gridCols: 1 | 3 | 6 | 8;
  searchQuery?: string;
  onVisibleCountChange?: (count: number) => void;
}

// Debounce function to limit frequency of updates
function debounce<T extends (...args: any[]) => void>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(later, wait);
  };
}

export const ModuleList: React.FC<ModuleListProps> = ({ 
  modules, 
  gridCols, 
  searchQuery = '',
  onVisibleCountChange 
}) => {
  const { 
    moduleOrder, 
    updateCustomOrder, 
    addToFavorites, 
    removeFromFavorites,
    hideModule,
    showModule,
    resetOrder 
  } = useModuleStore();
  
  const [filteredModules, setFilteredModules] = useState<OperationCardProps[]>(modules);
  const [orderedModules, setOrderedModules] = useState<OperationCardProps[]>(modules);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showHiddenModules, setShowHiddenModules] = useState(false);
  
  // Calculate if any filter is active
  const anyFilterActive = showFavoritesOnly || showHiddenModules || moduleOrder.customOrder !== null;
  const isExpanded = showFilterPanel;
  
  // Apply search filter, favorite filter, and custom ordering to modules
  useEffect(() => {
    // Filter by search query
    let filtered = modules;
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = modules.filter(module => 
        module.title.toLowerCase().includes(query) || 
        module.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by hidden
    if (!showHiddenModules) {
      filtered = filtered.filter(module => 
        !moduleOrder.hiddenModules.includes(module.id)
      );
    }
    
    // Filter by favorites if needed
    if (showFavoritesOnly) {
      filtered = filtered.filter(module => 
        moduleOrder.favoriteModules.includes(module.id)
      );
    }
    
    setFilteredModules(filtered);
    
    // Then apply ordering
    let ordered = [...filtered];
    
    if (moduleOrder.customOrder && moduleOrder.customOrder.length > 0) {
      // Create a map for O(1) lookups by ID
      const moduleMap = new Map<string, OperationCardProps>();
      filtered.forEach(module => moduleMap.set(module.id, module));
      
      // Use the custom order, but only for modules that exist in the filtered set
      const customOrderedModules: OperationCardProps[] = [];
      moduleOrder.customOrder.forEach(id => {
        const module = moduleMap.get(id);
        if (module) {
          customOrderedModules.push(module);
          moduleMap.delete(id); // Remove from map to track handled modules
        }
      });
      
      // Add any remaining modules that weren't in the custom order
      moduleMap.forEach(module => customOrderedModules.push(module));
      
      ordered = customOrderedModules;
    } else {
      // Apply default sorting: favorites first, then alphabetical
      ordered.sort((a, b) => {
        // Favorites first
        const aIsFavorite = moduleOrder.favoriteModules.includes(a.id);
        const bIsFavorite = moduleOrder.favoriteModules.includes(b.id);
        if (aIsFavorite && !bIsFavorite) return -1;
        if (!aIsFavorite && bIsFavorite) return 1;
        
        // Then alphabetically
        return a.title.localeCompare(b.title);
      });
    }
    
    setOrderedModules(ordered);
    
    // Report the number of visible modules to the parent component
    if (onVisibleCountChange) {
      onVisibleCountChange(ordered.length);
    }
  }, [modules, searchQuery, moduleOrder, showFavoritesOnly, showHiddenModules, onVisibleCountChange]);
  
  // Update the order in the store when modules are reordered
  const saveModuleOrder = useCallback(debounce((modules: OperationCardProps[]) => {
    const newOrder = modules.map(module => module.id);
    updateCustomOrder(newOrder);
  }, 500), [updateCustomOrder]);
  
  // Handle module movement during drag and drop
  const moveModule = useCallback((dragIndex: number, hoverIndex: number) => {
    setOrderedModules(prevModules => {
      const newModules = [...prevModules];
      const [movedItem] = newModules.splice(dragIndex, 1);
      newModules.splice(hoverIndex, 0, movedItem);
      
      // Save the new order to persistent storage
      saveModuleOrder(newModules);
      
      return newModules;
    });
  }, [saveModuleOrder]);
  
  // Toggle favorite status
  const toggleFavorite = useCallback((id: string) => {
    if (moduleOrder.favoriteModules.includes(id)) {
      removeFromFavorites(id);
    } else {
      addToFavorites(id);
    }
  }, [moduleOrder.favoriteModules, addToFavorites, removeFromFavorites]);
  
  // Toggle module visibility
  const toggleVisibility = useCallback((id: string, isVisible: boolean) => {
    if (isVisible) {
      showModule(id);
    } else {
      hideModule(id);
    }
  }, [hideModule, showModule]);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  // Reset all sorting and filtering
  const handleResetOrder = () => {
    resetOrder();
    setShowFavoritesOnly(false);
    setShowHiddenModules(false);
  };
  
  return (
    <>
      {/* Filter Bar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Choose an Operation</h2>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
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
          </button>
          
          {(showFavoritesOnly || showHiddenModules || moduleOrder.customOrder !== null) && (
            <button
              onClick={handleResetOrder}
              className="p-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30 transition-colors"
              title="Reset all filtering and sorting"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
      
      {/* Filter Panel */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    showFavoritesOnly 
                      ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <Star size={16} className={showFavoritesOnly ? 'fill-yellow-500 text-yellow-500' : ''} />
                  Favorites Only
                </button>
                
                <button
                  onClick={() => setShowHiddenModules(!showHiddenModules)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    showHiddenModules 
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  <EyeOff size={16} />
                  Show Hidden Modules
                </button>
              </div>
              
              {!anyFilterActive && (
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  No filters currently active
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Module grid */}
      <DndProvider backend={HTML5Backend}>
        <motion.div 
          className={`grid grid-cols-1 ${
            gridCols === 1 ? 'lg:grid-cols-1' :
            gridCols === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' :
            gridCols === 6 ? 'sm:grid-cols-3 lg:grid-cols-6' :
            'sm:grid-cols-4 lg:grid-cols-8'
          } gap-6`}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {orderedModules.length > 0 ? (
            orderedModules.map((module, index) => (
              <DraggableModuleCard
                key={module.id}
                module={module}
                index={index}
                moveModule={moveModule}
                isFavorite={moduleOrder.favoriteModules.includes(module.id)}
                onToggleFavorite={toggleFavorite}
                isHidden={moduleOrder.hiddenModules.includes(module.id)}
                onVisibilityChange={toggleVisibility}
              />
            ))
          ) : (
            <div className="col-span-full py-8 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No modules match your search' : 'No modules available'}
            </div>
          )}
        </motion.div>
      </DndProvider>
    </>
  );
};

export default ModuleList;