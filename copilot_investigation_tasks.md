# Open WebUI 誤字問題 調査タスク

## 前提

vLLM (Qwen3.5-9B FP8) + Open WebUI を使っている。curl直叩きでは日本語クリーンだが、Open WebUI経由だと誤字・文字欠けが発生する。原因を調査して特定してほしい。

## 調査タスク（順に実行）

1. vLLMのログを tail して、Open WebUIから「東京の観光地を3つ紹介してください」と送信した時の実リクエスト（messages, temperature, top_p, top_k, presence_penalty, stream 等）を全部抽出する。

2. 抽出したパラメータをそのまま使い、同じ内容をcurlで送信して応答を比較する。

3. Open WebUIで誤字が出たチャットをページリロードして誤字が消えるか確認する。

4. 誤字が残った応答の生テキストをAPI (`/api/v1/chats/<id>`) またはブラウザのDevToolsで取得し、表示との差分を確認する。

5. Admin Panel > Settings で Title Generation, Tags Generation, Autocomplete, Follow-up, Web Search, RAG を全てOFF。モデルから Knowledge / Tools / Functions も外す。新規ユーザーで再検証する。

6. Open WebUI バージョンと関連環境変数（`DEFAULT_MODEL_PARAMS`, `TASK_MODEL` 等）を確認する。

7. 環境変数 `STREAM_DELTA_CHUNK_SIZE=8` を設定して再検証する。

8. 最小HTMLクライアント（fetch + SSE）を作って vLLM に直接ストリーミング接続し、誤字が出るか確認する。

## 真犯人 判定表

| リロードで消える | 生テキスト | 全OFF後 | 別クライアント | 真犯人 |
|---|---|---|---|---|
| Yes | — | — | クリーン | ストリーミング描画 |
| No | クリーン | — | — | Markdownレンダラ |
| No | 誤字あり | クリーン | — | タスクモデル / Memory 注入 |
| No | 誤字あり | 誤字あり | クリーン | Open WebUI 送信段階 |
| No | 誤字あり | 誤字あり | 誤字あり | モデル / 量子化 |

## 成果物

- 各タスクの実行ログ
- 最終レポート（どのタスクで何が判明したか）
- 判定表から特定した真犯人
- 修正手順
