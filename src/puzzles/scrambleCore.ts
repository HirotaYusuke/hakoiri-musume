import type {
  BoardSize,
  Direction,
  Piece,
  PiecePlacement,
  Puzzle,
  PuzzleDifficulty,
  PuzzleState,
  SolutionStep,
} from '../domain'
import {
  canMove,
  createInitialState,
  getMaxMoveSteps,
  getShapeAllowedDirections,
  isCleared,
  movePiece,
} from '../domain/engine'

/** 標準長方形セットの盤・ゴール（`catalog.ts` と同一仕様）。 */
export const rectangularBoard = { width: 4, height: 5 } as const

export const rectangularMusume: Piece = {
  id: 'musume',
  name: '赤いターゲット',
  width: 1,
  height: 2,
  kind: 'goal',
}

export const rectangularPieces: readonly Piece[] = [
  rectangularMusume,
  { id: 'leftGuard', name: '左番', width: 1, height: 2, kind: 'vertical' },
  { id: 'rightGuard', name: '右番', width: 1, height: 2, kind: 'vertical' },
  { id: 'leftGate', name: '左門', width: 1, height: 2, kind: 'vertical' },
  { id: 'rightGate', name: '右門', width: 1, height: 2, kind: 'vertical' },
  { id: 'topBeam', name: '上梁', width: 2, height: 1, kind: 'horizontal' },
  { id: 'middleBeam', name: '中梁', width: 2, height: 1, kind: 'small' },
  { id: 'bottomBeam', name: '下梁', width: 2, height: 1, kind: 'horizontal' },
]

export const rectangularGoalPlacement = { pieceId: 'musume' as const, x: 1, y: 3 }

export const rectangularSolvedPlacements: readonly PiecePlacement[] = [
  { pieceId: 'leftGuard', x: 0, y: 0 },
  { pieceId: 'rightGuard', x: 3, y: 0 },
  { pieceId: 'leftGate', x: 0, y: 2 },
  { pieceId: 'rightGate', x: 3, y: 2 },
  { pieceId: 'topBeam', x: 1, y: 0 },
  { pieceId: 'middleBeam', x: 1, y: 1 },
  { pieceId: 'bottomBeam', x: 2, y: 4 },
  rectangularGoalPlacement,
]

export const expandedBoard = { width: 5, height: 6 } as const

export const expandedGoalPlacement = { pieceId: 'musume' as const, x: 2, y: 4 }

export const expandedPieces: readonly Piece[] = [
  rectangularMusume,
  { id: 'leftGuard', name: '左長番', width: 1, height: 3, kind: 'vertical' },
  { id: 'rightGuard', name: '右長番', width: 1, height: 3, kind: 'vertical' },
  { id: 'leftGate', name: '左門', width: 1, height: 2, kind: 'vertical' },
  { id: 'rightGate', name: '右門', width: 1, height: 2, kind: 'vertical' },
  { id: 'sidePillar', name: '脇柱', width: 1, height: 2, kind: 'vertical' },
  { id: 'topBeam', name: '上梁', width: 3, height: 1, kind: 'horizontal' },
  { id: 'middleBeam', name: '中梁', width: 2, height: 1, kind: 'horizontal' },
  { id: 'crossBeam', name: '横梁', width: 2, height: 1, kind: 'horizontal' },
  { id: 'bottomBeam', name: '下梁', width: 2, height: 1, kind: 'horizontal' },
]

export const expandedSolvedPlacements: readonly PiecePlacement[] = [
  { pieceId: 'leftGuard', x: 0, y: 0 },
  { pieceId: 'rightGuard', x: 4, y: 0 },
  { pieceId: 'leftGate', x: 0, y: 3 },
  { pieceId: 'rightGate', x: 4, y: 3 },
  { pieceId: 'sidePillar', x: 3, y: 2 },
  { pieceId: 'topBeam', x: 1, y: 0 },
  { pieceId: 'middleBeam', x: 1, y: 1 },
  { pieceId: 'crossBeam', x: 1, y: 2 },
  { pieceId: 'bottomBeam', x: 3, y: 5 },
  expandedGoalPlacement,
]

