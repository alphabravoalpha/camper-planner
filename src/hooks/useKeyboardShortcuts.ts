// Keyboard Shortcuts Hook
// Global keyboard shortcuts for waypoint operations

import { useEffect } from 'react';
import { useRouteStore } from '../store';

interface KeyboardShortcuts {
  'ctrl+z': () => void;
  'ctrl+y': () => void;
  'ctrl+shift+z': () => void;
  delete: () => void;
  backspace: () => void;
  escape: () => void;
  'ctrl+a': () => void;
  'ctrl+shift+c': () => void;
}

export const useKeyboardShortcuts = () => {
  const { undo, redo, canUndo, canRedo, clearRoute, waypoints, isValidForRouting } =
    useRouteStore();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement)?.contentEditable === 'true'
      ) {
        return;
      }

      const shortcuts: KeyboardShortcuts = {
        'ctrl+z': () => {
          if (canUndo()) {
            event.preventDefault();
            undo();
          }
        },
        'ctrl+y': () => {
          if (canRedo()) {
            event.preventDefault();
            redo();
          }
        },
        'ctrl+shift+z': () => {
          if (canRedo()) {
            event.preventDefault();
            redo();
          }
        },
        delete: () => {
          // Delete all waypoints with confirmation would be handled by UI
        },
        backspace: () => {
          // Same as delete
        },
        escape: () => {
          // Clear selection or close modals - handled by individual components
        },
        'ctrl+a': () => {
          // Select all waypoints - could be used for batch operations in future
          event.preventDefault();
        },
        'ctrl+shift+c': () => {
          // Clear all waypoints
          if (waypoints.length > 0) {
            event.preventDefault();
          }
        },
      };

      const getShortcutKey = (event: KeyboardEvent): string => {
        const parts: string[] = [];

        if (event.ctrlKey || event.metaKey) parts.push('ctrl');
        if (event.shiftKey) parts.push('shift');
        if (event.altKey) parts.push('alt');

        parts.push(event.key.toLowerCase());

        return parts.join('+');
      };

      const shortcutKey = getShortcutKey(event);
      const handler = shortcuts[shortcutKey as keyof KeyboardShortcuts];

      if (handler) {
        handler();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo, clearRoute, waypoints, isValidForRouting]);

  // Return shortcut info for display in UI
  return {
    shortcuts: [
      { key: 'Ctrl+Z', description: 'Undo last action', available: canUndo() },
      { key: 'Ctrl+Y', description: 'Redo last action', available: canRedo() },
      { key: 'Ctrl+Shift+Z', description: 'Redo last action', available: canRedo() },
      { key: 'Delete', description: 'Delete selected waypoint', available: waypoints.length > 0 },
      { key: 'Ctrl+Shift+C', description: 'Clear all waypoints', available: waypoints.length > 0 },
      { key: 'Escape', description: 'Close dialogs/deselect', available: true },
    ],
    isValidForRouting: isValidForRouting(),
  };
};
