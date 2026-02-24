// Tools Menu Component
// Consolidates multiple toolbar buttons into a single dropdown menu
// Part of UX overhaul to reduce visible button count for new users

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wrench,
  Settings2,
  FolderOpen,
  Truck,
  FileText,
  Calendar,
  DollarSign,
  Zap,
  Download,
  Trash2,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface ToolsMenuProps {
  waypointCount: number;
  hasCalculatedRoute: boolean;
  hasRouteOptimization: boolean;
  onToggleTripSettings: () => void;
  onToggleTripManager: () => void;
  onToggleVehicle: () => void;
  onToggleRouteInfo: () => void;
  onTogglePlanningTools: () => void;
  onToggleCostCalculator: () => void;
  onToggleRouteOptimizer: () => void;
  onExportRoute: () => void;
  onClearRoute: () => void;
  activePanels: {
    tripSettings: boolean;
    tripManager: boolean;
    routeInfo: boolean;
    planningTools: boolean;
    costCalculator: boolean;
    routeOptimizer: boolean;
  };
}

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  visible: boolean;
  activeKey?: keyof ToolsMenuProps['activePanels'];
  activeColor?: string;
  activeBg?: string;
  variant?: 'default' | 'danger';
}

const ToolsMenu: React.FC<ToolsMenuProps> = ({
  waypointCount,
  hasCalculatedRoute,
  hasRouteOptimization,
  onToggleTripSettings,
  onToggleTripManager,
  onToggleVehicle,
  onToggleRouteInfo,
  onTogglePlanningTools,
  onToggleCostCalculator,
  onToggleRouteOptimizer,
  onExportRoute,
  onClearRoute,
  activePanels,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const hasAnyActivePanel = Object.values(activePanels).some(Boolean);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen, closeMenu]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeMenu]);

  const handleItemClick = useCallback(
    (onClick: () => void) => {
      onClick();
      closeMenu();
    },
    [closeMenu]
  );

  // Define menu sections with dividers
  const alwaysVisibleItems: MenuItem[] = [
    {
      id: 'trip-settings',
      icon: Settings2,
      label: 'Trip Settings',
      onClick: onToggleTripSettings,
      visible: true,
      activeKey: 'tripSettings',
      activeColor: 'border-sky-500',
      activeBg: 'bg-sky-50/50',
    },
    {
      id: 'trip-manager',
      icon: FolderOpen,
      label: 'Trip Manager',
      onClick: onToggleTripManager,
      visible: true,
      activeKey: 'tripManager',
      activeColor: 'border-indigo-500',
      activeBg: 'bg-indigo-50/50',
    },
    {
      id: 'vehicle-setup',
      icon: Truck,
      label: 'Vehicle Setup',
      onClick: onToggleVehicle,
      visible: true,
    },
  ];

  const routeItems: MenuItem[] = [
    {
      id: 'route-info',
      icon: FileText,
      label: 'Route Info',
      onClick: onToggleRouteInfo,
      visible: hasCalculatedRoute,
      activeKey: 'routeInfo',
      activeColor: 'border-blue-500',
      activeBg: 'bg-blue-50/50',
    },
    {
      id: 'planning-tools',
      icon: Calendar,
      label: 'Planning Tools',
      onClick: onTogglePlanningTools,
      visible: waypointCount >= 2,
      activeKey: 'planningTools',
      activeColor: 'border-violet-500',
      activeBg: 'bg-violet-50/50',
    },
    {
      id: 'cost-calculator',
      icon: DollarSign,
      label: 'Cost Calculator',
      onClick: onToggleCostCalculator,
      visible: waypointCount >= 2,
      activeKey: 'costCalculator',
      activeColor: 'border-emerald-500',
      activeBg: 'bg-emerald-50/50',
    },
    {
      id: 'route-optimizer',
      icon: Zap,
      label: 'Route Optimizer',
      onClick: onToggleRouteOptimizer,
      visible: waypointCount >= 3 && hasRouteOptimization,
      activeKey: 'routeOptimizer',
      activeColor: 'border-orange-500',
      activeBg: 'bg-orange-50/50',
    },
    {
      id: 'export-route',
      icon: Download,
      label: 'Export Route',
      onClick: onExportRoute,
      visible: hasCalculatedRoute,
    },
  ];

  const dangerItems: MenuItem[] = [
    {
      id: 'clear-route',
      icon: Trash2,
      label: 'Clear Route',
      onClick: onClearRoute,
      visible: waypointCount > 0,
      variant: 'danger',
    },
  ];

  const visibleRouteItems = routeItems.filter((item) => item.visible);
  const visibleDangerItems = dangerItems.filter((item) => item.visible);

  const renderItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = item.activeKey ? activePanels[item.activeKey] : false;
    const isDanger = item.variant === 'danger';

    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item.onClick)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 text-sm cursor-pointer transition-colors w-full text-left',
          isDanger
            ? 'text-red-600 hover:bg-red-50'
            : 'text-neutral-700 hover:bg-neutral-50',
          isActive && item.activeColor && `border-l-[3px] ${item.activeColor}`,
          isActive && item.activeBg,
          isActive && 'pl-[9px]', // compensate for 3px border to keep alignment
          !isActive && 'border-l-[3px] border-transparent pl-[9px]' // invisible border for alignment
        )}
        role="menuitem"
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span>{item.label}</span>
      </button>
    );
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className={cn(
          'w-10 h-10 flex items-center justify-center rounded-lg transition-colors',
          'bg-white/90 backdrop-blur-sm shadow-medium hover:bg-neutral-50',
          isOpen && 'bg-neutral-100',
          hasAnyActivePanel && 'ring-2 ring-blue-400 ring-offset-1'
        )}
        title="Tools"
        aria-label="Tools menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <Wrench className="w-4 h-4" />
        {hasAnyActivePanel && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute left-12 top-0 z-50 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 min-w-[200px]"
          role="menu"
          aria-label="Tools"
        >
          {/* Always-visible items */}
          {alwaysVisibleItems.map(renderItem)}

          {/* Divider before route items (only if there are visible route items) */}
          {visibleRouteItems.length > 0 && (
            <div className="border-t border-neutral-100 my-1" role="separator" />
          )}

          {/* Route-dependent items */}
          {visibleRouteItems.map(renderItem)}

          {/* Divider before danger items (only if there are visible danger items) */}
          {visibleDangerItems.length > 0 && (
            <div className="border-t border-neutral-100 my-1" role="separator" />
          )}

          {/* Danger items */}
          {visibleDangerItems.map(renderItem)}
        </div>
      )}
    </div>
  );
};

export default ToolsMenu;
