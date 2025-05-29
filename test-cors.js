// Test CORS configuration
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

async function testCORS() {
  console.log('🧪 Testing CORS Configuration...\n');

  try {
    // Test preflight request (OPTIONS)
    console.log('1. Testing preflight OPTIONS request...');
    const optionsResponse = await fetch(`${API_BASE}/accounts/login/`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      }
    });

    console.log('   Status:', optionsResponse.status);
    console.log('   CORS Headers:');
    console.log('   - Access-Control-Allow-Origin:', optionsResponse.headers.get('access-control-allow-origin'));
    console.log('   - Access-Control-Allow-Methods:', optionsResponse.headers.get('access-control-allow-methods'));
    console.log('   - Access-Control-Allow-Headers:', optionsResponse.headers.get('access-control-allow-headers'));
    console.log('   - Access-Control-Allow-Credentials:', optionsResponse.headers.get('access-control-allow-credentials'));

    // Test actual POST request with CORS headers
    console.log('\n2. Testing POST request with CORS...');
    const postResponse = await fetch(`${API_BASE}/accounts/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5173',
      },
      body: JSON.stringify({
        username: '0965789832',
        password: 'nibretadmin'
      })
    });

    console.log('   Status:', postResponse.status);
    console.log('   CORS Headers in Response:');
    console.log('   - Access-Control-Allow-Origin:', postResponse.headers.get('access-control-allow-origin'));
    console.log('   - Access-Control-Allow-Credentials:', postResponse.headers.get('access-control-allow-credentials'));

    if (postResponse.ok) {
      const data = await postResponse.json();
      console.log('   ✅ Login successful, token received:', !!data.access_token);
    } else {
      console.log('   ❌ Login failed:', postResponse.status);
    }

    // Test health endpoint
    console.log('\n3. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`, {
      headers: {
        'Origin': 'http://localhost:5173',
      }
    });

    console.log('   Status:', healthResponse.status);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Health check:', healthData.message);
    }

  } catch (error) {
    console.error('❌ CORS test failed:', error.message);
    console.log('\n💡 Make sure the Express server is running on port 3000');
    console.log('   Run: cd nibret-express-api && npm run dev');
  }

  console.log('\n🏁 CORS test completed!');
  console.log('\n📝 If you see CORS errors in the browser:');
  console.log('   1. Make sure both servers are running');
  console.log('   2. Check browser console for specific error messages');
  console.log('   3. Try clearing browser cache and localStorage');
  console.log('   4. Restart both servers');
}

testCORS();
