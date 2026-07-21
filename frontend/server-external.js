// Production server for external domain HTTPS support
const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// API proxy to backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  secure: false,
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Backend proxy error' });
  }
}));

// Handle React Router routes - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🌐 Production server running on port ${PORT}`);
  console.log(`📱 Access via: http://localhost:${PORT}`);
  console.log(`🔗 External domain ready for cloudflared tunnel`);
});

module.exports = app;