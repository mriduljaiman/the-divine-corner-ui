import { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [phase, setPhase] = useState('in');

  useEffect(() => {
    if (sessionStorage.getItem('splash_shown')) {
      setPhase('done');
      return;
    }
    sessionStorage.setItem('splash_shown', '1');

    const t1 = setTimeout(() => setPhase('visible'), 50);
    const t2 = setTimeout(() => setPhase('out'), 2300);
    const t3 = setTimeout(() => setPhase('done'), 2900);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (phase === 'done') return null;

  return (
    <div className={`splash-screen splash-${phase}`}>
      <div className="splash-inner">
        <img src="/logo.png" alt="The Divine Corner" className="splash-logo" />

        <p className="splash-tagline">
          Har Occassion Har Zarurat — Sirf The Divine Corner
        </p>

        <p className="splash-sub">
          100% Genuine Products &nbsp;|&nbsp; Trust Worthy Shopping
        </p>
      </div>

      <style jsx>{`
        .splash-screen {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.55s ease;
        }

        .splash-in      { opacity: 0; }
        .splash-visible { opacity: 1; }
        .splash-out     { opacity: 0; }

        .splash-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          padding: 24px;
          text-align: center;
        }

        .splash-logo {
          width: min(300px, 78vw);
          height: auto;
          object-fit: contain;
          animation: splashPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.05s both;
        }

        @keyframes splashPop {
          from { transform: scale(0.75); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }

        .splash-tagline {
          font-family: 'Inter', sans-serif;
          font-size: clamp(0.9rem, 3.2vw, 1.1rem);
          font-weight: 800;
          letter-spacing: 0.01em;
          line-height: 1.4;
          margin: 0;
          color: #d4a017;
          -webkit-text-stroke: 0.8px #aa0000;
          text-shadow:
            0.5px 0.5px 0 #aa0000,
            -0.5px -0.5px 0 #aa0000,
            0.5px -0.5px 0 #aa0000,
            -0.5px 0.5px 0 #aa0000,
            0 2px 12px rgba(212,160,23,0.3);
          animation: splashSlideUp 0.5s ease 0.2s both;
        }

        .splash-sub {
          font-family: 'Inter', sans-serif;
          font-size: clamp(0.7rem, 2.4vw, 0.82rem);
          font-weight: 500;
          color: #1e293b;
          letter-spacing: 0.04em;
          margin: 0;
          animation: splashSlideUp 0.5s ease 0.35s both;
        }

        @keyframes splashSlideUp {
          from { transform: translateY(12px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
