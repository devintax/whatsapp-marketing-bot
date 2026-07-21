/**
 * 🌐 EXTERNAL DOMAIN PRODUCTION SERVER
 * 
 * Serves the React build for external domain with proper HTTPS/WSS support
 */

const express = require('express');
const path = require('path');
const https = require('https');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Security headers for HTTPS
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Catch all handler: send back React's index.html file for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 External Domain Server running on port ${PORT}`);
  console.log(`🔗 Access via: https://connect.vemgootech.info`);
  console.log(`🎯 Serving React build from: ${path.join(__dirname, 'frontend/build')}`);
});

module.exports = app;