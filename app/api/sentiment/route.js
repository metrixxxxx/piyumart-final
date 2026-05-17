// app/api/sentiment/route.js
import { NextResponse } from 'next/server';
import { hf } from '@/lib/huggingface';

export async function POST(req) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const result = await hf.textClassification({
      model: 'distilbert-base-uncased-finetuned-sst-2-english',
      inputs: text,
    });

    return NextResponse.json({ result });

  } catch (error) {
    console.error('[Sentiment Error]', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}