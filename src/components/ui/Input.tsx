// Input Component
// Reusable input field with validation states

import React from 'react';
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-neutral-700"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-neutral-400">
              {leftIcon}
            </div>
          </div>
        )}

        <input
          id={inputId}
          className={cn(
            'block w-full rounded-xl border-2 border-neutral-200 bg-white px-4 py-2.5 text-sm shadow-sm',
            'placeholder:text-neutral-400',
            'transition-all duration-200 ease-out',
            'focus:border-primary-500 focus:ring-2 focus:ring-primary-100 focus:shadow-md focus:outline-none',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-100',
            className
          )}
          {...props}
        />

        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="h-5 w-5 text-neutral-400">
              {rightIcon}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {hint && !error && (
        <p className="text-sm text-neutral-500">
          {hint}
        </p>
      )}
    </div>
  );
};

export default Input;
