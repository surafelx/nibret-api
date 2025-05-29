const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Property = require('../models/Property');
const Customer = require('../models/Customer');
const Lead = require('../models/Lead');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('📦 MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Property.deleteMany({});
    await Customer.deleteMany({});
    await Lead.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create admin user
    const adminUser = await User.create({
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@nibret.com',
      phone: '0965789832',
      password: 'nibretadmin',
      role: 'ADMIN'
    });

    // Create sample customer users
    const customer1 = await User.create({
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      phone: '0911234567',
      password: 'password123',
      role: 'CUSTOMER'
    });

    const customer2 = await User.create({
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      phone: '0922345678',
      password: 'password123',
      role: 'CUSTOMER'
    });

    console.log('👥 Created users');

    // Create sample properties
    const properties = [
      {
        title: 'Modern Villa with Garden',
        description: 'Beautiful modern villa with spacious garden and pool area. Perfect for family living.',
        price: 750000,
        beds: 4,
        baths: 3,
        sqft: 2800,
        address: '123 Highland Ave, Addis Ababa',
        lat: 9.0227,
        lng: 38.7468,
        propertyType: 'villa',
        status: 'for_sale',
        images: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'
        ],
        yearBuilt: 2018,
        lotSize: 0.45,
        owner: adminUser._id,
        features: ['Swimming Pool', 'Garden', 'Garage', 'Security System']
      },
      {
        title: 'Luxury Apartment Downtown',
        description: 'High-end apartment in the heart of the city with stunning views.',
        price: 450000,
        beds: 3,
        baths: 2,
        sqft: 1800,
        address: '456 City Center, Addis Ababa',
        lat: 9.0300,
        lng: 38.7600,
        propertyType: 'apartment',
        status: 'for_sale',
        images: [
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c',
          'https://images.unsplash.com/photo-1568605114967-8130f3a36994'
        ],
        yearBuilt: 2020,
        owner: adminUser._id,
        features: ['City View', 'Balcony', 'Modern Kitchen', 'Elevator']
      },
      {
        title: 'Family Home with Pool',
        description: 'Spacious family home with private pool and large backyard.',
        price: 680000,
        beds: 5,
        baths: 4,
        sqft: 3200,
        address: '789 Suburb Ave, Addis Ababa',
        lat: 9.0400,
        lng: 38.7350,
        propertyType: 'house',
        status: 'for_sale',
        images: [
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c'
        ],
        yearBuilt: 2015,
        lotSize: 0.6,
        owner: customer1._id,
        features: ['Swimming Pool', 'Large Backyard', 'Double Garage', 'Fireplace']
      },
      {
        title: 'Modern Apartment for Rent',
        description: 'Contemporary apartment available for rent in prime location.',
        price: 1500,
        beds: 2,
        baths: 1,
        sqft: 1200,
        address: '321 Urban District, Addis Ababa',
        lat: 9.0150,
        lng: 38.7700,
        propertyType: 'apartment',
        status: 'for_rent',
        images: [
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9'
        ],
        yearBuilt: 2019,
        owner: customer2._id,
        features: ['Modern Kitchen', 'Balcony', 'Parking Space']
      }
    ];

    const createdProperties = await Property.create(properties);
    console.log('🏠 Created properties');

    // Create sample customers
    const customers = [
      {
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@example.com',
        phone: '0933456789',
        preferences: {
          property_types: ['apartment', 'condo'],
          min_price: 300000,
          max_price: 500000,
          min_beds: 2,
          max_beds: 3,
          preferred_locations: ['City Center', 'Downtown']
        },
        notes: 'Looking for modern apartment in city center',
        source: 'website',
        status: 'active'
      },
      {
        first_name: 'Bob',
        last_name: 'Wilson',
        email: 'bob@example.com',
        phone: '0944567890',
        preferences: {
          property_types: ['house', 'villa'],
          min_price: 600000,
          max_price: 800000,
          min_beds: 4,
          preferred_locations: ['Suburbs']
        },
        notes: 'Family with children, needs large house',
        source: 'referral',
        status: 'active'
      }
    ];

    const createdCustomers = await Customer.create(customers);
    console.log('👤 Created customers');

    // Create sample leads
    const leads = [
      {
        name: 'Sarah Connor',
        email: 'sarah@example.com',
        phone: '0955678901',
        property: createdProperties[0].title,
        property_id: createdProperties[0]._id,
        message: 'Very interested in this villa. Can we schedule a viewing?',
        status: 'new',
        source: 'website_form',
        priority: 'high'
      },
      {
        name: 'Mike Ross',
        email: 'mike@example.com',
        phone: '0966789012',
        property: createdProperties[1].title,
        property_id: createdProperties[1]._id,
        message: 'Looking for apartment in this area. Is this still available?',
        status: 'contacted',
        source: 'website_form',
        priority: 'medium',
        assigned_to: adminUser._id
      },
      {
        name: 'Emma Watson',
        email: 'emma@example.com',
        phone: '0977890123',
        property: 'General Inquiry',
        message: 'Looking for rental properties under $2000',
        status: 'new',
        source: 'website_form',
        priority: 'low'
      }
    ];

    await Lead.create(leads);
    console.log('📋 Created leads');

    console.log('✅ Seed data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Users: ${await User.countDocuments()}`);
    console.log(`- Properties: ${await Property.countDocuments()}`);
    console.log(`- Customers: ${await Customer.countDocuments()}`);
    console.log(`- Leads: ${await Lead.countDocuments()}`);
    
    console.log('\n🔐 Admin Credentials:');
    console.log('Username: 0965789832');
    console.log('Password: nibretadmin');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seed script
const runSeed = async () => {
  await connectDB();
  await seedData();
};

runSeed();
