import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FaUser, FaGraduationCap, FaCode, FaGithub, FaEdit, FaSave, FaTimes,
  FaFileAlt, FaPlus, FaTrash, FaPalette, FaCamera, FaCheckCircle,
  FaExclamationTriangle, FaTachometerAlt, FaShieldAlt, FaEye, FaCog, FaHammer, FaSearch,
  FaLayerGroup, FaBell, FaDownload, FaBriefcase
} from 'react-icons/fa';
import { profileService, resumesService } from '../services/api';
import TemplateSelector from './TemplateSelector';
import SettingsPanel from './SettingsPanel';
import AtsPanel from './ats/AtsPanel';
import VersionsPanel from './VersionsPanel';
import { useTheme } from '../context/ThemeContext';
import { getActivity, logActivity, formatRelativeTime, greetingFor } from '../utils/activityLog';
import MinimalTemplate from './templates/MinimalTemplate';
import ModernTemplate from './templates/ModernTemplate';
import ClassicTemplate from './templates/ClassicTemplate';
import ProfessionalTemplate from './templates/ProfessionalTemplate';
import { ToastStack, createToast, EmptyState, ConfirmDialog } from './ui/Feedback';
import SectionEditor from './resume/SectionEditor';
import SkillCategoryEditor from './resume/SkillCategoryEditor';
import SectionToggles from './resume/SectionToggles';
import {
  normalizeProfile, prepareForSave, displaySkills, displayEducations,
  isValidUrl, flattenCategories, analyzeBullet
} from '../utils/resumeModel';

const SIDEBAR = [
  { id: 'overview', label: 'Dashboard', icon: <FaTachometerAlt /> },
  { id: 'profile', label: 'Profile', icon: <FaUser /> },
  { id: 'builder', label: 'Resume Builder', icon: <FaHammer /> },
  { id: 'template', label: 'Templates', icon: <FaFileAlt /> },
  { id: 'ats', label: 'ATS Checker', icon: <FaShieldAlt /> },
  { id: 'jobmatch', label: 'Job Match', icon: <FaSearch /> },
  { id: 'versions', label: 'Versions', icon: <FaLayerGroup /> },
  { id: 'preview', label: 'Resume Preview', icon: <FaEye /> },
  { id: 'settings', label: 'Settings', icon: <FaCog /> },
];

function completionOf(d) {
  let score = 0;
  const checks = [];
  const has = (v) => v && String(v).trim().length > 0;
  if (has(d.personalInfo?.name)) score += 12; else checks.push('Add your full name');
  if (has(d.personalInfo?.email)) score += 8; else checks.push('Add email');
  if (has(d.personalInfo?.phone)) score += 10; else checks.push('Add phone');
  if ((has(d.education?.college) && has(d.education?.degree)) || (d.educations || []).length > 0) score += 20; else checks.push('Complete college + degree');
  if (displaySkills(d).filter(Boolean).length >= 3) score += 15; else checks.push('Add at least 3 skills');
  if ((d.projects || []).length >= 1) score += 15; else checks.push('Add at least 1 project');
  if (has(d.socialLinks?.github)) score += 5; else checks.push('Link GitHub profile');
  if (has(d.personalInfo?.bio) || has(d.personalInfo?.tagline) || has(d.education?.summary)) score += 15; else checks.push('Add a professional summary');
  return { score: Math.min(100, score), missing: checks };
}

function atsChecks(d) {
  const issues = [];
  const ok = [];
  const skills = displaySkills(d);
  if (d.personalInfo?.bio || d.personalInfo?.tagline || d.personalInfo?.headline || d.education?.summary) ok.push('Professional summary present');
  else issues.push('Add a professional summary (bio, headline, or education summary).');
  if (skills.filter(Boolean).length >= 5) ok.push(`${skills.length} skills listed`);
  else if (skills.length === 0) issues.push('Skills section is empty — add technical skills for keyword matching.');
  else issues.push('Add 5+ skills for stronger ATS matching.');
  const thin = (d.projects || []).filter((p) => !p.description || p.description.length < 50);
  if ((d.projects || []).length === 0) issues.push('No projects — include at least one relevant project.');
  else if (thin.length > 0) issues.push(`${thin.length} project(s) have short descriptions — expand to 50+ characters with impact.`);
  else ok.push('Project descriptions look detailed');
  if (d.personalInfo?.email && d.personalInfo?.phone) ok.push('Contact details complete');
  else issues.push('Complete email + phone for the resume header.');
  const educs = displayEducations(d);
  if (educs.length > 0) ok.push('Education complete');
  else issues.push('Complete education (at least one entry).');
  if ((d.experiences || []).length > 0) ok.push(`${d.experiences.length} experience entr${d.experiences.length === 1 ? 'y' : 'ies'} listed`);
  if ((d.certifications || []).length > 0) ok.push(`${d.certifications.length} certification(s) listed`);
  if ((d.languages || []).length > 0) ok.push(`${d.languages.length} language(s) listed`);
  const score = Math.max(0, 100 - issues.length * 18);
  return { issues, ok, score };
}

