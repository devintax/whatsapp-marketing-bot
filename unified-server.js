const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = 8080;

// Proxy API requests to backend server
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying API request: ${req.method} ${req.url} → http://localhost:5000${req.url}`);
  },
  onError: (err, req, res) => {
    console.error(`❌ Proxy error: ${err.message}`);
    res.status(500).json({ error: 'Backend service unavailable' });
  }
}));

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Handle React routing (SPA fallback) - must be last
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Unified server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔗 API Proxy: http://localhost:${PORT}/api/* → http://localhost:5000/api/*`);
  console.log(`🌐 External access: https://connect.vemgootech.info`);
  console.log(`✅ Ready for testing!`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down unified server...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Shutting down unified server...');
  process.exit(0);
});