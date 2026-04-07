# Architecture - Mission Control

Technical architecture and system design documentation.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     User's Browser                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Next.js React App (App Router)                          │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────┐     │  │
│  │  │  app/page.js                                    │     │  │
│  │  │  - Login Screen (unauthenticated)               │     │  │
│  │  │  - Dashboard (authenticated)                    │     │  │
│  │  └─────────────────────────────────────────────────┘     │  │
│  │                                                            │  │
│  │  ┌─────────────────────────────────────────────────┐     │  │
│  │  │  Components                                      │     │  │
│  │  │  - Dashboard (main layout)                      │     │  │
│  │  │  - KanbanBoard (6-column grid)                  │     │  │
│  │  │  - KanbanCard (expandable prospect card)        │     │  │
│  │  │  - InboxBanner (email alerts)                   │     │  │
│  │  │  - MetricsBar (statistics)                      │     │  │
│  │  └─────────────────────────────────────────────────┘     │  │
│  │                                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  NextAuth.js (Authentication)                            │  │
│  │  - OAuth Provider (Google)                               │  │
│  │  - JWT Session Management                                │  │
│  │  - Token Refresh                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │                          │                      │
         │ API Calls                │ Sessions            │ Auth
         v                          v                      v
┌─────────────────────────────────────────────────────────────────┐
│                  Vercel Edge Network                             │
│                  (Next.js API Routes)                            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ /api/auth/*  │  │ /api/drafts  │  │ /api/pipeline│          │
│  │              │  │              │  │              │          │
│  │ - OAuth flow │  │ - GET drafts │  │ - Fetch Sheets│        │
│  │ - JWT mgmt   │  │ - Send draft │  │ - Return rows│        │
│  │              │  │ - Token auth │  │ - Format JSON│        │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ /api/inbox                                               │  │
│  │ - Fetch recent emails                                   │  │
│  │ - Filter unread                                         │  │
│  │ - Return recent items                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
         │                          │                      │
         │ Gmail API                │ Sheets API          │ OAuth
         v                          v                      v
┌─────────────────────────────────────────────────────────────────┐
│              Google Cloud APIs                                  │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │  Gmail API   │     │  Sheets API  │     │  OAuth 2.0   │   │
│  │              │     │              │     │              │   │
│  │ - Drafts     │     │ - Read data  │     │ - Auth flow  │   │
│  │ - Messages   │     │ - Spreadsheet│     │ - Tokens     │   │
│  │ - Send       │     │ - Rows       │     │              │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Google Account                              │  │
│  │  - Gmail inbox & drafts                                 │  │
│  │  - Google Drive (Sheets storage)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Authentication

```
User clicks "Sign in with Google"
        ↓
NextAuth redirects to Google OAuth
        ↓
User authorizes scopes (Gmail + Sheets)
        ↓
Google returns auth code
        ↓
NextAuth exchanges code for tokens
        ↓
Access token + Refresh token stored in JWT
        ↓
Session created, user redirected to dashboard
```

### 2. Dashboard Load

```
User lands on /page.js
        ↓
useEffect triggers on mount
        ↓
Parallel API calls:
  - GET /api/pipeline
  - GET /api/drafts
  - GET /api/inbox
        ↓
Components receive data via props
        ↓
UI renders with real-time data
```

### 3. Drafts to Pipeline

```
/api/drafts fetches Gmail drafts
        ↓
Extract to, subject, body for each draft
        ↓
/api/pipeline fetches Google Sheet rows
        ↓
Match email addresses between drafts & pipeline
        ↓
Enrich pipeline cards with draft data
        ↓
KanbanCard renders with draft badge
```

### 4. Send Draft

```
User clicks "Send Email" button
        ↓
Show confirmation: "Confirm Send?"
        ↓
User clicks again to confirm
        ↓
POST /api/drafts/[id] with draftId
        ↓
API calls gmail.drafts.send()
        ↓
Draft sent, response returns messageId
        ↓
UI shows success state (green checkmark)
        ↓
After 1.5s, remove draft from card
```

## Component Architecture

### Component Tree

```
RootLayout (with SessionProvider)
├── page.js (Login or Dashboard)
│   └── Dashboard
│       ├── Header
│       │   ├── Logo + Title
│       │   └── Sign Out Button
│       │
│       ├── InboxBanner
│       │   ├── Toggle Button
│       │   └── InboxItem[] (collapsible)
│       │
│       ├── MetricsBar
│       │   ├── Metric: Total Prospects
│       │   ├── Metric: Drafts Ready
│       │   ├── Metric: With Drafts
│       │   └── Metric: Pipeline Stages
│       │
│       └── KanbanBoard
│           └── KanbanColumn[6]
│               ├── ColumnHeader
│               │   ├── Stage Name
│               │   ├── Color Dot
│               │   └── Card Count
│               │
│               └── KanbanCard[]
│                   ├── Collapsed View
│                   │   ├── Company Name
│                   │   ├── Contact
│                   │   ├── Title
│                   │   ├── Status Badge
│                   │   └── Draft Badge
│                   │
│                   └── Expanded View
│                       ├── Close Button
│                       ├── Company / Contact / Title
│                       ├── Email Link
│                       │
│                       ├── Draft Section
│                       │   ├── Subject
│                       │   ├── Body Preview
│                       │   ├── Send Button
│                       │   └── Open in Gmail Link
│                       │
│                       └── Notes Section
```

## State Management

### Client State (React Hooks)

```javascript
// Dashboard.jsx
const [loading, setLoading] = useState(true)
const [pipelineData, setPipelineData] = useState([])
const [drafts, setDrafts] = useState([])
const [inboxItems, setInboxItems] = useState([])
const [error, setError] = useState(null)

// KanbanCard.jsx
const [isExpanded, setIsExpanded] = useState(false)
const [sendingDraftId, setSendingDraftId] = useState(null)
const [sendConfirm, setSendConfirm] = useState(null)
const [sendSuccess, setSendSuccess] = useState(null)
```

### Session State (NextAuth)

```javascript
// app/layout.js
const session = await getServerSession()

// In components
const { data: session, status } = useSession()

// Session structure
{
  user: {
    name: "User Name",
    email: "user@gmail.com",
    image: "..."
  },
  accessToken: "...", // Gmail API token
  error: null // If token refresh failed
}
```

## API Design

### Response Format

All APIs return JSON:

```javascript
// Success
{
  status: 200,
  data: { /* actual data */ }
}

