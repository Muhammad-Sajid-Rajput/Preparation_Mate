import React, { useState, useEffect } from 'react';

const RouteLoader = ({ fullscreen = true }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 150);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: fullscreen ? 'fixed' : 'absolute',
      inset: 0,
      background: '#F7FAFC',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      zIndex: 9999,
    }}>
      <div style={{
        width: 36,
        height: 36,
        border: '3px solid #D6E6F3',
        borderTop: '3px solid #0F52BA', // primary theme color
        borderRadius: '50%',
        animation: 'route-spin 0.7s linear infinite',
      }} />
      <span style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 13,
        color: '#7D97B8',
      }}>
        Loading...
      </span>
      <style>{`
        @keyframes route-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default RouteLoader;
