// Campsite Icons Configuration
// Phase 4.2: Distinct icons for different campsite types based on OSM tags

import * as L from 'leaflet';
import { type CampsiteType, type Campsite } from '../../services/CampsiteService';

export interface CampsiteIconConfig {
  icon: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  size: number;
  description: string;
}

// SVG icon definitions for different campsite types
const SVG_ICONS = {
  campsite: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 12h3v8h14v-8h3L12 2zm-1 15h-2v-3h2v3zm4 0h-2v-3h2v3z"/></svg>`,
  caravan_site: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 7h-3V6a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v6h2a3 3 0 0 0 6 0h6a3 3 0 0 0 6 0h2V10a3 3 0 0 0-3-3zM6 14a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm12 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/></svg>`,
  aire: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 15c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zm12-2.5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2.5c-.3 0-.5-.2-.5-.5s.2-.5.5-.5.5.2.5.5-.2.5-.5.5zm-4.5-12H11V3H9v2.5H6.5l1.38 1.38C8.51 7.45 9.2 8 10 8h4c.8 0 1.49-.55 1.88-1.38L17.26 5.5H15V3h-2v2.5z"/></svg>`,
  parking: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.5 2h11A1.5 1.5 0 0 1 19 3.5v17a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 20.5v-17A1.5 1.5 0 0 1 6.5 2zM8 8v8h2v-3h2.5a2.5 2.5 0 0 0 0-5H8zm2 2h2.5a.5.5 0 0 1 0 1H10v-1z"/></svg>`,
  unknown: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 0 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>`,
};

// Icon configurations for different campsite types
export const CAMPSITE_ICON_CONFIGS: Record<CampsiteType | 'unknown', CampsiteIconConfig> = {
  campsite: {
    icon: SVG_ICONS.campsite,
    color: '#ffffff',
    backgroundColor: '#27ae60',
    borderColor: '#1a8a4b',
    size: 32,
    description: 'Traditional campsite with tent/caravan pitches',
  },
  caravan_site: {
    icon: SVG_ICONS.caravan_site,
    color: '#ffffff',
    backgroundColor: '#2794a8',
    borderColor: '#1e7a8d',
    size: 32,
    description: 'Caravan and motorhome specific site',
  },
  aire: {
    icon: SVG_ICONS.aire,
    color: '#ffffff',
    backgroundColor: '#7c5cbf',
    borderColor: '#6b47b0',
    size: 32,
    description: 'Aire de service for motorhomes',
  },
  parking: {
    icon: SVG_ICONS.parking,
    color: '#ffffff',
    backgroundColor: '#e9a100',
    borderColor: '#cc7d00',
    size: 32,
    description: 'Parking area with overnight stays allowed',
  },
  unknown: {
    icon: SVG_ICONS.unknown,
    color: '#ffffff',
    backgroundColor: '#6b7785',
    borderColor: '#556170',
    size: 28,
    description: 'Unknown campsite type',
  },
};

// Enhanced icon configs based on specific amenities
export const AMENITY_ENHANCED_CONFIGS: Record<string, Partial<CampsiteIconConfig>> = {
  electricity: {
    borderColor: '#cc7d00',
    backgroundColor: '#e9a100',
  },
  wifi: {
    borderColor: '#1e7a8d',
    backgroundColor: '#2794a8',
  },
  shower: {
    borderColor: '#1a8a4b',
    backgroundColor: '#27ae60',
  },
  toilets: {
    borderColor: '#6b47b0',
    backgroundColor: '#7c5cbf',
  },
  drinking_water: {
    borderColor: '#1e7a8d',
    backgroundColor: '#3eaec2',
  },
};

// Mobile-friendly sizes
export const MOBILE_ICON_CONFIGS = {
  small: 24,
  medium: 32,
  large: 40,
};

export interface CampsiteMarkerOptions {
  campsite: Campsite;
  vehicleCompatible?: boolean;
  isSelected?: boolean;
  isHighlighted?: boolean;
  isInRoute?: boolean;
  isMobile?: boolean;
  size?: 'small' | 'medium' | 'large';
  showTooltip?: boolean;
}

export function createCampsiteIcon(options: CampsiteMarkerOptions): L.DivIcon {
  const {
    campsite,
    vehicleCompatible = true,
    isSelected = false,
    isHighlighted = false,
    isInRoute = false,
    isMobile = false,
    size = 'medium',
    showTooltip = false,
  } = options;

  // Get base config for campsite type
  const baseConfig = CAMPSITE_ICON_CONFIGS[campsite.type] || CAMPSITE_ICON_CONFIGS.unknown;

  // Determine size - larger for selected/highlighted
  let iconSize = isMobile ? MOBILE_ICON_CONFIGS[size] : baseConfig.size;

  if (isSelected || isHighlighted) {
    iconSize = Math.floor(iconSize * 1.2);
  }

  // Determine colors based on compatibility and selection
  let backgroundColor = baseConfig.backgroundColor;
  let borderColor = baseConfig.borderColor;

  if (!vehicleCompatible) {
    backgroundColor = '#e63946';
    borderColor = '#d32535';
  }

  if (isSelected) {
    borderColor = '#f25d2a';
  }

  if (isHighlighted) {
    borderColor = '#2794a8';
  }

  // Enhanced styling based on amenities (only if not incompatible)
  if (vehicleCompatible && campsite.amenities) {
    for (const [amenity, available] of Object.entries(campsite.amenities)) {
      if (available && AMENITY_ENHANCED_CONFIGS[amenity]) {
        const enhancement = AMENITY_ENHANCED_CONFIGS[amenity];
        if (enhancement.backgroundColor) backgroundColor = enhancement.backgroundColor;
        if (enhancement.borderColor) borderColor = enhancement.borderColor;
        break; // Use first matching amenity enhancement
      }
    }
  }

  // Animation class for selected/highlighted markers
  const animationStyle = isSelected
    ? `
    animation: campsite-pulse 1.5s ease-in-out infinite;
  `
    : isHighlighted
      ? `
    animation: campsite-glow 1s ease-in-out infinite;
  `
      : '';

  // Create icon HTML with SVG support
  const svgSize = Math.floor(iconSize * 0.6);

  // Tooltip HTML (campsite name shown on hover via CSS)
  const tooltipHtml =
    showTooltip && campsite.name
      ? `
    <div class="campsite-tooltip" style="
      position: absolute;
      bottom: 100%;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      padding: 4px 8px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      white-space: nowrap;
      font-size: 11px;
      font-weight: 500;
      color: #374151;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
      margin-bottom: 4px;
      z-index: 1000;
    ">${campsite.name.substring(0, 30)}${campsite.name.length > 30 ? '...' : ''}</div>
  `
      : '';

  // "In Route" checkmark badge
  const inRouteBadge = isInRoute
    ? `
    <div style="
      position: absolute;
      top: -4px;
      right: -4px;
      width: 14px;
      height: 14px;
      background: #27ae60;
      border: 2px solid white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    ">
      <svg viewBox="0 0 20 20" fill="white" style="width: 8px; height: 8px;">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
    </div>
  `
    : '';

  // Warning badge for vehicle incompatibility (only show if not in route)
  const warningBadge =
    !vehicleCompatible && !isInRoute
      ? `
    <div style="
      position: absolute;
      top: -2px;
      right: -2px;
      width: 12px;
      height: 12px;
      background: #fef2f2;
      border: 2px solid #d32535;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: bold;
      color: #d32535;
    ">!</div>
  `
      : '';

  // Pin/teardrop shape dimensions - taller than wide with point at bottom
  const pinWidth = iconSize;
  const pinHeight = Math.floor(iconSize * 1.4);
  const iconHtml = `
    <div class="campsite-marker-wrapper" style="
      position: relative;
      width: ${pinWidth}px;
      height: ${pinHeight}px;
      ${animationStyle}
    ">
      ${tooltipHtml}
      <div style="
        position: relative;
        width: ${pinWidth}px;
        height: ${pinHeight}px;
        cursor: pointer;
        filter: drop-shadow(0 3px 4px rgba(0,0,0,0.3));
      ">
        <!-- Pin/teardrop SVG shape -->
        <svg viewBox="0 0 32 44" style="width: 100%; height: 100%;">
          <!-- Main pin shape -->
          <path d="M16 0C7.163 0 0 7.163 0 16c0 12 16 28 16 28s16-16 16-28C32 7.163 24.837 0 16 0z"
                fill="${backgroundColor}"
                stroke="${borderColor}"
                stroke-width="2"/>
          <!-- Inner circle for icon -->
          <circle cx="16" cy="14" r="10" fill="${borderColor}" opacity="0.2"/>
        </svg>
        <!-- Icon container centered in top portion -->
        <div style="
          position: absolute;
          top: ${Math.floor(pinHeight * 0.12)}px;
          left: 50%;
          transform: translateX(-50%);
          width: ${svgSize}px;
          height: ${svgSize}px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${baseConfig.color};
        ">
          ${baseConfig.icon}
        </div>
        ${inRouteBadge}
        ${warningBadge}
      </div>
    </div>
  `;

  return L.divIcon({
    className: `campsite-marker-icon ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isInRoute ? 'in-route' : ''}`,
    html: iconHtml,
    iconSize: [pinWidth, pinHeight],
    iconAnchor: [pinWidth / 2, pinHeight], // Anchor at the bottom point
    popupAnchor: [0, -pinHeight + 10],
  });
}

// Cluster icon creation for marker clustering
export function createClusterIcon(cluster: { getChildCount: () => number }): L.DivIcon {
  const childCount = cluster.getChildCount();
  const size = childCount < 10 ? 30 : childCount < 100 ? 40 : 50;

  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, #27ae60, #1a8a4b);
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
    iconAnchor: [size / 2, size / 2],
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
