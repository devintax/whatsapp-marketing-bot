// Additional security middleware for external domain access
module.exports = function(req, res, next) {
  // Log all external API requests for monitoring
  if (req.get('host')?.includes('connect.vemgootech.info') && req.path.startsWith('/api')) {
    console.log(`🌐 EXTERNAL API CALL: ${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
      clientDomain: req.get('X-Client-Domain'),
      timestamp: new Date().toISOString()
    });
  }

  // Validate client domain for external calls
  const clientDomain = req.get('X-Client-Domain');
  const allowedDomains = ['connect.vemgootech.info', 'localhost', '127.0.0.1', '10.0.0.181'];
  
  if (req.get('host')?.includes('connect.vemgootech.info') && req.path.startsWith('/api')) {
    // Allow all requests from connect.vemgootech.info origin
    const origin = req.get('Origin') || req.get('Referer');
    
    if (origin && origin.includes('connect.vemgootech.info')) {
      console.log(`✅ AUTHORIZED DOMAIN ACCESS from origin: ${origin}`);
      // Explicitly proceed to next middleware
    } else if (clientDomain && allowedDomains.includes(clientDomain)) {
      console.log(`✅ AUTHORIZED DOMAIN ACCESS: ${clientDomain}`);
      // Explicitly proceed to next middleware
    } else {
      console.warn(`⚠️ UNAUTHORIZED DOMAIN ACCESS ATTEMPT: ${clientDomain || 'unknown'} from origin: ${origin || 'none'}`);
      console.warn(`📋 Request headers:`, {
        host: req.get('host'),
        origin: req.get('Origin'),
        referer: req.get('Referer'),
        clientDomain: req.get('X-Client-Domain'),
        userAgent: req.get('User-Agent')
      });
      return res.status(403).json({ 
        message: 'Access denied: Unauthorized client domain',
        code: 'UNAUTHORIZED_DOMAIN'
      });
    }
  }

  // Rate limiting headers
  res.set({
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Window': '15min',
    'X-Powered-By': 'WhatsApp-Marketing-Bot'
  });

  next();
};