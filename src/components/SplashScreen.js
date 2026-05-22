import { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [phase, setPhase] = useState('in'); // 'in' | 'visible' | 'out' | 'done'

  useEffect(() => {
    // Skip if already shown this session
    if (sessionStorage.getItem('splash_shown')) {
      setPhase('done');
      return;
    }
    sessionStorage.setItem('splash_shown', '1');

    // fade-in → visible → fade-out timeline
    const t1 = setTimeout(() => setPhase('visible'), 50);
    const t2 = setTimeout(() => setPhase('out'), 2200);
    const t3 = setTimeout(() => setPhase('done'), 2800);

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
          background: #3d1a6e;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-direction: column;
          transition: opacity 0.55s ease;
        }

        .splash-in      { opacity: 0; }
        .splash-visible { opacity: 1; }
        .splash-out     { opacity: 0; }

        .splash-inner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 24px;
          text-align: center;
        }

        .splash-logo {
          width: min(280px, 72vw);
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 8px 32px rgba(0,0,0,0.45));
          animation: splashPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.05s both;
        }

        @keyframes splashPop {
          from { transform: scale(0.72); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }

        .splash-tagline {
          font-family: 'Inter', sans-serif;
          font-size: clamp(0.95rem, 3.5vw, 1.15rem);
          font-weight: 700;
          letter-spacing: 0.02em;
          line-height: 1.4;
          margin: 0;
          color: #f5c100;
          -webkit-text-stroke: 1px #cc1100;
          text-shadow:
            0 0 18px rgba(245, 193, 0, 0.55),
            1px 1px 0 #cc1100,
            -1px -1px 0 #cc1100,
            1px -1px 0 #cc1100,
            -1px  1px 0 #cc1100;
          animation: splashSlideUp 0.55s ease 0.25s both;
        }

        .splash-sub {
          font-family: 'Inter', sans-serif;
          font-size: clamp(0.72rem, 2.5vw, 0.85rem);
          font-weight: 500;
          color: #ffffff;
          letter-spacing: 0.03em;
          margin: 0;
          opacity: 0.88;
          animation: splashSlideUp 0.55s ease 0.4s both;
        }

        @keyframes splashSlideUp {
          from { transform: translateY(14px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
