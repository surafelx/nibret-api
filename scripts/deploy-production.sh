#!/bin/bash

# Deployment script for production
echo "🚀 Deploying Nibret API to Production..."

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo "❌ .env.production file not found!"
    echo "Please create .env.production with your production environment variables."
    exit 1
fi

# Copy production environment file
echo "📋 Using production environment variables..."
cp .env.production .env

# Install dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Run database migrations if needed
echo "🗄️  Checking database connection..."
node -e "
const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
"

if [ $? -ne 0 ]; then
    echo "❌ Database connection failed! Please check your MONGODB_URI"
    exit 1
fi

# Create logs directory
mkdir -p logs

# Start the application with PM2 (if available) or node
if command -v pm2 &> /dev/null; then
    echo "🔄 Starting application with PM2..."
    pm2 stop nibret-api 2>/dev/null || true
    pm2 start src/app.js --name "nibret-api" --env production
    pm2 save
    echo "✅ Application started with PM2"
    echo "📊 PM2 status:"
    pm2 status
else
    echo "⚠️  PM2 not found. Starting with node..."
    echo "💡 Consider installing PM2 for production: npm install -g pm2"
    NODE_ENV=production node src/app.js &
    echo "✅ Application started with node"
fi

echo ""
echo "🎉 Deployment completed!"
echo "🌐 API should be running on port ${PORT:-3000}"
echo "🔍 Health check: curl http://localhost:${PORT:-3000}/health"
