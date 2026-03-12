# ローカルVLM技術選定 — 調査報告書

作成日: 2026/03/12　対象: AI/内製App開発基盤（社内ローカルVLM）

---

## 0. 背景と目的

外部に出せない個人情報のマスキングや有料APIでの大量処理にはコストがかさむため、社内で共通利用可能なローカルVLMを整備する。

### 想定ユースケース

| No. | 業務名 | 入力 | 出力 |
| --- | --- | --- | --- |
| 1 | 書類の個人情報マスキング | スキャン画像, PDF, CSV, Word | マスキング済みテキスト（txt, md, json, xml） |
| 2 | 画像キャプション・タグ付け | 画像 | タグ分類、キャプション |
| 3 | 観光スポットデータのタグ付け | jsonなどのテキストデータ | タグ分類 |

### 要件

| 項目 | 回答 |
| --- | --- |
| 1日あたりの想定処理件数 | 1日1000件くらい |
| 処理スピードの要望 | チャットとして使ったときに遅く感じないくらい |
| 同時に利用する人数（想定） | まずは5人以下想定 |

---

## 1. モデル比較

### 評価指標の意味

| 指標 | 何を測るか | スコア形式 | 本プロジェクトとの関連 |
| --- | --- | --- | --- |
| DocVQA | 文書画像に対するQAの正答率。請求書や契約書から「発行日は？」「合計金額は？」等に正しく答えられるかを測定 | 正答率（%） | ユースケース1（個人情報マスキング）に直結。最重要指標 |
| OCRBench | OCR能力の総合評価。テキスト認識、シーンテキストQA、文書QA、キー情報抽出、手書き数式認識の5カテゴリ、1000問 | 1000点満点 | ユースケース1〜3すべてに関わる基礎能力 |
| ChartQA | グラフ・図表画像を読み取ってQAに答える正答率。棒グラフの値を読む、折れ線の傾向を答える等 | 正答率（%） | ユースケース3で図表形式データを扱う場合に関連 |
| MMMU | 大学レベルの多分野（数学、科学、ビジネス、芸術等）にまたがる画像付き問題。画像の「理解＋推論」の汎用力 | 正答率（%） | 直接対応するユースケースはないが、将来タスク拡張時の余力を示す |

> **優先度:** DocVQA ≧ OCRBench > ChartQA > MMMU

### Qwen2.5-VL系

| モデル名 | パラメータ | ライセンス | 商用利用 | VRAM (BF16) | VRAM (INT4) | DocVQA | OCRBench | ChartQA | MMMU | 日本語OCR | 備考 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Qwen2.5-VL-7B | 7B | Apache 2.0 | ○ | ~16GB | ~6GB | 95.7% | 864 | 87.3% | 58.6% | 良好（多言語対応） | OCR特化のRolmOCR派生あり |
| Qwen2.5-VL-32B | 32B | Apache 2.0 | ○ | ~68GB | ~20GB | 96.1% | 878 | 88.0% | 67.5% | 良好 | RL最適化済、7Bと72Bの中間 |
| Qwen2.5-VL-72B | 72B | Qwen License | 条件付き※ | ~144GB | ~36GB | 96.4% | 888 | 88.3% | 70.2% | 非常に良好 | トップクラスの精度 |

### InternVL2.5系

| モデル名 | パラメータ | ライセンス | 商用利用 | VRAM (BF16) | VRAM (INT4) | DocVQA | OCRBench | ChartQA | MMMU | 日本語OCR | 備考 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| InternVL2.5-8B | 8B | MIT | ○ | ~18GB | ~6GB | 93.2% | 822 | 84.5% | 56.0% | 良好 | 6BのViTエンコーダ搭載 |
| InternVL2.5-26B | 26B | MIT | ○ | ~56GB | ~16GB | 94.8% | 842 | 86.2% | 62.8% | 良好 | コスパ良い中型モデル |
| InternVL2.5-78B | 78B | MIT | ○ | ~160GB | ~42GB | 95.1% | 854 | 88.3% | 70.1% | 良好 | MMMU 70%超の初OSSモデル |

### InternVL3系（最新）

