import type {
  Coordinate,
  Direction,
  Move,
  Piece,
  PieceId,
  PiecePlacement,
  Puzzle,
  PuzzleState,
  SolutionStep,
} from './types'

const directionOffsets: Record<Direction, Coordinate> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export const directions: readonly Direction[] = ['up', 'down', 'left', 'right']

const cellKey = ({ x, y }: Coordinate) => `${x}:${y}`

/**
 * 駒の幅・高さからスライド許可方向を決める。
 * 横長（幅>高さ）は左右のみ、縦長（高さ>幅）は上下のみ、正方形は四方向。
 */
export const getShapeAllowedDirections = (piece: Piece): readonly Direction[] => {
  if (piece.width > piece.height) {
    return ['left', 'right']
  }

  if (piece.height > piece.width) {
    return ['up', 'down']
  }

  return directions
}

/** ゴール駒が盤外へ抜ける向きを返す（定義済み問題では常に単一決定できる） */
export const tryGoalExitDirection = (puzzle: Puzzle): Direction | undefined => {
  const goalPiece = getPiece(puzzle, puzzle.goal.pieceId)

  if (goalPiece.width === 1 && goalPiece.height === 2) {
    return 'down'
  }

  if (goalPiece.width === 2 && goalPiece.height === 1) {
    if (puzzle.goal.x === 0) {
      return 'left'
    }

    if (puzzle.goal.x + goalPiece.width === puzzle.board.width) {
      return 'right'
    }
  }

  return undefined
}

/**
 * appendExitStep 用。
 * validatePuzzle と同じゲートにより、未定義問題では検証側で検出されることを想定。
 */
export function buildGoalExitSolutionStep(puzzle: Puzzle): SolutionStep {
  const exitDir = tryGoalExitDirection(puzzle)

  if (!exitDir) {
    throw new Error(`ゴール駒または配置から出口方向を決定できません: ${puzzle.id}`)
  }

  return { pieceId: puzzle.goal.pieceId, direction: exitDir }
}

export const getEscapedGoalPlacement = (puzzle: Puzzle, goalPiece: Piece): Coordinate | null => {
  const exitDir = tryGoalExitDirection(puzzle)

  if (!exitDir) {
    return null
  }

  if (exitDir === 'down') {
    return {
      x: puzzle.goal.x,
      y: puzzle.board.height - goalPiece.height + 1,
    }
  }

  if (exitDir === 'left') {
    return {
      x: 1 - goalPiece.width,
      y: puzzle.goal.y,
    }
  }

  return {
    x: puzzle.board.width - goalPiece.width + 1,
    y: puzzle.goal.y,
  }
}

const isGoalExitMove = (
  puzzle: Puzzle,
  piece: Piece,
  placement: Coordinate,
  direction: Direction,
): boolean => {
  if (piece.id !== puzzle.goal.pieceId) {
    return false
  }

  const exitDirection = tryGoalExitDirection(puzzle)
  const escaped = getEscapedGoalPlacement(puzzle, piece)

  if (!exitDirection || !escaped || direction !== exitDirection) {
    return false
  }

  return placement.x === escaped.x && placement.y === escaped.y
}

export const createInitialState = (puzzle: Puzzle): PuzzleState => ({
  puzzle,
  placements: puzzle.initialPlacements.map((placement) => ({ ...placement })),
  history: [],
})

export const getPiece = (puzzle: Puzzle, pieceId: PieceId): Piece => {
  const piece = puzzle.pieces.find((candidate) => candidate.id === pieceId)

  if (!piece) {
    throw new Error(`Unknown piece: ${pieceId}`)
  }

  return piece
}

export const getPlacement = (
  placements: readonly PiecePlacement[],
  pieceId: PieceId,
): PiecePlacement => {
  const placement = placements.find((candidate) => candidate.pieceId === pieceId)

  if (!placement) {
    throw new Error(`Missing placement: ${pieceId}`)
  }

  return placement
}

export const getPieceCells = (piece: Piece, placement: Coordinate): Coordinate[] =>
  Array.from({ length: piece.height }, (_, row) =>
    Array.from({ length: piece.width }, (_, column) => ({
      x: placement.x + column,
      y: placement.y + row,
    })),
  ).flat()

