import type { Direction, PieceId, PuzzleState } from '../domain'

type BoardViewProps = {
  readonly state: PuzzleState
  readonly selectedPieceId: PieceId | null
  readonly legalDirectionsByPiece: ReadonlyMap<PieceId, readonly Direction[]>
  readonly onSelectPiece: (pieceId: PieceId) => void
}

export function BoardView({
  state,
  selectedPieceId,
  legalDirectionsByPiece,
  onSelectPiece,
}: BoardViewProps) {
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

        const legalDirections = legalDirectionsByPiece.get(piece.id) ?? []
        const isSelected = selectedPieceId === piece.id
        const selectionLabel = isSelected ? '選択中' : legalDirections.length > 0 ? '移動可能' : '移動不可'

        return (
          <button
            className={`piece piece-${piece.kind}`}
            aria-label={`${piece.name}: ${selectionLabel}`}
            aria-pressed={isSelected}
            data-movable={legalDirections.length > 0}
            data-selected={isSelected}
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
