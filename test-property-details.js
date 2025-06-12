const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nibret-api');
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

// Property model
const propertySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  currency: { type: String, enum: ['ETB', 'USD'], default: 'ETB' },
  beds: { type: Number, required: true },
  baths: { type: Number, required: true },
  sqft: { type: Number, required: true },
  address: { type: String, required: true },
  lat: { type: Number, default: 8.9806 },
  lng: { type: Number, default: 38.7578 },
  propertyType: { 
    type: String, 
    enum: ['house', 'apartment', 'condo', 'villa', 'townhouse', 'studio', 'other'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['for_sale', 'for_rent', 'sold', 'rented', 'off_market'],
    default: 'for_sale'
  },
  publish_status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'pending_review'],
    default: 'published'
  },
  listing_type: {
    type: String,
    enum: ['sale', 'rent', 'both'],
    default: 'sale'
  },
  images: [String],
  yearBuilt: Number,
  lotSize: Number,
  features: [String],
  contact_info: {
    phone: String,
    email: String,
    agent_name: String
  },
  views: { type: Number, default: 0 },
  is_featured: { type: Boolean, default: false },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Property = mongoose.model('Property', propertySchema);

// User model (simplified)
const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  email: String,
  phone: String,
  role: { type: String, default: 'USER' }
});

const User = mongoose.model('User', userSchema);

const testPropertyDetails = async () => {
  try {
    await connectDB();

    console.log('\n🔍 Checking existing properties...');
    
    // Get all properties
    const properties = await Property.find().populate('owner', 'first_name last_name email phone');
    console.log(`📊 Found ${properties.length} properties in database`);

    if (properties.length > 0) {
      console.log('\n📋 Existing properties:');
      properties.forEach((property, index) => {
        console.log(`${index + 1}. ${property.title} (ID: ${property._id})`);
        console.log(`   Price: ${property.price} ${property.currency}`);
        console.log(`   Status: ${property.status} | Publish: ${property.publish_status}`);
        console.log(`   Featured: ${property.is_featured ? 'Yes' : 'No'}`);
        console.log(`   URL: /property/${property._id}`);
        console.log('');
      });

      // Test the specific property ID from the error
      const problemId = '684698c27a749cbf92bf8119';
      console.log(`🔍 Checking for property ID: ${problemId}`);
      
      try {
        const specificProperty = await Property.findById(problemId);
        if (specificProperty) {
          console.log('✅ Property found:', specificProperty.title);
        } else {
          console.log('❌ Property not found with that ID');
        }
      } catch (error) {
        console.log('❌ Invalid property ID format or not found');
      }

    } else {
      console.log('\n📝 No properties found. Creating sample properties...');
      
      // Find or create a user
      let user = await User.findOne();
      if (!user) {
        user = await User.create({
          first_name: 'Admin',
          last_name: 'User',
          email: 'admin@nibret.com',
          phone: '0965789832',
          role: 'ADMIN'
        });
        console.log('✅ Created admin user');
      }

      // Create sample properties
      const sampleProperties = [
        {
          title: 'Modern Villa in Bole',
          description: 'Beautiful modern villa with stunning city views, located in the prestigious Bole area.',
          price: 12500000,
          currency: 'ETB',
          beds: 4,
          baths: 3,
          sqft: 3200,
          address: 'Bole, Addis Ababa, Ethiopia',
          lat: 8.9806,
          lng: 38.7578,
          propertyType: 'villa',
          status: 'for_sale',
          publish_status: 'published',
          listing_type: 'sale',
          images: [
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop'
          ],
          yearBuilt: 2020,
          lotSize: 0.5,
          features: ['Swimming Pool', 'Garden', 'Parking', 'Security System'],
          contact_info: {
            agent_name: 'Nibret Real Estate',
            phone: '+251911234567',
            email: 'info@nibret.com'
          },
          is_featured: true,
          owner: user._id
        },
        {
          title: 'Luxury Apartment in Kazanchis',
          description: 'Spacious luxury apartment with modern amenities in the heart of Kazanchis.',
          price: 8500000,
          currency: 'ETB',
          beds: 3,
          baths: 2,
          sqft: 2100,
          address: 'Kazanchis, Addis Ababa, Ethiopia',
          lat: 9.0227,
          lng: 38.7468,
          propertyType: 'apartment',
          status: 'for_sale',
          publish_status: 'published',
          listing_type: 'sale',
          images: [
            'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop'
          ],
          yearBuilt: 2019,
          features: ['Balcony', 'Elevator', 'Parking', 'Gym Access'],
          contact_info: {
            agent_name: 'Nibret Real Estate',
            phone: '+251911234567',
            email: 'info@nibret.com'
          },
          is_featured: false,
          owner: user._id
        },
        {
          title: 'Cozy House in Megenagna',
          description: 'Perfect family home with garden and quiet neighborhood in Megenagna.',
          price: 6200000,
          currency: 'ETB',
          beds: 3,
          baths: 2,
          sqft: 1800,
          address: 'Megenagna, Addis Ababa, Ethiopia',
          lat: 9.0157,
          lng: 38.7614,
          propertyType: 'house',
          status: 'for_sale',
          publish_status: 'published',
          listing_type: 'sale',
          images: [
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop'
          ],
          yearBuilt: 2018,
          lotSize: 0.3,
          features: ['Garden', 'Parking', 'Quiet Area'],
          contact_info: {
            agent_name: 'Nibret Real Estate',
            phone: '+251911234567',
            email: 'info@nibret.com'
          },
          is_featured: true,
          owner: user._id
        }
      ];

      for (const propertyData of sampleProperties) {
        const property = await Property.create(propertyData);
        console.log(`✅ Created property: ${property.title} (ID: ${property._id})`);
      }

      console.log('\n🎉 Sample properties created successfully!');
    }

    console.log('\n✅ Test completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
};

// Run the test
testPropertyDetails();
