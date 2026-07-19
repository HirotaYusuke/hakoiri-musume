import { describe, expect, it } from 'vitest'
import { createLocalStorageRepository } from './localStorageRepository'

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return Array.from(this.values.keys())[index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('createLocalStorageRepository', () => {
  it('loads old save data with default monetization values', () => {
    const storage = new MemoryStorage()
    storage.setItem(
      'hakoiri-musume:save',
      JSON.stringify({ selectedPuzzleId: 'puzzle-1', clearedPuzzleIds: ['puzzle-1'] }),
    )

    expect(createLocalStorageRepository(storage).load()).toEqual({
      selectedPuzzleId: 'puzzle-1',
      clearedPuzzleIds: ['puzzle-1'],
      bestMovesByPuzzleId: {},
      monetization: {
        hasRemovedAds: false,
        usedHintCount: 0,
        purchasedPackIds: [],
      },
    })
  })

  it('自己ベストは正の有限数のみ受け入れる', () => {
    const storage = new MemoryStorage()
    storage.setItem(
      'hakoiri-musume:save',
      JSON.stringify({
        clearedPuzzleIds: [],
        bestMovesByPuzzleId: { 'puzzle-1': 12, 'puzzle-2': -3, 'puzzle-3': 'abc', 'puzzle-4': null },
      }),
    )

    expect(createLocalStorageRepository(storage).load().bestMovesByPuzzleId).toEqual({
      'puzzle-1': 12,
    })
  })

  it('saves and loads monetization state', () => {
    const storage = new MemoryStorage()
    const repository = createLocalStorageRepository(storage)

    repository.save({
      clearedPuzzleIds: ['puzzle-1'],
      bestMovesByPuzzleId: { 'puzzle-1': 4 },
      monetization: {
        hasRemovedAds: true,
        usedHintCount: 3,
        purchasedPackIds: ['rush-pack-1'],
        lastHintAt: '2026-05-24T00:00:00.000Z',
      },
    })

    expect(repository.load()).toEqual({
      clearedPuzzleIds: ['puzzle-1'],
      bestMovesByPuzzleId: { 'puzzle-1': 4 },
      monetization: {
        hasRemovedAds: true,
        usedHintCount: 3,
        purchasedPackIds: ['rush-pack-1'],
        lastHintAt: '2026-05-24T00:00:00.000Z',
      },
    })
  })
})
