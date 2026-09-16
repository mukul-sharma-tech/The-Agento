import { createWorker } from 'tesseract.js';

/**
 * Basic OCR: Extracts raw text from scanned documents using Tesseract.js
 */
export async function extractTextFromImage(base64Image: string): Promise<string> {
  let worker = null;
  try {
    worker = await createWorker('eng');
    
    // Prefix data URI if not present
    let imageSrc = base64Image;
    if (!base64Image.startsWith('data:image')) {
      imageSrc = `data:image/jpeg;base64,${base64Image}`;
    }
    
    const { data: { text } } = await worker.recognize(imageSrc);
    console.log("[OCR] Text successfully extracted via Tesseract.js");
    return text.trim();
  } catch (err) {
    console.error("[OCR] Extraction failed:", (err as Error).message);
    throw err;
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

/**
 * Advanced Vision Analytics: Tesseract cannot natively format output to JSON.
 * We will do our best to extract text and wrap it in a JSON structure.
 * This is a massive downgrade from Ollama Vision as requested.
 */
export async function analyzeImageForAnalytics(
  base64Image: string, 
  context: string = "general data"
): Promise<any> {
  try {
    const rawText = await extractTextFromImage(base64Image);
    
    // Tesseract just gives raw text. We have to fake the JSON structure 
    // since we can't reliably parse tables with basic OCR.
    const result = {
      context: context,
      extracted_raw_text: rawText,
      warning: "Extracted via Tesseract. Table structure and layout are likely lost.",
      data_points: rawText.split('\n').filter(line => line.trim().length > 0)
    };
    
    console.log("[OCR-Analytics] Tesseract basic extraction completed");
    return result;
  } catch (err) {
    console.error("[OCR-Analytics] Analytics extraction failed:", (err as Error).message);
    throw err;
  }
}
