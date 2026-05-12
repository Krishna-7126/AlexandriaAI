# 🚀 Alexandria v2.0 - Deployment Guide

**Complete guide to deploying Alexandria to production with all features working perfectly.**

---

## 📋 Pre-Deployment Checklist

### Security
- [ ] Generate new `SECRET_KEY`: `python -c "import secrets; print(secrets.token_urlsafe(32))"`
- [ ] Update `CORS_ORIGINS` to your domain
- [ ] Set strong database password
- [ ] Enable HTTPS for all URLs
- [ ] Rotate API keys if using test keys

### Dependencies
- [ ] All requirements installed: `pip install -r backend/requirements.txt`
- [ ] Node.js for frontend (optional): `npm install`
- [ ] Extension tested locally

### Configuration
- [ ] `.env` file created with production values
- [ ] Database credentials configured
- [ ] API keys obtained and tested:
  - ✅ Google Gemini (required)
  - ⚠️ AssemblyAI (optional)
  - ⚠️ Spotify (optional)
  - ⚠️ Notion (optional)

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────┐
│         Users (Web/Mobile/Ext)         │
└────────────────────┬────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
    [Browser]   [Extension]  [Mobile]
        │            │            │
        └────────────┼────────────┘
                     │ (HTTPS)
        ┌────────────▼────────────┐
        │   FastAPI Backend       │
        │  (Uvicorn + Gunicorn)  │
        └────────────┬────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
   [PostgreSQL]            [ChromaDB]
   (User Data)         (Embeddings)
```

---

## 1️⃣ Deploy to Heroku (Easy Option)

### Prerequisites
- Heroku account
- Heroku CLI installed
- GitHub repository

### Steps

#### 1. Create `Procfile` in root:
```
web: cd backend && gunicorn main:app --worker-class uvicorn.workers.UvicornWorker --workers 3 --bind 0.0.0.0:$PORT
```

#### 2. Create `runtime.txt`:
```
python-3.11.0
```

#### 3. Add Heroku PostgreSQL:
```bash
heroku addons:create heroku-postgresql:hobby-dev
```

#### 4. Deploy:
```bash
heroku login
heroku create alexandria-ai
git push heroku main
heroku config:set GOOGLE_API_KEY=your_key
heroku config:set SECRET_KEY=your_secret_key
```

#### 5. Set Environment Variables:
```bash
heroku config:set DATABASE_URL=postgresql://...
heroku config:set NOTION_API_KEY=your_key
# ... add other keys
```

#### 6. Verify:
```bash
heroku open
# Visit https://alexandria-ai.herokuapp.com/docs
```

---

## 2️⃣ Deploy to Railway (Recommended)

### Prerequisites
- Railway account
- GitHub repository

### Steps

#### 1. Create `railway.json`:
```json
{
  "build": {
    "builder": "nixpacks"
  },
  "deploy": {
    "startCommand": "cd backend && gunicorn main:app --worker-class uvicorn.workers.UvicornWorker"
  }
}
```

#### 2. Connect GitHub:
- Go to railway.app
- Click "New Project"
- Select "GitHub Repo"
- Select your repository
- Authorize Railway

#### 3. Add PostgreSQL Database:
- Click "+ Add Service"
- Select "PostgreSQL"
- Copy database URL

#### 4. Set Environment Variables:
- Click on service
- Go to "Variables"
- Add all from `.env.example`:
  - `GOOGLE_API_KEY`
  - `SECRET_KEY` (generate new)
  - `DATABASE_URL` (from PostgreSQL)
  - Other API keys

#### 5. Deploy:
- Commit and push to main branch
- Railway auto-deploys
- View logs in Railway dashboard

#### 6. Custom Domain (Optional):
- Go to Domains
- Add your domain
- Update DNS records

---

## 3️⃣ Deploy to AWS EC2 (Full Control)

### Prerequisites
- AWS account
- EC2 instance (Ubuntu 22.04)
- SSH access

### Steps

#### 1. Connect to Instance:
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
```

#### 2. Update System:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv postgres postgresql-contrib nginx supervisor
```

#### 3. Clone Repository:
```bash
cd /opt
sudo git clone https://github.com/your-repo/AI-Learning-Companion.git
sudo chown -R ubuntu:ubuntu AI-Learning-Companion
cd AI-Learning-Companion
```

#### 4. Setup Python Environment:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
pip install gunicorn
```

#### 5. Configure PostgreSQL:
```bash
sudo -u postgres createdb alexandria
sudo -u postgres createuser alexandria_user
```

#### 6. Create `.env`:
```bash
nano backend/.env
# Paste your configuration
```

#### 7. Setup Gunicorn:
Create `/etc/systemd/system/alexandria.service`:
```ini
[Unit]
Description=Alexandria API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/opt/AI-Learning-Companion
ExecStart=/opt/AI-Learning-Companion/venv/bin/gunicorn \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8001 \
    backend.main:app

[Install]
WantedBy=multi-user.target
```

