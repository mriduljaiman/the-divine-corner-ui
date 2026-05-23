import { useEffect } from 'react';

export default function TawkTo() {
  useEffect(() => {
    if (document.querySelector('script[data-tawk]')) return;

    globalThis.Tawk_API = globalThis.Tawk_API || {};
    globalThis.Tawk_LoadStart = new Date();

    const s1 = document.createElement('script');
    const s0 = document.getElementsByTagName('script')[0];
    s1.async = true;
    s1.src = 'https://embed.tawk.to/6a11484a3deb151c33b6cc9a/1jp9o4p7a';
    s1.setAttribute('crossorigin', '*');
    s1.dataset.tawk = 'true';
    s0.parentNode.insertBefore(s1, s0);
  }, []);

  return null;
}
