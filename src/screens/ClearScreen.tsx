type ClearScreenProps = {
  readonly puzzleTitle: string
  readonly moveCount: number
  readonly onSelectNext: () => void
  readonly onReplay: () => void
}

export function ClearScreen({
  puzzleTitle,
  moveCount,
  onSelectNext,
  onReplay,
}: ClearScreenProps) {
  return (
    <main className="screen hero-screen">
      <p className="eyebrow">Clear</p>
      <h1>脱出成功</h1>
      <p className="lead">
        {puzzleTitle}を{moveCount}手でクリアしました。
      </p>
      <div className="action-row">
        <button className="primary-action" onClick={onSelectNext} type="button">
          別の問題へ
        </button>
        <button onClick={onReplay} type="button">
          もう一度
        </button>
      </div>
    </main>
  )
}
