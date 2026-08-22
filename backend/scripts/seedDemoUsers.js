const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const config = require('../src/config');
const User = require('../src/models/User');

const DEMO_USERS = [
  {
    email: 'demo-admin@codesentinel.dev',
    password: 'demo1234',
    name: 'Alex Vance (SecOps Lead)',
    role: 'ADMIN',
    department: 'DevSecOps Governance & Compliance',
    isDemo: true
  },
  {
    email: 'demo-secops@codesentinel.dev',
    password: 'demo1234',
    name: 'Elena Rostova (Security Engineer)',
    role: 'SECURITY_ENGINEER',
    department: 'AppSec & Threat Modeling',
    isDemo: true
  },
  {
    email: 'demo-dev@codesentinel.dev',
    password: 'demo1234',
    name: 'Marcus Chen (Software Engineer)',
    role: 'DEVELOPER',
    department: 'Platform Core Engineering',
    isDemo: true
  }
];

const seedDemoUsers = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri);
    }
    console.log('[Seed Users] Connected to MongoDB. Seeding demo accounts...');

    for (const demoUser of DEMO_USERS) {
      const existing = await User.findOne({ email: demoUser.email });
      const hashedPassword = await bcrypt.hash(demoUser.password, 10);
      
      if (!existing) {
        await User.create({
          ...demoUser,
          password: hashedPassword
        });
        console.log(`[Seed Users] Created demo user: ${demoUser.email} (${demoUser.role})`);
      } else {
        existing.password = hashedPassword;
        existing.role = demoUser.role;
        existing.name = demoUser.name;
        existing.department = demoUser.department;
        existing.isDemo = true;
        await existing.save();
        console.log(`[Seed Users] Updated demo user: ${demoUser.email} (${demoUser.role})`);
      }
    }
    console.log('[Seed Users] Demo users successfully verified.');
  } catch (err) {
    console.warn(`[Seed Users] Warning during user seeding: ${err.message}`);
  }
};

if (require.main === module) {
  seedDemoUsers().then(() => {
    mongoose.disconnect();
    process.exit(0);
  });
}

module.exports = { seedDemoUsers, DEMO_USERS };
