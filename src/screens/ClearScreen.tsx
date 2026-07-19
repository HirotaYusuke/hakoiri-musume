type ClearScreenProps = {
  readonly puzzleTitle: string
  readonly moveCount: number
  readonly hasRemovedAds: boolean
  readonly hasPurchasedPack: boolean
  readonly onRemoveAds: () => void
  readonly onPurchasePack: () => void
  readonly onSelectNext: () => void
  readonly onReplay: () => void
}

export function ClearScreen({
  puzzleTitle,
  moveCount,
  hasRemovedAds,
  hasPurchasedPack,
  onRemoveAds,
  onPurchasePack,
  onSelectNext,
  onReplay,
}: ClearScreenProps) {
  return (
    <main className="screen hero-screen">
      <p className="eyebrow">Clear</p>
      <h1>脱出成功</h1>
      <p className="lead">
        {puzzleTitle}を{moveCount}手でクリアしました。
      </p>
      <div className="commerce-row" aria-label="追加メニュー">
        <button disabled={hasRemovedAds} onClick={onRemoveAds} type="button">
          {hasRemovedAds ? '広告削除済み' : '広告削除'}
        </button>
        <button disabled={hasPurchasedPack} onClick={onPurchasePack} type="button">
          {hasPurchasedPack ? '追加パック購入済み' : '追加パック'}
        </button>
      </div>
      <div className="action-row">
        <button className="primary-action" onClick={onSelectNext} type="button">
          別の問題へ
        </button>
        <button onClick={onReplay} type="button">
          もう一度
        </button>
      </div>
    </main>
  )
}
