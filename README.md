# JAN STUDIO サイト

`Itsuki Serikawa / JAN STUDIO` の公式サイトです。
静的な HTML/CSS/JavaScript とヘッドレス CMS（microCMS）を組み合わせています。
公開URL: https://janstudio.app

## ディレクトリ構成

- `index.html` トップページ
- `works.html` 撮影実績ギャラリー
- `project.html` 撮影案件詳細（Case Study）ページ
- `about.html` プロフィール
- `services.html` 料金・サービス
- `journal.html` ジャーナル（記事一覧・詳細）
- `contact.html` お問い合わせ
- `404.html` Not Found ページ
- `assets/css/` スタイル
- `assets/js/` JavaScript ロジック
  - `config.js` CMSプロキシのURL等の設定
  - `api.js` 共通ユーティリティ（CMS取得・HTMLエスケープ・フローティングCTA）
  - `components.js` ヘッダー/フッターのWeb Components
- `api-proxy/` Cloudflare Worker。microCMS のAPIキーを隠蔽するプロキシ
- `functions/` Cloudflare Pages Functions。Journal / Project 詳細のSSRと動的 sitemap
- `_routes.json` Pages Functions を動かすルートの限定設定
- `robots.txt` 検索・AIクローラー向けクロール設定
- `llms.txt` AIエージェント向けの補助的なサイト案内（Googleのランキング用途ではありません）
- `uploader-app/` 公開サイトと分離したアップロード専用アプリ（ローカル専用）
- `docs_cms_schema.md` CMS のスキーマ定義メモ
- `content_questionnaire.md` 事実情報ヒアリングシート
- `content_fact_inventory.md` 現在文面の確認台帳
- `content_policy.md` 事実運用ポリシー
- `photo_management_guide.md` 写真管理ガイド
- `implementation_map.md` 反映対象マップ
- `verification_checklist.md` 公開前チェックリスト

## 開発方法

固定ページだけを確認する場合は簡易サーバーでも動作します。拡張子なしURLとPages Functionsを含めて本番相当で確認する場合はWranglerを使用してください。

例 (Python 3):

```bash
cd ポートフォリオサイト
python -m http.server 8000
```

ブラウザで `http://localhost:8000/` を開きます。

Cloudflare Pages相当の確認:

```bash
api-proxy/node_modules/.bin/wrangler pages dev . --port 8790
```

## CMS とAPIプロキシ

フロントエンドは microCMS に直接アクセスせず、`api-proxy/`（Cloudflare Worker）を経由します。
APIキーは Worker の環境変数（`CMS_BASE_URL` / `CMS_API_KEY`）にのみ保存し、フロントには置きません。

- 接続先は `assets/js/config.js` の `CMS_BASE_URL` で設定します（Worker の `/api` を指す）。
- Worker は `photos` / `blogPosts` / `projects` / `siteSettings` のみ許可し、
  `photos` 一覧には `publishStatus=public` のフィルタを強制適用します（下書きの漏えい防止）。
- スキーマは `docs_cms_schema.md` を参照してください。

Worker のデプロイ:

```bash
cd api-proxy
npx wrangler deploy
```

### 写真アップロード運用（ローカル専用）

画像アップロードと `photos` 登録は `uploader-app/` を使用します。
公開サイトとは分離し、ローカル環境でのみ運用してください。

## フォーム送信設定

`contact.html` のフォームは formsubmit.co を利用しています（`action` 属性で設定）。
送信後は `/contact?success=true` にリダイレクトされ、完了メッセージが表示されます。
スパム対策としてハニーポット（`_honey`）を設置しています。

## 画像について

ページ内のローカル画像は WebP（`assets/img/*.webp`）を使用しています。
OGP 用には互換性のため JPG 版（`assets/img/*.jpg`)を残しています。
新しい画像を追加する場合は `cwebp -q 78 input.jpg -o output.webp` で変換してください。

## デプロイ

固定ページだけなら一般的な静的ホスティングでも公開できます。Journal / Project の検索向けサーバー描画と動的 sitemap を含む完全な構成はCloudflare Pagesを前提とします。

### Cloudflare ドメインで公開する場合

1. Cloudflare Pages でこのプロジェクトを接続
2. Build command は空欄（Pages Functions は自動コンパイル）
3. Output directory は `/`（リポジトリルート）
4. Custom Domain に保有ドメインを設定
5. DNSが有効化されるまで待ち、HTTPS有効化を確認

注意:
- `uploader-app/.env` / `api-proxy/.dev.vars` は絶対に公開しない
- `uploader-app` はローカル専用運用を維持（本体サイトに統合しない）

## SEO / AI検索

- canonical・内部リンク・sitemap はCloudflare Pagesの最終URL（`/works` など拡張子なし）に統一しています。
- 固定ページはページ固有の title / description / OGP / Twitter Card / JSON-LD を持ちます。
- `/journal/:id` と `/project/:id` はPages FunctionsがCMSデータをサーバー描画し、固有のcanonical、本文、画像、`BlogPosting` / `CreativeWork` 構造化データを返します。
- `/sitemap.xml` は固定ページに加えて、公開済みのJournal / Project詳細URLをCMSから動的生成します。CMSが未作成・空でも固定ページのsitemapを返します。
- `robots.txt` はGoogle等に加え、OAI-SearchBot、ChatGPT-User、GPTBot、ClaudeBot、PerplexityBotを許可しています。
- Google Searchでは `llms.txt` はランキング要因ではありません。AI検索の主対策は、クロール可能なHTML、明確な事業・著者情報、一次情報、最終URLの統一です。

公開後はGoogle Search Consoleで `https://janstudio.app/sitemap.xml` を送信し、主要6ページのURL検査を行ってください。
