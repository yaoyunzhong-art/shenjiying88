import fs from 'fs'
import path from 'path'

const files = [
  'apps/admin-web/app/admin/dashboard/dashboard-client.tsx',
  'apps/admin-web/app/admin/settings/admin-settings-client.tsx',
  'apps/admin-web/app/admin/tenants/tenants-client.tsx',
  'apps/admin-web/app/agents/studio/studio-client.tsx',
  'apps/admin-web/app/ai-cs/ai-cs-client.tsx',
  'apps/admin-web/app/ai-scenario-simulator/ai-scenario-simulator-client.tsx',
  'apps/admin-web/app/alliances/alliances-client.tsx',
  'apps/admin-web/app/analytics-v2/analytics-v2-client.tsx',
  'apps/admin-web/app/announcements/[id]/announcement-detail-client.tsx',
  'apps/admin-web/app/announcements/announcements-client.tsx',
  'apps/admin-web/app/anomaly-frequency/anomaly-frequency-client.tsx',
  'apps/admin-web/app/audit-logs/audit-logs-client.tsx',
  'apps/admin-web/app/brand-operations/brand-operations-client.tsx',
  'apps/admin-web/app/campaign-rules/[id]/campaign-rule-detail-client.tsx',
  'apps/admin-web/app/campaign-rules/campaign-rules-client.tsx',
  'apps/admin-web/app/campaigns/campaigns-client.tsx',
  'apps/admin-web/app/categories/[id]/category-detail-client.tsx',
  'apps/admin-web/app/categories/categories-list-client.tsx',
  'apps/admin-web/app/categories/new/new-category-client.tsx',
  'apps/admin-web/app/competitor-track/competitor-track-client.tsx'
]

let patchedCount = 0

for (const file of files) {
  const filePath = path.join(process.cwd(), file)
  if (!fs.existsSync(filePath)) continue
  
  let content = fs.readFileSync(filePath, 'utf8')
  
  // Skip if already has useSnapshotRefresh
  if (content.includes('useSnapshotRefresh')) continue

  // 1. Add import
  const relativeDepth = file.split('/').length - 4
  const importPrefix = relativeDepth > 0 ? '../'.repeat(relativeDepth) : './'
  const importPath = `${importPrefix}components/use-snapshot-refresh`
  
  // Insert import after 'use client'
  content = content.replace(
    /('use client'|"use client"|'use client';|"use client";)\n/,
    `$1\nimport { useSnapshotRefresh } from '${importPath}'\n`
  )

  // 2. Remove useRouter import
  content = content.replace(/import\s+\{\s*useRouter\s*\}\s+from\s+['"]next\/navigation['"];?\n/g, '')

  // 3. Remove useTransition from react import
  content = content.replace(/import\s+\{([^}]*?)useTransition([^}]*?)\}\s+from\s+['"]react['"];?\n/g, (match, p1, p2) => {
    const remaining = (p1 + p2).split(',').map(s => s.trim()).filter(Boolean).join(', ')
    if (!remaining) return ''
    return `import { ${remaining} } from 'react'\n`
  })

  // 4. Replace bindings
  // First, find the router and useTransition lines
  content = content.replace(/const\s+router\s*=\s*useRouter\(\)\s*\n/g, '')
  content = content.replace(/const\s+\[isRefreshing,\s*startRefresh\]\s*=\s*useTransition\(\)\s*\n/g, 'const { isRefreshing, handleRefresh } = useSnapshotRefresh()\n')
  
  // 5. Replace handleRefresh function if it exists
  content = content.replace(/function\s+handleRefresh\(\)\s*\{\s*startRefresh\(\(\)\s*=>\s*router\.refresh\(\)\)\s*\}/g, '')
  content = content.replace(/const\s+handleRefresh\s*=\s*useCallback\(\(\)\s*=>\s*\{\s*startRefresh\(\(\)\s*=>\s*router\.refresh\(\)\)\s*\},?\s*\[router\]\)/g, '')
  
  // 6. If handleRefresh wasn't defined but startRefresh was used directly
  content = content.replace(/startRefresh\(\(\)\s*=>\s*router\.refresh\(\)\)/g, 'handleRefresh()')

  fs.writeFileSync(filePath, content)
  patchedCount++
  console.log(`Patched: ${file}`)
}

console.log(`\nTotal patched: ${patchedCount}`)
