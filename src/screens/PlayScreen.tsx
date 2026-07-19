import {
  directions,
  getLegalDirections,
  tryGoalExitDirection,
  type Direction,
  type PieceId,
  type PuzzleState,
} from '../domain'
import { BoardView } from '../ui'

const directionLabels: Record<Direction, { readonly label: string; readonly icon: string }> = {
  up: { label: '上', icon: '↑' },
  down: { label: '下', icon: '↓' },
  left: { label: '左', icon: '←' },
  right: { label: '右', icon: '→' },
}

export type PlayHint =
  | { readonly kind: 'computing' }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'piece'; readonly pieceName: string }
  | { readonly kind: 'move'; readonly pieceName: string; readonly direction: Direction }

type PlayScreenProps = {
  readonly state: PuzzleState
  readonly selectedPieceId: PieceId | null
  readonly canUndo: boolean
  readonly hint: PlayHint | null
  readonly freeHintsRemaining: number
  readonly onBack: () => void
  readonly onHint: () => void
  readonly onMove: (direction: Direction) => void
  readonly onMovePiece: (pieceId: PieceId, direction: Direction, steps: number) => void
  readonly onSelectPiece: (pieceId: PieceId) => void
  readonly onUndo: () => void
}

export function PlayScreen({
  state,
  selectedPieceId,
  canUndo,
  hint,
  freeHintsRemaining,
  onBack,
  onHint,
  onMove,
  onMovePiece,
  onSelectPiece,
  onUndo,
}: PlayScreenProps) {
  const selectedPiece = state.puzzle.pieces.find((piece) => piece.id === selectedPieceId)
  const legalDirectionsByPiece = new Map(
    state.puzzle.pieces.map((piece) => [piece.id, getLegalDirections(state, piece.id)]),
  )
  const selectedLegalDirections = selectedPieceId
    ? (legalDirectionsByPiece.get(selectedPieceId) ?? [])
    : []
  const selectedDirectionText =
    selectedLegalDirections.length > 0
      ? selectedLegalDirections.map((direction) => directionLabels[direction].label).join('・')
      : 'なし'
  const exitDirection = tryGoalExitDirection(state.puzzle)
  const showsSideExitGuide = exitDirection === 'left' || exitDirection === 'right'

  return (
    <main className="screen play-screen">
      <div className="screen-header">
        <button className="text-action" onClick={onBack} type="button">
          問題選択へ
        </button>
        <p>{state.history.length}手</p>
      </div>
      <h1>{state.puzzle.title}</h1>
      {showsSideExitGuide && (
        <p className="play-guide">
          この難問群は右側の EXIT がゴールです。赤いターゲットは横へ、縦長・横長ブロックは形に沿った軸だけへ動きます。
        </p>
      )}

      <div className="play-layout">
        <BoardView
          legalDirectionsByPiece={legalDirectionsByPiece}
          onMovePiece={onMovePiece}
          onSelectPiece={onSelectPiece}
          selectedPieceId={selectedPieceId}
          state={state}
        />
        <section className="control-panel" aria-label="操作">
          <div className="selection-status" aria-live="polite">
            <span>選択中</span>
            <strong>{selectedPiece?.name ?? '駒を選んでください'}</strong>
            <small>移動可能: {selectedPiece ? selectedDirectionText : '駒を選択してください'}</small>
          </div>
          <div className="support-panel" aria-live="polite">
            <button
              className="secondary-action"
              disabled={hint !== null && hint.kind !== 'piece'}
              onClick={onHint}
              type="button"
            >
              {hint === null && 'ヒントを見る'}
              {hint?.kind === 'computing' && 'ヒントを計算中…'}
              {hint?.kind === 'piece' &&
                (freeHintsRemaining > 0 ? '動かす方向も見る' : '広告を見て方向を表示')}
              {hint?.kind === 'move' && 'ヒント表示中'}
              {hint?.kind === 'unavailable' && 'ヒントを見る'}
            </button>
            {hint?.kind === 'piece' && <small>次に動かす駒: {hint.pieceName}</small>}
            {hint?.kind === 'move' && (
              <small>
                「{hint.pieceName}」を{directionLabels[hint.direction].label}へ
              </small>
            )}
            {hint?.kind === 'unavailable' && <small>この配置ではヒントを計算できませんでした</small>}
            <small>
              {freeHintsRemaining > 0
                ? `無料ヒント残り: ${freeHintsRemaining}回`
                : '無料ヒントを使い切りました（広告視聴で解放）'}
            </small>
          </div>
          <div className="direction-pad" aria-label="選択中の駒を動かす">
            {directions.map((direction) => {
              const isAvailable = selectedLegalDirections.includes(direction)

              return (
                <button
                  aria-label={`${directionLabels[direction].label}へ移動`}
                  className={`direction-button direction-${direction}`}
                  data-available={isAvailable}
                  disabled={!selectedPieceId || !isAvailable}
                  key={direction}
                  onClick={() => onMove(direction)}
                  type="button"
                >
                  <span>{directionLabels[direction].icon}</span>
                  <small>{directionLabels[direction].label}</small>
                </button>
              )
            })}
          </div>
          <button disabled={!canUndo} onClick={onUndo} type="button">
            一手戻す
          </button>
        </section>
      </div>
    </main>
  )
}