export const getOccupiedCells = (
  puzzle: Puzzle,
  placements: readonly PiecePlacement[],
): Map<string, PieceId> =>
  placements.reduce((occupied, placement) => {
    const piece = getPiece(puzzle, placement.pieceId)

    getPieceCells(piece, placement).forEach((cell) => {
      occupied.set(cellKey(cell), placement.pieceId)
    })

    return occupied
  }, new Map<string, PieceId>())

export const isPlacementInsideBoard = (
  puzzle: Puzzle,
  piece: Piece,
  placement: Coordinate,
): boolean =>
  placement.x >= 0 &&
  placement.y >= 0 &&
  placement.x + piece.width <= puzzle.board.width &&
  placement.y + piece.height <= puzzle.board.height

export const isPlacementEscapedThroughExit = (
  puzzle: Puzzle,
  piece: Piece,
  placement: Coordinate,
): boolean => {
  const escaped = getEscapedGoalPlacement(puzzle, piece)

  return Boolean(
    escaped && piece.id === puzzle.goal.pieceId && placement.x === escaped.x && placement.y === escaped.y,
  )
}

const encodePlacementsKey = (placements: readonly PiecePlacement[]): string =>
  placements
    .map((p) => `${p.pieceId}@${p.x},${p.y}`)
    .toSorted()
    .join('|')

export type SolvabilityResult =
  | { readonly solvable: true; readonly visitedCount: number }
  | { readonly solvable: false; readonly visitedCount: number; readonly reason: 'exhausted' | 'visitLimit' }

export type PuzzleDifficultyMetrics =
  | {
      readonly solvable: true
      readonly minUnitMoves: number
      readonly minActions: number
      readonly visitedBeforeGoal: number
      readonly maxFrontier: number
      readonly averageBranching: number
      readonly difficultyScore: number
    }
  | {
      readonly solvable: false
      readonly visitedBeforeGoal: number
      readonly maxFrontier: number
      readonly averageBranching: number
      readonly reason: 'exhausted' | 'visitLimit'
    }

/**
 * 初期配置から、単位移動の合法手のみで BFS し、脱出（isCleared）までの最短手数を返す。
 * 到達不能・探索上限超過は `Infinity`。
 */
export const getMinimumMovesToClear = (puzzle: Puzzle, maxVisited = 2_000_000): number => {
  const startPlacements = puzzle.initialPlacements.map((p) => ({ ...p }))
  const startState: PuzzleState = { puzzle, placements: startPlacements, history: [] }

  if (isCleared(startState)) {
    return 0
  }

  const startKey = encodePlacementsKey(startPlacements)
  const visited = new Set<string>([startKey])
  const queue: { readonly placements: PiecePlacement[]; readonly dist: number }[] = [
    { placements: startPlacements.map((p) => ({ ...p })), dist: 0 },
  ]
  let head = 0

  while (head < queue.length) {
    if (visited.size > maxVisited) {
      return Infinity
    }

    const { placements, dist } = queue[head++]!
    const state: PuzzleState = { puzzle, placements, history: [] }

    for (const piece of puzzle.pieces) {
      for (const direction of getShapeAllowedDirections(piece)) {
        const move: Move = { pieceId: piece.id, direction }

        if (!canMove(state, move)) {
          continue
        }

        const offset = directionOffsets[direction]
        const nextPlacements = placements.map((placement) =>
          placement.pieceId === piece.id
            ? {
                ...placement,
                x: placement.x + offset.x,
                y: placement.y + offset.y,
              }
            : placement,
        )
        const nextDist = dist + 1
        const nextState: PuzzleState = { puzzle, placements: nextPlacements, history: [] }

        if (isCleared(nextState)) {
          return nextDist
        }

        const key = encodePlacementsKey(nextPlacements)

        if (visited.has(key)) {
          continue
        }

        visited.add(key)
        queue.push({ placements: nextPlacements, dist: nextDist })
      }
    }
  }

  return Infinity
}

/**
 * 現在の配置から最短でクリアへ向かうときの最初の単位移動を返す。
 * クリア済み・探索上限超過・到達不能は null（通常プレイで到達できる配置は可逆なので解ける）。
 */
