import type { Puzzle, PuzzleDifficulty } from '../domain/types'
import {
  analyzePuzzleDifficulty,
  analyzePuzzleSolvability,
  canClearInOneActionFromInitial,
  canMove,
  createInitialState,
  getCorridorMinimumMovesToClear,
  getMinimumMovesToClear,
  isCleared,
  movePiece,
  validatePuzzle,
} from '../domain/engine'
import { puzzles } from '../puzzles/catalog'

type CheckFailure = { readonly id: string; readonly label: string; readonly detail: string }

const titlePattern = /^問題[1-9]\d*$/

function goalDimensionsOk(puzzle: Puzzle): boolean {
  const piece = puzzle.pieces.find((p) => p.id === puzzle.goal.pieceId)

  if (!piece) {
    return false
  }

  const ok12 = piece.width === 1 && piece.height === 2
  const ok21 = piece.width === 2 && piece.height === 1

  return ok12 || ok21
}

function noTwoByTwoPiece(puzzle: Puzzle): boolean {
  return !puzzle.pieces.some((p) => p.width === 2 && p.height === 2)
}

function sampleClearsPuzzle(puzzle: Puzzle): { ok: boolean; detail: string } {
  if (puzzle.sampleSolution.length === 0) {
    return { ok: false, detail: 'sampleSolution が空' }
  }

  let state = createInitialState(puzzle)

  for (let i = 0; i < puzzle.sampleSolution.length; i++) {
    const step = puzzle.sampleSolution[i]!

    if (!canMove(state, step)) {
      return {
        ok: false,
        detail: `ステップ ${i + 1} が非法: ${step.pieceId} ${step.direction}`,
      }
    }

    state = movePiece(state, step)
  }

  if (!isCleared(state)) {
    return { ok: false, detail: '全ステップ後も isCleared が false' }
  }

  return { ok: true, detail: '' }
}

function printHardTestMetrics(): void {
  console.log('const hardPuzzleExpectedMetrics = [')

  for (const puzzle of puzzles.filter((p) => p.difficulty === 'hard')) {
    const metrics = analyzePuzzleDifficulty(puzzle, 100_000)

    if (!metrics.solvable) {
      throw new Error(`難問メトリクスを生成できません: ${puzzle.id} (${metrics.reason})`)
    }

    console.log(
      `  ['${puzzle.id}', ${metrics.minUnitMoves}, ${metrics.minActions}, ${metrics.visitedBeforeGoal}, ${metrics.averageBranching.toFixed(1)}, ${metrics.difficultyScore.toFixed(1)}],`,
    )
  }

  console.log('] as const')
}

