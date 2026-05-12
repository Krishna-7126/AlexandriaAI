# ⚡ Alexandria v2.0 - Quick Start (5 Minutes)

**Get Alexandria running locally with all new features in just 5 minutes!**

---

## 🎯 Quick Setup

### 1. Install Dependencies (1 min)

```bash
cd z:\AI-Learning-Companion\backend
pip install -r requirements.txt
```

### 2. Setup Environment (1 min)

```bash
# Windows
copy .env.example .env

# Add your API key:
# Open .env and set:
# GOOGLE_API_KEY=your_key_from_google_ai_studio
```

**Get GOOGLE_API_KEY:**
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Paste in `.env`

### 3. Start Backend (1 min)

```bash
# From: z:\AI-Learning-Companion\
python -m uvicorn backend.main:app --reload --port 8001
```

✅ Backend running at: `http://localhost:8001`  
✅ API Docs at: `http://localhost:8001/docs`

### 4. Load Extension (1 min)

```bash
# Open Chrome
chrome://extensions/

# Enable "Developer mode" (top right)
# Click "Load unpacked"
# Select: z:\AI-Learning-Companion\extension
# Done!
```

### 5. Test Everything (1 min)

Visit `http://localhost:8001/docs` in browser and try:
- ✅ `POST /auth/signup` - Create account
- ✅ `POST /auth/login` - Login
- ✅ `GET /auth/me` - Get current user
- ✅ Go to YouTube and click the Alexandria button!

---

## 🔑 API Key Setup

### Google Gemini (Required)
```
1. Go: https://aistudio.google.com/app/apikey
2. Create API Key
3. Add to .env: GOOGLE_API_KEY=sk_...
```

### Spotify (Optional)
```
1. Go: https://developer.spotify.com/dashboard
2. Create app
3. Get Client ID & Secret
4. Add to .env
```

### Notion (Optional)
```
1. Go: https://www.notion.com/my-integrations
2. Create integration
3. Get API key
4. Add to .env
```

---

## 🚀 Try Features

### 1. Authentication
```bash
# Open: http://localhost:8001/docs
# Click: POST /auth/signup
# Fill:
{
  "username": "testuser",
  "email": "test@example.com",
  "password": "TestPass123",
  "full_name": "Test User"
}
# Click Execute
# Copy the access_token
```

### 2. Use Token
```bash
# Click: GET /auth/me
# Scroll to "Authorize"
# Paste: Bearer <your_token_here>
# Try it out!
```

### 3. YouTube Summary
```bash
1. Go to YouTube
2. Click Alexandria button (bottom left of video)
3. Sign in with same credentials
4. Click "Generate Summary"
5. Wait for summary!
```

### 4. Translate
```bash
1. In extension, go to "Tools" tab
2. Select language (e.g., "Spanish")
3. Click "Translate"
4. See translated summary!
```

### 5. Save Video
```bash
1. In extension, click "Save This Video"
2. Video saved to your library!
3. View at: GET /auth/saved-videos (in docs)
```

---

## 📁 Project Structure

```
z:\AI-Learning-Companion\
├── backend/
│   ├── main.py              ← API routes
│   ├── models.py            ← Database (NEW)
│   ├── auth.py              ← Security (NEW)
│   ├── auth_routes.py       ← Auth endpoints (NEW)
│   ├── features_routes.py   ← Export/Translate (NEW)
│   ├── requirements.txt     ← Dependencies (UPDATED)
│   └── utils/
│       ├── language_support.py      (NEW)
│       ├── streaming_platform.py    (NEW)
│       ├── export_handler.py        (NEW)
│       └── ... (others)
├── extension/
│   ├── manifest.json        ← Config (UPDATED)
│   ├── popup.js            ← Logic (UPDATED)
│   ├── popup-new.html      ← UI (NEW)
│   ├── background.js       ← Service worker (NEW)
│   ├── content.js          ← YouTube injection (NEW)
│   └── ...
├── frontend/               ← React app
├── FEATURES.md            ← Complete feature guide (NEW)
├── DEPLOYMENT.md          ← Production deploy (NEW)
├── .env.example           ← Config template (UPDATED)
└── README.md              ← Main docs
```

