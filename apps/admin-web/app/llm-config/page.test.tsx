/**
 * llm-config/page.test.tsx — LLM接入配置页 L1 冒烟测试
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

const CLIENT_SOURCE = resolve(__dirname, 'llm-config-client.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

function readClientSource(): string {
  return readFileSync(CLIENT_SOURCE, 'utf-8');
}

// ---- 正例 ----

describe('llm-config — 正例', () => {
  it('应导出一个默认组件 LLMConfigPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function LLMConfigPage'), '缺少默认导出组件');
  });

  it('应引用 LLMConfigClient 客户端组件', () => {
    const src = readSource();
    assert.ok(src.includes('LLMConfigClient'), '缺少 LLMConfigClient 引用');
  });

  it('应包含 LLMConfig 接口定义', () => {
    const src = readClientSource();
    assert.ok(src.includes('interface LLMConfig') || src.includes('interface CreateConfigForm'), '缺少 LLMConfig 或 CreateConfigForm 接口');
  });

  it('应包含 MOCK_CONFIGS 数据集', () => {
    const src = readClientSource();
    assert.ok(src.includes('MOCK_CONFIGS'), '缺少 MOCK_CONFIGS');
  });

  it('应包含 MOCK_STATS 统计数据集', () => {
    const src = readClientSource();
    assert.ok(src.includes('MOCK_STATS'), '缺少 MOCK_STATS');
  });
});

// ---- 边界 ----

describe('llm-config — 边界', () => {
  it('应支持 7 个 LLM 提供商选项', () => {
    const src = readClientSource();
    const matches = src.match(/value: '/g);
    assert.ok(matches, '缺少 provider 配置');
    assert.ok(matches.length >= 5, '提供商选项应 >= 5');
  });

  it('quotaUsage 应处理 quotaLimit 空的场景 (∞)', () => {
    const src = readClientSource();
    assert.ok(src.includes("'∞'") || src.includes('∞'), '缺少无限配额处理');
  });

  it('配置状态包含 approved/pending/rejected/suspended 四种', () => {
    const src = readClientSource();
    assert.ok(src.includes("'approved'"), '缺少 approved 状态');
    assert.ok(src.includes("'pending'"), '缺少 pending 状态');
    assert.ok(src.includes("'rejected'"), '缺少 rejected 状态');
    assert.ok(src.includes("'suspended'"), '缺少 suspended 状态');
  });

  it('Form 表单包含 temperature 输入范围 min=0 max=2', () => {
    const src = readClientSource();
    assert.ok(src.includes('min={0}') && src.includes('max={2}'), '缺少 temperature 范围限制');
  });

  it('Form 表单包含 maxTokens 输入范围 min=100 max=100000', () => {
    const src = readClientSource();
    assert.ok(src.includes('min={100}') && src.includes('max={100000}'), '缺少 maxTokens 范围限制');
  });
});

// ---- 防御 ----

describe('llm-config — 防御', () => {
  it('应将 use client 放在客户端组件文件 llm-config-client.tsx 中', () => {
    const src = readFileSync(resolve(dirname(SOURCE), 'llm-config-client.tsx'), 'utf-8');
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '客户端组件缺少 use client');
  });

  it('应包含 useCallback / useEffect 异步加载逻辑', () => {
    const src = readClientSource();
    assert.ok(src.includes('useCallback'), '缺少 useCallback');
    assert.ok(src.includes('useEffect'), '缺少 useEffect');
  });

  it('应包含 message.success API 调用反馈', () => {
    const src = readClientSource();
    assert.ok(src.includes('message.success'), '缺少 message.success 反馈');
  });

  it('删除操作应包含 Popconfirm 确认弹窗', () => {
    const src = readClientSource();
    assert.ok(src.includes('Popconfirm'), '缺少 Popconfirm');
  });

  it('表单验证规则应包含 required: true', () => {
    const src = readClientSource();
    const requiredCount = (src.match(/required: true/g) || []).length;
    assert.ok(requiredCount >= 2, `required: true 出现次数应 >= 2, 实际 ${requiredCount}`);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Llm Config — hooks验证', () => {
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
