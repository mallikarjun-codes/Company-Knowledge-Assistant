const jwt = require('jsonwebtoken');
const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    let { name, email, password, role } = req.body;
    
    if (!email || !password) {
      const error = new Error('Email and password are required');
      error.statusCode = 400; // Bad Request
      throw error;
    }

    if (!name || !name.trim()) {
      name = email.split('@')[0];
    }

    const newUser = await authService.registerUser(name.trim(), email.trim(), password, role || 'EMPLOYEE');

    const token = jwt.sign(
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new Error('Email and password are required');
      error.statusCode = 400;
      throw error;
    }

    const { user, token } = await authService.loginUser(email, password);
    res.status(200).json({
      message: 'Login successful',
      user,
      token
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    // req.user is populated by verifyToken middleware
    res.status(200).json({
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe
};
