---
applyTo: '**/*.{ts,tsx,js,jsx,css}'
---

# Figma駆動実装ルール

## 基本原則

- FigmaがSingle Source of Truth（唯一の正）である
- docsに記載されたデザイン仕様は参照しない。実装に必要な情報はFigma MCPから直接取得する
- docsとFigmaが矛盾する場合は、常にFigmaを優先する

## Figma MCPの使い方

- Figma MCPサーバーは内部でREST APIを呼び出すため、明示的にFigma APIを叩く必要はない
- Copilotに渡すURLはすべて**devモード（/dev/）**のURLとする
- designモード（/design/）のURLは使用しない

### 主要ツール

- `get_design_context`: フレームの構造・スタイル・バリアブルをコードとして取得する
- `get_variables_and_styles`: バリアブル・スタイル一覧を取得する
- `get_code_connect_map`: Figmaコンポーネントと既存コードのマッピングを取得する
- `download_assets`: 画像・アイコンをエクスポートする

## 実装フロー

### Step 1: デザイントークン取得（最初に1回のみ）

- `get_variables_and_styles` でFigmaのバリアブル（カラー、タイポグラフィ、スペーシング）を取得する
- 取得結果を `tailwind.config.ts` にマッピングする
- マッピング結果はdocsのデザイントークンセクションに記録する

### Step 2: 画面の構造把握（画面着手時に1回）

- 実装対象の画面全体のフレームを選択した状態のURL（devモード）で `get_design_context` を実行する
- この画面がどのセクション（中間フレーム）で構成されているかを把握する
- 各セクションのノードIDを確認する
- **この段階では実装しない。構造の把握のみ行う**

### Step 3: セクション単位で実装（1つずつ）

- セクション（header / hero / card-list / footer 等）の中間フレームを選択した状態のURL（devモード）で `get_design_context` を実行する
- Step 1で定義済みのデザイントークン（tailwind.config.ts）を使って実装する
- 既存の共通コンポーネントがあれば再利用する
- 画像やアイコンがあれば `download_assets` で取得する
- 1セクション実装が完了したら、次のセクションに進む

## 絶対にやらないこと

- 複数ページのフレームを一度に処理すること
- 1回のプロンプトに複数セクションのURLを渡すこと
- Figmaのデータなしで「たぶんこう」で実装すること
- docsに書かれた古いデザイン仕様に基づいて実装すること
- ハードコードされた色・フォントサイズ・余白値を使うこと（必ずデザイントークンを使う）
