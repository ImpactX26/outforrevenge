import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Bot,
  FileCheck2,
  Award,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Video,
  FileEdit,
  Clock,
  ChevronDown,
  ChevronUp,
  Database,
  Users,
  Lock,
  Search,
  ExternalLink,
} from 'lucide-react';
import Journey3DCanvas from '../components/Journey3DCanvas';

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqItems = [
    {
      q: 'Does Nexora guarantee my German visa or university admission?',
      a: 'No. Nexora does not make false visa or job guarantees. German visas are issued solely at the discretion of the German diplomatic missions (Embassies/Consulates) and Ausländerbehörde based on statutory immigration laws (AufenthG). Nexora provides rigorous, deterministic qualification assessments and document readiness to maximize your legitimate eligibility.',
    },
    {
      q: 'Why do Indian applicants need the APS certificate?',
      a: 'Since November 2022, the Academic Evaluation Centre (Akademische Prüfstelle - APS) certificate is a mandatory prerequisite for Indian students applying for German university study visas. It verifies the authenticity of Indian academic credentials before your visa file is submitted.',
    },
    {
      q: 'Can I apply for an Ausbildung without knowing German?',
      a: 'Almost all German vocational schools (Berufsschulen) require a minimum of Goethe B1 or B2 German, as classroom instruction and employer training are in German. Nexora identifies this gap early and routes you to the Educaro Fast-Track German Language Academy to attain B1 certification.',
    },
    {
      q: 'How does Nexora protect my personal documents and privacy?',
      a: 'All uploaded degrees, transcripts, and passport copies are encrypted and processed through secure Cloudinary and Neon PostgreSQL storage. Data is never sold, and AI reasoning is restricted to your authorized relocation evaluation.',
    },
    {
      q: 'What role does Educaro Deutschland GmbH play?',
      a: 'Educaro Deutschland GmbH is a premier German education and career transition organization headquartered in Germany. Educaro provides certified language academies, vocational school placement, and licensed human consultant coaching for Nexora applicants.',
    },
    {
      q: 'How is the German GPA calculated (Bayerische Formel)?',
      a: 'Germany uses the Modified Bavarian Formula: German Grade = 1 + 3 × [(Nmax - Nd) / (Nmax - Nmin)], where Nmax is maximum possible grade, Nmin is minimum passing grade, and Nd is your obtained grade. Nexora calculates this conversion automatically from your uploaded marksheets.',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      {/* 1. Navbar (Strictly Login & Register for Visitors) */}
      <header
        style={{
          height: '70px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          maxWidth: '1280px',
          margin: '0 auto',
          position: 'sticky',
          top: 0,
          background: 'rgba(11, 17, 32, 0.85)',
          backdropFilter: 'blur(12px)',
          zIndex: 50,
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.25rem',
              boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)',
            }}
          >
            N
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Nexora
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.04em' }}>
              GERMANY JOURNEY PLATFORM
            </div>
          </div>
        </Link>

        {/* Visitors See ONLY Login and Register */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to="/login"
            className="btn"
            style={{
              padding: '0.55rem 1.25rem',
              fontSize: '0.86rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
            }}
          >
            Login
          </Link>
          <Link
            to="/register"
            className="btn btn-primary"
            style={{ padding: '0.55rem 1.35rem', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>Register</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* 2. Hero Section with 3D Canvas */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '3.5rem auto 2.5rem auto',
          padding: '0 1.5rem',
          textAlign: 'center',
        }}
      >
        <div
          className="badge badge-blue"
          style={{
            marginBottom: '1.5rem',
            padding: '0.4rem 1rem',
            fontSize: '0.82rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Sparkles size={15} />
          <span>Sponsor: Educaro Deutschland GmbH • Agentic AI Relocation Platform</span>
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5.5vw, 4.4rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '1.25rem',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Your intelligent journey <br />
          <span
            style={{
              background: 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            to Germany.
          </span>
        </h1>

        <p
          style={{
            fontSize: '1.18rem',
            color: 'var(--text-secondary)',
            maxWidth: '780px',
            margin: '0 auto 2.5rem auto',
            lineHeight: 1.65,
          }}
        >
          From your first conversation to a verified credential profile, deterministic statutory qualification check, personalized 7-step roadmap, and German-standard Lebenslauf CV. Designed specifically for Indian applicants exploring Study, Ausbildung, and Employment.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
          <Link
            to="/register"
            className="btn btn-primary"
            style={{ padding: '0.85rem 2.2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span>Start Your Journey</span>
            <ArrowRight size={18} />
          </Link>
          <a
            href="#how-it-works"
            className="btn"
            style={{
              padding: '0.85rem 2rem',
              fontSize: '1rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#fff',
            }}
          >
            See How It Works
          </a>
        </div>

        {/* 3D Interactive Hero Canvas (India -> Germany + Floating Agent Nodes) */}
        <div style={{ marginTop: '2rem' }}>
          <Journey3DCanvas />
        </div>
      </section>

      {/* 3. The Problem: The Fragmented Journey */}
      <section style={{ maxWidth: '1100px', margin: '6rem auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="badge badge-purple" style={{ marginBottom: '0.75rem' }}>The Reality of Relocation</div>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
            Why Indian Applicants Face Friction
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '680px', margin: '0 auto' }}>
            Moving to Germany is hindered by fragmented advice, unvetted agencies, and complex statutory requirements.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="card-glass" style={{ padding: '1.75rem', borderLeft: '4px solid #ef4444' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#f87171', marginBottom: '0.6rem' }}>Confusing Regulatory Silos</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Navigating Anabin database statuses (H+ vs H+/-), mandatory APS India verification, Uni-Assist deadlines, and statutory AufenthG rules leaves applicants overwhelmed and prone to costly errors.
            </p>
          </div>

          <div className="card-glass" style={{ padding: '1.75rem', borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#fbbf24', marginBottom: '0.6rem' }}>Opaque Commercial Agencies</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Traditional consultancies frequently push expensive private universities with high tuition fees rather than legitimate tuition-free public universities or sponsored Ausbildung opportunities.
            </p>
          </div>

          <div className="card-glass" style={{ padding: '1.75rem', borderLeft: '4px solid #3b82f6' }}>
            <h3 style={{ fontSize: '1.15rem', color: '#60a5fa', marginBottom: '0.6rem' }}>The Nexora Solution</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6 }}>
              A deterministic qualification engine grounded in German statutory criteria, backed by real OCR document extraction, transparent provenance tags, and direct official Educaro Deutschland pathways.
            </p>
          </div>
        </div>
      </section>

      {/* 4. How Nexora Works (Interactive 5-Step Timeline) */}
      <section id="how-it-works" style={{ maxWidth: '1100px', margin: '6rem auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="badge badge-blue" style={{ marginBottom: '0.75rem' }}>Milestone Timeline</div>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
            How Nexora Guides Your Journey
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '640px', margin: '0 auto' }}>
            A structured, 5-stage progression from your initial profile to application-ready German dossiers.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {[
            { step: '01', title: 'Dossier Intake', desc: 'Define your goal (Study, Ausbildung, Work) and input education history with automated Bayerische Formel grade conversion.' },
            { step: '02', title: 'Document OCR', desc: 'Upload degrees, marksheets, and language scorecards. Real OCR extracts credentials with cryptographic provenance.' },
            { step: '03', title: 'Video Intro', desc: 'Record or upload a 60-second video. Whisper STT evaluates spoken German/English clarity and motivation.' },
            { step: '04', title: 'Qualification Check', desc: 'Deterministic evaluation against statutory criteria. AI provides plain-language explanations of gaps.' },
            { step: '05', title: 'Actionable Roadmap', desc: 'Unlock your next step: Educaro Fast-Track Language Academy, APS package, or German Lebenslauf generation.' },
          ].map((s, idx) => (
            <div key={idx} className="card-glass" style={{ padding: '1.5rem', position: 'relative' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'rgba(59, 130, 246, 0.35)', marginBottom: '0.5rem' }}>
                {s.step}
              </div>
              <h4 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '0.5rem', fontWeight: 700 }}>
                {s.title}
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: 1.55 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Multi-Agent Intelligence */}
      <section style={{ maxWidth: '1100px', margin: '6rem auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="badge badge-purple" style={{ marginBottom: '0.75rem' }}>Coordinated Architecture</div>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
            Multi-Agent Intelligence Over Shared PostgreSQL
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '680px', margin: '0 auto' }}>
            Nexora is not a simple chatbot. A Master Orchestrator coordinates specialized autonomous agents over a shared PostgreSQL state with bounded execution.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', color: '#38bdf8' }}>
              <Bot size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Profile Intelligence Agent</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Structures fragmented applicant narratives into standardized profile records. Manages goal selection and normalizes academic marks.
            </p>
          </div>

          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', color: '#34d399' }}>
              <FileCheck2 size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Document Intelligence Agent</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Performs genuine OCR parsing on Indian transcripts, degrees, and certificates. Extracts institution, CGPA, graduation year, and CEFR language levels.
            </p>
          </div>

          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', color: '#fbbf24' }}>
              <ShieldCheck size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Deterministic Qualification Engine</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Zero LLM hallucination in legal decisions. Evaluates explicit statutory requirements deterministically, with AI generating grounded plain-language feedback.
            </p>
          </div>

          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', color: '#a78bfa' }}>
              <Layers size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Educaro Ecosystem Routing Agent</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Matches identified gaps with highest-impact solutions: Educaro Fast-Track German Language Academy, APS Express packages, or human consultant review.
            </p>
          </div>

          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', color: '#f472b6' }}>
              <Video size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>60-Second Video Intro Agent</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Transcribes spoken self-introductions via Whisper STT. Proposes communication profile updates requiring explicit applicant confirmation.
            </p>
          </div>

          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem', color: '#60a5fa' }}>
              <FileEdit size={22} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>German Lebenslauf CV Builder</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Compiles verified applicant credentials into German DIN 5008 standard Lebenslauf CVs with AI provenance labels and one-click PDF export.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Document Intelligence & Provenance Tracking */}
      <section style={{ maxWidth: '1100px', margin: '6rem auto', padding: '0 1.5rem' }}>
        <div className="card-glass" style={{ padding: '2.5rem', background: 'radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.15) 0%, rgba(15, 23, 42, 0.85) 100%)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            <div>
              <div className="badge badge-blue" style={{ marginBottom: '0.75rem' }}>Cryptographic Provenance</div>
              <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>
                Every Extracted Field Has a Verifiable Origin
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.94rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                In Nexora, AI is never a black box. When your Bachelor degree, marksheet, or Goethe certificate is processed, every single extracted attribute stores its provenance: source document ID, page number, confidence percentage, and extraction timestamp.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span>Cloudinary encrypted storage with signed URL delivery</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span>Real PDF parser & OCR engine (zero mock strings)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.88rem' }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span>Flagging ambiguous scans for Educaro human consultant review</span>
                </div>
              </div>
            </div>

            {/* Provenance Badge Showcase */}
            <div
              style={{
                background: 'rgba(11, 17, 32, 0.9)',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div style={{ fontSize: '0.82rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                System Provenance Taxonomy
              </div>
              {[
                { tag: 'APPLICANT_PROVIDED', color: '#60a5fa', desc: 'Directly submitted by applicant via onboarding forms' },
                { tag: 'DOCUMENT_EXTRACTED', color: '#34d399', desc: 'Extracted via OCR from verified Indian transcripts' },
                { tag: 'VIDEO_EXTRACTED', color: '#ec4899', desc: 'Transcribed via Whisper STT from 60s video intro' },
                { tag: 'AI_GENERATED', color: '#fbbf24', desc: 'Synthesized by Groq LLM under deterministic constraints' },
                { tag: 'CONSULTANT_VERIFIED', color: '#a78bfa', desc: 'Formally approved by licensed Educaro human advisor' },
              ].map((p, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <span style={{ fontSize: '0.74rem', padding: '0.2rem 0.6rem', borderRadius: '4px', background: `${p.color}22`, color: p.color, fontWeight: 700, fontFamily: 'monospace' }}>
                    {p.tag}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'right', maxWidth: '210px' }}>
                    {p.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Qualification Assessment Example (Marked "EXAMPLE") */}
      <section style={{ maxWidth: '1100px', margin: '6rem auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="badge badge-yellow" style={{ marginBottom: '0.75rem' }}>Live Demonstration</div>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
            Deterministic Assessment in Action
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '640px', margin: '0 auto' }}>
            Transparent rule evaluations against German statutory criteria. Notice how missing requirements are isolated and linked to direct solutions.
          </p>
        </div>

        {/* Example Card Container */}
        <div
          className="card"
          style={{
            maxWidth: '850px',
            margin: '0 auto',
            border: '2px solid rgba(245, 158, 11, 0.3)',
            background: 'rgba(15, 23, 42, 0.95)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Example Watermark Banner */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '-32px',
              transform: 'rotate(45deg)',
              background: '#f59e0b',
              color: '#000',
              fontWeight: 800,
              fontSize: '0.7rem',
              padding: '0.25rem 2.5rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            EXAMPLE
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#60a5fa', fontWeight: 700 }}>
              RP
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
                Rohan Patel — B.E. Computer Engineering (Mumbai University)
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Evaluation Target: <strong style={{ color: '#60a5fa' }}>Ausbildung (IT Specialist - Fachinformatiker)</strong>
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', padding: '0.85rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <AlertCircle size={20} color="#fbbf24" />
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fbbf24' }}>
                Status: PARTIALLY_QUALIFIED (Score: 68%)
              </div>
              <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                Academic qualifications are verified, but language prerequisite (Goethe B1) is unmet.
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="markdown-table-wrapper" style={{ margin: '0 0 1.25rem 0' }}>
            <table>
              <thead>
                <tr>
                  <th>Statutory Requirement</th>
                  <th>Status</th>
                  <th>Evidence & Provenance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>12th Standard PCM Higher Secondary</strong></td>
                  <td><span style={{ color: '#34d399', fontWeight: 600 }}>MET</span></td>
                  <td>CBSE Class XII Marksheet (Extracted: 84.6%, Provenance: Doc #102)</td>
                </tr>
                <tr>
                  <td><strong>Anabin H+ Recognized Institution</strong></td>
                  <td><span style={{ color: '#34d399', fontWeight: 600 }}>MET</span></td>
                  <td>University of Mumbai verified in official Anabin database</td>
                </tr>
                <tr>
                  <td><strong>German Language B1 Certification</strong></td>
                  <td><span style={{ color: '#f87171', fontWeight: 600 }}>MISSING</span></td>
                  <td>No Goethe-Zertifikat B1 or telc Deutsch found in dossier</td>
                </tr>
                <tr>
                  <td><strong>APS India Verification</strong></td>
                  <td><span style={{ color: '#fbbf24', fontWeight: 600 }}>PENDING</span></td>
                  <td>Mandatory for university visa file submission</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Automated Remediation Action */}
          <div style={{ padding: '1rem', background: 'rgba(37, 99, 235, 0.12)', borderRadius: '8px', border: '1px solid rgba(37, 99, 235, 0.3)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#93c5fd', marginBottom: '0.25rem' }}>
              🎯 Recommended Remediation Action:
            </div>
            <div style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              Enroll in the <strong>Educaro Fast-Track German Language Academy (A1&rarr;B1)</strong> to satisfy the vocational school language prerequisite within 4–6 months.
            </div>
          </div>
        </div>
      </section>

      {/* 8. Next Step with Educaro */}
      <section style={{ maxWidth: '1100px', margin: '6rem auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="badge badge-blue" style={{ marginBottom: '0.75rem' }}>Ecosystem Integration</div>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
            Official Educaro Deutschland Solutions
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '640px', margin: '0 auto' }}>
            Nexora does not leave you with passive gap reports. Every gap is paired with an official Educaro Deutschland pathway.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="card-glass" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', color: '#60a5fa' }}>
              <GraduationCap size={24} />
              <h3 style={{ fontSize: '1.18rem', fontWeight: 700 }}>Fast-Track German Academy</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Accelerate from A1 to Goethe B1 in 4–6 months. Live interactive small groups taught by Goethe-certified teachers with official B1 exam preparation vouchers.
            </p>
            <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>
              • Online Live Classes • Hybrid Immersion in Germany
            </div>
          </div>

          <div className="card-glass" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', color: '#34d399' }}>
              <FileCheck2 size={24} />
              <h3 style={{ fontSize: '1.18rem', fontWeight: 700 }}>APS India Express Package</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Pre-audit of Indian transcripts, Digilocker integration, and university registrar coordination to expedite your Academic Evaluation Centre certificate.
            </p>
            <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
              • Pre-Audit Guarantee • 0% Rejection Rate on Format
            </div>
          </div>

          <div className="card-glass" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1rem', color: '#a78bfa' }}>
              <Briefcase size={24} />
              <h3 style={{ fontSize: '1.18rem', fontWeight: 700 }}>Vocational Dual Placement</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              Direct employer matching with German healthcare facilities and IT enterprises offering paid Ausbildung contracts (€1,000–€1,400 monthly stipend).
            </p>
            <div style={{ fontSize: '0.8rem', color: '#a78bfa', fontWeight: 600 }}>
              • Contract Matching • Residence Permit Coaching
            </div>
          </div>
        </div>
      </section>

      {/* 9. The Three Pathways (Study vs Ausbildung vs Employment) */}
      <section style={{ maxWidth: '1100px', margin: '6rem auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div className="badge badge-purple" style={{ marginBottom: '0.75rem' }}>Comparative Matrix</div>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
            Three Pathways to Build Your Life in Germany
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '640px', margin: '0 auto' }}>
            Choose the trajectory that matches your educational background, timeline, and financial goals.
          </p>
        </div>

        <div className="markdown-table-wrapper" style={{ margin: '0 auto', maxWidth: '1000px' }}>
          <table>
            <thead>
              <tr>
                <th>Pathway Dimension</th>
                <th>🎓 University Study</th>
                <th>🛠️ Dual Ausbildung</th>
                <th>💼 Skilled Employment</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Target Audience</strong></td>
                <td>12th/Bachelors graduates seeking Masters or Bachelors degrees</td>
                <td>12th/Diploma holders wanting hands-on career & immediate income</td>
                <td>Experienced tech/engineering professionals with 2+ years exp</td>
              </tr>
              <tr>
                <td><strong>Tuition & Earnings</strong></td>
                <td>Tuition-free public universities (Semester fee ~€300)</td>
                <td><strong>Paid monthly stipend: €1,000 to €1,400/month</strong></td>
                <td>Full German market salary (€45,000 to €85,000+/year)</td>
              </tr>
              <tr>
                <td><strong>Financial Proof (Visa)</strong></td>
                <td>Blocked account required (~€11,904/year)</td>
                <td><strong>No blocked account needed</strong> (Stipend covers living)</td>
                <td>Employment contract meets income threshold</td>
              </tr>
              <tr>
                <td><strong>Language Prerequisite</strong></td>
                <td>English IELTS 6.5+ (English degrees) or German C1</td>
                <td><strong>Goethe B1 or B2 German mandatory</strong></td>
                <td>English B2+ (Tech roles) or German B1+</td>
              </tr>
              <tr>
                <td><strong>Mandatory Verification</strong></td>
                <td>APS India Certificate + Uni-Assist Vorprüfungsdokumentation</td>
                <td>Anerkennung (Foreign credential equivalence check)</td>
                <td>ZAB Statement of Comparability / Blue Card check</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 10. AI German Lebenslauf CV Builder Showcase */}
      <section style={{ maxWidth: '1100px', margin: '6rem auto', padding: '0 1.5rem' }}>
        <div className="card-glass" style={{ padding: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'center' }}>
          <div>
            <div className="badge badge-blue" style={{ marginBottom: '0.75rem' }}>DIN 5008 Compliant</div>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>
              German Lebenslauf CV Builder
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.94rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
              Standard Indian CV formats are routinely rejected by German hiring managers. Nexora structures your verified profile records into the rigorous German reverse-chronological Lebenslauf format.
            </p>
            <ul style={{ color: '#cbd5e1', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingLeft: '1.25rem' }}>
              <li>Proper German photo placement and personal data headers</li>
              <li>Reverse chronological education and professional timeline</li>
              <li>CEFR language proficiency breakdown (A1–C2 scale)</li>
              <li>Single-click PDF generation with official provenance footnote</li>
            </ul>
          </div>

          <div style={{ background: '#090d16', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>LEBENSLAUF — MUSTER</span>
              <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>DIN 5008 PDF</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: 1.6 }}>
              <div style={{ color: '#fff', fontWeight: 600 }}>Berufsausbildung (Education)</div>
              <div>• 2020 – 2024: Bachelor of Engineering, Mumbai University</div>
              <div style={{ color: '#fff', fontWeight: 600, marginTop: '0.5rem' }}>Sprachkenntnisse (Languages)</div>
              <div>• Englisch: Verhandlungssicher (C1) — IELTS 7.5</div>
              <div>• Deutsch: Grundkenntnisse (A2) — Ziel: Goethe B1</div>
              <div style={{ color: '#fff', fontWeight: 600, marginTop: '0.5rem' }}>IT-Kenntnisse (Technical Skills)</div>
              <div>• Python, TypeScript, PostgreSQL, Linux Systemadministration</div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Human Consultant Support */}
      <section style={{ maxWidth: '1100px', margin: '6rem auto', padding: '0 1.5rem' }}>
        <div className="card-glass" style={{ padding: '2.5rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: '#a78bfa' }}>
            <Users size={26} />
          </div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
            Human Consultant Escalation When You Need It
          </h2>
          <p style={{ color: '#94a3b8', maxWidth: '700px', margin: '0 auto 2rem auto', fontSize: '0.95rem', lineHeight: 1.65 }}>
            Automated intelligence is powerful, but complex edge cases require human judgment. Experienced Educaro Deutschland consultants in Berlin, Frankfurt, and India are integrated directly into the Nexora platform to review flagged documents and conduct mock visa interviews.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.75rem 1.75rem', fontSize: '0.9rem' }}>
              Book an Educaro Assessment
            </Link>
          </div>
        </div>
      </section>

      {/* 12. FAQ Section */}
      <section style={{ maxWidth: '850px', margin: '6rem auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="badge badge-blue" style={{ marginBottom: '0.75rem' }}>Clear Answers</div>
          <h2 style={{ fontSize: '2.3rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: '#94a3b8' }}>
            Zero false promises. Honest, statutory immigration realities for Germany.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {faqItems.map((item, idx) => (
            <div
              key={idx}
              className="card-glass"
              style={{ padding: '1.25rem 1.5rem', cursor: 'pointer', transition: 'all 0.2s ease' }}
              onClick={() => toggleFaq(idx)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', margin: 0 }}>
                  {item.q}
                </h4>
                {openFaq === idx ? <ChevronUp size={18} color="#60a5fa" /> : <ChevronDown size={18} color="#64748b" />}
              </div>
              {openFaq === idx && (
                <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6, marginTop: '0.85rem', marginBottom: 0 }}>
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 13. Final CTA Banner */}
      <section style={{ maxWidth: '1100px', margin: '6rem auto 4rem auto', padding: '0 1.5rem' }}>
        <div
          className="card"
          style={{
            padding: '3.5rem 2rem',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
          }}
        >
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, color: '#fff', marginBottom: '1rem' }}>
            Ready to Begin Your Intelligent Journey to Germany?
          </h2>
          <p style={{ color: '#cbd5e1', maxWidth: '640px', margin: '0 auto 2.25rem auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Set up your dossier, upload your credentials for automated OCR extraction, and uncover your deterministic qualification roadmap in minutes.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link
              to="/register"
              className="btn btn-primary"
              style={{ padding: '0.9rem 2.5rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span>Get Started Now</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* 14. Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '3rem 2rem 2rem',
          maxWidth: '1280px',
          margin: '0 auto',
          color: '#64748b',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg, #2563eb, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>
              N
            </div>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>Nexora</span>
            <span style={{ color: '#475569' }}>—</span>
            <span style={{ color: '#94a3b8' }}>Your intelligent journey to Germany.</span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.82rem' }}>
            <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: '#94a3b8', textDecoration: 'none' }}>Register</Link>
            <a href="#how-it-works" style={{ color: '#94a3b8', textDecoration: 'none' }}>How It Works</a>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.76rem', color: '#475569', lineHeight: 1.6 }}>
          <div>© 2026 Nexora. In official partnership with Educaro Deutschland GmbH.</div>
          <div style={{ marginTop: '0.35rem' }}>
            Disclaimer: Nexora provides AI-assisted qualification assessments and informational preparation tools. We are not a government agency and do not issue visas or permits. Official immigration decisions are made exclusively by German federal authorities.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
