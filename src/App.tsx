import { useEffect, useMemo, useRef, useState } from 'react'
import { createDummyAnalytics } from './analytics'
import { playBrickImpactSound } from './audio'
import './App.css'
import {
  createInitialState,
  getLegalDirections,
  getOptimalUnitMoves,
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
  canRevealHintFreely,
  createMockPayments,
  findProduct,
  freeHintsPerPuzzle,
  InterstitialOverlay,
  PaywallDialog,
  removeAdsProduct,
  RewardedOverlay,
  shouldShowInterstitial,
  type Product,
} from './monetization'
import { puzzlePacks, puzzles } from './puzzles'
import { createHintSolver } from './workers/hintSolver'
import { ClearScreen, HomeScreen, PlayScreen, PuzzleSelectScreen } from './screens'
import { createLocalStorageRepository, type SaveData } from './storage'

type Route = 'home' | 'select' | 'play' | 'clear'

type ClearResult = {
  readonly puzzle: Puzzle
  readonly moveCount: number
  readonly optimalMoves: number
  readonly bestMoves: number
  readonly isNewBest: boolean
}


/** 盤面が動くと無効になるよう、問題IDと手数で紐づけたヒント計算結果 */
type HintState = {
  readonly puzzleId: string
  readonly historyLength: number
  readonly computing: boolean
  readonly move: Move | null
  readonly revealsDirection: boolean
}

