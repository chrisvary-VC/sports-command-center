(() => {
  const config = window.DASHBOARD_CONFIG || {};
  const storedEndpoint = localStorage.getItem('varycave-worker-url') || '';
  const endpoint = storedEndpoint || config.data?.endpoint || '';
  const live = config.data?.mode === 'live' || Boolean(storedEndpoint);
  const cacheKey = 'varycave-live-data-v6';
  const maxAge = config.data?.cacheMaxAgeMs || 120000;
  const fallback = window.SPORTS_DATA;

  function valid(payload) {
    return payload && Array.isArray(payload.events) && payload.events.length > 0;
  }

  function setSource(source, meta) {
    window.VARYCAVE_DATA_SOURCE = source;
    window.VARYCAVE_DATA_META = meta || {};
    const status = document.getElementById('dataStatus');
    if (status) status.textContent = `${source} DATA · CT`;
  }

  async function fetchLive() {
    if (!endpoint || endpoint.includes('YOUR-WORKER')) throw new Error('Worker URL is not configured');
    const url = endpoint.endsWith('/api/sports') ? endpoint : `${endpoint.replace(/\/$/, '')}/api/sports`;
    const response = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`Sports gateway ${response.status}`);
    const payload = await response.json();
    if (!valid(payload)) throw new Error('Sports gateway returned an empty payload');
    return payload;
  }

  async function load() {
    if (!live) {
      setSource('DEMO');
      return fallback;
    }

    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || 'null');
      if (cached && valid(cached.payload)) {
        window.SPORTS_DATA = cached.payload;
        setSource(Date.now() - cached.savedAt < maxAge ? 'CACHE' : 'STALE', cached.payload.meta);
      }
    } catch (_) {}

    try {
      const payload = await fetchLive();
      window.SPORTS_DATA = payload;
      setSource('LIVE', payload.meta);
      localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), payload }));
      return payload;
    } catch (error) {
      console.warn('[VaryCave] Live data unavailable.', error);
      if (!valid(window.SPORTS_DATA)) window.SPORTS_DATA = fallback;
      setSource(window.VARYCAVE_DATA_SOURCE || 'DEMO', window.SPORTS_DATA?.meta);
      return window.SPORTS_DATA;
    }
  }

  window.VARYCAVE_REFRESH_DATA = async () => {
    try {
      const payload = await fetchLive();
      localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), payload }));
      window.location.reload();
    } catch (error) {
      console.warn('[VaryCave] Refresh failed.', error);
    }
  };

  window.SPORTS_DATA_READY = load();
})();