| モデル名 | パラメータ | ライセンス | 商用利用 | VRAM (BF16) | VRAM (INT4) | DocVQA | OCRBench | ChartQA | MMMU | 日本語OCR | 備考 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| InternVL3-8B | 8B | MIT | ○ | ~18GB | ~6GB | 94.5% | — | 86.0% | 64.1% | 良好 | 2025年4月公開、V2.5より改善 |
| InternVL3-78B | 78B | MIT | ○ | ~160GB | ~42GB | 95.4% | — | 89.7% | 72.2% | 良好 | 最新・最高精度のOSS VLM |

> ※ Qwen Licenseは月間アクティブユーザー1億未満なら商用可。詳細はライセンス条項要確認。
> ※ ベンチマークスコアは公式報告値。実運用精度はタスクとプロンプト設計に依存。
> ※ InternVL3のOCRBenchスコアは現時点で未公開（—で表記）。

### 選定理由

**第一候補: Qwen2.5-VL-7B** — DocVQA/OCRBenchが7Bクラス最高、Apache 2.0ライセンス、vLLM公式推奨で情報量が最も多い。

**比較候補: InternVL3-8B** — MITライセンス、MMMU 64.1%（Qwen 58.6%を上回る）で推論力が高い。PoCで並行検証する価値あり。

---

## 2. 推論エンジン × モデル対応状況

| 推論エンジン | OpenAI API互換 | Qwen2.5-VL対応 | InternVL2.5/3対応 | 量子化対応 | 特徴・備考 |
| --- | --- | --- | --- | --- | --- |
| vLLM | ○ | ○（公式推奨） | ○ | FP8, AWQ, GPTQ | PagedAttention、連続バッチ処理。VLMのDP/TP両対応。最も成熟したエコシステム。 |
| SGLang | ○ | ○ | ○ | FP8, AWQ, GPTQ | MoEモデルでvLLMより3〜5倍高速との報告あり。RadixAttentionでプレフィックスキャッシュ効率が良い。 |
| llama.cpp | ○（llama-server） | △（GGUF変換要） | △（限定的） | Q4_K_M等GGUF量子化 | CPU+GPU分離推論可能。MoEに有利だがVLMサポートは発展途上。 |

**結論:** vLLMで確定。Qwen公式推奨、ドキュメント充実、OpenAI API互換で既存スタック（Next.js/FastAPI）と接続容易。SGLangはスループットがボトルネックになった場合の次の選択肢として保留。

### MoEについて

現時点ではVLMでMoEの実用的なモデルが存在しないため見送り。テキストLLMではMixtralやQwen3-MoEがあるが、VLM版は未成熟。llama.cppでのCPU/GPU分離も理論上可能だがVLMサポートが不完全。将来Qwen系でMoE VLMが出れば再検討。

---

## 3. AWS GPUインスタンス コスト比較（東京リージョン概算）

| インスタンス | GPU | GPU数 | VRAM/GPU | VRAM合計 | $/時(概算) | 月額(24h稼働) | 月額(8h/平日) | 載るモデル例 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| g4dn.xlarge | T4 | 1 | 16GB | 16GB | $0.71 | $518 | $117 | Qwen2.5-VL-7B (INT4) |
| g4dn.12xlarge | T4 | 4 | 16GB | 64GB | $5.10 | $3,723 | $836 | Qwen2.5-VL-7B (BF16) |
| g5.xlarge | A10G | 1 | 24GB | 24GB | $1.41 | $1,029 | $231 | Qwen2.5-VL-7B (BF16) |
| g5.2xlarge | A10G | 1 | 24GB | 24GB | $1.69 | $1,234 | $277 | Qwen2.5-VL-7B (BF16) + 余裕 |
| g5.12xlarge | A10G | 4 | 24GB | 96GB | $7.60 | $5,548 | $1,246 | Qwen2.5-VL-32B (BF16) |
| g6.xlarge | L4 | 1 | 24GB | 24GB | $1.12 | $818 | $184 | Qwen2.5-VL-7B (BF16) |
| g6.2xlarge | L4 | 1 | 24GB | 24GB | $1.35 | $986 | $221 | Qwen2.5-VL-7B (BF16) + 余裕 |
| p4d.24xlarge | A100 | 8 | 40GB | 320GB | $40.00 | $29,200 | $6,560 | Qwen2.5-VL-72B (BF16) |

