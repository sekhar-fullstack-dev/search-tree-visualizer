import React, { useState, useCallback, useRef, useEffect } from 'react'
import { TreeNode, SpeedLevel, TreeInfo, TraversalType } from '../types/tree'
import { bstInsert, bstDelete, bstSearch, treeHeight, nodeCount, inOrderTraversal, preOrderTraversal, postOrderTraversal } from '../algorithms/bst'
import { avlInsert, avlDelete, avlSearch, getBalance } from '../algorithms/avl'
import { useAnimationQueue, AnimationMode } from '../hooks/useAnimationQueue'
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
  const [speed, setSpeed]     = useState<SpeedLevel>('medium')
  const [mode, setMode]       = useState<AnimationMode>('auto')
  const [toast, setToast]     = useState<string | null>(null)
  const [bstInfo, setBstInfo] = useState<TreeInfo>({ height: 0, nodeCount: 0, balanceFactor: null, lastOperation: '' })
  const [avlInfo, setAvlInfo] = useState<TreeInfo>({ height: 0, nodeCount: 0, balanceFactor: null, lastOperation: '' })

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bstAnim = useAnimationQueue(speed, mode)
  const avlAnim = useAnimationQueue(speed, mode)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }, [])

  // ── Insert ─────────────────────────────────────────────────────────────────

  const handleInsert = useCallback((value: number) => {
    const checkDup = (n: TreeNode | null): boolean => {
      if (!n) return false
      if (n.value === value) return true
      return value < n.value ? checkDup(n.left) : checkDup(n.right)
    }
    if (checkDup(bstRoot)) { showToast(`${value} already exists`); return }

    const bstResult = bstInsert(bstRoot, value)
    const avlResult = avlInsert(avlRoot, value)

    setBstRoot(bstResult.root)
    setAvlRoot(avlResult.root)

    bstAnim.play(bstResult.steps, () =>
      setBstInfo(computeInfo(bstResult.root, `Inserted ${value}`, false)))
    avlAnim.play(avlResult.steps, () =>
      setAvlInfo(computeInfo(avlResult.root, `Inserted ${value}`, true)))

    setBstInfo(prev => ({ ...prev, lastOperation: `Inserting ${value}…` }))
    setAvlInfo(prev => ({ ...prev, lastOperation: `Inserting ${value}…` }))
  }, [bstRoot, avlRoot, bstAnim, avlAnim, showToast])

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = useCallback((value: number) => {
    const bstResult = bstDelete(bstRoot, value)
    const avlResult = avlDelete(avlRoot, value)

    if (!bstResult.found) { showToast(`${value} not found`); return }

    setBstRoot(bstResult.root)
    setAvlRoot(avlResult.root)

    bstAnim.play(bstResult.steps, () =>
      setBstInfo(computeInfo(bstResult.root, `Deleted ${value}`, false)))
    avlAnim.play(avlResult.steps, () =>
      setAvlInfo(computeInfo(avlResult.root, `Deleted ${value}`, true)))

    setBstInfo(prev => ({ ...prev, lastOperation: `Deleting ${value}…` }))
    setAvlInfo(prev => ({ ...prev, lastOperation: `Deleting ${value}…` }))
  }, [bstRoot, avlRoot, bstAnim, avlAnim, showToast])

  // ── Search ─────────────────────────────────────────────────────────────────

  const handleSearch = useCallback((value: number) => {
    if (!bstRoot) { showToast('Tree is empty'); return }

    const bstResult = bstSearch(bstRoot, value)
    const avlResult = avlSearch(avlRoot, value)
    const found = bstResult.steps.some(s => s.type === 'FOUND')

    bstAnim.play(bstResult.steps, () =>
      setBstInfo(computeInfo(bstRoot, found ? `Found ${value}` : `${value} not found`, false)))
    avlAnim.play(avlResult.steps, () =>
      setAvlInfo(computeInfo(avlRoot, found ? `Found ${value}` : `${value} not found`, true)))

    setBstInfo(prev => ({ ...prev, lastOperation: `Searching ${value}…` }))
    setAvlInfo(prev => ({ ...prev, lastOperation: `Searching ${value}…` }))
  }, [bstRoot, avlRoot, bstAnim, avlAnim, showToast])

  // ── Traversal ──────────────────────────────────────────────────────────────

  const handleTraversal = useCallback((type: TraversalType) => {
    if (!bstRoot) { showToast('Tree is empty'); return }

    const fn = type === 'In-order'  ? inOrderTraversal
             : type === 'Pre-order' ? preOrderTraversal
             :                        postOrderTraversal

    const bstResult = fn(bstRoot)
    const avlResult = fn(avlRoot)

    bstAnim.play(bstResult.steps, () =>
      setBstInfo(computeInfo(bstRoot, `${type} traversal`, false)))
    avlAnim.play(avlResult.steps, () =>
      setAvlInfo(computeInfo(avlRoot, `${type} traversal`, true)))

    setBstInfo(prev => ({ ...prev, lastOperation: `${type} traversal…` }))
    setAvlInfo(prev => ({ ...prev, lastOperation: `${type} traversal…` }))
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
    setBstInfo(computeInfo(bst, 'Loaded preset', false))
    setAvlInfo(computeInfo(avl, 'Loaded preset', true))
  }, [bstAnim, avlAnim])

  // ── Mode toggle ────────────────────────────────────────────────────────────
  // If switching to auto while a step-through is paused, resume auto-play.

  const handleModeToggle = useCallback(() => {
    setMode(prev => {
      const next = prev === 'auto' ? 'step' : 'auto'
      if (next === 'auto') {
        // Resume any paused step-through
        bstAnim.playAll()
        avlAnim.playAll()
      }
      return next
    })
  }, [bstAnim, avlAnim])

  // ── Step-through controls ─────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    bstAnim.next()
    avlAnim.next()
  }, [bstAnim, avlAnim])

  const handlePrev = useCallback(() => {
    bstAnim.prev()
    avlAnim.prev()
  }, [bstAnim, avlAnim])

  const handlePlayAll = useCallback(() => {
    bstAnim.playAll()
    avlAnim.playAll()
  }, [bstAnim, avlAnim])

  // ── Keyboard shortcuts (← → in step mode) ────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't fire when typing in an input
      if (e.target instanceof HTMLInputElement) return
      if (mode !== 'step') return
      if (e.key === 'ArrowRight') { e.preventDefault(); handleNext() }
      if (e.key === 'ArrowLeft')  { e.preventDefault(); handlePrev() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mode, handleNext, handlePrev])

  // ── Derived state ──────────────────────────────────────────────────────────

  const isPlaying = bstAnim.isPlaying || avlAnim.isPlaying

  // stepInfo: null when nothing is queued, filled when a step-through is active
  const totalSteps = Math.max(bstAnim.totalSteps, avlAnim.totalSteps)
  const stepIndex  = Math.max(bstAnim.stepIndex,  avlAnim.stepIndex)
  const stepInfo   = (mode === 'step' && isPlaying)
    ? { bstStep: bstAnim.activeStep, avlStep: avlAnim.activeStep, index: stepIndex, total: totalSteps }
    : null

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
        mode={mode}
        isPlaying={isPlaying}
        stepInfo={stepInfo}
        onInsert={handleInsert}
        onDelete={handleDelete}
        onSearch={handleSearch}
        onTraverse={handleTraversal}
        onReset={handleReset}
        onSpeedChange={setSpeed}
        onModeToggle={handleModeToggle}
        onPreset={handlePreset}
        onNext={handleNext}
        onPrev={handlePrev}
        onPlayAll={handlePlayAll}
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
