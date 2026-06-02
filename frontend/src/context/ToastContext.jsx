import { createContext, useMemo, useState } from "react";

export const ToastContext = createContext({ toasts: [], pushToast: () => {}, clearToasts: () => {} });

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const value = useMemo(
    () => ({
      toasts,
      pushToast: (toast) => setToasts((current) => [...current, { id: Date.now(), ...toast }]),
      clearToasts: () => setToasts([]),
    }),
    [toasts]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
