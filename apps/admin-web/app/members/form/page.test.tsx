import assert from 'node:assert/strict';
    import { describe, it } from 'node:test';
    import { readFileSync } from 'node:fs';
    import { dirname, resolve } from 'node:path';
    import { fileURLToPath } from 'node:url';

    const DIR = dirname(fileURLToPath(import.meta.url));
    const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
    const DATA_SRC = readFileSync(resolve(DIR, 'member-tier-form-data.ts'), 'utf-8');
    const CLIENT_SRC = readFileSync(resolve(DIR, 'member-tier-form-client.tsx'), 'utf-8');

    describe('MemberTierFormPage 结构固证', () => {
      it('page 应为 async server wrapper', () => {
        assert.ok(!PAGE_SRC.includes("'use client'"));
        assert.ok(PAGE_SRC.includes('export default async function MemberTierFormPage'));
        assert.ok(PAGE_SRC.includes('loadMemberTierFormPageSnapshot'));
        assert.ok(PAGE_SRC.includes('<MemberTierFormClient snapshot={snapshot} />'));
      });

      it('page 应展示来源态证据', () => {
        assert.ok(PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'));
        assert.ok(PAGE_SRC.includes('来源标签'));
        assert.ok(PAGE_SRC.includes('控制面来源'));
        assert.ok(PAGE_SRC.includes('业务数据'));
        assert.ok(PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'));
      });

      it('data loader 应定义快照合同', () => {
        assert.ok(DATA_SRC.includes('export interface MemberTierFormPageSnapshot'));
        assert.ok(DATA_SRC.includes('MemberTierFormPage -> loadMemberTierFormPageSnapshot'));
assert.ok(DATA_SRC.includes('benefitOptions'));
assert.ok(DATA_SRC.includes('formDefaults'));
assert.ok(DATA_SRC.includes('members-form-fallback'));
      });

      it('client renderer 应消费 snapshot 并通过 router.refresh 刷新', () => {
        assert.ok(CLIENT_SRC.includes("'use client'"));
        assert.ok(CLIENT_SRC.includes('snapshot: MemberTierFormPageSnapshot'));
        assert.ok(CLIENT_SRC.includes('useRouter'));
        assert.ok(CLIENT_SRC.includes('router.refresh();'));
assert.ok(CLIENT_SRC.includes('validateForm'));
assert.ok(CLIENT_SRC.includes('至少选择一个权益类型'));
assert.ok(CLIENT_SRC.includes('保存配置'));
assert.ok(CLIENT_SRC.includes('刷新快照'));
      });
    });
