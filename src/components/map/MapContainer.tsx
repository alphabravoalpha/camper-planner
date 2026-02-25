// Map Container Component
// Phase 1.5: Basic map foundation with React-Leaflet

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MapContainer as LeafletMapContainer, useMap, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import { FeatureFlags } from '../../config';
import { useMapStore, useRouteStore, useUIStore, useTripWizardStore } from '../../store';
import { mapStorage } from '../../utils/mapStorage';
import { cn } from '../../utils/cn';
import WaypointManager from './WaypointManager';
import MapLayerControl from './MapLayerControl';
import MapControlsPanel from './MapControlsPanel';
import MobileMapControls from './MobileMapControls';
import MobileToolbar from './MobileToolbar';
import VehicleProfileSidebar from '../routing/VehicleProfileSidebar';
import {
  RouteCalculator,
  VehicleRestrictionGuidance,
  RouteInformation,
  RouteComparison,
  CostCalculator,
} from '../routing';
import RouteOptimizer from '../routing/RouteOptimizer';
import { TripManager, PlanningTools, TripSettingsPanel } from '../planning';
import SimpleCampsiteLayer from '../campsite/SimpleCampsiteLayer';
import CampsiteControls from '../campsite/CampsiteControls';
import CampsiteFilter, {
  type CampsiteFilterState,
  getDefaultFilterState,
} from '../campsite/CampsiteFilter';
import CampsiteDetails from '../campsite/CampsiteDetails';
// import CampsiteRecommendations from '../campsite/CampsiteRecommendations'; // V2 disabled
import ConfirmDialog from '../ui/ConfirmDialog';
import ComponentErrorBoundary from '../ui/ComponentErrorBoundary';
import { UnifiedSearch } from '../search';
import ToolsMenu from './ToolsMenu';
import EmptyStateCard from './EmptyStateCard';
import ContextualNudge from '../ui/ContextualNudge';
import { type Campsite } from '../../services/CampsiteService';
import 'leaflet/dist/leaflet.css';
import '../../styles/animations.css';

// Fix for default markers in React-Leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerRetina from 'leaflet/dist/images/marker-icon-2x.png';

// Fix default marker icons
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerRetina,
  shadowUrl: markerShadow,
});

// Map configuration following API specifications
const MAP_CONFIG = {
  // Center on Europe (from API docs)
  defaultCenter: [54.526, 15.2551] as [number, number],
  defaultZoom: 5,
  minZoom: 3,
  maxZoom: 19,

  // Tile configuration following OpenStreetMap specs
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileAttribution:
    '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  tileSubdomains: ['a', 'b', 'c'],

  // European bounds to prevent excessive panning
  maxBounds: [
    [34.0, -25.0], // Southwest
    [72.0, 45.0], // Northeast
  ] as [[number, number], [number, number]],
};

interface MapEventHandlerProps {
  onMapMove: (center: [number, number], zoom: number) => void;
}

// Component to handle map events (click events handled by WaypointManager)
const MapEventHandler: React.FC<MapEventHandlerProps> = ({ onMapMove }) => {
  const map = useMap();

  useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onMapMove([center.lat, center.lng], zoom);
    },
    zoomend: () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      onMapMove([center.lat, center.lng], zoom);
    },
  });

  return null;
};

// Component to capture map instance for external use
interface MapInstanceCaptureProps {
  onMapReady: (mapInstance: L.Map) => void;
}

const MapInstanceCapture: React.FC<MapInstanceCaptureProps> = ({ onMapReady }) => {
  const map = useMap();

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  return null;
};

// Component to sync map with store state
const MapController: React.FC = () => {
  const map = useMap();
  const { center, zoom } = useMapStore();
  const lastCenter = useRef<[number, number]>(center);
  const lastZoom = useRef<number>(zoom);

  useEffect(() => {
    // Only update if values actually changed to prevent infinite loops
    if (center[0] !== lastCenter.current[0] || center[1] !== lastCenter.current[1]) {
      map.setView(center, zoom);
      lastCenter.current = center;
    }
  }, [center, map, zoom]);

  useEffect(() => {
    if (zoom !== lastZoom.current) {
      map.setZoom(zoom);
      lastZoom.current = zoom;
    }
  }, [zoom, map]);

  return null;
};

