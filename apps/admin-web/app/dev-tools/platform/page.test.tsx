import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

describe('OpenPlatformPage — 正例', () => {
  it('应导出默认组件', () => assert.ok(SRC.includes('export default function OpenPlatformPage')));
  it('应包含 "use client"', () => assert.ok(SRC.includes("'use client'")));
  it('应包含useState/useEffect/useCallback等hook', () => {
    assert.ok(SRC.includes('useState') || SRC.includes('useEffect') || SRC.includes('useCallback'));
  });
});

describe('OpenPlatformPage — 防御', () => {
  it('无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('无any类型', () => assert.ok(!/:\s*any\b/.test(SRC)));
  it('不直接导出any', () => assert.ok(!SRC.includes('as any')));
});

describe('OpenPlatformPage — 平台模块', () => {
  it('应包含 Tab 切换', () => assert.ok(SRC.includes('tabKey')));
  it('应包含 API 文档列表', () => assert.ok(SRC.includes('DOC_ITEMS')));
  it('应展示统计卡片', () => assert.ok(SRC.includes('Statistic')));
  it('应支持开发者接入按钮', () => assert.ok(SRC.includes('开发者接入')));
});

describe('OpenPlatformPage — Tab覆盖', () => {
  it('应包含 api 标签页', () => assert.ok(SRC.includes("'api'")));
  it('应包含 webhook 标签页', () => assert.ok(SRC.includes("'webhook'")));
  it('应包含 logs 标签页', () => assert.ok(SRC.includes("'logs'")));
});

describe('Dev Tools / Platform — hooks验证', () => {
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
