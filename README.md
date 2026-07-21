# WhatsApp Marketing Bot

A comprehensive WhatsApp marketing automation platform with AI-driven campaign design, user contact management, business data ingestion, and campaign approval workflows.

## Features

### 🤖 AI-Powered Campaign Design
- Natural language campaign creation using OpenAI GPT-4
- Business context-aware content generation
- JSON to media scaffolding for mobile-optimized delivery
- Campaign optimization based on feedback

### 📱 WhatsApp Integration
- WhatsApp Web API integration for message delivery
- QR code authentication
- Bulk message sending with rate limiting
- Message status tracking (sent, delivered, read)

### 👥 Contact Management
- Import and organize contacts
- Tag-based segmentation
- Contact engagement analytics
- Bulk import/export functionality

### 📊 Business Data Training
- Train AI models with your business data
- Service, product, and promotion information
- FAQ and template management
- Keyword extraction and context analysis

### 📈 Analytics & Reporting
- Campaign performance metrics
- Contact engagement tracking
- Message delivery rates
- Real-time dashboard with insights

### ✅ Campaign Approval Workflow
- Multi-stage approval process
- Campaign preview and testing
- Feedback and revision system
- Scheduled campaign delivery

## Tech Stack

### Backend
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **WhatsApp Web.js** for WhatsApp integration
- **OpenAI API** for AI-powered content generation
- **JWT** authentication
- **Multer** for file uploads
- **Winston** for logging

### Frontend
- **React 18** with functional components
- **Material-UI (MUI)** for responsive design
- **React Router** for navigation
- **React Query** for state management
- **Axios** for API communication
- **React Hook Form** for form handling

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Redis (local recommended)
- OpenAI API key
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whatsApp-bot
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Copy environment variables
   copy .env.example .env
   
   # Edit .env with your configuration
   # - MongoDB connection string
   # - OpenAI API key
   # - JWT secret
   # - Business information
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Configuration**
   
   Edit `backend/.env` with your settings:
   ```env
   MONGODB_URI=mongodb://localhost:27017/whatsapp_marketing_bot
   REDIS_URL=redis://localhost:6379
   MEDIA_PUBLIC_URL=http://localhost:5000
   PRIMARY_AI_MODEL=local_llm
   FALLBACK_AI_MODEL=openrouter
   LOCAL_LLM_BASE_URL=http://localhost:11434/v1
   LOCAL_LLM_MODEL=llama3.1:8b
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   JWT_SECRET=your_super_secret_jwt_key_here
   BUSINESS_NAME=Your Business Name
   BUSINESS_PHONE=+1234567890
   BUSINESS_EMAIL=info@yourbusiness.com
   ```

5. **Optional local infrastructure**
   ```bash
   docker compose -f docker-compose.local.yml up -d
   ```
   This starts local Redis on `localhost:6379` and a local media service at `http://localhost:8082/media`.

### Running the Application

1. **Start MongoDB** (if running locally)

2. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Server will run on http://localhost:5000

3. **Start Frontend Development Server**
   ```bash
   cd frontend
   npm start
   ```
   Frontend will run on http://localhost:3000

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create new campaign
- `GET /api/campaigns/:id` - Get campaign details
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/:id/approval` - Approve/reject campaign

### Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact
- `POST /api/contacts/bulk-import` - Bulk import contacts

### WhatsApp
- `POST /api/whatsapp/init` - Initialize WhatsApp client
- `GET /api/whatsapp/qr` - Get QR code for authentication
- `POST /api/whatsapp/send-message` - Send single message
- `POST /api/whatsapp/send-campaign` - Send bulk campaign
- `GET /api/whatsapp/status` - Get client status

### AI
- `POST /api/ai/generate-campaign` - Generate campaign content
- `POST /api/ai/optimize-campaign` - Optimize existing campaign
- `POST /api/ai/business-insights` - Generate business insights
- `POST /api/ai/train` - Train AI with business data

### Business Data
- `GET /api/business` - List business data
- `POST /api/business` - Create business data
- `PUT /api/business/:id` - Update business data
- `DELETE /api/business/:id` - Delete business data
- `GET /api/business/search` - Search business data

### Analytics
- `GET /api/analytics/dashboard` - Dashboard analytics
- `GET /api/analytics/campaigns/:id` - Campaign analytics
- `GET /api/analytics/contacts/engagement` - Contact engagement
- `GET /api/analytics/export` - Export analytics data

## Usage Guide

### 1. Initial Setup
1. Register/login to your account
2. Complete your business profile
3. Add your business data for AI training

### 2. Contact Management
1. Import your contact list (CSV/Excel)
2. Organize contacts with tags
3. Create contact groups for targeting

### 3. WhatsApp Setup
1. Initialize WhatsApp connection
2. Scan QR code with your phone
3. Verify connection status

### 4. Campaign Creation
1. Use AI to generate campaign content
2. Provide natural language description
3. Review and customize generated content
4. Select target audience
5. Schedule or send immediately

### 5. Campaign Management
1. Monitor campaign performance
2. Track delivery and engagement rates
3. Analyze results and optimize

## Security Features

- JWT-based authentication
- Rate limiting on API endpoints
- Input validation and sanitization
- Helmet.js security headers
- MongoDB injection protection
- File upload restrictions

## Deployment

### Docker Deployment (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
1. Set up production MongoDB instance
2. Configure environment variables
3. Build frontend: `npm run build`
4. Start backend: `npm start`
5. Serve frontend through reverse proxy (nginx)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For support and questions:
- Email: info@dfgbusiness.com
- Phone: +1 302 322 5515
- WhatsApp: +1 302 420 8747

## License

This project is licensed under the ISC License.

## Acknowledgments

- OpenAI for GPT-4 API
- WhatsApp Web.js community
- Material-UI team
- All open source contributors
