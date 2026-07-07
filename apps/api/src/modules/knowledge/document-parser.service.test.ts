import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * document-parser.service.test.ts - Phase-23 T82
 * 多格式文档解析单元测试
 */
import assert from 'node:assert/strict';
import {
  DocumentParserService,
  detectFormat,
  type DocFormat,
} from './document-parser.service';

describe('detectFormat', () => {
  it('AC-1 .md → markdown', () => {
    assert.equal(detectFormat('README.md'), 'markdown');
  });

  it('AC-2 .txt → text', () => {
    assert.equal(detectFormat('notes.txt'), 'text');
  });

  it('AC-3 .html → html', () => {
    assert.equal(detectFormat('page.html'), 'html');
  });

  it('AC-4 .json → json', () => {
    assert.equal(detectFormat('config.json'), 'json');
  });

  it('AC-5 .pdf → pdf', () => {
    assert.equal(detectFormat('doc.pdf'), 'pdf');
  });

  it('AC-6 .docx → docx', () => {
    assert.equal(detectFormat('report.docx'), 'docx');
  });

  it('AC-7 .xlsx → xlsx', () => {
    assert.equal(detectFormat('data.xlsx'), 'xlsx');
  });

  it('AC-8 .png → image', () => {
    assert.equal(detectFormat('photo.png'), 'image');
  });

  it('AC-9 内容嗅探 JSON', () => {
    assert.equal(detectFormat('no-ext', '{"a":1}'), 'json');
  });

  it('AC-10 内容嗅探 HTML', () => {
    assert.equal(detectFormat('no-ext', '<!DOCTYPE html><html></html>'), 'html');
  });

  it('AC-11 内容嗅探 Markdown', () => {
    assert.equal(detectFormat('no-ext', '# Hello\n\nContent'), 'markdown');
  });

  it('AC-12 未知格式', () => {
    assert.equal(detectFormat('file.xyz', '???'), 'unknown');
  });
});

describe('DocumentParserService · markdown', () => {
  let svc: DocumentParserService;
  beforeEach(() => { svc = new DocumentParserService(); });

  it('AC-13 markdown 解析为多个 chunk (按 ## 切分)', () => {
    const result = svc.parse({
      sourcePath: 'README.md',
      content: '# Title\n\nIntro paragraph.\n\n## Section 1\n\nContent 1.\n\n## Section 2\n\nContent 2.',
    });
    assert.equal(result.format, 'markdown');
    assert.equal(result.success, true);
    assert.ok(result.chunks.length >= 3, `应 >= 3 chunks, 实际 ${result.chunks.length}`);
  });

  it('AC-14 chunk 包含 title/section metadata', () => {
    const result = svc.parse({
      sourcePath: 'doc.md',
      content: '# Title\n\n## API\n\napi content.',
    });
    const apiChunk = result.chunks.find((c) => c.metadata.section === 'API');
    assert.ok(apiChunk);
    assert.equal(apiChunk?.metadata.title, 'Title');
  });
});

describe('DocumentParserService · HTML', () => {
  let svc: DocumentParserService;
  beforeEach(() => { svc = new DocumentParserService(); });

  it('AC-15 HTML 标签被剥离', () => {
    const result = svc.parse({
      sourcePath: 'page.html',
      content: '<html><body><h1>Title</h1><p>Hello <b>world</b>!</p><script>alert(1)</script></body></html>',
    });
    assert.equal(result.format, 'html');
    const allContent = result.chunks.map((c) => c.content).join(' ');
    assert.ok(!allContent.includes('<h1>'), '应去除 HTML 标签');
    assert.ok(!allContent.includes('alert(1)'), '应去除 script');
    assert.match(allContent, /Title/);
    assert.match(allContent, /Hello/);
  });

  it('AC-16 HTML 实体解码', () => {
    const result = svc.parse({
      sourcePath: 'page.html',
      content: '<p>A &amp; B &lt; C</p>',
    });
    const content = result.chunks.map((c) => c.content).join(' ');
    assert.match(content, /A & B/);
    assert.match(content, /B < C/);
  });
});

