import { useState, useEffect } from 'react';

export default function PWAInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      const dismissed = sessionStorage.getItem('pwa-banner-dismissed');
      if (!dismissed) setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShow(false);
    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('pwa-banner-dismissed', '1');
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      color: '#fff', padding: '12px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '12px', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
        <img src="/icons/icon-72x72.png" alt="" width={36} height={36} style={{ borderRadius: 8 }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Install The Divine Corner</div>
          <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Add to home screen for quick access</div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={handleDismiss}
          style={{
            background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
            borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem',
          }}
        >
          Later
        </button>
        <button
          onClick={handleInstall}
          style={{
            background: '#fff', border: 'none', color: '#6366f1',
            borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
            fontSize: '0.8rem', fontWeight: 600,
          }}
        >
          Install
        </button>
      </div>
    </div>
  );
}
