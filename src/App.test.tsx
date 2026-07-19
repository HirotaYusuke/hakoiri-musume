/* @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App purchase flow', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  const openPuzzleSelect = () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '問題を選ぶ' }))
  }

  it('パック購入はpaywall経由で確定し、パック問題が選択可能になる', async () => {
    openPuzzleSelect()

    fireEvent.click(screen.getByRole('button', { name: /難問パック EX/ }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '購入する（モック）' }))

    expect(await screen.findByRole('heading', { name: '難問パック EX' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /EX1$/ })).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    const saved = JSON.parse(localStorage.getItem('hakoiri-musume:save')!)

    expect(saved.monetization.purchasedPackIds).toEqual(['rush-pack-1'])
  })

  it('ヒントは非同期に計算され、2段階で駒と方向を表示する', async () => {
    openPuzzleSelect()

    fireEvent.click(screen.getByRole('button', { name: /問題1$/ }))
    fireEvent.click(screen.getByRole('button', { name: 'ヒントを見る' }))

    expect(await screen.findByText(/次に動かす駒/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '動かす方向も見る' }))

    expect(await screen.findByText(/「.+」を(上|下|左|右)へ/)).toBeInTheDocument()
  })

  it('クリア画面に結果シェアボタンが表示される', () => {
    openPuzzleSelect()

    fireEvent.click(screen.getByRole('button', { name: /問題1$/ }))
    // 問題1を最短手順でクリア: 下梁を右 → ターゲットを下2回
    fireEvent.click(screen.getByRole('button', { name: /^下梁:/ }))
    fireEvent.click(screen.getByRole('button', { name: '右へ移動' }))
    fireEvent.click(screen.getByRole('button', { name: /^赤いターゲット:/ }))
    fireEvent.click(screen.getByRole('button', { name: '下へ移動' }))
    fireEvent.click(screen.getByRole('button', { name: '下へ移動' }))

    expect(screen.getByText('脱出成功')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '結果をシェアする' })).toBeInTheDocument()
  })

  it('paywallをキャンセルすると購入状態は変わらない', () => {
    openPuzzleSelect()

    fireEvent.click(screen.getByRole('button', { name: /難問パック EX/ }))
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /難問パック EX/ })).toBeInTheDocument()
  })
})
