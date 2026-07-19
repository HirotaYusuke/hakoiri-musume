export type AnalyticsEvent =
  | { readonly name: 'puzzle_selected'; readonly puzzleId: string }
  | { readonly name: 'move_attempted'; readonly puzzleId: string; readonly pieceId: string }
  | { readonly name: 'puzzle_cleared'; readonly puzzleId: string; readonly moveCount: number }
  | { readonly name: 'hint_used'; readonly puzzleId: string; readonly usedHintCount: number }
  | { readonly name: 'remove_ads_tapped'; readonly hasRemovedAds: boolean }
  | { readonly name: 'pack_purchase_tapped'; readonly packId: string; readonly purchased: boolean }

export type AnalyticsPort = {
  readonly track: (event: AnalyticsEvent) => void
}
