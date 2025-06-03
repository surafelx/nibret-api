// Test property ID transformation
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000';

async function testPropertyIdTransformation() {
  console.log('🧪 Testing Property ID Transformation...\n');

  try {
    // Test properties list endpoint
    console.log('1. Testing /properties/list endpoint...');
    const response = await fetch(`${API_BASE}/properties/list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: '0965789832',
        password: 'nibretadmin'
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const properties = await response.json();
    console.log('   ✅ Properties fetched successfully');
    console.log('   Total properties:', properties.length);

    if (properties.length > 0) {
      const firstProperty = properties[0];
      console.log('\n📋 First property structure:');
      console.log('   Has id field:', !!firstProperty.id);
      console.log('   Has _id field:', !!firstProperty._id);
      console.log('   ID value:', firstProperty.id || firstProperty._id);
      console.log('   Title:', firstProperty.title);

      if (firstProperty.id) {
        console.log('   ✅ Property has id field (frontend compatible)');
        
        // Test if we can fetch individual property by ID
        console.log('\n2. Testing individual property fetch...');
        try {
          const propertyResponse = await fetch(`${API_BASE}/properties/${firstProperty.id}`);
          
          if (propertyResponse.ok) {
            const property = await propertyResponse.json();
            console.log('   ✅ Individual property fetch successful');
            console.log('   Property ID:', property.data?.id || property.data?._id);
            console.log('   Property title:', property.data?.title);
          } else {
            console.log('   ⚠️ Individual property fetch failed:', propertyResponse.status);
          }
        } catch (error) {
          console.log('   ❌ Individual property fetch error:', error.message);
        }
        
      } else if (firstProperty._id) {
        console.log('   ❌ Property still has _id field (needs transformation)');
        console.log('   🔧 The toJSON transformation may not be working');
      } else {
        console.log('   ❌ Property has neither id nor _id field');
      }

      console.log('\n🎯 Frontend Impact:');
      if (firstProperty.id) {
        console.log('   ✅ PropertyCard links will work: /property/' + firstProperty.id);
        console.log('   ✅ PropertyDetails page will load correctly');
        console.log('   ✅ No more /property/undefined errors');
      } else {
        console.log('   ❌ PropertyCard links will still show: /property/undefined');
        console.log('   ❌ PropertyDetails page will not load');
        console.log('   🔧 Need to fix ID transformation');
      }

    } else {
      console.log('   ⚠️ No properties found in database');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function runTest() {
  console.log('🚀 Property ID Transformation Test\n');
  console.log('This test checks if MongoDB _id is properly converted to id for frontend\n');
  
  await testPropertyIdTransformation();
  
  console.log('\n🏁 Test Completed!\n');
  
  console.log('📊 What should happen:');
  console.log('   ✅ Properties should have "id" field instead of "_id"');
  console.log('   ✅ PropertyCard should link to /property/{actual-id}');
  console.log('   ✅ PropertyDetails page should load with real data');
  
  console.log('\n💡 If test fails:');
  console.log('   1. Check Property model toJSON transformation');
  console.log('   2. Verify API responses include id field');
  console.log('   3. Test frontend PropertyCard component');
}

runTest();