export const gauntletBoard = { width: 6, height: 8 } as const

export const gauntletGoalPlacement = { pieceId: 'musume' as const, x: 2, y: 6 }

export const gauntletPieces: readonly Piece[] = [
  rectangularMusume,
  { id: 'leftGuard', name: '左長番', width: 1, height: 3, kind: 'vertical' },
  { id: 'rightGuard', name: '右長番', width: 1, height: 3, kind: 'vertical' },
  { id: 'leftGate', name: '左門', width: 1, height: 2, kind: 'vertical' },
  { id: 'rightGate', name: '右門', width: 1, height: 2, kind: 'vertical' },
  { id: 'lowerLeftGate', name: '左下門', width: 1, height: 3, kind: 'vertical' },
  { id: 'lowerRightGate', name: '右下門', width: 1, height: 3, kind: 'vertical' },
  { id: 'topBeam', name: '上梁', width: 2, height: 1, kind: 'horizontal' },
  { id: 'blocker2', name: '二段梁', width: 2, height: 1, kind: 'horizontal' },
  { id: 'blocker3', name: '三段梁', width: 2, height: 1, kind: 'horizontal' },
  { id: 'blocker4', name: '四段梁', width: 2, height: 1, kind: 'horizontal' },
  { id: 'blocker5', name: '五段梁', width: 2, height: 1, kind: 'horizontal' },
  { id: 'blocker6', name: '六段梁', width: 2, height: 1, kind: 'horizontal' },
  { id: 'bottomBeam', name: '下梁', width: 2, height: 1, kind: 'horizontal' },
]

export const gauntletSolvedPlacements: readonly PiecePlacement[] = [
  { pieceId: 'leftGuard', x: 0, y: 0 },
  { pieceId: 'rightGuard', x: 5, y: 0 },
  { pieceId: 'leftGate', x: 0, y: 3 },
  { pieceId: 'rightGate', x: 5, y: 3 },
  { pieceId: 'lowerLeftGate', x: 0, y: 5 },
  { pieceId: 'lowerRightGate', x: 5, y: 5 },
  { pieceId: 'topBeam', x: 3, y: 0 },
  { pieceId: 'blocker2', x: 3, y: 2 },
  { pieceId: 'blocker3', x: 3, y: 3 },
  { pieceId: 'blocker4', x: 3, y: 4 },
  { pieceId: 'blocker5', x: 3, y: 5 },
  { pieceId: 'blocker6', x: 3, y: 6 },
  { pieceId: 'bottomBeam', x: 3, y: 7 },
  gauntletGoalPlacement,
]

export const rushHourBoard = { width: 6, height: 6 } as const

export const rushHourGoalPlacement = { pieceId: 'musume' as const, x: 4, y: 2 }

export const rushHourPieces: readonly Piece[] = [
  { id: 'musume', name: '赤いターゲット', width: 2, height: 1, kind: 'goal' },
  { id: 'v1', name: '縦一', width: 1, height: 3, kind: 'vertical' },
  { id: 'v2', name: '縦二', width: 1, height: 3, kind: 'vertical' },
  { id: 'v3', name: '縦三', width: 1, height: 2, kind: 'vertical' },
  { id: 'v4', name: '縦四', width: 1, height: 2, kind: 'vertical' },
  { id: 'v5', name: '縦五', width: 1, height: 2, kind: 'vertical' },
  { id: 'h1', name: '横一', width: 3, height: 1, kind: 'horizontal' },
  { id: 'h2', name: '横二', width: 2, height: 1, kind: 'horizontal' },
  { id: 'h3', name: '横三', width: 2, height: 1, kind: 'horizontal' },
]

export const rushHourSolvedPlacements: readonly PiecePlacement[] = [
  rushHourGoalPlacement,
  { pieceId: 'v1', x: 0, y: 0 },
  { pieceId: 'v2', x: 5, y: 3 },
  { pieceId: 'v3', x: 1, y: 0 },
  { pieceId: 'v4', x: 3, y: 3 },
  { pieceId: 'v5', x: 1, y: 4 },
  { pieceId: 'h1', x: 2, y: 1 },
  { pieceId: 'h2', x: 0, y: 3 },
  { pieceId: 'h3', x: 3, y: 5 },
]

