const http = require('http');
const url = require('url');

// Simple HTTP server without external dependencies

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple auth middleware for testing
const testAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No valid token provided' });
  }
  
  // For testing, accept any token that's not empty
  const token = authHeader.substring(7);
  if (token.length < 10) {
    return res.status(401).json({ message: 'Invalid token format' });
  }
  
  // Mock user object
  req.user = { id: 'test-user-id', email: 'test@test.com' };
  next();
};

// Debug endpoint to capture exact request data
app.post('/api/campaigns', testAuth, (req, res) => {
  console.log('\n🚨 ========== CAMPAIGN REQUEST DEBUG ==========');
  console.log('📅 Timestamp:', new Date().toISOString());
  console.log('🔑 Auth Header:', req.headers.authorization?.substring(0, 20) + '...');
  console.log('👤 User ID:', req.user?.id);
  console.log('📋 Content-Type:', req.headers['content-type']);
  console.log('📊 Body Size:', JSON.stringify(req.body).length, 'characters');
  
  console.log('\n📝 FULL REQUEST BODY:');
  console.log(JSON.stringify(req.body, null, 2));
  
  console.log('\n🔍 FIELD ANALYSIS:');
  console.log('✅ name:', !!req.body.name, '-', req.body.name);
  console.log('✅ description:', !!req.body.description, '-', req.body.description);
  console.log('✅ type:', !!req.body.type, '-', req.body.type);
  console.log('✅ aiPrompt:', !!req.body.aiPrompt, '-', req.body.aiPrompt?.length, 'chars');
  console.log('✅ content:', !!req.body.content, '-', req.body.content?.length, 'chars');
  console.log('✅ targetAudience:', !!req.body.targetAudience);
  console.log('✅ mediaFiles:', !!req.body.mediaFiles, '-', Array.isArray(req.body.mediaFiles), '-', req.body.mediaFiles?.length, 'files');
  console.log('✅ status:', !!req.body.status, '-', req.body.status);
  
  if (req.body.targetAudience) {
    console.log('\n🎯 TARGET AUDIENCE ANALYSIS:');
    console.log('contacts:', req.body.targetAudience.contacts);
    console.log('totalCount:', req.body.targetAudience.totalCount);
  }
  
  if (req.body.mediaFiles && Array.isArray(req.body.mediaFiles)) {
    console.log('\n📎 MEDIA FILES ANALYSIS:');
    req.body.mediaFiles.forEach((file, index) => {
      console.log(`File ${index + 1}:`, {
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        hasFile: !!file.file,
        hasPreview: !!file.preview
      });
    });
  }
  
  // Simulate validation errors to understand the issue
  const validationErrors = [];
  
  if (!req.body.name || !req.body.name.trim()) {
    validationErrors.push({ field: 'name', message: 'Campaign name is required' });
  }
  
  if (!req.body.aiPrompt) {
    if (req.body.content) {
      console.log('⚠️ FOUND "content" field but missing "aiPrompt" - This might be the issue!');
      validationErrors.push({ field: 'aiPrompt', message: 'AI Prompt is required (found content instead)' });
    } else {
      validationErrors.push({ field: 'aiPrompt', message: 'AI Prompt is required' });
    }
  } else if (req.body.aiPrompt.trim().length < 10) {
    validationErrors.push({ field: 'aiPrompt', message: 'AI Prompt must be at least 10 characters' });
  }
  
  if (req.body.mediaFiles && !Array.isArray(req.body.mediaFiles)) {
    validationErrors.push({ field: 'mediaFiles', message: 'Media files must be an array' });
  }
  
  console.log('\n💥 VALIDATION RESULT:');
  if (validationErrors.length > 0) {
    console.log('❌ VALIDATION FAILED:');
    validationErrors.forEach(error => {
      console.log(`   ${error.field}: ${error.message}`);
    });
    console.log('==============================================\n');
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors,
      debug: {
        receivedFields: Object.keys(req.body),
        bodyLength: JSON.stringify(req.body).length
      }
    });
  }
  
  console.log('✅ VALIDATION PASSED - Campaign would be created');
  console.log('==============================================\n');
  
  // Return success response
  res.status(201).json({
    success: true,
    campaign: {
      _id: 'test-campaign-id',
      name: req.body.name,
      status: 'draft',
      createdAt: new Date()
    },
    message: 'Campaign created successfully (debug mode)'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', debug: true, timestamp: new Date().toISOString() });
});

// Auth test endpoint
app.post('/api/auth/test', (req, res) => {
  res.json({ 
    token: 'debug-token-for-testing-1234567890',
    user: { id: 'test-user', email: 'debug@test.com' }
  });
});

const PORT = 5001; // Use different port to avoid conflict
app.listen(PORT, () => {
  console.log(`🚀 DEBUG SERVER running on port ${PORT}`);
  console.log(`🔍 This server will help identify the campaign creation issue`);
  console.log(`📡 Test with: http://localhost:${PORT}/api/campaigns`);
  console.log(`🧪 Get debug token: http://localhost:${PORT}/api/auth/test`);
});