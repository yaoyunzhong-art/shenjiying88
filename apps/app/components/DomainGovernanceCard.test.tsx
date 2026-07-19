import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { create } from 'react-test-renderer';
import { Alert, Text, TouchableOpacity } from 'react-native';
import { DomainGovernanceCard } from './DomainGovernanceCard';

const alertCalls: Array<{ title: string; message: string }> = [];
Alert.alert = ((title: string, message?: string) => {
  alertCalls.push({ title, message: message ?? '' });
}) as typeof Alert.alert;

const model = {
  eyebrow: '域名治理工作台',
  subtitle: '统一域名缺口、推荐补选和治理入口展示',
  title: '域名来源 custom / 可直接补选 1',
  statusLabel: '待治理',
  summaryText: '缺主 scope 2 / 活跃未设主域名 3',
  renderSections: [
    {
      title: '治理概览',
      items: [
        {
          label: '域名来源',
          value: '域名来源 custom / 可直接补选 1',
          tone: 'primary' as const,
        },
        {
          label: '治理状态',
          value: '待治理',
          tone: 'accent' as const,
        },
        {
          label: '治理概览',
          value: '缺主 scope 2 / 活跃未设主域名 3',
          tone: 'summary' as const,
        },
        {
          label: '状态摘要',
          value: '治理状态：待治理 / 可直接补选 1',
          tone: 'summary' as const,
        },
      ],
    },
    {
      title: '焦点 scope',
      items: [
        {
          label: '焦点 scope STORE / tenant-demo / brand-demo / store-001',
          value: '焦点 scope STORE / tenant-demo / brand-demo / store-001 / 激活域名 2 / 缺主域名',
          tone: 'accent' as const,
        },
      ],
    },
    {
      title: '推荐补选',
      items: [
        {
          label: '推荐主域名',
          value: '推荐主域名：store-001.brand-demo.tenant-demo.cn-mainland.local / 原因 优先选择 active_ssl',
          tone: 'summary' as const,
        },
      ],
    },
  ],
  workspaceLabel: '治理入口',
  workspaceHref:
    '/saas/domains?tenantId=tenant-demo&brandId=brand-demo&storeId=store-001&marketCode=cn-mainland&scopeType=STORE',
  ctaLabel: '打开域名治理工作台',
  requiresAttention: true,
};

function collectTextContent(node: unknown, chunks: string[] = []): string[] {
  if (typeof node === 'string' || typeof node === 'number') {
    chunks.push(String(node));
    return chunks;
  }

  if (Array.isArray(node)) {
    node.forEach((item) => collectTextContent(item, chunks));
    return chunks;
  }

  if (node && typeof node === 'object' && 'props' in (node as Record<string, unknown>)) {
    collectTextContent((node as { props?: { children?: unknown } }).props?.children, chunks);
  }

  return chunks;
}

function findByText(root: ReturnType<typeof create>['root'], text: string) {
  const all = root.findAllByType(Text);
  return all.find((item) => collectTextContent(item.props.children).join('').includes(text));
}

test('DomainGovernanceCard renders shared render sections contract', () => {
  alertCalls.length = 0;
  const root = create(<DomainGovernanceCard model={model} />);

  assert.ok(findByText(root.root, model.eyebrow), '应渲染 header eyebrow');
  assert.ok(findByText(root.root, model.title), '应渲染 header title slot');
  assert.ok(findByText(root.root, '治理概览'), '应渲染 shared header section title');
  assert.ok(findByText(root.root, '治理明细'), '应渲染 detail section title');
  assert.ok(findByText(root.root, model.renderSections[1].title), '应渲染 detail group label');
  assert.ok(findByText(root.root, model.workspaceLabel), '应渲染 footer workspace label');
  assert.ok(findByText(root.root, model.ctaLabel), '应渲染 footer CTA');
});

test('DomainGovernanceCard CTA opens shared workspace slot value', () => {
  alertCalls.length = 0;
  const root = create(<DomainGovernanceCard model={model} />);
  const cta = root.root.findAllByType(TouchableOpacity).find((item) => item.props.testID === 'domain-governance-cta');

  assert.ok(cta, '应找到治理 CTA');
  cta?.props.onPress();
  assert.deepEqual(alertCalls[0], {
    title: model.eyebrow,
    message: model.workspaceHref,
  });
});
