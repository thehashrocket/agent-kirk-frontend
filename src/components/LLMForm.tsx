/**
 * @file src/components/LLMForm.tsx
 * AI Assistant interaction form component that provides a user interface for asking questions
 * and receiving responses from an LLM (Language Learning Model).
 * Built as a Client Component using Next.js App Router.
 * 
 * Features:
 * - Question submission interface
 * - Real-time response display
 * - Loading states
 * - Error handling
 * - Responsive design
 */

'use client';

import { useState } from 'react';

/**
 * @component LLMForm
 * Client Component that provides an interface for interacting with an AI assistant.
 * 
 * Features:
 * - Text area for question input
 * - Form validation
 * - Loading state indication
 * - Error message display
 * - Response formatting with whitespace preservation
 * 
 * API Integration:
 * - POST requests to /api/llm/ask
 * - JSON payload with prompt
 * - Error handling for failed requests
 * 
 * States:
 * - prompt: Current question text
 * - response: AI assistant's response
 * - isLoading: Form submission status
 * - error: Error message if request fails
 */
export default function LLMForm() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Handles form submission by sending the prompt to the LLM API
   * and managing the response/error states.
   * @param {React.FormEvent} e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/llm/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response');
      }

      const data = await res.json();
      setResponse(data.response);
    } catch (err) {
      setError('Failed to get response. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Ask AI Assistant</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
            Your question
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            rows={4}
            placeholder="Enter your question here..."
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Thinking...' : 'Submit'}
        </button>
      </form>

      {error && (
        <div className="mt-4 text-red-600">
          {error}
        </div>
      )}

      {response && (
        <div className="mt-4">
          <h3 className="text-lg font-medium text-gray-900">Response:</h3>
          <div className="mt-2 p-4 bg-gray-50 rounded-md">
            <p className="whitespace-pre-wrap">{response}</p>
          </div>
        </div>
      )}
    </div>
  );
} 