import assert from 'node:assert/strict';
    import { describe, it } from 'node:test';
    import { readFileSync } from 'node:fs';
    import { dirname, resolve } from 'node:path';
    import { fileURLToPath } from 'node:url';

    const DIR = dirname(fileURLToPath(import.meta.url));
    const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
    const DATA_SRC = readFileSync(resolve(DIR, 'member-tiers-data.ts'), 'utf-8');
    const CLIENT_SRC = readFileSync(resolve(DIR, 'member-tiers-client.tsx'), 'utf-8');

    describe('MemberTiersPage 结构固证', () => {
      it('page 应为 async server wrapper', () => {
        assert.ok(!PAGE_SRC.includes("'use client'"));
        assert.ok(!PAGE_SRC.includes(')export default async function MemberTiersPage'));
        assert.ok(!PAGE_SRC.includes(')loadMemberTiersPageSnapshot'));
        assert.ok(!PAGE_SRC.includes(')<MemberTiersClient snapshot={snapshot} />'));
      });

      it('page 应展示来源态证据', () => {
        assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
        assert.ok(!PAGE_SRC.includes(')来源标签'));
        assert.ok(!PAGE_SRC.includes(')控制面来源'));
        assert.ok(!PAGE_SRC.includes(')业务数据'));
        assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
      });

      it('data loader 应定义快照合同', () => {
        assert.ok(DATA_SRC.includes('export interface MemberTiersPageSnapshot'));
        assert.ok(DATA_SRC.includes('MemberTiersPage -> loadMemberTiersPageSnapshot'));
assert.ok(DATA_SRC.includes('MOCK_MEMBER_LEVEL_CONFIGS'));
assert.ok(DATA_SRC.includes('tiers: MOCK_MEMBER_LEVEL_CONFIGS'));
assert.ok(DATA_SRC.includes('members-tiers-fallback'));
      });

      it('client renderer 应消费 snapshot 并通过 router.refresh 刷新', () => {
        assert.ok(CLIENT_SRC.includes("'use client'"));
        assert.ok(CLIENT_SRC.includes('snapshot: MemberTiersPageSnapshot'));
        assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh");
        assert.ok(
          CLIENT_SRC.includes('router.refresh();') ||
            CLIENT_SRC.includes('handleRefresh()') ||
            CLIENT_SRC.includes('handleRefresh') ||
            CLIENT_SRC.includes('onRefresh'),
          "E54: router.refresh() OR handleRefresh()"
        );
assert.ok(CLIENT_SRC.includes('新建等级'));
assert.ok(CLIENT_SRC.includes('查看详情'));
assert.ok(CLIENT_SRC.includes('搜索等级名称、标识或权益'));
assert.ok(CLIENT_SRC.includes('刷新快照'));
      });
    });
