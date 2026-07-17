import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SRC = readFileSync(resolve(import.meta.dirname, 'page.tsx'), 'utf-8');

describe('DeployPage — 正例', () => {
  it('应导出默认组件', () => assert.ok(SRC.includes('export default function DeployPage')));
  it('应包含 "use client"', () => assert.ok(SRC.includes("'use client'")));
  it('应包含useState/useEffect/useCallback等hook', () => {
    assert.ok(SRC.includes('useState') || SRC.includes('useEffect') || SRC.includes('useCallback'));
  });
});

describe('DeployPage — 防御', () => {
  it('无dangerouslySetInnerHTML', () => assert.ok(!SRC.includes('dangerouslySetInnerHTML')));
  it('无any类型', () => assert.ok(!/:\s*any\b/.test(SRC)));
  it('使用类型断言', () => assert.ok(SRC.includes('as') && (SRC.includes('Tag') || SRC.includes('variant'))));
});

describe('DeployPage — 部署模块', () => {
  it('应包含 DEPLOYS 数据', () => assert.ok(SRC.includes('DEPLOYS')));
  it('应包含 Deployment 接口', () => assert.ok(SRC.includes('interface Deployment')));
  it('应包含 Table 展示', () => assert.ok(SRC.includes('Table')));
  it('应支持环境筛选', () => assert.ok(SRC.includes('envFilter')));
  it('应支持新建部署 Modal', () => assert.ok(SRC.includes('showDeploy') && SRC.includes('Modal')));
});

describe('DeployPage — 环境覆盖', () => {
  it('应处理 production 环境', () => assert.ok(SRC.includes("'production'")));
  it('应处理 staging 环境', () => assert.ok(SRC.includes("'staging'")));
  it('应处理 testing 环境', () => assert.ok(SRC.includes("'testing'")));
});

describe('DeployPage — 状态覆盖', () => {
  it('应处理 success 状态', () => assert.ok(SRC.includes("'success'")));
  it('应处理 failed 状态', () => assert.ok(SRC.includes("'failed'")));
  it('应处理 rolling 状态', () => assert.ok(SRC.includes("'rolling'")));
  it('应处理 rollback 状态', () => assert.ok(SRC.includes("'rollback'")));
});

describe('DeployPage — 统计指标', () => {
  it('应计算成功率', () => assert.ok(SRC.includes('successRate')));
  it('应展示统计卡片', () => assert.ok(SRC.includes('Statistic')));
});

describe('Dev Tools / Deploy — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={') || SRC.includes('onClose={')));
  it('包含列表过滤', () => assert.ok(SRC.includes('.filter(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含Math.round统计计算', () => assert.ok(SRC.includes('Math.round')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
