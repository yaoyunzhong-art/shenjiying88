/**
 * admin-web 全量测试入口
 *
 * 不要用 node --test 'app/**/*.test.ts' glob 模式，
 * 因为 [id] 路径会被 glob 展开为字符集 [id] 导致假阳性。
 *
 * 改用 find 逐个运行。
 */
import { execSync } from 'node:child_process';
import { spawnSync } from 'node:child_process';

// 也可以用 node --import tsx --import .test-setup.mjs --test 直接跑
// 注意: 不传 glob 模式，传具体文件路径列表

console.log('ℹ Use: node --import tsx --import .test-setup.mjs --test <file1> <file2> ...');
console.log('ℹ Or: find app -name "*.test.ts" -o -name "*.test.tsx" | xargs node ...');
