const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3010;
const API_TARGET = process.env.API_TARGET || 'http://localhost:5010';

app.use('/api', createProxyMiddleware({
  target: API_TARGET,
  changeOrigin: true,
  secure: false,
  pathRewrite: (path) => `/api${path}`,
  onError: (err, req, res) => {
    console.error('Proxy error:', err.message);
    res.status(500).json({ error: 'Backend proxy error' });
  },
}));

app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Production frontend running on port ${PORT}`);
  console.log(`API proxy target: ${API_TARGET}`);
  console.log(`Cloudflared service should point bot.dfgworld.net to http://172.16.16.59:${PORT}`);
});
