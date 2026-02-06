// {{STORE_NAME}} Store
// {{DESCRIPTION}}

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface {{STORE_NAME}}State {
  // State properties
  isLoading: boolean;
  error: string | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initial{{STORE_NAME}}State = {
  isLoading: false,
  error: null,
};

export const use{{STORE_NAME}}Store = create<{{STORE_NAME}}State>()(
  devtools(
    persist(
      (set, get) => ({
        ...initial{{STORE_NAME}}State,

        setLoading: (isLoading) => set({ isLoading }),
        setError: (error) => set({ error }),
        reset: () => set(initial{{STORE_NAME}}State),
      }),
      {
        name: 'camper-planner-{{store_key}}',
        partialize: (state) => ({
          // Only persist relevant state
          // isLoading: false, // Don't persist loading states
          // error: null, // Don't persist errors
        }),
      }
    ),
    { name: '{{store_key}}-store' }
  )
);