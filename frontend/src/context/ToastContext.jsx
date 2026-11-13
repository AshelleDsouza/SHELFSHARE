import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={toastContainerStyle}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              ...toastItemStyle,
              borderColor:
                toast.type === 'success'
                  ? 'var(--success)'
                  : toast.type === 'error'
                  ? 'var(--error)'
                  : 'var(--primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 }}>
              {toast.type === 'success' && <CheckCircle2 size={18} color="var(--success)" />}
              {toast.type === 'error' && <AlertCircle size={18} color="var(--error)" />}
              {toast.type === 'info' && <Info size={18} color="var(--primary)" />}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const toastContainerStyle = {
  position: 'fixed',
  bottom: '1.5rem',
  right: '1.5rem',
  zIndex: 9999,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
  maxWidth: '380px',
  width: '100%',
};

const toastItemStyle = {
  background: 'var(--bg-card)',
  padding: '0.85rem 1.1rem',
  borderRadius: 'var(--radius-md)',
  boxShadow: 'var(--shadow-lg)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderLeft: '4px solid var(--primary)',
  animation: 'slideIn 0.25s ease-out',
};
