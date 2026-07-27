import assert from 'node:assert/strict';
    import { describe, it } from 'node:test';
    import { readFileSync } from 'node:fs';
    import { dirname, resolve } from 'node:path';
    import { fileURLToPath } from 'node:url';

    const DIR = dirname(fileURLToPath(import.meta.url));
    const DATA_SRC = readFileSync(resolve(DIR, 'member-cards-data.ts'), 'utf-8');
    const CLIENT_SRC = readFileSync(resolve(DIR, 'member-cards-client.tsx'), 'utf-8');

    describe('members/cards 数据固证', () => {
      it('应固证数据合同', () => {
assert.ok(DATA_SRC.includes('local member card samples'));
assert.ok(DATA_SRC.includes('deliveryMode: \'fallback\''));
      });

      it('应固证交互链路', () => {
assert.ok(CLIENT_SRC.includes('setCards'));
assert.ok(CLIENT_SRC.includes('setDialogOpen'));
assert.ok(CLIENT_SRC.includes('确认发行'));
      });
    });
