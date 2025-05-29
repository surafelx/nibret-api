const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');

// Super Admin Configuration
const SUPER_ADMIN_CONFIG = {
  first_name: 'Super',
  last_name: 'Admin',
  email: 'superadmin@nibret.com',
  phone: '+251900000000',
  password: 'NibretSuperAdmin2024!@#',
  role: 'SUPER_ADMIN',
  permissions: [
    'read_users',
    'write_users', 
    'delete_users',
    'read_properties',
    'write_properties',
    'delete_properties',
    'read_analytics',
    'system_admin'
  ],
  is_active: true
};

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ 
      $or: [
        { email: SUPER_ADMIN_CONFIG.email },
        { role: 'SUPER_ADMIN' }
      ]
    });

    if (existingSuperAdmin) {
      console.log('⚠️  Super Admin already exists:');
      console.log(`   Email: ${existingSuperAdmin.email}`);
      console.log(`   Role: ${existingSuperAdmin.role}`);
      console.log(`   Created: ${existingSuperAdmin.created_at}`);
      
      // Ask if user wants to update
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('Do you want to update the existing Super Admin? (y/N): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ Operation cancelled');
        process.exit(0);
      }

      // Update existing super admin
      existingSuperAdmin.first_name = SUPER_ADMIN_CONFIG.first_name;
      existingSuperAdmin.last_name = SUPER_ADMIN_CONFIG.last_name;
      existingSuperAdmin.phone = SUPER_ADMIN_CONFIG.phone;
      existingSuperAdmin.permissions = SUPER_ADMIN_CONFIG.permissions;
      existingSuperAdmin.is_active = true;
      
      // Update password
      const salt = await bcrypt.genSalt(12);
      existingSuperAdmin.password = await bcrypt.hash(SUPER_ADMIN_CONFIG.password, salt);
      
      await existingSuperAdmin.save();
      
      console.log('✅ Super Admin updated successfully!');
      console.log('📧 Email:', existingSuperAdmin.email);
      console.log('🔑 Password:', SUPER_ADMIN_CONFIG.password);
      console.log('⚠️  Please change the password after first login!');
      
    } else {
      // Create new super admin
      console.log('👤 Creating Super Admin...');
      
      const superAdmin = new User(SUPER_ADMIN_CONFIG);
      await superAdmin.save();
      
      console.log('✅ Super Admin created successfully!');
      console.log('📧 Email:', superAdmin.email);
      console.log('📱 Phone:', superAdmin.phone);
      console.log('🔑 Password:', SUPER_ADMIN_CONFIG.password);
      console.log('🛡️  Role:', superAdmin.role);
      console.log('⚠️  Please change the password after first login!');
    }

    // Create additional admin users if needed
    console.log('\n🔧 Checking for regular admin...');
    const existingAdmin = await User.findOne({ 
      email: 'admin@nibret.com',
      role: 'ADMIN'
    });

    if (!existingAdmin) {
      const adminUser = new User({
        first_name: 'Admin',
        last_name: 'User',
        email: 'admin@nibret.com',
        phone: '+251911111111',
        password: 'NibretAdmin2024!',
        role: 'ADMIN',
        permissions: [
          'read_users',
          'write_users',
          'read_properties',
          'write_properties',
          'read_analytics'
        ],
        is_active: true
      });

      await adminUser.save();
      console.log('✅ Regular Admin created successfully!');
      console.log('📧 Email: admin@nibret.com');
      console.log('🔑 Password: NibretAdmin2024!');
    } else {
      console.log('ℹ️  Regular Admin already exists');
    }

    // Display summary
    console.log('\n📊 Admin Users Summary:');
    const adminUsers = await User.find({ 
      role: { $in: ['ADMIN', 'SUPER_ADMIN'] } 
    }).select('first_name last_name email role created_at is_active');

    adminUsers.forEach(user => {
      console.log(`   ${user.role}: ${user.first_name} ${user.last_name} (${user.email}) - ${user.is_active ? 'Active' : 'Inactive'}`);
    });

    console.log('\n🔐 Security Recommendations:');
    console.log('   1. Change default passwords immediately after first login');
    console.log('   2. Enable two-factor authentication if available');
    console.log('   3. Regularly review admin user permissions');
    console.log('   4. Monitor admin activity logs');
    console.log('   5. Use strong, unique passwords');

    console.log('\n🚀 Next Steps:');
    console.log('   1. Start the server: npm run dev');
    console.log('   2. Login at: http://localhost:3000/admin');
    console.log('   3. Access analytics dashboard');
    console.log('   4. Review user activities and CRM data');

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
    
    if (error.code === 11000) {
      console.log('💡 This error usually means a user with this email already exists');
    }
    
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Handle script execution
if (require.main === module) {
  console.log('🛡️  Nibret Super Admin Creation Script');
  console.log('=====================================\n');
  
  createSuperAdmin().catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { createSuperAdmin, SUPER_ADMIN_CONFIG };
