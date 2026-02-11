# Environment Configuration Guide

## Backend Environment Variables

Create a `.env` file in the `backend` directory with the following configuration:

```env
# JWT Secret Key - Change this in production!
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345

# JWT Expiration (7 days)
JWT_EXPIRES_IN=7d

# Server Port
PORT=3000

# PostgreSQL Database (Neon)
# Format: postgresql://[user]:[password]@[host]:5432/[database]
NEON_DATABASE_URL=your-neon-database-url-here
# Alternative
DATABASE_URL=your-database-url-here

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:5173

# ============================================
# AGORA VIDEO CONFIGURATION
# ============================================
AGORA_APP_ID=1fcd8b4f1a8e4acba5b73180672b37a0
AGORA_APP_CERTIFICATE=0d418e161d764f35b8f82cf4f92ce1fc

# ============================================
# EMAIL CONFIGURATION (SMTP)
# ============================================
# Gmail Example:
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

# For Gmail, generate an App Password:
# 1. Go to Google Account Settings
# 2. Security → 2-Step Verification → App Passwords
# 3. Generate a new app password for "Mail"
# 4. Use that 16-character password as EMAIL_PASS

# Other SMTP providers:
# SendGrid: smtp.sendgrid.net (Port 587)
# Mailgun: smtp.mailgun.org (Port 587)
# Outlook: smtp-mail.outlook.com (Port 587)
```

---

## Database Migration

After configuring your `.env`, run the database migration:

```bash
cd backend
node migrations/update_interviews_schema.js
```

This will:
- Add new columns to the `interviews` table
- Create performance indexes
- Migrate existing data if any

---

## Testing Email Configuration

You can test the email service after starting the backend:

```bash
npm start
```

Then use the "Send Email" button in the Interviews page. Check the backend console for email confirmation logs.

---

## Security Notes

> **CRITICAL**: Never commit `.env` to version control!

The `.gitignore` already includes `.env`, but double-check:

```bash
cat .gitignore | grep .env
```

Should output: `.env`

---

## Troubleshooting

### Agora Video Issues
- **Error: "Invalid App ID"**: Check `AGORA_APP_ID` in `.env`
- **Error: "Token expired"**: Tokens expire after 1 hour. Leave and rejoin the interview.
- **No video/audio**: Check browser permissions for camera/microphone

### Email Issues
- **Error: "Email service not configured"**: Verify `EMAIL_USER` and `EMAIL_PASS` are set
- **Gmail error "Less secure app access"**: Use an App Password instead of your main password
- **Email not received**: Check spam folder, verify recipient email

### Database Issues
- **Error: "Database connection string is not defined"**: Set `NEON_DATABASE_URL` or `DATABASE_URL`
- **Migration fails**: Ensure database is accessible and you have write permissions
