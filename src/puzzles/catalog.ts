import type { Puzzle } from '../domain'
import { buildGoalExitSolutionStep, canClearInOneActionFromInitial } from '../domain/engine'
import {
  catalogSteps as steps,
  createGeneratedRectangularPuzzle as createGeneratedPuzzle,
  createRushHourHardPuzzles,
  createSeededRectangularPuzzle as createSeededPuzzle,
  placementLayoutSignature,
  rectangularPieces,
  rectangularSolvedPlacements as solvedPlacements,
} from './scrambleCore'

/** 標準セットのゴールは縦長1×2（下側EXIT）。下梁で出口列を塞ぎ、初期1操作クリアを禁止する。 */

const takenPlacementLayouts = new Set<string>()
const placementSignatureOwners = new Map<string, string>()

function registerPuzzleLayout(puzzle: Puzzle, options?: { readonly allowDuplicate?: boolean }): Puzzle {
  const signature = placementLayoutSignature(puzzle.initialPlacements)

  if (takenPlacementLayouts.has(signature)) {
    if (options?.allowDuplicate) {
      return puzzle
    }

    throw new Error(
      `catalog: duplicate initial layout for ${puzzle.id} (matches ${placementSignatureOwners.get(signature)})`,
    )
  }

  takenPlacementLayouts.add(signature)
  placementSignatureOwners.set(signature, puzzle.id)
  return puzzle
}

function createSeededPuzzleUnique(
  params: Parameters<typeof createSeededPuzzle>[0],
  /** カタログ同期生成のコスト削減（失敗時はシードを手でずらす） */
  maxAttempts = 600,
): Puzzle {
  for (let delta = 0; delta < maxAttempts; delta++) {
    const candidate = createSeededPuzzle({ ...params, scrambleSeed: params.scrambleSeed + delta })
    const signature = placementLayoutSignature(candidate.initialPlacements)

    if (takenPlacementLayouts.has(signature)) {
      continue
    }

    if (canClearInOneActionFromInitial(candidate)) {
      continue
    }

    takenPlacementLayouts.add(signature)
    placementSignatureOwners.set(signature, params.id)
    return candidate
  }

  throw new Error(`catalog: could not find unique layout for ${params.id}`)
}

const appendExitStep = (puzzle: Puzzle): Puzzle => ({
  ...puzzle,
  sampleSolution: [...puzzle.sampleSolution, buildGoalExitSolutionStep(puzzle)],
})

/**
 * 手詰まりを避けるため、乱数シードで「解法の逆」となるスクランブル列を取る。
 * 長いシード列は縦専用・横専用の衝突を何度も解く必要が出やすく、すぐクリアしにくい。
 */
const puzzleCatalog: readonly Puzzle[] = [
  registerPuzzleLayout(
    createGeneratedPuzzle({
      id: 'intro-first-escape',
      difficulty: 'intro',
      pieces: rectangularPieces,
      solvedPlacements,
      scramble: steps(['musume', 'up'], ['bottomBeam', 'left']),
    }),
  ),
  registerPuzzleLayout(
    createGeneratedPuzzle({
      id: 'intro-left-gate',
      difficulty: 'intro',
      pieces: rectangularPieces,
      solvedPlacements,
      scramble: steps(['musume', 'up'], ['bottomBeam', 'left'], ['leftGate', 'down']),
    }),
  ),
  registerPuzzleLayout(
    createGeneratedPuzzle({
      id: 'intro-upper-room',
      difficulty: 'intro',
      pieces: rectangularPieces,
      solvedPlacements,
      scramble: steps(['musume', 'up'], ['bottomBeam', 'left'], ['leftGate', 'down'], ['leftGuard', 'down']),
    }),
  ),
  registerPuzzleLayout(
    createGeneratedPuzzle({
      id: 'intro-right-gate',
      difficulty: 'intro',
      pieces: rectangularPieces,
      solvedPlacements,
      scramble: steps(
        ['musume', 'up'],
        ['bottomBeam', 'left'],
        ['rightGate', 'down'],
      ),
    }),
  ),
  registerPuzzleLayout(
    createGeneratedPuzzle({
      id: 'intro-double-gate',
      difficulty: 'intro',
      pieces: rectangularPieces,
      solvedPlacements,
      scramble: steps(
        ['musume', 'up'],
        ['bottomBeam', 'left'],
        ['leftGate', 'down'],
        ['leftGuard', 'down'],
        ['rightGate', 'down'],
      ),
    }),
  ),
  createSeededPuzzleUnique({
    id: 'standard-twin-guards',
    difficulty: 'standard',
    pieces: rectangularPieces,
    solvedPlacements,
    scrambleLength: 12,
    scrambleSeed: 18,
  }),
  createSeededPuzzleUnique({
    id: 'standard-side-doors',
    difficulty: 'standard',
    pieces: rectangularPieces,
    solvedPlacements,
    scrambleLength: 12,
    scrambleSeed: 34,
  }),
  createSeededPuzzleUnique({
    id: 'standard-two-pages',
    difficulty: 'standard',
    pieces: rectangularPieces,
    solvedPlacements,
    scrambleLength: 11,
    scrambleSeed: 14,
  }),
  createSeededPuzzleUnique({
    id: 'standard-hakoiri-musume',
    difficulty: 'standard',
    pieces: rectangularPieces,
    solvedPlacements,
    scrambleLength: 14,
    scrambleSeed: 52,
  }),
  createSeededPuzzleUnique({
    id: 'standard-crowded-court',
    difficulty: 'standard',
    pieces: rectangularPieces,
    solvedPlacements,
    scrambleLength: 12,
    scrambleSeed: 59,
  }),
  createSeededPuzzleUnique({
    id: 'standard-inner-gate',
    difficulty: 'standard',
    pieces: rectangularPieces,
    solvedPlacements,
    scrambleLength: 13,
    scrambleSeed: 43,
  }),
  createSeededPuzzleUnique({
    id: 'standard-storeroom-loop',
    difficulty: 'standard',
    pieces: rectangularPieces,
    solvedPlacements,
    scrambleLength: 11,
    scrambleSeed: 2,
  }),
  createSeededPuzzleUnique({
    id: 'standard-lower-corridor',
    difficulty: 'standard',
    pieces: rectangularPieces,
    solvedPlacements,
    scrambleLength: 13,
    scrambleSeed: 23,
  }),
  createSeededPuzzleUnique({
    id: 'standard-western-slide',
    difficulty: 'standard',
    pieces: rectangularPieces,
    solvedPlacements,
    scrambleLength: 12,
    scrambleSeed: 71,
  }),
  ...createRushHourHardPuzzles().map((puzzle) => registerPuzzleLayout(puzzle)),
]

export const puzzles: readonly Puzzle[] = puzzleCatalog.map(appendExitStep).map((puzzle, index) => ({
  ...puzzle,
  title: `問題${index + 1}`,
  description: '',
}))

export const findPuzzle = (puzzleId: string): Puzzle | undefined =>
  puzzles.find((puzzle) => puzzle.id === puzzleId)
