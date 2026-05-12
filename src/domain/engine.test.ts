import { describe, expect, it } from 'vitest'
import { puzzles } from '../puzzles'
import {
  canMove,
  createInitialState,
  getOccupiedCells,
  isCleared,
  movePiece,
  undo,
  validatePuzzle,
} from './engine'

describe('domain engine', () => {
  const standardPuzzle = puzzles.find((puzzle) => puzzle.id === 'standard-hakoiri-musume')
  const firstEscapePuzzle = puzzles.find((puzzle) => puzzle.id === 'intro-first-escape')

  if (!standardPuzzle || !firstEscapePuzzle) {
    throw new Error('Test puzzles are missing')
  }

  it('盤面上の占有セルを駒IDで判定できる', () => {
    const state = createInitialState(standardPuzzle)
    const occupied = getOccupiedCells(state.puzzle, state.placements)

    expect(occupied.get('1:0')).toBe('musume')
    expect(occupied.get('2:1')).toBe('musume')
    expect(occupied.get('1:4')).toBeUndefined()
  })

  it('盤外移動と衝突移動を拒否する', () => {
    const state = createInitialState(standardPuzzle)

    expect(canMove(state, { pieceId: 'father', direction: 'left' })).toBe(false)
    expect(canMove(state, { pieceId: 'musume', direction: 'down' })).toBe(false)
  })

  it('有効な移動だけ状態と履歴を更新する', () => {
    const state = createInitialState(firstEscapePuzzle)
    const moved = movePiece(state, { pieceId: 'musume', direction: 'down' })

    expect(moved).not.toBe(state)
    expect(moved.placements.find((placement) => placement.pieceId === 'musume')).toMatchObject({
      x: 1,
      y: 2,
    })
    expect(moved.history).toHaveLength(1)

    const cleared = movePiece(moved, { pieceId: 'musume', direction: 'down' })
    const blocked = movePiece(cleared, { pieceId: 'musume', direction: 'down' })
    expect(blocked).toBe(cleared)
  })

  it('Undoで直前の配置へ戻せる', () => {
    const state = createInitialState(firstEscapePuzzle)
    const moved = movePiece(state, { pieceId: 'musume', direction: 'down' })
    const restored = undo(moved)

    expect(restored.placements).toEqual(state.placements)
    expect(restored.history).toHaveLength(0)
  })

  it('ゴール位置に到達したらクリアになる', () => {
    const state = createInitialState(firstEscapePuzzle)
    const movedOnce = movePiece(state, { pieceId: 'musume', direction: 'down' })
    const movedTwice = movePiece(movedOnce, { pieceId: 'musume', direction: 'down' })

    expect(isCleared(movedOnce)).toBe(false)
    expect(isCleared(movedTwice)).toBe(true)
  })

  it('問題カタログの難易度構成と初期配置が整合している', () => {
    expect(puzzles.filter((puzzle) => puzzle.difficulty === 'intro')).toHaveLength(3)
    expect(puzzles.filter((puzzle) => puzzle.difficulty === 'standard')).toHaveLength(5)
    expect(puzzles.filter((puzzle) => puzzle.difficulty === 'hard')).toHaveLength(2)

    puzzles.forEach((puzzle) => {
      expect(validatePuzzle(puzzle), puzzle.title).toEqual([])
    })
  })
})
