import React, { useState, useMemo } from 'react';
import { FaCheck, FaCopy, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { improveText, IMPROVE_ACTIONS } from '../../utils/improveEngine';

// Minimal word diff (LCS on short texts) for the approval view.
function wordDiff(a, b) {
  const aw = String(a || '').split(/\s+/).filter(Boolean);
  const bw = String(b || '').split(/\s+/).filter(Boolean);
  const n = aw.length;
  const m = bw.length;
  if (n * m > 20000) return { orig: [{ t: a, s: 'same' }], sug: [{ t: b, s: 'same' }] };
  const dp = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = aw[i] === bw[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const orig = [];
  const sug = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (aw[i] === bw[j]) { orig.push({ t: aw[i], s: 'same' }); sug.push({ t: bw[j], s: 'same' }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { orig.push({ t: aw[i], s: 'del' }); i++; }
    else { sug.push({ t: bw[j], s: 'add' }); j++; }
  }
  while (i < n) { orig.push({ t: aw[i], s: 'del' }); i++; }
  while (j < m) { sug.push({ t: bw[j], s: 'add' }); j++; }
  return { orig, sug };
}

function DiffPara({ parts }) {
  return (
    <p className="ds-body" style={{ fontSize: '0.9rem', lineHeight: 1.8 }}>
      {parts.map((p, k) => (
        <span
          key={k}
          style={
            p.s === 'add'
              ? { background: '#dcfce7', borderRadius: 3, padding: '0 2px' }
              : p.s === 'del'
                ? { background: '#fee2e2', textDecoration: 'line-through', borderRadius: 3, padding: '0 2px' }
                : undefined
          }
        >
          {p.t}{' '}
        </span>
      ))}
    </p>
  );
}

// Improve dialog: pick an action, review the diff, then explicitly approve.
// Nothing is ever applied without the "Replace original" click.
const ImproveDialog = ({ fieldLabel = 'Text', original, target = 'bullet', contextTech = [], onApply, onClose, onCopy }) => {
  const [action, setAction] = useState('improve');
  const [copied, setCopied] = useState(false);

  const result = useMemo(
    () => improveText(original, { action, target, contextTech }),
    [original, action, target, contextTech]
  );
  const diff = useMemo(
    () => (result ? wordDiff(result.original, result.suggestion) : null),
    [result]
  );

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.suggestion);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = result.suggestion;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onCopy) onCopy(result.suggestion);
  };

  return (
    <div className="ds-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ds-modal"
        role="dialog"
        aria-modal="true"
        aria-label={`Improve ${fieldLabel}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 640 }}
      >
        <div className="ds-row" style={{ justifyContent: 'space-between', marginBottom: 4 }}>
          <h2 className="ds-h1" style={{ fontSize: '1.15rem', margin: 0 }}>Improve: {fieldLabel}</h2>
          <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={onClose} aria-label="Close assistant">
            <FaTimes aria-hidden="true" />
          </button>
        </div>
        <p className="ds-helper" style={{ marginBottom: 10 }}>
          <FaInfoCircle aria-hidden="true" /> On-device assistant — text never leaves the browser. It only rewords what you wrote; review green additions before accepting.
        </p>

        <div className="ds-row" role="group" aria-label="Improvement actions" style={{ flexWrap: 'wrap', marginBottom: 12 }}>
          {IMPROVE_ACTIONS.map((a) => (
            <button
              key={a.key}
              type="button"
              title={a.hint}
              aria-pressed={action === a.key}
              onClick={() => setAction(a.key)}
              className={`ds-btn ds-btn-sm ${action === a.key ? 'ds-btn-primary' : 'ds-btn-secondary'}`}
            >
              {a.label}
            </button>
          ))}
        </div>

        {!result ? (
          <p className="ds-muted">Nothing to improve yet — add some text first.</p>
        ) : (
          <>
            <span className="ds-label">Original</span>
            <div className="ds-card" style={{ padding: '0.6rem 0.75rem', background: 'var(--ds-surface-2)', margin: '4px 0 10px' }}>
              <DiffPara parts={diff.orig} />
            </div>
            <span className="ds-label">Suggestion {!result.changed && '(no changes needed)'}</span>
            <div className="ds-card" style={{ padding: '0.6rem 0.75rem', background: 'var(--ds-surface-2)', margin: '4px 0 10px' }}>
              <DiffPara parts={diff.sug} />
            </div>

            {result.notes.length > 0 && (
              <ul className="ds-muted" style={{ margin: '0 0 8px 18px', fontSize: '0.83rem', display: 'grid', gap: 2 }}>
                {result.notes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            )}
            {result.metricPrompt && (
              <div className="ds-alert ds-alert-info" role="status" style={{ marginBottom: 10, fontSize: '0.85rem' }}>
                <FaInfoCircle aria-hidden="true" /><span>{result.metricPrompt}</span>
              </div>
            )}

            <div className="ds-row" style={{ justifyContent: 'flex-end', flexWrap: 'wrap', marginTop: 4 }}>
              <button type="button" className="ds-btn ds-btn-secondary ds-btn-sm" onClick={doCopy}>
                <FaCopy aria-hidden="true" /> {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                disabled={!result.changed}
                onClick={() => onApply && onApply(result.suggestion)}
              >
                <FaCheck aria-hidden="true" /> Replace original
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImproveDialog;
