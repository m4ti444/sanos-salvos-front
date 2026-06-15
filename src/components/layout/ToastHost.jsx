import { useEffect, useRef, useState } from 'react';

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  useEffect(() => {
    const handler = (event) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const toast = {
        id,
        message: event.detail?.message || 'Notificacion',
        type: event.detail?.type || 'info',
      };
      setToasts((prev) => [...prev, toast]);

      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timers.current.delete(id);
      }, 4000);
      timers.current.set(id, timer);
    };

    window.addEventListener('app:toast', handler);
    return () => {
      window.removeEventListener('app:toast', handler);
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 96,
      right: 24,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      maxWidth: 'min(360px, calc(100vw - 32px))'
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: toast.type === 'warning' ? 'var(--accent-orange)' : toast.type === 'success' ? '#10b981' : 'white',
            color: toast.type === 'warning' || toast.type === 'success' ? 'white' : 'var(--text-primary)',
            border: 'var(--border-thick)',
            boxShadow: '6px 6px 0 var(--text-primary)',
            padding: '14px 16px',
            fontWeight: 800,
            textTransform: 'uppercase',
            lineHeight: 1.25
          }}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
