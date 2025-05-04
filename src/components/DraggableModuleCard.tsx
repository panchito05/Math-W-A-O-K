import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useDrag, useDrop } from 'react-dnd';
import { motion } from 'framer-motion';
import { Star, GripVertical } from 'lucide-react';
import { OperationCardProps } from '../store/moduleStore';

// Define the item type for drag and drop
const ITEM_TYPE = 'MODULE_CARD';

interface DraggableModuleCardProps {
  module: OperationCardProps;
  index: number;
  moveModule: (dragIndex: number, hoverIndex: number) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  isHidden?: boolean;
  onVisibilityChange?: (id: string, isVisible: boolean) => void;
}

export const DraggableModuleCard: React.FC<DraggableModuleCardProps> = ({ 
  module, 
  index, 
  moveModule,
  isFavorite = false,
  onToggleFavorite,
  isHidden = false,
  onVisibilityChange
}) => {
  const ref = useRef<HTMLDivElement>(null);
  
  // Define drag functionality
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { index, id: module.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Define drop functionality
  const [, drop] = useDrop({
    accept: ITEM_TYPE,
    hover(item: { index: number, id: string }, monitor) {
      if (!ref.current) {
        return;
      }
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }
      
      // Determine rectangle on screen
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      
      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      
      // Get pixels to the top
      const hoverClientY = clientOffset?.y ? clientOffset.y - hoverBoundingRect.top : 0;
      
      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%
      
      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      
      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      
      // Time to actually perform the action
      moveModule(dragIndex, hoverIndex);
      
      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  // Combine drag and drop refs
  drag(drop(ref));
  
  // Apply styles for dragging state
  const opacity = isDragging ? 0.5 : 1;
  const cursor = 'grab';
  
  // Animation for the card
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        delay: index * 0.05
      }
    }
  };

  // Handle toggle switch change
  const handleToggleVisibility = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (onVisibilityChange) {
      onVisibilityChange(module.id, e.target.checked);
    }
  };

  return (
    <motion.div 
      ref={ref}
      variants={cardVariants}
      style={{ opacity, cursor }}
      className={`
        group relative bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden 
        transition-shadow duration-300 hover:shadow-lg border border-gray-200 dark:border-gray-700
        ${isHidden ? 'opacity-60' : ''}
        ${isDragging ? 'ring-2 ring-blue-500 shadow-lg' : ''}
      `}
      data-handler-id={module.id}
    >
      {/* Drag handle and controls */}
      <div className="absolute top-2 right-2 flex space-x-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        {onToggleFavorite && (
          <button
            onClick={() => onToggleFavorite(module.id)}
            className={`p-1.5 rounded-full ${isFavorite 
              ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/50 dark:text-yellow-400' 
              : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            } hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors`}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
        )}
        
        {/* Toggle switch for visibility */}
        <div className="bg-gray-100 dark:bg-gray-700 p-1.5 rounded-full flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={!isHidden}
              onChange={handleToggleVisibility}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[0px] after:start-[0px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-500"></div>
            <span className="sr-only">{isHidden ? "Enable module" : "Disable module"}</span>
          </label>
        </div>

        <div className="p-1.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-grab">
          <GripVertical className="h-4 w-4" />
        </div>
      </div>
      
      <Link to={`/operation/${module.id}`} className={isHidden ? 'pointer-events-none' : ''}>
        <div className={`${module.color} p-4 flex justify-center`}>
          {module.icon}
        </div>
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {module.title}
            {isFavorite && (
              <Star className="h-4 w-4 inline-block ml-2 text-yellow-500 fill-current" />
            )}
          </h3>
          <p className="text-gray-600 dark:text-gray-300">{module.description}</p>
        </div>
      </Link>
    </motion.div>
  );
};

export default DraggableModuleCard;