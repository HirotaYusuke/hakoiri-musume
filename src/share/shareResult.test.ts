import { describe, expect, it } from 'vitest'
import { buildShareText } from './shareResult'

describe('buildShareText', () => {
  it('最短未達なら手数と最短手数の両方を含める', () => {
    const text = buildShareText({ puzzleTitle: '問題50', moveCount: 18, optimalMoves: 15 })

    expect(text).toContain('「問題50」を18手でクリア！')
    expect(text).toContain('最短15手')
    expect(text).toContain('#BrickSlideEscape')
  })

  it('最短達成なら「最短N手でクリア」と表示する', () => {
    const text = buildShareText({ puzzleTitle: 'EXX12', moveCount: 37, optimalMoves: 37 })

    expect(text).toContain('「EXX12」を最短37手でクリア！')
    expect(text).not.toContain('（最短')
  })
})
