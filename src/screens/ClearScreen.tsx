type ClearScreenProps = {
  readonly puzzleTitle: string
  readonly moveCount: number
  readonly optimalMoves: number
  readonly bestMoves: number
  readonly isNewBest: boolean
  readonly hasRemovedAds: boolean
  /** 未購入パックのうち先頭のもの。全部購入済みなら null。 */
  readonly packOffer: { readonly id: string; readonly title: string } | null
  readonly onRemoveAds: () => void
  readonly onPurchasePack: (packId: string) => void
  readonly onSelectNext: () => void
  readonly onReplay: () => void
}

export function ClearScreen({
  puzzleTitle,
  moveCount,
  optimalMoves,
  bestMoves,
  isNewBest,
  hasRemovedAds,
  packOffer,
  onRemoveAds,
  onPurchasePack,
  onSelectNext,
  onReplay,
}: ClearScreenProps) {
  const isOptimal = moveCount === optimalMoves

  return (
    <main className="screen hero-screen">
      <p className="eyebrow">Clear</p>
      <h1>脱出成功</h1>
      <p className="lead">
        {puzzleTitle}を{moveCount}手でクリアしました。
      </p>
      <p className="clear-record">
        {isOptimal ? (
          <strong>最短手数クリア！</strong>
        ) : (
          <>
            最短は<strong>{optimalMoves}手</strong>。
            {isNewBest ? '自己ベスト更新！' : `自己ベスト: ${bestMoves}手`}
          </>
        )}
      </p>
      <div className="commerce-row" aria-label="追加メニュー">
        <button disabled={hasRemovedAds} onClick={onRemoveAds} type="button">
          {hasRemovedAds ? '広告削除済み' : '広告削除'}
        </button>
        {packOffer && (
          <button onClick={() => onPurchasePack(packOffer.id)} type="button">
            {packOffer.title}
          </button>
        )}
      </div>
      <div className="action-row">
        <button className="primary-action" onClick={onSelectNext} type="button">
          別の問題へ
        </button>
        <button onClick={onReplay} type="button">
          {isOptimal ? 'もう一度' : `最短${optimalMoves}手に挑戦`}
        </button>
      </div>
    </main>
  )
}
