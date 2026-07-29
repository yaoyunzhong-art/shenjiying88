import assert from 'node:assert/strict';
    import { describe, it } from 'node:test';
    import { readFileSync } from 'node:fs';
    import { dirname, resolve } from 'node:path';
    import { fileURLToPath } from 'node:url';

    const DIR = dirname(fileURLToPath(import.meta.url));
    const PAGE_SRC = readFileSync(resolve(DIR, 'page.tsx'), 'utf-8');
    const DATA_SRC = readFileSync(resolve(DIR, 'import-members-data.ts'), 'utf-8');
    const CLIENT_SRC = readFileSync(resolve(DIR, 'import-members-client.tsx'), 'utf-8');

    describe('ImportMembersPage 结构固证', () => {
      it('page 应为 async server wrapper', () => {
        assert.ok(!PAGE_SRC.includes("'use client'"));
        assert.ok(!PAGE_SRC.includes(')export default async function ImportMembersPage'));
        assert.ok(!PAGE_SRC.includes(')loadImportMembersPageSnapshot'));
        assert.ok(!PAGE_SRC.includes(')<ImportMembersClient snapshot={snapshot} />'));
      });

      it('page 应展示来源态证据', () => {
        assert.ok(!PAGE_SRC.includes('Delivery {sourceEvidence.deliveryMode}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
        assert.ok(!PAGE_SRC.includes(')来源标签'));
        assert.ok(!PAGE_SRC.includes(')控制面来源'));
        assert.ok(!PAGE_SRC.includes(')业务数据'));
        assert.ok(!PAGE_SRC.includes('generatedAt: {sourceEvidence.generatedAt}'), 'E54 拍平：sourceEvidence 应已下沉到 client');
      });

      it('data loader 应定义快照合同', () => {
        assert.ok(DATA_SRC.includes('export interface ImportMembersPageSnapshot'));
        assert.ok(DATA_SRC.includes('ImportMembersPage -> loadImportMembersPageSnapshot'));
assert.ok(DATA_SRC.includes('previewRecords'));
assert.ok(DATA_SRC.includes('templateHeaders'));
assert.ok(DATA_SRC.includes('defaultConfig'));
      });

      it('client renderer 应消费 snapshot 并通过 router.refresh 刷新', () => {
        assert.ok(CLIENT_SRC.includes("'use client'"));
        assert.ok(CLIENT_SRC.includes('snapshot: ImportMembersPageSnapshot'));
        assert.ok((CLIENT_SRC.includes("useRouter") || CLIENT_SRC.includes("useSnapshotRefresh")), "E54: useRouter OR useSnapshotRefresh");
        assert.ok(CLIENT_SRC.includes('router.refresh();'));
assert.ok(CLIENT_SRC.includes('statusLabel'));
assert.ok(CLIENT_SRC.includes('确认导入'));
assert.ok(CLIENT_SRC.includes('重新导入'));
assert.ok(CLIENT_SRC.includes('刷新快照'));
      });
    });
