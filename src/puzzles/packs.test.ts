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

  it('rush-pack-1 が12問の難問で構成される', () => {
    const pack = findPack('rush-pack-1')

    expect(pack).toBeDefined()
    expect(pack!.puzzles).toHaveLength(12)
    pack!.puzzles.forEach((puzzle) => {
      expect(puzzle.difficulty, puzzle.id).toBe('hard')
    })
  })

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

  it('パック問題は本編の最難関級以上の最短手数を持つ', () => {
    packPuzzles.forEach((puzzle) => {
      expect(getMinimumMovesToClear(puzzle), puzzle.id).toBeGreaterThanOrEqual(13)
    })
  })
})
