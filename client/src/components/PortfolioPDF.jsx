import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaDownload, FaShieldAlt } from 'react-icons/fa';
import html2pdf from 'html2pdf.js';
import { useTheme } from '../context/ThemeContext';
import MinimalTemplate from './templates/MinimalTemplate';
import ModernTemplate from './templates/ModernTemplate';
import ClassicTemplate from './templates/ClassicTemplate';
import ProfessionalTemplate from './templates/ProfessionalTemplate';
import ATSTemplate from './templates/ATSTemplate';
import AtsPanel from './ats/AtsPanel';
import TemplateCompareCard from './templates/TemplateCompareCard';
import { ToastStack, createToast, EmptyState } from './ui/Feedback';
import { displaySkills } from '../utils/resumeModel';
import { logActivity } from '../utils/activityLog';
import { getPaperSizePref } from './SettingsPanel';
import { buildAtsDocument } from '../utils/atsDocument';
import { auditResume } from '../utils/atsAudit';
import { renderAtsPdf } from '../utils/atsPdf';

const PortfolioPDF = ({ formData, onBack }) => {
  const { personalInfo, projects } = formData;
  const skills = displaySkills(formData);
  const { theme } = useTheme();
  const [atsMode, setAtsMode] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingAts, setDownloadingAts] = useState(false);
  const [toasts, setToasts] = useState([]);
  // Default paper size comes from Settings → Preferences (falls back to A4).
  const [atsExport, setAtsExport] = useState({ font: 'helvetica', pageSize: getPaperSizePref(), dateStyle: 'short' });

  const isEmpty = !personalInfo?.name && skills.length === 0 && (!projects || projects.length === 0);
  const quickAudit = useMemo(() => auditResume(formData, ''), [formData]);

  const themeStyles = {
    '--accent-color': theme.accentColor || '#2563eb',
    '--font-family': theme.font || 'Inter',
    '--heading-color': theme.accentColor || '#2563eb'
  };

  const safeName = (personalInfo?.name || 'portfolio').trim().replace(/[^a-z0-9-_]+/gi, '-').slice(0, 60) || 'portfolio';

  // Visual portfolio export (themed templates). NOTE: html2pdf renders via
  // html2canvas, i.e. the PDF pages are images — pretty but not selectable.
  // That tradeoff is fine for visual portfolios; ATS export below uses real
  // text instead.
  const downloadVisualPDF = async () => {
    const element = document.getElementById('portfolio-content');
    if (!element) {
      createToast(setToasts, 'Preview content not found. Please reload.', { tone: 'error', title: 'Export failed' });
      return;
    }
    setDownloading(true);
    try {
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `${safeName}-portfolio.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      await html2pdf().set(opt).from(element).save();
      logActivity(localStorage.getItem('currentUserEmail') || '', 'exported');
      createToast(setToasts, `Downloaded ${opt.filename}`, { tone: 'success', title: 'PDF exported' });
    } catch (e) {
      createToast(setToasts, 'PDF export failed. Try a smaller photo.', { tone: 'error', title: 'Export failed' });
    } finally {
      setDownloading(false);
    }
  };

  // ATS export: real selectable/searchable text via jsPDF primitives.
  const downloadAtsPDF = async () => {
    setDownloadingAts(true);
    try {
      const doc = buildAtsDocument(formData, { dateStyle: atsExport.dateStyle });
      if (!doc.name && doc.sections.length === 0) {
        createToast(setToasts, 'Add a name and at least one section first.', { tone: 'error', title: 'Nothing to export' });
        return;
      }
      const { jsPDF } = await import('jspdf');
      const { arrayBuffer, pages } = renderAtsPdf(jsPDF, doc, {
        pageSize: atsExport.pageSize, font: atsExport.font,
      });
      const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}-ATS-resume.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      logActivity(localStorage.getItem('currentUserEmail') || '', 'exported');
      logActivity(localStorage.getItem('currentUserEmail') || '', 'ats-check');
      createToast(setToasts, `Downloaded ATS resume (${pages} page${pages === 1 ? '' : 's'}, selectable text).`, { tone: 'success', title: 'PDF exported' });
    } catch (e) {
      createToast(setToasts, 'ATS PDF export failed. Please try again.', { tone: 'error', title: 'Export failed' });
    } finally {
      setDownloadingAts(false);
    }
  };

  const renderTemplate = () => {
    const templateProps = { formData, themeStyles };
    switch (theme.template) {
      case 'modern': return <ModernTemplate {...templateProps} />;
      case 'classic': return <ClassicTemplate {...templateProps} />;
      case 'professional': return <ProfessionalTemplate {...templateProps} />;
      case 'minimal':
      default: return <MinimalTemplate {...templateProps} />;
    }
  };

  return (
    <div className="ds-page" style={{ padding: '1.25rem 0 2rem' }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
      <div className="ds-container" style={{ maxWidth: 960 }}>
        <div className="ds-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <p className="ds-eyebrow">Preview & export</p>
            <h1 className="ds-h1">Resume preview — {atsMode ? 'ATS resume' : theme.template}</h1>
            <p className="ds-muted">
              {atsMode
                ? 'Parser-first resume with selectable text. Audit it, then export.'
                : 'Visual portfolio template (image-based PDF). Toggle ATS mode for the parser-safe resume.'}
            </p>
          </div>
          <span className={`ds-badge ${quickAudit.estimate >= 80 ? 'ds-badge-success' : quickAudit.estimate >= 50 ? 'ds-badge-warning' : 'ds-badge-error'}`}>
            <FaShieldAlt aria-hidden="true" /> Readiness {quickAudit.estimate}/100
          </span>
        </div>

        <TemplateCompareCard variant="slim" />

        <div className="ds-card ds-card-pad" style={{ marginBottom: 12 }}>
          <div className="ds-row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <label className="ds-row" style={{ cursor: 'pointer', gap: 10 }} htmlFor="ats-toggle">
              <input
                id="ats-toggle"
                type="checkbox"
                checked={atsMode}
                onChange={(e) => setAtsMode(e.target.checked)}
                aria-describedby="ats-help"
                style={{ width: 20, height: 20, accentColor: 'var(--ds-primary)' }}
              />
              <span><strong>ATS mode</strong><br /><span id="ats-help" className="ds-helper">Single column, standard fonts, semantic headings, real text.</span></span>
            </label>
            <span className="ds-helper">Template: {atsMode ? 'ATS (fixed)' : theme.template}</span>
          </div>
        </div>

        {isEmpty ? (
          <EmptyState
            icon={<FaDownload />}
            title="Nothing to preview yet"
            body="Complete the builder first — add a name, skills, and at least one project."
            action={<button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={onBack}><FaArrowLeft aria-hidden="true" /> Back to dashboard</button>}
          />
        ) : atsMode ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <AtsPanel
              formData={formData}
              exportSettings={atsExport}
              onExportSettingsChange={setAtsExport}
              onDownloadAtsPdf={downloadAtsPDF}
              downloadingPdf={downloadingAts}
            />
            <div className="ds-card ds-card-pad" style={{ marginTop: 12 }}>
              <h2 className="ds-h2" style={{ marginBottom: 8 }}>On-screen ATS preview</h2>
              <div className="portfolio-pdf-container" style={{ maxWidth: '100%' }}>
                <ATSTemplate
                  formData={formData}
                  dateStyle={atsExport.dateStyle}
                  fontFamily={atsExport.font === 'times' ? 'times' : 'arial'}
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="portfolio-pdf-container" style={{ ...themeStyles, maxWidth: '100%' }}>
            <div id="portfolio-content" className="portfolio-content" style={themeStyles}>
              {renderTemplate()}
            </div>
          </motion.div>
        )}

        <div className="ds-row" style={{ justifyContent: 'space-between', marginTop: 12, flexWrap: 'wrap' }}>
          <button onClick={onBack} className="ds-btn ds-btn-secondary">
            <FaArrowLeft aria-hidden="true" /> Back to dashboard
          </button>
          {!atsMode && (
            <button onClick={downloadVisualPDF} className="ds-btn ds-btn-primary" disabled={downloading || isEmpty} aria-busy={downloading}>
              <FaDownload aria-hidden="true" /> {downloading ? 'Generating PDF…' : 'Download portfolio PDF'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioPDF;
