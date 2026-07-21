const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

// Serve static files from the build directory
const buildPath = path.join(__dirname, 'frontend', 'build');
app.use(express.static(buildPath));

// SPA fallback - serve index.html for all routes that aren't static files
app.use((req, res, next) => {
  // Skip if it's a static file request (has extension)
  if (req.path.includes('.')) {
    return next();
  }
  
  // Serve React app for all other routes
  console.log(`📋 SPA Route Request: ${req.path}`);
  res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log('🎉 WhatsApp Marketing Bot - Production Server Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Frontend server running on port ${port}`);
  console.log(`🌐 Local: http://localhost:${port}`);
  console.log(`🌐 Network: http://10.0.0.181:${port}`);
  console.log(`🔄 SPA Routing: ENABLED - All routes serve React app`);
  console.log(`📁 Serving from: ${buildPath}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('🎯 Routes handled:');
  console.log('   / → React App');
  console.log('   /dashboard → React App');
  console.log('   /campaigns → React App');
  console.log('   /contacts → React App');
  console.log('   /analytics → React App');
  console.log('   /settings → React App');
  console.log('   /business-data → React App');
  console.log('   + All other routes → React App');
  console.log('');
  console.log('🚀 Ready for production use!');
});

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('🛑 Server shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Server shutting down gracefully...');
  process.exit(0);
});