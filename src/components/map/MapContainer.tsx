// Map Container Component
// Phase 1.5: Basic map foundation with React-Leaflet

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer as LeafletMapContainer, useMap, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import { FeatureFlags } from '../../config';
import { useMapStore, useRouteStore, useUIStore } from '../../store';
import { mapStorage } from '../../utils/mapStorage';
import { cn } from '../../utils/cn';
import WaypointManager from './WaypointManager';
import MapLayerControl from './MapLayerControl';
import MapControlsPanel from './MapControlsPanel';
import MobileMapControls from './MobileMapControls';
import VehicleProfileSidebar from '../routing/VehicleProfileSidebar';
import { RouteCalculator, VehicleRestrictionGuidance, RouteInformation, RouteComparison, CostCalculator } from '../routing';
import RouteOptimizer from '../routing/RouteOptimizer';
import { TripManager, PlanningTools } from '../planning';
import SimpleCampsiteLayer from '../campsite/SimpleCampsiteLayer';
import CampsiteControls from '../campsite/CampsiteControls';
import CampsiteFilter, { type CampsiteFilterState, getDefaultFilterState } from '../campsite/CampsiteFilter';
import CampsiteDetails from '../campsite/CampsiteDetails';
// import CampsiteRecommendations from '../campsite/CampsiteRecommendations'; // V2 disabled
import UserGuidance from '../ui/UserGuidance';
import ConfirmDialog from '../ui/ConfirmDialog';
import ComponentErrorBoundary from '../ui/ComponentErrorBoundary';
import { UnifiedSearch } from '../search';
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
  defaultCenter: [54.5260, 15.2551] as [number, number],
  defaultZoom: 5,
  minZoom: 3,
  maxZoom: 19,

  // Tile configuration following OpenStreetMap specs
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  tileAttribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  tileSubdomains: ['a', 'b', 'c'],

  // European bounds to prevent excessive panning
  maxBounds: [
    [34.0, -25.0], // Southwest
    [72.0, 45.0]   // Northeast
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
    }
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
  const { waypoints, clearRoute, undo, redo, canUndo, canRedo, isValidForRouting, calculatedRoute } = useRouteStore();
  const { addNotification } = useUIStore();
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
  const [showCampsiteControls, setShowCampsiteControls] = useState<boolean>(FeatureFlags.CAMPSITE_DISPLAY);
  const [showCampsiteFilter, setShowCampsiteFilter] = useState(false);
  const [showCampsiteDetails, setShowCampsiteDetails] = useState(false);
  const [showCampsiteRecommendations, setShowCampsiteRecommendations] = useState(false);
  const [campsitesVisible, setCampsitesVisible] = useState<boolean>(FeatureFlags.CAMPSITE_DISPLAY);
  const [campsiteCount, setCampsiteCount] = useState(0);
  const [campsiteFilterState, setCampsiteFilterState] = useState<CampsiteFilterState>(getDefaultFilterState);
  const [allCampsites, setAllCampsites] = useState<Campsite[]>([]);

  // Route optimization state
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);

  // Cost calculation state
  const [showCostCalculator, setShowCostCalculator] = useState(false);

  // Trip management state
  const [showTripManager, setShowTripManager] = useState(false);

  // Planning tools state
  const [showPlanningTools, setShowPlanningTools] = useState(false);

  // Mobile state - must be at top with other useState
  const [isMobile, setIsMobile] = useState(false);

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

  if (!FeatureFlags.BASIC_MAP_DISPLAY) {
    return (
      <div className="h-full flex items-center justify-center bg-neutral-100">
        <div className="text-center">
          <h3 className="text-lg font-medium text-neutral-500 mb-2">
            Map Display Disabled
          </h3>
          <p className="text-sm text-neutral-400">
            Enable BASIC_MAP_DISPLAY feature flag
          </p>
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
    } catch (error) {
      console.warn('Fullscreen not supported or denied:', error);
      addNotification({
        type: 'warning',
        message: 'Fullscreen mode not supported in this browser'
      });
    }
  };

  const handleResetView = () => {
    setCenter(MAP_CONFIG.defaultCenter);
    setZoom(MAP_CONFIG.defaultZoom);
    addNotification({
      type: 'info',
      message: 'Map view reset to Europe'
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
    setShowCampsiteDetails(true);
    setShowCampsiteRecommendations(false);
    addNotification({
      type: 'info',
      message: `Selected ${campsite.name || campsite.type}`
    });
  };

  const handleCampsitesLoaded = (count: number, campsites?: Campsite[]) => {
    setCampsiteCount(count);
    if (campsites) {
      setAllCampsites(campsites);
    }
  };

  const handleCampsiteDetailsClose = () => {
    setShowCampsiteDetails(false);
    setSelectedCampsite(null);
  };

  const handleToggleRecommendations = () => {
    setShowCampsiteRecommendations(!showCampsiteRecommendations);
    if (!showCampsiteRecommendations) {
      setShowCampsiteDetails(false);
    }
  };

  return (
    <div className={cn(
      "h-full relative transition-all duration-300",
      isFullscreen && "fixed inset-0 z-50 bg-black"
    )}>
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
        // @ts-ignore - React-Leaflet v4 prop compatibility
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
        <MapEventHandler
          onMapMove={handleMapMove}
        />

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
      {FeatureFlags.CAMPSITE_DISPLAY && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-md px-4 hidden md:block">
          <ComponentErrorBoundary componentName="UnifiedSearch">
            <UnifiedSearch
              map={mapInstance}
              visibleTypes={campsiteFilterState.visibleTypes}
              onCampsiteSelect={handleCampsiteClick}
              onCampsiteHover={setHighlightedCampsiteId}
              onLocationSelect={(location) => {
                addNotification({
                  type: 'info',
                  message: `Navigated to ${location.name}`
                });
              }}
            />
          </ComponentErrorBoundary>
        </div>
      )}

      {/* Waypoint hint for new users - shown when no waypoints exist */}
      {waypoints.length === 0 && isMapReady && (
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none hidden sm:block animate-fade-in">
          <div className="bg-white/95 backdrop-blur-sm px-5 py-3 rounded-xl shadow-lg border border-neutral-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-neutral-900">Start your trip</p>
                <p className="text-xs text-neutral-500">Right-click on the map to add waypoints, or search for a location above</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Profile Configuration */}
      <ComponentErrorBoundary componentName="VehicleProfileSidebar">
        <VehicleProfileSidebar />
      </ComponentErrorBoundary>

      {/* Route Calculator Panel - positioned to avoid overlap with map controls */}
      {FeatureFlags.BASIC_ROUTING && (
        <div className="absolute top-4 right-14 z-20 w-64 hidden lg:block">
          <ComponentErrorBoundary componentName="RouteCalculator">
            <RouteCalculator />
          </ComponentErrorBoundary>
        </div>
      )}

      {/* Campsite Controls Panel - positioned in top-left area, below tool buttons */}
      {FeatureFlags.CAMPSITE_DISPLAY && showCampsiteControls && !showCampsiteFilter && (
        <div className="absolute top-4 left-16 z-20 w-72 hidden md:block">
          <ComponentErrorBoundary componentName="CampsiteControls">
            <CampsiteControls
              visibleTypes={campsiteFilterState.visibleTypes}
              onTypesChange={(types) => setCampsiteFilterState({...campsiteFilterState, visibleTypes: types})}
              maxResults={campsiteFilterState.maxResults}
              onMaxResultsChange={(max) => setCampsiteFilterState({...campsiteFilterState, maxResults: max})}
              vehicleCompatibleOnly={campsiteFilterState.vehicleCompatibleOnly}
              onVehicleCompatibleChange={(compatible) => setCampsiteFilterState({...campsiteFilterState, vehicleCompatibleOnly: compatible})}
              isVisible={campsitesVisible}
              onVisibilityChange={setCampsitesVisible}
              campsiteCount={campsiteCount}
            />
          </ComponentErrorBoundary>
        </div>
      )}

      {/* Advanced Campsite Filter Panel */}
      {FeatureFlags.CAMPSITE_DISPLAY && showCampsiteFilter && (
        <div className="absolute top-4 left-16 z-20 w-80 hidden md:block">
          <ComponentErrorBoundary componentName="CampsiteFilter">
            <CampsiteFilter
              filterState={campsiteFilterState}
              onFilterChange={setCampsiteFilterState}
              onSearchChange={(query) => setCampsiteFilterState({...campsiteFilterState, searchQuery: query})}
              onCampsiteSelect={handleCampsiteClick}
              campsiteCount={campsiteCount}
            />
          </ComponentErrorBoundary>
        </div>
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
      <div className="absolute top-4 left-4 z-30 flex flex-col space-y-2 hidden sm:flex">
        {/* Primary actions: Undo/Redo */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className={cn(
              "block w-10 h-10 flex items-center justify-center border-b border-neutral-200 transition-colors",
              canUndo() ? "hover:bg-neutral-50 text-neutral-700" : "text-neutral-300 cursor-not-allowed"
            )}
            title="Undo (Ctrl+Z)"
            aria-label="Undo last action"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className={cn(
              "block w-10 h-10 flex items-center justify-center transition-colors",
              canRedo() ? "hover:bg-neutral-50 text-neutral-700" : "text-neutral-300 cursor-not-allowed"
            )}
            title="Redo (Ctrl+Y)"
            aria-label="Redo last action"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        {/* Trip & Tools: Manager, Planning, Cost */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => setShowTripManager(!showTripManager)}
            className={cn(
              "block w-10 h-10 flex items-center justify-center border-b border-neutral-200 transition-colors",
              showTripManager ? "bg-indigo-50 text-indigo-600" : "hover:bg-neutral-50 text-neutral-700"
            )}
            title="Trip manager"
            aria-label="Toggle trip manager"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
          {waypoints.length >= 2 && (
            <>
              <button
                onClick={() => setShowPlanningTools(!showPlanningTools)}
                className={cn(
                  "block w-10 h-10 flex items-center justify-center border-b border-neutral-200 transition-colors",
                  showPlanningTools ? "bg-violet-50 text-violet-600" : "hover:bg-neutral-50 text-neutral-700"
                )}
                title="Trip planning tools"
                aria-label="Toggle planning tools"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setShowCostCalculator(!showCostCalculator)}
                className={cn(
                  "block w-10 h-10 flex items-center justify-center transition-colors",
                  showCostCalculator ? "bg-emerald-50 text-emerald-600" : "hover:bg-neutral-50 text-neutral-700"
                )}
                title="Trip cost calculator"
                aria-label="Toggle cost calculator"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Route actions: Info, Optimize */}
        {FeatureFlags.BASIC_ROUTING && calculatedRoute && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <button
              onClick={() => setShowRouteInfo(!showRouteInfo)}
              className={cn(
                "block w-10 h-10 flex items-center justify-center transition-colors",
                showRouteInfo ? "bg-primary-50 text-primary-600" : "hover:bg-neutral-50 text-neutral-700",
                FeatureFlags.ROUTE_OPTIMIZATION && waypoints.length >= 3 && "border-b border-neutral-200"
              )}
              title="Route information"
              aria-label="Toggle route information"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            {FeatureFlags.ROUTE_OPTIMIZATION && waypoints.length >= 3 && (
              <button
                onClick={() => setShowRouteOptimizer(!showRouteOptimizer)}
                className={cn(
                  "block w-10 h-10 flex items-center justify-center transition-colors",
                  showRouteOptimizer ? "bg-orange-50 text-orange-600" : "hover:bg-neutral-50 text-neutral-700"
                )}
                title="Optimize route order"
                aria-label="Toggle route optimizer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Campsite toggle */}
        {FeatureFlags.CAMPSITE_DISPLAY && (
          <button
            onClick={() => {
              if (!showCampsiteControls && !showCampsiteFilter) {
                setShowCampsiteControls(true);
              } else if (showCampsiteControls) {
                setShowCampsiteControls(false);
                setShowCampsiteFilter(true);
              } else {
                setShowCampsiteFilter(false);
              }
            }}
            className={cn(
              "w-10 h-10 flex items-center justify-center rounded-lg shadow-md transition-colors",
              (showCampsiteControls || showCampsiteFilter)
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-white text-neutral-700 hover:bg-neutral-50"
            )}
            title={showCampsiteFilter ? "Hide filters" : showCampsiteControls ? "Advanced filters" : "Show campsites"}
            aria-label="Toggle campsite controls"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        )}

        {/* Clear waypoints - danger action, separate */}
        {waypoints.length > 0 && (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="w-10 h-10 flex items-center justify-center bg-white text-red-600 rounded-lg shadow-md hover:bg-red-50 transition-colors"
            title="Clear all waypoints"
            aria-label="Clear all waypoints"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Map info overlay - responsive design */}
      <div className="absolute bottom-4 left-4 z-30 hidden sm:block">
        <div className="bg-white bg-opacity-95 rounded-lg shadow-md px-3 py-2 text-xs text-neutral-600 animate-fade-in">
          <div className="sm:block hidden">
            Zoom: {zoom} | Center: {center[0].toFixed(4)}, {center[1].toFixed(4)}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-primary-600 font-medium">
              Waypoints: {waypoints.length}
            </span>
            {waypoints.length === 0 ? (
              <span className="text-green-600 text-xs">
                Right-click map to add
              </span>
            ) : waypoints.length === 1 ? (
              <span className="text-orange-600 text-xs">
                Add 1 more for routing
              </span>
            ) : (
              <span className="text-green-600 text-xs">
                ✓ Ready for routing
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Mobile-optimized info bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 sm:hidden">
        <div className="bg-white bg-opacity-95 border-t border-neutral-200 px-4 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-neutral-600">
              {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''}
            </span>
            {waypoints.length === 0 ? (
              <span className="text-green-600 text-sm font-medium">
                Long-press map to add waypoint
              </span>
            ) : waypoints.length === 1 ? (
              <span className="text-orange-600 text-sm font-medium">
                Add another point
              </span>
            ) : (
              <span className="text-green-600 text-sm font-medium">
                ✓ Route ready
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Route Information Panel */}
      {showRouteInfo && FeatureFlags.BASIC_ROUTING && calculatedRoute && !showCampsiteDetails && !showCampsiteRecommendations && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-neutral-200 shadow-xl transform transition-transform sm:translate-x-0">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-neutral-900">Route Details</h2>
              {calculatedRoute.alternativeRoutes && calculatedRoute.alternativeRoutes.length > 0 && (
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
              <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
            {routeInfoTab === 'info' && (
              <RouteInformation className="border-0 rounded-none" />
            )}
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
              <h2 className="text-lg font-semibold text-neutral-900">Campsite Recommendations</h2>
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
              <h2 className="text-lg font-semibold text-neutral-900">Route Optimizer</h2>
              <button
                onClick={() => setShowRouteOptimizer(false)}
                className="p-1 hover:bg-orange-200 rounded transition-colors"
                aria-label="Close optimizer"
              >
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Optimizer Content */}
            <div className="flex-1 overflow-hidden">
              <RouteOptimizer
                className="h-full border-0 rounded-none"
                onOptimizationComplete={(result) => {
                  // Handle optimization completion
                  console.log('Optimization complete:', result);
                }}
                onWaypointInsert={(position) => {
                  // Handle waypoint insertion at optimal position
                  console.log('Insert waypoint at position:', position);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Cost Calculator Panel */}
      {showCostCalculator && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-neutral-200 shadow-xl transform transition-transform sm:translate-x-0">
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-emerald-50">
              <h2 className="text-lg font-semibold text-neutral-900">Trip Cost Calculator</h2>
              <button
                onClick={() => setShowCostCalculator(false)}
                className="p-1 hover:bg-emerald-200 rounded transition-colors"
                aria-label="Close cost calculator"
              >
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cost Calculator Content */}
            <div className="flex-1 overflow-hidden">
              <CostCalculator
                className="h-full border-0 rounded-none"
                onCostUpdate={(breakdown) => {
                  // Handle cost updates
                  console.log('Cost breakdown updated:', breakdown);
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
              <h2 className="text-lg font-semibold text-neutral-900">Trip Manager</h2>
              <button
                onClick={() => setShowTripManager(false)}
                className="p-1 hover:bg-indigo-200 rounded transition-colors"
                aria-label="Close trip manager"
              >
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Trip Manager Content */}
            <div className="flex-1 overflow-hidden">
              <TripManager
                className="h-full border-0 rounded-none"
                onTripLoad={(trip) => {
                  // Handle trip loading - would integrate with route store
                  console.log('Loading trip:', trip);
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
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-neutral-200 shadow-xl transform transition-transform sm:translate-x-0">
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-violet-50">
              <h2 className="text-lg font-semibold text-neutral-900">Planning Tools</h2>
              <button
                onClick={() => setShowPlanningTools(false)}
                className="p-1 hover:bg-violet-200 rounded transition-colors"
                aria-label="Close planning tools"
              >
                <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Planning Tools Content */}
            <div className="flex-1 overflow-hidden">
              <PlanningTools
                className="h-full border-0 rounded-none"
                onPlanUpdate={(plan) => {
                  // Handle plan updates
                  console.log('Trip plan updated:', plan);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* User guidance and help system */}
      <UserGuidance />

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
            message: 'All waypoints cleared'
          });
          setShowConfirmClear(false);
        }}
        onCancel={() => setShowConfirmClear(false)}
      />
    </div>
  );
};

export default MapContainer;