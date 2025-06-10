// Debug why properties aren't showing on home page
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function debugHomePageProperties() {
  console.log('🔍 Debugging Home Page Property Display...\n');

  try {
    // Step 1: Check what properties exist in database
    console.log('1️⃣ Checking all properties in database...');
    
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

    // Get all user's properties (including drafts)
    const myPropertiesResponse = await fetch(`${API_BASE_URL}/properties/my-properties`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const myPropertiesData = await myPropertiesResponse.json();
    const allProperties = myPropertiesData.data || myPropertiesData;
    
    console.log(`Total properties in database: ${allProperties.length}`);
    
    if (allProperties.length > 0) {
      console.log('\n📋 All properties breakdown:');
      allProperties.forEach((property, index) => {
        console.log(`${index + 1}. "${property.title}"`);
        console.log(`   - Status: ${property.status}`);
        console.log(`   - Publish Status: ${property.publish_status}`);
        console.log(`   - Listing Type: ${property.listing_type}`);
        console.log(`   - Price: ${property.price} ${property.currency || 'ETB'}`);
        console.log(`   - Created: ${property.created_at}`);
        console.log('');
      });

      // Count by publish status
      const publishedCount = allProperties.filter(p => p.publish_status === 'published').length;
      const draftCount = allProperties.filter(p => p.publish_status === 'draft').length;
      
      console.log(`📊 Publish Status Breakdown:`);
      console.log(`   - Published: ${publishedCount}`);
      console.log(`   - Draft: ${draftCount}`);
      console.log(`   - Other: ${allProperties.length - publishedCount - draftCount}`);
    }

    // Step 2: Test the exact API call that home page makes
    console.log('\n2️⃣ Testing home page API call (/properties/list)...');
    
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
    
    console.log('Home page API response status:', homePageResponse.status);
    console.log('Home page API response type:', Array.isArray(homePageData) ? 'Array' : typeof homePageData);
    console.log('Home page properties count:', Array.isArray(homePageData) ? homePageData.length : 'N/A');
    
    if (Array.isArray(homePageData)) {
      if (homePageData.length > 0) {
        console.log('\n✅ Home page API returns properties:');
        homePageData.forEach((property, index) => {
          console.log(`${index + 1}. "${property.title}" (${property.publish_status})`);
        });
      } else {
        console.log('\n❌ Home page API returns empty array!');
        console.log('This means the filtering is removing all properties.');
      }
    } else {
      console.log('\n❌ Home page API returns non-array response!');
      console.log('Response:', homePageData);
    }

    // Step 3: Test without any filters
    console.log('\n3️⃣ Testing API without filters...');
    
    const noFilterResponse = await fetch(`${API_BASE_URL}/properties/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: "0965789832",
        password: "nibretadmin"
        // No additional filters
      })
    });

    const noFilterData = await noFilterResponse.json();
    console.log('No filter response count:', Array.isArray(noFilterData) ? noFilterData.length : 'N/A');

    // Step 4: Create a test published property if none exist
    if (!Array.isArray(homePageData) || homePageData.length === 0) {
      console.log('\n4️⃣ Creating test published property...');
      
      const testPropertyData = {
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
        title: 'Test Home Page Property',
        description: 'This property should appear on the home page',
        price: 1500000,
        currency: 'ETB',
        beds: 2,
        baths: 1,
        sqft: 100,
        address: 'Test Address, Addis Ababa',
        propertyType: 'apartment',
        status: 'for_sale',
        listing_type: 'sale',
        lat: 9.0320,
        lng: 38.7469,
        images: [],
        publish_status: 'published' // Explicitly set as published
      };

      const createResponse = await fetch(`${API_BASE_URL}/properties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPropertyData)
      });

      const createResult = await createResponse.json();
      
      if (createResponse.ok) {
        console.log('✅ Test property created successfully!');
        console.log('Property details:', {
          id: createResult.data?.id || createResult.id,
          title: createResult.data?.title || createResult.title,
          publish_status: createResult.data?.publish_status || createResult.publish_status
        });

        // Test home page API again
        console.log('\n5️⃣ Testing home page API after creating published property...');
        
        const retestResponse = await fetch(`${API_BASE_URL}/properties/list`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            username: "0965789832",
            password: "nibretadmin"
          })
        });

        const retestData = await retestResponse.json();
        console.log('Retest response count:', Array.isArray(retestData) ? retestData.length : 'N/A');
        
        if (Array.isArray(retestData) && retestData.length > 0) {
          console.log('✅ Properties now showing on home page!');
        } else {
          console.log('❌ Still no properties on home page after creating published property!');
        }
      } else {
        console.log('❌ Failed to create test property!');
        console.log('Error:', createResult);
      }
    }

    // Step 6: Check frontend filtering logic simulation
    console.log('\n6️⃣ Simulating frontend filtering logic...');
    
    if (Array.isArray(homePageData) && homePageData.length > 0) {
      // Simulate Index.tsx filtering with updated price range
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
        
        console.log(`Property "${property.title}":`, {
          price: property.price,
          matchesPrice,
          propertyType: property.propertyType,
          matchesPropertyType,
          beds: property.beds,
          matchesBedrooms,
          matchesSearch,
          passesFilter: matchesSearch && matchesPrice && matchesPropertyType && matchesBedrooms
        });
        
        return matchesSearch && matchesPrice && matchesPropertyType && matchesBedrooms;
      });
      
      console.log(`\nFiltering result: ${filteredProperties.length}/${homePageData.length} properties pass frontend filters`);
      
      if (filteredProperties.length === 0) {
        console.log('❌ All properties filtered out by frontend logic!');
      } else {
        console.log('✅ Properties should display on frontend!');
      }
    }

  } catch (error) {
    console.error('❌ Debug failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the debug
debugHomePageProperties();
