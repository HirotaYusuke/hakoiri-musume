/**
 * 追加パック用の Rush Hour 難問固定データを生成する。
 *
 *   npx tsx src/scripts/generate-rush-pack-specs.ts
 *
 * 全状態グラフから、本編50問と初期配置が重複しない最深クラスの盤面を選び、
 * scrambleCore.ts の rushPackFixedSpecs 形式で出力する。
 */
import {
  createRushGraph,
  createRushHourHardPuzzles,
  createRushSolution,
  placementLayoutSignature,
  rushHourPieces,
} from '../puzzles/scrambleCore'

const packSize = 12

const unitGraph = createRushGraph('unit')
const slideGraph = createRushGraph('slide')
const existingSignatures = new Set(
  createRushHourHardPuzzles().map((puzzle) => placementLayoutSignature(puzzle.initialPlacements)),
)

const distribution = new Map<string, number>()

for (const key of unitGraph.nodes.keys()) {
  const unit = unitGraph.distanceToExit.get(key)
  const slide = slideGraph.distanceToExit.get(key)
  const label = `unit=${unit ?? '∞'} slide=${slide ?? '∞'}`

  distribution.set(label, (distribution.get(label) ?? 0) + 1)
}

const deepest = [...distribution.entries()]
  .filter(([label]) => !label.includes('∞'))
  .toSorted(([a], [b]) => {
    const unitOf = (label: string) => Number(label.match(/unit=(\d+)/)![1])
    const slideOf = (label: string) => Number(label.match(/slide=(\d+)/)![1])

    return unitOf(b) - unitOf(a) || slideOf(b) - slideOf(a)
  })
  .slice(0, 12)

console.log('最深クラスの分布:')
deepest.forEach(([label, count]) => console.log(`  ${label}: ${count}件`))

const candidates = [...unitGraph.nodes.entries()]
  .filter(([key]) => {
    if (existingSignatures.has(key)) {
      return false
    }

    const unit = unitGraph.distanceToExit.get(key)
    const slide = slideGraph.distanceToExit.get(key)

    return unit !== undefined && slide !== undefined && slide >= 6
  })
  .toSorted(([a], [b]) => {
    const byUnit = unitGraph.distanceToExit.get(b)! - unitGraph.distanceToExit.get(a)!
    const bySlide = slideGraph.distanceToExit.get(b)! - slideGraph.distanceToExit.get(a)!

    return byUnit || bySlide || a.localeCompare(b)
  })

const pieceOrder = rushHourPieces.map((piece) => piece.id)
const compactDirections: Record<string, string> = { up: 'U', down: 'D', left: 'L', right: 'R' }
const picked: string[] = []
const specs: string[] = []

for (const [key, node] of candidates) {
  if (specs.length >= packSize) {
    break
  }

  // 序盤が似た問題ばかりにならないよう、musume の初期位置が同じものは3問までに抑える
  const musume = node.placements.find((placement) => placement.pieceId === 'musume')!
  const musumeKey = `${musume.x},${musume.y}`

  if (picked.filter((entry) => entry === musumeKey).length >= 3) {
    continue
  }

  picked.push(musumeKey)

  const placements = pieceOrder
    .map((pieceId) => {
      const placement = node.placements.find((candidate) => candidate.pieceId === pieceId)!

      return `${pieceId}:${placement.x},${placement.y}`
    })
    .join(' ')
  const solution = createRushSolution(unitGraph, key)
    .map((step) => `${step.pieceId}${compactDirections[step.direction]}`)
    .join(' ')
  const unit = unitGraph.distanceToExit.get(key)
  const slide = slideGraph.distanceToExit.get(key)

  specs.push(
    `  ['rush-pack1-${specs.length + 1}', '${placements}', '${solution}'], // unit=${unit} slide=${slide}`,
  )
}

console.log('\nrushPackFixedSpecs:')
specs.forEach((spec) => console.log(spec))
