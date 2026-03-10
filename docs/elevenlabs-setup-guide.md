# ElevenLabs エージェント セットアップ手順

## Step 1: ElevenAgents に切り替え

画面左上の **「ElevenCreative」** ドロップダウンをクリックし、**「ElevenAgents」** を選択する。
画面がAgents用のダッシュボードに切り替わる。

---

## Step 2: 新規エージェント作成

1. ダッシュボードに **「+ Create」** ボタンがあるのでクリック
2. テンプレート選択画面が出る → **「Blank」** を選択
3. エージェント名を入力: `旅のコンシェルジュ`（任意の名前でOK）

---

## Step 3: Agent タブ — 基本設定

エージェントの編集画面が開いたら、**Agent** タブで以下を設定する。

### First Message（最初の発話）

エージェントが会話開始時に最初に話す一文。例:

```
こんにちは！旅のコンシェルジュです。旅行のご相談はいかがでしょうか？行きたいエリアやテーマがあれば教えてください。
```

### System Prompt（システムプロンプト）

エージェントの人格・役割・振る舞いを定義する。以下をベースにカスタマイズ:

```
あなたは旅行コンシェルジュ「旅のコンシェルジュ」です。

## 役割
- お客様の旅行プランの相談に丁寧に応対する
- 希望のエリア、テーマ（温泉、グルメ、寺社仏閣など）、日数、予算をヒアリングする
- 条件に合う旅行コースを提案する

## 口調
- 丁寧語で話す（です・ます調）
- 親しみやすく、押しつけがましくない
- 旅行の楽しさが伝わるように話す

## 制約
- 日本国内の旅行に限定する
- 不確かな情報は「確認いたしますね」と伝える
- 1回の応答は簡潔にまとめる（長すぎない）
```

### LLM（言語モデル）

ドロップダウンからLLMを選択する。おすすめ:
- **GPT-4o** — 日本語が安定、レイテンシも良好
- **Claude (Sonnet)** — 日本語品質が高い

※ ElevenLabsホスト型のモデルは英語最適化なので、日本語なら上記を推奨

---

## Step 4: Voice タブ — 音声設定

### Language（言語）

- **Japanese** を選択
- 「Detect language automatically」はオフでOK（日本語固定の方が安定）

### Voice（声）

Voice Library から声を選ぶ。手順:
1. **「Voice Library」** をクリック
2. フィルタで **Language: Japanese** を設定
3. プレビューを聴いて気に入った声を選択
4. **「Use voice」** で適用

※ 後から変更可能なので、まずは仮の声で進めてOK

---

## Step 5: 認証設定（Authentication）

開発段階ではオフのままにする。

- **Require authentication** → **オフ（デフォルト）**

これで `agentId` だけでフロントから直接接続できる（Public Agent）。
本番デプロイ時にオンに切り替える。

---

## Step 6: Agent ID を取得

エージェントの設定画面で **Agent ID** が表示されている。
形式: `xxxxxxxxxxxxxxxxxxxxxxxx`（英数字の文字列）

これをコピーして控えておく。フロントエンドの `.env.local` に設定する値になる:

```
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Step 7: テスト会話

設定画面の右側または **「Test AI agent」** ボタンから、ブラウザ上でエージェントと会話テストができる。

確認ポイント:
- マイクで話しかけて認識されるか
- 日本語で応答が返ってくるか
- 声の質・速度が適切か
- System Promptに従った応答をしているか

問題があればSystem PromptやVoice設定を調整する。

---

## Step 8: Knowledge Base（任意・後で可）

**Knowledge Base** タブで、エージェントに追加知識を与えられる。

- ドキュメント（PDF、テキスト）をアップロード
- URLを指定してWebページの内容を取り込み
- RAG（検索拡張生成）を有効にすると、大量のドキュメントからも回答可能

今回はモックAPIから情報を取るので、最初はスキップしてOK。

---

## Step 9: Tools 登録（後のフェーズ）

**音声対話 + PNGTuberが動いた後** に設定する。

1. **Tools** セクション → **「Add Tool」**
2. **Tool Type**: 「Webhook」を選択

### Tool 1: search_courses

| 項目 | 値 |
|------|------|
| Name | `search_courses` |
| Description | `エリア・テーマ・日数に基づいて旅行コースを検索する。お客様が旅行先やテーマについて質問したり、おすすめを聞いた場合に使用する` |
| Method | POST |
| URL | `https://<ngrok-url>/tools/search-courses` |

Body Parameters:
- `area` (string, optional): 検索するエリア名（例: 神奈川、東京）
- `tags` (array of string, optional): テーマタグ（例: ["温泉", "グルメ"]）
- `duration_hours` (integer, optional): 希望の所要時間

### Tool 2: get_course_detail

| 項目 | 値 |
|------|------|
| Name | `get_course_detail` |
| Description | `特定のコースの詳細情報を取得する。コース一覧から特定のコースについて詳しく知りたい場合に使用する` |
| Method | POST |
| URL | `https://<ngrok-url>/tools/get-course-detail` |

Body Parameters:
- `course_id` (string, required): コースID（例: C001）

### ngrok のセットアップ

ElevenLabsのサーバーからローカルのFastAPIに到達できないため、ngrokでトンネルが必要:

```bash
# ngrokインストール（未導入の場合）
brew install ngrok    # Mac
# または https://ngrok.com/download からダウンロード

# トンネル開始
ngrok http 8000

# 表示されたURL（例: https://xxxx.ngrok-free.app）を
# ElevenLabsのTool URLに設定する
```

---

## まとめ: 今すぐやること

| # | やること | 所要時間 |
|---|---------|---------|
| 1 | ElevenAgents に切り替え | 10秒 |
| 2 | Blank テンプレートでエージェント作成 | 1分 |
| 3 | First Message + System Prompt 設定 | 5分 |
| 4 | LLM選択（GPT-4o推奨） | 30秒 |
| 5 | 日本語の声を選択 | 3分 |
| 6 | 認証オフのまま | — |
| 7 | Agent ID をコピー | 10秒 |
| 8 | テスト会話で動作確認 | 5分 |

**計15分程度**で完了。Agent IDが取得できたらClaude Codeでの実装に入れる。
