import React, { useState } from 'react'
import { SpeedLevel } from '../types/tree'

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

interface Props {
  speed: SpeedLevel
  isPlaying: boolean
  onInsert: (v: number) => void
  onDelete: (v: number) => void
  onSearch: (v: number) => void
  onReset: () => void
  onSpeedChange: (s: SpeedLevel) => void
  onPreset: (values: number[]) => void
  toast: string | null
}

export const ControlPanel: React.FC<Props> = ({
  speed,
  isPlaying,
  onInsert,
  onDelete,
  onSearch,
  onReset,
  onSpeedChange,
  onPreset,
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

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex flex-wrap items-center gap-3">
      {/* Input */}
      <input
        type="number"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handle(onInsert)}
        placeholder="Enter integer…"
        disabled={isPlaying}
        className="w-36 px-3 py-1.5 rounded bg-gray-900 border border-gray-600
          text-white placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-400
          disabled:opacity-50"
      />

      {/* Operation buttons */}
      <button
        onClick={() => handle(onInsert)}
        disabled={isPlaying || !input.trim()}
        className="px-4 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-sm
          font-medium disabled:opacity-40 transition-colors"
      >
        Insert
      </button>
      <button
        onClick={() => handle(onDelete)}
        disabled={isPlaying || !input.trim()}
        className="px-4 py-1.5 rounded bg-red-700 hover:bg-red-600 text-white text-sm
          font-medium disabled:opacity-40 transition-colors"
      >
        Delete
      </button>
      <button
        onClick={() => handle(onSearch)}
        disabled={isPlaying || !input.trim()}
        className="px-4 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm
          font-medium disabled:opacity-40 transition-colors"
      >
        Search
      </button>

      <div className="w-px h-6 bg-gray-600" />

      {/* Speed */}
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <span>Speed:</span>
        {speeds.map(s => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-2 py-0.5 rounded text-xs font-medium capitalize transition-colors
              ${speed === s
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="w-px h-6 bg-gray-600" />

      {/* Presets */}
      <div className="relative">
        <button
          onClick={() => setShowPresets(p => !p)}
          disabled={isPlaying}
          className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-sm text-gray-200
            font-medium disabled:opacity-40 transition-colors flex items-center gap-1"
        >
          Presets <span className="text-xs">▾</span>
        </button>
        {showPresets && (
          <div className="absolute left-0 top-full mt-1 z-20 w-60 bg-gray-800 border border-gray-600
            rounded shadow-xl">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => { onPreset(p.values); setShowPresets(false) }}
                className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
              >
                <div className="text-sm font-medium text-gray-100">{p.label}</div>
                <div className="text-xs text-gray-400">{p.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="px-3 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-sm text-gray-200
          font-medium transition-colors"
      >
        Reset
      </button>

      {/* Toast */}
      {toast && (
        <span className="toast-slide-in ml-2 px-3 py-1 rounded-full bg-yellow-700 text-yellow-100
          text-xs font-medium border border-yellow-500">
          {toast}
        </span>
      )}
    </div>
  )
}
