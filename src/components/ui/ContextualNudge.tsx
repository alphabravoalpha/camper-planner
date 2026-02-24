import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ContextualNudgeProps {
  /** Unique key for localStorage persistence */
  nudgeId: string;
  /** The nudge message */
  message: string;
  /** Whether the trigger condition is met */
  show: boolean;
  /** Auto-dismiss after N ms (default 8000) */
  autoDismissMs?: number;
}

function getStorageKey(nudgeId: string): string {
  return `nudge-dismissed-${nudgeId}`;
}

function isDismissed(nudgeId: string): boolean {
  try {
    return !!localStorage.getItem(getStorageKey(nudgeId));
  } catch {
    return false;
  }
}

function markDismissed(nudgeId: string): void {
  try {
    localStorage.setItem(getStorageKey(nudgeId), '1');
  } catch {
    // localStorage may be full or unavailable; silently ignore
  }
}

export default function ContextualNudge({
  nudgeId,
  message,
  show,
  autoDismissMs = 8000,
}: ContextualNudgeProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(() => isDismissed(nudgeId));
  const showDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check localStorage when nudgeId changes
  useEffect(() => {
    setDismissed(isDismissed(nudgeId));
  }, [nudgeId]);

  // Handle show/hide with delay
  useEffect(() => {
    // Clear any pending show delay
    if (showDelayRef.current) {
      clearTimeout(showDelayRef.current);
      showDelayRef.current = null;
    }

    if (show && !dismissed) {
      // Brief delay before showing to avoid jarring appearance
      showDelayRef.current = setTimeout(() => {
        setVisible(true);
      }, 500);
    } else {
      setVisible(false);
    }

    return () => {
      if (showDelayRef.current) {
        clearTimeout(showDelayRef.current);
      }
    };
  }, [show, dismissed]);

  // Auto-dismiss timer
  useEffect(() => {
    if (autoDismissRef.current) {
      clearTimeout(autoDismissRef.current);
      autoDismissRef.current = null;
    }

    if (visible) {
      autoDismissRef.current = setTimeout(() => {
        dismiss();
      }, autoDismissMs);
    }

    return () => {
      if (autoDismissRef.current) {
        clearTimeout(autoDismissRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, autoDismissMs]);

  function dismiss() {
    markDismissed(nudgeId);
    setDismissed(true);
    setVisible(false);
  }

  if (!visible || dismissed) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        'fixed bottom-24 left-1/2 -translate-x-1/2 z-30 ' +
        'bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-neutral-200 ' +
        'px-4 py-3 max-w-md flex items-center gap-3 ' +
        'animate-slide-up motion-reduce:animate-none'
      }
    >
      <span className="text-sm text-neutral-700">{message}</span>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="ml-3 flex-shrink-0 text-neutral-400 hover:text-neutral-600 cursor-pointer"
      >
        <X size={16} />
      </button>
    </div>
  );
}