function App() {
  const storage = useMemo(() => createLocalStorageRepository(), [])
  const analytics = useMemo(() => createDummyAnalytics(), [])
  const payments = useMemo(() => createMockPayments(), [])
  const hintSolver = useMemo(() => createHintSolver(), [])
  const [saveData, setSaveData] = useState<SaveData>(() => storage.load())
  const [route, setRoute] = useState<Route>('home')
  const [puzzleState, setPuzzleState] = useState<PuzzleState | null>(null)
  const [selectedPieceId, setSelectedPieceId] = useState<PieceId | null>(null)
  const [clearResult, setClearResult] = useState<ClearResult | null>(null)
  const [hintState, setHintState] = useState<HintState | null>(null)
  const [sessionClearCount, setSessionClearCount] = useState(0)
  const [showsInterstitial, setShowsInterstitial] = useState(false)
  const [paywallProduct, setPaywallProduct] = useState<Product | null>(null)
  const [puzzleHintRevealCount, setPuzzleHintRevealCount] = useState(0)
  const [showsRewardedForHint, setShowsRewardedForHint] = useState(false)

  const activeHint =
    hintState &&
    puzzleState &&
    hintState.puzzleId === puzzleState.puzzle.id &&
    hintState.historyLength === puzzleState.history.length
      ? hintState
      : null

  /* Worker応答時に「まだ同じ盤面か」を判定するための現在位置 */
  const positionRef = useRef({ puzzleId: '', historyLength: -1 })

  useEffect(() => {
    positionRef.current = puzzleState
      ? { puzzleId: puzzleState.puzzle.id, historyLength: puzzleState.history.length }
      : { puzzleId: '', historyLength: -1 }
  })

  const persist = (nextSaveData: SaveData) => {
    setSaveData(nextSaveData)
    storage.save(nextSaveData)
  }

  const startPuzzle = (puzzle: Puzzle) => {
    const initialState = createInitialState(puzzle)
    /* 初手から動かせる駒を初期選択にする（ゴール駒は初期状態で動けないことが多い） */
    const firstMovablePiece =
      puzzle.pieces.find((piece) => getLegalDirections(initialState, piece.id).length > 0) ??
      puzzle.pieces[0]

    analytics.track({ name: 'puzzle_selected', puzzleId: puzzle.id })
    persist({ ...saveData, selectedPuzzleId: puzzle.id })
    setPuzzleState(initialState)
    setSelectedPieceId(firstMovablePiece?.id ?? null)
    setPuzzleHintRevealCount(0)
    setShowsRewardedForHint(false)
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
      const puzzleId = nextState.puzzle.id
      const moveCount = nextState.history.length
      const optimalMoves = getOptimalUnitMoves(nextState.puzzle)
      const previousBest = saveData.bestMovesByPuzzleId[puzzleId]
      const isNewBest = previousBest === undefined || moveCount < previousBest
      const bestMoves = isNewBest ? moveCount : previousBest
      const clearedPuzzleIds = Array.from(new Set([...saveData.clearedPuzzleIds, puzzleId]))
      const nextSaveData = {
        ...saveData,
        clearedPuzzleIds,
        bestMovesByPuzzleId: { ...saveData.bestMovesByPuzzleId, [puzzleId]: bestMoves },
      }
      const result = { puzzle: nextState.puzzle, moveCount, optimalMoves, bestMoves, isNewBest }

      analytics.track({
        name: 'puzzle_cleared',
        puzzleId,
        moveCount,
        optimalMoves,
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

  const revealHintDirection = () => {
    if (!puzzleState || !activeHint?.move || activeHint.revealsDirection) {
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
    setPuzzleHintRevealCount((count) => count + 1)
    persist({
      ...saveData,
      monetization: {
        ...saveData.monetization,
        usedHintCount,
        lastHintAt: new Date().toISOString(),
      },
    })
  }

  const handleHint = () => {
    if (!puzzleState || isCleared(puzzleState)) {
      return
    }

    if (!activeHint) {
      const request = {
        puzzleId: puzzleState.puzzle.id,
        historyLength: puzzleState.history.length,
      }

      analytics.track({
        name: 'hint_opened',
        puzzleId: request.puzzleId,
        moveCount: request.historyLength,
      })
      setHintState({ ...request, computing: true, move: null, revealsDirection: false })
      void hintSolver.solve(puzzleState.puzzle, puzzleState.placements).then((move) => {
        setHintState((current) =>
          current &&
          current.computing &&
          current.puzzleId === request.puzzleId &&
          current.historyLength === request.historyLength
            ? { ...current, computing: false, move }
            : current,
        )

        if (
          move &&
          positionRef.current.puzzleId === request.puzzleId &&
          positionRef.current.historyLength === request.historyLength
        ) {
          setSelectedPieceId(move.pieceId)
        }
      })
      return
    }

    if (activeHint.computing || !activeHint.move || activeHint.revealsDirection) {
      return
    }

    if (!canRevealHintFreely(puzzleHintRevealCount)) {
      analytics.track({ name: 'ad_rewarded_shown', placement: 'hint' })
      setShowsRewardedForHint(true)
      return
    }

    revealHintDirection()
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
          bestMovesByPuzzleId={saveData.bestMovesByPuzzleId}
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
              ? activeHint.computing
                ? { kind: 'computing' }
                : activeHint.move
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
          freeHintsRemaining={Math.max(0, freeHintsPerPuzzle - puzzleHintRevealCount)}
          onBack={() => setRoute('select')}
          onHint={handleHint}
          onMove={handleMove}
          onMovePiece={handlePieceMove}
          onSelectPiece={setSelectedPieceId}
          onUndo={() => setPuzzleState((current) => (current ? undo(current) : current))}
          selectedPieceId={selectedPieceId}
          state={puzzleState}
        />
      )}
      {route === 'clear' && clearResult && (
        <ClearScreen
          bestMoves={clearResult.bestMoves}
          hasRemovedAds={saveData.monetization.hasRemovedAds}
          isNewBest={clearResult.isNewBest}
          moveCount={clearResult.moveCount}
          onPurchasePack={handlePackPurchase}
          onRemoveAds={handleRemoveAds}
          packOffer={
            puzzlePacks.find(
              (pack) => !saveData.monetization.purchasedPackIds.includes(pack.id),
            ) ?? null
          }
          onReplay={replay}
          onSelectNext={() => setRoute('select')}
          optimalMoves={clearResult.optimalMoves}
          puzzleTitle={clearResult.puzzle.title}
        />
      )}
      {showsInterstitial && !saveData.monetization.hasRemovedAds && (
        <InterstitialOverlay onClose={() => setShowsInterstitial(false)} />
      )}
      {showsRewardedForHint && (
        <RewardedOverlay
          onComplete={() => {
            analytics.track({ name: 'ad_rewarded_completed', placement: 'hint' })
            setShowsRewardedForHint(false)
            revealHintDirection()
          }}
          onDismiss={() => {
            analytics.track({ name: 'ad_rewarded_dismissed', placement: 'hint' })
            setShowsRewardedForHint(false)
          }}
        />
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