export const findNextHintMove = (state: PuzzleState, maxVisited = 400_000): Move | null => {
  if (isCleared(state)) {
    return null
  }

  const puzzle = state.puzzle
  const startPlacements = state.placements.map((p) => ({ ...p }))
  const visited = new Set<string>([encodePlacementsKey(startPlacements)])
  const queue: { readonly placements: PiecePlacement[]; readonly firstMove: Move | null }[] = [
    { placements: startPlacements, firstMove: null },
  ]
  let head = 0

  while (head < queue.length) {
    if (visited.size > maxVisited) {
      return null
    }

    const { placements, firstMove } = queue[head++]!
    const currentState: PuzzleState = { puzzle, placements, history: [] }

    for (const piece of puzzle.pieces) {
      for (const direction of getShapeAllowedDirections(piece)) {
        const move: Move = { pieceId: piece.id, direction }

        if (!canMove(currentState, move)) {
          continue
        }

        const offset = directionOffsets[direction]
        const nextPlacements = placements.map((placement) =>
          placement.pieceId === piece.id
            ? {
                ...placement,
                x: placement.x + offset.x,
                y: placement.y + offset.y,
              }
            : placement,
        )
        const nextFirstMove = firstMove ?? move
        const nextState: PuzzleState = { puzzle, placements: nextPlacements, history: [] }

        if (isCleared(nextState)) {
          return nextFirstMove
        }

        const key = encodePlacementsKey(nextPlacements)

        if (visited.has(key)) {
          continue
        }

        visited.add(key)
        queue.push({ placements: nextPlacements, firstMove: nextFirstMove })
      }
    }
  }

  return null
}

const getActionSuccessors = (puzzle: Puzzle, placements: readonly PiecePlacement[]): PiecePlacement[][] => {
  const state: PuzzleState = { puzzle, placements, history: [] }
  const successors: PiecePlacement[][] = []

  for (const piece of puzzle.pieces) {
    for (const direction of getShapeAllowedDirections(piece)) {
      const maxSteps = getMaxMoveSteps(state, { pieceId: piece.id, direction })

      for (let steps = 1; steps <= maxSteps; steps++) {
        let nextState = state

        for (let i = 0; i < steps; i++) {
          nextState = movePiece(nextState, { pieceId: piece.id, direction })
        }

        successors.push(nextState.placements.map((placement) => ({ ...placement })))
      }
    }
  }

  return successors
}

/**
 * RLC相当（同じ駒を同方向へ連続して滑らせる操作を1手）でBFSし、
 * 最短手数だけでなく探索の広がりも難易度として返す。
 */
export const analyzePuzzleDifficulty = (
  puzzle: Puzzle,
  maxVisited = 200_000,
): PuzzleDifficultyMetrics => {
  const startPlacements = puzzle.initialPlacements.map((p) => ({ ...p }))
  const startState: PuzzleState = { puzzle, placements: startPlacements, history: [] }

  if (isCleared(startState)) {
    return {
      solvable: true,
      minUnitMoves: 0,
      minActions: 0,
      visitedBeforeGoal: 1,
      maxFrontier: 1,
      averageBranching: 0,
      difficultyScore: 0,
    }
  }

  const visited = new Set<string>([encodePlacementsKey(startPlacements)])
  const queue: { readonly placements: PiecePlacement[]; readonly actions: number }[] = [
    { placements: startPlacements, actions: 0 },
  ]
  let head = 0
  let expanded = 0
  let totalBranching = 0
  let maxFrontier = 1

  while (head < queue.length) {
    if (visited.size > maxVisited) {
      return {
        solvable: false,
        visitedBeforeGoal: visited.size,
        maxFrontier,
        averageBranching: expanded === 0 ? 0 : totalBranching / expanded,
        reason: 'visitLimit',
      }
    }

    const { placements, actions } = queue[head++]!
    const successors = getActionSuccessors(puzzle, placements)
    expanded += 1
    totalBranching += successors.length

    for (const nextPlacements of successors) {
      const nextState: PuzzleState = { puzzle, placements: nextPlacements, history: [] }
      const key = encodePlacementsKey(nextPlacements)

      if (visited.has(key)) {
        continue
      }

      if (isCleared(nextState)) {
        const minActions = actions + 1
        const minUnitMoves = getMinimumMovesToClear(puzzle, maxVisited)
        const averageBranching = totalBranching / expanded
        const difficultyScore =
          minActions * 5 +
          Math.log2(Math.max(1, visited.size)) * 3 +
          Math.log2(Math.max(1, maxFrontier)) * 2 +
          averageBranching * 4

        return {
          solvable: true,
          minUnitMoves,
          minActions,
          visitedBeforeGoal: visited.size,
          maxFrontier,
          averageBranching,
          difficultyScore,
        }
      }

      visited.add(key)
      queue.push({ placements: nextPlacements, actions: actions + 1 })
    }

    maxFrontier = Math.max(maxFrontier, queue.length - head)
  }

  return {
    solvable: false,
    visitedBeforeGoal: visited.size,
    maxFrontier,
    averageBranching: expanded === 0 ? 0 : totalBranching / expanded,
    reason: 'exhausted',
  }
}

