# Insta VIZ — self-hosted LLM image (Qwen 3.5 4B on vLLM)
# Weights are BAKED IN at build time so cold starts don't re-download the model.
#
# Base: vLLM's official OpenAI-compatible server image (CUDA + vLLM + OpenAI API).
# Its ENTRYPOINT is `python3 -m vllm.entrypoints.openai.api_server`, so our CMD
# below just supplies the serving flags.
#
# Pin the vLLM version for reproducible builds (bump deliberately, then rebuild).
# v0.28.0 (latest stable, 26 Aug 2026): Qwen 3.5 GDN architecture is natively
# supported since v0.17.0 — v0.11.0 predated it and failed with "unknown
# architecture qwen3_5". Serving the official Qwen3.5-4B checkpoint (inference)
# is supported; the open text-only-class bugs are training/colocate-only.
FROM vllm/vllm-openai:v0.28.0

# Bake the model weights into the image (~9.3 GB: 2 safetensors shards, bf16).
# Qwen/Qwen3.5-4B is Apache-2.0 and public — no HF token needed.
# Use the `hf` CLI (already bundled in the v0.28.0 image); `huggingface-cli`
# is deprecated and no longer works in newer huggingface_hub.
ARG MODEL_ID=Qwen/Qwen3.5-4B
ARG MODEL_DIR=/models/qwen3.5-4b
# No --exclude: the new `hf` CLI mis-parses multiple patterns as explicit
# filenames and downloads 0 files. The repo is just safetensors + configs, so
# fetch it all, then verify config.json actually landed (fail the build if not).
RUN hf download ${MODEL_ID} --local-dir ${MODEL_DIR} \
    && test -f ${MODEL_DIR}/config.json \
    && ls -la ${MODEL_DIR}

# Serve the baked model.
# - served-model-name = the HF id, so the app can reference "Qwen/Qwen3.5-4B".
# - max-model-len 8192: our prompts+outputs are small; a low context frees GPU
#   memory and lets vLLM batch more (we do NOT need the model's 256K context).
# - enable-prefix-caching: reuse the fixed system-prompt prefix (our efficiency lever).
# - port 8080: Cloud Run sends traffic to $PORT (default 8080).
# - enforce-eager: turn OFF vLLM's default torch.compile + CUDA-graph capture.
#   Measured from real cold-start logs: this alone is only part of the boot — the
#   dominant costs are Python/CUDA imports (~79 s), the engine profile+KV+warmup
#   (~113 s) and, for this checkpoint, a WASTED vision warmup (~30 s). enforce-eager
#   still helps a scale-to-zero service (cost paid on EVERY wake) and our tiny
#   prompts barely benefit from compiled mode. (Remove this flag to restore it.)
# - language-model-only: Qwen3.5-4B is natively a vision-language checkpoint
#   (loads as Qwen3_5ForConditionalGeneration). Our pipeline is TEXT-ONLY, so this
#   flag disables all multimodal inputs and skips loading the vision encoder — it
#   removes the ~30 s multi-modal warmup and the image-profiling done at startup.
#   Qwen3.5-native flag (confirmed in vLLM v0.28.0); preferred over
#   --limit-mm-per-prompt, which is reported ineffective for Qwen3-VL-class models.
# - kv-cache-memory-bytes 9725302272 (~9.06 GiB): preset the KV-cache size so vLLM
#   skips the startup memory-profiling sweep it otherwise runs to infer it. The
#   value is exactly what the deployment log recommended for this GPU/model. (The
#   CLI flag is --kv-cache-memory-bytes; the log's "--kv-cache-memory" is shorthand.)
# Qwen "thinking" is disabled per-request by the app via
#   chat_template_kwargs: { enable_thinking: false }  — no server flag needed.
CMD ["--model", "/models/qwen3.5-4b", \
     "--served-model-name", "Qwen/Qwen3.5-4B", \
     "--host", "0.0.0.0", \
     "--port", "8080", \
     "--max-model-len", "8192", \
     "--enable-prefix-caching", \
     "--enforce-eager", \
     "--language-model-only", \
     "--kv-cache-memory-bytes", "9725302272", \
     "--gpu-memory-utilization", "0.90"]
