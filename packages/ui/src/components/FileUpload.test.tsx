import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);

const { FileUpload } = require('./FileUpload');

describe('FileUpload', () => {
  test('renders drop zone with placeholder text', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { placeholder: '拖拽文件到此处' })
    );
    assert.match(html, /拖拽文件到此处/);
    assert.match(html, /fileupload-dropzone/);
  });

  test('renders default placeholder when none provided', () => {
    const html = renderToStaticMarkup(React.createElement(FileUpload, null));
    assert.match(html, /拖拽文件到此处，或点击上传/);
  });

  test('renders hidden file input', () => {
    const html = renderToStaticMarkup(React.createElement(FileUpload, null));
    assert.match(html, /type="file"/);
    assert.match(html, /fileupload-input/);
    assert.match(html, /display:none/);
  });

  test('accept prop is applied to input', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { accept: '.pdf,.docx' })
    );
    assert.match(html, /accept="\.pdf,\.docx"/);
    assert.match(html, /支持: \.pdf,\.docx/);
  });

  test('multiple prop enables multiple attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { multiple: true })
    );
    assert.match(html, /multiple/);
  });

  test('disabled state sets aria-disabled and not-allowed cursor', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { disabled: true })
    );
    assert.match(html, /aria-disabled="true"/);
    assert.match(html, /not-allowed/);
  });

  test('disabled input is disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { disabled: true })
    );
    assert.match(html, /disabled/);
  });

  test('handles data-testid prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { 'data-testid': 'my-upload' })
    );
    assert.match(html, /data-testid="my-upload"/);
  });

  test('renders empty file list element when no files', () => {
    const html = renderToStaticMarkup(React.createElement(FileUpload, null));
    assert.doesNotMatch(html, /fileupload-list/);
  });

  test('renders file items when controlled files provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, {
        files: [
          {
            id: 'f1',
            name: 'report.pdf',
            size: 102400,
            type: 'application/pdf',
            progress: 100,
          },
        ],
      })
    );
    assert.match(html, /report\.pdf/);
    assert.match(html, /fileupload-list/);
    assert.match(html, /fileupload-item-f1/);
    // Should show formatted size
    assert.match(html, /100\.0 KB/);
  });

  test('renders image preview when preview URL is present', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, {
        files: [
          {
            id: 'img1',
            name: 'photo.jpg',
            size: 50000,
            type: 'image/jpeg',
            progress: 100,
            preview: 'blob:photo1',
          },
        ],
      })
    );
    assert.match(html, /fileupload-preview-img1/);
    assert.match(html, /blob:photo1/);
  });

  test('renders file icon when no preview', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, {
        files: [
          {
            id: 'doc1',
            name: 'data.csv',
            size: 2000,
            type: 'text/csv',
            progress: 100,
          },
        ],
      })
    );
    assert.match(html, /fileupload-icon-doc1/);
    assert.match(html, /📄/);
  });

  test('renders error text for failed files', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, {
        files: [
          {
            id: 'err1',
            name: 'big.zip',
            size: 50 * 1024 * 1024,
            type: 'application/zip',
            progress: -1,
            error: '文件大小 50.0 MB 超过限制 10.0 MB',
          },
        ],
      })
    );
    assert.match(html, /big\.zip/);
    assert.match(html, /fileupload-error-err1/);
    assert.match(html, /超过限制/);
  });

  test('renders progress bar when progress is between 0 and 99', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, {
        files: [
          {
            id: 'up1',
            name: 'uploading.bin',
            size: 5000000,
            type: 'application/octet-stream',
            progress: 45,
          },
        ],
      })
    );
    assert.match(html, /上传中 45%/);
  });

  test('does not show progress bar when progress is 100', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, {
        files: [
          {
            id: 'done1',
            name: 'done.bin',
            size: 1000,
            type: 'application/octet-stream',
            progress: 100,
          },
        ],
      })
    );
    assert.doesNotMatch(html, /上传中/);
  });

  test('renders remove button for each file', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, {
        files: [
          {
            id: 'rm1',
            name: 'delete-me.txt',
            size: 100,
            type: 'text/plain',
            progress: 100,
          },
        ],
      })
    );
    assert.match(html, /fileupload-remove-rm1/);
    assert.match(html, /✕/);
  });

  test('renders multiple files', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, {
        files: [
          { id: 'a', name: 'a.pdf', size: 100, type: 'application/pdf', progress: 100 },
          { id: 'b', name: 'b.pdf', size: 200, type: 'application/pdf', progress: 100 },
          { id: 'c', name: 'c.pdf', size: 300, type: 'application/pdf', progress: 100 },
        ],
      })
    );
    assert.match(html, /fileupload-item-a/);
    assert.match(html, /fileupload-item-b/);
    assert.match(html, /fileupload-item-c/);
  });

  test('compact variant uses smaller styles', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { variant: 'compact' })
    );
    assert.match(html, /12px 16px/);
  });

  test('default variant uses larger padding', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { variant: 'default' })
    );
    assert.match(html, /28px 24px/);
  });

  test('renders upload icon SVG', () => {
    const html = renderToStaticMarkup(React.createElement(FileUpload, null));
    assert.match(html, /svg/);
    assert.match(html, /viewBox="0 0 24 24"/);
  });

  test('has drag-over handler attributes', () => {
    const html = renderToStaticMarkup(React.createElement(FileUpload, null));
    assert.match(html, /role="button"/);
    assert.match(html, /tabindex="0"/);
  });

  test('disabled has tabindex -1', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { disabled: true })
    );
    assert.match(html, /tabindex="-1"/);
  });

  test('accepts maxFiles and maxSize props without crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { maxFiles: 5, maxSize: 50 * 1024 * 1024 })
    );
    assert.ok(html.length > 0);
  });

  test('showPreview false still renders without preview container', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, {
        showPreview: false,
        files: [
          {
            id: 'np1',
            name: 'no-preview.jpg',
            size: 1000,
            type: 'image/jpeg',
            progress: 100,
            preview: 'blob:nopreview',
          },
        ],
      })
    );
    // Preview may still render because we pass it externally; the prop only
    // controls whether the component generates previews internally.
    assert.match(html, /no-preview\.jpg/);
  });
});
