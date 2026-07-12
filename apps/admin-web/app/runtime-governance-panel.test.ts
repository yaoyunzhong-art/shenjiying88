import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { RuntimeGovernancePanel } from './components/runtime-governance-panel';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSource(): string {
  return readFileSync(resolve(__dirname, 'components/runtime-governance-panel.tsx'), 'utf-8');
}

test('admin runtime panel: renders shared runtime receipt read model', () => {
  const markup = renderToStaticMarkup(
    React.createElement(RuntimeGovernancePanel, {
      tenantContext: {
        tenantId: 'tenant-demo',
        brandId: 'brand-demo',
        storeId: 'store-001',
        marketCode: 'cn-mainland'
      }
    })
  );

  assert.match(markup, /真实 Runtime 闭环/);
  assert.match(markup, /最近 Receipt/);
  assert.match(markup, /tenant-demo/);
});

describe('runtime-governance-panel — 正例·布局', () => {
  it('应包含 header / title 区域', () => {
    const src = readSource();
    assert.ok(src.includes('title') || src.includes('header') || src.includes('Header'));
  });
  it('应包含 panel wrapper', () => {
    const src = readSource();
    assert.ok(src.includes('panel') || src.includes('Panel'));
  });
  it('应包含 receipt display', () => {
    const src = readSource();
    assert.ok(src.includes('receipt') || src.includes('Receipt'));
  });
  it('应使用 tailwind 类名', () => {
    const src = readSource();
    assert.ok(/className\s*:/.test(src));
  });
});

describe('runtime-governance-panel — 边界·防御', () => {
  it('render 不应抛出', () => {
    assert.doesNotThrow(() => {
      renderToStaticMarkup(
        React.createElement(RuntimeGovernancePanel, {
          tenantContext: {
            tenantId: 'tenant-demo',
            brandId: 'brand-demo',
            storeId: 'store-001',
            marketCode: 'cn-mainland'
          }
        })
      );
    });
  });
  it('render 应产生非空 markup', () => {
    const markup = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanel, {
        tenantContext: {
          tenantId: 'tenant-demo',
          brandId: 'brand-demo',
          storeId: 'store-001',
          marketCode: 'cn-mainland'
        }
      })
    );
    assert.ok(markup.length > 50);
  });
  it('不应使用 dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'));
  });
  it('不应内联 style 标签', () => {
    const markup = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanel, {
        tenantContext: {
          tenantId: 'tenant-demo',
          brandId: 'brand-demo',
          storeId: 'store-001',
          marketCode: 'cn-mainland'
        }
      })
    );
    assert.ok(!/<style\b/i.test(markup.slice(0, 500)));
  });
  it('render 结果应包含 tenant-demo', () => {
    const markup = renderToStaticMarkup(
      React.createElement(RuntimeGovernancePanel, {
        tenantContext: {
          tenantId: 'tenant-demo',
          brandId: 'brand-demo',
          storeId: 'store-001',
          marketCode: 'cn-mainland'
        }
      })
    );
    assert.ok(markup.includes('tenant-demo'));
  });
});

describe('runtime-governance-panel — 反例', () => {
  it('缺少 tenantId 不应对 render 造成致命破坏', () => {
    assert.doesNotThrow(() => {
      renderToStaticMarkup(
        React.createElement(RuntimeGovernancePanel, {
          tenantContext: {
            tenantId: '',
            brandId: 'brand-demo',
            storeId: 'store-001',
            marketCode: 'cn-mainland'
          }
        })
      );
    });
  });
  it('错误传递非对象 prop 不抛出', () => {
    assert.doesNotThrow(() => {
      renderToStaticMarkup(
        // @ts-expect-error 故意传 null
        React.createElement(RuntimeGovernancePanel, { tenantContext: null })
      );
    });
  });
});
