const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, 'build')));

// Handles any requests that don't match the ones above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build/index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`✅ Production server running on port ${port}`);
  console.log(`🌐 Frontend available at: http://localhost:${port}`);
  console.log(`🔗 External domain: https://connect.vemgootech.info`);
});