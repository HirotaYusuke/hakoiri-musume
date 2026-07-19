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

/**
 * 追加パック用の高密度バリアント。基本セットに縦駒を1つ足した10駒構成で、
 * 本編と初期配置・解法が構造的に重複しない別の状態空間を持つ。
 */
export const rushExPieces: readonly Piece[] = [
  ...rushHourPieces,
  { id: 'v6', name: '縦六', width: 1, height: 2, kind: 'vertical' },
]

export const rushExSolvedPlacements: readonly PiecePlacement[] = [
  ...rushHourSolvedPlacements,
  { pieceId: 'v6', x: 4, y: 3 },
]

/**
 * 超難問パック用の12駒テンプレート。ランダム配置探索（レシピE seed=35）で発見した、
 * 最深 unit=37 / slide=19 の状態空間（12,398状態）を持つ構成。
 */
export const rushHardcorePieces: readonly Piece[] = [
  { id: 'musume', name: '赤いターゲット', width: 2, height: 1, kind: 'goal' },
  { id: 't1', name: '長縦一', width: 1, height: 3, kind: 'vertical' },
  { id: 't2', name: '長縦二', width: 1, height: 3, kind: 'vertical' },
  { id: 'v1', name: '縦一', width: 1, height: 2, kind: 'vertical' },
  { id: 'v2', name: '縦二', width: 1, height: 2, kind: 'vertical' },
  { id: 'v3', name: '縦三', width: 1, height: 2, kind: 'vertical' },
  { id: 'v4', name: '縦四', width: 1, height: 2, kind: 'vertical' },
  { id: 'v5', name: '縦五', width: 1, height: 2, kind: 'vertical' },
  { id: 'g1', name: '長横一', width: 3, height: 1, kind: 'horizontal' },
  { id: 'h1', name: '横一', width: 2, height: 1, kind: 'horizontal' },
  { id: 'h2', name: '横二', width: 2, height: 1, kind: 'horizontal' },
  { id: 'h3', name: '横三', width: 2, height: 1, kind: 'horizontal' },
]

