import fs from 'node:fs'
import path from 'node:path'

const appRoot = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/apps/admin-web/app'
const componentAbs = path.join(appRoot, 'components', 'snapshot-refresh-card.tsx')

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, out)
      continue
    }

    if (/(-client|shell-client)\.tsx$/.test(entry.name)) {
      out.push(full)
    }
  }

  return out
}

function ensureImport(source, filePath) {
  if (source.includes('SnapshotRefreshCard')) {
    return source
  }

  const rel = path
    .relative(path.dirname(filePath), componentAbs)
    .replace(/\\/g, '/')
    .replace(/\.tsx$/, '')
  const importPath = rel.startsWith('.') ? rel : `./${rel}`

  return source.replace(
    /\n\nconst /,
    `\nimport SnapshotRefreshCard from '${importPath}'\n\nconst `,
  )
}

const files = walk(appRoot)
const targets = files.filter((file) => {
  const source = fs.readFileSync(file, 'utf8')
  return (
    source.includes('客户端快照上下文:') &&
    source.includes("{isRefreshing ? '刷新中...' : '刷新快照'}") &&
    source.includes('onClick={handleRefresh}') &&
    !source.includes('SnapshotRefreshCard')
  )
})

const pattern =
  /<div style=\{[\s\S]*?\}>\s*<div>\s*客户端快照上下文: \{snapshot\.sourceLabel\} · ([\s\S]*?) · 刷新路径: \{snapshot\.refreshPath\}\s*<\/div>\s*<button type="button" onClick=\{handleRefresh\}(?: style=\{[\s\S]*?\})?>\s*\{isRefreshing \? '刷新中\.\.\.' : '刷新快照'\}\s*<\/button>\s*<\/div>/gm

let changed = 0

for (const file of targets) {
  const original = fs.readFileSync(file, 'utf8')
  let next = ensureImport(original, file)

  next = next.replace(pattern, (_, extra) => {
    const trimmed = String(extra).trim()
    return `<SnapshotRefreshCard
        sourceLabel={snapshot.sourceLabel}
        refreshPath={snapshot.refreshPath}
        extra={<>
          ${trimmed}
        </>}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        contextLabel="客户端快照上下文"
        loadingLabel="刷新中..."
        idleLabel="刷新快照"
      />`
  })

  if (next !== original) {
    fs.writeFileSync(file, next)
    changed += 1
    console.log(`patched ${path.relative(appRoot, file)}`)
  }
}

console.log(`total patched: ${changed}`)
