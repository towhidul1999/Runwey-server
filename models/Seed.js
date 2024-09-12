const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./User'); // Update the path to your User model

// mongoose.connect('mongodb://localhost/your-database-name', { useNewUrlParser: true, useUnifiedTopology: true });

// Create a function to seed the admin user
async function seedAdminUser() {
  try {
    // Check if the admin user already exists
    const existingUser = await User.findOne({ email: 'admin@example.com' });

    if (existingUser) {
      console.log('Admin user already exists.');
      return;
    }

    // Create a new admin user
    const adminUser = new User({
      fullName: 'Admin User',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      email: 'admin@example.com',
      phoneNumber: '1234567890',
      password: 'adminpassword', // You can change this to a secure password
    });

    await adminUser.save();
    console.log('Admin user created successfully.');
  } catch (err) {
    console.error('Error seeding admin user:', err);
  } finally {
    mongoose.disconnect();
  }
}

seedAdminUser();