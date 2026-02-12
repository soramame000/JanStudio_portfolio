# CMS スキーマ設計（例: microCMS）

## photos

- `id` (自動)
- `title` (テキスト)
- `caption` (リッチテキスト or テキストエリア)
- `image` (画像)
- `genre` (ラジオ or セレクト: american-football / music-event など、ジャンル名)
- `eventDate` (日付: 撮影日)
- `team` (テキスト: チーム名、複数は「,」区切り)
- `location` (テキスト: 会場名)
- `tags` (複数タグ: 大会名/選手名/シーン種別)
- `publishStatus` (セレクト: draft / unlisted / public)
- `featuredPriority` (数値: 小さいほど上位表示。未入力は末尾)
- `projectId` (テキスト or `projects`へのリレーション)
- `createdAt` (自動)

### photos の運用ルール

- 公開対象は `publishStatus = public` のみ
- トップ表示は `featuredPriority` -> `eventDate` -> `createdAt` の順で並び替え
- 命名規則（タイトル/ファイル管理台帳）: `YYYYMMDD_genre_team_event_seq`
  - 例: `20261019_american-football_clubislands_x3_week07_001`

## projects

- `id` (自動)
- `title` (テキスト)
- `summary` (テキストエリア)
- `story` (リッチテキスト or テキストエリア)
- `clientName` (テキスト)
- `category` (セレクト)
- `shootDate` (日付)
- `mainImage` (画像)
- `photos` (`photos` への複数リレーション)
- `credits` (リピーターフィールド)
  - `role` (テキスト)
  - `name` (テキスト)

## blogPosts

- `id` (自動)
- `title` (テキスト)
- `body` (リッチテキスト)
- `thumbnail` (画像)
- `publishedAt` (日付・公開日時)
- `tags` (複数タグ)

## siteSettings

- `id` (固定 ID 推奨: `site-settings` など)
- `siteTitle` (テキスト)
- `profileShort` (テキストエリア)
- `instagramUrl` (テキスト)
- `xUrl` (テキスト)
- `tiktokUrl` (テキスト)
- `ogImage` (画像)

