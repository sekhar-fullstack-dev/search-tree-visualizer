import { TreeNode, AnimationStep } from '../types/tree'
import { cloneTree, treeHeight } from './bst'

// ── Helpers ──────────────────────────────────────────────────────────────────

function updateHeight(node: TreeNode): void {
  node.height = 1 + Math.max(treeHeight(node.left), treeHeight(node.right))
}

export function getBalance(node: TreeNode | null): number {
  if (!node) return 0
  return treeHeight(node.left) - treeHeight(node.right)
}

function rotateRight(y: TreeNode): TreeNode {
  const x = y.left!
  const T2 = x.right
  x.right = y
  y.left = T2
  updateHeight(y)
  updateHeight(x)
  return x
}

function rotateLeft(x: TreeNode): TreeNode {
  const y = x.right!
  const T2 = y.left
  y.left = x
  x.right = T2
  updateHeight(x)
  updateHeight(y)
  return y
}

function findMin(node: TreeNode): TreeNode {
  let cur = node
  while (cur.left) cur = cur.left
  return cur
}

// ── Rotation event (internal, richer than AnimationStep) ─────────────────────

interface RotationEvent {
  pivotValue: number
  label: string
  involvedNodes: number[]
}

// ── Plain BST insert without rebalancing (for pre-rotation snapshot) ──────────

function bstInsertOnly(root: TreeNode | null, value: number): TreeNode {
  if (!root) return { value, left: null, right: null, height: 1 }
  if (value < root.value) root.left = bstInsertOnly(root.left, value)
  else root.right = bstInsertOnly(root.right, value)
  updateHeight(root)
  return root
}

// ── Plain BST delete without rebalancing (for pre-rotation snapshot on delete) ─

function bstDeleteOnly(root: TreeNode | null, value: number): TreeNode | null {
  if (!root) return null
  if (value < root.value) { root.left = bstDeleteOnly(root.left, value); return root }
  if (value > root.value) { root.right = bstDeleteOnly(root.right, value); return root }
  if (!root.left) return root.right
  if (!root.right) return root.left
  const successor = findMin(root.right)
  root.value = successor.value
  root.right = bstDeleteOnly(root.right, successor.value)
  return root
}

// ── AVL insert with full rebalancing, collecting rotation events ──────────────

function avlInsertMut(
  root: TreeNode | null,
  value: number,
  rotEvents: RotationEvent[]
): TreeNode {
  if (!root) return { value, left: null, right: null, height: 1 }

  if (value < root.value) root.left = avlInsertMut(root.left, value, rotEvents)
  else root.right = avlInsertMut(root.right, value, rotEvents)

  updateHeight(root)
  const balance = getBalance(root)

  // Left-Left → Right Rotation
  if (balance > 1 && getBalance(root.left) >= 0) {
    const involved = [root.value, root.left!.value]
    if (root.left!.right) involved.push(root.left!.right.value)
    rotEvents.push({ pivotValue: root.value, label: 'Right Rotation', involvedNodes: involved })
    return rotateRight(root)
  }
  // Left-Right → Left then Right Rotation
  if (balance > 1 && getBalance(root.left) < 0) {
    const z = root.left!.right!
    const involved = [root.value, root.left!.value, z.value]
    if (z.left)  involved.push(z.left.value)
    if (z.right) involved.push(z.right.value)
    rotEvents.push({ pivotValue: root.value, label: 'Left-Right Rotation', involvedNodes: involved })
    root.left = rotateLeft(root.left!)
    return rotateRight(root)
  }
  // Right-Right → Left Rotation
  if (balance < -1 && getBalance(root.right) <= 0) {
    const involved = [root.value, root.right!.value]
    if (root.right!.left) involved.push(root.right!.left.value)
    rotEvents.push({ pivotValue: root.value, label: 'Left Rotation', involvedNodes: involved })
    return rotateLeft(root)
  }
  // Right-Left → Right then Left Rotation
  if (balance < -1 && getBalance(root.right) > 0) {
    const z = root.right!.left!
    const involved = [root.value, root.right!.value, z.value]
    if (z.left)  involved.push(z.left.value)
    if (z.right) involved.push(z.right.value)
    rotEvents.push({ pivotValue: root.value, label: 'Right-Left Rotation', involvedNodes: involved })
    root.right = rotateRight(root.right!)
    return rotateLeft(root)
  }

  return root
}

// ── AVL Insert ────────────────────────────────────────────────────────────────
// Steps:
//   1. VISIT steps  → original tree (no new node)
//   2. INSERT step  → tree after plain BST insert (before rotation) — flying node
//   3. ROTATE step  → final balanced tree; nodes CSS-transition to new positions

export function avlInsert(
  root: TreeNode | null,
  value: number
): { root: TreeNode; steps: AnimationStep[] } {
  const originalSnapshot = cloneTree(root)
  const steps: AnimationStep[] = []

  // Phase 1: traversal
  let cur = root
  while (cur) {
    steps.push({ type: 'VISIT', nodeValue: cur.value, treeSnapshot: cloneTree(originalSnapshot) })
    cur = value < cur.value ? cur.left : cur.right
  }

  // Phase 2: INSERT step — shows pre-rotation tree (plain BST insert)
  const afterBSTInsert = bstInsertOnly(cloneTree(root), value)
  steps.push({ type: 'INSERT', nodeValue: value, treeSnapshot: cloneTree(afterBSTInsert) })

  // Phase 3: full AVL insert → collect rotation events
  const rotEvents: RotationEvent[] = []
  const newRoot = avlInsertMut(cloneTree(root), value, rotEvents)

  for (const ev of rotEvents) {
    steps.push({
      type: 'ROTATE',
      nodeValue: ev.pivotValue,
      label: ev.label,
      involvedNodes: ev.involvedNodes,
      treeSnapshot: cloneTree(newRoot), // final balanced tree
      durationMultiplier: 2.5,          // slow so user can see nodes slide
    })
  }

  return { root: newRoot, steps }
}

