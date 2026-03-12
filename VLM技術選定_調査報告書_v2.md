# ローカルVLM技術選定 — 調査報告書

作成日: 2026/03/12　対象: AI/内製App開発基盤（社内ローカルVLM）

---

## 結論

| 項目 | 選定結果 |
| --- | --- |
| モデル | Qwen2.5-VL-7B（第一候補）、InternVL3-8B（比較候補） |
| 推論エンジン | vLLM（OpenAI互換API） |
| GPU | A10G (g5.xlarge) または L4 (g6.xlarge)。A100は不要 |
| 量子化 | まずBF16 → 必要に応じてFP8 |
| 月額コスト | 約¥28,000〜¥35,000（8h/平日運用） |
| 1日1000件処理 | 業務時間内に十分収まる見込み |

**次のアクション:**
1. 担当者にGPU環境の調達を相談（スポット利用で検証コスト数百〜数千円）
2. 承認後、Qwen2.5-VL-7BとInternVL3-8Bの比較PoCを実施
3. PoCで精度・速度・VRAM使用量を実測し、本番構成を確定

---

## 1. 背景・要件

外部に出せない個人情報のマスキングや有料APIでの大量処理にはコストがかさむため、社内ローカルVLMを整備する。

| 項目 | 内容 |
| --- | --- |
| ユースケース | ①書類の個人情報マスキング ②画像キャプション・タグ付け ③観光スポットデータのタグ付け |
| 処理量 | 1日1000件程度 |
| 同時利用 | 5人以下 |
| 速度感 | チャットとして遅く感じない程度 |

---

## 2. モデル選定

### なぜQwen2.5-VL-7Bか

DocVQA/OCRBenchが7Bクラス最高、Apache 2.0で商用利用明確、vLLM公式推奨でドキュメント充実。InternVL3-8B（MIT License）は推論力（MMMU 64.1% vs Qwen 58.6%）で勝るため、PoCで並行比較する。

### 比較表

| モデル | パラメータ | ライセンス | VRAM (BF16) | DocVQA | OCRBench | MMMU |
| --- | --- | --- | --- | --- | --- | --- |
| Qwen2.5-VL-7B | 7B | Apache 2.0 | ~16GB | 95.7% | 864 | 58.6% |
| Qwen2.5-VL-72B | 72B | Qwen License | ~144GB | 96.4% | 888 | 70.2% |
| InternVL3-8B | 8B | MIT | ~18GB | 94.5% | — | 64.1% |
| InternVL3-78B | 78B | MIT | ~160GB | 95.4% | — | 72.2% |

### ベンチマーク指標の意味

| 指標 | 測定内容 | ユースケースとの関連 |
| --- | --- | --- |
| DocVQA | 文書画像に対するQA正答率（請求書・契約書等） | UC①個人情報マスキングに直結。最重要 |
| OCRBench | OCR総合力（1000点満点）。多言語・手書き含む | UC①②③すべての基礎能力 |
| ChartQA | グラフ・図表の読み取りQA正答率 | UC③で図表データを扱う場合 |
| MMMU | 大学レベル多分野の画像付き推論問題 | 直接対応UCなし。汎用的な賢さの指標 |

> ※ 72B/78Bモデルは精度が高いがA100必須（月額≒¥98万）。7〜8Bで精度要件を満たせるかをPoCで確認する方針。

---

## 3. 推論エンジン・API

**vLLMで確定。** Qwen公式推奨、ドキュメント充実、OpenAI互換APIで既存スタック（Next.js/FastAPI）と接続容易。

| エンジン | Qwen2.5-VL | InternVL3 | 備考 |
| --- | --- | --- | --- |
| vLLM | ○（公式推奨） | ○ | 最も成熟。情報量が圧倒的 |
| SGLang | ○ | ○ | スループットがボトルネック時の次の選択肢 |
| llama.cpp | △ | △ | VLMサポート不完全。見送り |

**MoEについて:** VLMで実用的なMoEモデルが現時点で存在しないため見送り。

---

## 4. GPU・コスト

### インスタンス比較

| インスタンス | GPU | VRAM | $/時 | 月額(8h/平日) | 用途 |
| --- | --- | --- | --- | --- | --- |
| g6.xlarge | L4×1 | 24GB | $1.12 | ≒¥28,000 | PoC・軽量運用 |
| g5.xlarge | A10G×1 | 24GB | $1.41 | ≒¥35,000 | 日常運用 |
| p4d.24xlarge | A100×8 | 320GB | $40.00 | ≒¥984,000 | 72Bモデル用。今回は対象外 |

> ※ スポット利用で50〜70%削減可能。PoC検証なら数百〜数千円で済む。

### VRAM内訳（24GB GPU × Qwen2.5-VL-7B BF16）

| 内訳 | 消費量 |
| --- | --- |
| モデルウェイト (7B × 2bytes) | 約14GB |
| ViTエンコーダ | 約1.2GB |
| vLLMオーバーヘッド | 約1〜2GB |
| KVキャッシュ（画像1枚） | 約0.5GB |
| 合計 | 約18〜21GB |

24GBに対し3〜6GBの余裕。画像1枚の単発リクエストは問題ないが、複数同時処理ではVRAM不足のリスクあり。

**対策:** `--max_model_len=8096` + `--limit-mm-per-prompt image=1` で制限。不足時はFP8量子化（VRAM約25%減、精度低下最小限）に切り替え。

