import type { AnalyticsPort } from './port'

type GtagWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
}

/**
 * GA4（gtag.js）への送信実装。
 * 測定IDはビルド時の `VITE_GA4_ID` から渡す。未設定環境では呼ばれない前提
 * （App 側で dummy にフォールバックする）。
 */
export const createGa4Analytics = (measurementId: string): AnalyticsPort => {
  const w = window as GtagWindow

  if (!w.gtag) {
    w.dataLayer = w.dataLayer ?? []
    w.gtag = (...args: unknown[]) => {
      w.dataLayer!.push(args)
    }
    w.gtag('js', new Date())
    w.gtag('config', measurementId)

    const script = document.createElement('script')

    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
    document.head.appendChild(script)
  }

  return {
    track: (event) => {
      const { name, ...params } = event

      w.gtag!('event', name, params)
    },
  }
}
