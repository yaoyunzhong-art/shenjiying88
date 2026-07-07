import React from 'react';
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
export declare const OTPInput: React.FC<OTPInputProps>;
export default OTPInput;
