// Confirmation Dialog Component
// Reusable modal for confirmation actions

import React from 'react';
import { cn } from '../../utils/cn';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onCancel
}) => {
  // Handle keyboard events - must be called before any early returns
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Enter') {
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) return null;

  const confirmButtonClass = cn(
    'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
    {
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': confirmVariant === 'danger',
      'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500': confirmVariant === 'primary',
      'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500': confirmVariant === 'warning',
    }
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">
              {title}
            </h3>
            <button
              onClick={onCancel}
              className="text-neutral-400 hover:text-neutral-600 p-1 rounded transition-colors"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-neutral-600 text-sm leading-relaxed">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={confirmButtonClass}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;