// Test property creation response format
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function testPropertyResponse() {
  console.log('🧪 Testing Property Creation Response Format...\n');

  try {
    // Step 1: Login as admin
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
    const token = loginData.access_token;

    // Step 2: Create a test property
    console.log('\n2️⃣ Creating test property...');
    
    const propertyData = {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      title: 'Test Property Response Format',
      description: 'Testing property creation response format',
      price: 2500000,
      beds: 3,
      baths: 2,
      sqft: 150,
      address: 'Test Address, Addis Ababa',
      propertyType: 'apartment',
      lat: 9.0320,
      lng: 38.7469,
      images: [],
      publish_status: 'published'
    };

    const createResponse = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(propertyData)
    });

    const createResult = await createResponse.json();
    
    console.log('Create response status:', createResponse.status);
    console.log('Create response headers:', Object.fromEntries(createResponse.headers.entries()));
    console.log('Create response body:', JSON.stringify(createResult, null, 2));

    if (!createResponse.ok) {
      console.log('❌ Property creation failed!');
      return;
    }

    console.log('✅ Property created successfully!');
    
    // Analyze response structure
    console.log('\n📊 Response Analysis:');
    console.log('- Has success field:', 'success' in createResult);
    console.log('- Has data field:', 'data' in createResult);
    console.log('- Has error field:', 'error' in createResult);
    console.log('- Response keys:', Object.keys(createResult));
    
    if (createResult.data) {
      console.log('- Data keys:', Object.keys(createResult.data));
      console.log('- Property ID:', createResult.data.id || createResult.data._id);
    }

    // Step 3: Test fetching all properties (home page)
    console.log('\n3️⃣ Testing home page property fetch...');
    
    const homePropertiesResponse = await fetch(`${API_BASE_URL}/properties`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const homePropertiesData = await homePropertiesResponse.json();
    
    console.log('Home properties response status:', homePropertiesResponse.status);
    console.log('Home properties count:', homePropertiesData.data?.length || homePropertiesData.length || 0);
    
    if (homePropertiesResponse.ok) {
      const properties = homePropertiesData.data || homePropertiesData;
      console.log('✅ Home page properties fetched successfully!');
      console.log('Properties found:', properties.length);
      
      // Check if our created property is in the list
      const createdPropertyId = createResult.data?.id || createResult.data?._id || createResult.id;
      const foundProperty = properties.find(p => (p.id || p._id) === createdPropertyId);
      
      if (foundProperty) {
        console.log('✅ Created property found in home page list!');
        console.log('Property status:', foundProperty.publish_status);
      } else {
        console.log('❌ Created property NOT found in home page list!');
        console.log('This might be why properties don\'t show on home page.');
      }
    } else {
      console.log('❌ Failed to fetch home page properties!');
    }

    // Step 4: Test fetching user's properties
    console.log('\n4️⃣ Testing user properties fetch...');
    
    const userPropertiesResponse = await fetch(`${API_BASE_URL}/properties/my-properties`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const userPropertiesData = await userPropertiesResponse.json();
    
    console.log('User properties response status:', userPropertiesResponse.status);
    
    if (userPropertiesResponse.ok) {
      const userProperties = userPropertiesData.data || userPropertiesData;
      console.log('✅ User properties fetched successfully!');
      console.log('User properties count:', userProperties.length);
      
      // Check if our created property is in user's list
      const createdPropertyId = createResult.data?.id || createResult.data?._id || createResult.id;
      const foundUserProperty = userProperties.find(p => (p.id || p._id) === createdPropertyId);
      
      if (foundUserProperty) {
        console.log('✅ Created property found in user\'s property list!');
      } else {
        console.log('❌ Created property NOT found in user\'s property list!');
      }
    } else {
      console.log('❌ Failed to fetch user properties!');
    }

    console.log('\n🎯 Summary:');
    console.log('- Property creation response format:', createResult.success ? 'Has success field' : 'No success field');
    console.log('- Frontend expects success field for proper handling');
    console.log('- Home page property visibility depends on publish_status and API response format');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testPropertyResponse();
