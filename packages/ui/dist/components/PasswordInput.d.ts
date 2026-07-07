import React from 'react';
import { InputProps } from './Input';
/** PasswordInput 组件属性 */
export interface PasswordInputProps extends Omit<InputProps, 'type'> {
    /** 初始是否显示密码 */
    defaultVisible?: boolean;
    /** 显示/隐藏切换按钮的 aria-label */
    toggleLabel?: string;
}
/**
 * PasswordInput — 密码输入框组件。
 *
 * 基于 Input 组件，增加密码显示/隐藏切换功能。
 * 支持所有 Input 的 props（placeholder、disabled、error 等）。
 *
 * @example
 * <PasswordInput
 *   label="密码"
 *   placeholder="请输入密码"
 *   onChange={(e) => setPassword(e.target.value)}
 * />
 */
export declare function PasswordInput({ defaultVisible, toggleLabel, ...inputProps }: PasswordInputProps): React.JSX.Element;