type RushGraphEdge = {
  readonly to: string
  readonly step: SolutionStep
}

type RushGraphNode = {
  readonly placements: readonly PiecePlacement[]
  readonly edges: RushGraphEdge[]
}

type RushGraph = {
  readonly nodes: ReadonlyMap<string, RushGraphNode>
  readonly distanceToExit: ReadonlyMap<string, number>
  readonly nextStepToExit: ReadonlyMap<string, RushGraphEdge>
  readonly exitStepByKey: ReadonlyMap<string, SolutionStep>
}

const rushPuzzleTemplate: Puzzle = {
  id: 'rush-hour-template',
  title: '',
  description: '',
  difficulty: 'hard',
  board: rushHourBoard,
  goal: rushHourGoalPlacement,
  pieces: rushHourPieces,
  initialPlacements: rushHourSolvedPlacements,
  sampleSolution: [],
}

function createRushGraph(actionMode: 'unit' | 'slide'): RushGraph {
  const startKey = placementLayoutSignature(rushHourSolvedPlacements)
  const nodes = new Map<string, RushGraphNode>([
    [
      startKey,
      {
        placements: rushHourSolvedPlacements.map((placement) => ({ ...placement })),
        edges: [],
      },
    ],
  ])
  const queue = [startKey]
  let head = 0

  while (head < queue.length) {
    const key = queue[head++]!
    const node = nodes.get(key)!
    const state: PuzzleState = {
      puzzle: rushPuzzleTemplate,
      placements: node.placements.map((placement) => ({ ...placement })),
      history: [],
    }

    for (const piece of rushHourPieces) {
      for (const direction of getShapeAllowedDirections(piece)) {
        const maxSteps =
          actionMode === 'unit'
            ? canMove(state, { pieceId: piece.id, direction })
              ? 1
              : 0
            : getMaxMoveSteps(state, { pieceId: piece.id, direction })

        for (let steps = 1; steps <= maxSteps; steps++) {
          let nextState = state

          for (let i = 0; i < steps; i++) {
            nextState = movePiece(nextState, { pieceId: piece.id, direction })
          }

          if (isCleared(nextState)) {
            continue
          }

          const nextKey = placementLayoutSignature(nextState.placements)
          node.edges.push({ to: nextKey, step: { pieceId: piece.id, direction } })

          if (!nodes.has(nextKey)) {
            nodes.set(nextKey, {
              placements: nextState.placements.map((placement) => ({ ...placement })),
              edges: [],
            })
            queue.push(nextKey)
          }
        }
      }
    }
  }

  const reverseEdges = new Map<string, RushGraphEdge[]>()
  const exitStepByKey = new Map<string, SolutionStep>()

  for (const [from, node] of nodes) {
    for (const edge of node.edges) {
      const reverse = reverseEdges.get(edge.to) ?? []
      reverse.push({ to: from, step: edge.step })
      reverseEdges.set(edge.to, reverse)
    }

    const state: PuzzleState = {
      puzzle: rushPuzzleTemplate,
      placements: node.placements.map((placement) => ({ ...placement })),
      history: [],
    }
    const maxExitSteps =
      actionMode === 'unit'
        ? canMove(state, { pieceId: 'musume', direction: 'right' })
          ? 1
          : 0
        : getMaxMoveSteps(state, { pieceId: 'musume', direction: 'right' })

    for (let steps = 1; steps <= maxExitSteps; steps++) {
      let nextState = state

      for (let i = 0; i < steps; i++) {
        nextState = movePiece(nextState, { pieceId: 'musume', direction: 'right' })
      }

      if (isCleared(nextState)) {
        exitStepByKey.set(from, { pieceId: 'musume', direction: 'right' })
        break
      }
    }
  }

  const distanceToExit = new Map<string, number>()
  const nextStepToExit = new Map<string, RushGraphEdge>()
  const exitQueue = [...exitStepByKey.keys()]
  head = 0

  for (const key of exitQueue) {
    distanceToExit.set(key, 1)
  }

  while (head < exitQueue.length) {
    const key = exitQueue[head++]!
    const distance = distanceToExit.get(key)!

    for (const reverse of reverseEdges.get(key) ?? []) {
      if (distanceToExit.has(reverse.to)) {
        continue
      }

      distanceToExit.set(reverse.to, distance + 1)
      nextStepToExit.set(reverse.to, { to: key, step: reverse.step })
      exitQueue.push(reverse.to)
    }
  }

  return { nodes, distanceToExit, nextStepToExit, exitStepByKey }
}

