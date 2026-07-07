'use client';

import React, { useRef, useCallback, KeyboardEvent, ClipboardEvent } from 'react';

export type OTPInputSize = 'sm' | 'md' | 'lg';
export type OTPInputVariant = 'outlined' | 'filled' | 'underlined';

export interface OTPInputProps {
  /** 验证码长度 (默认 6) */
  length?: number;
  /** 当前值 */
  value: string;
  /** 值变更回调 */
  onChange: (value: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读 */
  readOnly?: boolean;
  /** 错误状态 */
  error?: boolean;
  /** 尺寸 */
  size?: OTPInputSize;
  /** 变体 */
  variant?: OTPInputVariant;
  /** 自动聚焦 */
  autoFocus?: boolean;
  /** 完成输入回调 (所有格填满时) */
  onComplete?: (value: string) => void;
  /** 额外类名 */
  className?: string;
  /** 占位符字符 */
  placeholder?: string;
  /** input 类型: text / tel / number */
  inputMode?: 'text' | 'numeric' | 'tel';
  /** aria-label */
  label?: string;
}

const sizeMap: Record<OTPInputSize, { width: string; height: string; fontSize: string; gap: string }> = {
  sm: { width: '32px', height: '36px', fontSize: '14px', gap: '4px' },
  md: { width: '40px', height: '44px', fontSize: '18px', gap: '6px' },
  lg: { width: '48px', height: '52px', fontSize: '22px', gap: '8px' },
};

const variantStyle: Record<OTPInputVariant, React.CSSProperties> = {
  outlined: {
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: '#fff',
  },
  filled: {
    border: '1px solid transparent',
    borderRadius: '6px',
    background: '#f3f4f6',
  },
  underlined: {
    border: 'none',
    borderBottom: '2px solid #d1d5db',
    borderRadius: '0',
    background: 'transparent',
  },
};

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  error = false,
  size = 'md',
  variant = 'outlined',
  autoFocus = false,
  onComplete,
  className = '',
  placeholder = '',
  inputMode = 'text',
  label = '验证码输入',
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const dims = sizeMap[size];

  const chars = value.split('').concat(new Array(Math.max(0, length - value.length)).fill(''));
  const activeIndex = Math.min(value.length, length - 1);

  const focusIndex = useCallback(
    (index: number) => {
      const idx = Math.max(0, Math.min(index, length - 1));
      inputRefs.current[idx]?.focus();
    },
    [length]
  );

  const handleChange = useCallback(
    (index: number, char: string) => {
      if (disabled || readOnly) return;
      // 只取最后一个字符
      const digit = char.slice(-1);
      // 只允许数字
      if (inputMode === 'numeric' || inputMode === 'tel') {
        if (!/^\d$/.test(digit) && digit !== '') return;
      }
      const newChars = value.split('');
      newChars[index] = digit;
      const newValue = newChars.join('').slice(0, length);
      onChange(newValue);

      // 自动跳到下一格
      if (digit !== '' && index < length - 1) {
        focusIndex(index + 1);
      }

      // 完成回调
      if (newValue.length === length && onComplete) {
        onComplete(newValue);
      }
    },
    [value, length, onChange, onComplete, focusIndex, disabled, readOnly, inputMode]
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (value[index]) {
          const newChars = value.split('');
          newChars[index] = '';
          onChange(newChars.join('').slice(0, length));
        }
        if (index > 0) focusIndex(index - 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (index > 0) focusIndex(index - 1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (index < length - 1) focusIndex(index + 1);
      }
    },
    [value, length, onChange, focusIndex, disabled, readOnly]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\s/g, '');
      const digits = inputMode === 'numeric' || inputMode === 'tel' ? pasted.replace(/\D/g, '') : pasted;
      const newValue = digits.slice(0, length);
      onChange(newValue);
      const nextIndex = Math.min(newValue.length, length - 1);
      focusIndex(nextIndex);
      if (newValue.length === length && onComplete) {
        onComplete(newValue);
      }
    },
    [length, onChange, onComplete, focusIndex, disabled, readOnly, inputMode]
  );

  const errorStyle: React.CSSProperties = error ? { borderColor: '#ef4444', color: '#ef4444' } : {};

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        gap: dims.gap,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      role="group"
      aria-label={label}
    >
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type={inputMode === 'tel' ? 'tel' : 'text'}
          inputMode={inputMode}
          autoComplete="one-time-code"
          maxLength={1}
          value={chars[i] ?? ''}
          disabled={disabled}
          readOnly={readOnly}
          autoFocus={autoFocus && i === 0}
          aria-label={`第 ${i + 1} 位验证码`}
          data-testid={`otp-input-${i}`}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          placeholder={placeholder ? placeholder[i] ?? placeholder : ''}
          style={{
            width: dims.width,
            height: dims.height,
            fontSize: dims.fontSize,
            textAlign: 'center',
            fontWeight: 600,
            outline: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            ...variantStyle[variant],
            ...errorStyle,
            ...(disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
            ...(readOnly ? { cursor: 'default' } : {}),
          }}
          onFocus={(e) => {
            if (!error && !disabled) {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 2px rgba(59,130,246,0.2)';
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.target.style.borderColor = variantStyle[variant].borderColor ?? '#d1d5db';
              e.target.style.boxShadow = 'none';
            }
          }}
        />
      ))}
    </div>
  );
};

export default OTPInput;
