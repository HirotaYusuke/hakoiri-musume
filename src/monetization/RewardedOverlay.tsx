type RewardedOverlayProps = {
  readonly onComplete: () => void
  readonly onDismiss: () => void
}

/**
 * リワード広告SDK導入までのプレースホルダー。
 * 実SDK接続時は onComplete を広告の視聴完了コールバックに差し替える。
 */
export function RewardedOverlay({ onComplete, onDismiss }: RewardedOverlayProps) {
  return (
    <div aria-modal="true" className="interstitial-backdrop" role="dialog">
      <div className="interstitial-card">
        <span className="interstitial-label">リワード広告（サンプル）</span>
        <p>無料ヒントを使い切りました。広告を最後まで見ると、次のヒントが解放されます。</p>
        <div className="action-row">
          <button className="primary-action" onClick={onComplete} type="button">
            視聴してヒントを見る（モック）
          </button>
          <button onClick={onDismiss} type="button">
            やめる
          </button>
        </div>
      </div>
    </div>
  )
}
