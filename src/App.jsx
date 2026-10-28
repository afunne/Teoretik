import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LANGUAGES, newTheory, newBlock, newLink, uid, withText } from './lib/model.js';
import { listTheories, loadTheory, saveTheory, lastOpened } from './lib/storage.js';
import { sampleTheory } from './lib/sample.js';
import { useConfirm } from './hooks/useConfirm.jsx';
import { useToast } from './hooks/useToast.jsx';
import TopBar from './components/TopBar.jsx';
import Board from './components/Board.jsx';
import Panel from './components/Panel.jsx';
import Library from './components/Library.jsx';

const SNAP = 8;
const snap = (v) => Math.round(v / SNAP) * SNAP;
const hasAnyText = (c) => !!c && !!(c.title || c.summary || c.body);

export default function App() {
  const [theory, setTheory] = useState(null);
  const [lang, setLang] = useState('en');
  const [selection, setSelection] = useState(null); // { type: 'block'|'link', id, focus? }
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [status, setStatus] = useState('saved'); // saved | saving | full

  const boardRef = useRef(null);
  const dirty = useRef(false); // content changed since last save (camera moves don't count)
  const theoryRef = useRef(theory);
  theoryRef.current = theory;

  const [confirmDialog, confirm] = useConfirm();
  const [toastEl, toast] = useToast();

  /* ---------- saving ---------- */

  const persist = useCallback((t) => {
    if (!t) return;
    try {
      saveTheory(t, { touch: dirty.current });
      dirty.current = false;
      setStatus('saved');
    } catch (err) {
      console.error(err);
      setStatus('full');
      toast('Browser storage is full - export this theory or remove some pictures');
    }
  }, [toast]);

  // autosave half a second after the last change
  useEffect(() => {
    if (!theory) return undefined;
    const timer = setTimeout(() => persist(theory), 500);
    return () => clearTimeout(timer);
  }, [theory, persist]);

  useEffect(() => {
    const flush = () => dirty.current && persist(theoryRef.current);
    const onVisibility = () => document.hidden && flush();
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [persist]);

  /** Change the theory content (marks it as edited). `fn` must be pure: theory -> new theory. */
  const edit = useCallback((fn) => {
    dirty.current = true;
    setStatus('saving');
    setTheory((t) => (t ? fn(t) : t));
  }, []);

  /* ---------- opening theories ---------- */

  const openTheory = useCallback((id) => {
    if (dirty.current) persist(theoryRef.current);
    const t = loadTheory(id);
    if (!t) {
      toast('Could not open that theory');
      return;
    }
    dirty.current = false;
    setTheory(t);
    setLang((l) => (t.languages.includes(l) ? l : t.languages[0]));
    setSelection(null);
    setStatus('saved');
    lastOpened.set(t.id);
  }, [persist, toast]);

  // first launch: create the example theory, then open the last one used
  useEffect(() => {
    let items = listTheories();
    if (!items.length) {
      saveTheory(sampleTheory());
      items = listTheories();
    }
    const last = lastOpened.get();
    openTheory(items.some((x) => x.id === last) ? last : items[0].id);
  }, [openTheory]);

  const createTheory = useCallback(() => {
    const t = newTheory('Untitled theory', [lang]);
    saveTheory(t);
    openTheory(t.id);
    requestAnimationFrame(() => {
      const input = document.getElementById('theory-title');
      input?.focus();
      input?.select();
    });
  }, [lang, openTheory]);

  // the open theory was deleted from Saves
  const theoryDeleted = useCallback(() => {
    dirty.current = false;
    const items = listTheories();
    if (items.length) openTheory(items[0].id);
    else createTheory();
  }, [openTheory, createTheory]);

  /* ---------- actions used by the components ---------- */

  const actions = useMemo(() => {
    const mapBlock = (id, fn) => edit((t) => ({ ...t, blocks: t.blocks.map((b) => (b.id === id ? fn(b) : b)) }));
    const mapLink = (id, fn) => edit((t) => ({ ...t, links: t.links.map((l) => (l.id === id ? fn(l) : l)) }));

    const a = {
      select: (sel) => setSelection(sel),

      setTitle: (title) => edit((t) => ({ ...t, title })),

      setView: (view) => setTheory((t) => (t ? { ...t, view } : t)), // not an "edit"

      setLang: (l) => setLang(l),

      addLanguage: (l) => {
        if (!l || theoryRef.current.languages.includes(l)) return;
        edit((t) => ({ ...t, languages: [...t.languages, l] }));
        setLang(l);
        toast(`${LANGUAGES[l] || l} added - untranslated blocks show their original text`);
      },

      removeLanguage: async (l) => {
        const t = theoryRef.current;
        if (t.languages.length < 2) return;
        if (t.blocks.some((b) => hasAnyText(b.content[l]))) {
          const ok = await confirm({
            title: `Remove ${l.toUpperCase()}?`,
            message: `All ${LANGUAGES[l] || l} text in this theory will be deleted.`,
            ok: 'Remove',
            danger: true,
          });
          if (!ok) return;
        }
        edit((th) => ({
          ...th,
          languages: th.languages.filter((x) => x !== l),
          blocks: th.blocks.map((b) => {
            const { [l]: _gone, ...content } = b.content;
            return { ...b, content };
          }),
          links: th.links.map((lk) => {
            const { [l]: _gone, ...label } = lk.label || {};
            return { ...lk, label };
          }),
        }));
        setLang((cur) => (cur === l ? t.languages.find((x) => x !== l) : cur));
      },

      addBlock: (x, y, { kind = 'claim', image = null, focus = true } = {}) => {
        if (x == null) {
          const c = boardRef.current?.center() || { x: 0, y: 0 };
          const n = theoryRef.current.blocks.length % 5;
          x = snap(c.x - 135 + n * 16);
          y = snap(c.y - 80 + n * 16);
        }
        const b = newBlock(x, y, kind);
        b.image = image;
        edit((t) => ({ ...t, blocks: [...t.blocks, b] }));
        setSelection({ type: 'block', id: b.id, focus });
        return b;
      },

      moveBlock: (id, x, y) => mapBlock(id, (b) => ({ ...b, x, y })),

      bringToFront: (id) => edit((t) => {
        const b = t.blocks.find((x) => x.id === id);
        if (!b || t.blocks[t.blocks.length - 1] === b) return t;
        return { ...t, blocks: [...t.blocks.filter((x) => x.id !== id), b] };
      }),

      setText: (id, l, field, value) => mapBlock(id, (b) => withText(b, l, field, value)),

      copyText: (id, from, to) => mapBlock(id, (b) => ({ ...b, content: { ...b.content, [to]: { ...b.content[from] } } })),

      setKind: (id, kind) => mapBlock(id, (b) => ({ ...b, kind })),

      setImage: (id, image) => mapBlock(id, (b) => ({ ...b, image })),

      toggleExpanded: (id) => mapBlock(id, (b) => ({ ...b, expanded: !b.expanded })),

      duplicateBlock: (id) => {
        const src = theoryRef.current.blocks.find((b) => b.id === id);
        if (!src) return;
        const b = { ...structuredClone(src), id: uid(), x: src.x + 32, y: src.y + 32 };
        edit((t) => ({ ...t, blocks: [...t.blocks, b] }));
        setSelection({ type: 'block', id: b.id });
      },

      deleteBlock: async (id) => {
        const t = theoryRef.current;
        const b = t.blocks.find((x) => x.id === id);
        if (!b) return;
        if (Object.values(b.content).some(hasAnyText) || b.image) {
          const n = t.links.filter((l) => l.from === id || l.to === id).length;
          const ok = await confirm({
            title: 'Delete block?',
            message: `This removes the block in every language${n ? ` and its ${n} connection${n === 1 ? '' : 's'}` : ''}.`,
            ok: 'Delete',
            danger: true,
          });
          if (!ok) return;
        }
        setSelection(null);
        edit((th) => ({
          ...th,
          blocks: th.blocks.filter((x) => x.id !== id),
          links: th.links.filter((l) => l.from !== id && l.to !== id),
        }));
      },

      addLink: (from, to) => {
        const t = theoryRef.current;
        const existing = t.links.find((l) => (l.from === from && l.to === to) || (l.from === to && l.to === from));
        if (existing) {
          setSelection({ type: 'link', id: existing.id });
          toast('Those blocks are already connected');
          return;
        }
        const l = newLink(from, to, 'supports');
        edit((th) => ({ ...th, links: [...th.links, l] }));
        setSelection({ type: 'link', id: l.id });
      },

      setLinkType: (id, type) => mapLink(id, (l) => ({ ...l, type })),

      setLinkLabel: (id, l, text) => mapLink(id, (lk) => {
        const label = { ...(lk.label || {}) };
        if (text) label[l] = text;
        else delete label[l];
        return { ...lk, label };
      }),

      reverseLink: (id) => mapLink(id, (l) => ({ ...l, from: l.to, to: l.from })),

      deleteLink: (id) => {
        setSelection(null);
        edit((t) => ({ ...t, links: t.links.filter((l) => l.id !== id) }));
      },

      revealBlock: (id) => boardRef.current?.reveal(id),

      toast,
    };
    return a;
  }, [edit, confirm, toast]);

  /* ---------- keyboard shortcuts ---------- */

  useEffect(() => {
    const onKey = (e) => {
      if (document.querySelector('.modal-backdrop')) return;
      const typing = e.target.closest?.('input, textarea, select, [contenteditable]');
      if (e.key === 'Escape') {
        if (libraryOpen && theoryRef.current) return setLibraryOpen(false);
        if (typing) return e.target.blur();
        return setSelection(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        dirty.current = true;
        persist(theoryRef.current);
        toast('Saved');
        return undefined;
      }
      if (typing || libraryOpen || !theoryRef.current) return undefined;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selection) {
        e.preventDefault();
        if (selection.type === 'block') actions.deleteBlock(selection.id);
        else actions.deleteLink(selection.id);
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && selection?.type === 'block') {
        e.preventDefault();
        actions.duplicateBlock(selection.id);
      } else if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        actions.addBlock();
      } else if (e.key === '0' && !e.ctrlKey && !e.metaKey) {
        boardRef.current?.fit();
      }
      return undefined;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selection, libraryOpen, actions, persist, toast]);

  useEffect(() => {
    if (theory) document.title = `${theory.title || 'Untitled'} - Teoretik`;
  }, [theory?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!theory) return null;

  return (
    <>
      <TopBar
        theory={theory}
        lang={lang}
        status={status}
        actions={actions}
        onOpenLibrary={() => {
          if (dirty.current) persist(theoryRef.current);
          setLibraryOpen(true);
        }}
      />
      <div className="stripe" aria-hidden="true" />

      <div className="workspace">
        <Board key={theory.id} ref={boardRef} theory={theory} lang={lang} selection={selection} actions={actions} />
        <Panel theory={theory} lang={lang} selection={selection} actions={actions} />
      </div>

      {libraryOpen && (
        <Library
          currentId={theory.id}
          onClose={() => setLibraryOpen(false)}
          onOpen={(id) => { openTheory(id); setLibraryOpen(false); }}
          onNew={() => { createTheory(); setLibraryOpen(false); }}
          onDeletedCurrent={theoryDeleted}
          currentTheory={theory}
          confirm={confirm}
          toast={toast}
        />
      )}

      {confirmDialog}
      {toastEl}
    </>
  );
}
