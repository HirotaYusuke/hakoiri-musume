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

  it('paywallをキャンセルすると購入状態は変わらない', () => {
    openPuzzleSelect()

    fireEvent.click(screen.getByRole('button', { name: /難問パック EX/ }))
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /難問パック EX/ })).toBeInTheDocument()
  })
})
