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
