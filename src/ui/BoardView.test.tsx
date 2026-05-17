/* @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Direction, PuzzleState } from '../domain'
import { BoardView } from './BoardView'

const state: PuzzleState = {
  puzzle: {
    id: 'drag-test',
    title: 'Drag Test',
    description: 'Drag test puzzle',
    difficulty: 'intro',
    board: { width: 4, height: 5 },
    goal: { pieceId: 'musume', x: 1, y: 3 },
    pieces: [{ id: 'musume', name: '赤いターゲット', width: 1, height: 2, kind: 'goal' }],
    initialPlacements: [{ pieceId: 'musume', x: 1, y: 1 }],
    sampleSolution: [],
  },
  placements: [{ pieceId: 'musume', x: 1, y: 1 }],
  history: [],
}

afterEach(() => {
  cleanup()
})

const renderBoard = (legalDirections: readonly Direction[] = ['down']) => {
  const onMovePiece = vi.fn()
  const onSelectPiece = vi.fn()

  render(
    <BoardView
      legalDirectionsByPiece={new Map([['musume', legalDirections]])}
      onMovePiece={onMovePiece}
      onSelectPiece={onSelectPiece}
      selectedPieceId="musume"
      state={state}
    />,
  )

  const pieceButton = screen.getByRole('button', { name: /赤いターゲット/ })

  Object.defineProperties(pieceButton, {
    offsetHeight: { configurable: true, value: 150 },
    offsetWidth: { configurable: true, value: 150 },
  })

  pieceButton.setPointerCapture = vi.fn()
  pieceButton.hasPointerCapture = vi.fn(() => true)
  pieceButton.releasePointerCapture = vi.fn()

  return { onMovePiece, onSelectPiece, pieceButton }
}

describe('BoardView', () => {
  it('ネイティブドラッグを無効にし、pointerドラッグで移動要求を送る', () => {
    const { onMovePiece, onSelectPiece, pieceButton } = renderBoard()

    expect(pieceButton.getAttribute('draggable')).toBe('false')

    fireEvent.pointerDown(pieceButton, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
      pointerType: 'mouse',
    })
    fireEvent.pointerUp(pieceButton, {
      clientX: 100,
      clientY: 250,
      pointerId: 1,
      pointerType: 'mouse',
    })

    expect(onSelectPiece).toHaveBeenCalledWith('musume')
    expect(onMovePiece).toHaveBeenCalledWith('musume', 'down', 2)
  })

  it('ドラッグ中は移動可能方向にだけ視覚的に追従する', () => {
    const { pieceButton } = renderBoard()

    fireEvent.pointerDown(pieceButton, {
      button: 0,
      clientX: 100,
      clientY: 100,
      pointerId: 1,
      pointerType: 'mouse',
    })
    fireEvent.pointerMove(pieceButton, {
      clientX: 180,
      clientY: 100,
      pointerId: 1,
      pointerType: 'mouse',
    })

    expect(pieceButton.dataset.dragging).toBe('true')
    expect(pieceButton.style.getPropertyValue('--piece-drag-x')).toBe('0px')
    expect(pieceButton.style.getPropertyValue('--piece-drag-y')).toBe('0px')

    fireEvent.pointerMove(pieceButton, {
      clientX: 100,
      clientY: 175,
      pointerId: 1,
      pointerType: 'mouse',
    })

    expect(pieceButton.style.getPropertyValue('--piece-drag-x')).toBe('0px')
    expect(pieceButton.style.getPropertyValue('--piece-drag-y')).toBe('75px')
  })
})
