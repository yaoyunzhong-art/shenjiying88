'use client';

/**
 * 三级独立配置 - 客户端 (tab 切换 / 编辑 / 回滚)
 *
 * 数据由服务端 page.tsx 通过 @m5/sdk.getTenantWorkbenchConfigs 加载。
 * 编辑 / 回滚通过 setTenantConfigBatch / rollbackTenantConfig 走真实 API。
 *
 * UI 复用 @m5/ui/three-level-config 提供的常量:
 *   - WORKBENCH_CARDS (W-S / W-T / W-B 卡片元数据)
 *   - CATEGORY_LABELS / SENSITIVITY_LABELS / SENSITIVITY_COLORS
 */

import { useMemo, useState, useTransition } from 'react';
import {
  CATEGORY_LABELS,
  SENSITIVITY_COLORS,
  SENSITIVITY_LABELS,
  WORKBENCH_CARDS,
  type ConfigSensitivity,
  type WorkbenchCode,
} from '@m5/ui/three-level-config';
import { ApiClient, getDefaultApiBaseUrl, type TenantConfigEffective } from '@m5/sdk';
import type { WorkbenchSnapshot } from './page';

interface Props {
  snapshot: Record<'ws' | 'wt' | 'wb', WorkbenchSnapshot>;
  tenantId: string;
}

const CODE_TO_KEY: Record<WorkbenchCode, 'ws' | 'wt' | 'wb'> = {
  'W-S': 'ws',
  'W-T': 'wt',
  'W-B': 'wb',
};

function inferSensitivity(key: string): ConfigSensitivity {
  if (key.includes('webhook') || key.includes('secret') || key.includes('tax_id')) return 'secret';
  if (key.includes('audit') || key.includes('retention')) return 'restricted';
  if (key.includes('budget') || key.includes('threshold')) return 'internal';
  return 'public';
}

function getCategory(key: string): string {
  const idx = key.indexOf('.');
  return idx > 0 ? key.slice(0, idx) : 'other';
}

function getConfigId(key: string, level: 'store' | 'tenant' | 'brand'): string {
  // 后端 ConfigInstance.id 约定,前端用 key + level 推算 (实际后端会返回真实 id)
  return `cfg:${level}:${key}`;
}

function createClient(): ApiClient {
  return new ApiClient({
    baseUrl: getDefaultApiBaseUrl(),
    tenantId: 'tenant-demo',
    brandId: 'brand-demo',
    storeId: 'store-001',
    marketCode: 'cn-mainland',
  });
}

