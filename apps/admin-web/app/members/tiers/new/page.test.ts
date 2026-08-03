import assert from 'node:assert/strict';
    import { describe, it } from 'node:test';
    import { readFileSync } from 'node:fs';
    import { dirname, resolve } from 'node:path';
    import { fileURLToPath } from 'node:url';

    const DIR = dirname(fileURLToPath(import.meta.url));
    const DATA_SRC = readFileSync(resolve(DIR, 'new-member-tier-data.ts'), 'utf-8');
    const CLIENT_SRC = readFileSync(resolve(DIR, 'new-member-tier-client.tsx'), 'utf-8');

    describe('members/tiers/new 数据固证', () => {
      it('应固证数据合同', () => {
assert.ok(DATA_SRC.includes('minPoints: \'\''));
assert.ok(DATA_SRC.includes('discountRate: \'\''));
      });

      it('应固证交互链路', () => {
assert.ok(CLIENT_SRC.includes('setFormData'));
assert.ok(CLIENT_SRC.includes('setSubmitState'));
assert.ok(CLIENT_SRC.includes('handleRefresh'));
      });
    });
