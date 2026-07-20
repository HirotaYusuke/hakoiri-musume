/* @vitest-environment jsdom */

import { afterEach, describe, expect, it } from 'vitest'
import { createGa4Analytics } from './ga4Analytics'

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void
}

const w = window as GtagWindow

describe('createGa4Analytics', () => {
  afterEach(() => {
    delete w.gtag
  })

  it('window.gtag にイベント名とパラメータを渡す', () => {
    const calls: unknown[][] = []

    w.gtag = (...args: unknown[]) => {
      calls.push(args)
    }

    createGa4Analytics().track({ name: 'puzzle_selected', puzzleId: 'intro-first-escape' })

    expect(calls).toEqual([['event', 'puzzle_selected', { puzzleId: 'intro-first-escape' }]])
  })

  it('gtag が無い環境では何もしない（例外を投げない）', () => {
    expect(() =>
      createGa4Analytics().track({ name: 'sound_toggled', enabled: false }),
    ).not.toThrow()
  })
})
