'use client';

import React from 'react';

// ==================== 类型定义 ====================

/** 词云数据项 */
export interface WordCloudItem {
  /** 文字内容 */
  text: string;
  /** 权重（决定字体大小） */
  weight: number;
  /** 自定义颜色覆盖 */
  color?: string;
  /** 点击回调时携带的附加值 */
  payload?: Record<string, unknown>;
}

/** 词云字体生成策略 */
export type WordCloudFontStrategy =
  | 'normal'
  | 'bold'
  | 'light'
  | 'italic'
  | 'bold-italic';

/** 词云布局方向 */
export type WordCloudLayout = 'horizontal' | 'mixed';

/** 词云组件 Props */
export interface WordCloudChartProps {
  /** 词条数据 */
  data: WordCloudItem[];
  /** 图表宽度 */
  width?: number;
  /** 图表高度 */
  height?: number;
  /** 标题 */
  title?: string;
  /** 最小字号 */
  minFontSize?: number;
  /** 最大字号 */
  maxFontSize?: number;
  /** 字体策略 */
  fontStrategy?: WordCloudFontStrategy;
  /** 布局方向 */
  layout?: WordCloudLayout;
  /** 是否显示图例（颜色说明） */
  showLegend?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 空状态文案 */
  emptyText?: string;
  /** 词条点击回调 */
  onWordClick?: (item: WordCloudItem) => void;
}

// ==================== 常量 ====================

const PRESET_COLORS = [
  '#60a5fa', // blue-400
  '#f472b6', // pink-400
  '#34d399', // emerald-400
  '#fbbf24', // amber-400
  '#a78bfa', // violet-400
  '#fb923c', // orange-400
  '#67e8f9', // cyan-400
  '#f87171', // red-400
  '#4ade80', // green-400
  '#c084fc', // purple-400
  '#facc15', // yellow-400
  '#2dd4bf', // teal-400
];

const FONT_FAMILIES: Record<WordCloudFontStrategy, string> = {
  normal: 'Inter, system-ui, sans-serif',
  bold: 'Inter, system-ui, sans-serif',
  light: 'Inter, system-ui, sans-serif',
  italic: 'Inter, system-ui, sans-serif',
  'bold-italic': 'Inter, system-ui, sans-serif',
};

const FONT_WEIGHTS: Record<WordCloudFontStrategy, number> = {
  normal: 500,
  bold: 700,
  light: 300,
  italic: 500,
  'bold-italic': 700,
};

const FONT_STYLES: Record<WordCloudFontStrategy, string> = {
  normal: 'normal',
  bold: 'normal',
  light: 'normal',
  italic: 'italic',
  'bold-italic': 'italic',
};

// ==================== 工具函数 ====================

/** 根据 weight 插值获取字号 */
function interpolateSize(
  weight: number,
  minWeight: number,
  maxWeight: number,
  minSize: number,
  maxSize: number
): number {
  if (maxWeight === minWeight) return (minSize + maxSize) / 2;
  const ratio = (weight - minWeight) / (maxWeight - minWeight);
  return minSize + ratio * (maxSize - minSize);
}

/** 为词条分配颜色 */
function assignColor(
  index: number,
  item: WordCloudItem
): string {
  return (item.color ?? PRESET_COLORS[index % PRESET_COLORS.length]) as string;
}

/** 布局算法：简单螺旋排列 */
interface PlacedWord {
  item: WordCloudItem;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  width: number;
  height: number;
}

