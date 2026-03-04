import { AnimationStep } from '../types/tree'

export function sortedArrayInsert(
  arr: number[],
  value: number
): { arr: number[]; steps: AnimationStep[]; duplicate: boolean } {
  const steps: AnimationStep[] = []
  let lo = 0, hi = arr.length - 1, pos = arr.length

  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (arr[mid] === value) return { arr, steps: [], duplicate: true }
    steps.push({
      type: 'ARR_COMPARE', nodeValue: arr[mid], activeIndex: mid,
      arraySnapshot: [...arr], treeSnapshot: null, opType: 'insert',
    })
    if (arr[mid] < value) lo = mid + 1
    else { pos = mid; hi = mid - 1 }
  }

  const shifting = arr.slice(pos)

  if (shifting.length > 0) {
    steps.push({
      type: 'ARR_SHIFT_PREP', nodeValue: value, activeIndex: pos,
      arraySnapshot: [...arr], shiftedValues: shifting, treeSnapshot: null,
      label: `Shifting ${shifting.length} element${shifting.length !== 1 ? 's' : ''} right →`,
      opType: 'insert',
    })
  }

  const newArr = [...arr.slice(0, pos), value, ...arr.slice(pos)]
  steps.push({
    type: 'ARR_SHIFT', nodeValue: value, activeIndex: pos,
    arraySnapshot: newArr, shiftedValues: shifting,
    treeSnapshot: null, durationMultiplier: 1.5, opType: 'insert',
  })

  return { arr: newArr, steps, duplicate: false }
}

export function sortedArrayDelete(
  arr: number[],
  value: number
): { arr: number[]; steps: AnimationStep[]; found: boolean } {
  const steps: AnimationStep[] = []
  let lo = 0, hi = arr.length - 1

  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    steps.push({
      type: 'ARR_COMPARE', nodeValue: arr[mid], activeIndex: mid,
      arraySnapshot: [...arr], treeSnapshot: null, opType: 'delete',
    })
    if (arr[mid] === value) {
      steps.push({
        type: 'ARR_DELETE', nodeValue: value, activeIndex: mid,
        arraySnapshot: [...arr], treeSnapshot: null, opType: 'delete',
      })
      const shifting = arr.slice(mid + 1)
      if (shifting.length > 0) {
        steps.push({
          type: 'ARR_SHIFT_PREP', nodeValue: value, activeIndex: mid,
          arraySnapshot: [...arr], shiftedValues: shifting, treeSnapshot: null,
          label: `Shifting ${shifting.length} element${shifting.length !== 1 ? 's' : ''} left ←`,
          opType: 'delete',
        })
      }
      const newArr = [...arr.slice(0, mid), ...arr.slice(mid + 1)]
      steps.push({
        type: 'ARR_SHIFT', nodeValue: value, activeIndex: mid,
        arraySnapshot: newArr, shiftedValues: shifting,
        treeSnapshot: null, durationMultiplier: 1.5, opType: 'delete',
      })
      return { arr: newArr, steps, found: true }
    } else if (arr[mid] < value) lo = mid + 1
    else hi = mid - 1
  }

  const lastStep = steps[steps.length - 1]
  steps.push({
    type: 'ARR_NOT_FOUND', nodeValue: value,
    activeIndex: lastStep?.activeIndex ?? -1,
    arraySnapshot: [...arr], treeSnapshot: null, opType: 'delete',
  })
  return { arr, steps, found: false }
}

export function sortedArraySearch(
  arr: number[],
  value: number
): { steps: AnimationStep[] } {
  const steps: AnimationStep[] = []
  let lo = 0, hi = arr.length - 1

  while (lo <= hi) {
    const mid = (lo + hi) >> 1
    if (arr[mid] === value) {
      steps.push({
        type: 'ARR_FOUND', nodeValue: value, activeIndex: mid,
        arraySnapshot: [...arr], treeSnapshot: null, opType: 'search',
      })
      return { steps }
    }
    steps.push({
      type: 'ARR_COMPARE', nodeValue: arr[mid], activeIndex: mid,
      arraySnapshot: [...arr], treeSnapshot: null, opType: 'search',
    })
    if (arr[mid] < value) lo = mid + 1
    else hi = mid - 1
  }

  const lastStep = steps[steps.length - 1]
  steps.push({
    type: 'ARR_NOT_FOUND', nodeValue: value,
    activeIndex: lastStep?.activeIndex ?? -1,
    arraySnapshot: [...arr], treeSnapshot: null, opType: 'search',
  })
  return { steps }
}
