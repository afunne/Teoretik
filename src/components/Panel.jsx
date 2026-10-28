import { useEffect, useRef } from 'react';
import { KINDS, LINK_TYPES, LANGUAGES, SUMMARY_MAX, emptyText, hasContent, textFor } from '../lib/model.js';
import { imageFileToDataURL } from '../lib/image.js';

/** Right-hand editor for the selected block or connection. */
export default function Panel({ theory, lang, selection, actions }) {
  let item = null;
  if (selection?.type === 'block') item = theory.blocks.find((b) => b.id === selection.id);
  if (selection?.type === 'link') item = theory.links.find((l) => l.id === selection.id);

  return (
    <aside className={`panel${item ? ' is-open' : ''}`} aria-label="Editor">
      {item && selection.type === 'block' && (
        <BlockEditor key={item.id} block={item} theory={theory} lang={lang} focus={selection.focus} actions={actions} />
      )}
      {item && selection.type === 'link' && (
        <LinkEditor key={item.id} link={item} theory={theory} lang={lang} actions={actions} />
      )}
    </aside>
  );
}

function PanelHead({ title, onClose }) {
  return (
    <div className="panel-head">
      <span className="panel-kicker">{title}</span>
      <button className="icon-btn" title="Close (Esc)" onClick={onClose}>✕</button>
    </div>
  );
}