const overlapsGoalExitColumn = (
  puzzle: Puzzle,
  piece: Piece,
  placement: Coordinate,
): boolean => {
  const goalPiece = getPiece(puzzle, puzzle.goal.pieceId)
  const minX = puzzle.goal.x
  const maxX = puzzle.goal.x + goalPiece.width - 1

  return getPieceCells(piece, placement).some((cell) => cell.x >= minX && cell.x <= maxX)
}

const getHorizontalClearCost = (
  puzzle: Puzzle,
  placements: readonly PiecePlacement[],
  pieceId: PieceId,
): number | null => {
  const piece = getPiece(puzzle, pieceId)

  if (piece.width <= piece.height) {
    return null
  }

  const initialPlacement = getPlacement(placements, pieceId)
  const occupied = getOccupiedCells(puzzle, placements)
  let best: number | null = null

  for (const direction of ['left', 'right'] as const) {
    const offset = directionOffsets[direction]
    let placement = { x: initialPlacement.x, y: initialPlacement.y }

    for (let steps = 1; steps <= puzzle.board.width; steps++) {
      placement = {
        x: placement.x + offset.x,
        y: placement.y + offset.y,
      }

      if (!isPlacementInsideBoard(puzzle, piece, placement)) {
        break
      }

      const blocked = getPieceCells(piece, placement).some((cell) => {
        const occupant = occupied.get(cellKey(cell))

        return occupant !== undefined && occupant !== pieceId
      })

      if (blocked) {
        break
      }

      if (!overlapsGoalExitColumn(puzzle, piece, placement)) {
        best = best === null ? steps : Math.min(best, steps)
        break
      }
    }
  }

  return best
}

/**
 * ゴールが下へ抜ける通路を横長ブロックで塞ぐ構造向けの最短手数計算。
 * 大きい盤面の全域BFSを避けつつ、通路上の各ブロックを何手で列外へ出せるかを合算する。
 */
export const getCorridorMinimumMovesToClear = (puzzle: Puzzle): number | null => {
  if (tryGoalExitDirection(puzzle) !== 'down') {
    return null
  }

  const goalPiece = getPiece(puzzle, puzzle.goal.pieceId)

  if (goalPiece.width !== 1) {
    return null
  }

  const placements = puzzle.initialPlacements.map((p) => ({ ...p }))
  const goalPlacement = getPlacement(placements, puzzle.goal.pieceId)
  const escaped = getEscapedGoalPlacement(puzzle, goalPiece)

  if (!escaped || escaped.y < goalPlacement.y) {
    return null
  }

  const blockingRows = new Set(
    Array.from(
      { length: puzzle.board.height - (goalPlacement.y + goalPiece.height) },
      (_unused, index) => goalPlacement.y + goalPiece.height + index,
    ),
  )
  const occupied = getOccupiedCells(puzzle, placements)
  const blockingPieceIds = new Set<PieceId>()

  for (const row of blockingRows) {
    const occupant = occupied.get(cellKey({ x: goalPlacement.x, y: row }))

    if (occupant && occupant !== puzzle.goal.pieceId) {
      blockingPieceIds.add(occupant)
    }
  }

  let blockerCost = 0

  for (const pieceId of blockingPieceIds) {
    const cost = getHorizontalClearCost(puzzle, placements, pieceId)

    if (cost === null) {
      return null
    }

    blockerCost += cost
  }

  return escaped.y - goalPlacement.y + blockerCost
}

/**
 * 単位移動1手だけで脱出できるか（初期即クリア含む）。
 * 性能用: getMinimumMovesToClear の全域BFS は不要。
 */
