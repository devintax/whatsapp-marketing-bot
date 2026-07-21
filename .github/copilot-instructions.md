# WhatsApp Marketing Bot - AI Coding Agent Instructions

This is a comprehensive WhatsApp marketing automation platform with AI-driven campaign creation, multi-provider AI integration, WhatsApp Web.js session management, and Redis-backed caching.

## Architecture Overview

### Backend (`/backend`) - Express.js + MongoDB + Redis
- **Core Services**: `services/aiService.js` (multi-provider AI), `services/redisService.js` (caching)
- **WhatsApp Integration**: `routes/whatsapp.js` handles WhatsApp Web.js clients, QR authentication, session persistence
- **AI Campaign Generation**: Multi-provider fallback (OpenAI → Groq → Gemini → Claude) with load balancing
- **Models**: User, Campaign, Contact, BusinessData, MessageAnalytics (Mongoose schemas)
- **Authentication**: JWT middleware in `middleware/auth.js`

### Frontend (`/frontend/src`) - React + Material-UI
- **Pages**: Dashboard, Campaigns, CampaignCreate, Contacts, BusinessData, Analytics, Login
- **Components**: AICampaignCreator, CampaignPreview, ContactImport, Layout
- **State**: React Query for API calls, local state for UI

## Critical Development Patterns

### WhatsApp Session Management
```javascript
// WhatsApp clients are stored per-user in memory Map
const whatsappClients = new Map();
// Session data persists in filesystem: ./whatsapp_sessions/
// QR codes stored temporarily: qrCodes.get(userId)
```

### AI Service Provider Fallback
```javascript
// services/aiService.js implements intelligent provider switching
this.primaryModel = 'openai';     // Configurable primary
this.fallbackModel = 'groq';      // Automatic fallback
this.openaiClients = [...];       // Load balancing array
```

### Campaign Recipients Handling
```javascript
// Backend accepts BOTH formats:
{ contacts: [{phone: "123"}] }     // Legacy format
{ recipients: ["123", "456"] }     // Frontend format (preferred)
```

## Development Workflow

### Start Development Environment
```bash
# Use VS Code task or manual start:
cd backend && npm run dev     # Port 5000 (nodemon)
cd frontend && npm start      # Port 3000 (React dev server)
```

### Testing Patterns
- **Integration Tests**: `backend/test-*.js` files test full workflows
- **External Domain Testing**: `test-external-*` files for production validation
- **WhatsApp Testing**: `test-whatsapp-campaign-workflow.js` for complete flows

### Environment Configuration
```bash
# backend/.env requirements:
MONGODB_URI=mongodb://localhost:27017/whatsapp_marketing_bot
OPENAI_API_KEY=sk-...              # Primary AI provider
GROQ_API_KEY=gsk_...               # Fallback provider
REDIS_URL=redis://...              # Optional caching
BUSINESS_NAME="Your Business"      # Used in AI training
```

## Key Implementation Details

### Redis Integration (Graceful Degradation)
- Redis Cloud connection with timeout protection
- Memory fallback if Redis unavailable
- WhatsApp session caching: `whatsapp:session:${userId}`

### AI Content Generation
- Business context injection from `BusinessData` model
- Campaign templates stored in MongoDB
- JSON-to-media scaffolding for mobile optimization

### Campaign Approval Workflow
- Status progression: `draft → pending_approval → approved → running → completed`
- Campaign preview before approval in `CampaignPreview` component

### Contact Management
- Bulk import via CSV/Excel (`ContactImport` component)
- Tag-based segmentation
- Export functionality with filtered contacts

## Project-Specific Conventions

### File Naming
- Backend routes: `routes/[resource].js` (campaigns.js, whatsapp.js)
- Frontend pages: `pages/[PageName].js` (CamelCase)
- Test files: `test-[feature]-[variant].js`

### Error Handling
- Backend: Consistent JSON responses with `{ message, error }` format
- Frontend: React Hot Toast for user notifications
- WhatsApp errors: Graceful degradation with status tracking

### External Domain Support
- CORS configured for multiple domains including external access
- Frontend proxy handling for API calls
- Environment-specific URL handling

## Common Debugging Commands

```bash
# Test AI service configuration
node backend/test-ai-config.js

# Test WhatsApp workflow end-to-end  
node backend/test-whatsapp-campaign-workflow.js

# Test external domain access
node backend/test-external-domain.js

# Check Redis connection
node backend/test-redis-safe.js
```

## Critical Integration Points

1. **WhatsApp Web.js**: Session persistence in filesystem, QR authentication flow
2. **AI Providers**: Automatic failover, rate limiting, context injection
3. **Redis Caching**: Non-blocking initialization, memory fallback
4. **File Uploads**: Multer handling in `BusinessData` routes for CSV/Excel
5. **Authentication**: JWT tokens with user context in all protected routes