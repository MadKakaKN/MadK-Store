import React from 'react';

// FormField Wrapper
export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required,
  error,
  helperText,
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-slate-800">
          {label}
          {required && <span className="text-rose-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      ) : helperText ? (
        <p className="text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
};

// AdminInput
export interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AdminInput = React.forwardRef<HTMLInputElement, AdminInputProps>(
  ({ error, leftIcon, rightIcon, className = '', ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-slate-400 flex items-center pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full px-3.5 py-2 text-sm bg-white rounded-lg border transition-colors outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900'
              : 'border-slate-300 hover:border-slate-400 text-slate-900'
          } ${leftIcon ? 'pl-9' : ''} ${rightIcon ? 'pr-9' : ''} disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${className}`}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-slate-400 flex items-center pointer-events-none">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);
AdminInput.displayName = 'AdminInput';

// AdminSelect
export interface AdminSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options?: { value: string | number; label: string }[];
}

export const AdminSelect = React.forwardRef<HTMLSelectElement, AdminSelectProps>(
  ({ error, options, children, className = '', ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full px-3.5 py-2 text-sm bg-white rounded-lg border transition-colors outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
          error
            ? 'border-rose-300 focus:border-rose-500 text-rose-900'
            : 'border-slate-300 hover:border-slate-400 text-slate-900'
        } disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${className}`}
        {...props}
      >
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
    );
  }
);
AdminSelect.displayName = 'AdminSelect';

// AdminTextarea
export interface AdminTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const AdminTextarea = React.forwardRef<HTMLTextAreaElement, AdminTextareaProps>(
  ({ error, className = '', rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`w-full px-3.5 py-2 text-sm bg-white rounded-lg border transition-colors outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
          error
            ? 'border-rose-300 focus:border-rose-500 text-rose-900'
            : 'border-slate-300 hover:border-slate-400 text-slate-900'
        } disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    );
  }
);
AdminTextarea.displayName = 'AdminTextarea';

// AdminToggle
export interface AdminToggleProps {
  label?: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const AdminToggle: React.FC<AdminToggleProps> = ({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = '',
}) => {
  return (
    <label
      className={`flex items-start justify-between gap-4 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {(label || description) && (
        <div className="flex-1">
          {label && <div className="text-sm font-semibold text-slate-800">{label}</div>}
          {description && <div className="text-xs text-slate-500 mt-0.5">{description}</div>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-hidden focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 ${
          checked ? 'bg-brand-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
};

// AdminButton
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';

export interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AdminButton = React.forwardRef<HTMLButtonElement, AdminButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<ButtonVariant, string> = {
      primary: 'bg-brand-600 hover:bg-brand-700 text-white shadow-xs focus:ring-brand-500',
      secondary: 'bg-slate-800 hover:bg-slate-900 text-white shadow-xs focus:ring-slate-700',
      danger: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs focus:ring-rose-500',
      outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 focus:ring-slate-400',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 focus:ring-slate-400',
    };

    const sizeStyles = {
      sm: 'px-2.5 py-1.5 text-xs rounded-md gap-1.5',
      md: 'px-4 py-2 text-sm rounded-lg gap-2',
      lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5',
    }[size];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);
AdminButton.displayName = 'AdminButton';