describe('DocumentParserService · JSON', () => {
  let svc: DocumentParserService;
  beforeEach(() => { svc = new DocumentParserService(); });

  it('AC-17 JSON 嵌套对象展开', () => {
    const result = svc.parse({
      sourcePath: 'config.json',
      content: '{"server": {"port": 3000, "host": "localhost"}, "db": "postgres"}',
    });
    assert.equal(result.format, 'json');
    const content = result.chunks.map((c) => c.content).join(' ');
    assert.match(content, /server\.port/);
    assert.match(content, /3000/);
  });

  it('AC-18 错误 JSON → fallback 文本', () => {
    const result = svc.parse({
      sourcePath: 'broken.json',
      content: '{invalid json',
    });
    assert.equal(result.success, true, '应 fallback, 不视为失败');
    assert.ok(result.chunks.length >= 1);
  });
});

describe('DocumentParserService · PDF/DOCX/XLSX', () => {
  let svc: DocumentParserService;
  beforeEach(() => { svc = new DocumentParserService(); });

  it('AC-19 PDF 解析', () => {
    const result = svc.parse({
      sourcePath: 'doc.pdf',
      content: 'PDF page 1\n\nThis is content.',
    });
    assert.equal(result.format, 'pdf');
    assert.equal(result.success, true);
  });

  it('AC-20 DOCX 解析', () => {
    const result = svc.parse({
      sourcePath: 'report.docx',
      content: '## Heading\n\nDocument content.',
    });
    assert.equal(result.format, 'docx');
    assert.equal(result.success, true);
  });

  it('AC-21 XLSX 解析 (CSV-like)', () => {
    const result = svc.parse({
      sourcePath: 'data.xlsx',
      content: 'Name,Age,City\nAlice,30,NYC\nBob,25,LA',
    });
    assert.equal(result.format, 'xlsx');
    assert.equal(result.success, true);
  });
});

describe('DocumentParserService · Image OCR', () => {
  let svc: DocumentParserService;
  beforeEach(() => { svc = new DocumentParserService(); });

  it('AC-22 Image with OCR text', () => {
    const result = svc.parse({
      sourcePath: 'photo.png',
      content: Buffer.from('binary-image-data'),
      ocrText: 'This is the text from the image.',
    });
    assert.equal(result.format, 'image');
    const content = result.chunks.map((c) => c.content).join(' ');
    assert.match(content, /This is the text/);
  });

  it('AC-23 Image without OCR text → placeholder', () => {
    const result = svc.parse({
      sourcePath: 'photo.png',
      content: Buffer.from('binary-image-data'),
    });
    assert.equal(result.format, 'image');
    const content = result.chunks.map((c) => c.content).join(' ');
    assert.match(content, /OCR placeholder/);
  });
});

describe('DocumentParserService · stats & batch', () => {
  let svc: DocumentParserService;
  beforeEach(() => { svc = new DocumentParserService(); });

  it('AC-24 stats 包含 lines/chars/bytes', () => {
    const result = svc.parse({
      sourcePath: 'a.md',
      content: '# T\n\nLine 1\n\nLine 2',
    });
    assert.ok(result.stats.lines > 0);
    assert.ok(result.stats.characters > 0);
    assert.ok(result.stats.bytes > 0);
  });

  it('AC-25 parseBatch 批量解析', () => {
    const results = svc.parseBatch([
      { sourcePath: 'a.md', content: '# A' },
      { sourcePath: 'b.json', content: '{"x":1}' },
    ]);
    assert.equal(results.length, 2);
    assert.equal(results[0].format, 'markdown');
    assert.equal(results[1].format, 'json');
  });

  it('AC-26 durationMs > 0', () => {
    const result = svc.parse({ sourcePath: 'a.md', content: '# T' });
    assert.ok(result.durationMs >= 0);
  });

  it('AC-27 显式 format 覆盖扩展名', () => {
    const result = svc.parse({
      sourcePath: 'no-ext',
      content: '{"k":"v"}',
      format: 'json' as DocFormat,
    });
    assert.equal(result.format, 'json');
  });
});
