// Environment Detection and Configuration Middleware
const os = require('os');
const dns = require('dns').promises;

// Check if we're running in a production/external environment
const isExternalDomain = (req) => {
  const host = req.get('host');
  const origin = req.get('origin');
  return host?.includes('connect.vemgootech.info') || origin?.includes('connect.vemgootech.info');
};

// Environment detection middleware
const environmentCheck = async (req, res, next) => {
  try {
    const isExternal = isExternalDomain(req);
    const environment = isExternal ? 'production' : 'development';
    
    // Add environment info to request
    req.environment = {
      isExternal,
      type: environment,
      hostname: req.get('host'),
      origin: req.get('origin'),
      userAgent: req.get('user-agent'),
      ip: req.ip || req.connection.remoteAddress
    };
    
    // Log environment for debugging
    console.log(`🌍 Environment: ${environment} | Host: ${req.get('host')} | Origin: ${req.get('origin')}`);
    
    // Add environment headers to response
    res.set('X-Environment', environment);
    res.set('X-Server-Time', new Date().toISOString());
    
    next();
  } catch (error) {
    console.error('Environment check error:', error);
    next(); // Continue even if environment check fails
  }
};

// Network connectivity check
const checkNetworkConnectivity = async () => {
  try {
    // Check if we can resolve external services
    const checks = [
      dns.lookup('api.groq.com'),
      dns.lookup('api.openai.com'),
      dns.lookup('mongodb.com')
    ];
    
    await Promise.all(checks);
    console.log('🌐 Network connectivity check: PASSED');
    return true;
  } catch (error) {
    console.log('🌐 Network connectivity check: FAILED -', error.message);
    return false;
  }
};

// Enhanced error handler for external domain issues
const externalDomainErrorHandler = (err, req, res, next) => {
  const isExternal = isExternalDomain(req);
  
  console.error(`❌ ${isExternal ? 'EXTERNAL' : 'LOCAL'} Domain Error:`, {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    host: req.get('host'),
    origin: req.get('origin'),
    userAgent: req.get('user-agent')
  });
  
  // Enhanced error response for external domain debugging
  if (isExternal) {
    return res.status(500).json({
      success: false,
      error: 'External domain error occurred',
      details: {
        message: err.message,
        environment: 'production',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      },
      troubleshooting: {
        checkCors: 'Verify CORS configuration',
        checkNetwork: 'Verify network connectivity',
        checkAuth: 'Verify authentication headers',
        checkDns: 'Verify DNS resolution for connect.vemgootech.info'
      }
    });
  }
  
  // Standard error response for localhost
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = {
  environmentCheck,
  externalDomainErrorHandler,
  checkNetworkConnectivity,
  isExternalDomain
};