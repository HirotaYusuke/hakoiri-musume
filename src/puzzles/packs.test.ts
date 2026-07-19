import { describe, expect, it } from 'vitest'
import {
  canClearInOneActionFromInitial,
  getMinimumMovesToClear,
  validatePuzzle,
} from '../domain/engine'
import { puzzles } from './catalog'
import { findPack, puzzlePacks } from './packs'
import { placementLayoutSignature } from './scrambleCore'

describe('puzzle packs', () => {
  const packPuzzles = puzzlePacks.flatMap((pack) => pack.puzzles)

  it('各パックが12問の難問で構成される', () => {
    for (const packId of ['rush-pack-1', 'rush-pack-2']) {
      const pack = findPack(packId)

      expect(pack, packId).toBeDefined()
      expect(pack!.puzzles, packId).toHaveLength(12)
      pack!.puzzles.forEach((puzzle) => {
        expect(puzzle.difficulty, puzzle.id).toBe('hard')
      })
    }
  })

  it('超難問パックはEXパックの上位帯（最短26手以上）を持つ', () => {
    findPack('rush-pack-2')!.puzzles.forEach((puzzle) => {
      expect(getMinimumMovesToClear(puzzle), puzzle.id).toBeGreaterThanOrEqual(26)
    })
  }, 60_000)

  it('パック問題はすべて検証を通過する', () => {
    packPuzzles.forEach((puzzle) => {
      expect(validatePuzzle(puzzle), puzzle.id).toEqual([])
    })
  })

  it('パック問題は本編・パック内で問題IDと初期配置が重複しない', () => {
    const allPuzzles = [...puzzles, ...packPuzzles]
    const ids = allPuzzles.map((puzzle) => puzzle.id)
    const signatures = allPuzzles.map((puzzle) => placementLayoutSignature(puzzle.initialPlacements))

    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(signatures).size).toBe(signatures.length)
  })

  it('パック問題は初期状態から1回の連続スライドで脱出できない', () => {
    packPuzzles.forEach((puzzle) => {
      expect(canClearInOneActionFromInitial(puzzle), puzzle.id).toBe(false)
    })
  })

  it('EXパックは本編の最難関（最短15手）以上の最短手数を持つ', () => {
    findPack('rush-pack-1')!.puzzles.forEach((puzzle) => {
      expect(getMinimumMovesToClear(puzzle), puzzle.id).toBeGreaterThanOrEqual(15)
    })
  })

  it('全問題（本編+パック）でサンプル解法が同一の問題ペアが存在しない', () => {
    const allPuzzles = [...puzzles, ...packPuzzles]
    const solutionKeys = allPuzzles.map((puzzle) =>
      puzzle.sampleSolution.map((step) => `${step.pieceId}:${step.direction}`).join(' '),
    )

    expect(new Set(solutionKeys).size).toBe(solutionKeys.length)
  })

  it('全問題（本編+パック）で初期配置が1駒違いの問題ペアが存在しない', () => {
    const allPuzzles = [...puzzles, ...packPuzzles]

    for (let i = 0; i < allPuzzles.length; i++) {
      for (let j = i + 1; j < allPuzzles.length; j++) {
        const a = allPuzzles[i]!
        const b = allPuzzles[j]!

        if (a.board.width !== b.board.width || a.pieces.length !== b.pieces.length) {
          continue
        }

        // 4x5の入門・標準セットは学習カーブとして意図した派生関係のため対象外
        if (a.board.width === 4) {
          continue
        }

        const bByPiece = new Map(b.initialPlacements.map((p) => [p.pieceId, `${p.x},${p.y}`]))
        const diff = a.initialPlacements.filter(
          (p) => bByPiece.get(p.pieceId) !== `${p.x},${p.y}`,
        ).length

        expect(diff, `${a.id} と ${b.id} が${diff}駒違い`).toBeGreaterThanOrEqual(2)
      }
    }
  })
})
