import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { KeyboardEvent } from 'react';

// Constants
const KeyboardKeys = {
  SPACE: ' ',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End'
};

// Custom hook to handle keyboard accessibility for drag and drop
export function useAccessibleDnd<T>({
  items,
  onReorder,
  itemIdGetter
}: {
  items: T[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  itemIdGetter: (item: T) => string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const itemRefs = useRef<Map<string, HTMLElement>>(new Map());
  
  // Register an item's DOM node
  const registerItem = (id: string, element: HTMLElement | null) => {
    if (element) {
      itemRefs.current.set(id, element);
    } else {
      itemRefs.current.delete(id);
    }
  };
  
  // Start dragging with keyboard
  const startDrag = (id: string, index: number) => {
    setActiveId(id);
    setActiveIndex(index);
    
    // Announce to screen readers
    const announcer = document.getElementById('dnd-announcer');
    if (announcer) {
      announcer.textContent = `Grabbed item. Use arrow keys to move, Space to drop, Escape to cancel.`;
    }
  };
  
  // End dragging with keyboard
  const endDrag = (cancelled = false) => {
    // Announce to screen readers
    const announcer = document.getElementById('dnd-announcer');
    if (announcer) {
      announcer.textContent = cancelled 
        ? `Movement canceled.` 
        : `Item dropped.`;
    }
    
    setActiveId(null);
    setActiveIndex(null);
  };
  
  // Move an item using keyboard
  const moveItem = (direction: 'up' | 'down' | 'left' | 'right' | 'start' | 'end') => {
    if (activeIndex === null) return;
    
    let targetIndex = activeIndex;
    const maxIndex = items.length - 1;
    
    switch (direction) {
      case 'up':
      case 'left':
        targetIndex = Math.max(0, activeIndex - 1);
        break;
      case 'down':
      case 'right':
        targetIndex = Math.min(maxIndex, activeIndex + 1);
        break;
      case 'start':
        targetIndex = 0;
        break;
      case 'end':
        targetIndex = maxIndex;
        break;
    }
    
    if (targetIndex !== activeIndex) {
      onReorder(activeIndex, targetIndex);
      setActiveIndex(targetIndex);
      
      // Announce the move to screen readers
      const announcer = document.getElementById('dnd-announcer');
      if (announcer) {
        announcer.textContent = `Moved to position ${targetIndex + 1} of ${items.length}`;
      }
    }
  };
  
  // Handle keyboard interaction
  const handleKeyDown = (e: KeyboardEvent, id: string, index: number) => {
    // If we're not already dragging, begin drag on Space or Enter
    if (activeId === null) {
      if (e.key === KeyboardKeys.SPACE || e.key === KeyboardKeys.ENTER) {
        e.preventDefault();
        startDrag(id, index);
      }
      return;
    }
    
    // We're already dragging
    switch (e.key) {
      case KeyboardKeys.ESCAPE:
        e.preventDefault();
        endDrag(true);
        break;
      case KeyboardKeys.SPACE:
      case KeyboardKeys.ENTER:
        e.preventDefault();
        endDrag();
        break;
      case KeyboardKeys.ARROW_UP:
        e.preventDefault();
        moveItem('up');
        break;
      case KeyboardKeys.ARROW_DOWN:
        e.preventDefault();
        moveItem('down');
        break;
      case KeyboardKeys.ARROW_LEFT:
        e.preventDefault();
        moveItem('left');
        break;
      case KeyboardKeys.ARROW_RIGHT:
        e.preventDefault();
        moveItem('right');
        break;
      case KeyboardKeys.HOME:
        e.preventDefault();
        moveItem('start');
        break;
      case KeyboardKeys.END:
        e.preventDefault();
        moveItem('end');
        break;
    }
  };
  
  // When component mounts, add the screen reader announcer element if it doesn't exist
  useEffect(() => {
    if (!document.getElementById('dnd-announcer')) {
      const announcer = document.createElement('div');
      announcer.id = 'dnd-announcer';
      announcer.className = 'sr-only';
      announcer.setAttribute('aria-live', 'assertive');
      announcer.setAttribute('role', 'status');
      document.body.appendChild(announcer);
      
      return () => {
        document.body.removeChild(announcer);
      };
    }
  }, []);
  
  return {
    activeId,
    registerItem,
    handleKeyDown
  };
}

// Accessibility wrapper for drag and drop items
export const AccessibleDragItem = <T,>({
  item,
  index,
  children,
  onKeyDown,
  itemId
}: {
  item: T;
  index: number;
  children: React.ReactNode;
  onKeyDown: (e: KeyboardEvent, id: string, index: number) => void;
  itemId: string;
}) => {
  return (
    <div
      role="listitem"
      aria-roledescription="draggable item"
      tabIndex={0}
      aria-label={`Draggable item ${index + 1} of ${itemId}. Press Space or Enter to start dragging, then use arrow keys to move, Space to drop, or Escape to cancel.`}
      onKeyDown={(e) => onKeyDown(e, itemId, index)}
    >
      {children}
    </div>
  );
};