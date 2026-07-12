/**
 * LLM 接入配置管理页面 — LLM Config Management (Next.js App Router)
 *
 * 功能:
 * - 展示已接入的 LLM 模型提供商列表（OpenAI / 通义千问 / Claude / 本地模型）
 * - 管理 API Key、Endpoint、模型选择、配额限流
 * - 支持搜索、新建、编辑、启用/禁用
 * - 空状态 / 加载中 / 错误回退
 */
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSkeleton, EmptyState, ErrorBoundary } from '@m5/ui';
import LLMConfigClient from './llm-config-client';

export const metadata: Metadata = {
  title: 'LLM 接入配置 - M5 指挥台',
  description:
    '管理多 LLM 提供商接入配置，支持 OpenAI、通义千问、Claude 等模型。可配置 API Key、Endpoint、模型参数、配额限流和健康检查。',
  openGraph: {
    title: 'LLM 接入配置 | AI 模型管理',
    description: '管理多 LLM 提供商接入配置，支持 OpenAI、通义千问、Claude 等模型',
    type: 'website',
  },
};

/** 预置的 LLM 提供商配置项 — 用于空状态提示和快速引导 */
const PRESET_PROVIDERS = [
  { key: 'openai', label: 'OpenAI', models: 'GPT-4o / GPT-4o-mini', icon: '🤖' },
  { key: 'qwen', label: '通义千问', models: 'Qwen-Max / Qwen-Plus', icon: '🌐' },
  { key: 'claude', label: 'Anthropic Claude', models: 'Claude 3.5 Sonnet / Haiku', icon: '🧠' },
  { key: 'local', label: '本地模型 (Ollama)', models: 'Llama 3 / Mistral', icon: '💻' },
];

/** 加载占位 */
function LLMConfigLoadingFallback() {
  return (
    <div style={{ padding: 32, maxWidth: 900, margin: '0 auto' }}>
      <LoadingSkeleton variant="default" rows={1} label="加载标题..." />
      <div style={{ height: 24 }} />
      <LoadingSkeleton variant="card" rows={4} label="加载提供商卡片..." />
      <div style={{ height: 16 }} />
      <LoadingSkeleton variant="card" rows={3} label="加载配置表单..." />
    </div>
  );
}

/** 错误回退 */
function LLMConfigErrorFallback() {
  return (
    <EmptyState
      title="配置加载异常"
      description="无法加载 LLM 提供商配置列表。请检查网络连接及后端配置服务是否正常。"
      action={<a href="/llm-config">重试</a>}
    />
  );
}

/**
 * 空状态 — 暂无 LLM 提供商配置
 * 展示预置提供商引导用户快速接入
 */
function LLMConfigEmptyState() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 32 }}>
      <EmptyState
        title="暂无 LLM 配置"
        description="尚未接入任何 LLM 模型提供商，请点击下方卡片快速开始配置。"
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginTop: 24,
        }}
      >
        {PRESET_PROVIDERS.map((p) => (
          <div
            key={p.key}
            style={{
              padding: 20,
              borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(148,163,184,0.12)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.borderColor = 'rgba(245,158,11,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = 'rgba(148,163,184,0.12)';
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
            <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{p.label}</div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>{p.models}</div>
            <div
              style={{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 6,
                background: 'rgba(245,158,11,0.1)',
                color: '#f59e0b',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              立即配置
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LLMConfigPage() {
  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: 'LLM 接入配置',
            applicationCategory: 'BusinessApplication',
            description:
              '管理多 LLM 提供商接入配置，支持 OpenAI、通义千问、Claude、本地模型。',
          }),
        }}
      />

      <ErrorBoundary fallback={() => <LLMConfigErrorFallback />}>
        <Suspense fallback={<LLMConfigLoadingFallback />}>
          <LLMConfigClient />
        </Suspense>
      </ErrorBoundary>

      {/* 底部提示 — 安全说明 */}
      <div
        style={{
          marginTop: 24,
          padding: '12px 16px',
          borderRadius: 8,
          background: 'rgba(251,191,36,0.05)',
          border: '1px solid rgba(251,191,36,0.15)',
          fontSize: 12,
          color: '#94a3b8',
          lineHeight: 1.6,
          maxWidth: 900,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <strong style={{ color: '#fbbf24' }}>🔒 安全提示</strong>
        <br />
        API Key 存储采用 AES-256 加密。建议定期轮换密钥（推荐每 90 天）。
        生产环境请勿使用测试 / 弱密钥。密钥修改后原有 API 调用将在 5 分钟内生效。
      </div>
    </>
  );
}
