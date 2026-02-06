// Map Storage Utilities
// Persists map state (zoom, center) to localStorage

interface MapState {
  center: [number, number];
  zoom: number;
  timestamp: number;
  layerId?: string;
  isFullscreen?: boolean;
  layerControlCollapsed?: boolean;
}

interface MapStorageData {
  mapState?: MapState;
  version: string;
}

const STORAGE_KEY = 'camper-planner-map-state';
const STORAGE_VERSION = '1.0';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class MapStorage {
  /**
   * Get the current map state from localStorage
   */
  getMapState(): MapState | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const data: MapStorageData = JSON.parse(stored);

      // Check version compatibility
      if (data.version !== STORAGE_VERSION) {
        console.warn('Map storage version mismatch, clearing stored state');
        this.clearMapState();
        return null;
      }

      // Check if data is not too old
      if (data.mapState && data.mapState.timestamp) {
        const age = Date.now() - data.mapState.timestamp;
        if (age > MAX_AGE_MS) {
          this.clearMapState();
          return null;
        }
      }

      return data.mapState || null;
    } catch (error) {
      console.error('Error reading map state from storage:', error);
      this.clearMapState(); // Clear corrupted data
      return null;
    }
  }

  /**
   * Save the current map state to localStorage
   */
  saveMapState(state: MapState): void {
    try {
      // Validate coordinates
      if (!this.validateCoordinates(state.center[0], state.center[1])) {
        console.warn('Invalid coordinates, not saving map state:', state.center);
        return;
      }

      // Validate zoom level
      if (state.zoom < 1 || state.zoom > 20) {
        console.warn('Invalid zoom level, not saving map state:', state.zoom);
        return;
      }

      const data: MapStorageData = {
        mapState: {
          center: [
            Number(state.center[0].toFixed(6)), // Limit precision
            Number(state.center[1].toFixed(6))
          ],
          zoom: Math.round(state.zoom), // Round zoom to integer
          timestamp: Date.now()
        },
        version: STORAGE_VERSION
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving map state to storage:', error);
    }
  }

  /**
   * Clear the stored map state
   */
  clearMapState(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing map state from storage:', error);
    }
  }

  /**
   * Get storage usage statistics
   */
  getStorageInfo(): { size: number; lastUpdated: number | null } {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { size: 0, lastUpdated: null };
      }

      const data: MapStorageData = JSON.parse(stored);
      return {
        size: new Blob([stored]).size,
        lastUpdated: data.mapState?.timestamp || null
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return { size: 0, lastUpdated: null };
    }
  }

  /**
   * Validate coordinates are within valid range
   */
  private validateCoordinates(lat: number, lng: number): boolean {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180 &&
      !isNaN(lat) && !isNaN(lng)
    );
  }

  /**
   * Check if localStorage is available
   */
  isStorageAvailable(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const mapStorage = new MapStorage();

// Export types for use in components
export type { MapState };