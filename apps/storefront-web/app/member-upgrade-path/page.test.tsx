const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

// Server component — test by rendering via RSC or static analysis
describe('MemberUpgradePathPage', () => {
  test('page file exports a default function', () => {
    const mod = require('./page');
    assert.equal(typeof mod.default, 'function', 'page must export default function');
  });

  test('page component is named MemberUpgradePathPage', () => {
    const mod = require('./page');
    // The export default function name
    assert.ok(mod.default.name === 'MemberUpgradePathPage', `Expected MemberUpgradePathPage, got ${mod.default.name}`);
  });
});
