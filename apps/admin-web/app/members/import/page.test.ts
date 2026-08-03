import assert from 'node:assert/strict';
    import { describe, it } from 'node:test';
    import { readFileSync } from 'node:fs';
    import { dirname, resolve } from 'node:path';
    import { fileURLToPath } from 'node:url';

    const DIR = dirname(fileURLToPath(import.meta.url));
    const DATA_SRC = readFileSync(resolve(DIR, 'import-members-data.ts'), 'utf-8');
    const CLIENT_SRC = readFileSync(resolve(DIR, 'import-members-client.tsx'), 'utf-8');

    describe('members/import 数据固证', () => {
      it('应固证数据合同', () => {
assert.ok(DATA_SRC.includes('duplicateCheck: \'phone\''));
assert.ok(DATA_SRC.includes('\'姓名\', \'手机号\', \'邮箱\''));
      });

      it('应固证交互链路', () => {
assert.ok(CLIENT_SRC.includes('setStage(\'preview\')'));
assert.ok(CLIENT_SRC.includes('setProgress'));
assert.ok(CLIENT_SRC.includes('返回会员列表'));
      });
    });
