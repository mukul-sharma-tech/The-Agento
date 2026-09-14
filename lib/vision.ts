/**
 * Shared OCR and Vision LLM helpers.
 * Designed to integrate seamlessly with Ollama's multimodal capabilities.
 */

// ── Ollama Vision (Local / Air-gapped) ────────────────────────────────────────

/**
 * Core function to call Ollama with an image for OCR and visual reasoning.
 */
async function _callOllamaVision(
  prompt: string, 
  base64Image: string, 
  timeoutMs = 120000
): Promise<string> {
  const url = process.env.OLLAMA_URL || "http://localhost:11434";
  // Auto-route to a vision-capable open-weight model
  const model = process.env.OLLAMA_VISION_MODEL || "llama3.2-vision"; 

  const res = await fetch(`${url}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      model, 
      prompt, 
      images: [base64Image],
      stream: false, 
      options: { 
        temperature: 0.1, // Low temp for highly accurate OCR/data extraction
        top_p: 0.9 
      } 
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama Vision error ${res.status}: ${errText}`);
  }
  
  const data = await res.json();
  return data.response || "";
}

// ── Public: extractTextFromImage ──────────────────────────────────────────────

/**
 * Basic OCR: Extracts raw text from scanned documents, handwritten notes, 
 * or engineering drawings.
 */
export async function extractTextFromImage(base64Image: string): Promise<string> {
  const prompt = `You are a highly precise OCR system. 
Please extract all text from this image exactly as it appears. 
Preserve formatting, line breaks, and indentation where possible. 
Do not add any commentary or explanation.`;

  try {
    const result = await _callOllamaVision(prompt, base64Image);
    console.log("[OCR] Text successfully extracted via Ollama");
    return result.trim();
  } catch (err) {
    console.error("[OCR] Extraction failed:", (err as Error).message);
    throw err;
  }
}

// ── Public: analyzeImageForAnalytics ──────────────────────────────────────────

/**
 * Advanced Vision Analytics: Extracts structured data (JSON) from 
 * inspection reports, financials, or complex charts for use in Query Genius.
 */
export async function analyzeImageForAnalytics(
  base64Image: string, 
  context: string = "general data"
): Promise<any> {
  const prompt = `You are an expert data analyst and OCR system. 
Analyze the provided image containing ${context}. 
Extract the key data points, measurements, tables, and findings into a strictly formatted JSON object. 
Ensure the JSON is valid, flat, and uses snake_case for keys.
Do not wrap the response in markdown code blocks, return raw JSON only.`;

  try {
    const result = await _callOllamaVision(prompt, base64Image, 180000); // 3 min timeout for heavy analysis
    console.log("[OCR-Analytics] Structured data successfully extracted");
    
    // Clean up potential markdown formatting
    const cleanedResult = result.replace(/^```(?:json)?\n?/i, '').replace(/```$/i, '').trim();
    
    return JSON.parse(cleanedResult);
  } catch (err) {
    console.error("[OCR-Analytics] Analytics extraction failed:", (err as Error).message);
    throw err;
  }
}
