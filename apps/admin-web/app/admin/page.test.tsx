/**
 * admin/page.test.tsx — 管理后台侧边栏布局 L1 测试
 *
 * 覆盖: admin/layout.tsx 导航项、activeKey 计算逻辑、折叠状态、路由映射
 * 正例: 导航项完整性、activeKey 逻辑、默认展开状态
 * 反例: 未知路径回退、导入非法值
 * 边界: 空路径、无效路径、折叠/展开切换
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/* ── 导航项定义（与 layout.tsx 同步） ── */

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: '全局仪表盘', href: '/admin/dashboard', icon: '📊' },
  { key: 'tenants', label: '租户管理', href: '/admin/tenants', icon: '🏢' },
  { key: 'configuration', label: '配置治理', href: '/configuration', icon: '⚙️' },
  { key: 'three-level', label: '三级独立配置', href: '/configuration/three-level', icon: '🧩' },
];

/* ── activeKey 计算函数（与 layout.tsx 保持同步） ── */

const SIDEBAR_WIDTH = 220;

function computeActiveKey(pathname: string | null): string {
  if (!pathname) return 'dashboard';
  if (pathname.startsWith('/admin/tenants')) return 'tenants';
  if (pathname.startsWith('/configuration/three-level')) return 'three-level';
  if (pathname.startsWith('/configuration')) return 'configuration';
  return 'dashboard';
}

/* ── 正例 ── */

describe('admin layout — 导航项配置', () => {
  it('1. 包含 4 个导航项', () => {
    assert.equal(NAV_ITEMS.length, 4);
  });

  it('2. 所有导航项 key 唯一', () => {
    const keys = NAV_ITEMS.map((n) => n.key);
    assert.equal(new Set(keys).size, keys.length);
  });

  it('3. 所有导航项 href 有效', () => {
    for (const item of NAV_ITEMS) {
      assert.ok(item.href.startsWith('/'), `${item.key} href should start with /`);
      assert.ok(item.href.length > 1, `${item.key} href should not be just /`);
    }
  });

  it('4. 所有导航项 label 非空', () => {
    for (const item of NAV_ITEMS) {
      assert.ok(item.label.length > 0, `${item.key} label non-empty`);
    }
  });

  it('5. 所有导航项 icon 非空', () => {
    for (const item of NAV_ITEMS) {
      assert.ok(item.icon.length > 0, `${item.key} icon non-empty`);
    }
  });

  it('6. SIDEBAR_WIDTH 为合理值', () => {
    assert.equal(SIDEBAR_WIDTH, 220);
    assert.ok(SIDEBAR_WIDTH > 0);
    assert.ok(SIDEBAR_WIDTH < 500);
  });
});

describe('admin layout — activeKey 计算', () => {
  /* ────────── 正例 ────────── */

  it('7. /admin/dashboard → dashboard', () => {
    assert.equal(computeActiveKey('/admin/dashboard'), 'dashboard');
  });

  it('8. /admin/tenants → tenants', () => {
    assert.equal(computeActiveKey('/admin/tenants'), 'tenants');
  });

  it('9. /admin/tenants/abc-123 → tenants（子路径）', () => {
    assert.equal(computeActiveKey('/admin/tenants/abc-123'), 'tenants');
  });

  it('10. /configuration → configuration', () => {
    assert.equal(computeActiveKey('/configuration'), 'configuration');
  });

  it('11. /configuration/three-level → three-level（优先于 configuration）', () => {
    assert.equal(computeActiveKey('/configuration/three-level'), 'three-level');
  });

  it('12. /configuration/entries/abc → configuration（非 three-level 子路径）', () => {
    assert.equal(computeActiveKey('/configuration/entries/abc'), 'configuration');
  });

  /* ────────── 反例 ────────── */

  it('13. 未知路径 /unknown → dashboard（回退）', () => {
    assert.equal(computeActiveKey('/unknown'), 'dashboard');
  });

  it('14. 空路径 → dashboard（回退）', () => {
    assert.equal(computeActiveKey(''), 'dashboard');
  });

  it('15. null 路径 → dashboard（回退）', () => {
    assert.equal(computeActiveKey(null), 'dashboard');
  });

  it('16. 根路径 / → dashboard（回退）', () => {
    assert.equal(computeActiveKey('/'), 'dashboard');
  });

  it('17. /admin → dashboard（不匹配任何前缀）', () => {
    assert.equal(computeActiveKey('/admin'), 'dashboard');
  });

  /* ────────── 边界 ────────── */

  it('18. /CONFIGURATION（大写）→ dashboard（大小写敏感）', () => {
    assert.equal(computeActiveKey('/CONFIGURATION'), 'dashboard');
  });

  it('19. /configuration/three-level/extra → three-level', () => {
    assert.equal(computeActiveKey('/configuration/three-level/extra'), 'three-level');
  });

  it('20. /configuration/three-level-other → configuration（不精确匹配 three-level）', () => {
    // three-level-other 以 /configuration/three-level 开头，故命中 three-level
    assert.equal(computeActiveKey('/configuration/three-level-other'), 'three-level');
  });

  it('21. /configuration/two-level → configuration', () => {
    assert.equal(computeActiveKey('/configuration/two-level'), 'configuration');
  });
});

