// Test Cloudinary configuration
require('dotenv').config();

console.log('🧪 Testing Cloudinary Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('  CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME || '❌ Not set');
console.log('  CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY || '❌ Not set');
console.log('  CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Not set');
console.log();

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.log('❌ Cloudinary configuration incomplete!');
  console.log('');
  console.log('🔧 To fix this:');
  console.log('1. Go to https://cloudinary.com/console');
  console.log('2. Copy your API Secret from the dashboard');
  console.log('3. Update nibret-api/.env file:');
  console.log('   CLOUDINARY_API_SECRET=your-real-api-secret-here');
  console.log('');
  process.exit(1);
}

// Test Cloudinary connection
try {
  const cloudinary = require('cloudinary').v2;
  
  // Configure Cloudinary
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log('☁️  Testing Cloudinary connection...');
  
  // Test API connection
  cloudinary.api.ping()
    .then(result => {
      console.log('✅ Cloudinary connection successful!');
      console.log('📊 Response:', result);
      console.log('');
      console.log('🎉 Cloudinary is properly configured!');
      console.log('');
      console.log('🔧 Available features:');
      console.log('  ✅ Image upload');
      console.log('  ✅ Image transformation');
      console.log('  ✅ Image optimization');
      console.log('  ✅ Image deletion');
      console.log('');
      console.log('🚀 You can now restart your backend server.');
      console.log('   The "☁️ Cloudinary: Configured" message should appear.');
    })
    .catch(error => {
      console.log('❌ Cloudinary connection failed!');
      console.log('📋 Error details:', error.message);
      console.log('');
      console.log('🔧 Common issues:');
      console.log('  - Invalid API Secret');
      console.log('  - Incorrect Cloud Name');
      console.log('  - Invalid API Key');
      console.log('  - Network connectivity issues');
      console.log('');
      console.log('💡 Double-check your credentials at:');
      console.log('   https://cloudinary.com/console');
    });

} catch (error) {
  console.log('❌ Failed to load Cloudinary module!');
  console.log('📋 Error:', error.message);
  console.log('');
  console.log('🔧 To fix this:');
  console.log('   npm install cloudinary');
}
