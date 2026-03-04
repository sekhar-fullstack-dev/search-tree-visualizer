import { useRef, useState, useCallback } from 'react'
import { AnimationStep, SpeedLevel, SPEED_MS } from '../types/tree'

const ROTATE_MIN_MS = 750

export type AnimationMode = 'auto' | 'step'

export interface AnimationState {
  activeStep: AnimationStep | null
  isPlaying: boolean
  stepIndex: number  // 1-based; 0 = not started
  totalSteps: number
}

export function useAnimationQueue(speed: SpeedLevel, mode: AnimationMode) {
  const [state, setState] = useState<AnimationState>({
    activeStep: null,
    isPlaying: false,
    stepIndex: 0,
    totalSteps: 0,
  })

  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)
  const stepsRef    = useRef<AnimationStep[]>([])
  const indexRef    = useRef(-1)               // current step index (-1 = not started)
  const onDoneRef   = useRef<(() => void) | undefined>(undefined)
  const speedRef    = useRef(speed)
  const modeRef     = useRef(mode)

  // Always keep refs in sync with latest props — no re-render needed
  speedRef.current = speed
  modeRef.current  = mode

  // ── Internal helpers (read refs, so always see latest values) ────────────────

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
  }

  // Fire the onDone callback and clear all animation state.
  // Clears stepsRef too so subsequent next() calls on a finished queue are no-ops.
  const complete = () => {
    stepsRef.current  = []       // ← key fix: prevents restart on next()
    indexRef.current  = -1
    setState({ activeStep: null, isPlaying: false, stepIndex: 0, totalSteps: 0 })
    const cb = onDoneRef.current
    onDoneRef.current = undefined
    cb?.()
  }

  // Render a specific step index
  const showAt = (index: number) => {
    const steps = stepsRef.current
    if (index < 0 || index >= steps.length) return
    indexRef.current = index
    setState(prev => ({
      ...prev,
      activeStep: steps[index],
      isPlaying: true,
      stepIndex: index + 1,
    }))
  }

  // tickRef always holds the latest tick fn — safe to call from setTimeout closures
  // without stale-closure issues.
  const tickRef = useRef<(index: number) => void>(undefined as unknown as (index: number) => void)
  tickRef.current = (index: number) => {
    const steps = stepsRef.current
    if (index >= steps.length) { complete(); return }
    showAt(index)
    const step = steps[index]
    let delay = (step.durationMultiplier ?? 1) * SPEED_MS[speedRef.current]
    if (step.type === 'ROTATE' || step.type === 'REBALANCE') {
      delay = Math.max(delay, ROTATE_MIN_MS)
    }
    timerRef.current = setTimeout(() => tickRef.current!(index + 1), delay)
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  const cancel = useCallback(() => {
    clearTimer()
    stepsRef.current = []
    indexRef.current = -1
    onDoneRef.current = undefined
    setState({ activeStep: null, isPlaying: false, stepIndex: 0, totalSteps: 0 })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const play = useCallback((steps: AnimationStep[], onDone?: () => void) => {
    clearTimer()
    stepsRef.current  = [...steps]
    indexRef.current  = -1
    onDoneRef.current = onDone
    setState(prev => ({
      ...prev,
      totalSteps: steps.length,
      stepIndex:  0,
      activeStep: null,
      isPlaying:  steps.length > 0,
    }))
    if (modeRef.current === 'auto') {
      tickRef.current!(0)
    } else {
      showAt(0)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Step-through: advance one step forward.
  // If this queue is already finished (steps cleared), do nothing — the other
  // tree's queue is still progressing and this one should stay at its final state.
  const next = useCallback(() => {
    if (modeRef.current !== 'step') return
    if (stepsRef.current.length === 0) return  // already done — stay put
    const nextIdx = indexRef.current + 1
    if (nextIdx >= stepsRef.current.length) { complete(); return }
    showAt(nextIdx)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Step-through: go one step back (re-show previous snapshot)
  const prev = useCallback(() => {
    if (modeRef.current !== 'step') return
    const prevIdx = indexRef.current - 1
    if (prevIdx < 0) { cancel(); return }
    showAt(prevIdx)
  }, [cancel]) // eslint-disable-line react-hooks/exhaustive-deps

  // Finish the rest of the steps in auto-play mode (used by "Play All" button)
  const playAll = useCallback(() => {
    clearTimer()
    tickRef.current!(indexRef.current + 1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { ...state, play, cancel, next, prev, playAll }
}
