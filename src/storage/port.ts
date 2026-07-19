export type SaveData = {
  readonly selectedPuzzleId?: string
  readonly clearedPuzzleIds: readonly string[]
  readonly monetization: MonetizationSaveData
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
  monetization: {
    hasRemovedAds: false,
    usedHintCount: 0,
    purchasedPackIds: [],
  },
}
