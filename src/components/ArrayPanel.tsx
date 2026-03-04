import React from 'react'
import { AnimationStep, SpeedLevel, SPEED_MS } from '../types/tree'

const CELL_W = 44
const CELL_H = 44
const GAP    = 3
const CELL_STEP = CELL_W + GAP

function getCellClasses(value: number, step: AnimationStep | null): string {
  const base = 'border-2 rounded text-xs font-bold flex items-center justify-center select-none transition-colors duration-150'
  if (!step) return `${base} bg-slate-700 border-slate-500 text-slate-200`

  const isActive  = step.nodeValue === value
  const isShifted = step.shiftedValues?.includes(value) ?? false

  switch (step.type) {
    case 'ARR_COMPARE':
      if (isActive) return `${base} bg-yellow-800 border-yellow-400 text-yellow-100`
      break
    case 'ARR_FOUND':
      if (isActive) return `${base} bg-emerald-700 border-emerald-400 text-emerald-100`
      break
    case 'ARR_NOT_FOUND':
      if (isActive) return `${base} bg-red-800 border-red-400 text-red-100`
      break
    case 'ARR_DELETE':
      if (isActive) return `${base} bg-red-800 border-red-400 text-red-100`
      break
    case 'ARR_SHIFT_PREP':
      if (isShifted) return `${base} bg-amber-800 border-amber-400 text-amber-100`
      break
    case 'ARR_SHIFT':
      if (isActive)  return `${base} bg-emerald-700 border-emerald-400 text-emerald-100`
      if (isShifted) return `${base} bg-amber-700 border-amber-500 text-amber-100`
      break
    default:
      break
  }
  return `${base} bg-slate-700 border-slate-500 text-slate-200`
}

interface Props {
  arr: number[]
  activeStep: AnimationStep | null
  speed: SpeedLevel
}

export const ArrayPanel: React.FC<Props> = ({ arr, activeStep, speed }) => {
  const displayArr  = activeStep?.arraySnapshot ?? arr
  const isShifting  = activeStep?.type === 'ARR_SHIFT'
  const isShiftPrep = activeStep?.type === 'ARR_SHIFT_PREP'
  const opType      = activeStep?.opType
  const dur         = Math.max(550, Math.round(SPEED_MS[speed] * 1.5 * 0.85))

  const totalWidth  = Math.max(1, displayArr.length) * CELL_STEP - GAP

  // Complexity badge styles
  const badge = (active: boolean, color: string) =>
    `px-2 py-0.5 rounded text-xs font-semibold border transition-all duration-200 ${
      active
        ? color
        : 'bg-gray-800 border-gray-600 text-gray-400'
    }`

  const insertActive = opType === 'insert'
  const searchActive = opType === 'search'
  const deleteActive = opType === 'delete'

  return (
    <div className="bg-gray-850 border-b border-gray-700 px-4 pt-2 pb-3 bg-gray-900">
      {/* Header row */}
      <div className="flex items-center gap-3 mb-2 flex-wrap">
        <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">
          Sorted ArrayList
        </span>

        {/* Complexity badges */}
        <span className={badge(insertActive, 'bg-red-900 border-red-500 text-red-200')}>
          Insert: O(n)
        </span>
        <span className={badge(searchActive, 'bg-emerald-900 border-emerald-500 text-emerald-200')}>
          Search: O(log n)
        </span>
        <span className={badge(deleteActive, 'bg-red-900 border-red-500 text-red-200')}>
          Delete: O(n)
        </span>

        {/* Shift cost banner */}
        {(isShiftPrep || isShifting) && activeStep?.shiftedValues && activeStep.shiftedValues.length > 0 && (
          <span className="toast-slide-in px-3 py-0.5 rounded-full bg-amber-800 border border-amber-500 text-amber-100 text-xs font-semibold">
            &#9888; Shifting {activeStep.shiftedValues.length} element{activeStep.shiftedValues.length !== 1 ? 's' : ''} — O(n) cost!
          </span>
        )}

        {/* Element count */}
        <span className="ml-auto text-xs text-gray-500">
          {displayArr.length} element{displayArr.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Array cells */}
      {displayArr.length === 0 ? (
        <div className="flex items-center h-11 text-gray-600 text-xs italic">
          Empty array
        </div>
      ) : (
        <div className="overflow-x-auto pb-1">
          <div
            className="relative"
            style={{ width: totalWidth, height: CELL_H }}
          >
            {displayArr.map((value, index) => (
              <div
                key={value}
                style={{
                  position:  'absolute',
                  width:      CELL_W,
                  height:     CELL_H,
                  transform: `translateX(${index * CELL_STEP}px)`,
                  transition: isShifting
                    ? `transform ${dur}ms cubic-bezier(0.4, 0, 0.2, 1)`
                    : 'transform 0ms',
                }}
                className={getCellClasses(value, activeStep)}
              >
                {value}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
