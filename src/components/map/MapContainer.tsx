// Map Container Component
// Phase 1.5: Basic map foundation with React-Leaflet

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer as LeafletMapContainer, useMap, useMapEvents } from 'react-leaflet';
import { Map as LeafletMap } from 'leaflet';
import { FeatureFlags } from '../../config';
import { useMapStore, useRouteStore, useUIStore, useVehicleStore } from '../../store';
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
import CampsiteFilter, { DEFAULT_FILTER_STATE } from '../campsite/CampsiteFilter';
import type { CampsiteFilterState } from '../campsite/CampsiteFilter';
import CampsiteDetails from '../campsite/CampsiteDetails';
import CampsiteRecommendations from '../campsite/CampsiteRecommendations';
import UserGuidance from '../ui/UserGuidance';
import ConfirmDialog from '../ui/ConfirmDialog';
import type { CampsiteType, Campsite } from '../../services/CampsiteService';
import 'leaflet/dist/leaflet.css';
import '../../styles/animations.css';

// Fix for default markers in React-Leaflet
import * as L from 'leaflet';
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
  const { profile: _profile } = useVehicleStore();
  const { addNotification } = useUIStore();
  const [isMapReady, setIsMapReady] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [currentLayerId, setCurrentLayerId] = useState('openstreetmap');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layerControlCollapsed, setLayerControlCollapsed] = useState(true);
  const [showRouteInfo, setShowRouteInfo] = useState(false);
  const [routeInfoTab, setRouteInfoTab] = useState<'info' | 'comparison'>('info');
  const mapRef = useRef<LeafletMap>(null);

  // Campsite state
  const [selectedCampsite, setSelectedCampsite] = useState<Campsite | null>(null);
  const [showCampsiteControls, setShowCampsiteControls] = useState(FeatureFlags.CAMPSITE_DISPLAY);
  const [showCampsiteFilter, setShowCampsiteFilter] = useState(false);
  const [showCampsiteDetails, setShowCampsiteDetails] = useState(false);
  const [showCampsiteRecommendations, setShowCampsiteRecommendations] = useState(false);
  const [campsitesVisible, setCampsitesVisible] = useState(FeatureFlags.CAMPSITE_DISPLAY);
  const [campsiteCount, setCampsiteCount] = useState(0);
  const [campsiteFilterState, setCampsiteFilterState] = useState<CampsiteFilterState>(DEFAULT_FILTER_STATE);
  const [allCampsites, setAllCampsites] = useState<Campsite[]>([]);

  // Route optimization state
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);

  // Cost calculation state
  const [showCostCalculator, setShowCostCalculator] = useState(false);

  // Trip management state
  const [showTripManager, setShowTripManager] = useState(false);

  // Planning tools state
  const [showPlanningTools, setShowPlanningTools] = useState(false);

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

  if (!FeatureFlags.BASIC_MAP_DISPLAY) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-500 mb-2">
            Map Display Disabled
          </h3>
          <p className="text-sm text-gray-400">
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

  const handleMapReady = () => {
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

  // Check if window is mobile size
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={cn(
      "h-full relative transition-all duration-300",
      isFullscreen && "fixed inset-0 z-50 bg-black"
    )}>
      {/* Loading overlay */}
      {!isMapReady && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-3"></div>
            <p className="text-sm text-gray-600">Loading European map...</p>
          </div>
        </div>
      )}

      {/* Map component */}
      <LeafletMapContainer
        ref={mapRef}
        center={center}
        zoom={zoom}
        minZoom={MAP_CONFIG.minZoom}
        maxZoom={MAP_CONFIG.maxZoom}
        maxBounds={MAP_CONFIG.maxBounds}
        maxBoundsViscosity={1.0}
        className={cn(
          'h-full w-full z-map',
          !isMapReady && 'opacity-0'
        )}
        zoomControl={false} // We'll add custom controls
        whenReady={handleMapReady}
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

        {/* Waypoint system */}
        <WaypointManager />

        {/* Campsite layer */}
        {FeatureFlags.CAMPSITE_DISPLAY && (
          <SimpleCampsiteLayer
            visibleTypes={campsiteFilterState.visibleTypes}
            maxResults={campsiteFilterState.maxResults}
            vehicleCompatibleOnly={campsiteFilterState.vehicleCompatibleOnly}
            searchQuery={campsiteFilterState.searchQuery}
            isVisible={campsitesVisible}
            onCampsiteClick={handleCampsiteClick}
            onCampsitesLoaded={handleCampsitesLoaded}
            isMobile={isMobile}
            filterState={showCampsiteFilter ? campsiteFilterState : undefined}
          />
        )}
      </LeafletMapContainer>

      {/* Vehicle Profile Configuration */}
      <VehicleProfileSidebar />

      {/* Route Calculator Panel */}
      {FeatureFlags.BASIC_ROUTING && (
        <div className="absolute top-4 right-20 z-30 w-80">
          <RouteCalculator />
        </div>
      )}

      {/* Campsite Controls Panel */}
      {FeatureFlags.CAMPSITE_DISPLAY && showCampsiteControls && !showCampsiteFilter && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 w-80">
          <CampsiteControls
            visibleTypes={campsiteFilterState.visibleTypes}
            onTypesChange={(types) => setCampsiteFilterState({...campsiteFilterState, visibleTypes: types})}
            maxResults={campsiteFilterState.maxResults}
            onMaxResultsChange={(max) => setCampsiteFilterState({...campsiteFilterState, maxResults: max})}
            vehicleCompatibleOnly={campsiteFilterState.vehicleCompatibleOnly}
            onVehicleCompatibleChange={(compatible) => setCampsiteFilterState({...campsiteFilterState, vehicleCompatibleOnly: compatible})}
            searchQuery={campsiteFilterState.searchQuery}
            onSearchChange={(query) => setCampsiteFilterState({...campsiteFilterState, searchQuery: query})}
            onCampsiteSelect={handleCampsiteClick}
            isVisible={campsitesVisible}
            onVisibilityChange={setCampsitesVisible}
            campsiteCount={campsiteCount}
          />
        </div>
      )}

      {/* Advanced Campsite Filter Panel */}
      {FeatureFlags.CAMPSITE_DISPLAY && showCampsiteFilter && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 w-96">
          <CampsiteFilter
            filterState={campsiteFilterState}
            onFilterChange={setCampsiteFilterState}
            onSearchChange={(query) => setCampsiteFilterState({...campsiteFilterState, searchQuery: query})}
            onCampsiteSelect={handleCampsiteClick}
            campsiteCount={campsiteCount}
          />
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

      {/* Legacy controls for undo/redo and clear (positioned below vehicle profile) */}
      <div className="absolute top-20 left-4 z-30 flex flex-col space-y-2">
        {/* Undo/Redo controls */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className={cn(
              "block w-10 h-10 flex items-center justify-center border-b border-gray-200 transition-colors",
              canUndo()
                ? "hover:bg-gray-50 text-gray-700"
                : "text-gray-300 cursor-not-allowed"
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
              canRedo()
                ? "hover:bg-gray-50 text-gray-700"
                : "text-gray-300 cursor-not-allowed"
            )}
            title="Redo (Ctrl+Y)"
            aria-label="Redo last action"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        {/* Clear waypoints button (show only if waypoints exist) */}
        {waypoints.length > 0 && (
          <button
            onClick={() => setShowConfirmClear(true)}
            className="bg-red-600 text-white rounded-lg shadow-md p-2 hover:bg-red-700 transition-colors"
            title="Clear all waypoints (Ctrl+Shift+C)"
            aria-label="Clear all waypoints"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}

        {/* Route Information Toggle (show only if route exists) */}
        {FeatureFlags.BASIC_ROUTING && calculatedRoute && (
          <button
            onClick={() => setShowRouteInfo(!showRouteInfo)}
            className={cn(
              "bg-blue-600 text-white rounded-lg shadow-md p-2 hover:bg-blue-700 transition-colors",
              showRouteInfo && "bg-blue-700"
            )}
            title="Toggle route information"
            aria-label="Toggle route information"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </button>
        )}

        {/* Campsite Controls Toggle */}
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
              "bg-green-600 text-white rounded-lg shadow-md p-2 hover:bg-green-700 transition-colors",
              (showCampsiteControls || showCampsiteFilter) && "bg-green-700"
            )}
            title={showCampsiteFilter ? "Hide filters" : showCampsiteControls ? "Advanced filters" : "Show campsite controls"}
            aria-label="Toggle campsite controls"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showCampsiteFilter ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  {showCampsiteControls && (
                    <circle cx="12" cy="8" r="1" fill="currentColor" />
                  )}
                </>
              )}
            </svg>
          </button>
        )}

        {/* Route Optimizer Toggle */}
        {FeatureFlags.ROUTE_OPTIMIZATION && waypoints.length >= 3 && (
          <button
            onClick={() => setShowRouteOptimizer(!showRouteOptimizer)}
            className={cn(
              "bg-orange-600 text-white rounded-lg shadow-md p-2 hover:bg-orange-700 transition-colors",
              showRouteOptimizer && "bg-orange-700"
            )}
            title="Route optimization"
            aria-label="Toggle route optimizer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
        )}

        {/* Cost Calculator Toggle */}
        {waypoints.length >= 2 && (
          <button
            onClick={() => setShowCostCalculator(!showCostCalculator)}
            className={cn(
              "bg-emerald-600 text-white rounded-lg shadow-md p-2 hover:bg-emerald-700 transition-colors",
              showCostCalculator && "bg-emerald-700"
            )}
            title="Trip cost calculator"
            aria-label="Toggle cost calculator"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
        )}

        {/* Trip Manager Toggle */}
        <button
          onClick={() => setShowTripManager(!showTripManager)}
          className={cn(
            "bg-indigo-600 text-white rounded-lg shadow-md p-2 hover:bg-indigo-700 transition-colors",
            showTripManager && "bg-indigo-700"
          )}
          title="Trip manager"
          aria-label="Toggle trip manager"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </button>

        {/* Planning Tools Toggle */}
        {waypoints.length >= 2 && (
          <button
            onClick={() => setShowPlanningTools(!showPlanningTools)}
            className={cn(
              "bg-violet-600 text-white rounded-lg shadow-md p-2 hover:bg-violet-700 transition-colors",
              showPlanningTools && "bg-violet-700"
            )}
            title="Trip planning tools"
            aria-label="Toggle planning tools"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h2m0 0h2m-2 0v6a2 2 0 002 2h6a2 2 0 002-2v-6a2 2 0 00-2-2h-2m-2 0V5a2 2 0 00-2-2H9v2z" />
            </svg>
          </button>
        )}

        {/* Campsite Recommendations Toggle */}
        {FeatureFlags.CAMPSITE_DISPLAY && allCampsites.length > 0 && (
          <button
            onClick={handleToggleRecommendations}
            className={cn(
              "bg-purple-600 text-white rounded-lg shadow-md p-2 hover:bg-purple-700 transition-colors",
              showCampsiteRecommendations && "bg-purple-700"
            )}
            title="Toggle campsite recommendations"
            aria-label="Toggle campsite recommendations"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </button>
        )}
      </div>

      {/* Map info overlay - responsive design */}
      <div className="absolute bottom-4 left-4 z-30 hidden sm:block">
        <div className="bg-white bg-opacity-95 rounded-lg shadow-md px-3 py-2 text-xs text-gray-600 animate-fade-in">
          <div className="sm:block hidden">
            Zoom: {zoom} | Center: {center[0].toFixed(4)}, {center[1].toFixed(4)}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-blue-600 font-medium">
              Waypoints: {waypoints.length}
            </span>
            {waypoints.length === 0 ? (
              <span className="text-green-600 text-xs">
                Click map to add
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
          {isValidForRouting() && (
            <div className="mt-1 text-xs text-green-600 font-medium">
              Ready for Phase 3: Routing
            </div>
          )}
        </div>
      </div>

      {/* Mobile-optimized info bar */}
      <div className="absolute bottom-0 left-0 right-0 z-30 sm:hidden">
        <div className="bg-white bg-opacity-95 border-t border-gray-200 px-4 py-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">
              {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''}
            </span>
            {waypoints.length === 0 ? (
              <span className="text-green-600 text-sm font-medium">
                Tap map to start
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
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-gray-200 shadow-xl transform transition-transform sm:translate-x-0">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-3">
              <h2 className="text-lg font-semibold text-gray-900">Route Details</h2>
              {calculatedRoute.alternativeRoutes && calculatedRoute.alternativeRoutes.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  +{calculatedRoute.alternativeRoutes.length} alternatives
                </span>
              )}
            </div>
            <button
              onClick={() => setShowRouteInfo(false)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Close route information"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tab Navigation */}
          {calculatedRoute.alternativeRoutes && calculatedRoute.alternativeRoutes.length > 0 && (
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => setRouteInfoTab('info')}
                className={cn(
                  'flex-1 py-3 px-4 text-sm font-medium transition-colors',
                  routeInfoTab === 'info'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Route Info
              </button>
              <button
                onClick={() => setRouteInfoTab('comparison')}
                className={cn(
                  'flex-1 py-3 px-4 text-sm font-medium transition-colors',
                  routeInfoTab === 'comparison'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                    : 'text-gray-500 hover:text-gray-700'
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
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-gray-200 shadow-xl transform transition-transform sm:translate-x-0">
          <CampsiteDetails
            campsite={selectedCampsite}
            onClose={handleCampsiteDetailsClose}
            className="h-full border-0 rounded-none"
          />
        </div>
      )}

      {/* Campsite Recommendations Panel */}
      {showCampsiteRecommendations && FeatureFlags.CAMPSITE_DISPLAY && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-gray-200 shadow-xl transform transition-transform sm:translate-x-0">
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-purple-50">
              <h2 className="text-lg font-semibold text-gray-900">Campsite Recommendations</h2>
              <button
                onClick={() => setShowCampsiteRecommendations(false)}
                className="p-1 hover:bg-purple-200 rounded transition-colors"
                aria-label="Close recommendations"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Recommendations Content */}
            <div className="flex-1 overflow-hidden">
              <CampsiteRecommendations
                campsites={allCampsites}
                onCampsiteSelect={handleCampsiteClick}
                className="h-full border-0 rounded-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Route Optimizer Panel */}
      {showRouteOptimizer && FeatureFlags.ROUTE_OPTIMIZATION && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-gray-200 shadow-xl transform transition-transform sm:translate-x-0">
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-orange-50">
              <h2 className="text-lg font-semibold text-gray-900">Route Optimizer</h2>
              <button
                onClick={() => setShowRouteOptimizer(false)}
                className="p-1 hover:bg-orange-200 rounded transition-colors"
                aria-label="Close optimizer"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-gray-200 shadow-xl transform transition-transform sm:translate-x-0">
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-emerald-50">
              <h2 className="text-lg font-semibold text-gray-900">Trip Cost Calculator</h2>
              <button
                onClick={() => setShowCostCalculator(false)}
                className="p-1 hover:bg-emerald-200 rounded transition-colors"
                aria-label="Close cost calculator"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-gray-200 shadow-xl transform transition-transform sm:translate-x-0">
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-indigo-50">
              <h2 className="text-lg font-semibold text-gray-900">Trip Manager</h2>
              <button
                onClick={() => setShowTripManager(false)}
                className="p-1 hover:bg-indigo-200 rounded transition-colors"
                aria-label="Close trip manager"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-96 bg-white border-l border-gray-200 shadow-xl transform transition-transform sm:translate-x-0">
          <div className="h-full flex flex-col">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-violet-50">
              <h2 className="text-lg font-semibold text-gray-900">Planning Tools</h2>
              <button
                onClick={() => setShowPlanningTools(false)}
                className="p-1 hover:bg-violet-200 rounded transition-colors"
                aria-label="Close planning tools"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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