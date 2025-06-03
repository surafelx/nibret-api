const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Property = require('../models/Property');
const Lead = require('../models/Lead');
const User = require('../models/User');

// Sample data
const sampleProperties = [
  {
    title: "Luxury Villa in Bole",
    description: "Beautiful 4-bedroom villa with modern amenities in the heart of Bole",
    price: 15000000,
    beds: 4,
    baths: 3,
    sqft: 3500,
    address: "Bole Sub City, Addis Ababa",
    lat: 9.0192,
    lng: 38.7525,
    propertyType: "villa",
    status: "for_sale",
    publish_status: "published",
    listing_type: "sale",
    yearBuilt: 2020,
    lotSize: 500,
    features: ["Swimming Pool", "Garden", "Garage", "Security System"],
    images: ["https://example.com/villa1.jpg"]
  },
  {
    title: "Modern Apartment in Kazanchis",
    description: "2-bedroom apartment with city views",
    price: 8500000,
    beds: 2,
    baths: 2,
    sqft: 1200,
    address: "Kazanchis, Addis Ababa",
    lat: 9.0320,
    lng: 38.7469,
    propertyType: "apartment",
    status: "for_sale",
    publish_status: "published",
    listing_type: "sale",
    yearBuilt: 2019,
    features: ["Balcony", "Elevator", "Parking"],
    images: ["https://example.com/apartment1.jpg"]
  },
  {
    title: "Cozy House in Piassa",
    description: "3-bedroom traditional house in historic Piassa",
    price: 6000000,
    beds: 3,
    baths: 2,
    sqft: 1800,
    address: "Piassa, Addis Ababa",
    lat: 9.0370,
    lng: 38.7578,
    propertyType: "house",
    status: "for_sale",
    publish_status: "published",
    listing_type: "sale",
    yearBuilt: 2015,
    features: ["Garden", "Traditional Architecture"],
    images: ["https://example.com/house1.jpg"]
  },
  {
    title: "Studio Apartment for Rent",
    description: "Furnished studio apartment near Bole Airport",
    price: 25000,
    beds: 0,
    baths: 1,
    sqft: 450,
    address: "Bole Airport Area, Addis Ababa",
    lat: 9.0000,
    lng: 38.7500,
    propertyType: "studio",
    status: "for_rent",
    publish_status: "published",
    listing_type: "rent",
    yearBuilt: 2021,
    features: ["Furnished", "Near Airport", "Security"],
    images: ["https://example.com/studio1.jpg"]
  },
  {
    title: "Townhouse in CMC",
    description: "Spacious 3-bedroom townhouse with garage",
    price: 12000000,
    beds: 3,
    baths: 2,
    sqft: 2200,
    address: "CMC, Addis Ababa",
    lat: 9.0100,
    lng: 38.7600,
    propertyType: "townhouse",
    status: "for_sale",
    publish_status: "published",
    listing_type: "sale",
    yearBuilt: 2018,
    features: ["Garage", "Garden", "Modern Kitchen"],
    images: ["https://example.com/townhouse1.jpg"]
  }
];

const sampleLeads = [
  {
    first_name: "John",
    last_name: "Smith",
    email: "john.smith@email.com",
    phone: "+251911123456",
    source: "website",
    status: "new",
    priority: "medium",
    property_preferences: {
      budget_min: 5000000,
      budget_max: 10000000,
      property_type: ["apartment", "house"],
      bedrooms: 2,
      location_preferences: ["Bole", "Kazanchis"]
    },
    notes: "Looking for a family home"
  },
  {
    first_name: "Sarah",
    last_name: "Johnson",
    email: "sarah.johnson@email.com",
    phone: "+251922234567",
    source: "phone_call",
    status: "contacted",
    priority: "high",
    property_preferences: {
      budget_min: 10000000,
      budget_max: 20000000,
      property_type: ["villa"],
      bedrooms: 4,
      location_preferences: ["Bole"]
    },
    notes: "Interested in luxury properties"
  },
  {
    first_name: "Michael",
    last_name: "Brown",
    email: "michael.brown@email.com",
    phone: "+251933345678",
    source: "referral",
    status: "qualified",
    priority: "high",
    property_preferences: {
      budget_min: 15000000,
      budget_max: 25000000,
      property_type: ["villa", "house"],
      bedrooms: 3,
      location_preferences: ["Bole", "CMC"]
    },
    notes: "Ready to purchase within 30 days"
  },
  {
    first_name: "Emily",
    last_name: "Davis",
    email: "emily.davis@email.com",
    phone: "+251944456789",
    source: "social_media",
    status: "new",
    priority: "low",
    property_preferences: {
      budget_min: 20000,
      budget_max: 50000,
      property_type: ["studio", "apartment"],
      bedrooms: 1,
      location_preferences: ["Bole Airport Area"]
    },
    notes: "Looking for rental property"
  },
  {
    first_name: "David",
    last_name: "Wilson",
    email: "david.wilson@email.com",
    phone: "+251955567890",
    source: "advertisement",
    status: "lost",
    priority: "medium",
    property_preferences: {
      budget_min: 8000000,
      budget_max: 12000000,
      property_type: ["townhouse"],
      bedrooms: 3,
      location_preferences: ["CMC"]
    },
    notes: "Found property elsewhere"
  }
];

async function seedDashboardData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Get admin user
    const adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }
    console.log('👤 Found admin user:', adminUser.first_name, adminUser.last_name);

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Property.deleteMany({});
    await Lead.deleteMany({});

    // Seed properties
    console.log('🏠 Seeding properties...');
    const properties = [];
    for (const propertyData of sampleProperties) {
      const property = await Property.create({
        ...propertyData,
        owner: adminUser._id
      });
      properties.push(property);
      console.log(`✅ Created property: ${property.title}`);
    }

    // Seed leads
    console.log('📈 Seeding leads...');
    const leads = [];
    for (const leadData of sampleLeads) {
      const lead = await Lead.create({
        ...leadData,
        assigned_to: adminUser._id,
        interested_property: properties[Math.floor(Math.random() * properties.length)]._id
      });
      leads.push(lead);
      console.log(`✅ Created lead: ${lead.first_name} ${lead.last_name}`);
    }

    console.log('\n🎉 Dashboard data seeding completed!');
    console.log(`📊 Created ${properties.length} properties`);
    console.log(`📈 Created ${leads.length} leads`);
    
    // Display summary
    const leadStats = await Lead.getLeadStats();
    console.log('\n📋 Lead Statistics:');
    console.log(`• Total: ${leadStats.total}`);
    console.log(`• New: ${leadStats.new}`);
    console.log(`• Contacted: ${leadStats.contacted}`);
    console.log(`• Qualified: ${leadStats.qualified}`);
    console.log(`• Lost: ${leadStats.lost}`);
    console.log(`• Converted: ${leadStats.converted}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDashboardData();
