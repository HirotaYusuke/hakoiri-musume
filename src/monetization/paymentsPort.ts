export type PurchaseResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'cancelled' | 'unavailable' }

export type PaymentsPort = {
  readonly purchase: (productId: string) => Promise<PurchaseResult>
}

/**
 * ストア課金SDK（App Store / Google Play / Stripe）接続までのモック。
 * 常に購入成功として解決する。実装差し替え時もUI側は PaymentsPort だけに依存する。
 */
export const createMockPayments = (): PaymentsPort => ({
  purchase: () => Promise.resolve({ ok: true }),
})
