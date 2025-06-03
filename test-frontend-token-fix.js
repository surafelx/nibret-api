// Test to verify frontend token fix
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function testTokenFix() {
  console.log('🧪 Testing Frontend Token Fix...\n');

  try {
    // Step 1: Login as admin to get token
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await fetch(`${API_BASE_URL}/accounts/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME || '0965789832',
        password: process.env.ADMIN_PASSWORD || 'nibretadmin'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok || !loginData.access_token) {
      console.log('❌ Admin login failed!');
      return;
    }

    console.log('✅ Admin login successful!');
    console.log('🔑 Token received:', loginData.access_token.substring(0, 20) + '...');

    // Step 2: Test image upload with the token (simulating frontend behavior)
    console.log('\n2️⃣ Testing image upload with token...');
    
    // Create a simple test image (1x1 pixel PNG)
    const testImageBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, 0x00, 0x00, 0x00,
      0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x5C, 0xC2, 0x8A, 0x8B, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
    ]);

    const formData = new FormData();
    const blob = new Blob([testImageBuffer], { type: 'image/png' });
    formData.append('image', blob, 'test-frontend-fix.png');

    const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.access_token}`
      },
      body: formData
    });

    const uploadData = await uploadResponse.json();
    console.log('Upload response status:', uploadResponse.status);
    
    if (uploadResponse.ok) {
      console.log('✅ Image upload successful!');
      console.log('📸 Image URL:', uploadData.data.secure_url);
      console.log('🆔 Public ID:', uploadData.data.public_id);
      console.log('📊 Image details:', {
        format: uploadData.data.format,
        bytes: uploadData.data.bytes,
        width: uploadData.data.width,
        height: uploadData.data.height
      });
      
      // Test different image sizes
      console.log('\n📐 Available image transformations:');
      Object.entries(uploadData.data.urls).forEach(([size, url]) => {
        console.log(`  ${size}: ${url}`);
      });
      
      console.log('\n🎉 Frontend token fix verified!');
      console.log('💡 The frontend should now be able to upload images successfully.');
      
    } else {
      console.log('❌ Image upload failed!');
      console.log('📋 Error:', uploadData);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testTokenFix();