function createRushSolution(graph: RushGraph, startKey: string): readonly SolutionStep[] {
  const solution: SolutionStep[] = []
  let currentKey = startKey

  while (!graph.exitStepByKey.has(currentKey)) {
    const next = graph.nextStepToExit.get(currentKey)

    if (!next) {
      throw new Error(`rushHour: solution path is missing for ${startKey}`)
    }

    solution.push(next.step)
    currentKey = next.to
  }

  return solution
}

const rushDifficultyTargets = [
  [8, 4],
  [8, 4],
  [8, 4],
  [8, 5],
  [8, 5],
  [9, 5],
  [9, 5],
  [9, 5],
  [9, 5],
  [10, 5],
  [10, 5],
  [10, 5],
  [10, 5],
  [10, 6],
  [10, 6],
  [10, 6],
  [10, 6],
  [11, 6],
  [11, 6],
  [11, 6],
  [11, 6],
  [11, 6],
  [12, 6],
  [12, 6],
  [12, 6],
  [12, 6],
  [12, 6],
  [13, 6],
  [13, 6],
  [13, 6],
  [13, 6],
  [14, 6],
  [14, 6],
  [14, 6],
  [15, 8],
  [15, 8],
] as const

const rushHourFixedSpecs = [
  ['rush-hard-1', 'musume:0,2 v1:0,3 v2:5,2 v3:1,0 v4:3,4 v5:1,4 h1:2,1 h2:1,3 h3:4,5', 'v4U h3L musumeR v2D musumeR musumeR musumeR'],
  ['rush-hard-2', 'musume:2,2 v1:0,2 v2:5,0 v3:1,0 v4:3,4 v5:1,4 h1:2,1 h2:1,3 h3:4,5', 'v4U h3L v2D v2D v2D musumeR musumeR'],
  ['rush-hard-3', 'musume:2,2 v1:0,2 v2:5,0 v3:1,1 v4:3,3 v5:1,3 h1:2,1 h2:4,3 h3:0,5', 'musumeR v4D h2L v2D v2D v2D musumeR'],
  ['rush-hard-4', 'musume:2,2 v1:0,2 v2:5,2 v3:1,0 v4:3,4 v5:1,4 h1:3,1 h2:3,3 h3:4,5', 'h2L h2L v4U h3L v2D musumeR musumeR'],
  ['rush-hard-5', 'musume:3,2 v1:0,0 v2:5,0 v3:1,0 v4:3,4 v5:1,4 h1:2,1 h2:2,3 h3:4,5', 'h2L v4U h3L v2D v2D v2D musumeR'],
  ['rush-hard-6', 'musume:3,2 v1:0,2 v2:5,0 v3:1,0 v4:3,4 v5:1,4 h1:2,1 h2:3,3 h3:4,5', 'h2L h2L v4U h3L v2D v2D v2D musumeR'],
  ['rush-hard-7', 'musume:3,2 v1:0,0 v2:5,0 v3:1,0 v4:3,3 v5:1,3 h1:2,1 h2:4,3 h3:3,5', 'h3L h3L v4D h2L v2D v2D v2D musumeR'],
  ['rush-hard-8', 'musume:0,2 v1:0,3 v2:5,2 v3:1,0 v4:3,4 v5:1,4 h1:2,1 h2:2,3 h3:4,5', 'h2L v4U h3L musumeR v2D musumeR musumeR musumeR'],
  ['rush-hard-9', 'musume:2,2 v1:0,0 v2:5,1 v3:1,0 v4:3,4 v5:1,4 h1:2,1 h2:3,3 h3:4,5', 'h2L h2L v4U h3L v2D v2D musumeR musumeR'],
  ['rush-hard-10', 'musume:2,2 v1:0,2 v2:5,0 v3:1,1 v4:3,3 v5:1,3 h1:2,1 h2:4,3 h3:3,5', 'musumeR h3L h3L v4D h2L v2D v2D v2D musumeR'],
  ['rush-hard-11', 'musume:3,2 v1:0,2 v2:5,0 v3:1,0 v4:3,3 v5:1,3 h1:2,1 h2:4,3 h3:4,5', 'h3L h3L h3L v4D h2L v2D v2D v2D musumeR'],
  ['rush-hard-12', 'musume:0,2 v1:0,3 v2:5,2 v3:1,0 v4:3,4 v5:1,4 h1:2,1 h2:3,3 h3:4,5', 'h2L h2L v4U h3L musumeR v2D musumeR musumeR musumeR'],
  ['rush-hard-13', 'musume:1,2 v1:0,1 v2:5,0 v3:1,0 v4:3,3 v5:1,3 h1:2,1 h2:4,3 h3:2,5', 'musumeR musumeR h3L v4D h2L v2D v2D v2D musumeR'],
  ['rush-hard-14', 'musume:3,2 v1:0,2 v2:5,0 v3:1,1 v4:3,4 v5:1,3 h1:2,1 h2:3,3 h3:4,5', 'h2L v5D h2L v4U h3L v2D v2D v2D musumeR'],
  ['rush-hard-15', 'musume:0,2 v1:0,3 v2:5,2 v3:1,0 v4:3,4 v5:1,3 h1:3,1 h2:2,3 h3:4,5', 'v5D h2L v4U h3L musumeR v2D musumeR musumeR musumeR'],
  ['rush-hard-16', 'musume:2,2 v1:0,2 v2:5,0 v3:1,1 v4:3,4 v5:1,3 h1:2,1 h2:2,3 h3:4,5', 'v5D h2L v4U h3L v2D v2D v2D musumeR musumeR'],
  ['rush-hard-17', 'musume:2,2 v1:0,2 v2:5,1 v3:1,0 v4:3,4 v5:1,3 h1:2,1 h2:3,3 h3:4,5', 'h2L v5D h2L v4U h3L v2D v2D musumeR musumeR'],
  ['rush-hard-18', 'musume:3,2 v1:0,0 v2:5,0 v3:1,1 v4:3,4 v5:1,3 h1:2,1 h2:4,3 h3:4,5', 'h2L h2L v5D h2L v4U h3L v2D v2D v2D musumeR'],
  ['rush-hard-19', 'musume:3,2 v1:0,3 v2:5,0 v3:1,2 v4:3,4 v5:1,4 h1:2,1 h2:4,3 h3:4,5', 'h2L h2L v3U h2L v4U h3L v2D v2D v2D musumeR'],
  ['rush-hard-20', 'musume:2,2 v1:0,0 v2:5,1 v3:1,0 v4:3,4 v5:1,2 h1:2,1 h2:3,3 h3:4,5', 'h2L v5D v5D h2L v4U h3L v2D v2D musumeR musumeR'],
  ['rush-hard-21', 'musume:1,2 v1:0,2 v2:5,0 v3:1,0 v4:3,3 v5:1,4 h1:2,1 h2:4,3 h3:2,5', 'musumeR musumeR v5U h3L v4D h2L v2D v2D v2D musumeR'],
  ['rush-hard-22', 'musume:3,2 v1:0,1 v2:5,0 v3:1,1 v4:3,4 v5:1,3 h1:2,1 h2:4,3 h3:4,5', 'h2L h2L v5D h2L v4U h3L v2D v2D v2D musumeR'],
  ['rush-hard-23', 'musume:1,2 v1:0,0 v2:5,0 v3:1,0 v4:3,4 v5:1,3 h1:2,1 h2:3,3 h3:4,5', 'h2L v5D h2L v4U h3L v2D v2D v2D musumeR musumeR musumeR'],
  ['rush-hard-24', 'musume:1,2 v1:0,0 v2:5,0 v3:1,0 v4:3,3 v5:1,4 h1:2,1 h2:4,3 h3:3,5', 'musumeR musumeR v5U h3L h3L v4D h2L v2D v2D v2D musumeR'],
  ['rush-hard-25', 'musume:2,2 v1:0,1 v2:5,0 v3:1,0 v4:3,4 v5:1,2 h1:2,1 h2:4,3 h3:4,5', 'musumeR v4U h3L h3L h3L v4D h2L v2D v2D v2D musumeR'],
  ['rush-hard-26', 'musume:2,2 v1:0,3 v2:5,0 v3:1,0 v4:3,4 v5:1,2 h1:2,1 h2:4,3 h3:4,5', 'musumeR v4U h3L h3L h3L v4D h2L v2D v2D v2D musumeR'],
  ['rush-hard-27', 'musume:2,2 v1:0,0 v2:5,0 v3:1,0 v4:3,4 v5:1,2 h1:2,1 h2:3,3 h3:4,5', 'h2L v5D v5D h2L v4U h3L v2D v2D v2D musumeR musumeR'],
  ['rush-hard-28', 'musume:1,2 v1:0,3 v2:5,0 v3:1,0 v4:3,2 v5:1,4 h1:2,1 h2:4,3 h3:3,5', 'v4D musumeR musumeR v5U h3L h3L v4D h2L v2D v2D v2D musumeR'],
  ['rush-hard-29', 'musume:1,2 v1:0,1 v2:5,0 v3:1,0 v4:3,4 v5:1,3 h1:2,1 h2:4,3 h3:4,5', 'h2L h2L v5D h2L v4U h3L v2D v2D v2D musumeR musumeR musumeR'],
  ['rush-hard-30', 'musume:1,2 v1:0,3 v2:5,0 v3:1,0 v4:3,4 v5:1,3 h1:2,1 h2:4,3 h3:4,5', 'h2L h2L v5D h2L v4U h3L v2D v2D v2D musumeR musumeR musumeR'],
  ['rush-hard-31', 'musume:0,2 v1:0,3 v2:5,0 v3:1,0 v4:3,3 v5:1,4 h1:2,1 h2:4,3 h3:3,5', 'musumeR musumeR musumeR v5U h3L h3L v4D h2L v2D v2D v2D musumeR'],
  ['rush-hard-32', 'musume:1,2 v1:0,0 v2:5,0 v3:1,0 v4:3,2 v5:1,4 h1:2,1 h2:4,3 h3:4,5', 'v4D v4D h2L h2L h2L v4U h3L v2D v2D v2D musumeR musumeR musumeR'],
  ['rush-hard-33', 'musume:1,2 v1:0,2 v2:5,0 v3:1,0 v4:3,2 v5:1,4 h1:2,1 h2:4,3 h3:4,5', 'v4D v4D h2L h2L h2L v4U h3L v2D v2D v2D musumeR musumeR musumeR'],
  ['rush-hard-34', 'musume:0,2 v1:0,3 v2:5,0 v3:1,0 v4:3,2 v5:1,4 h1:2,1 h2:4,3 h3:3,5', 'v4D musumeR musumeR musumeR v5U h3L h3L v4D h2L v2D v2D v2D musumeR'],
  ['rush-hard-35', 'musume:2,2 v1:0,2 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:0,1 h2:4,3 h3:4,5', 'v4D h2L h2L h1R h1R v3U h2L v4U h3L v2D v2D v2D musumeR musumeR'],
  ['rush-hard-36', 'musume:2,2 v1:0,3 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:0,1 h2:4,3 h3:4,5', 'v4D h2L h2L h1R h1R v3U h2L v4U h3L v2D v2D v2D musumeR musumeR'],
] as const

