(() => {
  const config = window.DASHBOARD_CONFIG || {};
  const live = config.data?.mode === 'live';
  const endpoint = config.data?.endpoint;
  const cacheKey = 'varycave-live-data-v4';
  const maxAge = config.data?.cacheMaxAgeMs || 120000;
  const fallback = window.SPORTS_DATA;

  async function load() {
    if (!live || !endpoint || endpoint.includes('YOUR-WORKER')) {
      window.VARYCAVE_DATA_SOURCE = 'DEMO';
      return fallback;
    }

    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached && Date.now() - cached.savedAt < maxAge) {
        window.SPORTS_DATA = cached.payload;
        window.VARYCAVE_DATA_SOURCE = 'CACHE';
      }
    } catch (_) {}

    try {
      const response = await fetch(endpoint, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Sports API ${response.status}`);
      const payload = await response.json();
      if (!payload || !Array.isArray(payload.events) || payload.events.length === 0) throw new Error('Invalid or empty sports payload');
      window.SPORTS_DATA = payload;
      window.VARYCAVE_DATA_SOURCE = 'LIVE';
      localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), payload }));
      return payload;
    } catch (error) {
      console.warn('[VaryCave] Live data unavailable, using fallback.', error);
      window.VARYCAVE_DATA_SOURCE ||= 'DEMO';
      return window.SPORTS_DATA || fallback;
    }
  }

  window.SPORTS_DATA_READY = load().finally(() => {
    const script = document.createElement('script');
    script.src = 'app.js';
    script.onload = () => {
      const status = document.getElementById('dataStatus');
      if (status) status.textContent = `${window.VARYCAVE_DATA_SOURCE || 'DEMO'} DATA · CT`;
    };
    script.onerror = () => document.getElementById('bootScreen')?.remove();
    document.body.appendChild(script);
  });
})();
