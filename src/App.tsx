import { useMemo, useState } from 'react'
import { createDummyAnalytics } from './analytics'
import './App.css'
import {
  createInitialState,
  isCleared,
  movePiece,
  undo,
  type Direction,
  type PieceId,
  type Puzzle,
  type PuzzleState,
} from './domain'
import { puzzles } from './puzzles'
import { ClearScreen, HomeScreen, PlayScreen, PuzzleSelectScreen } from './screens'
import { createLocalStorageRepository, type SaveData } from './storage'

type Route = 'home' | 'select' | 'play' | 'clear'

type ClearResult = {
  readonly puzzle: Puzzle
  readonly moveCount: number
}

function App() {
  const storage = useMemo(() => createLocalStorageRepository(), [])
  const analytics = useMemo(() => createDummyAnalytics(), [])
  const [saveData, setSaveData] = useState<SaveData>(() => storage.load())
  const [route, setRoute] = useState<Route>('home')
  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null)
  const [selectedPieceId, setSelectedPieceId] = useState<PieceId | null>(null)
  const [clearResult, setClearResult] = useState<ClearResult | null>(null)

  const persist = (nextSaveData: SaveData) => {
    setSaveData(nextSaveData)
    storage.save(nextSaveData)
  }

  const startPuzzle = (puzzle: Puzzle) => {
    analytics.track({ name: 'puzzle_selected', puzzleId: puzzle.id })
    persist({ ...saveData, selectedPuzzleId: puzzle.id })
    setPuzzleState(createInitialState(puzzle))
    setSelectedPieceId(puzzle.pieces[0]?.id ?? null)
    setRoute('play')
  }

  const handleMove = (direction: Direction) => {
    if (!puzzleState || !selectedPieceId) {
      return
    }

    analytics.track({
      name: 'move_attempted',
      puzzleId: puzzleState.puzzle.id,
      pieceId: selectedPieceId,
    })

    const nextState = movePiece(puzzleState, { pieceId: selectedPieceId, direction })

    if (nextState === puzzleState) {
      return
    }

    setPuzzleState(nextState)

    if (isCleared(nextState)) {
      const clearedPuzzleIds = Array.from(
        new Set([...saveData.clearedPuzzleIds, nextState.puzzle.id]),
      )
      const nextSaveData = { ...saveData, clearedPuzzleIds }
      const result = { puzzle: nextState.puzzle, moveCount: nextState.history.length }

      analytics.track({
        name: 'puzzle_cleared',
        puzzleId: nextState.puzzle.id,
        moveCount: nextState.history.length,
      })
      persist(nextSaveData)
      setClearResult(result)
      setRoute('clear')
    }
  }

  const replay = () => {
    if (!clearResult) {
      setRoute('select')
      return
    }

    startPuzzle(clearResult.puzzle)
  }

  return (
    <>
      {route === 'home' && <HomeScreen onStart={() => setRoute('select')} />}
      {route === 'select' && (
        <PuzzleSelectScreen
          clearedPuzzleIds={saveData.clearedPuzzleIds}
          onBack={() => setRoute('home')}
          onSelectPuzzle={startPuzzle}
          puzzles={puzzles}
        />
      )}
      {route === 'play' && puzzleState && (
        <PlayScreen
          canUndo={puzzleState.history.length > 0}
          onBack={() => setRoute('select')}
          onMove={handleMove}
          onSelectPiece={setSelectedPieceId}
          onUndo={() => setPuzzleState((current) => (current ? undo(current) : current))}
          selectedPieceId={selectedPieceId}
          state={puzzleState}
        />
      )}
      {route === 'clear' && clearResult && (
        <ClearScreen
          moveCount={clearResult.moveCount}
          onReplay={replay}
          onSelectNext={() => setRoute('select')}
          puzzleTitle={clearResult.puzzle.title}
        />
      )}
    </>
  )
}

export default App
