# 旅AIコンシェルジュ 音声プラットフォーム選定

## 結論

**プロトタイプ段階は ElevenLabs を継続する。本格運用で利用規模が確定した段階で、改めて選定を見直す。**

現時点で他サービスへ移行する決定的な利益は確認できなかった。

---

## 1. 前提

### 1.1 音声を使う場面

- **読み上げ**：アプリ内コンテンツの音声化
- **対話**：ユーザーと会話しながら旅プランを絞り込む（例：おすすめラーメン店の提案）

### 1.2 要件

| # | 要件 |
|---|---|
| 1 | 日本語が自然に話せる |
| 2 | 驚きや感情を込めた表現ができる（サービスの核） |
| 3 | ユーザーの発言からアプリ内機能を呼び出せる |
| 4 | スマホ/Webアプリに組み込める |
| 5 | コストが事業規模に見合う |

### 1.3 現状

ElevenLabs の TTS API と Conversational AI をプロトタイプで利用中。音声は既存ライブラリから選択（カスタムクローンではない）。月間利用時間は未確定。

---

## 2. 音声AIの構築方式

音声会話AIの作り方には主に3つのアプローチがあり、さらに別系統の新しい方式がある。

### 2.1 パイプライン型

`ユーザーの声 → 音声認識 → 言語AI → 音声合成 → AIの声`

3要素を順につなぐ構成。各部分を差し替えやすいが、処理段階が多いため応答に遅延が出やすい。
**代表**：ElevenLabs Conversational AI、Retell AI（電話業務向け）

### 2.2 エンドツーエンド型

`ユーザーの声 → 1つの統合AI → AIの声`

1つのAIが音声を一気通貫で処理。応答は速いが、内部の言語AIは差し替え不可。
**代表**：OpenAI Realtime API、Gemini 3.1 Flash Live、xAI Grok Voice Agent API

### 2.3 自前組立型

音声認識・言語AI・音声合成を自分で選んで組み合わせる。自由度は最大だが実装負担も最大。
**代表**：LiveKit Agents、Pipecat

### 2.4 完全結合型（Full-duplex）という別アプローチ

ユーザーとAIが **同時に話せる** 新しい方式。相槌やかぶせを含む、人間同士のような自然な対話を目指す。
**代表モデル**：Kyutai Moshi（2024年）、LLM-jp-Moshi v1（日本語特化、NII公開、2026年2月）

旅コンシェルジュでは採用しない。理由は、機能呼び出し不可、指示追従能力が低い、セルフホスト必須（GPU運用が必要）。

### 2.5 検討から除外したカテゴリ

| カテゴリ | サービス例 | 除外理由 |
|---|---|---|
| 電話業務向けパイプライン型 | Retell AI、Vapi、Synthflow | コールセンター用途に最適化されており、アプリ組込には過剰 |
| 完全結合型（Full-duplex） | Moshi 系 | 機能呼び出し不可、セルフホスト必須 |

---

## 3. 比較対象の4サービス

### A. ElevenLabs Conversational AI（現状使用中、パイプライン型）
- Conversational AI: 2024年リリース / v3モデル: 2025年
- 日本語の自然さと感情表現の豊富さが強み

### B. Google Gemini 3.1 Flash Live（エンドツーエンド型）
- 2026年3月リリース（プレビュー版）
- 従量課金 $0.023/分、大規模運用ほど割安

### C. xAI Grok Voice Agent API（エンドツーエンド型）
- 2025年12月リリース
- $0.05/分、英語ベンチマーク1位、応答速度1秒未満

### D. OpenAI Realtime API（エンドツーエンド型）
- ベータ: 2024年10月 / GA: 2025年8月 / 最新版: 2026年2月
- 機能連携が成熟、コストはElevenLabsとほぼ同水準

---

## 4. コスト比較

### 4.1 料金構造

**ElevenLabs**（月額プラン、Starter以上で商用可。Enterprise は大企業のコンプライアンス要件向けで通常不要）

| プラン | 月額 | 会話枠 |
|---|---|---|
| Starter | $5 | 約45分 |
| Creator | $22 | 約150分 |
| Pro | $99 | 約750分 |
| Scale | $330 | 約3,000分 |
| Business | $1,320 | 約20,000分 |

**従量課金組**
- Gemini Live: 約 $0.023/分
- xAI Grok: $0.05/分
- OpenAI Realtime: 約 $0.08-0.10/分

### 4.2 月間利用時間別の比較

| 月間利用 | ElevenLabs | Gemini Live | xAI Grok | OpenAI |
|---|---|---|---|---|
| 100分 | $22 | $2 | $5 | $10 |
| 1,000分 | $99 | $23 | $50 | $100 |
| 3,000分 | $330 | $69 | $150 | $300 |
| 10,000分 | $1,320 | $230 | $500 | $1,000 |

