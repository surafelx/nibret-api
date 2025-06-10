// Test currency field in property creation
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function testCurrencyField() {
  console.log('💰 Testing Currency Field in Property Creation...\n');

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

    // Step 2: Create property with ETB currency
    console.log('\n2️⃣ Creating property with ETB currency...');
    
    const etbPropertyData = {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      title: 'Modern Apartment - ETB Pricing',
      description: 'Beautiful apartment priced in Ethiopian Birr',
      price: 3500000,
      currency: 'ETB',
      beds: 3,
      baths: 2,
      sqft: 120,
      address: 'Kazanchis, Addis Ababa',
      propertyType: 'apartment',
      status: 'for_sale',
      listing_type: 'sale',
      lat: 9.0320,
      lng: 38.7469,
      images: [],
      publish_status: 'published'
    };

    const etbResponse = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(etbPropertyData)
    });

    const etbResult = await etbResponse.json();
    
    console.log('ETB property response status:', etbResponse.status);
    
    if (!etbResponse.ok) {
      console.log('❌ Failed to create ETB property!');
      console.log('Error:', etbResult);
      return;
    }

    console.log('✅ ETB property created successfully!');
    console.log('Property details:', {
      id: etbResult.data?.id || etbResult.id,
      title: etbResult.data?.title || etbResult.title,
      price: etbResult.data?.price || etbResult.price,
      currency: etbResult.data?.currency || etbResult.currency
    });

    // Step 3: Create property with USD currency
    console.log('\n3️⃣ Creating property with USD currency...');
    
    const usdPropertyData = {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      title: 'Luxury Villa - USD Pricing',
      description: 'Premium villa priced in US Dollars',
      price: 450000,
      currency: 'USD',
      beds: 5,
      baths: 4,
      sqft: 300,
      address: 'Old Airport, Addis Ababa',
      propertyType: 'villa',
      status: 'for_sale',
      listing_type: 'sale',
      lat: 9.0320,
      lng: 38.7469,
      images: [],
      publish_status: 'published'
    };

    const usdResponse = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(usdPropertyData)
    });

    const usdResult = await usdResponse.json();
    
    console.log('USD property response status:', usdResponse.status);
    
    if (!usdResponse.ok) {
      console.log('❌ Failed to create USD property!');
      console.log('Error:', usdResult);
      return;
    }

    console.log('✅ USD property created successfully!');
    console.log('Property details:', {
      id: usdResult.data?.id || usdResult.id,
      title: usdResult.data?.title || usdResult.title,
      price: usdResult.data?.price || usdResult.price,
      currency: usdResult.data?.currency || usdResult.currency
    });

    // Step 4: Create property without currency (should default to ETB)
    console.log('\n4️⃣ Creating property without currency (should default to ETB)...');
    
    const defaultPropertyData = {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      title: 'Default Currency Test Property',
      description: 'Property without currency specified',
      price: 2000000,
      // No currency field specified
      beds: 2,
      baths: 1,
      sqft: 80,
      address: 'Piassa, Addis Ababa',
      propertyType: 'apartment',
      status: 'for_sale',
      listing_type: 'sale',
      lat: 9.0320,
      lng: 38.7469,
      images: [],
      publish_status: 'published'
    };

    const defaultResponse = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(defaultPropertyData)
    });

    const defaultResult = await defaultResponse.json();
    
    console.log('Default property response status:', defaultResponse.status);
    
    if (!defaultResponse.ok) {
      console.log('❌ Failed to create default property!');
      console.log('Error:', defaultResult);
      return;
    }

    console.log('✅ Default property created successfully!');
    console.log('Property details:', {
      id: defaultResult.data?.id || defaultResult.id,
      title: defaultResult.data?.title || defaultResult.title,
      price: defaultResult.data?.price || defaultResult.price,
      currency: defaultResult.data?.currency || defaultResult.currency || 'NOT_SET'
    });

    // Step 5: Test invalid currency
    console.log('\n5️⃣ Testing invalid currency (should fail)...');
    
    const invalidPropertyData = {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      title: 'Invalid Currency Test',
      description: 'Property with invalid currency',
      price: 1000000,
      currency: 'EUR', // Invalid currency
      beds: 2,
      baths: 1,
      sqft: 80,
      address: 'Test Address',
      propertyType: 'apartment',
      status: 'for_sale',
      listing_type: 'sale',
      lat: 9.0320,
      lng: 38.7469,
      images: [],
      publish_status: 'published'
    };

    const invalidResponse = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invalidPropertyData)
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

    console.log('\n🎉 Currency field testing completed!');
    console.log('💡 Frontend can now use ETB and USD currencies in property forms.');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testCurrencyField();
