'use client';

import React from 'react';

// ---- Types ----

export type TextVariant =
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'body1' | 'body2'
  | 'caption' | 'overline'
  | 'label';

export type TextColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'success'
  | 'warning'
  | 'danger'
  | 'inherit';

export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';

export type TextAlign = 'left' | 'center' | 'right';

export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export interface TypographyProps {
  variant?: TextVariant;
  color?: TextColor;
  weight?: TextWeight;
  align?: TextAlign;
  transform?: TextTransform;
  truncate?: boolean;
  as?: keyof JSX.IntrinsicElements;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
}

// ---- Variant styles ----

const VARIANT_STYLES: Record<TextVariant, React.CSSProperties> = {
  h1:       { fontSize: 32, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.02em', margin: 0 },
  h2:       { fontSize: 26, fontWeight: 700, lineHeight: 1.3,  letterSpacing: '-0.015em', margin: 0 },
  h3:       { fontSize: 22, fontWeight: 600, lineHeight: 1.35, margin: 0 },
  h4:       { fontSize: 18, fontWeight: 600, lineHeight: 1.4,  margin: 0 },
  h5:       { fontSize: 16, fontWeight: 600, lineHeight: 1.45, margin: 0 },
  h6:       { fontSize: 14, fontWeight: 600, lineHeight: 1.5,  margin: 0 },
  body1:    { fontSize: 15, fontWeight: 400, lineHeight: 1.6 },
  body2:    { fontSize: 13, fontWeight: 400, lineHeight: 1.55 },
  caption:  { fontSize: 12, fontWeight: 400, lineHeight: 1.45 },
  overline: { fontSize: 11, fontWeight: 600, lineHeight: 1.3, letterSpacing: '0.08em', textTransform: 'uppercase' },
  label:    { fontSize: 13, fontWeight: 500, lineHeight: 1.4, display: 'inline-block' },
};

const COLOR_PALETTE: Partial<Record<TextColor, string>> = {
  default:  'inherit',
  primary:  '#60a5fa',
  secondary: '#a1a1aa',
  muted:    '#71717a',
  success:  '#4ade80',
  warning:  '#facc15',
  danger:   '#f87171',
  inherit:  'inherit',
};

const TAG_MAP: Partial<Record<TextVariant, keyof JSX.IntrinsicElements>> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body1: 'p',
  body2: 'p',
  caption: 'span',
  overline: 'span',
  label: 'label',
};

// ---- Component ----

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body1',
  color = 'default',
  weight,
  align,
  transform,
  truncate = false,
  as,
  children,
  className,
  style,
  id,
}) => {
  const variantStyle = VARIANT_STYLES[variant];
  const colorValue = COLOR_PALETTE[color] ?? 'inherit';

  const mergedStyle: React.CSSProperties = {
    ...variantStyle,
    color: color === 'default' ? '#e4e4e7' : colorValue,
    fontWeight: weight ? getWeightValue(weight) : variantStyle.fontWeight,
    textAlign: align ?? undefined,
    textTransform: transform ?? (variant === 'overline' ? 'uppercase' : undefined),
    overflow: truncate ? 'hidden' : undefined,
    textOverflow: truncate ? 'ellipsis' : undefined,
    whiteSpace: truncate ? 'nowrap' : undefined,
    ...style,
  };

  const Tag = as || TAG_MAP[variant] || 'span';

  return React.createElement(Tag, { id, className, style: mergedStyle }, children);
};

function getWeightValue(w: TextWeight): number {
  switch (w) {
    case 'normal': return 400;
    case 'medium': return 500;
    case 'semibold': return 600;
    case 'bold': return 700;
  }
}

// ---- Compound Exports ----

export const Heading: React.FC<Omit<TypographyProps, 'variant'> & { level?: 1 | 2 | 3 | 4 | 5 | 6 }> = ({
  level = 1,
  ...rest
}) => <Typography variant={`h${level}` as TextVariant} {...rest} />;

export const Text: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body1" {...props} />
);

export const Paragraph: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="body1" as="p" {...props} />
);

export const Caption: React.FC<Omit<TypographyProps, 'variant'>> = (props) => (
  <Typography variant="caption" {...props} />
);
