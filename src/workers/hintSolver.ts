import { findNextHintMove } from '../domain/engine'
import type { Move, PiecePlacement, Puzzle } from '../domain/types'

export type HintRequest = {
  readonly requestId: number
  readonly puzzle: Puzzle
  readonly placements: readonly PiecePlacement[]
}

export type HintResponse = {
  readonly requestId: number
  readonly move: Move | null
}

export type HintSolver = {
  readonly solve: (puzzle: Puzzle, placements: readonly PiecePlacement[]) => Promise<Move | null>
}

/**
 * ヒントBFSをWeb Workerで実行するソルバー。
 * Worker が無い環境（テスト・SSR）では同期計算にフォールバックする。
 */
export const createHintSolver = (): HintSolver => {
  if (typeof Worker === 'undefined') {
    return {
      solve: (puzzle, placements) =>
        Promise.resolve(findNextHintMove({ puzzle, placements, history: [] })),
    }
  }

  const worker = new Worker(new URL('./hintWorker.ts', import.meta.url), { type: 'module' })
  const pending = new Map<number, (move: Move | null) => void>()
  let nextRequestId = 0

  worker.onmessage = (event: MessageEvent<HintResponse>) => {
    pending.get(event.data.requestId)?.(event.data.move)
    pending.delete(event.data.requestId)
  }

  return {
    solve: (puzzle, placements) =>
      new Promise((resolve) => {
        const requestId = nextRequestId++

        pending.set(requestId, resolve)
        worker.postMessage({ requestId, puzzle, placements } satisfies HintRequest)
      }),
  }
}
