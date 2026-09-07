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
# Qwen "thinking" is disabled per-request by the app via
#   chat_template_kwargs: { enable_thinking: false }  — no server flag needed.
CMD ["--model", "/models/qwen3.5-4b", \
     "--served-model-name", "Qwen/Qwen3.5-4B", \
     "--host", "0.0.0.0", \
     "--port", "8080", \
     "--max-model-len", "8192", \
     "--enable-prefix-caching", \
     "--gpu-memory-utilization", "0.90"]
