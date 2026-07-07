import React from 'react';
import { type SubmitButtonVariant } from './SubmitButton';
/** 字段验证规则 */
export interface FormPageFieldRule {
    /** 验证函数，返回错误信息或 null */
    validate: (value: unknown) => string | null;
}
/** 表单字段定义 */
export interface FormPageField<T = Record<string, unknown>> {
    /** 字段 key */
    key: keyof T & string;
    /** 标签 */
    label: string;
    /** 是否必填 */
    required?: boolean;
    /** 占位符 */
    placeholder?: string;
    /** 帮助文本 */
    helper?: string;
    /** 初始值 */
    initialValue?: T[keyof T & string];
    /** 输入类型 */
    type?: 'text' | 'email' | 'number' | 'password' | 'textarea' | 'select' | 'date';
    /** Select 选项 */
    options?: {
        label: string;
        value: string;
    }[];
    /** 验证规则 */
    rules?: FormPageFieldRule[];
}
/** 表单页标题 & 描述区域 */
export interface FormPageScaffoldMeta {
    title: string;
    description?: string;
    /** 删除按钮配置 */
    deleteAction?: {
        label: string;
        onDelete: () => void | Promise<void>;
        confirmText?: string;
    };
}
/** 向服务端提交的数据转换 */
export interface FormPageSubmitResult<T = Record<string, unknown>> {
    data: T;
    message?: string;
}
export interface FormPageScaffoldProps<T extends Record<string, unknown> = Record<string, unknown>> {
    /** 页面元信息 */
    meta: FormPageScaffoldMeta;
    /** 字段定义 */
    fields: FormPageField<T>[];
    /** 提交处理（返回 null 表示失败） */
    onSubmit: (data: T) => Promise<FormPageSubmitResult<T> | null>;
    /** 表单变化回调 */
    onChange?: (key: keyof T & string, value: unknown) => void;
    /** 自定义顶层操作按钮 */
    topActions?: React.ReactNode;
    /** 提交按钮文案 */
    submitLabel?: string;
    /** 提交按钮变体 */
    submitVariant?: SubmitButtonVariant;
    /** 返回路径 */
    backUrl?: string;
    /** 页面最大宽度 */
    maxWidth?: number;
    /** 自定义样式 */
    className?: string;
    /** 自定义底部 */
    footer?: React.ReactNode;
    /** 自定义成功回调 */
    onSuccess?: (result: FormPageSubmitResult<T>) => void;
    /** 是否禁用所有字段 */
    disabled?: boolean;
}
/** 运行字段级验证，返回错误映射 */
export declare function validateFormFields<T extends Record<string, unknown>>(fields: FormPageField<T>[], values: Record<string, unknown>): Record<string, string>;
/**
 * FormPageScaffold — 表单页面骨架组件。
 *
 * 整合表单字段渲染、客户端验证、提交反馈、错误处理，
 * 提供标准化的表单页布局。与 FormField、SubmitButton、
 * FormSubmitFeedback 协同工作。
 *
 * @example
 * // 创建资源表单
 * <FormPageScaffold
 *   meta={{ title: '新建商品', description: '添加一个新的商品条目' }}
 *   fields={[
 *     { key: 'name', label: '商品名称', required: true },
 *     { key: 'price', label: '价格', type: 'number', required: true,
 *       rules: [{ validate: (v) => Number(v) > 0 ? null : '价格必须大于0' }] },
 *     { key: 'category', label: '分类', type: 'select',
 *       options: [{ label: '电子', value: 'electronics' }, { label: '服装', value: 'clothing' }] },
 *   ]}
 *   onSubmit={async (data) => {
 *     await api.createProduct(data);
 *     return { data, message: '商品创建成功' };
 *   }}
 *   backUrl="/products"
 * />
 *
 * @example
 * // 编辑模式（含删除按钮）
 * <FormPageScaffold
 *   meta={{
 *     title: '编辑商品',
 *     deleteAction: {
 *       label: '删除商品',
 *       onDelete: () => api.deleteProduct(id),
 *       confirmText: '确定要删除吗？',
 *     },
 *   }}
 *   fields={[...]}
 *   onSubmit={async (data) => {
 *     await api.updateProduct(id, data);
 *     return { data, message: '保存成功' };
 *   }}
 * />
 */
export declare function FormPageScaffold<T extends Record<string, unknown> = Record<string, unknown>>({ meta, fields, onSubmit, onChange, topActions, submitLabel, submitVariant, backUrl, maxWidth, className, footer, onSuccess, disabled, }: FormPageScaffoldProps<T>): React.JSX.Element;
