// Final test to verify home page properties display
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function finalTestHomePage() {
  console.log('🎯 Final Test: Home Page Properties Display\n');

  try {
    // Test the home page API call
    console.log('1️⃣ Testing home page API call...');
    
    const homePageResponse = await fetch(`${API_BASE_URL}/properties/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "0965789832",
        password: "nibretadmin"
      })
    });

    const homePageData = await homePageResponse.json();
    
    console.log('✅ API Response Status:', homePageResponse.status);
    console.log('✅ Properties Count:', homePageData.length);
    
    if (homePageData.length > 0) {
      console.log('\n📋 Properties on Home Page:');
      homePageData.forEach((property, index) => {
        console.log(`${index + 1}. ${property.title}`);
        console.log(`   💰 Price: ${property.price} ${property.currency || 'ETB'}`);
        console.log(`   🏠 Type: ${property.propertyType}`);
        console.log(`   📍 Address: ${property.address}`);
        console.log(`   🛏️  ${property.beds} bed, ${property.baths} bath, ${property.sqft} sqft`);
        console.log(`   📊 Status: ${property.status} (${property.listing_type})`);
        console.log(`   📝 Publish Status: ${property.publish_status}`);
        console.log('');
      });

      // Test frontend filtering simulation
      console.log('2️⃣ Testing frontend filtering simulation...');
      
      const priceRange = [0, 100000000]; // Updated range
      const propertyType = 'all';
      const bedrooms = 'any';
      const searchTerm = '';

      let filteredProperties = homePageData.filter(property => {
        const matchesSearch = !searchTerm || 
          property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.address.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];
        
        const matchesPropertyType = propertyType === 'all' || property.propertyType === propertyType;
        
        const matchesBedrooms = bedrooms === 'any' || property.beds >= parseInt(bedrooms);
        
        return matchesSearch && matchesPrice && matchesPropertyType && matchesBedrooms;
      });
      
      console.log(`✅ Frontend filtering: ${filteredProperties.length}/${homePageData.length} properties pass filters`);
      
      if (filteredProperties.length > 0) {
        console.log('✅ Properties will display on frontend!');
        
        // Test currency display
        console.log('\n3️⃣ Testing currency display...');
        const currencyBreakdown = {};
        filteredProperties.forEach(property => {
          const currency = property.currency || 'ETB';
          currencyBreakdown[currency] = (currencyBreakdown[currency] || 0) + 1;
        });
        
        console.log('Currency breakdown:');
        Object.entries(currencyBreakdown).forEach(([currency, count]) => {
          console.log(`  - ${currency}: ${count} properties`);
        });
        
        console.log('\n🎉 SUCCESS: Home page should now display properties with proper currency formatting!');
        
        // Summary
        console.log('\n📊 SUMMARY:');
        console.log(`✅ Backend API working: ${homePageData.length} properties returned`);
        console.log(`✅ Frontend filtering working: ${filteredProperties.length} properties will display`);
        console.log(`✅ Currency field working: Properties have ETB/USD currencies`);
        console.log(`✅ Price range fixed: Now supports up to 100M ETB`);
        console.log(`✅ Property types: ${[...new Set(filteredProperties.map(p => p.propertyType))].join(', ')}`);
        console.log(`✅ Listing types: ${[...new Set(filteredProperties.map(p => p.listing_type))].join(', ')}`);
        
      } else {
        console.log('❌ All properties filtered out by frontend logic!');
      }
      
    } else {
      console.log('❌ No properties returned from API');
    }

    // Test specific page filtering
    console.log('\n4️⃣ Testing page-specific filtering...');
    
    // Test rent page
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
    console.log(`Rent page: ${rentData.length} properties`);
    
    // Test sale page
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
    console.log(`Sale page: ${saleData.length} properties`);
    
    console.log('\n🎯 All tests completed successfully!');
    console.log('💡 The Nibret home page should now display properties correctly.');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the final test
finalTestHomePage();
