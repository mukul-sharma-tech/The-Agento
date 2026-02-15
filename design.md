# Design Document - AgentOnExt

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │   Mobile     │  │   Desktop    │      │
│  │   (React)    │  │  (Future)    │  │   (Future)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Next.js Application                      │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │   Pages    │  │ API Routes │  │ Middleware │    │   │
│  │  └────────────┘  └────────────┘  └────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│   Auth Service   │ │  AI Service  │ │  DB Service  │
│   (NextAuth)     │ │  (OpenAI/    │ │  (Mongoose)  │
│                  │ │   Anthropic) │ │              │
└──────────────────┘ └──────────────┘ └──────────────┘
         │                   │                │
         ▼                   ▼                ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────┐
│   Email Server   │ │  AI Provider │ │   Database   │
│   (SMTP)         │ │   APIs       │ │  (MongoDB)   │
└──────────────────┘ └──────────────┘ └──────────────┘
```

## Component Design

### 1. Frontend Components

#### 1.1 Page Components

**Home Page (`app/page.tsx`)**
- Landing page with authentication status
- Navigation to login/signup or dashboard
- Responsive hero section with branding

**Dashboard (`app/dashboard/page.tsx`)**
- Main navigation hub for authenticated users
- Quick access to chat, document upload, admin panel
- User profile and settings

**Chat Interface (`app/chat/page.tsx`)**
- Real-time messaging interface
- Message history display
- Markdown and table rendering
- Mermaid flowchart viewer modal
- Streaming response support

**Document Upload (`app/ingest-doc/page.tsx`)**
- File upload interface
- Category selection
- Upload progress tracking
- Success/error feedback

**Admin Panel (`app/admin/page.tsx`)**
- Employee management interface
- Pending approval queue
- System status dashboard
- Configuration overview

#### 1.2 UI Components

**Button Component (`components/ui/button.tsx`)**
- Reusable button with variants
- Loading states
- Disabled states
- Accessibility support

**Input Component (`components/ui/input.tsx`)**
- Form input fields
- Validation states
- Error messaging
- Label integration

**Card Component (`components/ui/card.tsx`)**
- Container for grouped content
- Header, body, footer sections
- Responsive layout

**Transition Component (`components/transition.tsx`)**
- Page transition animations
- Framer Motion integration
- Smooth navigation experience

### 2. Backend Components

#### 2.1 API Routes

**Authentication APIs**

`/api/auth/signup`
- User registration
- Email verification token generation
- Password hashing
- Company ID validation

`/api/auth/[...nextauth]`
- NextAuth.js configuration
- Credentials provider
- Session management
- JWT token handling

`/api/auth/verify-email`
- Email verification
- Token validation
- Account activation

`/api/auth/forgot-password`
- Password reset request
- Reset token generation
- Email notification

`/api/auth/reset-password`
- Password reset execution
- Token validation
- Password update

`/api/auth/change-password`
- Authenticated password change
- Old password verification
- New password validation

**Admin APIs**

`/api/auth/admin/employees`
- List employees by company
- Approve/reject employee accounts
- Update employee status

`/api/auth/companies`
- Company management
- Company creation
- Company information retrieval

**Document APIs**

`/api/documents/upload`
- Document file upload
- Text extraction
- Vector embedding generation
- Metadata storage

`/api/documents/debug`
- Document retrieval testing
- Vector search debugging
- System diagnostics

**Chat API**

`/api/chat`
- Message processing
- Context retrieval from vector DB
- AI provider integration
- Response streaming
- Mermaid code generation

#### 2.2 Data Models

**User Model (`models/User.ts`)**
```typescript
interface IUser {
  name: string;
  email: string;
  password: string;
  role: "admin" | "employee";
  company_id: string;
  company_name: string;
  emailVerified: boolean;
  accountVerified: boolean;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  verifiedBy?: string;
  verifiedAt?: Date;
}
```

**Document Model (`models/Document.ts`)**
```typescript
interface IDocument {
  company_id: string;
  filename: string;
  category: string;
  uploaded_by: string;
  upload_date: Date;
  full_text?: string;
  file_url?: string;
}
```

**VectorChunk Model (`models/VectorChunk.ts`)**
```typescript
interface IVectorChunk {
  company_id: string;
  document_id: string;
  chunk_text: string;
  embedding: number[];
  metadata: {
    filename: string;
    category: string;
    chunk_index: number;
  };
}
```

#### 2.3 Service Layer

**Database Service (`lib/db.ts`)**
- MongoDB connection management
- Connection pooling
- Singleton pattern
- Error handling and reconnection
- Configuration loading

**AI Client Service (`lib/ai-client.ts`)**
- Multi-provider support (OpenAI, Anthropic)
- Client initialization and caching
- Chat completion wrapper
- Configuration management
- Error handling

**Email Service (`lib/email.ts`)**
- SMTP configuration
- Email template rendering
- Verification email sending
- Password reset email sending
- Error handling

**Token Service (`lib/token.ts`)**
- JWT token generation
- Token validation
- Expiry management
- Secure random token generation

### 3. Data Flow

#### 3.1 Authentication Flow

```
User Registration:
1. User submits registration form
2. API validates input data
3. Password is hashed with bcrypt
4. User record created in database
5. Verification email sent
6. User redirects to verification page