> ※ 価格はLinux On-Demand概算。スポット利用で50〜70%削減可能。
> ※ 月額(8h/平日) = $/時 × 8時間 × 約22営業日。
> ※ g6 (L4) はg5 (A10G) と同等VRAMだが新世代で約10〜20%安価。東京リージョンでの可用性を要確認。
> ※ A100（p4d.24xlarge）はA10Gの約28倍の時間単価。7Bモデルにはオーバースペックのため今回は対象外。

### VRAM実情（24GB GPU × Qwen2.5-VL-7B BF16）

| 内訳 | 消費量 |
| --- | --- |
| モデルウェイト (7B × 2bytes) | 約14GB |
| ViTエンコーダ (0.6B × 2bytes) | 約1.2GB |
| vLLMオーバーヘッド | 約1〜2GB |
| KVキャッシュ（画像1枚・中解像度） | 約0.5GB |
| **合計（画像1枚の単発リクエスト）** | **約18〜21GB** |

24GBに対して3〜6GBの余裕。画像1枚の単発リクエストは問題ないが、高解像度画像の複数同時処理ではVRAM不足のリスクあり。

**対策:**
- `--max_model_len=8096` + `--limit-mm-per-prompt image=1` で制限
- `--gpu-memory-utilization=0.95` でメモリ割り当て最大化
- それでも不足ならFP8量子化（精度低下最小限、VRAM約25%減）

**複数画像処理について:** 1リクエストに5枚入れると追加で+2〜3GB（中解像度）。高解像度なら溢れる可能性大。1リクエスト1画像のバッチAPI処理（並列リクエスト）が安全かつ高効率。

---

## 4. 推奨構成パターン（3案）

| 項目 | A案: コスト最小 | B案: バランス型 | C案: 精度重視 |
| --- | --- | --- | --- |
| モデル | Qwen2.5-VL-7B | Qwen2.5-VL-7B | Qwen2.5-VL-72B |
| 量子化 | INT4 (AWQ) | BF16（量子化なし） | FP8 |
| 推論エンジン | vLLM | vLLM | vLLM (TP) |
| インスタンス | g6.xlarge (L4×1) | g5.xlarge (A10G×1) | p4d.24xlarge (A100×8) |
| VRAM | 24GB（余裕あり） | 24GB | 320GB |
| 月額(8h/平日) | 約$184 (≒¥28,000) | 約$231 (≒¥35,000) | 約$6,560 (≒¥984,000) |
| DocVQA想定精度 | 93〜95%相当 | 95.7% | 96.4% |
| スループット | 中（INT4で高速化） | 中〜高 | 高 |
| 向いている場面 | 検証・PoC段階、少量処理 | 日常運用、1日1000件の処理 | 高精度要求、大量バッチ処理 |
| リスク・留意点 | 量子化による精度低下の可能性。OCR精度は要検証 | VRAMギリギリになる場合あり。画像サイズ制限が必要 | コスト高。運用体制が必要 |

**推奨:** まずA案またはB案でPoCを実施し、精度・速度を確認した上でC案の要否を判断。

### 量子化の選択指針

| 方式 | VRAM削減 | 精度影響 | 推奨場面 |
| --- | --- | --- | --- |
| BF16（量子化なし） | なし | 最高精度 | 精度ベースライン取得。まずここから始める |
| FP8 | 約25%減 | 最小限 | BF16でVRAM不足時の第一選択。Ampere以降GPU必須 |
| INT4 (AWQ/GPTQ) | 約75%減 | OCR精度低下のリスクあり | T4で動かしたい場合やコスト最小化。精度検証必須 |

---

## 5. token/s・スループット参考データ

### 用語整理

