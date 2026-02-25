// Type declarations for Leaflet and plugins

declare module 'leaflet.markercluster' {
  import * as L from 'leaflet';

  namespace L {
    function markerClusterGroup(options?: Record<string, unknown>): L.LayerGroup;
  }
}

// Temporary type declarations while fixing build
declare module 'leaflet' {
  export interface DivIconOptions {
    html?: string | HTMLElement;
    iconSize?: [number, number];
    iconAnchor?: [number, number];
    popupAnchor?: [number, number];
    className?: string;
  }

  export class DivIcon {
    constructor(options?: DivIconOptions);
    options: DivIconOptions;
  }

  export class LatLngBounds {
    getNorth(): number;
    getSouth(): number;
    getEast(): number;
    getWest(): number;
    contains(latlng: LatLng | [number, number]): boolean;
    extend(latlng: LatLng | [number, number]): this;
    pad(ratio: number): LatLngBounds;
    intersects(bounds: LatLngBounds): boolean;
  }

  export class Map {
    setView(center: [number, number], zoom: number, options?: Record<string, unknown>): this;
    getBounds(): LatLngBounds;
    addLayer(layer: Layer): this;
    removeLayer(layer: Layer): this;
    hasLayer(layer: Layer): boolean;
    getCenter(): LatLng;
    getZoom(): number;
    setZoom(zoom: number, options?: Record<string, unknown>): this;
    zoomIn(delta?: number): this;
    zoomOut(delta?: number): this;
    fitBounds(bounds: LatLngBounds, options?: Record<string, unknown>): this;
    latLngToContainerPoint(latlng: LatLng | [number, number]): Point;
    on(type: string, fn: (...args: unknown[]) => void): this;
    off(type: string, fn?: (...args: unknown[]) => void): this;
  }

  export function divIcon(options?: DivIconOptions): DivIcon;
  export function marker(latlng: [number, number], options?: Record<string, unknown>): Marker;
  export function latLng(latitude: number, longitude: number, altitude?: number): LatLng;
  export function latLngBounds(corner1: [number, number], corner2: [number, number]): LatLngBounds;
  export function latLngBounds(latlngs: [number, number][]): LatLngBounds;

  export class LatLng {
    lat: number;
    lng: number;
    altitude?: number;
    constructor(latitude: number, longitude: number, altitude?: number);
    equals(other: LatLng): boolean;
    toString(): string;
  }

  const Icon: {
    Default: {
      mergeOptions(options: Record<string, unknown>): void;
    };
  };
}