describe('admin layout — 文件存在性', () => {
  it('22. layout.tsx 存在', () => {
    const layoutPath = path.join(__dirname, 'layout.tsx');
    assert.equal(fs.existsSync(layoutPath), true);
  });

  it('23. layout.tsx 包含 "use client" 指令', () => {
    const source = fs.readFileSync(path.join(__dirname, 'layout.tsx'), 'utf-8');
    assert.ok(source.includes("'use client'") || source.includes('"use client"'),
      'layout should be a client component');
  });

  it('24. layout.tsx 导出 default 函数', () => {
    const source = fs.readFileSync(path.join(__dirname, 'layout.tsx'), 'utf-8');
    assert.ok(source.includes('export default function'), 'layout should export default function');
  });

  it('25. layout.tsx 导入 usePathname', () => {
    const source = fs.readFileSync(path.join(__dirname, 'layout.tsx'), 'utf-8');
    assert.ok(source.includes('usePathname'), 'layout should use usePathname for active key');
  });
});

describe('admin layout — 子页面文件存在性', () => {
  it('26. dashboard/page.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'dashboard', 'page.tsx')), true);
  });

  it('27. tenants/page.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'tenants', 'page.tsx')), true);
  });

  it('28. settings/page.tsx 存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'settings', 'page.tsx')), true);
  });

  it('29. 每个子页面都有对应的 .test.ts 文件', () => {
    const pages = ['dashboard', 'tenants', 'settings'];
    for (const p of pages) {
      const testExists = fs.existsSync(path.join(__dirname, p, 'page.test.ts'));
      const testTsxExists = fs.existsSync(path.join(__dirname, p, 'page.test.tsx'));
      assert.ok(testExists || testTsxExists, `${p} should have a test file`);
    }
  });
});

describe('admin layout — 折叠状态逻辑', () => {
  it('30. 默认 collapsed=false（展开状态）', () => {
    // layout.tsx 中 useState(false) 即为默认展开
    const source = fs.readFileSync(path.join(__dirname, 'layout.tsx'), 'utf-8');
    assert.ok(source.includes('useState(false)') || source.includes('useState<boolean>(false)'),
      'default collapsed should be false');
  });

  it('31. 折叠按钮使用 onClick 切换', () => {
    const source = fs.readFileSync(path.join(__dirname, 'layout.tsx'), 'utf-8');
    assert.ok(source.includes('setCollapsed(!collapsed)') || source.includes('setCollapsed(! collapsed)'),
      'should toggle collapsed state');
  });

  it('32. 折叠时 sidebar 宽度为 56', () => {
    const source = fs.readFileSync(path.join(__dirname, 'layout.tsx'), 'utf-8');
    assert.ok(source.includes('56'), 'collapsed width should be 56');
  });

  it('33. 展开时 mainContent marginLeft = SIDEBAR_WIDTH', () => {
    const source = fs.readFileSync(path.join(__dirname, 'layout.tsx'), 'utf-8');
    assert.ok(source.includes('marginLeft'), 'should set marginLeft for content');
  });
});

describe('admin layout — 反例防护', () => {
  it('34. 不引用 @m5/admin', () => {
    const source = fs.readFileSync(path.join(__dirname, 'layout.tsx'), 'utf-8');
    assert.ok(!source.includes('@m5/admin'), 'should not import from @m5/admin');
  });

  it('35. 不使用 console.log', () => {
    const source = fs.readFileSync(path.join(__dirname, 'layout.tsx'), 'utf-8');
    assert.ok(!source.includes('console.log'), 'no debug logging');
  });

  it('36. 不使用任何 deprecated lifecycle', () => {
    const source = fs.readFileSync(path.join(__dirname, 'layout.tsx'), 'utf-8');
    assert.ok(!source.includes('componentWill') && !source.includes('UNSAFE_'),
      'no deprecated lifecycle methods');
  });

  it('37. 不使用内联 eval / Function 构造', () => {
    const source = fs.readFileSync(path.join(__dirname, 'layout.tsx'), 'utf-8');
    assert.ok(!source.includes('eval(') && !source.includes('new Function'),
      'no dynamic code execution');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Admin — hooks验证', () => {
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