function placeWords(
  items: WordCloudItem[],
  width: number,
  height: number,
  minFontSize: number,
  maxFontSize: number,
  fontStrategy: WordCloudFontStrategy
): PlacedWord[] {
  if (items.length === 0) return [];

  const weights = items.map((i) => i.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);

  const placed: PlacedWord[] = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const fontFamily = FONT_FAMILIES[fontStrategy];
  const fontWeight = FONT_WEIGHTS[fontStrategy];
  const fontStyle = FONT_STYLES[fontStrategy];

  // 先按权重降序排列，大的优先放置
  const sorted = items
    .map((item, idx): { item: WordCloudItem; idx: number } => ({ item, idx }))
    .sort((a, b) => b.item.weight - a.item.weight);

  // 使用 Canvas 估算文字宽高
  let canvas: HTMLCanvasElement | null = null;
  const measureText = (text: string, size: number): { w: number; h: number } => {
    if (typeof document === 'undefined') {
      // SSR fallback
      return { w: text.length * size * 0.6, h: size * 1.4 };
    }
    if (!canvas) {
      canvas = document.createElement('canvas');
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return { w: text.length * size * 0.6, h: size * 1.4 };
    ctx.font = `${fontStyle} ${fontWeight} ${size}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    return {
      w: metrics.width + 4,
      h: size * 1.4,
    };
  };

  const maxAttempts = 200;
  let occupied: Array<{ x: number; y: number; w: number; h: number }> = [];

  const collides = (x: number, y: number, w: number, h: number): boolean => {
    for (const rect of occupied) {
      if (
        x < rect.x + rect.w &&
        x + w > rect.x &&
        y < rect.y + rect.h &&
        y + h > rect.y
      ) {
        return true;
      }
    }
    return false;
  };

  for (let idx = 0; idx < sorted.length; idx++) {
    const entry = sorted[idx];
    if (!entry) continue;
    const { item } = entry;
    const fontSize = interpolateSize(
      item.weight,
      minWeight,
      maxWeight,
      minFontSize,
      maxFontSize
    );
    const color = assignColor(idx, item);
    const { w, h } = measureText(item.text, fontSize);

    let placedPos: { x: number; y: number } | null = null;

    // 螺旋搜索空闲位置
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = attempt * 2.399; // 黄金角
      const radius = 2 + attempt * 6;
      const px = centerX + Math.cos(angle) * radius - w / 2;
      const py = centerY + Math.sin(angle) * radius - h / 2;

      // 边界检查
      if (px < 0 || px + w > width || py < 0 || py + h > height) continue;

      if (!collides(px, py, w, h)) {
        placedPos = { x: px, y: py };
        break;
      }
    }

    if (placedPos) {
      occupied.push({ x: placedPos.x, y: placedPos.y, w, h });
      placed.push({
        item,
        x: placedPos.x,
        y: placedPos.y,
        fontSize,
        color,
        width: w,
        height: h,
      });
    } else {
      // 放不下的就放中间区域偏下位置
      const fallbackX = centerX - w / 2;
      const fallbackY = centerY + 20 + idx * (h + 4);
      if (fallbackY + h < height) {
        occupied.push({ x: fallbackX, y: fallbackY, w, h });
        placed.push({
          item,
          x: fallbackX,
          y: fallbackY,
          fontSize,
          color,
          width: w,
          height: h,
        });
      }
    }
  }

  return placed;
}

// ==================== 图例 ====================

function WordCloudLegend() {
  const sampleColors = PRESET_COLORS.slice(0, 6);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        justifyContent: 'flex-end',
        marginTop: 12,
        flexWrap: 'wrap',
      }}
      data-testid="wordcloud-legend"
    >
      <span style={{ fontSize: 11, color: '#64748b' }}>词频</span>
      <div style={{ display: 'flex', gap: 2 }}>
        {sampleColors.map((color) => (
          <span
            key={color}
            style={{
              width: 14,
              height: 10,
              borderRadius: 2,
              background: color,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 10, color: '#94a3b8' }}>← 高频 →</span>
    </div>
  );
}

// ==================== 词云 SVG ====================

function WordCloudSvg({
  placed,
  onWordClick,
}: {
  placed: PlacedWord[];
  onWordClick?: (item: WordCloudItem) => void;
}) {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 500 200"
      preserveAspectRatio="xMidYMid meet"
      data-testid="wordcloud-svg"
    >
      {placed.map((p, i) => (
        <text
          key={`${p.item.text}-${i}`}
          x={p.x}
          y={p.y + p.fontSize}
          fontSize={p.fontSize}
          fill={p.color}
          fontWeight={FONT_WEIGHTS.normal}
          fontFamily={FONT_FAMILIES.normal}
          opacity={0.85}
          cursor={onWordClick ? 'pointer' : 'default'}
          onClick={() => onWordClick?.(p.item)}
          style={{ transition: 'opacity 0.15s' }}
          onMouseEnter={(e) => {
            (e.target as SVGTextElement).style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            (e.target as SVGTextElement).style.opacity = '0.85';
          }}
        >
          <animate
            attributeName="opacity"
            from="0"
            to="0.85"
            dur={`${0.3 + i * 0.04}s`}
            fill="freeze"
          />
          {p.item.text}
        </text>
      ))}
    </svg>
  );
}

// ==================== 主组件 ====================

/**
 * WordCloudChart — 词云数据可视化组件。
 *
 * 以不同字体大小展示关键词的权重分布，适用于：
 * - AI 分析高频关键词展示
 * - 客户反馈/评论热词聚类
 * - 会员标签/兴趣分析
 * - 告警/事件高频词分布
 *
 * 使用纯 SVG 实现，零外部依赖，内置螺旋布局算法和入场动画。
 *
 * @example
 * // 基础词云
 * <WordCloudChart
 *   title="客户反馈热词"
 *   data={[
 *     { text: '服务体验', weight: 95 },
 *     { text: '会员优惠', weight: 72 },
 *     { text: '商品质量', weight: 60 },
 *     { text: '配送时效', weight: 45 },
 *     { text: '退换货', weight: 38 },
 *   ]}
 * />
 *
 * @example
 * // AI 分析关键词
 * <WordCloudChart
 *   title="AI 决策关键词"
 *   data={[
 *     { text: '智能推荐', weight: 98, color: '#f472b6' },
 *     { text: '自动化', weight: 85 },
 *     { text: '数据分析', weight: 70 },
 *   ]}
 *   fontStrategy="bold"
 *   showLegend
 *   onWordClick={(item) => console.log(item.text)}
 * />
 */
export function WordCloudChart({
  data,
  width = 500,
  height = 200,
  title,
  minFontSize = 12,
  maxFontSize = 40,
  fontStrategy = 'normal',
  layout = 'mixed',
  showLegend = false,
  className,
  emptyText = '暂无词云数据',
  onWordClick,
}: WordCloudChartProps) {
  const isEmpty = data.length === 0;

  // 排序：按权重降序排列展示顺序自然反映重要性
  const sortedData = [...data].sort((a, b) => b.weight - a.weight);

  // 布局计算
  const placed = React.useMemo(() => {
    if (isEmpty) return [];
    return placeWords(
      sortedData,
      width,
      height,
      minFontSize,
      maxFontSize,
      fontStrategy
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, width, height, minFontSize, maxFontSize, fontStrategy, layout]);

  return (
    <div
      className={className}
      style={{
        borderRadius: 16,
        background: 'rgba(15, 23, 42, 0.38)',
        border: '1px solid rgba(148, 163, 184, 0.16)',
        padding: '20px 16px 16px',
        display: 'inline-block',
        width,
      }}
      data-testid="wordcloud-root"
    >
      {title && (
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#cbd5e1',
            marginBottom: 16,
            paddingLeft: 4,
          }}
          data-testid="wordcloud-title"
        >
          ☁️ {title}
        </div>
      )}

      {isEmpty ? (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: '#64748b',
            fontSize: 13,
          }}
          data-testid="wordcloud-empty"
        >
          {emptyText}
        </div>
      ) : (
        <>
          <div style={{ position: 'relative', width, height }}>
            <WordCloudSvg placed={placed} onWordClick={onWordClick} />
          </div>
          {showLegend && <WordCloudLegend />}
        </>
      )}
    </div>
  );
}
