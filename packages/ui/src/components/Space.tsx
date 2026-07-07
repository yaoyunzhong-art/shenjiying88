'use client';

import React from 'react';

export type SpaceDirection = 'horizontal' | 'vertical';
export type SpaceSize = 'small' | 'middle' | 'large' | number;

export interface SpaceProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 排列方向：horizontal（水平）/ vertical（垂直），默认为 horizontal */
  direction?: SpaceDirection;
  /** 间距大小：small=8 / middle=16 / large=24 或自定义数值（单位 px），默认为 small */
  size?: SpaceSize;
  /** 是否自动换行（仅 horizontal 生效） */
  wrap?: boolean;
  /** 水平对齐方式 */
  align?: 'start' | 'end' | 'center' | 'baseline';
  /** 垂直对齐方式（flex 容器的 justify-content） */
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
}

const SIZE_MAP: Record<string, number> = {
  small: 8,
  middle: 16,
  large: 24,
};

function getSize(size: SpaceSize): number {
  if (typeof size === 'number') return size;
  return SIZE_MAP[size] ?? 8;
}

const ALIGN_MAP: Record<string, string> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  baseline: 'baseline',
};

const JUSTIFY_MAP: Record<string, string> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

export const Space: React.FC<SpaceProps> = ({
  children,
  direction = 'horizontal',
  size = 'small',
  wrap = false,
  align,
  justify,
  style,
  className,
  ...rest
}) => {
  const gap = getSize(size);

  const mergedStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: direction === 'vertical' ? 'column' : 'row',
    gap,
    flexWrap: wrap && direction === 'horizontal' ? 'wrap' : undefined,
    alignItems: align ? ALIGN_MAP[align] : direction === 'horizontal' ? 'center' : undefined,
    justifyContent: justify ? JUSTIFY_MAP[justify] : undefined,
    ...style,
  };

  return (
    <div className={className} style={mergedStyle} {...rest}>
      {children}
    </div>
  );
};
