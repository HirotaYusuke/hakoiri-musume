import type { Product } from './products'

type PaywallDialogProps = {
  readonly product: Product
  readonly onConfirm: () => void
  readonly onDismiss: () => void
}

export function PaywallDialog({ product, onConfirm, onDismiss }: PaywallDialogProps) {
  return (
    <div aria-modal="true" className="interstitial-backdrop" role="dialog">
      <div className="interstitial-card">
        <span className="interstitial-label">アプリ内購入</span>
        <strong className="paywall-title">{product.title}</strong>
        <p>{product.description}</p>
        <strong>{product.priceLabel}</strong>
        <div className="action-row">
          <button className="primary-action" onClick={onConfirm} type="button">
            購入する（モック）
          </button>
          <button onClick={onDismiss} type="button">
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}
