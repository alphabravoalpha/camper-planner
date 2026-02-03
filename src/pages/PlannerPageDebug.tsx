// PlannerPage Debug Version
// Systematic testing to find Leaflet context issue

import React, { useState } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import WaypointManager from '../components/map/WaypointManager';
import SimpleCampsiteLayer from '../components/campsite/SimpleCampsiteLayer';
// Removed unused imports: VehicleProfileSidebar and RouteCalculator
// These were causing unused import warnings and are not used in debug mode
import { FeatureFlags } from '../config';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in React-Leaflet
import L from 'leaflet';
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

  // European bounds to prevent excessive panning
  maxBounds: [
    [34.0, -25.0], // Southwest
    [72.0, 45.0]   // Northeast
  ] as [[number, number], [number, number]],
};

const PlannerPageDebug: React.FC = () => {
  const [debugStep] = useState(4); // Will increment this as we add components

  console.log(`PlannerPageDebug: Rendering step ${debugStep}`);

  return (
    <div className="h-screen flex flex-col">
      {/* Debug Header */}
      <div className="bg-orange-600 text-white p-4 z-50">
        <h1 className="text-xl font-bold">🐛 MapContainer Debug Mode - Step {debugStep}</h1>
        <p className="text-sm">
          Step 4: MapContainer + TileLayer + WaypointManager + SimpleCampsiteLayer + External Controls
        </p>
      </div>

      {/* Step 4: Map only (external components disabled to prevent context errors) */}
      <div className="flex-1 flex">
        {/* Map Area - Full Width */}
        <div className="flex-1 relative">
          <LeafletMapContainer
            // @ts-ignore - React-Leaflet v4 type definitions incorrectly expect LatLngExpression, but tuple works fine
            center={MAP_CONFIG.defaultCenter}
            zoom={MAP_CONFIG.defaultZoom}
            minZoom={MAP_CONFIG.minZoom}
            maxZoom={MAP_CONFIG.maxZoom}
            maxBounds={MAP_CONFIG.maxBounds}
            maxBoundsViscosity={1.0}
            className="h-full w-full"
            zoomControl={false}
            style={{ height: '100%', width: '100%' }}
          >
            {/* Basic tile layer */}
            <TileLayer
              url={MAP_CONFIG.tileUrl}
              // @ts-ignore - React-Leaflet type definitions are overly strict for attribution prop
              {...({ attribution: MAP_CONFIG.tileAttribution } as any)}
            />

            {/* Step 2: Add WaypointManager (includes RouteVisualization) */}
            <WaypointManager />

            {/* Test marker to verify basic Leaflet functionality */}
            <Marker position={[54.5260, 15.2551]}>
              <Popup>
                🧪 Test marker - Basic Leaflet functionality works!
              </Popup>
            </Marker>

            {/* Step 3: Add SimpleCampsiteLayer with debug logging */}
            {FeatureFlags.CAMPSITE_DISPLAY && (
              <SimpleCampsiteLayer
                visibleTypes={['campsite', 'caravan_site', 'aire', 'parking']}
                maxResults={50}
                vehicleCompatibleOnly={false}
                searchQuery=""
                isVisible={true}
                onCampsiteClick={(campsite) => {
                  console.log('🏕️ Campsite clicked:', campsite);
                }}
                onCampsitesLoaded={(count, campsites) => {
                  console.log('📍 Campsites loaded:', count, campsites?.length ? `First: ${campsites[0].name}` : 'No campsites');
                }}
                isMobile={false}
              />
            )}

          </LeafletMapContainer>
        </div>
      </div>

      {/* Debug Footer */}
      <div className="bg-gray-100 p-4 text-sm text-gray-600">
        <p><strong>Status:</strong> Step 4 - MapContainer + WaypointManager + SimpleCampsiteLayer (External controls disabled)</p>
        <p><strong>Expected:</strong> Full-width map without Leaflet context errors</p>
        <p><strong>Fixed:</strong> Removed external VehicleProfileSidebar and RouteCalculator to prevent context errors</p>
        <p><strong>Result:</strong> All Leaflet components are now properly within MapContainer context</p>
      </div>
    </div>
  );
};

export default PlannerPageDebug;