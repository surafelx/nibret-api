// Debug frontend property display issue
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function debugFrontendProperties() {
  console.log('🔍 Debugging Frontend Property Display Issue...\n');

  try {
    // Test the exact API call that the frontend Index page makes
    console.log('1️⃣ Testing Index page API call...');
    
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
    
    console.log('✅ API Response received');
    console.log('Response status:', response.status);
    console.log('Response is array:', Array.isArray(data));
    console.log('Properties count:', Array.isArray(data) ? data.length : 'N/A');
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('\n📋 Detailed property analysis:');
      
      data.forEach((property, index) => {
        console.log(`\nProperty ${index + 1}:`);
        console.log('  - ID:', property.id || property._id);
        console.log('  - Title:', property.title);
        console.log('  - Price:', property.price);
        console.log('  - Status:', property.status);
        console.log('  - Publish Status:', property.publish_status);
        console.log('  - Listing Type:', property.listing_type);
        console.log('  - Beds:', property.beds);
        console.log('  - Baths:', property.baths);
        console.log('  - Sqft:', property.sqft);
        console.log('  - Address:', property.address);
        console.log('  - Images:', property.images ? property.images.length : 0, 'images');
        console.log('  - Has required fields:', {
          id: !!(property.id || property._id),
          title: !!property.title,
          price: !!property.price,
          beds: property.beds !== undefined,
          baths: property.baths !== undefined,
          sqft: !!property.sqft,
          address: !!property.address
        });
      });
      
      // Check if properties meet frontend requirements
      console.log('\n🔍 Frontend compatibility check:');
      
      const validProperties = data.filter(property => {
        const hasId = !!(property.id || property._id);
        const hasTitle = !!property.title;
        const hasPrice = !!property.price;
        const hasBeds = property.beds !== undefined;
        const hasBaths = property.baths !== undefined;
        const hasSqft = !!property.sqft;
        const hasAddress = !!property.address;
        
        return hasId && hasTitle && hasPrice && hasBeds && hasBaths && hasSqft && hasAddress;
      });
      
      console.log(`Valid properties for frontend: ${validProperties.length}/${data.length}`);
      
      if (validProperties.length !== data.length) {
        console.log('❌ Some properties are missing required fields');
        data.forEach((property, index) => {
          const hasId = !!(property.id || property._id);
          const hasTitle = !!property.title;
          const hasPrice = !!property.price;
          const hasBeds = property.beds !== undefined;
          const hasBaths = property.baths !== undefined;
          const hasSqft = !!property.sqft;
          const hasAddress = !!property.address;
          
          if (!(hasId && hasTitle && hasPrice && hasBeds && hasBaths && hasSqft && hasAddress)) {
            console.log(`  Property ${index + 1} missing:`, {
              id: !hasId,
              title: !hasTitle,
              price: !hasPrice,
              beds: !hasBeds,
              baths: !hasBaths,
              sqft: !hasSqft,
              address: !hasAddress
            });
          }
        });
      } else {
        console.log('✅ All properties have required fields');
      }
      
      // Test property filtering logic (like in Index.tsx)
      console.log('\n🔍 Testing Index page filtering logic:');
      
      // Simulate the filtering that happens in Index.tsx
      const searchTerm = '';
      const priceRange = [0, 10000000];
      const propertyType = 'any';
      const bedrooms = 'any';
      
      let filteredProperties = data.filter(property => {
        const matchesSearch = !searchTerm || 
          property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          property.address.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesPrice = property.price >= priceRange[0] && property.price <= priceRange[1];
        
        const matchesPropertyType = propertyType === 'any' || property.propertyType === propertyType;
        
        const matchesBedrooms = bedrooms === 'any' || property.beds >= parseInt(bedrooms);
        
        return matchesSearch && matchesPrice && matchesPropertyType && matchesBedrooms;
      });
      
      console.log(`After filtering: ${filteredProperties.length}/${data.length} properties`);
      
      if (filteredProperties.length === 0) {
        console.log('❌ All properties filtered out!');
        console.log('Filter criteria:');
        console.log('  - Search term:', searchTerm || 'none');
        console.log('  - Price range:', priceRange);
        console.log('  - Property type:', propertyType);
        console.log('  - Bedrooms:', bedrooms);
      } else {
        console.log('✅ Properties pass filtering');
      }
      
    } else {
      console.log('❌ No properties returned from API');
    }

    // Test if there are any authentication issues
    console.log('\n2️⃣ Testing authentication state...');
    
    // Simulate non-authenticated user (should show limited properties)
    console.log('For non-authenticated users, properties should be limited to 3');
    
    if (Array.isArray(data)) {
      const limitedProperties = data.slice(0, 3);
      console.log(`Limited properties: ${limitedProperties.length}`);
      
      if (limitedProperties.length > 0) {
        console.log('✅ Non-authenticated users should see properties');
      } else {
        console.log('❌ Non-authenticated users will see no properties');
      }
    }

  } catch (error) {
    console.error('❌ Debug failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugFrontendProperties();
