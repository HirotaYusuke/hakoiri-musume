type HomeScreenProps = {
  readonly onStart: () => void
}

export function HomeScreen({ onStart }: HomeScreenProps) {
  return (
    <main className="screen hero-screen">
      <p className="eyebrow">Hakoiri Musume MVP</p>
      <h1>箱入り娘</h1>
      <p className="lead">
        木枠の中で駒を一手ずつ動かし、娘を出口まで導く古典スライドパズルです。
      </p>
      <button className="primary-action" onClick={onStart} type="button">
        問題を選ぶ
      </button>
    </main>
  )
}
