// Map Layer Control Component
// Phase 2.3: Multiple tile layer switching with fallback support

import React, { useState, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { useUIStore } from '../../store';

// Tile layer configurations from data sources spec
export interface TileLayerConfig {
  id: string;
  name: string;
  description: string;
  url: string;
  attribution: string;
  maxZoom: number;
  subdomains?: string[];
  category: 'standard' | 'topographic' | 'outdoor' | 'satellite';
  icon: string;
}

export const TILE_LAYERS: TileLayerConfig[] = [
  {
    id: 'openstreetmap',
    name: 'OpenStreetMap',
    description: 'Standard street map',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
    category: 'standard',
    icon: '🗺️'
  },
  {
    id: 'opentopomap',
    name: 'OpenTopoMap',
    description: 'Topographic map with contours',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: © <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
    maxZoom: 15,
    subdomains: ['a', 'b', 'c'],
    category: 'topographic',
    icon: '🏔️'
  },
  {
    id: 'cyclosm',
    name: 'CyclOSM',
    description: 'Cycling-focused map',
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. Tiles style by <a href="https://www.cyclosm.org">CyclOSM</a> hosted by <a href="https://openstreetmap.fr">OpenStreetMap France</a>',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
    category: 'outdoor',
    icon: '🚴'
  },
  {
    id: 'humanitarian',
    name: 'Humanitarian',
    description: 'Clear, humanitarian mapping style',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors. Tiles style by <a href="https://www.hotosm.org">Humanitarian OpenStreetMap Team</a> hosted by <a href="https://openstreetmap.fr">OpenStreetMap France</a>',
    maxZoom: 19,
    subdomains: ['a', 'b'],
    category: 'standard',
    icon: '🏥'
  }
];

interface MapLayerControlProps {
  currentLayerId: string;
  onLayerChange: (layerId: string) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const MapLayerControl: React.FC<MapLayerControlProps> = ({
  currentLayerId,
  onLayerChange,
  collapsed = false,
  onToggleCollapse
}) => {
  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleLayerChange = useCallback(async (layerId: string) => {
    if (layerId === currentLayerId) return;

    setIsLoading(layerId);

    try {
      // Test tile load before switching
      const layer = TILE_LAYERS.find(l => l.id === layerId);
      if (!layer) throw new Error('Layer not found');

      // Create a test tile to verify the layer works
      const testTileUrl = layer.url
        .replace('{s}', layer.subdomains?.[0] || '')
        .replace('{z}', '5')
        .replace('{x}', '16')
        .replace('{y}', '10');

      const img = new Image();

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = testTileUrl;

        // Timeout after 5 seconds
        setTimeout(() => reject(new Error('Tile load timeout')), 5000);
      });

      onLayerChange(layerId);

      addNotification({
        type: 'success',
        message: `Switched to ${layer.name} map layer`
      });
    } catch (error) {
      addNotification({
        type: 'error',
        message: `Failed to load ${TILE_LAYERS.find(l => l.id === layerId)?.name} layer`
      });
    } finally {
      setIsLoading(null);
    }
  }, [currentLayerId, onLayerChange, addNotification]);

  const currentLayer = TILE_LAYERS.find(l => l.id === currentLayerId);

  if (collapsed) {
    return (
      <>
        {/* Tile Layer */}
        {currentLayer && (
          <TileLayer
            key={currentLayer.id}
            url={currentLayer.url}
            attribution={currentLayer.attribution}
            subdomains={currentLayer.subdomains}
            maxZoom={currentLayer.maxZoom}
            detectRetina={true}
            updateWhenIdle={true}
            updateWhenZooming={false}
            keepBuffer={4}
          />
        )}

        {/* Collapsed Control */}
        <div className="absolute top-4 left-4 z-30 bg-white rounded-lg shadow-md">
          <button
            onClick={onToggleCollapse}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 transition-colors rounded-lg"
            title={`Current: ${currentLayer?.name || 'Unknown'}`}
            aria-label="Open layer control"
          >
            <span className="text-lg">{currentLayer?.icon || '🗺️'}</span>
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Tile Layer */}
      {currentLayer && (
        <TileLayer
          key={currentLayer.id}
          url={currentLayer.url}
          attribution={currentLayer.attribution}
          subdomains={currentLayer.subdomains}
          maxZoom={currentLayer.maxZoom}
          detectRetina={true}
          updateWhenIdle={true}
          updateWhenZooming={false}
          keepBuffer={4}
        />
      )}

      {/* Expanded Control */}
      <div className="absolute top-4 left-4 z-30 bg-white rounded-lg shadow-md overflow-hidden min-w-64">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-900 text-sm">Map Layers</h3>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors"
            aria-label="Collapse layer control"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Layer Options */}
      <div className="p-2 space-y-1">
        {TILE_LAYERS.map((layer) => {
          const isActive = layer.id === currentLayerId;
          const isLoadingThis = isLoading === layer.id;

          return (
            <button
              key={layer.id}
              onClick={() => handleLayerChange(layer.id)}
              disabled={isLoadingThis}
              className={cn(
                'w-full flex items-center space-x-3 p-2 rounded-lg text-left transition-all',
                isActive
                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                  : 'hover:bg-gray-50 text-gray-700',
                isLoadingThis && 'opacity-50 cursor-wait'
              )}
            >
              <div className="flex-shrink-0">
                {isLoadingThis ? (
                  <div className="w-6 h-6 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  </div>
                ) : (
                  <span className="text-lg">{layer.icon}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{layer.name}</span>
                  {isActive && (
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-gray-500 truncate">{layer.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Current Layer Info */}
      {currentLayer && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <div className="text-xs text-gray-600">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">Current Layer</span>
              <span className="text-blue-600">{currentLayer.name}</span>
            </div>
            <div className="text-gray-500">
              Max Zoom: {currentLayer.maxZoom}x • Category: {currentLayer.category}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default MapLayerControl;