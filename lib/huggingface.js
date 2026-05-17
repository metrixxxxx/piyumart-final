// lib/huggingface.js
import { HfInference } from '@huggingface/inference';

if (!process.env.HF_API_KEY) {
  throw new Error('Missing HF_API_KEY in environment variables');
}

export const hf = new HfInference(process.env.HF_API_KEY);

export async function withRetry(fn, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const is503 = err?.message?.includes('503') || err?.status === 503;
      if (is503 && i < retries - 1) {
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries reached');
}