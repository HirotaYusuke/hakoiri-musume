import type { Puzzle } from '../domain'
import { buildGoalExitSolutionStep } from '../domain/engine'
import { createRushPackPuzzles } from './scrambleCore'

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
    description: '本編の最難関クラス以上だけを集めた、検証済みの追加難問12問。',
    priceLabel: '¥480（予定）',
    puzzles: createRushPackPuzzles()
      .map(appendExitStep)
      .map((puzzle, index) => ({
        ...puzzle,
        title: `EX${index + 1}`,
        description: '',
      })),
  },
]

export const findPack = (packId: string): PuzzlePack | undefined =>
  puzzlePacks.find((pack) => pack.id === packId)
