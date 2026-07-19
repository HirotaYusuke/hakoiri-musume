/* @vitest-environment jsdom */

import { afterEach, describe, expect, it } from 'vitest'
import { createGa4Analytics } from './ga4Analytics'

type GtagWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
}

const w = window as GtagWindow

describe('createGa4Analytics', () => {
  afterEach(() => {
    delete w.dataLayer
    delete w.gtag
    document.head.querySelectorAll('script').forEach((script) => script.remove())
  })

  it('gtag.js を初期化し、イベントを name + パラメータで送信する', () => {
    const analytics = createGa4Analytics('G-TEST123')

    const script = document.head.querySelector('script')

    expect(script?.src).toContain('googletagmanager.com/gtag/js?id=G-TEST123')

    analytics.track({ name: 'puzzle_selected', puzzleId: 'intro-first-escape' })

    // gtag.js が処理できるよう、配列ではなく arguments オブジェクトを push している
    const last = w.dataLayer?.at(-1)

    expect(Array.from(last as ArrayLike<unknown>)).toEqual([
      'event',
      'puzzle_selected',
      { puzzleId: 'intro-first-escape' },
    ])
  })

  it('2回目の生成では gtag を再初期化しない', () => {
    createGa4Analytics('G-TEST123')
    const initialLength = w.dataLayer!.length

    createGa4Analytics('G-TEST123')

    expect(w.dataLayer!.length).toBe(initialLength)
    expect(document.head.querySelectorAll('script')).toHaveLength(1)
  })
})
