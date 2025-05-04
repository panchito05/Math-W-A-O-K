import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OperationCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export interface ModuleOrder {
  favoriteModules: string[];
  hiddenModules: string[];
  customOrder: string[] | null;
}

interface ModuleStore {
  moduleOrder: ModuleOrder;
  setModuleOrder: (order: ModuleOrder) => void;
  updateCustomOrder: (ids: string[]) => void;
  addToFavorites: (id: string) => void;
  removeFromFavorites: (id: string) => void;
  hideModule: (id: string) => void;
  showModule: (id: string) => void;
  resetOrder: () => void;
}

const initialState: ModuleOrder = {
  favoriteModules: [],
  hiddenModules: [],
  customOrder: null
};

export const useModuleStore = create<ModuleStore>()(
  persist(
    (set) => ({
      moduleOrder: initialState,
      setModuleOrder: (order) => set({ moduleOrder: order }),
      updateCustomOrder: (ids) => set((state) => ({
        moduleOrder: {
          ...state.moduleOrder,
          customOrder: ids
        }
      })),
      addToFavorites: (id) => set((state) => ({
        moduleOrder: {
          ...state.moduleOrder,
          favoriteModules: [...state.moduleOrder.favoriteModules, id]
        }
      })),
      removeFromFavorites: (id) => set((state) => ({
        moduleOrder: {
          ...state.moduleOrder,
          favoriteModules: state.moduleOrder.favoriteModules.filter(moduleId => moduleId !== id)
        }
      })),
      hideModule: (id) => set((state) => ({
        moduleOrder: {
          ...state.moduleOrder,
          hiddenModules: [...state.moduleOrder.hiddenModules, id]
        }
      })),
      showModule: (id) => set((state) => ({
        moduleOrder: {
          ...state.moduleOrder,
          hiddenModules: state.moduleOrder.hiddenModules.filter(moduleId => moduleId !== id)
        }
      })),
      resetOrder: () => set({ moduleOrder: initialState })
    }),
    {
      name: 'module-order-storage', // name of the item in storage
    }
  )
);