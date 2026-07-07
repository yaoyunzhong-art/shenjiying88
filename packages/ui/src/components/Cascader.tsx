'use client';
import React, { useState, useCallback, useMemo } from 'react';

export interface CascaderOption {
  value: string;
  label: string;
  children?: CascaderOption[];
  disabled?: boolean;
  /** 图标/装饰 */
  icon?: React.ReactNode;
}

export interface CascaderProps {
  /** 选项树 */
  options: CascaderOption[];
  /** 当前选中值路径 */
  value?: string[];
  /** 默认选中值路径 (非受控) */
  defaultValue?: string[];
  /** 选中回调，返回选中项的完整值路径 */
  onChange?: (value: string[], selectedLabels: string[]) => void;
  /** 占位文字 */
  placeholder?: string;
  /** 禁用 */
  disabled?: boolean;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 是否允许只选父级 */
  allowParentSelect?: boolean;
  /** 最大显示层级 */
  maxLevel?: number;
  /** 自定义类名 */
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
  'data-testid'?: string;
}

const SIZE_STYLES = {
  sm: { height: 28, fontSize: 12, padding: '0 8px' },
  md: { height: 36, fontSize: 14, padding: '0 12px' },
  lg: { height: 44, fontSize: 16, padding: '0 16px' },
};

const MENU_SIZE_STYLES = {
  sm: { maxHeight: 180, itemPadding: '4px 8px', fontSize: 12 },
  md: { maxHeight: 240, itemPadding: '6px 12px', fontSize: 14 },
  lg: { maxHeight: 300, itemPadding: '8px 16px', fontSize: 16 },
};

/**
 * Cascader — 级联选择器。
 *
 * 用于多层级数据（如地区/分类）的逐级选择，支持受控/非受控、多尺寸、禁用。
 *
 * @example
 * ```tsx
 * <Cascader
 *   options={[
 *     {
 *       value: 'zhejiang', label: '浙江',
 *       children: [
 *         { value: 'hangzhou', label: '杭州' },
 *         { value: 'ningbo', label: '宁波' },
 *       ],
 *     },
 *   ]}
 *   onChange={(values, labels) => console.log(values, labels)}
 * />
 * ```
 */
