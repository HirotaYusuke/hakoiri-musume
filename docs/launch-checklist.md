# 収益化ローンチ チェックリスト

コード側の収益化メカニクス（ヒント・広告制御・パック・paywall・計測）は実装済み。
実際に収益が発生するまでに残っているのは、以下の外部サービス接続と公開作業だけである。
アカウント作成・審査申請は所有者本人しかできないため、着手順に並べる。

## 1. Web公開（0円で今日できる）

- [ ] GitHub リポジトリを作成して push（現状リモート未設定）。
- [ ] ホスティングを選ぶ: GitHub Pages / Cloudflare Pages / Vercel のいずれか。`npm run build` の `dist/` を配信するだけでよい。
- [ ] 公開URLで問題1・15・50・EX1の表示崩れを確認する（README の UI確認メモ参照）。

## 2. 計測の本物化（収益判断の土台）

- [ ] GA4（無料）のプロパティを作成する。
- [ ] `src/analytics/dummyAnalytics.ts` を GA4 送信実装に差し替える。`AnalyticsPort` はそのままでよい。
- [ ] KPI: D1/D7継続率、問題15・50到達率、`hint_used` 率、`paywall_shown → purchase_completed` 転換率。

## 3. 広告（最初の収益源）

- [ ] Web: Google AdSense アカウントを申請する（サイト公開が先に必要）。
- [ ] アプリ化する場合: AdMob アカウント + インタースティシャル/リワードのユニット作成。
- [ ] 差し替え点は2か所: `src/monetization/InterstitialOverlay.tsx`（クリア3回ごと・`hasRemovedAds` で無効、条件は `ads.ts`）と `src/monetization/RewardedOverlay.tsx`（ヒント無料3回超過時の解放、条件は `hints.ts`）。リワードは広告削除購入後も残す設計。
- [ ] 方針を守る: 1問ごとの強制広告なし・失敗時広告なし（business-and-revenue-plan.md）。

## 4. 決済（広告削除・パック販売）

- [ ] Web直販なら Stripe（Payment Links が最速）。ストア配信なら App Store / Google Play の IAP。
- [ ] 差し替え点は1か所: `src/monetization/paymentsPort.ts` の `createMockPayments` を実装に置換する。UI・保存・イベントは既に `PaymentsPort` 越しに動いている。
- [ ] 価格を確定して `src/monetization/products.ts` と `src/puzzles/packs.ts` の `priceLabel` から「（予定）」を外す。
- [ ] 購入の復元（restore purchases）をストア審査要件として実装する。

## 5. 公開に必要な文書

- [ ] プライバシーポリシー（広告SDK・計測を使う場合は必須）。
- [ ] 特定商取引法に基づく表記（日本で直販する場合）。

## 6. ストア展開（ロードマップ 31日目以降）

- [ ] ストア用スクリーンショット・短尺動画（問題1 / 15 / 50 / EX を軸に）。
- [ ] Android（Capacitor 等でラップ）→ 審査 → 公開。iOS はその後に判断。

## 収益が発生する最短ルート

1 → 2 → 3（Web公開 + AdSense）が最短。決済（4）は AdSense 収益と `paywall_shown` の計測値を見てから接続してもよい。
paywall モックは現状「購入する（モック）」と明示しているため、実決済接続までこのまま公開しても誤認は生じない。
