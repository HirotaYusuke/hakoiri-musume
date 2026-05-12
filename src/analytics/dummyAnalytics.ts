import type { AnalyticsPort } from './port'

export const createDummyAnalytics = (): AnalyticsPort => ({
  track: (event) => {
    console.info('[analytics]', event)
  },
})
