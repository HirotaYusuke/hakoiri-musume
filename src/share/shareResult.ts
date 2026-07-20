/** 配信中のドメイン・base から公開URLを組み立てる（ホスティング先が変わっても追従する） */
export const getShareUrl = (): string => {
  if (typeof window === 'undefined') {
    return 'https://hirotayusuke.github.io/hakoiri-musume/'
  }

  return new URL(import.meta.env.BASE_URL, window.location.origin).href
}

export type ShareResultParams = {
  readonly puzzleTitle: string
  readonly moveCount: number
  readonly optimalMoves: number
}

export const buildShareText = ({ puzzleTitle, moveCount, optimalMoves }: ShareResultParams): string => {
  const achievement =
    moveCount === optimalMoves
      ? `「${puzzleTitle}」を最短${optimalMoves}手でクリア！`
      : `「${puzzleTitle}」を${moveCount}手でクリア！（最短${optimalMoves}手）`

  return `${achievement} あなたは何手で解ける？ #BrickSlideEscape`
}

export type ShareOutcome = 'shared' | 'intent'

type ShareCapableNavigator = Navigator & {
  share?: (data: { text?: string; url?: string }) => Promise<void>
}

/**
 * Web Share API があれば OS 標準の共有シート（モバイルで有効）、
 * なければ X の投稿画面を開く。ユーザーがキャンセルした場合はフォールバックしない。
 */
export const shareResult = async (params: ShareResultParams): Promise<ShareOutcome> => {
  const text = buildShareText(params)
  const shareUrl = getShareUrl()
  const nav = navigator as ShareCapableNavigator

  if (typeof nav.share === 'function') {
    try {
      await nav.share({ text, url: shareUrl })
    } catch {
      // 共有シートのキャンセル等。X へは開かず終了する。
    }

    return 'shared'
  }

  const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`

  window.open(intent, '_blank', 'noopener')

  return 'intent'
}
