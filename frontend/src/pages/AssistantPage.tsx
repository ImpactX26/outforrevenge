import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../api/client';
import {
  Bot,
  User,
  Send,
  Sparkles,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Cpu,
} from 'lucide-react';
import { AgentExecution } from '../types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Guten Tag! I am Nexora, your AI Journey Advisor for moving, studying, or working in Germany. How can I assist your relocation preparation today?',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [agentActivity, setAgentActivity] = useState<AgentExecution[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || sending) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
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
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I encountered an issue connecting to the reasoning service. Please try again.',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
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
          content: `Multi-Agent Orchestrator completed execution of ${res.data.iterationsExecuted || 4} bounded agent loops across your profile, document extraction, and Educaro routing.`,
          timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, notificationMsg]);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Agent loop finished with status notice.');
    } finally {
      setIsOrchestrating(false);
    }
  };

  const quickPrompts = [
    'Check my German visa eligibility',
    'What documents am I missing for Uni-Assist?',
    'Recommend the best Educaro course for me',
    'How do I convert my GPA to the German Bayerische Formel?',
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Bot size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Nexora AI Journey Advisor
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0.2rem 0 0' }}>
              Multi-Agent Orchestration Engine grounded in official German immigration regulations.
            </p>
          </div>
        </div>

        <button
          onClick={handleTriggerOrchestration}
          disabled={isOrchestrating}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', padding: '0.6rem 1.25rem' }}
        >
          {isOrchestrating ? <RefreshCw className="animate-spin" size={16} /> : <Cpu size={16} />}
          <span>{isOrchestrating ? 'Orchestrating Agents...' : 'Run Agent Loop'}</span>
        </button>
      </div>

      {/* Main Grid: Chat Window | Agent Activity Feed */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Chat Window */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: 0, overflow: 'hidden' }}>
          {/* Chat Messages Body */}
          <div style={{ flex: 1, padding: '1.25rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                  }}
                >
                  {!isUser && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(37, 99, 235, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#60a5fa',
                        flexShrink: 0,
                      }}
                    >
                      <Bot size={18} />
                    </div>
                  )}

                  <div>
                    <div
                      style={{
                        padding: '0.85rem 1.1rem',
                        borderRadius: '12px',
                        background: isUser ? '#2563eb' : 'rgba(30, 41, 59, 0.8)',
                        border: isUser ? 'none' : '1px solid var(--border-subtle)',
                        color: '#fff',
                        fontSize: '0.88rem',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {m.content}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.25rem', textAlign: isUser ? 'right' : 'left' }}>
                      {m.timestamp}
                    </div>
                  </div>

                  {isUser && (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#cbd5e1',
                        flexShrink: 0,
                      }}
                    >
                      <User size={18} />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div style={{ padding: '0.5rem 1rem', background: 'rgba(15, 23, 42, 0.5)', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(p)}
                style={{
                  fontSize: '0.72rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div style={{ padding: '0.85rem 1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about Anabin, visa laws, Ausbildung, or Educaro services..."
              style={{
                flex: 1,
                padding: '0.7rem 1rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '0.88rem',
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={sending || !inputMessage.trim()}
              className="btn btn-primary"
              style={{ padding: '0.7rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {sending ? <RefreshCw className="animate-spin" size={17} /> : <Send size={17} />}
            </button>
          </div>
        </div>

        {/* Right Column: Multi-Agent Activity Feed */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '620px', overflowY: 'auto' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <Cpu size={16} color="#60a5fa" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Live Agent Telemetry
              </h3>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
              PostgreSQL Shared State Records
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {agentActivity.map((act) => (
              <div
                key={act.id}
                style={{
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <strong style={{ color: '#38bdf8' }}>{act.agentType}</strong>
                  <span
                    style={{
                      fontSize: '0.68rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: act.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      color: act.status === 'COMPLETED' ? '#34d399' : '#60a5fa',
                      fontWeight: 600,
                    }}
                  >
                    {act.status}
                  </span>
                </div>
                <div style={{ color: '#94a3b8' }}>
                  {new Date(act.startedAt).toLocaleTimeString()}
                  {act.confidence && ` &bull; ${Math.round(act.confidence * 100)}% conf`}
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 'auto',
              background: 'rgba(37, 99, 235, 0.1)',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              fontSize: '0.75rem',
              color: '#93c5fd',
              lineHeight: '1.4',
            }}
          >
            <strong>Agent Loop Guarantee:</strong> Bounded to 8 iterations maximum. All updates persist deterministically to PostgreSQL shared tables.
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantPage;
