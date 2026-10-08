import React from 'react';
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
  Video,
  FileEdit,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Top Navigation */}
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
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #2563eb, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.2rem',
            }}
          >
            N
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              Nexora
            </div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/login" className="btn-secondary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}>
            Sign In
          </Link>
          <Link to="/register" className="btn-primary" style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}>
            Start Your Journey <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: '1100px',
          margin: '4rem auto 3rem auto',
          padding: '0 1.5rem',
          textAlign: 'center',
        }}
      >
        <div
          className="badge badge-blue"
          style={{ marginBottom: '1.5rem', padding: '0.35rem 0.9rem', fontSize: '0.8rem' }}
        >
          <Sparkles size={14} /> Agentic AI Applicant Journey • Sponsor: Educaro Deutschland GmbH
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.5rem, 5.5vw, 4.2rem)',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '1.5rem',
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
            fontSize: '1.2rem',
            color: 'var(--text-secondary)',
            maxWidth: '740px',
            margin: '0 auto 2.5rem auto',
            lineHeight: 1.6,
          }}
        >
          From your first conversation to a structured profile, qualification assessment, personalized roadmap and application-ready CV. Designed specifically for Indian applicants exploring Study, Ausbildung, and Employment in Germany.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/register" className="btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}>
            Start Your Journey <ArrowRight size={18} />
          </Link>
          <a href="#features" className="btn-secondary" style={{ padding: '0.85rem 1.8rem', fontSize: '1rem' }}>
            See How It Works
          </a>
        </div>

        {/* Pathways Bar */}
        <div
          style={{
            marginTop: '3.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            textAlign: 'left',
          }}
        >
          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ background: 'rgba(37, 99, 235, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                <GraduationCap size={22} color="#60a5fa" />
              </div>
              <h3 style={{ fontSize: '1.15rem' }}>Study in Germany</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Master and Bachelor degree admissions, APS India guidance, Anabin H+ equivalency, and Uni-Assist preparation.
            </p>
          </div>

          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                <Briefcase size={22} color="#34d399" />
              </div>
              <h3 style={{ fontSize: '1.15rem' }}>Ausbildung (Dual Training)</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              Vocational training in IT, Healthcare, and Engineering with monthly stipends (€1,000+) and Goethe B1 acceleration.
            </p>
          </div>

          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.5rem', borderRadius: '8px' }}>
                <Award size={22} color="#818cf8" />
              </div>
              <h3 style={{ fontSize: '1.15rem' }}>Skilled Employment</h3>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
              EU Blue Card job matching for experienced engineers and tech specialists with German employer sponsorship.
            </p>
          </div>
        </div>
      </section>

      {/* Architecture / Multi-Agent Showcase */}
      <section id="features" style={{ maxWidth: '1100px', margin: '5rem auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div className="badge badge-purple" style={{ marginBottom: '0.75rem' }}>Multi-Agent Intelligence</div>
          <h2 style={{ fontSize: '2.4rem', marginBottom: '0.75rem' }}>A Genuine Multi-Agent Journey</h2>
          <p style={{ color: '#94a3b8', maxWidth: '650px', margin: '0 auto' }}>
            Nexora is not a single chatbot. A Master Orchestrator coordinates specialized agents over a shared PostgreSQL state with full provenance and deterministic guardrails.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ color: '#3b82f6', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileCheck2 size={20} />
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Document Intelligence Agent</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Extracts credentials from Indian degrees, transcripts, marksheets, and language certificates with verified confidence and provenance tracking.
            </p>
          </div>

          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ color: '#10b981', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} />
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Deterministic Qualification Engine</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Rule-based evaluation against German statutory requirements. AI generates clear plain-language explanations without overriding deterministic criteria.
            </p>
          </div>

          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ color: '#f59e0b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Layers size={20} />
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Educaro Ecosystem Routing</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Recommends the single most effective next step: official Educaro services (Language Academy, APS package), consultant referral, or specific applicant actions.
            </p>
          </div>

          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ color: '#ec4899', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Video size={20} />
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>60-Second Video Intro Agent</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Processes audio transcription and extracts communication clarity and pathway motivation into proposed profile updates requiring applicant approval.
            </p>
          </div>

          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ color: '#06b6d4', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileEdit size={20} />
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>German Lebenslauf CV Builder</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Builds Germany-standard Lebenslauf CVs from verified applicant records. Live preview, section editing, AI summaries with provenance tags, and PDF export.
            </p>
          </div>

          <div className="card-glass" style={{ padding: '1.5rem' }}>
            <div style={{ color: '#8b5cf6', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Compass size={20} />
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Human Consultant Support</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Automated escalation to experienced human Educaro consultants whenever discrepancies, credential ambiguity, or specialized counseling is required.
            </p>
          </div>
        </div>
      </section>

      {/* Safety Notice */}
      <section style={{ maxWidth: '800px', margin: '4rem auto', padding: '1.5rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--border-subtle)', borderRadius: '12px', textAlign: 'center' }}>
        <h4 style={{ fontSize: '1rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>Nexora Ethical AI & Regulatory Standards</h4>
        <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
          Nexora never promises visa, admission, or job guarantees. All qualification decisions rely on transparent deterministic statutory criteria. AI-generated insights are labeled and never converted automatically into verified status without validation.
        </p>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '2rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
        <div>Nexora — Your intelligent journey to Germany.</div>
        <div style={{ marginTop: '0.25rem', fontSize: '0.75rem' }}>Built for ImpactX'26 Agentic AI Track • Educaro Deutschland GmbH</div>
      </footer>
    </div>
  );
};

export default LandingPage;
