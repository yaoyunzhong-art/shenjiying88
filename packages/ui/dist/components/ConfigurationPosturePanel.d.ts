import React from 'react';
/** 密钥态势 */
export interface SecretPosture {
    total: number;
    rotationDue: number;
    expired: number;
}
/** 证书态势 */
export interface CertificatePosture {
    total: number;
    expiringSoon: number;
    expired: number;
}
/** 配置态势面板属性 */
export interface ConfigurationPosturePanelProps {
    /** 密钥态势 */
    secrets: SecretPosture;
    /** 证书态势 */
    certificates: CertificatePosture;
    /** 面板标题 */
    title?: string;
}
/**
 * ConfigurationPosturePanel — 配置态势面板
 *
 * 聚合展示密钥与证书的健康风险指标，用于 configuration workspace overview 区域。
 * 同时渲染风险占比进度条和标签。
 *
 * @example
 * <ConfigurationPosturePanel
 *   secrets={{ total: 24, rotationDue: 3, expired: 1 }}
 *   certificates={{ total: 12, expiringSoon: 2, expired: 0 }}
 *   title="配置治理态势"
 * />
 */
export declare function ConfigurationPosturePanel({ secrets, certificates, title, }: ConfigurationPosturePanelProps): React.JSX.Element;
