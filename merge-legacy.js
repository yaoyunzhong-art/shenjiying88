const fs = require('fs');

const files = [
  'apps/admin-web/app/marketing/marketing-workbench',
  'apps/admin-web/app/marketing/[id]/performance/marketing-performance',
  'apps/admin-web/app/marketing/[id]/marketing-detail',
  'apps/admin-web/app/stores/%5Bid%5D/purchasing/purchasing',
  'apps/admin-web/app/stores/%5Bid%5D/platform/platform',
  'apps/admin-web/app/stores/%5Bid%5D/finance/finance',
  'apps/admin-web/app/stores/%5Bid%5D/logistics/logistics'
];

for (const base of files) {
  const legacyPath = `${base}-legacy.tsx`;
  const clientPath = `${base}-client.tsx`;
  
  if (!fs.existsSync(legacyPath)) {
    console.log(`Missing ${legacyPath}`);
    continue;
  }
  
  let legacyCode = fs.readFileSync(legacyPath, 'utf8');
  let clientCode = fs.readFileSync(clientPath, 'utf8');
  
  const snapshotTypeMatch = clientCode.match(/snapshot\s*:\s*([A-Za-z0-9_]+Snapshot)/);
  const snapshotType = snapshotTypeMatch ? snapshotTypeMatch[1] : 'any';
  
  const dataImportMatch = clientCode.match(/import type \{ [^}]+\} from '\.\/[^']+'/);
  const dataImport = dataImportMatch ? dataImportMatch[0] : '';
  
  const depth = base.split('/').length - 3;
  const upDirs = Array(depth).fill('..').join('/');
  let customSnapshotImports = `
import SnapshotRefreshCard from '${upDirs}/components/snapshot-refresh-card';
import { useSnapshotRefresh } from '${upDirs}/components/use-snapshot-refresh';
${dataImport}
`;

  const functionMatch = legacyCode.match(/export default function ([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{/);
  if (!functionMatch) {
    console.log(`Could not find default export in ${legacyPath}`);
    continue;
  }
  
  const funcName = functionMatch[1];
  const funcArgs = functionMatch[2];
  
  let newFuncSignature = `export default function ${funcName.replace('Legacy', 'Client')}({ snapshot }: { snapshot: ${snapshotType} }) {`;
  
  let idExtraction = '';
  if (funcArgs.includes('id')) {
    idExtraction = `\n  const id = snapshot.id;\n`;
  }
  
  const hookInjection = `\n  const { isRefreshing, handleRefresh } = useSnapshotRefresh();\n`;
  
  let newLegacyCode = legacyCode.replace(functionMatch[0], newFuncSignature + idExtraction + hookInjection);
  
  newLegacyCode = newLegacyCode.replace(/'use client';?/, `'use client';\n${customSnapshotImports}`);
  
  // Find the first `return (` or `return <` in the component body
  // We can just look for the first `return (` after the function definition
  const funcIndex = newLegacyCode.indexOf(newFuncSignature);
  const returnIndex = newLegacyCode.indexOf('return (', funcIndex);
  
  const cardJSX = `
      <SnapshotRefreshCard
        sourceLabel={snapshot.sourceLabel}
        refreshPath={snapshot.refreshPath}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        contextLabel="客户端快照上下文"
        loadingLabel="刷新中..."
        idleLabel="刷新快照"
      />
`;

  if (returnIndex !== -1) {
    // Replace `return (` with `return (\n    <div style={{ display: 'grid', gap: 16 }}>\n${cardJSX}`
    // And add `</div>` before the final `}`
    newLegacyCode = newLegacyCode.substring(0, returnIndex) + 
      `return (\n    <div style={{ display: 'grid', gap: 16 }}>\n${cardJSX}` + 
      newLegacyCode.substring(returnIndex + 'return ('.length);
      
    // Find the last `}` to close the div
    const lastBraceIndex = newLegacyCode.lastIndexOf('}');
    newLegacyCode = newLegacyCode.substring(0, lastBraceIndex) + `    </div>\n  )\n}` + newLegacyCode.substring(lastBraceIndex + 1);
  }

  // Also remove AdminPermissionGate imports from legacy since it might be unused or wrong
  // Wait, let's keep it simple, just write it to clientPath
  fs.writeFileSync(clientPath, newLegacyCode);
  fs.unlinkSync(legacyPath);
  console.log(`Migrated ${base}`);
}
