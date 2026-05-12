export type SaveData = {
  readonly selectedPuzzleId?: string
  readonly clearedPuzzleIds: readonly string[]
}

export type StoragePort = {
  readonly load: () => SaveData
  readonly save: (data: SaveData) => void
}

export const emptySaveData: SaveData = {
  clearedPuzzleIds: [],
}
