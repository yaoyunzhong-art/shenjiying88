'use client'

import { useMemo, useState, useCallback, useId } from 'react'

/* ---------- types ---------- */

export interface BranchSelectorNode {
  id: string
  label: string
  type: 'brand' | 'store' | 'region'
  children?: BranchSelectorNode[]
  disabled?: boolean
}

export interface BranchSelectorProps {
  /** 树形组织/门店结构 */
  nodes: BranchSelectorNode[]
  /** 当前选中节点 */
  value?: string | null
  /** 选中回调 */
  onChange?: (nodeId: string) => void
  /** 展开深度（0=全部折叠，-1=全部展开） */
  defaultExpandDepth?: number
  /** 空状态文案 */
  emptyLabel?: string
  /** 禁用 */
  disabled?: boolean
  /** 附加 className */
  className?: string
}

/* ---------- 辅助 ---------- */

function findNodeById(
  nodes: BranchSelectorNode[],
  id: string,
): BranchSelectorNode | null {
  for (const n of nodes) {
    if (n.id === id) return n
    if (n.children) {
      const found = findNodeById(n.children, id)
      if (found) return found
    }
  }
  return null
}

function collectLeafIds(nodes: BranchSelectorNode[]): string[] {
  const result: string[] = []
  for (const n of nodes) {
    if (n.children && n.children.length > 0) {
      result.push(...collectLeafIds(n.children))
    } else {
      result.push(n.id)
    }
  }
  return result
}

/* ---------- 组件 ---------- */

function BranchNode({
  node,
  depth,
  selectedId,
  expandedIds,
  onToggle,
  onSelect,
  defaultExpandDepth,
}: {
  node: BranchSelectorNode
  depth: number
  selectedId: string | null
  expandedIds: Set<string>
  onToggle: (id: string) => void
  onSelect: (id: string) => void
  defaultExpandDepth: number
}) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id

  // 自动展开到 defaultExpandDepth
  const [initialized] = useState(() => {
    if (defaultExpandDepth < 0 || depth < defaultExpandDepth) {
      onToggle(node.id)
    }
    return true
  })
  void initialized

  const typeIcon = useMemo(() => {
    switch (node.type) {
      case 'region':
        return '🏢'
      case 'brand':
        return '🏬'
      case 'store':
        return '🏪'
      default:
        return '📁'
    }
  }, [node.type])

  return (
    <div>
      <button
        type="button"
        className={`branch-node-row${isSelected ? ' branch-node-row--selected' : ''}${node.disabled ? ' branch-node-row--disabled' : ''}`}
        style={{ paddingLeft: `${12 + depth * 20}px` }}
        disabled={node.disabled}
        onClick={() => {
          if (!node.disabled) {
            if (hasChildren) onToggle(node.id)
            onSelect(node.id)
          }
        }}
        aria-selected={isSelected}
        aria-disabled={node.disabled}
      >
        {hasChildren && (
          <span className="branch-node-chevron" aria-hidden>
            {isExpanded ? '▾' : '▸'}
          </span>
        )}
        <span className="branch-node-icon" aria-hidden>
          {typeIcon}
        </span>
        <span className="branch-node-label">{node.label}</span>
      </button>

      {hasChildren && isExpanded && (
        <div className="branch-node-children">
          {node.children!.map((child) => (
            <BranchNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
              defaultExpandDepth={defaultExpandDepth}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function BranchSelector({
  nodes,
  value,
  onChange,
  defaultExpandDepth = 0,
  emptyLabel = '暂无数据',
  disabled = false,
  className = '',
}: BranchSelectorProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const instanceId = useId()

  const selectedNode = useMemo(
    () => (value ? findNodeById(nodes, value) : null),
    [nodes, value],
  )

  const handleToggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleSelect = useCallback(
    (id: string) => {
      if (!disabled && onChange) onChange(id)
    },
    [disabled, onChange],
  )

  if (nodes.length === 0) {
    return (
      <div className="branch-selector branch-selector--empty">{emptyLabel}</div>
    )
  }

  return (
    <div
      className={`branch-selector${className ? ` ${className}` : ''}`}
      role="tree"
      aria-label="组织架构选择器"
      aria-multiselectable="false"
      data-instance={instanceId}
    >
      {nodes.map((node) => (
        <BranchNode
          key={node.id}
          node={node}
          depth={0}
          selectedId={value ?? null}
          expandedIds={expandedIds}
          onToggle={handleToggle}
          onSelect={handleSelect}
          defaultExpandDepth={defaultExpandDepth}
        />
      ))}
    </div>
  )
}

BranchSelector.displayName = 'BranchSelector'

/* ---------- 工具导出 ---------- */

export { findNodeById, collectLeafIds }
