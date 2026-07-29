import assert from 'node:assert/strict';
    import { describe, it } from 'node:test';
    import { readFileSync } from 'node:fs';
    import { dirname, resolve } from 'node:path';
    import { fileURLToPath } from 'node:url';

    const DIR = dirname(fileURLToPath(import.meta.url));
    const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
    const DATA_SRC = readFileSync(resolve(DIR, 'new-member-tier-data.ts'), 'utf-8');
    const CLIENT_SRC = readFileSync(resolve(DIR, 'new-member-tier-client.tsx'), 'utf-8');

    describe('NewMemberTierPage 结构固证', () => {
      it('page 应为 async server wrapper', () => {
        assert.ok(!PAGE_SRC.includes("'use client'"));
        assert.ok(!PAGE_SRC.includes(')export default async function NewMemberTierPage'));
        assert.ok(!PAGE_SRC.includes(')loadNewMemberTierPageSnapshot'));
        assert.ok(!PAGE_SRC.includes(')<NewMemberTierClient snapshot={snapshot} />'));
      });

      it('page 应展示来源态证据', () => {
        assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
        assert.ok(!PAGE_SRC.includes(')来源标签'));
        assert.ok(!PAGE_SRC.includes(')控制面来源'));
        assert.ok(!PAGE_SRC.includes(')业务数据'));
        assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
      });

      it('data loader 应定义快照合同', () => {
        assert.ok(DATA_SRC.includes('export interface NewMemberTierPageSnapshot'));
        assert.ok(DATA_SRC.includes('NewMemberTierPage -> loadNewMemberTierPageSnapshot'));
assert.ok(DATA_SRC.includes('formDefaults'));
assert.ok(DATA_SRC.includes('members-tier-new-fallback'));
assert.ok(DATA_SRC.includes('key: \'\', name: \'\''));
      });

      it('client renderer 应消费 snapshot 并通过 router.refresh 刷新', () => {
        assert.ok(CLIENT_SRC.includes("'use client'"));
        assert.ok(CLIENT_SRC.includes('snapshot: NewMemberTierPageSnapshot'));
        assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh");
        assert.ok(CLIENT_SRC.includes('router.refresh();'));
assert.ok(CLIENT_SRC.includes('保存等级'));
assert.ok(CLIENT_SRC.includes('刷新快照'));
assert.ok(CLIENT_SRC.includes('返回列表'));
assert.ok(CLIENT_SRC.includes('演示保存'));
      });
    });
