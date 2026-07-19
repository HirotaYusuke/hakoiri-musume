import type { Puzzle } from '../domain'
import type { PuzzlePack } from '../puzzles'

const difficultyLabels: Record<Puzzle['difficulty'], string> = {
  intro: '入門',
  standard: '標準',
  hard: '難問',
}

type PuzzleSelectScreenProps = {
  readonly puzzles: readonly Puzzle[]
  readonly packs: readonly PuzzlePack[]
  readonly clearedPuzzleIds: readonly string[]
  readonly bestMovesByPuzzleId: Readonly<Record<string, number>>
  readonly purchasedPackIds: readonly string[]
  readonly onBack: () => void
  readonly onPurchasePack: (packId: string) => void
  readonly onSelectPuzzle: (puzzle: Puzzle) => void
}

function PuzzleList({
  puzzles,
  clearedPuzzleIds,
  bestMovesByPuzzleId,
  onSelectPuzzle,
}: Pick<
  PuzzleSelectScreenProps,
  'puzzles' | 'clearedPuzzleIds' | 'bestMovesByPuzzleId' | 'onSelectPuzzle'
>) {
  return (
    <div className="puzzle-list">
      {puzzles.map((puzzle) => {
        const best = bestMovesByPuzzleId[puzzle.id]

        return (
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
            {best !== undefined && <small>自己ベスト: {best}手</small>}
          </button>
        )
      })}
    </div>
  )
}

export function PuzzleSelectScreen({
  puzzles,
  packs,
  clearedPuzzleIds,
  bestMovesByPuzzleId,
  purchasedPackIds,
  onBack,
  onPurchasePack,
  onSelectPuzzle,
}: PuzzleSelectScreenProps) {
  return (
    <main className="screen">
      <button className="text-action" onClick={onBack} type="button">
        ホームへ戻る
      </button>
      <h1>問題選択</h1>
      {packs.map((pack) =>
        purchasedPackIds.includes(pack.id) ? null : (
          <button
            className="commerce-card"
            key={pack.id}
            onClick={() => onPurchasePack(pack.id)}
            type="button"
          >
            <span>追加問題パック・{pack.priceLabel}</span>
            <strong>{pack.title}</strong>
            <small>{pack.description}</small>
          </button>
        ),
      )}
      {(['intro', 'standard', 'hard'] as const).map((difficulty) => {
        const group = puzzles.filter((puzzle) => puzzle.difficulty === difficulty)

        if (group.length === 0) {
          return null
        }

        return (
          <section aria-label={difficultyLabels[difficulty]} key={difficulty}>
            <h2>{difficultyLabels[difficulty]}</h2>
            <PuzzleList
              bestMovesByPuzzleId={bestMovesByPuzzleId}
              clearedPuzzleIds={clearedPuzzleIds}
              onSelectPuzzle={onSelectPuzzle}
              puzzles={group}
            />
          </section>
        )
      })}
      {packs
        .filter((pack) => purchasedPackIds.includes(pack.id))
        .map((pack) => (
          <section aria-label={pack.title} key={pack.id}>
            <h2>{pack.title}</h2>
            <PuzzleList
              bestMovesByPuzzleId={bestMovesByPuzzleId}
              clearedPuzzleIds={clearedPuzzleIds}
              onSelectPuzzle={onSelectPuzzle}
              puzzles={pack.puzzles}
            />
          </section>
        ))}
    </main>
  )
}
