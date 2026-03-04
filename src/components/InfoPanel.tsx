import React from 'react'
import { TreeInfo } from '../types/tree'

interface Props {
  info: TreeInfo
  isAVL?: boolean
}

export const InfoPanel: React.FC<Props> = ({ info, isAVL }) => (
  <div className="flex flex-wrap gap-x-6 gap-y-1 px-4 py-2 bg-gray-800 rounded-b-lg text-sm border-t border-gray-700">
    <span className="text-gray-400">
      Height: <span className="text-white font-semibold">{info.height}</span>
    </span>
    <span className="text-gray-400">
      Nodes: <span className="text-white font-semibold">{info.nodeCount}</span>
    </span>
    {isAVL && info.balanceFactor !== null && (
      <span className="text-gray-400">
        Balance: <span className="text-white font-semibold">{info.balanceFactor >= 0 ? '+' : ''}{info.balanceFactor}</span>
      </span>
    )}
    <span className="text-gray-400">
      Last: <span className="text-emerald-400 font-semibold">{info.lastOperation || '—'}</span>
    </span>
  </div>
)
