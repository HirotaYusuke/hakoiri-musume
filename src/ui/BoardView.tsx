import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import {
  getMaxMoveSteps,
  getShapeAllowedDirections,
  tryGoalExitDirection,
  type Direction,
  type Piece,
  type PieceId,
  type PuzzleState,
} from '../domain'

type DragStart = {
  readonly pieceId: PieceId
  readonly pointerId: number
  readonly x: number
  readonly y: number
}

type DragVisual = {
  readonly pieceId: PieceId
  readonly direction: Direction | null
  readonly offsetX: number
  readonly offsetY: number
  readonly steps: number
}

type BoardViewProps = {
  readonly state: PuzzleState
  readonly selectedPieceId: PieceId | null
  readonly legalDirectionsByPiece: ReadonlyMap<PieceId, readonly Direction[]>
  readonly onMovePiece: (pieceId: PieceId, direction: Direction, steps: number) => void
  readonly onSelectPiece: (pieceId: PieceId) => void
}

export function BoardView({
  state,
  selectedPieceId,
  legalDirectionsByPiece,
  onMovePiece,
  onSelectPiece,
}: BoardViewProps) {
  const dragStart = useRef<DragStart | null>(null)
  const [dragVisual, setDragVisual] = useState<DragVisual | null>(null)

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>, piece: Piece) => {
    if (event.pointerType === 'mouse' && event.button !== 0) {
      return
    }

    dragStart.current = { pieceId: piece.id, pointerId: event.pointerId, x: event.clientX, y: event.clientY }
    setDragVisual({ pieceId: piece.id, direction: null, offsetX: 0, offsetY: 0, steps: 0 })
    onSelectPiece(piece.id)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const getCellStep = (target: HTMLButtonElement, piece: Piece, axis: 'x' | 'y') => {
    const boardStyle = window.getComputedStyle(target.parentElement ?? target)
    const rawGap = axis === 'x' ? boardStyle.columnGap : boardStyle.rowGap
    const gap = Number.parseFloat(rawGap) || 0
    const span = axis === 'x' ? piece.width : piece.height
    const size = axis === 'x' ? target.offsetWidth : target.offsetHeight

    return (size + gap) / span
  }

  const getDragVisual = (
    event: PointerEvent<HTMLButtonElement>,
    piece: Piece,
    start: DragStart,
  ): DragVisual => {
    const deltaX = event.clientX - start.x
    const deltaY = event.clientY - start.y
    const shapeAllowed = getShapeAllowedDirections(piece)
    const horizontalAllowed = shapeAllowed.some((d) => d === 'left' || d === 'right')
    const verticalAllowed = shapeAllowed.some((d) => d === 'up' || d === 'down')
    const effectiveDeltaX = horizontalAllowed && !verticalAllowed ? deltaX : verticalAllowed && !horizontalAllowed ? 0 : deltaX
    const effectiveDeltaY = verticalAllowed && !horizontalAllowed ? deltaY : horizontalAllowed && !verticalAllowed ? 0 : deltaY
    const absX = Math.abs(effectiveDeltaX)
    const absY = Math.abs(effectiveDeltaY)
    const legalDirections = legalDirectionsByPiece.get(piece.id) ?? []
    const dominantDirection: Direction =
      absX >= absY ? (effectiveDeltaX >= 0 ? 'right' : 'left') : effectiveDeltaY >= 0 ? 'down' : 'up'
    const direction = legalDirections.includes(dominantDirection) ? dominantDirection : null

    if (!direction) {
      return { pieceId: piece.id, direction: null, offsetX: 0, offsetY: 0, steps: 0 }
    }

    const isHorizontal = direction === 'left' || direction === 'right'
    const signedTravel = isHorizontal ? effectiveDeltaX : effectiveDeltaY
    const travel = Math.max(0, direction === 'left' || direction === 'up' ? -signedTravel : signedTravel)
    const cellStep = getCellStep(event.currentTarget, piece, isHorizontal ? 'x' : 'y')
    const maxSteps = getMaxMoveSteps(state, { pieceId: piece.id, direction })
    const clampedTravel = Math.min(travel, maxSteps * cellStep)
    const signedOffset = direction === 'left' || direction === 'up' ? -clampedTravel : clampedTravel

    return {
      pieceId: piece.id,
      direction,
      offsetX: isHorizontal ? signedOffset : 0,
      offsetY: isHorizontal ? 0 : signedOffset,
      steps: Math.min(maxSteps, Math.max(0, Math.round(clampedTravel / cellStep))),
    }
  }

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>, piece: Piece) => {
    const start = dragStart.current

    if (!start || start.pieceId !== piece.id || start.pointerId !== event.pointerId) {
      return
    }

    event.preventDefault()
    setDragVisual(getDragVisual(event, piece, start))
  }

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>, piece: Piece) => {
    const start = dragStart.current
    dragStart.current = null
    setDragVisual(null)

    if (!start || start.pieceId !== piece.id) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const finalVisual = getDragVisual(event, piece, start)

    event.preventDefault()
    if (finalVisual.direction && finalVisual.steps > 0) {
      onMovePiece(piece.id, finalVisual.direction, finalVisual.steps)
    }
  }

  const goalPiece = state.puzzle.pieces.find((candidate) => candidate.id === state.puzzle.goal.pieceId)
  const goalSpanW = goalPiece?.width ?? 1
  const goalSpanH = goalPiece?.height ?? 2
  const exitDirection = goalPiece ? tryGoalExitDirection(state.puzzle) : 'down'

  const exitOverlayClassNames = ['exit-cutout']
  if (exitDirection === 'down') {
    exitOverlayClassNames.push('exit-cutout--bottom')
  } else if (exitDirection === 'left' || exitDirection === 'right') {
    exitOverlayClassNames.push('exit-cutout--side', `exit-cutout--${exitDirection}`)
  } else {
    exitOverlayClassNames.push('exit-cutout--bottom')
  }

  const exitOverlayStyles: CSSProperties =
    exitDirection === 'down' && goalPiece
      ? {
          left: `calc(var(--board-padding) + ${state.puzzle.goal.x} * (var(--cell-size) + var(--cell-gap)))`,
          width: `calc(${goalPiece.width} * var(--cell-size) + ${goalPiece.width - 1} * var(--cell-gap))`,
          right: 'auto',
        }
      : (exitDirection === 'left' || exitDirection === 'right') && goalPiece
        ? {
            left: exitDirection === 'left' ? '-22px' : 'auto',
            right: exitDirection === 'right' ? '-22px' : 'auto',
            top: `calc(var(--board-padding) + ${state.puzzle.goal.y} * (var(--cell-size) + var(--cell-gap)))`,
            width: `48px`,
            height: `calc(${goalPiece.height} * var(--cell-size) + ${goalPiece.height - 1} * var(--cell-gap))`,
            bottom: 'auto',
          }
        : {
            left: `calc(var(--board-padding) + ${state.puzzle.goal.x} * (var(--cell-size) + var(--cell-gap)))`,
            width: `calc(var(--cell-size) + 0 * var(--cell-gap))`,
            right: 'auto',
          }

  return (
    <div
      className="board"
      style={{
        '--board-columns': state.puzzle.board.width,
        gridTemplateColumns: `repeat(${state.puzzle.board.width}, var(--cell-size))`,
        gridTemplateRows: `repeat(${state.puzzle.board.height}, var(--cell-size))`,
      } as CSSProperties & Record<'--board-columns', number>}
      aria-label={`${state.puzzle.title}の盤面`}
    >
      <div aria-hidden="true" className={exitOverlayClassNames.join(' ')} style={exitOverlayStyles}>
        <span>EXIT</span>
      </div>
      <div
        className="goal-zone"
        style={{
          gridColumn: `${state.puzzle.goal.x + 1} / span ${goalSpanW}`,
          gridRow: `${state.puzzle.goal.y + 1} / span ${goalSpanH}`,
        }}
      />
      {state.placements.map((placement) => {
        const piece = state.puzzle.pieces.find((candidate) => candidate.id === placement.pieceId)

        if (!piece) {
          return null
        }

        const legalDirections = legalDirectionsByPiece.get(piece.id) ?? []
        const isSelected = selectedPieceId === piece.id
        const selectionLabel = isSelected ? '選択中' : legalDirections.length > 0 ? '移動可能' : '移動不可'
        const visualX = Math.min(placement.x, state.puzzle.board.width - piece.width)
        const visualY = Math.min(placement.y, state.puzzle.board.height - piece.height)
        const offsetX = placement.x - visualX
        const offsetY = placement.y - visualY
        const pieceStyle: CSSProperties &
          Record<'--piece-offset-x' | '--piece-offset-y' | '--piece-drag-x' | '--piece-drag-y', string> = {
          gridColumn: `${visualX + 1} / span ${piece.width}`,
          gridRow: `${visualY + 1} / span ${piece.height}`,
          '--piece-offset-x': `calc((var(--cell-size) + var(--cell-gap)) * ${offsetX})`,
          '--piece-offset-y': `calc((var(--cell-size) + var(--cell-gap)) * ${offsetY})`,
          '--piece-drag-x': `${dragVisual?.pieceId === piece.id ? dragVisual.offsetX : 0}px`,
          '--piece-drag-y': `${dragVisual?.pieceId === piece.id ? dragVisual.offsetY : 0}px`,
        }

        return (
          <button
            className={`piece piece-${piece.kind}`}
            aria-label={`${piece.name}: ${selectionLabel}`}
            aria-pressed={isSelected}
            data-movable={legalDirections.length > 0}
            data-selected={isSelected}
            data-dragging={dragVisual?.pieceId === piece.id}
            draggable={false}
            key={piece.id}
            onClick={() => onSelectPiece(piece.id)}
            onPointerCancel={() => {
              dragStart.current = null
              setDragVisual(null)
            }}
            onPointerDown={(event) => handlePointerDown(event, piece)}
            onPointerMove={(event) => handlePointerMove(event, piece)}
            onPointerUp={(event) => handlePointerUp(event, piece)}
            style={pieceStyle}
            type="button"
          >
            <span className="sr-only">{piece.name}</span>
          </button>
        )
      })}
    </div>
  )
}
