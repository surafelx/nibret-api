// Quick test of currency field
require('dotenv').config();

const API_BASE_URL = 'http://localhost:3000';

async function testCurrency() {
  console.log('💰 Quick Currency Field Test...\n');

  try {
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

    // Test creating property with USD currency
    const usdPropertyData = {
      username: process.env.ADMIN_USERNAME,
      password: process.env.ADMIN_PASSWORD,
      title: 'USD Currency Test Property',
      description: 'Testing USD currency field',
      price: 250000,
      currency: 'USD',
      beds: 3,
      baths: 2,
      sqft: 150,
      address: 'Test Address',
      propertyType: 'house',
      status: 'for_sale',
      listing_type: 'sale',
      publish_status: 'published'
    };

    const response = await fetch(`${API_BASE_URL}/properties`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(usdPropertyData)
    });

    const result = await response.json();

    console.log('Response status:', response.status);
    
    if (response.ok) {
      console.log('✅ Currency field working!');
      console.log('Property created with currency:', result.data?.currency || result.currency);
    } else {
      console.log('❌ Currency field error:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCurrency();
