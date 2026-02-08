// Context Menu Component
// Right-click context menu for waypoints

import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'danger' | 'primary';
  shortcut?: string;
}

interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  isOpen,
  position,
  items,
  onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Position menu within viewport
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const rect = menu.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let { x, y } = position;

    // Adjust horizontal position
    if (x + rect.width > viewport.width) {
      x = viewport.width - rect.width - 10;
    }

    // Adjust vertical position
    if (y + rect.height > viewport.height) {
      y = viewport.height - rect.height - 10;
    }

    menu.style.left = `${Math.max(10, x)}px`;
    menu.style.top = `${Math.max(10, y)}px`;
  }, [isOpen, position]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-48 bg-white border border-neutral-200 rounded-lg shadow-lg py-2 animate-fade-in"
      style={{ left: position.x, top: position.y }}
    >
      {items.map((item) => {
        const itemClass = cn(
          'flex items-center justify-between px-4 py-2 text-sm cursor-pointer transition-colors',
          {
            'text-neutral-700 hover:bg-neutral-50': item.variant === 'default' || !item.variant,
            'text-red-600 hover:bg-red-50': item.variant === 'danger',
            'text-primary-600 hover:bg-primary-50': item.variant === 'primary',
            'text-neutral-400 cursor-not-allowed': item.disabled,
          }
        );

        return (
          <button
            key={item.id}
            className={itemClass}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
          >
            <div className="flex items-center space-x-3">
              {item.icon && (
                <span className="flex-shrink-0">
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </div>
            {item.shortcut && (
              <span className="text-xs text-neutral-400 ml-4">
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;