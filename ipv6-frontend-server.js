const express = require('express');
const path = require('path');
const app = express();

const PORT = 8080;

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'frontend', 'build')));

// Handle React Router - serve index.html for all non-static requests
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});

// Start server on both IPv4 and IPv6
app.listen(PORT, '::', () => {
  console.log(`🚀 Frontend server running on http://localhost:${PORT}`);
  console.log(`📡 IPv6 address: http://[::]:${PORT}`);
  console.log(`📱 Network access: http://10.0.0.181:${PORT}`);
  console.log('✅ Server ready for cloudflared tunnel connection');
});