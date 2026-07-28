const fs = require('fs');
const path = require('path');

const targets = [
  // Group A: Standard sourceEvidence pages - client takes snapshot directly
  { file: 'apps/admin-web/app/reports/page.tsx', type: 'sourceEvidence', clientProp: 'snapshot' },
  { file: 'apps/admin-web/app/reports/[id]/page.tsx', type: 'sourceEvidence', clientProp: 'snapshot' },
  { file: 'apps/admin-web/app/foundation/modules/[module]/page.tsx', type: 'sourceEvidence', clientProp: 'snapshot' },
  { file: 'apps/admin-web/app/configuration/operations/[operation]/page.tsx', type: 'sourceEvidence', clientProp: 'snapshot.detail' },
  // Group B: SourceEvidence pages - client takes non-snapshot props
  { file: 'apps/admin-web/app/foundation/page.tsx', type: 'sourceEvidence', clientProp: 'custom' },
  { file: 'apps/admin-web/app/configuration/page.tsx', type: 'sourceEvidence', clientProp: 'custom' },
  // Group C: AdminPermissionGate wrapping PageShell, no sourceEvidence
  { file: 'apps/admin-web/app/configuration/three-level/page.tsx', type: 'pageShell' },
  { file: 'apps/admin-web/app/configuration/secrets/[name]/page.tsx', type: 'pageShell' },
  { file: 'apps/admin-web/app/configuration/certificates/[name]/page.tsx', type: 'pageShell' },
  { file: 'apps/admin-web/app/configuration/flags/[key]/page.tsx', type: 'pageShell' },
  { file: 'apps/admin-web/app/configuration/entries/[id]/page.tsx', type: 'pageShell' },
];

function cleanSourceImports(content) {
  // Remove AdminPermissionGate import (single line)
  content = content.replace(/^import \{ AdminPermissionGate \} from [^;]+;\n?/gm, '');
  content = content.replace(/^import \{ AdminPermissionGate \} from [^;]+;?/gm, '');
  return content;
}

function cleanPermissionGateConst(content) {
  // Remove permissionGate const block (multi-line)
  content = content.replace(/\n?const permissionGate\s*=\s*\{[\s\S]*?\}\s*as\s*const\s*;?\n?/g, '\n');
  return content;
}

function cleanSourceEvidence(content) {
  // Remove sourceEvidence const block (multi-line)
  content = content.replace(/\n?\s*const sourceEvidence\s*=\s*\{[\s\S]*?\}\s*as\s*const\s*;?\n?/g, '\n');
  return content;
}

function removeAdminPermissionGateTags(content) {
  // Remove opening <AdminPermissionGate ...> (multi-line support, non-greedy to first >)
  content = content.replace(/<AdminPermissionGate[\s\S]*?>/g, '');
  // Remove closing </AdminPermissionGate>
  content = content.replace(/<\/AdminPermissionGate>/g, '');
  return content;
}

function cleanUnusedStyleConsts(content) {
  // Remove shellStyle / evidenceStyle consts that become unused after sourceEvidence removal
  content = content.replace(/\n*const shellStyle\s*=\s*\{[\s\S]*?\n\};?/g, '');
  content = content.replace(/\n*const evidenceStyle\s*=\s*\{[\s\S]*?\n\};?/g, '');
  return content;
}

function cleanEmptyLines(content) {
  // Collapse 3+ consecutive newlines to 2
  content = content.replace(/\n{3,}/g, '\n\n');
  // Remove trailing whitespace on lines
  content = content.replace(/[ \t]+\n/g, '\n');
  return content;
}

function removeUnusedImports(content, unused) {
  for (const imp of unused) {
    // Remove the specific named import from a comma-separated list
    content = content.replace(new RegExp(`,\\s*${imp}`, 'g'), '');
    content = content.replace(new RegExp(`${imp},\\s*`, 'g'), '');
    // Handle single-line imports like `import { foo, bar } from '...'` becoming empty `import {} from '...'`
    content = content.replace(/import\s*\{\s*\}\s*from\s*[^;]+;\n?/g, '');
    // Handle situation where it was the only named import: `import { foo } from '...'` -> remove entire line
    // This is handled by the empty braces rule above
  }
  return content;
}

for (const target of targets) {
  const fullPath = path.join(process.cwd(), target.file);
  if (!fs.existsSync(fullPath)) {
    console.log(`SKIP (not found): ${target.file}`);
    continue;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  if (target.type === 'sourceEvidence' || target.type === 'pageShell') {
    content = cleanSourceImports(content);
    content = cleanPermissionGateConst(content);
    content = removeAdminPermissionGateTags(content);
  }

  if (target.type === 'sourceEvidence') {
    content = cleanSourceEvidence(content);
    content = cleanUnusedStyleConsts(content);
    // Remove unused imports that were only used in sourceEvidence
    content = removeUnusedImports(content, [
      'summarizeForwardedHeaders',
      'summarizeRequestScope',
      'pickForwardedRequestHeaders',
      'headers',
    ]);
    // For foundation/page.tsx, remove requestHeaders variable if now unused
    if (target.file.includes('foundation/page')) {
      // Check if requestHeaders is still used anywhere
      const afterRemoval = content.replace(/const requestHeaders = pickForwardedRequestHeaders\(await headers\(\)\)\s*\n?/g, '');
      if (!afterRemoval.includes('requestHeaders')) {
        content = afterRemoval;
        // Also adjust the loader call which passes { headers: requestHeaders }
        content = content.replace(/,\s*\{\s*headers:\s*requestHeaders,\s*cache:\s*'no-store'\s*\}/g, '');
        content = content.replace(/\{\s*headers:\s*requestHeaders,\s*cache:\s*'no-store'\s*\}\s*\)/g, ')');
      }
    }
  }

  if (target.type === 'pageShell') {
    // For PageShell pages, also remove the leading whitespace indentation difference
    // that appears after removing the outer AdminPermissionGate wrapper
  }

  content = cleanEmptyLines(content);
  // Ensure file ends with exactly one newline
  content = content.trimEnd() + '\n';

  fs.writeFileSync(fullPath, content);
  console.log(`DONE: ${target.file}`);
}

console.log('\nAll pages processed.');
