/**
 * Rush Hour 難問（本編36問 + 追加パック12問）の固定データを一括再生成する。
 *
 *   npx tsx src/scripts/regenerate-rush-specs.ts
 *
 * 本編は基本9駒テンプレート、パックは高密度10駒テンプレート（rushEx）から生成する。
 * テンプレートが異なるため、本編とパックの重複は構造的に発生しない。
 *
 * 選定ルール（体験の重複を防ぐ）:
 * - サンプル解法の編集距離が、同セット内の採用済みのどの問題とも閾値以上
 * - 初期配置の差分が、採用済みのどの問題とも 2 駒以上
 * - 同一 unit 距離クラス内で musume の初期位置は最大3問まで
 * - 難問メトリクス閾値（score/unit/actions/visited/branching）を満たす
 *
 * 出力を scrambleCore.ts の rushHourFixedSpecs / rushPackFixedSpecs に貼り付けたら、
 * `npx tsx src/scripts/verify-puzzle-catalog.ts --print-hard-test-metrics` で
 * engine.test.ts の固定メトリクスを更新する。
 */
import type { Puzzle, SolutionStep } from '../domain/types'
import { analyzePuzzleDifficulty } from '../domain/engine'
import {
  createRushGraph,
  createRushSolution,
  rushExPieces,
  rushExSolvedPlacements,
  rushHardcorePieces,
  rushHardcoreSolvedPlacements,
  rushHourBoard,
  rushHourGoalPlacement,
  rushHourPieces,
  rushHourSolvedPlacements,
  type RushTemplate,
} from '../puzzles/scrambleCore'

const minPlacementDiff = 2
const maxSameMusumePerUnitClass = 3

type Candidate = {
  readonly key: string
  readonly unit: number
  readonly slide: number
  readonly placements: readonly { readonly pieceId: string; readonly x: number; readonly y: number }[]
  readonly solution: readonly SolutionStep[]
}

const solutionTokens = (solution: readonly SolutionStep[]): string[] =>
  solution.map((step) => `${step.pieceId}:${step.direction}`)

function editDistance(a: readonly string[], b: readonly string[]): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i]![j] = Math.min(
        dp[i - 1]![j]! + 1,
        dp[i]![j - 1]! + 1,
        dp[i - 1]![j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
  }

  return dp[a.length]![b.length]!
}

const placementDiff = (a: Candidate, b: Candidate): number => {
  const bByPiece = new Map(b.placements.map((p) => [p.pieceId, `${p.x},${p.y}`]))

  return a.placements.filter((p) => bByPiece.get(p.pieceId) !== `${p.x},${p.y}`).length
}

const musumePosition = (candidate: Candidate): string => {
  const musume = candidate.placements.find((p) => p.pieceId === 'musume')!

  return `${musume.x},${musume.y}`
}

function selectFromTemplate(params: {
  readonly label: string
  readonly template: RushTemplate
  readonly unitTargets: readonly number[]
  readonly minSolutionEditDistance: number
}): Candidate[] {
  const { label, template, unitTargets, minSolutionEditDistance } = params
  const unitGraph = createRushGraph('unit', template)
  const slideGraph = createRushGraph('slide', template)
  const candidatesByUnit = new Map<number, Candidate[]>()
  let maxUnit = 0

  for (const [key, node] of unitGraph.nodes) {
    const unit = unitGraph.distanceToExit.get(key)
    const slide = slideGraph.distanceToExit.get(key)

    if (unit === undefined || slide === undefined || slide < 4) {
      continue
    }

    maxUnit = Math.max(maxUnit, unit)

    const list = candidatesByUnit.get(unit) ?? []

    list.push({ key, unit, slide, placements: node.placements, solution: createRushSolution(unitGraph, key) })
    candidatesByUnit.set(unit, list)
  }

  console.log(`\n[${label}] 状態数=${unitGraph.nodes.size} 最深unit=${maxUnit}`)
  console.log(
    `[${label}] unit別候補数: ${[...candidatesByUnit.keys()]
      .toSorted((a, b) => a - b)
      .filter((unit) => unit >= 8)
      .map((unit) => `${unit}:${candidatesByUnit.get(unit)!.length}`)
      .join(' ')}`,
  )

  for (const list of candidatesByUnit.values()) {
    list.sort((a, b) => b.slide - a.slide || a.key.localeCompare(b.key))
  }

  const toPuzzle = (candidate: Candidate): Puzzle => ({
    id: 'threshold-check',
    title: '',
    description: '',
    difficulty: 'hard',
    board: template.board,
    goal: template.goal,
    pieces: template.pieces,
    initialPlacements: candidate.placements.map((p) => ({ ...p })),
    sampleSolution: candidate.solution,
  })

  const meetsHardThresholds = (candidate: Candidate): boolean => {
    const metrics = analyzePuzzleDifficulty(toPuzzle(candidate))

    return (
      metrics.solvable &&
      metrics.difficultyScore >= 70 &&
      metrics.minUnitMoves >= 8 &&
      metrics.minActions >= 4 &&
      metrics.visitedBeforeGoal >= 70 &&
      metrics.averageBranching >= 6
    )
  }

  const accepted: Candidate[] = []
  const shortfalls: number[] = []

  // 深い階層ほど候補が希少なので、深い順に選定してから出力は昇順に並べ直す
  for (const unit of unitTargets.toSorted((a, b) => b - a)) {
    const list = candidatesByUnit.get(unit) ?? []
    const sameUnitAccepted = accepted.filter((c) => c.unit === unit)
    const pick = list.find((candidate) => {
      if (accepted.some((c) => c.key === candidate.key)) {
        return false
      }

      if (
        sameUnitAccepted.filter((c) => musumePosition(c) === musumePosition(candidate)).length >=
        maxSameMusumePerUnitClass
      ) {
        return false
      }

      const tokens = solutionTokens(candidate.solution)

      return (
        accepted.every((c) => editDistance(tokens, solutionTokens(c.solution)) >= minSolutionEditDistance) &&
        accepted.every((c) => placementDiff(candidate, c) >= minPlacementDiff) &&
        meetsHardThresholds(candidate)
      )
    })

    if (!pick) {
      shortfalls.push(unit)
      continue
    }

    accepted.push(pick)
  }

  if (shortfalls.length > 0) {
    console.log(`⚠ [${label}] 候補が見つからなかった unit: ${shortfalls.join(', ')}`)
  }

  return accepted.toSorted((a, b) => a.unit - b.unit || a.slide - b.slide || a.key.localeCompare(b.key))
}

