import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import {
  Compass,
  GraduationCap,
  Briefcase,
  Layers,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { GoalType } from '../types';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [goal, setGoal] = useState<GoalType>('STUDY');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [availability, setAvailability] = useState('Immediately / Next Semester');
  const [degree, setDegree] = useState('');
  const [institution, setInstitution] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [gradeOrCgpa, setGradeOrCgpa] = useState('');
  const [germanLevel, setGermanLevel] = useState('A1');
  const [englishLevel, setEnglishLevel] = useState('B2');
  const [rawMotivation, setRawMotivation] = useState('');

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Update Profile Goal, Location, and Motivation
      await apiClient.patch('/applicant/profile', {
        currentGoal: goal,
        phone,
        location,
        availability,
        rawMotivation,
      });

      // 2. Add Initial Education if provided
      if (degree && institution) {
        await apiClient.post('/applicant/education', {
          degree,
          institution,
          fieldOfStudy,
          gradeOrCgpa,
        });
      }

      // 3. Add Language Proficiencies
      if (germanLevel) {
        await apiClient.post('/applicant/language', {
          language: 'German',
          proficiencyLevel: germanLevel,
        });
      }
      if (englishLevel) {
        await apiClient.post('/applicant/language', {
          language: 'English',
          proficiencyLevel: englishLevel,
        });
      }

      // 4. Trigger initial agent orchestrator to score readiness
      try {
        await apiClient.post('/ai/orchestrate');
      } catch (e) {
        // Non-blocking
      }

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save onboarding details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '780px', margin: '2rem auto', padding: '0 1rem' }}>
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #2563eb, #6366f1)',
            color: '#fff',
            marginBottom: '1rem',
          }}
        >
          <Compass size={28} />
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
          Welcome to Nexora
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.5rem' }}>
          Let's tailor your journey to Germany in 3 simple steps.
        </p>

        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: step >= s ? '#2563eb' : 'rgba(255,255,255,0.1)',
                  color: step >= s ? '#fff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                }}
              >
                {step > s ? <CheckCircle2 size={16} /> : s}
              </div>
              <span style={{ fontSize: '0.8rem', color: step === s ? '#fff' : '#64748b', fontWeight: 600 }}>
                {s === 1 ? 'Pathway' : s === 2 ? 'Education & Language' : 'Motivation'}
              </span>
              {s < 3 && <div style={{ width: '30px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Step 1: Pathway Selection */}
      {step === 1 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Select Your Target German Pathway
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              This configures deterministic qualification requirements and Educaro advisor routing.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div
              onClick={() => setGoal('STUDY')}
              style={{
                padding: '1.25rem',
                borderRadius: '10px',
                border: goal === 'STUDY' ? '2px solid #3b82f6' : '1px solid var(--border-subtle)',
                background: goal === 'STUDY' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <GraduationCap size={28} color="#3b82f6" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: '0.25rem' }}>
                Higher Education
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
                Bachelor or Master degree at German public or private universities. Uni-Assist & APS evaluation.
              </div>
            </div>

            <div
              onClick={() => setGoal('AUSBILDUNG')}
              style={{
                padding: '1.25rem',
                borderRadius: '10px',
                border: goal === 'AUSBILDUNG' ? '2px solid #3b82f6' : '1px solid var(--border-subtle)',
                background: goal === 'AUSBILDUNG' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Layers size={28} color="#10b981" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: '0.25rem' }}>
                Dual Ausbildung
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
                Salaried vocational training in Nursing, Tech, Hospitality, or Engineering with B1/B2 German.
              </div>
            </div>

            <div
              onClick={() => setGoal('EMPLOYMENT')}
              style={{
                padding: '1.25rem',
                borderRadius: '10px',
                border: goal === 'EMPLOYMENT' ? '2px solid #3b82f6' : '1px solid var(--border-subtle)',
                background: goal === 'EMPLOYMENT' ? 'rgba(37, 99, 235, 0.15)' : 'rgba(15, 23, 42, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Briefcase size={28} color="#a78bfa" style={{ marginBottom: '0.75rem' }} />
              <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem', marginBottom: '0.25rem' }}>
                Skilled Employment
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.4' }}>
                Direct job placement for qualified specialists under EU Blue Card and Opportunity Card (Chancenkarte).
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Current Country / Location
              </label>
              <input
                type="text"
                placeholder="e.g. Bangalore, India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Phone Number (WhatsApp for Consultant updates)
              </label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button
              onClick={() => setStep(2)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem' }}
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Education & Language */}
      {step === 2 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Academic Background & Languages
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              These will be checked against the German Anabin database and CEFR language framework.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Highest Degree Title
              </label>
              <input
                type="text"
                placeholder="e.g. Bachelor of Technology (B.Tech)"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Institution / University
              </label>
              <input
                type="text"
                placeholder="e.g. University of Delhi"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Field of Study
              </label>
              <input
                type="text"
                placeholder="e.g. Computer Science, Mechanical Eng."
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Grade / CGPA / Percentage
              </label>
              <input
                type="text"
                placeholder="e.g. 8.4 / 10 or 82%"
                value={gradeOrCgpa}
                onChange={(e) => setGradeOrCgpa(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                German CEFR Level
              </label>
              <select
                value={germanLevel}
                onChange={(e) => setGermanLevel(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              >
                <option value="None">None (Beginner)</option>
                <option value="A1">A1 (Basic)</option>
                <option value="A2">A2 (Elementary)</option>
                <option value="B1">B1 (Intermediate)</option>
                <option value="B2">B2 (Upper Intermediate)</option>
                <option value="C1">C1 (Advanced)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                English CEFR Level
              </label>
              <select
                value={englishLevel}
                onChange={(e) => setEnglishLevel(e.target.value)}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              >
                <option value="B1">B1 (Intermediate)</option>
                <option value="B2">B2 (Vantage / Upper Intermediate)</option>
                <option value="C1">C1 (Effective Operational Proficiency)</option>
                <option value="C2">C2 (Mastery)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button
              onClick={() => setStep(1)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStep(3)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.5rem' }}
            >
              <span>Continue</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Motivation & Finalize */}
      {step === 3 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Your Motivation for Germany
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Why do you want to relocate or study in Germany? Our AI and Educaro advisors use this to draft your Anschreiben.
            </p>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Motivation Statement
            </label>
            <textarea
              rows={4}
              placeholder="e.g. I am passionate about advancing my engineering expertise in Germany due to its world-class research institutes and strong automotive and automation sector..."
              value={rawMotivation}
              onChange={(e) => setRawMotivation(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                color: '#fff',
                fontSize: '0.88rem',
                lineHeight: '1.5',
              }}
            />
          </div>

          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(37, 99, 235, 0.1)',
              border: '1px solid rgba(37, 99, 235, 0.3)',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'center',
            }}
          >
            <Sparkles size={20} color="#60a5fa" />
            <div style={{ fontSize: '0.82rem', color: '#93c5fd' }}>
              Upon completing this step, the Nexora multi-agent loop will initialize your journey timeline, analyze qualification gaps, and assign an Educaro pathway specialist.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
            <button
              onClick={() => setStep(2)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              onClick={handleComplete}
              disabled={loading}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.75rem' }}
            >
              <span>{loading ? 'Initializing Workspace...' : 'Launch Nexora Workspace'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingPage;
