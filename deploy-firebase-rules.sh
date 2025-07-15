#!/bin/bash

# Deploy Firebase Rules Script
# This script deploys the updated Firestore and Storage rules to fix permission errors

echo "🚀 Starting Firebase Rules Deployment..."
echo ""

# Check if we're in the right directory
if [ ! -f "firestore.rules" ]; then
    echo "❌ Error: firestore.rules not found!"
    echo "Please run this script from the project root directory."
    exit 1
fi

# Display current project
echo "📱 Current Firebase Project:"
firebase use
echo ""

# Ask for confirmation
echo "⚠️  This will deploy NEW security rules to your Firebase project."
echo "   Project: athlete-mindset"
echo ""
read -p "Do you want to continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 1
fi

echo ""
echo "🔄 Deploying Firestore rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Firestore rules deployed successfully!"
else
    echo "❌ Firestore rules deployment failed!"
    exit 1
fi

echo ""
echo "🔄 Deploying Storage rules..."
firebase deploy --only storage

if [ $? -eq 0 ]; then
    echo "✅ Storage rules deployed successfully!"
else
    echo "❌ Storage rules deployment failed!"
    exit 1
fi

echo ""
echo "🎉 All rules deployed successfully!"
echo ""
echo "✅ Next steps:"
echo "   1. Test your app to ensure permission errors are resolved"
echo "   2. Check Firebase Console to verify the rules are active"
echo "   3. Monitor logs for any remaining issues"
echo ""
echo "📝 What was fixed:"
echo "   - Added permissions for check-ins collection"
echo "   - Simplified TTS cache permissions"
echo "   - Added catch-all rule for authenticated users"
echo ""