const compact: Record<string, string> = { up: 'U', down: 'D', left: 'L', right: 'R' }

const formatSpec = (candidate: Candidate, id: string, pieceOrder: readonly string[]): string => {
  const placements = pieceOrder
    .map((pieceId) => {
      const p = candidate.placements.find((entry) => entry.pieceId === pieceId)!

      return `${pieceId}:${p.x},${p.y}`
    })
    .join(' ')
  const solution = candidate.solution.map((step) => `${step.pieceId}${compact[step.direction]}`).join(' ')

  return `  ['${id}', '${placements}', '${solution}'], // unit=${candidate.unit} slide=${candidate.slide}`
}

const mainTemplate: RushTemplate = {
  board: rushHourBoard,
  goal: rushHourGoalPlacement,
  pieces: rushHourPieces,
  solvedPlacements: rushHourSolvedPlacements,
}

const packTemplate: RushTemplate = {
  board: rushHourBoard,
  goal: rushHourGoalPlacement,
  pieces: rushExPieces,
  solvedPlacements: rushExSolvedPlacements,
}

const hardcoreTemplate: RushTemplate = {
  board: rushHourBoard,
  goal: rushHourGoalPlacement,
  pieces: rushHardcorePieces,
  solvedPlacements: rushHardcoreSolvedPlacements,
}

const mainUnitTargets = [8, 8, 8, 8, 8, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 11, 11, 11, 11, 11, 12, 12, 12, 12, 12, 12, 12, 13, 13, 13, 13, 13, 14, 14, 15, 15]
// 予備込みのターゲット。充足分から深い側の12問を採用する
const packUnitTargets = [15, 15, 15, 15, 16, 16, 17, 17, 17, 18, 18, 19, 20, 21]
const hardcoreUnitTargets = [26, 26, 27, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37]
const packSize = 12

const main = selectFromTemplate({
  label: 'main',
  template: mainTemplate,
  unitTargets: mainUnitTargets,
  minSolutionEditDistance: 2,
})
const pack = selectFromTemplate({
  label: 'pack',
  template: packTemplate,
  unitTargets: packUnitTargets,
  minSolutionEditDistance: 2,
}).slice(-packSize)
const hardcore = selectFromTemplate({
  label: 'hardcore',
  template: hardcoreTemplate,
  unitTargets: hardcoreUnitTargets,
  minSolutionEditDistance: 3,
}).slice(-packSize)

console.log(`\n本編 ${main.length}問 / パック ${pack.length}問`)
console.log('\nconst rushHourFixedSpecs = [')
main.forEach((candidate, index) =>
  console.log(formatSpec(candidate, `rush-hard-${index + 1}`, rushHourPieces.map((p) => p.id))),
)
console.log('] as const')
console.log('\nconst rushPackFixedSpecs = [')
pack.forEach((candidate, index) =>
  console.log(formatSpec(candidate, `rush-pack1-${index + 1}`, rushExPieces.map((p) => p.id))),
)
console.log('] as const')
console.log('\nconst rushHardcoreFixedSpecs = [')
hardcore.forEach((candidate, index) =>
  console.log(formatSpec(candidate, `rush-pack2-${index + 1}`, rushHardcorePieces.map((p) => p.id))),
)
console.log('] as const')
console.log(`\nunit分布: main=[${main.map((c) => c.unit).join(',')}] pack=[${pack.map((c) => c.unit).join(',')}] hardcore=[${hardcore.map((c) => c.unit).join(',')}]`)
console.log(`slide分布: main=[${main.map((c) => c.slide).join(',')}] pack=[${pack.map((c) => c.slide).join(',')}] hardcore=[${hardcore.map((c) => c.slide).join(',')}]`)
