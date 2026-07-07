'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ── 类型定义 ──────────────────────────────────────────────

export interface HSBColor {
  h: number; // 0–360
  s: number; // 0–100
  b: number; // 0–100
}

export interface RGBColor {
  r: number; // 0–255
  g: number; // 0–255
  b: number; // 0–255
}

export type ColorValue = string; // "#RRGGBB" or "#RGB" format

export interface PresetColor {
  label: string;
  color: ColorValue;
}

export interface ColorPickerProps {
  /** 当前颜色值 (受控) */
  value?: ColorValue;
  /** 颜色变化回调 */
  onChange?: (color: ColorValue) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否允许清除 */
  allowClear?: boolean;
  /** 是否显示透明度调整 */
  showAlpha?: boolean;
  /** 预设颜色 */
  presets?: PresetColor[];
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large';
  /** 显示格式 */
  format?: 'hex' | 'rgb' | 'hsb';
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 表单 name */
  name?: string;
  /** aria-label */
  'aria-label'?: string;
}

// ── 工具函数 ──────────────────────────────────────────────

function hexToRgb(hex: ColorValue): RGBColor {
  const clean = hex.replace('#', '');
  let r = 0, g = 0, b = 0;
  if (clean.length === 3) {
    r = parseInt((clean[0] ?? '0') + (clean[0] ?? '0'), 16);
    g = parseInt((clean[1] ?? '0') + (clean[1] ?? '0'), 16);
    b = parseInt((clean[2] ?? '0') + (clean[2] ?? '0'), 16);
  } else if (clean.length >= 6) {
    r = parseInt(clean.substring(0, 2), 16);
    g = parseInt(clean.substring(2, 4), 16);
    b = parseInt(clean.substring(4, 6), 16);
  }
  return { r: isNaN(r) ? 0 : r, g: isNaN(g) ? 0 : g, b: isNaN(b) ? 0 : b };
}

function rgbToHex(r: number, g: number, b: number): ColorValue {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsb(r: number, g: number, b: number): HSBColor {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) * 60;
    else if (max === gg) h = ((bb - rr) / d + 2) * 60;
    else h = ((rr - gg) / d + 4) * 60;
  }
  const s = max === 0 ? 0 : (d / max) * 100;
  const bv = max * 100;
  return { h: Math.round(h), s: Math.round(s), b: Math.round(bv) };
}

function hsbToRgb(h: number, s: number, bv: number): RGBColor {
  const sNorm = s / 100, bNorm = bv / 100;
  const c = bNorm * sNorm;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r1 = 0, g1 = 0, bl = 0;
  if (hh < 1) { r1 = c; g1 = x; }
  else if (hh < 2) { r1 = x; g1 = c; }
  else if (hh < 3) { g1 = c; bl = x; }
  else if (hh < 4) { g1 = x; bl = c; }
  else if (hh < 5) { r1 = x; bl = c; }
  else { r1 = c; bl = x; }
  const m = bNorm - c;
  return { r: Math.round((r1 + m) * 255), g: Math.round((g1 + m) * 255), b: Math.round((bl + m) * 255) };
}

function isValidHex(color: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color);
}

function formatColor(color: ColorValue, format: 'hex' | 'rgb' | 'hsb'): string {
  if (!isValidHex(color)) return color;
  const { r, g, b } = hexToRgb(color);
  if (format === 'rgb') return `rgb(${r}, ${g}, ${b})`;
  if (format === 'hsb') {
    const hsb = rgbToHsb(r, g, b);
    return `hsb(${hsb.h}, ${hsb.s}%, ${hsb.b}%)`;
  }
  return color.toUpperCase();
}

// ── 内置预设 ──────────────────────────────────────────────

const DEFAULT_PRESETS: PresetColor[] = [
  { label: '红色', color: '#F5222D' },
  { label: '火山橙', color: '#FA541C' },
  { label: '日落橙', color: '#FA8C16' },
  { label: '金色', color: '#FADB14' },
  { label: '酸橙绿', color: '#A0D911' },
  { label: '绿色', color: '#52C41A' },
  { label: '青色', color: '#13C2C2' },
  { label: '蓝色', color: '#1677FF' },
  { label: '深蓝', color: '#2F54EB' },
  { label: '紫色', color: '#722ED1' },
  { label: '品红', color: '#EB2F96' },
  { label: '灰色', color: '#8C8C8C' },
  { label: '黑色', color: '#000000' },
  { label: '白色', color: '#FFFFFF' },
];

