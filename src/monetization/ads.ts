/** クリア何回ごとにインタースティシャル相当を出すか（1問ごとの強制広告は方針として禁止） */
export const interstitialClearInterval = 3

export const shouldShowInterstitial = (
  sessionClearCount: number,
  hasRemovedAds: boolean,
): boolean =>
  !hasRemovedAds &&
  sessionClearCount > 0 &&
  sessionClearCount % interstitialClearInterval === 0
