import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { askQuestion, getChatHistory } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ChatMessage from '../components/ChatMessage';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [historyLoading, setHistoryLoading] = useState(true);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Load chat history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await getChatHistory();
        // The backend may return { conversations, messages } or an array
        const history = Array.isArray(data) ? data : data.messages || data.conversations || [];
        
        // Flatten history into our message format
        const mapped = [];
        for (const item of history) {
          if (item.question || item.userMessage) {
            mapped.push({
              role: 'user',
              content: item.question || item.userMessage,
            });
          }
          if (item.answer || item.aiMessage || item.response) {
            mapped.push({
              role: 'assistant',
              content: item.answer || item.aiMessage || item.response,
              sources: item.sources || [],
            });
          }
        }
        setMessages(mapped);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
          navigate('/login');
          return;
        }
        // Silently fail on history load — user can still chat
        console.error('Failed to load chat history:', err);
      } finally {
        setHistoryLoading(false);
      }
    }
    loadHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSend(e) {
    e.preventDefault();
    const question = input.trim();
    if (!question || loading) return;

    setError('');
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setLoading(true);

    try {
      const data = await askQuestion(question);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          sources: data.sources || [],
        },
      ]);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate('/login');
        return;
      }
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Failed to get a response. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f1117]">
      <Navbar />

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {historyLoading && (
            <p className="text-center text-gray-500 text-sm py-8">Loading history…</p>
          )}

          {!historyLoading && messages.length === 0 && (
            <div className="text-center py-20">
              <p className="text-4xl mb-3">📚</p>
              <p className="text-gray-400 text-lg font-medium">
                Company Knowledge Assistant
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Ask anything about your company documents
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <ChatMessage
              key={idx}
              role={msg.role}
              content={msg.content}
              sources={msg.sources}
            />
          ))}

          {/* Thinking indicator */}
          {loading && (
            <div className="flex justify-start msg-animate">
              <div className="bg-[#1e2030] border border-gray-800 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full dot-1"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full dot-2"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full dot-3"></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4">
          <div className="max-w-3xl mx-auto mb-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-2 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300 ml-3">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="border-t border-gray-800 bg-[#0f1117] px-4 py-4">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            disabled={loading}
            className="flex-1 rounded-xl bg-[#1e2030] border border-gray-700 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
