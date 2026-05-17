// components/SentimentAnalyzer.jsx
'use client';
import { useState } from 'react';
import { useSentiment } from '@/hooks/useSentiment';

export default function SentimentAnalyzer() {
  const [text, setText] = useState('');
  const { analyze, result, loading, error } = useSentiment();

  return (
    <div className="p-6 max-w-lg mx-auto">
      <textarea
        className="w-full border rounded p-3 text-sm"
        rows={4}
        placeholder="Enter text to analyze..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={() => analyze(text)}
        disabled={loading || !text.trim()}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}

      {result && (
        <div className="mt-4 p-4 rounded border">
          <p className="font-semibold">
            {result.label === 'POSITIVE' ? '😊 Positive' : '😞 Negative'}
          </p>
          <p className="text-sm text-gray-500">
            Confidence: {(result.score * 100).toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
}