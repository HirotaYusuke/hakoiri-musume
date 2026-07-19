import type { AnalyticsPort } from './port'

type GtagWindow = Window & {
  dataLayer?: unknown[]
  gtag?: (...args: unknown[]) => void
}

/**
 * GA4（gtag.js）への送信実装。
 * 測定IDはビルド時の `VITE_GA4_ID` から渡す。未設定環境では呼ばれない前提
 * （App 側で dummy にフォールバックする）。
 *
 * gtag.js は dataLayer に積まれた `arguments` オブジェクトのみを処理し、
 * 通常配列を push すると無視される。そのため Google 公式スニペットと同じく
 * `function gtag(){ dataLayer.push(arguments) }` の形で実装する（アロー関数の
 * rest 引数だと配列が push され、計測ビーコンが送信されない）。
 */
export const createGa4Analytics = (measurementId: string): AnalyticsPort => {
  const w = window as GtagWindow

  if (!w.gtag) {
    const dataLayer = (w.dataLayer = w.dataLayer ?? [])

    function gtag() {
      // eslint-disable-next-line prefer-rest-params
      dataLayer.push(arguments)
    }

    w.gtag = gtag as (...args: unknown[]) => void
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
