import React, { useRef, useLayoutEffect } from 'react'
import { TreeNode, AnimationStep, SPEED_MS, SpeedLevel } from '../types/tree'
import { useTreeLayout } from '../hooks/useTreeLayout'
import { LayoutNode } from '../types/tree'
import { RotationBadge } from './RotationBadge'

const NODE_R = 22

// ── Color coding ─────────────────────────────────────────────────────────────

type NodeColor = { fill: string; stroke: string; text: string }

const NEUTRAL: NodeColor = { fill: '#334155', stroke: '#64748b', text: '#e2e8f0' }

function getNodeColor(value: number, step: AnimationStep | null): NodeColor {
  if (!step) return NEUTRAL

  // Primary: this node is the main focus of the step
  if (step.nodeValue === value) {
    switch (step.type) {
      case 'INSERT':    return { fill: '#166534', stroke: '#4ade80', text: '#bbf7d0' }
      case 'DELETE':    return { fill: '#7f1d1d', stroke: '#f87171', text: '#fecaca' }
      case 'FOUND':     return { fill: '#14532d', stroke: '#22c55e', text: '#bbf7d0' }
      case 'NOT_FOUND': return { fill: '#7f1d1d', stroke: '#ef4444', text: '#fecaca' }
      case 'VISIT':     return { fill: '#713f12', stroke: '#facc15', text: '#fef9c3' }
      case 'ROTATE':    return { fill: '#4c1d95', stroke: '#a78bfa', text: '#ede9fe' }
      case 'REBALANCE': return { fill: '#1e1b4b', stroke: '#818cf8', text: '#e0e7ff' }
    }
  }

  // Secondary: this node is involved in the rotation (but not the pivot)
  if (step.involvedNodes?.includes(value)) {
    if (step.type === 'ROTATE')    return { fill: '#3b0764', stroke: '#c084fc', text: '#f3e8ff' }
    if (step.type === 'REBALANCE') return { fill: '#1e1b4b', stroke: '#6366f1', text: '#e0e7ff' }
  }

  return NEUTRAL
}

function shouldPulse(value: number, step: AnimationStep | null): boolean {
  if (!step) return false
  return (
    step.nodeValue === value &&
    (step.type === 'VISIT' || step.type === 'FOUND' || step.type === 'ROTATE' || step.type === 'REBALANCE')
  ) || (
    (step.type === 'ROTATE' || step.type === 'REBALANCE') &&
    (step.involvedNodes?.includes(value) ?? false)
  )
}

function shouldShake(value: number, step: AnimationStep | null): boolean {
  return step?.type === 'NOT_FOUND' && step.nodeValue === value
}

// ── Flying node — animates from parent position to insertion point ─────────────

interface FlyingNodeProps {
  value: number
  layoutNodes: LayoutNode[]
  width: number
  speedMs: number
}

