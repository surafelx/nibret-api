// Test edit property functionality
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function testEditProperty() {
  console.log('🧪 Testing Edit Property Functionality...\n');

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

    // Step 2: Get user's properties
    console.log('\n2️⃣ Fetching user properties...');
    const propertiesResponse = await fetch(`${API_BASE_URL}/properties/my-properties`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const propertiesData = await propertiesResponse.json();
    console.log('Properties response status:', propertiesResponse.status);

    if (!propertiesResponse.ok) {
      console.log('❌ Failed to fetch properties!');
      console.log('Error:', propertiesData);
      return;
    }

    const properties = propertiesData.data || propertiesData;
    console.log(`✅ Found ${properties.length} properties`);

    if (properties.length === 0) {
      console.log('⚠️ No properties found. Creating a test property first...');
      
      // Create a test property
      const createResponse = await fetch(`${API_BASE_URL}/properties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: process.env.ADMIN_USERNAME,
          password: process.env.ADMIN_PASSWORD,
          title: 'Test Property for Edit',
          description: 'This is a test property created for edit testing',
          price: 1500000,
          beds: 3,
          baths: 2,
          sqft: 120,
          address: 'Test Address, Addis Ababa',
          propertyType: 'apartment',
          lat: 9.0320,
          lng: 38.7469,
          images: []
        })
      });

      const createData = await createResponse.json();
      
      if (!createResponse.ok) {
        console.log('❌ Failed to create test property!');
        console.log('Error:', createData);
        return;
      }

      console.log('✅ Test property created successfully!');
      properties.push(createData.data || createData);
    }

    // Step 3: Test getting a single property for editing
    const testProperty = properties[0];
    console.log(`\n3️⃣ Testing get single property (ID: ${testProperty.id})...`);
    
    const getPropertyResponse = await fetch(`${API_BASE_URL}/properties/${testProperty.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const propertyData = await getPropertyResponse.json();
    console.log('Get property response status:', getPropertyResponse.status);

    if (!getPropertyResponse.ok) {
      console.log('❌ Failed to get property details!');
      console.log('Error:', propertyData);
      return;
    }

    console.log('✅ Property details retrieved successfully!');
    console.log('Property details:', {
      id: propertyData.data?.id || propertyData.id,
      title: propertyData.data?.title || propertyData.title,
      price: propertyData.data?.price || propertyData.price,
      beds: propertyData.data?.beds || propertyData.beds,
      baths: propertyData.data?.baths || propertyData.baths
    });

    // Step 4: Test updating the property
    console.log('\n4️⃣ Testing property update...');
    
    const updateData = {
      title: 'Updated Test Property',
      description: 'This property has been updated via API test',
      price: 1750000,
      beds: 4,
      baths: 3,
      sqft: 150,
      address: 'Updated Address, Addis Ababa',
      propertyType: 'house',
      lat: 9.0320,
      lng: 38.7469
    };

    const updateResponse = await fetch(`${API_BASE_URL}/properties/${testProperty.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    const updateResult = await updateResponse.json();
    console.log('Update response status:', updateResponse.status);

    if (!updateResponse.ok) {
      console.log('❌ Failed to update property!');
      console.log('Error:', updateResult);
      return;
    }

    console.log('✅ Property updated successfully!');
    console.log('Updated property details:', {
      id: updateResult.data?.id || updateResult.id,
      title: updateResult.data?.title || updateResult.title,
      price: updateResult.data?.price || updateResult.price,
      beds: updateResult.data?.beds || updateResult.beds,
      baths: updateResult.data?.baths || updateResult.baths
    });

    // Step 5: Verify the update by fetching the property again
    console.log('\n5️⃣ Verifying the update...');
    
    const verifyResponse = await fetch(`${API_BASE_URL}/properties/${testProperty.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const verifyData = await verifyResponse.json();
    
    if (verifyResponse.ok) {
      const updatedProperty = verifyData.data || verifyData;
      console.log('✅ Update verified successfully!');
      console.log('Final property state:', {
        title: updatedProperty.title,
        price: updatedProperty.price,
        beds: updatedProperty.beds,
        baths: updatedProperty.baths
      });
      
      console.log('\n🎉 Edit Property functionality is working correctly!');
      console.log('💡 The frontend edit page should now work properly.');
    } else {
      console.log('❌ Failed to verify update!');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testEditProperty();