function LangTabs({ languages, lang, isFilled, onPick }) {
  return (
    <div className="seg seg-lang" role="tablist">
      {languages.map((l) => (
        <button
          key={l}
          role="tab"
          aria-selected={l === lang}
          className={`${l === lang ? 'is-on' : ''} ${isFilled(l) ? 'is-filled' : ''}`}
          title={LANGUAGES[l] || l}
          onClick={() => onPick(l)}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

function blockTitle(theory, id, lang) {
  const b = theory.blocks.find((x) => x.id === id);
  if (!b) return '?';
  return textFor(b, lang, theory.languages).text.title || 'Untitled block';
}

function BlockEditor({ block, theory, lang, focus, actions }) {
  const titleRef = useRef(null);
  const t = block.content[lang] || emptyText();
  const other = theory.languages.find((l) => l !== lang && hasContent(block, l));
  const untranslated = !hasContent(block, lang) && other;
  const links = theory.links.filter((l) => l.from === block.id || l.to === block.id);

  useEffect(() => {
    if (focus) titleRef.current?.focus();
  }, [focus]);

  const set = (field) => (e) => actions.setText(block.id, lang, field, e.target.value);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      actions.setImage(block.id, await imageFileToDataURL(file));
    } catch (err) {
      console.error(err);
      actions.toast('Could not read that image');
    }
  };

  return (
    <>
      <PanelHead title="Block" onClose={() => actions.select(null)} />
      <div className="panel-body">
        <div className="field">
          <span className="label">Type</span>
          <div className="seg seg-kind">
            {Object.entries(KINDS).map(([k, v]) => (
              <button key={k} className={block.kind === k ? 'is-on' : ''} title={v.hint} onClick={() => actions.setKind(block.id, k)}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="label">
            Language <small>- text below is in {LANGUAGES[lang] || lang}</small>
          </span>
          <LangTabs languages={theory.languages} lang={lang} isFilled={(l) => hasContent(block, l)} onPick={actions.setLang} />
          {untranslated && (
            <div className="notice">
              Not written in {lang.toUpperCase()} yet.{' '}
              <button className="link-btn" onClick={() => actions.copyText(block.id, other, lang)}>
                Copy the {other.toUpperCase()} text to start translating
              </button>
            </div>
          )}
        </div>

        <label className="field">
          <span className="label">Title</span>
          <input ref={titleRef} type="text" maxLength={120} value={t.title} placeholder="Short and punchy" onChange={set('title')} />
        </label>

        <div className="field">
          <span className="label">Picture</span>
          {block.image && (
            <figure className="panel-img"><img src={block.image} alt="" /></figure>
          )}
          <div className="row">
            <label className="btn btn-sm">
              <input type="file" accept="image/*" hidden onChange={onFile} />
              {block.image ? 'Replace' : '+ Add picture'}
            </label>
            {block.image && (
              <button className="btn btn-sm btn-ghost" onClick={() => actions.setImage(block.id, null)}>Remove</button>
            )}
          </div>
          <p className="hint">You can also drop an image file straight onto a block.</p>
        </div>

        <label className="field">
          <span className="label">
            Summary <span className="count">{t.summary.length}/{SUMMARY_MAX}</span>
          </span>
          <textarea rows={3} maxLength={SUMMARY_MAX} value={t.summary} placeholder="One or two sentences shown on the board" onChange={set('summary')} />
        </label>

        <label className="field">
          <span className="label">Explanation</span>
          <textarea rows={9} value={t.body} placeholder="The full reasoning behind this block. Leave an empty line to start a new paragraph." onChange={set('body')} />
        </label>

        <div className="field">
          <span className="label">Connections ({links.length})</span>
          {links.length ? (
            <ul className="conn-list">
              {links.map((l) => {
                const out = l.from === block.id;
                return (
                  <li key={l.id}>
                    <button className="conn" onClick={() => actions.select({ type: 'link', id: l.id })}>
                      <span className="conn-dir">{out ? '→' : '←'}</span>
                      <span className="conn-title">{blockTitle(theory, out ? l.to : l.from, lang)}</span>
                      <span className={`pill pill-${l.type}`}>{LINK_TYPES[l.type]?.label || l.type}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="hint">Drag the round handle on the block&apos;s right edge onto another block.</p>
          )}
        </div>

        <div className="panel-foot">
          <button className="btn btn-sm" onClick={() => actions.duplicateBlock(block.id)}>Duplicate</button>
          <button className="btn btn-sm btn-danger" onClick={() => actions.deleteBlock(block.id)}>Delete block</button>
        </div>
      </div>
    </>
  );
}

function LinkEditor({ link, theory, lang, actions }) {
  const goto = (id) => {
    actions.select({ type: 'block', id });
    actions.revealBlock(id);
  };

  return (
    <>
      <PanelHead title="Connection" onClose={() => actions.select(null)} />
      <div className="panel-body">
        <div className="field">
          <span className="label">Between</span>
          <div className="link-ends">
            <button className="conn" onClick={() => goto(link.from)}>
              <span className="conn-title">{blockTitle(theory, link.from, lang)}</span>
            </button>
            <span className="link-arrow">{link.type === 'related' ? '—' : '↓'}</span>
            <button className="conn" onClick={() => goto(link.to)}>
              <span className="conn-title">{blockTitle(theory, link.to, lang)}</span>
            </button>
          </div>
        </div>

        <div className="field">
          <span className="label">Kind of connection</span>
          <div className="seg seg-linktype">
            {Object.entries(LINK_TYPES).map(([k, v]) => (
              <button key={k} className={`lt-${k}${link.type === k ? ' is-on' : ''}`} onClick={() => actions.setLinkType(link.id, k)}>
                {v.glyph} {v.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="label">Language</span>
          <LangTabs languages={theory.languages} lang={lang} isFilled={(l) => !!link.label?.[l]} onPick={actions.setLang} />
        </div>

        <label className="field">
          <span className="label">Label <small>(optional)</small></span>
          <input
            type="text"
            maxLength={60}
            value={link.label?.[lang] || ''}
            placeholder="e.g. same symbol, timeline gap"
            onChange={(e) => actions.setLinkLabel(link.id, lang, e.target.value)}
          />
        </label>

        <div className="panel-foot">
          <button className="btn btn-sm" onClick={() => actions.reverseLink(link.id)}>⇄ Reverse</button>
          <button className="btn btn-sm btn-danger" onClick={() => actions.deleteLink(link.id)}>Delete connection</button>
        </div>
      </div>
    </>
  );
}
