const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const registerUser = async (name, email, password, role = 'EMPLOYEE') => {
  // Check if user exists
  const userCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (userCheck.rows.length > 0) {
    const error = new Error('User with this email already exists');
    error.statusCode = 409; // Conflict
    throw error;
  }

  // Hash password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Insert user
  const insertQuery = `
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, role, created_at;
  `;
  const result = await db.query(insertQuery, [name, email, passwordHash, role]);

  return result.rows[0];
};

const loginUser = async (email, password) => {
  // Fetch user by email
  const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  if (userResult.rows.length === 0) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401; // Unauthorized
    throw error;
  }

  const user = userResult.rows[0];

  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Generate JWT
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

  // Do not return password_hash in response
  delete user.password_hash;
  
  return { user, token };
};

module.exports = {
  registerUser,
  loginUser
};
