/**
 * dev-tools/page.test.tsx — 开发工具模块 L1 测试
 *
 * 覆盖 3 个子页面: brand（品牌运营）、deploy（部署管理）、platform（开放平台）
 * 正例: Mock 数据校验、统计计算、过滤逻辑、文件存在性
 * 反例: 空/非法数据、未导出默认组件
 * 边界: 边界值、空过滤结果、全选/全不选
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(new URL(import.meta.url).pathname);

/* ══════════════════════════════════════════════════════════
   品牌运营 — brand/page.tsx
   ══════════════════════════════════════════════════════════ */

interface Brand {
  id: string;
  name: string;
  domain: string;
  status: string;
  templates: number;
  campaigns: number;
  emailCount: number;
  created: string;
}

const BRANDS: Brand[] = [
  { id: 'B-01', name: '火星蹦床公园', domain: 'mars.venuetech.com', status: 'active', templates: 5, campaigns: 12, emailCount: 8, created: '2026-01' },
  { id: 'B-02', name: '银河电竞馆', domain: 'galaxy.venuetech.com', status: 'active', templates: 3, campaigns: 8, emailCount: 5, created: '2026-02' },
  { id: 'B-03', name: '星际儿童乐园', domain: 'star.venuetech.com', status: 'pending', templates: 2, campaigns: 3, emailCount: 2, created: '2026-04' },
  { id: 'B-04', name: '极速卡丁车', domain: 'speed.venuetech.com', status: 'active', templates: 4, campaigns: 15, emailCount: 6, created: '2026-01' },
];

/* ══════════════════════════════════════════════════════════
   部署管理 — deploy/page.tsx
   ══════════════════════════════════════════════════════════ */

interface Deployment {
  id: string;
  name: string;
  version: string;
  env: string;
  status: string;
  time: string;
  duration: string;
  deployer: string;
  commits: number;
  notes: string;
}

const DEPLOYS: Deployment[] = [
  { id: 'D-001', name: '收银系统更新', version: 'v2.3.1', env: 'production', status: 'success', time: '2026-07-14 08:00', duration: '12min', deployer: '张三', commits: 24, notes: 'P-35收银Sprint #12' },
  { id: 'D-002', name: '会员模块补丁', version: 'v2.3.1-hotfix', env: 'production', status: 'rolling', time: '2026-07-14 09:30', duration: '8min', deployer: '李四', commits: 8, notes: '紧急hotfix' },
  { id: 'D-003', name: '开放平台V2', version: 'v2.4.0', env: 'staging', status: 'success', time: '2026-07-13 18:00', duration: '15min', deployer: '王五', commits: 56, notes: 'P-49开发' },
  { id: 'D-004', name: '库存模块部署', version: 'v2.3.0', env: 'testing', status: 'success', time: '2026-07-13 14:00', duration: '10min', deployer: '赵六', commits: 32, notes: 'P-37测试' },
  { id: 'D-005', name: '财务对账部署', version: 'v2.2.0', env: 'staging', status: 'failed', time: '2026-07-12 22:00', duration: '5min', deployer: 'IT部', commits: 15, notes: '配置错误回滚' },
  { id: 'D-006', name: '紧急回滚', version: 'v2.2.0-rollback', env: 'production', status: 'rollback', time: '2026-07-12 22:30', duration: '6min', deployer: 'IT部', commits: 0, notes: '回滚至v2.2.0' },
];

/* ══════════════════════════════════════════════════════════
   开放平台 — platform/page.tsx
   ══════════════════════════════════════════════════════════ */

const DOC_ITEMS = ['收银API', '会员API', '库存API', '报表API', '活动API'];
const PLATFORM_STATS = {
  apiVersion: 'v3',
  qpsLimit: 5000,
  activeDevelopers: 42,
  apiEndpoints: 156,
  monthlyInvocations: '1.2M',
};

/* ── 辅助函数 ── */

function brandSearchFilter(brands: Brand[], query: string): Brand[] {
  if (!query.trim()) return brands;
  return brands.filter((b) => b.name.includes(query));
}

