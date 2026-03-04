export interface TreeNode {
  value: number
  left: TreeNode | null
  right: TreeNode | null
  height: number // used by AVL; always 1 for BST leaves
}

export type StepType =
  | 'VISIT'
  | 'INSERT'
  | 'DELETE'
  | 'FOUND'
  | 'NOT_FOUND'
  | 'ROTATE'
  | 'REBALANCE'
  | 'TRAVERSE'      // in-order / pre-order / post-order traversal visit
  | 'ARR_COMPARE'    // binary search midpoint comparison
  | 'ARR_FOUND'      // element found
  | 'ARR_NOT_FOUND'  // element not found
  | 'ARR_DELETE'     // element marked for deletion
  | 'ARR_SHIFT_PREP' // highlight elements about to shift (O(n) moment)
  | 'ARR_SHIFT'      // final array after shift — CSS transition fires

export type TraversalType = 'In-order' | 'Pre-order' | 'Post-order'

export interface AnimationStep {
  type: StepType
  nodeValue: number
  label?: string                // rotation name or traversal type
  treeSnapshot: TreeNode | null // full tree state for this step
  involvedNodes?: number[]      // other nodes participating in a rotation
  visitedPath?: number[]        // for TRAVERSE: values already visited before this node
  durationMultiplier?: number   // 1 = normal speed, 2.5 = 2.5× slower
  arraySnapshot?: number[]      // array state at this step (for ARR_* steps)
  activeIndex?: number          // index of primary element (for ARR_* steps)
  shiftedValues?: number[]      // values that are physically shifting
  opType?: 'insert' | 'delete' | 'search'  // which operation triggered this (for complexity badge highlight)
}

export type RotationType =
  | 'Left Rotation'
  | 'Right Rotation'
  | 'Left-Right Rotation'
  | 'Right-Left Rotation'

export interface TreeInfo {
  height: number
  nodeCount: number
  balanceFactor: number | null // null for BST
  lastOperation: string
}

export interface LayoutNode {
  value: number
  x: number
  y: number
  parentX?: number
  parentY?: number
}

export type SpeedLevel = 'slow' | 'medium' | 'fast'

export const SPEED_MS: Record<SpeedLevel, number> = {
  slow: 900,
  medium: 450,
  fast: 150,
}
