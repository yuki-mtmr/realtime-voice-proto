---
applyTo: '**'
---

# プロジェクト: 旅のコンシェルジュ（AI音声コンシェルジュ）

## スタック

- フロントエンド: Next.js (Pages Router) / TypeScript / Tailwind CSS
- 状態管理: Jotai
- 音声AI: ElevenLabs Conversational AI SDK
- バックエンド: FastAPI / Python
- テスト: Vitest + Testing Library（フロント） / pytest（バックエンド）

## TDD開発フロー

すべての新規コードはRed→Green→Refactorサイクルで開発すること。

### 手順

1. **Red**: 実装前に失敗するテストを書く。テストケースをチャットに提示し、方針を確認する
2. **Green**: テストを通す最小限の実装を行う。過剰な設計や先回りの抽象化はしない
3. **Refactor**: テストが通った状態を維持しつつ、コード構造を改善する

### バックエンド（Python）テスト方針

すべてのユニットにテストを書くこと。

- router: TestClientを使ったエンドポイントテスト
- service: ビジネスロジックの単体テスト。外部依存（clients/）はモックに差し替える
- client: 外部API連携のインテグレーションテスト（必要に応じてモック）
- schema: バリデーションの境界値テスト
- テスト名は日本語で「〜の場合、〜となること」の形式で書く

### フロントエンド（TypeScript）テスト方針

対象を絞り、効果の高い箇所にテストを集中させること。

- **必須**: カスタムフック、ユーティリティ関数、Jotai atom派生ロジック
- **推奨**: ユーザー操作を伴うコンポーネント（フォーム、モーダル、インタラクティブUI）
- **不要**: 表示のみのコンポーネント、レイアウト、ページの組み立て
- テストはユーザー操作ベース（getByRole, userEvent）で書き、実装の詳細を参照しない
- テスト名は日本語で「〜の場合、〜となること」の形式で書く

### 共通ルール

- Arrange / Act / Assert の構造を明確にする
- 1テスト1アサーションを原則とする（関連する検証は同一テスト内でもOK）
- モックは最小限にし、実際の振る舞いに近いテストを優先する

## バックエンド設計（FastAPI）

### ディレクトリ構成

```
app/
  main.py             # FastAPIアプリ初期化、ルーター登録
  routers/            # エンドポイント定義のみ。ロジックは書かない
    concierge.py
    health.py
  schemas/            # Pydantic BaseModel（リクエスト/レスポンス型定義）
    concierge.py
  services/           # ビジネスロジック。routerから呼ばれる
    concierge.py
  clients/            # 外部API連携。servicesから呼ばれる
    elevenlabs.py     # ElevenLabs SDK ラッパー
  core/
    config.py         # pydantic-settingsで環境変数管理
    dependencies.py   # FastAPI Depends 定義
tests/
  routers/
  services/
  clients/
  schemas/
```

### レイヤー間の責務と呼び出しルール

- **router**: HTTPリクエストの受付とレスポンス整形のみ。serviceを呼ぶだけにする
- **service**: ビジネスロジックの実装。必要に応じてclientsを呼ぶ。FastAPIのDependsで注入する
- **client**: 外部サービスとの通信のみ。ビジネス判断はしない
- **schema**: Pydantic BaseModelでリクエスト/レスポンスの型とバリデーションを定義する

router → service → client の一方向の依存にすること。逆方向の参照は禁止。

### APIバージョニング

エンドポイントは `/api/v1/` プレフィックスで統一する。

## フロントエンド設計

### ディレクトリ構成

```
src/
  components/     # UIコンポーネント（機能単位でサブディレクトリ）
  hooks/          # カスタムフック
  stores/         # Jotai atom定義（ドメインごとにファイル分割）
  lib/
    api/          # APIクライアント
    elevenlabs/   # ElevenLabs SDK ラッパー
  types/          # 共有型定義
  pages/          # Next.js Pages Router
```

### 状態管理

- グローバル状態はJotaiのatomで管理する。useStateはコンポーネントローカルのみ
- atom定義は `src/stores/` に集約し、ドメインごとにファイルを分ける
- 派生状態は派生atom（derived atom）で表現する

### コンポーネント

- スタイリングはTailwindのユーティリティクラスのみ
- ページコンポーネント（`pages/`）にはロジックを書かない

### ElevenLabs連携

- SDK ラッパーは `src/lib/elevenlabs/` に隔離する
- 音声セッションの状態管理は専用のatomで行い、UIから直接SDKを呼ばない
- SDK依存のロジックはテスト時にモック可能な構造にする
