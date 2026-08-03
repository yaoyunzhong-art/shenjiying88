#!/usr/bin/env node
/**
 * P-38 JSX 包裹脚本 v2 — 正确的 return-wrapper 模式
 * 在 return ( ... ) 内部包裹 <AdminPermissionGate>...</AdminPermissionGate>
 *
 * Usage: node scripts/p38-wrap-jsx.mjs apps/admin-web
 */

import fs from 'node:fs';
import path from 'node:path';

function findPageFiles(dir) {
  const results = [];
  function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const fp = path.join(d, e.name);
      if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules') {
        walk(fp);
      } else if (e.name === 'page.tsx') {
        results.push(fp);
      }
    }
  }
  walk(dir);
  return results;
}

function wrapJsx(pageFile) {
  let content = fs.readFileSync(pageFile, 'utf-8');

  if (content.includes('<AdminPermissionGate')) {
    return { status: 'skip', file: pageFile, reason: 'already wrapped' };
  }
  if (!content.includes('AdminPermissionGate') || !content.includes('permissionGate')) {
    return { status: 'skip', file: pageFile, reason: 'no import or no config' };
  }

  const lines = content.split('\n');

  // Find export default function
  const exportIdx = lines.findIndex(l => /^export default (async )?function/.test(l));
  if (exportIdx < 0) return { status: 'error', file: pageFile, reason: 'no export default function' };

  // Find the main `return (` at function scope
  let mainReturnIdx = -1;
  let minIndent = Infinity;
  for (let i = exportIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^(\s+)(return\s*\()/);
    if (m) {
      const indent = m[1].length;
      if (indent < minIndent) {
        minIndent = indent;
        mainReturnIdx = i;
      }
    }
  }

  if (mainReturnIdx < 0) return { status: 'error', file: pageFile, reason: 'no return ( found' };

  // Find the matching closing ) at the same indentation level
  const returnIndent = lines[mainReturnIdx].match(/^(\s*)/)[1];
  let closeIdx = -1;
  let parenDepth = 0;
  for (let i = mainReturnIdx; i < lines.length; i++) {
    const line = lines[i];
    // Count parens
    for (let j = 0; j < line.length; j++) {
      if (line[j] === '(') parenDepth++;
      if (line[j] === ')') parenDepth--;
    }
    if (parenDepth === 0 && i > mainReturnIdx) {
      closeIdx = i;
      break;
    }
  }

  if (closeIdx < 0) return { status: 'error', file: pageFile, reason: 'cannot find return close )' };

  // Get the content between return ( and closing )
  const innerLines = lines.slice(mainReturnIdx + 1, closeIdx);
  const innerIndent = innerLines.length > 0 
    ? (innerLines.find(l => l.trim().length > 0)?.match(/^(\s*)/)?.[1] || '  ') 
    : '  ';

  // Build the wrapped version
  const gateIndent = innerIndent;
  const contentIndent = innerIndent + '  ';
  
  // Indent all inner content by 2 more spaces
  const wrappedInner = innerLines.map(l => {
    if (l.trim() === '') return l;
    return contentIndent + l.trimStart();
  }).join('\n');

  const wrappedBlock = 
    `${returnIndent}return (\n` +
    `${gateIndent}<AdminPermissionGate\n` +
    `${gateIndent}  requiredPermission={permissionGate.requiredPermission}\n` +
    `${gateIndent}  title={permissionGate.title}\n` +
    `${gateIndent}  description={permissionGate.description}\n` +
    `${gateIndent}>\n` +
    `${wrappedInner}\n` +
    `${gateIndent}</AdminPermissionGate>\n` +
    `${returnIndent})`;

  // Replace from mainReturnIdx to closeIdx
  lines.splice(mainReturnIdx, closeIdx - mainReturnIdx + 1, wrappedBlock);

  fs.writeFileSync(pageFile, lines.join('\n'), 'utf-8');
  return { status: 'wrapped', file: pageFile };
}

// Main
const targetDir = path.resolve(process.argv[2] || 'apps/admin-web');
const appDir = path.join(targetDir, 'app');
const pages = findPageFiles(appDir);

console.log(`Found ${pages.length} page.tsx files`);

let wrapped = 0, skipped = 0, errors = 0;
for (const p of pages) {
  const result = wrapJsx(p);
  if (result.status === 'wrapped') {
    wrapped++;
    console.log(`  ✓ ${path.relative(targetDir, p)}`);
  } else if (result.status === 'skip') {
    skipped++;
  } else {
    errors++;
    console.error(`  ✗ ${path.relative(targetDir, p)}: ${result.reason}`);
  }
}

console.log(`\nDone: ${wrapped} wrapped, ${skipped} skipped, ${errors} errors`);
