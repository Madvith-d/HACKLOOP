# Server Configuration Guide

## Required Environment Variables

Create a `.env` file in the `server/` directory with the following configuration:

```env
# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/eglir_db

# JWT Secret for Authentication
JWT_SECRET=your_jwt_secret_here_change_this_in_production

# Server Configuration
PORT=4000
NODE_ENV=development

# Google Gemini API Key (IMPORTANT: Add this for AI responses)
# Get your API key from: https://makersuite.google.com/app/apikey
# Without this key, the system will use fallback responses
GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Getting Your Gemini API Key

### Why You Need It
The chat system uses Google's Gemini AI to provide intelligent, context-aware responses. Without the API key, the system will use rule-based fallback responses.

### How to Get It

1. **Visit Google AI Studio**: https://makersuite.google.com/app/apikey
2. **Sign in** with your Google account
3. **Create API Key**: Click "Create API Key"
4. **Copy the key**: Copy the generated API key
5. **Add to .env**: Paste it in your `.env` file:
   ```
   GOOGLE_GEMINI_API_KEY=AIzaSy...your_key_here
   ```
6. **Restart server**: Stop and restart your Node.js server

### Verifying It Works

After restarting the server, check the logs for:
- ✅ `Gemini model initialized and tested successfully` - Working!
- ❌ `Gemini model initialization test failed` - API key is invalid
- ⚠️ `GOOGLE_GEMINI_API_KEY not set` - API key is missing

### Free Tier Limits

Google Gemini API offers a generous free tier:
- **60 requests per minute**
- **1,500 requests per day**
- No credit card required

This is usually sufficient for development and small-scale testing.

## Optional Environment Variables

### Email Notifications (Optional)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
```

### SMS Notifications (Optional)
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### Session Configuration (Optional)
```env
SESSION_SECRET=your_session_secret_here
```

## Security Best Practices

1. **Never commit .env file**: Add `.env` to `.gitignore`
2. **Use strong secrets**: Generate random strings for JWT_SECRET and SESSION_SECRET
3. **Rotate API keys**: Regularly rotate your Gemini API key in production
4. **Use environment-specific files**: 
   - `.env.development` for local development
   - `.env.production` for production (use secure vault services)

## Troubleshooting

### "Using fallback responses" in logs
- Check if `GOOGLE_GEMINI_API_KEY` is set in your `.env` file
- Verify the API key is valid (no extra spaces or quotes)
- Check your Google Cloud API quota

### "Gemini model initialization test failed"
- API key might be invalid or expired
- Check if you've exceeded your API quota
- Verify your Google Cloud project has Gemini API enabled

### Database connection errors
- Verify `DATABASE_URL` is correct
- Check if PostgreSQL is running
- Ensure database exists and credentials are correct

### CORS errors from frontend
- Add your frontend URL to `ALLOWED_ORIGINS`
- Example: `ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000`

## Running the Server

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run in production mode
npm start
```

## Environment-Specific Configuration

### Development
```env
NODE_ENV=development
PORT=4000
# Use local database
DATABASE_URL=postgresql://localhost:5432/eglir_dev
```

### Production
```env
NODE_ENV=production
PORT=4000
# Use production database (with SSL)
DATABASE_URL=postgresql://user:pass@prod-db.example.com:5432/eglir_prod?ssl=true
# Enable HTTPS only
FORCE_HTTPS=true
```

## Need Help?

If you're still having issues:
1. Check the server logs for detailed error messages
2. Review `CHAT_OPTIMIZATIONS.md` for recent changes
3. Ensure all dependencies are installed: `npm install`
4. Try with a fresh `.env` file based on this guide

