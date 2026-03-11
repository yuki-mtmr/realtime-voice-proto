# GitHub Copilot Instructions — realtime-voice-proto

## プロジェクト概要

旅行代理店向けAI音声コンシェルジュのプロトタイプ。
ElevenLabs Conversational AIエージェントを使い、PNGTuberアバターがリップシンクしながらリアルタイム音声対話を行う。

## 技術スタック

### Frontend
- Next.js (Pages Router, `src/pages/`) + TypeScript (strict)
- @elevenlabs/react — ElevenLabs React SDK（useConversationフック）
- Jotai — 状態管理
- Tailwind CSS — スタイリング

### Backend
- Python 3.12+ / FastAPI
- uvicorn — 開発サーバー
- pydantic v2 — リクエスト/レスポンススキーマ

## ディレクトリ構成

```
realtime-voice-proto/
├── frontend/
│   ├── src/
│   │   ├── pages/           # Next.js Pages Router
│   │   ├── components/      # Reactコンポーネント
│   │   ├── hooks/           # カスタムフック
│   │   ├── lib/             # ユーティリティ
│   │   └── types/           # 型定義
│   └── public/characters/   # PNGTuberアセット
│
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPIエントリポイント
│   │   ├── routers/         # APIルーター
│   │   ├── services/        # ビジネスロジック
│   │   └── models/          # Pydanticスキーマ
│   └── mock_data/           # モックデータ
│
└── docs/                    # ドキュメント
```

## コーディング規約

### Frontend (TypeScript/React)

| 項目 | 規約 |
|-----|------|
| コンポーネント | PascalCase、アロー関数、named export |
| hooks | camelCase、`use` prefix |
| 型定義 | `types/index.ts` に集約 |
| スタイル | Tailwind CSS ユーティリティクラス |
| export default | `pages/` 配下のみ |

```typescript
// 正しい例
export const MyComponent: React.FC<Props> = ({ prop }) => {
  return <div className="flex items-center">{prop}</div>;
};

// 間違い
export default function MyComponent() { ... }  // pages以外では使わない
```

### Backend (Python)

| 項目 | 規約 |
|-----|------|
| ファイル名 | snake_case |
| クラス名 | PascalCase |
| 関数名 | snake_case |
| 型ヒント | 全関数に必須 |
| docstring | 全パブリック関数に必須 |

```python
# 正しい例
def search_courses(query: CourseQuery) -> list[Course]:
    """コースを検索する。"""
    ...
```

## テストファイル命名規則

| 種類 | パターン | 例 |
|------|---------|-----|
| Frontend Unit | `*.test.tsx` / `*.test.ts` | `MyComponent.test.tsx` |
| Frontend E2E | `*.spec.ts` | `conversation.spec.ts` |
| Backend Unit | `test_*.py` | `test_course.py` |

## ElevenLabs SDK 使用方法

パッケージ: `@elevenlabs/react`（旧 `@11labs/react` ではない）

```typescript
import { useConversation } from '@elevenlabs/react';

const conversation = useConversation({
  onMessage: (message) => {
    // message.message — テキスト内容
    // message.source — 'user' | 'ai'
  },
  onError: (error) => console.error('ElevenLabs error:', error),
});

// セッション開始
await conversation.startSession({ agentId: config.elevenLabsAgentId });

// セッション終了
await conversation.endSession();

// 利用可能な状態
// conversation.status — 'connected' | 'disconnected' | 'connecting'
// conversation.isSpeaking — boolean
```

## 環境変数

### Frontend (`.env.local`)
```
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=xxx
```

### Backend
```
BACKEND_PORT=8000
```

## 起動コマンド

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

## 開発手法: TDD（テスト駆動開発）

このプロジェクトでは TDD を採用。

### 必須ワークフロー

```
1. RED    — 先にテストを書く（失敗することを確認）
2. GREEN  — テストを通す最小限のコードを書く
3. REFACTOR — コードを改善（テストは緑のまま）
```

### カバレッジ目標

- 80%以上を維持

### テストファイル配置

| 種類 | 配置 |
|------|------|
| Frontend Unit | `src/**/__tests__/*.test.ts(x)` |
| Backend Unit | `tests/test_*.py` |

## 禁止事項

1. **テストなしの実装** — TDD必須
2. **実装後にテストを書く** — 先にテストを書くこと
3. **`any` 型の使用** — 必ず具体的な型を定義
4. **`@11labs/react`** — 古いパッケージ名。`@elevenlabs/react` を使う
5. **Mantine** — 使用禁止。Tailwind CSS のみ
6. **App Router** — 使用禁止。Pages Router を使う
7. **export default** — `pages/` 以外では禁止

## 関連ドキュメント

- `docs/copilot-instructions.md` — 詳細アーキテクチャ（参照用）
- `docs/elevenlabs-setup-guide.md` — ElevenLabs設定ガイド
- `AGENTS.md` — Agent mode タスク実行フロー
