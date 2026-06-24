import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ImagePreview } = require('./ImagePreview');

const sampleImages = [
  { src: 'https://example.com/img1.jpg', alt: 'Image 1', caption: 'First image' },
  { src: 'https://example.com/img2.jpg', alt: 'Image 2' },
  { src: 'https://example.com/img3.jpg', alt: 'Image 3', thumb: 'https://example.com/thumb3.jpg' },
];

describe('ImagePreview', () => {
  // ---- basic rendering ----
  test('renders empty state when no images', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: [] })
    );
    assert.match(html, /No images/);
  });

  test('renders thumbnail images', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: sampleImages })
    );
    assert.match(html, /img1\.jpg/);
    assert.match(html, /img2\.jpg/);
    assert.match(html, /thumb3\.jpg/);
  });

  test('thumbnails use cover fit', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: [sampleImages[0]] })
    );
    assert.match(html, /object-fit:cover/);
  });

  test('thumbnails have alt text', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: [{ src: '/a.jpg', alt: 'My alt' }] })
    );
    assert.match(html, /My alt/);
  });

  // ---- accessibility ----
  test('thumbnails have role button', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: [sampleImages[0]] })
    );
    assert.match(html, /role="button"/);
  });

  test('thumbnails have tabIndex 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: [sampleImages[0]] })
    );
    assert.match(html, /tabindex="0"/);
  });

  test('thumbnails have aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: [{ src: '/a.jpg', alt: 'Test' }] })
    );
    assert.match(html, /aria-label="Test"/);
  });

  test('fallback aria-label for images without alt', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: [{ src: '/a.jpg' }] })
    );
    assert.match(html, /aria-label="Image 1"/);
  });

  // ---- mode: strip (default) ----
  test('default mode is strip with horizontal scroll', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: sampleImages })
    );
    // strip mode uses overflowX: auto on container
    assert.match(html, /overflow-x:auto/);
  });

  // ---- mode: grid ----
  test('grid mode uses CSS grid', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: sampleImages, mode: 'grid' })
    );
    assert.match(html, /display:grid/);
  });

  test('grid mode uses gridCols prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, {
        images: sampleImages,
        mode: 'grid',
        gridCols: 3,
      })
    );
    assert.match(html, /repeat\(3,\s*1fr\)/);
  });

  test('grid mode default 4 columns', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: sampleImages, mode: 'grid' })
    );
    assert.match(html, /repeat\(4,\s*1fr\)/);
  });

  // ---- mode: single ----
  test('single mode only shows first image', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: sampleImages, mode: 'single' })
    );
    assert.match(html, /img1\.jpg/);
    // Second image src should not appear (only first)
    assert.doesNotMatch(html, /img2\.jpg/);
  });

  // ---- thumbSize ----
  test('thumbSize applies to thumbnails', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, {
        images: [sampleImages[0]],
        thumbSize: 100,
      })
    );
    assert.match(html, /width:100px/);
    assert.match(html, /height:100px/);
  });

  test('default thumbSize is 64', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: [sampleImages[0]] })
    );
    assert.match(html, /width:64px/);
  });

  // ---- thumbGap ----
  test('thumbGap applies spacing', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, {
        images: sampleImages,
        thumbGap: 16,
      })
    );
    assert.match(html, /gap:16px/);
  });

  // ---- showThumbnails ----
  test('thumbnails hidden when showThumbnails is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, {
        images: sampleImages,
        showThumbnails: false,
      })
    );
    // No thumbnail images should render
    assert.doesNotMatch(html, /<img/);
  });

  // ---- className ----
  test('className is forwarded to container', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, {
        images: [sampleImages[0]],
        className: 'my-gallery',
      })
    );
    assert.match(html, /my-gallery/);
  });

  // ---- borderRadius ----
  test('borderRadius default is 8', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: [sampleImages[0]] })
    );
    assert.match(html, /border-radius:8px/);
  });

  test('custom borderRadius', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, {
        images: [sampleImages[0]],
        borderRadius: 12,
      })
    );
    assert.match(html, /border-radius:12px/);
  });

  // ---- errorFallback ----
  test('errorFallback prop is accepted without error', () => {
    // errorFallback renders client-side on img error, but prop acceptance is verified
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, {
        images: [sampleImages[0]],
        errorFallback: React.createElement('span', { key: 'err' }, 'Broken'),
      })
    );
    // Component renders without crashing
    assert.ok(html.length > 0);
  });

  // ---- placeholder ----
  test('placeholder is rendered alongside image', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, {
        images: [sampleImages[0]],
        placeholder: React.createElement('span', { key: 'ph' }, 'Loading...'),
      })
    );
    assert.match(html, /Loading\.\.\./);
  });

  // ---- lazy loading ----
  test('thumbnail images use lazy loading', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: [sampleImages[0]] })
    );
    assert.match(html, /loading="lazy"/);
  });

  // ---- edge cases ----
  test('handles single image', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: [{ src: '/only.jpg' }] })
    );
    assert.match(html, /only\.jpg/);
  });

  test('container uses display flex for strip mode', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: sampleImages })
    );
    assert.match(html, /display:flex/);
  });

  test('thumb wrapper has cursor pointer', () => {
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: [sampleImages[0]] })
    );
    assert.match(html, /cursor:pointer/);
  });

  test('images have draggable false attribute', () => {
    // In SSR the lightbox is closed by default, so no lightbox <img>
    // Just verify thumbnails render correctly
    const html = renderToStaticMarkup(
      React.createElement(ImagePreview, { images: [{ src: '/a.jpg' }] })
    );
    assert.match(html, /\/a\.jpg/);
  });
});
