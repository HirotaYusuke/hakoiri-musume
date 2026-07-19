import { describe, expect, it } from 'vitest'
import { canRevealHintFreely, freeHintsPerPuzzle } from './hints'

describe('canRevealHintFreely', () => {
  it('無料枠内は許可し、使い切ったら拒否する', () => {
    expect(canRevealHintFreely(0)).toBe(true)
    expect(canRevealHintFreely(freeHintsPerPuzzle - 1)).toBe(true)
    expect(canRevealHintFreely(freeHintsPerPuzzle)).toBe(false)
    expect(canRevealHintFreely(freeHintsPerPuzzle + 1)).toBe(false)
  })
})
