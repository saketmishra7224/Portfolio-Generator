import React from 'react';
import { motion } from 'framer-motion';
import {
  FaCheck, FaFileAlt, FaPalette, FaDownload, FaShieldAlt,
  FaArrowRight, FaStar, FaBriefcase, FaGraduationCap, FaCode
} from 'react-icons/fa';

const fadeUp = {
  initial: { y: 16, opacity: 0 },
  whileInView: { y: 0, opacity: 1 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.45 }
};

const LandingPage = ({ onGetStarted }) => {
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="ds-page">
      {/* Top nav */}
      <header className="ds-nav" role="banner">
        <div className="ds-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div aria-hidden="true" style={{ width: 34, height: 34, borderRadius: 9, background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>P</div>
            <span style={{ fontWeight: 750, letterSpacing: '-0.02em' }}>Portfolio Generator</span>
            <span className="ds-badge" style={{ marginLeft: 6 }}>ATS-ready</span>
          </div>
          <nav aria-label="Primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => scrollTo('features')}>Features</button>
            <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => scrollTo('ats')}>ATS</button>
            <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => scrollTo('templates')}>Templates</button>
            <button className="ds-btn ds-btn-ghost ds-btn-sm" onClick={() => scrollTo('how')}>How it works</button>
            <button className="ds-btn ds-btn-primary ds-btn-sm" onClick={onGetStarted}>Get started <FaArrowRight aria-hidden="true" /></button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="ds-container" style={{ paddingTop: '3.2rem', paddingBottom: '2.5rem' }} aria-labelledby="hero-title">
          <div className="ds-hero-grid">
            <motion.div initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45 }}>
              <p className="ds-eyebrow">Portfolio + resume builder for developers & students</p>
              <h1 id="hero-title" className="ds-display" style={{ margin: '0.7rem 0 1rem' }}>
                A professional portfolio and ATS resume, from one profile.
              </h1>
              <p className="ds-body" style={{ fontSize: '1.05rem', maxWidth: '34rem' }}>
                Enter your education, skills, and projects once. Preview polished templates,
                check ATS readiness, and export a clean PDF recruiters can parse.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: '1.4rem' }}>
                <button className="ds-btn ds-btn-primary ds-btn-lg" onClick={onGetStarted}>
                  Create my portfolio <FaArrowRight aria-hidden="true" />
                </button>
                <button className="ds-btn ds-btn-secondary ds-btn-lg" onClick={() => scrollTo('features')}>
                  See how it works
                </button>
              </div>
              <ul style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: '1.2rem', listStyle: 'none', padding: 0 }} aria-label="Key benefits">
                {['No design skills needed', 'ATS-friendly export', 'Free to start'].map((t) => (
                  <li key={t} className="ds-muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <FaCheck aria-hidden="true" color="#16a34a" /> {t}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Resume preview visual */}
            <motion.div
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.08 }}
              className="ds-card"
              role="img"
              aria-label="Preview of a generated portfolio resume"
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '1rem 1.1rem', borderBottom: '1px solid var(--ds-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.9rem' }}>Live preview</strong>
                <span className="ds-badge ds-badge-success">ATS score 92/100</span>
              </div>
              <div style={{ padding: '1.2rem', background: '#fff' }}>
                <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: 10, marginBottom: 12 }}>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>Aarav Sharma</div>
                  <div className="ds-helper" style={{ color: '#475569' }}>aarav@example.com &nbsp;|&nbsp; +91 98765 43210 &nbsp;|&nbsp; github.com/aarav</div>
                </div>
                <div className="ds-mini-sec">Professional summary</div>
                <div className="ds-mini-line" style={{ width: '100%' }} />
                <div className="ds-mini-line" style={{ width: '92%' }} />
                <div className="ds-mini-sec" style={{ marginTop: 8 }}>Technical skills</div>
                <div className="ds-mini-chips">
                  {['React', 'Node.js', 'MongoDB', 'Python', 'AWS'].map((s) => <span key={s} className="ds-mini-chip">{s}</span>)}
                </div>
                <div className="ds-mini-sec" style={{ marginTop: 8 }}>Projects</div>
                <div className="ds-mini-line" style={{ width: '70%' }} />
                <div className="ds-mini-line" style={{ width: '100%' }} />
                <div className="ds-mini-line" style={{ width: '88%' }} />
                <div className="ds-mini-sec" style={{ marginTop: 8 }}>Education</div>
                <div className="ds-mini-line" style={{ width: '55%' }} />
              </div>
              <div style={{ padding: '0.9rem 1.1rem', borderTop: '1px solid var(--ds-border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className="ds-badge"><FaFileAlt aria-hidden="true" /> Minimal</span>
                <span className="ds-badge"><FaPalette aria-hidden="true" /> Modern</span>
                <span className="ds-badge"><FaDownload aria-hidden="true" /> PDF export</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Logos / trust strip */}
        <section className="ds-container" aria-label="Built for">
          <div className="ds-card ds-card-pad" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="ds-muted">Built for</span>
            <span className="ds-row" style={{ gap: 18, flexWrap: 'wrap' }}>
              <span className="ds-row"><FaCode aria-hidden="true" /> Developers</span>
              <span className="ds-row"><FaGraduationCap aria-hidden="true" /> Students</span>
              <span className="ds-row"><FaBriefcase aria-hidden="true" /> Job seekers</span>
              <span className="ds-row"><FaShieldAlt aria-hidden="true" /> ATS-safe output</span>
            </span>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="ds-container" style={{ paddingTop: '2.8rem' }} aria-labelledby="features-title">
          <motion.div {...fadeUp}>
            <p className="ds-eyebrow">Features</p>
            <h2 id="features-title" className="ds-h1" style={{ margin: '0.4rem 0 0.5rem' }}>Everything you need, nothing gimmicky</h2>
            <p className="ds-muted" style={{ maxWidth: '36rem' }}>A focused workflow: profile → templates → ATS check → PDF. Your data stays structured and reusable.</p>
          </motion.div>
          <div className="ds-grid-3" style={{ marginTop: '1.3rem' }}>
            {[
              { icon: <FaFileAlt />, t: 'Guided profile builder', d: 'Step-by-step personal info, education, skills, and projects with inline validation and examples.' },
              { icon: <FaPalette />, t: 'Four professional templates', d: 'Minimal, Modern, Classic, and Professional — all driven by one theme system and accent color.' },
              { icon: <FaShieldAlt />, t: 'ATS checker + ATS template', d: 'Get concrete warnings for missing summaries, thin project descriptions, and empty skills before you export.' },
              { icon: <FaDownload />, t: 'Clean PDF export', d: 'Single-column, recruiter-readable PDFs. ATS mode forces standard fonts and plain formatting.' },
              { icon: <FaBriefcase />, t: 'Dashboard management', d: 'Edit details, upload a photo, track project/skill counts, and manage themes from one place.' },
              { icon: <FaStar />, t: 'Accessible + responsive', d: 'Keyboard navigable, visible focus states, and layouts designed for mobile through desktop.' },
            ].map((f) => (
              <motion.article key={f.t} {...fadeUp} className="ds-card ds-card-pad ds-feature">
                <div className="ds-stat-ic" aria-hidden="true">{f.icon}</div>
                <h3 className="ds-h2" style={{ margin: '0.8rem 0 0.35rem' }}>{f.t}</h3>
                <p className="ds-muted">{f.d}</p>
              </motion.article>
            ))}
          </div>
        </section>

        {/* ATS section */}
        <section id="ats" className="ds-container" style={{ paddingTop: '2.8rem' }} aria-labelledby="ats-title">
          <div className="ds-card ds-card-pad" style={{ display: 'grid', gap: '1.2rem' }}>
            <motion.div {...fadeUp}>
              <p className="ds-eyebrow">ATS readiness</p>
              <h2 id="ats-title" className="ds-h1" style={{ margin: '0.4rem 0 0.5rem' }}>Pass the parser before a human reads it</h2>
              <p className="ds-body">Applicant tracking systems reject resumes with graphics, tables, and missing keywords. The ATS mode uses plain single-column layout, standard fonts, semantic headings, and explicit skill/project text.</p>
            </motion.div>
            <div className="ds-grid-3">
              {[
                { t: 'Missing summary', d: 'Warns when bio, tagline, and education summary are all empty.' },
                { t: 'Thin projects', d: 'Flags project descriptions under 50 characters so you add impact.' },
                { t: 'Empty skills', d: 'Requires a keyword-rich skills section for matching.' },
              ].map((x) => (
                <div key={x.t} className="ds-card ds-card-pad" style={{ background: 'var(--ds-surface-2)' }}>
                  <div className="ds-row"><FaCheck color="#16a34a" aria-hidden="true" /><strong>{x.t}</strong></div>
                  <p className="ds-muted" style={{ marginTop: 6 }}>{x.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Templates */}
        <section id="templates" className="ds-container" style={{ paddingTop: '2.8rem' }} aria-labelledby="tpl-title">
          <motion.div {...fadeUp}>
            <p className="ds-eyebrow">Templates</p>
            <h2 id="tpl-title" className="ds-h1" style={{ margin: '0.4rem 0 0.5rem' }}>Four calm, professional styles</h2>
            <p className="ds-muted">Same data, different presentation. Switch anytime without re-entering anything.</p>
          </motion.div>
          <div className="ds-grid-3" style={{ marginTop: '1.2rem' }}>
            {[
              { n: 'Minimal', d: 'Content-first, generous whitespace.' },
              { n: 'Modern', d: 'Sidebar + structured sections.' },
              { n: 'Classic', d: 'Timeless, balanced hierarchy.' },
              { n: 'Professional', d: 'Formal, corporate-ready.' },
            ].map((t) => (
              <motion.div key={t.n} {...fadeUp} className="ds-card" style={{ overflow: 'hidden' }}>
                <div className="ds-mini-resume" aria-hidden="true">
                  <div className="ds-mini-head"><div className="ds-mini-name">Jane Cooper</div><div className="ds-mini-role">{t.n} template • Full Stack Developer</div></div>
                  <div className="ds-mini-body">
                    <div><div className="ds-mini-sec">Skills</div><div className="ds-mini-chips"><span className="ds-mini-chip">React</span><span className="ds-mini-chip">Node</span><span className="ds-mini-chip">MongoDB</span></div></div>
                    <div><div className="ds-mini-sec">Experience</div><div className="ds-mini-line" style={{ width: '90%' }} /><div className="ds-mini-line" style={{ width: '100%' }} /></div>
                  </div>
                </div>
                <div style={{ padding: '0.9rem 1rem' }}>
                  <strong>{t.n}</strong>
                  <p className="ds-muted" style={{ margin: '2px 0 10px' }}>{t.d}</p>
                  <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={onGetStarted}>Use {t.n}</button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="ds-container" style={{ paddingTop: '2.8rem' }} aria-labelledby="how-title">
          <motion.div {...fadeUp}>
            <p className="ds-eyebrow">Workflow</p>
            <h2 id="how-title" className="ds-h1" style={{ margin: '0.4rem 0 0.5rem' }}>From signup to PDF in four steps</h2>
          </motion.div>
          <ol className="ds-grid-3" style={{ listStyle: 'none', padding: 0, marginTop: '1.1rem' }}>
            {[
              { s: '1', t: 'Create account', d: 'Sign up with email. Your profile is saved securely and resumable.' },
              { s: '2', t: 'Complete profile', d: 'Wizard guides personal info → education → skills & projects → review.' },
              { s: '3', t: 'Pick template + theme', d: 'Choose template, accent color, and font. Preview instantly.' },
              { s: '4', t: 'Check ATS + export', d: 'Fix warnings, toggle ATS mode, download the PDF.' },
            ].map((x) => (
              <motion.li key={x.s} {...fadeUp} className="ds-card ds-card-pad">
                <div className="ds-step-dot" data-state="current" aria-hidden="true">{x.s}</div>
                <h3 className="ds-h2" style={{ margin: '0.7rem 0 0.3rem' }}>{x.t}</h3>
                <p className="ds-muted">{x.d}</p>
              </motion.li>
            ))}
          </ol>
        </section>

        {/* Testimonials */}
        <section className="ds-container" style={{ paddingTop: '2.8rem' }} aria-labelledby="love-title">
          <motion.div {...fadeUp}>
            <p className="ds-eyebrow">Social proof</p>
            <h2 id="love-title" className="ds-h1" style={{ margin: '0.4rem 0 0.5rem' }}>Used for internships, placements, and job switches</h2>
          </motion.div>
          <div className="ds-grid-3" style={{ marginTop: '1.1rem' }}>
            {[
              { n: 'Sarah Johnson', r: 'Software Engineer', q: 'The ATS warnings caught a missing summary and thin project descriptions before I applied.' },
              { n: 'Michael Chen', r: 'Data Scientist', q: 'One profile, multiple templates. Export quality is clean and prints well.' },
              { n: 'Emily Rodriguez', r: 'UX Designer', q: 'The wizard with examples made it easy to finish in one sitting on mobile.' },
            ].map((t) => (
              <motion.figure key={t.n} {...fadeUp} className="ds-card ds-card-pad">
                <div className="ds-row" aria-label="5 out of 5 stars">
                  {Array.from({ length: 5 }).map((_, i) => <FaStar key={i} color="#f59e0b" aria-hidden="true" />)}
                </div>
                <blockquote className="ds-body" style={{ margin: '0.7rem 0' }}>“{t.q}”</blockquote>
                <figcaption className="ds-muted"><strong style={{ color: 'var(--ds-text)' }}>{t.n}</strong> • {t.r}</figcaption>
              </motion.figure>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="ds-container" style={{ padding: '2.8rem 1.25rem 3rem' }}>
          <div className="ds-card ds-card-pad" style={{ background: '#0f172a', borderColor: '#0f172a', color: '#e2e8f0', textAlign: 'center', padding: '2.2rem 1.5rem' }}>
            <h2 className="ds-h1" style={{ color: '#fff' }}>Ready to build your portfolio?</h2>
            <p className="ds-muted" style={{ color: '#cbd5e1', maxWidth: '32rem', margin: '0.5rem auto 1.2rem' }}>Join students and developers creating interview-ready portfolios and resumes.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="ds-btn ds-btn-primary ds-btn-lg" onClick={onGetStarted}>Get started free</button>
              <button className="ds-btn ds-btn-lg" style={{ background: 'transparent', color: '#fff', border: '1px solid #334155' }} onClick={() => scrollTo('features')}>Learn more</button>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid var(--ds-border)', background: 'var(--ds-surface)' }}>
        <div className="ds-container" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', paddingTop: '1.1rem', paddingBottom: '1.1rem' }}>
          <span className="ds-muted">© 2026 Portfolio Generator • Professional portfolios + ATS resumes</span>
          <span className="ds-muted">Minimal • Modern • Classic • Professional • ATS</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
