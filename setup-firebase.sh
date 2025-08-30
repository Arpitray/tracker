#!/bin/bash
# Firebase Setup Script for Windows (PowerShell)

echo "🔥 Firebase Setup for Habit Tracker"
echo "=================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "📦 Installing Firebase CLI..."
    npm install -g firebase-tools
fi

echo "🔐 Logging into Firebase..."
firebase login

echo "🚀 Initializing Firestore (if not done)..."
firebase init firestore --project default

echo "📋 Deploying Firestore rules..."
firebase deploy --only firestore:rules

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your Firebase config"
echo "2. Enable Authentication in Firebase Console"
echo "3. Test the app at http://localhost:5174/"