### 量子化の選択指針

| 方式 | VRAM削減 | 精度影響 | 推奨場面 |
| --- | --- | --- | --- |
| BF16 | なし | 最高精度 | まずここで精度ベースラインを取る |
| FP8 | 約25%減 | 最小限 | BF16でVRAM不足時の第一選択 |
| INT4 | 約75%減 | OCR精度低下リスク | コスト最小化時。精度検証必須 |

> ※ BF16 = パラメータ1個を16ビットで表現する形式。モデル本来の精度をそのまま保つ標準的な推論方式。

---

## 5. token/s・スループット

### 用語

| 用語 | 意味 |
| --- | --- |
| token/s（出力） | 1秒あたりの生成トークン数。チャットの体感速度に影響（日本語で約25〜50文字/秒相当） |
| TTFT | 最初のトークンが返るまでの時間。応答の「待たされ感」 |
| スループット | 並列含むシステム全体のtoken/s。「1日1000件さばけるか」の指標 |

### 参考値（条件付き）

| 構成 | 数値 | 出典 |
| --- | --- | --- |
| Qwen2.5-VL-7B + vLLM (A100), 並列50 | 約20.89 req/s（画像） | [vLLM GitHub #24728](https://github.com/vllm-project/vllm/issues/24728) |
| Qwen2-VL-7B + vLLM, 1000件バッチ | 2.55 req/s, 出力327 tok/s | [vLLM Benchmark CLI](https://docs.vllm.ai/en/latest/benchmarking/cli/) |
| Qwen2.5-7B テキスト (T4) | 3.8 tok/s | [Medium記事](https://medium.com/@wltsankalpa/benchmarking-qwen-models-across-nvidia-gpus-t4-l4-h100-architectures-finding-your-sweet-spot-a59a0adf9043) |
| Qwen2.5-7B テキスト (L4) | 53.1 tok/s | 同上 |

> ※ VLMのtoken/sは画像解像度・枚数で大きく変動するため公式の一律値は存在しない。PoCでの実測が不可欠。
> ※ T4ではリアルタイム利用が厳しい。A10G/L4以上を推奨。

### 要件への見込み

- **チャット体感:** A10G/L4で画像1枚の問い合わせ → 数秒〜10秒で応答。要件達成可能と推定
- **日次バッチ:** 1件5秒想定で1000件≒約1.4時間。業務時間内に十分収まる

---

## 6. PoC計画

### 起動手順

```bash
# vLLMインストール
pip install vllm

# Qwen2.5-VL-7Bで起動（→ モデル名を変えるだけでInternVL3-8Bも試せる）
vllm serve Qwen/Qwen2.5-VL-7B-Instruct \
  --max_model_len 8096 \
  --limit-mm-per-prompt image=1 \
  --gpu-memory-utilization 0.95
```

OpenAI互換APIサーバーが立ち上がり、curl/Python/チャットUIから画像付きリクエストを送信可能。

### 計測項目

| 項目 | 目的 |
| --- | --- |
| TTFT | 体感速度の確認 |
| 出力token/s | 1リクエストの応答速度 |
| タスク精度 | マスキング漏れ率、タグ正答率 |
| 1000件バッチ所要時間 | 日次処理の実現性確認 |

---

## 参考ソース

**モデル情報**
- [Qwen2.5-VL 公式](https://qwen.readthedocs.io/en/latest/) / [InternVL3 公式](https://internvl.github.io/blog/2025-04-11-InternVL-3.0/) / [InternVL3 論文](https://arxiv.org/pdf/2504.10479) / [OCRBench v2 論文](https://arxiv.org/html/2501.00321v2)

**推論エンジン**
- [vLLM Qwen2.5-VL レシピ](https://docs.vllm.ai/projects/recipes/en/latest/Qwen/Qwen2.5-VL.html) / [Qwen公式 vLLMガイド](https://qwen.readthedocs.io/en/latest/deployment/vllm.html) / [SGLang vs vLLM比較](https://github.com/vllm-project/vllm/issues/36215)

**速度ベンチマーク**
- [vLLM Benchmark CLI](https://docs.vllm.ai/en/latest/benchmarking/cli/) / [vLLM #24728 VLMベンチ](https://github.com/vllm-project/vllm/issues/24728) / [Clarifai VLM比較](https://www.clarifai.com/blog/benchmarking-best-open-source-vision-language-models) / [Qwen GPU別ベンチ](https://medium.com/@wltsankalpa/benchmarking-qwen-models-across-nvidia-gpus-t4-l4-h100-architectures-finding-your-sweet-spot-a59a0adf9043)

**コスト**
- [AWS GPU一覧](https://aws-pricing.com/gpu.html) / [Cloud Cost Handbook](https://handbook.vantage.sh/aws/reference/aws-gpu-instances/) / [AWS GPU値下げ(2025/06)](https://aws.amazon.com/about-aws/whats-new/2025/06/pricing-usage-model-ec2-instances-nvidia-gpus/)

**ライセンス・VRAM**
- [Qwen2.5-VL-7B (Apache 2.0)](https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct) / [InternVL (MIT)](https://github.com/OpenGVLab/InternVL) / [VRAM要件 (DeepWiki)](https://deepwiki.com/QwenLM/Qwen2.5-VL/1.2-system-requirements)
