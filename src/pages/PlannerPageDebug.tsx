// PlannerPage Debug Version
// Systematic testing to find Leaflet context issue

import React, { useState } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer } from 'react-leaflet';
import WaypointManager from '../components/map/WaypointManager';
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
  const [debugStep] = useState(2); // Will increment this as we add components

  console.log(`PlannerPageDebug: Rendering step ${debugStep}`);

  return (
    <div className="h-screen flex flex-col">
      {/* Debug Header */}
      <div className="bg-orange-600 text-white p-4 z-50">
        <h1 className="text-xl font-bold">🐛 MapContainer Debug Mode - Step {debugStep}</h1>
        <p className="text-sm">
          Step 2: MapContainer + TileLayer + WaypointManager (includes RouteVisualization)
        </p>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <LeafletMapContainer
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
            attribution={MAP_CONFIG.tileAttribution}
          />

          {/* Step 2: Add WaypointManager (includes RouteVisualization) */}
          <WaypointManager />

        </LeafletMapContainer>
      </div>

      {/* Debug Footer */}
      <div className="bg-gray-100 p-4 text-sm text-gray-600">
        <p><strong>Status:</strong> Step 2 - MapContainer + TileLayer + WaypointManager</p>
        <p><strong>Expected:</strong> Map with click-to-add waypoints functionality</p>
        <p><strong>Next:</strong> Will add SimpleCampsiteLayer in Step 3</p>
        <p><strong>Note:</strong> WaypointManager includes RouteVisualization component</p>
      </div>
    </div>
  );
};

export default PlannerPageDebug;