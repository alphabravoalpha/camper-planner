// Campsite Icons Configuration
// Phase 4.2: Distinct icons for different campsite types based on OSM tags

import L from 'leaflet';
import { CampsiteType } from '../../services/CampsiteService';
import { UICampsite } from '../../adapters/CampsiteAdapter';

export interface CampsiteIconConfig {
  icon: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  size: number;
  description: string;
}

// Icon configurations for different campsite types
export const CAMPSITE_ICON_CONFIGS: Record<CampsiteType | 'unknown', CampsiteIconConfig> = {
  campsite: {
    icon: '⛺',
    color: '#ffffff',
    backgroundColor: '#22c55e',
    borderColor: '#16a34a',
    size: 32,
    description: 'Traditional campsite with tent/caravan pitches'
  },
  caravan_site: {
    icon: '🚐',
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    borderColor: '#2563eb',
    size: 32,
    description: 'Caravan and motorhome specific site'
  },
  aire: {
    icon: '🅿️',
    color: '#ffffff',
    backgroundColor: '#8b5cf6',
    borderColor: '#7c3aed',
    size: 32,
    description: 'Aire de service for motorhomes'
  },
  unknown: {
    icon: '📍',
    color: '#ffffff',
    backgroundColor: '#6b7280',
    borderColor: '#4b5563',
    size: 28,
    description: 'Unknown campsite type'
  }
};

// Enhanced icon configs based on specific amenities
export const AMENITY_ENHANCED_CONFIGS: Record<string, Partial<CampsiteIconConfig>> = {
  'electricity': {
    borderColor: '#fbbf24',
    backgroundColor: '#f59e0b'
  },
  'wifi': {
    borderColor: '#06b6d4',
    backgroundColor: '#0891b2'
  },
  'shower': {
    borderColor: '#2dd4bf',
    backgroundColor: '#14b8a6'
  },
  'toilets': {
    borderColor: '#a78bfa',
    backgroundColor: '#8b5cf6'
  },
  'drinking_water': {
    borderColor: '#60a5fa',
    backgroundColor: '#3b82f6'
  }
};

// Mobile-friendly sizes
export const MOBILE_ICON_CONFIGS = {
  small: 24,
  medium: 32,
  large: 40
};

export interface CampsiteMarkerOptions {
  campsite: UICampsite;
  vehicleCompatible?: boolean;
  isSelected?: boolean;
  isMobile?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function createCampsiteIcon(options: CampsiteMarkerOptions): L.DivIcon {
  const { campsite, vehicleCompatible = true, isSelected = false, isMobile = false, size = 'medium' } = options;

  // Get base config for campsite type
  const baseConfig = CAMPSITE_ICON_CONFIGS[campsite.type] || CAMPSITE_ICON_CONFIGS.unknown;

  // Determine size
  const iconSize = isMobile ?
    MOBILE_ICON_CONFIGS[size] :
    baseConfig.size;

  // Determine colors based on compatibility and selection
  let backgroundColor = baseConfig.backgroundColor;
  let borderColor = baseConfig.borderColor;

  if (!vehicleCompatible) {
    backgroundColor = '#ef4444';
    borderColor = '#dc2626';
  }

  if (isSelected) {
    borderColor = '#f59e0b';
  }

  // Enhanced styling based on amenities
  if (campsite.amenities) {
    for (const [amenity, available] of Object.entries(campsite.amenities)) {
      if (available && AMENITY_ENHANCED_CONFIGS[amenity]) {
        const enhancement = AMENITY_ENHANCED_CONFIGS[amenity];
        if (enhancement.backgroundColor) backgroundColor = enhancement.backgroundColor;
        if (enhancement.borderColor) borderColor = enhancement.borderColor;
        break; // Use first matching amenity enhancement
      }
    }
  }

  // Create icon HTML
  const iconHtml = `
    <div style="
      width: ${iconSize}px;
      height: ${iconSize}px;
      background: ${backgroundColor};
      border: 3px solid ${borderColor};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${Math.floor(iconSize * 0.5)}px;
      color: ${baseConfig.color};
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      ${isSelected ? 'transform: scale(1.2);' : ''}
    ">
      ${baseConfig.icon}
      ${!vehicleCompatible ? '<div style="position: absolute; top: -2px; right: -2px; width: 8px; height: 8px; background: #fee2e2; border: 1px solid #dc2626; border-radius: 50%; font-size: 6px; display: flex; align-items: center; justify-content: center; color: #dc2626;">!</div>' : ''}
    </div>
  `;

  return L.divIcon({
    className: 'campsite-marker-icon',
    html: iconHtml,
    iconSize: [iconSize, iconSize],
    iconAnchor: [iconSize / 2, iconSize / 2],
    popupAnchor: [0, -iconSize / 2]
  });
}

// Cluster icon creation for marker clustering
export function createClusterIcon(cluster: any): L.DivIcon {
  const childCount = cluster.getChildCount();
  const size = childCount < 10 ? 30 : childCount < 100 ? 40 : 50;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, #22c55e, #16a34a);
        border: 3px solid #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${Math.floor(size * 0.3)}px;
        font-weight: bold;
        color: white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
      ">
        ${childCount}
      </div>
    `,
    className: 'campsite-cluster-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
}

// Get icon config for campsite type
export function getIconConfig(type: CampsiteType): CampsiteIconConfig {
  return CAMPSITE_ICON_CONFIGS[type] || CAMPSITE_ICON_CONFIGS.unknown;
}

// Determine campsite type from OSM tags
export function determineCampsiteType(osmTags: Record<string, string>): CampsiteType {
  // Check for aire de service
  if (osmTags.amenity === 'parking' && osmTags.motorhome === 'yes') {
    return 'aire';
  }

  // Check for caravan site
  if (osmTags.tourism === 'caravan_site') {
    return 'caravan_site';
  }

  // Check for general campsite
  if (osmTags.tourism === 'camp_site') {
    return 'campsite';
  }

  // Check for parking with camping allowed
  if (osmTags.amenity === 'parking' && osmTags.camping === 'yes') {
    return 'campsite';
  }

  // Default to campsite for tourism-related tags
  if (osmTags.tourism) {
    return 'campsite';
  }

  return 'campsite'; // Default fallback
}