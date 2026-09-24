import React, { useState, useEffect } from 'react';
import {
  FaUser, FaLock, FaSignOutAlt, FaPalette, FaShieldAlt, FaGoogle,
  FaDownload, FaTrash, FaEye, FaEyeSlash, FaCheckCircle, FaExclamationCircle,
} from 'react-icons/fa';
import { authService, profileService, resumesService } from '../services/api';
import ThemeCustomizer from './ThemeCustomizer';
import { ConfirmDialog } from './ui/Feedback';

const PAPER_KEY = 'ds-paper-size';
const LANG_KEY = 'ds-resume-language';

export const getPaperSizePref = () => {
  try {
    return localStorage.getItem(PAPER_KEY) === 'letter' ? 'letter' : 'a4';
  } catch {
    return 'a4';
  }
};

export const getResumeLanguagePref = () => {
  try {
    return localStorage.getItem(LANG_KEY) || 'en';
  } catch {
    return 'en';
  }
};

// Professional Settings area: account, security, preferences, privacy,
// connected accounts. Destructive actions always confirm first. Authentication
// behavior is unchanged — this panel only calls the existing session flows.
const SettingsPanel = ({
  formData, updateFormData, saveProfile, onLogout, onDeleteRequest,
  darkMode, toggleDarkMode, notify, onEditProfile,
}) => {
  const [account, setAccount] = useState(null); // /auth/user: provider, verification, createdAt
  const [accountError, setAccountError] = useState(null);
  const [name, setName] = useState(formData?.personalInfo?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [nameMsg, setNameMsg] = useState(null);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState(null);
  const [confirmLogoutAll, setConfirmLogoutAll] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [paperSize, setPaperSize] = useState(getPaperSizePref());
  const [resumeLang, setResumeLang] = useState(getResumeLanguagePref());
  const [exporting, setExporting] = useState(false);
  const [versionCount, setVersionCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    authService.getCurrentUser()
      .then((res) => { if (!cancelled && res.success) setAccount(res.data.user); })
      .catch(() => { if (!cancelled) setAccountError('Could not load account details.'); });
    resumesService.list()
      .then((res) => { if (!cancelled) setVersionCount((res.data.versions || []).length); })
      .catch(() => { if (!cancelled) setVersionCount(0); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setName(formData?.personalInfo?.name || '');
  }, [formData?.personalInfo?.name]);

  const persistProfile = saveProfile || ((payload) => profileService.updateProfile(payload));
  const providerLabel = !account ? '—'
    : account.googleConnected && account.authProvider === 'google' ? 'Google'
    : account.googleConnected ? 'Email + Google' : 'Email + password';
  const googleConnected = !!(account && account.googleConnected);

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNameMsg({ tone: 'error', text: 'Name must be at least 2 characters.' });
      return;
    }
    setSavingName(true);
    setNameMsg(null);
    try {
      const payload = { personalInfo: { ...(formData.personalInfo || {}), name: trimmed } };
      await persistProfile(payload);
      if (updateFormData) updateFormData({ ...formData, personalInfo: payload.personalInfo });
      setNameMsg({ tone: 'success', text: 'Display name updated everywhere.' });
      if (notify) notify('Display name updated.', 'success', 'Account');
    } catch (err) {
      setNameMsg({ tone: 'error', text: err.response?.data?.message || 'Could not save name.' });
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPw.length < 6) {
      setPwMsg({ tone: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ tone: 'error', text: 'New passwords do not match.' });
      return;
    }
    setPwBusy(true);
    try {
      const res = await authService.changePassword(currentPw, newPw);
      setPwMsg({ tone: 'success', text: res.message || 'Password changed successfully.' });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      if (notify) notify('Password changed.', 'success', 'Security');
    } catch (err) {
      setPwMsg({ tone: 'error', text: err.response?.data?.message || 'Could not change password.' });
    } finally {
      setPwBusy(false);
    }
  };

  const handleLogoutAll = async () => {
    setLoggingOutAll(true);
    try {
      await authService.logoutAll();
      // Current token is now invalid too — sign out locally.
      if (onLogout) onLogout();
    } catch (err) {
      setPwMsg({ tone: 'error', text: err.response?.data?.message || 'Could not sign out all sessions.' });
      setLoggingOutAll(false);
      setConfirmLogoutAll(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const [profile, versions] = await Promise.all([
        profileService.getProfile(),
        resumesService.list().catch(() => null),
      ]);
      const doc = {
        exportedAt: new Date().toISOString(),
        account: account ? { email: account.email, authProvider: account.authProvider, emailVerified: account.emailVerified, createdAt: account.createdAt } : undefined,
        profile: profile.success ? profile.data.profile : undefined,
        versions: versions && versions.success ? versions.data.versions : undefined,
      };
      const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'portfolio-generator-data-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      if (notify) notify('Your data export downloaded as JSON.', 'success', 'Privacy');
    } catch {
      if (notify) notify('Export failed. Please try again.', 'error', 'Privacy');
    } finally {
      setExporting(false);
    }
  };

  const setPaper = (v) => {
    setPaperSize(v);
    try { localStorage.setItem(PAPER_KEY, v); } catch { /* ignore */ }
  };
  const setLang = (v) => {
    setResumeLang(v);
    try { localStorage.setItem(LANG_KEY, v); } catch { /* ignore */ }
  };

  const pi = formData?.personalInfo || {};
  const initial = pi.name ? pi.name.charAt(0).toUpperCase() : '?';

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {/* ACCOUNT */}
      <section className="ds-card ds-card-pad" aria-labelledby="set-account">
        <h2 id="set-account" className="ds-h2"><FaUser aria-hidden="true" /> Account</h2>
        {accountError && <div className="ds-alert ds-alert-error" role="alert" style={{ margin: '8px 0' }}>{accountError}</div>}
        <div className="ds-row" style={{ gap: 12, alignItems: 'center', margin: '10px 0' }}>
          <div aria-label="Profile image" style={{ width: 56, height: 56, borderRadius: '50%', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 700, overflow: 'hidden', flexShrink: 0 }}>
            {pi.profileImage ? <img src={pi.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
          </div>
          <div style={{ minWidth: 0 }}>
            <strong>{pi.name || '—'}</strong>
            <div className="ds-muted">{pi.email || '—'}</div>
            <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" style={{ paddingLeft: 0 }} onClick={onEditProfile}>Change photo in Profile</button>
          </div>
        </div>
        <div className="ds-grid-2">
          <div>
            <label className="ds-label" htmlFor="set-name">Display name</label>
            <input id="set-name" className="ds-input" value={name} maxLength={120}
              onChange={(e) => setName(e.target.value)} style={{ marginTop: 4 }} />
            {nameMsg && (
              <p role={nameMsg.tone === 'error' ? 'alert' : 'status'} className={nameMsg.tone === 'error' ? 'ds-field-error' : 'ds-field-ok'}>{nameMsg.text}</p>
            )}
            <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={handleSaveName} disabled={savingName} style={{ marginTop: 8 }}>
              {savingName ? 'Saving…' : 'Save name'}
            </button>
          </div>
          <div>
            <span className="ds-label">Email (login identity)</span>
            <p className="ds-body" style={{ margin: '6px 0 2px' }}>{pi.email || '—'}</p>
            <p className="ds-helper">Email is your sign-in identity and cannot be changed here — this protects the account from accidental lockout.</p>
            <span className="ds-label" style={{ marginTop: 8, display: 'block' }}>Authentication provider</span>
            <p className="ds-body" style={{ margin: '6px 0 0' }}>
              <span className="ds-badge ds-badge-primary">{providerLabel}</span>
              {account && (
                <span className="ds-helper" style={{ marginLeft: 8 }}>
                  {account.emailVerified ? 'Email verified' : 'Email not verified'}
                </span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* SECURITY */}
      <section className="ds-card ds-card-pad" aria-labelledby="set-security">
        <h2 id="set-security" className="ds-h2"><FaLock aria-hidden="true" /> Security</h2>
        {account && account.authProvider === 'google' ? (
          <div className="ds-alert ds-alert-info" role="status" style={{ marginTop: 8 }}>
            <FaGoogle aria-hidden="true" />
            <span>This account signs in with Google and has no password to change. Password options apply to email + password accounts.</span>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} style={{ marginTop: 8, display: 'grid', gap: 8, maxWidth: 420 }}>
            <div>
              <label className="ds-label" htmlFor="set-cur-pw">Current password</label>
              <input id="set-cur-pw" className="ds-input" type={showPw ? 'text' : 'password'} value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)} autoComplete="current-password" required style={{ marginTop: 4 }} />
            </div>
            <div className="ds-grid-2">
              <div>
                <label className="ds-label" htmlFor="set-new-pw">New password</label>
                <input id="set-new-pw" className="ds-input" type={showPw ? 'text' : 'password'} value={newPw}
                  onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" required minLength={6} style={{ marginTop: 4 }} />
              </div>
              <div>
                <label className="ds-label" htmlFor="set-confirm-pw">Confirm new password</label>
                <input id="set-confirm-pw" className="ds-input" type={showPw ? 'text' : 'password'} value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)} autoComplete="new-password" required minLength={6} style={{ marginTop: 4 }} />
              </div>
            </div>
            <div className="ds-row" style={{ flexWrap: 'wrap' }}>
              <button type="button" className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setShowPw((s) => !s)} aria-pressed={showPw}>
                {showPw ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />} {showPw ? 'Hide' : 'Show'} passwords
              </button>
              <button type="submit" className="ds-btn ds-btn-secondary ds-btn-sm" disabled={pwBusy}>
                {pwBusy ? 'Changing…' : 'Change password'}
              </button>
            </div>
            {pwMsg && (
              <p role={pwMsg.tone === 'error' ? 'alert' : 'status'} className={pwMsg.tone === 'error' ? 'ds-field-error' : 'ds-field-ok'}>
                {pwMsg.tone === 'error' ? <FaExclamationCircle aria-hidden="true" /> : <FaCheckCircle aria-hidden="true" />} {pwMsg.text}
              </p>
            )}
          </form>
        )}
        <hr className="ds-divider" />
        <div className="ds-row" style={{ flexWrap: 'wrap' }}>
          <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={onLogout}>
            <FaSignOutAlt aria-hidden="true" /> Log out this device
          </button>
          <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => setConfirmLogoutAll(true)}>
            Log out all sessions…
          </button>
        </div>
        <p className="ds-helper" style={{ marginTop: 6 }}>“All sessions” signs you out on every device and browser, including this one.</p>
      </section>

      {/* PREFERENCES */}
      <section className="ds-card ds-card-pad" aria-labelledby="set-prefs">
        <h2 id="set-prefs" className="ds-h2"><FaPalette aria-hidden="true" /> Preferences</h2>
        <div className="ds-row" style={{ justifyContent: 'space-between', margin: '8px 0', flexWrap: 'wrap' }}>
          <div>
            <strong style={{ fontSize: '0.9rem' }}>Appearance</strong>
            <div className="ds-helper">Light or dark application theme.</div>
          </div>
          <div className="ds-row" role="radiogroup" aria-label="Appearance">
            <button role="radio" aria-checked={!darkMode} onClick={() => darkMode && toggleDarkMode()} className={`ds-btn ds-btn-sm ${!darkMode ? 'ds-btn-primary' : 'ds-btn-secondary'}`}>Light</button>
            <button role="radio" aria-checked={!!darkMode} onClick={() => !darkMode && toggleDarkMode()} className={`ds-btn ds-btn-sm ${darkMode ? 'ds-btn-primary' : 'ds-btn-secondary'}`}>Dark</button>
          </div>
        </div>
        <hr className="ds-divider" />
        <ThemeCustomizer />
        <hr className="ds-divider" />
        <div className="ds-grid-2">
          <div>
            <label className="ds-label" htmlFor="set-paper">Default paper size (ATS PDF)</label>
            <select id="set-paper" className="ds-select" value={paperSize} onChange={(e) => setPaper(e.target.value)} style={{ marginTop: 4 }}>
              <option value="a4">A4 (210 × 297 mm)</option>
              <option value="letter">US Letter (8.5 × 11 in)</option>
            </select>
            <p className="ds-helper" style={{ marginTop: 4 }}>Used automatically by the ATS PDF export.</p>
          </div>
          <div>
            <label className="ds-label" htmlFor="set-lang">Default resume language</label>
            <select id="set-lang" className="ds-select" value={resumeLang} onChange={(e) => setLang(e.target.value)} style={{ marginTop: 4 }}>
              <option value="en">English</option>
            </select>
            <p className="ds-helper" style={{ marginTop: 4 }}>Templates currently render in English; more languages are planned.</p>
          </div>
        </div>
      </section>

      {/* PRIVACY */}
      <section className="ds-card ds-card-pad" aria-labelledby="set-privacy">
        <h2 id="set-privacy" className="ds-h2"><FaShieldAlt aria-hidden="true" /> Privacy & data</h2>
        <ul className="ds-muted" style={{ margin: '8px 0 8px 18px', display: 'grid', gap: 4, fontSize: '0.88rem' }}>
          <li>Stored for your account: profile and resume sections, {versionCount === null ? '…' : versionCount} saved version{(versionCount === 1) ? '' : 's'}, theme preferences, and sign-in identity.</li>
          <li>Passwords are stored hashed with bcrypt and never in readable form.</li>
          {account?.createdAt && <li>Account created {new Date(account.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}.</li>}
          <li>Job descriptions you paste are analyzed locally in the browser and never uploaded.</li>
        </ul>
        <div className="ds-row" style={{ flexWrap: 'wrap' }}>
          <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={handleExportData} disabled={exporting}>
            <FaDownload aria-hidden="true" /> {exporting ? 'Preparing…' : 'Export my data (JSON)'}
          </button>
          {onDeleteRequest && (
            <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={onDeleteRequest} style={{ color: 'var(--ds-error)' }}>
              <FaTrash aria-hidden="true" /> Delete account…
            </button>
          )}
        </div>
      </section>

      {/* CONNECTED ACCOUNTS */}
      <section className="ds-card ds-card-pad" aria-labelledby="set-connected">
        <h2 id="set-connected" className="ds-h2"><FaGoogle aria-hidden="true" /> Connected accounts</h2>
        <div className="ds-row" style={{ justifyContent: 'space-between', marginTop: 8, flexWrap: 'wrap' }}>
          <div>
            <strong style={{ fontSize: '0.9rem' }}>Google</strong>
            <div className="ds-muted">
              {googleConnected
                ? 'Connected — you can sign in with Google or your password.'
                : 'Not connected.'}
            </div>
          </div>
          <span className={`ds-badge ${googleConnected ? 'ds-badge-success' : ''}`}>
            {googleConnected ? <><FaCheckCircle aria-hidden="true" /> Linked</> : 'Not linked'}
          </span>
        </div>
        {!googleConnected && (
          <p className="ds-helper" style={{ marginTop: 6 }}>
            To link Google, sign out and choose “Continue with Google” using this same email address — the accounts merge safely and your password keeps working.
          </p>
        )}
      </section>

      {confirmLogoutAll && (
        <ConfirmDialog
          title="Log out of all sessions?"
          body="This signs you out on every device and browser, including this one. You will need to sign in again everywhere."
          confirmLabel="Yes, log out everywhere"
          danger
          busy={loggingOutAll}
          onCancel={() => !loggingOutAll && setConfirmLogoutAll(false)}
          onConfirm={handleLogoutAll}
        />
      )}
    </div>
  );
};

export default SettingsPanel;
