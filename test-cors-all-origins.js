// Test CORS configuration with various origins
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

const testOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8080',
  'https://example.com',
  'https://test.com',
  'https://nibret.com',
  'https://www.nibret.com',
  'https://api.nibret.com',
  'https://staging.nibret.com',
  'https://dev.nibret.com'
];

async function testCORSForAllOrigins() {
  console.log('🧪 Testing CORS Configuration for All Origins...\n');

  for (const origin of testOrigins) {
    console.log(`\n🌐 Testing origin: ${origin}`);
    
    try {
      // Test preflight request (OPTIONS)
      console.log('   1. Testing preflight OPTIONS request...');
      const optionsResponse = await fetch(`${API_BASE}/health`, {
        method: 'OPTIONS',
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type, Authorization',
        }
      });

      console.log(`   Status: ${optionsResponse.status}`);
      console.log(`   Access-Control-Allow-Origin: ${optionsResponse.headers.get('access-control-allow-origin')}`);
      console.log(`   Access-Control-Allow-Methods: ${optionsResponse.headers.get('access-control-allow-methods')}`);
      console.log(`   Access-Control-Allow-Headers: ${optionsResponse.headers.get('access-control-allow-headers')}`);

      // Test actual GET request
      console.log('   2. Testing GET request...');
      const getResponse = await fetch(`${API_BASE}/health`, {
        method: 'GET',
        headers: {
          'Origin': origin,
        }
      });

      console.log(`   Status: ${getResponse.status}`);
      console.log(`   Access-Control-Allow-Origin: ${getResponse.headers.get('access-control-allow-origin')}`);
      
      if (getResponse.ok) {
        console.log('   ✅ Request successful');
      } else {
        console.log('   ❌ Request failed');
      }

      // Test POST request (login)
      console.log('   3. Testing POST request (login)...');
      const postResponse = await fetch(`${API_BASE}/accounts/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': origin,
        },
        body: JSON.stringify({
          username: '0965789832',
          password: 'nibretadmin'
        })
      });

      console.log(`   Status: ${postResponse.status}`);
      console.log(`   Access-Control-Allow-Origin: ${postResponse.headers.get('access-control-allow-origin')}`);
      
      if (postResponse.ok) {
        const data = await postResponse.json();
        console.log('   ✅ Login successful, token received:', !!data.access_token);
      } else {
        console.log('   ❌ Login failed');
      }

    } catch (error) {
      console.error(`   ❌ Error testing ${origin}:`, error.message);
    }
  }

  console.log('\n🏁 CORS test for all origins completed!');
  console.log('\n📝 Summary:');
  console.log('   - CORS is now configured to allow ALL origins');
  console.log('   - origin: true allows any origin');
  console.log('   - credentials: true allows cookies and auth headers');
  console.log('   - All HTTP methods are allowed');
  console.log('\n💡 If you still see CORS errors:');
  console.log('   1. Make sure the Express server is running on port 3000');
  console.log('   2. Clear browser cache and localStorage');
  console.log('   3. Check browser console for specific error messages');
  console.log('   4. Restart both frontend and backend servers');
}

// Test without origin (like mobile apps or curl)
async function testNoOrigin() {
  console.log('\n🔧 Testing requests without Origin header (mobile apps, curl, etc.)...');
  
  try {
    const response = await fetch(`${API_BASE}/health`);
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ No-origin request successful:', data.message);
    }
  } catch (error) {
    console.error('❌ No-origin request failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testNoOrigin();
  await testCORSForAllOrigins();
}

runAllTests();
