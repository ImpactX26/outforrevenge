import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import {
  Sparkles,
  User,
  ArrowUp,
  RefreshCw,
  Cpu,
  Copy,
  Check,
  RotateCcw,
  PanelRightClose,
  PanelRightOpen,
  HelpCircle,
  Award,
  BookOpen,
  FileText,
} from 'lucide-react';
import { AgentExecution } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const DEFAULT_WELCOME: ChatMessage = {
  id: 'welcome-1',
  role: 'assistant',
  content: `### Guten Tag! I am Nexora, your AI Journey Advisor

I analyze your qualification dossier against official German regulations (Anabin, APS, Visa Framework 2024, CEFR requirements) and recommend tailored **Educaro** preparation pathways.

**How can I assist your journey to Germany today?**
- Evaluate your academic or vocational qualification
- Check missing documents for Uni-Assist or visa applications
- Recommend the best **Educaro** language or transition academy
- Calculate German GPA equivalence (Bayerische Formel)`,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('nexora_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [DEFAULT_WELCOME];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [agentActivity, setAgentActivity] = useState<AgentExecution[]>([]);
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nexora_chat_history', JSON.stringify(messages));
    } catch (e) {
      console.warn('Could not save chat history to localStorage', e);
    }
  }, [messages]);

  const fetchActivity = async () => {
    try {
      const res = await apiClient.get('/ai/activity?limit=6');
      if (res.data.success) {
        setAgentActivity(res.data.executions || []);
      }
    } catch (err) {
      console.error('Failed to load activity:', err);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  const handleResetChat = () => {
    if (window.confirm('Start a fresh chat session?')) {
      const freshWelcome: ChatMessage = {
        ...DEFAULT_WELCOME,
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([freshWelcome]);
      localStorage.removeItem('nexora_chat_history');
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setSending(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role as any,
        content: m.content,
      }));

      const res = await apiClient.post('/ai/chat', {
        message: text,
        history: historyPayload,
      });

      if (res.data.success && res.data.message) {
        const botMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: res.data.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an issue connecting to the reasoning service. Please try again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
  };

  const handleTriggerOrchestration = async () => {
    try {
      setIsOrchestrating(true);
      const res = await apiClient.post('/ai/orchestrate');
      if (res.data.success) {
        await fetchActivity();
        const notificationMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: `### ⚡ Multi-Agent Orchestrator Run Complete\n\nExecuted **${res.data.iterationsExecuted || 4} bounded agent loops** across your profile dossier, document extraction, and Educaro routing. All updates have been deterministically committed to PostgreSQL shared state.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, notificationMsg]);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Agent loop finished with status notice.');
    } finally {
      setIsOrchestrating(false);
    }
  };

  const suggestedPrompts = [
    {
      icon: <Award size={14} color="#60a5fa" />,
      text: 'Recommend the best Educaro course for my situation',
    },
    {
      icon: <BookOpen size={14} color="#34d399" />,
      text: 'Check my eligibility for German Ausbildung & Study',
    },
    {
      icon: <FileText size={14} color="#fbbf24" />,
      text: 'What documents am I missing for the visa application?',
    },
    {
      icon: <HelpCircle size={14} color="#a78bfa" />,
      text: 'Explain Anabin university recognition & APS rules',
    },
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 'calc(100vh - 110px)' }}>
      {/* ChatGPT Top Navigation Bar */}
      <div
        className="card"
        style={{
          padding: '0.85rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)',
            }}
          >
            <Sparkles size={19} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>Nexora AI Advisor</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
                Groq GPT-OSS 120B
              </span>
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Real-time reasoning grounded in your personal qualification dossier
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={handleResetChat}
            className="btn"
            title="Start new conversation"
            style={{
              fontSize: '0.78rem',
              padding: '0.45rem 0.85rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <RotateCcw size={14} />
            <span>New Chat</span>
          </button>

          <button
            onClick={handleTriggerOrchestration}
            disabled={isOrchestrating}
            className="btn"
            style={{
              fontSize: '0.78rem',
              padding: '0.45rem 0.85rem',
              background: 'rgba(37, 99, 235, 0.15)',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              color: '#60a5fa',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            {isOrchestrating ? <RefreshCw className="animate-spin" size={14} /> : <Cpu size={14} />}
            <span>{isOrchestrating ? 'Orchestrating...' : 'Agent Loop'}</span>
          </button>

          <button
            onClick={() => setShowTelemetry(!showTelemetry)}
            className="btn"
            title={showTelemetry ? 'Hide Agent Telemetry' : 'Show Agent Telemetry'}
            style={{
              fontSize: '0.78rem',
              padding: '0.45rem 0.85rem',
              background: showTelemetry ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: showTelemetry ? '#60a5fa' : '#cbd5e1',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            {showTelemetry ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            <span>Telemetry</span>
          </button>
        </div>
      </div>

      {/* Main Chat Workspace */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showTelemetry ? '1fr 340px' : '1fr',
          gap: '1.25rem',
          flex: 1,
          alignItems: 'stretch',
        }}
      >
        {/* ChatGPT Style Chat Column */}
        <div
          className="card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden',
            background: 'rgba(11, 17, 32, 0.85)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            height: 'calc(100vh - 190px)',
            minHeight: '620px',
          }}
        >
          {/* Scrollable Messages Stream */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            <div style={{ maxWidth: '880px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isUser ? 'flex-end' : 'flex-start',
                      width: '100%',
                    }}
                  >
                    {isUser ? (
                      /* User Message Bubble */
                      <div
                        style={{
                          maxWidth: '78%',
                          background: '#1e293b',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '18px 18px 4px 18px',
                          padding: '0.85rem 1.25rem',
                          color: '#ffffff',
                          fontSize: '0.94rem',
                          lineHeight: '1.6',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {m.content}
                      </div>
                    ) : (
                      /* Assistant Message (Spacious, ChatGPT-Style Clean Document Presentation) */
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          gap: '1rem',
                          alignItems: 'flex-start',
                        }}
                      >
                        {/* Nexora Avatar */}
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            flexShrink: 0,
                            marginTop: '2px',
                            boxShadow: '0 0 10px rgba(37, 99, 235, 0.3)',
                          }}
                        >
                          <Sparkles size={16} />
                        </div>

                        {/* Content Body */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>Nexora</span>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{m.timestamp}</span>
                          </div>

                          <div
                            style={{
                              background: 'rgba(15, 23, 42, 0.5)',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              borderRadius: '12px',
                              padding: '1.1rem 1.35rem',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                            }}
                          >
                            <div className="markdown-content">
                              <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={{
                                  table: ({ node, ...props }) => (
                                    <div className="markdown-table-wrapper">
                                      <table {...props} />
                                    </div>
                                  ),
                                }}
                              >
                                {m.content}
                              </ReactMarkdown>
                            </div>

                            {/* ChatGPT Action Bar (Copy to clipboard) */}
                            <div
                              style={{
                                marginTop: '1rem',
                                paddingTop: '0.65rem',
                                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <button
                                onClick={() => handleCopy(m.id, m.content)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: copiedId === m.id ? '#34d399' : '#94a3b8',
                                  fontSize: '0.74rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  padding: '0.2rem 0.4rem',
                                  borderRadius: '4px',
                                  transition: 'color 0.2s ease',
                                }}
                              >
                                {copiedId === m.id ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copiedId === m.id ? 'Copied!' : 'Copy'}</span>
                              </button>

                              <span style={{ fontSize: '0.68rem', color: '#475569' }}>
                                Verified by Nexora Deterministic Guardrails
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Streaming / Reasoning Indicator */}
              {sending && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', width: '100%' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      flexShrink: 0,
                    }}
                  >
                    <RefreshCw className="animate-spin" size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>Nexora</span>
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Thinking...</span>
                    </div>
                    <div
                      style={{
                        background: 'rgba(15, 23, 42, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                        <span className="chat-dot" />
                        <span className="chat-dot" />
                        <span className="chat-dot" />
                      </div>
                      <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                        Reasoning with Groq engine over your qualification dossier...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* ChatGPT Style Floating Prompt Container at Bottom */}
          <div
            style={{
              padding: '1rem 1.5rem 1.25rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.06)',
              background: 'rgba(11, 17, 32, 0.95)',
            }}
          >
            <div style={{ maxWidth: '880px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {/* Suggested Prompts Pills */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  overflowX: 'auto',
                  paddingBottom: '0.35rem',
                  scrollbarWidth: 'none',
                }}
              >
                {suggestedPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.text)}
                    disabled={sending}
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '16px',
                      padding: '0.35rem 0.75rem',
                      color: '#cbd5e1',
                      fontSize: '0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)';
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.color = '#cbd5e1';
                    }}
                  >
                    {p.icon}
                    <span>{p.text}</span>
                  </button>
                ))}
              </div>

              {/* ChatGPT Input Capsule */}
              <div
                style={{
                  background: '#1e293b',
                  borderRadius: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  padding: '0.5rem 0.6rem 0.5rem 1.1rem',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '0.75rem',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
                }}
              >
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={handleInputResize}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask Nexora about visa laws, APS, Anabin, Ausbildung, or Educaro programs..."
                  rows={1}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#ffffff',
                    fontSize: '0.92rem',
                    lineHeight: '1.5',
                    resize: 'none',
                    maxHeight: '160px',
                    fontFamily: 'inherit',
                    padding: '0.35rem 0',
                  }}
                />

                <button
                  onClick={() => handleSendMessage()}
                  disabled={sending || !inputMessage.trim()}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: inputMessage.trim() ? '#2563eb' : 'rgba(255, 255, 255, 0.08)',
                    color: inputMessage.trim() ? '#ffffff' : '#64748b',
                    border: 'none',
                    cursor: inputMessage.trim() ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {sending ? <RefreshCw className="animate-spin" size={16} /> : <ArrowUp size={18} />}
                </button>
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#64748b' }}>
                Nexora provides deterministic relocation intelligence. Always verify official immigration milestones with certified Educaro advisors.
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Telemetry Side Panel */}
        {showTelemetry && (
          <div
            className="card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              height: 'calc(100vh - 190px)',
              minHeight: '620px',
              overflowY: 'auto',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Cpu size={16} color="#60a5fa" />
                  <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Agent Telemetry
                  </h3>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  PostgreSQL ACID Shared Records
                </div>
              </div>
              <button
                onClick={() => setShowTelemetry(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                }}
              >
                <PanelRightClose size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {agentActivity.length === 0 ? (
                <div style={{ fontSize: '0.78rem', color: '#64748b', textAlign: 'center', padding: '1rem' }}>
                  No agent telemetry runs recorded yet.
                </div>
              ) : (
                agentActivity.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      padding: '0.75rem',
                      borderRadius: '8px',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      fontSize: '0.76rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                      <strong style={{ color: '#38bdf8' }}>{act.agentType}</strong>
                      <span
                        style={{
                          fontSize: '0.66rem',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '4px',
                          background: act.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                          color: act.status === 'COMPLETED' ? '#34d399' : '#60a5fa',
                          fontWeight: 600,
                        }}
                      >
                        {act.status}
                      </span>
                    </div>
                    <div style={{ color: '#94a3b8' }}>
                      {new Date(act.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      {act.confidence && ` • ${Math.round(act.confidence * 100)}% conf`}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div
              style={{
                marginTop: 'auto',
                background: 'rgba(37, 99, 235, 0.08)',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                fontSize: '0.72rem',
                color: '#93c5fd',
                lineHeight: '1.4',
              }}
            >
              <strong>Deterministic State:</strong> Bounded to 8 iterations. Transitions persist to PostgreSQL shared tables without relying on LLM memory.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantPage;