export const canClearInOneMoveFromInitial = (puzzle: Puzzle): boolean => {
  const startPlacements = puzzle.initialPlacements.map((p) => ({ ...p }))
  const state: PuzzleState = { puzzle, placements: startPlacements, history: [] }

  if (isCleared(state)) {
    return true
  }

  for (const piece of puzzle.pieces) {
    for (const direction of getShapeAllowedDirections(piece)) {
      const move: Move = { pieceId: piece.id, direction }

      if (!canMove(state, move)) {
        continue
      }

      const offset = directionOffsets[direction]
      const nextPlacements = startPlacements.map((placement) =>
        placement.pieceId === piece.id
          ? {
              ...placement,
              x: placement.x + offset.x,
              y: placement.y + offset.y,
            }
          : placement,
      )
      const nextState: PuzzleState = { puzzle, placements: nextPlacements, history: [] }

      if (isCleared(nextState)) {
        return true
      }
    }
  }

  return false
}

export const analyzePuzzleSolvability = (
  puzzle: Puzzle,
  maxVisited = 2_000_000,
): SolvabilityResult => {
  const start: PuzzleState = {
    puzzle,
    placements: puzzle.initialPlacements.map((p) => ({ ...p })),
    history: [],
  }

  const startKey = encodePlacementsKey(start.placements)
  const visited = new Set<string>([startKey])
  const queue: PiecePlacement[][] = [start.placements.map((p) => ({ ...p }))]
  let head = 0

  while (head < queue.length) {
    if (visited.size > maxVisited) {
      return { solvable: false, visitedCount: visited.size, reason: 'visitLimit' }
    }

    const placements = queue[head++]!
    const state: PuzzleState = { puzzle, placements, history: [] }

    if (isCleared(state)) {
      return { solvable: true, visitedCount: visited.size }
    }

    for (const piece of puzzle.pieces) {
      for (const direction of getShapeAllowedDirections(piece)) {
        const move: Move = { pieceId: piece.id, direction }

        if (!canMove(state, move)) {
          continue
        }

        const offset = directionOffsets[direction]
        const nextPlacements = placements.map((placement) =>
          placement.pieceId === piece.id
            ? {
                ...placement,
                x: placement.x + offset.x,
                y: placement.y + offset.y,
              }
            : placement,
        )
        const key = encodePlacementsKey(nextPlacements)

        if (visited.has(key)) {
          continue
        }

        visited.add(key)
        queue.push(nextPlacements)
      }
    }
  }

  return { solvable: false, visitedCount: visited.size, reason: 'exhausted' }
}

export const isPuzzleSolvable = (puzzle: Puzzle, maxVisited?: number): boolean =>
  analyzePuzzleSolvability(puzzle, maxVisited).solvable

export const canMove = (state: PuzzleState, move: Move): boolean => {
  const piece = getPiece(state.puzzle, move.pieceId)

  if (!getShapeAllowedDirections(piece).includes(move.direction)) {
    return false
  }

  const current = getPlacement(state.placements, move.pieceId)
  const offset = directionOffsets[move.direction]
  const nextPlacement = {
    x: current.x + offset.x,
    y: current.y + offset.y,
  }

  if (
    !isPlacementInsideBoard(state.puzzle, piece, nextPlacement) &&
    !isGoalExitMove(state.puzzle, piece, nextPlacement, move.direction)
  ) {
    return false
  }

  const occupied = getOccupiedCells(state.puzzle, state.placements)

  return getPieceCells(piece, nextPlacement).every((cell) => {
    const occupant = occupied.get(cellKey(cell))

    return occupant === undefined || occupant === move.pieceId
  })
}

export const getLegalDirections = (state: PuzzleState, pieceId: PieceId): readonly Direction[] => {
  const piece = getPiece(state.puzzle, pieceId)

  return getShapeAllowedDirections(piece).filter((direction) => canMove(state, { pieceId, direction }))
}

export const getMaxMoveSteps = (state: PuzzleState, move: Move): number => {
  let current = state
  let steps = 0

  while (canMove(current, move)) {
    current = movePiece(current, move)
    steps += 1
  }

  return steps
}

/**
 * 1回のスライド操作で脱出できるか（ドラッグ操作は同方向に複数マス進めるため）。
 * カタログ検証では、単位移動ではなくプレイヤーの1操作として問題成立性を判定する。
 */
