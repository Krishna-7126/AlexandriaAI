# 🚀 Alexandria Frontend - Quick Start (5 Minutes)

**Start here to see everything working immediately!**

---

## Step 1: Ensure Backend is Running

```bash
# Terminal 1: Backend
cd z:\AI-Learning-Companion\backend
python -m uvicorn main:app --reload --port 8001
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8001
```

Wait until you see this before proceeding.

---

## Step 2: Install & Run Frontend

```bash
# Terminal 2: Frontend
cd z:\AI-Learning-Companion\frontend

# Install dependencies (only needed first time)
npm install

# Start development server
npm run dev
```

**Expected output:**
```
VITE v5.0.0  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  press h + enter to show help
```

---

## Step 3: Open in Browser

Open your browser and go to: **http://localhost:5173**

---

## Step 4: Create Account

1. Click "**Sign Up**"
2. Fill in the form:
   ```
   Username: testuser
   Email: test@example.com
   Password: Test123456!  (MUST have uppercase, lowercase, numbers)
   Full Name: Your Name (optional)
   Preferred Language: English
   ```
3. Check "I agree to the terms"
4. Click "**Create Account**"
5. Success! You're logged in! 🎉

---

## Step 5: See the Features

### Feature 1: User Profile
- Look at top-right corner of navbar
- You'll see your username and email

### Feature 2: Language Switcher
- Click the language dropdown in navbar (next to profile)
- Select a different language
- Preference is automatically saved

### Feature 3: Ingest Content
- Paste a YouTube URL in the input field
- Click "Analyze"
- Wait for processing (you'll see a loading spinner)

### Feature 4: Export
- After analysis completes, click "Export"
- Choose what to export (Summary/Notes/Quiz)
- Choose format (PDF/Markdown/Notion/Docs)
- Download file

### Feature 5: Logout & Session Persistence
- Click "Logout" button
- Redirected to login page
- Close browser completely
- Reopen http://localhost:5173
- **You're still logged in!** (token persisted)

---

## Verification Checklist

✅ **Auth System Working**
- [ ] Can create account
- [ ] Can login with credentials
- [ ] User profile shows in navbar
- [ ] Can logout

✅ **Language Support Working**
- [ ] Language dropdown appears in navbar
- [ ] Can select different languages
- [ ] Preference persists after page reload

✅ **API Integration Working**
- [ ] Can ingest videos
- [ ] Can view analysis
- [ ] Can export content
- [ ] No "401 Unauthorized" errors in console

✅ **User Scoping Working**
- [ ] Create 2nd account (different email)
- [ ] Login as first user → save video
- [ ] Logout, login as second user → library is empty
- [ ] Login as first user → saved video appears

---

## Troubleshooting

### "Cannot GET /" (blank page)
```
Backend is not running!
→ Go to Terminal 1 and start backend (see Step 1)
```

### "Cannot connect to backend"
```
Check .env.local file has:
VITE_API_BASE_URL=http://127.0.0.1:8001

If backend is on different port, update this value
```

### "401 Unauthorized" errors
```
Token is invalid. Clear and try again:
→ DevTools → Application → localStorage → Clear All
→ Refresh page and login again
```

### npm install fails
```
Delete node_modules and package-lock.json, then retry:
rm -rf node_modules package-lock.json
npm install
```

### Port 5173 already in use
```
Change port:
npm run dev -- --port 5174
```

---

## Next Steps After Quick Start

1. **Read the full documentation:**
   - [FRONTEND_SPECIFICATION.md](FRONTEND_SPECIFICATION.md) - Design system
   - [FRONTEND_SETUP_GUIDE.md](FRONTEND_SETUP_GUIDE.md) - Full setup guide
   - [FEATURES_DELIVERED.md](FEATURES_DELIVERED.md) - Feature details

2. **Explore the code:**
   - Check `frontend/src/context/AuthContext.jsx` - How JWT tokens work
   - Check `frontend/src/api/client.js` - How API calls include auth
   - Check `frontend/src/AppRouter.jsx` - How routes are protected

3. **Test in browser DevTools:**
   - F12 → Application tab
   - Look at localStorage
   - See `alexandria_token` (JWT)
   - See `alexandria_user` (user info)

4. **Production deployment:**
   - `npm run build` - Creates optimized dist folder
   - Deploy dist folder to Vercel, Netlify, or your server
   - Update VITE_API_BASE_URL to production backend URL

---

## Environment Variables

Create a `.env.local` file in `frontend/` folder:

```env
# Development (default)
VITE_API_BASE_URL=http://127.0.0.1:8001
VITE_ENV=development

# Production (when deploying)
# VITE_API_BASE_URL=https://api.alexandria.com
# VITE_ENV=production
```

---

## Architecture at a Glance

```
User navigates to http://localhost:5173
        ↓
App checks localStorage for token
        ↓
No token → Show Login/Signup page
        ↓
User enters credentials → Backend validates
        ↓
Backend returns JWT token
        ↓
Frontend stores in localStorage
        ↓
Frontend includes token in all API requests
        ↓
Backend validates token → Grants access
        ↓
User sees personalized content (their videos, language, etc.)
```

---

## All Features Implemented ✅

- ✅ User signup with validation
- ✅ User login
- ✅ JWT token management
- ✅ Session persistence (localStorage)
- ✅ Multi-language support (12 languages)
- ✅ User scoping (all data personal to user)
- ✅ Export to PDF/Notion/Docs/Word
- ✅ Protected routes (can't access without login)
- ✅ User profile display
- ✅ Logout functionality
- ✅ Responsive mobile design
- ✅ Error handling
- ✅ Comprehensive documentation

---

## That's It! 🎉

You now have a fully functional, production-ready frontend with:
- Complete authentication
- Multi-language support
- Export functionality
- User-scoped personalization
- Professional design

**Any questions?** Check the three documentation files or read the code!

---

**Happy learning! 📚**

