# AgentOnExt

<div align="center">

![AgentOnExt Logo](public/logo.png)

**Enterprise-Grade AI Assistant Platform with RAG Capabilities**

A self-hosted, secure AI assistant platform for intelligent document querying and knowledge management. Deploy on your own infrastructure with full control over data, AI providers, and configurations.

[![Next.js](https://img.shields.io/badge/Next.js-16+-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-green?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Configuration](#configuration) • [Deployment](#deployment)

</div>

---

## Overview

AgentOnExt is an agentic RAG (Retrieval-Augmented Generation) engine designed for enterprise document management and intelligent querying. It combines the power of modern AI with secure, self-hosted infrastructure to provide accurate, context-aware responses from your company's knowledge base.

### Key Capabilities

- 🤖 **Intelligent Document Querying** - Ask questions in natural language and get accurate answers from your documents
- 📚 **RAG Architecture** - Vector-based semantic search with context-aware AI responses
- 🔐 **Enterprise Security** - Company-scoped data isolation, role-based access control, and secure authentication
- 🎨 **Modern UI** - Beautiful, responsive interface with dark mode and smooth animations
- 📊 **Visual Insights** - Automatic flowchart generation for process-related queries using Mermaid
- 🚀 **Self-Hosted** - Complete control over your data and infrastructure

---

## Features

### Core Features

#### 🔒 Authentication & Authorization
- Secure user registration with email verification
- Role-based access control (Admin/Employee)
- Company-based user isolation
- Password reset and change functionality
- Admin approval workflow for employees

#### 📄 Document Management
- PDF document upload and processing
- Automatic text extraction and chunking
- Vector embedding generation for semantic search
- Category-based organization (HR, Engineering, etc.)
- Company-scoped document access

#### 💬 AI Chat Interface
- Real-time conversational AI powered by RAG
- Context-aware responses from your documents
- Streaming responses for better UX
- Multi-turn conversation support
- Source attribution for transparency

#### 📊 Visualization
- Automatic Mermaid flowchart generation
- Interactive flowchart viewer
- Markdown rendering with tables
- Syntax highlighting for code blocks

#### 👥 Admin Dashboard
- Employee management and approval
- System monitoring and status
- Document upload statistics
- User activity tracking

### Technical Features

#### 🔧 Flexible Configuration
- **Multiple AI Providers**: OpenAI (GPT-4), Anthropic (Claude), Google AI (Gemini), Azure OpenAI
- **Database Support**: MongoDB (primary), PostgreSQL (planned), MySQL (planned)
- **Easy Setup**: Interactive configuration wizard
- **Environment-Based**: Secure configuration via environment variables

#### 🎨 Modern Tech Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: MongoDB with Mongoose ODM
- **AI/ML**: OpenAI SDK, Anthropic SDK, Vector embeddings
- **UI Components**: Radix UI, Framer Motion, Lucide Icons

---

## Quick Start

### Prerequisites

- **Node.js** 20 or higher
- **MongoDB** 5.0 or higher (running locally or remote)
- **AI Provider API Key** (OpenAI, Anthropic, Google AI, or Azure)
- **SMTP Server** (for email verification)

### Installation

#### Option 1: Interactive Setup (Recommended)

```bash
# Clone or extract the project
cd agentonext

# Install dependencies
npm install

# Run interactive setup wizard
node setup.js

# Start the application
npm run dev
```

The setup wizard will guide you through:
1. Database configuration (host, port, credentials)
2. AI provider selection and API key
3. Email server configuration
4. Security settings generation

#### Option 2: Manual Setup

1. **Install dependencies**
```bash
npm install
```

2. **Configure environment variables**
```bash
# Copy example environment file
cp .env.example .env.local

# Edit .env.local with your settings
```

3. **Configure database** (edit `config/database.config.js`)
```javascript
const databaseConfig = {
  provider: 'mongodb',
  host: 'localhost',
  port: 27017,
  database: 'agentonext',
  username: 'admin',
  password: 'your-password',
};
```

4. **Configure AI provider** (edit `config/ai.config.js`)
```javascript
const aiConfig = {
  provider: 'openai',
  openai: {
    apiKey: 'sk-your-api-key',
    model: 'gpt-4',
  },
};
```

5. **Start the application**
```bash
npm run dev
```

6. **Open your browser**
```
http://localhost:3000
```

### First Steps

1. **Create an Admin Account**
   - Navigate to `/signup`
   - Register with your company details
   - Verify your email
   - First user becomes admin automatically

2. **Upload Documents**
   - Go to "Ingest Documents"
   - Upload PDF files
   - Assign categories
   - Wait for processing

3. **Start Chatting**
   - Navigate to "AI Chat"
   - Ask questions about your documents
   - Get AI-powered answers with sources

---

## Configuration

### Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database Configuration
DB_PROVIDER=mongodb
DB_HOST=localhost
DB_PORT=27017
DB_NAME=agentonext
DB_USER=admin
DB_PASSWORD=your-secure-password
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_SSL_ENABLED=false

# AI Configuration
AI_PROVIDER=openai
AI_API_KEY=sk-your-openai-api-key
AI_MODEL=gpt-4
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.7
AI_FEATURES_STREAMING=true
AI_FEATURES_FUNCTION_CALLING=true

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-min-32-chars
ENCRYPTION_KEY=your-random-encryption-key-32-chars

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourdomain.com

# Application
NODE_ENV=development
PORT=3000
```

### AI Provider Configuration

#### OpenAI
```env
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4
```
Get your API key: https://platform.openai.com/api-keys

#### Anthropic (Claude)
```env
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-...
AI_MODEL=claude-3-sonnet-20240229
```
Get your API key: https://console.anthropic.com/

#### Google AI (Gemini)
```env
AI_PROVIDER=google
AI_API_KEY=...
AI_MODEL=gemini-pro
```
Get your API key: https://aistudio.google.com/

#### Azure OpenAI
```env
AI_PROVIDER=azure
AI_API_KEY=...
AI_MODEL=gpt-4
AZURE_ENDPOINT=https://your-resource.openai.azure.com/
```

### Database Configuration

#### MongoDB (Recommended)
```env
DB_PROVIDER=mongodb
DB_HOST=localhost
DB_PORT=27017
DB_NAME=agentonext
DB_USER=admin
DB_PASSWORD=your-password
```

#### PostgreSQL (Planned)
```env
DB_PROVIDER=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agentonext
DB_USER=postgres
DB_PASSWORD=your-password
```

---

## Project Structure

```
agentonext/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── chat/                 # Chat API
│   │   └── documents/            # Document management
│   ├── admin/                    # Admin dashboard
│   ├── chat/                     # Chat interface
│   ├── dashboard/                # User dashboard
│   ├── login/                    # Login page
│   ├── signup/                   # Registration page
│   └── ingest-doc/               # Document upload
├── components/                   # React components
│   └── ui/                       # UI components
├── config/                       # Configuration files
│   ├── database.config.js        # Database settings
│   └── ai.config.js              # AI provider settings
├── lib/                          # Utility libraries
│   ├── db.ts                     # Database connection
│   ├── ai-client.ts              # AI client wrapper
│   ├── email.ts                  # Email service
│   └── token.ts                  # Token utilities
├── models/                       # Database models
│   ├── User.ts                   # User model
│   ├── Document.ts               # Document model
│   └── VectorChunk.ts            # Vector chunk model
├── providers/                    # Service providers
│   └── database/                 # Database providers
├── types/                        # TypeScript types
├── public/                       # Static assets
├── .env.example                  # Environment template
├── setup.js                      # Setup wizard
├── setup.bat                     # Windows setup script
├── setup.sh                      # Linux/Mac setup script
├── design.md                     # Design documentation
├── requirements.md               # Requirements documentation
└── README.md                     # This file
```

---

## Deployment

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production servers
npm start
```

### Production Deployment

#### 1. Prepare Environment

```bash
# Install dependencies (production only)
npm install --production

# Run setup wizard
node setup.js

# Build optimized bundle
npm run build
```

#### 2. Configure Security

Update `.env` with production values:
```env
NODE_ENV=production
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate-strong-secret>
ENCRYPTION_KEY=<generate-strong-key>
DB_SSL_ENABLED=true
```

Generate secure secrets:
```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate ENCRYPTION_KEY
openssl rand -base64 32
```

#### 3. Use Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start npm --name "agentonext" -- run start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 4. Configure Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/fullchain.pem;
    ssl_certificate_key /path/to/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 5. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

### Docker Deployment (Future)

```dockerfile
# Dockerfile (coming soon)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Documentation

### User Guides

- **Getting Started**: See [Quick Start](#quick-start) section
- **Admin Guide**: Managing users and documents
- **User Guide**: Uploading documents and using chat

### Technical Documentation

- **[Design Document](design.md)**: System architecture and component design
- **[Requirements Document](requirements.md)**: Functional and non-functional requirements
- **API Documentation**: Coming soon
- **Database Schema**: See [Design Document](design.md#database-design)

### Architecture Overview

AgentOnExt uses a modern RAG (Retrieval-Augmented Generation) architecture:

1. **Document Ingestion**: PDFs are uploaded, text extracted, and chunked
2. **Vector Embedding**: Each chunk is converted to vector embeddings
3. **Storage**: Vectors stored in MongoDB with metadata
4. **Query Processing**: User questions are converted to embeddings
5. **Similarity Search**: Most relevant chunks retrieved via vector search
6. **Context Assembly**: Retrieved chunks assembled as context
7. **AI Generation**: Context + query sent to AI provider
8. **Response**: AI generates accurate, context-aware answer

---

## Troubleshooting

### Common Issues

#### Database Connection Failed
```
Error: Failed to connect to MongoDB
```
**Solutions:**
- Verify MongoDB is running: `mongosh` or `mongo`
- Check connection string in `.env`
- Verify credentials and database name
- Check firewall rules (port 27017)
- Ensure network connectivity

#### AI API Errors
```
Error: Invalid API key
```
**Solutions:**
- Verify API key is correct in `.env`
- Check API key has sufficient credits/quota
- Ensure model name is valid for your provider
- Check rate limits and usage
- Verify provider is selected correctly

#### Email Sending Failed
```
Error: SMTP connection failed
```
**Solutions:**
- Verify SMTP credentials
- Check SMTP host and port
- Enable "Less secure app access" (Gmail)
- Use app-specific password (Gmail)
- Check firewall rules for SMTP port

#### Port Already in Use
```
Error: Port 3000 is already in use
```
**Solutions:**
- Change PORT in `.env`: `PORT=3001`
- Stop other processes: `lsof -ti:3000 | xargs kill` (Mac/Linux)
- Stop other processes: `netstat -ano | findstr :3000` (Windows)

#### Build Errors
```
Error: Module not found
```
**Solutions:**
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next`
- Update dependencies: `npm update`
- Check Node.js version: `node --version` (should be 20+)

### Debug Mode

Enable detailed logging:
```env
NODE_ENV=development
DEBUG=*
```

### Getting Help

- Check [Issues](https://github.com/yourusername/agentonext/issues)
- Review [Design Document](design.md)
- Review [Requirements Document](requirements.md)

---

## Development

### Setup Development Environment

```bash
# Clone repository
git clone https://github.com/yourusername/agentonext.git
cd agentonext

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Configure .env.local with your settings

# Run development server
npm run dev
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run setup        # Run setup wizard
```

### Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Radix UI
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Authentication**: NextAuth.js
- **Database**: MongoDB with Mongoose
- **AI SDKs**: OpenAI, Anthropic
- **Email**: Nodemailer
- **Diagrams**: Mermaid

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Write meaningful commit messages
- Add comments for complex logic
- Update documentation as needed

---

## Security

### Reporting Vulnerabilities

If you discover a security vulnerability, please email security@yourdomain.com. Do not open public issues for security concerns.

### Security Features

- Bcrypt password hashing (10 rounds)
- JWT-based session management
- CSRF protection
- Input validation and sanitization
- Company-scoped data isolation
- Role-based access control
- Secure token generation
- HTTPS enforcement in production

---

## Roadmap

### Phase 1 (Current)
- ✅ User authentication and authorization
- ✅ Document upload and processing
- ✅ RAG-based chat interface
- ✅ Admin dashboard
- ✅ Mermaid flowchart generation

### Phase 2 (Planned)
- 🔄 Voice call interface
- 🔄 Multi-language support
- 🔄 Advanced analytics
- 🔄 Document versioning
- 🔄 Collaborative features

### Phase 3 (Future)
- 📋 Mobile applications
- 📋 Advanced RAG techniques
- 📋 Custom model fine-tuning
- 📋 External integrations (Slack, Teams)
- 📋 SSO and MFA support

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- Next.js team for the amazing framework
- OpenAI and Anthropic for AI capabilities
- MongoDB team for the database
- All open-source contributors

---

<div align="center">

**Built with ❤️ for Enterprise AI**

[⬆ Back to Top](#agentonext)

</div>
