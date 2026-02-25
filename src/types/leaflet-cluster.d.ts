// Leaflet marker clustering type definitions
// Phase 4.2: Type declarations for marker clustering functionality

declare module 'leaflet' {
  interface MarkerCluster extends L.Marker {
    getChildCount(): number;
    getAllChildMarkers(): L.Marker[];
  }

  namespace MarkerClusterGroup {
    interface MarkerClusterGroupOptions {
      chunkedLoading?: boolean;
      chunkProgress?: (processed: number, total: number, elapsed: number) => void;
      maxClusterRadius?: number;
      disableClusteringAtZoom?: number;
      spiderfyOnMaxZoom?: boolean;
      showCoverageOnHover?: boolean;
      zoomToBoundsOnClick?: boolean;
      removeOutsideVisibleBounds?: boolean;
      iconCreateFunction?: (cluster: MarkerCluster) => L.DivIcon;
    }
  }

  interface MarkerClusterGroup extends L.FeatureGroup {
    addLayer(layer: L.Layer): this;
    removeLayer(layer: L.Layer): this;
    clearLayers(): this;
    hasLayer(layer: L.Layer): boolean;
    getChildCount(): number;
    getAllChildMarkers(): L.Marker[];
  }

  function markerClusterGroup(
    options?: MarkerClusterGroup.MarkerClusterGroupOptions
  ): MarkerClusterGroup;
}
