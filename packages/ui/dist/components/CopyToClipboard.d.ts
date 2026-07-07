import React from 'react';
export interface CopyToClipboardProps {
    /** 要复制的文本 */
    text: string;
    /** 复制按钮的标签，不传则只显示图标 */
    label?: string;
    /** 复制成功后的提示文本 */
    successLabel?: string;
    /** 自定义样式 */
    style?: React.CSSProperties;
    /** 大小变体 */
    size?: 'sm' | 'md';
    /** 是否以图标按钮形式（紧凑模式） */
    iconOnly?: boolean;
    /** 自定义 className（预留） */
    className?: string;
}
/**
 * CopyToClipboard — 一键复制组件。
 *
 * 点击后将 text 写入系统剪贴板，并短暂显示复制成功反馈。
 * 支持紧凑图标模式（详情页 ID 旁）和完整标签模式（代码块复制）。
 *
 * @example
 * // 紧凑图标模式 — 复制 ID
 * <CopyToClipboard text={record.id} size="sm" iconOnly />
 *
 * @example
 * // 完整标签模式 — 复制代码
 * <CopyToClipboard text={codeSnippet} label="复制代码" successLabel="已复制！" />
 */
export declare function CopyToClipboard({ text, label, successLabel, style, size, iconOnly, }: CopyToClipboardProps): React.JSX.Element;
