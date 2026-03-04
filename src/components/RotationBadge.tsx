import React from 'react'

interface Props {
  label: string | null
}

const ROTATION_COLORS: Record<string, string> = {
  'Left Rotation':       'bg-violet-700 border-violet-400',
  'Right Rotation':      'bg-purple-700 border-purple-400',
  'Left-Right Rotation': 'bg-fuchsia-700 border-fuchsia-400',
  'Right-Left Rotation': 'bg-indigo-700 border-indigo-400',
}

export const RotationBadge: React.FC<Props> = ({ label }) => {
  if (!label) return null
  const color = ROTATION_COLORS[label] ?? 'bg-violet-700 border-violet-400'

  return (
    <div
      className={`toast-slide-in absolute top-2 left-1/2 -translate-x-1/2 z-10
        px-3 py-1 rounded-full border text-xs font-bold tracking-wide shadow-lg
        text-white ${color}`}
    >
      ↺ {label}
    </div>
  )
}
