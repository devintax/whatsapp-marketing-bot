const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const port = process.env.PORT || 8080;

// Check if build directory exists
const buildPath = path.join(__dirname, 'build');
if (!fs.existsSync(buildPath)) {
  console.error('❌ Build directory not found:', buildPath);
  console.log('Please run "npm run build" first');
  process.exit(1);
}

// Check if index.html exists
const indexPath = path.join(buildPath, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ index.html not found:', indexPath);
  process.exit(1);
}

console.log(`📂 Serving files from: ${buildPath}`);
console.log(`📄 Index file: ${indexPath}`);

// Serve static files from the React app build directory
app.use(express.static(buildPath, {
  maxAge: '1d', // Cache static assets for 1 day
  etag: false
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    server: 'Frontend Production',
    port: port
  });
});

// Handles any requests that don't match the ones above (SPA routing)
app.get('*', (req, res) => {
  console.log(`📥 Serving SPA route: ${req.path}`);
  res.sendFile(indexPath);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).send('Internal Server Error');
});

// Start server with error handling
const server = app.listen(port, '0.0.0.0', (err) => {
  if (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
  
  console.log(`✅ Production server running on port ${port}`);
  console.log(`🌐 Frontend available at: http://localhost:${port}`);
  console.log(`🔗 External domain: https://connect.vemgootech.info`);
  console.log(`📂 Serving build files from: ${buildPath}`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${port} is already in use`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down production server...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  server.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});