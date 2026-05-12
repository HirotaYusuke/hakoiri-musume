import type { PieceId, PuzzleState } from '../domain'

type BoardViewProps = {
  readonly state: PuzzleState
  readonly selectedPieceId: PieceId | null
  readonly onSelectPiece: (pieceId: PieceId) => void
}

export function BoardView({ state, selectedPieceId, onSelectPiece }: BoardViewProps) {
  return (
    <div
      className="board"
      style={{
        gridTemplateColumns: `repeat(${state.puzzle.board.width}, var(--cell-size))`,
        gridTemplateRows: `repeat(${state.puzzle.board.height}, var(--cell-size))`,
      }}
      aria-label={`${state.puzzle.title}の盤面`}
    >
      <div
        className="goal-zone"
        style={{
          gridColumn: `${state.puzzle.goal.x + 1} / span 2`,
          gridRow: `${state.puzzle.goal.y + 1} / span 2`,
        }}
      />
      {state.placements.map((placement) => {
        const piece = state.puzzle.pieces.find((candidate) => candidate.id === placement.pieceId)

        if (!piece) {
          return null
        }

        return (
          <button
            className={`piece piece-${piece.kind}`}
            data-selected={selectedPieceId === piece.id}
            key={piece.id}
            onClick={() => onSelectPiece(piece.id)}
            style={{
              gridColumn: `${placement.x + 1} / span ${piece.width}`,
              gridRow: `${placement.y + 1} / span ${piece.height}`,
            }}
            type="button"
          >
            {piece.name}
          </button>
        )
      })}
    </div>
  )
}