---

## ⚡ Common Commands

```bash
# Start backend
python -m uvicorn backend.main:app --reload --port 8001

# Test API
curl http://localhost:8001/ping

# Check database
sqlite3 alexandria.db ".tables"

# View API docs
open http://localhost:8001/docs

# Stop server
Ctrl+C

# See logs
# (Just look at console output)
```

---

## 🔐 Create Account (Step by Step)

### In Browser
```
1. Go to: http://localhost:8001/docs
2. Scroll to: POST /auth/signup
3. Click "Try it out"
4. Enter:
{
  "username": "myname",
  "email": "me@example.com",
  "password": "MyPassword123",
  "full_name": "My Name"
}
5. Click "Execute"
6. Copy the "access_token" from response
```

### In Extension
```
1. Click Alexandria icon (bottom left)
2. Click "Sign Up" tab
3. Enter same info:
   - Username: myname
   - Email: me@example.com
   - Password: MyPassword123
   - Full Name: My Name
4. Click "Create Account"
5. Done! Auto-logged in
```

---

## 🎬 YouTube Integration

### First Time
1. Go to any YouTube video
2. Wait for page to load
3. Look for **"📚 Summarize"** button
4. Click it!
5. Sign in (if not already)
6. Click "Generate Summary"
7. Wait ~10 seconds

### What You Can Do
- ✅ Generate AI summary
- ✅ Ask questions about video
- ✅ Translate to 12 languages
- ✅ Export to Notion/Word/Markdown
- ✅ Save to library
- ✅ Add Spotify/podcast links

---

## 🆘 Troubleshooting

### Backend won't start
```
Error: "Address already in use"
Solution: Kill process on port 8001
  - Windows: netstat -ano | findstr :8001
           : taskkill /PID <pid> /F
```

### Can't find API key
```
Error: "GOOGLE_API_KEY not set"
Solution:
  1. Make sure .env file exists
  2. Verify GOOGLE_API_KEY=sk_... in .env
  3. Restart backend
  4. Check: echo $env:GOOGLE_API_KEY (PowerShell)
```

### Extension button not showing
```
Solution:
  1. Refresh YouTube page (Ctrl+R)
  2. Check chrome://extensions/ - is it enabled?
  3. Check console (F12) for errors
  4. Reload extension
```

### Login not working
```
Solution:
  1. Check .env has SECRET_KEY set
  2. Make sure you signed up first
  3. Verify email/password match exactly
  4. Try in API docs first (/docs)
```

---

## 📊 What's New in v2.0

| Feature | Before | Now |
|---------|--------|-----|
| YouTube Only | ✅ | ✅ + Spotify + Podcast |
| Public Access | ✅ | ✅ + User Accounts |
| English Only | ✅ | ✅ + 12 Languages |
| Browser Only | ✅ | ✅ + Chrome Extension |
| Local Summaries | ✅ | ✅ + Export to Notion |
| Q&A Chat | ✅ | ✅ + Session Memory |
| One Endpoint | ✅ | ✅ + 25 New Endpoints |

---

## 🎓 Next Steps

1. **Explore API** → http://localhost:8001/docs
2. **Read Docs** → FEATURES.md
3. **Deploy** → DEPLOYMENT.md
4. **Submit Extension** → Chrome Web Store

---

## 💡 Tips & Tricks

### Use Localhost for Extension
```
In extension popup, click ⚙️ to set API:
http://localhost:8001
```

### Export to Notion
```
Requires:
1. NOTION_API_KEY in .env
2. NOTION_DATABASE_ID in .env
Then use: POST /features/export/summary
```

### Translate Without Summary
```
POST /features/translate
{
  "text": "Any text here",
  "target_language": "es"
}
Returns Spanish translation!
```

---

## 📞 Having Issues?

1. **Check logs** → Look at backend console output
2. **Test endpoint** → Use `/docs` interface
3. **Check .env** → Make sure API keys are set
4. **Restart backend** → Kill and restart the server
5. **Read docs** → See FEATURES.md

---

**You're all set! 🎉 Enjoy Alexandria v2.0!**

