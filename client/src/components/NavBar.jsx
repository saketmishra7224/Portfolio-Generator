import React, { useState } from 'react';
import { FaBars, FaTimes, FaHome, FaTachometerAlt, FaFileAlt, FaEye, FaQuestionCircle, FaSignOutAlt, FaMoon, FaSun, FaSearch } from 'react-icons/fa';
import { AnimatePresence, motion } from 'framer-motion';

const NavBar = ({ isAuthenticated, onLogout, activeRoute = 'home', onNavigate, darkMode, toggleDarkMode }) => {
  const [open, setOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: <FaHome />, authRequired: false },
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt />, authRequired: true },
    { id: 'create', label: 'Resume Builder', icon: <FaFileAlt />, authRequired: true },
    { id: 'preview', label: 'Preview', icon: <FaEye />, authRequired: true },
    { id: 'jobmatch', label: 'Job Match', icon: <FaSearch />, authRequired: true },
    { id: 'help', label: 'Help', icon: <FaQuestionCircle />, authRequired: false },
  ];
  const items = navItems.filter((i) => !i.authRequired || isAuthenticated);

  const go = (id) => { onNavigate(id); setOpen(false); };

  return (
    <header className="ds-nav" role="banner">
      <div className="ds-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <button
          onClick={() => go('home')}
          aria-label="Go home"
          style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'transparent', border: 0, cursor: 'pointer', color: 'inherit' }}
        >
          <span aria-hidden="true" style={{ width: 32, height: 32, borderRadius: 9, background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>P</span>
          <span style={{ fontWeight: 750, letterSpacing: '-0.02em' }}>Portfolio Generator</span>
        </button>

        <nav aria-label="App" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="ds-row" style={{ gap: 2, display: 'none' }} />
          <span style={{ display: 'flex', gap: 2 }} className="navbar-desktop">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => go(it.id)}
                aria-current={activeRoute === it.id || (activeRoute === 'landing' && it.id === 'home') ? 'page' : undefined}
                className={`ds-btn ds-btn-sm ${activeRoute === it.id || (activeRoute === 'landing' && it.id === 'home') ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
              >
                <span aria-hidden="true">{it.icon}</span> {it.label}
              </button>
            ))}
          </span>
          <button onClick={toggleDarkMode} className="ds-btn ds-btn-ghost ds-btn-sm" aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'} aria-pressed={!!darkMode}>
            {darkMode ? <FaSun aria-hidden="true" /> : <FaMoon aria-hidden="true" />}
          </button>
          {isAuthenticated && (
            <button onClick={onLogout} className="ds-btn ds-btn-secondary ds-btn-sm">
              <FaSignOutAlt aria-hidden="true" /> Logout
            </button>
          )}
          <button onClick={() => setOpen((o) => !o)} className="ds-btn ds-btn-ghost ds-btn-sm navbar-mobile-btn" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            aria-label="Mobile"
            style={{ overflow: 'hidden', borderTop: '1px solid var(--ds-border)' }}
          >
            <div className="ds-container" style={{ display: 'grid', gap: 6, paddingTop: 10, paddingBottom: 12 }}>
              {items.map((it) => (
                <button key={it.id} onClick={() => go(it.id)} className={`ds-btn ${activeRoute === it.id ? 'ds-btn-primary' : 'ds-btn-secondary'}`}>
                  <span aria-hidden="true">{it.icon}</span> {it.label}
                </button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 860px) { .navbar-desktop { display: none !important; } }
        @media (min-width: 861px) { .navbar-mobile-btn { display: none !important; } }
      `}</style>
    </header>
  );
};

export default NavBar;
