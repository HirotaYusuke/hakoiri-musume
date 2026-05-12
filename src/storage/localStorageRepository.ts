import { emptySaveData, type SaveData, type StoragePort } from './port'

const saveKey = 'hakoiri-musume:save'

const parseSaveData = (value: string | null): SaveData => {
  if (!value) {
    return emptySaveData
  }

  try {
    const parsed = JSON.parse(value) as Partial<SaveData>

    return {
      selectedPuzzleId:
        typeof parsed.selectedPuzzleId === 'string' ? parsed.selectedPuzzleId : undefined,
      clearedPuzzleIds: Array.isArray(parsed.clearedPuzzleIds)
        ? parsed.clearedPuzzleIds.filter((id): id is string => typeof id === 'string')
        : [],
    }
  } catch {
    return emptySaveData
  }
}

export const createLocalStorageRepository = (
  localStorageLike: Storage = window.localStorage,
): StoragePort => ({
  load: () => parseSaveData(localStorageLike.getItem(saveKey)),
  save: (data) => {
    localStorageLike.setItem(saveKey, JSON.stringify(data))
  },
})