| 用語 | 意味 | 何に効くか |
| --- | --- | --- |
| token/s（出力） | 1秒あたりに生成されるトークン数（1リクエスト） | チャットUIの体感速度。日本語で約25〜50文字/秒に相当 |
| TTFT | Time To First Token。最初のトークンが返るまでの時間 | 応答の「待たされ感」 |
| スループット（全体） | 並列リクエストを含む、システム全体のtoken/s | 「1日1000件さばけるか」の判断に直結 |
| req/s | 1秒あたりの処理リクエスト数 | バッチ処理の所要時間見積もり |

### 公開ベンチマークから得られる参考値

VLMのtoken/sは入力画像の解像度・枚数・プロンプト長で大きく変動するため、テキストLLMのような一律の公式値が存在しない。以下は条件付きの参考値。

| 構成 | 条件 | 数値 | 出典 |
| --- | --- | --- | --- |
| Qwen2-VL-7B + vLLM | VisionArena-Chat 1000件バッチ | 2.55 req/s, 全体4,037 tok/s, 出力327 tok/s | [vLLM Benchmark CLI ドキュメント](https://docs.vllm.ai/en/latest/benchmarking/cli/) |
| Qwen2.5-VL-7B + vLLM (A100) | 画像入力、並列50リクエスト | 約20.89 req/s（画像）、7.35 req/s（動画） | [vLLM GitHub Issue #24728](https://github.com/vllm-project/vllm/issues/24728) |
| Qwen2.5-VL-7B (L40S) | Clarifaiベンチ、500入力/150出力tok | テキスト・画像両方で安定した性能（詳細はグラフ参照） | [Clarifai VLMベンチマーク記事](https://www.clarifai.com/blog/benchmarking-best-open-source-vision-language-models) |
| Qwen2.5-Coder-7B（テキスト、参考） | T4 単体 | 3.8 tok/s | [Medium: GPU別ベンチマーク記事](https://medium.com/@wltsankalpa/benchmarking-qwen-models-across-nvidia-gpus-t4-l4-h100-architectures-finding-your-sweet-spot-a59a0adf9043) |
| Qwen2.5-Coder-7B（テキスト、参考） | L4 単体 | 53.1 tok/s | 同上 |
| Gemma-3-4B（テキスト、参考） | L40S、単一リクエスト | 202.25 tok/s (E2E) | [Clarifai VLMベンチマーク記事](https://www.clarifai.com/blog/benchmarking-best-open-source-vision-language-models) |

### 本プロジェクトへの示唆

**チャット体感（1リクエスト）:** Qwen2.5-VL-7BをA10GまたはL4で動かした場合、画像1枚の問い合わせで数秒〜10秒程度の応答が見込まれる。「チャットとして使ったときに遅く感じないくらい」の要件は概ね達成可能と推定。

**日次バッチ（1000件/日）:** A100でのベンチマークでは画像入力で約20 req/sが出ており、仮に1件5秒としても1000件で約1.4時間。A10G/L4ではこの2〜3倍程度かかる想定だが、業務時間内に十分収まる見込み。

> ※ T4ではテキスト専用7Bモデルで3.8 tok/sという報告があり、VLMではさらに低下する可能性が高い。T4でのVLMリアルタイム利用は厳しい。
> ※ Qwen公式Speed Benchmarkは現時点でテキストモデル（Qwen2.5/Qwen3）のみ。VL版は未掲載。
> ※ 上記はすべて条件付きの参考値。PoCでの実測が不可欠。

---

## 6. PoC計画

### 環境

- GPU: A10G（g5.xlarge）またはL4（g6.xlarge）のスポットインスタンス
- 検証コスト: スポット利用で数百〜数千円程度
- 要: 担当者にGPU環境の調達・承認を相談

### 検証モデル

- Qwen2.5-VL-7B（第一候補）
- InternVL3-8B（比較候補）
- OSSのため、モデルのダウンロード・利用自体は無料。GPU環境さえあればモデル名の差し替えだけで比較可能

### 起動手順（概要）

```bash
# vLLMインストール
pip install vllm

# Qwen2.5-VL-7Bで起動
vllm serve Qwen/Qwen2.5-VL-7B-Instruct \
  --max_model_len 8096 \
  --limit-mm-per-prompt image=1 \
  --gpu-memory-utilization 0.95

# InternVL3-8Bに差し替え
vllm serve OpenGVLab/InternVL3-8B \
  --max_model_len 8096 \
  --limit-mm-per-prompt image=1 \
  --gpu-memory-utilization 0.95
```

OpenAI互換APIサーバーが立ち上がり、curl/Python/チャットUIから画像付きリクエストを投げられる。

### 計測項目

- TTFT（最初のトークンまでの時間）
- 出力token/s（1リクエスト）
- タスク精度（マスキング漏れ率、タグ正答率など）
- 1000件バッチの所要時間（並列数別）

---

## 参考ソース一覧

### モデル情報
- [Qwen2.5-VL 公式ドキュメント](https://qwen.readthedocs.io/en/latest/)
- [InternVL2.5 公式ブログ](https://internvl.github.io/blog/2024-12-05-InternVL-2.5/)
- [InternVL3 公式ブログ](https://internvl.github.io/blog/2025-04-11-InternVL-3.0/)
- [InternVL3 論文 (arXiv)](https://arxiv.org/pdf/2504.10479)
- [OCRBench v2 論文](https://arxiv.org/html/2501.00321v2)
- [Modal: 8 Top Open-Source OCR Models Compared](https://modal.com/blog/8-top-open-source-ocr-models-compared)

### 推論エンジン
- [vLLM Qwen2.5-VL レシピ](https://docs.vllm.ai/projects/recipes/en/latest/Qwen/Qwen2.5-VL.html)
- [Qwen公式 vLLMガイド](https://qwen.readthedocs.io/en/latest/deployment/vllm.html)
- [SGLang vs vLLM 速度比較 (GitHub Issue)](https://github.com/vllm-project/vllm/issues/36215)

### token/s・速度ベンチマーク
- [vLLM Benchmark CLI ドキュメント](https://docs.vllm.ai/en/latest/benchmarking/cli/)
- [vLLM GitHub Issue #24728: VLMマルチモーダルベンチマーク (A100)](https://github.com/vllm-project/vllm/issues/24728)
- [Clarifai: VLMベンチマーク比較 (L40S)](https://www.clarifai.com/blog/benchmarking-best-open-source-vision-language-models)
- [Medium: Qwen GPU別ベンチマーク (T4/L4/H100)](https://medium.com/@wltsankalpa/benchmarking-qwen-models-across-nvidia-gpus-t4-l4-h100-architectures-finding-your-sweet-spot-a59a0adf9043)
- [Qwen2.5 Speed Benchmark（テキストモデル）](https://qwen.readthedocs.io/en/v2.5/benchmark/speed_benchmark.html)
- [vLLM Forum: Qwen2.5-VL推論高速化の議論](https://discuss.vllm.ai/t/speeding-up-vllm-inference-for-qwen2-5-vl/615)

### コスト・インスタンス
- [AWS GPU Instance 一覧 (aws-pricing.com)](https://aws-pricing.com/gpu.html)
- [Cloud Cost Handbook: AWS GPU Instances](https://handbook.vantage.sh/aws/reference/aws-gpu-instances/)
- [AWS P4d/P5 値下げ発表 (2025年6月)](https://aws.amazon.com/about-aws/whats-new/2025/06/pricing-usage-model-ec2-instances-nvidia-gpus/)

### ライセンス
- [Qwen2.5-VL-72B (Qwen License)](https://huggingface.co/Qwen/Qwen2.5-VL-72B-Instruct)
- [Qwen2.5-VL-7B (Apache 2.0)](https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct)
- [InternVL (MIT License)](https://github.com/OpenGVLab/InternVL)

### VRAM・システム要件
- [Qwen2.5-VL System Requirements (DeepWiki)](https://deepwiki.com/QwenLM/Qwen2.5-VL/1.2-system-requirements)
- [HuggingFace: Qwen2.5-VL-72B VRAM Discussion](https://huggingface.co/Qwen/Qwen2.5-VL-72B-Instruct/discussions/3)
- [HuggingFace: Qwen2.5-VL-7B Hardware Requirements](https://huggingface.co/Qwen/Qwen2.5-VL-7B-Instruct/discussions/18)
