import React, { useEffect, useState } from 'react';
import apiClient from '../api/client';
import {
  User,
  GraduationCap,
  Briefcase,
  Layers,
  Globe,
  Heart,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Award,
} from 'lucide-react';
import {
  ApplicantProfile,
  Education,
  Employment,
  Skill,
  Language,
  SourceType,
  VerificationStatus,
} from '../types';

export const ProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ApplicantProfile | null>(null);
  const [activeTab, setActiveTab] = useState<
    'personal' | 'education' | 'employment' | 'skills' | 'languages' | 'motivation'
  >('personal');

  // Modals / Form states
  const [showEduModal, setShowEduModal] = useState(false);
  const [newEdu, setNewEdu] = useState({
    institution: '',
    degree: '',
    fieldOfStudy: '',
    gradeOrCgpa: '',
    graduationDate: '',
  });

  const [showEmpModal, setShowEmpModal] = useState(false);
  const [newEmp, setNewEmp] = useState({
    companyName: '',
    role: '',
    responsibilities: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
  });

  const [showSkillModal, setShowSkillModal] = useState(false);
  const [newSkill, setNewSkill] = useState({
    name: '',
    category: 'Technical',
    proficiencyLevel: 'Intermediate',
  });

  const [showLangModal, setShowLangModal] = useState(false);
  const [newLang, setNewLang] = useState({
    language: 'German',
    proficiencyLevel: 'B1',
    certificateType: 'Goethe-Zertifikat',
  });

  // Personal form state
  const [personalForm, setPersonalForm] = useState({
    phone: '',
    location: '',
    availability: '',
    bio: '',
    currentGoal: 'STUDY',
  });
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/applicant/profile');
      if (res.data.success && res.data.profile) {
        setProfile(res.data.profile);
        setPersonalForm({
          phone: res.data.profile.phone || '',
          location: res.data.profile.location || '',
          availability: res.data.profile.availability || '',
          bio: res.data.profile.bio || '',
          currentGoal: res.data.profile.currentGoal || 'STUDY',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingPersonal(true);
      await apiClient.patch('/applicant/profile', personalForm);
      setFeedbackMsg('Personal details updated successfully!');
      setTimeout(() => setFeedbackMsg(null), 3000);
      await fetchProfile();
    } catch (err: any) {
      setFeedbackMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleAddEducation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/applicant/education', newEdu);
      setShowEduModal(false);
      setNewEdu({ institution: '', degree: '', fieldOfStudy: '', gradeOrCgpa: '', graduationDate: '' });
      await fetchProfile();
    } catch (err) {
      alert('Failed to add education record');
    }
  };

  const handleAddEmployment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/applicant/employment', newEmp);
      setShowEmpModal(false);
      setNewEmp({ companyName: '', role: '', responsibilities: '', startDate: '', endDate: '', isCurrent: false });
      await fetchProfile();
    } catch (err) {
      alert('Failed to add employment record');
    }
  };

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/applicant/skill', newSkill);
      setShowSkillModal(false);
      setNewSkill({ name: '', category: 'Technical', proficiencyLevel: 'Intermediate' });
      await fetchProfile();
    } catch (err) {
      alert('Failed to add skill');
    }
  };

  const handleAddLanguage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/applicant/language', newLang);
      setShowLangModal(false);
      setNewLang({ language: 'German', proficiencyLevel: 'B1', certificateType: 'Goethe-Zertifikat' });
      await fetchProfile();
    } catch (err) {
      alert('Failed to add language');
    }
  };

  const renderProvenanceBadge = (source?: SourceType, confidence?: number) => {
    let label = 'User Provided';
    let bg = 'rgba(100, 116, 139, 0.2)';
    let color = '#94a3b8';

    if (source === 'DOCUMENT_EXTRACTED') {
      label = 'Extracted from Document';
      bg = 'rgba(59, 130, 246, 0.15)';
      color = '#60a5fa';
    } else if (source === 'VIDEO_EXTRACTED') {
      label = 'Extracted from Video';
      bg = 'rgba(168, 85, 247, 0.15)';
      color = '#c084fc';
    } else if (source === 'AI_GENERATED') {
      label = 'AI Synthesized';
      bg = 'rgba(234, 179, 8, 0.15)';
      color = '#facc15';
    } else if (source === 'CONSULTANT_VERIFIED') {
      label = 'Consultant Verified';
      bg = 'rgba(16, 185, 129, 0.15)';
      color = '#34d399';
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span
          style={{
            fontSize: '0.7rem',
            padding: '0.15rem 0.5rem',
            borderRadius: '4px',
            background: bg,
            color,
            fontWeight: 600,
          }}
        >
          {label}
        </span>
        {confidence !== undefined && confidence > 0 && (
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            {Math.round(confidence * 100)}% conf
          </span>
        )}
      </div>
    );
  };

  const renderVerificationBadge = (status?: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="badge badge-success">Verified</span>;
      case 'PENDING':
        return <span className="badge badge-warning">Pending Review</span>;
      case 'REJECTED':
        return <span className="badge badge-danger">Rejected</span>;
      default:
        return <span className="badge badge-secondary">Unverified</span>;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <RefreshCw className="animate-spin" size={32} color="#3b82f6" />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div
        className="card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95), rgba(15, 23, 42, 0.95))',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Applicant Dossier & Provenance
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.3rem' }}>
            Every credential in Nexora records its origin (document extraction, speech recognition, or applicant input) for official German authority review.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>
            Dossier Completeness
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>
            {profile?.profileCompleteness || 0}%
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#93c5fd',
            fontSize: '0.85rem',
          }}
        >
          {feedbackMsg}
        </div>
      )}

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.5rem',
        }}
      >
        {[
          { key: 'personal', label: 'Personal & Goal', icon: User },
          { key: 'education', label: `Education (${profile?.educations?.length || 0})`, icon: GraduationCap },
          { key: 'employment', label: `Employment (${profile?.employments?.length || 0})`, icon: Briefcase },
          { key: 'skills', label: `Skills (${profile?.skills?.length || 0})`, icon: Layers },
          { key: 'languages', label: `Languages (${profile?.languages?.length || 0})`, icon: Globe },
          { key: 'motivation', label: 'Motivation Statement', icon: Heart },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.55rem 0.9rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'rgba(37, 99, 235, 0.25)' : 'transparent',
                color: isActive ? '#60a5fa' : '#94a3b8',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Personal & Goal */}
      {activeTab === 'personal' && (
        <form onSubmit={handleSavePersonal} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Personal Information & Goal Configuration
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                German Pathway Goal
              </label>
              <select
                value={personalForm.currentGoal}
                onChange={(e) => setPersonalForm({ ...personalForm, currentGoal: e.target.value as any })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              >
                <option value="STUDY">Higher Education (Bachelor / Master / PhD)</option>
                <option value="AUSBILDUNG">Dual Vocational Training (Ausbildung)</option>
                <option value="EMPLOYMENT">Direct Skilled Employment (Fachkraft)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Current Location (City, Country)
              </label>
              <input
                type="text"
                value={personalForm.location}
                onChange={(e) => setPersonalForm({ ...personalForm, location: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Phone / WhatsApp
              </label>
              <input
                type="text"
                value={personalForm.phone}
                onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Target Relocation Availability
              </label>
              <input
                type="text"
                value={personalForm.availability}
                onChange={(e) => setPersonalForm({ ...personalForm, availability: e.target.value })}
                placeholder="e.g. Winter Semester 2026 / October"
                style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Professional Bio / Summary
            </label>
            <textarea
              rows={3}
              value={personalForm.bio}
              onChange={(e) => setPersonalForm({ ...personalForm, bio: e.target.value })}
              placeholder="Brief summary of your professional background and academic objectives..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="submit"
              disabled={savingPersonal}
              className="btn btn-primary"
              style={{ padding: '0.65rem 1.5rem' }}
            >
              {savingPersonal ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Education */}
      {activeTab === 'education' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Education & Degrees
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                Evaluated against the German Anabin & ZAB equivalence database.
              </p>
            </div>
            <button
              onClick={() => setShowEduModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
            >
              <Plus size={16} />
              <span>Add Education</span>
            </button>
          </div>

          {profile?.educations && profile.educations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {profile.educations.map((edu) => (
                <div
                  key={edu.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                      {edu.degree} &bull; <span style={{ color: '#38bdf8' }}>{edu.fieldOfStudy}</span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                      {edu.institution}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.3rem' }}>
                      Grade/CGPA: <strong style={{ color: '#fff' }}>{edu.gradeOrCgpa || 'N/A'}</strong>
                      {edu.graduationDate && ` &bull; Graduated: ${edu.graduationDate}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                    {renderVerificationBadge(edu.verificationStatus)}
                    {renderProvenanceBadge(edu.sourceType, edu.confidence)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              No education records yet. Upload degree transcripts or add manually.
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Employment */}
      {activeTab === 'employment' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Work Experience & Employment
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                Used for Chancenkarte point calculations and Fachkraft eligibility.
              </p>
            </div>
            <button
              onClick={() => setShowEmpModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
            >
              <Plus size={16} />
              <span>Add Experience</span>
            </button>
          </div>

          {profile?.employments && profile.employments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {profile.employments.map((emp) => (
                <div
                  key={emp.id}
                  style={{
                    padding: '1rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                      {emp.role} &bull; <span style={{ color: '#38bdf8' }}>{emp.companyName}</span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      {emp.startDate || 'Start'} &mdash; {emp.isCurrent ? 'Present' : emp.endDate || 'End'}
                    </div>
                    {emp.responsibilities && (
                      <p style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '0.5rem', lineHeight: '1.4' }}>
                        {emp.responsibilities}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                    {renderVerificationBadge(emp.verificationStatus)}
                    {renderProvenanceBadge(emp.sourceType, emp.confidence)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              No employment records yet. Upload CV or add your professional history manually.
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Skills */}
      {activeTab === 'skills' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Skills & Competencies
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                Extracted from credentials and mapped to German industry profiles.
              </p>
            </div>
            <button
              onClick={() => setShowSkillModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
            >
              <Plus size={16} />
              <span>Add Skill</span>
            </button>
          </div>

          {profile?.skills && profile.skills.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {profile.skills.map((skill) => (
                <div
                  key={skill.id}
                  style={{
                    padding: '0.65rem 0.9rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff' }}>{skill.name}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                      {skill.proficiencyLevel || 'Proficient'} &bull; {skill.category || 'Skill'}
                    </div>
                  </div>
                  {renderProvenanceBadge(skill.sourceType, skill.confidence)}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              No skills listed yet. Add skills or upload CV.
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Languages */}
      {activeTab === 'languages' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Language Proficiencies (CEFR)
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                Crucial for German visa regulations (Goethe-Institut, telc, TestDaF, IELTS, TOEFL).
              </p>
            </div>
            <button
              onClick={() => setShowLangModal(true)}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
            >
              <Plus size={16} />
              <span>Add Language</span>
            </button>
          </div>

          {profile?.languages && profile.languages.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {profile.languages.map((lang) => (
                <div
                  key={lang.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                      {lang.language} &mdash;{' '}
                      <span style={{ color: '#38bdf8' }}>Level {lang.proficiencyLevel}</span>
                    </div>
                    {lang.certificateType && (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        Certificate: {lang.certificateType}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {renderVerificationBadge(lang.verificationStatus)}
                    {renderProvenanceBadge(lang.sourceType, lang.confidence)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: '#94a3b8', fontSize: '0.85rem' }}>
              No language proficiency recorded yet.
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Motivation */}
      {activeTab === 'motivation' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
            Raw Motivation & Relocation Intent
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Captured from your onboarding intake and 60-second video elevator pitch. This forms the foundation for your German Anschreiben and visa officer interview.
          </p>
          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-subtle)',
              color: '#e2e8f0',
              fontSize: '0.9rem',
              lineHeight: '1.6',
            }}
          >
            {profile?.rawMotivation || 'No motivation statement entered yet.'}
          </div>
        </div>
      )}

      {/* Modal: Add Education */}
      {showEduModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              Add Education Degree
            </h3>
            <form onSubmit={handleAddEducation} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Degree Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Bachelor of Technology"
                  value={newEdu.degree}
                  onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>University / Institution</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Anna University"
                  value={newEdu.institution}
                  onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Field of Study</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Mechanical Engineering"
                  value={newEdu.fieldOfStudy}
                  onChange={(e) => setNewEdu({ ...newEdu, fieldOfStudy: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Grade / CGPA</label>
                  <input
                    type="text"
                    placeholder="e.g. 8.2 / 10"
                    value={newEdu.gradeOrCgpa}
                    onChange={(e) => setNewEdu({ ...newEdu, gradeOrCgpa: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Graduation Year</label>
                  <input
                    type="text"
                    placeholder="e.g. 2024"
                    value={newEdu.graduationDate}
                    onChange={(e) => setNewEdu({ ...newEdu, graduationDate: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowEduModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Skill */}
      {showSkillModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              Add Skill
            </h3>
            <form onSubmit={handleAddSkill} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Skill Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Python, CAD Modeling, CNC Operation"
                  value={newSkill.name}
                  onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Category</label>
                  <select
                    value={newSkill.category}
                    onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                  >
                    <option value="Technical">Technical</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Soft Skills">Soft Skills</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Proficiency</label>
                  <select
                    value={newSkill.proficiencyLevel}
                    onChange={(e) => setNewSkill({ ...newSkill, proficiencyLevel: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowSkillModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Skill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Language */}
      {showLangModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              Add Language
            </h3>
            <form onSubmit={handleAddLanguage} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Language</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. German, English"
                  value={newLang.language}
                  onChange={(e) => setNewLang({ ...newLang, language: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>CEFR Level</label>
                  <select
                    value={newLang.proficiencyLevel}
                    onChange={(e) => setNewLang({ ...newLang, proficiencyLevel: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                  >
                    <option value="A1">A1</option>
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                    <option value="C1">C1</option>
                    <option value="C2">C2</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Certificate Authority</label>
                  <input
                    type="text"
                    placeholder="e.g. Goethe, telc, IELTS"
                    value={newLang.certificateType}
                    onChange={(e) => setNewLang({ ...newLang, certificateType: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowLangModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Language
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Employment */}
      {showEmpModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              Add Work Experience
            </h3>
            <form onSubmit={handleAddEmployment} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Company Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Siemens or Tata Consultancy Services"
                  value={newEmp.companyName}
                  onChange={(e) => setNewEmp({ ...newEmp, companyName: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Job Title / Role</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Junior Mechanical Engineer"
                  value={newEmp.role}
                  onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Start Date</label>
                  <input
                    type="text"
                    placeholder="e.g. Jan 2022"
                    value={newEmp.startDate}
                    onChange={(e) => setNewEmp({ ...newEmp, startDate: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>End Date</label>
                  <input
                    type="text"
                    placeholder="e.g. Dec 2024 or Present"
                    value={newEmp.endDate}
                    onChange={(e) => setNewEmp({ ...newEmp, endDate: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>Key Responsibilities</label>
                <textarea
                  rows={2}
                  placeholder="Core duties, technologies used, achievements..."
                  value={newEmp.responsibilities}
                  onChange={(e) => setNewEmp({ ...newEmp, responsibilities: e.target.value })}
                  style={{ width: '100%', padding: '0.55rem', borderRadius: '6px', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', color: '#fff' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowEmpModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Experience
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
