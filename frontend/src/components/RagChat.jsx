import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

// ── Icons ─────────────────────────────────────────────────────────────────────

function SendIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function BotIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      <line x1="12" y1="3" x2="12" y2="7" />
      <circle cx="9" cy="16" r="1" fill="currentColor" />
      <circle cx="15" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

// ── Typing Indicator ──────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 msg-animate">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
        <BotIcon className="w-4 h-4 text-white" />
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-indigo-400 dot-1 inline-block" />
        <span className="w-2 h-2 rounded-full bg-indigo-400 dot-2 inline-block" />
        <span className="w-2 h-2 rounded-full bg-indigo-400 dot-3 inline-block" />
      </div>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';

  if (isUser) {
    return (
      <div className="flex items-end justify-end gap-3 msg-animate">
        <div className="max-w-[75%] bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed shadow-lg">
          {message.text}
        </div>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-xs font-semibold text-gray-300 uppercase">
          U
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-start gap-3 msg-animate">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-900 border border-red-700 flex items-center justify-center">
          <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="max-w-[75%] bg-red-950 border border-red-800 text-red-300 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed">
          {message.text}
        </div>
      </div>
    );
  }

  // AI message
  return (
    <div className="flex items-start gap-3 msg-animate">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shadow-md">
        <BotIcon className="w-4 h-4 text-white" />
      </div>
      <div className="max-w-[75%] bg-gray-800 border border-gray-700 text-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed shadow">
        {message.text}
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 select-none px-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
        <BotIcon className="w-8 h-8 text-indigo-400" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-200 mb-1">Company Knowledge Assistant</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          Ask anything about company policies, benefits, processes, or documentation.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md mt-2">
        {[
          'How many days off do employees get?',
          'What is the remote work policy?',
          'How do I submit an expense report?',
          'What are the core working hours?',
        ].map((prompt) => (
          <div
            key={prompt}
            className="px-3 py-2 rounded-xl bg-gray-800/60 border border-gray-700/60 text-xs text-gray-400 cursor-default hover:border-indigo-500/50 hover:text-gray-300 transition-colors"
          >
            "{prompt}"
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

/**
 * RagChat
 *
 * A self-contained enterprise RAG chat component.
 *
 * Props:
 *  - getToken {() => string | null}  – optional token getter; defaults to
 *    localStorage.getItem('token')
 *  - apiUrl   {string}               – optional override for the chat endpoint;
 *    defaults to '/api/ai/chat' (proxied by Vite to the Express backend)
 */
export default function RagChat({
  getToken = () => localStorage.getItem('token'),
  apiUrl = '/api/ai/chat',
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea up to 5 rows (~120px)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const canSubmit = input.trim().length > 0 && !isLoading;

  const appendMessage = (role, text) =>
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), role, text }]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const question = input.trim();
    if (!question || isLoading) return;

    // Append the user message immediately for instant feedback
    appendMessage('user', question);
    setInput('');
    setIsLoading(true);

    try {
      const token = getToken();

      const response = await axios.post(
        apiUrl,
        { question },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const answer = response.data?.answer ?? 'No answer returned from the service.';
      appendMessage('ai', answer);
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        appendMessage(
          'error',
          'Error connecting to AI service: session expired or unauthorized. Please log in again.'
        );
      } else {
        appendMessage('error', 'Error connecting to AI service. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Submit on Enter; Shift+Enter inserts a newline
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      id="rag-chat-root"
      className="flex flex-col h-screen bg-[#0f1117] text-gray-100"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Header ── */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-4 border-b border-gray-800 bg-[#0f1117]/80 backdrop-blur-sm">
        <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg">
          <BotIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-gray-100 leading-none">
            Company Knowledge Assistant
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Powered by RAG · Internal use only</p>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Online</span>
        </div>
      </header>

      {/* ── Messages ── */}
      <div
        id="rag-chat-messages"
        className="flex-1 overflow-y-auto chat-scroll px-4 py-6"
      >
        {messages.length === 0 && !isLoading ? (
          <EmptyState />
        ) : (
          <div className="max-w-3xl mx-auto flex flex-col gap-5">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input Bar ── */}
      <div className="flex-shrink-0 px-4 pb-5 pt-3 border-t border-gray-800 bg-[#0f1117]/80 backdrop-blur-sm">
        <form
          id="rag-chat-form"
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-end gap-3 bg-gray-800 border border-gray-700 rounded-2xl px-4 py-3 shadow-xl focus-within:border-indigo-500/70 transition-colors"
        >
          <textarea
            id="rag-chat-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about company policies…"
            rows={1}
            disabled={isLoading}
            aria-label="Chat input"
            className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-100 placeholder-gray-500 leading-relaxed disabled:opacity-50"
            style={{ maxHeight: '120px' }}
          />
          <button
            id="rag-chat-submit"
            type="submit"
            disabled={!canSubmit}
            aria-label="Send message"
            className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 ${
              canSubmit
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md hover:shadow-indigo-500/30 active:scale-95'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </form>
        <p className="text-center text-xs text-gray-600 mt-2">
          Press{' '}
          <kbd className="px-1 py-0.5 rounded bg-gray-700 text-gray-400 text-[10px]">Enter</kbd>{' '}
          to send ·{' '}
          <kbd className="px-1 py-0.5 rounded bg-gray-700 text-gray-400 text-[10px]">
            Shift+Enter
          </kbd>{' '}
          for new line
        </p>
      </div>
    </div>
  );
}