export const canClearInOneActionFromInitial = (puzzle: Puzzle): boolean => {
  const state = createInitialState(puzzle)

  if (isCleared(state)) {
    return true
  }

  for (const piece of puzzle.pieces) {
    for (const direction of getShapeAllowedDirections(piece)) {
      const move: Move = { pieceId: piece.id, direction }
      const maxSteps = getMaxMoveSteps(state, move)

      if (maxSteps === 0) {
        continue
      }

      const nextState = movePieceBySteps(state, move, maxSteps)

      if (isCleared(nextState)) {
        return true
      }
    }
  }

  return false
}

export const movePiece = (state: PuzzleState, move: Move): PuzzleState => {
  if (!canMove(state, move)) {
    return state
  }

  const offset = directionOffsets[move.direction]
  const nextPlacements = state.placements.map((placement) =>
    placement.pieceId === move.pieceId
      ? {
          ...placement,
          x: placement.x + offset.x,
          y: placement.y + offset.y,
        }
      : placement,
  )

  return {
    ...state,
    placements: nextPlacements,
    history: [
      ...state.history,
      {
        move,
        placements: state.placements.map((placement) => ({ ...placement })),
      },
    ],
  }
}

export const movePieceBySteps = (state: PuzzleState, move: Move, steps: number): PuzzleState => {
  const safeSteps = Math.max(1, Math.floor(steps))

  return Array.from({ length: safeSteps }).reduce<PuzzleState>((current) => {
    const next = movePiece(current, move)

    return next === current ? current : next
  }, state)
}

export const undo = (state: PuzzleState): PuzzleState => {
  const previous = state.history.at(-1)

  if (!previous) {
    return state
  }

  return {
    ...state,
    placements: previous.placements,
    history: state.history.slice(0, -1),
  }
}

export const isCleared = (state: PuzzleState): boolean => {
  const goalPiece = getPiece(state.puzzle, state.puzzle.goal.pieceId)
  const goalPlacement = getPlacement(state.placements, state.puzzle.goal.pieceId)

  return isPlacementEscapedThroughExit(state.puzzle, goalPiece, goalPlacement)
}