// ── 主组件 ──────────────────────────────────────────────

/**
 * ColorPicker — 颜色选择器组件。
 *
 * 提供颜色选择交互，支持 Hex/RGB/HSB 颜色格式，
 * 包含色相条、饱和度/亮度面板、预设颜色和清除功能。
 */
export function ColorPicker({
  value = '#1677FF',
  onChange,
  disabled = false,
  allowClear = false,
  showAlpha = false,
  presets,
  size = 'medium',
  format = 'hex',
  className = '',
  style,
  name,
  'aria-label': ariaLabel,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const validColor = isValidHex(value) ? value : '#1677FF';
  const inputColor = isValidHex(inputValue) ? inputValue : (value || '');
  const displayHex = isValidHex(value) ? value : '';
  const { r, g, b } = hexToRgb(validColor);
  const hsb = useMemo(() => rgbToHsb(r, g, b), [r, g, b]);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // 同步外部 value 到 inputValue
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleColorSelect = useCallback((color: ColorValue) => {
    if (disabled) return;
    onChange?.(color);
    setOpen(false);
  }, [disabled, onChange]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange?.('');
    setOpen(false);
  }, [disabled, onChange]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputValue(v);
    if (isValidHex(v)) {
      onChange?.(v);
    }
  }, [onChange]);

  const handleInputBlur = useCallback(() => {
    if (!isValidHex(inputValue)) {
      setInputValue(value);
    }
  }, [inputValue, value]);

  const handleSaturationChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const s = Math.round(x * 100);
    const bv = Math.round((1 - y) * 100);
    const rgb = hsbToRgb(hsb.h, s, bv);
    onChange?.(rgbToHex(rgb.r, rgb.g, rgb.b));
  }, [disabled, hsb.h, onChange]);

  const handleHueChange = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const h = Math.round(x * 360);
    const rgb = hsbToRgb(h, hsb.s, hsb.b);
    onChange?.(rgbToHex(rgb.r, rgb.g, rgb.b));
  }, [disabled, hsb.s, hsb.b, onChange]);

  const presetList = presets ?? DEFAULT_PRESETS;
  const displayColor = displayHex || '#F5F5F5';
  const sizeClass = size === 'small' ? 'cp-small' : size === 'large' ? 'cp-large' : '';

  return (
    <div
      className={`color-picker-wrapper ${className} ${sizeClass}`}
      style={style}
      role="group"
      aria-label={ariaLabel || '颜色选择器'}
    >
      {/* 触发按钮 */}
      <button
        ref={triggerRef}
        type="button"
        className="color-picker-trigger"
        onClick={() => { if (!disabled) setOpen((o) => !o); }}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel || '选择颜色'}
        tabIndex={disabled ? -1 : 0}
      >
        <span
          className="color-picker-swatch"
          style={{ backgroundColor: displayColor }}
          aria-hidden="true"
        />
        <span className="color-picker-value-text">
          {displayHex ? formatColor(displayColor, format) : '无颜色'}
        </span>
        {allowClear && value && (
          <span
            className="color-picker-clear"
            onClick={handleClear}
            role="button"
            aria-label="清除颜色"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClear(e as any); }}
          >
            ✕
          </span>
        )}
        <span className="color-picker-arrow" aria-hidden="true">▼</span>
      </button>

      {/* 颜色选择弹出面板 */}
      {open && (
        <div
          ref={panelRef}
          className="color-picker-panel"
          role="dialog"
          aria-label="颜色选择面板"
        >
          {/* 饱和度/亮度面板 */}
          <div
            className="color-picker-saturation"
            style={{ background: `hsl(${hsb.h}, 100%, 50%)` }}
            onMouseDown={handleSaturationChange}
          >
            <div className="cp-sat-white" />
            <div className="cp-sat-black" />
            <span
              className="cp-sat-thumb"
              style={{
                left: `${hsb.s}%`,
                top: `${100 - hsb.b}%`,
                backgroundColor: validColor,
              }}
            />
          </div>

          {/* 色相条 */}
          <div className="color-picker-hue-slider" onMouseDown={handleHueChange}>
            <span
              className="cp-hue-thumb"
              style={{ left: `${(hsb.h / 360) * 100}%` }}
            />
          </div>

          {/* 预设颜色 */}
          <div className="color-picker-presets">
            {presetList.map((preset) => (
              <button
                key={preset.color}
                type="button"
                className={`color-picker-preset-swatch${preset.color === displayColor ? ' active' : ''}`}
                style={{ backgroundColor: preset.color }}
                onClick={() => handleColorSelect(preset.color)}
                title={preset.label}
                aria-label={`${preset.label} (${preset.color})`}
              />
            ))}
          </div>

          {/* 输入区域 */}
          <div className="color-picker-input-row">
            <div className="color-picker-input-wrapper">
              <span className="cp-input-label">#</span>
              <input
                type="text"
                className="color-picker-hex-input"
                value={inputValue.startsWith('#') ? inputValue.slice(1) : inputValue}
                onChange={(e) => {
                  const v = e.target.value;
                  setInputValue(v ? `#${v}` : '');
                }}
                onBlur={handleInputBlur}
                maxLength={6}
                aria-label="十六进制颜色值"
              />
            </div>
            <span
              className="color-picker-preview"
              style={{ backgroundColor: validColor }}
              aria-label="当前颜色预览"
            />
          </div>

          {/* 隐藏表单字段 */}
          {name && <input type="hidden" name={name} value={value || ''} />}
        </div>
      )}

      {/* 隐藏表单字段 (非弹出时) */}
      {!open && name && <input type="hidden" name={name} value={value || ''} />}

      <style>{`
        .color-picker-wrapper {
          display: inline-flex;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 14px;
          line-height: 1.5;
          color: #1f1f1f;
        }
        .color-picker-wrapper.cp-small { font-size: 12px; }
        .color-picker-wrapper.cp-large { font-size: 16px; }
        .color-picker-trigger {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 11px;
          border: 1px solid #d9d9d9;
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 120px;
          height: ${size === 'small' ? '28px' : size === 'large' ? '40px' : '32px'};
        }
        .color-picker-trigger:hover { border-color: #1677ff; }
        .color-picker-trigger:disabled {
          cursor: not-allowed;
          opacity: 0.6;
          background: #f5f5f5;
        }
        .color-picker-swatch {
          display: inline-block;
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 1px solid #e8e8e8;
          flex-shrink: 0;
        }
        .color-picker-value-text {
          flex: 1;
          text-align: left;
          font-size: inherit;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: ${value ? '#1f1f1f' : '#bfbfbf'};
        }
        .color-picker-clear {
          cursor: pointer;
          font-size: 12px;
          color: #999;
          line-height: 1;
          padding: 0 2px;
        }
        .color-picker-clear:hover { color: #666; }
        .color-picker-arrow {
          font-size: 10px;
          color: #999;
          transition: transform 0.2s;
        }
        .color-picker-panel {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          z-index: 1050;
          width: 232px;
          padding: 12px;
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 6px 16px rgba(0,0,0,0.08), 0 3px 6px rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .color-picker-saturation {
          position: relative;
          width: 100%;
          height: 160px;
          border-radius: 4px;
          cursor: crosshair;
          overflow: hidden;
        }
        .cp-sat-white {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, #fff, transparent);
        }
        .cp-sat-black {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, #000, transparent);
        }
        .cp-sat-thumb {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 0 2px rgba(0,0,0,0.3);
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .color-picker-hue-slider {
          position: relative;
          width: 100%;
          height: 12px;
          border-radius: 6px;
          background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
          cursor: pointer;
        }
        .cp-hue-thumb {
          position: absolute;
          top: -2px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 0 2px rgba(0,0,0,0.3);
          transform: translateX(-50%);
          background: #fff;
          pointer-events: none;
        }
        .color-picker-presets {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .color-picker-preset-swatch {
          width: 24px;
          height: 24px;
          border-radius: 4px;
          border: 1px solid #e8e8e8;
          cursor: pointer;
          padding: 0;
          outline: none;
          transition: transform 0.15s;
        }
        .color-picker-preset-swatch:hover { transform: scale(1.15); }
        .color-picker-preset-swatch.active {
          border: 2px solid #1677ff;
          box-shadow: 0 0 0 1px #1677ff;
        }
        .color-picker-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .color-picker-input-wrapper {
          display: flex;
          align-items: center;
          flex: 1;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          padding: 0 8px;
          height: 28px;
        }
        .cp-input-label {
          color: #999;
          margin-right: 2px;
          font-size: 13px;
        }
        .color-picker-hex-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 13px;
          background: transparent;
          padding: 0;
          font-family: 'SF Mono', 'Menlo', 'Monaco', monospace;
        }
        .color-picker-preview {
          width: 28px;
          height: 28px;
          border-radius: 4px;
          border: 1px solid #e8e8e8;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}

ColorPicker.displayName = 'ColorPicker';