const compactDirections: Record<string, Direction> = {
  U: 'up',
  D: 'down',
  L: 'left',
  R: 'right',
}

function parseRushPlacements(value: string): readonly PiecePlacement[] {
  return value.split(' ').map((entry) => {
    const [pieceId, coordinate] = entry.split(':')
    const [x, y] = coordinate!.split(',').map(Number)

    return { pieceId: pieceId!, x: x!, y: y! }
  })
}

function parseRushSolution(value: string): readonly SolutionStep[] {
  return value.split(' ').map((entry) => {
    const directionKey = entry.at(-1)!
    const pieceId = entry.slice(0, -1)

    return { pieceId, direction: compactDirections[directionKey]! }
  })
}

export function createRushHourHardPuzzles(): readonly Puzzle[] {
  return rushHourFixedSpecs.map(([id, placements, solution]) => ({
    id,
    title: '',
    description: '',
    difficulty: 'hard',
    board: rushHourBoard,
    goal: rushHourGoalPlacement,
    pieces: rushHourPieces,
    initialPlacements: parseRushPlacements(placements),
    sampleSolution: parseRushSolution(solution),
  }))
}

export function createGeneratedRushHourHardPuzzles(): readonly Puzzle[] {
  const unitGraph = createRushGraph('unit')
  const slideGraph = createRushGraph('slide')
  const used = new Set<string>()

  return rushDifficultyTargets.map(([unitDistance, slideDistance], index) => {
    const candidates = [...unitGraph.nodes.entries()]
      .filter(([key]) => {
        if (used.has(key)) {
          return false
        }

        return (
          unitGraph.distanceToExit.get(key) === unitDistance &&
          slideGraph.distanceToExit.get(key) === slideDistance
        )
      })
      .toSorted(([a], [b]) => a.localeCompare(b))

    if (candidates.length === 0) {
      throw new Error(`rushHour: no candidate for unit=${unitDistance}, slide=${slideDistance}`)
    }

    const pick = candidates[Math.floor((candidates.length * (index * 37 + 17)) / 137) % candidates.length]!
    const [key, node] = pick
    used.add(key)

    return {
      id: `rush-hard-${index + 1}`,
      title: '',
      description: '',
      difficulty: 'hard',
      board: rushHourBoard,
      goal: rushHourGoalPlacement,
      pieces: rushHourPieces,
      initialPlacements: node.placements.map((placement) => ({ ...placement })),
      sampleSolution: createRushSolution(unitGraph, key),
    }
  })
}

