import { useRef, useState, useCallback } from 'react'
import { AnimationStep, SpeedLevel, SPEED_MS } from '../types/tree'

// Minimum delay for rotation/rebalance steps so they're always legible
const ROTATE_MIN_MS = 750

export interface AnimationState {
  activeStep: AnimationStep | null
  isPlaying: boolean
}

export function useAnimationQueue(speed: SpeedLevel) {
  const [state, setState] = useState<AnimationState>({ activeStep: null, isPlaying: false })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queueRef = useRef<AnimationStep[]>([])

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    queueRef.current = []
    setState({ activeStep: null, isPlaying: false })
  }, [])

  const play = useCallback(
    (steps: AnimationStep[], onDone?: () => void) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      queueRef.current = [...steps]

      const baseDelay = SPEED_MS[speed]

      function tick() {
        const step = queueRef.current.shift()
        if (!step) {
          setState({ activeStep: null, isPlaying: false })
          onDone?.()
          return
        }
        setState({ activeStep: step, isPlaying: true })

        // Rotation/rebalance steps always get at least ROTATE_MIN_MS so they're visible
        let delay = baseDelay * (step.durationMultiplier ?? 1)
        if (step.type === 'ROTATE' || step.type === 'REBALANCE') {
          delay = Math.max(delay, ROTATE_MIN_MS)
        }

        timerRef.current = setTimeout(tick, delay)
      }

      tick()
    },
    [speed]
  )

  return { ...state, play, cancel }
}
