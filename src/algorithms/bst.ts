import { TreeNode, AnimationStep } from '../types/tree'

// ── Helpers ──────────────────────────────────────────────────────────────────

export function cloneTree(node: TreeNode | null): TreeNode | null {
  if (!node) return null
  return {
    value: node.value,
    height: node.height,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  }
}

export function treeHeight(node: TreeNode | null): number {
  if (!node) return 0
  return node.height
}

export function nodeCount(node: TreeNode | null): number {
  if (!node) return 0
  return 1 + nodeCount(node.left) + nodeCount(node.right)
}

function updateHeight(node: TreeNode): void {
  node.height = 1 + Math.max(treeHeight(node.left), treeHeight(node.right))
}

// ── Mutation helpers (always called on cloned trees) ─────────────────────────

function doInsert(root: TreeNode | null, value: number): TreeNode {
  if (!root) return { value, left: null, right: null, height: 1 }
  if (value < root.value) root.left = doInsert(root.left, value)
  else root.right = doInsert(root.right, value)
  updateHeight(root)
  return root
}

function findMin(node: TreeNode): TreeNode {
  let cur = node
  while (cur.left) cur = cur.left
  return cur
}

function doDelete(root: TreeNode | null, value: number): TreeNode | null {
  if (!root) return null
  if (value < root.value) { root.left = doDelete(root.left, value); updateHeight(root); return root }
  if (value > root.value) { root.right = doDelete(root.right, value); updateHeight(root); return root }
  if (!root.left) return root.right
  if (!root.right) return root.left
  const successor = findMin(root.right)
  root.value = successor.value
  root.right = doDelete(root.right, successor.value)
  updateHeight(root)
  return root
}

// ── BST Insert ───────────────────────────────────────────────────────────────
// Phase 1: Collect VISIT steps on original tree (new node NOT visible yet)
// Phase 2: INSERT step with new tree snapshot

export function bstInsert(
  root: TreeNode | null,
  value: number
): { root: TreeNode; steps: AnimationStep[] } {
  const originalSnapshot = cloneTree(root)
  const steps: AnimationStep[] = []

  // Traversal on original (read-only) tree
  let cur = root
  while (cur) {
    steps.push({ type: 'VISIT', nodeValue: cur.value, treeSnapshot: cloneTree(originalSnapshot) })
    cur = value < cur.value ? cur.left : cur.right
  }

  // Actual insert (mutate a fresh clone)
  const newRoot = doInsert(cloneTree(root), value)
  steps.push({ type: 'INSERT', nodeValue: value, treeSnapshot: cloneTree(newRoot) })

  return { root: newRoot, steps }
}

// ── BST Delete ───────────────────────────────────────────────────────────────
// Phase 1: VISIT steps on original tree
// Phase 2: DELETE step still shows original tree (node visible, highlighted red)
// After animation ends, TreeCanvas falls back to root which is already the new tree

export function bstDelete(
  root: TreeNode | null,
  value: number
): { root: TreeNode | null; steps: AnimationStep[]; found: boolean } {
  const originalSnapshot = cloneTree(root)
  const steps: AnimationStep[] = []

  let cur = root
  let found = false
  while (cur) {
    if (cur.value === value) { found = true; break }
    steps.push({ type: 'VISIT', nodeValue: cur.value, treeSnapshot: cloneTree(originalSnapshot) })
    cur = value < cur.value ? cur.left : cur.right
  }

  if (!found) return { root, steps: [], found: false }

  // DELETE step: show original tree so node is still visible (highlighted red)
  steps.push({ type: 'DELETE', nodeValue: value, treeSnapshot: cloneTree(originalSnapshot) })

  const newRoot = doDelete(cloneTree(root), value)
  return { root: newRoot, steps, found: true }
}

// ── BST Search ───────────────────────────────────────────────────────────────

export function bstSearch(
  root: TreeNode | null,
  value: number
): { steps: AnimationStep[] } {
  const steps: AnimationStep[] = []
  const snapshot = cloneTree(root) // search never changes the tree
  let cur = root

  while (cur) {
    if (cur.value === value) {
      steps.push({ type: 'FOUND', nodeValue: cur.value, treeSnapshot: snapshot })
      return { steps }
    }
    steps.push({ type: 'VISIT', nodeValue: cur.value, treeSnapshot: snapshot })
    cur = value < cur.value ? cur.left : cur.right
  }

  const last = steps.length > 0 ? steps[steps.length - 1].nodeValue : -Infinity
  steps.push({ type: 'NOT_FOUND', nodeValue: last, treeSnapshot: snapshot })
  return { steps }
}
