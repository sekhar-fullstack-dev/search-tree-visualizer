import { useMemo } from 'react'
import { TreeNode, LayoutNode } from '../types/tree'

const V_GAP = 70  // vertical gap between levels
const NODE_R = 22 // node radius

function collectLayout(
  node: TreeNode | null,
  depth: number,
  left: number,
  right: number,
  result: LayoutNode[],
  parentX?: number,
  parentY?: number
) {
  if (!node) return

  const x = (left + right) / 2
  const y = depth * V_GAP + NODE_R + 10

  result.push({ value: node.value, x, y, parentX, parentY })

  const mid = (left + right) / 2
  collectLayout(node.left,  depth + 1, left, mid,   result, x, y)
  collectLayout(node.right, depth + 1, mid,  right, result, x, y)
}

export function useTreeLayout(
  root: TreeNode | null,
  width: number
): LayoutNode[] {
  return useMemo(() => {
    if (!root) return []
    const nodes: LayoutNode[] = []
    collectLayout(root, 0, 0, width, nodes)
    return nodes
  }, [root, width])
}
