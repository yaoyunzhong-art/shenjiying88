'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Col, Row, message } from 'antd';
import {
  Button,
  Card,
  Input,
  InputNumber,
  Modal,
  PageShell,
  Select,
  Space,
  Statistic,
  Tag,
} from '@m5/ui';

import {
  groupSettingsByCategory,
  type OperationSetting,
  type OperationsSnapshot,
  type SettingValue,
} from './operations-data';

type DiagnosticTagColor = 'default' | 'green' | 'orange' | 'red';

function formatSettingValue(setting: OperationSetting): string {
  if (setting.type === 'switch') {
    return setting.value ? '已开启' : '已关闭';
  }
  if (setting.type === 'number' && typeof setting.value === 'number' && setting.value < 1) {
    return `${(setting.value * 100).toFixed(0)}%`;
  }
  return String(setting.value);
}

function getDiagnosticTagColor(status: OperationsSnapshot['diagnostics'][number]['status']): DiagnosticTagColor {
  if (status === 'stable') return 'green';
  if (status === 'watch') return 'orange';
  if (status === 'risk') return 'red';
  return 'default';
}

export default function OperationsClient({
  snapshot,
}: {
  snapshot: OperationsSnapshot;
}) {
  const router = useRouter();
  const [isRefreshing, startRefresh] = useTransition();
  const [settings, setSettings] = useState(snapshot.settings);
  const [activeTab, setActiveTab] = useState(snapshot.categories[0] ?? '营业时间');
  const [editingSetting, setEditingSetting] = useState<OperationSetting | null>(null);
  const [draftValue, setDraftValue] = useState<SettingValue>('');
  const [saved, setSaved] = useState(true);

  useEffect(() => {
    setSettings(snapshot.settings);
    setActiveTab(snapshot.categories[0] ?? '营业时间');
    setEditingSetting(null);
    setSaved(true);
  }, [snapshot.categories, snapshot.settings]);

  const groupedSettings = useMemo(
    () => groupSettingsByCategory(settings, snapshot.categories),
    [settings, snapshot.categories],
  );

  const visibleSettings = useMemo(
    () => groupedSettings.find((group) => group.category === activeTab)?.items ?? [],
    [activeTab, groupedSettings],
  );

  const refreshSnapshot = () => {
    startRefresh(() => router.refresh());
  };

  const openEditor = (setting: OperationSetting) => {
    setEditingSetting(setting);
    setDraftValue(setting.value);
  };

  const commitDraftValue = () => {
    if (!editingSetting) return;
    setSettings((current) =>
      current.map((setting) =>
        setting.key === editingSetting.key ? { ...setting, value: draftValue } : setting,
      ),
    );
    setEditingSetting(null);
    setSaved(false);
    message.success(`参数 [${editingSetting.label}] 已更新`);
  };

  const resetChanges = () => {
    setSettings(snapshot.settings);
    setSaved(true);
    message.info('已重置为服务端快照下发值');
  };

  return (
    <PageShell title="运营管理" subtitle="server wrapper + snapshot loader + client renderer">
      <Space style={{ width: '100%', flexDirection: 'column', gap: 16, alignItems: 'stretch' }}>
        {snapshot.error ? (
          <Card>
            <span style={{ color: '#fbbf24', fontSize: 13 }}>{snapshot.error}</span>
          </Card>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: '#f8fafc', margin: 0 }}>运营管理</h2>
            <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 6 }}>
              营业参数 · 客流诊断 · 开关店配置 · Delivery {snapshot.deliveryMode} · source {snapshot.sourceLabel}
            </div>
          </div>
          <Space>
            <Button variant="outline" onClick={refreshSnapshot} loading={isRefreshing}>
              {isRefreshing ? '刷新中...' : '刷新快照'}
            </Button>
            <Button variant="outline" onClick={() => message.info('导出配置任务已登记')}>
              导出配置
            </Button>
            <Button onClick={() => message.info('默认模板比对已加入待办')}>恢复默认</Button>
            <Button
              type="primary"
              onClick={() => {
                setSaved(true);
                message.success('所有设置已保存');
              }}
            >
              保存全部
            </Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          {snapshot.realtime.map((metric) => (
            <Col key={metric.label} span={4}>
              <Card size="small">
                <Statistic
                  title={metric.label}
                  value={
                    metric.prefix
                      ? `${metric.prefix}${metric.value}`
                      : metric.suffix
                        ? `${metric.value}${metric.suffix}`
                        : metric.value
                  }
                  valueStyle={{ color: metric.color }}
                />
              </Card>
            </Col>
          ))}
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="自动化开启"
                value={snapshot.summary.automationEnabledCount}
                valueStyle={{ color: '#34d399' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic
                title="容量风险"
                value={snapshot.summary.lowCapacityRiskCount}
                valueStyle={{ color: '#f59e0b' }}
              />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title="配置项" value={settings.length} />
            </Card>
          </Col>
        </Row>

        <Card title="来源态诊断" subtitle="客户端仅承载交互，刷新统一回到服务端 snapshot loader">
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            {snapshot.diagnostics.map((diagnostic) => (
              <div
                key={diagnostic.id}
                style={{
                  border: '1px solid rgba(148, 163, 184, 0.16)',
                  borderRadius: 12,
                  padding: 14,
                  background: 'rgba(15, 23, 42, 0.35)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{diagnostic.title}</span>
                  <Tag color={getDiagnosticTagColor(diagnostic.status)}>{diagnostic.status}</Tag>
                </div>
                <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>{diagnostic.detail}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, borderBottom: '1px solid #1e293b', paddingBottom: 8, flexWrap: 'wrap' }}>
            {snapshot.categories.map((category) => (
              <div
                key={category}
                onClick={() => setActiveTab(category)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 14,
                  background: activeTab === category ? '#334155' : 'transparent',
                  color: activeTab === category ? '#f8fafc' : '#94a3b8',
                  transition: 'all 0.2s',
                }}
              >
                {category}
              </div>
            ))}
          </div>

          {visibleSettings.map((setting) => (
            <div
              key={setting.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 0',
                borderBottom: '1px solid rgba(148,163,184,0.08)',
                cursor: 'pointer',
              }}
              onClick={() => openEditor(setting)}
            >
              <div>
                <div style={{ color: '#e2e8f0', fontSize: 14, fontWeight: 500 }}>{setting.label}</div>
                <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>{setting.desc}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#fbbf24', fontSize: 16, fontWeight: 600 }}>{formatSettingValue(setting)}</span>
                <Button
                  size="small"
                  type="link"
                  onClick={(event) => {
                    event.stopPropagation();
                    openEditor(setting);
                  }}
                >
                  编辑
                </Button>
              </div>
            </div>
          ))}
        </Card>

        <Card>
          <Space style={{ justifyContent: 'space-between', width: '100%' }}>
            <div>
              <Tag color={saved ? 'green' : 'orange'} style={{ marginRight: 8 }}>
                配置状态: {saved ? '与服务端快照一致' : '存在本地未提交修改'}
              </Tag>
              <span style={{ color: '#64748b', fontSize: 12 }}>
                generatedAt {snapshot.generatedAt} · refreshPath {snapshot.refreshPath}
              </span>
            </div>
            <Space>
              <Button onClick={resetChanges}>重置</Button>
              <Button onClick={() => message.info('变更单草稿已创建')}>生成变更单</Button>
            </Space>
          </Space>
        </Card>

        <Modal
          title={`编辑参数 - ${editingSetting?.label ?? ''}`}
          open={Boolean(editingSetting)}
          onCancel={() => setEditingSetting(null)}
          onOk={commitDraftValue}
          okText="保存"
        >
          {editingSetting ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <div style={{ background: 'rgba(148,163,184,0.06)', borderRadius: 8, padding: 12 }}>
                <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 4 }}>说明</div>
                <div style={{ color: '#e2e8f0', fontSize: 14 }}>{editingSetting.desc}</div>
              </div>
              {editingSetting.type === 'switch' ? (
                <Select
                  value={draftValue ? 'true' : 'false'}
                  style={{ width: '100%' }}
                  options={[
                    { value: 'true', label: '开启' },
                    { value: 'false', label: '关闭' },
                  ]}
                  onChange={(value) => setDraftValue(value === 'true')}
                />
              ) : null}
              {editingSetting.type === 'number' ? (
                <InputNumber
                  style={{ width: '100%' }}
                  value={Number(draftValue)}
                  onChange={(value) => setDraftValue(value ?? 0)}
                />
              ) : null}
              {editingSetting.type === 'time' ? (
                <Input value={String(draftValue)} onChange={(event) => setDraftValue(event.target.value)} />
              ) : null}
            </Space>
          ) : null}
        </Modal>
      </Space>
    </PageShell>
  );
}
