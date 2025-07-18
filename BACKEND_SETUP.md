# Backend Setup Guide

## Quick Fix for Network Error

If you're seeing "Network request failed" errors, follow these steps:

### 1. Find Your Computer's IP Address

Run this command in your project directory:
```bash
node scripts/find-ip-address.js
```

### 2. Update Your .env File

Replace the `EXPO_PUBLIC_BACKEND_URL` line with your IP address:
```env
# Change from:
EXPO_PUBLIC_BACKEND_URL=http://localhost:3000

# To (example - use YOUR IP):
EXPO_PUBLIC_BACKEND_URL=http://192.168.1.100:3000
```

### 3. Start the Backend Server

In a new terminal:
```bash
cd backend
npm install  # First time only
npm start
```

You should see:
```
Server running on port 3000
Environment check:
- OpenAI API Key: Set
- Redis URL: Using default
- AWS Configured: No
```

### 4. Restart Your Expo Server

**Important:** You must restart Expo after changing .env files!

```bash
# Stop the current server (Ctrl+C)
# Then restart:
bunx rork start -p z54qzr5766157j0974fjw --tunnel
```

## Troubleshooting

### Still Getting Network Errors?

1. **Check both devices are on same network**
   - Your computer and phone must be on the same WiFi network
   - Disable VPNs temporarily

2. **Check firewall settings**
   - Mac: System Preferences → Security & Privacy → Firewall
   - Windows: Allow Node.js through Windows Firewall
   - May need to allow port 3000

3. **Test the connection**
   - Open browser on your phone
   - Go to: `http://YOUR-IP:3000/health`
   - Should see: `{"status":"ok","timestamp":"..."}`

### Development Without Backend

The app now includes a mock mode for development. If the backend is unreachable in development mode, it will:
- Show a warning in the console
- Generate a simple mock visualization
- Allow you to test the UI flow

To force bypass backend (not recommended):
```env
EXPO_PUBLIC_BYPASS_BACKEND=true
```

## Backend Requirements

The backend server requires:
- Node.js 16+
- Redis (optional, will work without it)
- OpenAI API key (in backend/.env)

## Production Setup

For production, update the backend URL in `constants/backend-config.ts`:
```typescript
// Production mode - replace with your production API URL
return 'https://api.your-domain.com';
```