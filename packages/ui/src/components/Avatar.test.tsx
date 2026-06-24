import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Avatar, AvatarGroup } = require('./Avatar');

describe('Avatar', () => {
  // ---- basic rendering ----
  test('renders fallback ? when no src or initials', () => {
    const html = renderToStaticMarkup(React.createElement(Avatar, {}));
    assert.match(html, /\?/);
  });

  test('renders initials from initials prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'Zhang San' })
    );
    assert.match(html, /ZS/);
  });

  test('renders single initial when only one word', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'Admin' })
    );
    assert.match(html, />A</);
    // Should not render two characters when only one word
    assert.doesNotMatch(html, />Ad</);
  });

  test('renders max 2 characters', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'A B C D' })
    );
    assert.match(html, /AB/);
  });

  test('lowercase initials are uppercased', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'li wei' })
    );
    assert.match(html, /LW/);
  });

  test('renders image when src is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { src: 'https://example.com/photo.jpg', alt: 'User photo' })
    );
    assert.match(html, /<img/);
    assert.match(html, /photo\.jpg/);
    assert.match(html, /User photo/);
  });

  test('image has object-fit cover', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { src: '/avatar.png' })
    );
    assert.match(html, /object-fit:cover/);
  });

  // ---- sizes ----
  test('xs size renders 24px', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { size: 'xs', initials: 'XS' })
    );
    assert.match(html, /width:24px/);
    assert.match(html, /height:24px/);
  });

  test('sm size renders 32px', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { size: 'sm', initials: 'SM' })
    );
    assert.match(html, /width:32px/);
  });

  test('md size renders 40px (default)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'MD' })
    );
    assert.match(html, /width:40px/);
  });

  test('lg size renders 48px', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { size: 'lg', initials: 'LG' })
    );
    assert.match(html, /width:48px/);
  });

  test('xl size renders 64px', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { size: 'xl', initials: 'XL' })
    );
    assert.match(html, /width:64px/);
  });

  // ---- status dots ----
  test('no status dot by default (status=none)', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'NA' })
    );
    // No status color hexes should appear
    assert.doesNotMatch(html, /#22c55e/);
    assert.doesNotMatch(html, /#94a3b8/);
    assert.doesNotMatch(html, /#ef4444/);
    assert.doesNotMatch(html, /#f59e0b/);
  });

  test('online status shows green dot', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'ON', status: 'online' })
    );
    assert.match(html, /#22c55e/);
  });

  test('offline status shows grey dot', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'OF', status: 'offline' })
    );
    assert.match(html, /#94a3b8/);
  });

  test('busy status shows red dot', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'BY', status: 'busy' })
    );
    assert.match(html, /#ef4444/);
  });

  test('away status shows amber dot', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'AW', status: 'away' })
    );
    assert.match(html, /#f59e0b/);
  });

  test('status dot has ring border', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'S', status: 'online' })
    );
    assert.match(html, /2px solid/);
  });

  // ---- custom colors ----
  test('custom bgColor and textColor', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, {
        initials: 'CC',
        bgColor: '#111111',
        textColor: '#ffffff',
      })
    );
    assert.match(html, /#111111/);
    assert.match(html, /#ffffff/);
  });

  test('default colors are blue-tinted', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'DB' })
    );
    assert.match(html, /59,130,246/);
    assert.match(html, /93c5fd/);
  });

  // ---- aria / accessibility ----
  test('has aria-label with initials', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'ARIA' })
    );
    assert.match(html, /aria-label="ARIA"/);
  });

  test('has aria-label with alt when no initials', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { alt: 'avatar pic' })
    );
    assert.match(html, /aria-label="avatar pic"/);
  });

  test('default aria-label is avatar', () => {
    const html = renderToStaticMarkup(React.createElement(Avatar, {}));
    assert.match(html, /aria-label="avatar"/);
  });

  // ---- click interaction ----
  test('has role button when onClick is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'BT', onClick: () => {} })
    );
    assert.match(html, /role="button"/);
  });

  test('has tabIndex 0 when onClick is provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'TB', onClick: () => {} })
    );
    assert.match(html, /tabindex="0"/);
  });

  test('no role button when no onClick', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'NR' })
    );
    assert.doesNotMatch(html, /role="button"/);
  });

  // ---- edge cases ----
  test('empty initials shows ?', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: '' })
    );
    assert.match(html, /\?/);
  });

  test('whitespace-only initials shows ?', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: '   ' })
    );
    assert.match(html, /\?/);
  });

  test('initials with leading/trailing spaces are trimmed', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: '  Hello World  ' })
    );
    assert.match(html, /HW/);
  });

  test('container has 50% border-radius', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'RD' })
    );
    assert.match(html, /border-radius:50%/);
  });

  test('className is forwarded', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'CL', className: 'my-avatar' })
    );
    assert.match(html, /my-avatar/);
  });

  test('inline-flex display', () => {
    const html = renderToStaticMarkup(
      React.createElement(Avatar, { initials: 'IF' })
    );
    assert.match(html, /display:inline-flex/);
  });
});

describe('AvatarGroup', () => {
  test('renders multiple avatars', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        AvatarGroup,
        null,
        React.createElement(Avatar, { initials: 'A' }),
        React.createElement(Avatar, { initials: 'B' }),
        React.createElement(Avatar, { initials: 'C' })
      )
    );
    assert.match(html, /A/);
    assert.match(html, /B/);
    assert.match(html, /C/);
  });

  test('shows overflow badge when items exceed max', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        AvatarGroup,
        { max: 2 },
        React.createElement(Avatar, { initials: 'A' }),
        React.createElement(Avatar, { initials: 'B' }),
        React.createElement(Avatar, { initials: 'C' }),
        React.createElement(Avatar, { initials: 'D' })
      )
    );
    assert.match(html, /\+2/);
    assert.match(html, /A/);
    assert.match(html, /B/);
    // C and D are hidden
    assert.doesNotMatch(html, />C</);
    assert.doesNotMatch(html, />D</);
  });

  test('no overflow badge when items <= max', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        AvatarGroup,
        { max: 4 },
        React.createElement(Avatar, { initials: 'A' }),
        React.createElement(Avatar, { initials: 'B' }),
        React.createElement(Avatar, { initials: 'C' })
      )
    );
    assert.doesNotMatch(html, /\+/);
  });

  test('overflow badge uses slate styling', () => {
    const html = renderToStaticMarkup(
      React.createElement(
        AvatarGroup,
        { max: 1 },
        React.createElement(Avatar, { initials: 'A' }),
        React.createElement(Avatar, { initials: 'B' })
      )
    );
    assert.match(html, /\+1/);
    assert.match(html, /94a3b8/);
  });

  test('default max is 4', () => {
    const avatars = Array.from({ length: 5 }, (_, i) =>
      React.createElement(Avatar, { key: i, initials: String(i) })
    );
    const html = renderToStaticMarkup(
      React.createElement(AvatarGroup, null, ...avatars)
    );
    assert.match(html, /\+1/);
  });
});
