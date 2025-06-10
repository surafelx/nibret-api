// Test frontend currency display
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function testFrontendCurrency() {
  console.log('🎨 Testing Frontend Currency Display...\n');

  try {
    // Test the exact API call that frontend makes
    console.log('1️⃣ Testing frontend API call format...');
    
    const frontendResponse = await fetch(`${API_BASE_URL}/properties/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "0965789832",
        password: "nibretadmin"
      })
    });

    const frontendData = await frontendResponse.json();
    
    console.log('Frontend API response status:', frontendResponse.status);
    console.log('Properties received:', frontendData.length);
    
    if (frontendData.length > 0) {
      console.log('\n📋 Frontend property data analysis:');
      frontendData.forEach((property, index) => {
        console.log(`${index + 1}. "${property.title}"`);
        console.log(`   - Price: ${property.price}`);
        console.log(`   - Currency field exists: ${property.hasOwnProperty('currency')}`);
        console.log(`   - Currency value: ${property.currency || 'UNDEFINED'}`);
        console.log(`   - All fields:`, Object.keys(property));
        console.log('');
      });

      // Test currency formatting simulation (like PropertyCard does)
      console.log('2️⃣ Testing currency formatting simulation...');
      
      frontendData.forEach((property, index) => {
        const propertyCurrency = property.currency || 'ETB';
        const price = property.price;
        
        console.log(`Property ${index + 1}: ${property.title}`);
        console.log(`  Raw price: ${price}`);
        console.log(`  Currency: ${propertyCurrency}`);
        
        // Simulate PropertyCard formatting
        let formattedPrice;
        if (propertyCurrency === 'USD') {
          formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
          }).format(price);
        } else {
          formattedPrice = new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            maximumFractionDigits: 0
          }).format(price);
        }
        
        console.log(`  Formatted price: ${formattedPrice}`);
        console.log('');
      });

      // Test if currency field is being lost somewhere
      console.log('3️⃣ Testing raw JSON structure...');
      console.log('Raw JSON sample:');
      console.log(JSON.stringify(frontendData[0], null, 2));

    } else {
      console.log('❌ No properties returned from frontend API');
    }

    // Test property creation from frontend perspective
    console.log('\n4️⃣ Testing property creation with currency from frontend...');
    
    const frontendCreateData = {
      username: "0965789832",
      password: "nibretadmin",
      title: 'Frontend Currency Test',
      description: 'Testing currency from frontend',
      price: 150000,
      currency: 'USD',
      beds: 2,
      baths: 1,
      sqft: 100,
      address: 'Frontend Test Address',
      propertyType: 'apartment',
      status: 'for_sale',
      listing_type: 'sale',
      publish_status: 'published'
    };

    const frontendCreateResponse = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(frontendCreateData)
    });

    const frontendCreateResult = await frontendCreateResponse.json();
    
    console.log('Frontend create response status:', frontendCreateResponse.status);
    
    if (frontendCreateResponse.ok) {
      console.log('✅ Frontend property creation successful!');
      const createdProperty = frontendCreateResult.data || frontendCreateResult;
      console.log('Created property currency:', createdProperty.currency);
    } else {
      console.log('❌ Frontend property creation failed!');
      console.log('Error:', frontendCreateResult);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testFrontendCurrency();
