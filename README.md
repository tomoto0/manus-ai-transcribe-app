# AI議事録作成アプリ - 日本語会議の自動転写・翻訳・要約

日本語会議の音声を自動的に転写し、翻訳、議事録を生成するWebアプリケーションです。Manus OpenAI LLM機能を統合し、リアルタイムで高精度な処理を実現しています。

## 🌐 本番環境URL

**デプロイURL**: https://aitranscribe-lyvmgdbf.manus.space

## 📸 アプリケーション画面

![AI議事録作成アプリ](./client/public/og-image.png)

## ✨ 主な機能

### 1. 音声録音と自動転写
- ブラウザのマイクを使用してリアルタイム音声録音
- Manus Whisper API統合による高精度な音声転写
- 日本語、英語、その他多言語対応

### 2. 多言語翻訳
- Manus OpenAI LLM統合による自然な翻訳
- 対応言語：日本語、英語、スペイン語、フランス語、中国語、韓国語、アラビア語、ヒンディー語、ロシア語、インドネシア語
- コンテキストを考慮した高品質な翻訳

### 3. 議事録自動生成
- 3段階の要約レベル
  - **短い要約**: 4-5行の簡潔なサマリー
  - **中程度の要約**: 3-4段落の詳細なサマリー（150-250語）
  - **詳細な要約**: 5段落以上の包括的な分析（400語以上）
- ビジネスアナリストレベルの高品質な議事録
- キーポイント、決定事項、アクションアイテムを自動抽出

### 4. リアルタイムプログレス表示
- 転写、翻訳、議事録生成の各処理状態を視覚的に表示
- チェックマークによる完了状態の確認

## 🏗️ アーキテクチャ

### フロントエンド
- **React 19** + **TypeScript**: モダンなUI構築
- **Tailwind CSS 4**: レスポンシブデザイン
- **shadcn/ui**: 一貫性のあるUIコンポーネント
- **tRPC React Query**: 型安全なAPI通信

### バックエンド
- **Node.js** + **Express 4**: サーバーサイドロジック
- **tRPC 11**: エンドツーエンドの型安全性
- **Drizzle ORM**: データベース操作
- **MySQL/TiDB**: データストレージ

### AI統合
- **Manus OpenAI LLM**: 翻訳と議事録生成
- **Manus Whisper API**: 音声転写
- **Manus S3 Storage**: 音声ファイルストレージ

### 認証
- **認証なし**: 誰でも自由に利用可能（publicProcedure使用）

## 📁 プロジェクト構造

```
ai-transcribe-app/
├── client/                 # フロントエンド
│   ├── public/            # 静的ファイル
│   │   ├── og-image.png   # OGP画像
│   │   └── app-screenshot.jpeg  # アプリ画面
│   └── src/
│       ├── pages/         # ページコンポーネント
│       │   └── Home.tsx   # メインページ
│       ├── components/    # UIコンポーネント
│       ├── lib/           # ユーティリティ
│       └── const.ts       # 定数定義
├── server/                # バックエンド
│   ├── routers.ts         # tRPCルーター
│   ├── db.ts              # データベースヘルパー
│   ├── storage.ts         # S3ストレージ
│   └── _core/             # コア機能
│       ├── llm.ts         # LLM統合
│       └── voiceTranscription.ts  # 音声転写
├── drizzle/               # データベーススキーマ
│   └── schema.ts
└── shared/                # 共有型定義
```

## 🚀 デプロイ方法

### Manusプラットフォームでのデプロイ

1. **Manusアカウントの作成**
   - https://manus.im にアクセスしてアカウントを作成

2. **プロジェクトのクローン**
   ```bash
   git clone https://github.com/tomoto0/manus-ai-transcribe-app.git
   cd manus-ai-transcribe-app
   ```

3. **Manusプロジェクトの初期化**
   - Manus UIで新しいプロジェクトを作成
   - プロジェクトタイプ: **フルスタックWebアプリ（tRPC + Auth + Database）**
   - 機能: `server`, `db`, `user`

