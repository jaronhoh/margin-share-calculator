// Site-local Worker serving the manual-import calculator.
const siteAssets = __SITE_ASSETS__;

const MIME = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
};

function assetResponse(path) {
  const normalized = path === '/' ? '/index.html' : path;
  const name = normalized.replace(/^\//, '');
  const body = siteAssets[name];
  if (body === undefined) return new Response('Not found', { status: 404 });
  const extension = name.slice(name.lastIndexOf('.'));
  return new Response(body, {
    headers: {
      'content-type': MIME[extension] || 'application/octet-stream',
      'cache-control': name === 'index.html' ? 'no-cache' : 'public, max-age=300',
      'x-content-type-options': 'nosniff',
    },
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405 });
    return assetResponse(url.pathname);
  },
};
