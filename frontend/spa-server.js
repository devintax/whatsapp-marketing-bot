const express = require('express');
const path = require('path');
const app = express();
const port = 8080;

// Serve static files from the React build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handle React Router routes - send all non-API requests to index.html
app.get('*', (req, res) => {
  // Don't interfere with API routes (these should go to backend)
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  
  // Send all other routes to React index.html for client-side routing
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(port, () => {
  console.log(`[FRONTEND] React SPA Server running on port ${port}`);
  console.log(`[FRONTEND] SPA routing: ALL routes serve index.html`);
  console.log(`[FRONTEND] Routes supported: /, /dashboard, /contacts, /campaigns`);
  console.log(`[FRONTEND] API routes: Handled by backend on port 5000`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[FRONTEND] Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[FRONTEND] Received SIGINT, shutting down gracefully');
  process.exit(0);
});