// webpack.config.js - Override to fix WebSocket SSL issues and external domain access
const { override } = require('customize-cra');

// This is a webpack configuration override for external domain access
// It prevents SSL WebSocket connection issues when accessing via external domains

module.exports = override(
  (config, env) => {
    // Configure WebSocket connections based on environment
    if (config.devServer) {
      const isExternalDomain = process.env.WDS_SOCKET_HOST && 
                               process.env.WDS_SOCKET_HOST !== 'localhost';
      
      if (isExternalDomain) {
        // External domain configuration
        config.devServer.client = {
          webSocketURL: {
            hostname: process.env.WDS_SOCKET_HOST,
            pathname: '/ws',
            port: process.env.WDS_SOCKET_PORT || 443,
            protocol: 'wss'
          }
        };
      } else {
        // Local development configuration
        config.devServer.webSocketServer = {
          type: 'ws',
          options: {
            host: 'localhost',
            port: 3000
          }
        };
      }
      
      // Disable HTTPS for local dev server  
      config.devServer.https = false;
      
      // Allow external domain access
      config.devServer.allowedHosts = 'all';
      config.devServer.host = '0.0.0.0';
      
      // Disable live reload for external domains to prevent connection issues
      if (isExternalDomain) {
        config.devServer.liveReload = false;
        config.devServer.hot = false;
      }
    }
    
    return config;
  }
);