# External Domain Infrastructure Setup Guide

## Current Issue
- Frontend: `https://connect.vemgootech.info` (HTTPS)
- Backend: `http://localhost:5000` (HTTP)
- **Problem**: Mixed Content Policy blocks HTTP requests from HTTPS pages

## Solutions

### Option 1: Cloudflare Tunnel (Recommended - Free)

```bash
# 1. Install Cloudflare tunnel
npx cloudflared tunnel --url http://localhost:5000

# 2. This gives you a URL like: https://random-name.trycloudflare.com
# 3. Update DNS CNAME record:
#    connect.vemgootech.info -> random-name.trycloudflare.com
```

### Option 2: Reverse Proxy Setup

#### Using Nginx:
```nginx
# /etc/nginx/sites-available/connect.vemgootech.info
server {
    listen 80;
    listen 443 ssl;
    server_name connect.vemgootech.info;
    
    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }
}
```

### Option 3: Node.js Proxy Server

```javascript
// proxy-server.js
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'frontend/build')));

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  secure: false
}));

// Handle React routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`);
});
```

### Option 4: Update Frontend API Config for Production

Once infrastructure is ready, update `frontend/src/config/api.js`:

```javascript
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'connect.vemgootech.info') {
    // Use same protocol and domain, different path
    return `${window.location.protocol}//${hostname}`;
  }
  
  return 'http://localhost:5000';
};
```

## Implementation Steps

### Immediate (Development):
1. ✅ Use `http://localhost:3000` for development
2. ✅ All features work perfectly on localhost

### Short-term (Demo/Testing):
1. Set up Cloudflare tunnel
2. Update DNS CNAME record
3. Test external domain access

### Long-term (Production):
1. Set up proper SSL certificates
2. Configure reverse proxy (Nginx/Apache)
3. Set up proper domain infrastructure
4. Update frontend API configuration

## Current Status
- ✅ Backend: Fully functional with CORS configured
- ✅ Frontend: Works perfectly on localhost
- ⚠️ External Domain: Requires infrastructure setup
- 🎯 **For Boss Demo**: Use `http://localhost:3000`

## Quick Demo Instructions
1. Open `http://localhost:3000`
2. Login with: `vkgbewonyo@gmail.com`
3. All features available:
   - ✅ Campaign management
   - ✅ AI content generation
   - ✅ Contact management
   - ✅ WhatsApp integration
   - ✅ Analytics dashboard