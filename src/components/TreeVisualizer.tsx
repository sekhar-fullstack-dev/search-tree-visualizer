import React, { useState, useCallback, useRef } from 'react'
import { TreeNode, SpeedLevel, TreeInfo } from '../types/tree'
import { bstInsert, bstDelete, bstSearch, treeHeight, nodeCount } from '../algorithms/bst'
import { avlInsert, avlDelete, avlSearch, getBalance } from '../algorithms/avl'
import { useAnimationQueue } from '../hooks/useAnimationQueue'
import { ControlPanel } from './ControlPanel'
import { TreeCanvas } from './TreeCanvas'
import { InfoPanel } from './InfoPanel'

function computeInfo(root: TreeNode | null, lastOp: string, isAVL: boolean): TreeInfo {
  return {
    height: treeHeight(root),
    nodeCount: nodeCount(root),
    balanceFactor: isAVL ? getBalance(root) : null,
    lastOperation: lastOp,
  }
}

export const TreeVisualizer: React.FC = () => {
  const [bstRoot, setBstRoot] = useState<TreeNode | null>(null)
  const [avlRoot, setAvlRoot] = useState<TreeNode | null>(null)
  const [speed, setSpeed] = useState<SpeedLevel>('medium')
  const [toast, setToast] = useState<string | null>(null)
  const [bstInfo, setBstInfo] = useState<TreeInfo>({ height: 0, nodeCount: 0, balanceFactor: null, lastOperation: '' })
  const [avlInfo, setAvlInfo] = useState<TreeInfo>({ height: 0, nodeCount: 0, balanceFactor: null, lastOperation: '' })

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bstAnim = useAnimationQueue(speed)
  const avlAnim = useAnimationQueue(speed)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }, [])

  // ── Insert ─────────────────────────────────────────────────────────────────

  const handleInsert = useCallback((value: number) => {
    // Check duplicate in BST (AVL will match)
    const checkDup = (n: TreeNode | null): boolean => {
      if (!n) return false
      if (n.value === value) return true
      return value < n.value ? checkDup(n.left) : checkDup(n.right)
    }
    if (checkDup(bstRoot)) {
      showToast(`${value} already exists`)
      return
    }

    const bstResult = bstInsert(bstRoot, value)
    const avlResult = avlInsert(avlRoot, value)

    setBstRoot(bstResult.root)
    setAvlRoot(avlResult.root)

    bstAnim.play(bstResult.steps, () =>
      setBstInfo(computeInfo(bstResult.root, `Inserted ${value}`, false))
    )
    avlAnim.play(avlResult.steps, () =>
      setAvlInfo(computeInfo(avlResult.root, `Inserted ${value}`, true))
    )

    setBstInfo(prev => ({ ...prev, lastOperation: `Inserting ${value}…` }))
    setAvlInfo(prev => ({ ...prev, lastOperation: `Inserting ${value}…` }))
  }, [bstRoot, avlRoot, bstAnim, avlAnim, showToast])

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = useCallback((value: number) => {
    const bstResult = bstDelete(bstRoot, value)
    const avlResult = avlDelete(avlRoot, value)

    if (!bstResult.found) {
      showToast(`${value} not found`)
      return
    }

    setBstRoot(bstResult.root)
    setAvlRoot(avlResult.root)

    bstAnim.play(bstResult.steps, () =>
      setBstInfo(computeInfo(bstResult.root, `Deleted ${value}`, false))
    )
    avlAnim.play(avlResult.steps, () =>
      setAvlInfo(computeInfo(avlResult.root, `Deleted ${value}`, true))
    )

    setBstInfo(prev => ({ ...prev, lastOperation: `Deleting ${value}…` }))
    setAvlInfo(prev => ({ ...prev, lastOperation: `Deleting ${value}…` }))
  }, [bstRoot, avlRoot, bstAnim, avlAnim, showToast])

  // ── Search ─────────────────────────────────────────────────────────────────

  const handleSearch = useCallback((value: number) => {
    if (!bstRoot) {
      showToast('Tree is empty')
      return
    }

    const bstResult = bstSearch(bstRoot, value)
    const avlResult = avlSearch(avlRoot, value)

    const found = bstResult.steps.some(s => s.type === 'FOUND')

    bstAnim.play(bstResult.steps, () =>
      setBstInfo(computeInfo(bstRoot, found ? `Found ${value}` : `${value} not found`, false))
    )
    avlAnim.play(avlResult.steps, () =>
      setAvlInfo(computeInfo(avlRoot, found ? `Found ${value}` : `${value} not found`, true))
    )

    setBstInfo(prev => ({ ...prev, lastOperation: `Searching ${value}…` }))
    setAvlInfo(prev => ({ ...prev, lastOperation: `Searching ${value}…` }))
  }, [bstRoot, avlRoot, bstAnim, avlAnim, showToast])

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    bstAnim.cancel()
    avlAnim.cancel()
    setBstRoot(null)
    setAvlRoot(null)
    setBstInfo({ height: 0, nodeCount: 0, balanceFactor: null, lastOperation: '' })
    setAvlInfo({ height: 0, nodeCount: 0, balanceFactor: null, lastOperation: '' })
    setToast(null)
  }, [bstAnim, avlAnim])

  // ── Preset ─────────────────────────────────────────────────────────────────

  const handlePreset = useCallback((values: number[]) => {
    bstAnim.cancel()
    avlAnim.cancel()

    let bst: TreeNode | null = null
    let avl: TreeNode | null = null

    for (const v of values) {
      bst = bstInsert(bst, v).root
      avl = avlInsert(avl, v).root
    }

    setBstRoot(bst)
    setAvlRoot(avl)
    setBstInfo(computeInfo(bst, `Loaded preset`, false))
    setAvlInfo(computeInfo(avl, `Loaded preset`, true))
  }, [bstAnim, avlAnim])

  const isPlaying = bstAnim.isPlaying || avlAnim.isPlaying

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="px-6 py-3 bg-gray-900 border-b border-gray-700 flex items-center gap-3">
        <h1 className="text-lg font-bold text-white tracking-tight">
          BST & AVL Tree Visualizer
        </h1>
        <span className="text-xs text-gray-500 font-mono">
          Same operations — different structures
        </span>
      </div>

      {/* Controls */}
      <ControlPanel
        speed={speed}
        isPlaying={isPlaying}
        onInsert={handleInsert}
        onDelete={handleDelete}
        onSearch={handleSearch}
        onReset={handleReset}
        onSpeedChange={setSpeed}
        onPreset={handlePreset}
        toast={toast}
      />

      {/* Dual Tree Panel */}
      <div className="flex flex-1 overflow-hidden divide-x divide-gray-700">
        {/* BST */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="px-4 py-1.5 bg-gray-800 border-b border-gray-700 flex items-center gap-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">BST</span>
            <span className="text-xs text-gray-500">Binary Search Tree (no balancing)</span>
          </div>
          <TreeCanvas root={bstRoot} activeStep={bstAnim.activeStep} speed={speed} />
          <InfoPanel info={bstInfo} isAVL={false} />
        </div>

        {/* AVL */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="px-4 py-1.5 bg-gray-800 border-b border-gray-700 flex items-center gap-2">
            <span className="text-xs font-bold text-violet-400 uppercase tracking-widest">AVL</span>
            <span className="text-xs text-gray-500">Self-balancing AVL Tree</span>
          </div>
          <TreeCanvas root={avlRoot} activeStep={avlAnim.activeStep} speed={speed} />
          <InfoPanel info={avlInfo} isAVL={true} />
        </div>
      </div>
    </div>
  )
}
