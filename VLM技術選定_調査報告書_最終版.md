# ローカルVLM技術選定 — 調査報告書（最終版）

作成日: 2026/03/12　対象: AI/内製App開発基盤（社内ローカルVLM）

---

## 結論

PoC候補を4モデルに絞った。すべて商用利用可能、vLLM対応済み。

| 役割 | モデル | なぜこれか | 月額目安(8h/平日) |
| --- | --- | --- | --- |
| **本命** | Qwen3.5-9B | MoEでネイティブマルチモーダル。BF16で~18GB（L4可）、INT4なら~5GB（T4可）。量子化耐性高 | ≒¥18,000〜¥28,000 |
| **安定枠（精度最高）** | Qwen3-VL-8B-Instruct (BF16) | DocVQA 97%、OCRBench 896。8Bクラス最高精度。実績半年 | ≒¥28,000 (L4) |
| **非Qwen枠（推論力）** | InternVL3.5-8B (BF16) | MMMU 73.4%で推論力トップ。OCRBench 880。MITライセンス | ≒¥28,000 (L4) |
| **MoE高性能枠** | InternVL3.5-20B-A4B (FP8) | MMMU 75.6%。活性4.4BのMoE。FP8で24GBにフィット | ≒¥28,000 (L4) |

**次のアクション:**
1. 担当者にGPU環境の調達を相談（スポット利用でPoC数百〜数千円）
2. 上記4モデルをPoCで検証し、精度・速度・VRAM使用量を実測
3. 結果次第で本番構成を確定

---

## 1. 背景・要件

| 項目 | 内容 |
| --- | --- |
| 目的 | 個人情報を含む書類の外部API依存を排し、社内ローカルVLMで処理する |
| ユースケース | ①書類の個人情報マスキング ②画像キャプション・タグ付け ③観光スポットデータのタグ付け |
| 処理量 | 1日1000件 |
| 同時利用 | 5人以下 |
| 速度感 | チャットとして遅く感じない程度 |

---

## 2. なぜこの4モデルか

### Qwen3.5-9B — 本命

2026/03/02リリース。MoE + Gated Delta Networksで、ネイティブマルチモーダル対応。MMMU-Pro 70.1は13倍大きいモデルに匹敵。BF16で約18GBなので24GB GPU（L4/A10G）でそのまま動作可能。さらにMoEは量子化耐性が高いため、FP8やINT4に落としても精度が維持されやすく、INT4なら約5GBでT4（16GB）でも余裕。まずBF16で精度ベースラインを取り、コスト削減が必要なら段階的にFP8→INT4と落として精度差を確認する流れが最適。リリースから10日でvLLM実績が少ないのが唯一のリスク。

### Qwen3-VL-8B-Instruct — 精度の保証枠

2025/09リリース。DocVQA 97%、OCRBench 896は8Bクラスで圧倒的で、前世代78Bモデルすら上回る。情報が豊富で安定性が高い。24GBでBF16動作可能。他モデルの精度比較のベースラインとしても必須。

### InternVL3.5-8B — 非Qwen枠・推論力重視

2026年初頭リリース。MMMU 73.4%はQwen3-VL-8B（62%）を大きく上回り、8BクラスDenseモデルで推論力トップ。OCRBench 880もQwen2.5-VL-7B（864）より上。MITライセンスでQwenとは異なる系統のため、Qwen系に問題があった場合のリスク分散にもなる。

### InternVL3.5-20B-A4B — MoE高性能枠

2026年初頭リリース。総パラメータ21.2B、活性4.4BのMoEで、MMMU 75.6%は今回の全候補中トップ。「なぜこの風景が歴史的に重要か」といった深い推論が可能で、UC②③の観光タグ付けに最適。FP8量子化で約22GBとなり24GBにフィット。推論速度もMoEの恩恵で速い。

### 候補から外したモデルと理由

| モデル | 外した理由 |
| --- | --- |
| GLM-4.6V-Flash (9B) | 2026年VLMガイドで筆頭紹介されるほど高評価。ネイティブFunction Callingが独自の強み。**ただし対応言語が英語・中国語のみで日本語非対応。** 本業務では日本語書類を扱うため不適 |
| MiniCPM-o 4.5 (9B) | DocVQA 93.5%で上位候補に及ばない |
| Qwen3-VL-30B-A3B | INT4で15GBだがInternVL3.5-20B-A4Bの方がMMMU高い |
| Qwen2.5-VL-7B | 1世代前。Qwen3-VL-8Bに全指標で劣る |

---

## 3. ベンチマーク

### 指標の意味

| 指標 | 測定内容 | UC関連度 |
| --- | --- | --- |
| DocVQA | 文書画像QA正答率（請求書・契約書等） | ★★★ UC①に直結 |
| OCRBench | OCR総合力（/1000点。テキスト認識・手書き・多言語） | ★★★ UC①②③基礎能力 |
| MMMU | 大学レベル多分野の画像付き推論 | ★★ UC②③の深い理解力 |

### PoC候補4モデル

| モデル | DocVQA | OCRBench | MMMU | パラメータ | 種別 | ライセンス | VRAM |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Qwen3.5-9B | （PoC実測） | （PoC実測） | MMMU-Pro 70.1 | 9B | MoE | Apache 2.0 | BF16: ~18GB / INT4: ~5GB |
| Qwen3-VL-8B | **97%** | **896** | 62% | 8B | Dense | Apache 2.0 | BF16: ~18GB |
| InternVL3.5-8B | 94.0% | 880 | **73.4%** | 8.5B | Dense | MIT/Apache | BF16: ~18GB |
| InternVL3.5-20B-A4B | 93.8% | 885 | **75.6%** | 21.2B/4.4B | MoE | MIT/Apache | FP8: ~22GB |

