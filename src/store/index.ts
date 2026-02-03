// Zustand State Management
// Global application state management

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { type TripData, type VehicleProfile, type Waypoint } from '../types';

// Re-export types for services that import from store
export type { TripData, VehicleProfile, Waypoint } from '../types';

// Map State Interface
interface MapState {
  center: [number, number];
  zoom: number;
  selectedWaypoint: string | null;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setSelectedWaypoint: (id: string | null) => void;
}

// Vehicle State Interface
interface VehicleState {
  profile: VehicleProfile | null;
  setProfile: (profile: VehicleProfile) => void;
  clearProfile: () => void;
}

// Undo/Redo Action Interface
interface WaypointAction {
  type: 'add' | 'remove' | 'update' | 'reorder' | 'clear';
  timestamp: number;
  data: any;
  previousState: Waypoint[];
}

// Route State Interface
interface RouteState {
  waypoints: Waypoint[];
  calculatedRoute: any | null;
  isOptimized: boolean;
  totalDistance: number;
  estimatedTime: number;

  // History for undo/redo
  history: WaypointAction[];
  historyIndex: number;
  maxHistorySize: number;

  // Core actions
  addWaypoint: (waypoint: Waypoint) => void;
  removeWaypoint: (id: string) => void;
  updateWaypoint: (id: string, updates: Partial<Waypoint>) => void;
  reorderWaypoints: (waypoints: Waypoint[]) => void;
  insertWaypoint: (waypoint: Waypoint, afterId: string) => void;
  setCalculatedRoute: (route: any) => void;
  clearRoute: () => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Validation
  isValidForRouting: () => boolean;
}

// Trip State Interface
interface TripState {
  currentTrip: TripData | null;
  savedTrips: TripData[];
  setCurrentTrip: (trip: TripData) => void;
  saveTrip: (trip: TripData) => void;
  loadTrip: (id: string) => void;
  deleteTrip: (id: string) => void;
}

// UI State Interface
interface UIState {
  isLoading: boolean;
  error: string | null;
  notifications: Array<{ id: string; type: 'success' | 'error' | 'warning' | 'info'; message: string }>;
  sidebarOpen: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addNotification: (notification: Omit<UIState['notifications'][0], 'id'>) => void;
  removeNotification: (id: string) => void;
  toggleSidebar: () => void;
}

// Create Map Store
export const useMapStore = create<MapState>()(
  devtools(
    (set) => ({
      center: [54.5260, 15.2551], // Center of Europe
      zoom: 5,
      selectedWaypoint: null,
      setCenter: (center) => set({ center }),
      setZoom: (zoom) => set({ zoom }),
      setSelectedWaypoint: (selectedWaypoint) => set({ selectedWaypoint }),
    }),
    { name: 'map-store' }
  )
);

// Create Vehicle Store with persistence
export const useVehicleStore = create<VehicleState>()(
  persist(
    devtools(
      (set) => ({
        profile: null,
        setProfile: (profile) => set({ profile }),
        clearProfile: () => set({ profile: null }),
      }),
      { name: 'vehicle-store' }
    ),
    {
      name: 'camper-planner-vehicle',
      partialize: (state) => ({ profile: state.profile }),
    }
  )
);

// Helper function to update waypoint types based on position
const updateWaypointTypes = (waypoints: Waypoint[]): Waypoint[] => {
  return waypoints.map((waypoint, index) => {
    let type: 'start' | 'waypoint' | 'end';

    if (waypoints.length === 1) {
      type = 'start';
    } else if (index === 0) {
      type = 'start';
    } else if (index === waypoints.length - 1) {
      type = 'end';
    } else {
      type = 'waypoint';
    }

    return { ...waypoint, type };
  });
};

// Helper function to add action to history
const addToHistory = (state: RouteState, action: WaypointAction): RouteState => {
  const newHistory = [
    ...state.history.slice(0, state.historyIndex + 1),
    action
  ].slice(-state.maxHistorySize);

  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1
  };
};