#### 8. Enable Service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable alexandria
sudo systemctl start alexandria
```

#### 9. Configure Nginx:
Create `/etc/nginx/sites-available/alexandria`:
```nginx
upstream alexandria_app {
    server 127.0.0.1:8001;
}

server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://alexandria_app;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 10. Enable Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/alexandria /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### 11. Setup SSL (Let's Encrypt):
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 4️⃣ Deploy Extension to Chrome Web Store

### Steps

#### 1. Create Developer Account:
- Visit chromewebstore.google.com
- Pay $5 registration fee
- Complete your profile

#### 2. Prepare Submission:
```bash
cd extension
zip -r alexandria.zip . -x "*.git*"
```

#### 3. Create Store Listing:
- Title: "Alexandria - AI Video Learning Companion"
- Category: Productivity
- Language: English
- Description: Copy from README
- Screenshots: Create 1280x800 screenshots

#### 4. Upload:
- Click "New item"
- Upload `alexandria.zip`
- Fill out store listing
- Add privacy policy link

#### 5. Submit for Review:
- Review terms
- Pay publishing fee
- Submit
- Wait for approval (usually 1-3 days)

#### 6. Update Extension:
Create `version.txt` with version number
Update `manifest.json` `version` field
Increment version for each update

---

## 🔒 Production Security

### Environment Variables
```env
# Change these!
SECRET_KEY=generate-new-secure-key-here
GOOGLE_API_KEY=keep-this-secret
ASSEMBLYAI_API_KEY=keep-this-secret

# Database
DATABASE_URL=postgresql://user:STRONG_PASSWORD@db-host/alexandria
# Never: postgresql://user:password@localhost/...

# CORS - restrict to your domain
CORS_ORIGINS=["https://yourdomain.com", "https://app.yourdomain.com"]

# Disable debug in production
DEBUG=0

# SSL/TLS - use HTTPS only
```

### Database Security
- [ ] Use PostgreSQL (not SQLite)
- [ ] Set strong password
- [ ] Enable SSL connections
- [ ] Regular backups: `pg_dump -U user alexandria > backup.sql`
- [ ] Restrict IP access

### API Security
- [ ] Rate limiting on `/auth` endpoints
- [ ] Request validation
- [ ] CORS properly configured
- [ ] HTTPS everywhere
- [ ] Keep dependencies updated

### Monitoring
```bash
# Log file location
/var/log/alexandria/api.log

# Monitor with:
tail -f /var/log/alexandria/api.log

# Or use:
# - DataDog
# - New Relic
# - Sentry (for error tracking)
```

---

## 📊 Performance Optimization

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_saved_videos_user_id ON saved_videos(user_id);
CREATE INDEX idx_exports_user_id ON exports(user_id);
```

### Backend Optimization
- [ ] Use Gunicorn with 3-4 workers
- [ ] Enable caching for summaries
- [ ] Use Redis for sessions
- [ ] Implement pagination for large result sets
- [ ] Add compression

### Frontend Optimization
- [ ] Minify CSS/JS
- [ ] Image optimization
- [ ] Lazy loading
- [ ] CDN for static assets

---

## 🆘 Monitoring & Maintenance

### Health Checks
```bash
# Check API health
curl https://yourdomain.com/ping

# Check database connection
psql -h db-host -U user -d alexandria -c "SELECT 1"
```

### Logging
```python
# Add to main.py for better logging
import logging
logging.basicConfig(level=logging.INFO)
```

### Automated Backups
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U user alexandria > /backups/alexandria_$DATE.sql
# Upload to S3 or other storage
```

### Updates
```bash
# Update dependencies
pip install -r backend/requirements.txt --upgrade

# Restart service
sudo systemctl restart alexandria

# Check status
sudo systemctl status alexandria
```

---

## 🔗 DNS Configuration

### A Records
```
yourdomain.com    A    your-ip-address
app.yourdomain.com CNAME yourdomain.com
api.yourdomain.com CNAME yourdomain.com
```

### MX Records (if sending emails)
```
yourdomain.com MX 10 mail.yourdomain.com
```

---

## 🚨 Troubleshooting Deployment

### Backend won't start
```bash
# Check logs
sudo journalctl -u alexandria -n 50

# Test configuration
python backend/models.py
```

### Database connection error
```bash
# Test connection
psql -h localhost -U user -d alexandria

# Check DATABASE_URL format
echo $DATABASE_URL
```

### Port already in use
```bash
# Kill process on port 8001
sudo lsof -ti:8001 | xargs kill -9

# Or use different port
gunicorn --bind 0.0.0.0:8001 ...
```

### Permission denied errors
```bash
# Fix ownership
sudo chown -R ubuntu:ubuntu /opt/AI-Learning-Companion

# Fix permissions
chmod -R 755 /opt/AI-Learning-Companion
```

---

## 📞 Support

- **Documentation**: See FEATURES.md
- **API Docs**: `/docs` endpoint
- **GitHub Issues**: [Your repo]
- **Email**: support@yourdomain.com

---

**Successfully deploy all features with confidence! 🚀**