### 参考：その他のモデル

| モデル | DocVQA | OCRBench | MMMU | パラメータ | ライセンス |
| --- | --- | --- | --- | --- | --- |
| Qwen3-VL-8B-Thinking | 97% | 905 | 70-72% | 8B Dense | Apache 2.0 |
| MiniCPM-o 4.5 | 93.5% | 852 | 50.4% | 9B Dense | Apache 2.0 |
| Qwen2.5-VL-7B | 95.7% | 864 | 58.6% | 7B Dense | Apache 2.0 |
| 人間 | 98.1% | — | — | — | — |

---

## 4. GPU・コスト

| インスタンス | GPU | VRAM | $/時 | 月額(8h/平日) | 載るモデル |
| --- | --- | --- | --- | --- | --- |
| g4dn.xlarge | T4×1 | 16GB | $0.71 | ≒¥18,000 | Qwen3.5-9B (INT4/FP8) |
| g6.xlarge | L4×1 | 24GB | $1.12 | ≒¥28,000 | 全4モデル対応。Qwen3.5-9B (BF16)も可 |
| g5.xlarge | A10G×1 | 24GB | $1.41 | ≒¥35,000 | 同上（CPU/RAM余裕あり） |

> ※ スポット利用で50〜70%削減可能。PoC検証なら数百〜数千円。

### 量子化の指針

| 方式 | ビット幅 | VRAM削減 | 精度影響 |
| --- | --- | --- | --- |
| BF16 | 16bit | なし | 最高精度。ベースライン取得用 |
| FP8 | 8bit | 約50%減 | Perplexity悪化1%未満 |
| INT4 | 4bit | 約75%減 | Denseでリスクあり。MoEで耐性高い |

> ※ MoEモデルは活性パラメータが少ないため、量子化の影響が分散され精度が維持されやすい。

---

## 5. スループット参考値

| 構成 | 数値 |
| --- | --- |
| Qwen2.5-VL-7B + vLLM (A100), 並列50 | 約20.89 req/s |
| Qwen3-8B テキスト (VRAM全載) | ~40 tok/s |
| InternVL3.5-20B-A4B (MoE) | 活性4.4Bのため8B Denseより高速と推定 |

**要件達成見込み:** 8Bクラスで1件5秒 × 1000件 ≒ 約1.4時間。MoEならさらに短縮。業務時間内に十分収まる。

---

## 6. PoC計画

### 起動手順

```bash
pip install "vllm>=0.11.0"

# ① Qwen3-VL-8B（精度ベースライン）
vllm serve Qwen/Qwen3-VL-8B-Instruct \
  --max_model_len 8096 \
  --limit-mm-per-prompt image=1 \
  --gpu-memory-utilization 0.95

# ② InternVL3.5-8B（非Qwen比較）
vllm serve OpenGVLab/InternVL3_5-8B \
  --trust-remote-code \
  --max_model_len 8096 \
  --gpu-memory-utilization 0.95

# ③ InternVL3.5-20B-A4B（MoE高性能）
vllm serve OpenGVLab/InternVL3_5-20B-A4B-FP8-Dynamic \
  --quantization compressed-tensors \
  --trust-remote-code \
  --gpu-memory-utilization 0.90 \
  --max-model-len 32768 \
  --max-num-seqs 16

# ④ Qwen3.5-9B（本命、まずBF16で精度確認 → 後にFP8/INT4検証）
vllm serve Qwen/Qwen3.5-9B \
  --max_model_len 8096 \
  --reasoning-parser qwen3
```

### 計測項目

| 項目 | 目的 |
| --- | --- |
| タスク精度 | マスキング漏れ率、タグ正答率。**最も重要** |
| VRAM使用量 | 実測値とピーク |
| TTFT / 出力token/s | 体感速度 |
| 1000件バッチ所要時間 | 日次処理の実現性 |

### 判断フロー

```
Step 1: Qwen3.5-9B (BF16) の精度を Qwen3-VL-8B (BF16) と比較
  同等以上 → Qwen3.5-9B を採用
    コスト削減したい → FP8 / INT4 に段階的に落として精度差を測定
      精度維持 → T4運用（月額≒¥18,000）
      精度低下 → L4でBF16運用（月額≒¥28,000）
  精度不十分 → Qwen3-VL-8B を採用（L4運用、月額≒¥28,000）

Step 2: UC②③で深い推論力が必要と判明
  → InternVL3.5-20B-A4B を検討（L4運用、FP8、月額≒¥28,000）
```

---

## 参考ソース

**モデル公式**
- [Qwen3.5](https://github.com/QwenLM/Qwen3.5) / [Qwen3-VL](https://github.com/QwenLM/Qwen3-VL) / [InternVL3.5](https://internvl.github.io/blog/2025-04-11-InternVL-3.0/)

**ベンチマーク**
- [Qwen3-VL-8B詳細比較](https://codersera.com/blog/qwen3-vl-8b-instruct-vs-qwen3-vl-8b-thinking-2025-guide/) / [2026年VLMガイド](https://www.bentoml.com/blog/multimodal-ai-a-guide-to-open-source-vision-language-models) / [VLM Top10](https://www.datacamp.com/blog/top-vision-language-models)

**推論エンジン**
- [vLLM Qwen3.5レシピ](https://docs.vllm.ai/projects/recipes/en/latest/Qwen/Qwen3.5.html) / [vLLM対応モデル一覧](https://docs.vllm.ai/en/latest/models/supported_models.html)

**コスト・VRAM**
- [AWS GPU一覧](https://aws-pricing.com/gpu.html) / [Qwen3.5 VRAM解析](https://kaitchup.substack.com/p/qwen35-9b-4b-2b-and-08b-gpu-requirements)
