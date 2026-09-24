import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { authService } from '../services/api';
import {
  FaEnvelope, FaLock, FaUser, FaPhone, FaEye, FaEyeSlash,
  FaCheckCircle, FaExclamationCircle, FaShieldAlt, FaFileAlt, FaPalette
} from 'react-icons/fa';

// Public OAuth client ID (safe to expose — it is not a secret).
// Stored server-side in server/.env, injected in HTML, loaded dynamically, or fallback to REACT_APP_GOOGLE_CLIENT_ID.
const ENV_GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || (typeof window !== 'undefined' && window.__GOOGLE_CLIENT_ID__) || '';
const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

// Load Google Identity Services once per page load.
let gisLoadPromise = null;
function loadGisScript() {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.google && window.google.accounts && window.google.accounts.id) {
    return Promise.resolve(true);
  }
  if (!gisLoadPromise) {
    gisLoadPromise = new Promise((resolve) => {
      const existing = document.querySelector(`script[src="${GIS_SCRIPT_SRC}"]`);
      if (existing) {
        if (window.google?.accounts?.id) {
          resolve(true);
          return;
        }
        existing.addEventListener('load', () => resolve(true), { once: true });
        existing.addEventListener('error', () => {
          gisLoadPromise = null;
          resolve(false);
        }, { once: true });
        return;
      }
      const script = document.createElement('script');
      script.src = GIS_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        gisLoadPromise = null;
        resolve(false);
      };
      document.head.appendChild(script);
    });
  }
  return gisLoadPromise;
}

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    personalInfo: { name: '', email: '', phone: '' }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  // Google Sign-In state. Client ID is fetched from server if not set in client env.
  const [googleClientId, setGoogleClientId] = useState(ENV_GOOGLE_CLIENT_ID);
  const [configChecked, setConfigChecked] = useState(Boolean(ENV_GOOGLE_CLIENT_ID));
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleLoadFailed, setGoogleLoadFailed] = useState(false);
  const googleBtnRef = useRef(null);
  const initializedClientIdRef = useRef(null);
  const googleConfigured = Boolean(googleClientId);

  useEffect(() => {
    let active = true;
    if (!googleClientId) {
      authService.getGoogleClientId()
        .then((id) => {
          if (active) {
            if (id) setGoogleClientId(id);
            setConfigChecked(true);
          }
        })
        .catch(() => {
          if (active) setConfigChecked(true);
        });
    } else {
      setConfigChecked(true);
    }
    return () => { active = false; };
  }, [googleClientId]);

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
  const validatePassword = (v) => (v || '').length >= 6;
  const validateName = (v) => (v || '').trim().length >= 2;
  const validatePhone = (v) => /^[0-9+\-\s()]{10,}$/.test(v || '');

  const validateField = (name, value) => {
    if (name === 'email' && value && !validateEmail(value)) return 'Enter a valid email address';
    if (name === 'password' && value && !validatePassword(value)) return 'Password must be at least 6 characters';
    if (name === 'personalInfo.name' && !isLogin && value && !validateName(value)) return 'Name must be at least 2 characters';
    if (name === 'personalInfo.phone' && !isLogin && value && !validatePhone(value)) return 'Enter a valid phone number (min 10 digits)';
    return null;
  };

  const handleTabChange = (login) => {
    setIsLogin(login);
    setError(null);
    setInfo(null);
    setFieldErrors({});
    setTouched({});
    setShowPassword(false);
  };

  const handleBlur = (name) => (e) => {
    const value = e.target.value;
    setTouched((p) => ({ ...p, [name]: true }));
    const err = validateField(name, value);
    setFieldErrors((p) => ({ ...p, [name]: err }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((p) => ({ ...p, [parent]: { ...p[parent], [child]: value } }));
    } else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
    if (touched[name]) {
      setFieldErrors((p) => ({ ...p, [name]: validateField(name, value) }));
    }
  };

  const validateAll = () => {
    const errs = {};
    if (!validateEmail(formData.email)) errs.email = 'Enter a valid email address';
    if (!validatePassword(formData.password)) errs.password = 'Password must be at least 6 characters';
    if (!isLogin) {
      if (!validateName(formData.personalInfo.name)) errs['personalInfo.name'] = 'Name is required (min 2 characters)';
      if (!validatePhone(formData.personalInfo.phone)) errs['personalInfo.phone'] = 'Valid phone is required';
    }
    setFieldErrors(errs);
    setTouched({ email: true, password: true, 'personalInfo.name': true, 'personalInfo.phone': true });
    return Object.keys(errs).length === 0;
  };

  // Exchange the Google-issued ID token for the app's own JWT session.
  // Identity is established server-side; the frontend only transports the
  // Google credential and stores the resulting app token (same keys as
  // email/password login so the axios interceptor + refresh flow are shared).
  const handleGoogleCredential = useCallback(async (response) => {
    const idToken = response && response.credential;
    if (!idToken) {
      // User closed the Google popup before completing — not an error.
      return;
    }
    setGoogleLoading(true);
    setError(null);
    try {
      const data = await authService.googleLogin(idToken);
      if (data.success && data.data.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('currentUserEmail', (data.data.user.email || '').trim());
        onAuthSuccess(data.data.user);
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } catch (err) {
      if (!err.response) {
        setError('Network error during Google sign-in. Check your connection and try again.');
      } else {
        const code = err.response?.data?.code;
        const msg = err.response?.data?.message;
        if (code === 'ACCOUNT_CONFLICT') {
          setError(msg || 'This email is linked to a different account. Try email/password sign-in instead.');
        } else if (code === 'INVALID_TOKEN') {
          setError(msg || 'Google sign-in expired or is invalid. Please try again.');
        } else if (code === 'GOOGLE_NOT_CONFIGURED') {
          setError(msg || 'Google sign-in is not configured. Please use email/password.');
        } else {
          setError(msg || 'Google sign-in failed. Please try again.');
        }
      }
    } finally {
      setGoogleLoading(false);
    }
  }, [onAuthSuccess]);

  // Render Google button with defensive initialization guarding
  const renderGoogleButton = useCallback(() => {
    if (!googleClientId || !window.google?.accounts?.id) return;
    try {
      if (initializedClientIdRef.current !== googleClientId) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        initializedClientIdRef.current = googleClientId;
      }
      const target = googleBtnRef.current;
      if (target) {
        target.innerHTML = '';
        const width = Math.max(240, Math.min(400, target.clientWidth || 320));
        window.google.accounts.id.renderButton(target, {
          theme: 'outline',
          size: 'large',
          width,
          text: 'continue_with',
          shape: 'rectangular',
        });
      }
      setGoogleReady(true);
    } catch (e) {
      console.error('Error rendering Google button:', e);
      setGoogleLoadFailed(true);
    }
  }, [googleClientId, handleGoogleCredential]);

  // Initialise the official Google button (login + signup share it).
  useEffect(() => {
    if (!googleConfigured || !googleClientId) return;
    let cancelled = false;
    setGoogleLoadFailed(false);
    loadGisScript().then((ok) => {
      if (cancelled) return;
      if (!ok || !window.google?.accounts?.id) {
        setGoogleLoadFailed(true);
        return;
      }
      renderGoogleButton();
    });
    return () => { cancelled = true; };
  }, [googleConfigured, googleClientId, renderGoogleButton]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!validateAll()) return;
    setIsLoading(true);
    try {
      let response;
      if (isLogin) {
        response = await authService.login({ email: formData.email.trim(), password: formData.password });
      } else {
        response = await authService.register({
          email: formData.email.trim(),
          password: formData.password,
          personalInfo: {
            name: formData.personalInfo.name.trim(),
            email: formData.email.trim(),
            phone: formData.personalInfo.phone.trim(),
            profileImage: null
          }
        });
      }
      if (response.success && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('currentUserEmail', formData.email.trim());
        onAuthSuccess(response.data.user);
      } else {
        setError('Authentication failed. Please try again.');
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      setError(msg || (isLogin ? 'Login failed. Check your credentials or register first.' : 'Registration failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const fieldState = (name, value) => {
    if (!touched[name]) return '';
    if (fieldErrors[name]) return 'invalid';
    if (value) return 'valid';
    return '';
  };

  const renderField = ({ label, name, type = 'text', value, placeholder, autoComplete, required, helper, icon }) => {
    const state = fieldState(name, value);
    const err = fieldErrors[name];
    const id = `auth-${name.replace('.', '-')}`;
    return (
      <div style={{ marginBottom: '0.9rem' }}>
        <label htmlFor={id} className="ds-label" style={{ display: 'block', marginBottom: 6 }}>
          {label} {required && <span aria-hidden="true" style={{ color: 'var(--ds-error)' }}>*</span>}
        </label>
        <div style={{ position: 'relative' }}>
          {icon && <span aria-hidden="true" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--ds-faint)' }}>{icon}</span>}
          <input
            id={id}
            name={name}
            type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur(name)}
            placeholder={placeholder}
            required={required}
            autoComplete={autoComplete}
            aria-invalid={err ? 'true' : 'false'}
            aria-describedby={err ? `${id}-err` : helper ? `${id}-help` : undefined}
            className="ds-input"
            style={{ paddingLeft: icon ? 34 : undefined, paddingRight: type === 'password' ? 38 : 34 }}
          />
          {type === 'password' ? (
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="ds-btn ds-btn-ghost ds-btn-sm"
              style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', padding: 6 }}
            >
              {showPassword ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
            </button>
          ) : (
            <span aria-hidden="true" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
              {state === 'valid' && <FaCheckCircle color="#16a34a" />}
              {state === 'invalid' && <FaExclamationCircle color="#dc2626" />}
            </span>
          )}
        </div>
        {err ? (
          <p id={`${id}-err`} role="alert" className="ds-field-error"><FaExclamationCircle aria-hidden="true" /> {err}</p>
        ) : helper ? (
          <p id={`${id}-help`} className="ds-helper" style={{ marginTop: 4 }}>{helper}</p>
        ) : null}
      </div>
    );
  };

  return (
    <div className="ds-auth">
      {/* Marketing panel */}
      <aside className="ds-auth-panel" aria-label="Why Portfolio Generator">
        <div style={{ maxWidth: 440 }}>
          <p className="ds-eyebrow" style={{ color: '#93c5fd' }}>Professional portfolios + ATS resumes</p>
          <h1 className="ds-display" style={{ color: '#fff', fontSize: '2.2rem', margin: '0.7rem 0 1rem' }}>
            One profile. Interview-ready output.
          </h1>
          <p style={{ color: '#cbd5e1', lineHeight: 1.65 }}>Guided builder, four calm templates, ATS checks, and clean PDF export — designed for developers, students, and job seekers.</p>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '1.4rem', display: 'grid', gap: 12 }}>
            {[
              { i: <FaFileAlt />, t: 'Structured profile that reuses everywhere' },
              { i: <FaShieldAlt />, t: 'ATS warnings before you export' },
              { i: <FaPalette />, t: 'Themes with accent + typography control' },
            ].map((x) => (
              <li key={x.t} style={{ display: 'flex', gap: 10, alignItems: 'center', color: '#e2e8f0' }}>
                <span style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{x.i}</span>
                {x.t}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Form */}
      <div className="ds-auth-form-wrap">
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="ds-card ds-auth-card"
          style={{ padding: '1.6rem' }}
        >
          <div className="ds-tabs" role="tablist" aria-label="Sign in or create account">
            <button role="tab" aria-selected={isLogin} className="ds-tab" onClick={() => handleTabChange(true)}>Sign in</button>
            <button role="tab" aria-selected={!isLogin} className="ds-tab" onClick={() => handleTabChange(false)}>Create account</button>
          </div>

          <h2 className="ds-h1" style={{ margin: '1.1rem 0 0.3rem' }}>{isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p className="ds-muted" style={{ marginBottom: '1.1rem' }}>
            {isLogin ? 'Sign in to manage your portfolio and resumes.' : 'Start with email — add profile details in the guided wizard.'}
          </p>

          {error && <div className="ds-alert ds-alert-error" role="alert" style={{ marginBottom: 12 }}><FaExclamationCircle aria-hidden="true" /><span>{error}</span></div>}
          {info && <div className="ds-alert ds-alert-info" role="status" style={{ marginBottom: 12 }}><FaCheckCircle aria-hidden="true" /><span>{info}</span></div>}

          <form onSubmit={handleSubmit} noValidate>
            {renderField({ label: 'Email', name: 'email', type: 'email', value: formData.email, placeholder: 'you@example.com', autoComplete: 'email', required: true, helper: "We'll never share your email.", icon: <FaEnvelope /> })}
            {renderField({ label: 'Password', name: 'password', type: 'password', value: formData.password, placeholder: 'Minimum 6 characters', autoComplete: isLogin ? 'current-password' : 'new-password', required: true, helper: 'Minimum 6 characters.', icon: <FaLock /> })}

            {!isLogin && (
              <>
                {renderField({ label: 'Full name', name: 'personalInfo.name', value: formData.personalInfo.name, placeholder: 'Jane Cooper', autoComplete: 'name', required: true, icon: <FaUser /> })}
                {renderField({ label: 'Phone', name: 'personalInfo.phone', type: 'tel', value: formData.personalInfo.phone, placeholder: '+91 98765 43210', autoComplete: 'tel', required: true, helper: 'Used on your resume header.', icon: <FaPhone /> })}
              </>
            )}

            {isLogin && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '-2px 0 10px' }}>
                <button
                  type="button"
                  className="ds-btn ds-btn-ghost ds-btn-sm"
                  onClick={() => setInfo('Password reset is not enabled in this build. Please contact support or create a new account if locked out.')}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" className="ds-btn ds-btn-primary ds-btn-block" disabled={isLoading} aria-busy={isLoading}>
              {isLoading ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="ds-row" style={{ margin: '14px 0', color: 'var(--ds-faint)', fontSize: '0.78rem' }} aria-hidden="true">
            <span style={{ flex: 1, height: 1, background: 'var(--ds-border)' }} />
            or
            <span style={{ flex: 1, height: 1, background: 'var(--ds-border)' }} />
          </div>

          {!configChecked ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <p className="ds-helper">Checking sign-in options…</p>
            </div>
          ) : !googleConfigured ? (
            <div>
              <button type="button" className="ds-btn ds-btn-secondary ds-btn-block" disabled aria-disabled="true" title="Google sign-in is not configured">
                <span aria-hidden="true" style={{ fontWeight: 800 }}>G</span> Continue with Google
              </button>
              <p className="ds-helper" style={{ marginTop: 6, textAlign: 'center' }}>
                Google sign-in is not configured on the server. Use email/password.
              </p>
            </div>
          ) : googleLoadFailed ? (
            <div>
              <button
                type="button"
                className="ds-btn ds-btn-secondary ds-btn-block"
                disabled={googleLoading}
                onClick={() => {
                  setGoogleLoadFailed(false);
                  setGoogleReady(false);
                  gisLoadPromise = null;
                  loadGisScript().then((ok) => {
                    if (!ok || !window.google?.accounts?.id) {
                      setGoogleLoadFailed(true);
                      return;
                    }
                    renderGoogleButton();
                  });
                }}
              >
                Retry Google sign-in
              </button>
              <p className="ds-helper" style={{ marginTop: 6, textAlign: 'center' }}>
                Could not load Google Sign-In (offline or blocked). Check connection and retry.
              </p>
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {!googleReady && (
                <button type="button" className="ds-btn ds-btn-secondary ds-btn-block" disabled>
                  Loading Google sign-in…
                </button>
              )}
              <div
                ref={googleBtnRef}
                aria-busy={googleLoading}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  opacity: googleLoading ? 0.55 : 1,
                  pointerEvents: googleLoading ? 'none' : 'auto',
                  minHeight: googleReady ? undefined : 0,
                }}
              />
              {googleLoading && (
                <p className="ds-helper" role="status" style={{ marginTop: 6, textAlign: 'center' }}>
                  Verifying with Google…
                </p>
              )}
            </div>
          )}
          <p className="ds-helper" style={{ marginTop: 10, textAlign: 'center' }}>Protected by validation, JWT auth, and secure password hashing.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