function main(): void {
  if (process.argv.includes('--print-hard-test-metrics')) {
    printHardTestMetrics()
    return
  }

  const byDifficulty = {
    intro: 0,
    standard: 0,
    hard: 0,
  } satisfies Record<PuzzleDifficulty, number>

  const failures: CheckFailure[] = []
  const shortestClears: { readonly id: string; readonly shortestMovesToClear: number }[] = []
  const difficultyMetrics: {
    readonly id: string
    readonly difficultyScore: number
    readonly minUnitMoves: number
    readonly minActions: number
    readonly visitedBeforeGoal: number
    readonly averageBranching: number
  }[] = []

  for (const puzzle of puzzles) {
    byDifficulty[puzzle.difficulty]++

    if (!titlePattern.test(puzzle.title.trim())) {
      failures.push({
        id: puzzle.id,
        label: 'titlePattern',
        detail: `タイトルは「問題N」形式である必要があります (got "${puzzle.title}")`,
      })
    }

    let shortestMovesToClear = Number.NaN

    const corridorMinimum = getCorridorMinimumMovesToClear(puzzle)

    if (corridorMinimum !== null) {
      shortestMovesToClear = corridorMinimum
    } else {
      try {
        shortestMovesToClear = getMinimumMovesToClear(puzzle)
      } catch (e) {
        failures.push({
          id: puzzle.id,
          label: 'minimumMovesToClear',
          detail: e instanceof Error ? e.message : String(e),
        })
      }
    }

    shortestClears.push({ id: puzzle.id, shortestMovesToClear })

    const v = validatePuzzle(puzzle)

    if (v.length > 0) {
      for (const msg of v) {
        failures.push({ id: puzzle.id, label: 'validatePuzzle', detail: msg })
      }
    }

    let solvable: boolean
    let solvDetail: string

    if (corridorMinimum !== null) {
      solvable = true
      solvDetail = ''
    } else {
      try {
        const analysis = analyzePuzzleSolvability(puzzle)
        solvable = analysis.solvable

        if (analysis.solvable) {
          solvDetail = ''
        } else {
          solvDetail =
            analysis.reason === 'visitLimit' ? 'visitLimit（状態数上限）' : 'exhausted（BFS 枯渇）'
        }
      } catch (e) {
        solvable = false
        solvDetail = e instanceof Error ? e.message : String(e)
      }
    }

    if (!solvable) {
      failures.push({
        id: puzzle.id,
        label: 'solvability',
        detail: solvDetail || '到達不可',
      })
    } else if (Number.isFinite(shortestMovesToClear) && shortestMovesToClear < 2) {
      failures.push({
        id: puzzle.id,
        label: 'minimumMovesTwo',
        detail: `初期から単位移動での最短脱出が ${shortestMovesToClear} 手です（2 以上必要）`,
      })
    }

    if (canClearInOneActionFromInitial(puzzle)) {
      failures.push({
        id: puzzle.id,
        label: 'oneActionClear',
        detail: '初期状態から1回の連続スライド操作で脱出できます',
      })
    }

    const metrics = analyzePuzzleDifficulty(puzzle)

    if (metrics.solvable) {
      difficultyMetrics.push({
        id: puzzle.id,
        difficultyScore: Number(metrics.difficultyScore.toFixed(1)),
        minUnitMoves: metrics.minUnitMoves,
        minActions: metrics.minActions,
        visitedBeforeGoal: metrics.visitedBeforeGoal,
        averageBranching: Number(metrics.averageBranching.toFixed(1)),
      })

      if (
        puzzle.difficulty === 'hard' &&
        (metrics.difficultyScore < 70 ||
          metrics.minUnitMoves < 8 ||
          metrics.minActions < 4 ||
          metrics.visitedBeforeGoal < 70 ||
          metrics.averageBranching < 6)
      ) {
        failures.push({
          id: puzzle.id,
          label: 'hardDifficultyMetrics',
          detail: `難問として弱い: score=${metrics.difficultyScore.toFixed(1)}, unit=${metrics.minUnitMoves}, actions=${metrics.minActions}, visited=${metrics.visitedBeforeGoal}, branching=${metrics.averageBranching.toFixed(1)}`,
        })
      }
    } else {
      failures.push({
        id: puzzle.id,
        label: 'actionDifficultySolvability',
        detail: metrics.reason,
      })
    }

    if (!noTwoByTwoPiece(puzzle)) {
      failures.push({
        id: puzzle.id,
        label: 'piece2x2',
        detail: '2×2 の駒が含まれる',
      })
    }

    if (!goalDimensionsOk(puzzle)) {
      const g = puzzle.pieces.find((p) => p.id === puzzle.goal.pieceId)

      failures.push({
        id: puzzle.id,
        label: 'goalSize',
        detail: g
          ? `ゴール駒 ${g.id} が ${g.width}×${g.height}（1×2 または 2×1 のみ）`
          : `ゴール駒 ID ${puzzle.goal.pieceId} が見つからない`,
      })
    }

    const sample = sampleClearsPuzzle(puzzle)

    if (!sample.ok) {
      failures.push({
        id: puzzle.id,
        label: 'sampleSolution→cleared',
        detail: sample.detail,
      })
    }
  }

  const sampleShortestClears = shortestClears.slice(0, 5)
  const allShortestClears = shortestClears.map((entry, index) => ({ ...entry, number: index + 1 }))

  console.log(
    JSON.stringify(
      {
        total: puzzles.length,
        byDifficulty,
        failures,
        sampleShortestClears,
        allShortestClears,
        difficultyMetrics,
      },
      null,
      2,
    ),
  )
}

main()
