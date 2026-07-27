import assert from 'node:assert/strict';
    import { describe, it } from 'node:test';
    import { readFileSync } from 'node:fs';
    import { dirname, resolve } from 'node:path';
    import { fileURLToPath } from 'node:url';

    const DIR = dirname(fileURLToPath(import.meta.url));
    const DATA_SRC = readFileSync(resolve(DIR, 'create-member-data.ts'), 'utf-8');
    const CLIENT_SRC = readFileSync(resolve(DIR, 'create-member-client.tsx'), 'utf-8');

    describe('members/create 数据固证', () => {
      it('应固证数据合同', () => {
assert.ok(DATA_SRC.includes('marketCode: \'cn-mainland\''));
assert.ok(DATA_SRC.includes('{ key: \'diamond\', label: \'钻石卡\' }'));
      });

      it('应固证交互链路', () => {
assert.ok(CLIENT_SRC.includes('该手机号已被注册为会员'));
assert.ok(CLIENT_SRC.includes('返回列表'));
assert.ok(CLIENT_SRC.includes('创建会员'));
      });
    });
