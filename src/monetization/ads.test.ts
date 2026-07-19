import { describe, expect, it } from 'vitest'
import { interstitialClearInterval, shouldShowInterstitial } from './ads'

describe('shouldShowInterstitial', () => {
  it('クリア間隔の倍数でのみ表示する', () => {
    expect(shouldShowInterstitial(0, false)).toBe(false)
    expect(shouldShowInterstitial(1, false)).toBe(false)
    expect(shouldShowInterstitial(interstitialClearInterval, false)).toBe(true)
    expect(shouldShowInterstitial(interstitialClearInterval + 1, false)).toBe(false)
    expect(shouldShowInterstitial(interstitialClearInterval * 2, false)).toBe(true)
  })

  it('広告削除済みなら表示しない', () => {
    expect(shouldShowInterstitial(interstitialClearInterval, true)).toBe(false)
  })
})