const oppositeDirections: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function scrambleEntropy(puzzleId: string, seed: number): number {
  let h = seed >>> 0

  for (let i = 0; i < puzzleId.length; i++) {
    h = (Math.imul(31, h) + puzzleId.charCodeAt(i)) >>> 0
  }

  return h
}

export function randomValidScrambleFromSolved(
  puzzleId: string,
  board: BoardSize,
  pieces: readonly Piece[],
  solvedPlacements: readonly PiecePlacement[],
  goalPlacement: PiecePlacement,
  length: number,
  seed: number,
): readonly SolutionStep[] {
  const template: Puzzle = {
    id: puzzleId,
    title: '',
    description: '',
    difficulty: 'intro',
    board,
    goal: goalPlacement,
    pieces,
    initialPlacements: solvedPlacements.map((p) => ({ ...p })),
    sampleSolution: [],
  }
  let state = createInitialState(template)
  const scramble: SolutionStep[] = []
  const rand = mulberry32(scrambleEntropy(puzzleId, seed))

  for (let i = 0; i < length; i++) {
    const candidates: SolutionStep[] = []

    for (const piece of pieces) {
      for (const direction of getShapeAllowedDirections(piece)) {
        const move: SolutionStep = { pieceId: piece.id, direction }

        if (canMove(state, move)) {
          const nextState = movePiece(state, move)

          if (isCleared(nextState)) {
            continue
          }

          candidates.push(move)
        }
      }
    }

    if (candidates.length === 0) {
      throw new Error(`scrambleCore ${puzzleId}: scramble dead-end at step ${i + 1} (seed=${seed})`)
    }

    const pick = candidates[Math.floor(rand() * candidates.length)]!
    scramble.push(pick)
    state = movePiece(state, pick)
  }

  return scramble
}

