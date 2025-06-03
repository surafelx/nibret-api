// Test admin authentication and token validation
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function testAdminAuth() {
  console.log('🧪 Testing Admin Authentication...\n');

  try {
    // Step 1: Login as admin
    console.log('1️⃣ Testing admin login...');
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
    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', JSON.stringify(loginData, null, 2));

    if (!loginResponse.ok) {
      console.log('❌ Admin login failed!');
      return;
    }

    if (!loginData.access_token) {
      console.log('❌ No access token received!');
      return;
    }

    console.log('✅ Admin login successful!');
    console.log('🔑 Token:', loginData.access_token.substring(0, 20) + '...');
    console.log('👤 User role:', loginData.user.role);
    console.log('📧 User email:', loginData.user.email);

    // Step 2: Test token validation with /accounts/users/me
    console.log('\n2️⃣ Testing token validation...');
    const meResponse = await fetch(`${API_BASE_URL}/accounts/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    const meData = await meResponse.json();
    console.log('Me response status:', meResponse.status);
    console.log('Me response:', JSON.stringify(meData, null, 2));

    if (!meResponse.ok) {
      console.log('❌ Token validation failed!');
      return;
    }

    console.log('✅ Token validation successful!');

    // Step 3: Test upload endpoint authentication
    console.log('\n3️⃣ Testing upload endpoint authentication...');
    
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
    formData.append('image', blob, 'test.png');

    const uploadResponse = await fetch(`${API_BASE_URL}/upload/image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${loginData.access_token}`
      },
      body: formData
    });

    const uploadData = await uploadResponse.json();
    console.log('Upload response status:', uploadResponse.status);
    console.log('Upload response:', JSON.stringify(uploadData, null, 2));

    if (uploadResponse.status === 401) {
      console.log('❌ Upload endpoint returned 401 Unauthorized!');
      console.log('🔍 This suggests the token is not being properly validated.');
      
      // Let's check what headers are being sent
      console.log('\n🔍 Debugging token format...');
      console.log('Token starts with:', loginData.access_token.substring(0, 10));
      console.log('Token length:', loginData.access_token.length);
      
      return;
    }

    if (uploadResponse.ok) {
      console.log('✅ Upload endpoint authentication successful!');
    } else {
      console.log('⚠️ Upload failed for other reasons (not auth)');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAdminAuth();
