import { findNextHintMove } from '../domain/engine'
import type { HintRequest, HintResponse } from './hintSolver'

type WorkerScope = {
  onmessage: ((event: MessageEvent<HintRequest>) => void) | null
  postMessage: (message: HintResponse) => void
}

const scope = self as unknown as WorkerScope

scope.onmessage = (event) => {
  const { requestId, puzzle, placements } = event.data

  scope.postMessage({
    requestId,
    move: findNextHintMove({ puzzle, placements, history: [] }),
  })
}
