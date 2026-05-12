export type AnalyticsEvent =
  | { readonly name: 'puzzle_selected'; readonly puzzleId: string }
  | { readonly name: 'move_attempted'; readonly puzzleId: string; readonly pieceId: string }
  | { readonly name: 'puzzle_cleared'; readonly puzzleId: string; readonly moveCount: number }

export type AnalyticsPort = {
  readonly track: (event: AnalyticsEvent) => void
}
