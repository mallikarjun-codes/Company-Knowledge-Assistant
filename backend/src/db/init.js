const db = require('../config/db');

async function initializeDatabase() {
  const createUserTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'EMPLOYEE',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    console.log('Initializing database...');
    await db.query(createUserTableQuery);
    console.log('Database initialized successfully. Users table is ready.');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    // Note: Calling pool.end() directly if we run this as a standalone script
    // db.pool.end();
  }
}

// Allow running this script directly
if (require.main === module) {
  initializeDatabase().then(() => process.exit(0));
}

module.exports = {
  initializeDatabase
};
