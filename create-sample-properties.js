// Create sample properties for home page display
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function createSampleProperties() {
  console.log('🏠 Creating Sample Properties for Home Page...\n');

  try {
    // Login as admin
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

    const sampleProperties = [
      {
        title: 'Modern 2-Bedroom Apartment in Bole',
        description: 'Spacious apartment with modern amenities in the heart of Bole',
        price: 3500000,
        currency: 'ETB',
        beds: 2,
        baths: 2,
        sqft: 120,
        address: 'Bole, Addis Ababa',
        propertyType: 'apartment',
        status: 'for_sale',
        listing_type: 'sale',
        publish_status: 'published'
      },
      {
        title: 'Cozy Studio for Rent in Kazanchis',
        description: 'Perfect studio apartment for young professionals',
        price: 8000,
        currency: 'ETB',
        beds: 0,
        baths: 1,
        sqft: 45,
        address: 'Kazanchis, Addis Ababa',
        propertyType: 'studio',
        status: 'for_rent',
        listing_type: 'rent',
        publish_status: 'published'
      },
      {
        title: 'Luxury 4-Bedroom House in CMC',
        description: 'Beautiful family house with garden and parking',
        price: 12000000,
        currency: 'ETB',
        beds: 4,
        baths: 3,
        sqft: 250,
        address: 'CMC, Addis Ababa',
        propertyType: 'house',
        status: 'for_sale',
        listing_type: 'both',
        publish_status: 'published'
      },
      {
        title: 'Premium Condo in Sarbet',
        description: 'High-end condominium with city views',
        price: 180000,
        currency: 'USD',
        beds: 3,
        baths: 2,
        sqft: 150,
        address: 'Sarbet, Addis Ababa',
        propertyType: 'condo',
        status: 'for_sale',
        listing_type: 'sale',
        publish_status: 'published'
      },
      {
        title: 'Affordable 1-Bedroom Apartment',
        description: 'Great starter home for first-time buyers',
        price: 1800000,
        currency: 'ETB',
        beds: 1,
        baths: 1,
        sqft: 65,
        address: 'Piassa, Addis Ababa',
        propertyType: 'apartment',
        status: 'for_sale',
        listing_type: 'sale',
        publish_status: 'published'
      }
    ];

    console.log('Creating sample properties...\n');

    for (let i = 0; i < sampleProperties.length; i++) {
      const propertyData = {
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
        ...sampleProperties[i],
        lat: 9.0320 + (Math.random() - 0.5) * 0.1, // Random coordinates around Addis
        lng: 38.7469 + (Math.random() - 0.5) * 0.1,
        images: []
      };

      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(propertyData)
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✅ Created: "${propertyData.title}"`);
        console.log(`   Price: ${propertyData.price} ${propertyData.currency}`);
        console.log(`   Status: ${propertyData.status} (${propertyData.listing_type})`);
      } else {
        console.log(`❌ Failed to create: "${propertyData.title}"`);
        console.log(`   Error: ${result.error}`);
      }
    }

    // Test home page after creating properties
    console.log('\n🧪 Testing home page after creating properties...');
    
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
    
    console.log(`\n📊 Home page now shows: ${homePageData.length} properties`);
    
    if (homePageData.length > 0) {
      console.log('\n🏠 Properties on home page:');
      homePageData.forEach((property, index) => {
        console.log(`${index + 1}. ${property.title}`);
        console.log(`   ${property.price} ${property.currency || 'ETB'} - ${property.beds} bed, ${property.baths} bath`);
      });
      
      console.log('\n🎉 Home page should now display properties!');
    } else {
      console.log('\n❌ Still no properties on home page');
    }

  } catch (error) {
    console.error('❌ Failed to create sample properties:', error.message);
  }
}

// Run the script
createSampleProperties();
