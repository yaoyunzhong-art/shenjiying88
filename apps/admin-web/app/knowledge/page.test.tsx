/**
 * knowledge/page.test.tsx — 知识库页 L1 冒烟测试
 * 覆盖: hooks验证
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

// ---- hooks验证 ----

describe('knowledge — hooks验证', () => {
  it('包含useState状态声明', () => assert.ok(SRC.includes('const [') && SRC.includes('] = useState') || SRC.includes('useState')));
  it('包含JSX返回语句', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器(onClick/onChange)', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染(map)', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString') || SRC.includes('Math.')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出函数', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**') || SRC.includes(' * 功能')));
});
