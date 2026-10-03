import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getConversations,
  createConversation,
  getConversationMessages,
  deleteConversation,
  askQuestionInConversation,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import ChatMessage from '../components/ChatMessage';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

const MAX_CHARS = 1000;

export default function ChatPage() {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const { logout } = useAuth();
  const navigate = useNavigate();
  const { toasts, remove, toastSuccess, toastError } = useToast();

  const charCount = input.length;
  const overLimit = charCount > MAX_CHARS;
  const canSend = !loading && !messagesLoading && input.trim() && !overLimit;

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Load conversations on mount
  useEffect(() => {
    async function loadData() {
      try {
        const convs = await getConversations();
        setConversations(convs);
        if (convs.length > 0) {
          setActiveConversationId(convs[0].id);
        } else {
          // If no conversations exist, auto-create one
          const newConv = await createConversation();
          setConversations([newConv]);
          setActiveConversationId(newConv.id);
        }
      } catch (err) {
        // 401 is handled globally by the axios interceptor
        if (err.response?.status !== 401) {
          console.error('Failed to load conversations:', err);
          toastError('Failed to load conversations.');
        }
      } finally {
        setInitialLoading(false);
      }
    }
    loadData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load messages when activeConversationId changes
  useEffect(() => {
    async function fetchMessages() {
      if (!activeConversationId) return;
      setMessagesLoading(true);
      try {
        const data = await getConversationMessages(activeConversationId);
        const history = Array.isArray(data) ? data : data.messages || [];

        const mapped = [];
        for (const item of history) {
          if (item.role && item.content) {
            mapped.push({
              id: item.id,
              role: item.role === 'assistant' ? 'ai' : item.role,
              content: item.content,
              createdAt: item.createdAt,
              sources: item.sources || [],
            });
          }
        }
        setMessages(mapped);
      } catch (err) {
        if (err.response?.status !== 401) {
          toastError('Failed to load messages for this conversation.');
        }
      } finally {
        setMessagesLoading(false);
      }
    }

    fetchMessages();
  }, [activeConversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleNewChat() {
    try {
      const newConv = await createConversation();
      setConversations([newConv, ...conversations]);
      setActiveConversationId(newConv.id);
    } catch (err) {
      toastError('Failed to create a new chat.');
    }
  }

  async function handleDeleteChat(id, e) {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this chat?')) return;

    try {
      await deleteConversation(id);
      const updatedConvs = conversations.filter((c) => c.id !== id);
      setConversations(updatedConvs);
      toastSuccess('Chat deleted.');

      if (activeConversationId === id) {
        if (updatedConvs.length > 0) {
          setActiveConversationId(updatedConvs[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      toastError('Failed to delete chat.');
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const question = input.trim();
    if (!canSend || !question || !activeConversationId) return;

    setInput('');
    const now = new Date().toISOString();

    // Optimistic UI for user message
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: question,
        createdAt: now,
      },
    ]);
    setLoading(true);

    try {
      const data = await askQuestionInConversation(activeConversationId, question);

      // Add AI response
      setMessages((prev) => [
        ...prev,
        {
          id: data.messageId || `ai-${Date.now()}`,
          role: 'ai',
          content: data.answer,
          sources: data.sources || [],
          createdAt: data.createdAt || new Date().toISOString(),
        },
      ]);

      // Refetch conversations to get updated title in sidebar
      const updatedConvs = await getConversations();
      setConversations(updatedConvs);
    } catch (err) {
      if (err.response?.status !== 401) {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          'Failed to get a response. Please try again.';
        toastError(msg);
      }
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  if (initialLoading) {
    return (
      <div className="flex h-screen bg-[#0f1117] items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0f1117] text-white">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-[#161821] border-r border-gray-800 flex flex-col flex-shrink-0">
          <div className="p-4">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1 chat-scroll">
            {conversations.length === 0 ? (
              <p className="text-gray-600 text-xs text-center px-3 py-6">
                No chats yet. Start a new conversation above.
              </p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    activeConversationId === conv.id ? 'bg-[#252836]' : 'hover:bg-[#1e202c]'
                  }`}
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                    <span className="truncate text-sm font-medium text-gray-300">
                      {conv.title || 'New Conversation'}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDeleteChat(conv.id, e)}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="Delete chat"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Chat messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-4 py-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {messagesLoading ? (
                <div className="flex justify-center py-10">
                  <span className="w-2 h-2 bg-gray-400 rounded-full dot-1 mx-1"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full dot-2 mx-1"></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full dot-3 mx-1"></span>
                </div>
              ) : messages.length === 0 ? (
                // ── Empty State ──────────────────────────────────────────────
                <div className="text-center py-20">
                  <p className="text-4xl mb-3">📚</p>
                  <p className="text-gray-300 text-lg font-medium">No messages yet.</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Ask your first question below.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <ChatMessage
                    key={msg.id || idx}
                    role={msg.role}
                    content={msg.content}
                    sources={msg.sources}
                    createdAt={msg.createdAt}
                  />
                ))
              )}

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

          {/* Input area */}
          <div className="border-t border-gray-800 bg-[#0f1117] px-4 pt-3 pb-4">
            <form onSubmit={handleSend} className="max-w-3xl mx-auto">
              <div className="flex gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message Company Assistant..."
                  disabled={loading || messagesLoading}
                  className="flex-1 rounded-xl bg-[#1e2030] border border-gray-700 text-white px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-500 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
              {/* Character counter */}
              <div className="flex justify-end mt-1.5 pr-1">
                <span className={`text-xs ${overLimit ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                  {charCount} / {MAX_CHARS}
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Toast notifications */}
      <Toast toasts={toasts} remove={remove} />
    </div>
  );
}
