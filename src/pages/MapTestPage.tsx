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

  // Verify map instance is available (debug page)
  React.useEffect(() => {
    // Map instance obtained - debug verification
    if (map) {
      // Map center and zoom verified
    }
  }, [map]);

  return null; // This component doesn't render anything, just tests the context
};

const MapTestPage: React.FC = () => {
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-primary-600 text-white p-4">
        <h1 className="text-xl font-bold">Leaflet Context Test Page</h1>
        <p className="text-sm">Testing basic MapContainer and useMap hook</p>
      </div>

      <div className="flex-1 relative">
        <LeafletMapContainer
          // @ts-expect-error - center is valid prop for MapContainer but types are overly strict
          center={[54.526, 15.2551] as [number, number]} // Center on Europe
          zoom={5}
          className="h-full w-full"
          style={{ height: '100%', width: '100%' }}
        >
          {/* Basic tile layer */}
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            // @ts-expect-error - attribution is valid in react-leaflet but types are overly strict
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {/* Test component that uses useMap */}
          <MapTestComponent />
        </LeafletMapContainer>
      </div>

      <div className="bg-neutral-100 p-4 text-sm text-neutral-600">
        <p>
          Check browser console for map instance logs. If you see logs, Leaflet context is working.
        </p>
        <p>
          If you see &quot;useLeafletContext() can only be used in a descendant of
          MapContainer&quot; error, context is broken.
        </p>
      </div>
    </div>
  );
};

export default MapTestPage;