// Create Route Store with persistence and undo/redo
export const useRouteStore = create<RouteState>()(
  persist(
    devtools(
      (set, get) => ({
        waypoints: [],
        calculatedRoute: null,
        isOptimized: false,
        totalDistance: 0,
        estimatedTime: 0,
        history: [],
        historyIndex: -1,
        maxHistorySize: 50,

        addWaypoint: (waypoint) =>
          set((state) => {
            const newWaypoints = [...state.waypoints, waypoint];
            const updatedWaypoints = updateWaypointTypes(newWaypoints);

            const action: WaypointAction = {
              type: 'add',
              timestamp: Date.now(),
              data: waypoint,
              previousState: state.waypoints
            };

            return {
              ...addToHistory(state, action),
              waypoints: updatedWaypoints,
              isOptimized: false
            };
          }),

        removeWaypoint: (id) =>
          set((state) => {
            const removedWaypoint = state.waypoints.find(wp => wp.id === id);
            const filteredWaypoints = state.waypoints.filter(wp => wp.id !== id);
            const updatedWaypoints = updateWaypointTypes(filteredWaypoints);

            const action: WaypointAction = {
              type: 'remove',
              timestamp: Date.now(),
              data: { id, waypoint: removedWaypoint },
              previousState: state.waypoints
            };

            return {
              ...addToHistory(state, action),
              waypoints: updatedWaypoints,
              isOptimized: false
            };
          }),

        updateWaypoint: (id, updates) =>
          set((state) => {
            const previousWaypoint = state.waypoints.find(wp => wp.id === id);
            const updatedWaypoints = state.waypoints.map(wp =>
              wp.id === id ? { ...wp, ...updates } : wp
            );

            const action: WaypointAction = {
              type: 'update',
              timestamp: Date.now(),
              data: { id, updates, previousWaypoint },
              previousState: state.waypoints
            };

            return {
              ...addToHistory(state, action),
              waypoints: updatedWaypoints
            };
          }),

        reorderWaypoints: (waypoints) => {
          const state = get();
          const updatedWaypoints = updateWaypointTypes(waypoints);

          const action: WaypointAction = {
            type: 'reorder',
            timestamp: Date.now(),
            data: waypoints,
            previousState: state.waypoints
          };

          set({
            ...addToHistory(state, action),
            waypoints: updatedWaypoints,
            isOptimized: true
          });
        },

        insertWaypoint: (waypoint, afterId) =>
          set((state) => {
            const afterIndex = state.waypoints.findIndex(wp => wp.id === afterId);
            const newWaypoints = [
              ...state.waypoints.slice(0, afterIndex + 1),
              waypoint,
              ...state.waypoints.slice(afterIndex + 1)
            ];
            const updatedWaypoints = updateWaypointTypes(newWaypoints);

            const action: WaypointAction = {
              type: 'add',
              timestamp: Date.now(),
              data: { waypoint, afterId },
              previousState: state.waypoints
            };

            return {
              ...addToHistory(state, action),
              waypoints: updatedWaypoints,
              isOptimized: false
            };
          }),

        clearRoute: () =>
          set((state) => {
            const action: WaypointAction = {
              type: 'clear',
              timestamp: Date.now(),
              data: null,
              previousState: state.waypoints
            };

            return {
              ...addToHistory(state, action),
              waypoints: [],
              calculatedRoute: null,
              isOptimized: false,
              totalDistance: 0,
              estimatedTime: 0
            };
          }),

        setCalculatedRoute: (calculatedRoute) => set({ calculatedRoute }),

        // Undo/Redo functions
        undo: () =>
          set((state) => {
            if (state.historyIndex < 0) return state;

            const action = state.history[state.historyIndex];
            return {
              ...state,
              waypoints: updateWaypointTypes(action.previousState),
              historyIndex: state.historyIndex - 1,
              isOptimized: false
            };
          }),

        redo: () =>
          set((state) => {
            if (state.historyIndex >= state.history.length - 1) return state;

            const nextIndex = state.historyIndex + 1;
            const action = state.history[nextIndex];
            let newWaypoints = state.waypoints;

            switch (action.type) {
              case 'add':
                if (action.data.afterId) {
                  const afterIndex = state.waypoints.findIndex(wp => wp.id === action.data.afterId);
                  newWaypoints = [
                    ...state.waypoints.slice(0, afterIndex + 1),
                    action.data.waypoint,
                    ...state.waypoints.slice(afterIndex + 1)
                  ];
                } else {
                  newWaypoints = [...state.waypoints, action.data];
                }
                break;
              case 'remove':
                newWaypoints = state.waypoints.filter(wp => wp.id !== action.data.id);
                break;
              case 'update':
                newWaypoints = state.waypoints.map(wp =>
                  wp.id === action.data.id ? { ...wp, ...action.data.updates } : wp
                );
                break;
              case 'reorder':
                newWaypoints = action.data;
                break;
              case 'clear':
                newWaypoints = [];
                break;
            }

            return {
              ...state,
              waypoints: updateWaypointTypes(newWaypoints),
              historyIndex: nextIndex,
              isOptimized: action.type === 'reorder'
            };
          }),

        canUndo: () => {
          const state = get();
          return state.historyIndex >= 0;
        },

        canRedo: () => {
          const state = get();
          return state.historyIndex < state.history.length - 1;
        },

        isValidForRouting: () => {
          const state = get();
          return state.waypoints.length >= 2;
        },
      }),
      { name: 'route-store' }
    ),
    {
      name: 'camper-planner-route',
      partialize: (state) => ({
        waypoints: state.waypoints,
        isOptimized: state.isOptimized,
        totalDistance: state.totalDistance,
        estimatedTime: state.estimatedTime,
        // Don't persist history to avoid bloating localStorage
      }),
    }
  )
);

// Create Trip Store with persistence
export const useTripStore = create<TripState>()(
  persist(
    devtools(
      (set, get) => ({
        currentTrip: null,
        savedTrips: [],
        setCurrentTrip: (currentTrip) => set({ currentTrip }),
        saveTrip: (trip) =>
          set((state) => ({
            savedTrips: [
              ...state.savedTrips.filter(t => t.id !== trip.id),
              trip
            ]
          })),
        loadTrip: (id) => {
          const trip = get().savedTrips.find(t => t.id === id);
          if (trip) {
            set({ currentTrip: trip });
          }
        },
        deleteTrip: (id) =>
          set((state) => ({
            savedTrips: state.savedTrips.filter(t => t.id !== id),
            currentTrip: state.currentTrip?.id === id ? null : state.currentTrip
          })),
      }),
      { name: 'trip-store' }
    ),
    {
      name: 'camper-planner-trips',
      partialize: (state) => ({
        savedTrips: state.savedTrips,
        currentTrip: state.currentTrip
      }),
    }
  )
);

// Create UI Store
export const useUIStore = create<UIState>()(
  devtools(
    (set, get) => ({
      isLoading: false,
      error: null,
      notifications: [],
      sidebarOpen: true,
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      addNotification: (notification) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id }]
        }));
        // Auto-remove notification after 5 seconds
        setTimeout(() => {
          get().removeNotification(id);
        }, 5000);
      },
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        })),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    { name: 'ui-store' }
  )
);