**小〜中規模（1,000分以下）では絶対額の差は小さく、意思決定の主要因にならない。大規模化するほど従量課金組が有利**。

---

## 5. 機能・品質の比較

| 評価項目 | ElevenLabs | Gemini Live | xAI Grok | OpenAI |
|---|---|---|---|---|
| 日本語の自然さ | ◎ | ◯ | △（未検証） | ◯ |
| 感情豊かな表現 | ◎（音声タグで細かく制御） | △ | ◯（音声タグ対応） | △ |
| 機能連携 | ◎ | ◯（関数実行中に発話停止） | ◯ | ◎ |
| レイテンシ | 実用範囲 | 実用範囲 | ◎（1秒未満） | 実用範囲 |
| 音声選択の自由度 | ◎（数千の音声） | △ | △（5種） | △ |
| 導入の手軽さ | ◎（稼働中） | △ | △ | △ |
| 成熟度 | ◎ | △（プレビュー） | △（約4ヶ月） | ◎ |

### 5.1 ポイント

- **ElevenLabs の強み**：v3モデルの音声タグ（`[excited]`、`[whispers]`等）で演出の幅が広く、「サプライズ」要件に最適
- **xAI の懸念**：応答速度と英語性能は魅力だが、日本語品質が未検証
- **Gemini Live の制約**：プレビュー版、15分セッション制限、関数実行中に発話停止

---

## 6. 判断のロジック

### 6.1 現段階での判断

ElevenLabs を継続する理由：

- プロトタイプ規模ではどのサービスでもコスト差は小さい
- 既に稼働中のサービスを移行する利益が出ない
- 音声タグによる表現力で他社より優位
- Gemini Live はプレビュー版、xAI は日本語未検証

### 6.2 再検討のトリガー

| 条件 | 検討する代替案 |
|---|---|
| 月間利用時間が 3,000分 超 | Gemini Live または xAI Grok |
| 月間利用時間が 10,000分 超 | Gemini Live（強く推奨） |
| 応答速度が差別化要素になる | xAI Grok（日本語検証が前提） |
| 専用の声を作りたい | ElevenLabs Professional Voice Cloning |
| Full-duplex が機能呼び出しに対応 | 再比較（自然な会話体験が実現可能に） |
| Gemini Live / xAI が正式版になる | 再比較 |

---

## 7. 実行計画

### 現在（プロトタイプ段階）

- 想定利用量に応じて ElevenLabs の Starter / Creator / Pro から選定
- 音声タグの活用ルールを策定
- 月次で利用時間と費用をトラッキング

### スケール検討段階（3,000分/月 超）

- Gemini Live と xAI Grok を実地で再検証
- 総所有コストで比較
- 音声ブランド戦略を再定義

---

## 8. 用語

| 用語 | 意味 |
|---|---|
| パイプライン型 | 音声認識・言語AI・音声合成を順につなぐ構成 |
| エンドツーエンド型 | 1つのAIが音声入出力を一気通貫で処理 |
| 完全結合型（Full-duplex） | ユーザーとAIが同時に話せる方式。相槌やかぶせを含む |
| 音声タグ | 演技指示タグ。例：`[excited]`、`[whispers]` |
| 従量課金 | 使った分だけ課金される料金体系 |
| 機能呼び出し | AIが会話中にアプリの機能を実行する仕組み |

---

## 9. 参考情報

### ElevenLabs
- [料金ページ](https://elevenlabs.io/pricing)
- [API料金](https://elevenlabs.io/pricing/api)

### Google Gemini 3.1 Flash Live
- [Gemini API 料金ページ](https://ai.google.dev/gemini-api/docs/pricing)
- [モデルカード（DeepMind）](https://deepmind.google/models/model-cards/gemini-3-1-flash-audio/)

### xAI Grok Voice Agent API
- [Voice Agent API 発表記事](https://x.ai/news/grok-voice-agent-api)
- [モデル・料金ドキュメント](https://docs.x.ai/developers/models)

### OpenAI Realtime API
- [Realtime API 発表（2024年10月）](https://openai.com/index/introducing-the-realtime-api/)
- [GA 発表（2025年8月）](https://developers.openai.com/blog/realtime-api)
- [ドキュメント](https://platform.openai.com/docs/guides/realtime)

### Full-duplex（Moshi系）
- [LLM-jp-Moshi 公式サイト](https://llm-jp.github.io/llm-jp-moshi/)
- [NII プレスリリース（2026年2月25日）](https://www.nii.ac.jp/news/release/2026/0225.html)

---

*2026年4月時点の調査に基づく。音声AI市場は変化が速いため、3ヶ月毎の見直しを推奨する。*
