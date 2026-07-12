import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900
              placeholder:text-gray-400 transition-colors duration-150
              focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
              disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
              ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-300'}
              ${icon ? 'pl-10' : ''}
              ${className}`}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
