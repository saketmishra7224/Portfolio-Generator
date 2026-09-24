import { sanitizeAtsText } from './atsText';

// ---------------------------------------------------------------------------
// Text-based ATS PDF renderer (pure except for the injected jsPDF class).
//
// TRADEOFF (why not html2pdf here): html2pdf.js renders the DOM through
// html2canvas, which rasterizes the whole resume into images embedded in the
// PDF. The result looks identical but contains NO extractable text, so real
// ATS parsers (and Ctrl+F) see a blank page. For the visual portfolio
// templates that tradeoff is acceptable and html2pdf stays in place.
// For ATS output, text extraction is the entire point, so this module lays
// the ATS document out with jsPDF text primitives instead: every word is
// real, selectable, searchable text with stable page breaks.
//
// Guarantees: single column, base-14 standard fonts (Helvetica / Times),
// plain hyperlinks, consistent margins, headings kept with their content,
// bullets never split across pages, A4 or US Letter.
// ---------------------------------------------------------------------------

const PAGE_SIZES = {
  a4: { w: 210, h: 297, label: 'A4' },
  letter: { w: 215.9, h: 279.4, label: 'US Letter' },
};

const FONTS = {
  helvetica: { family: 'helvetica', label: 'Helvetica (sans-serif)' },
  times: { family: 'times', label: 'Times (serif)' },
};

const MARGIN_X = 15;
const MARGIN_TOP = 14;
const MARGIN_BOTTOM = 15;
const BASE_SIZE = 10.5;
const LINE_GAP = 1.4; // line-height factor
const BULLET = '\u2022';

function lineHeight(fontSize) {
  return fontSize * 0.3528 * LINE_GAP;
}

// Sanitize every human-readable string for base-14 font encoding (verified
// by round-trip probe). Link URLs are preserved byte-for-byte so hyperlinks
// keep working; only their display text is sanitized.
function sanitizeDoc(value, parentKey = '') {
  if (typeof value === 'string') {
    return parentKey === 'url' ? value : sanitizeAtsText(value);
  }
  if (Array.isArray(value)) return value.map((v) => sanitizeDoc(v, parentKey));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = sanitizeDoc(v, k);
    return out;
  }
  return value;
}

