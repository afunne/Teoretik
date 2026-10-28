import { memo } from 'react';
import { KINDS, splitParagraphs, textFor } from '../lib/model.js';

function Paragraphs({ text }) {
  return splitParagraphs(text).map((p, i) => (
    <p key={i}>
      {p.split('\n').map((line, j) => (
        <span key={j}>{j > 0 && <br />}{line}</span>
      ))}
    </p>
  ));
}

const stop = (e) => e.stopPropagation();

/** One card on the board. Memoised so dragging one block doesn't re-render the others. */
function Block({ block, lang, languages, selected, isTarget, dragging, onEl, onPointerDown, onPortPointerDown, onToggle }) {
  const { text, lang: shownLang, fallback } = textFor(block, lang, languages);
  const kind = KINDS[block.kind] ? block.kind : 'note';

  const cls = ['block', `kind-${kind}`];
  if (selected) cls.push('is-selected');
  if (isTarget) cls.push('is-target');
  if (dragging) cls.push('is-dragging');

  return (
    <article
      ref={(el) => onEl(block.id, el)}
      data-id={block.id}
      className={cls.join(' ')}
      style={{ left: block.x, top: block.y }}
      onPointerDown={(e) => onPointerDown(e, block.id)}
    >
      <header className="block-head">
        <span className="kind-tag">{KINDS[kind].label}</span>
        {fallback && (
          <span className="fallback-tag" title={`Not translated to ${lang.toUpperCase()} yet - showing ${shownLang.toUpperCase()}`}>
            {shownLang.toUpperCase()}
          </span>
        )}
        <span className="head-dots" aria-hidden="true" />
      </header>

      <div className={`block-inner${fallback ? ' is-fallback' : ''}`}>
        <h3 className="block-title">{text.title || <span className="ph">Untitled block</span>}</h3>

        {block.image && (
          <figure className="block-img">
            <img src={block.image} alt="" draggable={false} />
          </figure>
        )}

        {text.summary && <p className="block-summary">{text.summary}</p>}

        {text.body && (
          <>
            {block.expanded && (
              <div className="block-body" onPointerDown={stop}>
                <Paragraphs text={text.body} />
              </div>
            )}
            <button className="block-more" onPointerDown={stop} onClick={() => onToggle(block.id)}>
              {block.expanded ? '▴ Less' : '▾ Read explanation'}
            </button>
          </>
        )}
      </div>

      <button
        className="port"
        title="Drag onto another block to connect"
        aria-label="Connect"
        onPointerDown={(e) => onPortPointerDown(e, block.id)}
      />
    </article>
  );
}

export default memo(Block);
