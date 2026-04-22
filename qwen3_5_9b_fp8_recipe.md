# Qwen3.5-9B FP8-Dynamic Offline Quantization Recipe (Vision-Preserving)

## 目的
- `Qwen/Qwen3.5-9B`（Dense Vision-Language モデル）を **FP8_DYNAMIC** で量子化し、vLLM で運用可能な事前量子化チェックポイントを生成する。
- **Vision Encoder・Gated DeltaNet・embeddings・lm_head は BF16 のまま保持**し、画像認識精度の劣化を防ぐ。
- 言語モデル本体の Linear 層のみ FP8 化する。

## 前提環境

| 項目 | 要件 | 備考 |
|------|------|------|
| GPU | SM89以上（Ada Lovelace / Hopper） | NVIDIA L4, L40S, H100 等。L4 では FP8 compute ネイティブ可 |
| VRAM | 24GB 以上推奨（BF16 で 9B ロード時ピーク約 19GB） | L4 24GB で実行可（ギリギリ、offload を用意） |
| RAM | 64GB 以上推奨 | CPU offload 発生時の安全マージン |
| CUDA | 12.1+ / cuDNN 9+ | PyTorch 2.5 系が要求 |
| Python | 3.10, 3.11, 3.12 のいずれか | 3.13 は llm-compressor 要確認 |

## バージョンピン（確実版）

公式 llm-compressor ドキュメント（Qwen3.5 examples）が明言している要件を起点とする。

```txt
# requirements.txt
torch>=2.5.0,<2.8
transformers>=5.0.0            # Qwen3.5 サポート要件（llm-compressor 公式ドキュメント明記）
llmcompressor>=0.9.0           # Qwen3.5 Dense/MoE 公式 example が格納されているバージョン
compressed-tensors>=0.9.0      # llmcompressor 0.9 と整合
accelerate>=1.0.0
datasets>=3.0.0
huggingface_hub>=0.26.0
pillow>=10.0.0                 # Vision 検証用
qwen-vl-utils>=0.0.14          # Vision 入力ユーティリティ
safetensors>=0.4.5
```

## 環境構築（推奨: uv を利用）

```bash
# 1. 作業ディレクトリ
mkdir -p ~/quant_qwen3_5_9b && cd ~/quant_qwen3_5_9b

# 2. Python 仮想環境
uv venv --python 3.12
source .venv/bin/activate

# 3. PyTorch（CUDA 12.1）
uv pip install "torch>=2.5.0,<2.8" --index-url https://download.pytorch.org/whl/cu121

# 4. 本体パッケージ
uv pip install \
  "transformers>=5.0.0" \
  "llmcompressor>=0.9.0" \
  "compressed-tensors>=0.9.0" \
  "accelerate>=1.0.0" \
  "datasets>=3.0.0" \
  "huggingface_hub>=0.26.0" \
  "pillow>=10.0.0" \
  "qwen-vl-utils>=0.0.14" \
  "safetensors>=0.4.5"

# 5. 確認
python -c "import transformers, llmcompressor; print('transformers:', transformers.__version__); print('llmcompressor:', llmcompressor.__version__)"
# 期待: transformers: 5.x.x / llmcompressor: 0.9.x 以上
```

**注意**: `transformers` が古いと以下のエラーになる可能性があり、典型的な version 不整合の原因。
- `KeyError: 'qwen3_5'`
- `RuntimeError: The model class ... has no attribute ...`
- `Unrecognized configuration class`

## 量子化スクリプト

`quantize_qwen3_5_9b_fp8.py` として保存。

