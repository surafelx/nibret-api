const axios = require('axios');

const API_BASE = 'http://localhost:3001';

async function testCRMFullFlow() {
  console.log('🧪 Testing CRM Full Flow');
  console.log('========================\n');

  try {
    // 1. Test Admin Login
    console.log('1️⃣ Testing Admin Login...');
    const loginResponse = await axios.post(`${API_BASE}/accounts/login/`, {
      username: 'superadmin@nibret.com',
      password: 'NibretSuperAdmin2024!@#'
    });
    
    const token = loginResponse.data.access_token;
    console.log('✅ Login successful');
    console.log(`   User: ${loginResponse.data.user.first_name} ${loginResponse.data.user.last_name}`);
    console.log(`   Role: ${loginResponse.data.user.role}\n`);

    // 2. Test CRM Statistics
    console.log('2️⃣ Testing CRM Statistics...');
    const statsResponse = await axios.get(`${API_BASE}/leads/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ CRM Stats retrieved');
    console.log(`   Total Leads: ${statsResponse.data.data.stats.total}`);
    console.log(`   New Leads: ${statsResponse.data.data.stats.new}`);
    console.log(`   Qualified: ${statsResponse.data.data.stats.qualified}`);
    console.log(`   Converted: ${statsResponse.data.data.stats.converted}\n`);

    // 3. Test Leads List with Pagination
    console.log('3️⃣ Testing Leads List...');
    const leadsResponse = await axios.get(`${API_BASE}/leads?page=1&limit=10&sort_by=created_at&sort_order=desc`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Leads list retrieved');
    console.log(`   Found ${leadsResponse.data.data.length} leads`);
    console.log(`   Pagination: ${leadsResponse.data.pagination.page}/${leadsResponse.data.pagination.pages}`);
    
    if (leadsResponse.data.data.length > 0) {
      const firstLead = leadsResponse.data.data[0];
      console.log(`   Sample Lead: ${firstLead.first_name} ${firstLead.last_name} - ${firstLead.status}`);
    }
    console.log('');

    // 4. Test Property List for Interaction Testing
    console.log('4️⃣ Testing Property List for Interactions...');
    const propertiesResponse = await axios.post(`${API_BASE}/properties/list`, {
      username: 'superadmin@nibret.com',
      password: 'NibretSuperAdmin2024!@#'
    });
    
    console.log(`✅ Properties retrieved: ${propertiesResponse.data.length} properties`);
    
    if (propertiesResponse.data.length > 0) {
      const propertyId = propertiesResponse.data[0].id;
      const propertyTitle = propertiesResponse.data[0].title;
      console.log(`   Using property: ${propertyTitle} (ID: ${propertyId})\n`);

      // 5. Test Property View Tracking
      console.log('5️⃣ Testing Property View Tracking...');
      const viewResponse = await axios.post(`${API_BASE}/properties/${propertyId}/view`);
      
      console.log('✅ Property view tracked');
      console.log(`   Property: ${propertyTitle}`);
      console.log(`   Response: ${viewResponse.data.message}\n`);

      // 6. Test Property Interaction (Lead Creation)
      console.log('6️⃣ Testing Property Interaction Lead Creation...');
      const interactionData = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test.user@example.com',
        phone: '+251900000001',
        interaction_type: 'property_inquiry',
        message: 'Interested in this property for viewing',
        source: 'website' // changed from 'crm_test' to 'website'
      };

      const interactionResponse = await axios.post(`${API_BASE}/properties/${propertyId}/interaction`, interactionData);
      
      console.log('✅ Property interaction tracked');
      console.log(`   Lead ID: ${interactionResponse.data.data.lead_id}`);
      console.log(`   Interaction Type: ${interactionResponse.data.data.interaction_type}`);
      console.log(`   Message: ${interactionResponse.data.message}\n`);

      // 7. Test Updated CRM Stats
      console.log('7️⃣ Testing Updated CRM Statistics...');
      const updatedStatsResponse = await axios.get(`${API_BASE}/leads/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Updated CRM Stats retrieved');
      console.log(`   Total Leads: ${updatedStatsResponse.data.data.stats.total}`);
      console.log(`   New Leads: ${updatedStatsResponse.data.data.stats.new}`);
      console.log(`   Increase: +${updatedStatsResponse.data.data.stats.total - statsResponse.data.data.stats.total} leads\n`);

      // 8. Test Lead Status Update
      console.log('8️⃣ Testing Lead Status Update...');
      const newLeadId = interactionResponse.data.data.lead_id;
      const statusUpdateResponse = await axios.patch(`${API_BASE}/leads/${newLeadId}/status`, {
        status: 'contacted',
        notes: 'Called the lead and scheduled a viewing'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Lead status updated');
      console.log(`   New Status: ${statusUpdateResponse.data.data.status}`);
      console.log(`   Notes: ${statusUpdateResponse.data.data.notes}\n`);

      // 9. Test Lead Interaction Logging
      console.log('9️⃣ Testing Lead Interaction Logging...');
      const interactionLogResponse = await axios.post(`${API_BASE}/leads/${newLeadId}/interactions`, {
        type: 'call',
        description: 'Called lead to discuss property',
        outcome: 'positive',
        notes: 'Lead is very interested and wants to schedule a viewing'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Lead interaction logged');
      console.log(`   Interaction Type: ${interactionLogResponse.data.data.interactions[interactionLogResponse.data.data.interactions.length - 1].type}`);
      console.log(`   Outcome: ${interactionLogResponse.data.data.interactions[interactionLogResponse.data.data.interactions.length - 1].outcome}\n`);

      // 10. Test Customer Management
      console.log('🔟 Testing Customer Management...');
      const customersResponse = await axios.get(`${API_BASE}/accounts/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const customers = customersResponse.data.users.filter(user => user.role === 'CUSTOMER');
      console.log('✅ Customers retrieved');
      console.log(`   Total Customers: ${customers.length}`);
      if (customers.length > 0) {
        console.log(`   Sample Customer: ${customers[0].first_name} ${customers[0].last_name} (${customers[0].email})`);
      }
      console.log('');

    } else {
      console.log('⚠️ No properties found for interaction testing\n');
    }

    // 11. Test Lead Filtering
    console.log('1️⃣1️⃣ Testing Lead Filtering...');
    const newLeadsResponse = await axios.get(`${API_BASE}/leads?status=new&page=1&limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Lead filtering working');
    console.log(`   New leads found: ${newLeadsResponse.data.data.length}`);
    console.log('');

    // 12. Test Lead Search
    console.log('1️⃣2️⃣ Testing Lead Search...');
    const searchResponse = await axios.get(`${API_BASE}/leads?search=test&page=1&limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Lead search working');
    console.log(`   Search results: ${searchResponse.data.data.length} leads found`);
    console.log('');

    console.log('🎉 CRM Full Flow Test COMPLETED!');
    console.log('================================');
    console.log('✅ Admin Authentication');
    console.log('✅ CRM Statistics');
    console.log('✅ Lead Management');
    console.log('✅ Property View Tracking');
    console.log('✅ Property Interaction Lead Creation');
    console.log('✅ Lead Status Updates');
    console.log('✅ Interaction Logging');
    console.log('✅ Customer Management');
    console.log('✅ Lead Filtering');
    console.log('✅ Lead Search');
    console.log('✅ Real-time Data Updates');
    
    console.log('\n🚀 CRM System Status: FULLY FUNCTIONAL');
    console.log('   - All core features working');
    console.log('   - User interactions tracked');
    console.log('   - Lead management operational');
    console.log('   - Property tracking active');
    console.log('   - Admin dashboard accessible');
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Visit http://localhost:5173/dashboard');
    console.log('   2. Login with admin credentials');
    console.log('   3. Navigate to CRM section');
    console.log('   4. Test all features in the UI');

  } catch (error) {
    console.error('❌ CRM Test failed:', error.response?.data || error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

// Run the test
testCRMFullFlow(); 