# Implementation Plan

- [ ] 1. プロジェクト基盤とデータベース設計の実装
  - Next.js プロジェクトの初期化（TypeScript, ESLint, Prettier設定）
  - Prisma ORM のセットアップとスキーマ定義
  - Vercel Postgres データベース接続設定
  - 環境変数設定（.env.local, .env.example）
  - _Requirements: 1.1, 9.1, 10.1_

- [ ] 2. ユーザー認証システムの実装
  - NextAuth.js のセットアップ
  - ログイン・登録コンポーネントの作成
  - 認証ミドルウェアの実装（保護されたルート）
  - ユーザー設定ページの実装
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 3. AI サービス統合基盤の実装
  - AIService インターフェースの定義
  - OpenAI サービスクラスの実装（GPT-4 API連携）
  - Claude サービスクラスの実装（Claude API連携）
  - Gemini サービスクラスの実装（Gemini API連携）
  - AI サービス選択機能の実装
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 4. トークン使用量管理システムの実装
  - TokenManager クラスの実装（使用量記録・制限チェック）
  - トークン使用量 API エンドポイントの実装
  - 利用状況表示ダッシュボードの作成
  - 使用量上限チェック機能の実装
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 5. サイト管理機能の実装
  - サイト CRUD API エンドポイントの実装
  - サイト登録・編集フォームコンポーネントの作成
  - サイト一覧表示コンポーネントの実装
  - サイト切り替えプルダウン機能の実装
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 6. URL自動取得機能の実装
  - URL クローラーサービスの実装（同階層以下URL取得）
  - URL 取得 API エンドポイントの実装
  - URL 一覧表示・編集コンポーネントの作成
  - URL 削除・追加機能の実装
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 7. 記事作成方針生成機能の実装
  - ContentPolicyGenerator サービスの実装
  - サイト分析機能の実装（URL・イメージ解析）
  - 記事作成方針生成 API エンドポイントの実装
  - 記事作成方針表示・編集コンポーネントの作成
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 8. 記事概要生成機能の実装
  - ArticleOutlineGenerator サービスの実装
  - 記事概要生成 API エンドポイントの実装
  - 重複チェック機能の実装
  - 記事概要一覧表示コンポーネントの作成
  - ユーザー評価機能の実装（100点満点）
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 9. 記事本文生成機能の実装
  - ArticleContentGenerator サービスの実装
  - 記事生成 API エンドポイントの実装
  - Markdown形式出力機能の実装
  - 自由入力指示対応機能の実装
  - 記事評価機能の実装
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 10. 多言語対応機能の実装
  - LanguageProcessor サービスの実装
  - 多言語記事生成 API エンドポイントの実装
  - 多言語対応状況表示コンポーネントの実装（アイコン表示）
  - 未作成言語記事生成機能の実装
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 11. 記事管理・一覧機能の実装
  - 記事 CRUD API エンドポイントの実装
  - 記事一覧表示ページの作成
  - 記事編集・削除機能の実装
  - AI による記事作り直し機能の実装
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 12. CSV出力機能の実装
  - CSVExporter サービスの実装
  - CSV出力 API エンドポイントの実装
  - チェックボックス選択機能の実装
  - ダウンロード機能の実装
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 13. 一括処理機能の実装
  - BatchProcessor サービスの実装
  - 一括処理 API エンドポイントの実装
  - 全自動作成モード機能の実装
  - 進捗表示コンポーネントの実装（WebSockets / SSE）
  - Vercel タイムアウト対策の実装（Edge Functions）
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [ ] 14. 自動メール送信機能の実装
  - EmailService の実装（SendGrid / Resend.com 連携）
  - DailyProposalGenerator サービスの実装
  - 日次記事概要自動生成 API エンドポイントの実装
  - Vercel Cron Jobs の設定
  - _Requirements: 11.1, 11.2, 11.3_

- [ ] 15. エラーハンドリングとセキュリティの実装
  - グローバルエラーハンドラーの実装
  - API エラーレスポンス標準化
  - 入力バリデーション機能の実装
  - CSRF対策の実装
  - レート制限の実装
  - _Requirements: 9.3, 2.1, 6.4_

- [ ] 16. フロントエンド UI/UX の実装
  - Tailwind CSS セットアップと基本スタイル定義
  - レスポンシブデザインの実装
  - ダークモード対応
  - アクセシビリティ対応
  - 進捗表示・ローディングコンポーネントの実装
  - _Requirements: 12.4, 1.3, 7.3_

- [ ] 17. テスト実装
  - Jest + React Testing Library のセットアップ
  - ユニットテストの作成（サービス・ユーティリティ）
  - コンポーネントテストの作成
  - API テストの作成（MSW使用）
  - E2Eテストの作成（Playwright）
  - _Requirements: 全要件のテスト検証_

- [ ] 18. GitHub & Vercel デプロイ設定
  - GitHub リポジトリ設定（ブランチ保護、PR テンプレート）
  - GitHub Actions CI/CD パイプライン設定
  - Vercel プロジェクト設定
  - 環境変数の設定（開発・本番）
  - デプロイプレビュー設定
  - _Requirements: 全要件の本番環境動作確認_