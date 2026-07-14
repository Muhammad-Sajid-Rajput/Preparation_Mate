import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bot } from 'lucide-react';
import { getSessions, createSession, deleteSession, sendMessage } from '../../api/chatApi';
import * as notesApi from '../../api/notesApi';
import { handleApiError } from '../../utils/handleApiError';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/layout/PageHeader';

const normalizeMessages = (backendMessages) => {
  if (!backendMessages) return [];
  return backendMessages.map((msg) => ({
    id: msg._id || msg.id || `msg-${Date.now()}-${Math.random()}`,
    sender: msg.role === 'user' ? 'user' : 'bot',
    text: msg.content || '',
    timestamp: msg.createdAt || msg.timestamp || new Date().toISOString(),
    sources: msg.sources || [],
    isError: msg.isError || false,
    isStreaming: false,
  }));
};

const parseInlineStyles = (text) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-primary">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const renderFormattedText = (text) => {
  if (!text) return null;

  // Split content by code block markers (```lang ... ```)
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, pIdx) => {
    // If it's a code block
    if (part.startsWith('```') && part.endsWith('```')) {
      const content = part.slice(3, -3);
      // Try to match the language prefix (e.g. javascript, html, python, etc.) followed by a newline
      const match = content.match(/^([a-zA-Z0-9+#-]+)\n/);
      const language = match ? match[1] : '';
      const code = match ? content.slice(match[0].length) : content;

      return (
        <div key={pIdx} className="my-3 rounded-lg overflow-hidden border border-outline bg-slate-950 shadow-inner font-mono text-[11px] text-slate-200">
          {language && (
            <div className="bg-slate-900 px-4 py-1.5 text-[10px] text-slate-400 font-sans border-b border-slate-800 flex justify-between items-center select-none">
              <span>{language}</span>
            </div>
          )}
          <pre className="p-4 overflow-x-auto whitespace-pre leading-relaxed select-text">
            <code>{code}</code>
          </pre>
        </div>
      );
    }

    // Otherwise, parse standard paragraphs, headings and lists
    const subParagraphs = part.split('\n\n');
    return subParagraphs.map((para, spIdx) => {
      const trimmed = para.trim();
      if (!trimmed) return null;

      const key = `${pIdx}-${spIdx}`;

      // Headers (### Heading, ## Heading, # Heading)
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={key} className="text-xs font-bold text-primary mt-3.5 mb-1.5 uppercase tracking-wide">
            {parseInlineStyles(trimmed.slice(4))}
          </h4>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h3 key={key} className="text-sm font-bold text-primary mt-4 mb-2">
            {parseInlineStyles(trimmed.slice(3))}
          </h3>
        );
      }
      if (trimmed.startsWith('# ')) {
        return (
          <h2 key={key} className="text-base font-bold text-primary mt-5 mb-2.5">
            {parseInlineStyles(trimmed.slice(2))}
          </h2>
        );
      }

      // Bullet lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const lines = para.split('\n');
        return (
          <ul key={key} className="list-disc pl-5 space-y-1.5 my-2.5">
            {lines.map((line, lIdx) => {
              const cleanLine = line.replace(/^[-*]\s+/, '');
              return <li key={lIdx}>{parseInlineStyles(cleanLine)}</li>;
            })}
          </ul>
        );
      }

      // Normal paragraph
      return (
        <p key={key} className="mb-2 last:mb-0 leading-relaxed">
          {parseInlineStyles(para)}
        </p>
      );
    });
  });
};

