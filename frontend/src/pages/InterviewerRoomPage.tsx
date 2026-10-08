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
  Sparkles,
  ShieldCheck,
  Award,
  BookOpen,
  FileText,
  User,
  CheckCircle2,
  Clock,
  Code2,
  AlertTriangle,
  RefreshCw,
  Send,
} from 'lucide-react';

export const InterviewerRoomPage: React.FC = () => {
  const { id: roomId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<any | null>(null);
  const [activeStage, setActiveStage] = useState<any | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<any | null>(null);

  // Live AI Copilot Intelligence
  const [aiIntelligence, setAiIntelligence] = useState<any | null>(null);

  // Synchronized Code Editor
  const [code, setCode] = useState('// Candidate collaborative workspace\n');
  const [language, setLanguage] = useState('typescript');

  // Media
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [candidateConnected, setCandidateConnected] = useState(false);

  // Scorecard
  const [technicalScore, setTechnicalScore] = useState(80);
  const [problemSolvingScore, setProblemSolvingScore] = useState(80);
  const [communicationScore, setCommunicationScore] = useState(80);
  const [roleAlignmentScore, setRoleAlignmentScore] = useState(80);
  const [codingScore, setCodingScore] = useState(75);
  const [languageScore, setLanguageScore] = useState(80);
  const [recommendation, setRecommendation] = useState<'ADVANCE' | 'HUMAN_REVIEW' | 'DO_NOT_ADVANCE'>('HUMAN_REVIEW');
  const [notes, setNotes] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [savingScorecard, setSavingScorecard] = useState(false);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const candidateVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let streamInstance: MediaStream | null = null;

    const initInterviewer = async () => {
      try {
        setLoading(true);
        const [roomRes, scorecardRes] = await Promise.all([
          apiClient.get(`/interviews/${roomId}`),
          apiClient.get(`/interviews/${roomId}/scorecard`),
        ]);

        const r = roomRes.data.room;
        setRoom(r);

        if (r.stages && r.stages.length > 0) {
          setActiveStage(r.stages[0]);
          if (r.stages[0].questions?.length > 0) {
            setActiveQuestion(r.stages[0].questions[0]);
          }
        }

        if (r.liveIntelligence) {
          setAiIntelligence(r.liveIntelligence);
        }

        const sc = scorecardRes.data.scorecard;
        if (sc) {
          setTechnicalScore(sc.technicalScore || 80);
          setProblemSolvingScore(sc.problemSolvingScore || 80);
          setCommunicationScore(sc.communicationScore || 80);
          setRoleAlignmentScore(sc.roleAlignmentScore || 80);
          setCodingScore(sc.codingScore || 75);
          setLanguageScore(sc.languageScore || 80);
          setRecommendation(sc.recommendation || 'HUMAN_REVIEW');
          setNotes(sc.notes || '');
        }

        // Initialize local camera
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamInstance = stream;
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (e) {
          console.warn('Interviewer media capture unavailable:', e);
        }

        // Socket.IO
        const socketUrl = (import.meta as any).env?.VITE_WS_URL || 'http://localhost:5000';
        const socket = io(`${socketUrl}/interview`, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;

        socket.on('connect', () => {
          socket.emit('room:join', { roomId, userId: user?.id, role: 'INTERVIEWER' });
        });

        // PeerConnection
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
          if (candidateVideoRef.current && event.streams[0]) {
            candidateVideoRef.current.srcObject = event.streams[0];
            setCandidateConnected(true);
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('media:ice', { roomId, candidate: event.candidate, senderId: user?.id });
          }
        };

        // When candidate joins, initiate offer
        socket.on('participant:joined', async (p) => {
          if (p.role === 'APPLICANT') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('media:offer', { roomId, offer, senderId: user?.id });
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

        // Editor synchronization
        socket.on('code:update', (data) => {
          setCode(data.code);
          if (data.language) setLanguage(data.language);
        });

        socket.on('participant:left', () => {
          setCandidateConnected(false);
        });
      } catch (err) {
        console.error('Failed to initialize interviewer room:', err);
      } finally {
        setLoading(false);
      }
    };

    initInterviewer();

    return () => {
      if (localStream) localStream.getTracks().forEach((t) => t.stop());
      if (pcRef.current) pcRef.current.close();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [roomId]);

  const handleSelectQuestion = (q: any) => {
    setActiveQuestion(q);
    if (socketRef.current) {
      socketRef.current.emit('interview:question', { roomId, question: q });
    }
  };

  const handleSaveScorecard = async () => {
    try {
      setSavingScorecard(true);
      await apiClient.patch(`/interviews/${roomId}/scorecard`, {
        technicalScore,
        problemSolvingScore,
        communicationScore,
        roleAlignmentScore,
        codingScore,
        languageScore,
        recommendation,
        notes,
      });
      alert('Scorecard saved successfully.');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to save scorecard');
    } finally {
      setSavingScorecard(false);
    }
  };

  const handleTriggerAiEvaluation = async () => {
    try {
      setEvaluating(true);
      const res = await apiClient.post(`/interviews/${roomId}/evaluate`);
      if (res.data.success) {
        const evalData = res.data.evaluation;
        setTechnicalScore(evalData.technicalScore || 80);
        setProblemSolvingScore(evalData.problemSolvingScore || 80);
        setCommunicationScore(evalData.communicationScore || 80);
        setRoleAlignmentScore(evalData.roleAlignmentScore || 80);
        setCodingScore(evalData.codingScore || 75);
        setLanguageScore(evalData.languageScore || 80);
        setRecommendation(evalData.recommendation || 'HUMAN_REVIEW');
        setNotes(evalData.advisoryNotes || '');
        alert('AI Interview Evaluation complete! Review advisory scores below.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to run AI evaluation');
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <RefreshCw className="animate-spin" size={36} color="#3b82f6" />
      </div>
    );
  }

  const applicant = room?.applicant;
  const opp = room?.application?.opportunity;

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem', height: 'calc(100vh - 120px)' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.75rem 1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', fontWeight: 700 }}>
              INTERVIEWER & EVALUATOR CONSOLE
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Role: Consultant / Hiring Panel</span>
          </div>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '0.2rem 0 0 0' }}>
            {room?.title} &bull; Candidate: {applicant?.firstName} {applicant?.lastName}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={handleTriggerAiEvaluation}
            disabled={evaluating}
            className="btn"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: '#fff' }}
          >
            {evaluating ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
            <span>Run Post-Interview AI Evaluation</span>
          </button>

          <button
            onClick={() => navigate('/consultant')}
            className="btn"
            style={{ fontSize: '0.82rem', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}
          >
            Exit Console
          </button>
        </div>
      </div>

      {/* 3-Column Layout: Left (Video & Candidate Profile), Center (Code & Questions), Right (AI Copilot & Scorecard) */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr 380px', gap: '1rem', flex: 1, minHeight: 0 }}>
        {/* Left Column: Video Feeds & Candidate Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0, overflowY: 'auto' }}>
          {/* Candidate Video */}
          <div style={{ height: '230px', background: '#020617', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', position: 'relative', overflow: 'hidden' }}>
            <video
              ref={candidateVideoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {!candidateConnected && (
              <div style={{ position: 'absolute', top: '40%', width: '100%', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                <div>Candidate stream connecting...</div>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', color: '#fff' }}>
              Candidate: {applicant?.firstName} {applicant?.lastName}
            </div>

            {/* Local Interviewer Video PIP */}
            <div style={{ position: 'absolute', bottom: '8px', right: '8px', width: '90px', height: '65px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)', background: '#000' }}>
              <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </div>

          {/* Candidate Profile Details */}
          <div className="card" style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.65rem' }}>
              <User size={15} />
              <span>Verified Candidate Dossier</span>
            </div>

            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div><strong>Email:</strong> {applicant?.email}</div>
              <div><strong>Target Position:</strong> {opp?.title} ({opp?.organization})</div>
              <div><strong>CV Attached:</strong> {room?.application?.cv ? 'Yes (EU Standard)' : 'Not attached'}</div>
              <div><strong>Cover Letter:</strong> {room?.application?.coverLetter ? 'Yes' : 'None'}</div>
            </div>
          </div>

          {/* Interview Stages & Questions Navigator */}
          <div className="card" style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', flex: 1, overflowY: 'auto' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: '0.65rem' }}>
              Interview Stages & Questions
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {room?.stages?.map((st: any) => (
                <div key={st.id} style={{ padding: '0.5rem', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.35rem' }}>
                    Stage: {st.stageType}
                  </div>
                  {st.questions?.map((q: any) => (
                    <button
                      key={q.id}
                      onClick={() => handleSelectQuestion(q)}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '0.4rem 0.5rem',
                        borderRadius: '4px',
                        background: activeQuestion?.id === q.id ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
                        border: activeQuestion?.id === q.id ? '1px solid rgba(59, 130, 246, 0.4)' : 'none',
                        color: activeQuestion?.id === q.id ? '#fff' : '#94a3b8',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        marginBottom: '0.2rem',
                      }}
                    >
                      {q.questionText}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Live Collaborative Monaco Editor (Candidate's code view) */}
        <div style={{ display: 'flex', flexDirection: 'column', background: '#1e1e1e', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 1rem', background: '#252526', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8', fontSize: '0.85rem', fontWeight: 700 }}>
              <Code2 size={16} />
              <span>Live Synchronized Code Editor ({language})</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
              Candidate Code Stream
            </span>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={code}
              options={{
                readOnly: false,
                minimap: { enabled: false },
                fontSize: 13,
                wordWrap: 'on',
                automaticLayout: true,
              }}
            />
          </div>
        </div>

        {/* Right Column: AI Live Interview Intelligence Copilot & Private Scorecard */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0, overflowY: 'auto' }}>
          {/* AI Live Intelligence Panel */}
          <div className="card" style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.98))', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#818cf8', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.65rem' }}>
              <Sparkles size={16} />
              <span>AI Live Interview Intelligence</span>
            </div>

            {aiIntelligence ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem', color: '#cbd5e1' }}>
                <div>
                  <strong style={{ color: '#a5b4fc' }}>Suggested Follow-up:</strong>
                  <div style={{ marginTop: '0.2rem', color: '#fff', fontStyle: 'italic' }}>
                    "{aiIntelligence.suggestedFollowUp}"
                  </div>
                </div>

                <div>
                  <strong style={{ color: '#a5b4fc' }}>Competency:</strong> {aiIntelligence.competencyTested}
                </div>

                {aiIntelligence.profileEvidence?.length > 0 && (
                  <div>
                    <strong style={{ color: '#34d399' }}>Profile Evidence:</strong> {aiIntelligence.profileEvidence.join(', ')}
                  </div>
                )}

                {aiIntelligence.missingEvidence?.length > 0 && (
                  <div>
                    <strong style={{ color: '#fbbf24' }}>Gaps / Missing Proof:</strong> {aiIntelligence.missingEvidence.join(', ')}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                AI copilot will analyze candidate responses live as questions are answered.
              </div>
            )}
          </div>

          {/* Private Scorecard Panel */}
          <div className="card" style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
              Interviewer Scorecard & Recommendation
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
              <div>
                <label style={{ color: '#94a3b8' }}>Technical (0-100)</label>
                <input
                  type="number"
                  value={technicalScore}
                  onChange={(e) => setTechnicalScore(Number(e.target.value))}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.3rem', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ color: '#94a3b8' }}>Problem Solving</label>
                <input
                  type="number"
                  value={problemSolvingScore}
                  onChange={(e) => setProblemSolvingScore(Number(e.target.value))}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.3rem', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ color: '#94a3b8' }}>Communication</label>
                <input
                  type="number"
                  value={communicationScore}
                  onChange={(e) => setCommunicationScore(Number(e.target.value))}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.3rem', borderRadius: '4px' }}
                />
              </div>

              <div>
                <label style={{ color: '#94a3b8' }}>Coding Performance</label>
                <input
                  type="number"
                  value={codingScore}
                  onChange={(e) => setCodingScore(Number(e.target.value))}
                  style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.3rem', borderRadius: '4px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Advisory Recommendation</label>
              <select
                value={recommendation}
                onChange={(e: any) => setRecommendation(e.target.value)}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.35rem', borderRadius: '4px', fontSize: '0.78rem' }}
              >
                <option value="ADVANCE">Advance (Proceed to Offer / Enrollment)</option>
                <option value="HUMAN_REVIEW">Human Review (Further Assessment)</option>
                <option value="DO_NOT_ADVANCE">Do Not Advance</option>
              </select>
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private interview notes and evaluation remarks..."
              rows={3}
              style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0.4rem', borderRadius: '4px', fontSize: '0.78rem', resize: 'none' }}
            />

            <button
              onClick={handleSaveScorecard}
              disabled={savingScorecard}
              className="btn btn-primary"
              style={{ padding: '0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
            >
              {savingScorecard ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
              <span>Save Scorecard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewerRoomPage;
