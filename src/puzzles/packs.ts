import type { Puzzle } from '../domain'
import { buildGoalExitSolutionStep } from '../domain/engine'
import { createRushHardcorePuzzles, createRushPackPuzzles } from './scrambleCore'

export type PuzzlePack = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly priceLabel: string
  readonly puzzles: readonly Puzzle[]
}

const appendExitStep = (puzzle: Puzzle): Puzzle => ({
  ...puzzle,
  sampleSolution: [...puzzle.sampleSolution, buildGoalExitSolutionStep(puzzle)],
})

export const puzzlePacks: readonly PuzzlePack[] = [
  {
    id: 'rush-pack-1',
    title: '難問パック EX',
    description:
      '本編にない10駒構成の検証済み難問12問。全問が本編最難関（最短15手）以上、最深は21手。',
    priceLabel: '¥480（予定）',
    puzzles: createRushPackPuzzles()
      .map(appendExitStep)
      .map((puzzle, index) => ({
        ...puzzle,
        title: `EX${index + 1}`,
        description: '',
      })),
  },
  {
    id: 'rush-pack-2',
    title: '超難問パック',
    description:
      '12駒の高密度盤面による検証済み超難問12問。最短26〜37手、EXパックのさらに上位帯。',
    priceLabel: '¥600（予定）',
    puzzles: createRushHardcorePuzzles()
      .map(appendExitStep)
      .map((puzzle, index) => ({
        ...puzzle,
        title: `EXX${index + 1}`,
        description: '',
      })),
  },
]

export const findPack = (packId: string): PuzzlePack | undefined =>
  puzzlePacks.find((pack) => pack.id === packId)
