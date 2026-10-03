import { useState } from 'react';

export default function ChatMessage({ role, content, sources }) {
  const [showSources, setShowSources] = useState(false);
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} msg-animate`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-md'
            : 'bg-[#1e2030] text-gray-200 border border-gray-800 rounded-bl-md'
        }`}
      >
        {/* Message text */}
        <p className="whitespace-pre-wrap">{content}</p>

        {/* Sources toggle (AI messages only) */}
        {!isUser && sources && sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-700">
            <button
              onClick={() => setShowSources((v) => !v)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
            >
              <span className={`inline-block transition-transform ${showSources ? 'rotate-90' : ''}`}>
                ▶
              </span>
              {showSources ? 'Hide' : 'Show'} Sources ({sources.length})
            </button>

            {showSources && (
              <ul className="mt-2 space-y-2">
                {sources.map((src, idx) => (
                  <li
                    key={idx}
                    className="bg-[#0f1117] rounded-lg p-2.5 text-xs text-gray-400 border border-gray-800"
                  >
                    <span className="font-semibold text-gray-300 block mb-0.5">
                      {src.documentName || 'Unknown document'}
                    </span>
                    <span className="line-clamp-3">
                      {src.content || src.snippet || ''}
                    </span>
                    {src.score != null && (
                      <span className="text-[10px] text-gray-500 mt-1 block">
                        Relevance: {(src.score * 100).toFixed(0)}%
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
