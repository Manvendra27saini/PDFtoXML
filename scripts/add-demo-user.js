import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

// Hash password function
async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function addDemoUser() {
  // Create a connection to the PostgreSQL database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Check if demo user already exists
    const checkQuery = 'SELECT * FROM users WHERE email = $1';
    const checkRes = await pool.query(checkQuery, ['demo@example.com']);
    
    if (checkRes.rows.length === 0) {
      // Hash the password
      const hashedPassword = await hashPassword('password123');
      
      // Insert the demo user
      const insertQuery = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *';
      const insertRes = await pool.query(insertQuery, ['demo', 'demo@example.com', hashedPassword]);
      
      console.log('Demo user created successfully!');
      console.log(insertRes.rows[0]);
    } else {
      console.log('Demo user already exists, skipping creation');
    }
  } catch (error) {
    console.error('Error adding demo user:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

console.log('Adding demo user to database...');
addDemoUser().then(() => {
  console.log('Done!');
});