export const validatePuzzle = (puzzle: Puzzle): readonly string[] => {
  const issues: string[] = []
  const pieceIds = new Set<PieceId>()
  const placedPieceIds = new Set<PieceId>()

  puzzle.pieces.forEach((piece) => {
    if (pieceIds.has(piece.id)) {
      issues.push(`Duplicate piece id: ${piece.id}`)
    }
    pieceIds.add(piece.id)

    if (piece.width < 1 || piece.height < 1) {
      issues.push(`Invalid piece size: ${piece.id}`)
    }

    if (piece.width === 1 && piece.height === 1) {
      issues.push(`1x1 pieces are not allowed: ${piece.id}`)
    }

    if (piece.width === 2 && piece.height === 2) {
      issues.push(`2x2 pieces are not allowed: ${piece.id}`)
    }
  })

  puzzle.initialPlacements.forEach((placement) => {
    const piece = puzzle.pieces.find((candidate) => candidate.id === placement.pieceId)

    if (!piece) {
      issues.push(`Unknown initial placement: ${placement.pieceId}`)

      return
    }

    if (placedPieceIds.has(placement.pieceId)) {
      issues.push(`Duplicate initial placement: ${placement.pieceId}`)
    }
    placedPieceIds.add(placement.pieceId)

    if (!isPlacementInsideBoard(puzzle, piece, placement)) {
      issues.push(`Initial placement outside board: ${placement.pieceId}`)
    }
  })

  pieceIds.forEach((pieceId) => {
    if (!placedPieceIds.has(pieceId)) {
      issues.push(`Missing initial placement: ${pieceId}`)
    }
  })

  const occupied =
    puzzle.initialPlacements.every((placement) => pieceIds.has(placement.pieceId)) &&
    getOccupiedCells(puzzle, puzzle.initialPlacements)
  const occupiedCellCount = puzzle.initialPlacements.reduce((count, placement) => {
    if (!pieceIds.has(placement.pieceId)) {
      return count
    }

    const piece = getPiece(puzzle, placement.pieceId)

    return count + piece.width * piece.height
  }, 0)

  if (occupied && occupied.size !== occupiedCellCount) {
    issues.push('Initial placements overlap')
  }

  if (!pieceIds.has(puzzle.goal.pieceId)) {
    issues.push(`Unknown goal piece: ${puzzle.goal.pieceId}`)
  } else {
    const goalPiece = getPiece(puzzle, puzzle.goal.pieceId)

    if (!isPlacementInsideBoard(puzzle, goalPiece, puzzle.goal)) {
      issues.push('Goal placement outside board')
    }

    const isGoal12 = goalPiece.width === 1 && goalPiece.height === 2
    const isGoal21 = goalPiece.width === 2 && goalPiece.height === 1

    if (!(isGoal12 || isGoal21)) {
      issues.push(`Goal piece must be 1x2 or 2x1 (got ${goalPiece.width}x${goalPiece.height}): ${goalPiece.id}`)
    }

    const exitDirection = tryGoalExitDirection(puzzle)

    if (!exitDirection && (isGoal12 || isGoal21)) {
      issues.push('Goal placement does not anchor a legal exit side (use bottom row for vertical goal, hug left/right for horizontal goal)')
    }

    if (
      exitDirection === 'down' &&
      puzzle.goal.y + goalPiece.height !== puzzle.board.height
    ) {
      issues.push('Goal placement must align with bottom row (touch the exit corridor)')
    }

    if (
      exitDirection === 'left' &&
      puzzle.goal.x !== 0
    ) {
      issues.push('Left exit goal placement must touch the left edge')
    }

    if (
      exitDirection === 'right' &&
      puzzle.goal.x + goalPiece.width !== puzzle.board.width
    ) {
      issues.push('Right exit goal placement must touch the right edge')
    }
  }

  let replayState = createInitialState(puzzle)

  puzzle.sampleSolution.forEach((step, index) => {
    if (!canMove(replayState, step)) {
      issues.push(`Invalid sample solution step ${index + 1}: ${step.pieceId} ${step.direction}`)

      return
    }

    replayState = movePiece(replayState, step)
  })

  if (puzzle.sampleSolution.length > 0 && !isCleared(replayState)) {
    issues.push('Sample solution does not clear the puzzle')
  }

  const solvabilityBlocked = issues.some(
    (issue) =>
      issue.includes('Duplicate piece id') ||
      issue.includes('Invalid piece size') ||
      issue.includes('1x1 pieces are not allowed') ||
      issue.includes('2x2 pieces are not allowed') ||
      issue.includes('Unknown initial placement') ||
      issue.includes('Duplicate initial placement') ||
      issue.includes('Missing initial placement') ||
      issue.includes('Initial placement outside board') ||
      issue.includes('Initial placements overlap') ||
      issue.includes('Unknown goal piece') ||
      issue.includes('Goal placement outside board') ||
      issue.includes('Goal piece must be 1x2 or 2x1') ||
      issue.includes('Goal placement does not anchor a legal exit side') ||
      issue.includes('Goal placement must align with bottom row') ||
      issue.includes('Left exit goal placement must touch the left edge') ||
      issue.includes('Right exit goal placement must touch the right edge'),
  )

  if (!solvabilityBlocked) {
    const corridorMinimum = getCorridorMinimumMovesToClear(puzzle)
    const shouldUseFullSearch = corridorMinimum === null && puzzle.board.width * puzzle.board.height <= 30

    if (corridorMinimum !== null) {
      if (corridorMinimum < 2) {
        issues.push('初期状態からゴール脱出まで1手以内で済みます（単位移動で少なくとも2手必要です）')
      }
    } else if (shouldUseFullSearch) {
      const solvability = analyzePuzzleSolvability(puzzle)

      if (!solvability.solvable) {
        issues.push(
          solvability.reason === 'visitLimit'
            ? 'クリア到達の探索が状態数上限を超えました（盤面の縮小か上限の見直しが必要です）'
            : '初期配置からクリア状態に到達できません（BFSで状態空間を枯渇）',
        )
      } else {
        const shortestExit = getMinimumMovesToClear(puzzle)

        if (!Number.isFinite(shortestExit) || shortestExit < 2) {
          issues.push('初期状態からゴール脱出まで1手以内で済みます（単位移動で少なくとも2手必要です）')
        }
      }
    } else if (puzzle.sampleSolution.length === 0) {
      issues.push(
        '大きい盤面のため全域BFSを省略しましたが、検証済みサンプル解法がありません',
      )
    }

    if (canClearInOneActionFromInitial(puzzle)) {
      issues.push('初期状態から1回の連続スライド操作でゴール脱出できます')
    }
  }

  return issues
}
