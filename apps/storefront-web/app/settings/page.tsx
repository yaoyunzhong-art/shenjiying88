'use client';

import React, { useState, useEffect } from 'react';

import { PageShell, Tabs } from '@m5/ui';
import { useTriState } from '../_components/useTriState';
import { TriStateRenderer } from '../_components/TriStateRenderer';

// ---- 类型 ----

type SettingsTab = 'general' | 'notifications' | 'security' | 'billing';

interface SettingSection {
  key: SettingsTab;
  label: string;
  fields: { label: string; value: string; type: 'text' | 'toggle' | 'select' }[];
}

// ---- Mock 数据 ----

const MOCK_SETTINGS: SettingSection[] = [
  {
    key: 'general',
    label: '通用设置',
    fields: [
      { label: '门店名称', value: 'Demo Store 旗舰店', type: 'text' },
      { label: '门店地址', value: '深圳市南山区科技园', type: 'text' },
      { label: '联系电话', value: '0755-88888888', type: 'text' },
      { label: '营业时间', value: '08:00-22:00', type: 'text' },
    ],
  },
  {
    key: 'notifications',
    label: '通知设置',
    fields: [
      { label: '低库存预警', value: '开启', type: 'toggle' },
      { label: '订单通知', value: '开启', type: 'toggle' },
      { label: '员工排班变更', value: '关闭', type: 'toggle' },
      { label: '系统更新通知', value: '开启', type: 'toggle' },
    ],
  },
  {
    key: 'security',
    label: '安全设置',
    fields: [
      { label: '双因素认证', value: '已开启', type: 'toggle' },
      { label: '登录会话时长', value: '24小时', type: 'select' },
      { label: '密码过期天数', value: '90天', type: 'select' },
      { label: '登录IP白名单', value: '未配置', type: 'text' },
    ],
  },
  {
    key: 'billing',
    label: '账单设置',
    fields: [
      { label: '当前套餐', value: '专业版', type: 'text' },
      { label: '月费', value: '¥1,999/月', type: 'text' },
      { label: '下次续费日期', value: '2026-08-15', type: 'text' },
      { label: '发票抬头', value: '深圳Demo科技有限公司', type: 'text' },
    ],
  },
];

// ---- 组件 ----

export default function SettingsPage() {
  const { loading, error, wrapLoad } = useTriState({ loading: true });
  const [sections, setSections] = useState<SettingSection[]>([]);
  const [pageReady, setPageReady] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // 模拟加载数据
  useEffect(() => {
    wrapLoad(
      new Promise<SettingSection[]>((resolve) => {
        setTimeout(() => resolve(MOCK_SETTINGS), 300);
      }),
    ).then((data) => {
      if (data) setSections(data);
      setPageReady(true);
    });
  }, []);

  const currentSection = sections.find((s) => s.key === activeTab);

  return (
    <PageShell
      title="系统设置"
      description="管理门店系统各项配置。"
    >
      <TriStateRenderer
        loading={loading}
        empty={sections.length === 0 && pageReady}
        error={error}
        onRetry={() =>
          wrapLoad(
            new Promise<SettingSection[]>((resolve) => {
              setTimeout(() => resolve(MOCK_SETTINGS), 300);
            }),
          ).then((data) => {
            if (data) setSections(data);
            setPageReady(true);
          })
        }
      >
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
          {/* 左侧导航 */}
          <div style={{ minWidth: 200 }}>
            <Tabs
              items={sections.map((s) => ({ key: s.key, label: s.label }))}
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as SettingsTab)}
              variant="pills"
            />
          </div>

          {/* 右侧内容 */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.12)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '14px 20px',
                  fontSize: 15,
                  fontWeight: 600,
                  color: '#e2e8f0',
                  borderBottom: '1px solid rgba(148,163,184,0.08)',
                }}
              >
                {currentSection?.label ?? '设置'}
              </div>
              {currentSection?.fields.map((field, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 20px',
                    borderBottom: idx < (currentSection?.fields.length ?? 0) - 1
                      ? '1px solid rgba(148,163,184,0.06)'
                      : 'none',
                  }}
                >
                  <span style={{ fontSize: 14, color: '#cbd5e1' }}>{field.label}</span>
                  <span style={{
                    fontSize: 13,
                    color: field.type === 'toggle' ? '#4ade80' : '#94a3b8',
                    fontWeight: field.type === 'toggle' ? 500 : 400,
                  }}>
                    {field.value}
                  </span>
                </div>
              ))}
            </div>

            {currentSection && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <button
                  style={{
                    padding: '8px 24px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#2563eb',
                    color: '#fff',
                    fontSize: 14,
                    cursor: 'pointer',
                  }}
                  onClick={() => alert('设置已保存（模拟）')}
                >
                  保存设置
                </button>
              </div>
            )}
          </div>
        </div>
      </TriStateRenderer>
    </PageShell>
  );
}
