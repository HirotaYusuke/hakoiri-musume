export type SaveData = {
  readonly selectedPuzzleId?: string
  readonly clearedPuzzleIds: readonly string[]
  /** 問題IDごとの自己ベスト（最少単位移動手数）。端末ローカルのみ。 */
  readonly bestMovesByPuzzleId: Readonly<Record<string, number>>
  readonly settings: SettingsSaveData
  readonly monetization: MonetizationSaveData
}

export type SettingsSaveData = {
  readonly soundEnabled: boolean
}

export type MonetizationSaveData = {
  readonly hasRemovedAds: boolean
  readonly usedHintCount: number
  readonly purchasedPackIds: readonly string[]
  readonly lastHintAt?: string
  readonly monetizationDismissedAt?: string
}

export type StoragePort = {
  readonly load: () => SaveData
  readonly save: (data: SaveData) => void
}

export const emptySaveData: SaveData = {
  clearedPuzzleIds: [],
  bestMovesByPuzzleId: {},
  settings: {
    soundEnabled: true,
  },
  monetization: {
    hasRemovedAds: false,
    usedHintCount: 0,
    purchasedPackIds: [],
  },
}
