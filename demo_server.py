"""
Demo web server for K4 — Day 1: LLM API exercises.
Wraps template.py functions into REST endpoints and serves a web UI.

Usage:
    pip install flask
    python demo_server.py
"""

import os
import re
import json
import time
from flask import Flask, request, jsonify, send_from_directory, Response, stream_with_context


def strip_think(text: str) -> str:
    """Xóa phần <think>...</think> mà các model Qwen/DeepSeek sinh ra."""
    return re.sub(r'<think>[\s\S]*?</think>', '', text or '', flags=re.IGNORECASE).strip()

from template import (
    call_openai,
    call_openai_mini,
    compare_models,
    chat_with_system_prompt,
    count_tokens,
    estimate_cost,
    retry_with_backoff,
    OPENAI_MODEL,
    OPENAI_MINI_MODEL,
    PRICING_PER_1K_TOKENS,
)

app = Flask(__name__, static_folder="demo_ui")


@app.route("/")
def index():
    return send_from_directory("demo_ui", "index.html")


@app.route("/<path:path>")
def static_files(path):
    return send_from_directory("demo_ui", path)


# ── Part 1 endpoints ──────────────────────────────────────────────────────────

@app.route("/api/call", methods=["POST"])
def api_call():
    """Call GPT-4o or GPT-4o-mini."""
    data = request.json
    prompt = data.get("prompt", "")
    model = data.get("model", OPENAI_MODEL)
    temperature = float(data.get("temperature", 0.7))
    top_p = float(data.get("top_p", 0.9))
    max_tokens = int(data.get("max_tokens", 256))

    try:
        text, latency = call_openai(
            prompt=prompt,
            model=model,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
        )
        tokens_in = count_tokens(prompt, model)
        tokens_out = count_tokens(text, model)
        cost = estimate_cost(prompt, text, model)
        return jsonify({
            "response": text,
            "latency": round(latency, 3),
            "tokens_in": tokens_in,
            "tokens_out": tokens_out,
            "cost": cost,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/compare", methods=["POST"])
def api_compare():
    """Compare GPT-4o vs GPT-4o-mini."""
    data = request.json
    prompt = data.get("prompt", "")

    try:
        result = compare_models(prompt)
        result["gpt4o_latency"] = round(result["gpt4o_latency"], 3)
        result["mini_latency"] = round(result["mini_latency"], 3)
        result["gpt4o_cost_estimate"] = round(result["gpt4o_cost_estimate"], 6)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Part 2 endpoints ──────────────────────────────────────────────────────────

@app.route("/api/chat_system", methods=["POST"])
def api_chat_system():
    """Chat with a system prompt (persona)."""
    data = request.json
    system_prompt = data.get("system_prompt", "")
    user_prompt = data.get("user_prompt", "")
    temperature = float(data.get("temperature", 0.7))
    max_tokens = int(data.get("max_tokens", 256))

    try:
        text, latency = chat_with_system_prompt(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        cost = estimate_cost(system_prompt + "\n" + user_prompt, text)
        return jsonify({
            "response": text,
            "latency": round(latency, 3),
            "cost": cost,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/count_tokens", methods=["POST"])
def api_count_tokens():
    """Count tokens for a text."""
    data = request.json
    text = data.get("text", "")
    model = data.get("model", OPENAI_MODEL)
    try:
        n = count_tokens(text, model)
        return jsonify({"tokens": n, "characters": len(text), "words": len(text.split())})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/estimate_cost", methods=["POST"])
def api_estimate_cost():
    """Estimate cost for a prompt+response pair."""
    data = request.json
    prompt = data.get("prompt", "")
    response_text = data.get("response", "")
    model = data.get("model", OPENAI_MODEL)
    try:
        cost = estimate_cost(prompt, response_text, model)
        return jsonify(cost)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Part 3 endpoints ──────────────────────────────────────────────────────────

@app.route("/api/stream", methods=["POST"])
def api_stream():
    """Streaming chat endpoint using Server-Sent Events."""
    data = request.json
    messages = data.get("messages", [])
    model = data.get("model", OPENAI_MODEL)
    temperature = float(data.get("temperature", 0.7))

    def generate():
        from openai import OpenAI
        client = OpenAI(
            api_key=os.getenv("OPENAI_API_KEY"),
            base_url=os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"),
        )
        try:
            stream = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=temperature,
                stream=True,
            )
            for chunk in stream:
                delta = chunk.choices[0].delta.content or ""
                if delta:
                    yield f"data: {json.dumps({'content': delta})}\n\n"
            yield f"data: {json.dumps({'done': True})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ── Temperature explorer ──────────────────────────────────────────────────────

@app.route("/api/temperature_test", methods=["POST"])
def api_temperature_test():
    """Call the same prompt at a specific temperature."""
    data = request.json
    prompt = data.get("prompt", "")
    temperature = float(data.get("temperature", 0.7))
    try:
        text, latency = call_openai(prompt=prompt, temperature=temperature)
        return jsonify({"response": text, "latency": round(latency, 3), "temperature": temperature})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/info", methods=["GET"])
def api_info():
    return jsonify({
        "model": OPENAI_MODEL,
        "mini_model": OPENAI_MINI_MODEL,
        "pricing": PRICING_PER_1K_TOKENS,
    })


if __name__ == "__main__":
    print("\n🚀  Demo server running at http://localhost:5000\n")
    app.run(debug=True, port=5000)
