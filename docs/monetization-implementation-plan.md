# 収益化 実装計画

## 目的

このアプリは、短時間で遊べる検証済みパズルとして成立している。次の段階では、体験を壊さずに収益導線を追加する。

最初に入れるべき収益導線は次の3つだけに絞る。

- `ヒント`
- `広告削除`
- `追加問題パック`

## 現状の前提

- 保存状態は [storage/localStorageRepository.ts](../src/storage/localStorageRepository.ts) で `localStorage` に載っている。
- 解析イベントは [analytics/dummyAnalytics.ts](../src/analytics/dummyAnalytics.ts) を差し替える形になっている。
- 画面遷移は [App.tsx](../src/App.tsx) にまとまっている。
- 問題は [puzzles/catalog.ts](../src/puzzles/catalog.ts) と [puzzles/scrambleCore.ts](../src/puzzles/scrambleCore.ts) で管理している。

この構造なら、収益化はサーバーなしでも段階導入できる。

## 実装方針

### 1. 先に状態を持つ

収益機能は UI ボタンだけ先に置かず、まず状態を定義する。

保存する項目:

- `hasRemovedAds`
- `usedHintCount`
- `purchasedPackIds`
- `lastHintAt`
- `monetizationDismissedAt`

保存先:

- 既存の `localStorage` 保存データに同居させる。
- 既存キー内に `monetization` を追加し、旧セーブデータはデフォルト値で補完する。

### 2. 次にイベントを増やす

`analytics` に次のイベントを追加する。

- `hint_opened`
- `hint_used`
- `hint_purchase_tapped`
- `remove_ads_tapped`
- `pack_purchase_tapped`
- `paywall_shown`
- `paywall_dismissed`

この段階では課金実装より先に、どこで離脱が起きるかを見られるようにする。

### 3. UI は3か所だけ増やす

増やす画面:

- プレイ画面
- クリア画面
- 問題選択画面

入れる導線:

- プレイ画面に「ヒント」ボタン
- クリア画面に「広告削除」「次の問題パック」
- 問題選択画面に「追加パック」カード

### 4. 課金 SDK は最後

最初のスコープでは、実課金 SDK は不要。

先にやること:

- モックの paywall
- ボタンイベントの計測
- `hasRemovedAds` による広告表示制御

後でやること:

- App Store / Google Play IAP
- 復元購入
- 購入状態の同期

## ファイル分割

### コア状態

- [src/storage/port.ts](../src/storage/port.ts)
- [src/storage/localStorageRepository.ts](../src/storage/localStorageRepository.ts)

追加する項目:

- 収益化状態の型
- 保存・復元処理

### 解析イベント

- [src/analytics/port.ts](../src/analytics/port.ts)
- [src/analytics/dummyAnalytics.ts](../src/analytics/dummyAnalytics.ts)
- [src/App.tsx](../src/App.tsx)

追加する項目:

- 収益化イベント型
- `track` 呼び出し

### 画面

- [src/screens/PlayScreen.tsx](../src/screens/PlayScreen.tsx)
- [src/screens/ClearScreen.tsx](../src/screens/ClearScreen.tsx)
- [src/screens/PuzzleSelectScreen.tsx](../src/screens/PuzzleSelectScreen.tsx)

追加する項目:

- ヒントボタン
- paywall ボタン
- 追加パック導線

### 追加候補

- [src/monetization/](../src)

ここにまとめる候補:

- paywall コンポーネント
- ヒント文面
- 価格文言
- 収益化状態ユーティリティ

## ヒント設計

ヒントは段階式にする。

1. `選択中の駒の動ける方向`
2. `次に動かすべき駒の候補`
3. `1手だけの正解`
4. `解法の途中までの手順`

この順序にすると、無料ユーザーにも有用で、課金導線も自然になる。

## 広告設計

広告の基本方針:

- 失敗時広告は入れない
- 1問ごとの強制広告は入れない
- クリア後または問題選択への戻りでのみ出す

