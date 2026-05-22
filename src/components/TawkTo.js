import { useEffect } from 'react';

// Tawk.to widget — loads once and persists across SPA navigation
export default function TawkTo() {
  useEffect(() => {
    const propertyId = process.env.NEXT_PUBLIC_TAWK_PROPERTY_ID;
    if (!propertyId) return;

    // Already loaded
    if (window.Tawk_API && window.Tawk_API.isChatHidden !== undefined) return;
    if (document.querySelector('script[data-tawk]')) return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const widgetId = process.env.NEXT_PUBLIC_TAWK_WIDGET_ID || '1';

    const s = document.createElement('script');
    s.async = true;
    s.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    s.charset = 'UTF-8';
    s.setAttribute('crossorigin', '*');
    s.setAttribute('data-tawk', 'true');

    document.head.appendChild(s);
    // intentionally no cleanup — widget must survive page navigations
  }, []);

  return null;
}
