// Simple test script to verify auth endpoints
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

async function testAuth() {
  console.log('🧪 Testing Authentication Endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);

    // Test admin login
    console.log('\n2. Testing admin login...');
    const loginResponse = await fetch(`${API_BASE}/accounts/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: '0965789832',
        password: 'nibretadmin'
      })
    });

    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Admin login successful');
      console.log('   Token:', loginData.access_token ? 'Generated' : 'Missing');
      console.log('   User:', loginData.user ? `${loginData.user.first_name} ${loginData.user.last_name}` : 'Missing');
      
      // Test protected endpoint
      console.log('\n3. Testing protected endpoint...');
      const userResponse = await fetch(`${API_BASE}/accounts/users/me`, {
        headers: {
          'Authorization': `Bearer ${loginData.access_token}`
        }
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('✅ Protected endpoint accessible');
        console.log('   User data:', userData.user ? 'Retrieved' : 'Missing');
      } else {
        console.log('❌ Protected endpoint failed:', userResponse.status);
      }

    } else {
      const errorData = await loginResponse.json();
      console.log('❌ Admin login failed:', errorData.error || loginResponse.status);
    }

    // Test registration
    console.log('\n4. Testing user registration...');
    const testUser = {
      first_name: 'Test',
      last_name: 'User',
      email: `test${Date.now()}@example.com`,
      phone: `091${Math.floor(Math.random() * 10000000)}`,
      password: 'testpassword123'
    };

    const registerResponse = await fetch(`${API_BASE}/accounts/registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });

    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ User registration successful');
      console.log('   Token:', registerData.access_token ? 'Generated' : 'Missing');
      console.log('   User:', registerData.user ? `${registerData.user.first_name} ${registerData.user.last_name}` : 'Missing');
    } else {
      const errorData = await registerResponse.json();
      console.log('❌ User registration failed:', errorData.error || registerResponse.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the Express server is running on port 3000');
    console.log('   Run: cd nibret-express-api && npm run dev');
  }

  console.log('\n🏁 Authentication test completed!');
}

testAuth();
