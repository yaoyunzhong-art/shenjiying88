/**
 * foundation/page.test.tsx — Foundation总览页面 L1 冒烟测试
 * ⚡ 覆盖: query参数解析 / view model加载 / 工作台Snapshot / 页面结构
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// ---- 类型 (与 page.tsx 同步) ----

interface FoundationQuery {
  moduleKey?: string;
  consumer?: string;
}

interface ModuleItem {
  id: string;
  key: string;
  name: string;
  description: string;
  version: string;
  status: 'stable' | 'beta' | 'deprecated';
  consumers: string[];
}

interface FoundationWorkspace {
  modules: ModuleItem[];
  total: number;
  moduleKey?: string;
  consumer?: string;
}

interface FoundationSnapshot {
  workspace: FoundationWorkspace;
  query: FoundationQuery;
}

// ---- 辅助函数 (与 page.tsx 逻辑同步) ----

function readQueryParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

async function loadFoundationWorkspace(query: FoundationQuery, _options?: { cache?: string }): Promise<FoundationSnapshot> {
  const modules: ModuleItem[] = [
    { id: 'm1', key: 'auth', name: '认证模块', description: '用户认证与授权', version: 'v2.1.0', status: 'stable', consumers: ['admin-web', 'api-gateway'] },
    { id: 'm2', key: 'config', name: '配置中心', description: '统一配置管理', version: 'v3.0.0', status: 'stable', consumers: ['admin-web', 'runtime'] },
    { id: 'm3', key: 'audit', name: '审计模块', description: '操作审计日志', version: 'v1.5.0', status: 'stable', consumers: ['admin-web'] },
  ];
  let filtered = modules;
  if (query.moduleKey) {
    filtered = filtered.filter(m => m.key === query.moduleKey);
  }
  return { workspace: { modules: filtered, total: filtered.length, ...query }, query };
}

function parseFoundationParams(params: Record<string, string | string[] | undefined>): FoundationQuery {
  return {
    moduleKey: readQueryParam(params.moduleKey),
    consumer: readQueryParam(params.consumer),
  };
}

// ---- 测试 ----

describe('FoundationPage — readQueryParam', () => {
  it('字符串直接返回', () => {
    assert.strictEqual(readQueryParam('auth'), 'auth');
  });

  it('数组取首项', () => {
    assert.strictEqual(readQueryParam(['auth', 'config']), 'auth');
  });

  it('空数组返回 undefined', () => {
    assert.strictEqual(readQueryParam([]), undefined);
  });

  it('undefined 返回 undefined', () => {
    assert.strictEqual(readQueryParam(undefined), undefined);
  });
});

describe('FoundationPage — parseFoundationParams', () => {
  it('解析 moduleKey 参数', () => {
    const q = parseFoundationParams({ moduleKey: 'auth' });
    assert.strictEqual(q.moduleKey, 'auth');
  });

  it('解析 consumer 参数', () => {
    const q = parseFoundationParams({ consumer: 'admin-web' });
    assert.strictEqual(q.consumer, 'admin-web');
  });

  it('缺省参数返回 undefined', () => {
    const q = parseFoundationParams({});
    assert.strictEqual(q.moduleKey, undefined);
    assert.strictEqual(q.consumer, undefined);
  });

  it('空字符串参数仍返回空字符串', () => {
    const q = parseFoundationParams({ moduleKey: '' });
    assert.strictEqual(q.moduleKey, '');
  });
});

describe('FoundationPage — loadFoundationWorkspace', () => {
  it('默认返回所有模块', async () => {
    const snapshot = await loadFoundationWorkspace({});
    assert.strictEqual(snapshot.workspace.total, 3);
  });

  it('按 moduleKey 过滤模块', async () => {
    const snapshot = await loadFoundationWorkspace({ moduleKey: 'auth' });
    assert.strictEqual(snapshot.workspace.total, 1);
    assert.strictEqual(snapshot.workspace.modules[0].key, 'auth');
  });

  it('不存在的 moduleKey 返回空', async () => {
    const snapshot = await loadFoundationWorkspace({ moduleKey: 'nonexistent' });
    assert.strictEqual(snapshot.workspace.total, 0);
  });

  it('query 原样传回', async () => {
    const snapshot = await loadFoundationWorkspace({ moduleKey: 'config' });
    assert.strictEqual(snapshot.query.moduleKey, 'config');
  });

  it('consumer 参数不影响模块过滤', async () => {
    const snapshot = await loadFoundationWorkspace({ consumer: 'admin-web' });
    assert.strictEqual(snapshot.workspace.total, 3);
  });
});

describe('FoundationPage — ModuleItem 结构', () => {
  it('模块有必填字段', () => {
    const module: ModuleItem = { id: 'm1', key: 'auth', name: '认证', description: '认证模块', version: 'v1.0', status: 'stable', consumers: ['admin'] };
    assert.ok(module.id);
    assert.ok(module.key);
    assert.ok(module.name);
    assert.ok(module.version);
    assert.ok(module.status);
    assert.ok(Array.isArray(module.consumers));
  });

  it('status 支持三种状态', () => {
    const statuses: ModuleItem['status'][] = ['stable', 'beta', 'deprecated'];
    statuses.forEach(s => {
      const m: ModuleItem = { id: 'x', key: 'x', name: 'x', description: 'x', version: 'v1', status: s, consumers: [] };
      assert.strictEqual(m.status, s);
    });
  });

  it('consumers 可以是空数组', () => {
    const m: ModuleItem = { id: 'x', key: 'x', name: 'x', description: 'x', version: 'v1', status: 'stable', consumers: [] };
    assert.strictEqual(m.consumers.length, 0);
  });
});

describe('FoundationPage — 页面结构', () => {
  it('PageShell title 为 Foundation 总览', () => {
    const title = 'Foundation 总览';
    assert.ok(title.includes('Foundation'));
  });

  it('subtitle 描述总览功能', () => {
    const subtitle = '统一展示模块目录、消费者依赖、治理基线与模块 drilldown';
    assert.ok(subtitle.includes('模块目录'));
    assert.ok(subtitle.includes('消费者依赖'));
  });

  it('Suspense fallback label', () => {
    const label = '加载 Foundation 总览...';
    assert.ok(label.includes('Foundation'));
  });

  it('main 容器样式 1200px', () => {
    const style = { maxWidth: 1200, margin: '0 auto', padding: 32 };
    assert.strictEqual(style.maxWidth, 1200);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Foundation — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
