import { useState } from 'react';

export default function ChatMessage({ role, content, sources, createdAt }) {
  const [showSources, setShowSources] = useState(false);
  const isUser = role === 'user';

  const formattedTime = createdAt
    ? new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} msg-animate`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? 'bg-indigo-600 text-white rounded-br-md shadow-md'
            : 'bg-[#1e2030] text-gray-200 border border-gray-800 rounded-bl-md shadow'
        }`}
      >
        {/* Message text */}
        <p className="whitespace-pre-wrap">{content}</p>

        {/* Footer: Timestamp and Citation Badge */}
        <div className="flex items-center gap-2 mt-2 pt-1 border-t border-white/10 text-xs">
          {formattedTime && (
            <span className={isUser ? 'text-indigo-200 text-[11px]' : 'text-gray-500 text-[11px]'}>
              {formattedTime}
            </span>
          )}

          {/* Citation badge on AI messages */}
          {!isUser && sources && sources.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSources((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 transition-colors cursor-pointer"
            >
              <span>📄</span>
              <span>{sources.length} {sources.length === 1 ? 'source' : 'sources'}</span>
              <span
                className={`inline-block text-[9px] transition-transform duration-200 ${
                  showSources ? 'rotate-90' : ''
                }`}
              >
                ▶
              </span>
            </button>
          )}
        </div>

        {/* Collapsible Sources panel (AI messages only) */}
        {!isUser && sources && sources.length > 0 && showSources && (
          <div className="mt-3 pt-2 border-t border-gray-700/80">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Sources & Citations
            </p>
            <ul className="space-y-2">
              {sources.map((src, idx) => {
                const snippetRaw = src.contentSnippet || src.content || src.snippet || '';
                const snippet = snippetRaw.length > 150 ? snippetRaw.slice(0, 150) + '…' : snippetRaw;
                const rawScore = src.similarityScore ?? src.score;
                let scoreDisplay = null;
                if (rawScore != null && !isNaN(rawScore)) {
                  const pct = Math.round(rawScore <= 1 ? rawScore * 100 : rawScore);
                  scoreDisplay = `${pct}% match`;
                }

                return (
                  <li
                    key={idx}
                    className="bg-[#0f1117] rounded-lg p-3 text-xs text-gray-400 border border-gray-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong className="font-semibold text-gray-200 truncate">
                        {src.documentName || 'Unknown document'}
                      </strong>
                      {scoreDisplay && (
                        <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex-shrink-0">
                          {scoreDisplay}
                        </span>
                      )}
                    </div>
                    {snippet && (
                      <p className="text-gray-300/90 leading-relaxed font-sans">
                        {snippet}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
