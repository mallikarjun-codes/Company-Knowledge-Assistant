const db = require('../config/db');

async function initializeDocumentsTable() {
  const createDocumentsTableQuery = `
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      file_type VARCHAR(50) NOT NULL,
      file_size INTEGER NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(50) DEFAULT 'PENDING',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    console.log('Initializing documents table...');
    await db.query(createDocumentsTableQuery);
    console.log('Documents table created successfully.');
  } catch (error) {
    console.error('Error creating documents table:', error);
  }
}

// Allow running this script directly
if (require.main === module) {
  initializeDocumentsTable().then(() => process.exit(0));
}

module.exports = {
  initializeDocumentsTable
};
