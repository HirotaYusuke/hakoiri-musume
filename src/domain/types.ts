export type PieceId = string

export type Direction = 'up' | 'down' | 'left' | 'right'

export type PieceKind = 'goal' | 'vertical' | 'horizontal' | 'small'

export type PuzzleDifficulty = 'intro' | 'standard' | 'hard'

export type Coordinate = {
  readonly x: number
  readonly y: number
}

export type BoardSize = {
  readonly width: number
  readonly height: number
}

/** width×height が 2×2 の駒は定義禁止（検証で弾く）。ゴール含むすべての駒が 1×2 / 2×1 / 1×3 など非正方形か横長・縦長のみ。 */
export type Piece = {
  readonly id: PieceId
  readonly name: string
  readonly width: number
  readonly height: number
  readonly kind: PieceKind
}

export type PiecePlacement = Coordinate & {
  readonly pieceId: PieceId
}

export type Move = {
  readonly pieceId: PieceId
  readonly direction: Direction
}

export type SolutionStep = Move & {
  readonly note?: string
}

export type Puzzle = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly difficulty: PuzzleDifficulty
  readonly board: BoardSize
  readonly goal: PiecePlacement
  readonly pieces: readonly Piece[]
  readonly initialPlacements: readonly PiecePlacement[]
  readonly sampleSolution: readonly SolutionStep[]
}

export type HistoryEntry = {
  readonly move: Move
  readonly placements: readonly PiecePlacement[]
}

export type PuzzleState = {
  readonly puzzle: Puzzle
  readonly placements: readonly PiecePlacement[]
  readonly history: readonly HistoryEntry[]
}