const FlyingNode: React.FC<FlyingNodeProps> = ({ value, layoutNodes, width, speedMs }) => {
  const gRef = useRef<SVGGElement>(null)

  const nodeLayout = layoutNodes.find(n => n.value === value)
  const targetX = nodeLayout?.x ?? width / 2
  const targetY = nodeLayout?.y ?? NODE_R + 10
  const startX  = nodeLayout?.parentX ?? width / 2
  const startY  = nodeLayout?.parentY ?? -NODE_R * 2

  useLayoutEffect(() => {
    const g = gRef.current
    if (!g) return
    // Snap to start instantly (no transition)
    g.style.transition = 'none'
    g.style.transform  = `translate(${startX}px, ${startY}px)`
    g.style.opacity    = '1'
    // Force browser to paint the start position before starting the transition
    void g.getBoundingClientRect()
    // Fly to target with spring curve
    const dur = Math.max(120, Math.round(speedMs * 0.82))
    g.style.transition = `transform ${dur}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
    g.style.transform  = `translate(${targetX}px, ${targetY}px)`
  }, [startX, startY, targetX, targetY, speedMs])

  const fontSize = value > 99 || value < -9 ? 10 : 13

  return (
    <g ref={gRef} style={{ opacity: 0 }}>
      <circle r={NODE_R} fill="#166534" stroke="#4ade80" strokeWidth={2.5} />
      <text textAnchor="middle" dominantBaseline="central" fontSize={fontSize} fontWeight="600" fill="#bbf7d0">
        {value}
      </text>
    </g>
  )
}

// ── Main canvas ───────────────────────────────────────────────────────────────

interface Props {
  root: TreeNode | null
  activeStep: AnimationStep | null
  speed: SpeedLevel
  width?: number
}

export const TreeCanvas: React.FC<Props> = ({ root, activeStep, speed, width = 500 }) => {
  const displayRoot   = activeStep?.treeSnapshot ?? root
  const layoutNodes   = useTreeLayout(displayRoot, width)

  const svgHeight = layoutNodes.length === 0
    ? 200
    : Math.max(...layoutNodes.map(n => n.y)) + NODE_R + 20

  const isInsertStep   = activeStep?.type === 'INSERT'
  const isRotateStep   = activeStep?.type === 'ROTATE'
  const isRebalanceStep= activeStep?.type === 'REBALANCE'
  const newNodeValue   = isInsertStep ? activeStep.nodeValue : null
  const rotationLabel  = (isRotateStep || isRebalanceStep) ? (activeStep.label ?? null) : null
  const speedMs        = SPEED_MS[speed]

  // Duration for the CSS position transition on rotating nodes
  // We want it slightly shorter than the step duration so the slide finishes before the next step
  const rotateDurMs = Math.max(600, Math.round(speedMs * 2.5 * 0.82))

  return (
    <div className="relative flex-1 overflow-auto bg-gray-900 rounded-t-lg">
      <RotationBadge label={rotationLabel} />

      {layoutNodes.length === 0 ? (
        <div className="flex items-center justify-center h-full min-h-[160px] text-gray-600 text-sm select-none">
          Empty tree
        </div>
      ) : (
        <svg
          width={width}
          height={svgHeight}
          className="w-full"
          viewBox={`0 0 ${width} ${svgHeight}`}
          preserveAspectRatio="xMidYMin meet"
        >
          {/* ── Edges ──
              Keyed by child value (stable) so React reuses the element.
              Fade to near-invisible during rotation so the sliding nodes are
              the visual focus; fade back in once rotation completes.        */}
          {layoutNodes.map(node =>
            node.parentX !== undefined && node.parentY !== undefined ? (
              <line
                key={`edge-${node.value}`}
                x1={node.parentX} y1={node.parentY}
                x2={node.x}       y2={node.y}
                stroke="#475569"
                strokeWidth={1.5}
                style={{
                  opacity:    isRotateStep ? 0.1 : 1,
                  transition: isRotateStep
                    ? 'opacity 200ms ease'
                    : 'opacity 400ms ease',
                }}
              />
            ) : null
          )}

          {/* ── Nodes ──
              Key = `node-${value}` only (NOT including position) so React
              reuses the same DOM element when the node moves.  Using CSS
              `transform` (not SVG `transform` attribute) lets the browser
              interpolate position changes with a CSS transition.

              During INSERT step: hide the new node (FlyingNode shows it).
              During ROTATE/REBALANCE: all nodes CSS-transition to new positions. */}
          {layoutNodes.map(node => {
            const isNewNode   = node.value === newNodeValue
            const isActive    = activeStep?.nodeValue === node.value
            const color       = getNodeColor(node.value, activeStep)
            const pulse       = shouldPulse(node.value, activeStep)
            const shake       = shouldShake(node.value, activeStep)
            const fontSize    = node.value > 99 || node.value < -9 ? 10 : 13

            // During ROTATE/REBALANCE: apply a position transition so nodes
            // slide smoothly from their previous positions to the new ones.
            // `transition: transform 0ms` for other steps = instant snap (no jump artefacts).
            const posTransition = (isRotateStep || isRebalanceStep)
              ? `transform ${rotateDurMs}ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease`
              : 'transform 0ms'

            return (
              <g
                key={`node-${node.value}`}
                style={{
                  transform:       `translate(${node.x}px, ${node.y}px)`,
                  transition:       posTransition,
                  transformBox:    'fill-box' as React.CSSProperties['transformBox'],
                  transformOrigin: 'center',
                  opacity:          isNewNode ? 0 : 1,
                }}
                className={pulse ? 'node-pulse' : shake ? 'node-shake' : ''}
              >
                <circle
                  r={NODE_R}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={fontSize}
                  fontWeight="600"
                  fill={color.text}
                >
                  {node.value}
                </text>
              </g>
            )
          })}

          {/* Flying node — only during INSERT step */}
          {isInsertStep && newNodeValue !== null && (
            <FlyingNode
              key={`fly-${newNodeValue}`}
              value={newNodeValue}
              layoutNodes={layoutNodes}
              width={width}
              speedMs={speedMs}
            />
          )}
        </svg>
      )}
    </div>
  )
}
