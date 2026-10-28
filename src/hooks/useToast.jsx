import { useCallback, useEffect, useRef, useState } from 'react';

/** Small message at the bottom of the screen. `const [toastEl, toast] = useToast(); toast('Saved')` */
export function useToast() {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timer = useRef(null);

  const toast = useCallback((msg) => {
    setMessage(msg);
    setVisible(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2600);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const el = (
    <div className={`toast${visible ? ' is-on' : ''}`} role="status">
      {message}
    </div>
  );
  return [el, toast];
}
