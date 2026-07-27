import fs from 'fs'
import path from 'path'

const filesFile = '/tmp/remaining-refresh-files.txt'
const files = fs.readFileSync(filesFile, 'utf8').split('\n').filter(Boolean)

let patchedCount = 0

for (const file of files) {
  const filePath = path.join(process.cwd(), file)
  if (!fs.existsSync(filePath)) continue
  
  let content = fs.readFileSync(filePath, 'utf8')
  
  if (content.includes('useSnapshotRefresh')) continue

  const relativeDepth = file.split('/').length - 4
  const importPrefix = relativeDepth > 0 ? '../'.repeat(relativeDepth) : './'
  const importPath = `${importPrefix}components/use-snapshot-refresh`
  
  // Add import
  content = content.replace(
    /('use client'|"use client"|'use client';|"use client";)\n/,
    `$1\nimport { useSnapshotRefresh } from '${importPath}'\n`
  )

  // Determine if useRouter or useTransition are used for other things
  const usesRouterElsewhere = (content.match(/router\./g) || []).length > (content.match(/router\.refresh/g) || []).length
  const usesTransitionElsewhere = (content.match(/useTransition/g) || []).length > 1

  // Clean up unused imports
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

  // Replace hook initialization
  content = content.replace(/const\s+\[isRefreshing,\s*startRefresh\]\s*=\s*useTransition\(\);?\s*\n/g, 'const { isRefreshing, handleRefresh } = useSnapshotRefresh();\n')
  
  // Replace handleRefresh if defined manually
  const hasStandardHandleRefresh = content.match(/function\s+handleRefresh\(\)\s*\{\s*startRefresh\(\(\)\s*=>\s*router\.refresh\(\)\)\s*\}/) || 
                                   content.match(/const\s+handleRefresh\s*=\s*useCallback\(\(\)\s*=>\s*\{\s*startRefresh\(\(\)\s*=>\s*router\.refresh\(\)\)\s*\},?\s*\[router\]\);?/)
                                   
  if (hasStandardHandleRefresh) {
    content = content.replace(/function\s+handleRefresh\(\)\s*\{\s*startRefresh\(\(\)\s*=>\s*router\.refresh\(\)\)\s*\}/g, '')
    content = content.replace(/const\s+handleRefresh\s*=\s*useCallback\(\(\)\s*=>\s*\{\s*startRefresh\(\(\)\s*=>\s*router\.refresh\(\)\)\s*\},?\s*\[router\]\);?/g, '')
  } else {
    // Also remove the specific callback patterns that include startRefresh
    content = content.replace(/const\s+handleRefresh\s*=\s*useCallback\(\(\)\s*=>\s*\{\s*startRefresh\(\(\)\s*=>\s*\{\s*router\.refresh\(\);?\s*\}\);\s*\},?\s*\[router,\s*startRefresh\]\);?/g, '')
    content = content.replace(/const\s+handleRefresh\s*=\s*useCallback\(\(\)\s*=>\s*\{\s*startRefresh\(\(\)\s*=>\s*router\.refresh\(\)\);?\s*\},?\s*\[router,\s*startRefresh\]\);?/g, '')
    // Also remove if router is the only dep
    content = content.replace(/const\s+handleRefresh\s*=\s*useCallback\(\(\)\s*=>\s*\{\s*startRefresh\(\(\)\s*=>\s*\{\s*router\.refresh\(\);?\s*\}\);\s*\},?\s*\[router\]\);?/g, '')
  }

  // Replace inline startRefresh usage
  content = content.replace(/startRefresh\(\(\)\s*=>\s*router\.refresh\(\)\)/g, 'handleRefresh()')
  content = content.replace(/startRefresh\(\(\)\s*=>\s*\{\s*router\.refresh\(\);\s*\}\);?/g, 'handleRefresh();')

  fs.writeFileSync(filePath, content)
  patchedCount++
  // console.log(`Patched: ${file}`)
}

console.log(`\nTotal patched: ${patchedCount}`)
