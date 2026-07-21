const express = require('express');
const path = require('path');

const app = express();
const PORT = 8080;
const BUILD_PATH = path.join(__dirname, 'frontend', 'build');

// Serve static files first
app.use(express.static(BUILD_PATH));

// SPA fallback - catch all non-static requests
app.use((req, res, next) => {
  // If no static file was found, serve the React app
  res.sendFile(path.join(BUILD_PATH, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 SPA Server running on port ${PORT}`);
  console.log(`📁 Serving: ${BUILD_PATH}`);
  console.log(`✅ SPA routing enabled for all routes`);
  console.log(`🔄 Dashboard, Campaigns, Settings, etc. will work on refresh`);
});