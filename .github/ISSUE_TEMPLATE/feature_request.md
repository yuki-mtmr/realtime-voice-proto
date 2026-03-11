---
name: 機能追加
about: 新機能の提案・リクエスト
title: '機能追加: '
labels: enhancement
assignees: ''
---

## 概要

<!-- 追加したい機能を簡潔に説明 -->

## 背景・目的

<!-- なぜこの機能が必要か、どのような問題を解決するか -->

## 受け入れ条件

<!-- この機能が完了したと言える条件をリストアップ -->

- [ ] 条件1
- [ ] 条件2
- [ ] 条件3

## 影響範囲（推定）

<!-- 変更が必要になりそうなファイル/ディレクトリ -->

| 対象 | 変更内容 |
|-----|---------|
| `frontend/src/components/` | 新コンポーネント追加 |
| `backend/app/routers/` | 新エンドポイント追加 |

## デザイン/モックアップ

<!-- UIに関する機能の場合、スクリーンショットやFigmaリンクを添付 -->

---

## Copilot向けコンテキスト

<!-- 以下はCopilot/Claude Codeがタスクを理解するための補足情報 -->

### 関連ファイル

```
# この機能に関連する既存ファイル（参考にすべきコード）
frontend/src/components/ConversationUI.tsx
backend/app/routers/tools.py
```

### 技術的な制約

<!-- 守るべき技術的制約やパターン -->

- Pages Router使用（App Router禁止）
- Tailwind CSS のみ（Mantine禁止）
- `@elevenlabs/react` 使用

### 参考資料

<!-- 外部ドキュメントや関連Issue -->

- [ElevenLabs SDK Docs](https://elevenlabs.io/docs)
