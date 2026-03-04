import React, { useState } from 'react'
import { AnimationStep, SpeedLevel, TraversalType } from '../types/tree'
import { AnimationMode } from '../hooks/useAnimationQueue'

export interface Preset {
  label: string
  values: number[]
  description: string
}

export const PRESETS: Preset[] = [
  {
    label: 'Skewed BST',
    values: [1, 2, 3, 4, 5, 6],
    description: 'Worst case — BST degenerates to a linked list',
  },
  {
    label: 'Balanced',
    values: [5, 3, 7, 1, 4, 6, 8],
    description: 'A naturally balanced BST example',
  },
  {
    label: 'Rotation Demo',
    values: [10, 20, 30, 15, 25, 5, 1],
    description: 'Triggers all four AVL rotation types',
  },
]

// Human-readable label for any animation step
function describeStep(step: AnimationStep): string {
  switch (step.type) {
    case 'VISIT':     return `Visiting node ${step.nodeValue}`
    case 'INSERT':    return `Inserting ${step.nodeValue} into tree`
    case 'DELETE':    return `Removing node ${step.nodeValue}`
    case 'FOUND':     return `Found ${step.nodeValue} ✓`
    case 'NOT_FOUND': return `${step.nodeValue} not found in tree`
    case 'ROTATE':    return step.label ?? 'Rotation'
    case 'REBALANCE': return step.label ?? 'Checking balance…'
    case 'TRAVERSE': {
      const seq = [...(step.visitedPath ?? []), step.nodeValue]
      return `${step.label}: ${seq.join(' → ')}`
    }
    case 'ARR_COMPARE':    return `Binary search: comparing ${step.nodeValue} (index ${step.activeIndex})`
    case 'ARR_FOUND':      return `Found ${step.nodeValue} at index ${step.activeIndex} ✓`
    case 'ARR_NOT_FOUND':  return `${step.nodeValue} not found in array`
    case 'ARR_DELETE':     return `Removing ${step.nodeValue} from index ${step.activeIndex}`
    case 'ARR_SHIFT_PREP': return step.label ?? 'Preparing to shift elements'
    case 'ARR_SHIFT':      return step.opType === 'insert'
      ? `Inserted — shifted ${step.shiftedValues?.length ?? 0} element${(step.shiftedValues?.length ?? 0) !== 1 ? 's' : ''}`
      : `Deleted — shifted ${step.shiftedValues?.length ?? 0} element${(step.shiftedValues?.length ?? 0) !== 1 ? 's' : ''} left`
  }
}

// Color accent per step type for the step bar
function stepAccent(step: AnimationStep): string {
  switch (step.type) {
    case 'VISIT':          return 'text-yellow-400'
    case 'INSERT':         return 'text-emerald-400'
    case 'DELETE':         return 'text-red-400'
    case 'FOUND':          return 'text-green-400'
    case 'NOT_FOUND':      return 'text-red-400'
    case 'ROTATE':         return 'text-violet-400'
    case 'REBALANCE':      return 'text-indigo-400'
    case 'TRAVERSE':       return 'text-cyan-400'
    case 'ARR_COMPARE':    return 'text-yellow-400'
    case 'ARR_FOUND':      return 'text-emerald-400'
    case 'ARR_NOT_FOUND':  return 'text-red-400'
    case 'ARR_DELETE':     return 'text-red-400'
    case 'ARR_SHIFT_PREP': return 'text-amber-400'
    case 'ARR_SHIFT':      return 'text-amber-400'
  }
}

interface Props {
  speed: SpeedLevel
  mode: AnimationMode
  isPlaying: boolean
  // step-through info (null when no animation is queued)
  stepInfo: { bstStep: AnimationStep | null; avlStep: AnimationStep | null; arrStep: AnimationStep | null; index: number; total: number } | null
  onInsert: (v: number) => void
  onDelete: (v: number) => void
  onSearch: (v: number) => void
  onTraverse: (type: TraversalType) => void
  onReset: () => void
  onSpeedChange: (s: SpeedLevel) => void
  onModeToggle: () => void
  onPreset: (values: number[]) => void
  onNext: () => void
  onPrev: () => void
  onPlayAll: () => void
  toast: string | null
}

const TRAVERSALS: { type: TraversalType; short: string; hint: string }[] = [
  { type: 'In-order',   short: 'In-order',   hint: 'L → Node → R  (sorted for BST)' },
  { type: 'Pre-order',  short: 'Pre-order',  hint: 'Node → L → R' },
  { type: 'Post-order', short: 'Post-order', hint: 'L → R → Node' },
]

