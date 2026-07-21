const http = require('http');
const url = require('url');

const PORT = 5000;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const query = parsedUrl.query;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Health check endpoint
    if (path === '/api/health') {
        const response = {
            status: 'OK',
            timestamp: new Date().toISOString(),
            message: 'Simple OAuth2 Test Server is running',
            server: 'Node.js HTTP Server'
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(response, null, 2));
        console.log('✅ Health check requested');
        return;
    }

    // OAuth2 callback endpoint
    if (path === '/api/auth/mautic/callback') {
        const { code, state, error, error_description } = query;
        
        console.log('📞 Mautic OAuth2 Callback received:', {
            code: code ? `${code.substring(0, 10)}...` : 'none',
            state,
            error,
            error_description,
            timestamp: new Date().toISOString()
        });

        let redirectUrl;
        
        if (error) {
            console.log('❌ OAuth2 Error:', error, error_description);
            redirectUrl = `https://connect.vemgootech.info/oauth2-test.html?mautic_error=true&message=${encodeURIComponent(error_description || error)}`;
        } else if (!code) {
            console.log('⚠️ No authorization code received');
            redirectUrl = `https://connect.vemgootech.info/oauth2-test.html?mautic_error=true&message=${encodeURIComponent('No authorization code received')}`;
        } else {
            console.log('✅ OAuth2 Success - Code received!');
            redirectUrl = `https://connect.vemgootech.info/oauth2-test.html?mautic_success=true&message=${encodeURIComponent('OAuth2 authorization successful! Code: ' + code.substring(0, 10) + '...')}`;
        }

        res.writeHead(302, { 'Location': redirectUrl });
        res.end();
        return;
    }

    // CRM test endpoint
    if (path === '/api/crm') {
        const response = {
            message: 'CRM endpoint accessible',
            timestamp: new Date().toISOString(),
            method: req.method,
            headers: req.headers.authorization ? 'auth header present' : 'no auth header'
        };
        
        res.writeHead(200);
        res.end(JSON.stringify(response, null, 2));
        console.log('🔧 CRM endpoint accessed');
        return;
    }

    // 404 for other routes
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found', path }));
});

server.listen(PORT, () => {
    console.log(`🚀 Simple OAuth2 Test Server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔐 OAuth2 callback: http://localhost:${PORT}/api/auth/mautic/callback`);
    console.log(`🌐 Test page: file://oauth2-test.html`);
    console.log(`\n🔧 OAuth2 Test Instructions:`);
    console.log(`1. Open oauth2-test.html in your browser`);
    console.log(`2. Click "Test Backend API" to verify server connection`);
    console.log(`3. Click "Start OAuth2 Authorization" to test the OAuth flow`);
    console.log(`\n📋 Mautic Configuration:`);
    console.log(`- Mautic URL: https://dfgbusiness.com/mautic`);
    console.log(`- Client ID: 1_5dyitz9k5s4kck8skw0cg48s84oksws808w0s8k8040cksks0o`);
    console.log(`- Redirect URI: https://connect.vemgootech.info/api/auth/mautic/callback`);
    console.log(`\n⚠️  Note: This callback URL points to THIS server on port ${PORT}`);
    console.log(`   Make sure your Mautic OAuth2 app redirect URI matches!`);
});

server.on('error', (err) => {
    console.error('❌ Server error:', err.message);
});

process.on('SIGINT', () => {
    console.log('\n👋 Shutting down OAuth2 test server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});