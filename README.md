# JAN Studio サイト

`Itsuki Serikawa / JAN Studio` の公式サイトです。  
静的な HTML/CSS/JavaScript とヘッドレス CMS（例: microCMS）を組み合わせています。

## ディレクトリ構成

- `index.html` トップページ
- `gallery.html` ギャラリーページ
- `project.html` 撮影案件詳細ページ
- `about.html` プロフィール
- `pricing.html` 料金・サービス
- `blog.html` ブログ／お知らせ
- `contact.html` お問い合わせ
- `assets/css/` スタイル
- `assets/js/` JavaScript ロジック
- `uploader-app/` 公開サイトと分離したアップロード専用アプリ
- `docs_cms_schema.md` CMS のスキーマ定義メモ
- `content_questionnaire.md` 事実情報ヒアリングシート
- `content_fact_inventory.md` 現在文面の確認台帳
- `content_policy.md` 事実運用ポリシー
- `photo_management_guide.md` 写真管理ガイド
- `implementation_map.md` 反映対象マップ
- `verification_checklist.md` 公開前チェックリスト

## 開発方法

ローカルで `index.html` をブラウザで開くだけでも動作しますが、`file://` では `fetch` が動かないブラウザもあるため、簡易サーバーを立てるのがおすすめです。

例 (Python 3):

```bash
cd ポートフォリオサイト
python -m http.server 8000
```

ブラウザで `http://localhost:8000/` を開きます。

## CMS 設定

1. microCMS などで API サービスを作成します。
2. `docs_cms_schema.md` に従って `photos`, `projects`, `blogPosts`, `siteSettings` などのコレクションを作成します。
3. `assets/js/config.js` の以下を、実際の値に変更します。

```js
CMS_BASE_URL: "https://<your-service>.microcms.io/api/v1",
CMS_API_KEY: "<発行された API キー>",
```

### 写真アップロード運用（ローカル専用）

画像アップロードと `photos` 登録は `uploader-app/` を使用します。  
公開サイトとは分離し、ローカル環境でのみ運用してください。

## フォーム送信設定

`assets/js/contact.js` の `ENDPOINT` に Formspree 等のエンドポイント URL を設定します。

## デプロイ

GitHub Pages, Netlify, Vercel 等の静的ホスティングに `ポートフォリオサイト` ディレクトリをそのままアップロードすれば公開できます。

### Cloudflare ドメインで公開する場合

1. Cloudflare Pages でこのプロジェクトを接続
2. Build command は空欄（静的HTMLのため）
3. Output directory は `/`（リポジトリルート）
4. Custom Domain に保有ドメインを設定
5. DNSが有効化されるまで待ち、HTTPS有効化を確認

注意:
- `uploader-app/.env` は絶対に公開しない
- `uploader-app` はローカル専用運用を維持（本体サイトに統合しない）

## Lightroom Presets 販売導線

- 各ページの `Presets` リンクは外部販売ページ向けです。
- 現在はプレースホルダURLのため、公開前に差し替えてください:
  - `https://example.com/jan-studio-presets`