export function Cascader({
  options,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = '请选择',
  disabled = false,
  size = 'md',
  allowParentSelect = false,
  maxLevel = 5,
  className = '',
  style,
  'aria-label': ariaLabel = '级联选择器',
  'data-testid': dataTestId,
}: CascaderProps) {
  const [internalValue, setInternalValue] = useState<string[]>(defaultValue ?? []);
  const [open, setOpen] = useState(false);
  const [hoverPath, setHoverPath] = useState<string[]>([]);

  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const selectedLabels = useMemo((): string[] => {
    const labels: string[] = [];
    let current: CascaderOption[] | undefined = options;
    for (const v of currentValue) {
      const found: CascaderOption | undefined = current?.find((o: CascaderOption) => o.value === v);
      if (found) {
        labels.push(found.label);
        current = found.children;
      } else break;
    }
    return labels;
  }, [currentValue, options]);

  const displayText = selectedLabels.length > 0 ? selectedLabels.join(' / ') : placeholder;

  const findChildren = useCallback(
    (path: string[]): CascaderOption[] | undefined => {
      let current: CascaderOption[] | undefined = options;
      for (const v of path) {
        const found: CascaderOption | undefined = current?.find((o: CascaderOption) => o.value === v);
        if (!found) return undefined;
        current = found.children;
      }
      return current;
    },
    [options],
  );

  const handleOptionClick = useCallback(
    (path: string[]): void => {
      if (disabled) return;
      const children = findChildren(path);
      if (children && children.length > 0) {
        return; // 还有子级，不选中
      }
      const newVal = [...path];
      if (!isControlled) setInternalValue(newVal);
      setOpen(false);
      // 计算 labels
      const labels: string[] = [];
      let cur: CascaderOption[] | undefined = options;
      for (const v of newVal) {
        const found: CascaderOption | undefined = cur?.find((o: CascaderOption) => o.value === v);
        if (found) {
          labels.push(found.label);
          cur = found.children;
        } else break;
      }
      onChange?.(newVal, labels);
    },
    [disabled, isControlled, options, onChange, findChildren],
  );

  // 构建菜单列
  const menuColumns = useMemo(() => {
    const columns: { level: number; items: (CascaderOption & { isLeaf: boolean; isSelected: boolean })[] }[] = [];
    // 顶级
    const top = options.map((o) => ({
      ...o,
      isLeaf: !o.children || o.children.length === 0,
      isSelected: currentValue[0] === o.value,
    }));
    columns.push({ level: 0, items: top });

    for (let i = 0; i < Math.min(currentValue.length, maxLevel - 1); i++) {
      const children = findChildren(currentValue.slice(0, i + 1));
      if (children && children.length > 0) {
        const items = children.map((o) => ({
          ...o,
          isLeaf: !o.children || o.children.length === 0,
          isSelected: currentValue[i + 1] === o.value,
        }));
        columns.push({ level: i + 1, items });
      } else break;
    }
    return columns;
  }, [options, currentValue, findChildren, maxLevel]);

  const sizeStyle = SIZE_STYLES[size];
  const menuSize = MENU_SIZE_STYLES[size];

  const triggerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    height: sizeStyle.height,
    padding: sizeStyle.padding,
    fontSize: sizeStyle.fontSize,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    backgroundColor: disabled ? '#f3f4f6' : '#fff',
    color: selectedLabels.length > 0 ? '#111827' : '#9ca3af',
    cursor: disabled ? 'not-allowed' : 'pointer',
    minWidth: 120,
    width: '100%',
    boxSizing: 'border-box',
    ...style,
  };

  return (
    <div
      data-testid={dataTestId}
      style={{ position: 'relative', display: 'inline-block', width: style?.width || '100%' }}
    >
      {/* trigger */}
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-expanded={open}
        data-testid={dataTestId ? `${dataTestId}-trigger` : undefined}
        onClick={() => !disabled && setOpen((v) => !v)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
        style={triggerStyle}
        className={className}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayText}
        </span>
        <span style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          ▾
        </span>
      </button>

      {/* dropdown menu */}
      {open && !disabled && (
        <div
          data-testid={dataTestId ? `${dataTestId}-menu` : undefined}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            display: 'flex',
            backgroundColor: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            zIndex: 1050,
            maxHeight: menuSize.maxHeight,
            minWidth: 140,
          }}
        >
          {menuColumns.map((col, colIdx) => (
            <div
              key={col.level}
              data-testid={dataTestId ? `${dataTestId}-col-${col.level}` : undefined}
              style={{
                minWidth: 120,
                maxHeight: menuSize.maxHeight,
                overflowY: 'auto',
                borderRight: colIdx < menuColumns.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}
            >
              {col.items.map((item) => {
                const isHovered = hoverPath[col.level] === item.value;
                return (
                  <div
                    key={item.value}
                    role="option"
                    aria-selected={item.isSelected}
                    data-testid={dataTestId ? `${dataTestId}-opt-${item.value}` : undefined}
                    onClick={() => !item.disabled && handleOptionClick(currentValue.slice(0, col.level).concat(item.value))}
                    onMouseEnter={() => !item.disabled && setHoverPath((p) => { const n = [...p]; n[col.level] = item.value; return n; })}
                    style={{
                      padding: menuSize.itemPadding,
                      fontSize: menuSize.fontSize,
                      cursor: item.disabled ? 'not-allowed' : 'pointer',
                      backgroundColor: item.isSelected ? '#eff6ff' : isHovered ? '#f8fafc' : 'transparent',
                      color: item.disabled ? '#d1d5db' : '#1e293b',
                      fontWeight: item.isSelected ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 4,
                      whiteSpace: 'nowrap',
                      transition: 'background-color 0.1s',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {item.icon && <span>{item.icon}</span>}
                      <span>{item.label}</span>
                    </span>
                    {!item.isLeaf && (
                      <span style={{ color: '#94a3b8', fontSize: '0.8em' }}>›</span>
                    )}
                  </div>
                );
              })}
              {col.items.length === 0 && (
                <div style={{ padding: menuSize.itemPadding, color: '#9ca3af', fontSize: menuSize.fontSize }}>
                  无选项
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
