import type { Puzzle } from '../domain'

type PuzzleSelectScreenProps = {
  readonly puzzles: readonly Puzzle[]
  readonly clearedPuzzleIds: readonly string[]
  readonly onBack: () => void
  readonly onSelectPuzzle: (puzzle: Puzzle) => void
}

export function PuzzleSelectScreen({
  puzzles,
  clearedPuzzleIds,
  onBack,
  onSelectPuzzle,
}: PuzzleSelectScreenProps) {
  return (
    <main className="screen">
      <button className="text-action" onClick={onBack} type="button">
        ホームへ戻る
      </button>
      <h1>問題選択</h1>
      <div className="puzzle-list">
        {puzzles.map((puzzle) => (
          <button
            className="puzzle-card"
            key={puzzle.id}
            onClick={() => onSelectPuzzle(puzzle)}
            type="button"
          >
            <span>{clearedPuzzleIds.includes(puzzle.id) ? 'クリア済み' : '未クリア'}</span>
            <strong>{puzzle.title}</strong>
            <small>{puzzle.description}</small>
          </button>
        ))}
      </div>
    </main>
  )
}
