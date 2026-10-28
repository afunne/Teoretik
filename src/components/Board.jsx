import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { LINK_TYPES, labelFor } from '../lib/model.js';
import { imageFileToDataURL } from '../lib/image.js';
import Block from './Block.jsx';

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2.5;
const GRID = 24;
const SNAP = 8;
const DEFAULT_SIZE = { w: 270, h: 160 };

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const snap = (v) => Math.round(v / SNAP) * SNAP;

/** Point where the line from the rect's centre towards (tx,ty) leaves the rect. */
function edgePoint(r, tx, ty, pad = 0) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  if (!dx && !dy) return { x: cx, y: cy };
  const s = Math.min(
    dx ? (r.w / 2 + pad) / Math.abs(dx) : Infinity,
    dy ? (r.h / 2 + pad) / Math.abs(dy) : Infinity,
  );
  return { x: cx + dx * s, y: cy + dy * s };
}

/** Calls onMove/onUp for a pointer gesture until the button is released. */
function track(onMove, onUp) {
  const up = (ev) => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
    onUp(ev);
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
}

export default function Board({ ref, theory, lang, selection, actions }) {
  const rootRef = useRef(null);
  const [view, setView] = useState(theory.view);
  const [sizes, setSizes] = useState({});
  const [connecting, setConnecting] = useState(null); // { from, x, y, target }
  const [dragging, setDragging] = useState(null);
  const [panning, setPanning] = useState(false);
  const [spaceDown, setSpaceDown] = useState(false);
  const [dropping, setDropping] = useState(false);

  // refs so the (stable) gesture handlers always see current values
  const viewRef = useRef(view);
  viewRef.current = view;
  const theoryRef = useRef(theory);
  theoryRef.current = theory;
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const spaceRef = useRef(false);
  const elsRef = useRef(new Map());
  const roRef = useRef(null);
  const commitTimer = useRef(null);

  /* ---------- measuring blocks ---------- */

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      setSizes((prev) => {
        let next = prev;
        for (const entry of entries) {
          const el = entry.target;
          const id = el.dataset.id;
          const w = el.offsetWidth;
          const h = el.offsetHeight;
          if (prev[id]?.w !== w || prev[id]?.h !== h) {
            if (next === prev) next = { ...prev };
            next[id] = { w, h };
          }
        }
        return next;
      });
    });
    roRef.current = ro;
    elsRef.current.forEach((el) => ro.observe(el));
    return () => {
      ro.disconnect();
      roRef.current = null;
    };
  }, []);

  const registerEl = useCallback((id, el) => {
    const map = elsRef.current;
    const prev = map.get(id);
    if (prev === el) return;
    if (prev) roRef.current?.unobserve(prev);
    if (el) {
      map.set(id, el);
      roRef.current?.observe(el);
    } else {
      map.delete(id);
    }
  }, []);

  /** Block rectangle in board coordinates (reads the DOM so it is always fresh). */
  const rectOf = useCallback((id, sizeMap) => {
    const b = theoryRef.current.blocks.find((x) => x.id === id);
    if (!b) return null;
    const el = elsRef.current.get(id);
    const s = sizeMap?.[id] || (el ? { w: el.offsetWidth, h: el.offsetHeight } : DEFAULT_SIZE);
    return { x: b.x, y: b.y, w: s.w, h: s.h };
  }, []);

  /* ---------- camera ---------- */

  const changeView = useCallback((v) => {
    viewRef.current = v;
    setView(v);
    clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => actionsRef.current.setView(viewRef.current), 350);
  }, []);

  useEffect(() => () => clearTimeout(commitTimer.current), []);

  const toWorld = useCallback((clientX, clientY) => {
    const r = rootRef.current.getBoundingClientRect();
    const v = viewRef.current;
    return { x: (clientX - r.left - v.x) / v.zoom, y: (clientY - r.top - v.y) / v.zoom };
  }, []);

  const zoomAt = useCallback((clientX, clientY, zoom) => {
    const z = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
    const r = rootRef.current.getBoundingClientRect();
    const v = viewRef.current;
    const px = clientX - r.left;
    const py = clientY - r.top;
    const wx = (px - v.x) / v.zoom;
    const wy = (py - v.y) / v.zoom;
    changeView({ zoom: z, x: px - wx * z, y: py - wy * z });
  }, [changeView]);

  const zoomBy = useCallback((factor) => {
    const r = rootRef.current.getBoundingClientRect();
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, viewRef.current.zoom * factor);
  }, [zoomAt]);

  const fit = useCallback(() => {
    const r = rootRef.current.getBoundingClientRect();
    const rects = theoryRef.current.blocks.map((b) => rectOf(b.id)).filter(Boolean);
    if (!rects.length) {
      changeView({ x: r.width / 2, y: r.height / 2, zoom: 1 });
      return;
    }
    const minX = Math.min(...rects.map((q) => q.x));
    const minY = Math.min(...rects.map((q) => q.y));
    const maxX = Math.max(...rects.map((q) => q.x + q.w));
    const maxY = Math.max(...rects.map((q) => q.y + q.h));
    const pad = 70;
    const zoom = clamp(
      Math.min((r.width - pad * 2) / (maxX - minX), (r.height - pad * 2) / (maxY - minY), 1.1),
      MIN_ZOOM, MAX_ZOOM,
    );
    changeView({
      zoom,
      x: (r.width - (maxX - minX) * zoom) / 2 - minX * zoom,
      y: (r.height - (maxY - minY) * zoom) / 2 - minY * zoom,
    });
  }, [changeView, rectOf]);

  const reveal = useCallback((id) => {
    const q = rectOf(id);
    if (!q) return;
    const r = rootRef.current.getBoundingClientRect();
    const v = viewRef.current;
    const sx = q.x * v.zoom + v.x;
    const sy = q.y * v.zoom + v.y;
    if (sx > 0 && sy > 0 && sx + q.w * v.zoom < r.width && sy + q.h * v.zoom < r.height) return;
    changeView({ ...v, x: r.width / 2 - (q.x + q.w / 2) * v.zoom, y: r.height / 2 - (q.y + q.h / 2) * v.zoom });
  }, [changeView, rectOf]);

  const center = useCallback(() => {
    const r = rootRef.current.getBoundingClientRect();
    return toWorld(r.left + r.width / 2, r.top + r.height / 2);
  }, [toWorld]);

  useImperativeHandle(ref, () => ({ fit, center, zoomBy, reveal }), [fit, center, zoomBy, reveal]);

  // a theory that was never framed (fresh sample / new theory) gets fitted on open
  useLayoutEffect(() => {
    if (theory.view.x === 0 && theory.view.y === 0) fit();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- gestures ---------- */

  const startPan = useCallback((e) => {
    const sx = e.clientX;
    const sy = e.clientY;
    const start = viewRef.current;
    setPanning(true);
    track(
      (ev) => changeView({ ...start, x: start.x + ev.clientX - sx, y: start.y + ev.clientY - sy }),
      () => setPanning(false),
    );
  }, [changeView]);

  const onBlockPointerDown = useCallback((e, id) => {
    if (e.button !== 0 || spaceRef.current) return; // let the board pan instead
    const b = theoryRef.current.blocks.find((x) => x.id === id);
    if (!b) return;
    actionsRef.current.select({ type: 'block', id });
    const start = toWorld(e.clientX, e.clientY);
    const ox = b.x;
    const oy = b.y;
    let moved = false;
    track(
      (ev) => {
        const p = toWorld(ev.clientX, ev.clientY);
        const dx = p.x - start.x;
        const dy = p.y - start.y;
        if (!moved) {
          if (Math.hypot(dx, dy) * viewRef.current.zoom < 4) return;
          moved = true;
          setDragging(id);
          actionsRef.current.bringToFront(id);
        }
        const round = ev.altKey ? Math.round : snap; // Alt = no snapping
        actionsRef.current.moveBlock(id, round(ox + dx), round(oy + dy));
      },
      () => setDragging(null),
    );
  }, [toWorld]);

  const onPortPointerDown = useCallback((e, from) => {
    e.stopPropagation();
    e.preventDefault();
    let target = null;
    const update = (ev) => {
      const p = toWorld(ev.clientX, ev.clientY);
      const hit = document.elementFromPoint(ev.clientX, ev.clientY)?.closest('.block');
      target = hit && hit.dataset.id !== from ? hit.dataset.id : null;
      setConnecting({ from, x: p.x, y: p.y, target });
    };
    update(e);
    track(update, () => {
      setConnecting(null);
      if (target) actionsRef.current.addLink(from, target);
    });
  }, [toWorld]);

  const onToggle = useCallback((id) => actionsRef.current.toggleExpanded(id), []);

  const onRootPointerDown = (e) => {
    if (e.button === 1 || (e.button === 0 && spaceRef.current)) {
      e.preventDefault();
      startPan(e);
      return;
    }
    if (e.button !== 0) return;
    if (e.target.closest('.block, .link, .link-label, .empty-card, .zoombar')) return;
    actions.select(null);
    startPan(e);
  };

  const onDoubleClick = (e) => {
    if (e.target.closest('.block, .link, .link-label, .empty-card, .zoombar')) return;
    const p = toWorld(e.clientX, e.clientY);
    actions.addBlock(snap(p.x - 135), snap(p.y - 24));
  };

  // wheel = zoom (needs a non-passive listener to stop page scrolling)
  useEffect(() => {
    const el = rootRef.current;
    const onWheel = (e) => {
      if (e.target.closest('.zoombar')) return;
      e.preventDefault();
      const speed = e.ctrlKey ? 0.01 : 0.0015; // ctrl = trackpad pinch
      zoomAt(e.clientX, e.clientY, viewRef.current.zoom * Math.exp(-e.deltaY * speed));
    };
    // never let the board scroll (focus / scrollIntoView) - we pan instead
    const onScroll = () => { el.scrollLeft = 0; el.scrollTop = 0; };
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('scroll', onScroll);
    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('scroll', onScroll);
    };
  }, [zoomAt]);

  // hold Space to pan with the left button
  useEffect(() => {
    const down = (e) => {
      if (e.code === 'Space' && !e.target.closest?.('input, textarea, select, button, [contenteditable]')) {
        e.preventDefault();
        spaceRef.current = true;
        setSpaceDown(true);
      }
    };
    const up = (e) => {
      if (e.code === 'Space') {
        spaceRef.current = false;
        setSpaceDown(false);
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  /* ---------- dropping image files ---------- */

  const onDragOver = (e) => {
    if ([...(e.dataTransfer?.items || [])].some((i) => i.kind === 'file')) {
      e.preventDefault();
      setDropping(true);
    }
  };

  const onDrop = async (e) => {
    setDropping(false);
    const file = [...(e.dataTransfer?.files || [])].find((f) => f.type.startsWith('image/'));
    if (!file) return;
    e.preventDefault();
    const blockId = e.target.closest('.block')?.dataset.id;
    const p = toWorld(e.clientX, e.clientY);
    try {
      const dataUrl = await imageFileToDataURL(file);
      if (blockId) actions.setImage(blockId, dataUrl);
      else actions.addBlock(snap(p.x - 135), snap(p.y - 40), { image: dataUrl, kind: 'evidence', focus: false });
    } catch (err) {
      console.error(err);
      actions.toast('Could not read that image');
    }
  };

  /* ---------- connection geometry ---------- */

  const lines = useMemo(() => {
    const cache = new Map();
    const R = (id) => {
      if (!cache.has(id)) cache.set(id, rectOf(id, sizes));
      return cache.get(id);
    };
    return theory.links.map((l) => {
      const a = R(l.from);
      const b = R(l.to);
      if (!a || !b) return null;
      const p1 = edgePoint(a, b.x + b.w / 2, b.y + b.h / 2, 2);
      const p2 = edgePoint(b, a.x + a.w / 2, a.y + a.h / 2, 6);
      const type = LINK_TYPES[l.type] ? l.type : 'related';
      return { link: l, type, p1, p2, label: labelFor(l, lang, theory.languages).text };
    }).filter(Boolean);
  }, [theory.links, theory.blocks, theory.languages, sizes, lang, rectOf]);

  const tempLine = useMemo(() => {
    if (!connecting) return null;
    const a = rectOf(connecting.from, sizes);
    if (!a) return null;
    const s = edgePoint(a, connecting.x, connecting.y, 2);
    return { x1: s.x, y1: s.y, x2: connecting.x, y2: connecting.y };
  }, [connecting, sizes, rectOf]);

  const isSel = (type, id) => selection?.type === type && selection.id === id;

  const classes = ['board'];
  if (panning || spaceDown) classes.push('is-panning');
  if (connecting) classes.push('is-connecting');
  if (dropping) classes.push('is-dropping');

  return (
    <main
      ref={rootRef}
      className={classes.join(' ')}
      aria-label="Theory board"
      style={{
        '--grid': `${GRID * view.zoom}px`,
        '--gx': `${view.x}px`,
        '--gy': `${view.y}px`,
      }}
      onPointerDown={onRootPointerDown}
      onDoubleClick={onDoubleClick}
      onDragOver={onDragOver}
      onDragLeave={(e) => e.target === rootRef.current && setDropping(false)}
      onDrop={onDrop}
    >
      <div className="world" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}>
        <svg className="links" aria-hidden="true">
          <defs>
            {Object.keys(LINK_TYPES).map((t) => (
              <marker key={t} id={`arrow-${t}`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="14"
                      markerHeight="14" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 z" className={`arrow arrow-${t}`} />
              </marker>
            ))}
          </defs>
          {lines.map(({ link, type, p1, p2 }) => {
            const c = { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
            return (
              <g key={link.id} className={`link link-${type}${isSel('link', link.id) ? ' is-selected' : ''}`}
                 data-id={link.id}
                 onPointerDown={(e) => { if (e.button === 0 && !spaceRef.current) { e.stopPropagation(); actions.select({ type: 'link', id: link.id }); } }}>
                <line className="link-hit" {...c} />
                <line className="link-line" {...c} markerEnd={type === 'related' ? undefined : `url(#arrow-${type})`} />
              </g>
            );
          })}
          {tempLine && <line className="link-temp" {...tempLine} />}
        </svg>

        <div className="link-labels">
          {lines.map(({ link, type, p1, p2, label }) => (
            <button
              key={link.id}
              className={`link-label link-${type}${isSel('link', link.id) ? ' is-selected' : ''}`}
              data-id={link.id}
              title={LINK_TYPES[type].label}
              style={{ left: (p1.x + p2.x) / 2, top: (p1.y + p2.y) / 2 }}
              onPointerDown={(e) => { if (e.button === 0 && !spaceRef.current) { e.stopPropagation(); actions.select({ type: 'link', id: link.id }); } }}
            >
              <span className="glyph">{LINK_TYPES[type].glyph}</span>
              {label && <span className="txt">{label}</span>}
            </button>
          ))}
        </div>

        <div className="blocks">
          {theory.blocks.map((b) => (
            <Block
              key={b.id}
              block={b}
              lang={lang}
              languages={theory.languages}
              selected={isSel('block', b.id)}
              isTarget={connecting?.target === b.id}
              dragging={dragging === b.id}
              onEl={registerEl}
              onPointerDown={onBlockPointerDown}
              onPortPointerDown={onPortPointerDown}
              onToggle={onToggle}
            />
          ))}
        </div>
      </div>

      {theory.blocks.length === 0 && (
        <div className="board-empty">
          <div className="empty-card">
            <span className="empty-kicker">Empty board</span>
            <h2>Start your theory</h2>
            <p>Double-click anywhere on the paper to drop a block, or press <b>+ Block</b>.</p>
            <p>Drag the round handle of one block onto another to connect the dots.</p>
          </div>
        </div>
      )}

      <div className="zoombar">
        <button className="btn btn-sm" title="Zoom out" onClick={() => zoomBy(1 / 1.2)}>-</button>
        <span className="zoom-readout">{Math.round(view.zoom * 100)}%</span>
        <button className="btn btn-sm" title="Zoom in" onClick={() => zoomBy(1.2)}>+</button>
        <button className="btn btn-sm" title="Fit everything (0)" onClick={fit}>Fit</button>
      </div>

      <p className="helpline" aria-hidden="true">
        dbl-click paper: new block &nbsp;/&nbsp; drag <i className="dot" /> onto a block: connect
        &nbsp;/&nbsp; wheel: zoom &nbsp;/&nbsp; drag paper: move
      </p>
    </main>
  );
}
