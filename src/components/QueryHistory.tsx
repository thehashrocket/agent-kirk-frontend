'use client';

import { useEffect, useState } from 'react';

interface Query {
  id: string;
  prompt: string;
  response: string;
  createdAt: string;
}

export default function QueryHistory() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchQueries = async () => {
      try {
        const res = await fetch('/api/llm/history');
        if (!res.ok) {
          throw new Error('Failed to fetch queries');
        }
        const data = await res.json();
        setQueries(data);
      } catch (err) {
        setError('Failed to load query history');
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQueries();
  }, []);

  if (isLoading) {
    return <div className="text-center">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Your Query History</h2>
      {queries.length === 0 ? (
        <p className="text-gray-500">No queries yet</p>
      ) : (
        <div className="space-y-4">
          {queries.map((query) => (
            <div key={query.id} className="p-4 bg-white rounded-lg shadow">
              <div className="mb-2">
                <span className="text-sm text-gray-500">
                  {new Date(query.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="mb-3">
                <h3 className="text-md font-medium">Prompt:</h3>
                <p className="text-gray-700">{query.prompt}</p>
              </div>
              <div>
                <h3 className="text-md font-medium">Response:</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{query.response}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 