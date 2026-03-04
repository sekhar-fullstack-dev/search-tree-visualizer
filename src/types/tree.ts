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

export interface AnimationStep {
  type: StepType
  nodeValue: number
  label?: string                // e.g. "Left Rotation"
  treeSnapshot: TreeNode | null // full tree state for this step
  involvedNodes?: number[]      // other nodes participating in a rotation
  durationMultiplier?: number   // 1 = normal speed, 2.5 = 2.5× slower (used for rotations)
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
