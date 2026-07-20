import {
  emptySaveData,
  type MonetizationSaveData,
  type SaveData,
  type SettingsSaveData,
  type StoragePort,
} from './port'

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

const parseSettings = (value: unknown): SettingsSaveData => {
  if (!value || typeof value !== 'object') {
    return emptySaveData.settings
  }

  const parsed = value as Partial<SettingsSaveData>

  return {
    // 旧セーブや未設定は既定でオン
    soundEnabled: parsed.soundEnabled !== false,
  }
}

const parseBestMoves = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== 'object') {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, number] =>
        typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > 0,
    ),
  )
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
      bestMovesByPuzzleId: parseBestMoves(parsed.bestMovesByPuzzleId),
      settings: parseSettings(parsed.settings),
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