const MapContainer: React.FC = () => {
  const { center, zoom, setCenter, setZoom } = useMapStore();
  const { waypoints, clearRoute, undo, redo, canUndo, canRedo, calculatedRoute } = useRouteStore();
  const { addNotification, openVehicleSidebar } = useUIStore();
  const { openWizard } = useTripWizardStore();
  const [isMapReady, setIsMapReady] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [currentLayerId, setCurrentLayerId] = useState('openstreetmap');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layerControlCollapsed, setLayerControlCollapsed] = useState(true);
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const [routeInfoTab, setRouteInfoTab] = useState<'info' | 'comparison'>('info');
  const mapRef = useRef<L.Map | null>(null);
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);

  // Callback to capture map instance for external components
  const handleMapInstanceCapture = (map: L.Map) => {
    setMapInstance(map);
    mapRef.current = map;
  };

  // Campsite state
  const [selectedCampsite, setSelectedCampsite] = useState<Campsite | null>(null);
  const [highlightedCampsiteId, setHighlightedCampsiteId] = useState<string | null>(null);
  const [showCampsiteControls, setShowCampsiteControls] = useState<boolean>(false);
  const [showCampsiteFilter, setShowCampsiteFilter] = useState(false);
  const [showCampsiteDetails, setShowCampsiteDetails] = useState(false);
  const [showCampsiteRecommendations, setShowCampsiteRecommendations] = useState(false);
  const [campsitesVisible, setCampsitesVisible] = useState<boolean>(false);
  const [campsiteCount, setCampsiteCount] = useState(0);
  const [campsiteFilterState, setCampsiteFilterState] =
    useState<CampsiteFilterState>(getDefaultFilterState);
  const [, setAllCampsites] = useState<Campsite[]>([]);

  // Route optimization state
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);

  // Cost calculation state
  const [showCostCalculator, setShowCostCalculator] = useState(false);

  // Trip management state
  const [showTripManager, setShowTripManager] = useState(false);

  // Planning tools state
  const [showPlanningTools, setShowPlanningTools] = useState(false);

  // Trip settings state
  const [showTripSettings, setShowTripSettings] = useState(false);

  // Mobile state - must be at top with other useState
  const [isMobile, setIsMobile] = useState(false);

  // Tour active state — hides helper overlays during onboarding
  const [isTourActive, setIsTourActive] = useState(false);

  // Load persisted map state on mount
  useEffect(() => {
    const persistedState = mapStorage.getMapState();
    if (persistedState) {
      setCenter(persistedState.center);
      setZoom(persistedState.zoom);
      if (persistedState.layerId) {
        setCurrentLayerId(persistedState.layerId);
      }
      if (persistedState.isFullscreen !== undefined) {
        setIsFullscreen(persistedState.isFullscreen);
      }
      if (persistedState.layerControlCollapsed !== undefined) {
        setLayerControlCollapsed(persistedState.layerControlCollapsed);
      }
    }
  }, [setCenter, setZoom]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = document.fullscreenElement !== null;
      if (isCurrentlyFullscreen !== isFullscreen) {
        setIsFullscreen(isCurrentlyFullscreen);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [isFullscreen]);

  // Check if window is mobile size - must be before any early returns
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Detect when onboarding tour is active and which step is current
  const [currentTourStep, setCurrentTourStep] = useState<string | null>(null);
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const stepAttr = document.body.getAttribute('data-tour-step');
      setIsTourActive(!!stepAttr);
      setCurrentTourStep(stepAttr);
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-tour-step'] });
    setIsTourActive(document.body.hasAttribute('data-tour-step'));
    setCurrentTourStep(document.body.getAttribute('data-tour-step'));
    return () => observer.disconnect();
  }, []);

  // Search bar should be visible during waypoint-related tour steps
  const SEARCH_VISIBLE_STEPS = ['add-start', 'search-destination'];
  const isSearchVisibleDuringTour =
    currentTourStep !== null && SEARCH_VISIBLE_STEPS.includes(currentTourStep);

  // Panel mutual exclusion — only one right-side panel open at a time
  const closeAllPanels = useCallback(() => {
    setShowTripSettings(false);
    setShowTripManager(false);
    setShowPlanningTools(false);
    setShowCostCalculator(false);
    setShowRouteInfo(false);
    setShowRouteOptimizer(false);
    setShowCampsiteDetails(false);
    setShowCampsiteFilter(false);
    setShowCampsiteControls(false);
  }, []);

  const togglePanel = useCallback(
    (panel: string, currentState: boolean) => {
      if (currentState) {
        // Closing the current panel
        switch (panel) {
          case 'tripSettings':
            setShowTripSettings(false);
            break;
          case 'tripManager':
            setShowTripManager(false);
            break;
          case 'planningTools':
            setShowPlanningTools(false);
            break;
          case 'costCalculator':
            setShowCostCalculator(false);
            break;
          case 'routeInfo':
            setShowRouteInfo(false);
            break;
          case 'routeOptimizer':
            setShowRouteOptimizer(false);
            break;
          case 'campsiteControls':
            setShowCampsiteControls(false);
            break;
          case 'campsiteFilter':
            setShowCampsiteFilter(false);
            break;
          case 'campsiteDetails':
            setShowCampsiteDetails(false);
            break;
        }
      } else {
        // Close all, then open the requested one
        closeAllPanels();
        switch (panel) {
          case 'tripSettings':
            setShowTripSettings(true);
            break;
          case 'tripManager':
            setShowTripManager(true);
            break;
          case 'planningTools':
            setShowPlanningTools(true);
            break;
          case 'costCalculator':
            setShowCostCalculator(true);
            break;
          case 'routeInfo':
            setShowRouteInfo(true);
            break;
          case 'routeOptimizer':
            setShowRouteOptimizer(true);
            break;
          case 'campsiteControls':
            setShowCampsiteControls(true);
            break;
          case 'campsiteFilter':
            setShowCampsiteFilter(true);
            break;
          case 'campsiteDetails':
            setShowCampsiteDetails(true);
            break;
        }
      }
    },
    [closeAllPanels]
  );

  // Fallback: ensure map becomes visible after 2 seconds even if whenReady doesn't fire
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isMapReady) {
        // eslint-disable-next-line no-console
        console.warn('Map ready timeout - forcing map to be visible');
        setIsMapReady(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isMapReady]);

  // Must be before early return to satisfy React hooks rules
  const handleCampsitesLoaded = useCallback((count: number, campsites?: Campsite[]) => {
    setCampsiteCount(count);
    if (campsites) {
      setAllCampsites(campsites);
    }
  }, []);

  if (!FeatureFlags.BASIC_MAP_DISPLAY) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <h3 className="text-lg font-medium text-neutral-500 mb-2">Map Display Disabled</h3>
          <p className="text-sm text-neutral-400">Enable BASIC_MAP_DISPLAY feature flag</p>
        </div>
      </div>
    );
  }

  // Map click handling is now done by WaypointManager

  const handleMapMove = (newCenter: [number, number], newZoom: number) => {
    // Update store state
    setCenter(newCenter);
    setZoom(newZoom);

    // Persist to localStorage for next session
    mapStorage.saveMapState({
      center: newCenter,
      zoom: newZoom,
      timestamp: Date.now(),
      layerId: currentLayerId,
      isFullscreen,
      layerControlCollapsed,
    });
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      addNotification({
        type: 'warning',
        message: 'Fullscreen mode not supported in this browser',
      });
    }
  };

  const handleResetView = () => {
    setCenter(MAP_CONFIG.defaultCenter);
    setZoom(MAP_CONFIG.defaultZoom);
    addNotification({
      type: 'info',
      message: 'Map view reset to Europe',
    });
  };

  const handleToggleLayerControl = () => {
    setLayerControlCollapsed(!layerControlCollapsed);
  };

  const handleLayerChange = (layerId: string) => {
    setCurrentLayerId(layerId);
    // Save immediately when layer changes
    mapStorage.saveMapState({
      center,
      zoom,
      timestamp: Date.now(),
      layerId,
      isFullscreen,
      layerControlCollapsed,
    });
  };

  const handleMapReadyState = () => {
    setIsMapReady(true);
  };

  // Campsite handlers
  const handleCampsiteClick = (campsite: Campsite) => {
    setSelectedCampsite(campsite);
    closeAllPanels();
    setShowCampsiteDetails(true);
    setShowCampsiteRecommendations(false);
    addNotification({
      type: 'info',
      message: `Selected ${campsite.name || campsite.type}`,
    });
  };

  const handleCampsiteDetailsClose = () => {
    setShowCampsiteDetails(false);
    setSelectedCampsite(null);
  };

  const _handleToggleRecommendations = () => {
    setShowCampsiteRecommendations(!showCampsiteRecommendations);
    if (!showCampsiteRecommendations) {
      setShowCampsiteDetails(false);
    }
  };

  return (
    <div
      data-tour-id="map-area"
      className={cn(
        'h-full relative transition-all duration-300',
        isFullscreen && 'fixed inset-0 z-50 bg-black'
      )}
    >
      {/* Loading overlay */}
      {!isMapReady && (
        <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto mb-3"></div>
            <p className="text-sm text-neutral-600">Loading European map...</p>
          </div>
        </div>
      )}

      {/* Map component */}
      <LeafletMapContainer
        ref={mapRef}
        // @ts-expect-error - React-Leaflet v4 prop compatibility
        center={center}
        zoom={zoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        maxBounds={MAP_CONFIG.maxBounds}
        maxBoundsViscosity={1.0}
        className="h-full w-full z-map"
        zoomControl={false} // We'll add custom controls
        whenReady={handleMapReadyState}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Dynamic tile layer based on current selection */}
        <MapLayerControl
          currentLayerId={currentLayerId}
          onLayerChange={handleLayerChange}
          collapsed={layerControlCollapsed}
          onToggleCollapse={handleToggleLayerControl}
        />

        {/* Map event handlers */}
        <MapEventHandler onMapMove={handleMapMove} />

        {/* Map state synchronization */}
        <MapController />
        {/* Map instance capture for external components */}
        <MapInstanceCapture onMapReady={handleMapInstanceCapture} />

        {/* Waypoint system */}
        <WaypointManager />

        {/* Campsite layer */}
        {FeatureFlags.CAMPSITE_DISPLAY && (
          <SimpleCampsiteLayer
            visibleTypes={campsiteFilterState.visibleTypes}
            maxResults={campsiteFilterState.maxResults}
            vehicleCompatibleOnly={campsiteFilterState.vehicleCompatibleOnly}
            searchQuery=""
            isVisible={campsitesVisible}
            onCampsiteClick={handleCampsiteClick}
            onCampsitesLoaded={handleCampsitesLoaded}
            isMobile={isMobile}
            filterState={showCampsiteFilter ? campsiteFilterState : undefined}
            highlightedCampsiteId={highlightedCampsiteId}
            selectedCampsiteId={selectedCampsite?.id?.toString() || null}
          />
        )}
      </LeafletMapContainer>

      {/* Unified Search Bar - positioned at top center */}
      {FeatureFlags.CAMPSITE_DISPLAY && (!isTourActive || isSearchVisibleDuringTour) && (
        <div
          data-tour-id="search-bar"
          className="absolute top-2 md:top-4 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-[calc(100%-1.5rem)] md:max-w-md px-2 md:px-4"
        >
          <ComponentErrorBoundary componentName="UnifiedSearch">
            <UnifiedSearch
              map={mapInstance}
              visibleTypes={campsiteFilterState.visibleTypes}
              onCampsiteSelect={handleCampsiteClick}
              onCampsiteHover={setHighlightedCampsiteId}
              onLocationSelect={location => {
                addNotification({
                  type: 'info',
                  message: `Navigated to ${location.name}`,
                });
              }}
            />
          </ComponentErrorBoundary>
        </div>
      )}

      {/* Waypoint hint removed — "Plan a Trip" floating button and search bar serve this purpose */}

      {/* Vehicle Profile Configuration */}
      <ComponentErrorBoundary componentName="VehicleProfileSidebar">
        <VehicleProfileSidebar />
      </ComponentErrorBoundary>

      {/* Route Calculator Panel - only show when user has waypoints to avoid dead space */}
      {FeatureFlags.BASIC_ROUTING && !isTourActive && waypoints.length >= 1 && (
        <div className="absolute top-4 right-14 z-20 w-64 hidden lg:block">
          <ComponentErrorBoundary componentName="RouteCalculator">
            <RouteCalculator />
          </ComponentErrorBoundary>
        </div>
      )}

      {/* Campsite Controls Panel - desktop floating + mobile full-width sheet */}
      {FeatureFlags.CAMPSITE_DISPLAY &&
        showCampsiteControls &&
        !showCampsiteFilter &&
        !isTourActive && (
          <>
            {/* Desktop */}
            <div className="absolute top-4 left-[60px] z-20 w-72 hidden md:block">
              <ComponentErrorBoundary componentName="CampsiteControls">
                <CampsiteControls
                  visibleTypes={campsiteFilterState.visibleTypes}
                  onTypesChange={types =>
                    setCampsiteFilterState({ ...campsiteFilterState, visibleTypes: types })
                  }
                  maxResults={campsiteFilterState.maxResults}
                  onMaxResultsChange={max =>
                    setCampsiteFilterState({ ...campsiteFilterState, maxResults: max })
                  }
                  vehicleCompatibleOnly={campsiteFilterState.vehicleCompatibleOnly}
                  onVehicleCompatibleChange={compatible =>
                    setCampsiteFilterState({
                      ...campsiteFilterState,
                      vehicleCompatibleOnly: compatible,
                    })
                  }
                  isVisible={campsitesVisible}
                  onVisibilityChange={setCampsitesVisible}
                  campsiteCount={campsiteCount}
                />
              </ComponentErrorBoundary>
            </div>
            {/* Mobile sheet */}
            <div className="fixed inset-y-0 right-0 z-40 w-full bg-white border-l border-neutral-200 shadow-xl md:hidden overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-green-50 sticky top-0">
                <h2 className="text-lg font-semibold text-neutral-900">Campsite Settings</h2>
                <button
                  onClick={() => setShowCampsiteControls(false)}
                  className="p-1.5 hover:bg-green-200 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <ComponentErrorBoundary componentName="CampsiteControls">
                  <CampsiteControls
                    visibleTypes={campsiteFilterState.visibleTypes}
                    onTypesChange={types =>
                      setCampsiteFilterState({ ...campsiteFilterState, visibleTypes: types })
                    }
                    maxResults={campsiteFilterState.maxResults}
                    onMaxResultsChange={max =>
                      setCampsiteFilterState({ ...campsiteFilterState, maxResults: max })
                    }
                    vehicleCompatibleOnly={campsiteFilterState.vehicleCompatibleOnly}
                    onVehicleCompatibleChange={compatible =>
                      setCampsiteFilterState({
                        ...campsiteFilterState,
                        vehicleCompatibleOnly: compatible,
                      })
                    }
                    isVisible={campsitesVisible}
                    onVisibilityChange={setCampsitesVisible}
                    campsiteCount={campsiteCount}
                  />
                </ComponentErrorBoundary>
              </div>
            </div>
          </>
        )}

      {/* Advanced Campsite Filter Panel - desktop floating + mobile full-width sheet */}
      {FeatureFlags.CAMPSITE_DISPLAY && showCampsiteFilter && !isTourActive && (
        <>
          {/* Desktop */}
          <div className="absolute top-4 left-[60px] z-20 w-80 hidden md:block">
            <ComponentErrorBoundary componentName="CampsiteFilter">
              <CampsiteFilter
                filterState={campsiteFilterState}
                onFilterChange={setCampsiteFilterState}
                onSearchChange={query =>
                  setCampsiteFilterState({ ...campsiteFilterState, searchQuery: query })
                }
                onCampsiteSelect={handleCampsiteClick}
                campsiteCount={campsiteCount}
              />
            </ComponentErrorBoundary>
          </div>
          {/* Mobile sheet */}
          <div className="fixed inset-y-0 right-0 z-40 w-full bg-white border-l border-neutral-200 shadow-xl md:hidden overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-green-50 sticky top-0">
              <h2 className="text-lg font-semibold text-neutral-900">Campsite Filters</h2>
              <button
                onClick={() => setShowCampsiteFilter(false)}
                className="p-1.5 hover:bg-green-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <ComponentErrorBoundary componentName="CampsiteFilter">
                <CampsiteFilter
                  filterState={campsiteFilterState}
                  onFilterChange={setCampsiteFilterState}
                  onSearchChange={query =>
                    setCampsiteFilterState({ ...campsiteFilterState, searchQuery: query })
                  }
                  onCampsiteSelect={handleCampsiteClick}
                  campsiteCount={campsiteCount}
                />
              </ComponentErrorBoundary>
            </div>
          </div>
        </>
      )}

      {/* Vehicle Restriction Guidance - shown when there are restriction violations */}
      {FeatureFlags.BASIC_ROUTING && calculatedRoute?.restrictions?.violatedDimensions?.length && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 w-96 max-w-full">
          <VehicleRestrictionGuidance
            restrictions={calculatedRoute.restrictions}
            className="shadow-xl"
          />
        </div>
      )}

      {/* Advanced Map Controls */}
      <MapControlsPanel
        map={mapRef.current}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onResetView={handleResetView}
        onToggleLayerControl={handleToggleLayerControl}
        layerControlCollapsed={layerControlCollapsed}
      />

      {/* Mobile Map Controls */}
      <MobileMapControls
        map={mapRef.current}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        onResetView={handleResetView}
        onToggleLayerControl={handleToggleLayerControl}
      />

      {/* Compact left toolbar - organized into logical groups */}
      <div
        data-tour-id="left-toolbar"
        className="absolute top-4 left-4 z-30 flex flex-col space-y-2 hidden sm:flex"
      >
        {/* Primary actions: Undo/Redo */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className={cn(
              'block w-10 h-10 flex items-center justify-center border-b border-neutral-200 transition-colors',
              canUndo()
                ? 'hover:bg-neutral-50 text-neutral-700'
                : 'text-neutral-300 cursor-not-allowed'
            )}
            title="Undo (Ctrl+Z)"
            aria-label="Undo last action"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className={cn(
              'block w-10 h-10 flex items-center justify-center transition-colors',
              canRedo()
                ? 'hover:bg-neutral-50 text-neutral-700'
                : 'text-neutral-300 cursor-not-allowed'
            )}
            title="Redo (Ctrl+Y)"
            aria-label="Redo last action"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
              />
            </svg>
          </button>
        </div>

        {/* Tools Menu — replaces individual tool buttons */}
        <ToolsMenu
          waypointCount={waypoints.length}
          hasCalculatedRoute={!!calculatedRoute}
          hasRouteOptimization={FeatureFlags.ROUTE_OPTIMIZATION}
          onToggleTripSettings={() => togglePanel('tripSettings', showTripSettings)}
          onToggleTripManager={() => togglePanel('tripManager', showTripManager)}
          onToggleVehicle={() => {
            closeAllPanels();
            openVehicleSidebar();
          }}
          onToggleRouteInfo={() => togglePanel('routeInfo', showRouteInfo)}
          onTogglePlanningTools={() => togglePanel('planningTools', showPlanningTools)}
          onToggleCostCalculator={() => togglePanel('costCalculator', showCostCalculator)}
          onToggleRouteOptimizer={() => togglePanel('routeOptimizer', showRouteOptimizer)}
          onExportRoute={() => {
            closeAllPanels();
            setShowTripManager(true);
          }}
          onClearRoute={() => setShowConfirmClear(true)}
          onMenuOpen={() => {
            setShowCampsiteControls(false);
            setShowCampsiteFilter(false);
          }}
          activePanels={{
            tripSettings: showTripSettings,
            tripManager: showTripManager,
            routeInfo: showRouteInfo,
            planningTools: showPlanningTools,
            costCalculator: showCostCalculator,
            routeOptimizer: showRouteOptimizer,
          }}
        />

        {/* Campsite Toggle — simple on/off */}
        {FeatureFlags.CAMPSITE_DISPLAY && (
          <div className="flex flex-col items-center gap-1">
            <button
              data-tour-id="campsite-toggle"
              onClick={() => {
                if (campsitesVisible) {
                  // Currently on — turn off (hide markers + close panels)
                  setShowCampsiteControls(false);
                  setShowCampsiteFilter(false);
                  setCampsitesVisible(false);
                } else {
                  // Currently off — close other panels, then turn on (show controls + markers)
                  closeAllPanels();
                  setShowCampsiteControls(true);
                  setCampsitesVisible(true);
                }
              }}
              className={cn(
                'w-10 h-10 flex items-center justify-center rounded-lg shadow-md transition-colors',
                campsitesVisible
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50'
              )}
              title={campsitesVisible ? 'Hide campsites' : 'Show campsites'}
              aria-label="Toggle campsites"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
            {/* Gear icon for filters — shows when campsites are on */}
            {campsitesVisible && (
              <button
                onClick={() => setShowCampsiteFilter(!showCampsiteFilter)}
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-md shadow-sm transition-colors',
                  showCampsiteFilter
                    ? 'bg-green-100 text-green-700'
                    : 'bg-white text-neutral-500 hover:text-neutral-700'
                )}
                title="Campsite filters"
                aria-label="Toggle campsite filters"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Map info overlay - minimal, user-facing (hidden during tour) */}
      {!isTourActive && (
        <div className="absolute bottom-4 left-4 z-30 hidden sm:block">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-sm px-3 py-1.5 text-xs text-neutral-500 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-primary-600 font-medium">
                {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''}
              </span>
              {waypoints.length === 0 && (
                <span className="text-neutral-400">Right-click map to add</span>
              )}
              {waypoints.length === 1 && (
                <span className="text-orange-500">Add 1 more for routing</span>
              )}
              {waypoints.length >= 2 && <span className="text-green-600">✓ Ready</span>}
            </div>
          </div>
        </div>
      )}

      {/* Empty State Card — shown when no waypoints and tour not active */}
      {!isTourActive && waypoints.length === 0 && (
        <EmptyStateCard
          onOpenWizard={() => {
            closeAllPanels();
            openWizard();
          }}
          onSearchFocus={() => {
            const searchInput = document.querySelector(
              '[data-tour-id="search-bar"] input'
            ) as HTMLInputElement;
            searchInput?.focus();
          }}
        />
      )}

      {/* Contextual Nudges — progressive discovery toasts */}
      <ContextualNudge
        nudgeId="first-waypoint"
        message="Add a second stop to calculate your route — search above or toggle campsites to browse."
        show={!isTourActive && waypoints.length === 1}
      />
      <ContextualNudge
        nudgeId="route-ready"
        message="Your route is ready! Open the Tools menu for vehicle setup, cost estimates, and daily stages."
        show={!isTourActive && waypoints.length >= 2 && !!calculatedRoute}
      />
      <ContextualNudge
        nudgeId="campsites-on"
        message="Zoom in to see individual campsites. Click any marker for details."
        show={!isTourActive && (showCampsiteControls || showCampsiteFilter)}
      />

      {/* Mobile bottom toolbar */}
      {!isTourActive && (
        <MobileToolbar
          waypointCount={waypoints.length}
          calculatedRoute={calculatedRoute}
          campsitesVisible={campsitesVisible}
          showCampsiteControls={showCampsiteControls}
          showCampsiteFilter={showCampsiteFilter}
          showRouteInfo={showRouteInfo}
          showTripManager={showTripManager}
          showPlanningTools={showPlanningTools}
          showCostCalculator={showCostCalculator}
          showTripSettings={showTripSettings}
          onToggleTripSettings={() => togglePanel('tripSettings', showTripSettings)}
          onToggleCampsiteControls={() => {
            if (!showCampsiteControls && !showCampsiteFilter) {
              closeAllPanels();
              setShowCampsiteControls(true);
            } else if (showCampsiteControls) {
              setShowCampsiteControls(false);
              setShowCampsiteFilter(true);
            } else {
              setShowCampsiteFilter(false);
            }
          }}
          onToggleRouteInfo={() => togglePanel('routeInfo', showRouteInfo)}
          onToggleTripManager={() => togglePanel('tripManager', showTripManager)}
          onTogglePlanningTools={() => togglePanel('planningTools', showPlanningTools)}
          onToggleCostCalculator={() => togglePanel('costCalculator', showCostCalculator)}
          onOpenVehicleSidebar={() => {
            closeAllPanels();
            openVehicleSidebar();
          }}
          onClearWaypoints={() => setShowConfirmClear(true)}
        />
      )}

      {/* Route Information Panel */}
      {showRouteInfo &&
        FeatureFlags.BASIC_ROUTING &&
        calculatedRoute &&
        !showCampsiteDetails &&
        !showCampsiteRecommendations && (
          <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-neutral-200 shadow-xl transform transition-transform sm:translate-x-0">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50">
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-display font-semibold text-neutral-900">
                  Route Details
                </h2>
                {calculatedRoute.alternativeRoutes &&
                  calculatedRoute.alternativeRoutes.length > 0 && (
                    <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                      +{calculatedRoute.alternativeRoutes.length} alternatives
                    </span>
                  )}
              </div>
              <button
                onClick={() => setShowRouteInfo(false)}
                className="p-1 hover:bg-neutral-200 rounded transition-colors"
                aria-label="Close route information"
              >
                <svg
                  className="w-5 h-5 text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Tab Navigation */}
            {calculatedRoute.alternativeRoutes && calculatedRoute.alternativeRoutes.length > 0 && (
              <div className="flex border-b border-neutral-200 bg-neutral-50">
                <button
                  onClick={() => setRouteInfoTab('info')}
                  className={cn(
                    'flex-1 py-3 px-4 text-sm font-medium transition-colors',
                    routeInfoTab === 'info'
                      ? 'text-primary-600 border-b-2 border-primary-600 bg-white'
                      : 'text-neutral-500 hover:text-neutral-700'
                  )}
                >
                  Route Info
                </button>
                <button
                  onClick={() => setRouteInfoTab('comparison')}
                  className={cn(
                    'flex-1 py-3 px-4 text-sm font-medium transition-colors',
                    routeInfoTab === 'comparison'
                      ? 'text-primary-600 border-b-2 border-primary-600 bg-white'
                      : 'text-neutral-500 hover:text-neutral-700'
                  )}
                >
                  Compare Routes
                </button>
              </div>
            )}

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto">
              {routeInfoTab === 'info' && <RouteInformation className="border-0 rounded-none" />}
              {routeInfoTab === 'comparison' && (
                <RouteComparison className="border-0 rounded-none" />
              )}
            </div>
          </div>
        )}

      {/* Campsite Details Panel */}
      {showCampsiteDetails && selectedCampsite && FeatureFlags.CAMPSITE_DISPLAY && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-neutral-200 shadow-xl transform transition-transform sm:translate-x-0">
          <CampsiteDetails
            campsite={selectedCampsite}
            onClose={handleCampsiteDetailsClose}
            className="h-full border-0 rounded-none"
          />
        </div>
      )}

      {/* Campsite Recommendations Panel - V2 DISABLED */}
      {/* {showCampsiteRecommendations && FeatureFlags.CAMPSITE_DISPLAY && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-neutral-200 shadow-xl transform transition-transform sm:translate-x-0">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-purple-50">
              <h2 className="text-lg font-display font-semibold text-neutral-900">Campsite Recommendations</h2>
              <button
                onClick={() => setShowCampsiteRecommendations(false)}
                className="p-1 hover:bg-purple-200 rounded transition-colors"
                aria-label="Close recommendations"
              >
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              V2 Feature Disabled
            </div>
          </div>
        </div>
      )} */}

      {/* Route Optimizer Panel */}
      {showRouteOptimizer && FeatureFlags.ROUTE_OPTIMIZATION && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-neutral-200 shadow-xl transform transition-transform sm:translate-x-0">
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-orange-50">
              <h2 className="text-lg font-display font-semibold text-neutral-900">
                Route Optimizer
              </h2>
              <button
                onClick={() => setShowRouteOptimizer(false)}
                className="p-1 hover:bg-orange-200 rounded transition-colors"
                aria-label="Close optimizer"
              >
                <svg
                  className="w-5 h-5 text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Optimizer Content */}
            <div className="flex-1 overflow-hidden">
              <RouteOptimizer
                className="h-full border-0 rounded-none"
                onOptimizationComplete={_result => {
                  // Handle optimization completion
                }}
                onWaypointInsert={_position => {
                  // Handle waypoint insertion at optimal position
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Cost Calculator Panel */}
      {showCostCalculator && (
        <div className="map-panel-right fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-neutral-200 shadow-xl transform transition-transform sm:translate-x-0">
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-emerald-50">
              <h2 className="text-lg font-display font-semibold text-neutral-900">
                Trip Cost Calculator
              </h2>
              <button
                onClick={() => setShowCostCalculator(false)}
                className="p-1 hover:bg-emerald-200 rounded transition-colors"
                aria-label="Close cost calculator"
              >
                <svg
                  className="w-5 h-5 text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Cost Calculator Content */}
            <div className="flex-1 overflow-hidden">
              <CostCalculator
                className="h-full border-0 rounded-none"
                onCostUpdate={_breakdown => {
                  // Handle cost updates
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Trip Manager Panel */}
      {showTripManager && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-neutral-200 shadow-xl transform transition-transform sm:translate-x-0">
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-indigo-50">
              <h2 className="text-lg font-display font-semibold text-neutral-900">Trip Manager</h2>
              <button
                onClick={() => setShowTripManager(false)}
                className="p-1 hover:bg-indigo-200 rounded transition-colors"
                aria-label="Close trip manager"
              >
                <svg
                  className="w-5 h-5 text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Trip Manager Content */}
            <div className="flex-1 overflow-hidden">
              <TripManager
                className="h-full border-0 rounded-none"
                onTripLoad={_trip => {
                  // Handle trip loading - would integrate with route store
                  // TODO: Load trip data into route store, vehicle store, etc.
                  setShowTripManager(false);
                }}
                onClose={() => setShowTripManager(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Planning Tools Panel */}
      {showPlanningTools && (
        <div
          className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-neutral-200 shadow-xl transform transition-transform sm:translate-x-0"
          data-tour-id="planning-tools-panel"
        >
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-violet-50">
              <h2 className="text-lg font-display font-semibold text-neutral-900">Trip Plan</h2>
              <button
                onClick={() => setShowPlanningTools(false)}
                className="p-1 hover:bg-violet-200 rounded transition-colors"
                aria-label="Close trip plan"
              >
                <svg
                  className="w-5 h-5 text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Planning Tools Content */}
            <div className="flex-1 overflow-hidden">
              <PlanningTools
                className="h-full border-0 rounded-none"
                onPlanUpdate={_plan => {
                  // Handle plan updates
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Trip Settings Panel */}
      {showTripSettings && (
        <div
          className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-neutral-200 shadow-xl transform transition-transform sm:translate-x-0"
          data-tour-id="trip-settings-panel"
        >
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-sky-50">
              <h2 className="text-lg font-display font-semibold text-neutral-900">Trip Settings</h2>
              <button
                onClick={() => setShowTripSettings(false)}
                className="p-1 hover:bg-sky-200 rounded transition-colors"
                aria-label="Close trip settings"
              >
                <svg
                  className="w-5 h-5 text-neutral-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Trip Settings Content */}
            <div className="flex-1 overflow-y-auto p-4">
              <TripSettingsPanel />
            </div>
          </div>
        </div>
      )}

      {/* Clear confirmation dialog */}
      <ConfirmDialog
        isOpen={showConfirmClear}
        title="Clear All Waypoints"
        message={`Are you sure you want to remove all ${waypoints.length} waypoints? This action can be undone with Ctrl+Z.`}
        confirmLabel="Clear All"
        confirmVariant="danger"
        onConfirm={() => {
          clearRoute();
          addNotification({
            type: 'success',
            message: 'All waypoints cleared',
          });
          setShowConfirmClear(false);
        }}
        onCancel={() => setShowConfirmClear(false)}
      />
    </div>
  );
};

export default MapContainer;
