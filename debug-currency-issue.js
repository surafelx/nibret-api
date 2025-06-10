// Debug currency field issues
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function debugCurrencyIssue() {
  console.log('💰 Debugging Currency Field Issues...\n');

  try {
    // Step 1: Test creating property with currency
    console.log('1️⃣ Testing property creation with currency...');
    
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
    const token = loginData.access_token;

    // Test with USD currency
    const usdPropertyData = {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      title: 'Currency Test Property USD',
      description: 'Testing USD currency field',
      price: 250000,
      currency: 'USD',
      beds: 3,
      baths: 2,
      sqft: 150,
      address: 'Currency Test Address',
      propertyType: 'house',
      status: 'for_sale',
      listing_type: 'sale',
      publish_status: 'published'
    };

    console.log('Creating property with USD currency...');
    console.log('Request data:', JSON.stringify(usdPropertyData, null, 2));

    const createResponse = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(usdPropertyData)
    });

    const createResult = await createResponse.json();
    
    console.log('Create response status:', createResponse.status);
    console.log('Create response:', JSON.stringify(createResult, null, 2));

    if (!createResponse.ok) {
      console.log('❌ Property creation failed!');
      console.log('Error details:', createResult);
      return;
    }

    console.log('✅ Property created successfully!');
    const createdProperty = createResult.data || createResult;
    console.log('Created property currency:', createdProperty.currency);

    // Step 2: Test retrieving properties and check currency field
    console.log('\n2️⃣ Testing property retrieval...');
    
    const listResponse = await fetch(`${API_BASE_URL}/properties/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "0965789832",
        password: "nibretadmin"
      })
    });

    const listData = await listResponse.json();
    
    console.log('List response status:', listResponse.status);
    console.log('Properties found:', listData.length);
    
    if (listData.length > 0) {
      console.log('\n📋 Currency field analysis:');
      listData.forEach((property, index) => {
        console.log(`${index + 1}. "${property.title}"`);
        console.log(`   - Price: ${property.price}`);
        console.log(`   - Currency: ${property.currency || 'UNDEFINED'}`);
        console.log(`   - Has currency field: ${property.hasOwnProperty('currency')}`);
        console.log('');
      });

      // Check if any properties have USD currency
      const usdProperties = listData.filter(p => p.currency === 'USD');
      const etbProperties = listData.filter(p => p.currency === 'ETB');
      const noCurrencyProperties = listData.filter(p => !p.currency);

      console.log('📊 Currency breakdown:');
      console.log(`   - USD properties: ${usdProperties.length}`);
      console.log(`   - ETB properties: ${etbProperties.length}`);
      console.log(`   - No currency field: ${noCurrencyProperties.length}`);
    }

    // Step 3: Test direct database query
    console.log('\n3️⃣ Testing direct property fetch...');
    
    if (createdProperty.id) {
      const directResponse = await fetch(`${API_BASE_URL}/properties/${createdProperty.id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const directResult = await directResponse.json();
      
      console.log('Direct fetch status:', directResponse.status);
      console.log('Direct fetch result:', JSON.stringify(directResult, null, 2));
    }

    // Step 4: Test with invalid currency
    console.log('\n4️⃣ Testing invalid currency (should fail)...');
    
    const invalidCurrencyData = {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      title: 'Invalid Currency Test',
      description: 'Testing invalid currency',
      price: 100000,
      currency: 'EUR', // Invalid currency
      beds: 2,
      baths: 1,
      sqft: 80,
      address: 'Test Address',
      propertyType: 'apartment',
      status: 'for_sale',
      listing_type: 'sale',
      publish_status: 'published'
    };

    const invalidResponse = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidCurrencyData)
    });

    const invalidResult = await invalidResponse.json();
    
    console.log('Invalid currency response status:', invalidResponse.status);
    
    if (invalidResponse.status === 400) {
      console.log('✅ Invalid currency properly rejected!');
      console.log('Error message:', invalidResult.error);
    } else {
      console.log('❌ Invalid currency was not rejected!');
      console.log('Response:', invalidResult);
    }

  } catch (error) {
    console.error('❌ Debug failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugCurrencyIssue();
