import type {
  Coordinate,
  Direction,
  Move,
  Piece,
  PieceId,
  PiecePlacement,
  Puzzle,
  PuzzleState,
} from './types'

const directionOffsets: Record<Direction, Coordinate> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

export const directions: readonly Direction[] = ['up', 'down', 'left', 'right']

const cellKey = ({ x, y }: Coordinate) => `${x}:${y}`

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

export const canMove = (state: PuzzleState, move: Move): boolean => {
  const piece = getPiece(state.puzzle, move.pieceId)
  const current = getPlacement(state.placements, move.pieceId)
  const offset = directionOffsets[move.direction]
  const nextPlacement = {
    x: current.x + offset.x,
    y: current.y + offset.y,
  }

  if (!isPlacementInsideBoard(state.puzzle, piece, nextPlacement)) {
    return false
  }

  const occupied = getOccupiedCells(state.puzzle, state.placements)

  return getPieceCells(piece, nextPlacement).every((cell) => {
    const occupant = occupied.get(cellKey(cell))
    return occupant === undefined || occupant === move.pieceId
  })
}

export const getLegalDirections = (state: PuzzleState, pieceId: PieceId): readonly Direction[] =>
  directions.filter((direction) => canMove(state, { pieceId, direction }))

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
  const goalPlacement = getPlacement(state.placements, state.puzzle.goal.pieceId)

  return goalPlacement.x === state.puzzle.goal.x && goalPlacement.y === state.puzzle.goal.y
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

  return issues
}