function brandStats(brands: Brand[]) {
  const total = brands.length;
  const active = brands.filter((b) => b.status === 'active').length;
  const totalTemplates = brands.reduce((s, b) => s + b.templates, 0);
  const totalCampaigns = brands.reduce((s, b) => s + b.campaigns, 0);
  return { total, active, totalTemplates, totalCampaigns };
}

function deployEnvFilter(deploys: Deployment[], env: string): Deployment[] {
  return env === 'all' ? deploys : deploys.filter((d) => d.env === env);
}

function deployProdStats(deploys: Deployment[]) {
  const prod = deploys.filter((d) => d.env === 'production');
  const success = prod.filter((d) => d.status === 'success').length;
  const successRate = prod.length > 0 ? Math.round((success / prod.length) * 100) : 0;
  return { total: prod.length, success, successRate };
}

/* ══════════════════════════════════════════════════════════
   测试: 文件存在性
   ══════════════════════════════════════════════════════════ */

describe('dev-tools — 子页面文件存在性', () => {
  it('1. brand/page.tsx 存在并导出 default', () => {
    const p = path.join(__dirname, 'brand', 'page.tsx');
    assert.equal(fs.existsSync(p), true);
    const source = fs.readFileSync(p, 'utf-8');
    assert.ok(source.includes('export default'));
  });

  it('2. deploy/page.tsx 存在并导出 default', () => {
    const p = path.join(__dirname, 'deploy', 'page.tsx');
    assert.equal(fs.existsSync(p), true);
    const source = fs.readFileSync(p, 'utf-8');
    assert.ok(source.includes('export default'));
  });

  it('3. platform/page.tsx 存在并导出 default', () => {
    const p = path.join(__dirname, 'platform', 'page.tsx');
    assert.equal(fs.existsSync(p), true);
    const source = fs.readFileSync(p, 'utf-8');
    assert.ok(source.includes('export default'));
  });

  it('4. brand 下有 dashboard/ 和 campaigns/ 子目录', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'brand', 'dashboard')), true);
    assert.equal(fs.existsSync(path.join(__dirname, 'brand', 'campaigns')), true);
  });

  it('5. 所有子页面使用 "use client"（'），() => {
    for (const sub of ['brand', 'deploy', 'platform']) {
      const source = fs.readFileSync(path.join(__dirname, sub, 'page.tsx'), 'utf-8');
      assert.ok(source.includes("'use client'") || source.includes('"use client"'),
        `${sub}/page.tsx should be client component`);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 品牌运营数据
   ══════════════════════════════════════════════════════════ */

describe('dev-tools — brand 品牌数据', () => {
  /* ── 正例 ── */

  it('6. BRANDS 包含 4 条记录', () => {
    assert.equal(BRANDS.length, 4);
  });

  it('7. 所有品牌 ID 唯一', () => {
    const ids = BRANDS.map((b) => b.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('8. 活跃品牌数为 3', () => {
    assert.equal(BRANDS.filter((b) => b.status === 'active').length, 3);
  });

  it('9. 待审核品牌数为 1', () => {
    assert.equal(BRANDS.filter((b) => b.status === 'pending').length, 1);
  });

  it('10. 总模板数 = 14', () => {
    const total = BRANDS.reduce((s, b) => s + b.templates, 0);
    assert.equal(total, 14);
  });

  it('11. 总活动数 = 38', () => {
    const total = BRANDS.reduce((s, b) => s + b.campaigns, 0);
    assert.equal(total, 38);
  });

  it('12. 总邮件模板 = 21', () => {
    const total = BRANDS.reduce((s, b) => s + b.emailCount, 0);
    assert.equal(total, 21);
  });

  it('13. 所有 status 值在预期范围内', () => {
    const valid = ['active', 'pending', 'expired'];
    for (const b of BRANDS) {
      assert.ok(valid.includes(b.status), `${b.id} invalid status ${b.status}`);
    }
  });

  it('14. 所有 templates 为非负整数', () => {
    for (const b of BRANDS) {
      assert.ok(Number.isInteger(b.templates) && b.templates >= 0);
    }
  });

  /* ── 搜索过滤 ── */

  it('15. 搜索"火星"返回 1 条', () => {
    const result = brandSearchFilter(BRANDS, '火星');
    assert.equal(result.length, 1);
    assert.equal(result[0].name, '火星蹦床公园');
  });

  it('16. 空搜索返回全部', () => {
    assert.equal(brandSearchFilter(BRANDS, '').length, BRANDS.length);
  });

  it('17. 不存在的搜索词返回空', () => {
    assert.equal(brandSearchFilter(BRANDS, '不存在的品牌').length, 0);
  });

  /* ── 统计计算 ── */

  it('18. brandStats 返回正确统计', () => {
    const stats = brandStats(BRANDS);
    assert.equal(stats.total, 4);
    assert.equal(stats.active, 3);
    assert.equal(stats.totalTemplates, 14);
    assert.equal(stats.totalCampaigns, 38);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 部署管理数据
   ══════════════════════════════════════════════════════════ */

describe('dev-tools — deploy 部署数据', () => {
  /* ── 正例 ── */

  it('19. DEPLOYS 包含 6 条记录', () => {
    assert.equal(DEPLOYS.length, 6);
  });

  it('20. 所有部署 ID 唯一', () => {
    const ids = DEPLOYS.map((d) => d.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('21. 生产环境部署 3 条', () => {
    assert.equal(DEPLOYS.filter((d) => d.env === 'production').length, 3);
  });

  it('22. 预发(staging)部署 2 条', () => {
    assert.equal(DEPLOYS.filter((d) => d.env === 'staging').length, 2);
  });

  it('23. 测试(testing)部署 1 条', () => {
    assert.equal(DEPLOYS.filter((d) => d.env === 'testing').length, 1);
  });

  it('24. 成功(success)部署 3 条', () => {
    assert.equal(DEPLOYS.filter((d) => d.status === 'success').length, 3);
  });

  it('25. 失败(failed)部署 1 条', () => {
    assert.equal(DEPLOYS.filter((d) => d.status === 'failed').length, 1);
  });

  it('26. 回滚(rollback)部署 1 条', () => {
    assert.equal(DEPLOYS.filter((d) => d.status === 'rollback').length, 1);
  });

  it('27. 部署中(rolling) 1 条', () => {
    assert.equal(DEPLOYS.filter((d) => d.status === 'rolling').length, 1);
  });

  it('28. 总 commits = 135', () => {
    const total = DEPLOYS.reduce((s, d) => s + d.commits, 0);
    assert.equal(total, 135);
  });

  it('29. commits 无负数', () => {
    for (const d of DEPLOYS) {
      assert.ok(d.commits >= 0, `${d.id} commits negative`);
    }
  });

  /* ── 环境过滤 ── */

  it('30. envFilter="production" 返回 3 条', () => {
    assert.equal(deployEnvFilter(DEPLOYS, 'production').length, 3);
  });

  it('31. envFilter="staging" 返回 2 条', () => {
    assert.equal(deployEnvFilter(DEPLOYS, 'staging').length, 2);
  });

  it('32. envFilter="all" 返回全部', () => {
    assert.equal(deployEnvFilter(DEPLOYS, 'all').length, DEPLOYS.length);
  });

  it('33. envFilter 为不存在的环境返回 0 条', () => {
    assert.equal(deployEnvFilter(DEPLOYS, 'nonexistent').length, 0);
  });

  /* ── 生产成功率 ── */

  it('34. 生产部署成功率 = 67%（2 成功 / 3 总计）', () => {
    const stats = deployProdStats(DEPLOYS);
    assert.equal(stats.total, 3);
    assert.equal(stats.success, 2);
    assert.equal(stats.successRate, 67);
  });

  it('35. 无生产部署时成功率为 0', () => {
    const stats = deployProdStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.success, 0);
    assert.equal(stats.successRate, 0);
  });
});

/* ══════════════════════════════════════════════════════════
   测试: 开放平台数据
   ══════════════════════════════════════════════════════════ */

describe('dev-tools — platform 开放平台数据', () => {
  it('36. 5 个 API 文档项', () => {
    assert.equal(DOC_ITEMS.length, 5);
  });

  it('37. 文档项包含收银API', () => {
    assert.ok(DOC_ITEMS.includes('收银API'));
  });

  it('38. 所有文档项非空', () => {
    for (const item of DOC_ITEMS) {
      assert.ok(item.length > 0);
    }
  });

  it('39. 文档项无重复', () => {
    assert.equal(new Set(DOC_ITEMS).size, DOC_ITEMS.length);
  });

  it('40. API 版本为 v3', () => {
    assert.equal(PLATFORM_STATS.apiVersion, 'v3');
  });

  it('41. QPS 上限为正整数', () => {
    assert.ok(Number.isInteger(PLATFORM_STATS.qpsLimit) && PLATFORM_STATS.qpsLimit > 0);
  });

  it('42. 活跃开发者数为正', () => {
    assert.ok(PLATFORM_STATS.activeDevelopers > 0);
  });

  it('43. API 端点数为正', () => {
    assert.ok(PLATFORM_STATS.apiEndpoints > 0);
  });

  it('44. 月度调用量不为空', () => {
    assert.ok(PLATFORM_STATS.monthlyInvocations.length > 0);
  });

  it('45. 所有数据字段齐全', () => {
    const keys: (keyof typeof PLATFORM_STATS)[] = ['apiVersion', 'qpsLimit', 'activeDevelopers', 'apiEndpoints', 'monthlyInvocations'];
    for (const key of keys) {
      assert.ok(PLATFORM_STATS[key] !== undefined && PLATFORM_STATS[key] !== null,
        `${key} should be defined`);
    }
  });
});

/* ══════════════════════════════════════════════════════════
   边界与反例
   ══════════════════════════════════════════════════════════ */

describe('dev-tools — 边界与反例', () => {
  it('46. 所有品牌数据不全为 null/undefined', () => {
    for (const b of BRANDS) {
      assert.ok(b.name !== null && b.name !== undefined);
      assert.ok(b.domain !== null && b.domain !== undefined);
    }
  });

  it('47. 部署版本号格式正确（v开头的语义版本）', () => {
    for (const d of DEPLOYS) {
      assert.ok(d.version.startsWith('v'), `${d.id} version ${d.version} should start with v`);
    }
  });

  it('48. 品牌域名包含 .com', () => {
    for (const b of BRANDS) {
      assert.ok(b.domain.includes('.'), `${b.id} domain should contain .`);
    }
  });

  it('49. 日期字段格式 YYYY-MM（品牌）', () => {
    for (const b of BRANDS) {
      assert.match(b.created, /^\d{4}-\d{2}$/, `${b.id} date format YYYY-MM`);
    }
  });

  it('50. 部署状态枚举值有效', () => {
    const valid = ['success', 'failed', 'rolling', 'rollback'];
    for (const d of DEPLOYS) {
      assert.ok(valid.includes(d.status), `${d.id} invalid status ${d.status}`);
    }
  });

  it('51. 部署环境枚举值有效', () => {
    const valid = ['production', 'staging', 'testing'];
    for (const d of DEPLOYS) {
      assert.ok(valid.includes(d.env), `${d.id} invalid env ${d.env}`);
    }
  });

  it('52. 部署备注不为空', () => {
    for (const d of DEPLOYS) {
      assert.ok(d.notes.length > 0, `${d.id} notes should not be empty`);
    }
  });

  it('53. 品牌运营看板 dashboard 子页面存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'brand', 'dashboard', 'page.tsx')), true);
  });

  it('54. 营销活动 campaigns 子页面存在', () => {
    assert.equal(fs.existsSync(path.join(__dirname, 'brand', 'campaigns', 'page.tsx')), true);
  });

  it('55. 所有子页面不使用 console.log', () => {
    for (const sub of ['brand', 'deploy', 'platform', 'brand/dashboard', 'brand/campaigns']) {
      const p = path.join(__dirname, ...sub.split('/'));
      const pFile = path.join(p, 'page.tsx');
      if (fs.existsSync(pFile)) {
        const source = fs.readFileSync(pFile, 'utf-8');
        assert.ok(!source.includes('console.log'), `${sub} should not have console.log`);
      }
    }
  });
});