export function renderAtsPdf(JsPDFClass, inputDoc, opts = {}) {
  const doc = sanitizeDoc(inputDoc || {});
  const sizeKey = opts.pageSize === 'letter' ? 'letter' : 'a4';
  const fontKey = opts.font === 'times' ? 'times' : 'helvetica';
  const page = PAGE_SIZES[sizeKey];
  const font = FONTS[fontKey].family;
  const usableWidth = page.w - MARGIN_X * 2;

  const pdf = new JsPDFClass({ unit: 'mm', format: [page.w, page.h], compress: true });
  pdf.setProperties({
    title: `${doc.name || 'Resume'} - ATS Resume`,
    author: doc.name || '',
    creator: 'Portfolio Generator (ATS text export)',
  });

  let y = MARGIN_TOP;

  const ensureSpace = (needed) => {
    if (y + needed > page.h - MARGIN_BOTTOM) {
      pdf.addPage([page.w, page.h]);
      y = MARGIN_TOP;
    }
  };

  const wrapped = (text, fontSize, maxWidth = usableWidth) => {
    pdf.setFontSize(fontSize);
    return pdf.splitTextToSize(String(text || ''), maxWidth);
  };

  const drawLines = (lines, x, { size = BASE_SIZE, style = 'normal', color = 20, url = null, align = null } = {}) => {
    pdf.setFont(font, style);
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    const lh = lineHeight(size);
    lines.forEach((line) => {
      ensureSpace(lh);
      const options = {};
      if (url) options.url = url;
      if (align) options.align = align;
      pdf.text(line, x, y, Object.keys(options).length > 0 ? options : undefined);
      y += lh;
    });
  };

  const gap = (mm) => { y += mm; };

  // ---- Header: name, headline, contact (plain selectable text) ----
  if (doc.name) {
    const lines = wrapped(doc.name, 17);
    pdf.setFont(font, 'bold');
    pdf.setFontSize(17);
    pdf.setTextColor(0);
    const lh = lineHeight(17);
    lines.forEach((line) => {
      ensureSpace(lh);
      pdf.text(line, page.w / 2, y, { align: 'center' });
      y += lh;
    });
  }
  if (doc.headline) {
    const lines = wrapped(doc.headline, 11);
    pdf.setFont(font, 'normal');
    pdf.setFontSize(11);
    pdf.setTextColor(60);
    const lh = lineHeight(11);
    lines.forEach((line) => {
      ensureSpace(lh);
      pdf.text(line, page.w / 2, y, { align: 'center' });
      y += lh;
    });
  }
  if ((doc.contact || []).length > 0) {
    drawLines(wrapped(doc.contact.join(' | '), 9.5), page.w / 2, { size: 9.5, align: 'center', color: 40 });
  }
  if ((doc.links || []).length > 0) {
    // Render each link as its own clickable, selectable segment on one line
    // (wrapping to a second line if needed).
    pdf.setFont(font, 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(20);
    const lh = lineHeight(9.5);
    const sep = ' | ';
    let segments = doc.links.map((l) => ({ text: l.text, url: l.url }));
    // Greedy line packing.
    let line = [];
    let lineWidth = 0;
    const flushLine = () => {
      if (line.length === 0) return;
      ensureSpace(lh);
      const total = line.reduce((a, s) => a + pdf.getTextWidth(s.text), 0)
        + pdf.getTextWidth(sep) * (line.length - 1);
      let x = (page.w - total) / 2;
      line.forEach((seg, i) => {
        // textWithLink creates a real clickable annotation (plain text() with
        // a url option is silently ignored by jsPDF — verified by audit).
        if (seg.url) pdf.textWithLink(seg.text, x, y, { url: seg.url });
        else pdf.text(seg.text, x, y);
        x += pdf.getTextWidth(seg.text) + (i < line.length - 1 ? pdf.getTextWidth(sep) : 0);
      });
      y += lh;
      line = [];
      lineWidth = 0;
    };
    segments.forEach((seg) => {
      const w = pdf.getTextWidth(seg.text);
      const sepW = line.length > 0 ? pdf.getTextWidth(sep) : 0;
      if (lineWidth + sepW + w > usableWidth) flushLine();
      if (line.length > 0) lineWidth += pdf.getTextWidth(sep);
      line.push(seg);
      lineWidth += w;
    });
    flushLine();
  }
  // Simple horizontal separator under the header.
  gap(1.5);
  ensureSpace(2);
  pdf.setDrawColor(150);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_X, y, page.w - MARGIN_X, y);
  gap(3);

  // ---- Sections ----
  const drawHeading = (title) => {
    // Keep headings with their content: require room for heading + 2 lines.
    ensureSpace(lineHeight(11.5) + lineHeight(BASE_SIZE) * 2 + 2);
    pdf.setFont(font, 'bold');
    pdf.setFontSize(11.5);
    pdf.setTextColor(0);
    const lh = lineHeight(11.5);
    wrapped(title, 11.5).forEach((line) => {
      ensureSpace(lh);
      pdf.text(line, MARGIN_X, y);
      y += lh;
    });
    pdf.setDrawColor(180);
    pdf.setLineWidth(0.2);
    ensureSpace(2);
    pdf.line(MARGIN_X, y, page.w - MARGIN_X, y);
    gap(2);
  };

  const drawBullet = (text) => {
    const indent = MARGIN_X + 4;
    const lines = wrapped(`${BULLET}  ${text}`, BASE_SIZE, usableWidth - 4);
    const blockH = lines.length * lineHeight(BASE_SIZE);
    // Keep each bullet together: never split one bullet across pages.
    ensureSpace(blockH + 0.5);
    pdf.setFont(font, 'normal');
    pdf.setFontSize(BASE_SIZE);
    pdf.setTextColor(20);
    const lh = lineHeight(BASE_SIZE);
    lines.forEach((line) => {
      pdf.text(line, indent, y);
      y += lh;
    });
  };

  const drawEntry = (entry) => {
    // Measure the whole entry; if it fits on a fresh page but not here,
    // break before it so entries stay together when practical.
    const titleLines = wrapped(entry.title || '', BASE_SIZE);
    const metaLines = entry.meta ? wrapped(entry.meta, 9.5) : [];
    const descLines = entry.desc ? String(entry.desc).split('\n').flatMap((p) => wrapped(p, BASE_SIZE)) : [];
    const bulletBlocks = (entry.bullets || []).map((b) => wrapped(`${BULLET}  ${b}`, BASE_SIZE, usableWidth - 4));
    const extraLines = entry.extra ? wrapped(entry.extra, 9.5) : [];
    const linkLines = entry.links ? wrapped(entry.links, 9.5) : [];
    const totalH = (titleLines.length + descLines.length) * lineHeight(BASE_SIZE)
      + (metaLines.length + extraLines.length + linkLines.length) * lineHeight(9.5)
      + bulletBlocks.reduce((a, b) => a + b.length * lineHeight(BASE_SIZE), 0) + 3;
    const remaining = page.h - MARGIN_BOTTOM - y;
    if (totalH < page.h - MARGIN_TOP - MARGIN_BOTTOM && totalH > remaining) {
      pdf.addPage([page.w, page.h]);
      y = MARGIN_TOP;
    }
    if (titleLines.length > 0) {
      drawLines(titleLines, MARGIN_X, { size: BASE_SIZE, style: 'bold' });
    }
    if (metaLines.length > 0) {
      drawLines(metaLines, MARGIN_X, { size: 9.5, style: 'italic', color: 80 });
    }
    if (descLines.length > 0) {
      drawLines(descLines, MARGIN_X, { size: BASE_SIZE });
    }
    bulletBlocks.forEach((lines) => {
      const blockH = lines.length * lineHeight(BASE_SIZE);
      ensureSpace(blockH + 0.5);
      pdf.setFont(font, 'normal');
      pdf.setFontSize(BASE_SIZE);
      pdf.setTextColor(20);
      const lh = lineHeight(BASE_SIZE);
      const indent = MARGIN_X + 4;
      lines.forEach((line) => {
        pdf.text(line, indent, y);
        y += lh;
      });
    });
    if (extraLines.length > 0) {
      drawLines(extraLines, MARGIN_X, { size: 9.5, color: 60 });
    }
    if (linkLines.length > 0) {
      pdf.setFont(font, 'normal');
      pdf.setFontSize(9.5);
      pdf.setTextColor(20);
      const lh = lineHeight(9.5);
      linkLines.forEach((line) => {
        ensureSpace(lh);
        pdf.text(line, MARGIN_X, y);
        y += lh;
      });
    }
    gap(2.5);
  };

  (doc.sections || []).forEach((section) => {
    drawHeading(section.title);
    (section.blocks || []).forEach((block) => {
      if (block.type === 'para') {
        drawLines(wrapped(block.text, BASE_SIZE), MARGIN_X, { size: BASE_SIZE });
        gap(1.5);
      } else if (block.type === 'skills') {
        const label = block.label ? `${block.label}: ` : '';
        drawLines(wrapped(`${label}${(block.items || []).join(', ')}`, BASE_SIZE), MARGIN_X, { size: BASE_SIZE });
        gap(1);
      } else if (block.type === 'entry') {
        drawEntry(block);
      } else if (block.type === 'line') {
        const lines = wrapped(`${BULLET}  ${block.text}`, BASE_SIZE, usableWidth - 4);
        const blockH = lines.length * lineHeight(BASE_SIZE);
        ensureSpace(blockH + 0.5);
        pdf.setFont(font, 'normal');
        pdf.setFontSize(BASE_SIZE);
        pdf.setTextColor(20);
        const lh = lineHeight(BASE_SIZE);
        lines.forEach((line, i) => {
          if (block.url && i === 0) pdf.textWithLink(line, MARGIN_X + 4, y, { url: block.url });
          else pdf.text(line, MARGIN_X + 4, y);
          y += lh;
        });
      }
    });
    gap(1.5);
  });

  return { arrayBuffer: pdf.output('arraybuffer'), pages: pdf.getNumberOfPages() };
}

export const ATS_PAGE_SIZES = PAGE_SIZES;
export const ATS_FONTS = FONTS;
