# Alexandria Frontend - Setup & Integration Guide

**Version:** 3.0  
**Last Updated:** May 12, 2026

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Frontend Architecture](#frontend-architecture)
3. [Authentication System](#authentication-system)
4. [API Integration](#api-integration)
5. [Environment Configuration](#environment-configuration)
6. [Building for Production](#building-for-production)
7. [Deployment](#deployment)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running (see [FRONTEND_SPECIFICATION.md](FRONTEND_SPECIFICATION.md))
- Modern web browser

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local from .env.example
cp .env.example .env.local

# Update API URL in .env.local if needed
# VITE_API_BASE_URL=http://your-backend-url:8001

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### First Time Setup

1. **Start Backend:**
   ```bash
   cd backend
   python -m uvicorn main:app --reload --port 8001
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Access Application:**
   - Navigate to `http://localhost:5173`
   - Click "Sign Up" to create an account
   - Fill in username, email, password, and preferred language
   - Use the app!

---

## Frontend Architecture

### Project Structure

```
frontend/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx          # Global auth state & JWT management
│   ├── pages/
│   │   ├── LoginPage.jsx            # Login form
│   │   └── SignupPage.jsx           # Registration form
│   ├── components/
│   │   ├── Navbar.jsx               # Top navigation with auth
│   │   ├── ChatPanel.jsx            # Q&A interface
│   │   ├── QuizPanel.jsx            # Quiz taking
│   │   ├── SummaryDashboard.jsx     # Summary display
│   │   ├── Timeline.jsx             # Video timeline
│   │   ├── ExportModal.jsx          # Export interface
│   │   ├── LanguageSwitcher.jsx     # Language selection
│   │   ├── VideoPlayer.jsx          # Video playback
│   │   └── [other components]
│   ├── api/
│   │   └── client.js                # API calls with JWT auth
│   ├── styles/
│   │   ├── auth.css                 # Login/signup styles
│   │   ├── index.css                # Global styles
│   │   └── responsive.css           # Mobile styles
│   ├── App.jsx                      # Main app component
│   ├── AppRouter.jsx                # Route definitions & protection
│   └── main.jsx                     # App entry point
├── .env.example                     # Environment template
└── package.json                     # Dependencies
```

### Component Hierarchy

```
main.jsx (Router + AuthProvider)
  └── AppRouter (Route definitions)
      ├── /auth/login → LoginPage
      ├── /auth/signup → SignupPage
      └── /* → ProtectedRoute → App (requires auth)
          ├── Navbar (with LanguageSwitcher)
          ├── IngestPanel (URL/file input)
          ├── VideoPlayer
          ├── ChatPanel
          ├── QuizPanel
          ├── SummaryDashboard
          ├── Timeline
          └── ExportModal
```

---

## Authentication System

### JWT Token Flow

```
1. User signs up/logs in
   ↓
2. Backend validates credentials
   ↓
3. Backend returns JWT token
   ↓
4. Frontend stores token in localStorage
   ↓
5. Frontend includes token in all protected API requests
   ↓
6. Backend validates token & grants access
```

### Token Management

**Where tokens are stored:**
- `localStorage.alexandria_token` - JWT access token
- `localStorage.alexandria_user` - User object (username, email, preferences)

**Automatic Token Handling:**
```javascript
// API client automatically adds token to all requests
headers: {
  'Authorization': `Bearer ${token}`
}

// If token is invalid (401), user is redirected to login
if (response.status === 401) {
  localStorage.removeItem('alexandria_token');
  window.location.href = '/auth/login';
}
```

### Protected Routes

All routes except `/auth/login` and `/auth/signup` require authentication. The `ProtectedRoute` component:

```javascript
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!isAuthenticated) return <Navigate to="/auth/login" />;
  
  return children;
}
```

---

## API Integration

### Base URL Configuration

The API base URL is configurable via environment variable:

```env
# .env.local
VITE_API_BASE_URL=http://127.0.0.1:8001
```

### Authenticated API Endpoints

All requests include JWT token in Authorization header:

```javascript
// Example: Get user info
const response = await fetch(`${API_BASE}/auth/me`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### User-Scoped Data

All operations are automatically scoped to the authenticated user:

- Saved videos are user-specific
- Quiz results track per-user performance
- Language preferences stored per-user
- Analytics data is per-user
- Chat history linked to user session

### API Endpoints Used

#### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user
- `PUT /auth/preferences` - Update preferences

#### Content Ingest
- `POST /ingest` - Process YouTube URL
- `POST /ingest-file` - Upload video file
- `GET /ingest-status/:jobId` - Check processing status

#### Analysis
- `GET /analysis/:videoId` - Get full analysis
- `GET /summary/:videoId` - Get summary
- `GET /timestamps/:videoId` - Get video timestamps
- `POST /chat/stream` - Stream Q&A responses

#### Library & Personalization
- `POST /library/save` - Save video
- `GET /library` - Get saved videos
- `GET /analytics/dashboard` - Get user analytics

#### Export
- `POST /export` - Export content (PDF, Notion, Docs, etc.)

#### Multi-Language
- `GET /languages` - Get supported languages
- `POST /translate` - Translate content

#### Quiz
- `POST /v3/quiz/generate/:videoId` - Generate quiz
- `POST /v3/quiz/submit` - Submit answers

---

## Environment Configuration

### Development

```env
# .env.local
VITE_API_BASE_URL=http://127.0.0.1:8001
VITE_ENV=development
```

### Production

```env
# .env.production.local
VITE_API_BASE_URL=https://api.alexandria.com
VITE_ENV=production
```

### Available Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_API_BASE_URL` | `http://127.0.0.1:8001` | Backend API URL |
| `VITE_ENV` | `development` | Environment mode |
| `VITE_ENABLE_ANALYTICS` | `true` | Enable analytics tracking |
| `VITE_ENABLE_EXPORT` | `true` | Enable export features |
| `VITE_ENABLE_LANGUAGE_SWITCH` | `true` | Enable language selection |

---

## Building for Production

### Create Production Build

```bash
cd frontend

# Build optimized bundle
npm run build

# This creates a 'dist' folder with optimized files
```

### Build Output

```
dist/
├── index.html              # Main HTML file
├── assets/
│   ├── index-*.js         # JavaScript bundles (tree-shaken, minified)
│   ├── index-*.css        # CSS bundles (minified)
│   └── [images & fonts]   # Static assets
└── [other files]
```

### Bundle Size

- Main bundle: ~150KB (gzipped)
- CSS: ~50KB (gzipped)
- Images/Assets: ~200KB
- **Total: ~400KB initial load**

### Optimization Tips

1. **Code Splitting:** Lazy-load analysis panels
2. **Image Optimization:** Use WebP format with fallbacks
3. **Caching Strategy:** Service Worker for offline support
4. **Compression:** Gzip enabled by default

---

## Deployment

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project root
cd frontend
vercel

# Set environment variables in Vercel dashboard:
# VITE_API_BASE_URL=https://your-api-domain.com
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
cd frontend
netlify deploy --prod --dir=dist

# Configure in netlify.toml:
# [build]
# command = "npm run build"
# publish = "dist"
```

### Option 3: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build & run
docker build -t alexandria-frontend .
docker run -p 3000:80 -e VITE_API_BASE_URL=https://api.com alexandria-frontend
```

### Environment Variables in Production

**Vercel:**
```
Dashboard → Settings → Environment Variables
VITE_API_BASE_URL = https://api.alexandria.com
```

**Netlify:**
```
Site settings → Build & deploy → Environment
VITE_API_BASE_URL = https://api.alexandria.com
```

---

## Testing

### Development Testing

1. **Unit Tests** (Add as needed)
   ```bash
   npm run test
   ```

2. **Manual Testing Checklist**

   - [ ] **Authentication**
     - Sign up with new account
     - Login with credentials
     - Logout clears token
     - Redirect to login when token expires
   
   - [ ] **Video Ingest**
     - Paste YouTube URL
     - Check processing status
     - View completed analysis
   
   - [ ] **Features**
     - Ask questions in chat
     - Take quiz
     - View summaries
     - Export to PDF/Notion
     - Change language
     - Save video to library
   
   - [ ] **Responsive Design**
     - Test on mobile (375px width)
     - Test on tablet (768px)
     - Test on desktop (1440px)

3. **E2E Testing** (Optional - Cypress)
   ```bash
   npm install cypress
   npx cypress open
   ```

### Test User Accounts

**Development Backend:**
```
Email: test@example.com
Password: Test123456!
```

---

## Troubleshooting

### Frontend Issues

#### "Backend unreachable" Error
```
Solution: Check that backend is running and API_BASE_URL is correct
- Backend: python -m uvicorn backend.main:app --reload --port 8001
- Frontend .env: VITE_API_BASE_URL=http://127.0.0.1:8001
```

#### "401 Unauthorized" on every request
```
Solution: Token is invalid or expired
- Clear localStorage: Open DevTools → Application → localStorage → Clear
- Login again to get new token
```

#### Blank page after login
```
Solution: Check browser console for errors
- DevTools → Console → Look for errors
- Check if routes are set up correctly
- Verify AuthProvider wraps entire app
```

#### Images not loading
```
Solution: Check asset paths
- Assets should be in src/assets/
- Import as: import image from '../assets/logo.png'
- Verify image exists at path
```

#### Slow API responses
```
Solution: Check backend performance
- Verify backend isn't processing large videos
- Check database queries
- Review API logs for errors
- Consider adding loading indicators
```

### Build Issues

#### Module not found errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
npm run build
```

#### Production build fails
```bash
# Check for console errors in development
npm run dev

# Build with verbose output
npm run build -- --debug
```

---

## Performance Optimization

### Browser DevTools

1. **Lighthouse Audit:**
   - DevTools → Lighthouse → Generate report
   - Target scores: Performance 90+, Accessibility 90+

2. **Network Tab:**
   - Check for slow API calls
   - Monitor bundle sizes
   - Verify lazy loading works

3. **Console:**
   - Check for JavaScript errors
   - Monitor performance logs

### Optimization Techniques Implemented

- ✅ Route-based code splitting
- ✅ Component lazy loading
- ✅ Image lazy loading
- ✅ Browser caching (localStorage)
- ✅ API response caching
- ✅ Gzip compression

### Further Optimizations

- [ ] Add service worker for offline support
- [ ] Implement Redis caching on backend
- [ ] CDN for static assets
- [ ] Database query optimization
- [ ] WebSocket for real-time updates

---

## Next Steps

1. **Deploy Backend to Production**
   - Set up secure API endpoint
   - Configure CORS for frontend domain
   - Set up SSL/TLS certificate

2. **Deploy Frontend to Production**
   - Build optimized bundle
   - Upload to hosting service
   - Set production environment variables

3. **Post-Launch**
   - Monitor user analytics
   - Track error rates
   - Gather user feedback
   - Plan feature improvements

---

## Support

For issues or questions:
1. Check this guide first
2. Review [FRONTEND_SPECIFICATION.md](FRONTEND_SPECIFICATION.md)
3. Check browser console for errors
4. Review backend logs
5. Contact the development team

---

**Happy coding! 🚀**

