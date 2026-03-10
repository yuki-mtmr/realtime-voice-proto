# realtime-voice-proto

## プロジェクト概要

旅行代理店向けAI音声コンシェルジュのプロトタイプ。ElevenLabs Conversational AIエージェントを使い、PNGTuberアバターがリップシンクしながらリアルタイム音声対話を行う。

現行プロトタイプ（ai-concierge）からの再構築。音声基盤をAzure OpenAI Realtime APIからElevenLabsに変更し、構成をシンプルにする。

## アーキテクチャ

```
ブラウザ (Next.js Pages Router)
  ├── @elevenlabs/react useConversation
  │     → マイク入力 → ElevenLabs (STT → LLM → TTS) → 音声出力
  │     → onModeChange → PNGTuber リップシンク
  │     → onMessage → トランスクリプト表示
  │
  │   ElevenLabs Server Tool呼び出し（Phase 3）:
  │     → FastAPI backend (localhost:8000)
  │         → モックコースデータ返却
  │
  └── PNGTuber: isSpeaking で idle.png / talking.png 切替
```

自前WebRTC実装は不要。ElevenLabs SDKが音声ストリーミングを内部処理する。

## 技術スタック

### Frontend
- Next.js (Pages Router, `src/pages/`) + TypeScript (strict)
- @elevenlabs/react — ElevenLabs React SDK（useConversationフック）
- Jotai — 状態管理（必要になったら導入、まずはpropsで渡す）
- Tailwind CSS — スタイリング（Mantineは使わない）

### Backend
- Python 3.12+ / FastAPI
- uvicorn — 開発サーバー
- pydantic v2 — リクエスト/レスポンススキーマ

## ディレクトリ構成

```
realtime-voice-proto/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── _app.tsx          # アプリ全体ラッパ
│   │   │   └── index.tsx         # メインページ
│   │   ├── components/
│   │   │   ├── AvatarStage.tsx   # PNGTuber表示 + リップシンク
│   │   │   └── ConversationUI.tsx # 開始/停止 + 状態 + トランスクリプト
│   │   ├── hooks/
│   │   │   └── useAvatar.ts      # isSpeaking → 口パク状態管理
│   │   ├── lib/
│   │   │   └── config.ts         # 環境変数読み込み
│   │   └── types/
│   │       └── index.ts          # 共有型定義
│   ├── public/
│   │   └── characters/
│   │       ├── idle.png
│   │       └── talking.png
│   ├── .env.local                # NEXT_PUBLIC_ELEVENLABS_AGENT_ID=xxx
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI + CORSミドルウェア
│   │   ├── config.py             # pydantic-settings
│   │   ├── routers/
│   │   │   ├── tools.py          # ElevenLabsから呼ばれるエンドポイント
│   │   │   └── health.py
│   │   ├── services/
│   │   │   └── course.py         # コース検索ロジック
│   │   └── models/
│   │       ├── course.py         # Course, Spot スキーマ
│   │       └── tool_request.py
│   ├── mock_data/
│   │   └── courses.json          # モックコースデータ 10-15件
│   └── requirements.txt
│
├── .github/
│   └── copilot-instructions.md   # このファイル
└── CLAUDE.md                     # Claude Code用（内容は本ファイルと同期）
```

## コーディング規約

### Frontend (TypeScript/React)
- コンポーネント: PascalCase (.tsx)、アロー関数 + named export
- export default は pages/ 配下のみ（Next.js Pages Router の規約）
- hooks: camelCase、use prefix (.ts)
- 型定義: types/index.ts に集約
- スタイリング: Tailwind CSS ユーティリティクラス

### Backend (Python)
- ファイル名: snake_case
- クラス名: PascalCase
- 関数名: snake_case
- 型ヒント: 全関数に付与
- docstring: 全パブリック関数に付与
- Pydantic v2 スキーマ

## ElevenLabs SDK 使用方法

パッケージ: `@elevenlabs/react`（旧 `@11labs/react` ではない）

```typescript
import { useConversation } from '@elevenlabs/react';

const conversation = useConversation({
  onMessage: (message) => {
    // message.message — テキスト内容
    // message.source — 'user' | 'ai'
  },
  onError: (error) => {
    console.error('ElevenLabs error:', error);
  },
});

// セッション開始
await conversation.startSession({
  agentId: config.elevenLabsAgentId,
});

// セッション終了
await conversation.endSession();

// 利用可能な状態
// conversation.status — 'connected' | 'disconnected' | 'connecting'
// conversation.isSpeaking — boolean
```

## ElevenLabsエージェント設定（設定済み）
- Voice: Mikumo (Japanese Kyusyu Female)
- TTS Model: Multilingual
- LLM: GPT-4o
- Language: Japanese
- Authentication: オフ（Public Agent）

## 実装フェーズ

### Phase 1: プロジェクト初期化
- frontend: create-next-app + @elevenlabs/react + jotai + tailwind
- backend: FastAPI + uvicorn + pydantic

### Phase 2: Frontend — 音声対話 + PNGTuber（最優先）
- useConversation でElevenLabsに接続
- isSpeaking で idle.png / talking.png 切替（CSS transition）
- トランスクリプト表示
- 開始/停止ボタン、接続状態バッジ、ミュートボタン

### Phase 3: Backend — モックコースAPI
- mock_data/courses.json に10-15コース（関東近郊、テーマ別）
- POST /tools/search-courses — エリア・タグ・日数でフィルタ
- POST /tools/get-course-detail — コースID指定で詳細取得

### Phase 4（将来）: 口パク拡張
- getOutputVolume() で音量ベースの口パクに拡張
- 必要ならLipsyncEngine移植を検討

## 起動コマンド

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

## 注意事項

- Phase 2を最優先で完了させ、動作確認してからPhase 3に進む
- PNGTuberアセットがなければ仮画像（丸+口）で代替
- Server Tool連携時はngrok等でlocalhost:8000をトンネルする必要あり