4. **ファイルのアップロード**
   - すべてのファイルをManusプロジェクトにアップロード
   - または、Management UIの「Settings」→「GitHub」からリポジトリをインポート

5. **環境変数の設定**
   - Manusは以下の環境変数を自動的に設定します：
     - `BUILT_IN_FORGE_API_KEY`: Manus LLM/Whisper APIキー
     - `BUILT_IN_FORGE_API_URL`: Manus APIエンドポイント
     - `DATABASE_URL`: データベース接続文字列
     - その他のシステム環境変数

6. **デプロイ**
   - Management UIの「Publish」ボタンをクリック
   - 自動的にビルドとデプロイが実行されます

### ローカル開発環境のセットアップ

```bash
# 依存関係のインストール
pnpm install

# データベースマイグレーション
pnpm db:push

# 開発サーバーの起動
pnpm dev
```

開発サーバーは `http://localhost:3000` で起動します。

## 🔧 技術スタック

### コア技術
- **言語**: TypeScript 5.x
- **ランタイム**: Node.js 22.x
- **パッケージマネージャー**: pnpm

### フロントエンド
- React 19
- Tailwind CSS 4
- shadcn/ui
- tRPC React Query
- Wouter (ルーティング)

### バックエンド
- Express 4
- tRPC 11
- Drizzle ORM
- Zod (バリデーション)

### AI/ML
- Manus OpenAI LLM
- Manus Whisper API

### インフラ
- Manus S3 Storage
- MySQL/TiDB
- Manus Hosting

## 📊 データベーススキーマ

### `users` テーブル
```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `transcriptions` テーブル
```sql
CREATE TABLE transcriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  sessionId VARCHAR(255) NOT NULL,
  text TEXT NOT NULL,
  language VARCHAR(10),
  duration INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

### `translations` テーブル
```sql
CREATE TABLE translations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transcriptionId INT NOT NULL,
  targetLanguage VARCHAR(10) NOT NULL,
  translatedText TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transcriptionId) REFERENCES transcriptions(id)
);
```

### `summaries` テーブル
```sql
CREATE TABLE summaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transcriptionId INT NOT NULL,
  summaryType ENUM('short', 'medium', 'detailed') NOT NULL,
  summaryText TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transcriptionId) REFERENCES transcriptions(id)
);
```

## 🔒 セキュリティ

- **CSP（Content Security Policy）**: XSS攻撃を防ぐため、厳格なCSPヘッダーを設定
- **CORS**: 適切なCORS設定により、不正なクロスオリジンリクエストをブロック
- **認証なし**: 現在は誰でも利用可能（将来的にレート制限を追加予定）

## 🌐 SEO対策

- **メタタグ**: キーワード、説明、OGPタグを完備
- **OGP画像**: ソーシャルメディアシェア用の専用画像
- **構造化データ**: JSON-LDによるWebアプリケーションスキーマ（今後追加予定）
- **H2見出し**: アクセシビリティとSEOのためのセマンティックHTML

## 📝 ライセンス

MIT License

## 🤝 貢献

プルリクエストを歓迎します！バグ報告や機能リクエストは、GitHubのIssuesで受け付けています。

## 📧 お問い合わせ

- **GitHub**: https://github.com/tomoto0/manus-ai-transcribe-app
- **本番環境**: https://aitranscribe-lyvmgdbf.manus.space

## 🎯 今後の改善予定

- [ ] レート制限の実装（悪用防止）
- [ ] 音声ファイルアップロード機能
- [ ] エクスポート機能（PDF、Word等）
- [ ] 履歴機能の追加
- [ ] リアルタイム字幕表示
- [ ] 話者識別機能
- [ ] 複数言語での議事録生成
- [ ] 構造化データ（JSON-LD）の追加

---

**Powered by [Manus](https://manus.im)** - AI-powered web development platform
