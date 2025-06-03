// Test property creation endpoint
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

async function testPropertyCreation() {
  console.log('🧪 Testing Property Creation...\n');

  try {
    // Test property creation with embedded credentials
    console.log('1. Testing property creation with embedded credentials...');

    const testProperty = {
      username: '0965789832',
      password: 'nibretadmin',
      title: 'Test Property - Beautiful Villa',
      description: 'A beautiful test villa for testing property creation',
      price: 500000,
      beds: 3,
      baths: 2,
      sqft: 1500,
      address: 'Test Address, Addis Ababa, Ethiopia',
      lat: 9.0320,
      lng: 38.7469,
      propertyType: 'villa',
      status: 'for_sale',
      publish_status: 'draft',
      listing_type: 'sale',
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      yearBuilt: 2020,
      lotSize: 500,
      features: ['parking', 'garden', 'security'],
      contact_info: {
        phone: '0965789832',
        email: 'admin@nibret.com',
        agent_name: 'Test Agent'
      }
    };

    const response = await fetch(`${API_BASE}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProperty)
    });

    console.log('   Status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Property created successfully');
      console.log('   Property ID:', data.data._id);
      console.log('   Property Title:', data.data.title);
      console.log('   Owner:', data.data.owner.first_name, data.data.owner.last_name);

      // Test getting the created property
      console.log('\n2. Testing property retrieval...');
      const getResponse = await fetch(`${API_BASE}/properties/${data.data._id}`);

      if (getResponse.ok) {
        const propertyData = await getResponse.json();
        console.log('   ✅ Property retrieved successfully');
        console.log('   Title:', propertyData.data.title);
        console.log('   Views:', propertyData.data.views);
      } else {
        console.log('   ❌ Failed to retrieve property');
      }

    } else {
      const errorData = await response.json();
      console.log('   ❌ Property creation failed');
      console.log('   Error:', errorData.error);
      console.log('   Details:', errorData);
    }

    // Test property creation without credentials (should fail)
    console.log('\n3. Testing property creation without credentials...');
    const testPropertyNoAuth = {
      title: 'Test Property Without Auth',
      description: 'This should fail',
      price: 100000,
      beds: 2,
      baths: 1,
      sqft: 1000,
      address: 'Test Address',
      propertyType: 'apartment'
    };

    const noAuthResponse = await fetch(`${API_BASE}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPropertyNoAuth)
    });

    console.log('   Status:', noAuthResponse.status);

    if (noAuthResponse.ok) {
      console.log('   ❌ Property creation should have failed without auth');
    } else {
      const errorData = await noAuthResponse.json();
      console.log('   ✅ Property creation correctly failed without auth');
      console.log('   Error:', errorData.error);
    }

    // Test property creation with invalid data
    console.log('\n4. Testing property creation with invalid data...');
    const invalidProperty = {
      username: '0965789832',
      password: 'nibretadmin',
      title: 'A', // Too short
      price: -100, // Negative price
      beds: 25, // Too many beds
      sqft: 0, // Invalid sqft
      address: 'Short', // Too short
      propertyType: 'invalid_type' // Invalid type
    };

    const invalidResponse = await fetch(`${API_BASE}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidProperty)
    });

    console.log('   Status:', invalidResponse.status);

    if (invalidResponse.ok) {
      console.log('   ❌ Property creation should have failed with invalid data');
    } else {
      const errorData = await invalidResponse.json();
      console.log('   ✅ Property creation correctly failed with invalid data');
      console.log('   Error:', errorData.error);
    }

    // Test getting all properties
    console.log('\n5. Testing property listing...');
    const listResponse = await fetch(`${API_BASE}/properties/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: '0965789832',
        password: 'nibretadmin'
      })
    });

    if (listResponse.ok) {
      const properties = await listResponse.json();
      console.log('   ✅ Property listing successful');
      console.log('   Total properties:', Array.isArray(properties) ? properties.length : 'Unknown');
    } else {
      console.log('   ❌ Property listing failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the Express server is running on port 3000');
    console.log('   Run: cd nibret-api && npm run dev');
  }

  console.log('\n🏁 Property creation test completed!');
  console.log('\n📝 Common issues and solutions:');
  console.log('   1. Missing required fields: title, price, beds, baths, sqft, address, propertyType');
  console.log('   2. Invalid data types: price must be number, beds/baths must be integers');
  console.log('   3. Authentication: Must provide username/password or valid JWT token');
  console.log('   4. Coordinates: lat/lng will default to Addis Ababa if not provided');
  console.log('   5. Property type: Must be one of: house, apartment, condo, villa, townhouse, studio, other');
  console.log('   6. ✅ FIXED: user.matchPassword -> user.comparePassword authentication error');
}

testPropertyCreation();
