#!/bin/bash

# 🚀 Phase 2 Quick Setup Script
# Run this from the nirnai project root

echo "🚀 Starting Phase 2 Setup..."
echo ""

# 1. Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install pdf-parse multer @google-cloud/translate
npm install --save-dev @types/multer @types/pdf-parse

# 2. Create directories
echo "📁 Creating upload directories..."
mkdir -p uploads/pdfs
mkdir -p src/services
mkdir -p src/routes/pdf
mkdir -p src/controllers
mkdir -p config

# 3. Add environment variables
echo "⚙️  Adding environment variables..."
cat >> .env << 'EOF'

# Phase 2: PDF Processing
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./config/google-cloud-key.json
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads/pdfs
EOF

echo ""
echo "✅ Phase 2 Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update GOOGLE_CLOUD_PROJECT_ID in backend/.env"
echo "2. Download Google Cloud service account key to backend/config/google-cloud-key.json"
echo "3. Review PHASE2_IMPLEMENTATION_GUIDE.md for complete implementation"
echo "4. Create database schema files from the guide"
echo "5. Run: npm run db:generate && npm run db:migrate"
echo ""
echo "📚 Full guide available at: PHASE2_IMPLEMENTATION_GUIDE.md"