// ── AVL Delete ────────────────────────────────────────────────────────────────
// Steps:
//   1. VISIT steps    → original tree
//   2. DELETE step    → original tree (node still visible, highlighted red)
//   3. REBALANCE step → tree after plain BST delete (before rotation) — NEW
//   4. ROTATE step(s) → final balanced tree; nodes slide to new positions

function avlRebalanceMut(
  node: TreeNode,
  rotEvents: RotationEvent[]
): TreeNode {
  updateHeight(node)
  const balance = getBalance(node)

  if (balance > 1 && getBalance(node.left) >= 0) {
    const involved = [node.value, node.left!.value]
    if (node.left!.right) involved.push(node.left!.right.value)
    rotEvents.push({ pivotValue: node.value, label: 'Right Rotation', involvedNodes: involved })
    return rotateRight(node)
  }
  if (balance > 1 && getBalance(node.left) < 0) {
    const z = node.left!.right!
    const involved = [node.value, node.left!.value, z.value]
    if (z.left)  involved.push(z.left.value)
    if (z.right) involved.push(z.right.value)
    rotEvents.push({ pivotValue: node.value, label: 'Left-Right Rotation', involvedNodes: involved })
    node.left = rotateLeft(node.left!)
    return rotateRight(node)
  }
  if (balance < -1 && getBalance(node.right) <= 0) {
    const involved = [node.value, node.right!.value]
    if (node.right!.left) involved.push(node.right!.left.value)
    rotEvents.push({ pivotValue: node.value, label: 'Left Rotation', involvedNodes: involved })
    return rotateLeft(node)
  }
  if (balance < -1 && getBalance(node.right) > 0) {
    const z = node.right!.left!
    const involved = [node.value, node.right!.value, z.value]
    if (z.left)  involved.push(z.left.value)
    if (z.right) involved.push(z.right.value)
    rotEvents.push({ pivotValue: node.value, label: 'Right-Left Rotation', involvedNodes: involved })
    node.right = rotateRight(node.right!)
    return rotateLeft(node)
  }
  return node
}

function avlDeleteMut(
  root: TreeNode | null,
  value: number,
  rotEvents: RotationEvent[]
): TreeNode | null {
  if (!root) return null

  if (value < root.value) {
    root.left = avlDeleteMut(root.left, value, rotEvents)
  } else if (value > root.value) {
    root.right = avlDeleteMut(root.right, value, rotEvents)
  } else {
    if (!root.left) return root.right
    if (!root.right) return root.left
    const successor = findMin(root.right)
    root.value = successor.value
    root.right = avlDeleteMut(root.right, successor.value, [])
  }

  return avlRebalanceMut(root, rotEvents)
}

export function avlDelete(
  root: TreeNode | null,
  value: number
): { root: TreeNode | null; steps: AnimationStep[]; found: boolean } {
  const originalSnapshot = cloneTree(root)
  const steps: AnimationStep[] = []

  // Traversal
  let cur = root
  let found = false
  while (cur) {
    if (cur.value === value) { found = true; break }
    steps.push({ type: 'VISIT', nodeValue: cur.value, treeSnapshot: cloneTree(originalSnapshot) })
    cur = value < cur.value ? cur.left : cur.right
  }

  if (!found) return { root, steps: [], found: false }

  // DELETE step: original tree still shows the node (highlighted red)
  steps.push({ type: 'DELETE', nodeValue: value, treeSnapshot: cloneTree(originalSnapshot) })

  // Collect rotation events + get final tree
  const rotEvents: RotationEvent[] = []
  const newRoot = avlDeleteMut(cloneTree(root), value, rotEvents)

  if (rotEvents.length > 0) {
    // Intermediate step: tree after deletion but BEFORE any rotation
    // This gives the user a beat to see the unbalanced state
    const afterDeletion = bstDeleteOnly(cloneTree(root), value)
    steps.push({
      type: 'REBALANCE',
      nodeValue: rotEvents[0].pivotValue, // highlight the first pivot node
      involvedNodes: rotEvents[0].involvedNodes,
      label: 'Unbalanced — rebalancing…',
      treeSnapshot: cloneTree(afterDeletion),
      durationMultiplier: 1.5,
    })
  }

  for (const ev of rotEvents) {
    steps.push({
      type: 'ROTATE',
      nodeValue: ev.pivotValue,
      label: ev.label,
      involvedNodes: ev.involvedNodes,
      treeSnapshot: cloneTree(newRoot),
      durationMultiplier: 2.5,
    })
  }

  return { root: newRoot, steps, found: true }
}

// ── AVL Search ────────────────────────────────────────────────────────────────

export function avlSearch(
  root: TreeNode | null,
  value: number
): { steps: AnimationStep[] } {
  const steps: AnimationStep[] = []
  const snapshot = cloneTree(root)
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