```python
# quantize_qwen3_5_9b_fp8.py
"""
Offline FP8-Dynamic quantization for Qwen/Qwen3.5-9B (Dense Vision-Language model).

このレシピは以下を参照して作成されている:
- RedHatAI/Qwen3.5-122B-A10B-FP8-dynamic のモデルカード（公式 ignore パターンの出典）
- llm-compressor の qwen3.5 ディレクトリ
- llm-compressor v0.9.0 のリリースノート

Vision Encoder, embedding, lm_head, Gated DeltaNet (linear_attn) は BF16 のまま保持される。
"""

import gc
import torch
from transformers import AutoProcessor, AutoModelForImageTextToText
from llmcompressor import oneshot
from llmcompressor.modifiers.quantization import QuantizationModifier

MODEL_ID = "Qwen/Qwen3.5-9B"
SAVE_DIR = MODEL_ID.rstrip("/").split("/")[-1] + "-FP8-dynamic"


def main() -> None:
    # --- 1. モデルとプロセッサのロード ---
    # AutoModelForImageTextToText は Qwen3.5 系の VL モデルを自動判別する。
    # Qwen3.5-9B は Dense VL のため、MoE 専用クラスではなく統一エントリで取得する。
    print("Loading model...")
    model = AutoModelForImageTextToText.from_pretrained(
        MODEL_ID,
        dtype="auto",
        low_cpu_mem_usage=True,
        device_map="auto",  # L4 24GB でも CPU offload が自動発生
        trust_remote_code=True,
    )
    processor = AutoProcessor.from_pretrained(MODEL_ID, trust_remote_code=True)

    # --- 2. 量子化レシピ ---
    # FP8_DYNAMIC: 重み per-channel static、活性化 per-token dynamic
    #   → キャリブレーションデータ不要、RTN ベース
    #
    # ignore 正規表現（重要）:
    #   re:.*lm_head            : 出力埋め込み（標準的に保持）
    #   re:visual.*             : Vision Encoder トップレベル
    #   re:model.visual.*       : Vision Encoder（model. プレフィックス版）
    #   re:.*embed_tokens$      : 入力埋め込み（RedHatAI 公式推奨）
    #   re:.*linear_attn.*      : Gated DeltaNet 層（Qwen3.5 ハイブリッド由来、量子化非対応）
    #
    # Qwen3.5-9B は Dense のため、MoE 専用の以下は含めない:
    #   re:.*mlp.gate$, re:.*shared_expert_gate$, re:.*mlp\.shared_expert$
    recipe = QuantizationModifier(
        targets="Linear",
        scheme="FP8_DYNAMIC",
        ignore=[
            "re:.*lm_head",
            "re:visual.*",
            "re:model.visual.*",
            "re:.*embed_tokens$",
            "re:.*linear_attn.*",
        ],
    )

    # --- 3. 量子化実行 ---
    print("Applying FP8_DYNAMIC quantization...")
    oneshot(model=model, recipe=recipe)

    # --- 4. 保存（compressed-tensors 形式） ---
    print(f"Saving to {SAVE_DIR} ...")
    model.save_pretrained(SAVE_DIR, save_compressed=True)
    processor.save_pretrained(SAVE_DIR)

    # --- 5. メモリ解放 ---
    del model
    gc.collect()
    torch.cuda.empty_cache()

    print(f"Done. Checkpoint saved at: {SAVE_DIR}")


if __name__ == "__main__":
    main()
```

実行:

```bash
python quantize_qwen3_5_9b_fp8.py
```

所要時間は L4 で約 20〜40 分程度の想定（モデルロード + 量子化 + 保存）。

## 検証（テキスト + Vision 両方）

`verify_quant.py` として保存。

```python
# verify_quant.py
"""量子化後チェックポイントの動作確認（Vision 劣化チェック含む）"""

from transformers import AutoProcessor, AutoModelForImageTextToText
from PIL import Image
import requests
import torch

SAVE_DIR = "Qwen3.5-9B-FP8-dynamic"

model = AutoModelForImageTextToText.from_pretrained(
    SAVE_DIR, dtype="auto", device_map="auto", trust_remote_code=True
)
processor = AutoProcessor.from_pretrained(SAVE_DIR, trust_remote_code=True)

# --- テキストのみ ---
text_messages = [{"role": "user", "content": "Explain FP8 quantization in 2 sentences."}]
text_inputs = processor.apply_chat_template(
    text_messages, add_generation_prompt=True, tokenize=True, return_tensors="pt"
).to(model.device)
with torch.no_grad():
    out = model.generate(text_inputs, max_new_tokens=128, do_sample=False)
print("=== TEXT ===")
print(processor.batch_decode(out[:, text_inputs.shape[1]:], skip_special_tokens=True)[0])

# --- Vision 付き（画像認識が壊れていないかの検証） ---
img_url = "https://qianwen-res.oss-accelerate.aliyuncs.com/Qwen3-VL/receipt.png"
img = Image.open(requests.get(img_url, stream=True).raw)

vl_messages = [
    {"role": "user", "content": [
        {"type": "image", "image": img},
        {"type": "text", "text": "Read all the text in the image. List items concisely."},
    ]}
]
vl_inputs = processor.apply_chat_template(
    vl_messages, add_generation_prompt=True, tokenize=True,
    return_dict=True, return_tensors="pt",
).to(model.device)
with torch.no_grad():
    out = model.generate(**vl_inputs, max_new_tokens=256, do_sample=False)
print("\n=== VISION ===")
print(processor.batch_decode(out[:, vl_inputs["input_ids"].shape[1]:], skip_special_tokens=True)[0])
```

**判定基準**: Vision 出力が意味のある日本語/英語で画像の内容を記述していれば成功。空白・記号羅列・繰り返しなら Vision Encoder が壊れているため、`ignore` パターンを再確認すること。

## vLLM での起動（量子化後）

事前量子化済みのため、`--quantization` フラグは **不要**。`config.json` 内の `quantization_config` から自動検出される。

