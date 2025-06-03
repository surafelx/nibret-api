// Test frontend API call format
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function testFrontendAPI() {
  console.log('🧪 Testing Frontend API Call Format...\n');

  try {
    // Test the exact API call that the frontend makes
    console.log('1️⃣ Testing /properties/list endpoint (frontend format)...');
    
    const requestBody = {
      username: "0965789832",
      password: "nibretadmin"
    };

    const response = await fetch(`${API_BASE_URL}/properties/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response type:', Array.isArray(data) ? 'Array' : typeof data);
    console.log('Response length:', Array.isArray(data) ? data.length : 'N/A');
    
    if (Array.isArray(data)) {
      console.log('✅ Response is an array (expected by frontend)');
      console.log('Properties found:', data.length);
      
      if (data.length > 0) {
        console.log('\n📋 Sample property:');
        const sample = data[0];
        console.log('- ID:', sample.id || sample._id);
        console.log('- Title:', sample.title);
        console.log('- Status:', sample.status);
        console.log('- Publish Status:', sample.publish_status);
        console.log('- Listing Type:', sample.listing_type);
        console.log('- Price:', sample.price);
        
        // Check if all properties are published
        const publishedCount = data.filter(p => p.publish_status === 'published').length;
        console.log(`\n📊 Published properties: ${publishedCount}/${data.length}`);
        
        if (publishedCount === data.length) {
          console.log('✅ All properties are published (correct for home page)');
        } else {
          console.log('⚠️ Some properties are not published');
        }
      }
    } else {
      console.log('❌ Response is not an array (frontend expects array)');
      console.log('Response structure:', Object.keys(data));
    }

    // Test with filters for rent page
    console.log('\n2️⃣ Testing rent page filtering...');
    
    const rentRequestBody = {
      username: "0965789832",
      password: "nibretadmin",
      status: "for_rent"
    };

    const rentResponse = await fetch(`${API_BASE_URL}/properties/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(rentRequestBody)
    });

    const rentData = await rentResponse.json();
    
    console.log('Rent response status:', rentResponse.status);
    console.log('Rent properties found:', Array.isArray(rentData) ? rentData.length : 'N/A');
    
    if (Array.isArray(rentData)) {
      const forRentCount = rentData.filter(p => p.status === 'for_rent' || p.listing_type === 'rent' || p.listing_type === 'both').length;
      console.log(`Properties for rent: ${forRentCount}/${rentData.length}`);
      
      if (forRentCount === rentData.length) {
        console.log('✅ Rent filtering working correctly');
      } else {
        console.log('❌ Rent filtering not working - showing non-rental properties');
        rentData.forEach((p, i) => {
          if (p.status !== 'for_rent' && p.listing_type !== 'rent' && p.listing_type !== 'both') {
            console.log(`  - Property ${i + 1}: status="${p.status}", listing_type="${p.listing_type}"`);
          }
        });
      }
    }

    // Test with filters for sale page
    console.log('\n3️⃣ Testing sale page filtering...');
    
    const saleRequestBody = {
      username: "0965789832",
      password: "nibretadmin",
      status: "for_sale"
    };

    const saleResponse = await fetch(`${API_BASE_URL}/properties/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(saleRequestBody)
    });

    const saleData = await saleResponse.json();
    
    console.log('Sale response status:', saleResponse.status);
    console.log('Sale properties found:', Array.isArray(saleData) ? saleData.length : 'N/A');
    
    if (Array.isArray(saleData)) {
      const forSaleCount = saleData.filter(p => p.status === 'for_sale' || p.listing_type === 'sale' || p.listing_type === 'both').length;
      console.log(`Properties for sale: ${forSaleCount}/${saleData.length}`);
      
      if (forSaleCount === saleData.length) {
        console.log('✅ Sale filtering working correctly');
      } else {
        console.log('❌ Sale filtering not working - showing non-sale properties');
        saleData.forEach((p, i) => {
          if (p.status !== 'for_sale' && p.listing_type !== 'sale' && p.listing_type !== 'both') {
            console.log(`  - Property ${i + 1}: status="${p.status}", listing_type="${p.listing_type}"`);
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testFrontendAPI();
