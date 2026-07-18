import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE_PATH = resolve(__dirname, 'DomainGovernancePanel.tsx');
const source = readFileSync(SOURCE_PATH, 'utf-8');

test('DomainGovernancePanel source consumes shared render sections helper', () => {
  assert.ok(
    source.includes('buildDomainGovernanceRenderSections'),
    'should import shared render sections helper',
  );
  assert.ok(source.includes('const renderSections = buildDomainGovernanceRenderSections(model)'), 'should derive render sections from shared model');
  assert.ok(source.includes('const headerSection = model.headerSection'), 'should consume shared header section');
  assert.ok(source.includes('const footerSection = model.footerSection'), 'should consume shared footer section');
});

test('DomainGovernancePanel source renders shared section titles and slots', () => {
  assert.ok(source.includes('renderSections.map((section) => ('), 'should render section list');
  assert.ok(source.includes('{section.title}'), 'should render section title');
  assert.ok(source.includes('section.slots.map((slot) => ('), 'should render section slots');
  assert.ok(source.includes('{slot.label}：{slot.value}'), 'should render label and value from shared slot');
  assert.ok(source.includes('{footerSection.ctaLabel}'), 'should render footer CTA label');
});