const AIAssistant = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { noteId, noteTitle, topic } = location.state || {};

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contextNote, setContextNote] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Notes dropdown list for Context Switcher
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [showNotePicker, setShowNotePicker] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const notePickerRef = useRef(null);
  const clickedSessionIdRef = useRef(null);

  // Close note context picker when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notePickerRef.current && !notePickerRef.current.contains(event.target)) {
        setShowNotePicker(false);
      }
    };
    if (showNotePicker) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotePicker]);

  // Auto-resize textarea as content changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      if (!input) {
        textarea.style.height = '36px';
      } else {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
      }
    }
  }, [input]);

  // Fetch all notes on mount to support note context resolving and context switcher
  useEffect(() => {
    setLoadingNotes(true);
    notesApi.getNotes()
      .then((data) => {
        setNotes(data || []);
      })
      .catch(() => {})
      .finally(() => {
        setLoadingNotes(false);
      });
  }, []);

  // Initialize and resolve context note from router state
  useEffect(() => {
    if (noteId) {
      let resolvedTitle = noteTitle;
      if (!resolvedTitle && notes.length > 0) {
        const match = notes.find((n) => String(n.id) === String(noteId));
        if (match) {
          resolvedTitle = match.title;
        }
      }
      setContextNote({ id: noteId, title: resolvedTitle || 'Linked Note' });
    }
  }, [noteId, noteTitle, notes]);

  // Pre-populate input prompt if a topic context is provided
  useEffect(() => {
    if (topic) {
      setInput(`Can you explain the topic "${topic}" from my notes?`);
    }
  }, [topic]);

  // Fetch sessions on mount
  const fetchSessions = useCallback(async (noteId = null) => {
    try {
      setSessionsLoading(true);
      setError(null);
      const data = await getSessions(noteId);
      const normalizedData = (data || []).map((s) => ({
        ...s,
        messages: normalizeMessages(s.messages),
      }));
      setSessions(normalizedData);
      if (normalizedData.length > 0) {
        const targetSessionId = clickedSessionIdRef.current;
        const matchingSession = targetSessionId
          ? normalizedData.find((s) => s.id === targetSessionId)
          : null;

        if (matchingSession) {
          setActiveSession(matchingSession);
          setMessages(matchingSession.messages || []);
        } else {
          setActiveSession(normalizedData[0]);
          setMessages(normalizedData[0].messages || []);
        }
      } else {
        setActiveSession(null);
        setMessages([]);
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSessionsLoading(false);
      clickedSessionIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchSessions(contextNote?.id || null);
  }, [contextNote?.id, fetchSessions]);

  // Fetch notes for switcher on demand
  const loadNotesForPicker = async () => {
    if (notes.length > 0 || loadingNotes) return;
    try {
      setLoadingNotes(true);
      const data = await notesApi.getNotes();
      setNotes(data || []);
    } catch (err) {
      toast.error('Could not load notes picker list.');
    } finally {
      setLoadingNotes(false);
    }
  };

  // Scroll to bottom on new messages or error
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming, errorMessage]);

  // Handle switching active sessions
  const handleSelectSession = (session) => {
    if (isStreaming) return;
    clickedSessionIdRef.current = session.id;
    setActiveSession(session);
    setMessages(session.messages || []);
    setErrorMessage(null);
    if (session.noteId) {
      setContextNote({ id: session.noteId, title: session.noteTitle || 'Linked Note' });
    } else {
      setContextNote(null);
    }
  };

  // Start new conversation session (client-only state reset)
  const handleNewChat = () => {
    if (isStreaming) return;
    setActiveSession(null);
    setMessages([]);
    setErrorMessage(null);
  };

  const handleDeleteSession = (sessionId) => {
    if (isStreaming) return;
    setDeletingSessionId(sessionId);
  };

  const performDeleteSession = async (sessionId) => {
    try {
      await deleteSession(sessionId);
      toast.success('Chat session deleted.');
      
      const updatedSessions = sessions.filter((s) => s.id !== sessionId);
      setSessions(updatedSessions);
      
      if (activeSession?.id === sessionId) {
        if (updatedSessions.length > 0) {
          setActiveSession(updatedSessions[0]);
          setMessages(updatedSessions[0].messages || []);
          if (updatedSessions[0].noteId) {
            setContextNote({ id: updatedSessions[0].noteId, title: updatedSessions[0].noteTitle || 'Linked Note' });
          } else {
            setContextNote(null);
          }
        } else {
          setActiveSession(null);
          setMessages([]);
          setContextNote(null);
        }
      }
    } catch (err) {
      toast.error('Could not delete chat session.');
    }
  };

  // Send message utilizing SSE streaming
  const handleSend = async (overrideText = null, isRetry = false) => {
    if (isStreaming) return;

    let text = '';
    if (isRetry) {
      const userMessages = messages.filter((m) => m.sender === 'user');
      if (userMessages.length === 0) return;
      text = userMessages[userMessages.length - 1].text;
    } else {
      text = (overrideText || input).trim();
      if (!text) return;
    }

    let sessionId = activeSession?.id;

    // Create session if none exists
    if (!sessionId) {
      try {
        const session = await createSession(contextNote?.id || null);
        const normalizedSession = {
          ...session,
          messages: normalizeMessages(session.messages),
        };
        setSessions((prev) => [normalizedSession, ...prev]);
        setActiveSession(normalizedSession);
        sessionId = session.id;
      } catch (err) {
        toast.error('Could not start conversation.');
        return;
      }
    }

    setErrorMessage(null);

    if (!isRetry) {
      const userMsg = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput('');
    }

    setIsStreaming(true);

    const botMsgId = `bot-${Date.now()}`;
    const botMsg = {
      id: botMsgId,
      sender: 'bot',
      text: '',
      timestamp: new Date().toISOString(),
      sources: [],
      isStreaming: true,
    };

    setMessages((prev) => [...prev, botMsg]);

    try {
      const response = await sendMessage(sessionId, text, contextNote?.id || null);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let sources = [];
      let hadError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'text') {
                fullText += parsed.content;
                setMessages((prev) =>
                  prev.map((m) => (m.id === botMsgId ? { ...m, text: fullText } : m))
                );
              }
              if (parsed.type === 'sources') {
                sources = parsed.content;
                setMessages((prev) =>
                  prev.map((m) => (m.id === botMsgId ? { ...m, sources } : m))
                );
              }
              if (parsed.type === 'error') {
                setErrorMessage(parsed.content || 'AI temporarily unavailable. Please try again.');
                setMessages((prev) => prev.filter((m) => m.id !== botMsgId));
                hadError = true;
                break;
              }
            } catch (err) {
              /* ignore malformed JSON chunks */
            }
          }
        }
        if (hadError) break;
      }
    } catch (err) {
      setErrorMessage('Failed to get a response. Please try again.');
      setMessages((prev) => prev.filter((m) => m.id !== botMsgId));
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === botMsgId ? { ...m, isStreaming: false } : m))
      );
      setIsStreaming(false);
      // Refresh sessions history in background to store new messages
      getSessions(contextNote?.id || null).then((data) => {
        if (data) {
          const normalizedData = data.map((s) => ({
            ...s,
            messages: normalizeMessages(s.messages),
          }));
          setSessions(normalizedData);
          const currentSessionUpdated = normalizedData.find((s) => s.id === sessionId);
          if (currentSessionUpdated) {
            setActiveSession(currentSessionUpdated);
          }
        }
      }).catch(() => { });
    }
  };

  const retryLastMessage = () => {
    handleSend(null, true);
  };

  const handleTextareaKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const SUGGESTED_PROMPTS = [
    'Summarize this chapter for me',
    'Quiz me on the key concepts',
    contextNote
      ? `Explain the main topics in ${contextNote.title}`
      : 'What are my weakest topics?',
    'Create a study plan for this material',
  ];

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Page Header */}
      <PageHeader
        icon={Bot}
        title="AI Assistant"
        subtitle="Ask questions about your notes"
      />
      <div className="flex flex-1 min-h-0 bg-surface border border-outline rounded-xl overflow-hidden select-none shadow-[0_20px_50px_rgba(15,82,186,0.04)] animate-fade-up">
        {/* LEFT PANEL: Conversations Sidebar */}
        <aside className="w-[180px] bg-surface-container-low border-r border-outline flex flex-col shrink-0">
          <div className="p-4 flex items-center justify-between border-b border-outline select-none">
            <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">Conversations</h2>
            <Button
              variant="primary"
              size="sm"
              onClick={handleNewChat}
              disabled={isStreaming}
              className="h-[28px] w-[28px] p-0 shadow-md shadow-primary/10 flex items-center justify-center"
              title="New Chat"
            >
              <span className="material-symbols-outlined text-[16px] font-bold">add</span>
            </Button>
          </div>
          {/* Active Context Indicator */}
          <div className="px-4 py-2.5 bg-primary/5 border-b border-outline select-none text-left">
            <p className="text-[9px] font-bold uppercase tracking-wider text-primary">Active Note</p>
            <p className="text-[10px] font-extrabold text-on-surface truncate mt-0.5" title={contextNote ? contextNote.title : 'None'}>
              {contextNote ? contextNote.title : 'None'}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-hide">
            {sessionsLoading ? (
              <p className="text-xs text-secondary p-4 italic font-bold">Loading chats...</p>
            ) : sessions.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-xs text-secondary font-bold italic">No chats right now</p>
              </div>
            ) : (
              sessions.map((conv) => {
                const lastMsgText = conv.messages?.[conv.messages.length - 1]?.text || 'No messages yet';
                const isActive = activeSession?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectSession(conv)}
                    className={`p-3 rounded-lg cursor-pointer transition-all duration-200 text-left border ${isActive
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'hover:bg-surface-container border-transparent text-on-surface-variant'
                      }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold truncate flex-grow pr-2">
                        {conv.noteTitle ? `${conv.noteTitle}` : `Session: ${conv.id.substring(0, 8)}`}
                      </p>
                      {deletingSessionId === conv.id ? (
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              performDeleteSession(conv.id);
                              setDeletingSessionId(null);
                            }}
                            className={`hover:text-green-500 rounded p-0.5 transition-colors shrink-0 flex items-center justify-center -mt-0.5 ${
                              isActive ? 'text-white hover:text-green-300' : 'text-green-600'
                            }`}
                            title="Confirm delete"
                          >
                            <span className="material-symbols-outlined !text-[14px] font-bold">check</span>
                          </button>
                          <button
                            onClick={() => setDeletingSessionId(null)}
                            className={`hover:text-red-500 rounded p-0.5 transition-colors shrink-0 flex items-center justify-center -mt-0.5 ${
                              isActive ? 'text-white hover:text-red-300' : 'text-red-600'
                            }`}
                            title="Cancel delete"
                          >
                            <span className="material-symbols-outlined !text-[14px] font-bold">close</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(conv.id);
                          }}
                          className={`hover:text-red-500 rounded p-0.5 transition-colors shrink-0 flex items-center justify-center -mt-0.5 ${
                            isActive ? 'text-white/70 hover:text-red-200' : 'text-secondary hover:text-red-600'
                          }`}
                          title="Delete chat"
                          disabled={isStreaming}
                        >
                          <span className="material-symbols-outlined !text-[15px]">delete</span>
                        </button>
                      )}
                    </div>
                    <p className={`text-[11px] truncate mt-1 font-semibold ${isActive ? 'text-white/80' : 'text-secondary'}`}>
                      {lastMsgText}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* RIGHT PANEL: Chat Area */}
        <section className="flex-1 flex flex-col bg-surface relative">
          {/* Context Bar */}
          <div className="h-10 bg-surface-container-low border-b border-outline flex items-center px-4 justify-between shrink-0 select-none">
            <div ref={notePickerRef} className="flex items-center gap-2 relative">
              <span className="text-[11px] text-secondary font-bold">Context:</span>
              {contextNote ? (
                <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[13px] shrink-0">description</span>
                  <span className="max-w-[150px] truncate">{contextNote.title}</span>
                  {!isStreaming && (
                    <button
                      onClick={() => setContextNote(null)}
                      className="hover:text-red-500 ml-1 font-bold text-[13px] leading-none"
                    >
                      ×
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-secondary/70 italic font-semibold">None</span>
              )}

              {!isStreaming && (
                <>
                  <button
                    onClick={() => {
                      loadNotesForPicker();
                      setShowNotePicker(!showNotePicker);
                    }}
                    className="text-primary text-[11px] font-bold hover:underline select-none ml-1"
                  >
                    (Change)
                  </button>

                  {showNotePicker && (
                    <div className="absolute top-8 left-0 w-[200px] bg-surface border border-outline rounded-lg shadow-lg p-2 z-10 text-left animate-fade-up">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-primary mb-1 px-2">
                        Select Note
                      </p>
                      {loadingNotes ? (
                        <p className="text-xs text-secondary italic px-2 font-semibold">Loading notes...</p>
                      ) : notes.length === 0 ? (
                        <div className="p-2 text-xs text-secondary font-semibold">
                          No notes found.{' '}
                          <Link to={ROUTES.NOTES} className="text-primary font-bold hover:underline">
                            Upload here
                          </Link>
                        </div>
                      ) : (
                        <div className="max-h-[160px] overflow-y-auto space-y-0.5 scrollbar-hide">
                          {notes.map((n) => (
                            <button
                              key={n.id}
                              onClick={() => {
                                setContextNote({ id: n.id, title: n.title });
                                setShowNotePicker(false);
                              }}
                              className="w-full text-left p-1.5 text-xs font-semibold hover:bg-surface-container text-on-surface rounded transition-colors truncate"
                            >
                              {n.title}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Messages Stream */}
          <div className={`flex-1 p-6 space-y-6 scrollbar-hide ${
            messages.length === 0 ? 'overflow-hidden flex flex-col justify-center' : 'overflow-y-auto'
          }`}>
            {messages.length === 0 ? (
              /* Suggested prompts */
              <div className="flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-4 py-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    smart_toy
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-primary uppercase tracking-wider">AI Copilot Chat</h3>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed font-semibold">
                    Select a prompt to begin learning:
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="p-2.5 bg-white border border-outline hover:border-primary hover:bg-primary-fixed/30 rounded-xl transition-all duration-200 text-[11px] font-bold text-on-surface-variant shadow-sm select-none active:scale-[0.98] flex items-center text-left"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isLoading = msg.isStreaming && !msg.text;

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm shadow-primary/20">
                          <span
                            className="material-symbols-outlined text-white text-lg"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            smart_toy
                          </span>
                        </div>
                      )}

                      <div className="max-w-[75%] space-y-2 text-left animate-fade-up">
                        <div
                          className={`p-4 rounded-2xl shadow-sm leading-relaxed text-xs font-semibold ${isUser
                              ? 'bg-primary text-white rounded-tr-none'
                              : 'bg-surface-container-low border border-outline text-on-surface rounded-tl-none'
                            } ${msg.isError ? 'border-red-500 bg-red-100/70 text-red-950' : ''}`}
                        >
                          {isLoading ? (
                            /* Streaming Indicator */
                            <div className="flex gap-1.5 items-center h-5 py-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-primary typing-dot" style={{ animationDelay: '0s' }}></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-primary typing-dot" style={{ animationDelay: '0.2s' }}></div>
                              <div className="w-2.5 h-2.5 rounded-full bg-primary typing-dot" style={{ animationDelay: '0.4s' }}></div>
                            </div>
                          ) : (
                            renderFormattedText(msg.text)
                          )}
                        </div>

                        {/* Sources footers */}
                        {!isUser && msg.sources && msg.sources.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            {msg.sources.map((src, sIdx) => (
                              <div
                                key={sIdx}
                                onClick={() =>
                                  navigate(ROUTES.NOTE_DETAIL.replace(':id', src.noteId))
                                }
                                className="flex items-center gap-1 px-3 py-1 bg-surface-container border border-outline hover:border-primary/40 hover:bg-surface-container-high text-primary rounded-full text-[10px] w-fit font-bold cursor-pointer transition-all shadow-sm"
                              >
                                <span className="material-symbols-outlined text-[13px] shrink-0 text-primary">
                                  link
                                </span>
                                <span className="truncate max-w-[120px]">
                                  {src.title} · p.{src.page}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <div className="w-8 h-8 rounded-full bg-surface-container border border-outline flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-lg text-primary">person</span>
                        </div>
                      )}
                    </div>
                  );
                })}
                {errorMessage && (
                  <div className="flex items-center justify-between gap-3 p-4 bg-[#FEE2E2] border border-[#FEE2E2]/50 text-[#BA1A1A] rounded-xl text-xs font-semibold animate-fade-up max-w-2xl mt-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">error</span>
                      <span>{errorMessage}</span>
                    </div>
                    <button
                      onClick={retryLastMessage}
                      className="px-3 py-1.5 bg-[#BA1A1A] text-white hover:bg-[#991B1B] rounded-lg text-[11px] font-bold transition-colors shrink-0 flex items-center gap-1 select-none active:scale-[0.98]"
                    >
                      <span className="material-symbols-outlined text-[13px]">refresh</span>
                      Try again
                    </button>
                  </div>
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Textarea Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 shrink-0 w-full relative"
          >
            <div className="flex items-end gap-1.5 border border-outline rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-hidden bg-white shadow-sm p-1 max-w-3xl mx-auto">
               <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleTextareaKeyDown}
                disabled={isStreaming}
                className="flex-1 py-2 px-3 bg-transparent border-none focus:ring-0 text-xs font-bold resize-none min-h-[36px] max-h-40 outline-none text-left disabled:opacity-50 overflow-y-auto"
                placeholder={
                  contextNote
                    ? `Ask about "${contextNote.title}"...`
                    : 'Ask anything about your study notes...'
                }
                rows="1"
                style={{ height: '36px' }}
              ></textarea>
              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="w-9 h-9 bg-primary hover:bg-primary-dark text-white rounded-lg flex items-center justify-center hover:shadow-lg active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none shrink-0"
              >
                <span className="material-symbols-outlined text-white text-base">send</span>
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AIAssistant;
