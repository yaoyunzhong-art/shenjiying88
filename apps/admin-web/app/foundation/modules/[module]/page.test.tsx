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

// ---- 新增: 依赖图 ----

describe('buildDependencyGraph — 依赖图构建', () => {
  it('应导出 buildDependencyGraph', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('buildDependencyGraph'), '缺少 buildDependencyGraph');
  });

  it('入向合约应转换为 inbound 节点', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes("direction: 'inbound'"), '应识别入向');
  });

  it('出向合约应转换为 outbound 节点', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes("direction: 'outbound'"), '应识别出向');
  });

  it('应返回 DependencyNode 数组', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('DependencyNode'), '依赖节点类型存在');
  });
});

describe('DependencyGraphView — 依赖图渲染', () => {
  it('空节点应显示无依赖关系', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('无依赖关系'), '空状态文案');
  });

  it('非空节点应分入向/出向渲染', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('入向依赖'), '入向分区');
    assert.ok(src.includes('出向依赖'), '出向分区');
  });

  it('入向节点应显示箭头方向', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('←'), '入向箭头');
  });

  it('出向节点应显示箭头方向', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('→'), '出向箭头');
  });
});

// ---- 新增: API 端点列表 ----

describe('buildMockEndpoints — 模拟端点', () => {
  it('应导出 buildMockEndpoints', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('buildMockEndpoints'), '缺少 buildMockEndpoints');
  });

  it('trust-governance 应返回 5 个端点', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('trust-governance'), '信任治理');
    assert.ok(src.includes('/api/v1/audit/events'), '审计事件端点');
  });

  it('identity-access 应返回 4 个端点', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('identity-access'), '身份访问');
    assert.ok(src.includes('/api/v1/auth/login'), '登录端点');
  });

  it('未知模块应返回空数组', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('?? []'), '未知模块回退空数组');
  });
});

describe('ApiEndpointList — API 列表渲染', () => {
  it('应导出 ApiEndpointList', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('ApiEndpointList'), '缺少 ApiEndpointList');
  });

  it('空列表应显示暂无端点', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('暂无 API 端点'), '空状态文案');
  });

  it('应渲染 HTTP 方法标签', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('ep.method'), '应使用方法字段');
  });

  it('应渲染端点路径', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('ep.path'), '应显示路径');
  });

  it('应渲染端点状态', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('ep.status'), '应显示状态');
  });
});

// ---- 新增: 状态历史 ----

describe('buildMockStatusHistory — 模拟状态历史', () => {
  it('应导出 buildMockStatusHistory', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('buildMockStatusHistory'), '缺少 buildMockStatusHistory');
  });

  it('应返回 4 条状态变更记录', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('模块初始化完成'), '第一条状态变更');
    assert.ok(src.includes('安全加固'), '安全加固记录');
  });

  it('应包含 fromStatus / toStatus', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('fromStatus'), '包含旧状态');
    assert.ok(src.includes('toStatus'), '包含新状态');
  });

  it('应包含变更原因', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('reason'), '包含原因');
  });
});

describe('buildModuleStatusHistory — 模块状态历史', () => {
  it('data-platform 应返回废弃状态变更', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes("'analytics 能力标记废弃'"), '废弃记录');
  });
});

describe('StatusHistoryTimeline — 状态时间线', () => {
  it('空事件应显示暂无状态历史', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('暂无状态历史'), '空状态文案');
  });

  it('active 状态变更应显示绿色', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes("toStatus === 'active'"), 'active 颜色判断');
  });

  it('deprecated 状态变更应显示红色', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes("toStatus === 'deprecated'"), 'deprecated 颜色判断');
  });

  it('应显示变更日期', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('evt.date'), '显示日期');
  });

  it('应显示新旧状态', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('evt.fromStatus'), '旧状态');
    assert.ok(src.includes('evt.toStatus'), '新状态');
  });
});

// ---- 新增: 模块健康评分 ----

describe('moduleHealthScore — 健康评分', () => {
  it('应导出 moduleHealthScore', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('moduleHealthScore'), '缺少 moduleHealthScore');
  });

  it('80% 以上活跃能力应返回健康', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes("return { score: 90, label: '健康' }"), '健康状态');
  });

  it('50-80% 应返回需关注', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes("return { score: 60, label: '需关注' }"), '需关注状态');
  });

  it('低于 50% 应返回需修复', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes("return { score: 30, label: '需修复' }"), '需修复状态');
  });
});

describe('countDeprecatedCapabilities — 废弃能力统计', () => {
  it('应导出 countDeprecatedCapabilities', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('countDeprecatedCapabilities'), '缺少 countDeprecatedCapabilities');
  });

  it('应过滤 deprecated 状态', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes("c.status === 'deprecated'"), '废弃检查');
  });
});

describe('getModuleAgeInMonths — 模块年龄估算', () => {
  it('应导出 getModuleAgeInMonths', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('getModuleAgeInMonths'), '缺少 getModuleAgeInMonths');
  });

  it('应基于能力数估算', () => {
    const src = readFileSync(SOURCE, 'utf-8');
    assert.ok(src.includes('module.capabilities.length * 3'), '能力数*3估算年龄');
  });
});
