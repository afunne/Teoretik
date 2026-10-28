import { useEffect, useRef, useState } from 'react';
import { LANGUAGES, normalizeTheory, uid } from '../lib/model.js';
import { listTheories, loadTheory, saveTheory, deleteTheory, storageUsed, STORAGE_BUDGET } from '../lib/storage.js';

const fmtDate = (ts) => new Date(ts).toLocaleString(undefined, {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
const fmtMB = (bytes) => (bytes / 1024 / 1024).toFixed(bytes < 1024 * 1024 ? 2 : 1);
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'theory';

function downloadTheory(t) {
  const blob = new Blob([JSON.stringify(t, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${slug(t.title)}.teoretik.json`;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** "Saves" screen: list, open, create, copy, export, import and delete theories. */
export default function Library({ currentId, currentTheory, onClose, onOpen, onNew, onDeletedCurrent, confirm, toast }) {
  const [, setTick] = useState(0);
  const refresh = () => setTick((n) => n + 1);
  const firstBtn = useRef(null);

  const items = listTheories();
  const used = storageUsed();
  const pct = Math.min(100, Math.round((used / STORAGE_BUDGET) * 100));

  useEffect(() => {
    firstBtn.current?.focus();
  }, []);

  const duplicate = (id) => {
    const t = loadTheory(id);
    if (!t) return;
    try {
      saveTheory({ ...t, id: uid(), title: `${t.title} (copy)`, createdAt: Date.now() });
    } catch {
      toast('Storage is full - delete or export something first');
    }
    refresh();
  };

  const exportOne = (id) => {
    const t = id === currentId ? currentTheory : loadTheory(id);
    if (t) downloadTheory(t);
  };

  const remove = async (entry) => {
    const ok = await confirm({
      title: 'Delete theory?',
      message: `"${entry.title || 'Untitled'}" will be removed from this browser. Export it first if you want a backup.`,
      ok: 'Delete',
      danger: true,
    });
    if (!ok) return;
    deleteTheory(entry.id);
    if (entry.id === currentId) onDeletedCurrent();
    refresh();
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const t = normalizeTheory(JSON.parse(await file.text()));
      if (listTheories().some((x) => x.id === t.id)) t.id = uid();
      saveTheory(t, { touch: false });
      onOpen(t.id);
      toast(`Imported "${t.title}"`);
    } catch (err) {
      console.error(err);
      toast(err?.name === 'QuotaExceededError' ? 'Storage is full' : 'That file is not a Teoretik theory');
    }
  };

  return (
    <section className="library" aria-label="Saved theories" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="library-sheet">
        <header className="library-head">
          <div>
            <span className="kicker">Archive</span>
            <h2>Saved theories</h2>
          </div>
          <button className="icon-btn library-close" title="Back to board (Esc)" onClick={onClose}>✕</button>
        </header>
        <div className="stripe stripe-thin" aria-hidden="true" />

        <div className="library-actions">
          <button ref={firstBtn} className="btn btn-primary" onClick={onNew}>+ New theory</button>
          <label className="btn">
            <input type="file" accept=".json,application/json" hidden onChange={onImport} />
            Import .json
          </label>
          <div className="usage" title="Theories are saved in this browser only. Export to keep a backup.">
            <span>Storage {fmtMB(used)} / ~{fmtMB(STORAGE_BUDGET)} MB</span>
            <span className="usage-bar"><i style={{ width: `${pct}%` }} /></span>
          </div>
        </div>

        <div className="library-grid">
          {items.map((t) => {
            const current = t.id === currentId;
            return (
              <article key={t.id} className={`save-card${current ? ' is-current' : ''}`}>
                <div className="save-band"><span>{current ? 'Open now' : 'Theory'}</span><i className="head-dots" /></div>
                <h3><button className="save-open" onClick={() => onOpen(t.id)}>{t.title || 'Untitled theory'}</button></h3>
                <p className="meta">
                  {t.blocks} block{t.blocks === 1 ? '' : 's'} · {t.links} connection{t.links === 1 ? '' : 's'}
                </p>
                <p className="meta langs">
                  {(t.languages || []).map((l) => <span key={l} title={LANGUAGES[l] || l}>{l.toUpperCase()}</span>)}
                </p>
                <p className="meta">Edited {fmtDate(t.updatedAt)}</p>
                <div className="save-actions">
                  <button className="btn btn-sm btn-primary" onClick={() => onOpen(t.id)}>Open</button>
                  <button className="btn btn-sm" onClick={() => duplicate(t.id)}>Copy</button>
                  <button className="btn btn-sm" onClick={() => exportOne(t.id)}>Export</button>
                  <button className="btn btn-sm btn-danger" title="Delete" onClick={() => remove(t)}>✕</button>
                </div>
              </article>
            );
          })}
        </div>
        <p className="library-note">
          Saves live in this browser. Use <b>Export</b> to back a theory up or move it to another computer.
        </p>
      </div>
    </section>
  );
}
