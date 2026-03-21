/**
 * Shared LLM + embedding helpers.
 * Priority: Ollama (local) → Groq_API_1 → Groq_API_2 → Groq_API_3
 */

// ── Ollama ────────────────────────────────────────────────────────────────────

async function _callOllama(prompt: string, timeoutMs = 60000): Promise<string> {
  const url = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_MODEL || "gpt-oss:120b-cloud";

  const res = await fetch(`${url}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false, options: { temperature: 0.1, top_p: 0.9 } }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
  const data = await res.json();
  return data.response || "";
}

// ── Groq ──────────────────────────────────────────────────────────────────────

async function _callGroq(apiKey: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 2048,
    }),
  });

  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ── Public: callLLM ───────────────────────────────────────────────────────────

/**
 * Try Ollama first; on failure cascade through Groq keys.
 * Pass a higher timeoutMs for heavy prompts (e.g. analytics).
 */
export async function callLLM(prompt: string, timeoutMs = 60000): Promise<string> {
  try {
    const result = await _callOllama(prompt, timeoutMs);
    console.log("[LLM] Ollama responded");
    return result;
  } catch (err) {
    console.warn("[LLM] Ollama unavailable, trying Groq:", (err as Error).message);
  }

  const keys = [
    process.env.Groq_API_1,
    process.env.Groq_API_2,
    process.env.Groq_API_3,
  ].filter(Boolean) as string[];

  console.log(`[LLM] Groq keys available: ${keys.length}`);

  for (let i = 0; i < keys.length; i++) {
    try {
      const result = await _callGroq(keys[i], prompt);
      console.log(`[LLM] Groq key ${i + 1} responded`);
      return result;
    } catch (err) {
      console.warn(`[LLM] Groq key ${i + 1} failed:`, (err as Error).message);
    }
  }
  throw new Error("All LLM providers failed");
}

// ── Public: getEmbedding ──────────────────────────────────────────────────────

/**
 * Generate embeddings.
 * Local:  Ollama (nomic-embed-text)       → 768-dim
 * Cloud:  HuggingFace (all-MiniLM-L6-v2) → 384-dim
 *
 * Returns { embedding, model } so callers can store the model name
 * alongside the vector and filter by it at query time.
 * Returns { embedding: [], model: "" } if both providers fail.
 */
export async function getEmbedding(text: string): Promise<{ embedding: number[]; model: string }> {
  // ── Try Ollama first ──────────────────────────────────────────────────────
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";

  try {
    const res = await fetch(`${ollamaUrl}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: ollamaModel, prompt: text }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Ollama embed error: ${res.status}`);
    const data = await res.json();
    if (data.embedding?.length) {
      console.log(`[Embed] Ollama responded (${data.embedding.length} dims)`);
      return { embedding: data.embedding, model: ollamaModel };
    }
    throw new Error("Empty embedding from Ollama");
  } catch (err) {
    console.warn("[Embed] Ollama unavailable, trying HuggingFace:", (err as Error).message);
  }

  // ── Fallback: HuggingFace Inference API ──────────────────────────────────
  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    console.warn("[Embed] HF_TOKEN not set — embedding unavailable");
    return { embedding: [], model: "" };
  }

  try {
    const { HfInference } = await import("@huggingface/inference");
    const hf = new HfInference(hfToken);
    const hfModel = process.env.HF_EMBEDDING_MODEL || "sentence-transformers/all-MiniLM-L6-v2";
    const result = await hf.featureExtraction({ model: hfModel, inputs: text });
    const embedding = Array.isArray(result[0]) ? (result as number[][])[0] : (result as number[]);
    console.log(`[Embed] HuggingFace responded (${embedding.length} dims)`);
    return { embedding, model: hfModel };
  } catch (err) {
    console.warn("[Embed] HuggingFace embedding failed:", (err as Error).message);
    return { embedding: [], model: "" };
  }
}