広告制御:

- `hasRemovedAds === true` なら広告を出さない
- `purchasedPackIds` に応じて追加パック広告も抑制する

## 価格の初期案

- 広告削除: 300〜600円
- 問題パック: 300〜600円
- 全問題パス: 800〜1200円

初期公開では、価格は固定せず検証可能な文言にする。

## 実装順

### Phase 1

- 収益化状態の型を追加する
- 保存・復元を通す
- イベントを追加する
- paywall モックを画面に置く

### Phase 2

- ヒント機能を実装する
- 広告削除フラグで表示制御する
- クリア画面にアップセルを置く

### Phase 3

- 追加問題パックを定義する
- パック購入導線を置く
- ストア課金 SDK を接続する

## 完了条件

- 収益化状態が `localStorage` に保存される
- 主要イベントが `analytics` に流れる
- ヒントが最低1段階動く
- 広告削除で広告表示が消える
- 追加パック導線が問題選択画面に出る
- 既存のパズル体験が壊れない

## リスク

- ヒントが強すぎると問題の価値が落ちる
- 広告が多いとレビューが悪化する
- 追加パックが少ないと売り物として弱い
- 課金導線だけ先に出すと不信感が出る

## 次の実装タスク

最初に着手するなら次の順がよい。

1. 収益化状態の型と localStorage 保存
2. analytics イベント追加
3. プレイ画面のヒント UI
4. クリア画面のアップセル
5. 問題選択画面のパック表示

## 進捗

### Phase 1 実装済み

- `SaveData` に `monetization` を追加した。
- 旧セーブデータからの読み込み時に、収益化状態のデフォルト値を補完する。
- `hint_used`、`remove_ads_tapped`、`pack_purchase_tapped` を追加した。
- プレイ画面にヒント使用ボタンを追加した。
- クリア画面に広告削除・追加パック導線を追加した。
- 問題選択画面に追加パック導線を追加した。

### Phase 2 / Phase 3（コード側）実装済み

- ヒントは BFS（`findNextHintMove`）で現在盤面から最短の次手を計算し、段階式（駒名 → 方向）で表示する。1段階目で対象の駒を盤面上で自動選択する。
- ヒントは1問あたり無料3回。以降はリワード広告モックの視聴で解放する（`ad_rewarded_shown` / `completed` / `dismissed` を計測）。広告削除購入はインタースティシャルのみ対象で、リワードは残す。
- クリア3回ごとにインタースティシャル相当のプレースホルダーを表示し、`hasRemovedAds` で完全非表示にする。
- 追加パック `rush-pack-1` は本編にない10駒構成の検証済み難問12問（最短15〜21手、本編最難関=15手以上を保証）。
- 追加パック `rush-pack-2`（超難問パック）は12駒の高密度テンプレート（ランダム配置探索で発見、状態空間12,398）による12問。最短26〜37手・操作15〜19手で、パズル愛好家向けの最上位帯。クリア画面の導線は「未購入パックの先頭」を自動で提示する。
- 購入は `PaywallDialog` + `PaymentsPort`（モック）経由に統一し、`paywall_shown` / `paywall_dismissed` / `purchase_completed` / `hint_opened` / `ad_interstitial_shown` を計測する。

### 品質検証（2026-07-19 実施）

批判的テストにより以下を修正済み:

- 本編・パックに存在した「サンプル解法が同一の問題ペア」8組を、生成器の解法類似排除（編集距離）と配置類似排除（1駒違い禁止）で全廃した。回帰テストで恒久保証。
- 難易度カーブを実測で単調化（入門3-4手 → 標準4-7手 → 難問8-15手 → EX15-21手）。
- ヒント無料使い放題（収益設計の穴）をリワードゲートで封鎖した。

この時点で「完了条件」はすべて満たしている。残るは実SDK・外部サービスの接続のみで、手順は [launch-checklist.md](launch-checklist.md) を参照。
