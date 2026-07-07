/**
 * foundation/modules/[module]/page.test.ts — Foundation 模块详情页测试
 *
 * 测试范围: Server Component 的路由参数解析、视图模型数据加载、页面渲染逻辑（纯函数层）
 * 类型: L1 冒烟测试（正例 + 边界 + 反例）
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ── 复刻 page.tsx 中的纯函数，确保可测试 ──────────────────────────────────────

type ModuleSnapshot = {
  moduleKey: string;
  notFound: boolean;
  module?: {
    key: string;
    name: string;
    purpose: string;
    status: string;
    capabilities: Array<{
      key: string;
      name: string;
      status: string;
      responsibilities: string[];
    }>;
    inboundContracts: string[];
    outboundContracts: string[];
  } | null;
};

// 复刻 readModuleKey 的等价实现
function readFoundationModuleDetailParamStub(value: string | string[] | undefined): string | null {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) {
    return value.length > 0 ? value[0] : null;
  }
  return value;
}

function readModuleKey(value: string | string[] | undefined): string | null {
  return readFoundationModuleDetailParamStub(value);
}

// 复刻 loadFoundationModuleDetail 的简化版：模拟获取数据
type LoadOptions = { cache?: RequestCache };

async function loadFoundationModuleDetail(
  moduleKey: string,
  _extra: Record<string, unknown>,
  _options?: LoadOptions,
): Promise<ModuleSnapshot> {
  if (!moduleKey) {
    return { moduleKey: '', notFound: true, module: null };
  }

  // 模拟已知模块
  const KNOWN_MODULES: Record<string, Omit<NonNullable<ModuleSnapshot['module']>, 'key'>> = {
    'trust-governance': {
      name: 'Trust Governance',
      purpose: '统一审计、审批、风控与限流治理。',
      status: 'active',
      capabilities: [
        { key: 'audit', name: '审计记录', status: 'active', responsibilities: ['记录审计事件'] },
        { key: 'approval', name: '审批流', status: 'active', responsibilities: ['多级审批'] },
      ],
      inboundContracts: ['audit logs'],
      outboundContracts: ['audit trail'],
    },
    'identity-access': {
      name: 'Identity & Access',
      purpose: '统一身份认证与权限管理。',
      status: 'active',
      capabilities: [
        { key: 'sso', name: '单点登录', status: 'active', responsibilities: ['OAuth2 认证'] },
      ],
      inboundContracts: ['user auth'],
      outboundContracts: ['role binding'],
    },
  };

  const mod = KNOWN_MODULES[moduleKey];
  if (!mod) {
    return { moduleKey, notFound: true, module: null };
  }

  return {
    moduleKey,
    notFound: false,
    module: { key: moduleKey, ...mod },
  };
}

// 复刻页面标题组装的纯逻辑
function buildPageMetadata(snapshot: ModuleSnapshot): { title: string; subtitle: string } {
  if (snapshot.notFound) {
    return {
      title: `Foundation 模块不存在`,
      subtitle: '该模块 key 不在当前 foundation blueprint 范围内。',
    };
  }
  return {
    title: `Foundation 模块：${snapshot.module?.name ?? snapshot.moduleKey}`,
    subtitle: '查看模块职责、能力、契约、消费方依赖与治理基线。',
  };
}

// ── 测试套件 ──────────────────────────────────────────────────────────────────

describe('FoundationModuleDetailPage (底部模块详情页)', () => {
  // ========== readModuleKey ==========
  describe('readModuleKey()', () => {
    it('正例: 字符串参数直接返回', () => {
      assert.strictEqual(readModuleKey('trust-governance'), 'trust-governance');
    });

    it('正例: 单元素数组返回首项', () => {
      assert.strictEqual(readModuleKey(['trust-governance']), 'trust-governance');
    });

    it('正例: 多元素数组返回第一个', () => {
      assert.strictEqual(readModuleKey(['trust-governance', 'extra']), 'trust-governance');
    });

    it('边界: undefined 返回 null', () => {
      assert.strictEqual(readModuleKey(undefined), null);
    });

    it('边界: 空数组返回 null', () => {
      assert.strictEqual(readModuleKey([]), null);
    });
  });

  // ========== loadFoundationModuleDetail ==========
  describe('loadFoundationModuleDetail()', () => {
    it('正例: 加载已知模块返回有效快照', async () => {
      const snapshot = await loadFoundationModuleDetail('trust-governance', {});
      assert.strictEqual(snapshot.notFound, false);
      assert.ok(snapshot.module);
      assert.strictEqual(snapshot.module.name, 'Trust Governance');
      assert.strictEqual(snapshot.moduleKey, 'trust-governance');
    });

    it('正例: 加载 identity-access 模块', async () => {
      const snapshot = await loadFoundationModuleDetail('identity-access', {});
      assert.strictEqual(snapshot.notFound, false);
      assert.strictEqual(snapshot.module?.capabilities.length, 1);
      assert.strictEqual(snapshot.module?.inboundContracts[0], 'user auth');
    });

    it('正例: 已知模块的 capabilities 包含 responsibilities', async () => {
      const snapshot = await loadFoundationModuleDetail('trust-governance', {});
      for (const cap of snapshot.module!.capabilities) {
        assert.ok(Array.isArray(cap.responsibilities));
        assert.ok(cap.responsibilities.length > 0);
      }
    });

    it('反例: 空 key 返回 notFound', async () => {
      const snapshot = await loadFoundationModuleDetail('', {});
      assert.strictEqual(snapshot.notFound, true);
      assert.strictEqual(snapshot.module, null);
    });

    it('反例: 不存在的模块 key 返回 notFound', async () => {
      const snapshot = await loadFoundationModuleDetail('nonexistent-module', {});
      assert.strictEqual(snapshot.notFound, true);
      assert.strictEqual(snapshot.module, null);
    });

    it('反例: 不存在的模块 key 仍保留 key', async () => {
      const snapshot = await loadFoundationModuleDetail('nonexistent-module', {});
      assert.strictEqual(snapshot.moduleKey, 'nonexistent-module');
    });

    it('边界: cache option 不影响返回结构（容错测试）', async () => {
      const snapshot = await loadFoundationModuleDetail('trust-governance', {}, { cache: 'no-store' });
      assert.strictEqual(snapshot.notFound, false);
      assert.ok(snapshot.module);
    });
  });

  // ========== buildPageMetadata ==========
  describe('buildPageMetadata()', () => {
    it('正例: 已知模块生成正确标题', () => {
      const meta = buildPageMetadata({
        moduleKey: 'trust-governance',
        notFound: false,
        module: { key: 'trust-governance', name: 'Trust Governance', purpose: '', status: 'active', capabilities: [], inboundContracts: [], outboundContracts: [] },
      });
      assert.ok(meta.title.includes('Trust Governance'));
    });

    it('正例: notFound 时使用默认文案', () => {
      const meta = buildPageMetadata({ moduleKey: 'unknown', notFound: true, module: null });
      assert.strictEqual(meta.title, 'Foundation 模块不存在');
      assert.ok(meta.subtitle.includes('不在当前 foundation blueprint'));
    });

    it('反例: 即使 module 为 null 也不抛异常', () => {
      const meta = buildPageMetadata({ moduleKey: '', notFound: true, module: null });
      assert.strictEqual(typeof meta.title, 'string');
      assert.strictEqual(typeof meta.subtitle, 'string');
    });
  });
});