export default function ThreeLevelConfigClient({ snapshot, tenantId }: Props) {
  const [activeCode, setActiveCode] = useState<WorkbenchCode>('W-T');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [data, setData] = useState<Record<'ws' | 'wt' | 'wb', WorkbenchSnapshot>>(snapshot);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [feedback, setFeedback] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const active = data[CODE_TO_KEY[activeCode]];
  const filteredItems = useMemo<TenantConfigEffective[]>(() => {
    if (activeCategory === 'all') return active.items;
    return active.items.filter((i) => getCategory(i.key) === activeCategory);
  }, [active, activeCategory]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of active.items) set.add(getCategory(item.key));
    return Array.from(set);
  }, [active.items]);

  function handleEditStart(item: TenantConfigEffective) {
    setEditingKey(item.key);
    setEditingValue(item.value);
    setFeedback(null);
  }

  function handleSave() {
    if (!editingKey) return;
    const key = editingKey;
    const newValue = editingValue;
    startTransition(async () => {
      try {
        const client = createClient();
        const result = await client.setTenantConfigBatch([{ key, value: newValue }], { cache: 'no-store' });
        setFeedback({ kind: 'success', message: `已保存 ${key} = ${newValue} (返回 ${result.total} 条)` });
        // 乐观更新本地
        setData((prev) => {
          const slot = CODE_TO_KEY[activeCode];
          const next = { ...prev };
          next[slot] = {
            ...next[slot],
            items: next[slot].items.map((i) => (i.key === key ? { ...i, value: newValue } : i)),
          };
          return next;
        });
        setEditingKey(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setFeedback({ kind: 'error', message: `保存失败: ${message}` });
      }
    });
  }

  function handleCancelEdit() {
    setEditingKey(null);
    setEditingValue('');
  }

  function handleRollback(item: TenantConfigEffective) {
    const configId = getConfigId(item.key, active.level);
    const key = item.key;
    startTransition(async () => {
      try {
        const client = createClient();
        // 默认回滚到 v1 (旧版),后端按 auditLogs 链回溯
        await client.rollbackTenantConfig(1, configId, { cache: 'no-store' });
        setFeedback({ kind: 'success', message: `已提交回滚 ${key} → v1` });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setFeedback({ kind: 'error', message: `回滚失败: ${message}` });
      }
    });
  }

  return (
    <div data-testid="three-level-config-page" data-tenant={tenantId}>
      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(3, 1fr)',
          marginBottom: 20,
        }}
      >
        {WORKBENCH_CARDS.map((card) => {
          const isActive = card.workbench === activeCode;
          const slot = data[CODE_TO_KEY[card.workbench]];
          return (
            <button
              key={card.workbench}
              type="button"
              onClick={() => {
                setActiveCode(card.workbench);
                setActiveCategory('all');
                setEditingKey(null);
              }}
              data-testid={`workbench-tab-${card.workbench}`}
              style={{
                padding: 16,
                border: `2px solid ${isActive ? card.color : '#e8e8e8'}`,
                borderRadius: 8,
                background: isActive ? `${card.color}10` : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: card.color, fontSize: 16 }}>{card.workbench}</strong>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>{slot.total} 项</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 4 }}>{card.title}</div>
              <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>{slot.description}</div>
              <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 6 }}>
                模式: {slot.deliveryMode}
                {slot.error ? ` (${slot.error.slice(0, 60)})` : ''}
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
        <ChipButton active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} label="全部" />
        {categories.map((cat) => (
          <ChipButton
            key={cat}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            label={CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat}
          />
        ))}
      </div>

      {feedback ? (
        <div
          data-testid="three-level-feedback"
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 6,
            background: feedback.kind === 'success' ? 'rgba(82, 196, 26, 0.12)' : 'rgba(245, 34, 45, 0.12)',
            color: feedback.kind === 'success' ? '#237804' : '#a8071a',
            border: `1px solid ${feedback.kind === 'success' ? '#52c41a' : '#f5222d'}`,
            fontSize: 13,
          }}
        >
          {feedback.message}
        </div>
      ) : null}

      {active.deliveryMode === 'fallback' ? (
        <div
          data-testid="three-level-fallback"
          style={{
            padding: 24,
            textAlign: 'center',
            color: '#8c8c8c',
            background: 'rgba(15, 23, 42, 0.18)',
            borderRadius: 8,
            border: '1px dashed rgba(148, 163, 184, 0.3)',
          }}
        >
          {activeCode} 当前为空态 — 后端 <code>GET /tenant-config/workbench/{activeCode}</code> 暂未返回数据
          {active.error ? ` (${active.error.slice(0, 100)})` : ''}
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          data-testid="three-level-empty"
          style={{ padding: 24, textAlign: 'center', color: '#8c8c8c' }}
        >
          当前分类无配置项
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {filteredItems.map((item) => {
            const sensitivity = inferSensitivity(item.key);
            const isEditing = editingKey === item.key;
            return (
              <div
                key={item.key}
                data-testid={`cfg-row-${item.key}`}
                data-inherited={item.inherited}
                data-masked={item.isMasked}
                style={{
                  padding: 14,
                  border: '1px solid #f0f0f0',
                  borderRadius: 6,
                  background: item.inherited ? '#fafafa' : '#fff',
                  display: 'grid',
                  gridTemplateColumns: '1fr 2fr auto',
                  gap: 12,
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#262626' }}>{item.key}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    <Tag color={SENSITIVITY_COLORS[sensitivity]} label={SENSITIVITY_LABELS[sensitivity]} />
                    {item.inherited ? (
                      <Tag color="#8c8c8c" label={`继承自 ${item.sourceLevel}`} />
                    ) : null}
                  </div>
                </div>
                <div>
                  {isEditing ? (
                    <input
                      data-testid={`cfg-input-${item.key}`}
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        border: '1px solid #d9d9d9',
                        borderRadius: 4,
                        fontFamily: 'monospace',
                      }}
                    />
                  ) : (
                    <div
                      data-testid={`cfg-value-${item.key}`}
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 13,
                        color: item.isMasked ? '#8c8c8c' : '#262626',
                        fontStyle: item.isMasked ? 'italic' : 'normal',
                      }}
                    >
                      {item.isMasked ? `${item.value} (已脱敏)` : item.value}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={isPending}
                        data-testid={`cfg-save-${item.key}`}
                        style={{
                          padding: '4px 10px',
                          border: 'none',
                          borderRadius: 4,
                          background: '#52c41a',
                          color: '#fff',
                          cursor: isPending ? 'wait' : 'pointer',
                          opacity: isPending ? 0.7 : 1,
                        }}
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        style={{
                          padding: '4px 10px',
                          border: '1px solid #d9d9d9',
                          borderRadius: 4,
                          background: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        取消
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleEditStart(item)}
                        data-testid={`cfg-edit-${item.key}`}
                        style={{
                          padding: '4px 10px',
                          border: '1px solid #1677ff',
                          borderRadius: 4,
                          background: '#fff',
                          color: '#1677ff',
                          cursor: 'pointer',
                        }}
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRollback(item)}
                        disabled={isPending}
                        data-testid={`cfg-rollback-${item.key}`}
                        style={{
                          padding: '4px 10px',
                          border: '1px solid #fa8c16',
                          borderRadius: 4,
                          background: '#fff',
                          color: '#fa8c16',
                          cursor: isPending ? 'wait' : 'pointer',
                          opacity: isPending ? 0.7 : 1,
                        }}
                      >
                        回滚
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ChipButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 12px',
        fontSize: 13,
        border: '1px solid #d9d9d9',
        borderRadius: 16,
        background: active ? '#1677ff' : '#fff',
        color: active ? '#fff' : '#595959',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

function Tag({ color, label }: { color: string; label: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 8px',
        fontSize: 11,
        background: `${color}20`,
        color,
        borderRadius: 10,
      }}
    >
      {label}
    </span>
  );
}