export const reverseScrambleToSolutionSteps = (scramble: readonly SolutionStep[]): readonly SolutionStep[] =>
  [...scramble].reverse().map(({ pieceId, direction }) => ({
    pieceId,
    direction: oppositeDirections[direction],
  }))

export function placementsAfterScramble(
  puzzleId: string,
  board: BoardSize,
  pieces: readonly Piece[],
  solvedPlacements: readonly PiecePlacement[],
  goalPlacement: PiecePlacement,
  scramble: readonly SolutionStep[],
): readonly PiecePlacement[] {
  const template: Puzzle = {
    id: puzzleId,
    title: '',
    description: '',
    difficulty: 'intro',
    board,
    goal: goalPlacement,
    pieces,
    initialPlacements: solvedPlacements.map((p) => ({ ...p })),
    sampleSolution: [],
  }
  let state = createInitialState(template)

  for (let i = 0; i < scramble.length; i++) {
    const step = scramble[i]

    if (!canMove(state, step)) {
      throw new Error(`scrambleCore ${puzzleId}: invalid scramble step ${i + 1}: ${step.pieceId} ${step.direction}`)
    }

    state = movePiece(state, step)
  }

  return state.placements
}

export type GeneratedRectangularInput = {
  readonly id: string
  readonly title?: string
  readonly description?: string
  readonly difficulty: PuzzleDifficulty
  readonly board?: BoardSize
  readonly pieces: readonly Piece[]
  readonly solvedPlacements: readonly PiecePlacement[]
  readonly scramble: readonly SolutionStep[]
  readonly goalPlacement?: PiecePlacement
}

