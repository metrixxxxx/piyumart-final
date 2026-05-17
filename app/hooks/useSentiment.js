// hooks/useSentiment.js
import { useState } from 'react';

export function useSentiment() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyze = async (text) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error('Request failed');

      const data = await res.json();
      setResult(data.result[0]);
    } catch (err) {
      setError('Failed to analyze sentiment');
    } finally {
      setLoading(false);
    }
  };

  return { analyze, result, loading, error };
}