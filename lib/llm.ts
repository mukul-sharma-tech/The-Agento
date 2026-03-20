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
      model: "llama3-70b-8192",
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
 * Generate embeddings via Ollama. Returns [] if unavailable (caller handles gracefully).
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const url = process.env.OLLAMA_URL || "http://localhost:11434";
  const model = process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text";

  try {
    const res = await fetch(`${url}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: text }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) throw new Error(`Embed error: ${res.status}`);
    const data = await res.json();
    return data.embedding || [];
  } catch (err) {
    console.warn("[Embed] Ollama embedding unavailable:", (err as Error).message);
    return [];
  }
}
