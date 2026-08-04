const CACHE_TTL_SECONDS = 60;

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/health') {
      return json({ ok: true, service: 'varycave-sports-gateway', version: 4 });
    }
    if (url.pathname !== '/api/sports') return new Response('Not found', { status: 404 });

    const cache = caches.default;
    const cacheKey = new Request(url.origin + '/api/sports', request);
    const cached = await cache.match(cacheKey);
    if (cached) return withCors(cached);

    // Provider adapters will be added here. Secrets belong in Worker environment variables.
    // Until providers are configured, return a controlled response so the dashboard falls back safely.
    const response = json({
      events: [],
      tickerLanes: [],
      stories: [],
      generatedAt: new Date().toISOString(),
      source: 'unconfigured'
    }, 503);

    ctx.waitUntil(cache.put(cacheKey, response.clone()));
    return withCors(response);
  }
};

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': `public, max-age=${CACHE_TTL_SECONDS}` }
  });
}

function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set('access-control-allow-origin', '*');
  headers.set('access-control-allow-methods', 'GET, OPTIONS');
  return new Response(response.body, { status: response.status, headers });
}
