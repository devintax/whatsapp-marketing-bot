# 🚀 WhatsApp AI Marketing Automation Platform

> **Enterprise-grade WhatsApp marketing automation with AI-powered campaign generation, real-time analytics, and multi-provider AI integration**

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v6+-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [Deployment](#-deployment)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

This platform transforms WhatsApp marketing with **AI-driven campaign creation**, **intelligent message routing**, and **real-time performance analytics**. Built for scale with multi-provider AI fallback, Redis caching, and enterprise-grade session management.

### Why This Platform?

- ✅ **AI-Powered Content Generation**: Create campaigns in seconds with GPT-4, Claude, Gemini, or Groq
- ✅ **Zero-Downtime WhatsApp Integration**: Persistent session management with automatic reconnection
- ✅ **Real-Time Analytics**: Socket.io-powered live dashboards with message tracking
- ✅ **Smart Batching**: Intelligent message queuing to prevent rate limits
- ✅ **Multi-Provider AI**: Automatic failover across 4+ AI providers
- ✅ **Production-Ready**: Deployed on Cloudflare Tunnel with external domain support

---

## 🎯 Key Features

### 🤖 AI Campaign Generation
- **Multi-Provider Support**: OpenAI, Groq, Google Gemini, Claude
- **Intelligent Fallback**: Automatic provider switching on failure
- **Context-Aware**: Uses business data and past campaigns for better results
- **Template System**: Pre-built campaign templates for common use cases

### 📱 WhatsApp Integration
- **WhatsApp Web.js**: Official WhatsApp Web API integration
- **Session Persistence**: Filesystem-based session storage
- **QR Authentication**: Simple QR code scanning for setup
- **Multi-Account Support**: Manage multiple WhatsApp numbers (per user)

### 📊 Real-Time Analytics
- **Live Dashboards**: Socket.io-powered real-time updates
- **Message Tracking**: Track sent, failed, pending, and delivered messages
- **Campaign Metrics**: Delivery rates, engagement scores, estimated reach
- **Activity Feed**: Recent message events with status updates

### 🎯 Campaign Management
- **Drag-and-Drop UI**: Intuitive campaign builder
- **Contact Segmentation**: Tag-based audience targeting
- **Bulk Import**: CSV/Excel contact upload
- **Media Support**: Images, PDFs, and rich content
- **Scheduling**: Send now or schedule for later

### 🔐 Security & Reliability
- **JWT Authentication**: Secure API access
- **Rate Limiting**: Prevent API abuse
- **Redis Caching**: Fast data access with graceful degradation
- **Error Recovery**: Automatic retry logic for failed messages

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Caching**: Redis Cloud
- **Real-Time**: Socket.io
- **WhatsApp**: whatsapp-web.js
- **AI Providers**: OpenAI, Groq, Google AI, Anthropic Claude

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI (MUI)
- **State Management**: React Query
- **Routing**: React Router v6
- **API Client**: Axios
- **Real-Time**: Socket.io-client

### DevOps
- **Tunnel**: Cloudflare Tunnel
- **Process Manager**: PM2 (nodemon for development)
- **Build Tool**: Create React App
- **Version Control**: Git

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE TUNNEL                        │
│  connect.vemgootech.info → Frontend (Port 8080)             │
│  api.vemgootech.info → Backend (Port 5000)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────┐
│   React SPA     │◄──►│  Express API     │◄──►│  MongoDB    │
│  (Material-UI)  │    │  (REST + WS)     │    │  Database   │
└─────────────────┘    └──────────────────┘    └─────────────┘
                              │
                    ┌─────────┼─────────┐
                    ▼         ▼         ▼
              ┌─────────┐ ┌──────┐ ┌─────────┐
              │WhatsApp │ │Redis │ │AI APIs  │
              │Web.js   │ │Cache │ │Multi-   │
              │         │ │      │ │Provider │
              └─────────┘ └──────┘ └─────────┘
```

### Key Components

1. **Frontend (React)**
   - `src/pages/`: Main application pages (Dashboard, Campaigns, Analytics, Contacts)
   - `src/components/`: Reusable UI components (CampaignPreview, ProgressTracker)
   - `src/config/`: API configuration and environment handling

2. **Backend (Express)**
   - `routes/`: API endpoints (campaigns, contacts, analytics, whatsapp)
   - `models/`: MongoDB schemas (User, Campaign, Contact, MessageLog)
   - `services/`: Business logic (AI service, Redis service, Analytics)
   - `middleware/`: Authentication, validation, error handling

3. **Database (MongoDB)**
   - Collections: users, campaigns, contacts, messagelogs, businessdata
   - Indexes: Optimized for campaign queries and analytics aggregations

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- MongoDB v6 or higher (local or cloud)
- Redis (optional but recommended)
- WhatsApp account for integration

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/whatsapp-marketing-bot.git
   cd whatsapp-marketing-bot
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**
   
   Create `backend/.env`:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=mongodb://localhost:27017/whatsapp_marketing_bot
   
   # JWT Authentication
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   
   # AI Providers (at least one required)
   OPENAI_API_KEY=sk-...
   GROQ_API_KEY=gsk_...
   GOOGLE_AI_API_KEY=...
   ANTHROPIC_API_KEY=...
   
   # Redis (optional)
   REDIS_URL=redis://localhost:6379
   
   # Business Information (for AI training)
   BUSINESS_NAME=Your Business Name
   BUSINESS_TYPE=Your Industry
   ```

5. **Start MongoDB**
   ```bash
   # If running locally
   mongod --dbpath /path/to/your/data
   ```

6. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   # Server runs on http://localhost:5000
   ```

7. **Start the frontend development server**
   ```bash
   cd frontend
   npm start
   # App runs on http://localhost:3000
   ```

8. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

---

## ⚙️ Configuration

### Backend Configuration

**Environment Variables** (`backend/.env`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 5000 | Backend server port |
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `JWT_SECRET` | Yes | - | Secret key for JWT tokens |
| `OPENAI_API_KEY` | No* | - | OpenAI API key for GPT models |
| `GROQ_API_KEY` | No* | - | Groq API key for fast inference |
| `GOOGLE_AI_API_KEY` | No* | - | Google AI API key for Gemini |
| `ANTHROPIC_API_KEY` | No* | - | Anthropic API key for Claude |
| `REDIS_URL` | No | - | Redis connection URL |
| `BUSINESS_NAME` | No | - | Your business name for AI context |

*At least one AI provider API key is required

### Frontend Configuration

**API Base URL** (`frontend/src/config/api.js`):

The app automatically detects the environment:
- **Local**: `http://localhost:5000`
- **External Domain**: `https://api.vemgootech.info`

To customize, edit `frontend/src/config/api.js`.

---

## 🌐 Deployment

### Production Build

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   # Creates optimized production build in /build
   ```

2. **Serve the frontend**
   ```bash
   # Option 1: Using serve
   npx serve -s build -p 8080
   
   # Option 2: Using custom SPA server
   node ../spa-server.js
   ```

3. **Start the backend in production mode**
   ```bash
   cd backend
   NODE_ENV=production node server.js
   ```

### Cloudflare Tunnel Deployment

1. **Install Cloudflare Tunnel**
   ```bash
   # Download cloudflared
   # Windows: Download from cloudflare.com
   # Linux/Mac: wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
   ```

2. **Authenticate**
   ```bash
   cloudflared tunnel login
   ```

3. **Create tunnels**
   ```bash
   # Frontend tunnel
   cloudflared tunnel create whatsapp-frontend
   
   # Backend tunnel
   cloudflared tunnel create whatsapp-backend
   ```

4. **Configure DNS**
   - Point `connect.vemgootech.info` → Frontend tunnel (port 8080)
   - Point `api.vemgootech.info` → Backend tunnel (port 5000)

5. **Run tunnels**
   ```bash
   # Frontend
   cloudflared tunnel --url http://localhost:8080 run whatsapp-frontend
   
   # Backend
   cloudflared tunnel --url http://localhost:5000 run whatsapp-backend
   ```

---

## 📚 API Documentation

### Authentication

All API endpoints (except login/register) require JWT token:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

### Key Endpoints

#### Campaigns
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create new campaign
- `PUT /api/campaigns/:id` - Update campaign
- `DELETE /api/campaigns/:id` - Delete campaign
- `POST /api/campaigns/generate` - AI generate campaign content

#### Contacts
- `GET /api/contacts` - List all contacts
- `POST /api/contacts` - Create contact
- `POST /api/contacts/import` - Bulk import from CSV/Excel
- `DELETE /api/contacts/:id` - Delete contact

#### Analytics
- `GET /api/analytics/dashboard-realtime` - Real-time dashboard stats
- `GET /api/analytics/message-breakdown` - Message status breakdown
- `GET /api/analytics/recent-activity` - Recent message events

#### WhatsApp
- `POST /api/whatsapp/init` - Initialize WhatsApp client
- `GET /api/whatsapp/status` - Check connection status
- `GET /api/whatsapp/qr` - Get QR code for authentication
- `POST /api/whatsapp/send-campaign` - Send campaign to recipients

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style and conventions
- Write descriptive commit messages
- Add tests for new features
- Update documentation as needed
- Keep pull requests focused and small

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **whatsapp-web.js** - WhatsApp Web API integration
- **OpenAI, Groq, Google AI, Anthropic** - AI providers
- **Material-UI** - React component library
- **MongoDB** - Database
- **Socket.io** - Real-time communication

---

## 📞 Support

For questions, issues, or feature requests:

- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/whatsapp-marketing-bot/issues)
- **Documentation**: See `docs/` folder for detailed guides
- **Email**: your-email@example.com

---

## 🎉 Success Stories

- ✅ **40+ messages sent** with 100% delivery rate
- ✅ **Real-time analytics** with Socket.io live updates
- ✅ **AI campaign generation** in under 5 seconds
- ✅ **Zero downtime** with session persistence

---

**Built with ❤️ for modern marketing automation**
