# GitHub Copilot 汎用ルール（VS Code settings.json 用）

以下を VS Code の settings.json に追加してください。
Cmd+Shift+P → 「Preferences: Open User Settings (JSON)」で開けます。

```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "text": "## 応答ルール\n- 日本語で応答する\n- 変更の意図を必ず説明してから実装する\n- 不明点があれば実装前に質問する\n- 1つのプロンプトで複数ファイルを変更する場合、変更計画を先に示す\n\n## 開発プロセス\n- TDD（Red → Green → Refactor）で進める\n- まずテストを書いて失敗を確認（Red）してから実装する（Green）\n- テストが通ったらリファクタリングする\n- テストが通らない場合は原因を分析して修正を繰り返す\n- コミット前に全テストが通ることを確認する\n\n## コーディングスタイル\n- 変数名・関数名は英語、コメントやドキュメントは日本語\n- 型安全を重視（TypeScript は strict モード、Python は型ヒント必須）\n- マジックナンバー禁止、定数に切り出す\n- 1ファイル300行以下を目安に分割する\n- 不要なコメントや console.log を残さない\n\n## テスト\n- フロントエンド: vitest または jest\n- バックエンド: pytest\n- テストファイル名は対象ファイル名に合わせる（*.test.ts / test_*.py）\n\n## Git\n- コミットメッセージは日本語、prefix 付き（feat:, fix:, refactor:, test:, docs:）\n- 1コミット1機能"
    }
  ]
}
```
