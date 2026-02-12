# 写真管理ガイド（microCMS継続運用）

## 目的

- 命名のバラつきをなくす
- 後から探しやすくする
- 公開可否を安全に管理する

## 1) 命名規則

- 形式: `YYYYMMDD_genre_team_event_seq`
- 例: `20261019_american-football_clubislands_x3_week07_001`
- ルール:
  - 英小文字 + 数字 + `_` のみ
  - スペース禁止
  - `seq` は3桁ゼロ埋め

## 2) 必須メタデータ（photos）

- `title`
- `genre`
- `eventDate`
- `team`
- `location`
- `publishStatus` (`draft` / `unlisted` / `public`)
- `featuredPriority`（任意、トップ表示で使用）
- `projectId`（案件ページ紐付け時）
- `tags`（大会名/選手名/シーン種別）

## 3) 入力時チェック

- `publishStatus` が `public` の写真のみ公開対象
- `eventDate` 未入力は公開しない
- `genre` は定義済み値のみ使用（自由入力を禁止）
- 画像差し替え時は `title` と `tags` も同時更新
- 未承諾の個人特定情報（氏名・背番号による特定など）は公開しない

## 4) 公開フロー

1. 画像をアップロード（命名規則に従う）
2. 必須メタデータを入力
3. `draft` で一次確認
4. 問題なければ `public` に変更
5. トップ掲載したい場合のみ `featuredPriority` を設定

## 5) 週次メンテナンス

- `public` のうちタグ未設定を解消
- 重複タイトル・誤字を修正
- 使用しない `unlisted` を整理