// Error
{
  status: 400,
  error: "Error message",
  details: "..."
}
```

### Request/Response Examples

#### GET /api/drafts
```javascript
// Request
GET /api/drafts
Header: Authorization: Bearer <token> (via session)

// Response (200 OK)
[
  {
    id: "draft_123",
    messageId: "msg_456",
    to: "prospect@company.com",
    subject: "Let's talk about...",
    body: "Hi prospect...",
    from: "user@gmail.com",
    timestamp: "1234567890"
  }
]
```

#### POST /api/drafts/[draftId]
```javascript
// Request
POST /api/drafts/draft_123

// Response (200 OK)
{
  success: true,
  messageId: "sent_789",
  threadId: "thread_456"
}

// Response (500 Error)
{
  error: "Failed to send draft",
  details: "Gmail API error message"
}
```

#### GET /api/pipeline
```javascript
// Response
[
  {
    name: "Cold Outreach",
    id: "cold",
    color: "--stage-cold",
    cards: [
      {
        id: "1",
        company: "Acme Corp",
        contact: "John Smith",
        title: "CEO",
        email: "john@acme.com",
        status: "Cold",
        notes: "...",
        hasDraft: true,
        drafts: [{ /* draft object */ }]
      }
    ]
  }
]
```

## Database Schema

### Google Sheets (Pipeline)

```
Column A: Company
Column B: Contact
Column C: Title
Column D: Stage
Column E: Email
Column F: Status
Column G: Notes
Column H+: Custom fields
```

Each row = one prospect

### Gmail (Drafts)

Stored in user's Gmail drafts folder. Each draft has:
- To: recipient email
- Subject: email subject
- Body: email content
- Labels: [DRAFT]

### Session (JWT via NextAuth)

Stored in encrypted cookie:
```javascript
{
  sub: "user_id",
  email: "user@gmail.com",
  iat: 1234567890,
  exp: 1234571490,
  accessToken: "...",
  accessTokenExpires: 1234571490,
  refreshToken: "..."
}
```

## Authentication Flow

### OAuth 2.0 Authorization Code Flow

```
1. User visits /
2. Clicks "Sign in with Google"
3. Redirected to: https://accounts.google.com/o/oauth2/auth
   Params:
   - client_id
   - redirect_uri: /api/auth/callback/google
   - scope: gmail.readonly, sheets.readonly, etc.
   - response_type: code

