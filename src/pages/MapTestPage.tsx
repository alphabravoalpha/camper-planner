// Minimal Map Test Page
// Test basic Leaflet context functionality

import React from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, useMap } from 'react-leaflet';
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

// Simple test component that uses useMap hook
const MapTestComponent: React.FC = () => {
  const map = useMap();

  // Log map instance to console
  React.useEffect(() => {
    console.log('MapTestComponent: Map instance obtained:', map);
    if (map) {
      console.log('MapTestComponent: Map center:', map.getCenter());
      console.log('MapTestComponent: Map zoom:', map.getZoom());
    }
  }, [map]);

  return null; // This component doesn't render anything, just tests the context
};

const MapTestPage: React.FC = () => {
  console.log('MapTestPage: Rendering...');

  return (
    <div className="h-screen flex flex-col">
      <div className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">Leaflet Context Test Page</h1>
        <p className="text-sm">Testing basic MapContainer and useMap hook</p>
      </div>

      <div className="flex-1 relative">
        <LeafletMapContainer
          center={[54.5260, 15.2551]} // Center on Europe
          zoom={5}
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          {/* Basic tile layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Test component that uses useMap */}
          <MapTestComponent />
        </LeafletMapContainer>
      </div>

      <div className="bg-gray-100 p-4 text-sm text-gray-600">
        <p>Check browser console for map instance logs. If you see logs, Leaflet context is working.</p>
        <p>If you see "useLeafletContext() can only be used in a descendant of MapContainer" error, context is broken.</p>
      </div>
    </div>
  );
};

export default MapTestPage;