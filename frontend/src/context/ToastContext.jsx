import React, { createContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const showSuccess = (msg) => toast.success(msg);
  const showError = (msg) => toast.error(msg);
  const showInfo = (msg) => toast(msg);

  return (
    <ToastContext.Provider value={{ success: showSuccess, error: showError, info: showInfo }}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid #D6E6F3',
            color: '#000926',
            fontSize: '12px',
            fontWeight: '700',
            fontFamily: 'Inter, sans-serif',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 10px 30px rgba(15,82,186,0.08)',
          },
          success: {
            iconTheme: {
              primary: '#079455',
              secondary: '#FFFFFF',
            },
          },
          error: {
            iconTheme: {
              primary: '#D92D20',
              secondary: '#FFFFFF',
            },
          },
        }}
      />
    </ToastContext.Provider>
  );
};
