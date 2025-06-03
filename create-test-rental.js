// Create test rental property
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function createTestRental() {
  console.log('🏠 Creating Test Rental Property...\n');

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

    // Step 2: Create a rental property
    console.log('\n2️⃣ Creating rental property...');
    
    const rentalPropertyData = {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      title: 'Beautiful 2-Bedroom Apartment for Rent',
      description: 'Modern apartment in prime location, perfect for families',
      price: 15000, // Monthly rent in ETB
      beds: 2,
      baths: 1,
      sqft: 80,
      address: 'Bole, Addis Ababa',
      propertyType: 'apartment',
      status: 'for_rent',
      listing_type: 'rent',
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
      body: JSON.stringify(rentalPropertyData)
    });

    const createResult = await createResponse.json();
    
    console.log('Create response status:', createResponse.status);
    
    if (!createResponse.ok) {
      console.log('❌ Failed to create rental property!');
      console.log('Error:', createResult);
      return;
    }

    console.log('✅ Rental property created successfully!');
    console.log('Property details:', {
      id: createResult.data?.id || createResult.id,
      title: createResult.data?.title || createResult.title,
      status: createResult.data?.status || createResult.status,
      listing_type: createResult.data?.listing_type || createResult.listing_type,
      price: createResult.data?.price || createResult.price
    });

    // Step 3: Create a property with 'both' listing type
    console.log('\n3️⃣ Creating property for both sale and rent...');
    
    const bothPropertyData = {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      title: 'Luxury Villa - Sale or Rent',
      description: 'Stunning villa available for both sale and rent',
      price: 8500000, // Sale price
      beds: 4,
      baths: 3,
      sqft: 250,
      address: 'CMC, Addis Ababa',
      propertyType: 'villa',
      status: 'for_sale',
      listing_type: 'both',
      lat: 9.0320,
      lng: 38.7469,
      images: [],
      publish_status: 'published'
    };

    const bothResponse = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bothPropertyData)
    });

    const bothResult = await bothResponse.json();
    
    if (bothResponse.ok) {
      console.log('✅ Both sale/rent property created successfully!');
      console.log('Property details:', {
        id: bothResult.data?.id || bothResult.id,
        title: bothResult.data?.title || bothResult.title,
        status: bothResult.data?.status || bothResult.status,
        listing_type: bothResult.data?.listing_type || bothResult.listing_type,
        price: bothResult.data?.price || bothResult.price
      });
    } else {
      console.log('❌ Failed to create both sale/rent property!');
      console.log('Error:', bothResult);
    }

    // Step 4: Test the filtering
    console.log('\n4️⃣ Testing updated filtering...');
    
    // Test rent filtering
    const rentResponse = await fetch(`${API_BASE_URL}/properties/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "0965789832",
        password: "nibretadmin",
        status: "for_rent"
      })
    });

    const rentData = await rentResponse.json();
    console.log(`Rent properties found: ${rentData.length}`);
    
    if (rentData.length > 0) {
      console.log('✅ Rent filtering working!');
      rentData.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title} (status: ${p.status}, listing_type: ${p.listing_type})`);
      });
    } else {
      console.log('❌ No rental properties found');
    }

    // Test sale filtering
    const saleResponse = await fetch(`${API_BASE_URL}/properties/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "0965789832",
        password: "nibretadmin",
        status: "for_sale"
      })
    });

    const saleData = await saleResponse.json();
    console.log(`Sale properties found: ${saleData.length}`);
    
    if (saleData.length > 0) {
      console.log('✅ Sale filtering working!');
      console.log(`First few: ${saleData.slice(0, 3).map(p => p.title).join(', ')}`);
    }

    console.log('\n🎉 Test rental properties created and filtering verified!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
createTestRental();
