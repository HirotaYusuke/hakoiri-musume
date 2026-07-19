import { puzzlePacks } from '../puzzles'

export type Product = {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly priceLabel: string
}

export const removeAdsProduct: Product = {
  id: 'remove-ads',
  title: '広告削除',
  description: '広告なしで静かに遊べます。購入はこの端末に保存されます。',
  priceLabel: '¥480（予定）',
}

export const packProducts: readonly Product[] = puzzlePacks.map((pack) => ({
  id: pack.id,
  title: pack.title,
  description: pack.description,
  priceLabel: pack.priceLabel,
}))

export const findProduct = (productId: string): Product | undefined =>
  [removeAdsProduct, ...packProducts].find((product) => product.id === productId)
