import { useEffect, useRef, useState } from 'react';
import { LANGUAGES } from '../lib/model.js';

const STATUS_TEXT = { saved: 'Saved', saving: 'Saving…', full: 'Not saved!' };

export default function TopBar({ theory, lang, status, actions, onOpenLibrary }) {
  return (
    <header className="topbar">
      <button className="brand" title="Saved theories" onClick={onOpenLibrary}>
        <span className="brand-name">TEORETIK</span>
        <span className="brand-sub">theory board</span>
      </button>

      <div className="title-wrap">
        <input
          id="theory-title"
          className="theory-title"
          spellCheck={false}
          maxLength={80}
          aria-label="Theory title"
          value={theory.title}
          onChange={(e) => actions.setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          onBlur={(e) => !e.target.value.trim() && actions.setTitle('Untitled theory')}
        />
      </div>

      <nav className="topbar-tools">
        <LangSwitch theory={theory} lang={lang} actions={actions} />
        <button className="btn btn-primary" onClick={() => actions.addBlock()}>+ Block</button>
        <button className="btn" onClick={onOpenLibrary}>Saves</button>
        <span className="save-status" data-state={status}>{STATUS_TEXT[status]}</span>
      </nav>
    </header>
  );
}

function LangSwitch({ theory, lang, actions }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const available = Object.entries(LANGUAGES).filter(([k]) => !theory.languages.includes(k));

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  return (
    <div ref={ref} className={`lang-switch${open ? ' menu-open' : ''}`}>
      <div className="seg seg-top" role="tablist" aria-label="Language">
        {theory.languages.map((l) => (
          <button key={l} role="tab" aria-selected={l === lang} className={l === lang ? 'is-on' : ''}
                  title={LANGUAGES[l] || l} onClick={() => actions.setLang(l)}>
            {l.toUpperCase()}
          </button>
        ))}
        <button className="seg-more" title="Add or remove languages" aria-haspopup="true" aria-expanded={open}
                onClick={() => setOpen((o) => !o)}>
          ±
        </button>
      </div>

      {open && (
        <div className="lang-menu">
          <span className="label">Languages in this theory</span>
          <ul>
            {theory.languages.map((l) => (
              <li key={l}>
                <span><b>{l.toUpperCase()}</b> {LANGUAGES[l] || ''}</span>
                {theory.languages.length > 1 && (
                  <button className="icon-btn icon-sm" title={`Remove ${l.toUpperCase()}`} onClick={() => actions.removeLanguage(l)}>✕</button>
                )}
              </li>
            ))}
          </ul>
          {available.length > 0 && (
            <select
              aria-label="Add language"
              value=""
              onChange={(e) => {
                actions.addLanguage(e.target.value);
                setOpen(false);
              }}
            >
              <option value="">+ Add a language…</option>
              {available.map(([k, v]) => (
                <option key={k} value={k}>{k.toUpperCase()} - {v}</option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
