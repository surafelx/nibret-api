const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Property = require('../models/Property');
require('dotenv').config();

const sampleLeads = [
  {
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@email.com',
    phone: '+251911234567',
    source: 'website',
    status: 'new',
    priority: 'high',
    property_preferences: {
      budget_min: 5000000,
      budget_max: 8000000,
      property_type: ['house', 'villa'],
      bedrooms: 3,
      bathrooms: 2,
      location_preferences: ['Bole', 'Kazanchis']
    },
    notes: 'Interested in family home with garden',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'property_search'
  },
  {
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+251922345678',
    source: 'phone_call',
    status: 'contacted',
    priority: 'medium',
    property_preferences: {
      budget_min: 3000000,
      budget_max: 5000000,
      property_type: ['apartment'],
      bedrooms: 2,
      bathrooms: 1,
      location_preferences: ['Kazanchis', 'Piazza']
    },
    notes: 'Looking for modern apartment near city center',
    utm_source: 'facebook',
    utm_medium: 'social',
    utm_campaign: 'apartment_ads'
  },
  {
    first_name: 'Michael',
    last_name: 'Brown',
    email: 'michael.brown@email.com',
    phone: '+251933456789',
    source: 'email',
    status: 'qualified',
    priority: 'urgent',
    property_preferences: {
      budget_min: 10000000,
      budget_max: 15000000,
      property_type: ['villa', 'house'],
      bedrooms: 4,
      bathrooms: 3,
      location_preferences: ['Bole', 'Old Airport']
    },
    notes: 'Executive looking for luxury property',
    utm_source: 'linkedin',
    utm_medium: 'social',
    utm_campaign: 'luxury_properties'
  },
  {
    first_name: 'Emily',
    last_name: 'Davis',
    email: 'emily.davis@email.com',
    phone: '+251944567890',
    source: 'website',
    status: 'converted',
    priority: 'low',
    property_preferences: {
      budget_min: 2000000,
      budget_max: 3500000,
      property_type: ['studio', 'apartment'],
      bedrooms: 1,
      bathrooms: 1,
      location_preferences: ['Piazza', 'Meskel Square']
    },
    notes: 'First-time buyer, converted to customer',
    utm_source: 'instagram',
    utm_medium: 'social',
    utm_campaign: 'first_time_buyers'
  },
  {
    first_name: 'David',
    last_name: 'Wilson',
    email: 'david.wilson@email.com',
    phone: '+251955678901',
    source: 'referral',
    status: 'lost',
    priority: 'medium',
    property_preferences: {
      budget_min: 4000000,
      budget_max: 6000000,
      property_type: ['house'],
      bedrooms: 3,
      bathrooms: 2,
      location_preferences: ['Kazanchis']
    },
    notes: 'Found property elsewhere',
    utm_source: 'referral',
    utm_medium: 'word_of_mouth',
    utm_campaign: 'referral_program'
  }
];

async function seedDashboardData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing leads
    console.log('🧹 Clearing existing leads...');
    await Lead.deleteMany({});
    console.log('✅ Existing leads cleared');

    // Create sample leads
    console.log('📝 Creating sample leads...');
    const createdLeads = await Lead.insertMany(sampleLeads);
    console.log(`✅ Created ${createdLeads.length} sample leads`);

    // Get some properties to link to leads
    const properties = await Property.find().limit(3);
    
    if (properties.length > 0) {
      console.log('🔗 Linking leads to properties...');
      
      // Update leads with property interests
      for (let i = 0; i < Math.min(createdLeads.length, properties.length); i++) {
        await Lead.findByIdAndUpdate(createdLeads[i]._id, {
          interested_property: properties[i]._id
        });
      }
      console.log('✅ Linked leads to properties');
    }

    // Display summary
    console.log('\n📊 CRM Data Summary:');
    const stats = await Lead.getLeadStats();
    console.log('   Total Leads:', stats.total);
    console.log('   New Leads:', stats.new);
    console.log('   Contacted:', stats.contacted);
    console.log('   Qualified:', stats.qualified);
    console.log('   Converted:', stats.converted);
    console.log('   Lost:', stats.lost);

    console.log('\n🎯 Sample Lead Statuses:');
    createdLeads.forEach((lead, index) => {
      console.log(`   ${index + 1}. ${lead.first_name} ${lead.last_name} - ${lead.status} (${lead.source})`);
    });

    console.log('\n🚀 CRM is ready for testing!');
    console.log('   - Visit http://localhost:5173/dashboard');
    console.log('   - Login as admin: superadmin@nibret.com');
    console.log('   - Check the CRM section for sample data');

  } catch (error) {
    console.error('❌ Error seeding dashboard data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

if (require.main === module) {
  console.log('🌱 Nibret CRM Data Seeding Script');
  console.log('================================\n');
  seedDashboardData();
}

module.exports = { seedDashboardData };
