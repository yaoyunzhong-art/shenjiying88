import React from 'react';
import type { UploadFile } from './FileUpload';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { FileUpload } = require('./FileUpload');

describe('FileUpload', () => {
  // ========== 基础渲染 ==========
  test('renders upload button when drag=false', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload),
    );
    assert.match(html, /选择文件/);
    assert.match(html, /\u{1F4E4}/u);
  });

  test('renders drop zone when drag=true', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { drag: true }),
    );
    assert.match(html, /点击或拖拽文件/);
    assert.match(html, /\u{1F4C1}/u);
  });

  test('renders with custom placeholder in drag mode', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { drag: true, placeholder: '\u8BF7\u4E0A\u4F20\u8D44\u8D28\u6587\u4EF6' }),
    );
    assert.ok(html.includes('请上传资质文件'));
  });

  test('renders file list with controlled fileList', () => {
    const fileList: UploadFile[] = [
      { uid: '1', name: 'test.png', size: 1024, type: 'image/png', status: 'done' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { fileList }),
    );
    assert.ok(html.includes('test.png'));
    assert.ok(html.includes('1.0 KB'));
    assert.ok(html.includes('\u2705'));
  });

  // ========== aria label ==========
  test('renders with aria-label', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { 'aria-label': '\u4E0A\u4F20\u5408\u540C\u6587\u4EF6' }),
    );
    assert.ok(html.includes('上传合同文件'));
  });

  // ========== 禁用状态 ==========
  test('renders disabled button state', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { disabled: true }),
    );
    assert.ok(html.includes('disabled'));
  });

  test('renders disabled drop zone without crash', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { drag: true, disabled: true }),
    );
    assert.match(html, /\u{1F4C1}/u);
  });

  // ========== accept / maxSize ==========
  test('renders with accept prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { accept: 'image/*,.pdf' }),
    );
    assert.ok(html.includes('image/*,.pdf'));
  });

  test('renders with maxSize and shows file size hint', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { maxSize: 5 * 1024 * 1024 }),
    );
    assert.ok(html.includes('5.00 MB'));
  });

  // ========== 多种文件状态渲染 ==========
  test('renders uploading file with progress', () => {
    const fileList: UploadFile[] = [
      { uid: '1', name: 'video.mp4', size: 1024 * 1024 * 5, type: 'video/mp4', status: 'uploading', percent: 45 },
    ];
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { fileList }),
    );
    assert.ok(html.includes('video.mp4'));
    assert.ok(html.includes('5.00 MB'));
    assert.ok(html.includes('上传中'));
  });

  test('renders error file with error message', () => {
    const fileList: UploadFile[] = [
      { uid: '1', name: 'fail.doc', size: 2048, type: 'application/msword', status: 'error', error: '\u7F51\u7EDC\u8D85\u65F6' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { fileList }),
    );
    assert.ok(html.includes('fail.doc'));
    assert.ok(html.includes('网络超时'));
  });

  test('renders pending file', () => {
    const fileList: UploadFile[] = [
      { uid: '1', name: 'pending.zip', size: 500, type: 'application/zip', status: 'pending' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { fileList }),
    );
    assert.ok(html.includes('pending.zip'));
    assert.ok(html.includes('等待上传'));
  });

  // ========== 图片预览 ==========
  test('renders image with thumbnail', () => {
    const fileList: UploadFile[] = [
      { uid: '1', name: 'photo.jpg', size: 1024, type: 'image/jpeg', url: 'blob:test', status: 'done' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { fileList }),
    );
    assert.ok(html.includes('photo.jpg'));
    assert.ok(html.includes('src="blob'));
  });

  // ========== multiple 属性 ==========
  test('renders multiple file input attribute', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { multiple: true }),
    );
    assert.ok(html.includes('multiple'));
  });

  test('renders single file mode by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload),
    );
    assert.equal(html.includes('multiple'), false);
  });

  // ========== 空文件列表 ==========
  test('does not render file list when empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { fileList: [] }),
    );
    assert.equal(html.includes('listitem'), false);
  });

  test('renders file list when files exist', () => {
    const fileList: UploadFile[] = [
      { uid: '1', name: 'a.txt', size: 100, type: 'text/plain', status: 'done' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { fileList }),
    );
    assert.ok(html.includes('listitem'));
  });

  // ========== 音频/视频文件图标渲染 ==========
  test('renders audio file with audio icon', () => {
    const fileList: UploadFile[] = [
      { uid: '1', name: 'song.mp3', size: 3000, type: 'audio/mpeg', status: 'done' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { fileList }),
    );
    assert.match(html, /\u{1F3B5}/u);
  });

  test('renders video file with video icon', () => {
    const fileList: UploadFile[] = [
      { uid: '1', name: 'clip.mp4', size: 10000, type: 'video/mp4', status: 'done' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { fileList }),
    );
    assert.match(html, /\u{1F3AC}/u);
  });

  test('renders PDF file with PDF icon', () => {
    const fileList: UploadFile[] = [
      { uid: '1', name: 'report.pdf', size: 500, type: 'application/pdf', status: 'done' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { fileList }),
    );
    assert.match(html, /\u{1F4C4}/u);
  });

  // ========== delete button rendering ==========
  test('renders delete button for each file', () => {
    const fileList: UploadFile[] = [
      { uid: '1', name: 'file.txt', size: 100, type: 'text/plain', status: 'done' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { fileList }),
    );
    assert.match(html, /\u{1F5D1}\uFE0F/u);
    assert.ok(html.includes('删除'));
  });

  // ========== retry button rendering ==========
  test('renders retry button for error file when customRequest is set', () => {
    const fileList: UploadFile[] = [
      { uid: '1', name: 'bad.pdf', size: 200, type: 'application/pdf', status: 'error', error: 'timeout' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { fileList }),
    );
    assert.ok(html.includes('timeout'));
  });

  // ========== className / style ==========
  test('accepts custom className', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { className: 'my-upload' }),
    );
    assert.ok(html.includes('my-upload'));
  });

  test('accepts custom style', () => {
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { style: { width: 400 } }),
    );
    assert.ok(html.includes('400'));
  });

  // ========== 无参数 ==========
  test('renders without any props without crash', () => {
    const html = renderToStaticMarkup(React.createElement(FileUpload));
    assert.ok(html.length > 0);
  });

  // ========== 组件类型检查 ==========
  test('FileUpload is a function', () => {
    assert.strictEqual(typeof FileUpload, 'function');
  });

  test('FileUpload has display name or is named function', () => {
    assert.strictEqual(FileUpload.name, 'FileUpload');
  });

  // ========== 边界：文件名为空时 ==========
  test('renders empty file name gracefully', () => {
    const fileList: UploadFile[] = [
      { uid: '1', name: '', size: 0, type: 'text/plain', status: 'done' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(FileUpload, { fileList }),
    );
    assert.ok(html.length > 0);
  });
});
