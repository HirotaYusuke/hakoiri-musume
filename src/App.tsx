import { useMemo, useState } from 'react'
import { createDummyAnalytics } from './analytics'
import { playBrickImpactSound } from './audio'
import './App.css'
import {
  createInitialState,
  findNextHintMove,
  getPiece,
  isCleared,
  movePieceBySteps,
  undo,
  type Direction,
  type Move,
  type PieceId,
  type Puzzle,
  type PuzzleState,
} from './domain'
import {
  createMockPayments,
  findProduct,
  InterstitialOverlay,
  PaywallDialog,
  removeAdsProduct,
  shouldShowInterstitial,
  type Product,
} from './monetization'
import { puzzlePacks, puzzles } from './puzzles'
import { ClearScreen, HomeScreen, PlayScreen, PuzzleSelectScreen } from './screens'
import { createLocalStorageRepository, type SaveData } from './storage'

type Route = 'home' | 'select' | 'play' | 'clear'

type ClearResult = {
  readonly puzzle: Puzzle
  readonly moveCount: number
}

const firstPackId = puzzlePacks[0]!.id

/** 盤面が動くと無効になるよう、問題IDと手数で紐づけたヒント計算結果 */
type HintState = {
  readonly puzzleId: string
  readonly historyLength: number
  readonly move: Move | null
  readonly revealsDirection: boolean
}

function App() {
  const storage = useMemo(() => createLocalStorageRepository(), [])
  const analytics = useMemo(() => createDummyAnalytics(), [])
  const payments = useMemo(() => createMockPayments(), [])
  const [saveData, setSaveData] = useState<SaveData>(() => storage.load())
  const [route, setRoute] = useState<Route>('home')
  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null)
  const [selectedPieceId, setSelectedPieceId] = useState<PieceId | null>(null)
  const [clearResult, setClearResult] = useState<ClearResult | null>(null)
  const [hintState, setHintState] = useState<HintState | null>(null)
  const [sessionClearCount, setSessionClearCount] = useState(0)
  const [showsInterstitial, setShowsInterstitial] = useState(false)
  const [paywallProduct, setPaywallProduct] = useState<Product | null>(null)

  const activeHint =
    hintState &&
    puzzleState &&
    hintState.puzzleId === puzzleState.puzzle.id &&
    hintState.historyLength === puzzleState.history.length
      ? hintState
      : null

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

      const nextSessionClearCount = sessionClearCount + 1

      setSessionClearCount(nextSessionClearCount)

      if (shouldShowInterstitial(nextSessionClearCount, saveData.monetization.hasRemovedAds)) {
        analytics.track({ name: 'ad_interstitial_shown', sessionClearCount: nextSessionClearCount })
        setShowsInterstitial(true)
      }
    }
  }

  const handleMove = (direction: Direction) => {
    if (!selectedPieceId) {
      return
    }

    handlePieceMove(selectedPieceId, direction)
  }

  const handleHint = () => {
    if (!puzzleState || isCleared(puzzleState)) {
      return
    }

    if (!activeHint) {
      analytics.track({
        name: 'hint_opened',
        puzzleId: puzzleState.puzzle.id,
        moveCount: puzzleState.history.length,
      })
      setHintState({
        puzzleId: puzzleState.puzzle.id,
        historyLength: puzzleState.history.length,
        move: findNextHintMove(puzzleState),
        revealsDirection: false,
      })
      return
    }

    if (!activeHint.move || activeHint.revealsDirection) {
      return
    }

    const usedHintCount = saveData.monetization.usedHintCount + 1

    analytics.track({
      name: 'hint_used',
      puzzleId: puzzleState.puzzle.id,
      usedHintCount,
    })
    setHintState({ ...activeHint, revealsDirection: true })
    setSelectedPieceId(activeHint.move.pieceId)
    persist({
      ...saveData,
      monetization: {
        ...saveData.monetization,
        usedHintCount,
        lastHintAt: new Date().toISOString(),
      },
    })
  }

  const openPaywall = (product: Product) => {
    analytics.track({ name: 'paywall_shown', productId: product.id })
    setPaywallProduct(product)
  }

  const handleRemoveAds = () => {
    analytics.track({
      name: 'remove_ads_tapped',
      hasRemovedAds: saveData.monetization.hasRemovedAds,
    })

    if (!saveData.monetization.hasRemovedAds) {
      openPaywall(removeAdsProduct)
    }
  }

  const handlePackPurchase = (packId: string) => {
    const purchased = saveData.monetization.purchasedPackIds.includes(packId)

    analytics.track({ name: 'pack_purchase_tapped', packId, purchased })

    if (purchased) {
      return
    }

    const product = findProduct(packId)

    if (product) {
      openPaywall(product)
    }
  }

  const applyPurchase = (productId: string) => {
    if (productId === removeAdsProduct.id) {
      persist({
        ...saveData,
        monetization: { ...saveData.monetization, hasRemovedAds: true },
      })
      return
    }

    persist({
      ...saveData,
      monetization: {
        ...saveData.monetization,
        purchasedPackIds: [...saveData.monetization.purchasedPackIds, productId],
      },
    })
  }

  const handlePaywallConfirm = async () => {
    if (!paywallProduct) {
      return
    }

    const result = await payments.purchase(paywallProduct.id)

    if (result.ok) {
      analytics.track({ name: 'purchase_completed', productId: paywallProduct.id })
      applyPurchase(paywallProduct.id)
    }

    setPaywallProduct(null)
  }

  const handlePaywallDismiss = () => {
    if (paywallProduct) {
      analytics.track({ name: 'paywall_dismissed', productId: paywallProduct.id })
    }

    setPaywallProduct(null)
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
          onPurchasePack={handlePackPurchase}
          onSelectPuzzle={startPuzzle}
          packs={puzzlePacks}
          purchasedPackIds={saveData.monetization.purchasedPackIds}
          puzzles={puzzles}
        />
      )}
      {route === 'play' && puzzleState && (
        <PlayScreen
          canUndo={puzzleState.history.length > 0}
          hint={
            activeHint
              ? activeHint.move
                ? activeHint.revealsDirection
                  ? {
                      kind: 'move',
                      pieceName: getPiece(puzzleState.puzzle, activeHint.move.pieceId).name,
                      direction: activeHint.move.direction,
                    }
                  : {
                      kind: 'piece',
                      pieceName: getPiece(puzzleState.puzzle, activeHint.move.pieceId).name,
                    }
                : { kind: 'unavailable' }
              : null
          }
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
      {showsInterstitial && !saveData.monetization.hasRemovedAds && (
        <InterstitialOverlay onClose={() => setShowsInterstitial(false)} />
      )}
      {paywallProduct && (
        <PaywallDialog
          onConfirm={() => {
            void handlePaywallConfirm()
          }}
          onDismiss={handlePaywallDismiss}
          product={paywallProduct}
        />
      )}
    </>
  )
}

export default App
