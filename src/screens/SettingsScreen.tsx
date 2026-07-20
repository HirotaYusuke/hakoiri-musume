type SettingsScreenProps = {
  readonly soundEnabled: boolean
  readonly clearedCount: number
  readonly onToggleSound: () => void
  readonly onResetProgress: () => void
  readonly onBack: () => void
}

export function SettingsScreen({
  soundEnabled,
  clearedCount,
  onToggleSound,
  onResetProgress,
  onBack,
}: SettingsScreenProps) {
  const confirmReset = () => {
    if (
      window.confirm(
        `クリア記録・自己ベスト・購入状態をすべて消去します。元に戻せません。よろしいですか？（クリア済み ${clearedCount} 問）`,
      )
    ) {
      onResetProgress()
    }
  }

  return (
    <main className="screen">
      <button className="text-action" onClick={onBack} type="button">
        ホームへ戻る
      </button>
      <h1>設定</h1>

      <div className="settings-list">
        <div className="settings-row">
          <div className="settings-label">
            <strong>効果音</strong>
            <small>移動・壁・クリアの音を鳴らします</small>
          </div>
          <button
            aria-pressed={soundEnabled}
            className={`toggle ${soundEnabled ? 'toggle-on' : 'toggle-off'}`}
            onClick={onToggleSound}
            type="button"
          >
            {soundEnabled ? 'オン' : 'オフ'}
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-label">
            <strong>進行データの消去</strong>
            <small>クリア記録・自己ベスト・購入状態を初期化</small>
          </div>
          <button className="danger-action" onClick={confirmReset} type="button">
            消去する
          </button>
        </div>
      </div>
    </main>
  )
}