4. User signs in & grants permissions

5. Google redirects to /api/auth/callback/google?code=xxx

6. NextAuth backend exchanges code for tokens:
   POST https://oauth2.googleapis.com/token
   - code: xxx
   - client_id
   - client_secret
   - grant_type: authorization_code

7. Google returns:
   {
     access_token: "...",
     refresh_token: "...",
     expires_in: 3600,
     token_type: "Bearer"
   }

8. NextAuth stores in JWT:
   - access_token (expires in 1 hour)
   - refresh_token (infinite)

9. JWT stored in secure HttpOnly cookie

10. User session created, redirect to /
```

### Token Refresh

```
When access_token expires (< 60 min left):
1. Check expiration in JWT callback
2. Call refreshAccessToken()
3. POST https://oauth2.googleapis.com/token
   - grant_type: refresh_token
   - refresh_token: xxx
   - client_id
   - client_secret

4. Get new access_token & expires_in

5. Update JWT with new token

6. API call proceeds with fresh token
```

## Error Handling

### Network Errors

```
try {
  const res = await fetch('/api/drafts')
  if (!res.ok) throw new Error('API Error')
  const data = await res.json()
  return data
} catch (error) {
  // Show error toast to user
  // Log to console
  // Return fallback/empty state
}
```

### OAuth Errors

```
If token refresh fails:
1. Set session.error = "RefreshAccessTokenError"
2. Component detects error
3. Redirect to login page
4. User re-authenticates
```

### Rate Limiting

```
Gmail API: 1,000,000 requests/day (free)
Sheets API: 300 requests/minute (free)

Current app usage: ~10 requests/day
Safe for production use.

If limit reached:
- API returns 429 Too Many Requests
- Show user: "Service temporarily unavailable"
- Retry after 60 seconds
```

## Performance Optimization

### Frontend

1. **Lazy Loading**: Components render on demand
2. **CSS Modules**: Scoped styles, no conflicts
3. **Conditional Rendering**: Hide draft section if no drafts
4. **Image Optimization**: Next.js Image component (none used currently)

### Backend

1. **Server-side Sessions**: JWT stored in DB (NextAuth)
2. **Caching**: None currently (stateless API)
3. **Efficient Queries**:
   - Limit Gmail drafts fetch to 100
   - Limit sheet rows to 1000
4. **Parallel Requests**: Dashboard fetches all 3 APIs in parallel

### Network

1. **Compression**: Vercel auto-gzips responses
2. **CDN**: Vercel edge network
3. **Minimal Bundle**: ~2.5MB JavaScript

## Security Architecture

### Token Storage

```
Access Token:
- Location: JWT (HttpOnly cookie)
- Expiration: 1 hour
- Scope: gmail.send, gmail.readonly, sheets.readonly
- Usage: Server-side API calls only

Refresh Token:
- Location: JWT (HttpOnly cookie)
- Expiration: Never (until revoked)
- Scope: offline access
- Usage: Generate new access tokens
```

### CSRF Protection

```
Built into NextAuth:
1. Generate state parameter on login
2. Verify state on callback
3. One-time use tokens
4. Secure session cookies
```

### API Security

```
1. Check session on every API call
2. Verify user has access to data
3. No sensitive data in URLs
4. HTTPS only (Vercel enforces)
5. No logging of tokens
```

## Deployment Architecture

### Development

```
Local machine
└── npm run dev
    └── http://localhost:3000 (Next.js dev server)
        ├── Hot module reloading
        ├── Source maps for debugging
        └── API routes at /api/*
```

### Production

```
GitHub Repository
└── git push origin main
    └── Vercel detects push
        └── Runs build: npm run build
            └── Creates .next/ directory
                └── Deploys to Edge Network
                    ├── 50+ regions globally
                    ├── Automatic scaling
                    ├── HTTPs with auto SSL
                    └── CDN caching
```

### Environment Variables

```
Development (.env.local):
- Used locally only
- Not committed to git
- Can be less secure

Production (Vercel):
- Set in Vercel dashboard
- Encrypted at rest
- Injected at deployment
- Different values per environment
```

---

This architecture is production-ready, scalable, and secure. All components follow Next.js 14 App Router best practices.
