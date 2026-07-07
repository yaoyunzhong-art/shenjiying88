'use client';

import React, { createContext, useContext, useCallback, useMemo } from 'react';

// --------------- Types ---------------

export interface ToggleOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export type ToggleGroupVariant = 'outline' | 'filled' | 'underline';
export type ToggleGroupSize = 'sm' | 'md' | 'lg';

export interface ToggleGroupProps {
  /** Controlled selected value(s) */
  value?: string | string[];
  /** Default selected value(s) */
  defaultValue?: string | string[];
  /** Allow multiple selections */
  multiple?: boolean;
  /** Options to display */
  options: ToggleOption[];
  /** Callback when selection changes */
  onChange?: (value: string | string[]) => void;
  /** Visual variant */
  variant?: ToggleGroupVariant;
  /** Size */
  size?: ToggleGroupSize;
  /** Disable entire group */
  disabled?: boolean;
  /** Label for the group (aria-label) */
  label?: string;
  /** Additional CSS class */
  className?: string;
  /** Inline style */
  style?: React.CSSProperties;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
}

// --------------- Context ---------------

interface ToggleGroupContextValue {
  variant: ToggleGroupVariant;
  size: ToggleGroupSize;
  disabled: boolean;
  multiple: boolean;
  selected: Set<string>;
  toggle: (value: string) => void;
  orientation: 'horizontal' | 'vertical';
}

const ToggleGroupContext = createContext<ToggleGroupContextValue | null>(null);

function useToggleGroupContext() {
  const ctx = useContext(ToggleGroupContext);
  if (!ctx) throw new Error('ToggleButton must be used within ToggleGroup');
  return ctx;
}

// --------------- ToggleButton ---------------

export interface ToggleButtonProps {
  value: string;
  children?: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  value,
  children,
  disabled: itemDisabled,
  icon,
  className = '',
  style,
}) => {
  const ctx = useToggleGroupContext();
  const isSelected = ctx.selected.has(value);
  const isDisabled = ctx.disabled || itemDisabled;

  const handleClick = useCallback(() => {
    if (!isDisabled) ctx.toggle(value);
  }, [isDisabled, ctx, value]);

  const sizeMap: Record<ToggleGroupSize, string> = {
    sm: 'px-3 py-0.5 text-xs',
    md: 'px-4 py-1 text-sm',
    lg: 'px-5 py-1.5 text-base',
  };

  const baseClasses =
    'inline-flex items-center justify-center gap-1.5 font-medium transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-blue-400 select-none';

  const variantClasses = (() => {
    if (ctx.variant === 'filled') {
      return isSelected
        ? 'bg-blue-600 text-white shadow-sm'
        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800';
    }
    if (ctx.variant === 'underline') {
      return isSelected
        ? 'border-b-2 border-blue-600 text-blue-700 font-semibold'
        : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    }
    // outline (default)
    return isSelected
      ? 'border border-blue-500 bg-blue-50 text-blue-700 z-10'
      : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-800';
  })();

  const disabledClasses = isDisabled
    ? 'opacity-50 cursor-not-allowed'
    : 'cursor-pointer';

  // Round only first & last in horizontal group, top & bottom in vertical
  const roundClasses =
    ctx.variant !== 'underline'
      ? ''
      : 'rounded-none';

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      onClick={handleClick}
      className={`${baseClasses} ${sizeMap[ctx.size]} ${variantClasses} ${disabledClasses} ${roundClasses} ${className}`}
      style={style}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
};

// --------------- ToggleGroup Root ---------------

const groupBase =
  'inline-flex';
const horizontalClass = 'flex-row';
const verticalClass = 'flex-col';

export const ToggleGroup: React.FC<ToggleGroupProps> & {
  Button: typeof ToggleButton;
} = ({
  value: controlledValue,
  defaultValue,
  multiple = false,
  options,
  onChange,
  variant = 'outline',
  size = 'md',
  disabled = false,
  label,
  className = '',
  style,
  orientation = 'horizontal',
}) => {
  const isControlled = controlledValue !== undefined;
  const defaultSelected = useMemo(() => {
    const raw = isControlled ? controlledValue : defaultValue;
    if (!raw) return new Set<string>();
    if (Array.isArray(raw)) return new Set(raw);
    return new Set([raw]);
  }, []); // Only on mount

  const [internalSelected, setInternalSelected] = React.useState<Set<string>>(defaultSelected);

  const selected = isControlled
    ? Array.isArray(controlledValue)
      ? new Set(controlledValue)
      : new Set([controlledValue])
    : internalSelected;

  const toggle = useCallback(
    (val: string) => {
      const next = new Set(selected);
      if (next.has(val)) {
        if (multiple) {
          next.delete(val);
        } else {
          return; // Don't deselect the only selected item in single mode
        }
      } else {
        if (!multiple) next.clear();
        next.add(val);
      }
      if (!isControlled) setInternalSelected(next);
      onChange?.(multiple ? Array.from(next) : Array.from(next)[0] ?? '');
    },
    [selected, multiple, isControlled, onChange],
  );

  const ctxValue = useMemo<ToggleGroupContextValue>(
    () => ({ variant, size, disabled, multiple, selected, toggle, orientation }),
    [variant, size, disabled, multiple, selected, toggle, orientation],
  );

  const roundContainer =
    variant !== 'underline'
      ? `rounded-lg border ${
          disabled ? 'border-gray-200' : 'border-gray-200'
        } overflow-hidden`
      : '';

  const orientClass = orientation === 'vertical' ? verticalClass : horizontalClass;

  return (
    <ToggleGroupContext.Provider value={ctxValue}>
      <div
        role="group"
        aria-label={label}
        className={`${groupBase} ${orientClass} ${roundContainer} ${className}`}
        style={style}
      >
        {options.map((opt) => (
          <ToggleButton
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
            icon={opt.icon}
          >
            {opt.label}
          </ToggleButton>
        ))}
      </div>
    </ToggleGroupContext.Provider>
  );
};

ToggleGroup.Button = ToggleButton;

export default ToggleGroup;