Email Verification:
1. User clicks verification link
2. API validates token and expiry
3. User account marked as verified
4. Admin approval required for employees
5. User redirects to login

Login:
1. User submits credentials
2. NextAuth validates credentials
3. Password compared with bcrypt
4. Session created with JWT
5. User redirects to dashboard
```

#### 3.2 Document Upload Flow

```
Document Upload:
1. User selects file and category
2. File uploaded to server
3. Text extracted from PDF
4. Text chunked into segments
5. Embeddings generated for each chunk
6. Document metadata stored in DB
7. Vector chunks stored in vector collection
8. Success response returned
```

#### 3.3 Chat Query Flow

```
Chat Query:
1. User sends message
2. Message embedding generated
3. Vector similarity search performed
4. Top K relevant chunks retrieved
5. Context assembled from chunks
6. Prompt constructed with context
7. AI provider API called
8. Response streamed to client
9. Mermaid code extracted if present
10. Response displayed with formatting
```

## Database Design

### Collections

#### users
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  role: String (enum: admin, employee),
  company_id: String (indexed),
  company_name: String,
  emailVerified: Boolean,
  accountVerified: Boolean,
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
  emailVerificationToken: String,
  emailVerificationExpiry: Date,
  verifiedBy: String,
  verifiedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### documents
```javascript
{
  _id: ObjectId,
  company_id: String (indexed),
  filename: String,
  category: String (indexed),
  uploaded_by: String,
  upload_date: Date,
  full_text: String,
  file_url: String
}
```

#### vectorchunks
```javascript
{
  _id: ObjectId,
  company_id: String (indexed),
  document_id: ObjectId (indexed),
  chunk_text: String,
  embedding: [Number] (vector),
  metadata: {
    filename: String,
    category: String,
    chunk_index: Number
  },
  createdAt: Date
}
```

### Indexes

```javascript
// users collection
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ company_id: 1 })
db.users.createIndex({ emailVerificationToken: 1 })
db.users.createIndex({ resetPasswordToken: 1 })

// documents collection
db.documents.createIndex({ company_id: 1 })
db.documents.createIndex({ category: 1 })
db.documents.createIndex({ upload_date: -1 })

