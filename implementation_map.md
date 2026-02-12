# 実装反映マップ

## 文面・事実反映先

- `index.html` : JAN Studioブランド、トップ訴求文、実績帯、Preset導線、CTA
- `about.html` : プロフィール、経歴、機材
- `pricing.html` : プラン内容、料金、注意事項、Preset販売導線
- `gallery.html` : ギャラリー見出し、分類説明
- `blog.html` : ジャーナル説明文
- `contact.html` : 返信目安、受付条件
- `project.html` : JAN Studioブランド表記統一

## データ連携反映先

- `assets/js/index.js`
  - `photos` から `publishStatus=public` のみ表示
  - `featuredPriority` -> `eventDate` -> `createdAt` で並び替え
- `assets/js/gallery.js`
  - `publishStatus=public` フィルタ
  - `eventDate` 優先の並び替え
  - ライトボックス遷移は既存仕様を維持
- `admin-upload.html` / `assets/js/admin-upload.js`
  - 画像アップロード + `photos` 登録
  - 必須メタデータ入力の運用をUI化
  - localhost でのみ有効（公開環境では無効化）
- `uploader-app/`
  - 公開サイトと分離したアップロード専用アプリ

## 管理運用文書

- `docs_cms_schema.md` : CMSフィールド仕様
- `content_policy.md` : 事実運用ポリシー
- `content_questionnaire.md` : 情報回収シート
- `content_fact_inventory.md` : 事実確認台帳
- `photo_management_guide.md` : 写真運用ガイド
- `verification_checklist.md` : 公開前チェック
