import { useMemo, useState } from 'react'
import { createDummyAnalytics } from './analytics'
import { playBrickImpactSound } from './audio'
import './App.css'
import {
  createInitialState,
  isCleared,
  movePieceBySteps,
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

const firstPackId = 'rush-pack-1'

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

  const handlePieceMove = (pieceId: PieceId, direction: Direction, steps = 1) => {
    if (!puzzleState) {
      return
    }

    setSelectedPieceId(pieceId)
    analytics.track({
      name: 'move_attempted',
      puzzleId: puzzleState.puzzle.id,
      pieceId,
    })

    const nextState = movePieceBySteps(puzzleState, { pieceId, direction }, steps)

    if (nextState === puzzleState) {
      return
    }

    playBrickImpactSound()
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

  const handleMove = (direction: Direction) => {
    if (!selectedPieceId) {
      return
    }

    handlePieceMove(selectedPieceId, direction)
  }

  const handleHint = () => {
    if (!puzzleState) {
      return
    }

    const usedHintCount = saveData.monetization.usedHintCount + 1

    analytics.track({
      name: 'hint_used',
      puzzleId: puzzleState.puzzle.id,
      usedHintCount,
    })
    persist({
      ...saveData,
      monetization: {
        ...saveData.monetization,
        usedHintCount,
        lastHintAt: new Date().toISOString(),
      },
    })
  }

  const handleRemoveAds = () => {
    analytics.track({
      name: 'remove_ads_tapped',
      hasRemovedAds: saveData.monetization.hasRemovedAds,
    })
    persist({
      ...saveData,
      monetization: {
        ...saveData.monetization,
        hasRemovedAds: true,
      },
    })
  }

  const handlePackPurchase = (packId: string) => {
    const purchased = saveData.monetization.purchasedPackIds.includes(packId)

    analytics.track({ name: 'pack_purchase_tapped', packId, purchased })

    if (purchased) {
      return
    }

    persist({
      ...saveData,
      monetization: {
        ...saveData.monetization,
        purchasedPackIds: [...saveData.monetization.purchasedPackIds, packId],
      },
    })
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
          onSelectPack={() => handlePackPurchase(firstPackId)}
          onSelectPuzzle={startPuzzle}
          purchasedPackIds={saveData.monetization.purchasedPackIds}
          puzzles={puzzles}
        />
      )}
      {route === 'play' && puzzleState && (
        <PlayScreen
          canUndo={puzzleState.history.length > 0}
          onBack={() => setRoute('select')}
          onHint={handleHint}
          onMove={handleMove}
          onMovePiece={handlePieceMove}
          onSelectPiece={setSelectedPieceId}
          onUndo={() => setPuzzleState((current) => (current ? undo(current) : current))}
          selectedPieceId={selectedPieceId}
          state={puzzleState}
          usedHintCount={saveData.monetization.usedHintCount}
        />
      )}
      {route === 'clear' && clearResult && (
        <ClearScreen
          hasPurchasedPack={saveData.monetization.purchasedPackIds.includes(firstPackId)}
          hasRemovedAds={saveData.monetization.hasRemovedAds}
          moveCount={clearResult.moveCount}
          onPurchasePack={() => handlePackPurchase(firstPackId)}
          onRemoveAds={handleRemoveAds}
          onReplay={replay}
          onSelectNext={() => setRoute('select')}
          puzzleTitle={clearResult.puzzle.title}
        />
      )}
    </>
  )
}

export default App
