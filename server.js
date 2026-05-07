const express = require('express');
const https = require('https');
const { URL } = require('url');

const app = express();
const PORT = process.env.PORT || 3001;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use('/archive', (req, res) => {
  const MAX_REDIRECTS = 6;
  const targetBase = 'https://archive.org';
  const originalPath = req.path || '';
  // strip our /archive prefix before forwarding to archive.org
  const proxiedPath = originalPath.replace(/^\/archive/, '');
  const query = req.url && req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  
  // Construct URL WITHOUT using the new URL() constructor on the initial string
  // This prevents issues with unencoded special characters in filenames (like parentheses)
  const initialUrl = targetBase + proxiedPath + query;

  function doRequest(targetUrl, redirects = 0) {
    if (redirects > MAX_REDIRECTS) {
      if (!res.headersSent) res.status(508).send('Too many redirects');
      return;
    }

    const parsed = new URL(targetUrl);
    const lib = parsed.protocol === 'http:' ? require('http') : require('https');

    const headers = { ...req.headers };
    delete headers.host;

    const proxyReq = lib.request(parsed, { method: req.method, headers }, (proxyRes) => {
      const status = proxyRes.statusCode || 0;
      const location = proxyRes.headers.location;

      // Follow redirects server-side so the browser never sees them (prevents CORS issues).
      if (status >= 300 && status < 400 && location) {
        const nextUrl = new URL(location, parsed).href;
        proxyRes.resume(); // drain
        return doRequest(nextUrl, redirects + 1);
      }

      // Copy headers from final response, but ensure CORS header present
      Object.entries(proxyRes.headers).forEach(([k, v]) => {
        if (k.toLowerCase() === 'transfer-encoding') return;
        if (v) res.setHeader(k, v);
      });
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.statusCode = status || 200;
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Proxy request error', details: err.message });
    });

    req.pipe(proxyReq);
  }

  try {
    doRequest(initialUrl);
  } catch (err) {
    console.error('Proxy top-level error:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Health endpoints so frontend pings get 200 instead of 404
app.get('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send('OK');
});

app.get('/health', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ status: 'ok' });
});

app.listen(PORT, () => console.log(`Backend proxy listening on http://localhost:${PORT}`));
