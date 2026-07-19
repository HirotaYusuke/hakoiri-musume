import { emptySaveData, type MonetizationSaveData, type SaveData, type StoragePort } from './port'

const saveKey = 'hakoiri-musume:save'

const parseMonetizationSaveData = (value: unknown): MonetizationSaveData => {
  if (!value || typeof value !== 'object') {
    return emptySaveData.monetization
  }

  const parsed = value as Partial<MonetizationSaveData>

  return {
    hasRemovedAds: parsed.hasRemovedAds === true,
    usedHintCount:
      typeof parsed.usedHintCount === 'number' && Number.isFinite(parsed.usedHintCount)
        ? Math.max(0, Math.floor(parsed.usedHintCount))
        : 0,
    purchasedPackIds: Array.isArray(parsed.purchasedPackIds)
      ? parsed.purchasedPackIds.filter((id): id is string => typeof id === 'string')
      : [],
    lastHintAt: typeof parsed.lastHintAt === 'string' ? parsed.lastHintAt : undefined,
    monetizationDismissedAt:
      typeof parsed.monetizationDismissedAt === 'string' ? parsed.monetizationDismissedAt : undefined,
  }
}

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
      monetization: parseMonetizationSaveData(parsed.monetization),
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
