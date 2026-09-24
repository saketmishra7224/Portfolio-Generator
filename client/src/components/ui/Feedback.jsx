import React from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

export function ToastStack({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="ds-toast-wrap" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`ds-toast ds-toast-${t.tone || 'info'}`}>
          <span aria-hidden="true">
            {t.tone === 'success' ? <FaCheckCircle color="#16a34a" /> : t.tone === 'error' ? <FaExclamationCircle color="#dc2626" /> : <FaInfoCircle color="#4a6cf7" />}
          </span>
          <div style={{ flex: 1 }}>
            {t.title && <div style={{ fontWeight: 700, marginBottom: 2 }}>{t.title}</div>}
            <div className="ds-muted">{t.message}</div>
          </div>
          <button className="ds-btn ds-btn-ghost ds-btn-sm" aria-label="Dismiss notification" onClick={() => onDismiss && onDismiss(t.id)}>
            <FaTimes />
          </button>
        </div>
      ))}
    </div>
  );
}

let toastId = 0;
export function createToast(setToasts, message, opts = {}) {
  const id = ++toastId;
  const toast = { id, message, title: opts.title, tone: opts.tone || 'info' };
  setToasts((prev) => [...prev, toast]);
  setTimeout(() => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, opts.duration || 3600);
  return id;
}

export function Skeleton({ style, className = '' }) {
  return <div className={`ds-skeleton ${className}`} style={style} aria-hidden="true" />;
}

export function EmptyState({ icon, title, body, action }) {
  return (
    <div className="ds-empty">
      {icon && <div className="ds-empty-icon" aria-hidden="true">{icon}</div>}
      <div className="ds-h3" style={{ marginBottom: 4 }}>{title}</div>
      {body && <p className="ds-muted" style={{ marginBottom: action ? 12 : 0 }}>{body}</p>}
      {action}
    </div>
  );
}

export function ConfirmDialog({ title, body, children, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, busy = false, danger = false, confirmDisabled = false }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && onCancel) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const blocked = busy || confirmDisabled;

  return (
    <div className="ds-modal-overlay" role="presentation" onClick={onCancel}>
      <div className="ds-modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <h2 className="ds-h1" style={{ fontSize: '1.2rem', marginBottom: 8 }}>{title}</h2>
        {body && <p className="ds-body" style={{ marginBottom: 12 }}>{body}</p>}
        {children && <div style={{ marginBottom: 16 }}>{children}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="ds-btn ds-btn-secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button className={`ds-btn ${danger ? 'ds-btn-danger' : 'ds-btn-primary'}`} onClick={onConfirm} disabled={blocked} autoFocus={!confirmDisabled}>
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
