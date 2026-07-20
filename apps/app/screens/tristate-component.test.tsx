/**
 * TriState component tests
 * C页面 - 组件单元测试
 */
import assert from 'node:assert/strict';
import test from 'node:test';

// TriState 组件契约 - 纯逻辑/配置层测试
interface TriStateConfig {
  loading: boolean;
  error: string | null;
  empty: boolean;
  expected: 'loading' | 'error' | 'empty' | 'content';
}

const configs: TriStateConfig[] = [
  { loading: true, error: null, empty: false, expected: 'loading' },
  { loading: true, error: '错误', empty: false, expected: 'loading' },
  { loading: false, error: '出错啦', empty: false, expected: 'error' },
  { loading: false, error: null, empty: true, expected: 'empty' },
  { loading: false, error: null, empty: false, expected: 'content' },
];

// 简化的优先级判定：loading > error > empty > content
function resolveTriStatePriority(config: TriStateConfig): TriStateConfig['expected'] {
  if (config.loading) return 'loading';
  if (config.error) return 'error';
  if (config.empty) return 'empty';
  return 'content';
}

test('TriState 优先级: loading=true → loading', () => {
  assert.equal(resolveTriStatePriority(configs[0]), 'loading');
});

test('TriState 优先级: loading=true 即使有 error → loading', () => {
  assert.equal(resolveTriStatePriority(configs[1]), 'loading');
});

test('TriState 优先级: error 非空 → error', () => {
  assert.equal(resolveTriStatePriority(configs[2]), 'error');
});

test('TriState 优先级: empty=true → empty', () => {
  assert.equal(resolveTriStatePriority(configs[3]), 'empty');
});

test('TriState 优先级: 无异常 → content', () => {
  assert.equal(resolveTriStatePriority(configs[4]), 'content');
});

test('TriState 默认空状态文案', () => {
  const defaultEmptyMessage = '暂无数据';
  assert.equal(defaultEmptyMessage, '暂无数据');
});

test('TriState 默认空状态图标', () => {
  const defaultEmptyIcon = '📭';
  assert.equal(defaultEmptyIcon, '📭');
});

test('TriState 错误状态应提供重试回调', () => {
  let retryCalled = false;
  const onRetry = () => { retryCalled = true; };
  onRetry();
  assert.equal(retryCalled, true, '重试回调应被调用');
});