// vectorchunks collection
db.vectorchunks.createIndex({ company_id: 1 })
db.vectorchunks.createIndex({ document_id: 1 })
db.vectorchunks.createIndex({ embedding: "vector" }) // Vector search index
```

## Security Design

### 1. Authentication Security

**Password Security**
- Bcrypt hashing with salt rounds: 10
- Minimum password length: 8 characters
- Password complexity requirements
- Secure password reset flow

**Session Security**
- JWT tokens with expiration
- Secure cookie settings (httpOnly, secure, sameSite)
- Session rotation on privilege escalation
- Automatic session timeout

**Token Security**
- Cryptographically secure random tokens
- Time-limited token expiry
- Single-use tokens for sensitive operations
- Token invalidation after use

### 2. Authorization Security

**Role-Based Access Control**
- Admin: Full system access
- Employee: Limited to company data after approval

**Company Isolation**
- All queries filtered by company_id
- No cross-company data access
- Middleware enforcement of company scope

**API Protection**
- Authentication required for all protected routes
- Role verification for admin endpoints
- Input validation and sanitization
- Rate limiting on sensitive endpoints

### 3. Data Security

**Encryption**
- Passwords hashed with bcrypt
- Sensitive environment variables
- HTTPS enforcement in production
- Database connection encryption (SSL/TLS)

**Input Validation**
- Server-side validation for all inputs
- SQL injection prevention (using ODM)
- XSS prevention (React escaping)
- File upload validation (type, size)

**Output Sanitization**
- HTML escaping in responses
- Safe markdown rendering
- Error message sanitization
- No sensitive data in logs

## Configuration Design

### 1. Environment Variables

```env
# Database Configuration
DB_PROVIDER=mongodb
DB_HOST=localhost
DB_PORT=27017
DB_NAME=agentonext
DB_USER=admin
DB_PASSWORD=secure_password
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_SSL_ENABLED=false

# AI Configuration
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4
AI_MAX_TOKENS=4000
AI_TEMPERATURE=0.7
AI_FEATURES_STREAMING=true
AI_FEATURES_FUNCTION_CALLING=true

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=random_secret_key
ENCRYPTION_KEY=random_encryption_key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@agentonext.com

# Application
NODE_ENV=development
PORT=3000
```

### 2. Configuration Files

**Database Config (`config/database.config.js`)**
- Database provider selection
- Connection parameters
- Pool settings
- SSL configuration

**AI Config (`config/ai.config.js`)**
- AI provider selection
- API credentials
- Model parameters
- Feature flags

## Deployment Design

### 1. Development Environment

```bash
# Setup
npm install
node setup.js  # Interactive configuration
npm run dev    # Start development server
```

### 2. Production Environment

```bash
# Setup
npm install --production
node setup.js  # Configure for production
npm run build  # Build optimized bundle
npm start      # Start production server
```

### 3. Process Management

```bash
# Using PM2
pm2 start npm --name "agentonext" -- run start
pm2 save
pm2 startup
```

### 4. Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Performance Optimization

### 1. Frontend Optimization

- Code splitting with Next.js dynamic imports
- Image optimization with Next.js Image component
- CSS optimization with Tailwind CSS purging
- Client-side caching with React Query (future)
- Lazy loading for heavy components

### 2. Backend Optimization

- Database connection pooling
- Query optimization with proper indexes
- Response caching for static data
- Streaming responses for AI chat
- Batch processing for document uploads

### 3. Database Optimization

- Compound indexes for common queries
- Vector index for similarity search
- Query result pagination
- Connection pooling
- Read replicas for scaling (future)

## Error Handling

### 1. Frontend Error Handling

- Try-catch blocks for async operations
- Error boundaries for React components
- User-friendly error messages
- Retry mechanisms for failed requests
- Loading states for async operations

### 2. Backend Error Handling

- Centralized error handling middleware
- Structured error responses
- Error logging with context
- Graceful degradation
- Database connection retry logic

### 3. Monitoring and Logging

- Application logs (info, warn, error)
- Database query logs
- API request/response logs
- Error tracking and alerting
- Performance metrics

## Testing Strategy

### 1. Unit Testing
- Component testing with Jest
- API route testing
- Service layer testing
- Utility function testing

### 2. Integration Testing
- Database integration tests
- AI provider integration tests
- Email service integration tests
- Authentication flow tests

### 3. End-to-End Testing
- User registration flow
- Login and authentication
- Document upload and retrieval
- Chat interaction
- Admin operations

## Future Enhancements

### 1. Architecture Improvements
- Microservices architecture for scalability
- Message queue for async processing
- Caching layer (Redis)
- CDN for static assets
- Load balancing for high availability

### 2. Feature Additions
- Real-time collaboration
- Advanced analytics
- Mobile applications
- Voice interface
- Multi-language support

### 3. Technical Improvements
- GraphQL API
- WebSocket for real-time updates
- Advanced RAG techniques
- Custom model fine-tuning
- Kubernetes deployment
