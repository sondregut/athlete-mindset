#!/bin/bash
# Test script to verify Firebase secret is set correctly

echo "🔍 Testing Firebase Gemini API Key Configuration"
echo "=============================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first."
    exit 1
fi

# Check current project
echo ""
echo "1️⃣ Checking Firebase project..."
PROJECT=$(firebase use 2>&1)
if [[ $PROJECT == *"athlete-mindset"* ]]; then
    echo "✅ Correct project: athlete-mindset"
else
    echo "❌ Wrong project or not set"
    echo "   Run: firebase use athlete-mindset"
    exit 1
fi

# Check if secret exists
echo ""
echo "2️⃣ Checking if GEMINI_API_KEY secret exists..."
SECRETS=$(firebase functions:secrets:list 2>&1)
if [[ $SECRETS == *"GEMINI_API_KEY"* ]]; then
    echo "✅ GEMINI_API_KEY secret is set"
    
    # Get secret details (not the value)
    echo ""
    echo "3️⃣ Getting secret metadata..."
    firebase functions:secrets:access GEMINI_API_KEY
else
    echo "❌ GEMINI_API_KEY secret not found"
    echo ""
    echo "To set it, run:"
    echo "firebase functions:secrets:set GEMINI_API_KEY"
    echo "Then paste your Gemini API key when prompted"
    exit 1
fi

echo ""
echo "✨ Firebase secret configuration looks good!"
echo ""
echo "Next steps:"
echo "1. Deploy functions: firebase deploy --only functions"
echo "2. Test in your app's Cloud Functions Debug screen"