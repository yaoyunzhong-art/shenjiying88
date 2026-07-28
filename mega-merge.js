const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const legacyFiles = execSync('find apps/admin-web/app -name "*-legacy.tsx"').toString().trim().split('\n').filter(Boolean);

for (const legacyPath of legacyFiles) {
  const clientPath = legacyPath.replace('-legacy.tsx', '-client.tsx');
  const pagePath = path.join(path.dirname(legacyPath), 'page.tsx');
  
  if (!fs.existsSync(clientPath)) {
    console.log(`Skipping ${legacyPath}, no client file found.`);
    continue;
  }
  
  let legacyCode = fs.readFileSync(legacyPath, 'utf8');
  let clientCode = fs.readFileSync(clientPath, 'utf8');
  
  const snapshotTypeMatch = clientCode.match(/snapshot\s*:\s*([A-Za-z0-9_]+Snapshot)/);
  const snapshotType = snapshotTypeMatch ? snapshotTypeMatch[1] : 'any';
  
  const dataImportMatch = clientCode.match(/import type \{ [^}]+\} from '\.\/[^']+'/);
  const dataImport = dataImportMatch ? dataImportMatch[0] : '';
  
  const depth = legacyPath.split('/').length - 3;
  const upDirs = Array(depth).fill('..').join('/');
  let customSnapshotImports = `
import SnapshotRefreshCard from '${upDirs}/components/snapshot-refresh-card';
import { useSnapshotRefresh } from '${upDirs}/components/use-snapshot-refresh';
${dataImport}
`;

  // Remove AdminPermissionGate imports from legacy
  legacyCode = legacyCode.replace(/import\s+\{\s*AdminPermissionGate\s*\}\s+from\s+'[^']+';?\n?/g, '');
  legacyCode = legacyCode.replace(/import\s+AdminPermissionGate\s+from\s+'[^']+';?\n?/g, '');

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
  } else if (funcArgs.includes('ticket')) {
    idExtraction = `\n  const ticket = snapshot.ticket || snapshot.id;\n`;
  }
  
  const hookInjection = `\n  const { isRefreshing, handleRefresh } = useSnapshotRefresh();\n`;
  
  let newLegacyCode = legacyCode.replace(functionMatch[0], newFuncSignature + idExtraction + hookInjection);
  
  newLegacyCode = newLegacyCode.replace(/'use client';?/, `'use client';\n${customSnapshotImports}`);
  
  // Remove permissionGate object
  newLegacyCode = newLegacyCode.replace(/const permissionGate = \{[\s\S]*?\} as const;?\n?/g, '');
  
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
    const afterReturn = newLegacyCode.substring(returnIndex + 8, returnIndex + 200);
    const hasGate = afterReturn.includes('<AdminPermissionGate');
    
    if (hasGate) {
      const closeGateIndex = newLegacyCode.lastIndexOf('</AdminPermissionGate>');
      if (closeGateIndex !== -1) {
        const openGateStart = newLegacyCode.indexOf('<AdminPermissionGate', returnIndex);
        const openGateEnd = newLegacyCode.indexOf('>', openGateStart) + 1;
        
        newLegacyCode = newLegacyCode.substring(0, openGateStart) + 
          `<div style={{ display: 'grid', gap: 16 }}>\n${cardJSX}` + 
          newLegacyCode.substring(openGateEnd, closeGateIndex) + 
          `</div>` + 
          newLegacyCode.substring(closeGateIndex + '</AdminPermissionGate>'.length);
      }
    } else {
      newLegacyCode = newLegacyCode.substring(0, returnIndex) + 
        `return (\n    <div style={{ display: 'grid', gap: 16 }}>\n${cardJSX}` + 
        newLegacyCode.substring(returnIndex + 'return ('.length);
        
      const lastBraceIndex = newLegacyCode.lastIndexOf('}');
      newLegacyCode = newLegacyCode.substring(0, lastBraceIndex) + `    </div>\n  )\n}` + newLegacyCode.substring(lastBraceIndex + 1);
    }
  }

  fs.writeFileSync(clientPath, newLegacyCode);
  fs.unlinkSync(legacyPath);
  console.log(`Migrated ${legacyPath} -> ${clientPath}`);

  if (fs.existsSync(pagePath)) {
    let pageCode = fs.readFileSync(pagePath, 'utf8');
    const legacyExportRegex = new RegExp(`export \\* from '\\.\\/[^']+-legacy'\\n?`, 'g');
    if (legacyExportRegex.test(pageCode)) {
      pageCode = pageCode.replace(legacyExportRegex, '');
      fs.writeFileSync(pagePath, pageCode);
      console.log(`Cleaned up page.tsx for ${pagePath}`);
    }
  }
}
