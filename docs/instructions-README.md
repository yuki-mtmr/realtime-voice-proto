# Instructions ガイド

このドキュメントでは、本プロジェクトの Instruction ファイル群の構成と使い方を説明します。

## ファイル構成

```
realtime-voice-proto/
├── .github/
│   ├── copilot-instructions.md       # Copilot Chat 用（自動読み込み）
│   ├── instructions/
│   │   ├── frontend.instructions.md  # Frontend 開発ガイド
│   │   └── backend.instructions.md   # Backend 開発ガイド
│   └── ISSUE_TEMPLATE/
│       ├── feature_request.md        # 機能追加テンプレート
│       └── bug_report.md             # バグ報告テンプレート
│
├── AGENTS.md                         # Agent mode タスク実行フロー
├── CLAUDE.md                         # Claude Code 用（copilot-instructionsと同期）
│
└── docs/
    ├── copilot-instructions.md       # 詳細アーキテクチャ（参照用）
    └── instructions-README.md        # このファイル
```

## 役割分担

| ファイル | 対象ツール | 内容 |
|---------|-----------|------|
| `.github/copilot-instructions.md` | GitHub Copilot Chat | プロジェクト概要、技術スタック、コーディング規約 |
| `AGENTS.md` | Copilot Agent / Claude Code | タスク実行フロー、ガードレール、変更手順 |
| `.github/instructions/*.md` | 特定作業時 | Frontend/Backend の詳細テンプレート |
| `CLAUDE.md` | Claude Code | `.github/copilot-instructions.md` と同期 |
| `docs/copilot-instructions.md` | 参照用 | 詳細アーキテクチャ（元ファイル） |

## 使い方

### GitHub Copilot Chat

`.github/copilot-instructions.md` が自動的に読み込まれます。
特別な操作は不要です。

### GitHub Copilot Agent mode

1. `AGENTS.md` のガードレールに従ってタスクを実行
2. 必要に応じて `.github/instructions/*.md` を参照

### Claude Code

1. `CLAUDE.md` が自動的に読み込まれます
2. `AGENTS.md` のフローに従ってタスクを実行

### Issue 作成

1. GitHub の「New Issue」をクリック
2. テンプレートを選択
   - 機能追加: `feature_request.md`
   - バグ報告: `bug_report.md`
3. 「Copilot向けコンテキスト」セクションを埋める

## 更新ルール

### 同期が必要なファイル

`CLAUDE.md` と `.github/copilot-instructions.md` は内容を同期してください。

```bash
# 同期確認
diff CLAUDE.md .github/copilot-instructions.md
```

### 更新時のチェックリスト

- [ ] 技術スタック変更 → `copilot-instructions.md` + `CLAUDE.md` を更新
- [ ] コーディング規約変更 → 同上
- [ ] 新しいパターン追加 → `instructions/*.md` を更新
- [ ] ワークフロー変更 → `AGENTS.md` を更新

## グローバル設定との関係

| レベル | 開発手法 | 担当内容 |
|-------|---------|---------|
| グローバル（ユーザーレベル） | SDD | 普遍的なコーディング原則、セキュリティルール |
| **このプロジェクト** | **TDD** | 技術スタック、ディレクトリ構成、テスト駆動開発 |

**このプロジェクトでは TDD を採用しています。グローバルの SDD 設定を上書きします。**