export function createGeneratedRectangularPuzzle({
  id,
  title = '',
  description = '',
  difficulty,
  board = rectangularBoard,
  pieces,
  solvedPlacements,
  scramble,
  goalPlacement = rectangularGoalPlacement,
}: GeneratedRectangularInput): Puzzle {
  return {
    id,
    title,
    description,
    difficulty,
    board,
    goal: goalPlacement,
    pieces,
    initialPlacements: placementsAfterScramble(id, board, pieces, solvedPlacements, goalPlacement, scramble),
    sampleSolution: reverseScrambleToSolutionSteps(scramble),
  }
}

export function createSeededRectangularPuzzle(params: {
  readonly id: string
  readonly title?: string
  readonly description?: string
  readonly difficulty: PuzzleDifficulty
  readonly board?: BoardSize
  readonly pieces: readonly Piece[]
  readonly solvedPlacements: readonly PiecePlacement[]
  readonly scrambleLength: number
  readonly scrambleSeed: number
  readonly goalPlacement?: PiecePlacement
}): Puzzle {
  const gp = params.goalPlacement ?? rectangularGoalPlacement
  const board = params.board ?? rectangularBoard
  const scramble = randomValidScrambleFromSolved(
    params.id,
    board,
    params.pieces,
    params.solvedPlacements,
    gp,
    params.scrambleLength,
    params.scrambleSeed,
  )

  return createGeneratedRectangularPuzzle({
    id: params.id,
    title: params.title ?? '',
    description: params.description ?? '',
    difficulty: params.difficulty,
    board,
    pieces: params.pieces,
    solvedPlacements: params.solvedPlacements,
    scramble: [...scramble],
    goalPlacement: gp,
  })
}

export function placementLayoutSignature(placements: readonly PiecePlacement[]): string {
  return placements
    .map(({ pieceId, x, y }) => `${pieceId}:${x},${y}`)
    .toSorted()
    .join('|')
}

export const catalogSteps = (
  ...moves: readonly (readonly [pieceId: string, direction: Direction])[]
): readonly SolutionStep[] => moves.map(([pieceId, direction]) => ({ pieceId, direction }))
