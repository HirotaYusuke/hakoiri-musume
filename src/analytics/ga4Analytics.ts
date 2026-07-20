import type { AnalyticsPort } from './port'

type GtagWindow = Window & {
  gtag?: (...args: unknown[]) => void
}

/**
 * GA4 送信アダプタ。gtag.js 本体と config は index.html の静的スニペットが担うため、
 * ここではイベントを既存の window.gtag に流すだけ。
 * gtag が無い環境（テスト等）では何もしない。
 */
export const createGa4Analytics = (): AnalyticsPort => ({
  track: (event) => {
    const { name, ...params } = event
    const w = window as GtagWindow

    if (typeof w.gtag === 'function') {
      w.gtag('event', name, params)
    }
  },
})
