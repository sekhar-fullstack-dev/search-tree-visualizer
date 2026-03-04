# BST & AVL Tree Visualizer — Project Requirements

## Overview

Build an interactive, animated web-based visualizer that demonstrates **Binary Search Tree (BST)** and **AVL Tree** operations side by side. The goal is to make the differences between an unbalanced BST and a self-balancing AVL tree visually intuitive.

---

## Tech Stack

- **Framework**: React (Vite or CRA)
- **Styling**: Tailwind CSS
- **Animation**: CSS transitions + a canvas or SVG-based tree renderer
- **Language**: TypeScript preferred, JavaScript acceptable

---

## Core Features

### 1. Dual Tree View
- Display **BST** and **AVL Tree** side by side in split panels
- Both trees start empty and receive the **same operations** simultaneously
- This makes the structural difference between BST and AVL immediately visible

### 2. Operations Panel (shared input for both trees)
- **Insert**: Enter a number → animate insertion into both trees
- **Delete**: Enter a number → animate deletion from both trees
- **Search**: Enter a number → animate the search traversal in both trees

### 3. Animated Tree Rendering
- Render the tree using **SVG** (preferred) or Canvas
- Nodes are circles with the value displayed inside
- Edges are lines connecting parent to children
- On every operation, smoothly **animate**:
  - New node appearing (scale-in effect)
  - Deleted node disappearing (fade-out effect)
  - Search path highlighting (nodes glow/pulse as traversal visits them)
  - AVL rotations: nodes visually slide/shift into new positions

### 4. AVL Rotation Highlight
- When an AVL rotation occurs, clearly indicate:
  - Which rotation happened: `Left Rotation`, `Right Rotation`, `Left-Right Rotation`, `Right-Left Rotation`
  - Show a **toast/badge** or **side label** naming the rotation type
  - Animate the affected subtree nodes moving into their new positions

### 5. Node Color Coding
- **Default**: neutral color (e.g., slate/indigo)
- **Being inserted**: green highlight
- **Being deleted**: red highlight
- **Search path**: yellow/orange highlight as traversal visits each node
- **Search found**: bright green pulse
- **Search not found**: red shake on the last visited node
- **AVL rotation involved nodes**: purple/violet highlight

### 6. Tree Info Panel (per tree)
- Show live stats below or beside each tree:
  - **Height** of the tree
  - **Balance Factor** of the root (AVL only)
  - **Node count**
  - **Last operation** performed

---

## User Interaction

### Input Controls
- A single number input field (shared)
- Three buttons: `Insert`, `Delete`, `Search`
- Input should accept integers (positive and negative)
- Validate input — show error for non-numeric or duplicate insert

### Animation Speed
- A speed slider: `Slow | Medium | Fast`
- Controls the delay between animation steps

### Reset
- A `Reset` button that clears both trees back to empty state

### Preset Sequences
- A few preset buttons that auto-insert a sequence to demonstrate:
  - `Skewed BST` — insert values like 1, 2, 3, 4, 5 (worst case for BST)
  - `Balanced Example` — insert values like 5, 3, 7, 1, 4
  - `Rotation Demo` — insert values that trigger all four AVL rotation types

---

## Visual Layout

```
┌─────────────────────────────────────────────────────────┐
│              BST & AVL Tree Visualizer                  │
├────────────────────────┬────────────────────────────────┤
│  Controls Panel        │                                │
│  [Input] [Insert]      │                                │
│  [Delete] [Search]     │                                │
│  Speed: [───●───]      │                                │
│  [Reset] [Presets ▼]   │                                │
├────────────────────────┴────────────────────────────────┤
│         BST                    │        AVL Tree         │
│                                │                         │
│         [tree SVG]             │      [tree SVG]         │
│                                │                         │
│  Height: 4  Nodes: 6           │  Height: 3  Nodes: 6   │
│  Last: Inserted 5              │  Last: Right Rotation   │
└────────────────────────────────┴─────────────────────────┘
```

---

## Algorithm Requirements

### BST
- Standard BST insert (no balancing)
- Standard BST delete (three cases: leaf, one child, two children — use in-order successor)
- Iterative or recursive search with path tracking for animation

### AVL Tree
- All BST operations PLUS:
- Track **balance factor** = `height(left) - height(right)` at each node
- After every insert/delete, walk back up and rebalance using:
  - **Left Rotation** (Right-heavy, right child is right-heavy)
  - **Right Rotation** (Left-heavy, left child is left-heavy)
  - **Left-Right Rotation** (Left-heavy, left child is right-heavy)
  - **Right-Left Rotation** (Right-heavy, right child is left-heavy)
- Expose rotation events so the UI can animate and label them

---

## Animation Step System

Both trees should drive their UI via an **animation step queue**:
- Each operation (insert/delete/search) produces an ordered array of steps
- Each step describes: which node is active, what color to highlight, what label to show
- The UI plays through steps with a configurable delay (based on speed slider)
- This makes animation deterministic and easy to control

Example step types:
```ts
type StepType =
  | 'VISIT'         // traversing to this node during search/insert
  | 'INSERT'        // this node was just inserted
  | 'DELETE'        // this node is about to be deleted
  | 'FOUND'         // search found this node
  | 'NOT_FOUND'     // search ended, not found
  | 'ROTATE'        // AVL rotation at this node
  | 'REBALANCE'     // highlight nodes after rebalance
```

---

## Edge Cases to Handle

- Deleting a value that doesn't exist → show "Not found" toast
- Inserting a duplicate → show "Already exists" toast
- Searching an empty tree → show "Tree is empty" toast
- Very deep trees → SVG should scroll/zoom or scale to fit
- Large number of nodes (20+) → layout should not overlap nodes

---

## Nice-to-Have (Stretch Goals)

- **Step-through mode**: Instead of auto-playing, user clicks "Next Step" to advance one step at a time — great for learning
- **Traversal mode**: Buttons for In-order, Pre-order, Post-order traversal animation
- **Export**: Download the current tree as a PNG
- **History log**: A sidebar showing the last N operations with timestamps

---

## File Structure Suggestion

```
src/
├── components/
│   ├── TreeVisualizer.tsx       # Main layout, dual panel
│   ├── TreeCanvas.tsx           # SVG renderer for a single tree
│   ├── ControlPanel.tsx         # Input, buttons, speed slider
│   ├── InfoPanel.tsx            # Height, nodes, last op display
│   └── RotationBadge.tsx        # Toast/badge for AVL rotation name
├── algorithms/
│   ├── bst.ts                   # BST node, insert, delete, search → steps
│   └── avl.ts                   # AVL node, insert, delete, search, rotations → steps
├── hooks/
│   ├── useAnimationQueue.ts     # Plays through step arrays with delay
│   └── useTreeLayout.ts         # Computes x,y positions for SVG nodes
├── types/
│   └── tree.ts                  # Shared types: TreeNode, AnimationStep, etc.
└── App.tsx
```

---

## Deliverable

A fully working React app that runs with `npm install && npm run dev`, with no external backend needed — purely client-side.