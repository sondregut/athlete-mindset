#!/bin/bash
# Quick deployment without prompts
echo "🚀 Deploying Firebase rules..."
firebase deploy --only firestore:rules,storage --force
echo "✅ Done! Check your app to verify permission errors are resolved."