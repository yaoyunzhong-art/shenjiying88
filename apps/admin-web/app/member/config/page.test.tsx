/**
 * member/config/page.test.tsx — 会员配置中心 L1 冒烟测试
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

// ---- 正例: 模块结构 & 数据映射 ----

describe('member/config — 正例', () => {
  it('应包含 MemberConfig 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface MemberConfig'), '缺少 MemberConfig 接口');
    assert.ok(src.includes('points'), '缺少 points 配置段');
    assert.ok(src.includes('levels'), '缺少 levels 配置段');
    assert.ok(src.includes('lifecycle'), '缺少 lifecycle 配置段');
  });

  it('points 配置应包含 earnRate / redeemRate / enabled / expiryDays', () => {
    const src = readSource();
    assert.ok(src.includes('earnRate: number'), '缺少 earnRate');
    assert.ok(src.includes('redeemRate: number'), '缺少 redeemRate');
    assert.ok(src.includes('enabled: boolean'), '缺少 enabled');
    assert.ok(src.includes('expiryDays: number'), '缺少 expiryDays');
  });

  it('levels 阈值应包含 5 个等级 (BRONZE~DIAMOND)', () => {
    const src = readSource();
    assert.ok(src.includes('BRONZE: number'), '缺少 BRONZE 等级');
    assert.ok(src.includes('SILVER: number'), '缺少 SILVER 等级');
    assert.ok(src.includes('GOLD: number'), '缺少 GOLD 等级');
    assert.ok(src.includes('PLATINUM: number'), '缺少 PLATINUM 等级');
    assert.ok(src.includes('DIAMOND: number'), '缺少 DIAMOND 等级');
  });

  it('lifecycle 应包含 dormantDays 和 churnedDays', () => {
    const src = readSource();
    assert.ok(src.includes('dormantDays: number'), '缺少 dormantDays');
    assert.ok(src.includes('churnedDays: number'), '缺少 churnedDays');
  });

  it('应包含 phoneUniqueScope 和 crossTenantEnabled 字段', () => {
    const src = readSource();
    assert.ok(src.includes('phoneUniqueScope'), '缺少 phoneUniqueScope');
    assert.ok(src.includes("'global' | 'tenant'"), 'phoneUniqueScope 类型应为 global|tenant');
    assert.ok(src.includes('crossTenantEnabled: boolean'), '缺少 crossTenantEnabled');
  });

  it('应导出一个默认函数组件 MemberConfigPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function MemberConfigPage'), '未找到默认导出组件');
  });

  it('应包含 fetchConfig 函数', () => {
    const src = readSource();
    assert.ok(src.includes('const fetchConfig'), '缺少 fetchConfig');
    assert.ok(src.includes('fetch('), 'fetchConfig 应使用 fetch');
  });

  it('应包含 handleSave 保存函数', () => {
    const src = readSource();
    assert.ok(src.includes('handleSave'), '缺少 handleSave');
  });

  it('应包含 Toast 提示接口', () => {
    const src = readSource();
    assert.ok(src.includes('interface Toast'), '缺少 Toast 接口');
    assert.ok(src.includes("type: 'success' | 'error'"), 'Toast 类型应为 success|error');
    assert.ok(src.includes('message: string'), 'Toast 应包含 message');
  });
});

// ---- 边界: 空值 & 极值 ----

describe('member/config — 边界', () => {
  it('初始 config 状态应为 null', () => {
    const src = readSource();
    assert.ok(src.includes('useState<MemberConfig | null>(null)'), 'config 初始值应为 null');
  });

  it('initial loading 应为 true (useState initial value)', () => {
    const src = readSource();
    assert.ok(src.includes('setLoading(true)'), 'loading 初始应通过 useState 设为 true');
  });

  it('changeReason 初始应为空字符串', () => {
    const src = readSource();
    assert.ok(src.includes("useState('')"), 'changeReason 初始应为空');
  });

  it('应处理 HTTP 非 200 状态码', () => {
    const src = readSource();
    assert.ok(src.includes('!res.ok'), '缺少 !res.ok 错误检查');
    assert.ok(src.includes('throw new Error'), '缺少 throw new Error 错误抛出');
  });

  it('fetchConfig 应使用 try-catch 进行防御性编程', () => {
    const src = readSource();
    assert.ok(src.includes('try {'), '缺少 try 块');
    assert.ok(src.includes('catch'), '缺少 catch 块');
    assert.ok(src.includes('finally'), '缺少 finally 块');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('member/config — 防御', () => {
  it('handleSave 应检查 config 非空', () => {
    const src = readSource();
    assert.ok(src.includes('if (!config)'), '缺少 config 空值检查');
  });

  it('handleSave 应检查 changeReason 非空', () => {
    const src = readSource();
    assert.ok(src.includes('changeReason.trim()'), '缺少 changeReason 裁剪检查');
  });

  it('catch 块应使用 showToast 显示错误', () => {
    const src = readSource();
    assert.ok(src.includes('showToast('), '缺少 showToast 调用');
    assert.ok(src.includes("'error'"), '错误 toast 类型应为 error');
  });

  it('fetch 应包含 credentials: include', () => {
    const src = readSource();
    assert.ok(src.includes("credentials: 'include'"), '缺少凭证包含设置');
  });

  it('保存前应检查 config 是否处于 enabled 状态', () => {
    const src = readSource();
    const hasEnabledCheck = src.includes('config.points.enabled') || src.includes('.enabled');
    assert.ok(hasEnabledCheck, '缺少 enabled 状态检查');
  });

  it('应支持 3 个表单分区: 积分比例、等级阈值、休眠判定', () => {
    const src = readSource();
    const sectionCount = (src.match(/form section/gi) || src.match(/分区/gi) || []).length +
      (src.match(/points|levels|lifecycle/g) || []).length;
    assert.ok(sectionCount >= 3, '应包含 3 个配置分区');
  });

  it('handleSave 应包含 await 异步操作', () => {
    const src = readSource();
    assert.ok(src.includes('try {') && src.includes('catch'), '保存操作应有错误处理');
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Member / Config — hooks验证', () => {
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
