type HomeScreenProps = {
  readonly onStart: () => void
  readonly onOpenSettings: () => void
}

export function HomeScreen({ onStart, onOpenSettings }: HomeScreenProps) {
  return (
    <main className="screen hero-screen">
      <p className="eyebrow">Brick Slide Escape MVP</p>
      <h1>Brick Slide Escape</h1>
      <p className="lead">
        レンガブロックをずらし、赤いターゲットを壁のEXITへ導くスライドパズルです。
      </p>
      <button className="primary-action" onClick={onStart} type="button">
        問題を選ぶ
      </button>
      <button className="text-action" onClick={onOpenSettings} type="button">
        設定
      </button>
      <p className="home-footer">
        <a href="privacy.html">プライバシーポリシー</a>
      </p>
    </main>
  )
}
