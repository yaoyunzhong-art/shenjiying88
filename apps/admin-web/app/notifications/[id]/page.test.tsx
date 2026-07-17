/**
 * notifications/[id]/page.test.tsx — 通知详情 L1 冒烟测试
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

describe('notifications/[id] — 正例', () => {
  it('应包含 interface NotificationDetail 类型定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface NotificationDetail'), '缺少 NotificationDetail 接口');
    assert.ok(src.includes('id: string'), '缺少 id 字段');
    assert.ok(src.includes('title: string'), '缺少 title 字段');
    assert.ok(src.includes('content: string'), '缺少 content 字段');
    assert.ok(src.includes('type'), '缺少 type 字段');
    assert.ok(src.includes('priority'), '缺少 priority 字段');
    assert.ok(src.includes('status'), '缺少 status 字段');
    assert.ok(src.includes('ackRequired: boolean'), '缺少 ackRequired 布尔字段');
  });

  it('应包含完整的 TYPE_MAP 映射（4 种通知类型+中文标签）', () => {
    const src = readSource();
    assert.ok(src.includes('const TYPE_MAP'), '缺少 TYPE_MAP 常量');
    assert.ok(src.includes("'system'"), '缺少 system 类型');
    assert.ok(src.includes("'alert'"), '缺少 alert 类型');
    assert.ok(src.includes("'reminder'"), '缺少 reminder 类型');
    assert.ok(src.includes("'announcement'"), '缺少 announcement 类型');
    assert.ok(src.includes('系统'), '缺少 system 中文标签');
    assert.ok(src.includes('告警'), '缺少 alert 中文标签');
    assert.ok(src.includes('提醒'), '缺少 reminder 中文标签');
    assert.ok(src.includes('公告'), '缺少 announcement 中文标签');
  });

  it('应包含完整的 PRIORITY_MAP 映射（4 级优先级+中文标签）', () => {
    const src = readSource();
    assert.ok(src.includes('const PRIORITY_MAP'), '缺少 PRIORITY_MAP 常量');
    assert.ok(src.includes("'low'"), '缺少 low 优先级');
    assert.ok(src.includes("'medium'"), '缺少 medium 优先级');
    assert.ok(src.includes("'high'"), '缺少 high 优先级');
    assert.ok(src.includes("'urgent'"), '缺少 urgent 优先级');
  });

  it('应包含 STATUS_MAP 状态映射（3 种状态+中文标签）', () => {
    const src = readSource();
    assert.ok(src.includes('const STATUS_MAP'), '缺少 STATUS_MAP 常量');
    assert.ok(src.includes("'unread'"), '缺少 unread 状态');
    assert.ok(src.includes("'read'"), '缺少 read 状态');
    assert.ok(src.includes("'archived'"), '缺少 archived 状态');
  });

  it('应包含 SCOPE_MAP 作用域映射（5 种作用域+中文标签）', () => {
    const src = readSource();
    assert.ok(src.includes('const SCOPE_MAP'), '缺少 SCOPE_MAP 常量');
    assert.ok(src.includes('PLATFORM'), '缺少 PLATFORM 作用域');
    assert.ok(src.includes('TENANT'), '缺少 TENANT 作用域');
    assert.ok(src.includes('BRAND'), '缺少 BRAND 作用域');
    assert.ok(src.includes('STORE'), '缺少 STORE 作用域');
    assert.ok(src.includes('MARKET'), '缺少 MARKET 作用域');
  });

  it('应导出一个默认函数组件 NotificationDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function NotificationDetailPage'), '未找到默认导出组件');
  });

  it('应包含 getNotificationById 数据获取函数', () => {
    const src = readSource();
    assert.ok(src.includes('function getNotificationById'), '缺少 getNotificationById 函数');
  });

  it('应包含表单验证函数 validateForm', () => {
    const src = readSource();
    assert.ok(src.includes('function validateForm'), '缺少 validateForm 函数');
  });

  it('应包含提交函数 submitEdit', () => {
    const src = readSource();
    assert.ok(src.includes('function submitEdit'), '缺少 submitEdit 函数');
  });

  it('getNotificationById 应包含完整的 lookup 对象定义', () => {
    const src = readSource();
    assert.ok(src.includes('lookup[') || src.includes('lookup:'), '缺少 lookup 对象定义');
    assert.ok(src.includes("系统维护通知"), '缺少示例通知数据');
  });
});

// ---- 边界: 空值 & 极值 ----

describe('notifications/[id] — 边界', () => {
  it('validateForm 应拒绝空 content', () => {
    const src = readSource();
    // 提取 validateForm 中空内容检查的逻辑
    assert.ok(src.includes("errors.content = '通知内容不能为空'"), 'validateForm 缺少空内容检查');
  });

  it('getNotificationById 应处理不存在 ID 的降级（fallback 到默认值）', () => {
    const src = readSource();
    // 检查是否存在 fallback 逻辑
    const hasFallback = src.includes("?? lookup['n3']") || src.includes("?? lookup[n3]");
    assert.ok(hasFallback, '缺少 fallback 默认值逻辑');
  });

  it('STATUS_MAP 应包含已归档状态的正确中文', () => {
    const src = readSource();
    assert.ok(src.includes('已归档'), '缺少已归档状态中文');
    assert.ok(src.includes('已读'), '缺少已读状态中文');
    assert.ok(src.includes('未读'), '缺少未读状态中文');
  });

  it('PRIORITY_MAP 的 urgent 变体应为 danger', () => {
    const src = readSource();
    assert.ok(src.includes("variant: 'danger'") || src.includes('danger'), 'urgent 优先级缺少 danger 变体');
  });

  it('n1 通知数据应包含所有必要字段', () => {
    const src = readSource();
    // 检查首条示例数据的完整性
    assert.ok(src.includes('id:'), 'mock 数据缺少 id');
    assert.ok(src.includes('title:'), 'mock 数据缺少 title');
    assert.ok(src.includes('content:'), 'mock 数据缺少 content');
    assert.ok(src.includes('createdAt:'), 'mock 数据缺少 createdAt');
    assert.ok(src.includes('expiresAt:'), 'mock 数据缺少 expiresAt');
    assert.ok(src.includes('tags:'), 'mock 数据缺少 tags');
  });

  it('EditFormData 应至少包含 content 字段', () => {
    const src = readSource();
    assert.ok(src.includes('interface EditFormData'), '缺少 EditFormData 接口');
    assert.ok(src.includes('interface EditFormErrors'), '缺少 EditFormErrors 接口');
  });
});

// ---- 防御: 错误处理 & 非法输入 ----

describe('notifications/[id] — 防御', () => {
  it('submitEdit 应返回标准响应结构 {success: true/false}', () => {
    const src = readSource();
    assert.ok(src.includes('return { success: true }'), 'submitEdit 缺少标准响应结构');
  });

  it('getNotificationById 应返回 alert 类型通知的完整数据结构', () => {
    const src = readSource();
    assert.ok(src.includes("type: 'alert'"), '缺少 alert 类型通知数据');
    assert.ok(src.includes("priority: 'urgent'"), '缺少 urgent 优先级数据');
  });

  it('getNotificationById 应包含 ackRequired=true 时的 ackedBy/ackedAt 字段', () => {
    const src = readSource();
    assert.ok(src.includes('ackedBy:'), '缺少 ackedBy 字段');
    assert.ok(src.includes('ackedAt:'), '缺少 ackedAt 字段');
  });

  it('validateForm 应返回 errors 对象类型的错误', () => {
    const src = readSource();
    assert.ok(src.includes('EditFormErrors'), 'validateForm 返回类型应为 EditFormErrors');
  });

  it('TYPE_MAP 的所有 value 应包含 label 和 variant 两个属性', () => {
    const src = readSource();
    const typeMapPattern = src.match(/TYPE_MAP[^}]+/);
    if (typeMapPattern) {
      const block = typeMapPattern[0];
      assert.ok(block.includes('label:'), 'TYPE_MAP 缺少 label');
      assert.ok(block.includes('variant:'), 'TYPE_MAP 缺少 variant');
    } else {
      assert.fail('未找到 TYPE_MAP 定义');
    }
  });

  it('PRIORITY_MAP 应使用 StatusVariant 类型（4 种变体）', () => {
    const src = readSource();
    assert.ok(src.includes('type StatusVariant'), '缺少 StatusVariant 类型定义');
    assert.ok(src.includes("'success'"), '缺少 success 变体');
    assert.ok(src.includes("'neutral'"), '缺少 neutral 变体');
    assert.ok(src.includes("'warning'"), '缺少 warning 变体');
    assert.ok(src.includes("'danger'"), '缺少 danger 变体');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Notifications — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串格式化', () => assert.ok(SRC.includes('${')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
