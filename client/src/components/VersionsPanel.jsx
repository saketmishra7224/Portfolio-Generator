import React, { useState, useEffect, useRef } from 'react';
import {
  FaPlus, FaTrash, FaEdit, FaCheck, FaTimes, FaCopy, FaStar,
} from 'react-icons/fa';
import { resumesService, profileService } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { ConfirmDialog, EmptyState } from './ui/Feedback';

const TEMPLATES = [
  { id: 'minimal', label: 'Minimal' },
  { id: 'modern', label: 'Modern' },
  { id: 'classic', label: 'Classic' },
  { id: 'professional', label: 'Professional' },
];

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// Resume versions manager: create / rename / duplicate / delete / activate.
// Creating snapshots from the current resume; activating loads the snapshot
// into the working profile (saves route to the version until deactivated).
const VersionsPanel = ({ currentData, activeVersion, onActivateVersion, onDeactivateVersion, notify }) => {
  const { updateTheme } = useTheme();
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('');
  const [fromCurrent, setFromCurrent] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: '', targetRole: '', template: 'minimal', targetJobDescription: '' });
  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const appliedThemeRef = useRef(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await resumesService.list();
      setVersions(res.data.versions || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load versions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  // After a refresh-restore (login with an active version), apply the
  // version's theme locally so preview/PDF match the snapshot.
  useEffect(() => {
    if (!activeVersion || loading) return;
    const v = versions.find((x) => String(x.id) === String(activeVersion.id));
    if (v && appliedThemeRef.current !== String(v.id)) {
      appliedThemeRef.current = String(v.id);
      updateTheme({ template: v.template, accentColor: v.theme?.accentColor, font: v.theme?.font });
    }
  }, [versions, activeVersion, loading]);

  const failMsg = (err, fallback) => err.response?.data?.message || err.message || fallback;

  const handleCreate = async () => {
    if (!newName.trim()) {
      setError('Give the version a name first (e.g. “Frontend Developer Resume”).');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await resumesService.create({
        name: newName.trim(),
        targetRole: newRole.trim(),
        fromCurrent,
      });
      setNewName('');
      setNewRole('');
      await refresh();
      notify && notify(`Version “${res.data.version.name}” created${fromCurrent ? ' from your current resume' : ''}.`, 'success', 'Created');
    } catch (err) {
      setError(failMsg(err, 'Could not create version.'));
    } finally {
      setBusy(false);
    }
  };

  const handleActivate = async (v) => {
    setBusy(true);
    setError(null);
    try {
      await resumesService.setActive(v.id);
      appliedThemeRef.current = String(v.id);
      updateTheme({ template: v.template, accentColor: v.theme?.accentColor, font: v.theme?.font });
      if (onActivateVersion) onActivateVersion(v);
      notify && notify(`Now editing “${v.name}”. Saves go to this version.`, 'success', 'Version active');
    } catch (err) {
      setError(failMsg(err, 'Could not activate version.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDeactivate = async () => {
    setBusy(true);
    setError(null);
    try {
      await resumesService.setActive(null);
      appliedThemeRef.current = null;
      // Restore the main theme so previews match the main resume again.
      try {
        const p = await profileService.getProfile();
        if (p.success && p.data.profile && p.data.profile.theme) updateTheme(p.data.profile.theme);
      } catch { /* keep current theme on failure */ }
      if (onDeactivateVersion) await onDeactivateVersion();
      notify && notify('Back on your main resume.', 'info', 'Deactivated');
    } catch (err) {
      setError(failMsg(err, 'Could not deactivate version.'));
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (v) => {
    setEditingId(String(v.id));
    setEditDraft({ name: v.name || '', targetRole: v.targetRole || '', template: v.template || 'minimal', targetJobDescription: v.targetJobDescription || '' });
  };

  const saveEdit = async (id) => {
    if (!editDraft.name.trim()) {
      setError('Version name cannot be empty.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await resumesService.update(id, {
        name: editDraft.name.trim(),
        targetRole: editDraft.targetRole.trim(),
        template: editDraft.template,
        targetJobDescription: editDraft.targetJobDescription,
      });
      setEditingId(null);
      await refresh();
      notify && notify('Version updated.', 'success', 'Saved');
    } catch (err) {
      setError(failMsg(err, 'Could not update version.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDuplicate = async (v) => {
    setBusy(true);
    setError(null);
    try {
      const res = await resumesService.duplicate(v.id);
      await refresh();
      notify && notify(`Duplicated as “${res.data.version.name}”.`, 'success', 'Duplicated');
    } catch (err) {
      setError(failMsg(err, 'Could not duplicate version.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const wasActive = activeVersion && String(activeVersion.id) === String(deleteId);
    setDeleting(true);
    try {
      await resumesService.remove(deleteId);
      setDeleteId(null);
      await refresh();
      if (wasActive && onDeactivateVersion) await onDeactivateVersion();
      notify && notify('Version deleted. Your account and main resume are untouched.', 'success', 'Deleted');
    } catch (err) {
      setError(failMsg(err, 'Could not delete version.'));
    } finally {
      setDeleting(false);
    }
  };

  const countEntries = (v) => {
    const d = v.data || {};
    return (d.experiences || []).length + (d.projects || []).length;
  };

  return (
    <div>
      <p className="ds-eyebrow">Versions</p>
      <h1 className="ds-h1" style={{ marginBottom: 4 }}>Resume versions</h1>
      <p className="ds-muted" style={{ marginBottom: 12 }}>
        Maintain tailored variants (e.g. Frontend, Data Science, Internship) without duplicating your account.
        Activating a version loads it everywhere — builder, preview, ATS, matcher — until you switch back.
      </p>

      {error && <div className="ds-alert ds-alert-error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}

      {activeVersion && (
        <div className="ds-alert ds-alert-info" role="status" style={{ marginBottom: 12 }}>
          <FaStar aria-hidden="true" />
          <span>
            Editing version <strong>“{activeVersion.name}”</strong> — all saves go to this version.
            {' '}<button type="button" className="ds-btn ds-btn-secondary ds-btn-sm" onClick={handleDeactivate} disabled={busy} style={{ marginLeft: 6 }}>Switch to main resume</button>
          </span>
        </div>
      )}

      {/* Create */}
      <div className="ds-card ds-card-pad" style={{ marginBottom: 12 }}>
        <h2 className="ds-h2">New version</h2>
        <div className="ds-grid-2" style={{ marginTop: 8 }}>
          <div>
            <label className="ds-label" htmlFor="vv-name">Name *</label>
            <input id="vv-name" className="ds-input" value={newName} maxLength={80}
              onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Frontend Developer Resume" style={{ marginTop: 4 }} />
          </div>
          <div>
            <label className="ds-label" htmlFor="vv-role">Target role</label>
            <input id="vv-role" className="ds-input" value={newRole} maxLength={120}
              onChange={(e) => setNewRole(e.target.value)} placeholder="e.g., Frontend Developer" style={{ marginTop: 4 }} />
          </div>
        </div>
        <label className="ds-row" style={{ gap: 8, marginTop: 8, cursor: 'pointer' }} htmlFor="vv-current">
          <input id="vv-current" type="checkbox" checked={fromCurrent} onChange={(e) => setFromCurrent(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--ds-primary)' }} />
          <span className="ds-body" style={{ fontSize: '0.88rem' }}>Start from my current resume content</span>
        </label>
        <button className="ds-btn ds-btn-primary ds-btn-sm" onClick={handleCreate} disabled={busy} style={{ marginTop: 10 }}>
          <FaPlus aria-hidden="true" /> {busy ? 'Creating…' : 'Create version'}
        </button>
        <p className="ds-helper" style={{ marginTop: 6 }}>Max {10} versions per account. Snapshots are independent copies — editing one never touches the others.</p>
      </div>

      {/* List */}
      {loading ? (
        <p className="ds-muted" role="status">Loading versions…</p>
      ) : versions.length === 0 ? (
        <EmptyState icon={<FaStar />} title="No versions yet" body="Create your first tailored variant above — e.g., one per role you apply for." action={null} />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {versions.map((v) => {
            const isActive = activeVersion && String(activeVersion.id) === String(v.id);
            const isEditing = editingId === String(v.id);
            return (
              <div key={v.id} className="ds-card ds-card-pad" style={isActive ? { borderColor: 'var(--ds-primary)', borderWidth: 2 } : undefined}>
                <div className="ds-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div className="ds-row" style={{ gap: 8 }}>
                      {isEditing ? (
                        <input className="ds-input" value={editDraft.name} maxLength={80} aria-label="Version name"
                          onChange={(e) => setEditDraft((p) => ({ ...p, name: e.target.value }))} style={{ maxWidth: 260 }} />
                      ) : (
                        <strong>{v.name}</strong>
                      )}
                      {isActive && <span className="ds-badge ds-badge-success"><FaStar aria-hidden="true" /> Active</span>}
                      <span className="ds-badge">{v.template}</span>
                    </div>
                    <div className="ds-helper" style={{ marginTop: 2 }}>
                      {v.targetRole ? `Target: ${v.targetRole} • ` : ''}{countEntries(v)} entries • Updated {fmtDate(v.updatedAt)}
                    </div>
                  </div>
                  <div className="ds-row" style={{ flexWrap: 'wrap' }}>
                    {!isEditing && !isActive && (
                      <button className="ds-btn ds-btn-primary ds-btn-sm" onClick={() => handleActivate(v)} disabled={busy}>
                        <FaStar aria-hidden="true" /> Activate
                      </button>
                    )}
                    {!isEditing && isActive && (
                      <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={handleDeactivate} disabled={busy}>Deactivate</button>
                    )}
                    {!isEditing && (
                      <>
                        <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => startEdit(v)} disabled={busy} aria-label={`Rename ${v.name}`}><FaEdit aria-hidden="true" /></button>
                        <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => handleDuplicate(v)} disabled={busy} aria-label={`Duplicate ${v.name}`} title="Duplicate"><FaCopy aria-hidden="true" /></button>
                        <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setDeleteId(String(v.id))} disabled={busy} aria-label={`Delete ${v.name}`} title="Delete"><FaTrash aria-hidden="true" /></button>
                      </>
                    )}
                    {isEditing && (
                      <>
                        <button className="ds-btn ds-btn-primary ds-btn-sm" onClick={() => saveEdit(v.id)} disabled={busy}><FaCheck aria-hidden="true" /> Save</button>
                        <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setEditingId(null)} disabled={busy}><FaTimes aria-hidden="true" /> Cancel</button>
                      </>
                    )}
                  </div>
                </div>
                {isEditing && (
                  <div className="ds-grid-2" style={{ marginTop: 10 }}>
                    <div>
                      <label className="ds-label" htmlFor={`vv-role-${v.id}`}>Target role</label>
                      <input id={`vv-role-${v.id}`} className="ds-input" value={editDraft.targetRole} maxLength={120}
                        onChange={(e) => setEditDraft((p) => ({ ...p, targetRole: e.target.value }))} style={{ marginTop: 4 }} />
                    </div>
                    <div>
                      <label className="ds-label" htmlFor={`vv-tpl-${v.id}`}>Template</label>
                      <select id={`vv-tpl-${v.id}`} className="ds-select" value={editDraft.template}
                        onChange={(e) => setEditDraft((p) => ({ ...p, template: e.target.value }))} style={{ marginTop: 4 }}>
                        {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="ds-label" htmlFor={`vv-jd-${v.id}`}>Target job description (optional — powers Job Match for this version)</label>
                      <textarea id={`vv-jd-${v.id}`} className="ds-textarea" rows={4} value={editDraft.targetJobDescription}
                        onChange={(e) => setEditDraft((p) => ({ ...p, targetJobDescription: e.target.value }))} style={{ marginTop: 4 }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete this version?"
          body="The snapshot is removed permanently. Your account, main resume and other versions are unaffected."
          confirmLabel="Yes, delete version"
          danger
          busy={deleting}
          onCancel={() => !deleting && setDeleteId(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};

export default VersionsPanel;