export const rushHardcoreSolvedPlacements: readonly PiecePlacement[] = [
  { pieceId: 'musume', x: 3, y: 2 },
  { pieceId: 't1', x: 1, y: 2 },
  { pieceId: 't2', x: 0, y: 2 },
  { pieceId: 'v1', x: 5, y: 3 },
  { pieceId: 'v2', x: 3, y: 0 },
  { pieceId: 'v3', x: 2, y: 1 },
  { pieceId: 'v4', x: 5, y: 0 },
  { pieceId: 'v5', x: 4, y: 0 },
  { pieceId: 'g1', x: 2, y: 4 },
  { pieceId: 'h1', x: 1, y: 0 },
  { pieceId: 'h2', x: 4, y: 5 },
  { pieceId: 'h3', x: 2, y: 5 },
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

/** 右出口・横長ゴールの盤面テンプレート。solvedPlacements を根に全状態グラフを張る。 */
export type RushTemplate = Pick<Puzzle, 'board' | 'goal' | 'pieces'> & {
  readonly solvedPlacements: readonly PiecePlacement[]
}

const defaultRushTemplate: RushTemplate = {
  board: rushHourBoard,
  goal: rushHourGoalPlacement,
  pieces: rushHourPieces,
  solvedPlacements: rushHourSolvedPlacements,
}

export function createRushGraph(
  actionMode: 'unit' | 'slide',
  template: RushTemplate = defaultRushTemplate,
): RushGraph {
  const templatePuzzle: Puzzle = {
    ...rushPuzzleTemplate,
    board: template.board,
    goal: template.goal,
    pieces: template.pieces,
    initialPlacements: template.solvedPlacements,
  }
  const startKey = placementLayoutSignature(template.solvedPlacements)
  const nodes = new Map<string, RushGraphNode>([
    [
      startKey,
      {
        placements: template.solvedPlacements.map((placement) => ({ ...placement })),
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
      puzzle: templatePuzzle,
      placements: node.placements.map((placement) => ({ ...placement })),
      history: [],
    }

    for (const piece of template.pieces) {
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
      puzzle: templatePuzzle,
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

export function createRushSolution(graph: RushGraph, startKey: string): readonly SolutionStep[] {
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
  ['rush-hard-1', 'musume:1,2 v1:0,0 v2:5,2 v3:1,0 v4:3,4 v5:1,4 h1:2,1 h2:2,3 h3:4,5', 'h2L v4U h3L v2D musumeR musumeR musumeR'], // unit=8 slide=5
  ['rush-hard-2', 'musume:2,2 v1:0,0 v2:5,2 v3:1,0 v4:3,4 v5:1,3 h1:2,1 h2:2,3 h3:4,5', 'v5D h2L v4U h3L v2D musumeR musumeR'], // unit=8 slide=6
  ['rush-hard-3', 'musume:3,2 v1:0,0 v2:5,1 v3:1,2 v4:3,4 v5:1,4 h1:2,1 h2:2,3 h3:4,5', 'v3U h2L v4U h3L v2D v2D musumeR'], // unit=8 slide=6
  ['rush-hard-4', 'musume:3,2 v1:0,0 v2:5,2 v3:1,0 v4:3,4 v5:1,2 h1:2,1 h2:2,3 h3:4,5', 'v5D v5D h2L v4U h3L v2D musumeR'], // unit=8 slide=6
  ['rush-hard-5', 'musume:3,2 v1:0,0 v2:5,2 v3:1,2 v4:3,4 v5:1,4 h1:2,1 h2:3,3 h3:4,5', 'h2L v3U h2L v4U h3L v2D musumeR'], // unit=8 slide=6
  ['rush-hard-6', 'musume:3,2 v1:0,0 v2:5,0 v3:1,1 v4:3,4 v5:1,3 h1:2,1 h2:2,3 h3:4,5', 'v5D h2L v4U h3L v2D v2D v2D musumeR'], // unit=9 slide=6
  ['rush-hard-7', 'musume:3,2 v1:0,0 v2:5,1 v3:1,0 v4:3,4 v5:1,3 h1:2,1 h2:3,3 h3:4,5', 'h2L v5D h2L v4U h3L v2D v2D musumeR'], // unit=9 slide=6
  ['rush-hard-8', 'musume:3,2 v1:0,2 v2:5,2 v3:1,2 v4:3,4 v5:1,4 h1:0,1 h2:2,3 h3:4,5', 'h1R h1R v3U h2L v4U h3L v2D musumeR'], // unit=9 slide=7
  ['rush-hard-9', 'musume:2,2 v1:0,1 v2:5,2 v3:1,2 v4:3,4 v5:1,4 h1:1,1 h2:2,3 h3:4,5', 'h1R v3U h2L v4U h3L v2D musumeR musumeR'], // unit=9 slide=7
  ['rush-hard-10', 'musume:0,2 v1:0,3 v2:5,2 v3:1,0 v4:3,4 v5:1,3 h1:2,1 h2:2,3 h3:4,5', 'v5D h2L v4U h3L musumeR v2D musumeR musumeR musumeR'], // unit=10 slide=6
  ['rush-hard-11', 'musume:2,2 v1:0,0 v2:5,1 v3:1,0 v4:3,4 v5:1,2 h1:2,1 h2:2,3 h3:4,5', 'v5D v5D h2L v4U h3L v2D v2D musumeR musumeR'], // unit=10 slide=6
  ['rush-hard-12', 'musume:1,2 v1:0,0 v2:5,2 v3:1,0 v4:3,4 v5:1,3 h1:2,1 h2:3,3 h3:4,5', 'h2L v5D h2L v4U h3L v2D musumeR musumeR musumeR'], // unit=10 slide=6
  ['rush-hard-13', 'musume:2,2 v1:0,0 v2:5,1 v3:1,2 v4:3,4 v5:1,4 h1:2,1 h2:3,3 h3:4,5', 'h2L v3U h2L v4U h3L v2D v2D musumeR musumeR'], // unit=10 slide=6
  ['rush-hard-14', 'musume:2,2 v1:0,1 v2:5,2 v3:1,0 v4:3,4 v5:1,2 h1:2,1 h2:3,3 h3:4,5', 'h2L v5D v5D h2L v4U h3L v2D musumeR musumeR'], // unit=10 slide=6
  ['rush-hard-15', 'musume:3,2 v1:0,0 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:2,1 h2:4,3 h3:2,5', 'v3U v5U h3L v4D h2L v2D v2D v2D musumeR'], // unit=10 slide=7
  ['rush-hard-16', 'musume:1,2 v1:0,0 v2:5,0 v3:1,0 v4:3,4 v5:1,3 h1:2,1 h2:2,3 h3:4,5', 'v5D h2L v4U h3L v2D v2D v2D musumeR musumeR musumeR'], // unit=11 slide=6
  ['rush-hard-17', 'musume:2,2 v1:0,2 v2:5,1 v3:1,2 v4:3,4 v5:1,4 h1:0,1 h2:2,3 h3:4,5', 'h1R h1R v3U h2L v4U h3L v2D v2D musumeR musumeR'], // unit=11 slide=7
  ['rush-hard-18', 'musume:2,2 v1:0,3 v2:5,2 v3:1,2 v4:3,4 v5:1,4 h1:0,1 h2:3,3 h3:4,5', 'h2L h1R h1R v3U h2L v4U h3L v2D musumeR musumeR'], // unit=11 slide=7
  ['rush-hard-19', 'musume:2,2 v1:0,0 v2:5,0 v3:1,2 v4:3,4 v5:1,4 h1:1,1 h2:2,3 h3:4,5', 'h1R v3U h2L v4U h3L v2D v2D v2D musumeR musumeR'], // unit=11 slide=7
  ['rush-hard-20', 'musume:3,2 v1:0,0 v2:5,0 v3:1,2 v4:3,4 v5:1,4 h1:1,1 h2:3,3 h3:4,5', 'h2L h1R v3U h2L v4U h3L v2D v2D v2D musumeR'], // unit=11 slide=7
  ['rush-hard-21', 'musume:0,2 v1:0,3 v2:5,1 v3:1,0 v4:3,4 v5:1,3 h1:2,1 h2:3,3 h3:4,5', 'h2L v5D h2L v4U h3L musumeR v2D v2D musumeR musumeR musumeR'], // unit=12 slide=6
  ['rush-hard-22', 'musume:2,2 v1:0,0 v2:5,0 v3:1,0 v4:3,4 v5:1,2 h1:2,1 h2:3,3 h3:4,5', 'h2L v5D v5D h2L v4U h3L v2D v2D v2D musumeR musumeR'], // unit=12 slide=6
  ['rush-hard-23', 'musume:1,2 v1:0,0 v2:5,0 v3:1,0 v4:3,2 v5:1,4 h1:2,1 h2:4,3 h3:2,5', 'v4D musumeR musumeR v5U h3L v4D h2L v2D v2D v2D musumeR'], // unit=12 slide=6
  ['rush-hard-24', 'musume:2,2 v1:0,1 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:2,1 h2:4,3 h3:3,5', 'v3U musumeR v5U h3L h3L v4D h2L v2D v2D v2D musumeR'], // unit=12 slide=7
  ['rush-hard-25', 'musume:3,2 v1:0,2 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:0,1 h2:4,3 h3:2,5', 'h1R h1R v3U v5U h3L v4D h2L v2D v2D v2D musumeR'], // unit=12 slide=8
  ['rush-hard-26', 'musume:2,2 v1:0,0 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:1,1 h2:4,3 h3:2,5', 'h1R v3U musumeR v5U h3L v4D h2L v2D v2D v2D musumeR'], // unit=12 slide=8
  ['rush-hard-27', 'musume:3,2 v1:0,1 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:1,1 h2:4,3 h3:3,5', 'h1R v3U v5U h3L h3L v4D h2L v2D v2D v2D musumeR'], // unit=12 slide=8
  ['rush-hard-28', 'musume:0,2 v1:0,3 v2:5,0 v3:1,0 v4:3,3 v5:1,4 h1:2,1 h2:4,3 h3:3,5', 'musumeR musumeR musumeR v5U h3L h3L v4D h2L v2D v2D v2D musumeR'], // unit=13 slide=6
  ['rush-hard-29', 'musume:2,2 v1:0,2 v2:5,0 v3:1,2 v4:3,4 v5:1,4 h1:0,1 h2:3,3 h3:4,5', 'h2L h1R h1R v3U h2L v4U h3L v2D v2D v2D musumeR musumeR'], // unit=13 slide=7
  ['rush-hard-30', 'musume:3,2 v1:0,2 v2:5,0 v3:1,2 v4:3,4 v5:1,4 h1:0,1 h2:4,3 h3:4,5', 'h2L h2L h1R h1R v3U h2L v4U h3L v2D v2D v2D musumeR'], // unit=13 slide=7
  ['rush-hard-31', 'musume:2,2 v1:0,0 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:2,1 h2:4,3 h3:4,5', 'v4D h2L h2L v3U h2L v4U h3L v2D v2D v2D musumeR musumeR'], // unit=13 slide=7
  ['rush-hard-32', 'musume:3,2 v1:0,0 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:1,1 h2:4,3 h3:4,5', 'v4D h2L h2L h1R v3U h2L v4U h3L v2D v2D v2D musumeR'], // unit=13 slide=8
  ['rush-hard-33', 'musume:0,2 v1:0,3 v2:5,0 v3:1,0 v4:3,4 v5:1,3 h1:2,1 h2:4,3 h3:4,5', 'h2L h2L v5D h2L v4U h3L musumeR v2D v2D v2D musumeR musumeR musumeR'], // unit=14 slide=6
  ['rush-hard-34', 'musume:2,2 v1:0,3 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:0,1 h2:4,3 h3:3,5', 'h1R h1R v3U musumeR v5U h3L h3L v4D h2L v2D v2D v2D musumeR'], // unit=14 slide=8
  ['rush-hard-35', 'musume:0,2 v1:0,3 v2:5,0 v3:1,0 v4:3,2 v5:1,4 h1:2,1 h2:4,3 h3:4,5', 'v4D v4D h2L h2L h2L v4U h3L musumeR v2D v2D v2D musumeR musumeR musumeR'], // unit=15 slide=6
  ['rush-hard-36', 'musume:2,2 v1:0,2 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:0,1 h2:4,3 h3:4,5', 'v4D h2L h2L h1R h1R v3U h2L v4U h3L v2D v2D v2D musumeR musumeR'], // unit=15 slide=8
] as const

/**
 * 追加パック「rush-pack-1」の固定データ。
 * `npx tsx src/scripts/generate-rush-pack-specs.ts` の出力で、
 * 本編50問と初期配置が重複しない最深クラス（unit=13〜15）から選定している。
 */
const rushPackFixedSpecs = [
  ['rush-pack1-1', 'musume:3,2 v1:0,2 v2:5,1 v3:1,2 v4:3,4 v5:1,4 h1:0,1 h2:2,3 h3:4,5 v6:4,0', 'musumeL v6D v6D v6D h1R h1R v3U h2L v4U h3L v2D v2D musumeR musumeR'], // unit=15 slide=9
  ['rush-pack1-2', 'musume:2,2 v1:0,2 v2:5,1 v3:1,2 v4:3,4 v5:1,4 h1:0,1 h2:3,3 h3:4,5 v6:4,0', 'v6D h2L v6D v6D h1R h1R v3U h2L v4U h3L v2D v2D musumeR musumeR'], // unit=15 slide=9
  ['rush-pack1-3', 'musume:3,2 v1:0,3 v2:5,2 v3:1,2 v4:3,4 v5:1,4 h1:0,1 h2:3,3 h3:4,5 v6:4,0', 'musumeL v6D h2L v6D v6D h1R h1R v3U h2L v4U h3L v2D musumeR musumeR'], // unit=15 slide=10
  ['rush-pack1-4', 'musume:3,2 v1:0,0 v2:5,1 v3:1,2 v4:3,4 v5:1,4 h1:1,1 h2:3,3 h3:4,5 v6:4,0', 'musumeL v6D h2L v6D v6D h1R v3U h2L v4U h3L v2D v2D musumeR musumeR'], // unit=15 slide=10
  ['rush-pack1-5', 'musume:2,2 v1:0,2 v2:5,0 v3:1,2 v4:3,4 v5:1,4 h1:0,1 h2:4,3 h3:4,5 v6:4,1', 'h2L h2L v6D v6D h1R h1R v3U h2L v4U h3L v2D v2D v2D musumeR musumeR'], // unit=16 slide=9
  ['rush-pack1-6', 'musume:3,2 v1:0,2 v2:5,0 v3:1,2 v4:3,4 v5:1,4 h1:0,1 h2:3,3 h3:4,5 v6:4,0', 'musumeL v6D h2L v6D v6D h1R h1R v3U h2L v4U h3L v2D v2D v2D musumeR musumeR'], // unit=17 slide=10
  ['rush-pack1-7', 'musume:2,2 v1:0,0 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:1,1 h2:4,3 h3:4,5 v6:4,0', 'v6D v4D h2L h2L v6D v6D h1R v3U h2L v4U h3L v2D v2D v2D musumeR musumeR'], // unit=17 slide=10
  ['rush-pack1-8', 'musume:3,2 v1:0,0 v2:5,0 v3:1,2 v4:3,4 v5:1,4 h1:1,1 h2:4,3 h3:4,5 v6:4,0', 'musumeL v6D h2L h2L v6D v6D h1R v3U h2L v4U h3L v2D v2D v2D musumeR musumeR'], // unit=17 slide=10
  ['rush-pack1-9', 'musume:2,2 v1:0,2 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:0,1 h2:4,3 h3:3,5 v6:4,1', 'h3R v4D h2L h2L v6D v6D h1R h1R v3U h2L v4U h3L v2D v2D v2D musumeR musumeR'], // unit=18 slide=11
  ['rush-pack1-10', 'musume:2,2 v1:0,0 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:1,1 h2:4,3 h3:2,5 v6:4,1', 'h3R h3R v4D h2L h2L v6D v6D h1R v3U h2L v4U h3L v2D v2D v2D musumeR musumeR'], // unit=18 slide=11
  ['rush-pack1-11', 'musume:3,2 v1:0,0 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:1,1 h2:4,3 h3:3,5 v6:4,0', 'musumeL v6D h3R v4D h2L h2L v6D v6D h1R v3U h2L v4U h3L v2D v2D v2D musumeR musumeR'], // unit=19 slide=12
  ['rush-pack1-12', 'musume:3,2 v1:0,2 v2:5,0 v3:1,2 v4:3,3 v5:1,4 h1:0,1 h2:4,3 h3:2,5 v6:4,0', 'musumeL v6D h3R h3R v4D h2L h2L v6D v6D h1R h1R v3U h2L v4U h3L v2D v2D v2D musumeR musumeR'], // unit=21 slide=12
] as const

/**
 * 超難問パック「rush-pack-2」の固定データ（12駒テンプレート、unit=26〜37 / slide=15〜19）。
 */
const rushHardcoreFixedSpecs = [
  ['rush-pack2-1', 'musume:2,2 t1:1,1 t2:0,2 v1:5,4 v2:3,0 v3:2,0 v4:5,1 v5:4,1 g1:1,4 h1:4,0 h2:2,5 h3:0,5', 'h2R h3R v1U h2R h3R g1R t1D t1D musumeL v2D h1L t2D musumeL v3D h1L h1L h1L v5U v3U v2U musumeR musumeR musumeR v4U musumeR'], // unit=26 slide=15
  ['rush-pack2-2', 'musume:3,2 t1:1,1 t2:0,3 v1:5,4 v2:3,0 v3:2,0 v4:5,1 v5:4,3 g1:1,4 h1:4,0 h2:3,5 h3:1,5', 'v1U h2R h3R musumeL v5U g1R t1D t1D musumeL v2D h1L musumeL v3D h1L h1L h1L v5U v5U v3U v2U musumeR musumeR musumeR v4U musumeR'], // unit=26 slide=16
  ['rush-pack2-3', 'musume:2,2 t1:1,1 t2:0,1 v1:5,4 v2:3,0 v3:2,0 v4:5,2 v5:4,1 g1:0,4 h1:4,0 h2:3,5 h3:1,5', 'v4U v1U h2R h3R g1R g1R t1D t1D musumeL v2D h1L t2D t2D musumeL v3D h1L h1L h1L v5U v3U v2U musumeR musumeR musumeR v4U musumeR'], // unit=27 slide=16
  ['rush-pack2-4', 'musume:3,2 t1:1,1 t2:0,2 v1:5,3 v2:3,0 v3:2,1 v4:5,1 v5:4,3 g1:1,4 h1:4,0 h2:3,5 h3:1,5', 'h2R h3R v3U musumeL v5U g1R t1D t1D musumeL v2D h1L t2D musumeL v3D h1L h1L h1L v5U v5U v3U v2U musumeR musumeR musumeR v4U musumeR'], // unit=27 slide=17
  ['rush-pack2-5', 'musume:2,2 t1:1,1 t2:0,2 v1:5,4 v2:3,0 v3:2,0 v4:5,2 v5:4,3 g1:1,4 h1:4,0 h2:3,5 h3:0,5', 'h3R v4U v1U h2R h3R v5U g1R t1D t1D musumeL v2D h1L t2D musumeL v3D h1L h1L h1L v5U v5U v3U v2U musumeR musumeR musumeR v4U musumeR'], // unit=28 slide=17
  ['rush-pack2-6', 'musume:3,2 t1:1,1 t2:0,1 v1:5,4 v2:3,0 v3:2,0 v4:5,2 v5:4,3 g1:1,4 h1:4,0 h2:3,5 h3:1,5', 'v4U v1U h2R h3R musumeL v5U g1R t1D t1D musumeL v2D h1L t2D t2D musumeL v3D h1L h1L h1L v5U v5U v3U v2U musumeR musumeR musumeR v4U musumeR'], // unit=29 slide=18
  ['rush-pack2-7', 'musume:3,2 t1:1,0 t2:0,2 v1:5,4 v2:3,0 v3:2,1 v4:5,2 v5:4,3 g1:1,4 h1:4,0 h2:3,5 h3:1,5', 'v4U v1U h2R h3R v3U musumeL v5U g1R t1D t1D t1D musumeL v2D h1L t2D musumeL v3D h1L h1L h1L v5U v5U v3U v2U musumeR musumeR musumeR v4U musumeR'], // unit=30 slide=19
  ['rush-pack2-8', 'musume:3,2 t1:1,1 t2:0,2 v1:5,4 v2:3,0 v3:2,1 v4:5,2 v5:4,3 g1:1,4 h1:4,0 h2:2,5 h3:0,5', 'h2R h3R v4U v1U h2R h3R v3U musumeL v5U g1R t1D t1D musumeL v2D h1L t2D musumeL v3D h1L h1L h1L v5U v5U v3U v2U musumeR musumeR musumeR v4U musumeR'], // unit=31 slide=19
  ['rush-pack2-9', 'musume:3,2 t1:1,1 t2:0,1 v1:5,4 v2:3,0 v3:2,2 v4:5,2 v5:4,3 g1:0,4 h1:4,0 h2:3,5 h3:1,5', 'v4U v1U h2R h3R g1R v3U v3U musumeL v5U g1R t1D t1D musumeL v2D h1L t2D t2D musumeL v3D h1L h1L h1L v5U v5U v3U v2U musumeR musumeR musumeR v4U musumeR'], // unit=32 slide=19
  ['rush-pack2-10', 'musume:3,2 t1:1,1 t2:0,0 v1:5,4 v2:3,0 v3:2,1 v4:5,2 v5:4,3 g1:0,4 h1:4,0 h2:3,5 h3:0,5', 'h3R v4U v1U h2R h3R g1R v3U musumeL v5U g1R t1D t1D musumeL v2D h1L t2D t2D t2D musumeL v3D h1L h1L h1L v5U v5U v3U v2U musumeR musumeR musumeR v4U musumeR'], // unit=33 slide=19
  ['rush-pack2-11', 'musume:3,2 t1:1,0 t2:0,1 v1:5,4 v2:3,0 v3:2,1 v4:5,2 v5:4,3 g1:0,4 h1:4,0 h2:2,5 h3:0,5', 'h2R h3R v4U v1U h2R h3R g1R v3U musumeL v5U g1R t1D t1D t1D musumeL v2D h1L t2D t2D musumeL v3D h1L h1L h1L v5U v5U v3U v2U musumeR musumeR musumeR v4U musumeR'], // unit=34 slide=19
  ['rush-pack2-12', 'musume:3,2 t1:1,0 t2:0,0 v1:5,4 v2:3,0 v3:2,2 v4:5,2 v5:4,4 g1:0,4 h1:4,0 h2:2,5 h3:0,5', 'v5U h2R h3R v4U v1U h2R h3R g1R v3U v3U musumeL v5U g1R t1D t1D t1D musumeL v2D h1L t2D t2D t2D musumeL v3D h1L h1L h1L v5U v5U v3U v2U musumeR musumeR musumeR v4U musumeR'], // unit=37 slide=19
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

export function createRushPackPuzzles(): readonly Puzzle[] {
  return rushPackFixedSpecs.map(([id, placements, solution]) => ({
    id,
    title: '',
    description: '',
    difficulty: 'hard',
    board: rushHourBoard,
    goal: rushHourGoalPlacement,
    pieces: rushExPieces,
    initialPlacements: parseRushPlacements(placements),
    sampleSolution: parseRushSolution(solution),
  }))
}

export function createRushHardcorePuzzles(): readonly Puzzle[] {
  return rushHardcoreFixedSpecs.map(([id, placements, solution]) => ({
    id,
    title: '',
    description: '',
    difficulty: 'hard',
    board: rushHourBoard,
    goal: rushHourGoalPlacement,
    pieces: rushHardcorePieces,
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
