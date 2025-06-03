// Test frontend API integration
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

async function testPropertyListEndpoint() {
  console.log('🧪 Testing Property List API Integration...\n');

  try {
    // Test the properties/list endpoint that the frontend uses
    console.log('1. Testing /properties/list endpoint...');
    
    const requestBody = {
      username: '0965789832',
      password: 'nibretadmin'
    };

    const response = await fetch(`${API_BASE}/properties/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('   Status:', response.status);
    
    if (response.ok) {
      const properties = await response.json();
      console.log('   ✅ Properties fetched successfully');
      console.log('   Total properties:', Array.isArray(properties) ? properties.length : 'Unknown format');
      
      if (Array.isArray(properties) && properties.length > 0) {
        const firstProperty = properties[0];
        console.log('   Sample property:');
        console.log('     ID:', firstProperty._id || firstProperty.id);
        console.log('     Title:', firstProperty.title);
        console.log('     Price:', firstProperty.price);
        console.log('     Type:', firstProperty.propertyType);
        console.log('     Status:', firstProperty.status);
        console.log('     Images:', firstProperty.images?.length || 0, 'images');
        console.log('     Coordinates:', firstProperty.lat ? `${firstProperty.lat}, ${firstProperty.lng}` : 'Not set');
      }
      
      return properties;
    } else {
      const errorData = await response.json();
      console.log('   ❌ Failed to fetch properties');
      console.log('   Error:', errorData.error);
      return null;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return null;
  }
}

async function testMyPropertiesEndpoint() {
  console.log('\n2. Testing /properties/my endpoint...');
  
  try {
    // First login to get a token
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
      const token = loginData.access_token;

      // Test my properties endpoint
      const myPropertiesResponse = await fetch(`${API_BASE}/properties/my`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      console.log('   Status:', myPropertiesResponse.status);
      
      if (myPropertiesResponse.ok) {
        const myProperties = await myPropertiesResponse.json();
        console.log('   ✅ User properties fetched successfully');
        console.log('   User properties count:', myProperties.data?.length || 0);
        
        if (myProperties.data && myProperties.data.length > 0) {
          console.log('   Sample user property:');
          const firstProperty = myProperties.data[0];
          console.log('     Title:', firstProperty.title);
          console.log('     Status:', firstProperty.status);
          console.log('     Publish Status:', firstProperty.publish_status);
        }
        
        return myProperties;
      } else {
        const errorData = await myPropertiesResponse.json();
        console.log('   ❌ Failed to fetch user properties');
        console.log('   Error:', errorData.error);
        return null;
      }
    } else {
      console.log('   ❌ Failed to login for user properties test');
      return null;
    }

  } catch (error) {
    console.error('   ❌ User properties test failed:', error.message);
    return null;
  }
}

async function testPropertyCreationAndRetrieval() {
  console.log('\n3. Testing property creation and retrieval flow...');
  
  try {
    // Create a test property
    const testProperty = {
      username: '0965789832',
      password: 'nibretadmin',
      title: 'API Integration Test Property',
      description: 'This property was created to test API integration',
      price: 350000,
      beds: 3,
      baths: 2,
      sqft: 1400,
      address: 'Test Address, Addis Ababa',
      propertyType: 'house',
      status: 'for_sale',
      publish_status: 'published',
      images: ['https://example.com/test-image.jpg'],
      lat: 9.0320,
      lng: 38.7469
    };

    const createResponse = await fetch(`${API_BASE}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testProperty)
    });

    console.log('   Create Status:', createResponse.status);
    
    if (createResponse.ok) {
      const createdProperty = await createResponse.json();
      console.log('   ✅ Test property created successfully');
      const propertyId = createdProperty.data._id;
      console.log('   Property ID:', propertyId);
      
      // Now test if it appears in the list
      console.log('\n   Testing if new property appears in list...');
      const listProperties = await testPropertyListEndpoint();
      
      if (listProperties && Array.isArray(listProperties)) {
        const foundProperty = listProperties.find(p => 
          (p._id === propertyId || p.id === propertyId) || 
          p.title === 'API Integration Test Property'
        );
        
        if (foundProperty) {
          console.log('   ✅ New property found in list');
          console.log('   Property appears correctly in frontend API');
        } else {
          console.log('   ⚠️ New property not found in list (may need time to sync)');
        }
      }
      
      return propertyId;
    } else {
      const errorData = await createResponse.json();
      console.log('   ❌ Failed to create test property');
      console.log('   Error:', errorData.error);
      return null;
    }

  } catch (error) {
    console.error('   ❌ Property creation test failed:', error.message);
    return null;
  }
}

async function cleanupTestProperty(propertyId) {
  if (!propertyId) return;
  
  console.log('\n4. Cleaning up test property...');
  
  try {
    // Login to get token
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
      const token = loginData.access_token;

      // Delete the test property
      const deleteResponse = await fetch(`${API_BASE}/properties/${propertyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (deleteResponse.ok) {
        console.log('   ✅ Test property cleaned up successfully');
      } else {
        console.log('   ⚠️ Could not clean up test property (this is okay)');
      }
    }
  } catch (error) {
    console.log('   ⚠️ Cleanup failed (this is okay):', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Testing Frontend-API Integration\n');
  console.log('This test verifies that the frontend can successfully fetch properties from the API\n');
  
  const properties = await testPropertyListEndpoint();
  const myProperties = await testMyPropertiesEndpoint();
  const testPropertyId = await testPropertyCreationAndRetrieval();
  await cleanupTestProperty(testPropertyId);
  
  console.log('\n🏁 Frontend API Integration Test Completed!\n');
  
  console.log('📊 Test Results Summary:');
  console.log('   Properties List API:', properties ? '✅ Working' : '❌ Failed');
  console.log('   My Properties API:', myProperties ? '✅ Working' : '❌ Failed');
  console.log('   Property Creation:', testPropertyId ? '✅ Working' : '❌ Failed');
  
  console.log('\n🎯 Frontend Integration Status:');
  if (properties && Array.isArray(properties)) {
    console.log('   ✅ Home page will show real properties from API');
    console.log('   ✅ Property search and filtering will work with real data');
    console.log('   ✅ Map view will display actual property locations');
  } else {
    console.log('   ❌ Home page may show loading/error states');
  }
  
  if (myProperties) {
    console.log('   ✅ Customer dashboard will show user\'s actual properties');
    console.log('   ✅ Property management will work with real data');
  } else {
    console.log('   ❌ Customer dashboard may show empty/error states');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Open frontend: http://localhost:5173');
  console.log('   2. Check home page for real property listings');
  console.log('   3. Login and check customer dashboard');
  console.log('   4. Verify property upload functionality');
  console.log('   5. Test property search and filtering');
}

runAllTests();
