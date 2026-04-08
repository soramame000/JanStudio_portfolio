# Uploader App

公開サイトとは分離して使う、写真アップロード専用アプリです。  
`microCMS` の書き込みはこのアプリ経由で行います。

## 1. セットアップ

```bash
cd uploader-app
npm install
cp .env.example .env
```

`.env` を編集:

- `APP_PASSWORD`: Y7#nQ2v!Kp9sL4xT
- `CMS_BASE_URL`: 例 `https://your-service.microcms.io/api/v1`
- `CMS_API_KEY`: 書き込みAPIキー

## 2. 起動

```bash
npm start
```

ブラウザで `http://localhost:8787` を開きます。

## 3. セキュリティ注意

- このアプリは公開サイトと分離して運用してください
- `.env` はGitに含めないでください
- APIキーは定期的にローテーションしてください
