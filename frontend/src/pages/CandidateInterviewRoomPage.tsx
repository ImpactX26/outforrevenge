import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import apiClient from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share2,
  PhoneOff,
  Send,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  HelpCircle,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Terminal,
} from 'lucide-react';

export const CandidateInterviewRoomPage: React.FC = () => {
  const { id: roomId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<any | null>(null);
  const [activeStage, setActiveStage] = useState<any | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<any | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Coding State
  const [activeChallenge, setActiveChallenge] = useState<any | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('typescript');
  const [code, setCode] = useState('// Write your solution here\n');
  const [runningCode, setRunningCode] = useState(false);
  const [testResults, setTestResults] = useState<any | null>(null);

  // Media & WebRTC
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [remoteConnected, setRemoteConnected] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<Array<{ senderName: string; text: string; role: string; timestamp: string }>>([]);
  const [chatInput, setChatInput] = useState('');

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Load Room Data & Join
  useEffect(() => {
    let streamInstance: MediaStream | null = null;

    const initRoom = async () => {
      try {
        setLoading(true);
        // Verify access & join
        const joinRes = await apiClient.post(`/interviews/${roomId}/join`);
        const roomRes = await apiClient.get(`/interviews/${roomId}`);

        const roomData = roomRes.data.room;
        setRoom(roomData);

        if (roomData.stages && roomData.stages.length > 0) {
          setActiveStage(roomData.stages[0]);
          if (roomData.stages[0].questions?.length > 0) {
            setActiveQuestion(roomData.stages[0].questions[0]);
          }
        }

        const challenges = roomData.technicalAssessment?.challenges || [];
        if (challenges.length > 0) {
          setActiveChallenge(challenges[0]);
          setSelectedLanguage(challenges[0].language || 'typescript');
          setCode(challenges[0].starterCode || '');
        }

        // Initialize Local Media Stream
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamInstance = stream;
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (mediaErr) {
          console.warn('Camera/Mic permission denied or unavailable:', mediaErr);
        }

        // Connect Socket.IO
        const socketUrl = (import.meta as any).env?.VITE_WS_URL || 'http://localhost:5000';
        const socket = io(`${socketUrl}/interview`, {
          transports: ['websocket', 'polling'],
        });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('room:join', {
            roomId,
            userId: user?.id,
            role: 'APPLICANT',
          });
        });

        // WebRTC PeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        pcRef.current = pc;

        if (streamInstance) {
          streamInstance.getTracks().forEach((track) => {
            pc.addTrack(track, streamInstance!);
          });
        }

        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setRemoteConnected(true);
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('media:ice', {
              roomId,
              candidate: event.candidate,
              senderId: user?.id,
            });
          }
        };

        // Signaling listeners
        socket.on('media:offer', async (data) => {
          if (data.senderId !== user?.id) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit('media:answer', {
              roomId,
              answer,
              senderId: user?.id,
              targetSocketId: data.senderSocketId,
            });
          }
        });

        socket.on('media:answer', async (data) => {
          if (data.senderId !== user?.id) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
          }
        });

        socket.on('media:ice', async (data) => {
          if (data.senderId !== user?.id && data.candidate) {
            await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
          }
        });

        // Editor & Chat Listeners
        socket.on('code:update', (data) => {
          if (data.senderId !== user?.id) {
            setCode(data.code);
            if (data.language) setSelectedLanguage(data.language);
          }
        });

        socket.on('chat:message', (msg) => {
          setChatMessages((prev) => [...prev, msg]);
        });

        socket.on('interview:question', (q) => {
          setActiveQuestion(q);
        });

        socket.on('participant:left', () => {
          setRemoteConnected(false);
        });
      } catch (err: any) {
        console.error('Failed to initialize interview room:', err);
      } finally {
        setLoading(false);
      }
    };

    initRoom();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
      if (pcRef.current) pcRef.current.close();
      if (socketRef.current) {
        socketRef.current.emit('room:leave', { roomId, userId: user?.id });
        socketRef.current.disconnect();
      }
    };
  }, [roomId]);

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !micEnabled;
      });
      setMicEnabled(!micEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const handleCodeChange = (newCode?: string) => {
    const val = newCode || '';
    setCode(val);
    if (socketRef.current) {
      socketRef.current.emit('code:update', {
        roomId,
        code: val,
        language: selectedLanguage,
        senderId: user?.id,
      });
    }
  };

  const handleRunCode = async () => {
    if (!activeChallenge) return;
    try {
      setRunningCode(true);
      const res = await apiClient.post(`/interviews/${roomId}/code/run`, {
        challengeId: activeChallenge.id,
        language: selectedLanguage,
        code,
      });
      setTestResults(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to run code in sandbox');
    } finally {
      setRunningCode(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!activeChallenge) return;
    try {
      setRunningCode(true);
      const res = await apiClient.post(`/interviews/${roomId}/code/submit`, {
        challengeId: activeChallenge.id,
        language: selectedLanguage,
        code,
      });
      setTestResults(res.data);
      alert('Code solution submitted successfully for official scoring!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit code');
    } finally {
      setRunningCode(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!activeQuestion || !answerText.trim()) return;
    try {
      setSubmittingAnswer(true);
      await apiClient.post(`/interviews/${roomId}/answers`, {
        questionId: activeQuestion.id,
        answerText,
      });
      setAnswerText('');
      alert('Answer recorded. The AI live interviewer will adaptively provide follow-up feedback.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('chat:message', {
      roomId,
      senderId: user?.id,
      senderName: `${user?.firstName} ${user?.lastName}`.trim(),
      text: chatInput,
      role: 'APPLICANT',
    });
    setChatInput('');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <RefreshCw className="animate-spin" size={36} color="#3b82f6" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.75rem 1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 700 }}>
              LIVE INTERVIEW SESSION
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>GDPR Compliant (No Recording By Default)</span>
          </div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0.2rem 0 0 0' }}>
            {room?.title}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: '#cbd5e1' }}>
            <Clock size={15} color="#38bdf8" />
            <span>Duration: {room?.durationMinutes || 45} mins</span>
          </div>

          <button
            onClick={() => navigate('/applications')}
            className="btn"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }}
          >
            Leave Room
          </button>
        </div>
      </div>

      {/* Main Grid: Left Video & Questions, Right Collaborative Monaco Editor */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '1rem', flex: 1, minHeight: 0 }}>
        {/* Left Column: Video Feeds & Structured Question */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0, overflowY: 'auto' }}>
          {/* Video Container */}
          <div style={{ background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            {/* Remote Interviewer Video */}
            <div style={{ height: '220px', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              {!remoteConnected && (
                <div style={{ position: 'absolute', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  <Video size={28} style={{ margin: '0 auto 0.4rem', opacity: 0.5 }} />
                  <div>Interviewer connecting...</div>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', color: '#fff' }}>
                Interviewer / Panel
              </div>
            </div>

            {/* Local Candidate Video (PIP overlay) */}
            <div style={{ position: 'absolute', bottom: '50px', right: '10px', width: '110px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255, 255, 255, 0.2)', background: '#000' }}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', bottom: '2px', left: '4px', fontSize: '0.65rem', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '0 0.3rem', borderRadius: '3px' }}>
                You
              </div>
            </div>

            {/* Video Control Bar */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', padding: '0.6rem', background: 'rgba(15, 23, 42, 0.95)' }}>
              <button
                onClick={toggleMic}
                className="btn"
                style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: micEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(239, 68, 68, 0.3)', color: micEnabled ? '#fff' : '#f87171' }}
              >
                {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
              </button>
              <button
                onClick={toggleVideo}
                className="btn"
                style={{ width: '36px', height: '36px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: videoEnabled ? 'rgba(255,255,255,0.1)' : 'rgba(239, 68, 68, 0.3)', color: videoEnabled ? '#fff' : '#f87171' }}
              >
                {videoEnabled ? <Video size={16} /> : <VideoOff size={16} />}
              </button>
            </div>
          </div>

          {/* Current Question & Answer Input */}
          <div className="card" style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', padding: '0.15rem 0.5rem', borderRadius: '6px', background: 'rgba(37, 99, 235, 0.2)', color: '#60a5fa', fontWeight: 600 }}>
                {activeQuestion?.competency || 'Role Competency'}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Difficulty: {activeQuestion?.difficulty || 'MID'}
              </span>
            </div>

            <div style={{ fontSize: '0.92rem', color: '#fff', fontWeight: 600, lineHeight: 1.4 }}>
              {activeQuestion?.questionText || 'Please await your interviewer question.'}
            </div>

            <textarea
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              placeholder="Type your response summary or spoken points here..."
              rows={3}
              style={{ width: '100%', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', padding: '0.5rem', color: '#fff', fontSize: '0.85rem', resize: 'none' }}
            />

            <button
              onClick={handleSubmitAnswer}
              disabled={submittingAnswer || !answerText.trim()}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {submittingAnswer ? <RefreshCw className="animate-spin" size={14} /> : <Send size={14} />}
              <span>Submit Answer</span>
            </button>
          </div>
        </div>

        {/* Right Column: Collaborative Monaco Code Editor & Test Execution */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#1e1e1e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
          {/* Editor Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', background: '#252526', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700 }}>
                <Code2 size={16} />
                <span>Collaborative Sandbox Editor</span>
              </div>

              <select
                value={selectedLanguage}
                onChange={(e) => {
                  setSelectedLanguage(e.target.value);
                  if (socketRef.current) {
                    socketRef.current.emit('code:update', { roomId, code, language: e.target.value, senderId: user?.id });
                  }
                }}
                style={{ background: '#333', border: '1px solid #444', color: '#fff', fontSize: '0.78rem', padding: '0.2rem 0.5rem', borderRadius: '4px' }}
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={handleRunCode}
                disabled={runningCode}
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.78rem', background: '#2563eb', color: '#fff' }}
              >
                {runningCode ? <RefreshCw className="animate-spin" size={13} /> : <Play size={13} />}
                <span>Run Code</span>
              </button>

              <button
                onClick={handleSubmitCode}
                disabled={runningCode}
                className="btn"
                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', fontSize: '0.78rem', background: '#10b981', color: '#fff' }}
              >
                <CheckCircle2 size={13} />
                <span>Submit Solution</span>
              </button>
            </div>
          </div>

          {/* Monaco Editor Component */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              theme="vs-dark"
              language={selectedLanguage}
              value={code}
              onChange={handleCodeChange}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>

          {/* Execution Output Panel */}
          {testResults && (
            <div style={{ maxHeight: '180px', overflowY: 'auto', background: '#18181b', borderTop: '1px solid #333', padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: testResults.passed ? '#34d399' : '#f87171' }}>
                  <Terminal size={14} />
                  <span>{testResults.passed ? 'All Test Cases Passed' : 'Test Suite Failed'}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {testResults.executionTimeMs}ms &bull; {testResults.memoryKb}KB
                </div>
              </div>

              {testResults.stdout && (
                <div style={{ fontFamily: 'monospace', color: '#cbd5e1', marginBottom: '0.4rem', whiteSpace: 'pre-wrap' }}>
                  <strong>stdout:</strong> {testResults.stdout}
                </div>
              )}

              {testResults.stderr && (
                <div style={{ fontFamily: 'monospace', color: '#f87171', marginBottom: '0.4rem', whiteSpace: 'pre-wrap' }}>
                  <strong>stderr:</strong> {testResults.stderr}
                </div>
              )}

              {testResults.testResults?.map((t: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: t.passed ? '#34d399' : '#f87171' }}>
                  {t.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                  <span>{t.description || `Case ${idx + 1}`}: Expected "{t.expectedOutput}", received "{t.actualOutput}"</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateInterviewRoomPage;
