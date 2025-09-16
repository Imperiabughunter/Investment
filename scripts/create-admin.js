// Script to create a default admin user
const { Pool } = require('@neondatabase/serverless');
const { hash } = require('argon2');
const { randomUUID } = require('crypto');

async function createAdminUser() {
  try {
    // Create a connection to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Check if admin user already exists
    const checkUserResult = await pool.query(
      'SELECT * FROM auth_users WHERE email = $1',
      ['admin@platform.com']
    );

    if (checkUserResult.rowCount > 0) {
      console.log('Admin user already exists');
      await pool.end();
      return;
    }

    // Create the admin user
    const userId = randomUUID();
    const hashedPassword = await hash('admin');

    // Insert user into auth_users table
    await pool.query(
      'INSERT INTO auth_users (id, name, email, "emailVerified", image) VALUES ($1, $2, $3, $4, $5)',
      [userId, 'Admin User', 'admin@platform.com', new Date(), null]
    );

    // Link account with credentials
    await pool.query(
      'INSERT INTO auth_accounts ("userId", type, provider, "providerAccountId", "extraData") VALUES ($1, $2, $3, $4, $5)',
      [userId, 'credentials', 'credentials', userId, { password: hashedPassword }]
    );

    console.log('Admin user created successfully');
    await pool.end();
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();