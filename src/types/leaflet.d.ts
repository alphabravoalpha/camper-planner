// Type declarations for Leaflet and plugins

declare module 'leaflet.markercluster' {
  import * as L from 'leaflet';

  namespace L {
    function markerClusterGroup(options?: any): any;
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
    contains(latlng: any): boolean;
    extend(latlng: any): this;
    pad(ratio: number): LatLngBounds;
    intersects(bounds: LatLngBounds): boolean;
  }

  export class Map {
    setView(center: [number, number], zoom: number, options?: any): this;
    getBounds(): LatLngBounds;
    addLayer(layer: any): this;
    removeLayer(layer: any): this;
    hasLayer(layer: any): boolean;
    getCenter(): any;
    getZoom(): number;
    setZoom(zoom: number, options?: any): this;
    zoomIn(delta?: number): this;
    zoomOut(delta?: number): this;
    fitBounds(bounds: LatLngBounds, options?: any): this;
    latLngToContainerPoint(latlng: any): any;
    on(type: string, fn: (...args: unknown[]) => void): this;
    off(type: string, fn?: (...args: unknown[]) => void): this;
  }

  export function divIcon(options?: DivIconOptions): DivIcon;
  export function marker(latlng: [number, number], options?: any): any;
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
      mergeOptions(options: any): void;
    };
  };
}