```bash
vllm serve ./Qwen3.5-9B-FP8-dynamic \
  --port 8000 \
  --tensor-parallel-size 1 \
  --max-model-len 32768 \
  --gpu-memory-utilization 0.92 \
  --reasoning-parser qwen3 \
  --trust-remote-code
```

テキスト専用運用で KV Cache を最大化する場合:

```bash
vllm serve ./Qwen3.5-9B-FP8-dynamic \
  --port 8000 \
  --max-model-len 65536 \
  --gpu-memory-utilization 0.92 \
  --reasoning-parser qwen3 \
  --language-model-only \
  --trust-remote-code
```

**注意**: Qwen3.5 の vLLM サポートは main branch にのみ入っている時期があるため、vLLM も最新の公式推奨版（nightly を含む）を利用する。

```bash
uv pip install -U vllm --extra-index-url https://wheels.vllm.ai/nightly
```

## 想定される罠と対処

| 症状 | 原因 | 対処 |
|------|------|------|
| `KeyError: 'qwen3_5'` | transformers が古い（v4.x） | `transformers>=5.0.0` に更新 |
| Vision 出力が意味不明 | `ignore` に visual が入っていない | `re:visual.*` と `re:model.visual.*` を両方含める |
| CUDA OOM during quantization | BF16 ロードが VRAM を超える | `device_map="auto"` で CPU offload、RAM 64GB 以上 |
| vLLM ロード時 `Unsupported quant_method` | vLLM が古い | vLLM を nightly にアップデート |
| 保存後 `config.json` に量子化情報がない | `save_compressed=True` 忘れ | `model.save_pretrained(..., save_compressed=True)` |
| `fix_mistral_regex=True` 警告 | llm-compressor 0.8 系の既知バグ | 0.9.0 以降を使用（issue #2153 参照） |

## 設計判断の根拠

1. **`FP8_DYNAMIC` 採用**
   - キャリブレーションデータ不要（RTN ベース）→ 再現性が高く、Copilot に任せやすい
   - 動的量子化のため精度劣化が最小（RedHatAI が公式採用）
   - L4 で FP8 compute がネイティブ動作

2. **`ignore` パターンの根拠**
   - RedHatAI/Qwen3.5-122B-A10B-FP8-dynamic のモデルカード記載の公式パターンから、MoE 固有項目（`mlp.gate`, `shared_expert_gate`, `mlp.shared_expert`）を除外したもの
   - Dense VL モデルに残すべきは: lm_head, visual, embed_tokens, linear_attn
   - `linear_attn` は Qwen3.5 の Gated DeltaNet 層に対応。量子化すると動作不良になることが報告されている

3. **`AutoModelForImageTextToText` 採用**
   - Qwen3.5 Dense VL では Qwen3_5ForConditionalGeneration 相当のクラスになるが、transformers v5 以降の自動判別に任せるのが頑健
   - モデルクラス名の変化に影響されない

4. **`save_compressed=True`**
   - compressed-tensors 形式で保存することで vLLM が `quantization_config` 経由で自動認識する。false のままだと密な状態で保存され、vLLM 側で再量子化が必要になる。

## 参考出典

- Qwen3.5-9B: https://huggingface.co/Qwen/Qwen3.5-9B
- RedHatAI Qwen3.5-122B-A10B-FP8-dynamic（公式 ignore パターン出典）: https://huggingface.co/RedHatAI/Qwen3.5-122B-A10B-FP8-dynamic
- llm-compressor Qwen3.5 examples: https://docs.vllm.ai/projects/llm-compressor/en/latest/key-models/qwen3.5/
- llm-compressor 0.8.0 release notes（Qwen3 VL MoE 対応）: https://github.com/vllm-project/llm-compressor/releases/tag/0.8.0
- vLLM Qwen3.5 recipe: https://docs.vllm.ai/projects/recipes/en/latest/Qwen/Qwen3.5.html
- llm-compressor FP8 W8A8 docs: https://docs.vllm.ai/en/latest/features/quantization/fp8/

## 27B/35B など他サイズへの転用

| モデル | モデルクラス | 追加 ignore 項目 |
|--------|------------|----------------|
| Qwen3.5-9B (Dense) | AutoModelForImageTextToText（本レシピ） | なし |
| Qwen3.5-27B (Dense) | AutoModelForImageTextToText | なし（同じレシピ） |
| Qwen3.5-35B-A3B (MoE) | Qwen3_5MoeForConditionalGeneration | `re:.*mlp.gate$`, `re:.*shared_expert_gate$`, `re:.*mlp\.shared_expert$` |
| Qwen3.5-122B-A10B (MoE) | Qwen3_5MoeForConditionalGeneration | 同上 |

MoE 版では FP8_BLOCK（block_size=128）も選択肢。`scheme="FP8_BLOCK"` に変更するだけ。
