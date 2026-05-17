import { describe, expect, it } from 'vitest'
import { puzzles } from '../puzzles'
import type { Puzzle } from './types'
import {
  analyzePuzzleSolvability,
  buildGoalExitSolutionStep,
  canClearInOneActionFromInitial,
  canClearInOneMoveFromInitial,
  canMove,
  createInitialState,
  getLegalDirections,
  getOccupiedCells,
  getShapeAllowedDirections,
  isCleared,
  getMaxMoveSteps,
  movePiece,
  movePieceBySteps,
  tryGoalExitDirection,
  undo,
  validatePuzzle,
} from './engine'

describe('domain engine', () => {
  const standardPuzzle = puzzles.find((puzzle) => puzzle.id === 'standard-hakoiri-musume')
  const firstEscapePuzzle = puzzles.find((puzzle) => puzzle.id === 'intro-first-escape')

  if (!standardPuzzle || !firstEscapePuzzle) {
    throw new Error('Test puzzles are missing')
  }

  const hardPuzzleExpectedMetrics = [
    ['rush-hard-1', 8, 4, 564, 11.2, 109.4],
    ['rush-hard-2', 8, 4, 695, 11.5, 111.9],
    ['rush-hard-3', 8, 4, 318, 10.2, 100.8],
    ['rush-hard-4', 8, 5, 804, 10.6, 113.1],
    ['rush-hard-5', 8, 5, 1093, 10.8, 116.1],
    ['rush-hard-6', 9, 5, 1063, 10.8, 116.0],
    ['rush-hard-7', 9, 5, 678, 10.3, 110.8],
    ['rush-hard-8', 9, 5, 915, 10.9, 115.2],
    ['rush-hard-9', 9, 5, 969, 10.9, 115.4],
    ['rush-hard-10', 10, 5, 578, 10.2, 109.4],
    ['rush-hard-11', 10, 5, 880, 10.5, 113.5],
    ['rush-hard-12', 10, 5, 915, 10.9, 115.2],
    ['rush-hard-13', 10, 5, 587, 10.2, 109.4],
    ['rush-hard-14', 10, 6, 1120, 10.6, 119.8],
    ['rush-hard-15', 10, 6, 837, 10.4, 117.4],
    ['rush-hard-16', 10, 6, 1120, 10.6, 119.8],
    ['rush-hard-17', 10, 6, 1103, 10.7, 120.3],
    ['rush-hard-18', 11, 6, 1291, 10.5, 120.7],
    ['rush-hard-19', 11, 6, 1253, 10.5, 120.0],
    ['rush-hard-20', 11, 6, 1081, 10.7, 120.1],
    ['rush-hard-21', 11, 6, 955, 10.3, 118.3],
    ['rush-hard-22', 11, 6, 1263, 10.5, 120.5],
    ['rush-hard-23', 12, 6, 1207, 10.6, 120.5],
    ['rush-hard-24', 12, 6, 967, 10.3, 118.5],
    ['rush-hard-25', 12, 6, 1309, 10.6, 121.1],
    ['rush-hard-26', 12, 6, 1298, 10.6, 121.0],
    ['rush-hard-27', 12, 6, 1229, 10.6, 120.8],
    ['rush-hard-28', 13, 6, 848, 10.3, 117.7],
    ['rush-hard-29', 13, 6, 1306, 10.6, 120.9],
    ['rush-hard-30', 13, 6, 1318, 10.5, 120.9],
    ['rush-hard-31', 13, 6, 858, 10.2, 117.2],
    ['rush-hard-32', 14, 6, 1255, 10.6, 121.3],
    ['rush-hard-33', 14, 6, 1239, 10.6, 121.2],
    ['rush-hard-34', 14, 6, 622, 10.1, 114.6],
    ['rush-hard-35', 15, 8, 1483, 10.4, 130.6],
    ['rush-hard-36', 15, 8, 1465, 10.4, 130.5],
  ] as const

  it('盤面上の占有セルを駒IDで判定できる', () => {
    const state = createInitialState(standardPuzzle)
    const occupied = getOccupiedCells(state.puzzle, state.placements)
    const goalPlacement = state.placements.find((placement) => placement.pieceId === 'musume')

    expect(goalPlacement).toBeDefined()
    expect(occupied.get(`${goalPlacement?.x}:${goalPlacement?.y}`)).toBe('musume')
    expect(
      occupied.get(`${goalPlacement?.x ?? 0}:${(goalPlacement?.y ?? 0) + 1}`),
      'ゴール駒は縦長1×2',
    ).toBe('musume')
  })

  it('盤外移動を拒否する', () => {
    const state = createInitialState(standardPuzzle)

    expect(canMove(state, { pieceId: 'leftGate', direction: 'left' })).toBe(false)
    expect(canMove(state, { pieceId: 'topBeam', direction: 'up' })).toBe(false)
  })

  it('有効な移動だけ状態と履歴を更新する', () => {
    const state = createInitialState(firstEscapePuzzle)
    const unblocked = movePiece(state, { pieceId: 'bottomBeam', direction: 'right' })
    const moved = movePiece(unblocked, { pieceId: 'musume', direction: 'down' })

    expect(moved).not.toBe(state)
    expect(moved.placements.find((placement) => placement.pieceId === 'musume')).toMatchObject({
      x: 1,
      y: 3,
    })
    expect(moved.history).toHaveLength(2)

    const cleared = movePiece(moved, { pieceId: 'musume', direction: 'down' })
    const blocked = movePiece(cleared, { pieceId: 'musume', direction: 'down' })

    expect(isCleared(moved)).toBe(false)
    expect(isCleared(cleared)).toBe(true)
    expect(blocked).toBe(cleared)
  })

  it('Undoで直前の配置へ戻せる', () => {
    const state = createInitialState(firstEscapePuzzle)
    const moved = movePiece(state, { pieceId: 'bottomBeam', direction: 'right' })
    const restored = undo(moved)

    expect(restored.placements).toEqual(state.placements)
    expect(restored.history).toHaveLength(0)
  })

  it('ターゲットが出口から盤外へ出たらクリアになる', () => {
    const state = createInitialState(firstEscapePuzzle)
    const unblocked = movePiece(state, { pieceId: 'bottomBeam', direction: 'right' })
    const movedOnce = movePiece(unblocked, { pieceId: 'musume', direction: 'down' })
    const escaped = movePiece(movedOnce, { pieceId: 'musume', direction: 'down' })

    expect(isCleared(movedOnce)).toBe(false)
    expect(isCleared(escaped)).toBe(true)
    expect(escaped.placements.find((placement) => placement.pieceId === 'musume')).toMatchObject({
      x: 1,
      y: 4,
    })
  })

  it('ドラッグ用に移動可能なマス数だけ連続移動できる', () => {
    const state = createInitialState(firstEscapePuzzle)
    const blockedGoalSteps = getMaxMoveSteps(state, { pieceId: 'musume', direction: 'down' })
    const unblocked = movePiece(state, { pieceId: 'bottomBeam', direction: 'right' })
    const maxSteps = getMaxMoveSteps(unblocked, { pieceId: 'musume', direction: 'down' })
    const moved = movePieceBySteps(unblocked, { pieceId: 'musume', direction: 'down' }, 99)

    expect(blockedGoalSteps).toBe(0)
    expect(maxSteps).toBe(2)
    expect(isCleared(moved)).toBe(true)
    expect(moved.history).toHaveLength(3)
  })

  it('出口以外の盤外移動はターゲットでも拒否する', () => {
    const state = createInitialState(firstEscapePuzzle)
    const shiftedExitState = {
      ...state,
      placements: state.placements.map((placement) =>
        placement.pieceId === 'musume' ? { ...placement, x: 0, y: 3 } : placement,
      ),
    }

    expect(canMove(shiftedExitState, { pieceId: 'musume', direction: 'down' })).toBe(false)
  })

  it('通常ピースは盤外へ出られない', () => {
    const state = createInitialState(firstEscapePuzzle)

    expect(canMove(state, { pieceId: 'leftGuard', direction: 'left' })).toBe(false)
    expect(canMove(state, { pieceId: 'leftGuard', direction: 'up' })).toBe(false)
  })

  it('問題カタログの難易度構成と初期配置が整合している', () => {
    expect(puzzles).toHaveLength(50)
    expect(puzzles.filter((puzzle) => puzzle.difficulty === 'intro')).toHaveLength(5)
    expect(puzzles.filter((puzzle) => puzzle.difficulty === 'standard')).toHaveLength(9)
    expect(puzzles.filter((puzzle) => puzzle.difficulty === 'hard')).toHaveLength(36)

    puzzles.forEach((puzzle) => {
      expect(validatePuzzle(puzzle), puzzle.title).toEqual([])
    })
  }, 15_000)

  it('カタログのゴール駒には2×2が無く、許可サイズのみである', () => {
    puzzles.forEach((puzzle) => {
      const goalPiece = puzzle.pieces.find((piece) => piece.id === puzzle.goal.pieceId)
      expect(goalPiece, puzzle.title).toBeDefined()

      expect(goalPiece!.width === 2 && goalPiece!.height === 2, puzzle.title).toBe(false)

      const allowedGoal =
        (goalPiece!.width === 1 && goalPiece!.height === 2) ||
        (goalPiece!.width === 2 && goalPiece!.height === 1)

      expect(allowedGoal, puzzle.title).toBe(true)
    })
  })

  it('全問題のゴール脱出方向が定義できる', () => {
    puzzles.forEach((puzzle) => {
      expect(tryGoalExitDirection(puzzle), puzzle.title).toBeDefined()
      expect(buildGoalExitSolutionStep(puzzle).direction, puzzle.title).toBe(tryGoalExitDirection(puzzle))
    })
  })

  it('問題カタログに1x1ピースを含めない', () => {
    puzzles.forEach((puzzle) => {
      puzzle.pieces.forEach((piece) => {
        expect(piece.width === 1 && piece.height === 1, `${puzzle.title}: ${piece.id}`).toBe(false)
      })
    })
  })

  it('駒形状どおりに許可軸のみ動ける', () => {
    const horizontal = { id: 'h', name: '横', width: 2, height: 1, kind: 'horizontal' as const }
    const vertical = { id: 'v', name: '縦', width: 1, height: 2, kind: 'vertical' as const }

    expect(getShapeAllowedDirections(horizontal)).toEqual(['left', 'right'])
    expect(getShapeAllowedDirections(vertical)).toEqual(['up', 'down'])
    /* 正方形（検証では 2×2 禁止だが、将来の寸法でも幅=高さなら四方向） */
    expect(getShapeAllowedDirections({ ...horizontal, width: 3, height: 3, kind: 'small' })).toEqual([
      'up',
      'down',
      'left',
      'right',
    ])
  })

  it('ゴール駒も幅・高さに基づく許可軸のみ（縦長なら上下）', () => {
    const intro = puzzles.find((puzzle) => puzzle.id === 'intro-first-escape')
    expect(intro).toBeDefined()
    const state = createInitialState(intro!)
    const allowedShape = getShapeAllowedDirections(intro!.pieces.find((p) => p.id === 'musume')!)

    expect(allowedShape).toEqual(['up', 'down'])
    expect(getLegalDirections(state, 'musume').every((d) => allowedShape.includes(d))).toBe(true)
  })

  it('2×2の駒を含む問題定義は検証で拒否する', () => {
    const badPuzzle: Puzzle = {
      id: 'invalid-2x2',
      title: 'x',
      description: '',
      difficulty: 'intro',
      board: { width: 4, height: 5 },
      goal: { pieceId: 'musume', x: 1, y: 3 },
      pieces: [
        { id: 'musume', name: '赤', width: 1, height: 2, kind: 'goal' },
        { id: 'square', name: '角', width: 2, height: 2, kind: 'horizontal' },
      ],
      initialPlacements: [
        { pieceId: 'musume', x: 1, y: 3 },
        { pieceId: 'square', x: 0, y: 0 },
      ],
      sampleSolution: [],
    }

    expect(validatePuzzle(badPuzzle)).toContain('2x2 pieces are not allowed: square')
  })

  it('初期状態から1単位移動では脱出できない', () => {
    puzzles.forEach((puzzle) => {
      expect(canClearInOneMoveFromInitial(puzzle), puzzle.title).toBe(false)
    })
  })

  it('初期状態から1回の連続スライド操作では脱出できない', () => {
    puzzles.forEach((puzzle) => {
      expect(canClearInOneActionFromInitial(puzzle), puzzle.title).toBe(false)
    })
  })

  it('カタログの全問題がBFSでクリア到達可能', () => {
    puzzles
      .filter((puzzle) => puzzle.difficulty !== 'hard')
      .forEach((puzzle) => {
        expect(analyzePuzzleSolvability(puzzle).solvable, puzzle.title).toBe(true)
      })
  })

  it('全問題のサンプル解法がクリアする', () => {
    puzzles.forEach((puzzle) => {
      let state = createInitialState(puzzle)

      for (const step of puzzle.sampleSolution) {
        expect(canMove(state, step), `${puzzle.title} ${step.pieceId} ${step.direction}`).toBe(true)
        state = movePiece(state, step)
      }

      expect(isCleared(state), puzzle.title).toBe(true)
    })
  })

  it('BFSが状態数上限に達したら打ち切り理由を返す', () => {
    const crowded = puzzles.find((puzzle) => puzzle.id === 'rush-hard-1')
    expect(crowded).toBeDefined()
    const limited = analyzePuzzleSolvability(crowded!, 1)
    expect(limited.solvable).toBe(false)
    if (!limited.solvable) {
      expect(limited.reason).toBe('visitLimit')
    }
  })

  it('問題カタログの問題IDに重複がない', () => {
    const puzzleIds = puzzles.map((puzzle) => puzzle.id)
    expect(new Set(puzzleIds).size).toBe(puzzleIds.length)
  })

  it('難問は最低必要手数が高く、後半ほど難しくなる', () => {
    const hardPuzzles = puzzles.filter((puzzle) => puzzle.difficulty === 'hard')

    expect(hardPuzzles.map((puzzle) => puzzle.id)).toEqual(hardPuzzleExpectedMetrics.map(([id]) => id))

    hardPuzzleExpectedMetrics.forEach(
      ([id, minUnitMoves, minActions, visitedBeforeGoal, averageBranching, difficultyScore], index) => {
        expect(hardPuzzles[index]?.id).toBe(id)
        expect(visitedBeforeGoal, id).toBeGreaterThanOrEqual(70)
        expect(averageBranching, id).toBeGreaterThanOrEqual(6)
        expect(difficultyScore, id).toBeGreaterThanOrEqual(70)
        expect(minUnitMoves, id).toBeGreaterThanOrEqual(8)
        expect(minActions, id).toBeGreaterThanOrEqual(4)

        if (index > 0) {
          expect(minUnitMoves, id).toBeGreaterThanOrEqual(hardPuzzleExpectedMetrics[index - 1]![1])
        }
      }
    )

    const hardest = hardPuzzleExpectedMetrics.at(-1)!
    expect(hardest[0]).toBe('rush-hard-36')
    expect(hardest[1]).toBe(15)
    expect(hardest[2]).toBe(8)
  })
})
