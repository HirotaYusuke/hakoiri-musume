import type { Puzzle } from '../domain'

const difficultyLabels: Record<Puzzle['difficulty'], string> = {
  intro: '入門',
  standard: '標準',
  hard: '難問',
}

type PuzzleSelectScreenProps = {
  readonly puzzles: readonly Puzzle[]
  readonly clearedPuzzleIds: readonly string[]
  readonly purchasedPackIds: readonly string[]
  readonly onBack: () => void
  readonly onSelectPack: () => void
  readonly onSelectPuzzle: (puzzle: Puzzle) => void
}

export function PuzzleSelectScreen({
  puzzles,
  clearedPuzzleIds,
  purchasedPackIds,
  onBack,
  onSelectPack,
  onSelectPuzzle,
}: PuzzleSelectScreenProps) {
  const hasPurchasedFirstPack = purchasedPackIds.includes('rush-pack-1')

  return (
    <main className="screen">
      <button className="text-action" onClick={onBack} type="button">
        ホームへ戻る
      </button>
      <h1>問題選択</h1>
      <button
        className="commerce-card"
        disabled={hasPurchasedFirstPack}
        onClick={onSelectPack}
        type="button"
      >
        <span>追加問題パック</span>
        <strong>{hasPurchasedFirstPack ? '購入済み' : '高難度パックを有効化'}</strong>
        <small>
          Phase 1では課金導線と保存状態だけを検証します。実決済はストア連携時に差し替えます。
        </small>
      </button>
      <div className="puzzle-list">
        {puzzles.map((puzzle) => (
          <button
            className="puzzle-card"
            key={puzzle.id}
            onClick={() => onSelectPuzzle(puzzle)}
            type="button"
          >
            <span>
              {difficultyLabels[puzzle.difficulty]}・
              {clearedPuzzleIds.includes(puzzle.id) ? 'クリア済み' : '未クリア'}
            </span>
            <strong>{puzzle.title}</strong>
          </button>
        ))}
      </div>
    </main>
  )
}
