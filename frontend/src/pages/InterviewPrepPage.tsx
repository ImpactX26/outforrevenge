import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Award,
  ShieldCheck,
  Briefcase,
  GraduationCap,
  Building2,
  Play,
  Check,
  FileText,
  Send,
  Star,
  Compass,
  ArrowRight,
  PhoneCall,
  PhoneOff,
  Radio,
  UserCheck,
  ChevronRight,
  Download,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { GoalType, OpportunityItem } from '../types';

export const InterviewPrepPage: React.FC = () => {
  // Session State
  const [pathway, setPathway] = useState<GoalType>('AUSBILDUNG');
  const [targetRole, setTargetRole] = useState('Software Engineer & IT Specialist');
  const [selectedOpportunityId, setSelectedOpportunityId] = useState<string>('');
  const [opportunities, setOpportunities] = useState<OpportunityItem[]>([]);
  const [qualificationStatus, setQualificationStatus] = useState<string>('QUALIFIED');
  const [bavarianGpa, setBavarianGpa] = useState<number | null>(1.8);
  const [session, setSession] = useState<any | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [evaluations, setEvaluations] = useState<Record<string, any>>({});
  const [sessionsHistory, setSessionsHistory] = useState<any[]>([]);

  // Video Conference Controls
  const [isInCall, setIsInCall] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isListeningSpeech, setIsListeningSpeech] = useState(false);
  const [isSpeakingTts, setIsSpeakingTts] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // 1. Initial Data Fetching: Opportunities, Qualification, and Past Sessions
  useEffect(() => {
    const fetchPrerequisites = async () => {
      try {
        const [oppRes, qualRes, sessionsRes] = await Promise.allSettled([
          apiClient.get('/opportunities'),
          apiClient.get('/qualification/status'),
          apiClient.get('/interview'),
        ]);

        if (oppRes.status === 'fulfilled' && oppRes.value.data.success) {
          const opps: OpportunityItem[] = oppRes.value.data.opportunities || [];
          setOpportunities(opps);
          if (opps.length > 0) {
            setSelectedOpportunityId(opps[0].id);
            setTargetRole(`${opps[0].title} at ${opps[0].organization}`);
            if (opps[0].category === 'DUAL_STUDY' || opps[0].category === 'AUSBILDUNG') {
              setPathway('AUSBILDUNG');
            } else if (opps[0].category === 'JOB') {
              setPathway('EMPLOYMENT');
            } else {
              setPathway('STUDY');
            }
          }
        }

        if (qualRes.status === 'fulfilled' && qualRes.value.data.success) {
          const qData = qualRes.value.data.assessment;
          if (qData) {
            setQualificationStatus(qData.status || 'QUALIFIED');
            if (qData.bavarianGrade) {
              setBavarianGpa(Number(qData.bavarianGrade));
            }
          }
        }

        if (sessionsRes.status === 'fulfilled' && sessionsRes.value.data.success) {
          const list = sessionsRes.value.data.sessions || [];
          setSessionsHistory(list);
          if (list.length > 0 && !session) {
            // Pick most recent active session
            const latest = list[0];
            if (latest.questions && Array.isArray(latest.questions)) {
              setSession(latest);
              setTargetRole(latest.targetRole || targetRole);
              if (latest.feedback && Array.isArray(latest.feedback)) {
                const map: Record<string, any> = {};
                latest.feedback.forEach((f: any) => {
                  map[f.questionId] = f;
                });
                setEvaluations(map);
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load interview context:', err);
      }
    };

    fetchPrerequisites();
  }, []);

  // 2. WebRTC Media Stream initialization
  useEffect(() => {
    let localStream: MediaStream | null = null;

    const startWebcam = async () => {
      if (!isInCall || !isCameraOn) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = null;
        }
        return;
      }

      try {
        setCameraError(null);
        localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: true,
        });

        streamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
      } catch (err: any) {
        console.warn('Webcam/Mic access denied or unavailable:', err.message);
        setCameraError('Webcam / Microphone preview is currently in simulated conference mode.');
      }
    };

    startWebcam();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isInCall, isCameraOn]);

  // Call duration counter
  useEffect(() => {
    let interval: any;
    if (isInCall) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isInCall]);

  // Track mic toggle on live stream
  useEffect(() => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = isMicOn;
      });
    }
  }, [isMicOn]);

  // 3. Speech-to-Text Recognition Setup
  const toggleSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. You can formulate your response directly in the text area.');
      return;
    }

    if (isListeningSpeech) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListeningSpeech(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListeningSpeech(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setUserAnswer((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${transcript}` : transcript;
        });
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e);
        setIsListeningSpeech(false);
      };

      recognition.onend = () => {
        setIsListeningSpeech(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListeningSpeech(false);
    }
  };

  // 4. Text-to-Speech (Interviewer reads question aloud)
  const handleReadQuestion = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (isSpeakingTts) {
      window.speechSynthesis.cancel();
      setIsSpeakingTts(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeakingTts(true);
    utterance.onend = () => setIsSpeakingTts(false);
    utterance.onerror = () => setIsSpeakingTts(false);
    window.speechSynthesis.speak(utterance);
  };

  // 5. Start Session
  const handleStartSession = async () => {
    if (qualificationStatus !== 'QUALIFIED') {
      alert('The Live Video Interview Room is strictly locked until you achieve statutory QUALIFIED status. Please complete your qualification evaluation first.');
      return;
    }
    try {
      setStarting(true);
      const res = await apiClient.post('/interview/start', {
        pathway,
        targetRole,
        opportunityId: selectedOpportunityId || undefined,
      });

      if (res.data.success && res.data.session) {
        setSession(res.data.session);
        setActiveQuestionIndex(0);
        setUserAnswer('');
        setEvaluations({});
        setIsInCall(true);
        setCallDuration(0);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start interview conference session.');
    } finally {
      setStarting(false);
    }
  };

  // 6. Submit Answer
  const handleSubmitAnswer = async () => {
    if (!session || !userAnswer.trim()) return;
    const currentQ = session.questions[activeQuestionIndex];
    if (!currentQ) return;

    try {
      setSubmitting(true);
      if (isListeningSpeech && speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
        setIsListeningSpeech(false);
      }

      const res = await apiClient.post(`/interview/${session.id}/answer`, {
        questionId: currentQ.id,
        answerText: userAnswer,
      });

      if (res.data.success && res.data.session) {
        setSession(res.data.session);
        const fbList = res.data.session.feedback || [];
        const currentFb = fbList.find((f: any) => f.questionId === currentQ.id);
        if (currentFb) {
          setEvaluations((prev) => ({ ...prev, [currentQ.id]: currentFb }));
        }

        // Auto advance to next unanswered question if available
        if (activeQuestionIndex < session.questions.length - 1) {
          setTimeout(() => {
            setActiveQuestionIndex((prev) => prev + 1);
            setUserAnswer('');
          }, 1200);
        }
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to evaluate interview answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQ = session?.questions?.[activeQuestionIndex];
  const currentEval = currentQ ? evaluations[currentQ.id] : null;
  const isAllAnswered = session?.questions?.every((q: any) => !!evaluations[q.id]);
  const matchedOpp = opportunities.find((o) => o.id === selectedOpportunityId);

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* 1. Header Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.92))',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.5)',
          padding: '1.75rem 2rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div style={{ maxWidth: '780px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#60a5fa',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <Radio size={13} color="#60a5fa" />
              WebRTC Live Video Conference
            </span>

            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.2rem 0.65rem',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#34d399',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              <UserCheck size={13} />
              {qualificationStatus === 'QUALIFIED' ? 'Qualified Candidate Track' : 'Preliminary Evaluation Track'}
            </span>

            {bavarianGpa && (
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Bavarian GPA: <strong style={{ color: '#fff' }}>{bavarianGpa}</strong>
              </span>
            )}
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
            Online Video Interview Studio
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginTop: '0.4rem', lineHeight: '1.5' }}>
            Live interactive video conference screening with Dr. Elena Weber (Senior Technical Recruiter & Educaro Examiner). Calibrated to genuine German university, dual Ausbildung, and employment visa standards.
          </p>
        </div>

        {/* Opportunity Match Target Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
              Matched Opportunity
            </label>
            <select
              value={selectedOpportunityId}
              onChange={(e) => {
                const oppId = e.target.value;
                setSelectedOpportunityId(oppId);
                const match = opportunities.find((o) => o.id === oppId);
                if (match) {
                  setTargetRole(`${match.title} at ${match.organization}`);
                  if (match.category === 'JOB') setPathway('EMPLOYMENT');
                  else if (match.category === 'DUAL_STUDY' || match.category === 'AUSBILDUNG') setPathway('AUSBILDUNG');
                  else setPathway('STUDY');
                }
              }}
              style={{
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '0.82rem',
                maxWidth: '280px',
                outline: 'none',
              }}
            >
              {opportunities.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.title} ({o.organization})
                </option>
              ))}
            </select>
          </div>

          {qualificationStatus === 'QUALIFIED' ? (
            <button
              onClick={handleStartSession}
              disabled={starting}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.85rem',
                padding: '0.7rem 1.35rem',
                alignSelf: 'flex-end',
                boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)',
              }}
            >
              {starting ? <RefreshCw className="animate-spin" size={16} /> : <Video size={16} />}
              <span>Launch Video Conference</span>
            </button>
          ) : (
            <Link
              to="/qualification"
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.82rem',
                padding: '0.7rem 1.15rem',
                alignSelf: 'flex-end',
                textDecoration: 'none',
                color: '#fbbf24',
                borderColor: 'rgba(245, 158, 11, 0.35)',
              }}
            >
              <Award size={15} />
              <span>Get Qualified First</span>
            </Link>
          )}
        </div>
      </div>

      {cameraError && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            background: 'rgba(234, 179, 8, 0.1)',
            border: '1px solid rgba(234, 179, 8, 0.25)',
            color: '#fde047',
            fontSize: '0.82rem',
          }}
        >
          {cameraError}
        </div>
      )}

      {/* 2. Main Video Conference Room & Q&A Stage */}
      {session && currentQ ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(0, 0.95fr)', gap: '1.75rem', alignItems: 'start' }}>
          {/* Left Column: Dual Video Screen Stage & Conference Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              className="card"
              style={{
                padding: '1.25rem',
                background: '#090d16',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '14px',
                boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.75)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              {/* Dual Video Grid: Remote Interviewer + Local Candidate */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* 1. Remote Examiner Video Screen */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '16/10',
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: '4px',
                        background: 'rgba(0, 0, 0, 0.65)',
                        color: '#60a5fa',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                      }}
                    >
                      GERMAN RECRUITER
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34d399',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                      }}
                    >
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                      LIVE
                    </span>
                  </div>

                  {/* Interviewer Avatar / Visualizer Pulse */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: 'auto 0', zIndex: 2 }}>
                    <div
                      style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '1.4rem',
                        boxShadow: isSpeakingTts
                          ? '0 0 25px 5px rgba(59, 130, 246, 0.6)'
                          : '0 8px 20px rgba(0, 0, 0, 0.4)',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      EW
                    </div>
                    <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
                      <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem' }}>Dr. Elena Weber</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Senior Examiner • Berlin</div>
                    </div>
                  </div>

                  {/* Bottom Indicator */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                    <span style={{ fontSize: '0.7rem', color: isSpeakingTts ? '#60a5fa' : '#64748b', fontWeight: 600 }}>
                      {isSpeakingTts ? 'Speaking Question...' : 'Listening to Candidate...'}
                    </span>
                    <button
                      onClick={() => handleReadQuestion(currentQ.question)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: '#fff',
                        padding: '0.25rem 0.55rem',
                        fontSize: '0.72rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        cursor: 'pointer',
                      }}
                    >
                      {isSpeakingTts ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      <span>{isSpeakingTts ? 'Mute TTS' : 'Read Question'}</span>
                    </button>
                  </div>
                </div>

                {/* 2. Candidate Live Video Screen */}
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '16/10',
                    background: '#020617',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isCameraOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transform: 'scaleX(-1)',
                      }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#64748b' }}>
                      <VideoOff size={32} style={{ margin: '0 auto 0.5rem' }} />
                      <div style={{ fontSize: '0.78rem' }}>Camera Paused</div>
                    </div>
                  )}

                  {/* Overlays */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '0.75rem',
                      left: '0.75rem',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '4px',
                      background: 'rgba(0, 0, 0, 0.65)',
                      color: '#cbd5e1',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                    }}
                  >
                    CANDIDATE SELF-VIEW
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      bottom: '0.75rem',
                      left: '0.75rem',
                      right: '0.75rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: isMicOn ? '#34d399' : '#f87171',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      {isMicOn ? <Mic size={11} /> : <MicOff size={11} />}
                      <span>{isMicOn ? 'Mic Active' : 'Muted'}</span>
                    </span>

                    <span
                      style={{
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#94a3b8',
                        fontSize: '0.68rem',
                      }}
                    >
                      1080p • 30fps
                    </span>
                  </div>
                </div>
              </div>

              {/* Floating Bottom Control Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.85)',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em' }}>
                    {formatTimer(callDuration)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>&bull; Target: {targetRole}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {/* Mic Toggle */}
                  <button
                    onClick={() => setIsMicOn(!isMicOn)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '1px solid',
                      borderColor: isMicOn ? 'rgba(255, 255, 255, 0.15)' : 'rgba(239, 68, 68, 0.4)',
                      background: isMicOn ? 'rgba(255, 255, 255, 0.08)' : 'rgba(239, 68, 68, 0.2)',
                      color: isMicOn ? '#fff' : '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title={isMicOn ? 'Mute Microphone' : 'Unmute Microphone'}
                  >
                    {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
                  </button>

                  {/* Camera Toggle */}
                  <button
                    onClick={() => setIsCameraOn(!isCameraOn)}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      border: '1px solid',
                      borderColor: isCameraOn ? 'rgba(255, 255, 255, 0.15)' : 'rgba(239, 68, 68, 0.4)',
                      background: isCameraOn ? 'rgba(255, 255, 255, 0.08)' : 'rgba(239, 68, 68, 0.2)',
                      color: isCameraOn ? '#fff' : '#f87171',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
                  >
                    {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                  </button>

                  {/* Voice-to-Text Speech Dictation */}
                  <button
                    onClick={toggleSpeechRecognition}
                    style={{
                      padding: '0 1rem',
                      height: '40px',
                      borderRadius: '20px',
                      border: '1px solid',
                      borderColor: isListeningSpeech ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)',
                      background: isListeningSpeech ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                      color: isListeningSpeech ? '#60a5fa' : '#cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title="Speak your answer directly into your microphone"
                  >
                    <Mic size={15} />
                    <span>{isListeningSpeech ? 'Listening (Speaking)...' : 'Dictate with Voice'}</span>
                  </button>

                  {/* End Call Button */}
                  <button
                    onClick={() => setIsInCall(!isInCall)}
                    style={{
                      padding: '0 1rem',
                      height: '40px',
                      borderRadius: '20px',
                      background: isInCall ? '#ef4444' : '#10b981',
                      border: 'none',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {isInCall ? <PhoneOff size={16} /> : <PhoneCall size={16} />}
                    <span>{isInCall ? 'Disconnect' : 'Reconnect'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stepper Navigation */}
            <div
              className="card"
              style={{
                padding: '1rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Interview Questions ({session.questions.length}):
                </span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {session.questions.map((q: any, i: number) => {
                    const isCurrent = i === activeQuestionIndex;
                    const isDone = !!evaluations[q.id];
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setActiveQuestionIndex(i);
                          setUserAnswer('');
                        }}
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          border: '1px solid',
                          borderColor: isCurrent ? '#3b82f6' : isDone ? '#10b981' : 'var(--border-subtle)',
                          background: isCurrent ? 'rgba(37, 99, 235, 0.25)' : isDone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                          color: isCurrent ? '#60a5fa' : isDone ? '#34d399' : '#94a3b8',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                        }}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setSession(null)}
                className="btn btn-secondary"
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem' }}
              >
                Reset Session
              </button>
            </div>
          </div>

          {/* Right Column: Active Question & Answer & AI Feedback */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Active Question Card */}
            <div
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                padding: '1.75rem',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '20px',
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}
                >
                  {currentQ.category || 'German Assessment Metric'}
                </span>
                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  Stage {activeQuestionIndex + 1} of {session.questions.length}
                </span>
              </div>

              <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#fff', margin: 0, lineHeight: '1.45' }}>
                {currentQ.question}
              </h2>

              {currentQ.tips && (
                <div
                  style={{
                    background: 'rgba(37, 99, 235, 0.08)',
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(37, 99, 235, 0.25)',
                    fontSize: '0.82rem',
                    color: '#93c5fd',
                    lineHeight: '1.5',
                  }}
                >
                  <strong style={{ color: '#fff' }}>Examiner Tip:</strong> {currentQ.tips}
                </div>
              )}

              {/* Answer Input */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Candidate Verbal / Written Response:
                  </label>
                  {isListeningSpeech && (
                    <span style={{ fontSize: '0.72rem', color: '#60a5fa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Radio size={12} className="animate-pulse" />
                      Live voice transcription stream active
                    </span>
                  )}
                </div>

                <textarea
                  rows={5}
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Speak into your microphone or articulate your response clearly for German consular screening and technical evaluation..."
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid var(--border-subtle)',
                    color: '#fff',
                    fontSize: '0.86rem',
                    lineHeight: '1.6',
                    resize: 'vertical',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={submitting || !userAnswer.trim()}
                  className="btn btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.65rem 1.35rem',
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)',
                  }}
                >
                  {submitting ? <RefreshCw className="animate-spin" size={15} /> : <Send size={15} />}
                  <span>{submitting ? 'Analyzing Response...' : 'Submit & Score Answer'}</span>
                </button>
              </div>
            </div>

            {/* AI Agent Evaluation Feedback */}
            {currentEval && (
              <div
                className="card"
                style={{
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.98))',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={18} color="#34d399" />
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                      Agent 6 Evaluation Report
                    </span>
                  </div>
                  <span
                    style={{
                      padding: '0.2rem 0.6rem',
                      borderRadius: '12px',
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#34d399',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                    }}
                  >
                    Avg Score: {Math.round((currentEval.relevance + currentEval.clarity + currentEval.structure) / 3)}%
                  </span>
                </div>

                {/* Metric Bars */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Relevance</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>{currentEval.relevance}%</div>
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Clarity</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>{currentEval.clarity}%</div>
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Structure</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#a78bfa', marginTop: '0.2rem' }}>{currentEval.structure}%</div>
                  </div>
                </div>

                {/* Synthesis summary */}
                <p style={{ color: '#cbd5e1', fontSize: '0.84rem', lineHeight: '1.6', margin: 0 }}>
                  {currentEval.summary}
                </p>

                {/* Missing points & suggestions */}
                {currentEval.improvements && currentEval.improvements.length > 0 && (
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                      Key Suggestions for German Embassy / Employer:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.15rem', color: '#cbd5e1', fontSize: '0.8rem', lineHeight: '1.6' }}>
                      {currentEval.improvements.map((imp: string, i: number) => (
                        <li key={i}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Official Clearance Card (Shown when all questions answered) */}
            {isAllAnswered && (
              <div
                className="card"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(30, 41, 59, 0.95))',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={20} color="#34d399" />
                  <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                    German Interview Clearance Certificate Issued
                  </span>
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.82rem', margin: 0, lineHeight: '1.5' }}>
                  All 4 examination stages completed. Your responses meet official German consular and employer readiness benchmarks. Results have been automatically integrated into your official candidate dossier.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Overall Clearance Score: <strong style={{ color: '#34d399' }}>{session.overallScore || 88}%</strong>
                  </span>
                  <button
                    onClick={() => window.print()}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.78rem', padding: '0.4rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Download size={14} />
                    <span>Print Dossier Certificate</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Setup / Welcome Card with Qualification Gate */
        qualificationStatus !== 'QUALIFIED' ? (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '3.5rem 2rem',
              border: '1px dashed rgba(245, 158, 11, 0.4)',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fbbf24',
                margin: '0 auto 1.25rem',
              }}
            >
              <Lock size={30} />
            </div>

            <div
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
                color: '#fbbf24',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                marginBottom: '0.85rem',
              }}
            >
              INTERVIEW ACCESS LOCKED &bull; PREREQUISITE REQUIRED
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem' }}>
              Statutory Qualification Required Before Video Interview
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.88rem', maxWidth: '580px', margin: '0 auto 1.25rem', lineHeight: '1.6' }}>
              The Live Online Video Interview Studio with German examiners and corporate recruiters is unlocked <strong style={{ color: '#fff' }}>strictly when your dossier achieves verified QUALIFIED status</strong>.
            </p>

            <div
              style={{
                maxWidth: '460px',
                margin: '0 auto 1.75rem',
                padding: '0.85rem 1.15rem',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
              }}
            >
              <span style={{ color: '#94a3b8' }}>Your Current Evaluation Status:</span>
              <span
                style={{
                  fontWeight: 700,
                  color: qualificationStatus === 'PARTIALLY_QUALIFIED' ? '#fbbf24' : '#f87171',
                }}
              >
                {qualificationStatus.replace(/_/g, ' ')}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                to="/qualification"
                className="btn btn-primary"
                style={{
                  padding: '0.75rem 1.85rem',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)',
                }}
              >
                <Award size={16} />
                <span>Run Qualification Assessment to Unlock</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/opportunities"
                className="btn btn-secondary"
                style={{
                  padding: '0.75rem 1.4rem',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  textDecoration: 'none',
                }}
              >
                <Briefcase size={15} />
                <span>Browse Opportunities</span>
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="card"
            style={{
              textAlign: 'center',
              padding: '3.5rem 2rem',
              border: '1px dashed rgba(16, 185, 129, 0.35)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.06), rgba(15, 23, 42, 0.8))',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                margin: '0 auto 1.25rem',
              }}
            >
              <Video size={30} />
            </div>

            <div
              style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                borderRadius: '20px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                marginBottom: '0.85rem',
              }}
            >
              CANDIDATE QUALIFIED &bull; VIDEO INTERVIEW ROOM UNLOCKED
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '0 0 0.5rem' }}>
              Ready for Your Official Online Video Interview?
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', maxWidth: '560px', margin: '0 auto 1.75rem', lineHeight: '1.6' }}>
              Congratulations! Your credentials meet German statutory benchmarks. You are officially cleared to enter the video conference room. Rehearse real-time German questions with Dr. Elena Weber, receive instant rubric scoring, and obtain your official clearance badge.
            </p>

            <button
              onClick={handleStartSession}
              disabled={starting}
              className="btn btn-primary"
              style={{ padding: '0.75rem 2rem', fontSize: '0.92rem', boxShadow: '0 4px 14px 0 rgba(37, 99, 235, 0.39)' }}
            >
              {starting ? 'Connecting to Conference Room...' : 'Enter Live Video Interview Room'}
            </button>
          </div>
        )
      )}
    </div>
  );
};

export default InterviewPrepPage;
