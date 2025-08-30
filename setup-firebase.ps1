# Firebase Setup Script for Windows PowerShell
Write-Host "🔥 Firebase Setup for Habit Tracker" -ForegroundColor Yellow
Write-Host "==================================" -ForegroundColor Yellow

# Check if Firebase CLI is installed
$firebaseExists = Get-Command firebase -ErrorAction SilentlyContinue
if (-not $firebaseExists) {
    Write-Host "📦 Installing Firebase CLI..." -ForegroundColor Blue
    npm install -g firebase-tools
}

Write-Host "🔐 Logging into Firebase..." -ForegroundColor Blue
firebase login

Write-Host "🚀 Initializing Firestore..." -ForegroundColor Blue
firebase init firestore

Write-Host "📋 Deploying Firestore rules..." -ForegroundColor Blue
firebase deploy --only firestore:rules

Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Update .env.local with your Firebase config" -ForegroundColor White
Write-Host "2. Enable Authentication in Firebase Console" -ForegroundColor White
Write-Host "3. Test the app at http://localhost:5174/" -ForegroundColor White