const Dashboard = ({ formData, onLogout, updateFormData, onViewPortfolio, onNavigate, saveProfile, activeVersion, onActivateVersion, onDeactivateVersion, darkMode, toggleDarkMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(() => normalizeProfile(formData));
  const [versions, setVersions] = useState([]);
  const persistProfile = saveProfile || ((payload) => profileService.updateProfile(payload));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [profileImage, setProfileImage] = useState(formData.personalInfo?.profileImage || null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(formData.selectedTemplate || 'modern');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setEditedData((prev) => {
      // Preserve in-progress edits; adopt fresh parent data otherwise.
      if (isEditing) return prev;
      return normalizeProfile(formData);
    });
    setProfileImage(formData.personalInfo?.profileImage || null);
    if (formData.selectedTemplate) setSelectedTemplate(formData.selectedTemplate);
  }, [formData]);

  const refreshVersions = async () => {
    try {
      const res = await resumesService.list();
      setVersions(res.data.versions || []);
    } catch {
      // Versions are optional; the dashboard works without them.
    }
  };

  useEffect(() => { refreshVersions(); }, []);

  // Version theme is applied locally only (never overwrites the saved main
  // theme); deactivation restores the main theme from the backend.
  const { theme, updateTheme } = useTheme();
  const applyVersionTheme = (v) => {
    if (!v) return;
    updateTheme({ template: v.template, accentColor: v.theme?.accentColor, font: v.theme?.font });
  };
  const restoreMainTheme = async () => {
    try {
      const p = await profileService.getProfile();
      if (p.success && p.data.profile && p.data.profile.theme) updateTheme(p.data.profile.theme);
    } catch { /* keep current theme on failure */ }
  };

  const notify = (message, tone = 'info', title) => createToast(setToasts, message, { tone, title });

  const completion = useMemo(() => completionOf(editedData), [editedData]);
  const ats = useMemo(() => atsChecks(editedData), [editedData]);
  // Tech context for the writing assistant: only terms already on the resume.
  const techContext = useMemo(() => {
    const fromCats = flattenCategories(editedData.skillCategories || {});
    const fromExp = (editedData.experiences || []).flatMap((x) => x.technologies || []);
    const fromProj = (editedData.projects || []).flatMap((p) => (
      Array.isArray(p.technologies) ? p.technologies : String(p.technologies || '').split(',').map((t) => t.trim())
    ));
    return [...new Set([...fromCats, ...fromExp, ...fromProj].map((t) => String(t || '').trim()).filter(Boolean))];
  }, [editedData]);
  const { personalInfo, education, skills, projects, socialLinks } = editedData;
  const shownSkills = displaySkills(editedData);
  const nameInitial = personalInfo?.name ? personalInfo.name.charAt(0).toUpperCase() : '?';
  const [activityTick, setActivityTick] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const userEmail = useMemo(
    () => personalInfo?.email || localStorage.getItem('currentUserEmail') || '',
    [personalInfo?.email]
  );
  const activity = useMemo(() => getActivity(userEmail), [userEmail, activityTick]);

  // Log an ATS check whenever the checker is opened.
  useEffect(() => {
    if (activeTab === 'ats' && userEmail) {
      logActivity(userEmail, 'ats-check');
      setActivityTick((t) => t + 1);
    }
  }, [activeTab, userEmail]);

  // Close the notifications popover on Escape.
  useEffect(() => {
    if (!showNotifications) return;
    const onKey = (e) => { if (e.key === 'Escape') setShowNotifications(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showNotifications]);

  // Honest workspace analytics — every number below is computed live from
  // the resume data. No application-outcome claims are made anywhere.
  const analytics = useMemo(() => {
    let sectionsCompleted = 0;
    if (displayEducations(editedData).length > 0) sectionsCompleted++;
    if ((editedData.experiences || []).length > 0) sectionsCompleted++;
    if ((projects || []).length > 0) sectionsCompleted++;
    if (shownSkills.filter(Boolean).length > 0) sectionsCompleted++;
    ['certifications', 'achievements', 'leadership', 'languages', 'publications', 'volunteering'].forEach((k) => {
      if ((editedData[k] || []).length > 0) sectionsCompleted++;
    });
    return {
      sectionsCompleted, sectionsTotal: 10,
      projects: (projects || []).length,
      experience: (editedData.experiences || []).length,
      skills: shownSkills.filter(Boolean).length,
      certifications: (editedData.certifications || []).length,
    };
  }, [editedData, projects, shownSkills]);

  // Content quality findings — each maps to a concrete fix in the editor.
  const qualityIssues = useMemo(() => {
    const d = editedData;
    const issues = [];
    const hasSummary = d.personalInfo?.bio || d.personalInfo?.headline || d.personalInfo?.tagline || d.education?.summary;
    if (!hasSummary) {
      issues.push({ key: 'summary', label: 'Missing professional summary', detail: 'Add 2–4 sentences: experience, core skills, target role.' });
    }
    const thin = (d.projects || []).filter((p) => !p.description || String(p.description).trim().length < 50);
    if (thin.length > 0) {
      issues.push({ key: 'projects', label: `${thin.length} short project description${thin.length === 1 ? '' : 's'}`, detail: 'Expand each to 50+ characters with role and outcome.' });
    }
    if (!d.socialLinks?.github && !d.personalInfo?.linkedin && !d.personalInfo?.website) {
      issues.push({ key: 'links', label: 'Missing professional links', detail: 'Add GitHub, LinkedIn, or a personal website.' });
    }
    const educs = displayEducations(d);
    if (educs.length === 0) {
      issues.push({ key: 'education', label: 'No education entries', detail: 'Add at least one education entry.' });
    } else {
      const noDates = educs.filter((e) => !e.startDate && !e.endDate && !e.current);
      if (noDates.length > 0) {
        issues.push({ key: 'education', label: `${noDates.length} education ${noDates.length === 1 ? 'entry' : 'entries'} missing dates`, detail: 'Add start/end dates (or mark as current).' });
      }
    }
    const bullets = [
      ...((d.experiences || []).flatMap((x) => x.bullets || [])),
      ...((d.projects || []).flatMap((p) => p.bullets || [])),
    ].map((b) => String(b || '').trim()).filter(Boolean);
    const weak = bullets.filter((b) => { const a = analyzeBullet(b); return a && !a.strong; });
    if (weak.length > 0) {
      issues.push({ key: 'bullets', label: `${weak.length} weak bullet${weak.length === 1 ? '' : 's'}`, detail: 'Start with action verbs and add numbers you actually achieved.' });
    }
    return issues;
  }, [editedData]);

  const activeVersionDoc = useMemo(
    () => (activeVersion ? versions.find((v) => String(v.id) === String(activeVersion.id)) || null : null),
    [versions, activeVersion]
  );
  const lastUpdatedIso = activity.lastEdited || (activeVersionDoc && activeVersionDoc.updatedAt) || null;

  const previewThemeStyles = {
    '--accent-color': (theme && theme.accentColor) || '#2563eb',
    '--font-family': (theme && theme.font) || 'Inter',
    '--heading-color': (theme && theme.accentColor) || '#2563eb',
  };
  const PreviewComponent = theme && theme.template === 'modern' ? ModernTemplate
    : theme && theme.template === 'classic' ? ClassicTemplate
    : theme && theme.template === 'professional' ? ProfessionalTemplate
    : MinimalTemplate;

  // One-click ATS PDF straight from the workspace (same selectable-text
  // engine as Preview; visual portfolio PDFs stay in the Preview route).
  const downloadAtsPdf = async () => {
    if (downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      const [{ buildAtsDocument }, { renderAtsPdf }, { jsPDF }] = await Promise.all([
        import('../utils/atsDocument'),
        import('../utils/atsPdf'),
        import('jspdf'),
      ]);
      const doc = buildAtsDocument(editedData, { dateStyle: 'short' });
      const { arrayBuffer, pages } = renderAtsPdf(jsPDF, doc, { pageSize: 'a4', font: 'helvetica' });
      const safeName = (personalInfo?.name || 'resume').trim().replace(/[^a-z0-9-_]+/gi, '-').slice(0, 60) || 'resume';
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}-ATS-resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      logActivity(userEmail, 'exported');
      setActivityTick((t) => t + 1);
      notify(`Downloaded ATS resume (${pages} page${pages === 1 ? '' : 's'}, selectable text).`, 'success', 'PDF exported');
    } catch (err) {
      notify('PDF export failed. Please try again.', 'error', 'Export failed');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const setSection = (key, value) => {
    setEditedData((prev) => ({ ...prev, [key]: value }));
  };

  const handleEdit = () => { setIsEditing(true); setEditedData(normalizeProfile(formData)); setError(null); };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Validate new URL fields before persisting.
      for (const [k, v] of [['website', personalInfo?.website], ['linkedin', personalInfo?.linkedin]]) {
        if (v && !isValidUrl(v)) {
          throw { response: { data: { message: `Personal ${k} must be a valid http(s) URL.` } } };
        }
      }
      const payload = prepareForSave({ ...editedData, selectedTemplate });
      const response = await persistProfile(payload);
      // Main-profile responses carry data.profile; version responses carry
      // data.version.data. Fall back to the sent payload either way.
      const saved = response.data?.profile
        || (response.data?.version && response.data.version.data)
        || payload;
      if (updateFormData) updateFormData(normalizeProfile(saved));
      setEditedData(normalizeProfile(saved));
      setIsEditing(false);
      logActivity(personalInfo?.email || localStorage.getItem('currentUserEmail') || '', 'edited');
      setActivityTick((t) => t + 1);
      notify('Profile saved successfully.', 'success', 'Saved');
      return response;
    } catch (err) {
      let msg = 'Failed to save changes. Please try again.';
      if (err.response?.data?.message) msg = err.response.data.message;
      else if (err.response?.status === 413) msg = 'Image too large. Use an image under 2MB.';
      else if (err.message) msg = err.message;
      setError(msg);
      notify(msg, 'error', 'Save failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => { setIsEditing(false); setEditedData({ ...formData }); setProfileImage(formData.personalInfo?.profileImage || null); setError(null); };

  const handleDeleteProfile = async () => {
    try {
      setDeleting(true);
      await profileService.deleteProfile();
      localStorage.removeItem('token');
      localStorage.removeItem('currentUserEmail');
      setDeleting(false);
      setShowDeleteConfirm(false);
      if (onLogout) onLogout();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete profile.';
      setError(msg);
      setDeleting(false);
      notify(msg, 'error', 'Delete failed');
    }
  };

  const handleInputChange = (section, field, value) => {
    setEditedData((prev) => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please select a valid image file'); return; }
    if (file.size > 2 * 1024 * 1024) { setError(`Image must be under 2MB (yours: ${(file.size / 1048576).toFixed(2)}MB)`); return; }
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result);
      setEditedData((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, profileImage: reader.result } }));
    };
    reader.onerror = () => setError('Failed to read image file.');
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setEditedData((prev) => ({ ...prev, personalInfo: { ...prev.personalInfo, profileImage: null } }));
  };

  const handleSkillChange = (i, v) => setEditedData((p) => ({ ...p, skills: p.skills.map((s, x) => (x === i ? v : s)) }));
  const handleAddSkill = () => setEditedData((p) => ({ ...p, skills: [...(p.skills || []), ''] }));
  const handleRemoveSkill = (i) => setEditedData((p) => ({ ...p, skills: p.skills.filter((_, x) => x !== i) }));
  const handleProjectChange = (i, f, v) => setEditedData((p) => ({ ...p, projects: p.projects.map((pr, x) => (x === i ? { ...pr, [f]: v } : pr)) }));
  const handleAddProject = () => setEditedData((p) => ({ ...p, projects: [...(p.projects || []), { title: '', technologies: '', description: '', link: '' }] }));
  const handleRemoveProject = (i) => setEditedData((p) => ({ ...p, projects: p.projects.filter((_, x) => x !== i) }));
  const handleTemplateSelect = (id) => {
    setSelectedTemplate(id);
    setEditedData((p) => ({ ...p, selectedTemplate: id }));
    notify(`Template set to ${id}. Save to persist.`, 'info', 'Template');
  };

  const go = (id) => {
    if (id === 'builder') {
      if (onNavigate) onNavigate('create');
      else setActiveTab('profile');
      return;
    }
    if (id === 'jobmatch') {
      if (onNavigate) onNavigate('jobmatch');
      else setActiveTab('ats');
      return;
    }
    if (id === 'preview') {
      if (onViewPortfolio) onViewPortfolio();
      return;
    }
    setActiveTab(id);
  };

  return (
    <div className="ds-page">
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
      <div className="ds-app-shell">
        {/* Sidebar */}
        <aside className="ds-side" aria-label="Dashboard navigation">
          <div className="ds-row" style={{ marginBottom: 12 }}>
            <div aria-hidden="true" style={{ width: 34, height: 34, borderRadius: 9, background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {nameInitial}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{personalInfo?.name || 'Your portfolio'}</div>
              <div className="ds-helper">{completion.score}% complete</div>
            </div>
          </div>
          <nav aria-label="Sections">
            <div style={{ display: 'grid', gap: 4 }}>
              {SIDEBAR.map((s) => (
                <button
                  key={s.id}
                  className="ds-side-link"
                  aria-current={activeTab === s.id ? 'page' : undefined}
                  onClick={() => go(s.id)}
                >
                  <span aria-hidden="true">{s.icon}</span> {s.label}
                </button>
              ))}
            </div>
          </nav>
          <hr className="ds-divider" />
          <button className="ds-btn ds-btn-secondary ds-btn-sm ds-btn-block" onClick={onViewPortfolio}>
            <FaEye aria-hidden="true" /> View portfolio
          </button>
        </aside>

        {/* Main */}
        <div className="ds-main">
          <div className="ds-container" style={{ padding: 0 }}>
            {error && <div className="ds-alert ds-alert-error" role="alert" style={{ marginBottom: 12 }}><FaExclamationTriangle aria-hidden="true" /><span>{error}</span></div>}

            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className="ds-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 12, gap: 12 }}>
                  <div className="ds-row" style={{ gap: 12, alignItems: 'center' }}>
                    <div aria-label="Profile avatar" style={{ width: 52, height: 52, borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                      {profileImage ? <img src={profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : nameInitial}
                    </div>
                    <div>
                      <p className="ds-eyebrow">Workspace</p>
                      <h1 className="ds-h1" style={{ margin: 0 }}>{greetingFor()}{personalInfo?.name ? `, ${personalInfo.name.split(' ')[0]}` : ''}</h1>
                      <p className="ds-muted" style={{ margin: 0 }}>
                        {activeVersion ? `Editing version “${activeVersion.name}”` : 'Editing your main resume'}
                        {activeVersionDoc?.targetRole ? ` • Targeting ${activeVersionDoc.targetRole}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="ds-row" style={{ flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <button
                        className="ds-btn ds-btn-ghost ds-btn-sm"
                        onClick={() => setShowNotifications((s) => !s)}
                        aria-label={`Notifications: ${qualityIssues.length} suggestions`}
                        aria-expanded={showNotifications}
                        title="Suggestions"
                        style={{ position: 'relative' }}
                      >
                        <FaBell aria-hidden="true" />
                        {qualityIssues.length > 0 && (
                          <span aria-hidden="true" style={{ position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 999, background: 'var(--ds-error)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                            {qualityIssues.length}
                          </span>
                        )}
                      </button>
                      {showNotifications && (
                        <div role="dialog" aria-label="Resume suggestions" className="ds-card"
                          style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 300, zIndex: 60, padding: '0.8rem 0.9rem', boxShadow: 'var(--ds-shadow-lg)' }}>
                          <div className="ds-row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                            <strong style={{ fontSize: '0.88rem' }}>Suggestions ({qualityIssues.length})</strong>
                            <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setShowNotifications(false)} aria-label="Close notifications">
                              <FaTimes aria-hidden="true" />
                            </button>
                          </div>
                          {qualityIssues.length === 0 ? (
                            <p className="ds-muted">Nothing outstanding — resume looks solid.</p>
                          ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
                              {qualityIssues.slice(0, 5).map((q) => (
                                <li key={q.key}>
                                  <button
                                    className="ds-btn ds-btn-ghost ds-btn-sm"
                                    style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal', height: 'auto' }}
                                    onClick={() => { setShowNotifications(false); setActiveTab('profile'); if (!isEditing) handleEdit(); }}
                                  >
                                    <FaExclamationTriangle aria-hidden="true" color="#b45309" /> {q.label}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </div>
                    <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setActiveTab('settings')} aria-label="Open settings" title="Settings">
                      <FaCog aria-hidden="true" />
                    </button>
                    <label className="ds-helper" htmlFor="dash-version">Resume</label>
                    <select
                      id="dash-version"
                      className="ds-select"
                      aria-label="Select resume version"
                      value={activeVersion ? String(activeVersion.id) : 'main'}
                      disabled={isEditing || isLoading}
                      onChange={async (e) => {
                        const id = e.target.value;
                        try {
                          if (id === 'main') {
                            await resumesService.setActive(null);
                            await restoreMainTheme();
                            if (onDeactivateVersion) await onDeactivateVersion();
                            else if (updateFormData) {
                              const p = await profileService.getProfile();
                              if (p.success && p.data.profile) updateFormData(normalizeProfile(p.data.profile));
                            }
                            notify('Back on your main resume.', 'info', 'Deactivated');
                          } else {
                            const v = versions.find((x) => String(x.id) === id);
                            if (v && onActivateVersion) {
                              await resumesService.setActive(v.id);
                              applyVersionTheme(v);
                              onActivateVersion(v);
                              notify(`Now editing “${v.name}”.`, 'success', 'Version active');
                            }
                          }
                        } catch (err) {
                          setError(err.response?.data?.message || 'Could not switch version.');
                        }
                      }}
                      style={{ maxWidth: 220 }}
                    >
                      <option value="main">Main resume{activeVersion ? '' : ' (active)'}</option>
                      {versions.map((v) => (
                        <option key={v.id} value={String(v.id)}>
                          {v.name}{activeVersion && String(activeVersion.id) === String(v.id) ? ' (active)' : ''}
                        </option>
                      ))}
                    </select>
                    <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => { refreshVersions(); setActiveTab('versions'); }}>Manage</button>
                    <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={handleEdit} disabled={isEditing}><FaEdit aria-hidden="true" /> Edit details</button>
                    <button className="ds-btn ds-btn-primary ds-btn-sm" onClick={onViewPortfolio}><FaEye aria-hidden="true" /> Preview & PDF</button>
                  </div>
                </div>

                <div className="ds-card ds-card-pad" style={{ marginBottom: 12 }}>
                  <div className="ds-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 8 }}>
                    <h2 className="ds-h2" style={{ margin: 0 }}>Resume overview</h2>
                    {activeVersion
                      ? <span className="ds-badge ds-badge-primary">Version: {activeVersion.name}</span>
                      : <span className="ds-badge">Main resume</span>}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                    <div>
                      <div className="ds-helper">Active resume</div>
                      <strong style={{ fontSize: '0.92rem' }}>{activeVersion ? activeVersion.name : 'Main resume'}</strong>
                    </div>
                    <div>
                      <div className="ds-helper">Target role</div>
                      <strong style={{ fontSize: '0.92rem' }}>{(activeVersionDoc && activeVersionDoc.targetRole) || '—'}</strong>
                    </div>
                    <div>
                      <div className="ds-helper">ATS readiness</div>
                      <span className={`ds-badge ${ats.score >= 80 ? 'ds-badge-success' : ats.score >= 50 ? 'ds-badge-warning' : 'ds-badge-error'}`}>{ats.score}/100</span>
                      <div><button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setActiveTab('ats')} style={{ paddingLeft: 0 }}>Details</button></div>
                    </div>
                    <div>
                      <div className="ds-helper">Completeness</div>
                      <div className="ds-row" style={{ gap: 8 }}>
                        <div className="ds-progress" role="progressbar" aria-valuenow={completion.score} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completeness" style={{ flex: 1 }}>
                          <span style={{ width: `${completion.score}%` }} />
                        </div>
                        <strong style={{ fontSize: '0.9rem' }}>{completion.score}%</strong>
                      </div>
                    </div>
                    <div>
                      <div className="ds-helper">Last updated</div>
                      <strong style={{ fontSize: '0.92rem' }}>{formatRelativeTime(lastUpdatedIso)}</strong>
                    </div>
                  </div>
                </div>

                <div className="ds-card ds-card-pad" style={{ marginBottom: 12 }}>
                  <h2 className="ds-h2" style={{ marginBottom: 8 }}>Analytics</h2>
                  <p className="ds-helper" style={{ marginBottom: 10 }}>Counts computed live from this resume — no outcome predictions.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                    {[
                      { icon: <FaFileAlt />, n: `${analytics.sectionsCompleted}/${analytics.sectionsTotal}`, l: 'Sections completed' },
                      { icon: <FaCode />, n: analytics.projects, l: 'Projects' },
                      { icon: <FaBriefcase />, n: analytics.experience, l: 'Experience entries' },
                      { icon: <FaCode />, n: analytics.skills, l: 'Skills' },
                      { icon: <FaGraduationCap />, n: analytics.certifications, l: 'Certifications' },
                    ].map((s) => (
                      <div key={s.l} className="ds-card ds-stat" style={{ padding: '0.8rem', background: 'var(--ds-surface-2)' }}>
                        <span className="ds-stat-ic" aria-hidden="true">{s.icon}</span>
                        <span><span className="ds-stat-num" style={{ fontSize: '1.15rem' }}>{s.n}</span><br /><span className="ds-stat-lbl">{s.l}</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ds-card ds-card-pad" style={{ marginBottom: 12 }}>
                  <h2 className="ds-h2" style={{ marginBottom: 8 }}>Quick actions</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                    <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={() => { setActiveTab('profile'); handleEdit(); }} disabled={isEditing}><FaEdit aria-hidden="true" /> Edit Resume</button>
                    <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={onViewPortfolio}><FaEye aria-hidden="true" /> Preview Resume</button>
                    <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={() => setActiveTab('ats')}><FaShieldAlt aria-hidden="true" /> Check ATS</button>
                    <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={() => go('jobmatch')}><FaSearch aria-hidden="true" /> Match Job</button>
                    <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={downloadAtsPdf} disabled={downloadingPdf} aria-busy={downloadingPdf}><FaDownload aria-hidden="true" /> {downloadingPdf ? 'Exporting…' : 'Download PDF'}</button>
                    <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={() => setActiveTab('versions')}><FaLayerGroup aria-hidden="true" /> Create Resume Version</button>
                  </div>
                </div>

                <div className="ds-grid-2" style={{ marginBottom: 12 }}>
                  <div className="ds-card ds-card-pad">
                    <div className="ds-row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                      <h2 className="ds-h2" style={{ margin: 0 }}>Content quality</h2>
                      {qualityIssues.length === 0
                        ? <span className="ds-badge ds-badge-success"><FaCheckCircle aria-hidden="true" /> All clear</span>
                        : <span className="ds-badge ds-badge-warning">{qualityIssues.length} to fix</span>}
                    </div>
                    {qualityIssues.length === 0 ? (
                      <p className="ds-muted">Summary present, descriptions detailed, links and dates in place, bullets strong.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                        {qualityIssues.map((q) => (
                          <li key={q.key} className="ds-row" style={{ justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
                            <div>
                              <strong style={{ fontSize: '0.87rem' }}>{q.label}</strong>
                              <div className="ds-helper">{q.detail}</div>
                            </div>
                            <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => { setActiveTab('profile'); if (!isEditing) handleEdit(); }} style={{ flexShrink: 0 }}>Fix</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="ds-card ds-card-pad">
                    <h2 className="ds-h2" style={{ marginBottom: 8 }}>Recent activity</h2>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                      <li className="ds-row" style={{ justifyContent: 'space-between' }}>
                        <span className="ds-body" style={{ fontSize: '0.88rem' }}><FaEdit aria-hidden="true" /> Last edited</span>
                        <span className="ds-muted">{formatRelativeTime(activity.lastEdited)}</span>
                      </li>
                      <li className="ds-row" style={{ justifyContent: 'space-between' }}>
                        <span className="ds-body" style={{ fontSize: '0.88rem' }}><FaDownload aria-hidden="true" /> Last exported</span>
                        <span className="ds-muted">{formatRelativeTime(activity.lastExported)}</span>
                      </li>
                      <li className="ds-row" style={{ justifyContent: 'space-between' }}>
                        <span className="ds-body" style={{ fontSize: '0.88rem' }}><FaShieldAlt aria-hidden="true" /> Last ATS check</span>
                        <span className="ds-muted">{formatRelativeTime(activity.lastAtsCheck)}</span>
                      </li>
                    </ul>
                    <p className="ds-helper" style={{ marginTop: 8 }}>Tracked locally on this device only.</p>
                  </div>
                </div>

                <div className="ds-card ds-card-pad">
                  <div className="ds-row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                    <h2 className="ds-h2" style={{ margin: 0 }}>Resume preview</h2>
                    <span className="ds-badge">{(theme && theme.template) || 'minimal'}</span>
                  </div>
                  <div style={{ height: 420, overflow: 'hidden', border: '1px solid var(--ds-border)', borderRadius: 10, background: '#fff' }}>
                    <div aria-hidden="true" style={{ width: '200%', transform: 'scale(0.5)', transformOrigin: 'top left', pointerEvents: 'none' }}>
                      <PreviewComponent formData={editedData} themeStyles={previewThemeStyles} />
                    </div>
                  </div>
                  <div className="ds-row" style={{ marginTop: 10 }}>
                    <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={onViewPortfolio}><FaEye aria-hidden="true" /> Open full preview</button>
                    <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setActiveTab('template')}>Change template</button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className="ds-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 12 }}>
                  <div>
                    <p className="ds-eyebrow">Profile</p>
                    <h1 className="ds-h1">Profile details</h1>
                    <p className="ds-muted">This data powers every template and the ATS resume.</p>
                  </div>
                  {!isEditing ? (
                    <button onClick={handleEdit} className="ds-btn ds-btn-secondary ds-btn-sm" disabled={isLoading}><FaEdit aria-hidden="true" /> Edit details</button>
                  ) : (
                    <div className="ds-row">
                      <button onClick={handleSave} className="ds-btn ds-btn-primary ds-btn-sm" disabled={isLoading}><FaSave aria-hidden="true" /> {isLoading ? 'Saving…' : 'Save changes'}</button>
                      <button onClick={handleCancel} className="ds-btn ds-btn-ghost ds-btn-sm" disabled={isLoading}><FaTimes aria-hidden="true" /> Cancel</button>
                    </div>
                  )}
                </div>

                <div className="ds-grid-2">
                  <div className="ds-card ds-card-pad">
                    <h2 className="ds-h2"><FaUser aria-hidden="true" /> Personal information</h2>
                    <div className="ds-row" style={{ margin: '10px 0', alignItems: 'flex-start' }}>
                      <div aria-label="Profile photo" style={{ width: 64, height: 64, borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
                        {profileImage ? <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : nameInitial}
                      </div>
                      <div>
                        <strong>{personalInfo?.name || '—'}</strong>
                        <div className="ds-muted">{education?.degree || '—'}</div>
                        <div className="ds-muted">{education?.college || '—'}</div>
                        {isEditing && (
                          <div className="ds-row" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                            <label htmlFor="profile-image-upload" className="ds-btn ds-btn-secondary ds-btn-sm" style={{ cursor: 'pointer' }}><FaCamera aria-hidden="true" /> Upload photo</label>
                            <input id="profile-image-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                            {profileImage && <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={handleRemoveImage}><FaTimes aria-hidden="true" /> Remove</button>}
                          </div>
                        )}
                      </div>
                    </div>
                    {isEditing ? (
                      <div className="ds-stack">
                        {[['name', 'Name', 'text'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel'], ['headline', 'Headline', 'text'], ['location', 'Location', 'text'], ['website', 'Website', 'url'], ['linkedin', 'LinkedIn', 'url']].map(([f, l, t]) => (
                          <div key={f}>
                            <label className="ds-label" htmlFor={`pi-${f}`}>{l}</label>
                            <input id={`pi-${f}`} className="ds-input" type={t} value={personalInfo?.[f] || ''} onChange={(e) => handleInputChange('personalInfo', f, e.target.value)} placeholder={f === 'headline' ? 'e.g., Full-Stack Developer' : f === 'website' ? 'https://…' : f === 'linkedin' ? 'https://linkedin.com/in/…' : undefined} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <dl className="ds-muted" style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 6, marginTop: 8 }}>
                        <dt>Name</dt><dd style={{ color: 'var(--ds-text)' }}>{personalInfo?.name || '—'}</dd>
                        <dt>Email</dt><dd style={{ color: 'var(--ds-text)' }}>{personalInfo?.email || '—'}</dd>
                        <dt>Phone</dt><dd style={{ color: 'var(--ds-text)' }}>{personalInfo?.phone || '—'}</dd>
                        <dt>Headline</dt><dd style={{ color: 'var(--ds-text)' }}>{personalInfo?.headline || '—'}</dd>
                        <dt>Location</dt><dd style={{ color: 'var(--ds-text)' }}>{personalInfo?.location || '—'}</dd>
                        <dt>Website</dt><dd style={{ color: 'var(--ds-text)' }}>{personalInfo?.website || '—'}</dd>
                        <dt>LinkedIn</dt><dd style={{ color: 'var(--ds-text)' }}>{personalInfo?.linkedin || '—'}</dd>
                      </dl>
                    )}
                  </div>

                  <div className="ds-card ds-card-pad">
                    <h2 className="ds-h2"><FaGraduationCap aria-hidden="true" /> Education</h2>
                    {isEditing ? (
                      <div className="ds-stack" style={{ marginTop: 8 }}>
                        {[['college', 'College'], ['degree', 'Degree'], ['specialization', 'Specialization'], ['cgpa', 'CGPA']].map(([f, l]) => (
                          <div key={f}>
                            <label className="ds-label" htmlFor={`ed-${f}`}>{l}</label>
                            <input id={`ed-${f}`} className="ds-input" value={education?.[f] || ''} onChange={(e) => handleInputChange('education', f, e.target.value)} />
                          </div>
                        ))}
                        <div>
                          <label className="ds-label" htmlFor="ed-summary">Summary</label>
                          <textarea id="ed-summary" className="ds-textarea" value={education?.summary || ''} onChange={(e) => handleInputChange('education', 'summary', e.target.value)} />
                        </div>
                        <div>
                          <span className="ds-label">All education entries</span>
                          <div style={{ marginTop: 6 }}>
                            <SectionEditor section="educations" items={editedData.educations || []} onChange={(v) => setSection('educations', v)} techContext={techContext} />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <dl className="ds-muted" style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 6, marginTop: 8 }}>
                        <dt>College</dt><dd style={{ color: 'var(--ds-text)' }}>{education?.college || '—'}</dd>
                        <dt>Degree</dt><dd style={{ color: 'var(--ds-text)' }}>{education?.degree || '—'}</dd>
                        <dt>Specialization</dt><dd style={{ color: 'var(--ds-text)' }}>{education?.specialization || '—'}</dd>
                        <dt>CGPA</dt><dd style={{ color: 'var(--ds-text)' }}>{education?.cgpa || '—'}</dd>
                        <dt>Summary</dt><dd style={{ color: 'var(--ds-text)' }}>{education?.summary || '—'}</dd>
                      </dl>
                    )}
                  </div>
                </div>

                <div className="ds-grid-2" style={{ marginTop: 12 }}>
                  <div className="ds-card ds-card-pad">
                    <div className="ds-row" style={{ justifyContent: 'space-between' }}>
                      <h2 className="ds-h2"><FaCode aria-hidden="true" /> Skills</h2>
                      <span className="ds-badge">{shownSkills.length}</span>
                    </div>
                    {isEditing ? (
                      <div style={{ marginTop: 8 }}>
                        <SkillCategoryEditor value={editedData.skillCategories || {}} onChange={(v) => setSection('skillCategories', v)} />
                      </div>
                    ) : shownSkills.length === 0 ? (
                      <div style={{ marginTop: 8 }}><EmptyState icon={<FaCode />} title="No skills" body="Add skills to improve ATS matching." action={null} /></div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                        {shownSkills.map((s, i) => <span key={i} className="ds-badge">{s}</span>)}
                      </div>
                    )}
                  </div>
                  <div className="ds-card ds-card-pad">
                    <div className="ds-row" style={{ justifyContent: 'space-between' }}>
                      <h2 className="ds-h2"><FaGithub aria-hidden="true" /> Links</h2>
                    </div>
                    {isEditing ? (
                      <div className="ds-stack" style={{ marginTop: 8 }}>
                        <div>
                          <label className="ds-label" htmlFor="gh">GitHub URL</label>
                          <input id="gh" className="ds-input" type="url" value={socialLinks?.github || ''} onChange={(e) => handleInputChange('socialLinks', 'github', e.target.value)} placeholder="https://github.com/username" />
                        </div>
                        <div>
                          <label className="ds-label" htmlFor="li-dash">LinkedIn URL</label>
                          <input id="li-dash" className="ds-input" type="url" value={personalInfo?.linkedin || ''} onChange={(e) => handleInputChange('personalInfo', 'linkedin', e.target.value)} placeholder="https://linkedin.com/in/…" />
                        </div>
                        <div>
                          <label className="ds-label" htmlFor="ws-dash">Website</label>
                          <input id="ws-dash" className="ds-input" type="url" value={personalInfo?.website || ''} onChange={(e) => handleInputChange('personalInfo', 'website', e.target.value)} placeholder="https://…" />
                        </div>
                      </div>
                    ) : (
                      <div className="ds-muted" style={{ marginTop: 8, display: 'grid', gap: 4 }}>
                        {socialLinks?.github ? <a href={socialLinks.github} target="_blank" rel="noreferrer">GitHub profile</a> : <span>No GitHub profile linked</span>}
                        {personalInfo?.linkedin && <a href={personalInfo.linkedin} target="_blank" rel="noreferrer">LinkedIn profile</a>}
                        {personalInfo?.website && <a href={personalInfo.website} target="_blank" rel="noreferrer">Website</a>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="ds-card ds-card-pad" style={{ marginTop: 12 }}>
                  <div className="ds-row" style={{ justifyContent: 'space-between' }}>
                    <h2 className="ds-h2"><FaBriefcase aria-hidden="true" /> Experience</h2>
                    <span className="ds-badge">{(editedData.experiences || []).length}</span>
                  </div>
                  {(editedData.experiences || []).length === 0 && !isEditing ? (
                    <div style={{ marginTop: 8 }}><EmptyState icon={<FaBriefcase />} title="No experience yet" body="Add internships or roles with measurable bullets." /></div>
                  ) : isEditing ? (
                    <div style={{ marginTop: 8 }}>
                      <SectionEditor section="experiences" items={editedData.experiences || []} onChange={(v) => setSection('experiences', v)} techContext={techContext} />
                    </div>
                  ) : (
                    <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0', display: 'grid', gap: 8 }}>
                      {(editedData.experiences || []).map((x, i) => (
                        <li key={x._id || i} className="ds-card" style={{ padding: '0.7rem 0.8rem', background: 'var(--ds-surface-2)' }}>
                          <strong style={{ fontSize: '0.9rem' }}>{x.role || 'Role'} @ {x.company || 'Company'}</strong>
                          <div className="ds-helper">{[x.startDate, x.current ? 'Present' : x.endDate].filter(Boolean).join(' – ')}{x.location ? ` • ${x.location}` : ''}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="ds-card ds-card-pad" style={{ marginTop: 12 }}>
                  <div className="ds-row" style={{ justifyContent: 'space-between' }}>
                    <h2 className="ds-h2"><FaCode aria-hidden="true" /> Projects</h2>
                    <span className="ds-badge">{(projects || []).length}</span>
                  </div>
                  {(projects || []).length === 0 && !isEditing ? (
                    <div style={{ marginTop: 8 }}><EmptyState icon={<FaFileAlt />} title="No projects" body="Showcase at least one project with tech stack and impact." /></div>
                  ) : isEditing ? (
                    <div style={{ marginTop: 8 }}>
                      <SectionEditor section="projects" items={projects || []} onChange={(v) => setSection('projects', v)} techContext={techContext} />
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
                      {(projects || []).map((p, i) => (
                        <div key={p._id || i} className="ds-card" style={{ padding: '0.9rem', background: 'var(--ds-surface-2)' }}>
                          <strong>{p.title || `Project ${i + 1}`}</strong>
                          <div className="ds-helper">{typeof p.technologies === 'string' ? p.technologies : (p.technologies || []).join(', ')}{p.role ? ` • ${p.role}` : ''}</div>
                          <p className="ds-muted" style={{ margin: '4px 0' }}>{p.description}</p>
                          {(p.bullets || []).length > 0 && (
                            <ul className="ds-muted" style={{ margin: '4px 0 4px 18px' }}>
                              {p.bullets.slice(0, 3).map((b, bi) => <li key={bi}>{b}</li>)}
                            </ul>
                          )}
                          <div className="ds-row" style={{ gap: 10 }}>
                            {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noreferrer" className="ds-helper">Live</a>}
                            {p.githubUrl && <a href={p.githubUrl} target="_blank" rel="noreferrer" className="ds-helper">GitHub</a>}
                            {p.link && <a href={p.link} target="_blank" rel="noreferrer" className="ds-helper">Link</a>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="ds-grid-2" style={{ marginTop: 12 }}>
                  <div className="ds-card ds-card-pad">
                    <h2 className="ds-h2">Section visibility</h2>
                    <p className="ds-helper" style={{ margin: '4px 0 8px' }}>Optional sections can be hidden from preview/PDF without deleting them.</p>
                    <SectionToggles value={editedData.sectionsEnabled || {}} onChange={(v) => setSection('sectionsEnabled', v)} disabled={!isEditing} />
                  </div>
                  {[
                    { key: 'certifications', label: 'Certifications' },
                    { key: 'achievements', label: 'Achievements' },
                    { key: 'leadership', label: 'Leadership' },
                    { key: 'languages', label: 'Languages' },
                    { key: 'publications', label: 'Publications' },
                    { key: 'volunteering', label: 'Volunteering' },
                  ].map(({ key, label }) => (
                    <div key={key} className="ds-card ds-card-pad">
                      <div className="ds-row" style={{ justifyContent: 'space-between' }}>
                        <h2 className="ds-h2">{label}</h2>
                        <span className="ds-badge">{(editedData[key] || []).length}</span>
                      </div>
                      {isEditing ? (
                        <div style={{ marginTop: 8 }}>
                          <SectionEditor section={key} items={editedData[key] || []} onChange={(v) => setSection(key, v)} techContext={techContext} />
                        </div>
                      ) : (editedData[key] || []).length === 0 ? (
                        <p className="ds-muted" style={{ marginTop: 8 }}>None added — optional.</p>
                      ) : (
                        <ul className="ds-muted" style={{ margin: '8px 0 0 18px', display: 'grid', gap: 4 }}>
                          {(editedData[key] || []).slice(0, 4).map((it, i) => (
                            <li key={it._id || i}>{it.title || it.name || it.role || it.organization || `Entry ${i + 1}`}</li>
                          ))}
                          {(editedData[key] || []).length > 4 && <li>…and {(editedData[key] || []).length - 4} more</li>}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>

                {isEditing && (
                  <div className="ds-row" style={{ marginTop: 12 }}>
                    <button onClick={handleSave} className="ds-btn ds-btn-primary" disabled={isLoading}><FaSave aria-hidden="true" /> {isLoading ? 'Saving…' : 'Save changes'}</button>
                    <button onClick={handleCancel} className="ds-btn ds-btn-secondary" disabled={isLoading}><FaTimes aria-hidden="true" /> Cancel</button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'builder' && (
              <div className="ds-card ds-card-pad">
                <p className="ds-eyebrow">Resume Builder</p>
                <h1 className="ds-h1">Continue in the Resume Builder</h1>
                <p className="ds-muted" style={{ margin: '6px 0 12px' }}>Sections, live preview and autosave — your current data is preserved.</p>
                <button className="ds-btn ds-btn-primary" onClick={() => go('builder')}><FaHammer aria-hidden="true" /> Open Resume Builder</button>
              </div>
            )}

            {activeTab === 'versions' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <VersionsPanel
                  currentData={editedData}
                  activeVersion={activeVersion}
                  onActivateVersion={onActivateVersion}
                  onDeactivateVersion={onDeactivateVersion}
                  notify={notify}
                />
              </motion.div>
            )}

            {activeTab === 'template' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <p className="ds-eyebrow">Templates</p>
                <h1 className="ds-h1" style={{ marginBottom: 4 }}>Template selection</h1>
                <p className="ds-muted" style={{ marginBottom: 12 }}>Preview realistic resumes. Selection stages locally — save from Profile to persist.</p>
                <div className="ds-card ds-card-pad">
                  <TemplateSelector selectedTemplate={selectedTemplate} onSelectTemplate={handleTemplateSelect} onOpenAts={onViewPortfolio} />
                  <div className="ds-row" style={{ marginTop: 12 }}>
                    <button className="ds-btn ds-btn-primary ds-btn-sm" onClick={handleSave} disabled={isLoading}><FaSave aria-hidden="true" /> {isLoading ? 'Saving…' : 'Save template'}</button>
                    <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={onViewPortfolio}><FaEye aria-hidden="true" /> Preview</button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'ats' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <p className="ds-eyebrow">ATS Checker</p>
                <h1 className="ds-h1" style={{ marginBottom: 4 }}>ATS audit</h1>
                <p className="ds-muted" style={{ margin: '4px 0 12px' }}>Transparent readiness estimate with reasons. Export the ATS PDF from Preview.</p>
                <AtsPanel formData={editedData} />
                <div className="ds-row" style={{ marginTop: 12, flexWrap: 'wrap' }}>
                  <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={() => setActiveTab('profile')}>Fix in Profile</button>
                  <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={() => go('jobmatch')}><FaSearch aria-hidden="true" /> Open full Job Matcher</button>
                  <button className="ds-btn ds-btn-primary ds-btn-sm" onClick={onViewPortfolio}>Open preview + ATS mode</button>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <p className="ds-eyebrow">Settings</p>
                <h1 className="ds-h1" style={{ marginBottom: 8 }}>Account & preferences</h1>
                <SettingsPanel
                  formData={editedData}
                  updateFormData={updateFormData}
                  saveProfile={persistProfile}
                  onLogout={onLogout}
                  onDeleteRequest={() => setShowDeleteConfirm(true)}
                  darkMode={darkMode}
                  toggleDarkMode={toggleDarkMode}
                  notify={notify}
                  onEditProfile={() => { setActiveTab('profile'); if (!isEditing) handleEdit(); }}
                />
                <div className="ds-card ds-card-pad" style={{ marginTop: 12, borderColor: 'var(--ds-error-border)' }}>
                  <h2 className="ds-h2" style={{ color: 'var(--ds-error)' }}>Danger zone</h2>
                  <p className="ds-muted" style={{ margin: '4px 0 10px' }}>Delete your profile and account permanently. This cannot be undone.</p>
                  <button className="ds-btn ds-btn-danger ds-btn-sm" onClick={() => setShowDeleteConfirm(true)}><FaTrash aria-hidden="true" /> Delete profile</button>
                </div>
              </motion.div>
            )}

            {activeTab === 'preview' && (
              <div className="ds-card ds-card-pad">
                <h1 className="ds-h1">Resume preview</h1>
                <p className="ds-muted" style={{ margin: '4px 0 12px' }}>Open the full preview with template + ATS toggle and PDF export.</p>
                <button className="ds-btn ds-btn-primary" onClick={onViewPortfolio}><FaEye aria-hidden="true" /> Open preview</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete profile?"
          body="This permanently deletes personal info, education, skills, projects, and your account. This cannot be undone."
          confirmLabel="Yes, delete"
          busy={deleting}
          danger
          onCancel={() => !deleting && setShowDeleteConfirm(false)}
          onConfirm={handleDeleteProfile}
        />
      )}
    </div>
  );
};

export default Dashboard;