export const ControlPanel: React.FC<Props> = ({
  speed, mode, isPlaying, stepInfo,
  onInsert, onDelete, onSearch, onTraverse, onReset,
  onSpeedChange, onModeToggle, onPreset,
  onNext, onPrev, onPlayAll,
  toast,
}) => {
  const [input, setInput] = useState('')
  const [showPresets, setShowPresets] = useState(false)

  const parse = (): number | null => {
    const v = parseInt(input.trim(), 10)
    return isNaN(v) ? null : v
  }

  const handle = (fn: (v: number) => void) => {
    const v = parse()
    if (v === null) return
    fn(v)
    setInput('')
  }

  const speeds: SpeedLevel[] = ['slow', 'medium', 'fast']
  const isStepMode = mode === 'step'
  // In step mode, disable operation buttons while a step-through is in progress
  const opDisabled = isStepMode ? (stepInfo !== null) : isPlaying

  // Pick most informative step: prefer ARR_SHIFT_PREP, then AVL (rotations), then BST, then array others
  const activeStep = (() => {
    if (!stepInfo) return null
    const { avlStep, bstStep, arrStep } = stepInfo
    if (arrStep?.type === 'ARR_SHIFT_PREP' || arrStep?.type === 'ARR_SHIFT') return arrStep
    if (avlStep?.type === 'ROTATE' || avlStep?.type === 'REBALANCE') return avlStep
    return avlStep ?? bstStep ?? arrStep
  })()

  return (
    <div className="bg-gray-800 border-b border-gray-700 flex flex-col">

      {/* ── Main controls row ───────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 flex flex-wrap items-center gap-2.5">

        {/* Input */}
        <input
          type="number"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !opDisabled && handle(onInsert)}
          placeholder="Enter integer…"
          disabled={opDisabled}
          className="w-32 px-3 py-1.5 rounded bg-gray-900 border border-gray-600
            text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-400
            disabled:opacity-50"
        />

        <button onClick={() => handle(onInsert)} disabled={opDisabled || !input.trim()}
          className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-sm
            font-medium disabled:opacity-40 transition-colors">
          Insert
        </button>
        <button onClick={() => handle(onDelete)} disabled={opDisabled || !input.trim()}
          className="px-3 py-1.5 rounded bg-red-700 hover:bg-red-600 text-white text-sm
            font-medium disabled:opacity-40 transition-colors">
          Delete
        </button>
        <button onClick={() => handle(onSearch)} disabled={opDisabled || !input.trim()}
          className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm
            font-medium disabled:opacity-40 transition-colors">
          Search
        </button>

        <div className="w-px h-5 bg-gray-600" />

        {/* Traversal */}
        <span className="text-xs text-gray-500">Traverse:</span>
        {TRAVERSALS.map(t => (
          <button
            key={t.type}
            onClick={() => onTraverse(t.type)}
            disabled={opDisabled}
            title={t.hint}
            className="px-2.5 py-1.5 rounded border border-cyan-700 hover:border-cyan-400
              hover:bg-cyan-900/40 text-cyan-300 hover:text-cyan-100 text-xs font-medium
              disabled:opacity-40 transition-colors"
          >
            {t.short}
          </button>
        ))}

        <div className="w-px h-5 bg-gray-600" />

        {/* Speed */}
        <div className="flex items-center gap-1.5 text-sm text-gray-400">
          <span className="text-xs">Speed:</span>
          {speeds.map(s => (
            <button key={s} onClick={() => onSpeedChange(s)}
              className={`px-2 py-0.5 rounded text-xs font-medium capitalize transition-colors
                ${speed === s
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-gray-600" />

        {/* Mode toggle */}
        <button
          onClick={onModeToggle}
          title={isStepMode ? 'Switch to auto-play' : 'Switch to step-through mode'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium
            border transition-colors
            ${isStepMode
              ? 'bg-indigo-900 border-indigo-500 text-indigo-300'
              : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'}`}>
          {isStepMode ? '⏸ Step Mode' : '▶ Auto'}
        </button>

        <div className="w-px h-5 bg-gray-600" />

        {/* Presets */}
        <div className="relative">
          <button
            onClick={() => setShowPresets(p => !p)}
            disabled={opDisabled}
            className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-sm text-gray-200
              font-medium disabled:opacity-40 transition-colors flex items-center gap-1">
            Presets <span className="text-xs">▾</span>
          </button>
          {showPresets && (
            <div className="absolute left-0 top-full mt-1 z-20 w-60 bg-gray-800 border border-gray-600
              rounded shadow-xl">
              {PRESETS.map(p => (
                <button key={p.label}
                  onClick={() => { onPreset(p.values); setShowPresets(false) }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors">
                  <div className="text-sm font-medium text-gray-100">{p.label}</div>
                  <div className="text-xs text-gray-400">{p.description}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={onReset}
          className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-sm text-gray-200
            font-medium transition-colors">
          Reset
        </button>

        {/* Toast */}
        {toast && (
          <span className="toast-slide-in ml-1 px-3 py-1 rounded-full bg-yellow-700 text-yellow-100
            text-xs font-medium border border-yellow-500">
            {toast}
          </span>
        )}
      </div>

      {/* ── Step-through controls bar (visible in step mode) ─────────────────── */}
      {isStepMode && (
        <div className="px-4 py-2 border-t border-gray-700 bg-gray-900/60 flex items-center gap-3">

          {stepInfo ? (
            <>
              {/* Prev */}
              <button
                onClick={onPrev}
                title="Previous step"
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-200
                  text-sm font-medium transition-colors disabled:opacity-40 flex items-center gap-1"
              >
                ◄ Prev
              </button>

              {/* Step counter pill */}
              <span className="px-3 py-0.5 rounded-full bg-gray-800 border border-gray-600
                text-xs font-mono text-gray-300 tabular-nums">
                Step {stepInfo.index} / {stepInfo.total}
              </span>

              {/* Next */}
              <button
                onClick={onNext}
                title="Next step  (→)"
                className="px-3 py-1 rounded bg-indigo-700 hover:bg-indigo-600 text-white
                  text-sm font-medium transition-colors flex items-center gap-1"
              >
                Next ►
              </button>

              {/* Play All */}
              <button
                onClick={onPlayAll}
                title="Auto-play remaining steps"
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-200
                  text-sm font-medium transition-colors flex items-center gap-1"
              >
                ▶▶ Play All
              </button>

              {/* Step description */}
              {activeStep && (
                <span className={`text-sm font-medium ${stepAccent(activeStep)} ml-2`}>
                  {describeStep(activeStep)}
                </span>
              )}
            </>
          ) : (
            // No active animation — idle hint
            <span className="text-xs text-gray-500 italic">
              Step Mode active — do an operation, then use Next / Prev to walk through each step.
              <span className="ml-2 text-gray-600">Tip: ← → arrow keys also work.</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
