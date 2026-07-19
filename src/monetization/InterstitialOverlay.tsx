type InterstitialOverlayProps = {
  readonly onClose: () => void
}

/**
 * 広告SDK導入までのプレースホルダー。
 * 実SDK接続時はこのコンポーネントの表示タイミングをそのまま広告呼び出しへ差し替える。
 */
export function InterstitialOverlay({ onClose }: InterstitialOverlayProps) {
  return (
    <div aria-modal="true" className="interstitial-backdrop" role="dialog">
      <div className="interstitial-card">
        <span className="interstitial-label">広告スペース（サンプル）</span>
        <p>リリース版ではここに広告が表示されます。広告削除を購入すると表示されません。</p>
        <button className="primary-action" onClick={onClose} type="button">
          閉じる
        </button>
      </div>
    </div>
  )
}
