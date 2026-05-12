import type { Direction, PieceId, PuzzleState } from '../domain'
import { BoardView } from '../ui'

const directionLabels: Record<Direction, string> = {
  up: '上',
  down: '下',
  left: '左',
  right: '右',
}

type PlayScreenProps = {
  readonly state: PuzzleState
  readonly selectedPieceId: PieceId | null
  readonly canUndo: boolean
  readonly onBack: () => void
  readonly onMove: (direction: Direction) => void
  readonly onSelectPiece: (pieceId: PieceId) => void
  readonly onUndo: () => void
}

export function PlayScreen({
  state,
  selectedPieceId,
  canUndo,
  onBack,
  onMove,
  onSelectPiece,
  onUndo,
}: PlayScreenProps) {
  const selectedPiece = state.puzzle.pieces.find((piece) => piece.id === selectedPieceId)

  return (
    <main className="screen play-screen">
      <div className="screen-header">
        <button className="text-action" onClick={onBack} type="button">
          問題選択へ
        </button>
        <p>{state.history.length}手</p>
      </div>
      <h1>{state.puzzle.title}</h1>
      <p className="lead">{state.puzzle.description}</p>

      <div className="play-layout">
        <BoardView state={state} selectedPieceId={selectedPieceId} onSelectPiece={onSelectPiece} />
        <section className="control-panel" aria-label="操作">
          <p>選択中: {selectedPiece?.name ?? '駒を選んでください'}</p>
          <div className="direction-pad">
            {(Object.keys(directionLabels) as Direction[]).map((direction) => (
              <button
                disabled={!selectedPieceId}
                key={direction}
                onClick={() => onMove(direction)}
                type="button"
              >
                {directionLabels[direction]}
              </button>
            ))}
          </div>
          <button disabled={!canUndo} onClick={onUndo} type="button">
            一手戻す
          </button>
        </section>
      </div>
    </main>
  )
}
