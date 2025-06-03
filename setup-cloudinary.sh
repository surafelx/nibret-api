#!/bin/bash

echo "☁️  Cloudinary Setup for Nibret Platform"
echo "========================================"
echo

echo "📋 Current Configuration:"
echo "  Cloud Name: $(grep CLOUDINARY_CLOUD_NAME .env | cut -d'=' -f2)"
echo "  API Key: $(grep CLOUDINARY_API_KEY .env | cut -d'=' -f2)"
echo "  API Secret: $(grep CLOUDINARY_API_SECRET .env | cut -d'=' -f2)"
echo

echo "🔑 To get your Cloudinary API Secret:"
echo "1. Go to: https://cloudinary.com/console"
echo "2. Log in to your account"
echo "3. Copy your API Secret from the dashboard"
echo

read -p "Enter your Cloudinary API Secret: " api_secret

if [ -z "$api_secret" ]; then
    echo "❌ No API Secret provided. Exiting..."
    exit 1
fi

# Update the .env file
sed -i.bak "s/CLOUDINARY_API_SECRET=.*/CLOUDINARY_API_SECRET=$api_secret/" .env

echo "✅ Updated .env file with your API Secret"
echo

echo "🧪 Testing Cloudinary connection..."
node test-cloudinary.js

if [ $? -eq 0 ]; then
    echo
    echo "🎉 Cloudinary is now configured!"
    echo "🚀 You can restart your backend server:"
    echo "   npm start"
    echo
    echo "✨ The server will now show: ☁️ Cloudinary: Configured"
else
    echo
    echo "❌ Configuration test failed."
    echo "💡 Please double-check your API Secret and try again."
fi
