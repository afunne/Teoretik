import { useCallback, useEffect, useRef, useState } from 'react';

/** Retro confirm dialog. `const [dialog, confirm] = useConfirm(); await confirm({...})` */
export function useConfirm() {
  const [state, setState] = useState(null);
  const current = useRef(null);

  const confirm = useCallback(
    (opts) => new Promise((resolve) => {
      current.current = { ...opts, resolve };
      setState(current.current);
    }),
    [],
  );

  const close = useCallback((value) => {
    current.current?.resolve(value);
    current.current = null;
    setState(null);
  }, []);

  const dialog = state ? <ConfirmDialog {...state} onClose={close} /> : null;
  return [dialog, confirm];
}

function ConfirmDialog({ title, message, ok = 'OK', cancel = 'Cancel', danger = false, onClose }) {
  const okRef = useRef(null);

  useEffect(() => {
    okRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(false); }
      if (e.key === 'Enter') { e.stopPropagation(); e.preventDefault(); onClose(true); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose(false)}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-head"><span id="modal-title">{title}</span></div>
        <div className="modal-body"><p>{message}</p></div>
        <div className="modal-actions">
          <button className="btn" onClick={() => onClose(false)}>{cancel}</button>
          <button ref={okRef} className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => onClose(true)}>
            {ok}
          </button>
        </div>
      </div>
    </div>
  );
}
