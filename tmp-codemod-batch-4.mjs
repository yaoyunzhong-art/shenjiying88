import fs from 'fs'
import path from 'path'

const files = [
  'apps/admin-web/app/member/activities/member-activities-client.tsx',
  'apps/admin-web/app/member/config/member-config-client.tsx',
  'apps/admin-web/app/member/member-client.tsx',
  'apps/admin-web/app/members/[id]/edit/member-edit-client.tsx',
  'apps/admin-web/app/members/[id]/member-detail-client.tsx',
  'apps/admin-web/app/members/[id]/receipts/[executionId]/member-operation-receipt-detail-client.tsx',
  'apps/admin-web/app/members/[id]/sources/[kind]/[sourceId]/member-operation-source-detail-client.tsx',
  'apps/admin-web/app/members/[id]/tasks/[taskId]/member-operation-task-detail-client.tsx',
  'apps/admin-web/app/members/cards/[id]/member-card-detail-client.tsx',
  'apps/admin-web/app/members/cards/member-cards-client.tsx',
  'apps/admin-web/app/members/create/create-member-client.tsx',
  'apps/admin-web/app/members/form/member-tier-form-client.tsx',
  'apps/admin-web/app/members/import/import-members-client.tsx',
  'apps/admin-web/app/members/levels/[id]/member-level-detail-client.tsx',
  'apps/admin-web/app/members/levels/member-levels-client.tsx',
  'apps/admin-web/app/members/members-client.tsx',
  'apps/admin-web/app/members/tiers/[id]/member-tier-detail-client.tsx',
  'apps/admin-web/app/members/tiers/member-tiers-client.tsx',
  'apps/admin-web/app/members/tiers/new/new-member-tier-client.tsx',
  'apps/admin-web/app/notifications/notifications-client.tsx'
]

let patchedCount = 0

for (const file of files) {
  const filePath = path.join(process.cwd(), file)
  if (!fs.existsSync(filePath)) continue
  
  let content = fs.readFileSync(filePath, 'utf8')
  
  if (content.includes('useSnapshotRefresh')) continue

  const relativeDepth = file.split('/').length - 4
  const importPrefix = relativeDepth > 0 ? '../'.repeat(relativeDepth) : './'
  const importPath = `${importPrefix}components/use-snapshot-refresh`
  
  content = content.replace(
    /('use client'|"use client"|'use client';|"use client";)\n/,
    `$1\nimport { useSnapshotRefresh } from '${importPath}'\n`
  )

  const usesRouterElsewhere = (content.match(/router\./g) || []).length > (content.match(/router\.refresh/g) || []).length
  const usesTransitionElsewhere = (content.match(/useTransition/g) || []).length > 1
  const hasHandleRefreshFunction = content.match(/function handleRefresh\(\)/) || content.match(/const handleRefresh = useCallback/)

  if (!usesRouterElsewhere) {
    content = content.replace(/import\s+\{\s*useRouter\s*\}\s+from\s+['"]next\/navigation['"];?\n/g, '')
    content = content.replace(/const\s+router\s*=\s*useRouter\(\);?\s*\n/g, '')
  }

  if (!usesTransitionElsewhere) {
    content = content.replace(/import\s+\{([^}]*?)useTransition([^}]*?)\}\s+from\s+['"]react['"];?\n/g, (match, p1, p2) => {
      const remaining = (p1 + p2).split(',').map(s => s.trim()).filter(Boolean).join(', ')
      if (!remaining) return ''
      return `import { ${remaining} } from 'react'\n`
    })
  }

  content = content.replace(/const\s+\[isRefreshing,\s*startRefresh\]\s*=\s*useTransition\(\);?\s*\n/g, 'const { isRefreshing, handleRefresh } = useSnapshotRefresh();\n')
  
  if (hasHandleRefreshFunction) {
    content = content.replace(/function\s+handleRefresh\(\)\s*\{\s*startRefresh\(\(\)\s*=>\s*router\.refresh\(\)\)\s*\}/g, '')
    content = content.replace(/const\s+handleRefresh\s*=\s*useCallback\(\(\)\s*=>\s*\{\s*startRefresh\(\(\)\s*=>\s*router\.refresh\(\)\)\s*\},?\s*\[router\]\);?/g, '')
  } else {
    content = content.replace(/startRefresh\(\(\)\s*=>\s*router\.refresh\(\)\)/g, 'handleRefresh()')
  }

  content = content.replace(/startRefresh\(\(\)\s*=>\s*router\.refresh\(\)\)/g, 'handleRefresh()')

  fs.writeFileSync(filePath, content)
  patchedCount++
  console.log(`Patched: ${file}`)
}

console.log(`\nTotal patched: ${patchedCount}`)
